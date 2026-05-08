Job Aggregation Architecture Diagram
=====================================

SYSTEM OVERVIEW
===============

                         ┌─────────────────────────────────┐
                         │     User / HTTP Client          │
                         │  (Authenticated with JWT)       │
                         └────────────────┬────────────────┘
                                          │
                         ┌────────────────▼────────────────┐
                         │  Express Controller             │
                         │  /api/aggregation/aggregate     │
                         │  /api/aggregation/aggregated    │
                         └────────────────┬────────────────┘
                                          │
        ┌─────────────────────────────────┴─────────────────────────────────┐
        │                                                                   │
        │              Job Aggregation Service Layer                       │
        │                                                                   │
        ├───────────────────────────────────────────────────────────────────┤
        │                                                                   │
        │  Sequential Mode (aggregateJobs)                                 │
        │  ├─ Fetch from LinkedIn                                          │
        │  ├─ Fetch from Wellfound                                         │
        │  ├─ Fetch from HackerNews                                        │
        │  └─ Fetch from Upwork                                            │
        │     (One at a time, ~20s total)                                  │
        │                                                                   │
        │  OR                                                              │
        │                                                                   │
        │  Parallel Mode (aggregateJobsInParallel)                         │
        │  └─ All 4 services simultaneously (~5s total)                    │
        │                                                                   │
        └───────────────────────────┬───────────────────────────────────────┘
                                    │
                ┌───────────────────┼───────────────────┐
                │                   │                   │
        ┌───────▼────────┐  ┌────────▼──────┐  ┌───────▼──────┐
        │  Result Merge  │  │  Error Track  │  │  Normalize   │
        │  & Validate    │  │  Per-Source   │  │  to Schema   │
        └───────┬────────┘  └────────┬──────┘  └───────┬──────┘
                │                   │                   │
                └───────────────────┼───────────────────┘
                                    │
                        ┌───────────▼──────────────┐
                        │  AggregatedJobData[]     │
                        │  (Unified Schema)        │
                        └───────────┬──────────────┘
                                    │
                        ┌───────────▼──────────────┐
                        │  Deduplication Check     │
                        │  (externalId+platform)   │
                        └───────────┬──────────────┘
                                    │
                        ┌───────────▼──────────────┐
                        │  MongoDB Save            │
                        │  (Job collection)        │
                        └───────────┬──────────────┘
                                    │
                        ┌───────────▼──────────────┐
                        │  Return Summary          │
                        │  (success, errors, count)│
                        └──────────────────────────┘


PLATFORM INTEGRATION DETAILS
=============================

