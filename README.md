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

Run these SQL files against your Supabase project (SQL Editor, in order):

1. `supabase/schema.sql` — tables, enums, RLS policies, triggers, RPCs
2. `supabase/storage-policies.sql` — `item-photos` bucket policies
3. `supabase/migrations/001-rpc-permissions.sql` — REVOKE anon, GRANT authenticated

Optional: `supabase/cleanup-expired.sql` (90-day cleanup helper — schedule via `pg_cron` if desired).

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
