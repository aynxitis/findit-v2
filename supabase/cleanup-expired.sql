-- ============================================================================
-- FINDit — Expired-items cleanup
-- Run manually (or via pg_cron) to keep the items table lean.
-- ============================================================================
--
-- Items older than 90 days are deleted regardless of status:
--   * Open items older than 90 days are long past the 30-day claim window.
--   * Claimed items older than 90 days serve no user-facing purpose.
--
-- Foreign keys handle cascading:
--   * claims.item_id  → ON DELETE CASCADE (claim row removed)
--   * notifications.item_id → ON DELETE SET NULL (notification kept, item_id nulled)
--
-- NOTE: This does NOT delete orphaned photos from the item-photos storage
-- bucket. Do that separately (see cleanup-orphan-photos if added later).
--
-- Manual run (ad-hoc, monthly is fine for ~1000 students):
--
--   -- Preview first:
--   SELECT count(*) FROM public.items WHERE created_at < now() - interval '90 days';
--   -- Then delete:
--   DELETE FROM public.items WHERE created_at < now() - interval '90 days';
--
-- Or wrap it in a function and schedule with pg_cron (Supabase Pro only):
-- ============================================================================


CREATE OR REPLACE FUNCTION public.cleanup_expired_items(p_days integer DEFAULT 90)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_deleted integer;
BEGIN
  DELETE FROM public.items
  WHERE created_at < now() - (p_days || ' days')::interval;

  GET DIAGNOSTICS v_deleted = ROW_COUNT;
  RETURN v_deleted;
END;
$$;

-- Admin-only — do not expose to clients.
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_items(integer) FROM anon, public, authenticated;


-- If/when you move to Supabase Pro, schedule monthly cleanup with pg_cron:
--
--   SELECT cron.schedule(
--     'findit-cleanup-expired',
--     '0 3 1 * *',  -- 03:00 UTC on the 1st of every month
--     $$SELECT public.cleanup_expired_items(90)$$
--   );
