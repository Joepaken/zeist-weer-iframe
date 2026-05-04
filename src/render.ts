/**
 * Server-side rendering van het ZeistWeerApp dashboard.
 *
 * Inland-versie: geen kust-secties (vlag/getij/zee).
 * Werkt zonder client-JS — eerste paint is altijd cache-hit.
 */

import type { IconKey } from './util/wmoIcon.js';
import type { WeerSnapshot, HourlyEntry, DailyEntry } from './types.js';
import { msToBft } from './util/beaufort.js';
import { degToCompass } from './util/windRose.js';

const ICONS: Record<IconKey, string> = {
  clear:
    '<svg viewBox="0 0 64 64"><circle cx="32" cy="32" r="14" fill="#FFD56B"/><g stroke="#FFD56B" stroke-width="3" stroke-linecap="round"><path d="M32 6v6"/><path d="M32 52v6"/><path d="M6 32h6"/><path d="M52 32h6"/><path d="M14 14l4 4"/><path d="M46 46l4 4"/><path d="M50 14l-4 4"/><path d="M18 46l-4 4"/></g></svg>',
  partly:
    '<svg viewBox="0 0 64 64"><circle cx="22" cy="24" r="10" fill="#FFD56B"/><path d="M18 38c-6 0-10 4-10 10 0 5 4 9 9 9h26c6 0 11-4 11-10 0-7-6-11-13-10-2-7-9-12-17-10-3 1-6 5-6 11z" fill="#fff" stroke="#84A09F" stroke-width="2"/></svg>',
  cloudy:
    '<svg viewBox="0 0 64 64"><path d="M16 40c-5 0-9 4-9 9 0 5 4 9 9 9h32c6 0 10-4 10-9 0-6-5-10-11-10-1-7-8-12-15-10-5 1-9 5-9 11-3 0-6 1-7 0z" fill="#fff" stroke="#84A09F" stroke-width="2"/></svg>',
  overcast:
    '<svg viewBox="0 0 64 64"><path d="M14 38c-5 0-8 4-8 9 0 5 4 9 9 9h34c6 0 10-4 10-10 0-6-5-10-11-10-2-7-9-11-16-9-5 2-8 6-9 11-3 0-6 0-9 0z" fill="#C8D2DD" stroke="#5A6B82" stroke-width="2"/></svg>',
  fog: '<svg viewBox="0 0 64 64"><path d="M14 30c0-9 8-15 16-15 7 0 13 4 15 11 6 0 10 4 10 10H10c0-3 1-5 4-6z" fill="#D8DEE5" stroke="#84A09F" stroke-width="2"/><g stroke="#84A09F" stroke-width="3" stroke-linecap="round"><path d="M8 46h32"/><path d="M14 54h36"/></g></svg>',
  drizzle:
    '<svg viewBox="0 0 64 64"><path d="M16 32c-5 0-9 4-9 9 0 5 4 9 9 9h32c6 0 10-4 10-10 0-6-5-10-11-10-1-7-8-11-15-9-5 2-8 6-9 11-3 0-6 0-7 0z" fill="#fff" stroke="#84A09F" stroke-width="2"/><g stroke="#4C76BA" stroke-width="2.5" stroke-linecap="round"><path d="M22 54l-2 4"/><path d="M32 54l-2 4"/><path d="M42 54l-2 4"/></g></svg>',
  rain: '<svg viewBox="0 0 64 64"><path d="M16 30c-5 0-9 4-9 9 0 5 4 9 9 9h32c6 0 10-4 10-10 0-6-5-10-11-10-1-7-8-11-15-9-5 2-8 6-9 11-3 0-6 0-7 0z" fill="#fff" stroke="#5A6B82" stroke-width="2"/><g stroke="#4C76BA" stroke-width="3" stroke-linecap="round"><path d="M22 52l-3 7"/><path d="M32 52l-3 7"/><path d="M42 52l-3 7"/></g></svg>',
  'rain-heavy':
    '<svg viewBox="0 0 64 64"><path d="M14 28c-5 0-8 4-8 9 0 5 4 9 9 9h34c6 0 10-4 10-10 0-6-5-10-11-10-2-7-9-11-16-9-5 2-8 6-9 11-3 0-6 0-9 0z" fill="#9FAFC0" stroke="#355272" stroke-width="2"/><g stroke="#355272" stroke-width="3.5" stroke-linecap="round"><path d="M18 50l-4 9"/><path d="M28 50l-4 9"/><path d="M38 50l-4 9"/><path d="M48 50l-4 9"/></g></svg>',
  snow: '<svg viewBox="0 0 64 64"><path d="M16 30c-5 0-9 4-9 9 0 5 4 9 9 9h32c6 0 10-4 10-10 0-6-5-10-11-10-1-7-8-11-15-9-5 2-8 6-9 11-3 0-6 0-7 0z" fill="#fff" stroke="#84A09F" stroke-width="2"/><g fill="#4C76BA" font-size="11" font-weight="700"><text x="20" y="60">❄</text><text x="32" y="60">❄</text><text x="44" y="60">❄</text></g></svg>',
  sleet:
    '<svg viewBox="0 0 64 64"><path d="M16 30c-5 0-9 4-9 9 0 5 4 9 9 9h32c6 0 10-4 10-10 0-6-5-10-11-10-1-7-8-11-15-9-5 2-8 6-9 11-3 0-6 0-7 0z" fill="#fff" stroke="#84A09F" stroke-width="2"/><g stroke="#4C76BA" stroke-width="2.5" stroke-linecap="round"><path d="M24 52l-3 7"/><path d="M40 52l-3 7"/></g><circle cx="32" cy="56" r="2.5" fill="#9FAFC0"/></svg>',
  thunder:
    '<svg viewBox="0 0 64 64"><path d="M14 30c-5 0-8 4-8 9 0 5 4 9 9 9h34c6 0 10-4 10-10 0-6-5-10-11-10-2-7-9-11-16-9-5 2-8 6-9 11-3 0-6 0-9 0z" fill="#5A6B82" stroke="#355272" stroke-width="2"/><polygon points="30,46 22,60 30,60 26,72 42,52 32,52 38,46" fill="#F5C518" stroke="#D4890F" stroke-width="1.5"/></svg>',
};

