-- users_update_own let any user overwrite their own banned/email/name/photo.
-- No client code writes to users; all writes go through server admin routes.
revoke insert, update, delete, truncate, trigger, references
  on public.users from anon, authenticated;

drop policy if exists users_update_own on public.users;
