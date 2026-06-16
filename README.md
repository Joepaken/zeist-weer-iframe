# BuurtApps WeerApp — multi-gemeente weer-iframe

Eén Express + TS SSR-app die meerdere gemeenten bedient als weer-iframe.
Aggregeert publieke weer-, lucht- en (waar relevant) getij-data en rendert
een volledig server-side dashboard zodat het in iedere WebView werkt — ook
zonder JS. Eén Railway-deploy = alle gemeenten (minder usage).

## Gemeenten

Geconfigureerd in [`src/municipalities.ts`](src/municipalities.ts). Per gemeente
locatie, branding (logo + naam) en welke lokale extra-secties aan staan.

| Slug | Gemeente | Lokale extra's |
| --- | --- | --- |
| `zeist` | Zeist | — |
| `barendrecht` | Barendrecht | getij (Oude Maas) |
| `capelle` | Capelle aan den IJssel | getij (Hollandsche IJssel) + Algerakering-info |
| `nijverdal` | Nijverdal | natuurbrandrisico + Heuvelrug-recreatie + pollen |
| `almkerk` | Almkerk (Altena) | getij (Nieuwe Merwede/Biesbosch) + Biesbosch-recreatie + pollen |
| `noordwijk` | Noordwijk aan Zee | kust: strandvlag + getij (Noordzee/Scheveningen) + zee & surf |
| `goeree` | Goeree-Overflakkee | hybride: weer Middelharnis + kust van Ouddorp (strandvlag + getij Noordzee + zee & surf) |
| `dordrecht` | Dordrecht | getij (Beneden Merwede) + Biesbosch-recreatie + pollen |
| `apeldoorn` | Apeldoorn | natuurbrandrisico + Veluwe-recreatie + pollen |
| `westland` | Westland | hybride: weer Naaldwijk + kust van Monster/Ter Heijde (strandvlag + getij Noordzee + zee & surf) |

## Endpoints

| Pad | Beschrijving |
| --- | --- |
| `/` | Index met links naar alle gemeenten |
| `/<slug>/weer.html` | SSR-dashboard (iframe-content) |
| `/<slug>/api/weer.json` | Geaggregeerde JSON |
| `/<slug>/health` | Health check per gemeente |
| `/health` | Overzicht alle gemeenten |
| `/weer.html`, `/api/weer.json` | Backward-compat → Zeist |

## Bronnen

- **Open-Meteo Forecast** (`knmi_seamless` = KNMI HARMONIE + ECMWF, 2,5km NL) —
  temperatuur, wind, neerslag, 7-daags. Dag-iconen daglicht-dominant afgeleid.
- **Open-Meteo (default model)** — UV-aanvulling (KNMI-model levert geen UV).
- **Open-Meteo Air Quality** — EU-AQI, PM2.5/10, ozon, NO₂, pollen.
- **Rijkswaterstaat DDAPI20** — getij (astronomisch, HW/LW) voor getij-gemeenten.
- **Open-Meteo Marine** + **strandvlag** (reddingsbrigade-scrape, anders indicatief uit wind+golf) — alleen kustgemeenten (Noordwijk).
- **Buienradar** — lokale Bft, zonkracht, regen-1u (station per gemeente).

## Nieuwe gemeente toevoegen

1. Voeg een entry toe in `src/municipalities.ts` (lat/lon, buienradar-station,
   logo-URL, en bij getij een geverifieerde RWS-stationcode + `features.tide`).
2. Getij-station verifiëren via de RWS DDAPI20-catalogus (`OphalenCatalogus`);
   test met `ProcesType: astronomisch` — HTTP 204 = geen getij-data daar.
3. Klaar — de routes `/—<slug>/…` werken automatisch.

## Lokaal draaien

```bash
cp .env.example .env
npm install
npm run dev
# → http://localhost:3000/            (index)
# → http://localhost:3000/capelle/weer.html
```

## Deploy (Railway)

```bash
railway up --ci
# variabelen: PORT (auto), REFRESH_INTERVAL_MS optioneel
```

## Iframe-snippet

```html
<iframe
  src="https://<railway-domein>/<gemeente>/weer.html"
  width="100%"
  height="1400"
  style="border:0; width:100%;"
  loading="lazy"
  referrerpolicy="no-referrer-when-downgrade"></iframe>
```
