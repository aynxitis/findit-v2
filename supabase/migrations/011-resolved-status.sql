-- ============================================================================
-- Migration 011 — Distinct `resolved` status (P2-3)
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================
--
-- /profile's "Mark resolved" set status='claimed' with a direct UPDATE and
-- never inserted into `claims`. That is why the board shows 9 claimed items
-- against 4 claim rows. P3 renders Claimed cards from `status`, so the app's
-- only social proof came from a field two flows wrote inconsistently.
--
-- DECISION: a distinct `resolved` status, not a self-resolved claim row.
--
-- The rejected alternative was to have "Mark resolved" insert a claims row with
-- claimed_by = the poster. That was rejected because:
--
--   * It records something that did not happen. `claims` is the audit trail of
--     "another student claimed this item". A self-row asserts a reunion that
--     never occurred, and get_user_stats() counts claims — every poster who
--     tidied up their own listing would gain a phantom "claimed" statistic.
--   * It contradicts an invariant claim_item already enforces. That RPC returns
--     SELF_CLAIM specifically to prevent claimed_by = user_id. Writing exactly
--     that row through another door makes the guard meaningless.
--   * "Someone claimed my item" and "I closed this myself" are different facts.
--     Collapsing them loses the distinction permanently, and P3 may well want to
--     show a genuine reunion differently from a self-closed post.
--
-- After this, status='claimed' means exactly "a claims row exists".
--
-- No backfill. The existing 5-item gap is real history and stays as it is.
-- ============================================================================


-- ── 1. Enum value ────────────────────────────────────────────────────────────
-- Postgres 12+ permits ALTER TYPE ... ADD VALUE inside a transaction block, but
-- the new value may not be *used* in that same transaction. Nothing below
-- queries it — the literal appears only inside function bodies, which are not
-- evaluated until the function is called.

ALTER TYPE public.item_status ADD VALUE IF NOT EXISTS 'resolved';


-- ── 2. resolve_item — the poster closes their own listing ────────────────────
-- Returns: { success, error? }
-- Errors: ITEM_NOT_FOUND | NOT_OWNER | NOT_OPEN

CREATE OR REPLACE FUNCTION public.resolve_item(p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item   record;
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

  IF v_item.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_OPEN');
  END IF;

  -- No claims row and no notification: nobody else was involved.
  UPDATE public.items SET status = 'resolved' WHERE id = p_item_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ── 3. unclaim_item now reopens both states ──────────────────────────────────
-- Otherwise a self-resolved item has no way back to the board. Unchanged
-- otherwise: still owner-only, still tolerant of a missing claim row.

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

  IF v_item.status = 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_CLAIMED');
  END IF;

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


-- ── 4. Permissions ───────────────────────────────────────────────────────────

REVOKE EXECUTE ON FUNCTION public.resolve_item(uuid)  FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.resolve_item(uuid)  TO authenticated;

REVOKE EXECUTE ON FUNCTION public.unclaim_item(uuid)  FROM anon, public;
GRANT  EXECUTE ON FUNCTION public.unclaim_item(uuid)  TO authenticated;


-- ── 5. Ledger ────────────────────────────────────────────────────────────────

INSERT INTO public.schema_migrations (filename)
VALUES ('011-resolved-status.sql')
ON CONFLICT (filename) DO NOTHING;


-- Verify — from this point on, every claimed item must have a claim row.
-- Historical rows are exempt; do not backfill them.
--
--   SELECT i.ref, i.status, count(c.id) AS claims
--   FROM public.items i
--   LEFT JOIN public.claims c ON c.item_id = i.id
--   WHERE i.status = 'claimed'
--   GROUP BY i.ref, i.status
--   ORDER BY i.ref;
--
-- KNOWN RESIDUAL HOLE: the items_update_own RLS policy still lets an owner set
-- status directly from the browser, so the invariant is enforced by the app
-- rather than by the database. Closing that means a column-level UPDATE grant
-- excluding `status`. Out of scope for P2; worth doing before launch.
