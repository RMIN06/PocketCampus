// app/(main)/explore/page.tsx
// Location tracker: auto-detects the current position (browser Geolocation,
// watched so it stays live) and shows real nearby bookshops and eating spots
// on an OpenStreetMap map via the Overpass API.
"use client";

import { useEffect, useMemo, useState } from "react";
import { MapView } from "@/components/explore/MapView";
import { useGeolocation } from "@/lib/useGeolocation";
import { fetchNearbyPlaces, mapsDirectionsUrl } from "@/lib/places";
import { formatDistance } from "@/lib/format";
import { Reveal, RevealList, RevealItem } from "@/components/motion";
import { Button } from "@/components/ui/Button";
import type { PlaceKind, PlaceResult } from "@/lib/types";

type Filter = "all" | PlaceKind;

export default function ExplorePage() {
  const { position, accuracy, error: geoError, loading: locating, refresh } = useGeolocation(true);
  const [places, setPlaces] = useState<PlaceResult[]>([]);
  const [placesLoading, setPlacesLoading] = useState(false);
  const [placesError, setPlacesError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Filter>("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Search when we get a fix (or the user moves significantly)
  useEffect(() => {
    if (!position) return;
    let cancelled = false;
    setPlacesLoading(true);
    setPlacesError(null);
    fetchNearbyPlaces(position, ["food", "books"])
      .then((results) => {
        if (!cancelled) setPlaces(results);
      })
      .catch(() => {
        if (!cancelled)
          setPlacesError("Couldn't load nearby places - check your connection and retry.");
      })
      .finally(() => {
        if (!cancelled) setPlacesLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [position?.lat, position?.lon]); // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = useMemo(
    () => (filter === "all" ? places : places.filter((p) => p.kind === filter)),
    [places, filter]
  );

  return (
    <div className="flex min-h-svh flex-col overflow-x-hidden pb-24">
      {/* -- Editorial header ------------------------------------------- */}
      <header className="px-4 pt-10">
        <Reveal>
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-ink-soft">
            Live location / OpenStreetMap
          </p>
          <h1 className="mt-2 text-4xl font-extrabold tracking-tight text-forest sm:text-5xl">
            Explore
          </h1>
          <span
            aria-hidden="true"
            className="mt-3 block h-1.5 w-16 rounded-full bg-terracotta"
          />
          <p className="mt-4 max-w-sm text-base text-ink">
            Bookshops and eating spots around you, from your real current
            location.
          </p>
        </Reveal>
      </header>

      {/* -- Location status -------------------------------------------- */}
      <div className="px-4 pt-5">
        {locating && !position && (
          <div className="flex items-center gap-3 rounded-2xl border border-border-subtle bg-bg-surface p-4">
            <div className="animate-spin rounded-full h-5 w-5 border-2 border-terracotta border-t-transparent" />
            <p className="text-sm text-ink-soft">Getting your current location...</p>
          </div>
        )}

        {position && (
          <div className="flex items-center justify-between gap-3 rounded-2xl border border-border-subtle bg-bg-surface p-4">
            <div className="flex items-center gap-3 min-w-0">
              <span className="relative flex size-3 shrink-0">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-terracotta opacity-60" />
                <span className="relative inline-flex size-3 rounded-full bg-terracotta" />
              </span>
              <p className="truncate text-sm text-ink">
                Tracking / {position.lat.toFixed(4)}, {position.lon.toFixed(4)}
                {accuracy ? ` (+/-${Math.round(accuracy)} m)` : ""}
              </p>
            </div>
            <Button variant="ghost" size="sm" onClick={refresh}>
              Refresh
            </Button>
          </div>
        )}

        {geoError && (
          <div className="rounded-2xl border border-terracotta-dark/20 bg-terracotta-tint p-4">
            <p className="text-sm text-terracotta-dark">{geoError}</p>
            <Button variant="secondary" size="sm" className="mt-3" onClick={refresh}>
              Try again
            </Button>
          </div>
        )}
      </div>

      {/* -- Map -------------------------------------------------------- */}
      <div className="px-4 pt-4">
        <div className="h-72 overflow-hidden rounded-2xl border border-border-subtle shadow-sm">
          <MapView
            center={position}
            userPosition={position}
            places={filtered}
            selectedId={selectedId}
            onSelect={setSelectedId}
          />
        </div>
      </div>

      {/* -- Filter chips ----------------------------------------------- */}
      <div className="flex gap-2 px-4 pb-1 pt-5">
        {(["all", "food", "books"] as Filter[]).map((f) => (
          <Button
            key={f}
            variant={filter === f ? "primary" : "ghost"}
            size="sm"
            onClick={() => {
              setFilter(f);
              setSelectedId(null);
            }}
          >
            {f === "all" ? "All" : f === "food" ? "Eating spots" : "Bookshops"}
          </Button>
        ))}
      </div>
    </div>
  );
}