┌──────────────────────────────────────────────────────────────────────────────┐
│                          LINKEDIN SERVICE                                    │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input: 3 Search Queries                                                   │
│  ├─ "React Native developer" + remoteOnly: true                             │
│  ├─ "MERN stack developer" + remoteOnly: true                               │
│  └─ "React Node.js developer" + remoteOnly: true                            │
│                                                                              │
│  API: https://linkedin-jobs-search.p.rapidapi.com/search                   │
│  Auth: X-RapidAPI-Key + X-RapidAPI-Host headers                            │
│  Timeout: 10 seconds                                                        │
│                                                                              │
│  Helper Functions:                                                          │
│  ├─ extractBudget(text)     → Find salary ranges in description             │
│  ├─ extractTechTags(text)   → Match 13 tech keywords                        │
│  └─ slugify(text)           → Generate URL-safe IDs                         │
│                                                                              │
│  Output: 25-35 jobs                                                         │
│  Error Handling: Throw on 429 rate limit, caller must retry                 │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                        WELLFOUND SERVICE                                     │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input: 2 Feed URLs                                                         │
│  ├─ https://wellfound.com/jobs.json?role=mobile-developer&remote=true      │
│  └─ https://wellfound.com/jobs.json?role=full-stack-engineer&remote=true   │
│                                                                              │
│  Transport: axios.get() with 10s timeout                                    │
│  Auth: None (public feeds)                                                  │
│                                                                              │
│  Rate Limit Strategy:                                                       │
│  ├─ Detect 429 status                                                       │
│  ├─ Wait 60 seconds                                                         │
│  └─ Retry (up to 3 times)                                                   │
│                                                                              │
│  Data Extraction:                                                           │
│  ├─ startup.funding     → client.spent field                                │
│  ├─ startup.verified    → client.verified flag                              │
│  ├─ remote: true        → client.country = "🌐 Remote"                      │
│  └─ skills[]            → tags field                                        │
│                                                                              │
│  Output: 15-25 jobs                                                         │
│  Error Handling: Log and continue, return empty array if all fail           │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                     HACKERNEWS SERVICE                                       │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Step 1: Find Thread                                                        │
│  ├─ GET https://hn.algolia.com/api/v1/search                               │
│  ├─ Query: "Ask HN Who is hiring"                                           │
│  ├─ Filter: title includes current month + year (e.g., "May 2026")         │
│  └─ Extract: threadId from objectID                                        │
│                                                                              │
│  Step 2: Get Comment IDs                                                    │
│  ├─ GET https://hacker-news.firebaseio.com/v0/item/{threadId}.json         │
│  └─ Extract: kids[] array (comment IDs)                                    │
│                                                                              │
│  Step 3: Fetch Comments (Batched)                                          │
│  ├─ For first 100 comment IDs (batches of 10)                              │
│  ├─ GET https://hacker-news.firebaseio.com/v0/item/{commentId}.json        │
│  └─ Wait 500ms between batches (rate limit compliance)                     │
│                                                                              │
│  Step 4: Filter & Parse                                                     │
│  ├─ Keep: comments with (React OR Node OR MERN OR mobile) AND remote       │
│  ├─ Extract company name from first line                                    │
│  ├─ Parse salary ranges from body text                                      │
│  └─ Extract tech keywords from description                                  │
│                                                                              │
│  Helper Functions:                                                          │
│  ├─ stripHtml(text)        → Remove HTML entities                           │
│  ├─ parseCompanyName(text) → Extract first line, clean up                   │
│  ├─ extractSalary(text)    → Find $X-$X or $X/hr patterns                   │
│  └─ isRelevantComment()    → Check keyword + remote filters                 │
│                                                                              │
│  Output: 30-60 jobs                                                         │
│  Error Handling: Return empty array if thread not found                     │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────────┐
│                        UPWORK SERVICE                                        │
├──────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  Input: 3 RSS Feed URLs                                                     │
│  ├─ https://upwork.com/ab/feed/jobs/rss?q=react+native&...                 │
│  ├─ https://upwork.com/ab/feed/jobs/rss?q=mern+stack&...                   │
│  └─ https://upwork.com/ab/feed/jobs/rss?q=react+native+dev&budget=1000-    │
│                                                                              │
│  Transport: rss-parser library                                              │
│  Auth: None (public feeds)                                                  │
│  Timeout: 10 seconds per feed                                               │
│                                                                              │
│  Data Extraction from RSS items:                                            │
│  ├─ title              → job.title                                          │
│  ├─ guid or link       → externalId                                         │
│  ├─ content/summary    → snippet + budget extraction                        │
│  ├─ pubDate            → posted date                                        │
│  └─ link               → sourceUrl                                          │
│                                                                              │
│  Helper Functions:                                                          │
│  ├─ stripHtml(html)    → Remove tags, decode entities                       │
│  ├─ extractBudget()    → Parse $X-$X or $X/hr                               │
│  ├─ extractCountry()   → Find country mentions                              │
│  ├─ extractTechTags()  → Match tech keywords                                │
│  └─ urgent check       → title includes "urgent"                            │
│                                                                              │
│  Output: 25-40 jobs                                                         │
│  Error Handling: Skip failed feeds, continue with others                    │
│                                                                              │
└──────────────────────────────────────────────────────────────────────────────┘


DATA FLOW: JOB CREATION
=======================

Raw Job Data from Platform
        │
        ▼
