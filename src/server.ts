import 'dotenv/config';
import express from 'express';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { aggregate, cache, type AggregatorConfig } from './aggregate.js';
import { renderDashboard } from './render.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const LAT = parseFloat(process.env.LAT || '52.0907');
const LON = parseFloat(process.env.LON || '5.2342');
const BUIENRADAR_STATION = parseInt(process.env.BUIENRADAR_STATION || '6260', 10);
const REFRESH_INTERVAL_MS = parseInt(process.env.REFRESH_INTERVAL_MS || '600000', 10);

const CFG: AggregatorConfig = {
  lat: LAT,
  lon: LON,
  buienradarStation: BUIENRADAR_STATION,
  refreshIntervalMs: REFRESH_INTERVAL_MS,
};

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolve(__dirname, '..', 'templates', 'weer.html.template');

let cachedTemplate: string | null = null;
async function readTemplate(): Promise<string> {
  if (!cachedTemplate) {
    cachedTemplate = await readFile(TEMPLATE_PATH, 'utf-8');
  }
  return cachedTemplate;
}

async function refreshOnce(reason: string): Promise<void> {
  try {
    const snap = await aggregate(CFG);
    cache.set(snap);
    const errCount = snap._meta.errors.length;
    console.log(
      `[refresh:${reason}] ok in ${snap._meta.durationMs}ms — sources errors=${errCount}` +
        (errCount > 0 ? ` (${snap._meta.errors.map((e) => e.source).join(', ')})` : ''),
    );
  } catch (err) {
    console.error(`[refresh:${reason}] FATAAL`, err);
  }
}

async function main(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');

  refreshOnce('boot');
  setInterval(() => {
    refreshOnce('interval').catch((err) => console.error('[refresh] interval', err));
  }, REFRESH_INTERVAL_MS);

  app.get('/health', (_req, res) => {
    const snap = cache.get();
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      refreshIntervalMs: REFRESH_INTERVAL_MS,
      lastFetch: snap?._meta.fetchedAt ?? null,
      ageMs: snap ? Date.now() - snap._meta.fetchedAtMs : null,
      nextRefreshIn: snap ? Math.max(0, snap._meta.nextRefreshAtMs - Date.now()) : null,
      sources: snap
        ? {
            weather: !!snap.weather,
            airQuality: !!snap.airQuality,
            buienradar: !!snap.buienradar,
            errors: snap._meta.errors,
          }
        : null,
    });
  });

  app.get('/api/weer.json', async (_req, res) => {
    try {
      let snap = cache.get();
      if (!snap || cache.isStale()) {
        snap = await aggregate(CFG);
        cache.set(snap);
      }
      res.set('Content-Type', 'application/json; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.set('Access-Control-Allow-Origin', '*');
      res.send(JSON.stringify(snap));
    } catch (err) {
      console.error('[/api/weer.json]', err);
      res.status(500).json({ error: 'aggregator-error' });
    }
  });

  app.get('/weer.html', async (_req, res) => {
    try {
      const tpl = await readTemplate();
      let snap = cache.get();
      if (!snap || cache.isStale()) {
        try {
          snap = await aggregate(CFG);
          cache.set(snap);
        } catch (err) {
          console.error('[/weer.html] aggregate error:', err);
        }
      }
      const html = renderDashboard(tpl, snap ?? null);
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.send(html);
    } catch (err) {
      console.error('[/weer.html] template error:', err);
      res.status(500).send('template error');
    }
  });

  app.get('/', (_req, res) => {
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html>
<html lang="nl"><meta charset="utf-8" />
<title>ZeistApp weer-iframe</title>
<style>body{font-family:sans-serif;max-width:640px;margin:40px auto;padding:0 16px;line-height:1.5;color:#2D2D2D}a{color:#E84313}</style>
<h1>ZeistApp — weer-iframe</h1>
<ul>
  <li><a href="/weer.html">/weer.html</a> — volledig dashboard (iframe-content)</li>
  <li><a href="/api/weer.json">/api/weer.json</a> — geaggregeerde JSON</li>
  <li><a href="/health">/health</a> — health check</li>
</ul>
<p>Locatie: ${LAT}, ${LON} — Buienradar-station: <code>${BUIENRADAR_STATION}</code> — refresh elke ${Math.round(REFRESH_INTERVAL_MS / 60_000)} min.</p>`);
  });

  app.listen(PORT, () => {
    console.log(
      `[server] listening on :${PORT} (lat=${LAT}, lon=${LON}, buienradar=${BUIENRADAR_STATION}, refresh=${REFRESH_INTERVAL_MS}ms)`,
    );
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
