-- Explicit Data API grants. Supabase stops auto-granting new public tables
-- on 2026-10-30; this makes a fresh replay reproduce prod exactly, and strips
-- default junk (TRUNCATE/TRIGGER/REFERENCES, all anon access).
-- Note: table-level REVOKE also removes column-level grants, so items'
-- column grants are re-issued below.
-- photo_url stays in the items INSERT grant until report-form stops sending it.

begin;

revoke all on public.claims, public.items, public.notifications,
              public.users, public.schema_migrations
  from anon, authenticated;

-- items: column-level reads (no user_email), column-level inserts
-- (no status/ref/user_name/id/created_at), delete gated by items_delete_own
grant select (id, ref, type, category, location, zone, where_left, date,
              description, photo_url, photo_path, status, user_id,
              user_name, created_at)
  on public.items to authenticated;
grant insert (category, date, description, location, photo_path, photo_url,
              type, user_id, where_left, zone)
  on public.items to authenticated;
grant delete on public.items to authenticated;

-- claims: writes only via claim_item (SECURITY DEFINER)
grant select on public.claims to authenticated;

-- notifications: created server-side; users read, mark, and dismiss their own
grant select, update, delete on public.notifications to authenticated;

-- users: all writes go through server admin routes (see 018)
grant select on public.users to authenticated;

-- service_role: explicit, since fresh replays won't auto-grant after Oct 30
grant select, insert, update, delete
  on public.claims, public.items, public.notifications,
     public.users, public.schema_migrations
  to service_role;

commit;
