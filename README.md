
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

## Setup from GitHub (Step-by-step)

Follow these steps to get the project running on a new machine.

Prereqs

- Install Node.js LTS (18.x or 20.x recommended)
- Install Git

1. Clone the repository

```cmd
cd /d C:\path\to\your\workspace
git clone https://github.com/KarthikMohan7639/cronbaytask.git
cd cronbaytask\marketplace-app
```

2. Install dependencies (frontend and backend)

```cmd
:: Frontend (Next.js) deps
npm install

:: Backend (Express API) deps
cd server
npm install
cd ..
```

3. Run the app

Option A — single command (starts backend and frontend together):

```cmd
npm run dev:all
```

Option B — two terminals:

Terminal 1 (backend)

```cmd
cd server
npm start
```

Terminal 2 (frontend)

```cmd
npm run dev
```

4. Open the app

- Frontend: <http://localhost:3000>
- API: <http://localhost:5000/api/health>

Notes

- The frontend proxies `/api/*` to `http://localhost:5000` (see `next.config.js`).
- If ports 3000 or 5000 are in use, stop the other process or change the ports (API: set `PORT` before starting the server; Frontend: run `next dev -p 3001`).
- Data persists in `server/db.json`. If you want a fresh start, stop the server and delete or edit that file.

Optional: Quick backend sanity test

```cmd
node server\smoke.js
```

This spins up the API on a test port, creates a job, places bids, waits for auto-close, and prints “Smoke test PASSED” on success.
