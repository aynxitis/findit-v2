-- ============================================================================
-- FINDit -- Supabase Schema
-- Run this in dependency order in the Supabase SQL Editor.
-- ============================================================================
--
-- This file is the truth for a FRESH install. It already folds in every
-- migration through 013, so a fresh database must NOT then replay
-- supabase/migrations/ — section 10 records them as applied instead.
--
-- Existing databases go the other way: leave this file alone and apply the
-- numbered files in supabase/migrations/ in order.
--
-- Folded in: 001-rpc-permissions, 002-performance-fixes, 003-expiry-90-days,
--            004-privacy-lockdown, 005-claim-reversibility,
--            006-schema-migrations, 007-notification-keys,
--            008-drop-unused-user-columns, 009-item-ref, 010-photo-path,
--            011-resolved-status, 012-lock-status-column,
--            013-lock-insert-columns.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────────
-- 1. ENUM TYPES
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TYPE public.item_type       AS ENUM ('found', 'lost');
CREATE TYPE public.item_status     AS ENUM ('open', 'claimed', 'resolved');
CREATE TYPE public.item_category   AS ENUM ('keys', 'card', 'phone', 'bag', 'clothing', 'electronics', 'other');
CREATE TYPE public.item_zone       AS ENUM ('school', 'residence', 'unknown');
CREATE TYPE public.item_where_left AS ENUM ('with_me', 'admin', 'left_there');


-- ──────────────────────────────────────────────────────────────────────────────
-- 2. TABLES
-- ──────────────────────────────────────────────────────────────────────────────

