/**
 * Internationalisatie voor de weer-widget.
 *
 * De snapshot (cache) is taal-onafhankelijk: hij bewaart ruwe codes
 * (weatherCode, windDir in graden, flag.color, tide-types …). De vertaling
 * gebeurt pas bij het renderen, zodat één cache per gemeente alle talen
 * bedient. NL is en blijft de standaard; EN/DE/PL zijn toevoegingen.
 */

import type { FlagColor } from './types.js';

export type Lang = 'nl' | 'en' | 'de' | 'pl';

export const SUPPORTED_LANGS: Lang[] = ['nl', 'en', 'de', 'pl'];
export const DEFAULT_LANG: Lang = 'nl';

export function isLang(s: string): s is Lang {
  return (SUPPORTED_LANGS as string[]).includes(s);
}

/** Intl-locale per taal (voor tijd/datum-opmaak). TZ blijft Europe/Amsterdam. */
export const LOCALE: Record<Lang, string> = {
  nl: 'nl-NL',
  en: 'en-GB',
  de: 'de-DE',
  pl: 'pl-PL',
};

// ─────────────────────────────────────────────────────────────────────────────
// Weeromschrijving (WMO weather_code → tekst). De NL-waarden zijn 1-op-1 gelijk
// aan wmoIcon.ts zodat de NL-weergave niet verandert. Houd beide in sync.
// ─────────────────────────────────────────────────────────────────────────────

type WeatherKey =
  | 'clear'
  | 'mostlyClear'
  | 'partlyCloudy'
  | 'cloudy'
  | 'fog'
  | 'lightDrizzle'
  | 'drizzle'
  | 'denseDrizzle'
  | 'freezingDrizzle'
  | 'lightRain'
  | 'rain'
  | 'heavyRain'
  | 'freezingRain'
  | 'lightSnow'
  | 'snow'
  | 'heavySnow'
  | 'snowGrains'
  | 'lightShowers'
  | 'showers'
  | 'heavyShowers'
  | 'snowShowers'
  | 'thunder'
  | 'thunderHail'
  | 'variable';

function codeToWeatherKey(code: number): WeatherKey {
  if (code === 0) return 'clear';
  if (code === 1) return 'mostlyClear';
  if (code === 2) return 'partlyCloudy';
  if (code === 3) return 'cloudy';
  if (code === 45 || code === 48) return 'fog';
  if (code === 51) return 'lightDrizzle';
  if (code === 53) return 'drizzle';
  if (code === 55) return 'denseDrizzle';
  if (code === 56 || code === 57) return 'freezingDrizzle';
  if (code === 61) return 'lightRain';
  if (code === 63) return 'rain';
  if (code === 65) return 'heavyRain';
  if (code === 66 || code === 67) return 'freezingRain';
  if (code === 71) return 'lightSnow';
  if (code === 73) return 'snow';
  if (code === 75) return 'heavySnow';
  if (code === 77) return 'snowGrains';
  if (code === 80) return 'lightShowers';
  if (code === 81) return 'showers';
  if (code === 82) return 'heavyShowers';
  if (code === 85 || code === 86) return 'snowShowers';
  if (code === 95) return 'thunder';
  if (code === 96 || code === 99) return 'thunderHail';
  return 'variable';
}

