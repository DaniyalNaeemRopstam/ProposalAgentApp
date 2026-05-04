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