const BFT_LABEL: Record<number, string> = {
  0: 'Windstil',
  1: 'Zwak',
  2: 'Zwak',
  3: 'Matig',
  4: 'Matig',
  5: 'Vrij krachtig',
  6: 'Krachtig',
  7: 'Hard',
  8: 'Stormachtig',
  9: 'Storm',
  10: 'Zware storm',
  11: 'Zeer zware storm',
  12: 'Orkaan',
};

const round = (n: number, d = 0): number => {
  const p = Math.pow(10, d);
  return Math.round(n * p) / p;
};

const escHtml = (s: string): string =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const fmtTime = (iso: string | null | undefined): string => {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleTimeString('nl-NL', {
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'Europe/Amsterdam',
    });
  } catch {
    return '—';
  }
};

const fmtDayShort = (date: string): string => {
  try {
    return new Date(date + 'T12:00:00')
      .toLocaleDateString('nl-NL', { weekday: 'short', timeZone: 'Europe/Amsterdam' })
      .replace('.', '');
  } catch {
    return date;
  }
};

const fmtDuration = (s: number): string => {
  const h = Math.floor(s / 3600);
  const m = Math.round((s % 3600) / 60);
  return `${h}u ${m}m`;
};

function uvAdvice(uv: number): string {
  if (uv >= 8) return '🧴 Sterk insmeren — vermijd middag';
  if (uv >= 6) return '🧴 Goed insmeren — let op';
  if (uv >= 3) return '☀️ Insmeren bij langer buiten zijn';
  return '✅ Lage UV — geen extra bescherming nodig';
}

function aqiInfo(aqi: number | null): { rank: string; cls: string; color: string } {
  if (aqi == null) return { rank: 'Geen data', cls: 'aqi--na', color: '#84A09F' };
  if (aqi <= 20) return { rank: 'Goed', cls: 'aqi--good', color: '#2BAE66' };
  if (aqi <= 40) return { rank: 'Redelijk', cls: 'aqi--good', color: '#9DD63E' };
  if (aqi <= 60) return { rank: 'Matig', cls: 'aqi--mid', color: '#F5C518' };
  if (aqi <= 80) return { rank: 'Slecht', cls: 'aqi--bad', color: '#F07830' };
  if (aqi <= 100) return { rank: 'Zeer slecht', cls: 'aqi--bad', color: '#E84313' };
  return { rank: 'Extreem slecht', cls: 'aqi--bad', color: '#6B2DD1' };
}

function renderHourly(hours: HourlyEntry[]): string {
  return hours
    .slice(0, 24)
    .map((h) => {
      const t = new Date(h.time).toLocaleTimeString('nl-NL', {
        hour: '2-digit',
        timeZone: 'Europe/Amsterdam',
      });
      const icon = ICONS[h.iconKey] ?? ICONS.cloudy;
      const rain = h.precipitationProb >= 5 ? `💧${round(h.precipitationProb)}%` : '&nbsp;';
      return `<div class="hour"><div class="hour__time">${escHtml(t)}</div><div class="hour__icon">${icon}</div><div class="hour__temp">${round(h.temperature)}°</div><div class="hour__rain">${rain}</div></div>`;
    })
    .join('');
}

