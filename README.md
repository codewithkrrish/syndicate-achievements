# SYNDICATE Achievements

The official achievement archive of the **SYNDICATE** Free Fire guild — every
guild-vs-guild series on record, with final scores and a result screenshot
for every game. The public site is read-only; a single-admin panel (the
guild owner only) manages the record. All content lives in PostgreSQL —
nothing on the public site is hard-coded except the guild's static About Us
facts (owners, casters, official links).

Built with Next.js (App Router) + TypeScript, Tailwind CSS, Prisma,
PostgreSQL (Neon), Auth.js, and Vercel Blob for screenshot uploads.
Designed to deploy on Vercel.

---

## Table of contents

1. [Architecture overview](#architecture-overview)
2. [Data model](#data-model)
3. [Environment variables](#environment-variables)
4. [Local development](#local-development)
5. [Deploying to Vercel (step by step)](#deploying-to-vercel-step-by-step)
6. [Setting and changing the admin password](#setting-and-changing-the-admin-password)
7. [Adding the first achievement](#adding-the-first-achievement)
8. [How the admin panel is protected](#how-the-admin-panel-is-protected)
9. [Troubleshooting](#troubleshooting)

---

## Architecture overview

```
app/
  page.tsx                    Public archive (server component, force-dynamic)
  layout.tsx                  Root layout + fonts + site metadata
  robots.ts                   Indexing rules (admin + API disallowed)
  not-found.tsx / loading.tsx 404 and loading states in the site's design
  admin/
    login/                    Sign-in page + rate-limited login action
    page.tsx                  Dashboard: counters, quick links, record list
    achievements/
      new/                    Add-achievement page
      [id]/edit/              Edit page
      [id]/delete/            Delete confirmation page (full record shown)
    actions.ts                All admin mutations (server actions)
  api/
    auth/[...nextauth]/       Auth.js handlers
    admin/upload/             Screenshot upload to Vercel Blob
components/
  PublicSite.tsx              Public shell: header, hero, view routing (hash)
  SearchBar.tsx               Real-time guild search with live dropdown
  RecordCard.tsx              One entry in The Record
  MatchDetail.tsx             Scoreline, spec grid, per-game blocks, lightbox
  AboutView.tsx               Owners, casters, guild links, copy template
  EmberCanvas.tsx             Animated ember background layer
  admin/                      AdminShell, AchievementForm, AchievementList,
                              DeleteConfirm, NoticeBanner
lib/
  db.ts                       Prisma client (singleton)
  data.ts                     Read queries (failure-tolerant) + dashboard stats
  format.ts                   Date/label formatting (client-safe)
  validation.ts               Zod schemas — the single source of truth for
                              allowed values (results, formats, game rules)
  site.ts                     Static guild facts (owners, casters, links,
                              announcement template, card-line pattern)
  rate-limit.ts               In-memory login throttling
auth.ts / auth.config.ts      Auth.js config (Credentials, single admin)
middleware.ts                 Route protection for /admin and /api/admin
prisma/
  schema.prisma               Data model
  migrations/                 Checked-in SQL migrations (migrate deploy)
  seed.ts                     Match #002 — the record's first entry
scripts/
  hash-password.ts            Generates ADMIN_PASSWORD_HASH (npm run hash-password)
public/seed/                  Seed screenshots + hero image
```

**How rendering works.** The public home page is `force-dynamic`: it reads
the database on every request, so an admin edit is live the instant it is
saved — no rebuild, no cache to purge. If the database is briefly
unreachable, the read layer degrades to the site's empty state instead of
an error page.

**Views.** Like the original site, the archive is one page with three
client-side views — The Record, match detail, About Us — deep-linkable via
hashes (`#match-002`, `#about`) with working Back/Forward.

---

## Data model

### Achievement

| Field                | Type    | Notes                                   |
| -------------------- | ------- | --------------------------------------- |
| `id`                 | Int PK  |                                         |
| `matchNumber`        | Int     | **Unique.** The public "#002" number.   |
| `opponent`           | String  | Opponent guild / creator name.          |
| `opponentChannelUrl` | String? | YouTube channel; bar shows only if set. |
| `result`             | String  | `WIN` or `LOSS` (Zod-validated).        |
| `finalScore`         | String  | Display string, e.g. `2 – 1`.           |
| `format`             | String  | `BO1`, `BO3`, or `BO5`.                 |
| `date`               | Date    | Calendar day of the series.             |
| `mode`               | String  | e.g. Clash Squad.                       |
| `map`                | String  | e.g. Bermuda.                           |
| `cardLine`           | String  | Short line on the record card.          |
| `thumbnailUrl`       | String? | Optional poster image for the record card; falls back to the decider screenshot. |
| `createdAt/updatedAt`| DateTime|                                         |

### Game

| Field           | Type   | Notes                                        |
| --------------- | ------ | -------------------------------------------- |
| `id`            | Int PK |                                              |
| `achievementId` | FK     | **Cascade delete** with its achievement.     |
| `gameNumber`    | Int    | Unique per achievement; assigned by row order.|
| `scoreFor`      | Int    | SYNDICATE's score.                           |
| `scoreAgainst`  | Int    | Opponent's score.                            |
| `result`        | String | `Victory` or `Defeat`.                       |
| `screenshotUrl` | String | Blob URL, pasted URL, or `/seed/...` path.   |

Result/format are stored as strings and validated in `lib/validation.ts`
rather than as database enums, so label changes never need a migration.

---

## Environment variables

| Variable                | Required | What it is | How to get it |
| ----------------------- | -------- | ---------- | ------------- |
| `DATABASE_URL`          | Yes      | PostgreSQL connection string (pooled) | Neon dashboard → your project → **Connection Details** → pooled connection string (host contains `-pooler`), with `?sslmode=require`. |
| `DIRECT_URL`            | Yes      | Direct (unpooled) PostgreSQL connection string — Prisma uses it only for migrations | Same panel as `DATABASE_URL`, but the unpooled variant (Neon: uncheck **Pooled connection**, port 5432; Supabase: port 5432). |
| `AUTH_SECRET`           | Yes      | Signs the admin session JWT | Run `openssl rand -base64 32` and paste the output. |
| `AUTH_TRUST_HOST`       | Local only | Lets Auth.js trust the host header outside Vercel | Set to `true` for local `next start` or non-Vercel hosts. On Vercel it is automatic — leave unset there. |
| `ADMIN_USERNAME`        | Yes      | The one admin username | Choose it yourself; it is typed at login exactly as written. |
| `ADMIN_PASSWORD_HASH`   | Yes      | **bcrypt hash** of the admin password — never the password itself | Run `npm run hash-password`, type the password, copy the form it prints (see the $ warning below). |
| `BLOB_READ_WRITE_TOKEN` | For uploads | Vercel Blob read-write token | Vercel project → **Storage** → your Blob store → **.env.local** tab / Settings. Without it, the admin form still works with pasted image URLs. |

> **The `$` warning (read this before pasting a hash anywhere).**
> A bcrypt hash looks like `$2a$12$...`. Many `.env` loaders treat `$...`
> as a variable reference and silently destroy the value — the classic
> symptom is *login rejects the correct password*.
> - **Vercel dashboard:** paste the **raw** hash. Vercel does no expansion.
> - **Local `.env`:** use the **escaped** form (every `$` written as `\$`)
>   that `npm run hash-password` prints for local use.
> The app additionally unescapes `\$` defensively before comparing, so the
> escaped form works even if pasted into Vercel by mistake.

A ready-to-copy template with these notes lives in `.env.example`.
Never commit a filled-in `.env`, and never send the password or the hash
through chat — the hash is a password equivalent for offline guessing, so
treat both as secrets.

---

## Local development

Prerequisites: Node.js 20+, a PostgreSQL database (a free Neon project is
the easiest — the same one can serve local dev and production, or make a
second Neon branch for dev).

```bash
npm install

# 1. Configure env
cp .env.example .env        # then fill in real values (see table above)
npm run hash-password       # generates ADMIN_PASSWORD_HASH

# 2. Create the tables and file Match #002
npx prisma migrate deploy
npm run db:seed

# 3. Run
npm run dev                 # http://localhost:3000
```

Useful scripts: `npm run build` (production build), `npm run typecheck`,
`npm run db:push` (schema prototyping only — prefer migrations),
`npm run db:seed` (idempotent; safe to re-run).

The admin panel is at `/admin` (redirects to `/admin/login`). It is not
linked anywhere on the public site.

---

## Deploying to Vercel (step by step)

1. **Push this project to a Git repository** (GitHub is the smoothest path
   with Vercel). Make sure `.env` is *not* committed — it is gitignored.
2. **Create the database.** Go to [neon.tech](https://neon.tech), create a
   project (or add one from the Vercel Marketplace: Vercel project →
   Storage → Create → Neon). Copy the **pooled** connection string.
3. **Create the Blob store.** In the Vercel project: **Storage → Create →
   Blob**. Note its read-write token (Storage → the store → `.env.local`
   tab shows `BLOB_READ_WRITE_TOKEN`).
4. **Import the repo into Vercel** (Add New → Project). Framework preset
   auto-detects as Next.js; no build settings need changing — the build
   command already runs `prisma generate` first.
5. **Set the environment variables** (Project → Settings → Environment
   Variables, Production scope): `DATABASE_URL`, `DIRECT_URL`,
   `AUTH_SECRET`,
   `ADMIN_USERNAME`, `ADMIN_PASSWORD_HASH` (raw hash, no backslashes),
   `BLOB_READ_WRITE_TOKEN`. Generate `AUTH_SECRET` with
   `openssl rand -base64 32` and the password hash with
   `npm run hash-password` (run it locally before deploying).
6. **Deploy.** Let the first deployment finish.
7. **Create the tables and seed**, from your machine, pointing at the
   production database:
   ```bash
   DATABASE_URL="<production pooled string>" npx prisma migrate deploy
   DATABASE_URL="<production pooled string>" npm run db:seed
   ```
   (Or temporarily put the production `DATABASE_URL` and `DIRECT_URL`
   in your local `.env` and run the two commands plainly. Prisma runs
   migrations over `DIRECT_URL` automatically when it is set.)
8. **Verify.** Open the site — Match #002 is on the record. Open `/admin`,
   sign in with your username and password, and file a test edit to confirm
   the panel round-trips. Then delete the test change if you made one.

Redeploys afterwards are automatic on git push. New schema changes: create
them locally with `npx prisma migrate dev --name <change>`, commit the new
folder under `prisma/migrations/`, and run `prisma migrate deploy` against
production as in step 7.

---

## Setting and changing the admin password

There is exactly one admin account and no user table — the credentials are
the `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` environment variables.

**First time:** decide a username, run `npm run hash-password`, type a long
password (a password manager's generated 20+ characters is ideal), and set
both variables wherever the app runs.

**Changing the password:** run `npm run hash-password` again with the new
password and replace `ADMIN_PASSWORD_HASH` in Vercel (Settings →
Environment Variables), then redeploy (or wait for the next deployment —
env changes apply to new deployments). Existing sessions stay valid until
they expire (7 days) or the browser cookie is cleared; changing
`AUTH_SECRET` at the same time invalidates every session immediately —
do both if you ever suspect the password leaked.

**Never** put the plaintext password in code, in the seed, in this README,
or in a chat message. If it is ever exposed, change it as above.

---

## Adding the first achievement

1. Sign in at `/admin`.
2. **Add achievement** (dashboard button or nav).
3. **Match info** — the next free match number (the seed used #002, so the
   next new series is #003), date, opponent guild name, their verified
   YouTube channel URL if you have one (leave empty otherwise — no channel
   bar appears), mode, map.
4. **Series result** — WIN/LOSS, format (BO1/BO3/BO5), final score
   (`2 – 1` style, SYNDICATE first).
5. **Card line** — keep the house pattern for consistency:
   `Went the distance — SYNDICATE beat [OPPONENT].`
   The form shows the pattern and can fill it with the current opponent in
   one click. Only the opponent name changes between cards.
6. **Games & screenshots** — one row per game in order: both scores, the
   result (pre-picked from the scores, overridable), and the game's result
   screenshot — upload the file (JPG/PNG/WebP, up to 8 MB) or paste an
   image URL. Add/remove rows as the series went; the format caps the
   count (BO3 → 3).
7. **Save.** Validation messages appear under any field that needs fixing;
   on success you land back on the dashboard with a confirmation banner,
   and the achievement is already live on the public site.

Editing works the same way from the list's **Edit** button. **Delete**
first shows the full record — thumbnail, scoreline, every game — and asks
for a second, explicit confirmation; there is no undo.

---

## How the admin panel is protected

The panel is built on the assumption that attackers know it exists —
obscurity is not one of the layers.

1. **Middleware gate.** Every `/admin/*` page request without a valid
   session is redirected to `/admin/login` at the edge; every
   `/api/admin/*` call without a session gets a hard `401`.
2. **Server-side re-checks (defense in depth).** Every admin page, every
   server action, and the upload handler each verify the session again on
   the server. Guessing a URL or invoking an action directly, bypassing
   the UI, achieves nothing without the session cookie.
3. **Single account, no registration.** There is no sign-up flow, no user
   table, and no default credentials anywhere in code or seed. The one
   account exists only as environment variables.
4. **Passwords are bcrypt hashes.** The plaintext is never stored or
   logged; comparison is bcrypt's constant-time compare. Sessions are
   signed JWTs in an httpOnly cookie (Auth.js), signed with `AUTH_SECRET`.
5. **Login throttling.** Repeated failed logins for the same
   username + IP are locked out for a window (see `lib/rate-limit.ts` for
   the exact policy and its honest limits), and every failure — wrong
   username, wrong password, lockout — returns the *same* generic error,
   so the form cannot be used to probe which field was wrong.
6. **Input validation.** All writes pass through Zod schemas
   (`lib/validation.ts`): allowed values for result/format, score ranges,
   game-count rules per format, URL checks. Duplicate match numbers are
   rejected with a clear message.
7. **Upload validation.** Screenshots are checked for type (JPG/PNG/WebP)
   and size (max 8 MB) before storage, land in Blob under a namespaced
   path with a random suffix, and filenames are never trusted as paths.
8. **Indexing exclusion.** `/admin` and `/api` are disallowed in
   `robots.txt`, and admin pages carry `noindex` metadata.
9. **Security headers** on all responses (content-type sniffing, framing,
   referrer policy, permissions policy, HSTS) via `next.config.ts`.

---

## Troubleshooting

**Login rejects the correct password.**
Almost always the `$` problem: the hash in the environment was mangled by
variable expansion. Locally, use the escaped form (`\$`) from
`npm run hash-password`. In Vercel, paste the raw hash and confirm no
backslashes crept in. Also confirm `ADMIN_USERNAME` matches exactly
(it is case-sensitive) and that the deployment was rebuilt after the env
change.

**`UntrustedHost` errors from Auth.js locally.**
Set `AUTH_TRUST_HOST=true` in `.env` when running `next start` outside
Vercel.

**The public site shows the empty state ("No achievements on record yet").**
The app could not read the database (or it is genuinely empty). Check that
`DATABASE_URL` is set and correct, that migrations have run
(`npx prisma migrate deploy`), and that the seed or at least one
achievement exists. The server log prints the underlying read error.

**Uploads return "Uploads are not configured".**
`BLOB_READ_WRITE_TOKEN` is missing in that environment. Add it from the
Blob store's settings, or use pasted image URLs meanwhile.

**A screenshot URL shows a broken image.**
The URL must be publicly reachable and a direct image link (not a viewer
page). Seed screenshots live under `/seed/...` and always work.

**Prisma errors about engines during local install on restricted
networks.** Prisma downloads engine binaries on install; on networks that
block its CDN, install with `npm install` on an unrestricted connection
once — the engines are cached in `node_modules` afterwards. Deployments on
Vercel are unaffected.

**Changed an env var but nothing changed.**
Environment variable changes apply to *new* deployments. Redeploy (Vercel →
Deployments → Redeploy) after editing them.
