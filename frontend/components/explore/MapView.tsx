// components/explore/MapView.tsx
// Leaflet + OpenStreetMap slippy map (no API key needed).
// Shows the user's live position and nearby place markers.
// Map data (c) OpenStreetMap contributors.
"use client";

import { useEffect, useRef } from "react";
import type { LatLng, PlaceResult } from "@/lib/types";
import "leaflet/dist/leaflet.css";

interface MapViewProps {
  center: LatLng | null;
  userPosition: LatLng | null;
  places: PlaceResult[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function MapView({ center, userPosition, places, selectedId, onSelect }: MapViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const mapRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const markersRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userMarkerRef = useRef<any>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const LRef = useRef<any>(null);

  // Initialize the map once
  useEffect(() => {
    let cancelled = false;

    (async () => {
      const L = (await import("leaflet")).default;
      if (cancelled || !containerRef.current || mapRef.current) return;
      LRef.current = L;

      mapRef.current = L.map(containerRef.current, {
        center: center ? [center.lat, center.lon] : [30.3753, 69.3451], // Pakistan
        zoom: center ? 15 : 5,
        scrollWheelZoom: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
      }).addTo(mapRef.current);

      markersRef.current = L.layerGroup().addTo(mapRef.current);
    })();

    return () => {
      cancelled = true;
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markersRef.current = null;
        userMarkerRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Follow the user's live position
  useEffect(() => {
    const L = LRef.current;
    if (!L || !mapRef.current || !userPosition) return;

    if (!userMarkerRef.current) {
      userMarkerRef.current = L.circleMarker([userPosition.lat, userPosition.lon], {
        radius: 9,
        color: "#ffffff",
        weight: 3,
        fillColor: "#E27D60",
        fillOpacity: 1,
      })
        .addTo(mapRef.current)
        .bindTooltip("You are here");
      mapRef.current.setView([userPosition.lat, userPosition.lon], 15);
    } else {
      userMarkerRef.current.setLatLng([userPosition.lat, userPosition.lon]);
    }
  }, [userPosition]);

  // Re-render place markers
  useEffect(() => {
    const L = LRef.current;
    if (!L || !mapRef.current || !markersRef.current) return;

    markersRef.current.clearLayers();

    for (const place of places) {
      const isBooks = place.kind === "books";
      const isSelected = place.id === selectedId;
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:${isSelected ? 30 : 24}px;height:${isSelected ? 30 : 24}px;
          border-radius:50% 50% 50% 4px;transform:rotate(-45deg);
          background:${isBooks ? "#2D4F1E" : "#E27D60"};
          border:2px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,.35);
          display:flex;align-items:center;justify-content:center;">
          <span style="transform:rotate(45deg);color:#fff;font-size:12px;line-height:1;">
            ${isBooks ? "B" : "E"}
          </span>
        </div>`,
        iconSize: [isSelected ? 30 : 24, isSelected ? 30 : 24],
        iconAnchor: [isSelected ? 15 : 12, isSelected ? 30 : 24],
      });

      L.marker([place.lat, place.lon], { icon })
        .addTo(markersRef.current)
        .bindTooltip(place.name)
        .on("click", () => onSelect(place.id));
    }
  }, [places, selectedId, onSelect]);

  // Pan to a selected place
  useEffect(() => {
    if (!mapRef.current || !selectedId) return;
    const place = places.find((p) => p.id === selectedId);
    if (place) {
      mapRef.current.flyTo([place.lat, place.lon], 16, { duration: 0.6 });
    }
  }, [selectedId, places]);

  return (
    <div
      ref={containerRef}
      className="h-full w-full bg-bg-surface"
      role="application"
      aria-label="Map of nearby places"
    />
  );
}