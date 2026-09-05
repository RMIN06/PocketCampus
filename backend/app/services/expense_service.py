# app/services/expense_service.py
from typing import List, Optional
from datetime import datetime, timezone
from app.database import expenses_collection
from app.models.expense import (
    ExpenseCreate, ExpensePublic, ExpenseUpdate
)
from app.utils.serializers import doc_to_model
from bson import ObjectId


def month_range(month: Optional[str]) -> Optional[tuple]:
    """Parse a YYYY-MM string into a (start, end) UTC datetime range."""
    if not month:
        return None
    try:
        year, month_num = map(int, month.split("-"))
        start = datetime(year, month_num, 1, tzinfo=timezone.utc)
        if month_num == 12:
            end = datetime(year + 1, 1, 1, tzinfo=timezone.utc)
        else:
            end = datetime(year, month_num + 1, 1, tzinfo=timezone.utc)
        return start, end
    except ValueError:
        return None  # Invalid month format, ignore filter


async def create_expense(payload: ExpenseCreate, user_id: str) -> ExpensePublic:
    """Create a personal expense owned by user_id."""
    doc = {
        **payload.model_dump(),
        "user_id": user_id,
        "created_at": datetime.now(timezone.utc),
        "updated_at": None,
    }

    result = await expenses_collection.insert_one(doc)
    created_doc = await expenses_collection.find_one({"_id": result.inserted_id})
    return doc_to_model(created_doc, ExpensePublic)


async def get_user_expenses(
    user_id: str, month: Optional[str] = None, limit: int = 500
) -> List[ExpensePublic]:
    """Fetch a user's expenses, newest first, optionally filtered by month (YYYY-MM)."""
    query: dict = {"user_id": user_id}

    date_range = month_range(month)
    if date_range:
        query["created_at"] = {"$gte": date_range[0], "$lt": date_range[1]}

    cursor = expenses_collection.find(query).sort("created_at", -1).limit(limit)
    expenses = []
    async for doc in cursor:
        expenses.append(doc_to_model(doc, ExpensePublic))
    return expenses


async def summarize_month(user_id: str, month: str) -> dict:
    """Aggregate a user's spending for one month."""
    date_range = month_range(month)
    match: dict = {"user_id": user_id}
    if date_range:
        match["created_at"] = {"$gte": date_range[0], "$lt": date_range[1]}

    pipeline = [
        {"$match": match},
        {"$group": {
            "_id": "$category",
            "total": {"$sum": "$amount"},
            "count": {"$sum": 1},
        }},
    ]
    by_category = {}
    total = 0.0
    count = 0
    async for row in expenses_collection.aggregate(pipeline):
        by_category[row["_id"]] = round(row["total"], 2)
        total += row["total"]
        count += row["count"]

    return {"month": month, "total": round(total, 2), "count": count, "by_category": by_category}


async def get_expense(expense_id: str, user_id: str) -> Optional[ExpensePublic]:
    """Fetch a single expense owned by user_id."""
    if not ObjectId.is_valid(expense_id):
        return None
    doc = await expenses_collection.find_one({
        "_id": ObjectId(expense_id),
        "user_id": user_id,
    })
    return doc_to_model(doc, ExpensePublic) if doc else None


async def update_expense(
    expense_id: str, updates: ExpenseUpdate, user_id: str
) -> Optional[ExpensePublic]:
    """Update an expense owned by user_id."""
    if not ObjectId.is_valid(expense_id):
        return None
    result = await expenses_collection.find_one_and_update(
        {"_id": ObjectId(expense_id), "user_id": user_id},
        {"$set": {**updates.model_dump(exclude_none=True),
                  "updated_at": datetime.now(timezone.utc)}},
        return_document=True,
    )
    if result:
        return doc_to_model(result, ExpensePublic)
    return None


async def delete_expense(expense_id: str, user_id: str) -> bool:
    """Delete an expense owned by user_id."""
    if not ObjectId.is_valid(expense_id):
        return False
    result = await expenses_collection.delete_one({
        "_id": ObjectId(expense_id),
        "user_id": user_id,
    })
    return result.deleted_count > 0
