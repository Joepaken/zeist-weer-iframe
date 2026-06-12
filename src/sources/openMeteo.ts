/**
 * Open-Meteo: forecast + air-quality (geen marine voor binnenland).
 * Geen API-key nodig.
 */

import { wmoToInfo } from '../util/wmoIcon.js';
import { deriveDayInfo } from '../util/dailyIcon.js';
import type {
  WeatherBlock,
  AirQualityBlock,
  HourlyEntry,
  DailyEntry,
  CurrentWeather,
} from '../types.js';

const FORECAST_URL = 'https://api.open-meteo.com/v1/forecast';
const AIR_URL = 'https://air-quality-api.open-meteo.com/v1/air-quality';

const TIMEOUT_MS = 8000;

async function fetchJson<T>(url: string, label: string): Promise<T> {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal });
    if (!res.ok) {
      throw new Error(`${label} HTTP ${res.status}`);
    }
    return (await res.json()) as T;
  } finally {
    clearTimeout(t);
  }
}

function buildQuery(base: string, params: Record<string, string | number>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    qs.set(k, String(v));
  }
  return `${base}?${qs.toString()}`;
}

interface OmForecastResponse {
  current: {
    time: string;
    temperature_2m: number;
    apparent_temperature: number;
    relative_humidity_2m: number;
    precipitation: number;
    weather_code: number;
    pressure_msl: number;
    wind_speed_10m: number;
    wind_direction_10m: number;
    wind_gusts_10m: number;
    uv_index: number;
  };
  hourly: {
    time: string[];
    temperature_2m: number[];
    relative_humidity_2m: number[];
    apparent_temperature: number[];
    precipitation_probability: number[];
    precipitation: number[];
    weather_code: number[];
    pressure_msl: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
    uv_index: number[];
    visibility: number[];
    dew_point_2m: number[];
    // Optioneel: ontbreken mag nooit een crash geven (oudere modelruns).
    sunshine_duration?: Array<number | null>;
    cloud_cover?: Array<number | null>;
  };
  daily: {
    time: string[];
    weather_code: number[];
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    sunrise: string[];
    sunset: string[];
    daylight_duration: number[];
    sunshine_duration?: Array<number | null>;
    uv_index_max: number[];
    precipitation_sum: number[];
    precipitation_hours: number[];
    wind_speed_10m_max: number[];
    wind_gusts_10m_max: number[];
    wind_direction_10m_dominant: number[];
  };
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherBlock> {
  const url = buildQuery(FORECAST_URL, {
    latitude: lat,
    longitude: lon,
    current:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index',
    hourly:
      'temperature_2m,relative_humidity_2m,apparent_temperature,precipitation_probability,precipitation,weather_code,pressure_msl,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index,visibility,dew_point_2m,sunshine_duration,cloud_cover',
    daily:
      'weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,sunshine_duration,uv_index_max,precipitation_sum,precipitation_hours,wind_speed_10m_max,wind_gusts_10m_max,wind_direction_10m_dominant',
    wind_speed_unit: 'ms',
    timezone: 'Europe/Amsterdam',
    forecast_days: 7,
  });

  const data = await fetchJson<OmForecastResponse>(url, 'open-meteo/forecast');

  const nowMs = Date.now();
  const hourlyTimes = data.hourly.time;
  let startIdx = hourlyTimes.findIndex((t) => Date.parse(t) >= nowMs);
  if (startIdx < 0) startIdx = 0;
  const endIdx = Math.min(startIdx + 24, hourlyTimes.length);

  const hourly: HourlyEntry[] = [];
  for (let i = startIdx; i < endIdx; i++) {
    const wc = data.hourly.weather_code[i] ?? 0;
    hourly.push({
      time: hourlyTimes[i]!,
      temperature: data.hourly.temperature_2m[i] ?? 0,
      precipitationProb: data.hourly.precipitation_probability[i] ?? 0,
      precipitation: data.hourly.precipitation[i] ?? 0,
      weatherCode: wc,
      iconKey: wmoToInfo(wc).iconKey,
      windMs: data.hourly.wind_speed_10m[i] ?? 0,
      windDir: data.hourly.wind_direction_10m[i] ?? 0,
    });
  }

  const daily: DailyEntry[] = data.daily.time.map((d, i) => {
    const wc = data.daily.weather_code[i] ?? 0;
    const derived = deriveDayInfo({
      date: d,
      sunrise: data.daily.sunrise[i] ?? '',
      sunset: data.daily.sunset[i] ?? '',
      daylightSeconds: Math.round(data.daily.daylight_duration[i] ?? 0),
      rawDailyCode: wc,
      hourlyTime: data.hourly.time,
      hourlyWeatherCode: data.hourly.weather_code,
      hourlyPrecipitation: data.hourly.precipitation,
      hourlySunshine: data.hourly.sunshine_duration,
      hourlyCloudCover: data.hourly.cloud_cover,
      dailySunshineSeconds: data.daily.sunshine_duration?.[i] ?? null,
    });
    if (process.env.DEBUG_DAILY_ICON === '1') {
      console.log(`[dailyIcon] ${d} raw=${wc}(${wmoToInfo(wc).iconKey}) →`, derived);
    }
    return {
      date: d,
      weatherCode: wc,
      iconKey: derived.iconKey,
      labelNL: derived.labelNL,
      sunHours: derived.sunHours,
      daytimePrecipSum: derived.daytimePrecipSum,
      daytimePrecipHours: derived.daytimePrecipHours,
      tempMax: data.daily.temperature_2m_max[i] ?? 0,
      tempMin: data.daily.temperature_2m_min[i] ?? 0,
      precipitationSum: data.daily.precipitation_sum[i] ?? 0,
      precipitationHours: data.daily.precipitation_hours[i] ?? 0,
      windMaxMs: data.daily.wind_speed_10m_max[i] ?? 0,
      windGustMaxMs: data.daily.wind_gusts_10m_max[i] ?? 0,
      windDirDominant: data.daily.wind_direction_10m_dominant[i] ?? 0,
      uvIndexMax: data.daily.uv_index_max[i] ?? 0,
      sunrise: data.daily.sunrise[i] ?? '',
      sunset: data.daily.sunset[i] ?? '',
      daylightSeconds: Math.round(data.daily.daylight_duration[i] ?? 0),
    };
  });

  const c = data.current;
  const cInfo = wmoToInfo(c.weather_code);
  const lastIdx = startIdx;
  const current: CurrentWeather = {
    time: c.time,
    temperature: c.temperature_2m,
    apparentTemperature: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    precipitation: c.precipitation,
    weatherCode: c.weather_code,
    iconKey: cInfo.iconKey,
    labelNL: cInfo.labelNL,
    pressureMsl: c.pressure_msl,
    windMs: c.wind_speed_10m,
    windDir: c.wind_direction_10m,
    windGustMs: c.wind_gusts_10m,
    uvIndex: c.uv_index,
    visibilityM: data.hourly.visibility[lastIdx] ?? 0,
    dewPoint: data.hourly.dew_point_2m[lastIdx] ?? 0,
  };

  return { current, hourly, daily };
}

interface OmAirResponse {
  current: {
    european_aqi?: number;
    pm10?: number;
    pm2_5?: number;
    ozone?: number;
    nitrogen_dioxide?: number;
    grass_pollen?: number;
    birch_pollen?: number;
    alder_pollen?: number;
    ragweed_pollen?: number;
  };
}

export async function fetchAirQuality(lat: number, lon: number): Promise<AirQualityBlock> {
  const url = buildQuery(AIR_URL, {
    latitude: lat,
    longitude: lon,
    current:
      'european_aqi,pm10,pm2_5,ozone,nitrogen_dioxide,grass_pollen,birch_pollen,alder_pollen,ragweed_pollen',
    timezone: 'Europe/Amsterdam',
  });

  const data = await fetchJson<OmAirResponse>(url, 'open-meteo/air-quality');
  const c = data.current ?? {};
  return {
    euAqi: c.european_aqi ?? null,
    pm25: c.pm2_5 ?? null,
    pm10: c.pm10 ?? null,
    ozone: c.ozone ?? null,
    no2: c.nitrogen_dioxide ?? null,
    pollenGrass: c.grass_pollen ?? null,
    pollenBirch: c.birch_pollen ?? null,
    pollenAlder: c.alder_pollen ?? null,
    pollenRagweed: c.ragweed_pollen ?? null,
  };
}
