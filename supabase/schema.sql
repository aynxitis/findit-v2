-- ============================================================================
-- FINDit -- Supabase Schema (Phase 2)
-- Run this in dependency order in the Supabase SQL Editor.
-- ============================================================================


-- ──────────────────────────────────────────────────────────────────────────────
-- 1. ENUM TYPES
-- ──────────────────────────────────────────────────────────────────────────────

CREATE TYPE public.item_type       AS ENUM ('found', 'lost');
CREATE TYPE public.item_status     AS ENUM ('open', 'claimed');
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
  verified   boolean     NOT NULL DEFAULT true,
  banned     boolean     NOT NULL DEFAULT false,
  bio        text        CHECK (char_length(bio) <= 300),
  joined_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.users IS 'User profiles, auto-created by trigger on auth.users insert';


-- Items
CREATE TABLE public.items (
  id          uuid                PRIMARY KEY DEFAULT gen_random_uuid(),
  type        public.item_type    NOT NULL,
  category    public.item_category NOT NULL,
  location    text                NOT NULL CHECK (char_length(location) <= 100),
  zone        public.item_zone,
  where_left  public.item_where_left,
  date        date                NOT NULL,
  description text                CHECK (char_length(description) <= 400),
  photo_url   text                CHECK (char_length(photo_url) <= 500),
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

-- Any authenticated user can read any profile
CREATE POLICY users_select ON public.users
  FOR SELECT USING ((select auth.role()) = 'authenticated');

-- Users can update their own profile (name, photo, bio only)
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
    INSERT INTO public.users (id, name, email, photo, verified, joined_at)
    VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.raw_user_meta_data ->> 'name', 'Anonymous'),
      NEW.email,
      NEW.raw_user_meta_data ->> 'avatar_url',
      true,
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
  v_item        record;
  v_category_icon text;
  v_category_label text;
  v_notif_message text;
BEGIN
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
    v_category_icon := CASE v_item.category
      WHEN 'keys' THEN '🔑' WHEN 'card' THEN '🪪' WHEN 'phone' THEN '📱'
      WHEN 'bag' THEN '🎒' WHEN 'clothing' THEN '👕' WHEN 'electronics' THEN '💻'
      ELSE '📦'
    END;
    v_category_label := CASE v_item.category
      WHEN 'keys' THEN 'Keys' WHEN 'card' THEN 'Card / ID' WHEN 'phone' THEN 'Phone'
      WHEN 'bag' THEN 'Bag' WHEN 'clothing' THEN 'Clothing' WHEN 'electronics' THEN 'Electronics'
      ELSE 'Other'
    END;

    IF v_item.type = 'found' THEN
      v_notif_message := v_category_icon || ' Someone thinks your ' || v_category_label || ' is theirs and wants to claim it.';
    ELSE
      v_notif_message := v_category_icon || ' Someone found your ' || v_category_label || ' and reached out!';
    END IF;

    INSERT INTO public.notifications (to_uid, item_id, item_type, category, message, claimer_name, claimer_uid, claimer_email, read)
    VALUES (v_item.user_id, p_item_id, v_item.type, v_item.category, v_notif_message, p_claimer_name, p_claimer_id, p_claimer_email, false);
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
REVOKE EXECUTE ON FUNCTION public.check_post_rate_limit(uuid)        FROM anon, public;
REVOKE EXECUTE ON FUNCTION public.get_user_stats(uuid)               FROM anon, public;

GRANT EXECUTE ON FUNCTION public.claim_item(uuid, uuid, text, text)  TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_post_rate_limit(uuid)         TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_stats(uuid)                TO authenticated;


-- ──────────────────────────────────────────────────────────────────────────────
-- 8. ENABLE REALTIME
-- ──────────────────────────────────────────────────────────────────────────────

ALTER PUBLICATION supabase_realtime ADD TABLE public.items;
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;


-- ──────────────────────────────────────────────────────────────────────────────
-- 9. STORAGE BUCKET
-- ──────────────────────────────────────────────────────────────────────────────
-- Run these via Supabase dashboard or storage API:
--
-- 1. Create bucket: item-photos (public)
-- 2. Max file size: 5MB
-- 3. Allowed MIME types: image/jpeg, image/png, image/webp
--
-- Storage policies (set in dashboard):
--   SELECT (download): authenticated users can read all files
--   INSERT (upload): authenticated users can upload to {type}-items/{auth.uid}/*
--   DELETE: authenticated users can delete from {type}-items/{auth.uid}/*
