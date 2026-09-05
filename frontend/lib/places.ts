// lib/places.ts
// Nearby real-world places via the OpenStreetMap Overpass API.
// No API key required — data © OpenStreetMap contributors (ODbL).
"use client";

import type { LatLng, PlaceKind, PlaceResult } from "./types";

const OVERPASS_URL = "https://overpass-api.de/api/interpreter";
const SEARCH_RADIUS_M = 2000;
const MAX_RESULTS = 40;

const FOOD_FILTERS = '["amenity"~"^(restaurant|cafe|fast_food|food_court|canteen)$"]';
const BOOKS_FILTERS = '["shop"="books"]';

function haversineMeters(a: LatLng, b: LatLng): number {
  const R = 6371000;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLon = ((b.lon - a.lon) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

interface OverpassElement {
  type: string;
  id: number;
  lat?: number;
  lon?: number;
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

export async function fetchNearbyPlaces(
  position: LatLng,
  kinds: PlaceKind[] = ["food", "books"]
): Promise<PlaceResult[]> {
  const filters: string[] = [];
  if (kinds.includes("food")) filters.push(`node(around:${SEARCH_RADIUS_M},${position.lat},${position.lon})${FOOD_FILTERS};`);
  if (kinds.includes("books")) filters.push(`node(around:${SEARCH_RADIUS_M},${position.lat},${position.lon})${BOOKS_FILTERS};`);
  // Ways/relations (larger places) — use their center point
  if (kinds.includes("food")) filters.push(`way(around:${SEARCH_RADIUS_M},${position.lat},${position.lon})${FOOD_FILTERS};`);
  if (kinds.includes("books")) filters.push(`way(around:${SEARCH_RADIUS_M},${position.lat},${position.lon})${BOOKS_FILTERS};`);

  const query = `[out:json][timeout:25];(${filters.join("")});out center ${MAX_RESULTS * 2};`;

  const response = await fetch(OVERPASS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: `data=${encodeURIComponent(query)}`,
  });

  if (!response.ok) {
    throw new Error(`Overpass API failed (${response.status})`);
  }

  const data = (await response.json()) as { elements?: OverpassElement[] };

  const places: PlaceResult[] = [];
  const seen = new Set<string>();

  for (const el of data.elements || []) {
    const lat = el.lat ?? el.center?.lat;
    const lon = el.lon ?? el.center?.lon;
    const tags = el.tags || {};
    const name = tags.name;
    if (lat === undefined || lon === undefined || !name) continue;

    const key = name.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);

    const isBooks = tags.shop === "books";
    const kind: PlaceKind = isBooks ? "books" : "food";

    places.push({
      id: `${el.type}/${el.id}`,
      name,
      kind,
      detail: isBooks ? tags["shop"] && "Bookshop" : tags.cuisine?.split(";")[0]?.replace(/_/g, " "),
      lat,
      lon,
      distanceMeters: Math.round(haversineMeters(position, { lat, lon })),
    });
  }

  // Nearest first, cap the list
  places.sort((a, b) => a.distanceMeters - b.distanceMeters);
  return places.slice(0, MAX_RESULTS);
}

export function mapsDirectionsUrl(place: PlaceResult): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
}