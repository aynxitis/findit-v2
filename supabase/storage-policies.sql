-- ============================================================================
-- FINDit — Supabase Storage Policies (item-photos bucket)
-- Run in the Supabase SQL Editor to tighten storage RLS.
-- ============================================================================
--
-- These policies replace the default storage policies for the item-photos
-- bucket. They enforce path-based ownership so users can only upload/delete
-- photos under their own {type}-items/{uid}/ prefix.
--
-- Prerequisites:
--   1. Bucket "item-photos" exists — PRIVATE (public = false), 5 MB max,
--      image/* MIME types. This line said "public" until 2026-08-11 and was
--      wrong; production has been private since the original P2-2 run.
--   2. Drop any existing policies on storage.objects for this bucket first.
--
-- The SELECT policy below is what makes a private bucket usable: it is the
-- grant createSignedUrl() checks before issuing a URL. On a public bucket it
-- was close to decorative, since the object was readable without it.
-- ============================================================================


-- ── Drop existing policies first (idempotent re-runs) ──────────────────────
-- Also drops dashboard-generated duplicates if present.

DROP POLICY IF EXISTS "item-photos: authenticated read"    ON storage.objects;
DROP POLICY IF EXISTS "item-photos: owner upload"          ON storage.objects;
DROP POLICY IF EXISTS "item-photos: owner delete"          ON storage.objects;
DROP POLICY IF EXISTS "Public can read item photos"        ON storage.objects;
DROP POLICY IF EXISTS "allow_authenticated_read 13j4whn_0" ON storage.objects;


-- ── SELECT (download): any authenticated user can read all photos ───────────

CREATE POLICY "item-photos: authenticated read"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (bucket_id = 'item-photos');


-- ── INSERT (upload): user can only upload to their own folder ───────────────
-- Path format: {type}-items/{auth.uid}/{filename}
-- (storage.foldername(name))[2] returns the second folder segment = user ID.

CREATE POLICY "item-photos: owner upload"
  ON storage.objects
  FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'item-photos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );


-- ── DELETE: user can only delete photos in their own folder ─────────────────

CREATE POLICY "item-photos: owner delete"
  ON storage.objects
  FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'item-photos'
    AND (storage.foldername(name))[2] = auth.uid()::text
  );
