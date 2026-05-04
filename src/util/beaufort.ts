/**
 * Beaufort-schaal: m/s wind → Bft 0..12 + Nederlandse omschrijving.
 * Officiële WMO-grenzen.
 */

const BFT_TABLE: Array<{ max: number; bft: number; nl: string }> = [
  { max: 0.2, bft: 0, nl: 'Stil' },
  { max: 1.5, bft: 1, nl: 'Zwakke wind' },
  { max: 3.3, bft: 2, nl: 'Zwakke wind' },
  { max: 5.4, bft: 3, nl: 'Matige wind' },
  { max: 7.9, bft: 4, nl: 'Matige wind' },
  { max: 10.7, bft: 5, nl: 'Vrij krachtig' },
  { max: 13.8, bft: 6, nl: 'Krachtig' },
  { max: 17.1, bft: 7, nl: 'Hard' },
  { max: 20.7, bft: 8, nl: 'Stormachtig' },
  { max: 24.4, bft: 9, nl: 'Storm' },
  { max: 28.4, bft: 10, nl: 'Zware storm' },
  { max: 32.6, bft: 11, nl: 'Zeer zware storm' },
  { max: Infinity, bft: 12, nl: 'Orkaan' },
];

export interface BeaufortInfo {
  bft: number;
  nl: string;
  ms: number;
  kmh: number;
}

export function msToBft(ms: number): BeaufortInfo {
  const speed = Math.max(0, ms);
  const row = BFT_TABLE.find((r) => speed <= r.max) ?? BFT_TABLE[BFT_TABLE.length - 1]!;
  return {
    bft: row.bft,
    nl: row.nl,
    ms: Math.round(speed * 10) / 10,
    kmh: Math.round(speed * 3.6),
  };
}
