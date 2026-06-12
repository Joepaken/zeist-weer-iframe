/**
 * Daglicht-dominante afleiding van het dag-icoon.
 *
 * Open-Meteo's daily.weather_code is per definitie de zwaarste conditie van
 * de hele dag (incl. nacht): één motregenuur om 05:00 zet een verder zonnige
 * dag op "Motregen". Hier leiden we icoon + label af uit de uren tussen
 * zonsopkomst en -ondergang, zodat het icoon het karakter van de dag toont.
 *
 * Eerlijkheid boven optimisme: echte regendagen blijven regen tonen en
 * onweer (veiligheidsrelevant) wordt over de volle 24 uur gedetecteerd.
 *
 * Conventies:
 * - Dag 0: volledig venster incl. al verstreken uren — het icoon beschrijft
 *   "het karakter van vandaag", niet "de rest van vandaag".
 * - Tijden zijn lokale ISO-strings (timezone-param staat aan): dag-match via
 *   slice(0,10), uur via slice(11,13). Geen Date/UTC-rekenwerk → DST-veilig.
 * - Open-Meteo uurvelden gelden voor het voorafgaande uur; de ±1u vervaging
 *   aan de vensterranden accepteren we.
 */

import { wmoToInfo, type IconKey } from './wmoIcon.js';

export interface DeriveDayInput {
  date: string; // 'YYYY-MM-DD'
  sunrise: string; // lokale ISO 'YYYY-MM-DDTHH:mm' of ''
  sunset: string;
  daylightSeconds: number;
  rawDailyCode: number;
  hourlyTime: string[]; // volledige 7×24 arrays, niet per dag voorgefilterd
  hourlyWeatherCode: number[];
  hourlyPrecipitation: number[];
  hourlySunshine?: Array<number | null>;
  hourlyCloudCover?: Array<number | null>;
  dailySunshineSeconds?: number | null;
}

export interface DerivedDayInfo {
  iconKey: IconKey;
  labelNL: string;
  sunHours: number | null;
  daytimePrecipSum: number;
  daytimePrecipHours: number;
}

const WET_CODES = new Set([51, 53, 55, 61, 63, 65, 80, 81, 82]);
const DRIZZLE_CODES = new Set([51, 53, 55]);
const SNOW_CODES = new Set([71, 73, 75, 77, 85, 86]);
const SLEET_CODES = new Set([56, 57, 66, 67]);
const THUNDER_CODES = new Set([95, 96, 99]);
const FOG_CODES = new Set([45, 48]);

const round1 = (n: number): number => Math.round(n * 10) / 10;

/** Uur uit lokale ISO-string; null bij onbruikbare input. */
function parseHour(iso: string): number | null {
  const h = Number.parseInt(iso.slice(11, 13), 10);
  return Number.isFinite(h) && h >= 0 && h <= 23 ? h : null;
}

function cloudBucket(cc: number): { iconKey: IconKey; labelNL: string } {
  if (cc <= 30) return { iconKey: 'clear', labelNL: 'Zonnig' };
  if (cc <= 60) return { iconKey: 'partly', labelNL: 'Zonnige perioden' };
  if (cc <= 85) return { iconKey: 'cloudy', labelNL: 'Overwegend bewolkt' };
  return { iconKey: 'overcast', labelNL: 'Bewolkt' };
}

