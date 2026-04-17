-- ============================================================================
-- Migration 002 — Performance & security fixes
-- Run in Supabase SQL Editor.
-- ============================================================================
--
-- Fixes:
--   1. RLS InitPlan — wrap auth.uid()/auth.role() in (select ...) to prevent
--      per-row re-evaluation on all 10 affected policies.
--   2. Missing FK indexes — 3 foreign keys had no covering index.
--   3. Storage — drop 2 duplicate SELECT policies left over from dashboard
--      setup; keep only the one managed by storage-policies.sql.
-- ============================================================================


-- ── 1. RLS InitPlan fixes ────────────────────────────────────────────────────

ALTER POLICY users_select ON public.users
  USING ((select auth.role()) = 'authenticated');

ALTER POLICY users_update_own ON public.users
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

ALTER POLICY items_select ON public.items
  USING ((select auth.role()) = 'authenticated');

ALTER POLICY items_insert ON public.items
  WITH CHECK (
    (select auth.role()) = 'authenticated'
    AND (select auth.uid()) = user_id
  );

ALTER POLICY items_update_own ON public.items
  USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

ALTER POLICY items_delete_own ON public.items
  USING ((select auth.uid()) = user_id);

ALTER POLICY claims_select ON public.claims
  USING (
    (select auth.uid()) = claimed_by
    OR (select auth.uid()) = poster_uid
  );

ALTER POLICY notifications_select ON public.notifications
  USING ((select auth.uid()) = to_uid);

ALTER POLICY notifications_update ON public.notifications
  USING ((select auth.uid()) = to_uid)
  WITH CHECK ((select auth.uid()) = to_uid);

ALTER POLICY notifications_delete ON public.notifications
  USING ((select auth.uid()) = to_uid);


-- ── 2. Missing FK indexes ─────────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_claims_poster_uid
  ON public.claims (poster_uid);

CREATE INDEX IF NOT EXISTS idx_notifications_claimer_uid
  ON public.notifications (claimer_uid);

CREATE INDEX IF NOT EXISTS idx_notifications_item_id
  ON public.notifications (item_id);


-- ── 3. Storage: drop duplicate SELECT policies ────────────────────────────────
-- These were auto-created in the Supabase dashboard during bucket setup.
-- "item-photos: authenticated read" (the correct one) is managed by
-- storage-policies.sql and stays.

DROP POLICY IF EXISTS "Public can read item photos"        ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_read 13j4whn_0" ON storage.objects;
