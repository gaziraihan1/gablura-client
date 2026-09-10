# 🛠️ Developer Guide — Gablura Client

> Everything you need to clone, configure, and run this project locally — without hesitation.

This is the **Gablura client**: a **Next.js 16 (App Router)** application with **React 19, TypeScript, Tailwind CSS v4, TanStack Query, NextAuth.js, and Prisma**. It is **not a standalone frontend** — it talks to a separate backend API (default: `http://localhost:5000`). Auth sessions are managed here via NextAuth with a Prisma adapter backed by PostgreSQL.

- **Live demo:** https://gablura.vercel.app
- **Backend repo:** https://github.com/gaziraihan1/gablura-backend
- **Other docs:** [README.md](./README.md) · [ARCHITECTURE.md](./ARCHITECTURE.md) · [CONTRIBUTING.md](./CONTRIBUTING.md) · [AUTHENTICATION.md](./AUTHENTICATION.md) · [RELEASING.md](./RELEASING.md)

---

## 📋 Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Quick Start (TL;DR)](#2-quick-start-tldr)
3. [Step-by-Step Setup](#3-step-by-step-setup)
4. [Environment Variables](#4-environment-variables)
5. [Backend & Database](#5-backend--database)
6. [Available Scripts](#6-available-scripts)
7. [Testing](#7-testing)
8. [Linting & Formatting](#8-linting--formatting)
9. [Project Structure](#9-project-structure)
10. [Key Conventions](#10-key-conventions)
11. [Troubleshooting](#11-troubleshooting)
12. [Deployment (Vercel)](#12-deployment-vercel)

---

## 1. Prerequisites

| Tool | Version | Why |
|------|---------|-----|
| **Node.js** | **v20 or later** | Runtime for Next.js 16, Prisma, Vitest |
| **npm** | v10+ | Package manager (a `package-lock.json` is committed — use npm, not yarn/pnpm) |
| **Git** | latest | Cloning and version control |
| **PostgreSQL** | any modern version | Local dev database for Prisma/NextAuth (or a free [Supabase](https://supabase.com) project — this is what the dev guides recommend) |
| **Gablura backend** | running on port 5000 | The client depends on it for all business data. See [Section 5](#5-backend--database) |

**Verify your toolchain:**

```bash
node --version   # should print v20.x or higher
npm --version    # should print 10.x or higher
```

---

## 2. Quick Start (TL;DR)

```bash
# 1. Clone
git clone https://github.com/gaziraihan1/focura-client.git gablura-client
cd gablura-client

# 2. Install dependencies (postinstall automatically runs `prisma generate`)
npm install

# 3. Configure environment
cp .env.example .env.local
#    → open .env.local and fill in the values (see Section 4)

# 4. Push the Prisma schema to your database
npx prisma db push

# 5. Start the backend (separate repo, port 5000)
#    https://github.com/gaziraihan1/gablura-backend

# 6. Start the client
npm run dev
# → http://localhost:3000
```

> ⚠️ If you skip step 4, you'll see `PrismaClientInitializationError` on the first page that touches auth. If you skip step 5, most API calls will fail with network errors — the UI loads, but data won't.

---

## 3. Step-by-Step Setup

### 3.1 Clone the repository

```bash
git clone https://github.com/gaziraihan1/focura-client.git gablura-client
cd gablura-client
```

### 3.2 Install dependencies

```bash
npm install
```

Notes:
- A **`postinstall` hook runs `prisma generate`** automatically, so the Prisma client is generated on install. If this fails, you're likely missing environment variables — set `DATABASE_URL` in `.env.local` first (Prisma reads env even at generate time), then run `npx prisma generate` manually.
- Use the committed `package-lock.json` — the `package.json` also pins specific overrides (`immer`, `@testing-library/react` for React 19), so installing with a different package manager can produce a broken dependency tree.

### 3.3 Configure environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in the values — see [Section 4](#4-environment-variables) for a full walkthrough. The file is self-documenting; **`.env.local` is git-ignored — never commit real secrets.**

### 3.4 Prepare the database

The Prisma schema (`prisma/schema.prisma`) targets **PostgreSQL**:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

- **Local Postgres:** create a database, e.g. `gablura_dev`, and set `DATABASE_URL` to `postgresql://postgres:password@localhost:5432/gablura_dev?schema=public`.
- **Supabase (recommended, free):** create a project and copy the connection string from *Project Settings → Database*. Use the **pooled** (port 6543, `pgbouncer=true`) string for `DATABASE_URL` and the **direct** (port 5432) string for `DIRECT_URL` — this makes migrations reliable.

Then sync the schema:

```bash
npx prisma db push        # fastest for local dev
# — or, to apply committed migrations —
npx prisma migrate dev
```

Explore your data any time with:

```bash
npx prisma studio         # opens a GUI at http://localhost:5555
```

### 3.5 Run the backend

The client is a *client* — workspaces, tasks, projects, templates, etc. all come from the Gablura backend API. Clone and start it (it must be listening on the URL you set for `NEXT_PUBLIC_API_URL` / `BACKEND_URL`, typically `http://localhost:5000`):

```bash
git clone https://github.com/gaziraihan1/gablura-backend.git
cd gablura-backend
npm install
cp .env.example .env      # configure the backend's own env vars
npm run dev
# Server running on http://localhost:5000
```

The backend's `NEXTAUTH_SECRET` **must match** the client's — both sides need to encrypt/validate the same session tokens.

### 3.6 Start the dev server

```bash
npm run dev
```

Open **http://localhost:3000**. Sign up with email/password (email verification via SMTP) or Google OAuth (optional — see below).

> **Tip (VS Code):** recommended extensions are *ESLint*, *Prettier*, *Tailwind CSS IntelliSense*, and *Prisma*. The repo ships `.prettierrc.json` and `eslint.config.mjs`, so formatting/linting works out of the box.

---

## 4. Environment Variables

All variables are documented inline in [`.env.example`](./.env.example). Summary:

### Required (the app won't function without these)

| Variable | Example | Purpose |
|----------|---------|---------|
| `NEXT_PUBLIC_API_URL` | `http://localhost:5000` | Backend URL used in **browser-side** Axios calls (baked into the client bundle) |
| `BACKEND_URL` | `http://localhost:5000` | Backend URL used in **server components / NextAuth callbacks** — never use the `NEXT_PUBLIC_` prefix here |
| `NEXTAUTH_SECRET` | *(generate: `openssl rand -base64 32`)* | Session encryption key — **must match the backend's** |
| `NEXTAUTH_URL` | `http://localhost:3000` | Canonical URL of this app (OAuth callbacks) |
| `DATABASE_URL` | `postgresql://...` | Postgres connection string for Prisma |
| `DIRECT_URL` | `postgresql://...` | Direct (non-pooled) connection for migrations/CLI |

### Optional — feature-gated

| Variable | Enables | Get it from |
|----------|---------|-------------|
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Google Sign-In | Google Cloud Console → Credentials → OAuth 2.0 Client. Add `http://localhost:3000/api/auth/callback/google` as an authorized redirect URI |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | Server-side rate limiting & caching | Upstash Console → REST API |
| `EMAIL_SERVER_HOST/PORT/USER/PASSWORD`, `EMAIL_FROM` | Email verification & notifications | Any SMTP provider (e.g. Gmail app password) |
| `CLOUDINARY_*`, `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | Image uploads / avatars | Cloudinary Console |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | Google Analytics 4 | GA Admin → Data Streams |
| `SITE_URL` | Correct sitemap.xml / robots.txt URLs | — (set to your deployment URL) |

> ⚠️ **`NEXT_PUBLIC_*` variables are inlined into the client bundle at build time.** Changing them requires a dev-server restart (and a redeploy in production). Never put secrets in a `NEXT_PUBLIC_*` variable.

> 💡 **Minimum viable run:** if you just want to see the UI, set the four required auth/backend vars plus the two database vars, and leave everything else empty. Google sign-in, uploads, and emails will simply be unavailable.

---

## 5. Backend & Database

This client has **two** persistence surfaces — know which is which:

1. **Backend API (port 5000)** — owns the *product data*: workspaces, projects, tasks, meetings, templates, automations, analytics. The client talks to it via Axios (`lib/axios.ts` on the client, `lib/api/server.ts` on the server) through TanStack Query hooks in `hooks/`.
2. **Local Prisma DB (PostgreSQL)** — used by this Next.js app for **NextAuth** (users, sessions, accounts) and related models. Schema lives in `prisma/schema.prisma`.

Real-time notifications use **SSE + Redis pub/sub** (Upstash) — without Upstash credentials, notifications won't stream, but everything else still works.

---

## 6. Available Scripts

| Script | What it does |
|--------|--------------|
| `npm run dev` | Start the dev server on `http://localhost:3000` (hot reload) |
| `npm run build` | `prisma generate` + production build (`next build`) with a 4 GB Node heap |
| `npm start` | Serve the production build (`next start`) |
| `npm run lint` | Run ESLint (flat config in `eslint.config.mjs`) |
| `npm test` | Run Vitest in watch mode |
| `npm run test:run` | Run the full test suite once (CI mode) |
| `npm run test:coverage` | Run tests with V8 coverage (70% line threshold enforced) |
| `npm run clean` | Delete `.next`, `node_modules`, `.turbo`, and build info (full reset) |

> 🪟 **Windows users:** the `build` script uses the Unix-style inline env syntax `NODE_OPTIONS=--max-old-space-size=4096 next build`, which fails in `cmd.exe`. Either run builds from **Git Bash/WSL**, or set the env var yourself:
>
> ```powershell
> $env:NODE_OPTIONS="--max-old-space-size=4096"; npx prisma generate; npx next build
> ```

---

## 7. Testing

Stack: **Vitest 4 + React Testing Library + jsdom + MSW** (Mock Service Worker intercepts API calls in tests).

```bash
npm test              # watch mode
npm run test:run      # single run
npm run test:coverage # coverage report (text + lcov), 70% lines threshold
```

- Tests live in **`tests/`**, mirroring the source layout (e.g. `tests/components/dashboard/...`).
- Config: [`vitest.config.ts`](./vitest.config.ts) — jsdom environment, globals enabled, path alias `@` → project root, per-test timeout of 20s (some chart/component tests are heavy), coverage limited to `utils/`, `lib/`, `components/`, `hooks/`.
- API mocks are defined with MSW handlers inside the test setup (`tests/setup.ts`).
- **Convention:** when you add a component/hook/util, add a matching test. Coverage below the 70% threshold fails `npm run test:coverage`.

---

## 8. Linting & Formatting

- **ESLint 9** with `eslint-config-next` — run `npm run lint` before committing.
- **Prettier** (`prettier@3`) with the repo's `.prettierrc.json` — format your files before pushing.
- **TypeScript strict mode** is on (`tsconfig.json`). The build will fail on type errors.

---

## 9. Project Structure

```
focura/
├── app/                        # Next.js App Router
│   ├── (public-pages)/         # Marketing, docs, templates, resources, auth-agnostic routes
│   ├── (dashboard-pages)/      # Authenticated dashboard (workspaces, projects, tasks…)
│   ├── authentication/         # Sign-in / sign-up flows
│   ├── api/                    # Route handlers (NextAuth endpoints, webhooks, SSE)
│   ├── layout.tsx              # Root layout (providers, fonts, theme)
│   ├── globals.css             # Tailwind v4 entry + design tokens
│   └── error.tsx / not-found.tsx / loading.tsx
├── components/                 # UI components, organized by feature area
├── hooks/                      # TanStack Query hooks (one domain per file)
├── lib/                        # Core clients & services (axios, prisma, authOptions, email…)
├── context/                    # React context providers
├── constants/                  # Static data & enums
├── types/                      # Shared TypeScript types
├── utils/                      # Pure helpers (heavily unit-tested)
├── prisma/                     # schema.prisma + migrations
├── tests/                      # Vitest suites + setup/polyfills
├── public/                     # Static assets
└── docs at root: README / ARCHITECTURE / CONTRIBUTING / AUTHENTICATION / RELEASING
```

Path alias: **`@/*` maps to the project root** (e.g. `import { useAuth } from '@/hooks/useAuth'`).

---

## 10. Key Conventions

- **Data fetching:** use the existing TanStack Query hooks in `hooks/` — don't call Axios directly in components.
- **Server vs client:** remember `NEXT_PUBLIC_API_URL` (browser) vs `BACKEND_URL` (server components/NextAuth) — picking the wrong one is the #1 source of "works in prod, fails locally" bugs.
- **Styling:** Tailwind CSS v4 + `tw-animate-css`; merge classes with `clsx` + `tailwind-merge`; theme via `next-themes` (light/dark).
- **Forms:** react-hook-form + zod resolvers; reuse existing schemas.
- **Route groups:** public pages go in `app/(public-pages)/`, authenticated pages in `app/(dashboard-pages)/`.
- **MDX allowed:** `pageExtensions` includes `md/mdx` — docs pages can be authored as MDX.
- **Images:** remote hosts must be whitelisted in `next.config.ts` (`remotePatterns`) before `<Image>` will render them.

---

## 11. Troubleshooting

| Symptom | Likely cause & fix |
|---------|-------------------|
| `PrismaClientInitializationError` / `Environment variable not found: DATABASE_URL` | `.env.local` missing or DB not reachable. Create it, run `npx prisma db push`, restart dev server. |
| `@prisma/client did not initialize yet. Please run "prisma generate"` | Run `npx prisma generate` (or reinstall deps so `postinstall` runs). |
| API calls fail with `ECONNREFUSED` / network errors | Backend isn't running on port 5000, or `NEXT_PUBLIC_API_URL`/`BACKEND_URL` are wrong. Start the backend and restart the dev server. |
| Redirected to sign-in immediately / `NEXTAUTH_SECRET` errors | `NEXTAUTH_SECRET` empty or mismatched with the backend's secret. Set the same value on both sides. |
| Google login loops or `redirect_uri_mismatch` | `NEXTAUTH_URL` must match the URL in your browser bar, and Google Console must list `http://localhost:3000/api/auth/callback/google`. |
| `next build` fails with `'NODE_OPTIONS' is not recognized...` | Windows + Unix env syntax in the build script — see the note in [Section 6](#6-available-scripts). |
| Build runs out of memory (`heap out of memory`) | The 4 GB heap is set by the build script; if overridden, use `NODE_OPTIONS=--max-old-space-size=4096`. |
| Env variable changes have no effect | `NEXT_PUBLIC_*` vars are compiled in — restart the dev server (or redeploy). |
| Port 3000 already in use | `npm run dev -- -p 3001` (and update `NEXTAUTH_URL` to match). |
| Tests fail locally but pass for teammates | Run `npm run clean && npm install` for a clean-slate dependency tree. |
| Weird stale behavior after switching branches | Delete the `.next` folder (`rimraf .next` or `npm run clean`) and restart. |

---

## 12. Deployment (Vercel)

The project deploys to **Vercel** out of the box (`vercel.json` is committed).

1. Import the repo into Vercel (framework preset: **Next.js** — defaults are fine).
2. Set **all** environment variables in *Project → Settings → Environment Variables* (everything from `.env.example`; use production URLs for `NEXT_PUBLIC_API_URL`, `BACKEND_URL`, `NEXTAUTH_URL`, `SITE_URL`).
3. Add your production domain to Google OAuth authorized redirect URIs: `https://your-domain/api/auth/callback/google`.
4. Run migrations against the production DB when the schema changes (`npx prisma migrate deploy` — locally or in CI, pointed at `DIRECT_URL`).
5. For image uploads/avatars to render, Cloudinary hostnames are already whitelisted in `next.config.ts`.

Release conventions are described in [RELEASING.md](./RELEASING.md).

---

## ✅ Pre-flight Checklist

Before you open your first PR, make sure all of these pass:

- [ ] `npm run dev` starts without console errors
- [ ] `npm run lint` — no errors
- [ ] `npm run test:run` — all tests green
- [ ] `npx next build` (or `npm run build`) — compiles cleanly
- [ ] No secrets committed — `.env.local` stays out of git

Welcome aboard — happy hacking! 🚀
