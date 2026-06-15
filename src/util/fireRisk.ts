/**
 * Indicatief natuurbrandrisico (Sallandse Heuvelrug e.d.).
 *
 * Er is geen schone landelijke API per veiligheidsregio, dus we berekenen
 * — net als de strandvlag in NoordwijkWeerApp — een *indicatief* niveau uit
 * het weer. Lage luchtvochtigheid maakt fijne brandstof (gras, naalden,
 * heide) droog, warmte en wind versterken dat. Altijd gelabeld "indicatief".
 */

import { msToBft } from './beaufort.js';
import type { FireRiskBlock } from '../types.js';

export interface FireRiskInput {
  humidity: number; // %
  temperatureC: number;
  windMs: number;
  recentPrecipMm: number; // neerslag vandaag (mm)
}

const LEVELS: Record<1 | 2 | 3 | 4, { label: string; color: string }> = {
  1: { label: 'Laag', color: '#2BAE66' },
  2: { label: 'Matig', color: '#F5C518' },
  3: { label: 'Hoog', color: '#F07830' },
  4: { label: 'Zeer hoog', color: '#E84313' },
};

export function computeFireRisk(input: FireRiskInput): FireRiskBlock {
  const bft = msToBft(input.windMs).bft;
  let score = 0;

  // Luchtvochtigheid is de belangrijkste driver van brandstofdroogte.
  if (input.humidity < 35) score += 3;
  else if (input.humidity < 50) score += 2;
  else if (input.humidity < 65) score += 1;

  // Warmte droogt verder uit.
  if (input.temperatureC >= 28) score += 2;
  else if (input.temperatureC >= 23) score += 1;

  // Wind verspreidt een eventuele brand.
  if (bft >= 5) score += 2;
  else if (bft >= 4) score += 1;

  // Recente neerslag dempt het risico fors.
  if (input.recentPrecipMm >= 3) score -= 2;
  else if (input.recentPrecipMm >= 0.5) score -= 1;

  let level: 1 | 2 | 3 | 4;
  if (score <= 1) level = 1;
  else if (score <= 3) level = 2;
  else if (score <= 5) level = 3;
  else level = 4;

  const reasons: string[] = [];
  reasons.push(`${Math.round(input.humidity)}% luchtvochtigheid`);
  if (input.recentPrecipMm < 0.5) reasons.push('droog');
  else reasons.push(`${input.recentPrecipMm.toFixed(1)} mm regen vandaag`);
  if (bft >= 4) reasons.push(`wind ${bft} Bft`);

  return {
    level,
    label: LEVELS[level].label,
    color: LEVELS[level].color,
    reasonNL: reasons.join(' · '),
  };
}
