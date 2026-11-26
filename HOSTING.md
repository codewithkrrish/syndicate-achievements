# Hosting SYNDICATE Achievements anywhere

This zip is the complete website code. **All content lives in the database —
not in this zip and not on the host.** Every achievement record and every
screenshot photo is stored in the PostgreSQL database (Supabase), so moving
hosts never moves data: point the new host at the same database and the full
archive appears exactly as it was.

## What you need

- A host that can run a Node.js 20+ app (Netlify, Vercel, Render, a VPS, …)
- The database connection details (see below)

## Steps

1. Unzip and deploy the project on your host (for Netlify/Vercel: import the
   folder/repo, build command `npm run build`, publish `.next` — both detect
   Next.js automatically).
2. Set these environment variables on the host:

   | Variable | What it is |
   | --- | --- |
   | `DATABASE_URL` | Pooled Postgres connection string (Supabase pooler, port 6543, with `?pgbouncer=true`) |
   | `DIRECT_URL` | Direct Postgres connection string (port 5432) |
   | `AUTH_SECRET` | A long random string used to sign admin sessions |
   | `AUTH_TRUST_HOST` | `true` |
   | `ADMIN_USERNAME` | Admin login username |
   | `ADMIN_PASSWORD_HASH` | Bcrypt hash of the admin password — generate with `npm run hash-password` |

   See `.env.example` for the full template. **Never commit real values.**

3. Deploy. The public site reads everything from the database at request
   time; the admin panel is at `/admin`.

## Fresh database (only if you ever start over)

```
npm install
npm run db:push     # creates the tables
npm run db:seed     # inserts Match #002 AND its screenshots into the database
```

The seed reads the original screenshots from `public/seed/` once and stores
them as bytes in the `StoredImage` table; from then on they are served from
the database at `/api/images/<id>` on any host.

## How storage works (so future-you doesn't worry)

- Achievement + game records: `Achievement` and `Game` tables.
- Screenshot photos: `StoredImage` table (the photo bytes themselves, in the
  database). Admin uploads write here too — the host's disk is never used.
- The only files in this zip that are part of the design (not data): the
  guild logo, the hero background and the favicon in `public/`.
