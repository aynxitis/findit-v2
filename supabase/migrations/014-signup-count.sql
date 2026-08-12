-- ============================================================================
-- Migration 014 — Public signup count for the landing page
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================
--
-- The landing page's third counter showed successful reunions. It is being
-- replaced with a count of registered students, which means an unauthenticated
-- page needs a number derived from auth.users — a table anon cannot read and
-- must never be able to read.
--
-- This file adds exactly one way to obtain that number: a function taking no
-- arguments and returning a single integer.
--
-- ── This is a public attack surface. Treat every line as reachable. ─────────
--
-- The grant is to `anon`, and the anon key ships inside the browser bundle, so
-- ANY visitor can call this function directly against the REST endpoint,
-- repeatedly, without signing in. It is therefore built to give up nothing
-- beyond the scalar:
--
--   * No arguments. Nothing to inject, nothing to filter by, no way to ask a
--     narrower question ("how many users match this email?") that would turn a
--     count into an oracle for probing individual accounts.
--   * Returns integer, not a row, not a set, not a table type. There is no
--     column for identity data to hide in.
--   * SECURITY DEFINER with `SET search_path = ''`, so every object is
--     schema-qualified and the body cannot be redirected by a caller-controlled
--     search_path.
--   * STABLE, not VOLATILE — it reads and never writes.
--
-- SECURITY DEFINER is not incidental here; it is the entire mechanism. anon has
-- no privilege on auth.users, so the function borrows its owner's. That is
-- precisely why the body must stay a single fixed aggregate: it is the one
-- place in this schema where an unauthenticated caller reaches auth.users at
-- all.
--
-- Rate limiting is deliberately NOT attempted here. The value is a public
-- figure printed on the homepage; scraping it repeatedly reveals nothing that
-- loading the page does not, and per-caller state would mean writes on an
-- unauthenticated path. Supabase's edge rate limits remain the backstop.
--
-- ── Pairing ─────────────────────────────────────────────────────────────────
--
-- Partner commit: "T3: replace the reunions counter with a signup count",
-- which fetches this RPC in the landing page RSC.
--
-- Unlike migration 013, the two halves are NOT symmetric:
--
--   Migration without the client — harmless. The function exists and nothing
--   calls it.
--   Client without the migration — the RPC does not exist and the call errors.
--
-- The client half is written to tolerate that: a failed call renders the same
-- em-dash placeholder the other counters already show before their fetch
-- resolves, so a wrong deploy order degrades the tile rather than breaking the
-- page. Apply this migration first regardless.
-- ============================================================================


-- ── 1. The function ──────────────────────────────────────────────────────────
-- Predicate, one clause at a time — each excludes rows that are not a student
-- who can sign in today:
--
--   deleted_at IS NULL
--     auth.users soft-deletes. A removed account keeps its row, and counting it
--     would mean the number can never go down.
--
--   email_confirmed_at IS NOT NULL
--     Unconfirmed rows are not usable accounts. See the note below — three
--     seeded rows in this database are permanently unconfirmed, so this clause
--     is load-bearing rather than theoretical.
--
--   email <> 'findit@estin.dz'
--     The project's own service account. It holds an @estin.dz address and is
--     confirmed and undeleted, so nothing else excludes it, but it is not a
--     student and the label says "students signed up".
--
-- Verified by hand against production on 2026-08-12: 91 rows total, all
-- @estin.dz (the OAuth domain gate is clean), 88 confirmed and undeleted, 87
-- once the service account is removed. Section 3 prints the live figure when
-- this file runs — it should say 87 today.
--
-- count(*) is bigint; the cast to integer is what makes the signature honest.
-- At 91 rows the range is not a concern, and integer is the narrower promise.

CREATE OR REPLACE FUNCTION public.get_signup_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT pg_catalog.count(*)::integer
  FROM auth.users
  WHERE deleted_at IS NULL
    AND email_confirmed_at IS NOT NULL
    AND email <> 'findit@estin.dz';   -- service account, not a student
$$;


-- ── 2. Permissions ───────────────────────────────────────────────────────────
-- The REVOKE is not tidying. CREATE FUNCTION grants EXECUTE to PUBLIC by
-- default, and PUBLIC includes every role — so without this line "granted to
-- anon" would in fact be "granted to everyone", and the grant below would be
-- decorative. Same pattern migration 001 used for the other RPCs.
--
-- authenticated is deliberately absent. Nothing signed-in needs this number;
-- the only consumer is the logged-out landing page. If a signed-in surface ever
-- wants it, add the grant then, on purpose.

REVOKE EXECUTE ON FUNCTION public.get_signup_count() FROM public, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.get_signup_count() TO anon;


-- ── 3. Self-test ─────────────────────────────────────────────────────────────
-- Four properties, each of which could plausibly be wrong after an edit.

DO $$
DECLARE
  v_fn      integer;
  v_direct  integer;
BEGIN
  -- (a) The body computes what the predicate above describes. A structural
  -- comparison rather than a hardcoded number, so this file stays runnable as
  -- the real count changes.
  SELECT public.get_signup_count() INTO v_fn;

  SELECT pg_catalog.count(*)::integer INTO v_direct
  FROM auth.users
  WHERE deleted_at IS NULL
    AND email_confirmed_at IS NOT NULL
    AND email <> 'findit@estin.dz';

  IF v_fn IS DISTINCT FROM v_direct THEN
    RAISE EXCEPTION 'FAIL: get_signup_count() returned %, predicate returns %',
      v_fn, v_direct;
  END IF;

  -- (b) A zero would mean the predicate excluded everything — a wired-up
  -- function returning a confidently wrong number is worse than one that fails.
  IF v_fn = 0 THEN
    RAISE EXCEPTION 'FAIL: get_signup_count() returned 0';
  END IF;

  -- (c) anon can call it. Without this the landing page renders a placeholder
  -- and nothing anywhere explains why.
  IF NOT pg_catalog.has_function_privilege('anon', 'public.get_signup_count()', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: anon cannot EXECUTE get_signup_count()';
  END IF;

  -- (d) The PUBLIC revoke landed. Testing `authenticated` is the practical
  -- probe: it holds no explicit grant, so if it tests true the only possible
  -- source is a surviving PUBLIC grant.
  IF pg_catalog.has_function_privilege('authenticated', 'public.get_signup_count()', 'EXECUTE') THEN
    RAISE EXCEPTION 'FAIL: EXECUTE still reaches authenticated — the PUBLIC revoke did not land';
  END IF;

  RAISE NOTICE 'get_signup_count() = % — granted to anon only', v_fn;
END $$;


-- ── 4. Ledger ────────────────────────────────────────────────────────────────

INSERT INTO public.schema_migrations (filename)
VALUES ('014-signup-count.sql')
ON CONFLICT (filename) DO NOTHING;


-- ============================================================================
-- KNOWN, NOT ADDRESSED HERE — three unusable seeded accounts
--
-- i_bouchareb, m_hamidouche and a_merzougui exist in auth.users as
-- provider = 'email' and are permanently unconfirmed. This migration's
-- email_confirmed_at predicate excludes them from the count, which is correct
-- for the count and does nothing about the underlying problem:
--
-- they occupy @estin.dz addresses belonging to real students, so a Google OAuth
-- signup from any of those three collides with the existing row and will likely
-- error rather than create an account.
--
-- Cleanup touches auth and is out of scope for the P3-lite sequence. Recorded
-- in audits/P3-LITE.md as a post-run item.
-- ============================================================================
