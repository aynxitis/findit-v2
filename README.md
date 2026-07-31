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

`schema.sql` already folds in every migration through `006`, and records them
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
| `006-schema-migrations.sql` | Creates the ledger. **Run last.** |

Optional: `supabase/cleanup-expired.sql` (90-day cleanup helper — schedule via `pg_cron` if desired).

> `004` revokes the table-level SELECT grant on `items`, so `select('*')` against
> that table becomes a permission error. The app selects explicit columns
> (`ITEM_SELECT_COLUMNS` in `src/lib/constants/config.ts`). Deploy the matching
> app code alongside it.

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

# Canonical origin — metadata, robots.txt, sitemap. Set to the deployed URL
# in the Vercel project settings.
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

> `NEXT_PUBLIC_SUPABASE_URL` is read by `next.config.ts` at build time to derive
> the CSP and `images.remotePatterns`. The build fails fast if it is missing.

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

**Claims are one-click, not a request.** Confirming a claim immediately flips
the item to `claimed`. There is no pending/accept/reject flow, so a stranger
still takes a listing off the board on a single click. Two guards are in place
as a stopgap:

- The poster can reverse it from `/profile` ("Undo claim"), which deletes the
  claim and notifies the claimer (`unclaim_item`).
- Claims are capped at 5 per hour per user, enforced inside `claim_item`.

A proper pending/accept/reject flow is the correct design and is not yet built.

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
