import axios from "axios";
import type { LatLng } from "leaflet";
import type { Ref } from 'vue';


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
  access?: "private" | "customers" | "restricted" | "permissive" | "yes";
  amenity?: "toilets";
  bottle?: "yes" | "no";
  fee?: "yes" | "no";
  man_made?: "water_tap";
  wheelchair?: "yes" | "no" | "limited";
  changing_table?:"yes" | "no" | "limited";
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

export default {
  searchToiletSpots(bounds: any, options?: Ref<string[]>) {
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
    } ${options?.value.includes("wheelchair") ? "['wheelchair'='yes']" : ""} ${
      options?.value.includes("drinking_water")
        ? "['drinking_water'='yes']"
        : ""
    }`;
    const url = `https://www.overpass-api.de/api/interpreter?data=[out:json];node["amenity"="toilets"]${optionsParams}(${rect});out body;`;
    return axios.get<{ elements: OverpassElement[] }>(url).then((response) => {
      console.log("RESPONSE", response);
      return response.data?.elements;
    });
  },
};

