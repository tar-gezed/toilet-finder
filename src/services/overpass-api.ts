import axios from "axios";
import type { LatLng } from "leaflet";
import type { Ref } from "vue";
import { useToast } from "vue-toastification";

export type OverpassBounds = {
  south: number;
  west: number;
  north: number;
  east: number;
};

export type OverpassElement = {
  id: number;
  lat: number;
  lon: number;
  tags: OverpassTags;
};

export type OverpassTags = {
  access?: "private" | "customers" | "restricted" | "permissive" | "yes" | "public";
  amenity?: "toilets";
  bottle?: "yes" | "no";
  fee?: "yes" | "no";
  man_made?: "water_tap";
  wheelchair?: "yes" | "no" | "limited" | "designated";
  changing_table?: "yes" | "no" | "limited" | "designated";
  name?: string;
  indoor?: "no" | "yes";
  drinking_water?: "yes";
  natural?: "spring";
  disused?: "no" | "yes";
  working?: "no" | "yes";
  seasonal?: "no" | "yes";
  opening_hours?: string;
  image?: string;
  wikimedia_commons?: string;
  "drink:sparkling_water"?: "yes" | "no";
  "drinking_water:legal"?: "yes" | "no";
  operational_status?: "out_of_order";
  unisex?: "yes" | "no";
  "toilets:handwashing"?: "yes" | "no";
  "toilets:paper_provided"?: "yes" | "no";
  "payment:coins"?: "yes" | "no";
  "payment:cash"?: "yes" | "no";
  "payment:notes"?: "yes" | "no";
  "payment:cards"?: "yes" | "no";
  "payment:credit_cards"?: "yes" | "no";
  "payment:debit_cards"?: "yes" | "no";
  "payment:contactless"?: "yes" | "no";
  operator?: string;
  "toilets:position"?: string;
  "toilets:disposal"?: string;
  [key: string]: any;
};

export type ToiletSpot = {
  position: LatLng;
  id: number;
  tags: ToiletTags;
};

export type ToiletTags = {
  name?: string;
  fee?: true;
  bottle?: boolean;
  restrictedAccess?: "private" | "customers" | "restricted" | "permissive";
  outOfOrder?: true;
  image?: string;
  seasonal?: true;
  openingHours?: string;
  isSparking?: true;
  noDrinking?: true;
};

export type OverpassOptions = "fee_no" | "wheelchair" | "drinking_water";

// Overpass API endpoints — primary and fallback
const OVERPASS_ENDPOINTS = [
  "https://www.overpass-api.de/api/interpreter",
  "https://overpass.private.coffee/api/interpreter",
];

// Request timeout in milliseconds
const REQUEST_TIMEOUT_MS = 15_000;

// Module-level toast instance – safe because main.ts installs the plugin before any component mounts.
const toast = useToast();

/**
 * Build the Overpass query URL for a given endpoint, bounding box, and filter options.
 */
function buildQueryUrl(
  endpoint: string,
  rect: string,
  optionsParams: string
): string {
  return `${endpoint}?data=[out:json];node["amenity"="toilets"]${optionsParams}(${rect});out body;`;
}

/**
 * Attempt a single Overpass API request. Throws on failure so the caller can try the next endpoint.
 */
async function fetchFromEndpoint(
  endpoint: string,
  rect: string,
  optionsParams: string
): Promise<OverpassElement[]> {
  const url = buildQueryUrl(endpoint, rect, optionsParams);
  const response = await axios.get<{ elements: OverpassElement[] }>(url, {
    timeout: REQUEST_TIMEOUT_MS,
  });
  return response.data?.elements ?? [];
}

export default {
  /**
   * Search for toilet spots within the given map bounds.
   *
   * Returns `OverpassElement[]` on success (may be empty if no toilets in area),
   * or `null` on failure (network error, 429, timeout on ALL endpoints).
   * Returning `null` lets the caller keep previously cached markers.
   */
  async searchToiletSpots(
    bounds: any,
    options?: Ref<string[]>
  ): Promise<OverpassElement[] | null> {
    const sanitizedBounds = {
      south: bounds.getSouth(),
      north: bounds.getNorth(),
      west: bounds.getWest(),
      east: bounds.getEast(),
    };
    const rect = [
      sanitizedBounds.south,
      sanitizedBounds.west,
      sanitizedBounds.north,
      sanitizedBounds.east,
    ].join(",");
    const optionsParams = `${
      options?.value.includes("fee_no") ? "['fee'='no']" : ""
    }${options?.value.includes("wheelchair") ? "['wheelchair'='yes']" : ""}${
      options?.value.includes("drinking_water")
        ? "['drinking_water'='yes']"
        : ""
    }`;

    // Try each endpoint in order; return on first success
    for (let i = 0; i < OVERPASS_ENDPOINTS.length; i++) {
      const endpoint = OVERPASS_ENDPOINTS[i];
      try {
        return await fetchFromEndpoint(endpoint, rect, optionsParams);
      } catch (err: any) {
        const isLastEndpoint = i === OVERPASS_ENDPOINTS.length - 1;
        const status = err?.response?.status;
        const isRetryable =
          !err?.response || status === 429 || status === 503 || status >= 500;

        if (isRetryable && !isLastEndpoint) {
          // Silently try the next endpoint
          continue;
        }

        // All endpoints exhausted or non-retryable error: notify user
        toast.error(
          status === 429
            ? "Too many requests — please wait a moment"
            : err?.message || "Failed to load toilets"
        );
        return null;
      }
    }

    return null;
  },
};