export function deriveDayInfo(input: DeriveDayInput): DerivedDayInfo {
  // Venster: zonsopkomst t/m zonsondergang, fallback 08–20.
  let sunriseHour = parseHour(input.sunrise) ?? 8;
  let sunsetHour = parseHour(input.sunset) ?? 20;
  if (sunsetHour <= sunriseHour) {
    sunriseHour = 8;
    sunsetHour = 20;
  }
  // Winterse neerslag vóór een late zonsopkomst (ochtendspits) telt wél mee.
  const severeStartHour = Math.min(7, sunriseHour);

  const dayIdxs: number[] = [];
  const windowIdxs: number[] = [];
  const severeIdxs: number[] = [];
  for (let j = 0; j < input.hourlyTime.length; j++) {
    const t = input.hourlyTime[j] ?? '';
    if (t.slice(0, 10) !== input.date) continue;
    dayIdxs.push(j);
    const h = parseHour(t);
    if (h == null) continue;
    if (h >= severeStartHour && h <= sunsetHour) severeIdxs.push(j);
    if (h >= sunriseHour && h <= sunsetHour) windowIdxs.push(j);
  }

  const rawInfo = wmoToInfo(input.rawDailyCode);

  // Geen uurdata voor deze dag → huidig gedrag (ruwe dagcode).
  if (windowIdxs.length === 0) {
    return {
      iconKey: rawInfo.iconKey,
      labelNL: rawInfo.labelNL,
      sunHours: null,
      daytimePrecipSum: 0,
      daytimePrecipHours: 0,
    };
  }

  // Statistieken over het daglichtvenster.
  let dayPrecip = 0;
  let rainHours = 0;
  let wetCodedHours = 0;
  let drizzleHours = 0;
  let fogHours = 0;
  let sunSec = 0;
  let allSunNull = true;
  let cloudSum = 0;
  let cloudCount = 0;
  const codeCounts = new Map<number, number>();
  for (const j of windowIdxs) {
    const p = input.hourlyPrecipitation[j] ?? 0;
    dayPrecip += p;
    if (p >= 0.1) rainHours++;
    const code = input.hourlyWeatherCode[j];
    if (code != null) {
      if (WET_CODES.has(code)) wetCodedHours++;
      if (DRIZZLE_CODES.has(code)) drizzleHours++;
      if (FOG_CODES.has(code)) fogHours++;
      codeCounts.set(code, (codeCounts.get(code) ?? 0) + 1);
    }
    const s = input.hourlySunshine?.[j];
    if (s != null) {
      allSunNull = false;
      sunSec += s;
    }
    const cc = input.hourlyCloudCover?.[j];
    if (cc != null) {
      cloudSum += cc;
      cloudCount++;
    }
  }
  if (allSunNull && input.dailySunshineSeconds != null) {
    // Zonneschijn valt per definitie binnen daglicht; dagtotaal is gelijkwaardig.
    sunSec = input.dailySunshineSeconds;
    allSunNull = false;
  }

  let snowHours = 0;
  let sleetHours = 0;
  for (const j of severeIdxs) {
    const code = input.hourlyWeatherCode[j];
    if (code == null) continue;
    if (SNOW_CODES.has(code)) snowHours++;
    if (SLEET_CODES.has(code)) sleetHours++;
  }
  // Onweer: volle 24 uur + ruwe dagcode — nooit verbergen.
  const thunderAny =
    THUNDER_CODES.has(input.rawDailyCode) ||
    dayIdxs.some((j) => THUNDER_CODES.has(input.hourlyWeatherCode[j] ?? -1));

  const daylightSec =
    input.daylightSeconds > 0
      ? input.daylightSeconds
      : (sunsetHour - sunriseHour + 1) * 3600;
  const sunRatio = sunSec / Math.max(daylightSec, 1);
  const sunHours = allSunNull ? null : round1(sunSec / 3600);
  const drizzleShare = drizzleHours / Math.max(wetCodedHours, 1);

  const base = {
    sunHours,
    daytimePrecipSum: round1(dayPrecip),
    daytimePrecipHours: rainHours,
  };
  const pick = (iconKey: IconKey, labelNL: string): DerivedDayInfo => ({
    iconKey,
    labelNL,
    ...base,
  });

  // Beslis-cascade: eerste match wint (zwaar → licht).
  if (thunderAny) return pick('thunder', 'Onweer');
  if (sleetHours >= 1) return pick('sleet', 'Winterse neerslag');
  if (snowHours >= 2 || (snowHours >= 1 && dayPrecip >= 1.0)) return pick('snow', 'Sneeuw');
  if (dayPrecip >= 8.0) return pick('rain-heavy', 'Veel regen');
  if (dayPrecip >= 3.0 || (rainHours >= 4 && dayPrecip >= 1.0)) return pick('rain', 'Regen');
  if (dayPrecip >= 0.5 && !allSunNull && sunRatio >= 0.35) {
    return pick('sun-shower', 'Zon en buien');
  }
  if (dayPrecip >= 0.5) {
    return drizzleShare >= 0.6 ? pick('drizzle', 'Motregen') : pick('rain', 'Buien');
  }
  if (fogHours >= Math.ceil(0.4 * windowIdxs.length)) return pick('fog', 'Mist');
  if (!allSunNull) {
    if (sunRatio >= 0.65) return pick('clear', 'Zonnig');
    if (sunRatio >= 0.35) return pick('partly', 'Zonnige perioden');
    if (sunRatio >= 0.12) return pick('cloudy', 'Overwegend bewolkt');
    return pick('overcast', 'Bewolkt');
  }
  // Fallback A: gemiddelde bewolkingsgraad overdag.
  if (cloudCount > 0) {
    const b = cloudBucket(cloudSum / cloudCount);
    return pick(b.iconKey, b.labelNL);
  }
  // Fallback B: meest voorkomende uurcode overdag.
  let modalCode: number | null = null;
  let modalCount = 0;
  for (const [code, count] of codeCounts) {
    if (count > modalCount) {
      modalCode = code;
      modalCount = count;
    }
  }
  if (modalCode != null) {
    const info = wmoToInfo(modalCode);
    return pick(info.iconKey, info.labelNL);
  }
  // Fallback C: ruwe dagcode (= oude gedrag).
  return pick(rawInfo.iconKey, rawInfo.labelNL);
}
