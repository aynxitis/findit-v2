-- ============================================================================
-- Migration 004 — Privacy lockdown (P0-2)
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================
--
-- Before this migration:
--   * users_select was `(select auth.role()) = 'authenticated'`, so any signed-in
--     student could `select * from users` and retrieve every ESTIN user's name
--     and email.
--   * items carried a denormalised user_email readable on every row by every
--     signed-in student.
--
-- After this migration:
--   * A user can read only their own public.users row.
--   * items.user_email is unreadable by anon and authenticated. It stays in the
--     table because claim_item (SECURITY DEFINER) returns it to the claimer
--     after a successful claim, and the admin API reads it with the service
--     role. Neither path goes through these grants.
--
-- IMPORTANT: after applying, every client `select('*')` on public.items fails
-- with "permission denied". The application code must select explicit columns.
-- That change ships in the same commit as this file.
-- ============================================================================


-- ── 1. users: own row only ───────────────────────────────────────────────────

ALTER POLICY users_select ON public.users
  USING ((select auth.uid()) = id);


-- ── 2. items: column-level lockdown of user_email ────────────────────────────
-- A column-level REVOKE has no effect while a table-level SELECT grant exists,
-- so the table grant is dropped first and the readable columns re-granted
-- individually. anon gets nothing, and is not expected to: FINDit is a closed
-- @estin.dz platform and every read stays behind the auth gate.

REVOKE SELECT ON public.items FROM anon, authenticated;

GRANT SELECT (
  id,
  type,
  category,
  location,
  zone,
  where_left,
  date,
  description,
  photo_url,
  status,
  user_id,
  user_name,
  created_at
) ON public.items TO authenticated;


-- ── 3. Verification ──────────────────────────────────────────────────────────
-- Expect exactly 13 rows, and no row named 'user_email':
--
--   SELECT column_name
--   FROM information_schema.column_privileges
--   WHERE table_name = 'items' AND grantee = 'authenticated' AND privilege_type = 'SELECT'
--   ORDER BY column_name;
--
-- Expect 0 rows (RLS now restricts to own row, and there is no second user):
--
--   -- as a signed-in non-admin, from the browser console:
--   -- await supabase.from('users').select('*')  ->  only your own row
--
-- Realtime: postgres_changes payloads for public.items are filtered by the
-- subscriber's column privileges, so user_email stops appearing there too.
-- Confirm live updates still arrive on /browse after applying.
