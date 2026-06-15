import 'dotenv/config';
import express from 'express';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import { aggregate, getCache, type AggregatorConfig } from './aggregate.js';
import { renderDashboard } from './render.js';
import {
  MUNICIPALITIES,
  getMunicipality,
  allMunicipalities,
  DEFAULT_SLUG,
  type MunicipalityConfig,
} from './municipalities.js';

const PORT = parseInt(process.env.PORT || '3000', 10);
const REFRESH_INTERVAL_MS = parseInt(process.env.REFRESH_INTERVAL_MS || '600000', 10);

function cfgFor(m: MunicipalityConfig): AggregatorConfig {
  return {
    lat: m.lat,
    lon: m.lon,
    buienradarStation: m.buienradarStation,
    refreshIntervalMs: REFRESH_INTERVAL_MS,
    forecastModel: m.forecastModel,
    tideStation: m.tideStation,
    computeFireRisk: m.features.fireRisk,
  };
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const TEMPLATE_PATH = resolve(__dirname, '..', 'templates', 'weer.html.template');

let cachedTemplate: string | null = null;
async function readTemplate(): Promise<string> {
  if (!cachedTemplate) {
    cachedTemplate = await readFile(TEMPLATE_PATH, 'utf-8');
  }
  return cachedTemplate;
}

async function refreshOne(m: MunicipalityConfig, reason: string): Promise<void> {
  try {
    const snap = await aggregate(cfgFor(m));
    getCache(m.slug).set(snap);
    const errCount = snap._meta.errors.length;
    console.log(
      `[refresh:${reason}] ${m.slug} ok in ${snap._meta.durationMs}ms — errors=${errCount}` +
        (errCount > 0 ? ` (${snap._meta.errors.map((e) => e.source).join(', ')})` : ''),
    );
  } catch (err) {
    console.error(`[refresh:${reason}] ${m.slug} FATAAL`, err);
  }
}

async function refreshAll(reason: string): Promise<void> {
  await Promise.all(allMunicipalities().map((m) => refreshOne(m, reason)));
}

/** Cache-hit of lazy aggregate als de cache leeg/oud is. */
async function getSnap(m: MunicipalityConfig) {
  const cache = getCache(m.slug);
  if (!cache.get() || cache.isStale()) {
    try {
      cache.set(await aggregate(cfgFor(m)));
    } catch (err) {
      console.error(`[getSnap] ${m.slug} aggregate error:`, err);
    }
  }
  return cache.get();
}

async function main(): Promise<void> {
  const app = express();
  app.disable('x-powered-by');

  refreshAll('boot').catch((err) => console.error('[refresh] boot', err));
  setInterval(() => {
    refreshAll('interval').catch((err) => console.error('[refresh] interval', err));
  }, REFRESH_INTERVAL_MS);

  const sendJson = async (m: MunicipalityConfig, res: express.Response): Promise<void> => {
    try {
      const snap = await getSnap(m);
      res.set('Content-Type', 'application/json; charset=utf-8');
      res.set('Cache-Control', 'public, max-age=300, stale-while-revalidate=600');
      res.set('Access-Control-Allow-Origin', '*');
      res.send(JSON.stringify(snap ?? null));
    } catch (err) {
      console.error('[api/weer.json]', err);
      res.status(500).json({ error: 'aggregator-error' });
    }
  };

  const sendHtml = async (m: MunicipalityConfig, res: express.Response): Promise<void> => {
    try {
      const tpl = await readTemplate();
      const snap = await getSnap(m);
      const html = renderDashboard(tpl, snap ?? null, m);
      res.set('Content-Type', 'text/html; charset=utf-8');
      res.set('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.set('Pragma', 'no-cache');
      res.set('Expires', '0');
      res.send(html);
    } catch (err) {
      console.error('[weer.html]', err);
      res.status(500).send('template error');
    }
  };

  // ── Per-gemeente routes ──
  app.get('/:slug/api/weer.json', (req, res) => {
    const m = getMunicipality(req.params.slug);
    if (!m) {
      res.status(404).json({ error: 'unknown-municipality' });
      return;
    }
    void sendJson(m, res);
  });

  app.get('/:slug/weer.html', (req, res) => {
    const m = getMunicipality(req.params.slug);
    if (!m) {
      res.status(404).send('Onbekende gemeente');
      return;
    }
    void sendHtml(m, res);
  });

  app.get('/:slug/health', (req, res) => {
    const m = getMunicipality(req.params.slug);
    if (!m) {
      res.status(404).json({ error: 'unknown-municipality' });
      return;
    }
    const snap = getCache(m.slug).get();
    res.json({
      status: 'ok',
      slug: m.slug,
      lastFetch: snap?._meta.fetchedAt ?? null,
      ageMs: snap ? Date.now() - snap._meta.fetchedAtMs : null,
      sources: snap
        ? {
            weather: !!snap.weather,
            airQuality: !!snap.airQuality,
            buienradar: !!snap.buienradar,
            tide: !!snap.tide,
            fireRisk: !!snap.fireRisk,
            errors: snap._meta.errors,
          }
        : null,
    });
  });

  // ── Backward-compat: root = Zeist ──
  const zeist = MUNICIPALITIES[DEFAULT_SLUG]!;
  app.get('/weer.html', (_req, res) => void sendHtml(zeist, res));
  app.get('/api/weer.json', (_req, res) => void sendJson(zeist, res));

  app.get('/health', (_req, res) => {
    res.json({
      status: 'ok',
      uptime: process.uptime(),
      refreshIntervalMs: REFRESH_INTERVAL_MS,
      municipalities: allMunicipalities().map((m) => {
        const snap = getCache(m.slug).get();
        return {
          slug: m.slug,
          lastFetch: snap?._meta.fetchedAt ?? null,
          errors: snap?._meta.errors.length ?? null,
        };
      }),
    });
  });

  app.get('/', (_req, res) => {
    const items = allMunicipalities()
      .map(
        (m) =>
          `<li><a href="/${m.slug}/weer.html">${m.name}</a> — ` +
          `<code>/${m.slug}/weer.html</code> · <code>/${m.slug}/api/weer.json</code></li>`,
      )
      .join('\n');
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(`<!doctype html>
<html lang="nl"><meta charset="utf-8" />
<title>BuurtApps weer-iframes</title>
<style>body{font-family:sans-serif;max-width:680px;margin:40px auto;padding:0 16px;line-height:1.6;color:#2D2D2D}a{color:#E84313}code{background:#f3f3f3;padding:1px 5px;border-radius:4px;font-size:13px}</style>
<h1>BuurtApps — weer-iframes</h1>
<p>Eén deploy, meerdere gemeenten. Refresh elke ${Math.round(REFRESH_INTERVAL_MS / 60_000)} min.</p>
<ul>
${items}
</ul>
<p style="opacity:.6">Root <code>/weer.html</code> = ${zeist.name} (backward-compat).</p>`);
  });

  app.listen(PORT, () => {
    console.log(
      `[server] listening on :${PORT} — ${allMunicipalities().length} gemeenten, refresh=${REFRESH_INTERVAL_MS}ms`,
    );
  });
}

main().catch((err) => {
  console.error('[fatal]', err);
  process.exit(1);
});