function renderDaily(days: DailyEntry[]): string {
  if (!days.length) return '';
  const allMin = Math.min(...days.map((d) => d.tempMin));
  const allMax = Math.max(...days.map((d) => d.tempMax));
  const range = Math.max(allMax - allMin, 1);
  return days
    .slice(0, 7)
    .map((d, i) => {
      const icon = ICONS[d.iconKey] ?? ICONS.cloudy;
      const left = ((d.tempMin - allMin) / range) * 100;
      const width = Math.max(((d.tempMax - d.tempMin) / range) * 100, 6);
      const bft = msToBft(d.windMaxMs).bft;
      const dayName = i === 0 ? 'Vandaag' : i === 1 ? 'Morgen' : fmtDayShort(d.date);
      const rainTxt =
        d.precipitationSum > 0.1
          ? `💧 ${round(d.precipitationSum, 1)} mm · Bft ${bft}`
          : `droog · Bft ${bft}`;
      return `<div class="day"><div class="day__name">${escHtml(dayName)}</div><div class="day__icon">${icon}</div><div><div class="day__bar"><div class="day__bar-fill" style="left:${left.toFixed(1)}%;width:${width.toFixed(1)}%"></div></div><div class="day__rain">${rainTxt}</div></div><div class="day__temps"><span>${round(d.tempMax)}°</span><span class="day__min">${round(d.tempMin)}°</span></div></div>`;
    })
    .join('');
}

function renderAir(snap: WeerSnapshot): {
  aqiBall: string;
  aqiColor: string;
  aqiRank: string;
  pollutants: string;
  pollen: string;
} {
  const a = snap.airQuality;
  if (!a) {
    return {
      aqiBall: '—',
      aqiColor: '#84A09F',
      aqiRank: 'Geen data',
      pollutants: '',
      pollen: '',
    };
  }
  const info = aqiInfo(a.euAqi);
  const ball = a.euAqi != null ? String(round(a.euAqi)) : '—';

  const fmtPp = (v: number | null, unit: string): string =>
    v != null ? `<strong>${round(v, 1)} ${unit}</strong>` : `<strong>—</strong>`;
  const pollutants = [
    `<div>PM2.5${fmtPp(a.pm25, 'µg/m³')}</div>`,
    `<div>PM10${fmtPp(a.pm10, 'µg/m³')}</div>`,
    `<div>Ozon${fmtPp(a.ozone, 'µg/m³')}</div>`,
    `<div>NO₂${fmtPp(a.no2, 'µg/m³')}</div>`,
  ].join('');

  const pollenLevel = (v: number | null): { lbl: string; color: string } => {
    if (v == null) return { lbl: '—', color: '#84A09F' };
    if (v < 1) return { lbl: 'geen', color: '#2BAE66' };
    if (v < 20) return { lbl: 'laag', color: '#9DD63E' };
    if (v < 50) return { lbl: 'matig', color: '#F5C518' };
    if (v < 100) return { lbl: 'hoog', color: '#F07830' };
    return { lbl: 'zeer hoog', color: '#E84313' };
  };
  const pollenItem = (name: string, v: number | null): string => {
    const lv = pollenLevel(v);
    return `<div class="pollen-item" style="border-left:3px solid ${lv.color}">${name}<strong>${lv.lbl}</strong></div>`;
  };
  const pollen = [
    pollenItem('🌿 Gras', a.pollenGrass),
    pollenItem('🌳 Berk', a.pollenBirch),
    pollenItem('🌲 Els', a.pollenAlder),
    pollenItem('🌾 Ambrosia', a.pollenRagweed),
  ].join('');

  return { aqiBall: ball, aqiColor: info.color, aqiRank: info.rank, pollutants, pollen };
}

