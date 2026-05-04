# ZeistWeerApp — weer-iframe

Dashboard-iframe voor de ZeistApp. Aggregeert publieke weer- en luchtkwaliteits-API's en rendert
een volledig server-side gerenderd dashboard zodat het in iedere WebView werkt — ook zonder JS.

## Endpoints

| Pad | Beschrijving |
| --- | --- |
| `/` | Mini-indexpagina met links |
| `/weer.html` | Volledig SSR-dashboard (iframe-content) |
| `/api/weer.json` | Geaggregeerde JSON van alle bronnen |
| `/health` | Health check + cache-status |

## Bronnen

- **Open-Meteo Forecast** — temperatuur, wind, neerslag, UV, 7-daags
- **Open-Meteo Air Quality** — EU-AQI, PM2.5/10, ozon, NO₂, pollen
- **Buienradar 6260 (De Bilt)** — lokale Bft, zonkracht, regen-1u

## Lokaal draaien

```bash
cp .env.example .env
npm install
npm run dev
# → http://localhost:3000/weer.html
```

## Deploy (Railway)

```bash
railway init --name zeist-weer-iframe
railway variables set LAT=52.0907 LON=5.2342 BUIENRADAR_STATION=6260 REFRESH_INTERVAL_MS=600000
railway up --ci
railway domain
```

## Iframe-snippet

```html
<iframe
  src="https://<railway-domein>/weer.html"
  width="100%"
  height="1100"
  style="border:0; width:100%;"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"></iframe>
```
