/**
 * Windroos: graden (0 = N, 90 = O, 180 = Z, 270 = W) → 16-punts NL afkorting.
 */

const ROSE_NL = [
  'N',
  'NNO',
  'NO',
  'ONO',
  'O',
  'OZO',
  'ZO',
  'ZZO',
  'Z',
  'ZZW',
  'ZW',
  'WZW',
  'W',
  'WNW',
  'NW',
  'NNW',
];

const ROSE_FULL_NL: Record<string, string> = {
  N: 'noord',
  NNO: 'noordnoordoost',
  NO: 'noordoost',
  ONO: 'oostnoordoost',
  O: 'oost',
  OZO: 'oostzuidoost',
  ZO: 'zuidoost',
  ZZO: 'zuidzuidoost',
  Z: 'zuid',
  ZZW: 'zuidzuidwest',
  ZW: 'zuidwest',
  WZW: 'westzuidwest',
  W: 'west',
  WNW: 'westnoordwest',
  NW: 'noordwest',
  NNW: 'noordnoordwest',
};

export interface CompassInfo {
  short: string;
  full: string;
  deg: number;
}

export function degToCompass(deg: number): CompassInfo {
  const normalized = ((deg % 360) + 360) % 360;
  const idx = Math.round(normalized / 22.5) % 16;
  const short = ROSE_NL[idx]!;
  return {
    short,
    full: ROSE_FULL_NL[short]!,
    deg: Math.round(normalized),
  };
}