const WEATHER_LABELS: Record<WeatherKey, Record<Lang, string>> = {
  clear: { nl: 'Onbewolkt', en: 'Clear', de: 'Klar', pl: 'Bezchmurnie' },
  mostlyClear: { nl: 'Vrijwel onbewolkt', en: 'Mostly clear', de: 'Überwiegend klar', pl: 'Prawie bezchmurnie' },
  partlyCloudy: { nl: 'Half bewolkt', en: 'Partly cloudy', de: 'Teils bewölkt', pl: 'Częściowe zachmurzenie' },
  cloudy: { nl: 'Bewolkt', en: 'Cloudy', de: 'Bewölkt', pl: 'Pochmurno' },
  fog: { nl: 'Mist', en: 'Fog', de: 'Nebel', pl: 'Mgła' },
  lightDrizzle: { nl: 'Lichte motregen', en: 'Light drizzle', de: 'Leichter Nieselregen', pl: 'Lekka mżawka' },
  drizzle: { nl: 'Motregen', en: 'Drizzle', de: 'Nieselregen', pl: 'Mżawka' },
  denseDrizzle: { nl: 'Dichte motregen', en: 'Dense drizzle', de: 'Dichter Nieselregen', pl: 'Gęsta mżawka' },
  freezingDrizzle: { nl: 'IJzel', en: 'Freezing drizzle', de: 'Gefrierender Nieselregen', pl: 'Marznąca mżawka' },
  lightRain: { nl: 'Lichte regen', en: 'Light rain', de: 'Leichter Regen', pl: 'Lekki deszcz' },
  rain: { nl: 'Regen', en: 'Rain', de: 'Regen', pl: 'Deszcz' },
  heavyRain: { nl: 'Zware regen', en: 'Heavy rain', de: 'Starker Regen', pl: 'Silny deszcz' },
  freezingRain: { nl: 'IJsregen', en: 'Freezing rain', de: 'Gefrierender Regen', pl: 'Marznący deszcz' },
  lightSnow: { nl: 'Lichte sneeuw', en: 'Light snow', de: 'Leichter Schnee', pl: 'Lekki śnieg' },
  snow: { nl: 'Sneeuw', en: 'Snow', de: 'Schnee', pl: 'Śnieg' },
  heavySnow: { nl: 'Hevige sneeuw', en: 'Heavy snow', de: 'Starker Schnee', pl: 'Intensywny śnieg' },
  snowGrains: { nl: 'Sneeuwkorrels', en: 'Snow grains', de: 'Schneegriesel', pl: 'Ziarna śniegu' },
  lightShowers: { nl: 'Lichte buien', en: 'Light showers', de: 'Leichte Schauer', pl: 'Lekkie przelotne opady' },
  showers: { nl: 'Buien', en: 'Showers', de: 'Schauer', pl: 'Przelotne opady' },
  heavyShowers: { nl: 'Zware buien', en: 'Heavy showers', de: 'Starke Schauer', pl: 'Silne przelotne opady' },
  snowShowers: { nl: 'Sneeuwbuien', en: 'Snow showers', de: 'Schneeschauer', pl: 'Przelotne opady śniegu' },
  thunder: { nl: 'Onweer', en: 'Thunderstorm', de: 'Gewitter', pl: 'Burza' },
  thunderHail: { nl: 'Onweer met hagel', en: 'Thunderstorm with hail', de: 'Gewitter mit Hagel', pl: 'Burza z gradem' },
  variable: { nl: 'Wisselvallig', en: 'Changeable', de: 'Wechselhaft', pl: 'Zmiennie' },
};

export function weatherLabel(code: number, lang: Lang): string {
  return WEATHER_LABELS[codeToWeatherKey(code)][lang];
}

// ─────────────────────────────────────────────────────────────────────────────
// Windroos (16-punts) per taal. Index 0 = N, met de klok mee in stappen van 22,5°.
// ─────────────────────────────────────────────────────────────────────────────

