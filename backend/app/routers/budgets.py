"""Per-user monthly budgets; balances are derived from the expense ledger."""
from decimal import Decimal
import re

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, Field

from app.database import db
from app.deps import get_current_user
from app.services.expense_service import month_range, summarize_month

router = APIRouter(prefix="/api/v1/budgets", tags=["budgets"])
budgets_collection = db["budgets"]


class BudgetInput(BaseModel):
    amount: Decimal = Field(gt=0, le=999999999, max_digits=11, decimal_places=2)


def validate_month(month: str):
    if not re.fullmatch(r"[0-9]{4}-(0[1-9]|1[0-2])", month) or not month_range(month):
        raise HTTPException(status_code=422, detail="Use a valid month in YYYY-MM format")


def budget_balance(month: str, amount, spent: float):
    budget = Decimal(str(amount)) if amount is not None else None
    remaining = budget - Decimal(str(spent)) if budget is not None else None
    return {
        "month": month, "amount": float(budget) if budget is not None else None,
        "spent": spent, "remaining": float(remaining) if remaining is not None else None,
        "alert": remaining <= budget / 2 if budget is not None else False,
    }


@router.get("/{month}")
async def get_budget(month: str, user_id: str = Depends(get_current_user)):
    validate_month(month)
    # Deterministic _id uses MongoDB's built-in unique index, including concurrent saves.
    doc = await budgets_collection.find_one({"_id": f"{user_id}:{month}"})
    summary = await summarize_month(user_id, month)
    return budget_balance(month, doc["amount"] if doc else None, summary["total"])


@router.put("/{month}")
async def set_budget(month: str, payload: BudgetInput, user_id: str = Depends(get_current_user)):
    validate_month(month)
    await budgets_collection.update_one(
        {"_id": f"{user_id}:{month}"},
        {"$set": {"user_id": user_id, "month": month, "amount": float(payload.amount)}},
        upsert=True,
    )
    return await get_budget(month, user_id)
