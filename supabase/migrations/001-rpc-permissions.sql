-- ============================================================================
-- Migration 001 — RPC permissions & cleanup
-- Run once in Supabase SQL Editor on an existing database.
-- Idempotent: safe to run multiple times.
-- ============================================================================


-- ── Drop unused get_stats() RPC ──────────────────────────────────────────────
-- /api/stats uses direct count queries, not this RPC.

DROP FUNCTION IF EXISTS public.get_stats();


-- ── Lock RPCs to authenticated role only ─────────────────────────────────────
-- Postgres grants EXECUTE on new functions to PUBLIC by default, meaning
-- both anon and authenticated can call them. These RPCs are user-scoped
-- and must not be callable unauthenticated.

REVOKE EXECUTE ON FUNCTION public.claim_item(uuid, uuid, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_post_rate_limit(uuid)        FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_stats(uuid)               FROM anon, public;

GRANT EXECUTE ON FUNCTION public.claim_item(uuid, uuid, text, text)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_post_rate_limit(uuid)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats(uuid)                TO authenticated;
