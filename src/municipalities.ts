/**
 * Gemeente-registry voor de multi-tenant WeerApp.
 *
 * Eén Railway-deploy bedient meerdere gemeenten, pad-gerouteerd
 * (/<slug>/weer.html). Per gemeente staan hier locatie, branding en
 * welke lokale extra-secties aan staan. Eén nieuwe gemeente toevoegen =
 * één entry hieronder + (bij getij) een geverifieerde RWS-stationcode.
 */

export interface StormSurgeBarrier {
  /** Naam van de kering, bv. 'Algerakering'. */
  name: string;
  /** Indicatief sluitpeil in cm t.o.v. NAP (per kering te bevestigen). */
  closeLevelCmNap: number;
  /** Korte uitleg over de functie van de kering. */
  infoNL: string;
}

export interface MunicipalityFeatures {
  /** Eb & vloed-sectie (vereist tideStation). */
  tide?: boolean;
  /** Stormvloedkering-infopaneel, afgeleid uit de getijdata. */
  stormSurgeBarrier?: StormSurgeBarrier;
  /** Natuur-recreatieblok met passend buitenadvies. */
  natureRecreation?: 'biesbosch' | 'heuvelrug' | 'veluwe';
  /** Indicatief natuurbrandrisico (berekend uit het weer). */
  fireRisk?: boolean;
  /** Pollen/hooikoorts nadrukkelijker tonen. */
  pollenProminent?: boolean;
  /** Zee & surf-sectie (Open-Meteo Marine) — kustgemeenten. */
  marine?: boolean;
  /** Strandvlag met live scrape-URL van de reddingsbrigade. */
  beachFlag?: { url: string };
}

export interface MunicipalityConfig {
  slug: string;
  /** Plaatsnaam, bv. 'Capelle aan den IJssel'. */
  name: string;
  /** App-merknaam in de topbar, bv. 'CapelleApp'. */
  appName: string;
  lat: number;
  lon: number;
  /** Marine/strand-coördinaten los van het weerpunt (default = lat/lon).
   *  Bv. eilandmidden-weer + kustblokken van de strandkant. */
  marineLat?: number;
  marineLon?: number;
  buienradarStation: number;
  /** Open-Meteo model; knmi_seamless = HARMONIE+ECMWF, hyperlokaal NL. */
  forecastModel: string;
  /** Logo-URL voor de topbar; null → tekst-wordmark fallback. */
  logoUrl: string | null;
  /** Merkkleur (nu overal hetzelfde oranje). */
  themeColor: string;
  /** RWS DDAPI20 station-code voor getij; alleen bij getij-gemeenten. */
  tideStation?: string;
  /** Naam van het water bij de getij-sectie, bv. 'Oude Maas'. */
  tideWaterName?: string;
  features: MunicipalityFeatures;
}

const THEME = '#F5A624';
const KNMI = 'knmi_seamless';

