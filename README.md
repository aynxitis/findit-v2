# FINDit

> A campus lost & found platform for ESTIN students.

![Next.js](https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat-square&logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-v4-38bdf8?style=flat-square&logo=tailwindcss)

---

## About

FINDit replaces the endless campus-wide lost item emails with a dedicated platform where ESTIN students can post lost or found items, browse reports, and claim belongings — all in one place.

**Key features:**
- Google OAuth login restricted to `@estin.dz` accounts (triple-layered: Google `hd` hint + server callback check + DB trigger)
- Post and browse lost & found item reports with photos
- Claim found items with automatic real-time notifications to the poster
- Real-time notification system (Supabase Realtime)
- Admin dashboard for content moderation
- Row-Level Security on every table; service-role key never leaves the server

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project (free tier is fine) with Auth, Database, Storage, and Realtime enabled
- Google OAuth provider configured in Supabase Auth, restricted to `@estin.dz`

### Installation

```bash
git clone https://github.com/aynxitis/findit-v2.git
cd findit-v2
npm install
```

### Database setup

**Fresh database.** Run these two files in the Supabase SQL Editor, in order:

1. `supabase/schema.sql` — tables, enums, RLS policies, grants, triggers, RPCs
2. `supabase/storage-policies.sql` — `item-photos` bucket policies

`schema.sql` already folds in every migration through `013`, and records them
in `public.schema_migrations`. **Do not** then replay `supabase/migrations/`.

**Existing database.** Leave `schema.sql` alone and apply the numbered files in
`supabase/migrations/` in order, skipping any already listed in
`public.schema_migrations`:

| File | What it does |
|------|--------------|
| `001-rpc-permissions.sql` | REVOKE anon, GRANT authenticated on the RPCs |
| `002-performance-fixes.sql` | RLS InitPlan wrapping, missing FK indexes |
| `003-expiry-90-days.sql` | Item expiry 30 → 90 days |
| `004-privacy-lockdown.sql` | `users` own-row-only; `items.user_email` unreadable by clients |
| `005-claim-reversibility.sql` | `unclaim_item()`; 5 claims/hour/user cap |
| `006-schema-migrations.sql` | Creates the ledger. Bootstraps it, so it runs after `001`–`005`. |
| `007-notification-keys.sql` | `claim_item`/`unclaim_item` write notification keys, not English prose |
| `008-drop-unused-user-columns.sql` | Drops `users.bio` and `users.verified`; replaces `handle_new_user()` first |
| `009-item-ref.sql` | Adds `items.ref`, backfilled in `created_at` order |
| `010-photo-path.sql` | Adds `items.photo_path`, backfilled from `photo_url` |
| `011-resolved-status.sql` | Adds `resolved` status and `resolve_item()`; `claimed` now means a claim row exists |
| `012-lock-status-column.sql` | Revokes UPDATE on `items.status`; transitions only via RPC |
| `013-lock-insert-columns.sql` | `ref` becomes GENERATED ALWAYS; a trigger stamps `user_email`, `user_name`, `status`, `created_at`; INSERT is revoked from `anon` and column-limited for `authenticated` |

Optional: `supabase/cleanup-expired.sql` (90-day cleanup helper — schedule via `pg_cron` if desired).

> `004` revokes the table-level SELECT grant on `items`, so `select('*')` against
> that table becomes a permission error. The app selects explicit columns
> (`ITEM_COLUMNS` in `src/hooks/use-items.ts`). Deploy the matching app code
> alongside it.

### Environment Variables

Create a `.env.local` file in the project root:

