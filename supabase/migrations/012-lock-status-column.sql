-- ============================================================================
-- Migration 012 — Lock the status column (P2-4)
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================
--
-- P2-3 established the invariant: status='claimed' means a claims row exists.
-- But items_update_own still permitted an owner to UPDATE any column of their
-- own row, so the invariant was enforced by the application rather than by the
-- database. Anyone with the anon key and a session could do this from a
-- browser console and desynchronise status from claims permanently:
--
--   await supabase.from('items').update({ status: 'claimed' }).eq('id', myItem)
--
-- RLS governs which ROWS you may touch. It has nothing to say about which
-- COLUMNS. That distinction is the entire hole: items_update_own was doing its
-- job correctly and was never the right tool for this.
--
-- After this migration every status transition must go through a
-- SECURITY DEFINER RPC:
--
--   open      -> claimed    claim_item()      (also writes the claims row)
--   open      -> resolved   resolve_item()    (poster closes their own listing)
--   claimed   -> open       unclaim_item()    (also deletes the claims row)
--   resolved  -> open       unclaim_item()
--
-- Those functions run as their owner and are unaffected by the grants below.
-- Admin writes go through /api/admin/* with the service role, which is also
-- unaffected.
--
-- No client code updates items today — /profile deletes, and resolve went
-- through resolve_item() as of P2-3 — so this closes the hole without changing
-- any current behaviour.
-- ============================================================================


-- ── 1. Drop the blanket UPDATE, re-grant per column ──────────────────────────
-- Same mechanism as migration 004 did for SELECT: a column-level REVOKE has no
-- effect while a table-level grant exists, so the table grant goes first.
--
-- The granted set is the content an owner authored. Deliberately excluded:
--   status      — the point of this migration
--   ref         — identity, assigned once in created_at order
--   user_id     — ownership; changing it would reassign someone's post
--   user_name   /  user_email  — denormalised identity
--   created_at  — history
--   type        — a lost item does not become a found item
--
-- These columns are granted rather than revoking UPDATE entirely so that a
-- future "edit your post" flow has somewhere to land without anyone needing to
-- reopen the status question.

REVOKE UPDATE ON public.items FROM anon, authenticated;

GRANT UPDATE (
  category,
  location,
  zone,
  where_left,
  date,
  description,
  photo_url,
  photo_path
) ON public.items TO authenticated;


-- ── 2. Self-test — proves the security property, server-side ─────────────────
-- has_column_privilege accounts for table-level and column-level grants
-- together, so this cannot be fooled by a lingering blanket grant.

DO $$
BEGIN
  IF pg_catalog.has_column_privilege('authenticated', 'public.items', 'status', 'UPDATE') THEN
    RAISE EXCEPTION 'FAIL: authenticated can still UPDATE items.status';
  END IF;

  IF pg_catalog.has_column_privilege('authenticated', 'public.items', 'ref', 'UPDATE') THEN
    RAISE EXCEPTION 'FAIL: authenticated can still UPDATE items.ref';
  END IF;

  IF pg_catalog.has_column_privilege('authenticated', 'public.items', 'user_id', 'UPDATE') THEN
    RAISE EXCEPTION 'FAIL: authenticated can still UPDATE items.user_id';
  END IF;

  IF pg_catalog.has_column_privilege('anon', 'public.items', 'status', 'UPDATE') THEN
    RAISE EXCEPTION 'FAIL: anon can UPDATE items.status';
  END IF;

  -- And confirm the grant that should exist actually landed, so a typo in the
  -- column list above shows up here rather than as a broken edit flow later.
  IF NOT pg_catalog.has_column_privilege('authenticated', 'public.items', 'description', 'UPDATE') THEN
    RAISE EXCEPTION 'FAIL: authenticated lost UPDATE on items.description';
  END IF;

  RAISE NOTICE 'status column is locked; content columns remain writable';
END $$;


-- ── 3. Ledger ────────────────────────────────────────────────────────────────

INSERT INTO public.schema_migrations (filename)
VALUES ('012-lock-status-column.sql')
ON CONFLICT (filename) DO NOTHING;


-- Verify from a signed-in browser console — the first must fail, the rest must
-- work. See the P2-4 commit message for the full snippet.
--
--   SELECT column_name FROM information_schema.column_privileges
--   WHERE table_name = 'items' AND grantee = 'authenticated'
--     AND privilege_type = 'UPDATE'
--   ORDER BY column_name;   -- expect 8 rows, no 'status'
