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
import { Reveal } from "@/components/motion";
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
  const [retryKey, setRetryKey] = useState(0);
  // Approximately 100m cells prevent GPS jitter from repeatedly cancelling searches.
  const searchLat = position ? Math.round(position.lat * 1000) / 1000 : null;
  const searchLon = position ? Math.round(position.lon * 1000) / 1000 : null;
  const retry = () => { setRetryKey(key => key + 1); if (!position) refresh(); };
  const mapsSearch = position
    ? `https://www.google.com/maps/search/${encodeURIComponent(filter === "books" ? "bookshops" : filter === "food" ? "restaurants" : "shops")}/@${position.lat},${position.lon},15z`
    : "https://www.google.com/maps/search/bookshops+and+restaurants+near+me/";

  // Search when we get a fix (or the user moves significantly)
  useEffect(() => {
    if (searchLat === null || searchLon === null) return;
    const controller = new AbortController();
    let cancelled = false;
    setPlacesLoading(true);
    setPlacesError(null);
    setPlaces([]);
    setSelectedId(null);
    fetchNearbyPlaces({lat: searchLat, lon: searchLon}, ["food", "books"], controller.signal)
      .then((results) => {
        if (!cancelled) setPlaces(results);
      })
      .catch((error) => {
        if (!cancelled)
          setPlacesError(error instanceof Error ? error.message : "Couldn't load nearby places. Please retry.");
      })
      .finally(() => {
        if (!cancelled) setPlacesLoading(false);
      });
    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [searchLat, searchLon, retryKey]);

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
            <Button variant="ghost" size="sm" onClick={() => {refresh(); retry();}} disabled={placesLoading}>
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
      <section className="px-4 py-4" aria-label="Nearby shops">
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="text-xl font-bold text-forest">Nearby places</h2>
          {position && <span className="text-xs text-ink-soft">Within 2 km</span>}
        </div>
        {placesLoading && <p role="status" className="rounded-xl bg-bg-surface p-4 text-sm">Finding bookshops and eating spots…</p>}
        {placesError && <div role="alert" className="rounded-xl bg-terracotta-tint p-4 text-sm text-terracotta-dark">
          <p>{placesError}</p><Button size="sm" variant="secondary" className="mt-3" onClick={retry}>Retry search</Button>
        </div>}
        {!position && !locating && <p className="py-3 text-sm text-ink-soft">Allow location access to find shops around you, or use the map search below.</p>}
        {position && !placesLoading && !placesError && filtered.length === 0 && <p className="rounded-xl bg-bg-surface p-4 text-sm text-ink-soft">No {filter === "books" ? "bookshops" : filter === "food" ? "eating spots" : "named places"} are listed here in OpenStreetMap. Coverage varies by area; try the map search below.</p>}
        {!placesLoading && !placesError && filtered.length > 0 && <>
          <p role="status" className="mb-3 text-sm text-ink-soft">{filtered.length} places · nearest first</p>
          <ul className="space-y-3">
            {filtered.map(place => <li key={place.id} className={`rounded-2xl border bg-bg-surface p-4 ${selectedId === place.id ? "border-forest" : "border-border-subtle"}`}>
              <button type="button" onClick={() => setSelectedId(place.id)} aria-pressed={selectedId === place.id} className="min-h-11 w-full text-left focus-visible:outline-forest">
                <span className="block font-bold text-forest">{place.name}</span>
                <span className="text-sm text-ink-soft">{place.detail || (place.kind === "books" ? "Bookshop" : "Eating spot")} · {formatDistance(place.distanceMeters)} away</span>
              </button>
              <a href={mapsDirectionsUrl(place)} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex min-h-11 items-center text-sm font-semibold text-forest underline" aria-label={`Directions to ${place.name}`}>Get directions ↗</a>
            </li>)}
          </ul>
        </>}
        <a href={mapsSearch} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex min-h-11 items-center font-semibold text-forest underline">Search nearby in Google Maps ↗</a>
        <p className="mt-2 text-xs text-ink-soft">Places © OpenStreetMap contributors. Location is used to search nearby places and is not saved to your account.</p>
      </section>
    </div>
  );
}
