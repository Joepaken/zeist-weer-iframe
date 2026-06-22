/**
 * Indicatieve strandvlag uit wind + golfhoogte.
 *
 * We scrapen NIET (meer) de reddingsbrigade-sites. Die tonen een legenda
 * met álle vlag-kleuren als uitleg, waardoor een naïeve tekst-match altijd
 * de rodste genoemde kleur oppikte → een onterechte "rode vlag" bij mooi
 * zwemweer. De indicatieve berekening uit wind + golf is eerlijk en volgt
 * de echte condities: groen bij rustig weer, rood bij storm.
 *
 * (Mocht een reddingsbrigade ooit een betrouwbaar parseerbare live-status
 * of API bieden, dan kan een echte bron hier weer bij.)
 */

import { msToBft } from '../util/beaufort.js';
import type { BeachFlagBlock, FlagColor } from '../types.js';

const FLAG_DESCRIPTIONS: Record<FlagColor, string> = {
  groen: 'Rustig — weinig wind en lage golven',
  geel: 'Voorzichtig — toenemende wind of golven',
  rood: 'Afgeraden — veel wind of hoge golven',
  'dubbel-rood': 'Gevaarlijk — storm of zeer hoge golven',
  'geen-wacht': 'Geen bewaking',
};

/**
 * Indicatieve vlag uit wind (Bft) + golfhoogte; conservatief de strengere
 * (rodere) van de twee criteria (KNRM-achtige drempels).
 */
function computeFlag(windMs: number, waveHeightM: number): { color: FlagColor; bft: number } {
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

/** Indicatieve strandvlag (bron: wind + golfhoogte). */
export function getBeachFlag(windMs: number, waveHeightM: number): BeachFlagBlock {
  const { color, bft } = computeFlag(windMs, waveHeightM);
  return {
    color,
    source: 'indicatief',
    description: FLAG_DESCRIPTIONS[color],
    bft,
    waveHeightM: Math.round(waveHeightM * 100) / 100,
  };
}
