# Deployment & Self-Hosting Guide

This app is a TanStack Start (React + Vite) frontend on top of a standard
PostgreSQL / Supabase-compatible backend. It currently runs on the
Lovable-managed backend, and the same code + schema runs unchanged on your own
VPS with your own domain.

Nothing about the backend host is hardcoded — every host, key, bucket mode and
public URL comes from environment variables.

---

## 1. Environment variables

| Variable | Where | Purpose |
| --- | --- | --- |
| `VITE_SUPABASE_URL` | browser | API URL of your Postgres/Supabase instance |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | browser | anon / publishable key |
| `VITE_SUPABASE_PROJECT_ID` | browser | project ref (optional, informational) |
| `SUPABASE_URL` | server | same URL, for server functions |
| `SUPABASE_PUBLISHABLE_KEY` | server | same anon key, for server functions |
| `SUPABASE_SERVICE_ROLE_KEY` | server, secret | privileged server-only operations (admin ops, notifications). Never expose to the browser. |
| `VITE_APP_URL` | both | canonical public site URL, e.g. `https://shop.example.com`. Used for generated feed/share links. Falls back to the current origin. |
| `VITE_STORAGE_PUBLIC_BUCKETS` | browser | comma list of buckets served publicly, e.g. `products,public`. Empty ⇒ all buckets private and signed URLs are used. |
| `VITE_STORAGE_SIGNED_URL_TTL` | browser | signed URL lifetime in seconds (default 1 year) |

On Lovable the Supabase values are injected automatically; on your VPS put them
in `.env` (never commit real values).

---

## 2. Database schema & migrations

* Canonical schema lives in `supabase/migrations/*.sql` — plain, portable SQL.
* Apply to any Postgres 15+ with the Supabase extensions:

```bash
supabase db push                 # with the Supabase CLI
# or, plain psql, in filename order:
for f in supabase/migrations/*.sql; do psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f "$f"; done
```

Required extensions: `pgcrypto`, `pg_net` (optional, only for scheduled jobs),
`pg_cron` (optional).

Roles/RLS: user roles live in `public.user_roles` (`app_role` enum) and are
checked with the `has_role()` / `is_admin()` security-definer functions. All
business tables have RLS enabled with explicit `GRANT`s.

---

## 3. Object storage

Buckets used: `products` (product images), `public` (store logos/banners/
avatars), `ai-memory` (admin assistant files).

All storage access goes through `src/lib/storage.ts`. Paths are stored in the
database as bucket-relative paths (portable), and resolved at render time to
either a public URL or a signed URL depending on
`VITE_STORAGE_PUBLIC_BUCKETS`. To move to S3/MinIO/R2, point your
Supabase storage backend at it, or replace the two functions in
`src/lib/storage.ts` — no other file touches storage directly.

---

## 4. Running

```bash
bun install
bun run dev        # http://localhost:8080
bun run build      # production build
```

Serve the build behind Nginx/Caddy with TLS for your domain, and set
`VITE_APP_URL` to that domain before building.

---

## 5. Backup & export

```bash
# full logical backup (schema + data)
pg_dump "$DATABASE_URL" -Fc -f backup-$(date +%F).dump

# data only, for moving between hosts
pg_dump "$DATABASE_URL" --data-only --schema=public -f data-$(date +%F).sql

# restore
pg_restore -d "$NEW_DATABASE_URL" backup-YYYY-MM-DD.dump

# storage files
supabase storage download --recursive ss://products ./backup/products
```

Schedule `pg_dump` nightly via cron on your VPS and keep off-box copies.

---

## 6. Importing the data from the previous backend

The schema has been recreated here, but **no product, order or user data was
copied** — that requires credentials for the old project that are not present
in this workspace. To import:

1. From the old project, export data only:
   `pg_dump "$OLD_DATABASE_URL" --data-only --schema=public --disable-triggers -f old-data.sql`
2. Export `auth.users` separately if you want to keep existing logins:
   `pg_dump "$OLD_DATABASE_URL" --data-only --table=auth.users --table=auth.identities -f old-auth.sql`
3. Download the storage buckets (`products`, `public`).
4. Restore auth first, then public data, then re-upload storage files with the
   same paths.

**Credentials you must supply for that step** (never paste them in chat — use
the secure secret prompt):

* old project database connection string (or a `pg_dump` file you produce yourself)
* old project `service_role` key, if exporting via the API instead of `pg_dump`