```env
# Supabase — public (safe to expose to the browser)
NEXT_PUBLIC_SUPABASE_URL=https://<project-ref>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>

# Supabase — server-only (NEVER expose to the browser)
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>

# Comma-separated list of admin emails (must end in @estin.dz)
ADMIN_EMAILS=admin1@estin.dz,admin2@estin.dz

# Optional — set to your deployed URL in production
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> **Where to find these:**
> - `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` → Supabase Dashboard → Project Settings → API → Project URL and `anon` public key
> - `SUPABASE_SERVICE_ROLE_KEY` → same page, `service_role` secret key (server-only — do not commit, do not expose)
> - `ADMIN_EMAILS` → your call; seed with at least the main admin account

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Known debt

**Claims are immediate, not negotiated.** Pressing "Yes, this is mine" marks
the item claimed straight away and reveals the poster's email. The poster has
no say in it — their only recourse is the "Undo claim" button on `/profile`,
which puts the item back on the board and notifies the claimer.

The correct design is a pending → accept/reject flow, where a claim is a
request the poster approves before any contact details change hands. That is
deliberately out of scope for this cycle. Until it lands, the guard rails are
the reversibility above and a limit of 5 claims per hour per user, enforced
inside `claim_item()`.

**Free-text locations are unmoderated.** The report form's "Other" spot option
writes whatever the student types straight into `items.location`, and that
string is rendered verbatim on the board, in the claim modal and on `/profile`.
Four of the live rows already hold free text this way.

This is a moderation gap, not an injection one, and the distinction matters:

- There is no HTML sink anywhere in `src/` — the only `dangerouslySetInnerHTML`
  is two hardcoded JSON-LD blobs in `layout.tsx`. Every render of `location` is
  a JSX text child, so React escapes it. Audited, not assumed.
- The database caps it at `CHECK (char_length(location) <= 100)`. The form's
  `maxLength={80}` and its validation are client-only and bypassable, because
  the browser inserts into `items` directly with no server route in between.
  The real ceiling is 100 characters.
- There is **no character validation at all**, client or database. Within those
  100 characters, RTL overrides, zero-width joiners, newlines, homoglyphs and
  slurs all store and render fine.

Deciding what to do about it — an allowlist, a report button, admin review, or
dropping the free-text option — is a product call that has not been made.

**The report form still collects `zone`, and nothing student-facing reads it.**
Every student picks a zone, it is stored on every row and validated in two API
routes, but exactly one surface reads it back: the admin item modal. It is not
used by browse filters, cards, search, sorting or grouping.

It has not been removed, because it cannot be removed on its own. `zone` is the
first step of a two-step location picker: `getLocationValue()` can only produce
a location from `formData.spot`, which is settable only from the picker that
`zone` gates. Drop the field and `location` is permanently `null`, validation
rejects it, and the form stops accepting submissions.

Flattening the picker into a single location list is the fix, and it is a UX
change rather than a mechanical one. Two notes for whoever does it: location
slugs are globally unique, so `zone` carries no data-level information and the
column can eventually go; but the chip labels collide — `foyer` and `res_foyer`
both render as "Foyer" — so a flat list must use the full labels
("Foyer (école)" / "Foyer (résidence)"), not the short ones.

**`src/lib/validations/item.ts` is entirely unreferenced, and now actively
misleading.** Nothing outside the file imports `reportItemSchema`, `itemSchema`,
`validateReportItem` or either type export; the report form validates inline
instead.

`itemSchema` is the part that misleads. It models the old client-supplied insert
payload — `user_email`, `user_name`, `status` and `created_at` included — and
migration `013` revoked INSERT on exactly those columns, so the shape it
describes is now one the database rejects with `42501`. Anyone who reaches for
it as a reference will build a payload that cannot be inserted.

It is pre-existing dead code rather than a leftover of any recent change, and it
is deliberately still here: the scheduled deletion list was closed and not
reopened. Recorded so the file is not mistaken for the current contract.

---

## Branch Structure

| Branch | Purpose |
|--------|---------|
| `main` | Production — auto-deploys to Vercel |
| `staging` | Pre-production — Vercel preview deployments |

Feature branches should be created off `staging` and merged back into `staging` before going to `main`.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server (Turbopack) |
| `npm run build` | Build for production |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
