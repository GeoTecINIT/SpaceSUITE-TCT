// Strict TypeScript DTOs for /v1/autocomplete (Pelias / Geocode Earth API)

/* -------------------- Request Parameters -------------------- */

export type Source =
  | "openstreetmap" | "osm"
  | "openaddresses" | "oa"
  | "geonames" | "gn"
  | "whosonfirst" | "wof";

export type Layer =
  | "venue" | "address" | "street"
  | "country" | "macroregion" | "region"
  | "macrocounty" | "county" | "locality"
  | "localadmin" | "borough" | "neighbourhood"
  | "coarse" | "postalcode";

export interface FocusPoint {
  readonly lat: number;
  readonly lon: number;
}

export interface BoundaryRect {
  readonly min_lon: number;
  readonly min_lat: number;
  readonly max_lon: number;
  readonly max_lat: number;
}

export interface BoundaryCircle {
  readonly lat: number;
  readonly lon: number;
  /** Radius in kilometers */
  readonly radius: number;
}

/** Query parameters accepted by /v1/autocomplete */
export interface AutocompleteParams {
  readonly text: string; // required
  readonly size?: number; // default 10
  readonly focus?: FocusPoint;
  readonly boundaryRect?: BoundaryRect;
  readonly boundaryCircle?: BoundaryCircle;
  readonly sources?: readonly Source[];
  readonly layers?: readonly Layer[];
  /** Comma-separated list of ISO alpha-2 or alpha-3 country codes */
  readonly boundaryCountry?: readonly string[];
  readonly boundaryGid?: string;
}

/* -------------------- Response DTO -------------------- */

/** Coordinates [longitude, latitude] */
export type LonLat = readonly [number, number];

/** Bounding box [minLon, minLat, maxLon, maxLat] */
export type BBox4 = readonly [number, number, number, number];

export type GeometryType = "Point";

/** Geometry (fixed to Point for this endpoint) */
export interface GeometryPoint {
  readonly type: GeometryType;
  readonly coordinates: LonLat;
}

/** Engine metadata under geocoding.engine */
export interface EngineInfo {
  readonly name: string;
  readonly author: string;
  readonly version: string;
}

/** Language info under geocoding.query.lang */
export interface QueryLang {
  readonly name: string;
  readonly iso6391: string;
  readonly iso6393: string;
  readonly via: string;
  readonly defaulted: boolean;
}

/** Parsed text fields under geocoding.query.parsed_text */
export interface ParsedText {
  readonly subject?: string;
}

/** Geocoding metadata root */
export interface GeocodingMeta {
  readonly version: string;
  readonly attribution: string;
  readonly query: {
    readonly text: string;
    readonly parser: string;
    readonly parsed_text: ParsedText;
    readonly size: number;
    readonly layers: readonly Layer[];
    readonly private: boolean;
    readonly lang: QueryLang;
    readonly querySize: number;
  };
  readonly warnings?: readonly string[];
  readonly engine: EngineInfo;
  readonly timestamp: number; // epoch ms
}

/** OSM addendum with known keys */
export interface OsmAddendumStrict {
  readonly wikidata?: string;
  readonly wikipedia?: string;
  readonly opening_hours?: string;
  readonly website?: string;
  readonly phone?: string;
  readonly brand?: string;
  readonly wheelchair?: string;
  /** Any other OSM key-value pairs */
  readonly other?: Readonly<Record<string, string>>;
}

/** Addendum section (allows multiple namespaces, e.g. osm) */
export interface AddendumStrict {
  readonly osm?: OsmAddendumStrict;
  readonly [key: string]: OsmAddendumStrict | undefined;
}

/** Accuracy values observed in Pelias data */
export type Accuracy = "point" | "street" | "rooftop" | "local" | string;

/** Properties for a single feature */
export interface FeatureProperties {
  readonly id: string;
  readonly gid: string;
  readonly layer: Layer | (string & {}); // allow unknown layers
  readonly source: string;
  readonly source_id: string;

  readonly country_code?: string;
  readonly name?: string;
  readonly street?: string;
  readonly housenumber?: string;
  readonly postalcode?: string;
  readonly accuracy?: Accuracy;

  readonly country?: string;
  readonly country_gid?: string;
  readonly country_a?: string;

  readonly region?: string;
  readonly region_gid?: string;
  readonly region_a?: string;

  readonly macroregion?: string;
  readonly macroregion_gid?: string;

  readonly macrocounty?: string;
  readonly macrocounty_gid?: string;

  readonly county?: string;
  readonly county_gid?: string;
  readonly county_a?: string;

  readonly localadmin?: string;
  readonly localadmin_gid?: string;

  readonly locality?: string;
  readonly locality_gid?: string;

  readonly neighbourhood?: string;
  readonly neighbourhood_gid?: string;

  readonly borough?: string;
  readonly borough_gid?: string;

  readonly continent?: string;
  readonly continent_gid?: string;

  readonly label?: string;
  readonly index?: number;

  readonly addendum?: AddendumStrict;
}

/** GeoJSON Feature (strict) */
export interface FeatureStrict {
  readonly type: "Feature";
  readonly geometry: GeometryPoint;
  readonly properties: FeatureProperties;
  readonly bbox?: BBox4;
}

/** Final response for /v1/autocomplete */
export interface AutocompleteResponse {
  readonly geocoding: GeocodingMeta;
  readonly type: "FeatureCollection";
  readonly features: readonly FeatureStrict[];
  readonly bbox?: BBox4;
}
