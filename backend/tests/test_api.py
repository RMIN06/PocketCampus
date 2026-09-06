from fastapi.testclient import TestClient
from app.main import app
from app.routers import auth
from app.routers import expenses
from app.deps import get_current_user
from app.models.expense import ExpensePublic
from datetime import datetime, timezone


client = TestClient(app)


def test_health_routes_do_not_require_database():
    for path in ("/health", "/api/health"):
        response = client.get(path)
        assert response.status_code == 200
        assert response.json() == {"status": "ok"}


def test_private_routes_require_authentication():
    for path in ("/api/v1/users/me", "/api/v1/expenses"):
        assert client.get(path).status_code == 401


def test_invalid_google_token_is_rejected(monkeypatch):
    monkeypatch.setattr(auth.settings, "GOOGLE_CLIENT_ID", "test-client")

    def reject(*args, **kwargs):
        raise ValueError("Invalid token")

    monkeypatch.setattr(auth.id_token, "verify_oauth2_token", reject)
    response = client.post("/api/v1/auth/google", json={"credential": "invalid"})
    assert response.status_code == 401


def test_expense_response_uses_frontend_id_field(monkeypatch):
    expense_id = "507f1f77bcf86cd799439011"
    user_id = "507f1f77bcf86cd799439012"

    async def create(payload, owner):
        return ExpensePublic(
            _id=expense_id, user_id=owner,
            **payload.model_dump(), created_at=datetime.now(timezone.utc),
        )

    monkeypatch.setattr(expenses, "create_expense", create)
    app.dependency_overrides[get_current_user] = lambda: user_id
    try:
        response = client.post('/api/v1/expenses', json={'description':'Books','amount':100})
        assert response.status_code == 201
        assert response.json()['id'] == expense_id
        assert '_id' not in response.json()
    finally:
        app.dependency_overrides.clear()
