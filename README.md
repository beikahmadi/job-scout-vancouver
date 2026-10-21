# Job Scout — Vancouver & Beyond

A job discovery dashboard with live provider search, a personal shortlist, and application tracking. Built by **Mehran Beikahmadi** as a full-stack portfolio project.

## Features

- Live remote listings from Remotive without API keys.
- Canadian location search through Adzuna with server-side credentials.
- Keyword search, AI/software/IT/security shortcuts, and posting-age filters.
- Save jobs and track Saved → Applied → Interview → Offer → Closed.
- Export your shortlist as JSON. Browser-local storage; no account required.
- Responsive layout, accessible labels, safe text rendering, restricted static routes, request timeouts, and provider caching.

## Run

Install Node.js **22 or later**, then run:

```sh
npm start
```

Open http://localhost:3000. No dependencies or installation step required. Remotive search loads automatically.

For Canadian jobs, copy `.env.example` to `.env` and enter your own `ADZUNA_APP_ID` and `ADZUNA_APP_KEY` from https://developer.adzuna.com/. Restart the app and choose Canada. Never commit `.env`. Keys remain on the server.

```sh
npm test
```

## Architecture

Browser UI → Node.js HTTP server → Remotive / Adzuna → normalized jobs → dashboard.

The server uses built-in Node APIs; no framework or package dependencies. `src/jobs.mjs` normalizes provider fields, removes duplicate provider IDs, strips markup and rejects unsafe URLs. The server caches provider results for one hour. Remotive is fetched once per cache interval and keyword searches run locally. Adzuna queries cache independently.

## Honest limitations

Remotive jobs are remote, not necessarily open to Canadian applicants. Check location restrictions on each posting. Its feed is delayed by 24 hours; all listings link back to Remotive with visible attribution. Adzuna requires your own account and keys and returns up to 50 recent results per search within 35 km of the chosen Canadian location. Search is not exhaustive and postings can close. This project does not scrape LinkedIn or Indeed, does not send applications, and uses keyword filtering rather than AI ranking.

Shortlists live only in the current browser profile; export them before clearing browser data. Application status is a personal tracker and does not contact employers. The server binds to localhost for personal use. Public hosting requires a deployment configuration plus appropriate authentication, rate limits, and provider quota review. GitHub stores the source; GitHub Pages alone cannot run this server.

## Project files

`server.mjs` — API proxy and static server. `src/jobs.mjs` — data adapters. `public/` — dashboard. `test/` — offline tests, including HTTP routing and provider fixtures.

## Provider documentation

- https://github.com/remotive-com/remote-jobs-api
- https://developer.adzuna.com/docs/search

## Next improvements

Pagination, database persistence with user accounts, optional alerts, and explainable skill matching.
