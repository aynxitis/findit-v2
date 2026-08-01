-- ============================================================================
-- Migration 007 — Structured notifications (P1-1)
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================
--
-- claim_item and unclaim_item each carried their own duplicate CASE blocks
-- mapping category slugs to labels and emoji, then concatenated user-facing
-- English inside Postgres. That was the 7th and 8th copies of the taxonomy, and
-- it meant renaming a category label required a database migration.
--
-- Both RPCs now write a stable key into notifications.message. The client
-- composes the sentence from the row's category and item_type
-- (src/lib/notifications.ts). Keys:
--
--   claim.found     someone wants to claim a found item you posted
--   claim.lost      someone found the lost item you posted
--   claim.reopened  the poster reversed a claim on your claim
--
-- notifications.message is NOT NULL, so a key is stored rather than nothing.
-- Existing rows keep their prose and the client renders unrecognised values
-- verbatim, so no backfill is needed and old notifications keep working.
--
-- Everything else in both functions is unchanged from migration 005.
-- ============================================================================


-- ── 1. claim_item ────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.claim_item(
  p_item_id       uuid,
  p_claimer_id    uuid,
  p_claimer_email text,
  p_claimer_name  text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item          record;
  v_notif_key     text;
  v_recent_claims integer;
  v_max_hourly    constant integer := 5;
BEGIN
  -- 0. Rate limit: max 5 claims per hour per user
  SELECT count(*) INTO v_recent_claims
  FROM public.claims
  WHERE claimed_by = p_claimer_id
    AND created_at > now() - interval '1 hour';

  IF v_recent_claims >= v_max_hourly THEN
    RETURN jsonb_build_object('success', false, 'error', 'RATE_LIMITED');
  END IF;

  -- 1. Lock the item row
  SELECT * INTO v_item
  FROM public.items
  WHERE id = p_item_id
  FOR UPDATE;

  -- 2. Check item exists
  IF v_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ITEM_NOT_FOUND');
  END IF;

  -- 3. Check item is open
  IF v_item.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED');
  END IF;

  -- 4. Check item not expired (90 days)
  IF v_item.created_at < now() - interval '90 days' THEN
    RETURN jsonb_build_object('success', false, 'error', 'LISTING_EXPIRED');
  END IF;

  -- 5. Check claimer is not poster
  IF v_item.user_id = p_claimer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'SELF_CLAIM');
  END IF;

  -- 6. Create claim record
  INSERT INTO public.claims (item_id, item_type, item_category, claimed_by, claimed_email, claimed_name, poster_uid, poster_email)
  VALUES (p_item_id, v_item.type, v_item.category, p_claimer_id, p_claimer_email, p_claimer_name, v_item.user_id, v_item.user_email);

  -- 7. Notify the poster with a key, not prose
  IF v_item.user_id IS NOT NULL AND v_item.user_id != p_claimer_id THEN
    v_notif_key := CASE WHEN v_item.type = 'found' THEN 'claim.found' ELSE 'claim.lost' END;

    INSERT INTO public.notifications (to_uid, item_id, item_type, category, message, claimer_name, claimer_uid, claimer_email, read)
    VALUES (v_item.user_id, p_item_id, v_item.type, v_item.category, v_notif_key, p_claimer_name, p_claimer_id, p_claimer_email, false);
  END IF;

  -- 8. Update item status
  UPDATE public.items SET status = 'claimed' WHERE id = p_item_id;

  -- 9. Return success with poster contact info
  RETURN jsonb_build_object(
    'success', true,
    'poster_email', v_item.user_email,
    'poster_name', v_item.user_name
  );
END;
$$;


-- ── 2. unclaim_item ──────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION public.unclaim_item(p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item   record;
  v_claim  record;
  v_caller uuid := (select auth.uid());
BEGIN
  SELECT * INTO v_item
  FROM public.items
  WHERE id = p_item_id
  FOR UPDATE;

  IF v_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ITEM_NOT_FOUND');
  END IF;

  IF v_caller IS NULL OR v_item.user_id != v_caller THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_OWNER');
  END IF;

  IF v_item.status != 'claimed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_CLAIMED');
  END IF;

  -- Tolerates a missing claim row: /profile "Mark resolved" sets status
  -- directly without creating one.
  SELECT * INTO v_claim
  FROM public.claims
  WHERE item_id = p_item_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_claim IS NOT NULL THEN
    DELETE FROM public.claims WHERE id = v_claim.id;

    INSERT INTO public.notifications (to_uid, item_id, item_type, category, message, read)
    VALUES (v_claim.claimed_by, p_item_id, v_item.type, v_item.category, 'claim.reopened', false);
  END IF;

  UPDATE public.items SET status = 'open' WHERE id = p_item_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ── 3. Permissions ───────────────────────────────────────────────────────────
-- CREATE OR REPLACE resets grants.

REVOKE EXECUTE ON FUNCTION public.claim_item(uuid, uuid, text, text) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.claim_item(uuid, uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.unclaim_item(uuid) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.unclaim_item(uuid) TO authenticated;


-- ── 4. Ledger ────────────────────────────────────────────────────────────────

INSERT INTO public.schema_migrations (filename)
VALUES ('007-notification-keys.sql')
ON CONFLICT (filename) DO NOTHING;


-- Verify no user-facing English remains in these functions:
--   SELECT prosrc FROM pg_proc WHERE proname IN ('claim_item','unclaim_item');
