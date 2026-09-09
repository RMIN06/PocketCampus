"""Bounded, same-origin nearby search with independent Overpass fallbacks."""
import math
from collections import OrderedDict
from threading import Lock
from time import monotonic

import requests
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field
from app.deps import get_current_user

router = APIRouter(prefix="/api/v1/places", tags=["places"])
ENDPOINTS = (
    "https://maps.mail.ru/osm/tools/overpass/api/interpreter",
    "https://overpass.private.coffee/api/interpreter",
)
RADIUS = 2000
_cache = OrderedDict()
_lock = Lock()


class NearbyQuery(BaseModel):
    lat: float = Field(ge=-90, le=90, allow_inf_nan=False)
    lon: float = Field(ge=-180, le=180, allow_inf_nan=False)


def distance(lat, lon, other_lat, other_lon):
    dlat, dlon = math.radians(other_lat - lat), math.radians(other_lon - lon)
    h = math.sin(dlat / 2)**2 + math.cos(math.radians(lat)) * math.cos(math.radians(other_lat)) * math.sin(dlon / 2)**2
    return round(6371000 * 2 * math.asin(min(1, math.sqrt(h))))


def normalize_places(elements, lat, lon):
    places, seen = [], set()
    for el in elements:
        tags = el.get("tags") or {}
        name = tags.get("name") or tags.get("name:en")
        point = el if "lat" in el else el.get("center", {})
        plat, plon = point.get("lat"), point.get("lon")
        if not isinstance(name, str) or not name.strip() or not isinstance(plat, (float, int)) or not isinstance(plon, (float, int)):
            continue
        if not math.isfinite(plat) or not math.isfinite(plon) or not -90 <= plat <= 90 or not -180 <= plon <= 180:
            continue
        key = (name.casefold(), round(plat, 4), round(plon, 4))
        if key in seen:
            continue
        seen.add(key)
        meters = distance(lat, lon, plat, plon)
        if meters > RADIUS:
            continue
        books = tags.get("shop") in ("books", "stationery", "copyshop")
        places.append({
            "id": f"{el.get('type', 'node')}/{el['id']}", "name": name.strip()[:200],
            "kind": "books" if books else "food", "lat": plat, "lon": plon,
            "detail": ("Books & stationery" if books else tags.get("cuisine", "Eating spot").split(";")[0].replace("_", " ")),
            "distanceMeters": meters,
        })
    return sorted(places, key=lambda place: place["distanceMeters"])[:60]


def search_nearby(lat, lon):
    lat, lon = round(lat, 3), round(lon, 3)
    key = (lat, lon)
    with _lock:
        cached = _cache.get(key)
        if cached and monotonic() - cached[0] < 300:
            return cached[1]
    # Relations can cover enormous areas; local shop nodes and buildings are sufficient.
    selectors = []
    for kind in ("node", "way"):
        for key_name, values in (("amenity", "restaurant|cafe|fast_food|food_court|canteen|ice_cream"),
                                 ("shop", "books|stationery|copyshop|bakery")):
            selectors.append(f'{kind}(around:{RADIUS},{lat},{lon})["{key_name}"~"{values}"];')
    query = '[out:json][timeout:20];(' + ''.join(selectors) + ');out center tags;'
    for endpoint in ENDPOINTS:
        try:
            response = requests.get(endpoint, params={"data": query}, timeout=(3, 25), headers={
                "User-Agent": "PocketCampus/1.0 (https://github.com/RMIN06/PocketCampus)",
                "Accept": "application/json",
            })
            response.raise_for_status()
            data = response.json()
            # Overpass can return HTTP 200 with a timeout remark and partial data.
            if data.get("remark") or not isinstance(data.get("elements"), list):
                continue
            places = normalize_places(data["elements"], lat, lon)
            with _lock:
                _cache[key] = (monotonic(), places)
                _cache.move_to_end(key)
                while len(_cache) > 128:
                    _cache.popitem(last=False)
            return places
        except (requests.RequestException, ValueError, KeyError, TypeError):
            continue
    raise HTTPException(status_code=503, detail="The nearby places service is busy. Try again shortly or open the map search below.")


@router.post("/nearby")
def nearby(payload: NearbyQuery, user_id: str = Depends(get_current_user)):
    return search_nearby(payload.lat, payload.lon)
