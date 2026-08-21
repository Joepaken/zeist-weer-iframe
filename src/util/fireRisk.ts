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

// Alleen kleur per niveau; labels en onderbouwing zijn taal-afhankelijk en
// worden in render.ts (via i18n) opgebouwd uit de ruwe velden in het block.
const LEVELS: Record<1 | 2 | 3 | 4, string> = {
  1: '#2BAE66',
  2: '#F5C518',
  3: '#F07830',
  4: '#E84313',
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

  return {
    level,
    color: LEVELS[level],
    humidity: input.humidity,
    recentPrecipMm: input.recentPrecipMm,
    bft,
  };
}
