import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.deps import get_current_user
from app.routers import budgets

client = TestClient(app)


class BudgetCollection:
    def __init__(self):
        self.docs = {}

    async def find_one(self, query):
        return self.docs.get(query["_id"])

    async def update_one(self, query, update, upsert=False):
        assert upsert
        self.docs[query["_id"]] = update["$set"]


@pytest.fixture
def ledger(monkeypatch):
    collection = BudgetCollection()
    state = {"owner": "owner-a", "spent": {}}

    async def summary(owner, month):
        return {"total": state["spent"].get((owner, month), 0)}

    monkeypatch.setattr(budgets, "budgets_collection", collection)
    monkeypatch.setattr(budgets, "summarize_month", summary)
    app.dependency_overrides[get_current_user] = lambda: state["owner"]
    yield state
    app.dependency_overrides.clear()


def test_budget_requires_authentication():
    assert client.get("/api/v1/budgets/2026-09").status_code == 401
    assert client.put("/api/v1/budgets/2026-09", json={"amount": 1000}).status_code == 401


def test_no_budget_is_distinct_from_zero(ledger):
    data = client.get("/api/v1/budgets/2026-09").json()
    assert data == {"month": "2026-09", "amount": None, "spent": 0, "remaining": None, "alert": False}


def test_save_recalculate_and_isolate_budget(ledger):
    path = "/api/v1/budgets/2026-09"
    assert client.put(path, json={"amount": 1000}).json()["remaining"] == 1000
    # Includes expenses added before setting the budget, later edits and deletion.
    for spent, remaining, alert in [(499, 501, False), (500, 500, True), (600, 400, True), (1100, -100, True), (0, 1000, False)]:
        ledger["spent"][("owner-a", "2026-09")] = spent
        data = client.get(path).json()
        assert (data["remaining"], data["alert"]) == (remaining, alert)
    assert client.put(path, json={"amount": 2000}).json()["amount"] == 2000
    assert client.get("/api/v1/budgets/2026-10").json()["amount"] is None
    ledger["owner"] = "owner-b"
    assert client.get(path).json()["amount"] is None
    assert client.put(path, json={"amount": 3000}).json()["amount"] == 3000
    ledger["owner"] = "owner-a"
    assert client.get(path).json()["amount"] == 2000


@pytest.mark.parametrize("month", ["2026-13", "0000-01", "2026-1", "oops", "9999-12"])
def test_invalid_month_rejected(ledger, month):
    assert client.get(f"/api/v1/budgets/{month}").status_code == 422
    assert client.put(f"/api/v1/budgets/{month}", json={"amount": 10}).status_code == 422


@pytest.mark.parametrize("amount", [0, -1, "NaN", "Infinity", 1.001, 1000000000])
def test_invalid_amount_rejected(ledger, amount):
    assert client.put("/api/v1/budgets/2026-09", json={"amount": amount}).status_code == 422


def test_fractional_rupees(ledger):
    ledger["spent"][("owner-a", "2026-09")] = 0.2
    data = client.put("/api/v1/budgets/2026-09", json={"amount": 0.3}).json()
    assert data["remaining"] == 0.1