function renderDetails(snap: WeerSnapshot): string {
  const c = snap.weather?.current;
  if (!c) return '<div class="section-error" style="grid-column:span 4">Details niet beschikbaar</div>';
  const items: Array<{ lbl: string; val: string; sub?: string }> = [
    { lbl: 'Luchtvochtigheid', val: `${round(c.humidity)}%` },
    { lbl: 'Luchtdruk', val: `${round(c.pressureMsl)} hPa` },
    { lbl: 'Zicht', val: `${round(c.visibilityM / 1000, 1)} km` },
    { lbl: 'Dauwpunt', val: `${round(c.dewPoint, 1)}°C` },
  ];
  if (snap.buienradar) {
    const station = snap.buienradar.stationName.replace('Meetstation ', '');
    items.push({ lbl: 'Zonkracht', val: `${round(snap.buienradar.sunPower)} W/m²`, sub: station });
    items.push({
      lbl: 'Regen 1u',
      val: `${round(snap.buienradar.rainLastHour, 1)} mm`,
      sub: station,
    });
  }
  return items
    .map(
      (it) =>
        `<div class="stat"><div class="stat__lbl">${escHtml(it.lbl)}</div><div class="stat__val">${escHtml(it.val)}</div>${it.sub ? `<div class="stat__sub">${escHtml(it.sub)}</div>` : ''}</div>`,
    )
    .join('');
}

