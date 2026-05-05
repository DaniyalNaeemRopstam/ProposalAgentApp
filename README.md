# ProposalAgent

AI-powered client acquisition SaaS for freelance dev agencies. This repository is an npm workspaces monorepo containing the web dashboard, mobile app, API server, and shared packages.

## Structure

| Path | Description |
|------|-------------|
| `apps/web` | Next.js 14 dashboard (App Router, TypeScript, Tailwind CSS) |
| `apps/mobile` | React Native app with Expo and Expo Router |
| `server` | Node.js + Express REST API (TypeScript) |
| `packages/shared` | Shared types, constants, and utilities |
| `packages/ui` | Shared UI (React Native primitives; web uses `react-native-web`) |
| `packages/api-client` | Typed HTTP client for the API |

## Prerequisites

- Node.js 18.18 or newer
- npm 9+ (workspaces)
- MongoDB (local or Atlas) for production-like API usage
- Optional: Expo Go on a device for mobile development

## Setup

1. **Clone and install dependencies**

   ```bash
   cd proposalagent
   npm install
   ```

   The root `postinstall` script compiles workspace libraries in order: `@proposalagent/shared`, `@proposalagent/api-client`, and `@proposalagent/ui`. If you ever skip lifecycle scripts (for example `npm install --ignore-scripts`), run:

   ```bash
   npm run postinstall
   ```

2. **Environment variables**

   Copy the example env file and fill in values:

   ```bash
   cp .env.example .env
   ```

   - **Root `.env`**: shared secrets referenced by tooling if you consolidate later. The **server** and **web** apps read their own env files:
   - `server/.env` — `ANTHROPIC_API_KEY`, `MONGODB_URI`, `JWT_SECRET`, `STRIPE_*`, `FIREBASE_PROJECT_ID`
   - `apps/web/.env.local` — `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

3. **Run the API**

   ```bash
   npm run dev:server
   ```

   Default port: `5000` (override with `PORT` in `server/.env` or root `.env`). If `MONGODB_URI` is omitted, the server uses `mongodb://127.0.0.1:27017/proposalagent` (MongoDB must be running locally or set the URI to Atlas).

4. **Run the web app**

   ```bash
   npm run dev:web
   ```

   Open [http://localhost:3000](http://localhost:3000).

5. **Run the mobile app**

   ```bash
   npm run dev:mobile
   ```

   Follow the Expo CLI prompts to open in iOS Simulator, Android emulator, or Expo Go.

## Workspace scripts

| Script | Description |
|--------|-------------|
| `npm run dev:web` | Next.js dev server |
| `npm run dev:mobile` | Expo dev server |
| `npm run dev:server` | Express API with `tsx` watch |
| `npm run build` | Build all packages that define `build` |

## TypeScript

All apps and packages use TypeScript. Shared domain types live in `packages/shared` and should be imported by the server, web, mobile, and `api-client` where appropriate.

## Production readiness checklist

Before `NODE_ENV=production`:

| Item | Responsibility |
|------|----------------|
| **`CORS_ORIGINS`** | Comma-separated exact HTTPS origins allowed to call the API from a browser (e.g. your Vercel production + preview URLs). Native mobile callers omit `Origin` and ignore this list. Socket.IO shares the same policy. |
| **`APP_WEB_URL`** | Canonical dashboard URL used for Stripe success/cancel/portal redirects. Required in production. |
| **`MONGODB_URI`**, **`JWT_SECRET`**, **`STRIPE_WEBHOOK_SECRET`** | Required at bootstrap; webhook uses `stripe.webhooks.constructEvent` (signature verified). Claude key stays **server-side only** (`ANTHROPIC_API_KEY`; never `NEXT_PUBLIC_*`). |
| **Vercel** | **`NEXT_PUBLIC_API_URL`** → your Railway (or hosted) API; no Claude/Stripe secrets in Next public vars. |
| **`/health`** | Returns **HTTP 200** with `{ status, version, timestamp }` for probes. |

There is **no multipart image upload endpoint** today; payloads are capped by **`JSON_BODY_LIMIT`** (default `1mb`). Profile fields (**`avatar`, `voiceProfile`**) use Zod `max(...)` guards.

⚠️ `ProposalAgent_MVP.jsx` in the repo root is a standalone prototype sketch (calls Anthropic from the browser) — **exclude it from shipped frontends.**

## Deployment

See also **Production readiness** above for environment variables (`CORS_ORIGINS`, `APP_WEB_URL`, etc.).

### Backend — Railway

The API Docker image must be built from the **repository root** (not `server/`), because the server workspace depends on `packages/shared`.

1. In Railway: attach the repo, set **Root Directory** to the monorepo root (`.`).
2. Set **Dockerfile path** → `server/Dockerfile` (or env `RAILWAY_DOCKERFILE_PATH=server/Dockerfile`).
3. Define env vars in Railway (MongoDB, JWT, Stripe, Anthropic, etc.). `server/.env.production` only documents baseline `NODE_ENV` / `PORT`.

Health check route: **`GET /health`** → `{ "status": "ok", "version": "1.0.0", "timestamp": ... }`.

```bash
# Deploy backend (Railway CLI; link project interactively first)
cd server && railway up
```

### Web — Vercel

`apps/web/vercel.json` matches Next defaults. Because this repo is a workspace:

- Prefer Vercel **Root Directory** = repository root with **Install Command** `npm install` (or `npm ci`) and **Build Command** `npm run build -w web`, **Output directory** `.next` from `apps/web` (adjust in Vercel UI as needed); or  
- Root Directory = **`apps/web`** with **Install Command** `cd ../.. && npm ci` so workspace packages resolve.

Set `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, etc. under Vercel → Environment Variables. See `apps/web/.env.production` for placeholders.

```bash
cd apps/web && vercel --prod
```

### Mobile — Expo EAS

Ensure `eas.json`, `app.json` / `app.config.js`, and `apps/mobile/assets/icon.png` are present. Provide `EXPO_PUBLIC_API_URL` for production builds (`eas secret:create` / EAS env).

```bash
cd apps/mobile
eas build --platform ios --profile production
eas build --platform android --profile production

# Submit to stores (after configuring credentials / App Store Connect)
eas submit --platform ios
eas submit --platform android
```
