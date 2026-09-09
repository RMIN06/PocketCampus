import pytest
import requests
from fastapi.testclient import TestClient
from app.main import app
from app.deps import get_current_user
from app.routers import places

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_cache():
    places._cache.clear()
    yield
    places._cache.clear()
    app.dependency_overrides.clear()


def test_search_requires_auth():
    assert client.post("/api/v1/places/nearby", json={"lat":31.52,"lon":74.35}).status_code == 401


@pytest.mark.parametrize("payload", [{"lat":91,"lon":0}, {"lat":0,"lon":181}, {"lat":"NaN","lon":0}, {"lat":"bad","lon":0}, {}])
def test_coordinates_validated(payload):
    app.dependency_overrides[get_current_user] = lambda: "test-user"
    assert client.post("/api/v1/places/nearby", json=payload).status_code == 422


def test_normalization_keeps_branches_and_sorts():
    elements = [
        {"type":"node","id":1,"lat":31.521,"lon":74.35,"tags":{"name":"Cafe","amenity":"cafe"}},
        {"type":"way","id":2,"center":{"lat":31.52,"lon":74.35},"tags":{"name:en":"Campus Books","shop":"stationery"}},
        {"type":"relation","id":3,"center":{"lat":31.521,"lon":74.35},"tags":{"name":"Cafe","amenity":"cafe"}},
        {"type":"node","id":4,"lat":31.525,"lon":74.35,"tags":{"name":"Cafe","amenity":"cafe"}},
        {"type":"node","id":5,"lat":32.52,"lon":74.35,"tags":{"name":"Far Away"}},
        {"type":"node","id":6,"lat":31.52,"lon":74.35,"tags":{}},
    ]
    result = places.normalize_places(elements,31.52,74.35)
    assert [p["id"] for p in result] == ["way/2","node/1","node/4"]
    assert result[0]["kind"] == "books"
    assert result[0]["distanceMeters"] == 0


class Response:
    def __init__(self, data): self.data = data
    def raise_for_status(self): pass
    def json(self): return self.data


def test_fallback_and_cache(monkeypatch):
    calls = []
    def get(url, **kwargs):
        calls.append(url)
        if len(calls) == 1: raise requests.Timeout()
        return Response({"elements":[{"type":"node","id":1,"lat":31.52,"lon":74.35,"tags":{"name":"Books","shop":"books"}}]})
    monkeypatch.setattr(places.requests, "get", get)
    assert places.search_nearby(31.52,74.35)[0]["name"] == "Books"
    assert places.search_nearby(31.52001,74.35001)[0]["name"] == "Books"
    assert len(calls) == 2


def test_partial_results_are_not_reported_as_success(monkeypatch):
    monkeypatch.setattr(places.requests, "get", lambda *a, **kw: Response({"remark":"runtime timeout","elements":[]}))
    app.dependency_overrides[get_current_user] = lambda: "test-user"
    response = client.post("/api/v1/places/nearby", json={"lat":31.52,"lon":74.35})
    assert response.status_code == 503
    assert "busy" in response.json()["detail"]


def test_empty_success_distinct_from_provider_error(monkeypatch):
    monkeypatch.setattr(places.requests, "get", lambda *a, **kw: Response({"elements":[]}))
    app.dependency_overrides[get_current_user] = lambda: "test-user"
    response = client.post("/api/v1/places/nearby", json={"lat":31.52,"lon":74.35})
    assert response.status_code == 200
    assert response.json() == []