const ROSE_SHORT: Record<Lang, string[]> = {
  nl: ['N', 'NNO', 'NO', 'ONO', 'O', 'OZO', 'ZO', 'ZZO', 'Z', 'ZZW', 'ZW', 'WZW', 'W', 'WNW', 'NW', 'NNW'],
  en: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
  de: ['N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
  pl: ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'],
};

const ROSE_FULL: Record<Lang, string[]> = {
  nl: ['noord', 'noordnoordoost', 'noordoost', 'oostnoordoost', 'oost', 'oostzuidoost', 'zuidoost', 'zuidzuidoost', 'zuid', 'zuidzuidwest', 'zuidwest', 'westzuidwest', 'west', 'westnoordwest', 'noordwest', 'noordnoordwest'],
  en: ['north', 'north-northeast', 'northeast', 'east-northeast', 'east', 'east-southeast', 'southeast', 'south-southeast', 'south', 'south-southwest', 'southwest', 'west-southwest', 'west', 'west-northwest', 'northwest', 'north-northwest'],
  de: ['Nord', 'Nordnordost', 'Nordost', 'Ostnordost', 'Ost', 'Ostsüdost', 'Südost', 'Südsüdost', 'Süd', 'Südsüdwest', 'Südwest', 'Westsüdwest', 'West', 'Westnordwest', 'Nordwest', 'Nordnordwest'],
  pl: ['północny', 'północno-północno-wschodni', 'północno-wschodni', 'wschodnio-północno-wschodni', 'wschodni', 'wschodnio-południowo-wschodni', 'południowo-wschodni', 'południowo-południowo-wschodni', 'południowy', 'południowo-południowo-zachodni', 'południowo-zachodni', 'zachodnio-południowo-zachodni', 'zachodni', 'zachodnio-północno-zachodni', 'północno-zachodni', 'północno-północno-zachodni'],
};

export function compass(deg: number, lang: Lang): { short: string; full: string; deg: number } {
  const normalized = ((deg % 360) + 360) % 360;
  const idx = Math.round(normalized / 22.5) % 16;
  return { short: ROSE_SHORT[lang][idx]!, full: ROSE_FULL[lang][idx]!, deg: Math.round(normalized) };
}

// ─────────────────────────────────────────────────────────────────────────────
// De grote stringtabel.
// ─────────────────────────────────────────────────────────────────────────────

export interface Strings {
  htmlLang: string;
  /** "Weer" — gebruikt in de topbar-titel "Weer · <gemeente>". */
  weer: string;
  metaTitle: (name: string) => string;
  updated: (time: string) => string;

  // Hero
  feelsLike: (t: number) => string;
  todayRange: (min: number, max: number) => string;
  precipRate: (mm: number) => string;

  // Verdict
  verdictTop: string;
  verdictMid: string;
  verdictBad: string;
  verdictSubDry: (t: number, bft: number) => string;
  verdictSubRain: (t: number, bft: number, mm: number) => string;

  // Wind
  windTitle: string;
  windFrom: (short: string, full: string, deg: number) => string;
  windSpeed: (ms: number, km: number) => string;
  windGust: (km: number) => string;
  windRatingCalm: string;
  windRatingNice: string;
  windRatingStrong: string;
  windRatingTooHard: string;
  bft: string[]; // index 0..12
  compassN: string;
  compassE: string;
  compassS: string;
  compassW: string;

  // Zon / UV
  sunTitle: string;
  sunRise: string;
  sunSet: string;
  sunDaylen: string;
  uvNow: string;
  uvMax: string;
  uvAdviceHigh: string;
  uvAdviceMid: string;
  uvAdviceLow: string;
  uvAdviceNone: string;
  duration: (h: number, m: number) => string;
  hoursShort: string; // "u" / "h"

  // Uurlijks / dagelijks
  hourlyTitle: string;
  dailyTitle: string;
  today: string;
  tomorrow: string;
  dry: string;

  // Lucht & pollen
  airTitle: string;
  euAqi: string;
  aqiNa: string;
  aqiGood: string;
  aqiFair: string;
  aqiModerate: string;
  aqiPoor: string;
  aqiVeryPoor: string;
  aqiExtreme: string;
  ozone: string;
  pollenLead: (lvl: string) => string;
  pollenNa: string;
  pollenNone: string;
  pollenLow: string;
  pollenModerate: string;
  pollenHigh: string;
  pollenVeryHigh: string;
  pollenGrass: string;
  pollenBirch: string;
  pollenAlder: string;
  pollenRagweed: string;

  // Details
  detailsTitle: string;
  humidity: string;
  pressure: string;
  visibility: string;
  dewPoint: string;
  sunPower: string;
  rain1h: string;
  detailsUnavailable: string;

  // Strandvlag
  flagTitles: Record<FlagColor, string>;
  flagDescs: Record<FlagColor, string>;
  flagMeta: (bft: number, wave: number) => string;
  flagSourceIndicative: string;
  flagSourceLifeguard: string;

  // Getij
  tideTitle: (water: string) => string;
  highWater: string;
  lowWater: string;
  tideLevel: (sign: string, cm: number) => string;
  tideSource: (station: string) => string;
  waterNames: Record<string, string>;

  // Zee & surf
  seaTitle: string;
  seaTemp: string;
  waveHeight: string;
  swell: string;
  current: string;
  gusts: string;
  noSeaData: string;
  kmh: string; // "km/u" / "km/h"

  // Footer / misc
  footerSources: string;
  footerRefresh: string;
  loading: string;
  noData: string;
}

const FLAG_KEYS: FlagColor[] = ['groen', 'geel', 'rood', 'dubbel-rood', 'geen-wacht'];

function flagMap(values: [string, string, string, string, string]): Record<FlagColor, string> {
  const out = {} as Record<FlagColor, string>;
  FLAG_KEYS.forEach((k, i) => (out[k] = values[i]!));
  return out;
}

export const STRINGS: Record<Lang, Strings> = {
  nl: {
    htmlLang: 'nl',
    weer: 'Weer',
    metaTitle: (n) => `Weer in ${n}`,
    updated: (t) => `bijgewerkt ${t}`,
    feelsLike: (t) => `Voelt als ${t}°`,
    todayRange: (min, max) => `vandaag ${min}° / ${max}°`,
    precipRate: (mm) => `💧 ${mm} mm/u`,
    verdictTop: 'Top buitenweer!',
    verdictMid: 'Matig buitenweer',
    verdictBad: 'Geen weer voor buiten',
    verdictSubDry: (t, bft) => `${t}° · Bft ${bft} · droog`,
    verdictSubRain: (t, bft, mm) => `${t}° · Bft ${bft} · ${mm} mm overdag`,
    windTitle: '💨 Wind',
    windFrom: (short, full, deg) => `Uit het ${short} (${full}, ${deg}°)`,
    windSpeed: (ms, km) => `${ms} m/s · ${km} km/u`,
    windGust: (km) => `Windvlagen tot ${km} km/u`,
    windRatingCalm: '🚴 Prima voor fietsers en wandelaars',
    windRatingNice: '🚴 Lekker buitenweer',
    windRatingStrong: '💨 Stevige wind — let op tegenwind',
    windRatingTooHard: '⚠️ Te hard voor de meeste buitenactiviteiten',
    bft: ['Windstil', 'Zwak', 'Zwak', 'Matig', 'Matig', 'Vrij krachtig', 'Krachtig', 'Hard', 'Stormachtig', 'Storm', 'Zware storm', 'Zeer zware storm', 'Orkaan'],
    compassN: 'N',
    compassE: 'O',
    compassS: 'Z',
    compassW: 'W',
    sunTitle: '☀️ Zon &amp; UV',
    sunRise: 'Op',
    sunSet: 'Onder',
    sunDaylen: 'Daglengte',
    uvNow: 'UV-index nu:',
    uvMax: 'Max vandaag:',
    uvAdviceHigh: '🧴 Sterk insmeren — vermijd middag',
    uvAdviceMid: '🧴 Goed insmeren — let op',
    uvAdviceLow: '☀️ Insmeren bij langer buiten zijn',
    uvAdviceNone: '✅ Lage UV — geen extra bescherming nodig',
    duration: (h, m) => `${h}u ${m}m`,
    hoursShort: 'u',
    hourlyTitle: '🕐 Komende 24 uur',
    dailyTitle: '📅 7 dagen vooruit',
    today: 'Vandaag',
    tomorrow: 'Morgen',
    dry: 'droog',
    airTitle: '🌬️ Lucht &amp; pollen',
    euAqi: 'Europese AQI',
    aqiNa: 'Geen data',
    aqiGood: 'Goed',
    aqiFair: 'Redelijk',
    aqiModerate: 'Matig',
    aqiPoor: 'Slecht',
    aqiVeryPoor: 'Zeer slecht',
    aqiExtreme: 'Extreem slecht',
    ozone: 'Ozon',
    pollenLead: (lvl) => `Hooikoorts nu: ${lvl}`,
    pollenNa: '—',
    pollenNone: 'geen',
    pollenLow: 'laag',
    pollenModerate: 'matig',
    pollenHigh: 'hoog',
    pollenVeryHigh: 'zeer hoog',
    pollenGrass: '🌿 Gras',
    pollenBirch: '🌳 Berk',
    pollenAlder: '🌲 Els',
    pollenRagweed: '🌾 Ambrosia',
    detailsTitle: '📊 Details',
    humidity: 'Luchtvochtigheid',
    pressure: 'Luchtdruk',
    visibility: 'Zicht',
    dewPoint: 'Dauwpunt',
    sunPower: 'Zonkracht',
    rain1h: 'Regen 1u',
    detailsUnavailable: 'Details niet beschikbaar',
    flagTitles: flagMap(['Groene vlag', 'Gele vlag', 'Rode vlag', 'Dubbele rode vlag', 'Geen lifeguard']),
    flagDescs: flagMap([
      'Rustig — weinig wind en lage golven',
      'Voorzichtig — toenemende wind of golven',
      'Afgeraden — veel wind of hoge golven',
      'Gevaarlijk — storm of zeer hoge golven',
      'Geen bewaking',
    ]),
    flagMeta: (bft, wave) => `Wind ${bft} Bft · golf ${wave} m`,
    flagSourceIndicative: 'Bron: indicatief (wind + golfhoogte)',
    flagSourceLifeguard: 'Bron: Reddingsbrigade (live)',
    tideTitle: (water) => `🌊 Eb &amp; vloed${water}`,
    highWater: 'Hoogwater',
    lowWater: 'Laagwater',
    tideLevel: (sign, cm) => `${sign}${cm} cm NAP`,
    tideSource: (station) => `Bron: Rijkswaterstaat (${station})`,
    waterNames: {},
    seaTitle: '🏖️ Zee &amp; surf',
    seaTemp: 'Watertemp',
    waveHeight: 'Golfhoogte',
    swell: 'Deining',
    current: 'Stroming',
    gusts: 'Windvlagen',
    noSeaData: 'Geen zee-data beschikbaar',
    kmh: 'km/u',
    footerSources: 'Bronnen:',
    footerRefresh: 'Vernieuwt elke 10 minuten',
    loading: 'Buitenweer wordt geladen…',
    noData: 'Nog geen data',
  },

  en: {
    htmlLang: 'en',
    weer: 'Weather',
    metaTitle: (n) => `Weather in ${n}`,
    updated: (t) => `updated ${t}`,
    feelsLike: (t) => `Feels like ${t}°`,
    todayRange: (min, max) => `today ${min}° / ${max}°`,
    precipRate: (mm) => `💧 ${mm} mm/h`,
    verdictTop: 'Great weather to be outside!',
    verdictMid: 'So-so weather for outdoors',
    verdictBad: 'Not weather for outdoors',
    verdictSubDry: (t, bft) => `${t}° · ${bft} Bft · dry`,
    verdictSubRain: (t, bft, mm) => `${t}° · ${bft} Bft · ${mm} mm daytime`,
    windTitle: '💨 Wind',
    windFrom: (short, full, deg) => `From the ${short} (${full}, ${deg}°)`,
    windSpeed: (ms, km) => `${ms} m/s · ${km} km/h`,
    windGust: (km) => `Gusts up to ${km} km/h`,
    windRatingCalm: '🚴 Great for cyclists and walkers',
    windRatingNice: '🚴 Pleasant outdoor weather',
    windRatingStrong: '💨 Strong wind — watch the headwind',
    windRatingTooHard: '⚠️ Too strong for most outdoor activities',
    bft: ['Calm', 'Light air', 'Light breeze', 'Gentle breeze', 'Moderate breeze', 'Fresh breeze', 'Strong breeze', 'Near gale', 'Gale', 'Strong gale', 'Storm', 'Violent storm', 'Hurricane'],
    compassN: 'N',
    compassE: 'E',
    compassS: 'S',
    compassW: 'W',
    sunTitle: '☀️ Sun &amp; UV',
    sunRise: 'Rise',
    sunSet: 'Set',
    sunDaylen: 'Daylight',
    uvNow: 'UV index now:',
    uvMax: 'Max today:',
    uvAdviceHigh: '🧴 Use strong sunscreen — avoid midday',
    uvAdviceMid: '🧴 Apply sunscreen well — take care',
    uvAdviceLow: '☀️ Use sunscreen if out for longer',
    uvAdviceNone: '✅ Low UV — no extra protection needed',
    duration: (h, m) => `${h}h ${m}m`,
    hoursShort: 'h',
    hourlyTitle: '🕐 Next 24 hours',
    dailyTitle: '📅 7-day forecast',
    today: 'Today',
    tomorrow: 'Tomorrow',
    dry: 'dry',
    airTitle: '🌬️ Air &amp; pollen',
    euAqi: 'European AQI',
    aqiNa: 'No data',
    aqiGood: 'Good',
    aqiFair: 'Fair',
    aqiModerate: 'Moderate',
    aqiPoor: 'Poor',
    aqiVeryPoor: 'Very poor',
    aqiExtreme: 'Extremely poor',
    ozone: 'Ozone',
    pollenLead: (lvl) => `Hay fever now: ${lvl}`,
    pollenNa: '—',
    pollenNone: 'none',
    pollenLow: 'low',
    pollenModerate: 'moderate',
    pollenHigh: 'high',
    pollenVeryHigh: 'very high',
    pollenGrass: '🌿 Grass',
    pollenBirch: '🌳 Birch',
    pollenAlder: '🌲 Alder',
    pollenRagweed: '🌾 Ragweed',
    detailsTitle: '📊 Details',
    humidity: 'Humidity',
    pressure: 'Pressure',
    visibility: 'Visibility',
    dewPoint: 'Dew point',
    sunPower: 'Solar power',
    rain1h: 'Rain 1h',
    detailsUnavailable: 'Details unavailable',
    flagTitles: flagMap(['Green flag', 'Yellow flag', 'Red flag', 'Double red flag', 'No lifeguard']),
    flagDescs: flagMap([
      'Calm — light wind and low waves',
      'Caution — increasing wind or waves',
      'Not advised — strong wind or high waves',
      'Dangerous — storm or very high waves',
      'No supervision',
    ]),
    flagMeta: (bft, wave) => `Wind ${bft} Bft · waves ${wave} m`,
    flagSourceIndicative: 'Source: indicative (wind + wave height)',
    flagSourceLifeguard: 'Source: lifeguard (live)',
    tideTitle: (water) => `🌊 Tides${water}`,
    highWater: 'High tide',
    lowWater: 'Low tide',
    tideLevel: (sign, cm) => `${sign}${cm} cm NAP`,
    tideSource: (station) => `Source: Rijkswaterstaat (${station})`,
    waterNames: { Noordzee: 'North Sea' },
    seaTitle: '🏖️ Sea &amp; surf',
    seaTemp: 'Water temp',
    waveHeight: 'Wave height',
    swell: 'Swell',
    current: 'Current',
    gusts: 'Gusts',
    noSeaData: 'No sea data available',
    kmh: 'km/h',
    footerSources: 'Sources:',
    footerRefresh: 'Updates every 10 minutes',
    loading: 'Loading outdoor weather…',
    noData: 'No data yet',
  },

  de: {
    htmlLang: 'de',
    weer: 'Wetter',
    metaTitle: (n) => `Wetter in ${n}`,
    updated: (t) => `aktualisiert ${t}`,
    feelsLike: (t) => `Gefühlt ${t}°`,
    todayRange: (min, max) => `heute ${min}° / ${max}°`,
    precipRate: (mm) => `💧 ${mm} mm/h`,
    verdictTop: 'Top-Wetter für draußen!',
    verdictMid: 'Mäßiges Wetter für draußen',
    verdictBad: 'Kein Wetter für draußen',
    verdictSubDry: (t, bft) => `${t}° · ${bft} Bft · trocken`,
    verdictSubRain: (t, bft, mm) => `${t}° · ${bft} Bft · ${mm} mm tagsüber`,
    windTitle: '💨 Wind',
    windFrom: (short, full, deg) => `Aus ${short} (${full}, ${deg}°)`,
    windSpeed: (ms, km) => `${ms} m/s · ${km} km/h`,
    windGust: (km) => `Böen bis ${km} km/h`,
    windRatingCalm: '🚴 Ideal für Radfahrer und Spaziergänger',
    windRatingNice: '🚴 Schönes Wetter für draußen',
    windRatingStrong: '💨 Kräftiger Wind — Achtung Gegenwind',
    windRatingTooHard: '⚠️ Zu stark für die meisten Aktivitäten im Freien',
    bft: ['Windstille', 'Leiser Zug', 'Leichte Brise', 'Schwache Brise', 'Mäßige Brise', 'Frische Brise', 'Starker Wind', 'Steifer Wind', 'Stürmischer Wind', 'Sturm', 'Schwerer Sturm', 'Orkanartiger Sturm', 'Orkan'],
    compassN: 'N',
    compassE: 'O',
    compassS: 'S',
    compassW: 'W',
    sunTitle: '☀️ Sonne &amp; UV',
    sunRise: 'Auf',
    sunSet: 'Unter',
    sunDaylen: 'Tageslänge',
    uvNow: 'UV-Index jetzt:',
    uvMax: 'Max. heute:',
    uvAdviceHigh: '🧴 Stark eincremen — Mittag meiden',
    uvAdviceMid: '🧴 Gut eincremen — aufpassen',
    uvAdviceLow: '☀️ Eincremen bei längerem Aufenthalt draußen',
    uvAdviceNone: '✅ Niedriger UV — kein zusätzlicher Schutz nötig',
    duration: (h, m) => `${h} Std. ${m} Min.`,
    hoursShort: 'h',
    hourlyTitle: '🕐 Nächste 24 Stunden',
    dailyTitle: '📅 7-Tage-Vorhersage',
    today: 'Heute',
    tomorrow: 'Morgen',
    dry: 'trocken',
    airTitle: '🌬️ Luft &amp; Pollen',
    euAqi: 'Europäischer AQI',
    aqiNa: 'Keine Daten',
    aqiGood: 'Gut',
    aqiFair: 'Annehmbar',
    aqiModerate: 'Mäßig',
    aqiPoor: 'Schlecht',
    aqiVeryPoor: 'Sehr schlecht',
    aqiExtreme: 'Extrem schlecht',
    ozone: 'Ozon',
    pollenLead: (lvl) => `Heuschnupfen jetzt: ${lvl}`,
    pollenNa: '—',
    pollenNone: 'keine',
    pollenLow: 'niedrig',
    pollenModerate: 'mäßig',
    pollenHigh: 'hoch',
    pollenVeryHigh: 'sehr hoch',
    pollenGrass: '🌿 Gräser',
    pollenBirch: '🌳 Birke',
    pollenAlder: '🌲 Erle',
    pollenRagweed: '🌾 Ambrosia',
    detailsTitle: '📊 Details',
    humidity: 'Luftfeuchtigkeit',
    pressure: 'Luftdruck',
    visibility: 'Sicht',
    dewPoint: 'Taupunkt',
    sunPower: 'Sonnenstrahlung',
    rain1h: 'Regen 1 Std.',
    detailsUnavailable: 'Details nicht verfügbar',
    flagTitles: flagMap(['Grüne Flagge', 'Gelbe Flagge', 'Rote Flagge', 'Doppelte rote Flagge', 'Keine Rettungswache']),
    flagDescs: flagMap([
      'Ruhig — wenig Wind und niedrige Wellen',
      'Vorsicht — zunehmender Wind oder Wellen',
      'Abgeraten — viel Wind oder hohe Wellen',
      'Gefährlich — Sturm oder sehr hohe Wellen',
      'Keine Aufsicht',
    ]),
    flagMeta: (bft, wave) => `Wind ${bft} Bft · Wellen ${wave} m`,
    flagSourceIndicative: 'Quelle: indikativ (Wind + Wellenhöhe)',
    flagSourceLifeguard: 'Quelle: Rettungswache (live)',
    tideTitle: (water) => `🌊 Ebbe &amp; Flut${water}`,
    highWater: 'Hochwasser',
    lowWater: 'Niedrigwasser',
    tideLevel: (sign, cm) => `${sign}${cm} cm NAP`,
    tideSource: (station) => `Quelle: Rijkswaterstaat (${station})`,
    waterNames: { Noordzee: 'Nordsee' },
    seaTitle: '🏖️ Meer &amp; Surf',
    seaTemp: 'Wassertemp.',
    waveHeight: 'Wellenhöhe',
    swell: 'Dünung',
    current: 'Strömung',
    gusts: 'Böen',
    noSeaData: 'Keine Meeresdaten verfügbar',
    kmh: 'km/h',
    footerSources: 'Quellen:',
    footerRefresh: 'Aktualisiert alle 10 Minuten',
    loading: 'Wetter für draußen wird geladen…',
    noData: 'Noch keine Daten',
  },

  pl: {
    htmlLang: 'pl',
    weer: 'Pogoda',
    metaTitle: (n) => `Pogoda w ${n}`,
    updated: (t) => `zaktualizowano ${t}`,
    feelsLike: (t) => `Odczuwalna ${t}°`,
    todayRange: (min, max) => `dziś ${min}° / ${max}°`,
    precipRate: (mm) => `💧 ${mm} mm/h`,
    verdictTop: 'Świetna pogoda na dwór!',
    verdictMid: 'Umiarkowana pogoda na dwór',
    verdictBad: 'Pogoda nie na dwór',
    verdictSubDry: (t, bft) => `${t}° · ${bft} Bft · sucho`,
    verdictSubRain: (t, bft, mm) => `${t}° · ${bft} Bft · ${mm} mm w dzień`,
    windTitle: '💨 Wiatr',
    windFrom: (short, full, deg) => `Z kierunku ${short} (${full}, ${deg}°)`,
    windSpeed: (ms, km) => `${ms} m/s · ${km} km/h`,
    windGust: (km) => `Porywy do ${km} km/h`,
    windRatingCalm: '🚴 Idealnie dla rowerzystów i spacerowiczów',
    windRatingNice: '🚴 Przyjemna pogoda na dwór',
    windRatingStrong: '💨 Silny wiatr — uważaj na wiatr czołowy',
    windRatingTooHard: '⚠️ Zbyt silny na większość aktywności na dworze',
    bft: ['Cisza', 'Powiew', 'Słaby wiatr', 'Łagodny wiatr', 'Umiarkowany wiatr', 'Dość silny wiatr', 'Silny wiatr', 'Bardzo silny wiatr', 'Wichura', 'Silna wichura', 'Sztorm', 'Gwałtowny sztorm', 'Huragan'],
    compassN: 'N',
    compassE: 'E',
    compassS: 'S',
    compassW: 'W',
    sunTitle: '☀️ Słońce &amp; UV',
    sunRise: 'Wschód',
    sunSet: 'Zachód',
    sunDaylen: 'Długość dnia',
    uvNow: 'Indeks UV teraz:',
    uvMax: 'Maks. dziś:',
    uvAdviceHigh: '🧴 Mocny filtr — unikaj południa',
    uvAdviceMid: '🧴 Dobrze posmaruj się — uważaj',
    uvAdviceLow: '☀️ Filtr przy dłuższym pobycie na dworze',
    uvAdviceNone: '✅ Niski UV — bez dodatkowej ochrony',
    duration: (h, m) => `${h} godz. ${m} min`,
    hoursShort: 'h',
    hourlyTitle: '🕐 Najbliższe 24 godziny',
    dailyTitle: '📅 Prognoza na 7 dni',
    today: 'Dziś',
    tomorrow: 'Jutro',
    dry: 'sucho',
    airTitle: '🌬️ Powietrze &amp; pyłki',
    euAqi: 'Europejski AQI',
    aqiNa: 'Brak danych',
    aqiGood: 'Dobra',
    aqiFair: 'Dostateczna',
    aqiModerate: 'Umiarkowana',
    aqiPoor: 'Zła',
    aqiVeryPoor: 'Bardzo zła',
    aqiExtreme: 'Ekstremalnie zła',
    ozone: 'Ozon',
    pollenLead: (lvl) => `Katar sienny teraz: ${lvl}`,
    pollenNa: '—',
    pollenNone: 'brak',
    pollenLow: 'niskie',
    pollenModerate: 'umiarkowane',
    pollenHigh: 'wysokie',
    pollenVeryHigh: 'bardzo wysokie',
    pollenGrass: '🌿 Trawy',
    pollenBirch: '🌳 Brzoza',
    pollenAlder: '🌲 Olcha',
    pollenRagweed: '🌾 Ambrozja',
    detailsTitle: '📊 Szczegóły',
    humidity: 'Wilgotność',
    pressure: 'Ciśnienie',
    visibility: 'Widoczność',
    dewPoint: 'Punkt rosy',
    sunPower: 'Nasłonecznienie',
    rain1h: 'Deszcz 1 godz.',
    detailsUnavailable: 'Szczegóły niedostępne',
    flagTitles: flagMap(['Zielona flaga', 'Żółta flaga', 'Czerwona flaga', 'Podwójna czerwona flaga', 'Brak ratownika']),
    flagDescs: flagMap([
      'Spokojnie — słaby wiatr i niskie fale',
      'Ostrożnie — rosnący wiatr lub fale',
      'Odradzane — silny wiatr lub wysokie fale',
      'Niebezpiecznie — sztorm lub bardzo wysokie fale',
      'Brak nadzoru',
    ]),
    flagMeta: (bft, wave) => `Wiatr ${bft} Bft · fale ${wave} m`,
    flagSourceIndicative: 'Źródło: szacunkowe (wiatr + wysokość fal)',
    flagSourceLifeguard: 'Źródło: ratownicy (na żywo)',
    tideTitle: (water) => `🌊 Pływy${water}`,
    highWater: 'Przypływ',
    lowWater: 'Odpływ',
    tideLevel: (sign, cm) => `${sign}${cm} cm NAP`,
    tideSource: (station) => `Źródło: Rijkswaterstaat (${station})`,
    waterNames: { Noordzee: 'Morze Północne' },
    seaTitle: '🏖️ Morze &amp; surfing',
    seaTemp: 'Temp. wody',
    waveHeight: 'Wysokość fal',
    swell: 'Martwa fala',
    current: 'Prąd',
    gusts: 'Porywy',
    noSeaData: 'Brak danych morskich',
    kmh: 'km/h',
    footerSources: 'Źródła:',
    footerRefresh: 'Odświeża co 10 minut',
    loading: 'Ładowanie pogody…',
    noData: 'Brak danych',
  },
};
