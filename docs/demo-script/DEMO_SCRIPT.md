# ProposalAgent — 3-minute demo script

**Audience:** prospect or investor  
**Goal:** guest → sign up → one AI action (generate a proposal)  
**Timing:** ~3 minutes

---

## URLs (production)

| What | URL |
|------|-----|
| **Web app (Vercel)** | `https://proposalagent-web.vercel.app` |
| **API (Railway)** | `https://proposalagentapp-production.up.railway.app` |

> These match the repo’s deployment docs (`apps/web/.env.production` / `VERCEL_DEPLOYMENT_GUIDE.md`). If your live domains differ, substitute yours—**`NEXT_PUBLIC_API_URL` on Vercel must be the Railway API host**, not the web URL.

---

## Script (read timings loosely)

**0:00 — Open as a guest**  
Open the web app: `https://proposalagent-web.vercel.app`. Stay logged out. Show that you can browse **Job matches** (or dashboard preview) without an account.

**0:45 — Pick a job & go to proposals**  
Choose a job and use **Generate AI proposal** (or the flow that lands on **Proposals** with `?jobId=…`). Narrate: *“This is the job we’re answering.”*

**1:15 — Hit the AI action (signup gate)**  
Click **Generate** (or equivalent). The app prompts you to **create a free account**—walk through **inline signup** (name, email, password, company). One line: *“No credit card; three free AI proposals.”*

**2:00 — After signup**  
Confirm you’re still on the **Proposals** view, the same job stays selected, and generation **starts automatically** with a welcome toast—*“Welcome! Generating your first proposal…”*.

**2:30 — Show the output**  
Scroll the **AI-generated proposal**, mention **edit before send** and optional **mark as sent** / follow-ups if you show that screen.

**2:50 — Close**  
One sentence on value: *“From browse → account → first AI proposal in under a minute in production.”* Offer Q&A.

---

## Backup lines (if something breaks)

- **API slow:** “We’re hitting the live Railway API—typical cold start on the first request.”
- **Auth issue:** Confirm `NEXT_PUBLIC_API_URI` / `NEXT_PUBLIC_API_URL` on Vercel points at the Railway API (`https://proposalagentapp-production.up.railway.app`), not the Vercel site.

---

## Optional mobile beat (15s)

Open the mobile app against the same API (`EXPO_PUBLIC_API_URL`), same flow: guest → **Generate** → signup sheet → generate.
