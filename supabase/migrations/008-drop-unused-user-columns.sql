-- ============================================================================
-- Migration 008 — Drop unused user columns (P1-4)
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================
--
-- `users.bio` and `users.verified` are written but never read. `bio` was never
-- surfaced anywhere. `verified` is set to true for every row by the signup
-- trigger and no code branches on it — the real domain check is the `@estin.dz`
-- gate in auth/callback plus the trigger's own LIKE filter, neither of which
-- consults this column.
--
-- ORDER MATTERS INSIDE THIS FILE.
--
-- handle_new_user() names `verified` in its INSERT column list. Dropping the
-- column first makes the trigger raise on every new auth.users row, which means
-- **every new student sign-up fails**. Nothing in the app would surface that
-- until a real student tried to sign in — during rentrée, which is the worst
-- possible time to discover it. So the trigger is replaced first, then the
-- columns go.
--
-- Independent of migration 007: claim_item and unclaim_item reference
-- public.users zero times. 007 and 008 may be applied in either order.
-- ============================================================================


-- ── 1. Replace the trigger FIRST, so it stops writing `verified` ─────────────
-- Body is otherwise identical to the original.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only create a profile for @estin.dz emails (safety net behind the
  -- OAuth hd hint and the server-side callback check).
  IF NEW.email IS NOT NULL AND NEW.email LIKE '%@estin.dz' THEN
    INSERT INTO public.users (id, name, email, photo, joined_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'Anonymous'),
      NEW.email,
      NEW.raw_user_meta_data ->> 'avatar_url',
      now()
    )
    ON CONFLICT (id) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;


-- ── 2. Only now drop the columns ─────────────────────────────────────────────

ALTER TABLE public.users DROP COLUMN IF EXISTS bio;
ALTER TABLE public.users DROP COLUMN IF EXISTS verified;


-- ── 3. Ledger ────────────────────────────────────────────────────────────────

INSERT INTO public.schema_migrations (filename)
VALUES ('008-drop-unused-user-columns.sql')
ON CONFLICT (filename) DO NOTHING;


-- Verify — expect id, name, email, photo, banned, joined_at and nothing else:
--
--   SELECT column_name FROM information_schema.columns
--   WHERE table_schema = 'public' AND table_name = 'users'
--   ORDER BY ordinal_position;
--
-- Then confirm sign-up still works end to end with a real @estin.dz account.
-- A broken trigger is silent until someone signs in.
