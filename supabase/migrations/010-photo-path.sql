-- ============================================================================
-- Migration 010 — Store the storage path, not the public URL (P2-2, step 1)
-- Run once in Supabase SQL Editor. Idempotent.
-- ============================================================================
--
-- items.photo_url holds a full public URL, which has two consequences:
--
--   1. Deletion code string-slices the URL back to a path against the marker
--      "/object/public/item-photos/", duplicated in two places.
--   2. It hardcodes the bucket being public. A photo of a found student card
--      carries a real name, ID number and face, and is currently fetchable by
--      anyone holding the URL, permanently, surviving deletion of the item.
--
-- This migration adds the path. It does NOT flip the bucket — that is step 4
-- of P2-2 and happens in the dashboard only after the app is deployed and
-- verified reading signed URLs. Flipping early breaks every existing photo.
--
-- photo_url is deliberately left in place. Dropping it is a later migration
-- (step 5), so a rollback of the app code still renders images.
--
-- ---------------------------------------------------------------------------
-- Percent-encoding: this is the trap.
--
-- A public URL percent-encodes the object name, but the storage API expects the
-- raw name. Two of the nine existing photos are named "unnamed (1).jpg" and
-- "unnamed (2).png" — with a literal space — and appear in photo_url as
-- "unnamed%20(1).jpg". A naive prefix-strip stores the encoded form, and
-- createSignedUrl() then 404s on exactly those rows. Verified against the live
-- bucket before writing this. Hence the decoder below.
-- ============================================================================


-- ── 1. Column ────────────────────────────────────────────────────────────────

ALTER TABLE public.items ADD COLUMN IF NOT EXISTS photo_path text;


-- ── 2. Percent-decoder, used once and dropped ────────────────────────────────

CREATE OR REPLACE FUNCTION public.findit_url_decode(input text)
RETURNS text
LANGUAGE plpgsql
IMMUTABLE
STRICT
SET search_path = ''
AS $$
DECLARE
  bin  bytea := '';
  tok  text;
BEGIN
  FOR tok IN
    SELECT (pg_catalog.regexp_matches(input, '(%[0-9a-fA-F]{2}|.)', 'g'))[1]
  LOOP
    IF pg_catalog.length(tok) = 3 AND pg_catalog.left(tok, 1) = '%' THEN
      bin := bin || pg_catalog.decode(pg_catalog.substring(tok FROM 2 FOR 2), 'hex');
    ELSE
      bin := bin || pg_catalog.convert_to(tok, 'utf8');
    END IF;
  END LOOP;

  RETURN pg_catalog.convert_from(bin, 'utf8');
END;
$$;


-- ── 3. Backfill ──────────────────────────────────────────────────────────────

UPDATE public.items
SET photo_path = public.findit_url_decode(
  substring(
    photo_url
    FROM position('/object/public/item-photos/' IN photo_url)
         + length('/object/public/item-photos/')
  )
)
WHERE photo_url IS NOT NULL
  AND photo_path IS NULL
  AND position('/object/public/item-photos/' IN photo_url) > 0;

DROP FUNCTION IF EXISTS public.findit_url_decode(text);


-- ── 4. Grant — same trap as migration 009 ────────────────────────────────────
-- 004 revoked the table-level SELECT, so a new column is invisible to clients
-- until granted individually.

GRANT SELECT (photo_path) ON public.items TO authenticated;


-- ── 5. Ledger ────────────────────────────────────────────────────────────────

INSERT INTO public.schema_migrations (filename)
VALUES ('010-photo-path.sql')
ON CONFLICT (filename) DO NOTHING;


-- Verify — expect 9 rows, no '%' in any path, and the two "unnamed (n)" files
-- carrying a literal space:
--
--   SELECT ref, photo_path FROM public.items
--   WHERE photo_url IS NOT NULL ORDER BY ref;
--
--   SELECT count(*) FROM public.items WHERE photo_path LIKE '%\%%';   -- expect 0
--   SELECT count(*) FROM public.items
--   WHERE photo_url IS NOT NULL AND photo_path IS NULL;               -- expect 0
