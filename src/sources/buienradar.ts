/**
 * Buienradar lokale stations — voor lokale Bft, zonkracht en regenval.
 * Geen API-key nodig.
 *
 * Voor Zeist gebruiken we station 6260 (De Bilt) — direct naast Zeist.
 */

import type { BuienradarBlock } from '../types.js';

const TIMEOUT_MS = 6000;

interface BrStationResponse {
  stationid: number;
  stationname: string;
  timestamp: string;
  windspeedBft: number;
  sunpower: number;
  rainFallLastHour: number;
}

export async function fetchBuienradarStation(stationId: number): Promise<BuienradarBlock> {
  const url = `https://observations.buienradar.nl/1.0/actual/weatherstation/${stationId}`;
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`buienradar HTTP ${res.status}`);
    }
    const data = (await res.json()) as BrStationResponse;
    return {
      stationId: data.stationid,
      stationName: data.stationname,
      windBft: data.windspeedBft ?? 0,
      sunPower: data.sunpower ?? 0,
      rainLastHour: data.rainFallLastHour ?? 0,
      observedAt: data.timestamp,
    };
  } finally {
    clearTimeout(t);
  }
}
