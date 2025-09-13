# Job Marketplace (Next.js + Ant Design + Node/Express)

Full-stack demo of a contracts/jobs auction marketplace.

## Features

- Home: 10 newest jobs and top 10 most active open jobs
- New Job: post a job with description, requirements, poster name/contact, expiration
- Job Detail: see details, countdown/time remaining, lowest bid, bids count, and place bids
- Backend auto-closes expired jobs and marks the lowest bid as winner

## Run locally

Option A — one command (starts backend and Next.js together):

```cmd
cd /d f:\ReactProjects\CronbayTask\marketplace-app
npm install
npm run dev:all
```

Option B — separate terminals:

Backend

```cmd
cd /d f:\ReactProjects\CronbayTask\marketplace-app\server
npm install
npm start
```

Frontend (Next.js)

```cmd
cd /d f:\ReactProjects\CronbayTask\marketplace-app
npm install
npm run dev
```

The frontend proxies `/api/*` to `http://localhost:5000` via `next.config.js` rewrites.

## API quick reference

- POST `/api/jobs` – create job { title?, description, requirements, posterName, posterContact, expiresAt }
- GET `/api/jobs?sort=publishedAt:desc&limit=10` – list jobs with stats
- GET `/api/jobs/active?limit=10` – list most active open jobs
- GET `/api/jobs/:id` – get single job with stats
- GET `/api/jobs/:id/bids` – list bids sorted by amount/time
- POST `/api/jobs/:id/bids` – place bid { amount }

Data is stored in `server/db.json` using lowdb for simplicity.
