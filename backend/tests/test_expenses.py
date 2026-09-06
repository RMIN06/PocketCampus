# tests/test_expenses.py
# Unit tests for the personal-expense model and month filtering.
import pytest
from datetime import datetime, timezone
from bson import ObjectId
from app.models.expense import (
    ExpenseCreate, ExpenseUpdate, ExpenseCategory,
)
from app.services.expense_service import month_range


def test_create_expense_valid():
    """A valid personal expense can be created with defaults."""
    expense = ExpenseCreate(description="Chai and paratha", amount=250)
    assert expense.amount == 250.0
    assert expense.currency == "PKR"
    assert expense.category == "other"


def test_create_expense_rejects_zero_amount():
    """Amount must be strictly positive."""
    with pytest.raises(Exception):
        ExpenseCreate(description="Freebie", amount=0)


def test_create_expense_rejects_negative_amount():
    with pytest.raises(Exception):
        ExpenseCreate(description="Refund", amount=-50)


def test_create_expense_rejects_bad_category():
    with pytest.raises(Exception):
        ExpenseCreate(description="Mystery", amount=100, category="spaceship")


def test_create_expense_rejects_empty_description():
    with pytest.raises(Exception):
        ExpenseCreate(description="", amount=100)


def test_currency_defaults_to_pkr():
    expense = ExpenseCreate(description="Books", amount=1200, category="books")
    assert expense.currency == "PKR"


def test_all_categories_accepted():
    for category in ["food", "groceries", "books", "transport", "rent", "utilities", "other"]:
        expense = ExpenseCreate(description="Test", amount=10, category=category)
        assert expense.category == category


def test_month_range_valid():
    start, end = month_range("2026-09")
    assert start == datetime(2026, 9, 1, tzinfo=timezone.utc)
    assert end == datetime(2026, 10, 1, tzinfo=timezone.utc)


def test_month_range_december_wraps_year():
    start, end = month_range("2026-12")
    assert start == datetime(2026, 12, 1, tzinfo=timezone.utc)
    assert end == datetime(2027, 1, 1, tzinfo=timezone.utc)


def test_month_range_invalid_returns_none():
    assert month_range("not-a-month") is None
    assert month_range(None) is None


def test_update_partial():
    """ExpenseUpdate allows partial patches and drops unset fields."""
    updates = ExpenseUpdate(amount=500)
    assert updates.model_dump(exclude_none=True) == {"amount": 500.0}

    updates = ExpenseUpdate(description="New name", category="books")
    dumped = updates.model_dump(exclude_none=True)
    assert dumped == {"description": "New name", "category": "books"}
