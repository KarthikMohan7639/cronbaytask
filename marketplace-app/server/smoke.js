import axios from 'axios';
import { spawn } from 'child_process';
import dayjs from 'dayjs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-safe __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_PORT = process.env.TEST_PORT || '5050';
const BASE = `http://localhost:${TEST_PORT}/api`;
const api = axios.create({ baseURL: BASE, timeout: 5000 });

async function waitForHealth(maxMs = 15000) {
  const start = Date.now();
  while (Date.now() - start < maxMs) {
    try {
      const r = await api.get('/health');
      if (r.data && r.data.ok) return true;
    } catch (e) {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error('Server did not become healthy in time');
}

async function run() {
  console.log(`Starting server on port ${TEST_PORT}...`);
  const server = spawn(process.execPath, ['index.js'], {
    env: { ...process.env, PORT: TEST_PORT },
    stdio: ['ignore', 'pipe', 'pipe'],
    cwd: __dirname,
  });
  server.stdout.on('data', (d) => process.stdout.write(`[server] ${d}`));
  server.stderr.on('data', (d) => process.stderr.write(`[server-err] ${d}`));

  let cleanupDone = false;
  const cleanup = () => {
    if (cleanupDone) return;
    cleanupDone = true;
    if (!server.killed) {
      server.kill('SIGTERM');
    }
  };
  process.on('exit', cleanup);
  process.on('SIGINT', () => { cleanup(); process.exit(1); });

  await waitForHealth();
  console.log('Server healthy, running smoke steps...');

  const expiresAt = dayjs().add(10, 'second').toISOString();
  console.log('Creating job...');
  const jobRes = await api.post('/jobs', {
    title: 'Test Job',
    description: 'A short test job',
    requirements: 'Do something quick',
    posterName: 'Tester',
    posterContact: 'tester@example.com',
    expiresAt,
  });
  const job = jobRes.data;
  console.log('Created job', job.id);

  console.log('Placing bid 100');
  await api.post(`/jobs/${job.id}/bids`, { amount: 100 });
  console.log('Placing bid 90');
  await api.post(`/jobs/${job.id}/bids`, { amount: 90 });

  console.log('Fetching bids...');
  const bids = (await api.get(`/jobs/${job.id}/bids`)).data;
  console.log('Bids count:', bids.length, 'Lowest:', Math.min(...bids.map((b) => b.amount)));

  console.log('Waiting for auto-close (polling up to 30s)...');
  const deadline = Date.now() + 30000;
  let jobAfter;
  while (Date.now() < deadline) {
    jobAfter = (await api.get(`/jobs/${job.id}`)).data;
    if (jobAfter.status === 'closed') break;
    await new Promise((r) => setTimeout(r, 1000));
  }
  console.log('Status:', jobAfter.status, 'WinnerBidId:', jobAfter.winnerBidId);
  if (jobAfter.status !== 'closed') throw new Error('Job did not auto-close as expected');
  console.log('Smoke test PASSED');
  cleanup();
}

run().catch((err) => {
  const detail = err.response?.data || err.message || String(err);
  console.error('Smoke test failed:', detail);
  process.exit(1);
});
