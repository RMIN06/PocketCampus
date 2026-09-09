"use client";
import { placesApi } from "./api-client";
import type { LatLng, PlaceKind, PlaceResult } from "./types";

export async function fetchNearbyPlaces(position: LatLng, kinds: PlaceKind[] = ["food", "books"], signal?: AbortSignal): Promise<PlaceResult[]> {
  const places = await placesApi.nearby(position, signal);
  return places.filter(place => kinds.includes(place.kind));
}

export function mapsDirectionsUrl(place: PlaceResult): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${place.lat},${place.lon}`;
}
