aggregation-infrastructure
======================================

This folder contains the job aggregation services that automatically fetch jobs from multiple remote job platforms.

ARCHITECTURE
============

The job aggregation system is built with a modular, fault-tolerant design:

1. Individual service files for each platform (linkedinService, wellfoundService, etc.)
2. A central orchestrator (jobAggregationService) that coordinates fetching
3. Shared type definitions (aggregationTypes)
4. Controller endpoints (aggregationController) for HTTP access

SERVICES
========

1. **linkedinService.ts**
   - Fetches from LinkedIn via RapidAPI endpoint
   - Queries: React Native, MERN Stack, React Node.js (remote only)
   - Features:
     * Parallel fetching of 3 search queries
     * Budget extraction via regex patterns
     * Tech stack detection
     * Rate limit handling (429 errors)

2. **wellfoundService.ts**
   - Fetches from Wellfound (formerly AngelList Talent)
   - Sources: Mobile Developer & Full-Stack Engineer roles
   - Features:
     * Handles rate limiting with 60-second retry delay
     * Extracts funding/equity information
     * Remote status detection
     * Startup verification flags

3. **hackerNewsService.ts**
   - Scrapes from "Ask HN: Who is hiring?" monthly threads
   - Features:
     * Finds current month's thread via Algolia API
     * Fetches and parses HN comments
     * Filters for relevant tech keywords (React, Node, MERN, mobile)
     * Extracts company names, salary ranges
     * Rate-limited batch fetching (10 at a time)

4. **upworkService.ts**
   - Parses Upwork RSS feeds (no OAuth needed)
   - Queries: React Native, MERN Stack, React Native Developer (high-budget)
   - Features:
     * RSS parsing with rss-parser package
     * HTML entity decoding
     * Country/location extraction
     * Urgent job detection

ORCHESTRATOR
============

**jobAggregationService.ts**

Provides two main functions:

1. `aggregateJobs(options)` — Sequential fetching
   - Fetches from each source one at a time
   - Better for lower error handling impact
   - Default sources: linkedin, wellfound, hackernews, upwork

2. `aggregateJobsInParallel(options)` — Concurrent fetching
   - Fetches from all sources simultaneously
   - Faster, but one failure doesn't affect others
   - Returns aggregated results with per-source errors

Returns `AggregationResult`:
```typescript
{
  success: AggregatedJobData[]     // Successfully fetched jobs
  errors: Array<{                   // Per-source errors
    source: string
    error: string
  }>
  timestamp: Date                   // When aggregation ran
  totalFetched: number              // Total jobs retrieved
}
```

TYPES
=====

**aggregationTypes.ts** - Shared `AggregatedJobData` interface

All jobs are normalized to this structure:
- platform: "LinkedIn" | "Wellfound" | "HackerNews" | "Upwork"
- title, externalId, snippet, budget, posted
- sourceUrl, client, tags
- urgent, isAggregated, fetchedAt

DATABASE
========

**Job.ts Model Updates**

New fields added:
- `sourceUrl` — Original URL on job platform
- `externalId` — Platform-specific job ID (for deduplication)
- `fetchedAt` — When the aggregator pulled it
- `isAggregated` — Boolean flag (true = auto-fetched, false = manual)

New compound index:
```javascript
{ externalId: 1, platform: 1 } — unique: true, sparse: true
```

This prevents duplicate jobs from the same platform.

CONTROLLER
==========

**aggregationController.ts** - HTTP endpoints

Two endpoints:

1. `POST /api/aggregation/aggregate`
   - Body: `{ parallel?: boolean, sources?: string[] }`
   - Returns: Count of jobs aggregated, created, duplicated
   - Saves jobs to DB (skips duplicates via externalId index)
   - Requires authentication

2. `GET /api/aggregation/aggregated`
   - Returns: Last 100 aggregated jobs for current user
   - Sorted by fetchedAt (newest first)
   - Requires authentication

HELPER FUNCTIONS
================

All services include utility functions for parsing job data:

**Budget Extraction**
- Regex patterns for: $50k-$80k, $75/hr, $100k annually
- Returns formatted string or null

**Tech Tag Extraction**
- Matches against: React, React Native, Node.js, MERN, TypeScript, etc.
- Returns array of detected technologies

**HTML Stripping** (HN & Upwork)
- Removes HTML tags and decodes entities
- Handles: &lt;, &gt;, &quot;, &amp;, &#x27;

**Company Name Parsing** (HN)
- Extracts from first line of comment
- Cleans special characters

ENVIRONMENT VARIABLES
=====================

Required:
- `RAPIDAPI_KEY` — For LinkedIn Jobs API access
- `JWT_SECRET` — For authentication

Optional:
- None (all services have fallbacks or error handling)

RATE LIMITING
=============

- LinkedIn: 429 errors thrown (caller should retry after 60s)
- Wellfound: Auto-retries up to 3 times with 60s delay between
- HackerNews: 500ms delay between comment batch requests
- Upwork: No rate limiting (RSS feeds are public)

USAGE EXAMPLES
==============

Sequential aggregation:
```typescript
import { aggregateJobs } from './services/jobAggregationService';

const result = await aggregateJobs({
  sources: ['linkedin', 'wellfound']
});
console.log(`Got ${result.success.length} jobs`);
```

Parallel aggregation:
```typescript
const result = await aggregateJobsInParallel({
  sources: ['linkedin', 'wellfound', 'hackernews', 'upwork']
});

result.errors.forEach(e => console.warn(`${e.source}: ${e.error}`));
```

HTTP usage (with authentication):
```bash
curl -X POST http://localhost:3000/api/aggregation/aggregate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"parallel": true, "sources": ["linkedin", "upwork"]}'
```

DEDUPLICATION
=============

Jobs are stored per-user with compound index on (externalId, platform):

- If a job already exists for the user with same externalId and platform,
  the controller skips it (no duplicate)
- The `fetchedAt` timestamp allows filtering for recent aggregations
- `isAggregated` flag distinguishes auto-fetched from manually pasted jobs

FUTURE ENHANCEMENTS
===================

1. Scheduled aggregation (cron jobs every 6 hours)
2. Webhook notifications for new jobs matching user preferences
3. Caching layer to avoid redundant API calls
4. Advanced filtering by tech stack, budget, client rating
5. Integration with Claude for job quality scoring
6. Email digest of best matches
