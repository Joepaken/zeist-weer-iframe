/**
 * Centrale aggregator. Fetched alle bronnen parallel, vangt fouten per
 * bron op, vult een per-gemeente in-memory cache. Wordt aangeroepen door:
 *   - de 10-min background-refresh loop in server.ts
 *   - lazy fallback in de routes als de cache leeg/oud zou zijn
 */

import { fetchAirQuality, fetchWeather } from './sources/openMeteo.js';
import { fetchBuienradarStation } from './sources/buienradar.js';
import { fetchTides } from './sources/tides.js';
import { computeFireRisk } from './util/fireRisk.js';
import type { WeerSnapshot, TideBlock, FireRiskBlock } from './types.js';

export interface AggregatorConfig {
  lat: number;
  lon: number;
  buienradarStation: number;
  refreshIntervalMs: number;
  /** Open-Meteo model, bv. 'knmi_seamless'. */
  forecastModel?: string;
  /** RWS DDAPI20 station-code; alleen bij getij-gemeenten. */
  tideStation?: string;
  /** Indicatief natuurbrandrisico berekenen. */
  computeFireRisk?: boolean;
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

  const tideTask: Promise<{ data: TideBlock | null; error: string | null }> = cfg.tideStation
    ? settle('tide', fetchTides(cfg.tideStation))
    : Promise.resolve({ data: null, error: null });

  const [weatherR, airR, brR, tideR] = await Promise.all([
    settle('weather', fetchWeather(cfg.lat, cfg.lon, cfg.forecastModel)),
    settle('air-quality', fetchAirQuality(cfg.lat, cfg.lon)),
    settle('buienradar', fetchBuienradarStation(cfg.buienradarStation)),
    tideTask,
  ]);

  if (weatherR.error) errors.push({ source: 'weather', message: weatherR.error });
  if (airR.error) errors.push({ source: 'air-quality', message: airR.error });
  if (brR.error) errors.push({ source: 'buienradar', message: brR.error });
  if (tideR.error) errors.push({ source: 'tide', message: tideR.error });

  // Natuurbrandrisico (indicatief) uit het weer afleiden.
  let fireRisk: FireRiskBlock | null = null;
  if (cfg.computeFireRisk && weatherR.data) {
    const c = weatherR.data.current;
    const today = weatherR.data.daily[0];
    fireRisk = computeFireRisk({
      humidity: c.humidity,
      temperatureC: c.temperature,
      windMs: c.windMs,
      recentPrecipMm: today?.precipitationSum ?? 0,
    });
  }

  const fetchedAtMs = Date.now();
  return {
    weather: weatherR.data,
    airQuality: airR.data,
    buienradar: brR.data,
    tide: tideR.data,
    fireRisk,
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

/** Eén cache per gemeente-slug. */
const caches = new Map<string, SnapshotCache>();

export function getCache(slug: string): SnapshotCache {
  let c = caches.get(slug);
  if (!c) {
    c = new SnapshotCache();
    caches.set(slug, c);
  }
  return c;
}
