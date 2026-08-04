-- ============================================================================
-- Migration 005 — Reversible, rate-limited claims (P0-4)
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================
--
-- claim_item set status='claimed' unconditionally on a stranger's single click
-- with no path back to 'open', so any student could permanently retire any
-- listing, as many times an hour as they liked.
--
-- This migration:
--   1. Adds unclaim_item(uuid) — the poster, and only the poster, can put a
--      claimed item back on the board.
--   2. Caps claims at 5 per hour per user, enforced inside claim_item.
--
-- A proper pending/accept/reject flow is the correct design and is out of
-- scope this cycle. See "Known debt" in the README.
-- ============================================================================


-- ── 1. claim_item: add the hourly claim rate limit ───────────────────────────
-- Unchanged from migration 003 apart from step 0.

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
  v_item           record;
  v_category_icon  text;
  v_category_label text;
  v_notif_message  text;
  v_recent_claims  integer;
  v_max_hourly     constant integer := 5;
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

  -- 7. Create notification for poster
  IF v_item.user_id IS NOT NULL AND v_item.user_id != p_claimer_id THEN
    v_category_icon := CASE v_item.category
      WHEN 'keys' THEN '🔑' WHEN 'card' THEN '🪪' WHEN 'phone' THEN '📱'
      WHEN 'bag' THEN '🎒' WHEN 'clothing' THEN '👕' WHEN 'electronics' THEN '💻'
      ELSE '📦'
    END;
    v_category_label := CASE v_item.category
      WHEN 'keys' THEN 'Keys' WHEN 'card' THEN 'Card / ID' WHEN 'phone' THEN 'Phone'
      WHEN 'bag' THEN 'Bag' WHEN 'clothing' THEN 'Clothing' WHEN 'electronics' THEN 'Electronics'
      ELSE 'Other'
    END;

    IF v_item.type = 'found' THEN
      v_notif_message := v_category_icon || ' Someone thinks your ' || v_category_label || ' is theirs and wants to claim it.';
    ELSE
      v_notif_message := v_category_icon || ' Someone found your ' || v_category_label || ' and reached out!';
    END IF;

    INSERT INTO public.notifications (to_uid, item_id, item_type, category, message, claimer_name, claimer_uid, claimer_email, read)
    VALUES (v_item.user_id, p_item_id, v_item.type, v_item.category, v_notif_message, p_claimer_name, p_claimer_id, p_claimer_email, false);
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


-- ── 2. unclaim_item: the poster puts the item back on the board ──────────────
-- Returns: { success, error? }
-- Errors: ITEM_NOT_FOUND | NOT_OWNER | NOT_CLAIMED

CREATE OR REPLACE FUNCTION public.unclaim_item(p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item           record;
  v_claim          record;
  v_caller         uuid := (select auth.uid());
  v_category_icon  text;
  v_category_label text;
BEGIN
  -- 1. Lock the item row
  SELECT * INTO v_item
  FROM public.items
  WHERE id = p_item_id
  FOR UPDATE;

  IF v_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ITEM_NOT_FOUND');
  END IF;

  -- 2. Only the poster may reverse a claim
  IF v_caller IS NULL OR v_item.user_id != v_caller THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_OWNER');
  END IF;

  IF v_item.status != 'claimed' THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_CLAIMED');
  END IF;

  -- 3. Remove the most recent claim on this item
  SELECT * INTO v_claim
  FROM public.claims
  WHERE item_id = p_item_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_claim IS NOT NULL THEN
    DELETE FROM public.claims WHERE id = v_claim.id;

    -- 4. Tell the claimer their claim was reversed
    v_category_icon := CASE v_item.category
      WHEN 'keys' THEN '🔑' WHEN 'card' THEN '🪪' WHEN 'phone' THEN '📱'
      WHEN 'bag' THEN '🎒' WHEN 'clothing' THEN '👕' WHEN 'electronics' THEN '💻'
      ELSE '📦'
    END;
    v_category_label := CASE v_item.category
      WHEN 'keys' THEN 'Keys' WHEN 'card' THEN 'Card / ID' WHEN 'phone' THEN 'Phone'
      WHEN 'bag' THEN 'Bag' WHEN 'clothing' THEN 'Clothing' WHEN 'electronics' THEN 'Electronics'
      ELSE 'Other'
    END;

    INSERT INTO public.notifications (to_uid, item_id, item_type, category, message, read)
    VALUES (
      v_claim.claimed_by,
      p_item_id,
      v_item.type,
      v_item.category,
      v_category_icon || ' The poster reopened the ' || v_category_label || ' listing — your claim was cancelled.',
      false
    );
  END IF;

  -- 5. Back on the board
  UPDATE public.items SET status = 'open' WHERE id = p_item_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ── 3. Permissions ───────────────────────────────────────────────────────────
-- CREATE OR REPLACE resets grants, so re-apply them for claim_item too.

REVOKE EXECUTE ON FUNCTION public.claim_item(uuid, uuid, text, text) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.claim_item(uuid, uuid, text, text) TO authenticated;

REVOKE EXECUTE ON FUNCTION public.unclaim_item(uuid) FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.unclaim_item(uuid) TO authenticated;