export const MUNICIPALITIES: Record<string, MunicipalityConfig> = {
  zeist: {
    slug: 'zeist',
    name: 'Zeist',
    appName: 'ZeistApp',
    lat: 52.0907,
    lon: 5.2342,
    buienradarStation: 6260, // De Bilt
    forecastModel: KNMI,
    logoUrl:
      'https://www.zeistapp.nl/wp-content/uploads/2025/10/Zeist_logo_tekst-2048x874-1.png',
    themeColor: THEME,
    features: {},
  },

  barendrecht: {
    slug: 'barendrecht',
    name: 'Barendrecht',
    appName: 'BarendrechtApp',
    lat: 51.857,
    lon: 4.535,
    buienradarStation: 6344, // Rotterdam
    forecastModel: KNMI,
    // Logo wordt op barendrechtapp.nl via JS geladen — URL te bevestigen;
    // null = tekst-wordmark zolang de echte URL ontbreekt.
    logoUrl: null,
    themeColor: THEME,
    tideStation: 'heinenoord.goidschalxoord',
    tideWaterName: 'Oude Maas',
    features: { tide: true },
  },

  capelle: {
    slug: 'capelle',
    name: 'Capelle aan den IJssel',
    appName: 'CapelleApp',
    lat: 51.929,
    lon: 4.577,
    buienradarStation: 6344, // Rotterdam
    forecastModel: KNMI,
    logoUrl: 'https://www.capelleapp.nl/wp-content/uploads/2025/10/logo_tekst-scaled-1.png',
    themeColor: THEME,
    tideStation: 'krimpenaandeijssel.hollandscheijssel',
    tideWaterName: 'Hollandsche IJssel',
    features: {
      tide: true,
      stormSurgeBarrier: {
        name: 'Algerakering',
        // Indicatief sluitpeil van de Hollandsche IJsselkering (te bevestigen).
        closeLevelCmNap: 225,
        infoNL:
          'De Algerakering bij Krimpen hoort bij de Hollandsche IJsselkering — onderdeel van de Deltawerken. Bij extreem hoogwater sluit de kering om Capelle, Krimpen en omgeving te beschermen.',
      },
    },
  },

  nijverdal: {
    slug: 'nijverdal',
    name: 'Nijverdal',
    appName: 'NijverdalApp',
    lat: 52.362,
    lon: 6.462,
    buienradarStation: 6278, // Heino
    forecastModel: KNMI,
    logoUrl: 'https://www.nijverdalapp.nl/wp-content/uploads/2025/10/logo_tekst1-scaled.png',
    themeColor: THEME,
    // Niet-getijde (Regge / Sallandse Heuvelrug) → natuurvariant.
    features: { fireRisk: true, natureRecreation: 'heuvelrug', pollenProminent: true },
  },

  almkerk: {
    slug: 'almkerk',
    name: 'Almkerk',
    appName: 'AltenaApp',
    lat: 51.783,
    lon: 4.954,
    buienradarStation: 6356, // Herwijnen
    forecastModel: KNMI,
    logoUrl: 'https://www.altenaapp.nl/wp-content/uploads/2025/10/logo_tekst-scaled.png',
    themeColor: THEME,
    tideStation: 'werkendam.nieuwemerwede',
    tideWaterName: 'Nieuwe Merwede',
    features: { tide: true, natureRecreation: 'biesbosch', pollenProminent: true },
  },

  // Kustvariant: dupliceert NoordwijkWeerApp als tenant (zee, getij,
  // strandvlag). De bestaande Noordwijk-deploy blijft los hiervan draaien.
  noordwijk: {
    slug: 'noordwijk',
    name: 'Noordwijk aan Zee',
    appName: 'NoordwijkApp',
    lat: 52.24,
    lon: 4.43,
    buienradarStation: 6225,
    forecastModel: KNMI,
    logoUrl:
      'https://www.denoordwijkapp.nl/wp-content/uploads/2025/10/NOORDWIJK_logo_tekst-scaled.png',
    themeColor: THEME,
    tideStation: 'scheveningen',
    tideWaterName: 'Noordzee',
    features: {
      tide: true,
      marine: true,
      beachFlag: { url: 'https://www.reddingsbrigadenoordwijk.nl/strand/' },
    },
  },

  // Hybride kust-tenant: weer op Middelharnis (eilandmidden), maar de
  // kustblokken (strandvlag, getij, zee) van de Ouddorpse Noordzeekust.
  goeree: {
    slug: 'goeree',
    name: 'Goeree-Overflakkee',
    appName: 'GoereeApp',
    lat: 51.755,
    lon: 4.173,
    marineLat: 51.807, // Ouddorp aan Zee
    marineLon: 3.873,
    buienradarStation: 6330, // Hoek van Holland
    forecastModel: KNMI,
    logoUrl:
      'https://www.goereeapp.nl/wp-content/uploads/2025/10/Goeree_logo_tekst-2048x731-1.png',
    themeColor: THEME,
    tideStation: 'haringvliet.10',
    tideWaterName: 'Noordzee',
    features: {
      tide: true,
      marine: true,
      beachFlag: { url: 'https://www.ouddorpsereddingsbrigade.nl/' },
    },
  },

  // Rivier-getijdenstad op het Eiland van Dordrecht, grenzend aan de
  // Dordtse Biesbosch. Getij + natuurblok + pollen (zoals Almkerk).
  dordrecht: {
    slug: 'dordrecht',
    name: 'Dordrecht',
    appName: 'DordrechtApp',
    lat: 51.814,
    lon: 4.668,
    buienradarStation: 6344, // Rotterdam
    forecastModel: KNMI,
    logoUrl:
      'https://www.dedordrechtapp.nl/wp-content/uploads/2025/10/dordrecht_logo_tekst-scaled.png',
    themeColor: THEME,
    tideStation: 'dordrecht.oudemaas.benedenmerwede',
    tideWaterName: 'Beneden Merwede',
    features: { tide: true, natureRecreation: 'biesbosch', pollenProminent: true },
  },

  // Hybride kust-tenant: weer op Naaldwijk (Glazen Stad), maar de
  // kustblokken van de Westlandse Noordzeekust (Monster/Ter Heijde).
  westland: {
    slug: 'westland',
    name: 'Westland',
    appName: 'WestlandApp',
    lat: 51.994,
    lon: 4.21,
    marineLat: 52.02, // Monster/Ter Heijde-kust
    marineLon: 4.16,
    buienradarStation: 6330, // Hoek van Holland
    forecastModel: KNMI,
    logoUrl:
      'https://www.westlandapp.nl/wp-content/uploads/2025/10/Westland_logo_tekst-2048x584-1.png',
    themeColor: THEME,
    tideStation: 'hoekvanholland',
    tideWaterName: 'Noordzee',
    features: {
      tide: true,
      marine: true,
      beachFlag: { url: 'https://www.reddingsbrigade.com/strandinformatie/' },
    },
  },

  // Inland Veluwe-stad: bos & heide, geen getij. Natuurvariant met
  // natuurbrandrisico (zeer relevant op de Veluwe), natuurblok + pollen.
  apeldoorn: {
    slug: 'apeldoorn',
    name: 'Apeldoorn',
    appName: 'ApeldoornApp',
    lat: 52.211,
    lon: 5.969,
    buienradarStation: 6275, // Deelen (Veluwe-rand)
    forecastModel: KNMI,
    logoUrl: 'https://www.apeldoornapp.nl/wp-content/uploads/2025/10/logo_tekst-1-scaled.png',
    themeColor: THEME,
    features: { fireRisk: true, natureRecreation: 'veluwe', pollenProminent: true },
  },
};

/** Slug die de root-routes (zonder pad-prefix) bedienen. */
export const DEFAULT_SLUG = 'zeist';

export function getMunicipality(slug: string | undefined): MunicipalityConfig | null {
  if (!slug) return null;
  return MUNICIPALITIES[slug.toLowerCase()] ?? null;
}

export function allMunicipalities(): MunicipalityConfig[] {
  return Object.values(MUNICIPALITIES);
}
