Job Aggregation Infrastructure - Quick Start
============================================

SETUP
-----

1. Install dependencies (already done):
   npm install axios rss-parser slugify

2. Set environment variables in .env.production or .env.development:
   RAPIDAPI_KEY=your_api_key_here
   JWT_SECRET=your_jwt_secret

3. Database migration (first time):
   The new compound index on Job model will be created automatically
   when the app starts (MongoDB creates indexes on model initialization).

FILES CREATED
-------------

Core Services:
  server/src/services/linkedinService.ts        - LinkedIn Jobs API integration
  server/src/services/wellfoundService.ts       - Wellfound feed aggregator
  server/src/services/hackerNewsService.ts      - HN "Who is Hiring" scraper
  server/src/services/upworkService.ts          - Upwork RSS feed parser
  server/src/services/jobAggregationService.ts  - Central orchestrator
  server/src/services/aggregationTypes.ts       - Shared TypeScript types

Controller:
  server/src/controllers/aggregationController.ts - HTTP endpoints

Documentation:
  server/src/services/AGGREGATION.md            - Comprehensive docs

MODEL CHANGES
-------------

Updated: server/src/models/Job.ts

New fields:
  - sourceUrl: string                    # Original job platform URL
  - externalId: string                   # Platform job ID for deduplication
  - fetchedAt: Date                      # When aggregator fetched it
  - isAggregated: boolean (default: false) # True if auto-fetched

New index:
  { externalId: 1, platform: 1 }         # unique: true, sparse: true
  Prevents duplicate jobs per platform per user

USAGE EXAMPLES
--------------

1. Programmatic (Node.js):
   
   import { aggregateJobsInParallel } from './services/jobAggregationService';
   
   const result = await aggregateJobsInParallel({
     sources: ['linkedin', 'upwork', 'hackernews', 'wellfound']
   });
   
   console.log(`${result.success.length} new jobs`);
   result.errors.forEach(e => console.error(`${e.source}: ${e.error}`));

2. HTTP API (POST):
   
   curl -X POST http://localhost:3000/api/aggregation/aggregate \
     -H "Authorization: Bearer $TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"parallel": true}'
   
   Response:
   {
     "success": true,
     "jobsAggregated": 45,
     "jobsCreated": 38,
     "jobsDuplicated": 7,
     "errors": [],
     "timestamp": "2026-05-08T07:12:00Z"
   }

3. Get aggregated jobs (GET):
   
   curl http://localhost:3000/api/aggregation/aggregated \
     -H "Authorization: Bearer $TOKEN"
   
   Response:
   {
     "count": 38,
     "jobs": [ { ... }, { ... } ]
   }

DATA FLOW
---------

                    ┌─────────────────────────────────────┐
                    │  Job Aggregation Request (HTTP/API) │
                    └──────────────┬──────────────────────┘
                                   │
                    ┌──────────────▼──────────────┐
                    │  jobAggregationService      │
                    │  (Sequential or Parallel)   │
                    └──────────┬────────┬────────┬┴───────────┐
                               │        │        │            │
        ┌──────────────────────┘        │        │            │
        │                              │        │            │
   ┌────▼───────────┐   ┌──────────────▼─┐  ┌──▼────────┐  ┌─▼──────────┐
   │ LinkedIn API   │   │ Wellfound JSON │  │ HN API    │  │ Upwork RSS │
   │ (RapidAPI)     │   │ (w/ Retry)     │  │ (Scrape)  │  │ (Parser)   │
   └────┬───────────┘   └────────┬───────┘  └────┬──────┘  └─┬──────────┘
        │                        │               │           │
        └────────────────────────┼───────────────┼───────────┘
                                 │
                      ┌──────────▼─────────────┐
                      │ Normalize to           │
                      │ AggregatedJobData      │
                      └──────────┬─────────────┘
                                 │
                      ┌──────────▼─────────────┐
                      │ Check for duplicates   │
                      │ (externalId + platform)
                      └──────────┬─────────────┘
                                 │
                      ┌──────────▼─────────────┐
                      │ Save to MongoDB        │
                      │ (Job collection)       │
                      └──────────┬─────────────┘
                                 │
                      ┌──────────▼─────────────┐
                      │ Return summary to user │
                      │ (count, errors, etc)   │
                      └────────────────────────┘

PLATFORM-SPECIFIC DETAILS
--------------------------

LinkedIn (linkedinService.ts):
  • Uses RapidAPI endpoint: linkedin-jobs-search.p.rapidapi.com
  • Searches 3 queries in parallel:
    - React Native developer
    - MERN stack developer
    - React Node.js developer
  • All searches filtered to remote only
  • Returns: ~30 jobs total
  • Error: 429 rate limit (manual retry needed)

Wellfound (wellfoundService.ts):
  • Uses public JSON feeds (no auth needed)
  • Fetches 2 role categories:
    - Mobile Developer (remote)
    - Full-Stack Engineer (remote)
  • Auto-retries 429 errors with 60s delay
  • Returns: equity/salary info, startup funding
  • Returns: ~20 jobs total

HackerNews (hackerNewsService.ts):
  • Finds current month's "Who is hiring" thread
  • Scrapes first 100 comments
  • Filters for: (React OR Node OR MERN OR mobile) AND remote
  • Parses company name, salary, location
  • Rate-limited: 500ms between batches
  • Returns: ~50 jobs total

Upwork (upworkService.ts):
  • Parses public RSS feeds (no auth needed)
  • Searches 3 queries:
    - React Native
    - MERN Stack
    - React Native Developer ($1000+ budget)
  • Returns: title, budget, country
  • Returns: ~30 jobs total

TOTAL EXPECTED: ~100-150 fresh jobs per aggregation run

DEDUPLICATION STRATEGY
----------------------

Job uniqueness = (externalId, platform) pair

For each platform:
  - LinkedIn: result.id (fallback: slugified title+company)
  - Wellfound: result.id
  - HackerNews: comment ID
  - Upwork: guid or link

The MongoDB compound index ensures no duplicate jobs are inserted
for the same user, platform, and external ID.

NEXT STEPS (RECOMMENDED)
------------------------

1. Mount aggregationController in main app routes:
   
   // In server/src/createApp.ts or routes config:
   app.use('/api/aggregation', aggregationController);

2. Test endpoints:
   npm run dev
   # Then test /api/aggregation/aggregate endpoint

3. Add scheduled aggregation (optional):
   Use node-cron to run aggregateJobsInParallel() every 6 hours

4. Add job scoring:
   Run jobsAIService.scoreJobWithClaude() on newly aggregated jobs

5. Add notifications:
   Send user email digest of top-scoring aggregated jobs