-- Users (extends auth.users)
CREATE TABLE public.users (
  id         uuid        PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  name       text        NOT NULL DEFAULT 'Anonymous',
  email      text        NOT NULL,
  photo      text,
  banned     boolean     NOT NULL DEFAULT false,
  joined_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS 'User profiles, auto-created by trigger on auth.users insert';


-- Items
CREATE TABLE public.items (
  id          uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  -- GENERATED ALWAYS (013): BY DEFAULT let a client supply its own ref. An
  -- unused value was accepted without advancing the sequence, so nextval then
  -- walked toward the squatted number until a legitimate insert collided.
  -- UNIQUE here rather than a separate CREATE UNIQUE INDEX: the constraint is
  -- auto-named items_ref_key, which is the name 013 adopted the old
  -- idx_items_ref index under.
  ref         bigint              NOT NULL GENERATED ALWAYS AS IDENTITY UNIQUE,
  type        public.item_type    NOT NULL,
  category    public.item_category NOT NULL,
  location    text                NOT NULL CHECK (char_length(location) <= 100),
  zone        public.item_zone,
  where_left  public.item_where_left,
  date        date                NOT NULL,
  description text                CHECK (char_length(description) <= 400),
  photo_url   text                CHECK (char_length(photo_url) <= 500),
  photo_path  text                CHECK (char_length(photo_path) <= 500),
  status      public.item_status  NOT NULL DEFAULT 'open',
  user_id     uuid                NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  user_name   text,
  user_email  text,
  created_at  timestamptz         NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.items IS 'Lost and found item listings';


-- Claims
CREATE TABLE public.claims (
  id             uuid                 PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id        uuid                 NOT NULL REFERENCES public.items(id) ON DELETE CASCADE,
  item_type      public.item_type     NOT NULL,
  item_category  public.item_category NOT NULL,
  claimed_by     uuid                 NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  claimed_email  text,
  claimed_name   text                 NOT NULL,
  poster_uid     uuid                 REFERENCES public.users(id) ON DELETE SET NULL,
  poster_email   text,
  created_at     timestamptz          NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.claims IS 'Records of item claims';


-- Notifications
CREATE TABLE public.notifications (
  id             uuid                 PRIMARY KEY DEFAULT gen_random_uuid(),
  to_uid         uuid                 NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  item_id        uuid                 REFERENCES public.items(id) ON DELETE SET NULL,
  item_type      public.item_type,
  category       public.item_category,
  message        text                 NOT NULL CHECK (char_length(message) <= 300),
  claimer_name   text,
  claimer_uid    uuid                 REFERENCES public.users(id) ON DELETE SET NULL,
  claimer_email  text,
  read           boolean              NOT NULL DEFAULT false,
  created_at     timestamptz          NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.notifications IS 'User notifications (e.g., claim alerts)';


-- ──────────────────────────────────────────────────────────────────────────────
-- 3. INDEXES
-- ──────────────────────────────────────────────────────────────────────────────

-- ref's unique index is created by the UNIQUE constraint on the column, as
-- items_ref_key. Do not add a second one here.
CREATE INDEX idx_items_type_created          ON public.items (type, created_at DESC);
CREATE INDEX idx_items_user_id               ON public.items (user_id, created_at DESC);
CREATE INDEX idx_items_status                ON public.items (status);
CREATE INDEX idx_items_category              ON public.items (category);
CREATE INDEX idx_notifications_to_uid        ON public.notifications (to_uid, created_at DESC);
CREATE INDEX idx_notifications_unread        ON public.notifications (to_uid) WHERE read = false;
CREATE INDEX idx_notifications_item_id       ON public.notifications (item_id);
CREATE INDEX idx_notifications_claimer_uid   ON public.notifications (claimer_uid);
CREATE INDEX idx_claims_item_id              ON public.claims (item_id);
CREATE INDEX idx_claims_claimed_by           ON public.claims (claimed_by);
CREATE INDEX idx_claims_poster_uid           ON public.claims (poster_uid);


-- ──────────────────────────────────────────────────────────────────────────────
-- 4. ENABLE ROW LEVEL SECURITY
-- ──────────────────────────────────────────────────────────────────────────────

ALTER TABLE public.users         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items         ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.claims        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;


-- ──────────────────────────────────────────────────────────────────────────────
-- 5. RLS POLICIES
-- ──────────────────────────────────────────────────────────────────────────────

-- ── Users ────────────────────────────────────────────────────────────────────

-- A user can read only their own profile. Other students' names and emails are
-- never client-readable; the admin UI reads them server-side with the service
-- role via /api/admin/data.
CREATE POLICY users_select ON public.users
  FOR SELECT USING ((select auth.uid()) = id);

-- Users can update their own profile (name, photo)
CREATE POLICY users_update_own ON public.users
  FOR UPDATE USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);

-- No direct inserts (managed by trigger)
-- No deletes allowed


-- ── Items ────────────────────────────────────────────────────────────────────

-- Any authenticated user can read all items
CREATE POLICY items_select ON public.items
  FOR SELECT USING ((select auth.role()) = 'authenticated');

-- Authenticated user can insert items they own
CREATE POLICY items_insert ON public.items
  FOR INSERT WITH CHECK (
    (select auth.role()) = 'authenticated'
    AND (select auth.uid()) = user_id
  );

-- Owner can update their own items (description, photo_url, status)
CREATE POLICY items_update_own ON public.items
  FOR UPDATE USING ((select auth.uid()) = user_id)
  WITH CHECK ((select auth.uid()) = user_id);

-- Owner can delete their own items
CREATE POLICY items_delete_own ON public.items
  FOR DELETE USING ((select auth.uid()) = user_id);


-- Column-level lockdown: items.user_email must never reach a browser client.
-- The table-level SELECT grant is dropped so the per-column grant takes effect.
-- Clients must therefore select explicit columns (see ITEM_SELECT_COLUMNS in
-- src/lib/constants/config.ts) — `select('*')` is a permission error.
-- user_email still reaches the claimer through claim_item() (SECURITY DEFINER)
-- and the admin UI through the service role; neither uses these grants.

REVOKE SELECT ON public.items FROM anon, authenticated;

GRANT SELECT (
  id, ref, type, category, location, zone, where_left, date, description,
  photo_url, photo_path, status, user_id, user_name, created_at
) ON public.items TO authenticated;

-- Column-level UPDATE (P2-4). RLS decides which ROWS you may touch and says
-- nothing about which COLUMNS, so items_update_own alone let an owner set
-- status directly from the browser and desynchronise it from the claims table.
-- Every status transition must go through claim_item / resolve_item /
-- unclaim_item, which are SECURITY DEFINER and unaffected by these grants.
-- status, ref, user_id, user_name, user_email, created_at and type are all
-- deliberately absent.

REVOKE UPDATE ON public.items FROM anon, authenticated;

GRANT UPDATE (
  category, location, zone, where_left, date, description, photo_url, photo_path
) ON public.items TO authenticated;

-- Column-level INSERT (013). RLS pins user_id via items_insert's WITH CHECK and
-- says nothing about the rest of the row, so a browser could set the identity
-- columns, the status the board renders from, the timestamp the 90-day expiry
-- reads, and the human-readable ref. items_stamp_insert (section 6) stamps the
-- trustworthy values; these grants make a client that tries anyway get 42501
-- rather than being silently overwritten.
--   ref         — GENERATED ALWAYS, not insertable at all
--   user_email / user_name — stamped from the JWT
--   status      — every transition goes through an RPC (012)
--   created_at  — history; the 90-day expiry reads it
--   id          — has a default and no client sends it
-- anon is revoked and not re-granted: it held a table-level INSERT, leaving
-- items_insert's WITH CHECK as the only thing between the browser-bundled anon
-- key and write access. service_role holds its own table-level grant, so
-- /api/admin/* is unaffected.

REVOKE INSERT ON public.items FROM anon, authenticated;

GRANT INSERT (
  type, category, location, zone, where_left, date, description,
  photo_url, photo_path, user_id
) ON public.items TO authenticated;


-- ── Claims ───────────────────────────────────────────────────────────────────

-- Claimer or poster can read
CREATE POLICY claims_select ON public.claims
  FOR SELECT USING (
    (select auth.uid()) = claimed_by
    OR (select auth.uid()) = poster_uid
  );

-- No direct inserts, updates, or deletes (managed by RPC)


-- ── Notifications ────────────────────────────────────────────────────────────

-- Recipient can read their own notifications
CREATE POLICY notifications_select ON public.notifications
  FOR SELECT USING ((select auth.uid()) = to_uid);

-- Recipient can update read status
CREATE POLICY notifications_update ON public.notifications
  FOR UPDATE USING ((select auth.uid()) = to_uid)
  WITH CHECK ((select auth.uid()) = to_uid);

-- Recipient can delete their own notifications
CREATE POLICY notifications_delete ON public.notifications
  FOR DELETE USING ((select auth.uid()) = to_uid);

-- No direct inserts (managed by RPC)


-- ──────────────────────────────────────────────────────────────────────────────
-- 6. TRIGGERS
-- ──────────────────────────────────────────────────────────────────────────────

-- Auto-create public.users row when a new auth.users row is inserted.
-- Only creates for @estin.dz emails (safety net).
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  -- Only create profile for @estin.dz emails
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

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();


-- Stamp the server-owned columns on every item insert (013). Identity comes
-- from the caller's JWT, never from the payload.
--
-- The service_role early-return is REQUIRED, not a convenience. /api/admin/items
-- inserts with the service role and legitimately sets user_email, user_name and
-- status (an admin can file an item on a student's behalf, already claimed).
-- current_user is tried first because auth.role() reads a GUC that only
-- PostgREST sets — a psql session would fall through to the authenticated
-- branch.
--
-- user_id is deliberately NOT stamped: items_insert already enforces
-- (select auth.uid()) = user_id via WITH CHECK, so RLS owns that column.
--
-- The body below is byte-identical to the one in
-- migrations/013-lock-insert-columns.sql, so pg_get_functiondef on a live
-- database diffs cleanly against either file. Its in-body reference to "this
-- file's header" therefore means 013's header, not this one. Keep it that way:
-- if you reword a comment inside the body, the drift check stops working.
CREATE OR REPLACE FUNCTION public.items_stamp_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_claims jsonb;
  v_email  text;
BEGIN
  IF current_user = 'service_role' OR (select auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;

  v_claims := (select auth.jwt());
  v_email  := v_claims ->> 'email';

  -- Refuse rather than stamp a null.
  --
  -- claim_item() returns poster_email from this column. A null here does not
  -- fail anything at insert time — it fails weeks later, when a student claims
  -- the item and gets no contact details back, with nothing in any log. That is
  -- the same silent failure this file's header warns about for the unpaired
  -- deploy; it must not be reachable through the trigger either.
  --
  -- A rejected insert is recoverable in the moment. Twenty rows with a null
  -- user_email, discovered in October, are not.
  IF v_email IS NULL THEN
    RAISE EXCEPTION 'items_stamp_insert: no email claim in JWT'
      USING HINT = 'Insert reached the authenticated branch without an email claim. '
                   'Expected only for @estin.dz sessions.';
  END IF;

  NEW.user_email := v_email;

  -- user_name stays nullable on purpose: Google may supply neither full_name
  -- nor name, the column allows null, and a missing display name degrades to
  -- "ESTIN Student" in the UI rather than breaking anything.
  NEW.user_name  := COALESCE(
                      v_claims -> 'user_metadata' ->> 'full_name',
                      v_claims -> 'user_metadata' ->> 'name'
                    );
  NEW.status     := 'open';
  NEW.created_at := pg_catalog.now();

  RETURN NEW;
END;
$$;

CREATE TRIGGER items_stamp_insert
  BEFORE INSERT ON public.items
  FOR EACH ROW
  EXECUTE FUNCTION public.items_stamp_insert();


-- ──────────────────────────────────────────────────────────────────────────────
-- 7. RPC FUNCTIONS
-- ──────────────────────────────────────────────────────────────────────────────

-- ── Claim Item ───────────────────────────────────────────────────────────────
-- Atomic: lock item, validate, create claim + notification, update status.
-- Returns JSON: { success, error?, poster_email?, poster_name? }

CREATE OR REPLACE FUNCTION public.claim_item(
  p_item_id       uuid,
  p_claimer_id    uuid,
  p_claimer_email text,
  p_claimer_name  text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item           record;
  v_notif_key      text;
  v_recent_claims  integer;
  v_max_hourly     constant integer := 5;
BEGIN
  -- 0. Rate limit: max 5 claims per hour per user
  SELECT count(*) INTO v_recent_claims
  FROM public.claims
  WHERE claimed_by = p_claimer_id
    AND created_at > now() - interval '1 hour';

  IF v_recent_claims >= v_max_hourly THEN
    RETURN jsonb_build_object('success', false, 'error', 'RATE_LIMITED');
  END IF;

  -- 1. Lock the item row
  SELECT * INTO v_item
  FROM public.items
  WHERE id = p_item_id
  FOR UPDATE;

  -- 2. Check item exists
  IF v_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ITEM_NOT_FOUND');
  END IF;

  -- 3. Check item is open
  IF v_item.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'ALREADY_CLAIMED');
  END IF;

  -- 4. Check item not expired (90 days)
  IF v_item.created_at < now() - interval '90 days' THEN
    RETURN jsonb_build_object('success', false, 'error', 'LISTING_EXPIRED');
  END IF;

  -- 5. Check claimer is not poster
  IF v_item.user_id = p_claimer_id THEN
    RETURN jsonb_build_object('success', false, 'error', 'SELF_CLAIM');
  END IF;

  -- 6. Create claim record
  INSERT INTO public.claims (item_id, item_type, item_category, claimed_by, claimed_email, claimed_name, poster_uid, poster_email)
  VALUES (p_item_id, v_item.type, v_item.category, p_claimer_id, p_claimer_email, p_claimer_name, v_item.user_id, v_item.user_email);

  -- 7. Create notification for poster
  IF v_item.user_id IS NOT NULL AND v_item.user_id != p_claimer_id THEN
    -- Map category to icon + label
    -- A key, not prose. The client composes the sentence from category and
    -- item_type (src/lib/notifications.ts). Keeps user-facing English out of
    -- the database and the taxonomy in one place.
    v_notif_key := CASE WHEN v_item.type = 'found' THEN 'claim.found' ELSE 'claim.lost' END;

    INSERT INTO public.notifications (to_uid, item_id, item_type, category, message, claimer_name, claimer_uid, claimer_email, read)
    VALUES (v_item.user_id, p_item_id, v_item.type, v_item.category, v_notif_key, p_claimer_name, p_claimer_id, p_claimer_email, false);
  END IF;

  -- 8. Update item status
  UPDATE public.items SET status = 'claimed' WHERE id = p_item_id;

  -- 9. Return success with poster contact info
  RETURN jsonb_build_object(
    'success', true,
    'poster_email', v_item.user_email,
    'poster_name', v_item.user_name
  );
END;
$$;


-- ── Unclaim Item ─────────────────────────────────────────────────────────────
-- The poster, and only the poster, puts a claimed item back on the board.
-- Deletes the claim row, notifies the claimer, sets status back to 'open'.
-- Returns JSON: { success, error? }
-- Errors: ITEM_NOT_FOUND | NOT_OWNER | NOT_CLAIMED

CREATE OR REPLACE FUNCTION public.unclaim_item(p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item           record;
  v_claim          record;
  v_caller         uuid := (select auth.uid());
BEGIN
  SELECT * INTO v_item
  FROM public.items
  WHERE id = p_item_id
  FOR UPDATE;

  IF v_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ITEM_NOT_FOUND');
  END IF;

  IF v_caller IS NULL OR v_item.user_id != v_caller THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_OWNER');
  END IF;

  IF v_item.status = 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_CLAIMED');
  END IF;

  SELECT * INTO v_claim
  FROM public.claims
  WHERE item_id = p_item_id
  ORDER BY created_at DESC
  LIMIT 1;

  IF v_claim IS NOT NULL THEN
    DELETE FROM public.claims WHERE id = v_claim.id;

    INSERT INTO public.notifications (to_uid, item_id, item_type, category, message, read)
    VALUES (v_claim.claimed_by, p_item_id, v_item.type, v_item.category, 'claim.reopened', false);
  END IF;

  UPDATE public.items SET status = 'open' WHERE id = p_item_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ── Resolve Item ─────────────────────────────────────────────────────────────
-- The poster closes their own listing. No claims row and no notification —
-- nobody else was involved. This is why 'resolved' is a distinct status:
-- status='claimed' must mean exactly "a claims row exists" (P2-3).
-- Returns JSON: { success, error? }
-- Errors: ITEM_NOT_FOUND | NOT_OWNER | NOT_OPEN

CREATE OR REPLACE FUNCTION public.resolve_item(p_item_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_item   record;
  v_caller uuid := (select auth.uid());
BEGIN
  SELECT * INTO v_item FROM public.items WHERE id = p_item_id FOR UPDATE;

  IF v_item IS NULL THEN
    RETURN jsonb_build_object('success', false, 'error', 'ITEM_NOT_FOUND');
  END IF;

  IF v_caller IS NULL OR v_item.user_id != v_caller THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_OWNER');
  END IF;

  IF v_item.status != 'open' THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_OPEN');
  END IF;

  UPDATE public.items SET status = 'resolved' WHERE id = p_item_id;

  RETURN jsonb_build_object('success', true);
END;
$$;


-- ── Check Post Rate Limit ────────────────────────────────────────────────────
-- Returns: { allowed, hourly_remaining, daily_remaining, reset_in_seconds }

CREATE OR REPLACE FUNCTION public.check_post_rate_limit(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_hourly_count  integer;
  v_daily_count   integer;
  v_oldest_hourly timestamptz;
  v_oldest_daily  timestamptz;
  v_reset_seconds integer;
  v_max_hourly    constant integer := 3;
  v_max_daily     constant integer := 10;
BEGIN
  -- Count posts in last hour
  SELECT count(*), min(created_at)
  INTO v_hourly_count, v_oldest_hourly
  FROM public.items
  WHERE user_id = p_user_id
    AND created_at > now() - interval '1 hour';

  -- Count posts in last 24 hours
  SELECT count(*), min(created_at)
  INTO v_daily_count, v_oldest_daily
  FROM public.items
  WHERE user_id = p_user_id
    AND created_at > now() - interval '1 day';

  -- Check daily limit first (stricter)
  IF v_daily_count >= v_max_daily THEN
    v_reset_seconds := GREATEST(1, EXTRACT(EPOCH FROM (v_oldest_daily + interval '1 day' - now()))::integer);
    RETURN jsonb_build_object(
      'allowed', false,
      'hourly_remaining', GREATEST(0, v_max_hourly - v_hourly_count),
      'daily_remaining', 0,
      'reset_in_seconds', v_reset_seconds
    );
  END IF;

  -- Check hourly limit
  IF v_hourly_count >= v_max_hourly THEN
    v_reset_seconds := GREATEST(1, EXTRACT(EPOCH FROM (v_oldest_hourly + interval '1 hour' - now()))::integer);
    RETURN jsonb_build_object(
      'allowed', false,
      'hourly_remaining', 0,
      'daily_remaining', v_max_daily - v_daily_count,
      'reset_in_seconds', v_reset_seconds
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'hourly_remaining', v_max_hourly - v_hourly_count,
    'daily_remaining', v_max_daily - v_daily_count,
    'reset_in_seconds', NULL
  );
END;
$$;


-- ── Get User Stats ───────────────────────────────────────────────────────────
-- Returns: { posted, claimed }

CREATE OR REPLACE FUNCTION public.get_user_stats(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  v_posted  bigint;
  v_claimed bigint;
BEGIN
  SELECT count(*) INTO v_posted FROM public.items WHERE user_id = p_user_id;
  SELECT count(*) INTO v_claimed FROM public.claims WHERE claimed_by = p_user_id;

  RETURN jsonb_build_object(
    'posted', v_posted,
    'claimed', v_claimed
  );
END;
$$;


-- ──────────────────────────────────────────────────────────────────────────────
-- 7b. RPC PERMISSIONS
-- ──────────────────────────────────────────────────────────────────────────────
-- All RPCs are SECURITY DEFINER. Postgres grants EXECUTE to PUBLIC on new
-- functions by default (so both anon and authenticated roles can call them).
-- These RPCs are user-scoped — they must not be callable without auth.

REVOKE EXECUTE ON FUNCTION public.claim_item(uuid, uuid, text, text) FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.unclaim_item(uuid)                 FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.resolve_item(uuid)                 FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.check_post_rate_limit(uuid)        FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_stats(uuid)               FROM anon, public;

GRANT EXECUTE ON FUNCTION public.claim_item(uuid, uuid, text, text)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.unclaim_item(uuid)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.resolve_item(uuid)                  TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_post_rate_limit(uuid)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats(uuid)                TO authenticated;


-- ──────────────────────────────────────────────────────────────────────────────
-- 8. ENABLE REALTIME
-- ──────────────────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ──────────────────────────────────────────────────────────────────────────────
-- 9. MIGRATION LEDGER
-- ──────────────────────────────────────────────────────────────────────────────
-- Everything in supabase/migrations/ is already folded into this file, so a
-- fresh install records them as applied and skips replaying them.

CREATE TABLE IF NOT EXISTS public.schema_migrations (
  filename   text        PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.schema_migrations IS
  'Applied migration filenames, in supabase/migrations/. Server-side only.';

ALTER TABLE public.schema_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.schema_migrations FROM anon, authenticated;

INSERT INTO public.schema_migrations (filename) VALUES
  ('001-rpc-permissions.sql'),
  ('002-performance-fixes.sql'),
  ('003-expiry-90-days.sql'),
  ('004-privacy-lockdown.sql'),
  ('005-claim-reversibility.sql'),
  ('006-schema-migrations.sql'),
  ('007-notification-keys.sql'),
  ('008-drop-unused-user-columns.sql'),
  ('009-item-ref.sql'),
  ('010-photo-path.sql'),
  ('011-resolved-status.sql'),
  ('012-lock-status-column.sql'),
  ('013-lock-insert-columns.sql')
ON CONFLICT (filename) DO NOTHING;


-- ──────────────────────────────────────────────────────────────────────────────
-- 10. STORAGE BUCKET
-- ──────────────────────────────────────────────────────────────────────────────
-- Run these via Supabase dashboard or storage API:
--
-- 1. Create bucket: item-photos — PRIVATE (public = false)
-- 2. Max file size: 5MB
-- 3. Allowed MIME types: image/jpeg, image/png, image/webp
--
-- This file said "(public)" until 2026-08-11 and was wrong: production has had
-- storage.buckets.public = false since the original P2-2 run. A fresh install
-- created from the old text would have been public, and the app would have
-- worked anyway — it reads through createSignedUrl(), which signs against
-- either — while quietly leaving every item photo world-readable by URL. That
-- is the failure this line exists to prevent, so do not "simplify" it back.
--
-- Storage policies (set in dashboard):
--   SELECT (download): authenticated users can read all files
--   INSERT (upload): authenticated users can upload to {type}-items/{auth.uid}/*
--   DELETE: authenticated users can delete from {type}-items/{auth.uid}/*
