/**
 * WMO weather_code → { iconKey, labelNL }.
 *
 * iconKey komt overeen met de SVG-set in templates/weer.html.template.
 */

export type IconKey =
  | 'clear'
  | 'partly'
  | 'cloudy'
  | 'overcast'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'rain-heavy'
  | 'snow'
  | 'sleet'
  | 'thunder';

export interface WmoInfo {
  iconKey: IconKey;
  labelNL: string;
}

export function wmoToInfo(code: number): WmoInfo {
  if (code === 0) return { iconKey: 'clear', labelNL: 'Onbewolkt' };
  if (code === 1) return { iconKey: 'partly', labelNL: 'Vrijwel onbewolkt' };
  if (code === 2) return { iconKey: 'partly', labelNL: 'Half bewolkt' };
  if (code === 3) return { iconKey: 'overcast', labelNL: 'Bewolkt' };
  if (code === 45 || code === 48) return { iconKey: 'fog', labelNL: 'Mist' };
  if (code === 51) return { iconKey: 'drizzle', labelNL: 'Lichte motregen' };
  if (code === 53) return { iconKey: 'drizzle', labelNL: 'Motregen' };
  if (code === 55) return { iconKey: 'drizzle', labelNL: 'Dichte motregen' };
  if (code === 56 || code === 57) return { iconKey: 'sleet', labelNL: 'IJzel' };
  if (code === 61) return { iconKey: 'rain', labelNL: 'Lichte regen' };
  if (code === 63) return { iconKey: 'rain', labelNL: 'Regen' };
  if (code === 65) return { iconKey: 'rain-heavy', labelNL: 'Zware regen' };
  if (code === 66 || code === 67) return { iconKey: 'sleet', labelNL: 'IJsregen' };
  if (code === 71) return { iconKey: 'snow', labelNL: 'Lichte sneeuw' };
  if (code === 73) return { iconKey: 'snow', labelNL: 'Sneeuw' };
  if (code === 75) return { iconKey: 'snow', labelNL: 'Hevige sneeuw' };
  if (code === 77) return { iconKey: 'snow', labelNL: 'Sneeuwkorrels' };
  if (code === 80) return { iconKey: 'rain', labelNL: 'Lichte buien' };
  if (code === 81) return { iconKey: 'rain', labelNL: 'Buien' };
  if (code === 82) return { iconKey: 'rain-heavy', labelNL: 'Zware buien' };
  if (code === 85 || code === 86) return { iconKey: 'snow', labelNL: 'Sneeuwbuien' };
  if (code === 95) return { iconKey: 'thunder', labelNL: 'Onweer' };
  if (code === 96 || code === 99) return { iconKey: 'thunder', labelNL: 'Onweer met hagel' };
  return { iconKey: 'cloudy', labelNL: 'Wisselvallig' };
}