┌──────────────────────────────┐
│ Service-Specific Normalization
│ (budget, tags, company name)
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Map to AggregatedJobData
│ ├─ platform
│ ├─ title
│ ├─ externalId
│ ├─ snippet
│ ├─ budget
│ ├─ posted
│ ├─ sourceUrl
│ ├─ client {name, country, verified}
│ ├─ tags
│ ├─ isAggregated: true
│ └─ fetchedAt
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Check Duplicate
│ Query: {
│   userId,
│   externalId,
│   platform
│ }
└──────────┬───────────────────┘
           │
     ┌─────┴─────┐
     │           │
  Exists?    Not Exists?
     │           │
     │           ▼
     │    ┌──────────────────────────────┐
     │    │ Create Job Document
     │    │ ├─ userId
     │    │ ├─ platform
     │    │ ├─ title
     │    │ ├─ ... (all fields)
     │    │ └─ score: 0 (pending AI eval)
     │    └──────────┬───────────────────┘
     │              │
     │              ▼
     │    ┌──────────────────────────────┐
     │    │ Save to MongoDB
     │    │ Compound index triggers:
     │    │ {externalId:1, platform:1}
     │    │ unique: true, sparse: true
     │    └──────────┬───────────────────┘
     │              │
     └──────┬───────┴─────────┐
            │                 │
       Skipped            Created
      (Duplicate)        (New Job)
            │                 │
            └────────┬────────┘
                     │
                     ▼
            ┌──────────────────────────────┐
            │ Count Statistics
            │ ├─ jobsAggregated: total
            │ ├─ jobsCreated: new
            │ └─ jobsDuplicated: skipped
            └──────────────────────────────┘


AUTHENTICATION FLOW
===================

HTTP Request with Authorization Header
        │
        ▼
┌──────────────────────────────┐
│ Express Middleware: requireAuth
│ ├─ Extract Bearer token
│ ├─ Verify JWT signature
│ └─ Decode: {sub, email}
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Attach to req.user
│ ├─ _id: ObjectId (from sub)
│ └─ email: string
└──────────┬───────────────────┘
           │
           ▼
┌──────────────────────────────┐
│ Controller Handler
│ ├─ Read req.user._id
│ ├─ Fetch jobs for that user
│ ├─ Save with userId reference
│ └─ Return user-scoped results
└──────────────────────────────┘


PERFORMANCE METRICS
===================

Parallel Execution (Recommended):

  LinkedIn      Wellfound     HackerNews     Upwork
  (3-5s)        (2-3s)        (3-5s)         (1-2s)
     │              │              │            │
     └──────────────┬──────────────┬────────────┘
                    │
              (All run simultaneously)
                    │
                    ▼
            Total: ~5 seconds
            Jobs: ~100-150

Sequential Execution:

  LinkedIn → Wellfound → HackerNews → Upwork
  (3-5s)     (2-3s)     (3-5s)      (1-2s)
     └────────────────────────────────────┘
           Total: ~15-20 seconds


ERROR HANDLING STRATEGY
=======================

┌──────────────────────────────────────────────────┐
│         Per-Source Error Collection              │
├──────────────────────────────────────────────────┤
│                                                  │
│  LinkedIn error    ─┐                            │
│  Wellfound error   ─┤                            │
│  HackerNews error  ─┼─→ errors: [{              │
│  Upwork error      ─┤  {source, error},         │
│                    ─┘  {source, error}, ...     │
│                       ]                         │
│                                                  │
│  One source failure ≠ entire aggregation fails  │
│  Returns both successes AND partial failures    │
│                                                  │
└──────────────────────────────────────────────────┘


DEDUPLICATION MECHANISM
=======================

MongoDB Compound Index: {externalId: 1, platform: 1}
Options: { unique: true, sparse: true }

Before Save:
  Query: { userId, externalId, platform }
  ├─ If found → Skip (log duplicate)
  └─ If not found → Save new job

Example:
  Job 1: { userId: abc, externalId: "job-123", platform: "LinkedIn" }
  Job 2: { userId: abc, externalId: "job-123", platform: "LinkedIn" }
         ↑ Would violate unique index

  Job 3: { userId: abc, externalId: "job-123", platform: "Upwork" }
         ↑ Different platform OK (compound key allows)
