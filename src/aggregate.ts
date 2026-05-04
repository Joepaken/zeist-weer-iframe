/**
 * Centrale aggregator. Fetched alle bronnen parallel, vangt fouten per
 * bron op, vult een in-memory cache. Wordt aangeroepen door:
 *   - de 10-min background-refresh loop in server.ts
 *   - lazy fallback in /api/weer.json als de cache leeg/oud zou zijn
 */

import { fetchAirQuality, fetchWeather } from './sources/openMeteo.js';
import { fetchBuienradarStation } from './sources/buienradar.js';
import type { WeerSnapshot } from './types.js';

export interface AggregatorConfig {
  lat: number;
  lon: number;
  buienradarStation: number;
  refreshIntervalMs: number;
}

async function settle<T>(
  _label: string,
  p: Promise<T>,
): Promise<{ data: T | null; error: string | null }> {
  try {
    const data = await p;
    return { data, error: null };
  } catch (err) {
    return {
      data: null,
      error: err instanceof Error ? err.message : String(err),
    };
  }
}

export async function aggregate(cfg: AggregatorConfig): Promise<WeerSnapshot> {
  const startMs = Date.now();
  const errors: Array<{ source: string; message: string }> = [];

  const [weatherR, airR, brR] = await Promise.all([
    settle('weather', fetchWeather(cfg.lat, cfg.lon)),
    settle('air-quality', fetchAirQuality(cfg.lat, cfg.lon)),
    settle('buienradar', fetchBuienradarStation(cfg.buienradarStation)),
  ]);

  if (weatherR.error) errors.push({ source: 'weather', message: weatherR.error });
  if (airR.error) errors.push({ source: 'air-quality', message: airR.error });
  if (brR.error) errors.push({ source: 'buienradar', message: brR.error });

  const fetchedAtMs = Date.now();
  return {
    weather: weatherR.data,
    airQuality: airR.data,
    buienradar: brR.data,
    _meta: {
      fetchedAt: new Date(fetchedAtMs).toISOString(),
      fetchedAtMs,
      nextRefreshAtMs: fetchedAtMs + cfg.refreshIntervalMs,
      refreshIntervalMs: cfg.refreshIntervalMs,
      errors,
      durationMs: fetchedAtMs - startMs,
    },
  };
}

class SnapshotCache {
  private snapshot: WeerSnapshot | null = null;

  get(): WeerSnapshot | null {
    return this.snapshot;
  }

  set(snap: WeerSnapshot): void {
    this.snapshot = snap;
  }

  isStale(now = Date.now()): boolean {
    if (!this.snapshot) return true;
    return now > this.snapshot._meta.nextRefreshAtMs;
  }
}

export const cache = new SnapshotCache();
