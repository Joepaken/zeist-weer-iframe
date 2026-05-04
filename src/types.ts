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
  weatherCode: number;
  iconKey: IconKey;
  labelNL: string;
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
  _meta: MetaBlock;
}
