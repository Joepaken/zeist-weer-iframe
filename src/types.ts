/**
 * Gemeenschappelijke types voor het ZeistWeerApp dashboard.
 *
 * Inland-versie: geen marine, getij of strandvlag.
 */

import type { IconKey } from './util/wmoIcon.js';

export interface CurrentWeather {
  time: string;
  temperature: number;
  apparentTemperature: number;
  humidity: number;
  precipitation: number;
  weatherCode: number;
  iconKey: IconKey;
  labelNL: string;
  pressureMsl: number;
  windMs: number;
  windDir: number;
  windGustMs: number;
  uvIndex: number;
  visibilityM: number;
  dewPoint: number;
}

export interface HourlyEntry {
  time: string;
  temperature: number;
  precipitationProb: number;
  precipitation: number;
  weatherCode: number;
  iconKey: IconKey;
  windMs: number;
  windDir: number;
}

export interface DailyEntry {
  date: string;
  /** Ruwe Open-Meteo dagcode (zwaarste conditie van de dag, incl. nacht). */
  weatherCode: number;
  /** Afgeleid van de daglichturen (zonsopkomst–ondergang), niet van weatherCode. */
  iconKey: IconKey;
  labelNL: string;
  /** Zonuren overdag, 1 decimaal; null als het model geen zonneschijndata gaf. */
  sunHours: number | null;
  /** Neerslag (mm) tussen zonsopkomst en -ondergang. */
  daytimePrecipSum: number;
  /** Daglichturen met ≥ 0,1 mm neerslag. */
  daytimePrecipHours: number;
  tempMax: number;
  tempMin: number;
  precipitationSum: number;
  precipitationHours: number;
  windMaxMs: number;
  windGustMaxMs: number;
  windDirDominant: number;
  uvIndexMax: number;
  sunrise: string;
  sunset: string;
  daylightSeconds: number;
}

export interface WeatherBlock {
  current: CurrentWeather;
  hourly: HourlyEntry[];
  daily: DailyEntry[];
}

export interface AirQualityBlock {
  euAqi: number | null;
  pm25: number | null;
  pm10: number | null;
  ozone: number | null;
  no2: number | null;
  pollenGrass: number | null;
  pollenBirch: number | null;
  pollenAlder: number | null;
  pollenRagweed: number | null;
}

export interface BuienradarBlock {
  stationId: number;
  stationName: string;
  windBft: number;
  sunPower: number;
  rainLastHour: number;
  observedAt: string;
}

export interface TideExtreme {
  type: 'HW' | 'LW';
  time: string; // ISO met TZ
  levelCmNap: number;
}

export interface TideBlock {
  station: string;
  next: TideExtreme[]; // chronologisch, eerstvolgende extremen
}

export interface FireRiskBlock {
  level: 1 | 2 | 3 | 4; // 1=laag … 4=zeer hoog
  label: string; // NL, bv. 'Matig'
  color: string; // hex voor de badge
  reasonNL: string; // korte onderbouwing
}

export interface MetaBlock {
  fetchedAt: string;
  fetchedAtMs: number;
  nextRefreshAtMs: number;
  refreshIntervalMs: number;
  errors: Array<{ source: string; message: string }>;
  durationMs: number;
}

export interface WeerSnapshot {
  weather: WeatherBlock | null;
  airQuality: AirQualityBlock | null;
  buienradar: BuienradarBlock | null;
  /** Alleen gevuld bij getij-gemeenten (Barendrecht, Capelle, Almkerk). */
  tide?: TideBlock | null;
  /** Alleen gevuld bij gemeenten met natuurbrandrisico (Nijverdal). */
  fireRisk?: FireRiskBlock | null;
  _meta: MetaBlock;
}
