/**
 * Rijkswaterstaat getij-data — DDAPI20 (nieuwe API per 2026).
 *
 * We vragen de astronomische voorspelling op — RWS levert dan ALLE
 * 10-minuten waarden, en wij extraheren zelf de pieken/dalen (HW/LW)
 * uit de tijdreeks. Werkt voor kust- én getijde-rivierstations
 * (Oude Maas, Hollandsche IJssel, Nieuwe Merwede).
 *
 * Zie: https://rijkswaterstaat.github.io/wm-ws-dl/
 */

import type { TideBlock, TideExtreme } from '../types.js';

const DDAPI_URL =
  'https://ddapi20-waterwebservices.rijkswaterstaat.nl/ONLINEWAARNEMINGENSERVICES/OphalenWaarnemingen';

const TIMEOUT_MS = 12000;

interface RwsResponse {
  Succesvol: boolean;
  Foutmelding?: string;
  WaarnemingenLijst?: Array<{
    Locatie?: { Naam?: string; Code?: string };
    MetingenLijst?: Array<{
      Tijdstip: string;
      Meetwaarde?: { Waarde_Numeriek: number };
    }>;
  }>;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Format date in CET-offset ISO that DDAPI accepts: 2026-05-03T00:00:00.000+02:00 */
function toRwsIso(d: Date): string {
  const fmt = new Intl.DateTimeFormat('nl-NL', {
    timeZone: 'Europe/Amsterdam',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  const parts = Object.fromEntries(fmt.formatToParts(d).map((p) => [p.type, p.value])) as Record<
    string,
    string
  >;
  const offsetFmt = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Amsterdam',
    timeZoneName: 'shortOffset',
  });
  const offsetPart =
    offsetFmt.formatToParts(d).find((p) => p.type === 'timeZoneName')?.value ?? 'GMT+1';
  const m = offsetPart.match(/GMT([+-])(\d{1,2})(?::?(\d{2}))?/);
  const sign = m?.[1] ?? '+';
  const oh = m?.[2] ? pad(parseInt(m[2], 10)) : '01';
  const om = m?.[3] ?? '00';
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.000${sign}${oh}:${om}`;
}

export async function fetchTides(stationCode: string): Promise<TideBlock> {
  const now = new Date();
  // Vraag van 2u terug tot 36u vooruit — genoeg voor "next 4 extremes".
  const start = new Date(now.getTime() - 2 * 3600_000);
  const end = new Date(now.getTime() + 36 * 3600_000);

  const body = {
    Locatie: { Code: stationCode },
    AquoPlusWaarnemingMetadata: {
      AquoMetadata: {
        Compartiment: { Code: 'OW' },
        Grootheid: { Code: 'WATHTE' },
        ProcesType: 'astronomisch',
      },
    },
    Periode: {
      Begindatumtijd: toRwsIso(start),
      Einddatumtijd: toRwsIso(end),
    },
  };

  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let data: RwsResponse;
  try {
    const res = await fetch(DDAPI_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': 'buurtapps-weer',
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    if (!res.ok) {
      throw new Error(`RWS HTTP ${res.status}`);
    }
    data = (await res.json()) as RwsResponse;
  } finally {
    clearTimeout(t);
  }

  if (!data.Succesvol) {
    throw new Error(`RWS: ${data.Foutmelding ?? 'onbekende fout'}`);
  }

  const lijst = data.WaarnemingenLijst?.[0]?.MetingenLijst ?? [];
  if (lijst.length === 0) {
    throw new Error('RWS: lege MetingenLijst');
  }

  type Sample = { t: number; lvl: number; iso: string };
  const series: Sample[] = lijst
    .map((m) => ({
      t: Date.parse(m.Tijdstip),
      lvl: m.Meetwaarde?.Waarde_Numeriek ?? NaN,
      iso: m.Tijdstip,
    }))
    .filter((s) => Number.isFinite(s.t) && Number.isFinite(s.lvl))
    .sort((a, b) => a.t - b.t);

  if (series.length < 3) {
    throw new Error('RWS: te weinig samples voor extremenanalyse');
  }

  // Extremen: lokale maxima → HW, lokale minima → LW. Eindpunten weg
  // om randeffecten te voorkomen.
  const rawExtremes: TideExtreme[] = [];
  for (let i = 1; i < series.length - 1; i++) {
    const prev = series[i - 1]!.lvl;
    const cur = series[i]!.lvl;
    const next = series[i + 1]!.lvl;
    if (cur > prev && cur >= next) {
      rawExtremes.push({ type: 'HW', time: series[i]!.iso, levelCmNap: Math.round(cur) });
    } else if (cur < prev && cur <= next) {
      rawExtremes.push({ type: 'LW', time: series[i]!.iso, levelCmNap: Math.round(cur) });
    }
  }

  // Ruis op gedempte binnenwateren (bv. Oude Maas) levert anders meerdere
  // "hoogwaters" vlak na elkaar. Voeg opeenvolgende gelijke types samen
  // (houd de meest extreme) en eis een minimale slag bij type-wissel.
  const MIN_DELTA_CM = 4;
  const extremes: TideExtreme[] = [];
  for (const e of rawExtremes) {
    const last = extremes[extremes.length - 1];
    if (!last) {
      extremes.push(e);
    } else if (e.type === last.type) {
      const moreExtreme =
        e.type === 'HW' ? e.levelCmNap > last.levelCmNap : e.levelCmNap < last.levelCmNap;
      if (moreExtreme) extremes[extremes.length - 1] = e;
    } else if (Math.abs(e.levelCmNap - last.levelCmNap) >= MIN_DELTA_CM) {
      extremes.push(e);
    }
  }

  const nowMs = now.getTime();
  const upcoming = extremes.filter((e) => Date.parse(e.time) >= nowMs).slice(0, 4);

  if (upcoming.length === 0) {
    throw new Error('RWS: geen toekomstige extremen gevonden');
  }

  return {
    station: data.WaarnemingenLijst?.[0]?.Locatie?.Naam ?? stationCode,
    next: upcoming,
  };
}