export function renderDashboard(template: string, snap: WeerSnapshot | null): string {
  if (!snap) return template;

  const w = snap.weather?.current;
  const today = snap.weather?.daily?.[0];

  let html = template;

  // Hero
  if (w) {
    const sub: string[] = [`Voelt als ${round(w.apparentTemperature)}°`];
    if (w.precipitation > 0) sub.push(`💧 ${round(w.precipitation, 1)} mm/u`);
    if (today) sub.push(`vandaag ${round(today.tempMin)}° / ${round(today.tempMax)}°`);
    html = html.replace(
      '<span id="heroTemp">--</span>',
      `<span id="heroTemp">${round(w.temperature)}</span>`,
    );
    html = html.replace(
      '<div class="hero__label" id="heroLabel">—</div>',
      `<div class="hero__label" id="heroLabel">${escHtml(w.labelNL)}</div>`,
    );
    html = html.replace(
      '<div class="hero__sub" id="heroSub">—</div>',
      `<div class="hero__sub" id="heroSub">${escHtml(sub.join(' · '))}</div>`,
    );
    html = html.replace(
      '<div class="hero__icon" id="heroIcon"></div>',
      `<div class="hero__icon" id="heroIcon">${ICONS[w.iconKey] ?? ICONS.cloudy}</div>`,
    );
  }

  // Verdict band — buitenweer (binnenland)
  if (w) {
    const t = w.temperature;
    const bft = msToBft(w.windMs).bft;
    const rain = today ? today.precipitationSum : w.precipitation;
    let cls = 'verdict--mid';
    let icon = '🌥️';
    let text = 'Matig buitenweer';
    let subTxt = `${round(t)}° · Bft ${bft} · ${round(rain, 1)} mm verwacht`;
    if (t >= 20 && bft <= 4 && rain < 1) {
      cls = 'verdict--top';
      icon = '☀️';
      text = 'Top buitenweer!';
      subTxt = `${round(t)}° · Bft ${bft} · droog`;
    } else if (t < 14 || bft >= 6 || rain > 5) {
      cls = 'verdict--bad';
      icon = '⛈️';
      text = 'Geen weer voor buiten';
      subTxt = `${round(t)}° · Bft ${bft} · ${round(rain, 1)} mm`;
    }
    html = html.replace(
      '<section class="verdict verdict--mid" id="verdict">',
      `<section class="verdict ${cls}" id="verdict">`,
    );
    html = html.replace(
      '<span class="verdict__icon" id="verdictIcon">🌥️</span>',
      `<span class="verdict__icon" id="verdictIcon">${icon}</span>`,
    );
    html = html.replace(
      '<span id="verdictText">Buitenweer wordt geladen…</span>',
      `<span id="verdictText">${escHtml(text)}</span>`,
    );
    html = html.replace(
      '<span class="verdict__sub" id="verdictSub"></span>',
      `<span class="verdict__sub" id="verdictSub">${escHtml(subTxt)}</span>`,
    );
  }

  // Wind
  if (w) {
    const bft = msToBft(w.windMs).bft;
    const compass = degToCompass(w.windDir);
    const km = round(w.windMs * 3.6);
    const gustKm = round(w.windGustMs * 3.6);
    html = html.replace(
      '<div class="wind__num"><span id="windBft">--</span> Bft<small id="windDescr">—</small></div>',
      `<div class="wind__num"><span id="windBft">${bft}</span> Bft<small id="windDescr"> — ${escHtml(BFT_LABEL[bft] ?? '')}</small></div>`,
    );
    html = html.replace(
      '<div class="wind__detail" id="windDetail">—</div>',
      `<div class="wind__detail" id="windDetail">Uit het ${escHtml(compass.short)} (${escHtml(compass.full)}, ${round(w.windDir)}°)<br>${round(w.windMs, 1)} m/s · ${km} km/u${w.windGustMs ? `<br>Windvlagen tot ${gustKm} km/u` : ''}</div>`,
    );
    let ratingTxt = '';
    let ratingBg = 'var(--sage)';
    if (bft <= 2) {
      ratingTxt = '🚴 Prima voor fietsers en wandelaars';
      ratingBg = 'var(--sage)';
    } else if (bft <= 4) {
      ratingTxt = '🚴 Lekker buitenweer';
      ratingBg = 'var(--sage)';
    } else if (bft <= 6) {
      ratingTxt = '💨 Stevige wind — let op tegenwind';
      ratingBg = 'var(--sky-blue)';
    } else {
      ratingTxt = '⚠️ Te hard voor de meeste buitenactiviteiten';
      ratingBg = 'var(--accent)';
    }
    html = html.replace(
      '<span class="wind__rating" id="windRating" hidden></span>',
      `<span class="wind__rating" id="windRating" style="background:${ratingBg}">${escHtml(ratingTxt)}</span>`,
    );
    html = html.replace(
      '<g class="compass__arrow" id="windArrow">',
      `<g class="compass__arrow" id="windArrow" transform="rotate(${round(w.windDir, 1)} 50 50)">`,
    );
  }

  // Sun + UV
  if (today) {
    const uv = w?.uvIndex ?? 0;
    const uvPct = Math.min((uv / 11) * 100, 100);
    html = html.replace(
      '<div class="stat__val" id="sunRise">—</div>',
      `<div class="stat__val" id="sunRise">${escHtml(fmtTime(today.sunrise))}</div>`,
    );
    html = html.replace(
      '<div class="stat__val" id="sunSet">—</div>',
      `<div class="stat__val" id="sunSet">${escHtml(fmtTime(today.sunset))}</div>`,
    );
    html = html.replace(
      '<div class="stat__val" id="sunDur">—</div>',
      `<div class="stat__val" id="sunDur">${escHtml(fmtDuration(today.daylightSeconds))}</div>`,
    );
    html = html.replace(
      '<div class="uv-needle" id="uvNeedle" style="left:0%"></div>',
      `<div class="uv-needle" id="uvNeedle" style="left:${uvPct.toFixed(1)}%"></div>`,
    );
    html = html.replace('<strong id="uvNow">—</strong>', `<strong id="uvNow">${round(uv, 1)}</strong>`);
    html = html.replace(
      '<strong id="uvMax">—</strong>',
      `<strong id="uvMax">${round(today.uvIndexMax, 1)}</strong>`,
    );
    html = html.replace(
      '<div class="uv-advice" id="uvAdvice"></div>',
      `<div class="uv-advice" id="uvAdvice">${escHtml(uvAdvice(today.uvIndexMax))}</div>`,
    );
  }

  // Hourly
  if (snap.weather?.hourly?.length) {
    html = html.replace(
      '<div class="hourly" id="hourly"></div>',
      `<div class="hourly" id="hourly">${renderHourly(snap.weather.hourly)}</div>`,
    );
  }

  // Daily
  if (snap.weather?.daily?.length) {
    html = html.replace(
      '<div class="daily" id="daily"></div>',
      `<div class="daily" id="daily">${renderDaily(snap.weather.daily)}</div>`,
    );
  }

  // Air + pollen
  const air = renderAir(snap);
  html = html.replace(
    '<div class="aqi-ball" id="aqiBall">—</div>',
    `<div class="aqi-ball" id="aqiBall" style="background:${air.aqiColor}">${escHtml(air.aqiBall)}</div>`,
  );
  html = html.replace(
    '<div class="aqi-info__rank" id="aqiRank">—</div>',
    `<div class="aqi-info__rank" id="aqiRank">${escHtml(air.aqiRank)}</div>`,
  );
  html = html.replace(
    '<div class="aqi-pollutants" id="aqiPollutants"></div>',
    `<div class="aqi-pollutants" id="aqiPollutants">${air.pollutants}</div>`,
  );
  html = html.replace(
    '<div class="pollen" id="pollen"></div>',
    `<div class="pollen" id="pollen">${air.pollen}</div>`,
  );

  // Detail strip
  html = html.replace(
    '<div class="detail-grid" id="detailGrid"></div>',
    `<div class="detail-grid" id="detailGrid">${renderDetails(snap)}</div>`,
  );

  // Update-time
  const updTxt = `bijgewerkt ${fmtTime(snap._meta.fetchedAt)}`;
  html = html.replace(
    '<span id="updateTime">—</span>',
    `<span id="updateTime">${escHtml(updTxt)}</span>`,
  );

  return html;
}
