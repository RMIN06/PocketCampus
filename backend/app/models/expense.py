# app/models/expense.py
from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime, timezone
from .py_object_id import PyObjectId


ExpenseCategory = Literal["food", "groceries", "books", "transport", "rent", "utilities", "other"]


class ExpenseBase(BaseModel):
    """A personal expense — owned by exactly one user, no splitting."""
    description: str = Field(..., min_length=1, max_length=120)
    amount: float = Field(..., gt=0)
    category: ExpenseCategory = "other"
    currency: str = Field(default="PKR", max_length=3)


class ExpenseCreate(ExpenseBase):
    pass


class ExpenseInDB(ExpenseBase):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}


class ExpensePublic(ExpenseBase):
    id: PyObjectId = Field(alias="_id")
    user_id: PyObjectId
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}


class ExpenseUpdate(BaseModel):
    """Partial update — all fields optional."""
    description: Optional[str] = Field(None, min_length=1, max_length=120)
    amount: Optional[float] = Field(None, gt=0)
    category: Optional[ExpenseCategory] = None


class ExpenseSummary(BaseModel):
    """Aggregated spending for one month."""
    month: str
    total: float
    count: int
    by_category: dict[str, float] = {}