/**
 * Strandvlag (kustgemeenten).
 *
 * Strategie (hybrid):
 *   1. Probeer de reddingsbrigade-site te scrapen op een patroon dat de
 *      huidige vlag-kleur prijsgeeft (bestandsnaam, class, alt-tekst).
 *   2. Lukt dat niet, dan berekenen we een _indicatieve_ kleur uit
 *      windsnelheid (Bft) + golfhoogte volgens de gangbare KNRM-criteria.
 *
 * Geport uit NoordwijkWeerApp.
 */

import { msToBft } from '../util/beaufort.js';
import type { BeachFlagBlock, FlagColor } from '../types.js';

const TIMEOUT_MS = 6000;

const FLAG_DESCRIPTIONS: Record<FlagColor, string> = {
  groen: 'Veilig zwemmen, lifeguards aanwezig',
  geel: 'Wees voorzichtig — wind, stroming of golven',
  rood: 'Zwemmen afgeraden — gevaarlijke condities',
  'dubbel-rood': 'Zwemverbod — extreem gevaarlijk',
  'geen-wacht': 'Geen lifeguard op post — zwem op eigen risico',
};

/**
 * Indicatieve vlag uit wind + golfhoogte.
 * Conservatief: kies de strengere (rodere) van de twee criteria.
 */
export function computeFlagFromConditions(
  windMs: number,
  waveHeightM: number,
): { color: FlagColor; bft: number } {
  const bft = msToBft(windMs).bft;

  let windFlag: FlagColor;
  if (bft <= 3) windFlag = 'groen';
  else if (bft <= 5) windFlag = 'geel';
  else if (bft <= 6) windFlag = 'rood';
  else windFlag = 'dubbel-rood';

  let waveFlag: FlagColor;
  if (waveHeightM <= 0.5) waveFlag = 'groen';
  else if (waveHeightM <= 1.0) waveFlag = 'geel';
  else if (waveHeightM <= 1.5) waveFlag = 'rood';
  else waveFlag = 'dubbel-rood';

  const order: FlagColor[] = ['groen', 'geel', 'rood', 'dubbel-rood'];
  const idx = Math.max(order.indexOf(windFlag), order.indexOf(waveFlag));
  return { color: order[idx]!, bft };
}

async function scrapeLiveFlag(url: string): Promise<FlagColor | null> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  let html: string;
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'BuurtApps-WeerWidget/1.0 (+https://buurtapps.nl)',
        Accept: 'text/html',
      },
    });
    if (!res.ok) return null;
    html = await res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(t);
  }

  const lower = html.toLowerCase();

  const patterns: Array<{ re: RegExp; color: FlagColor }> = [
    { re: /vlag[-_]dubbel[-_]rood/, color: 'dubbel-rood' },
    { re: /dubbele?[-_\s]?rode?[-_\s]?vlag/, color: 'dubbel-rood' },
    { re: /vlag[-_]rood/, color: 'rood' },
    { re: /rode[-_\s]vlag/, color: 'rood' },
    { re: /vlag[-_]geel/, color: 'geel' },
    { re: /gele[-_\s]vlag/, color: 'geel' },
    { re: /vlag[-_]groen/, color: 'groen' },
    { re: /groene[-_\s]vlag/, color: 'groen' },
    { re: /geen[-_\s]wacht|geen[-_\s]bewaking|niet[-_\s]bewaakt/, color: 'geen-wacht' },
  ];

  for (const { re, color } of patterns) {
    if (re.test(lower)) return color;
  }
  return null;
}

export async function fetchBeachFlag(opts: {
  url: string;
  windMs: number;
  waveHeightM: number;
}): Promise<BeachFlagBlock> {
  const { color: computedColor, bft } = computeFlagFromConditions(opts.windMs, opts.waveHeightM);
  const live = await scrapeLiveFlag(opts.url);
  const finalColor: FlagColor = live ?? computedColor;
  const source: BeachFlagBlock['source'] = live ? 'reddingsbrigade' : 'indicatief';

  return {
    color: finalColor,
    source,
    description: FLAG_DESCRIPTIONS[finalColor],
    bft,
    waveHeightM: Math.round(opts.waveHeightM * 100) / 100,
  };
}
