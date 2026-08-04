-- ============================================================================
-- Migration 006 — Migration ledger (P0-5)
-- RUN THIS LAST, after 001–005 have been applied. Idempotent.
-- ============================================================================
--
-- Nothing recorded which migrations had been applied, so the only way to tell
-- a fresh database from production was to read the function bodies. Two files
-- were also both numbered 002, which is what made that ambiguity possible.
--
-- From here on, every migration ends by inserting its own filename below.
-- This one bootstraps the table and backfills 001–006, which is why it has to
-- run after the others rather than before them.
-- ============================================================================


CREATE TABLE IF NOT EXISTS public.schema_migrations (
  filename   text        PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.schema_migrations IS
  'Applied migration filenames, in supabase/migrations/. Server-side only.';

-- Not client-readable. There is no policy, and RLS denies by default, but the
-- grants are revoked as well so this never depends on policy alone.
ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.schema_migrations FROM anon, authenticated;


-- ── Backfill ─────────────────────────────────────────────────────────────────
-- 001–003 were applied to production before the ledger existed; applied_at is
-- therefore the moment this migration ran, not the real date.

INSERT INTO public.schema_migrations (filename) VALUES
  ('001-rpc-permissions.sql'),
  ('002-performance-fixes.sql'),
  ('003-expiry-90-days.sql'),
  ('004-privacy-lockdown.sql'),
  ('005-claim-reversibility.sql'),
  ('006-schema-migrations.sql')
ON CONFLICT (filename) DO NOTHING;


-- Verify:
--   SELECT * FROM public.schema_migrations ORDER BY filename;
