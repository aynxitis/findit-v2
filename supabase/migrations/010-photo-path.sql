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
--      carries a real name, ID number and face, and was fetchable by anyone
--      holding the URL, permanently, surviving deletion of the item.
--
-- This migration adds the path. It does not touch the bucket.
--
-- ---------------------------------------------------------------------------
-- CORRECTED 2026-08-11 — the paragraph that stood here was wrong, and the
-- correction matters more than the original text.
--
-- It said the bucket flip was "step 4 of P2-2", to be done in the dashboard
-- only after the app was deployed and verified reading signed URLs, and warned
-- that flipping early breaks every existing photo.
--
-- The flip had ALREADY happened: storage.buckets.public = false for
-- item-photos, confirmed against production. It was done in the dashboard
-- during the original P2-2 run, outside the migration sequence, so it was never
-- in git and survived every reset of the code that assumed otherwise. The
-- warning was accurate about the consequence and wrong about the tense — every
-- photo served from /object/public/ has been 404ing on the live board since.
--
-- There is no flip left to perform. Do not add one.
--
-- The lesson, recorded in audits/DECISIONS.md: the repo is fact for code, the
-- live system is fact for infrastructure. Bucket visibility, dashboard
-- settings and anything else changed outside a migration cannot be read out of
-- these files, however confidently they are written.
-- ---------------------------------------------------------------------------
--
-- photo_url is left in place; dropping it is a later migration. Note that its
-- original justification — "so a rollback of the app code still renders
-- images" — no longer holds either, for the same reason: against a private
-- bucket those public URLs render nothing. The column is now inert history.
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
  bin  bytea := ''::bytea;   -- explicit cast; do not rely on unknown-literal coercion
  tok  text;
BEGIN
  -- regexp_matches goes in the FROM clause, not the target list. Both parse,
  -- but the FROM form is unambiguous and does not depend on set-returning
  -- functions being allowed in a SELECT list.
  FOR tok IN
    SELECT m[1]
    FROM pg_catalog.regexp_matches(input, '(%[0-9a-fA-F]{2}|.)', 'g') AS m
  LOOP
    IF pg_catalog.length(tok) = 3 AND pg_catalog.left(tok, 1) = '%' THEN
      -- Comma form, NOT substring(tok FROM 2 FOR 2). The SQL-standard
      -- FROM/FOR grammar is only accepted for the bare `substring` keyword;
      -- schema-qualifying the name forces ordinary function-call syntax, and
      -- the keyword form then fails to parse. That is what aborted the first
      -- version of this migration.
      bin := bin || pg_catalog.decode(pg_catalog.substring(tok, 2, 2), 'hex');
    ELSE
      bin := bin || pg_catalog.convert_to(tok, 'utf8');
    END IF;
  END LOOP;

  RETURN pg_catalog.convert_from(bin, 'utf8');
END;
$$;


-- ── 3. Self-test — runs BEFORE any data is touched ───────────────────────────
-- This decoder could not be executed anywhere before shipping: there is no
-- Postgres in the authoring environment, which is exactly how the first version
-- reached you with a parse error. So the migration proves itself against known
-- inputs and aborts loudly if it is wrong, rather than silently writing paths
-- that sign to a 404.
--
-- The two "unnamed" vectors are the real live rows, checked against the actual
-- storage object names via the storage API.

DO $$
DECLARE
  got text;
BEGIN
  -- percent-encoded space, both live rows
  got := public.findit_url_decode('found-items/5a9c36dc-e07c-4092-8611-c866742ff6f2/unnamed%20(1).jpg');
  IF got <> 'found-items/5a9c36dc-e07c-4092-8611-c866742ff6f2/unnamed (1).jpg' THEN
    RAISE EXCEPTION 'url_decode self-test 1 failed: got %', got;
  END IF;

  got := public.findit_url_decode('found-items/5a9c36dc-e07c-4092-8611-c866742ff6f2/unnamed%20(2).png');
  IF got <> 'found-items/5a9c36dc-e07c-4092-8611-c866742ff6f2/unnamed (2).png' THEN
    RAISE EXCEPTION 'url_decode self-test 2 failed: got %', got;
  END IF;

  -- unencoded paths must pass through byte-for-byte (the other seven rows)
  got := public.findit_url_decode('found-items/abc/1776201588144.jpg');
  IF got <> 'found-items/abc/1776201588144.jpg' THEN
    RAISE EXCEPTION 'url_decode self-test 3 failed: got %', got;
  END IF;

  -- multi-byte UTF-8, in case a future filename carries an accent
  got := public.findit_url_decode('a%C3%A9b');
  IF got <> 'aéb' THEN
    RAISE EXCEPTION 'url_decode self-test 4 failed: got %', got;
  END IF;

  RAISE NOTICE 'url_decode self-test passed';
END $$;


-- ── 4. Backfill ──────────────────────────────────────────────────────────────

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


-- ── 5. Grant — same trap as migration 009 ────────────────────────────────────
-- 004 revoked the table-level SELECT, so a new column is invisible to clients
-- until granted individually.

GRANT SELECT (photo_path) ON public.items TO authenticated;


-- ── 6. Ledger ────────────────────────────────────────────────────────────────

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
