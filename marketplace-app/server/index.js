import cors from 'cors';
import dayjs from 'dayjs';
import express from 'express';
import { Low } from 'lowdb';
import { JSONFile } from 'lowdb/node';
import { nanoid } from 'nanoid';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

// DB setup
const adapter = new JSONFile('./db.json');
const db = new Low(adapter, { jobs: [], bids: [] });
await db.read();
if (!db.data) db.data = { jobs: [], bids: [] };

// Helpers
function computeJobStats(jobId) {
  const bids = db.data.bids.filter((b) => b.jobId === jobId);
  const bidsCount = bids.length;
  const lowestBid = bidsCount > 0 ? Math.min(...bids.map((b) => b.amount)) : null;
  return { bidsCount, lowestBid };
}

function closeExpiredJobs() {
  const now = dayjs();
  for (const job of db.data.jobs) {
    if (job.status === 'open' && dayjs(job.expiresAt).isBefore(now)) {
      job.status = 'closed';
      const jobBids = db.data.bids.filter((b) => b.jobId === job.id);
      if (jobBids.length > 0) {
        const min = Math.min(...jobBids.map((b) => b.amount));
        const winner = jobBids.find((b) => b.amount === min);
        job.winnerBidId = winner.id;
      }
    }
  }
}

setInterval(async () => {
  closeExpiredJobs();
  await db.write();
}, 10 * 1000);

// Routes
app.get('/api/health', (req, res) => res.json({ ok: true }));

// Create job
app.post('/api/jobs', async (req, res) => {
  const { title, description, requirements, posterName, posterContact, expiresAt } = req.body;
  if (!description || !requirements || !posterName || !posterContact || !expiresAt) {
    return res.status(400).json({ message: 'Missing required fields' });
  }
  if (description.length > 16 * 1024 || requirements.length > 16 * 1024) {
    return res.status(400).json({ message: 'Description/requirements too long' });
  }
  const id = nanoid();
  const job = {
    id,
    title: title?.slice(0, 200) || 'Untitled Job',
    description,
    requirements,
    posterName,
    posterContact,
    publishedAt: new Date().toISOString(),
    expiresAt,
    status: 'open',
  };
  db.data.jobs.push(job);
  await db.write();
  res.status(201).json({ ...job, ...computeJobStats(id) });
});

// List jobs (with simple sorting and limit)
app.get('/api/jobs', async (req, res) => {
  closeExpiredJobs();
  const { sort = 'publishedAt:desc', limit = 50 } = req.query;
  let jobs = [...db.data.jobs];
  const [field, dir] = String(sort).split(':');
  jobs.sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    return dir === 'desc' ? (av > bv ? -1 : 1) : av > bv ? 1 : -1;
  });
  jobs = jobs.slice(0, Number(limit));
  const withStats = jobs.map((j) => ({ ...j, ...computeJobStats(j.id) }));
  res.json(withStats);
});

// Active most bid jobs
app.get('/api/jobs/active', (req, res) => {
  closeExpiredJobs();
  const { limit = 10 } = req.query;
  const openJobs = db.data.jobs.filter((j) => j.status === 'open');
  const augmented = openJobs.map((j) => ({ ...j, ...computeJobStats(j.id) }));
  augmented.sort((a, b) => (b.bidsCount || 0) - (a.bidsCount || 0));
  res.json(augmented.slice(0, Number(limit)));
});

// Single job
app.get('/api/jobs/:id', (req, res) => {
  closeExpiredJobs();
  const job = db.data.jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ message: 'Not found' });
  res.json({ ...job, ...computeJobStats(job.id) });
});

// List bids for a job
app.get('/api/jobs/:id/bids', (req, res) => {
  const bids = db.data.bids.filter((b) => b.jobId === req.params.id);
  bids.sort((a, b) => a.amount - b.amount || new Date(a.createdAt) - new Date(b.createdAt));
  res.json(bids);
});

// Place a bid
app.post('/api/jobs/:id/bids', async (req, res) => {
  const job = db.data.jobs.find((j) => j.id === req.params.id);
  if (!job) return res.status(404).json({ message: 'Job not found' });
  closeExpiredJobs();
  if (job.status !== 'open') return res.status(400).json({ message: 'Bidding closed' });
  const { amount } = req.body;
  const n = Number(amount);
  if (!(n > 0)) return res.status(400).json({ message: 'Invalid amount' });
  const stats = computeJobStats(job.id);
  if (stats.lowestBid != null && n >= stats.lowestBid) {
    return res.status(400).json({ message: `Bid must be lower than current lowest ($${stats.lowestBid.toFixed(2)})` });
  }
  const bid = { id: nanoid(), jobId: job.id, amount: n, createdAt: new Date().toISOString() };
  db.data.bids.push(bid);
  await db.write();
  res.status(201).json(bid);
});

app.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
