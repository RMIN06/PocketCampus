# app/routers/expenses.py
from fastapi import APIRouter, Depends, HTTPException, Query
from app.models.expense import ExpenseCreate, ExpensePublic, ExpenseUpdate
from app.deps import get_current_user
from app.services.expense_service import (
    create_expense, get_user_expenses, summarize_month,
    update_expense, delete_expense,
)
from typing import Optional, List


router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])


@router.post("", response_model=ExpensePublic, status_code=201)
async def add_expense(payload: ExpenseCreate, current_user_id: str = Depends(get_current_user)):
    """Create a personal expense (owned by the authenticated user)."""
    return await create_expense(payload, current_user_id)


@router.get("", response_model=List[ExpensePublic])
async def list_expenses(
    month: Optional[str] = Query(None, description="Month filter in YYYY-MM format"),
    current_user_id: str = Depends(get_current_user),
):
    """Fetch the authenticated user's expenses, newest first."""
    return await get_user_expenses(current_user_id, month)


@router.get("/summary")
async def expense_summary(
    month: str = Query(..., description="Month in YYYY-MM format"),
    current_user_id: str = Depends(get_current_user),
):
    """Monthly spending summary: total, count and per-category totals (PKR)."""
    return await summarize_month(current_user_id, month)


@router.patch("/{expense_id}", response_model=ExpensePublic)
async def edit_expense(
    expense_id: str,
    updates: ExpenseUpdate,
    current_user_id: str = Depends(get_current_user),
):
    """Edit an expense (only the owner can)."""
    updated = await update_expense(expense_id, updates, current_user_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated


@router.delete("/{expense_id}", status_code=204)
async def remove_expense(expense_id: str, current_user_id: str = Depends(get_current_user)):
    """Delete an expense (only the owner can)."""
    deleted = await delete_expense(expense_id, current_user_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")
