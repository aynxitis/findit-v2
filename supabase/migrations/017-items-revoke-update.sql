-- Students never update items directly: the only UPDATE in the app is
-- the admin route, which uses the service role. items_update_own let
-- owners change any column (status, created_at, user_email), so a
-- poster could redirect claimers to another student's email.
-- claim_item / resolve_item / unclaim_item run as the table owner and
-- are unaffected.

DROP POLICY IF EXISTS items_update_own ON public.items;
REVOKE UPDATE ON public.items FROM anon, authenticated;
