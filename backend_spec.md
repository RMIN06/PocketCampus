# backend_spec.md — PocketCampus API (Phase 1: Foundation & Schemas)

## 1. Tech Stack
- **Framework:** FastAPI (async)
- **Database:** MongoDB via Motor (async driver)
- **Validation:** Pydantic v2
- **Auth (stubbed for Phase 1):** JWT bearer scheme, actual auth logic deferred to Phase 2
- **ID Strategy:** MongoDB `ObjectId` mapped to string via custom Pydantic type

---

## 2. File Structure

```
backend/
├── app/
│   ├── main.py                  # App entrypoint, CORS, router mounting
│   ├── config.py                # Env vars, settings (Pydantic BaseSettings)
│   ├── database.py              # Motor client, db instance, collection getters
│   ├── deps.py                  # Shared dependencies (get_db, get_current_user stub)
│   │
│   ├── models/
│   │   ├── __init__.py
│   │   ├── py_object_id.py      # Custom ObjectId <-> str Pydantic type
│   │   ├── user.py               # User schemas
│   │   ├── group.py              # Group schemas
│   │   └── expense.py            # Expense + Split schemas
│   │
│   ├── routers/
│   │   ├── __init__.py
│   │   ├── users.py
│   │   ├── groups.py
│   │   └── expenses.py
│   │
│   ├── services/
│   │   ├── __init__.py
│   │   ├── expense_service.py    # Split calculation, CRUD logic
│   │   └── balance_service.py    # Ledger/balance aggregation logic
│   │
│   └── utils/
│       └── serializers.py        # Mongo doc -> Pydantic helpers
│
├── tests/
│   ├── test_expenses.py
│   └── test_balances.py
│
├── requirements.txt
└── .env.example
```

---

## 3. Custom ObjectId Type

```python
# app/models/py_object_id.py
from bson import ObjectId
from pydantic import GetCoreSchemaHandler
from pydantic_core import core_schema

class PyObjectId(str):
    @classmethod
    def __get_pydantic_core_schema__(cls, source_type, handler: GetCoreSchemaHandler):
        return core_schema.no_info_plain_validator_function(cls.validate)

    @classmethod
    def validate(cls, v):
        if not ObjectId.is_valid(v):
            raise ValueError("Invalid ObjectId")
        return str(v)
```

---

## 4. Pydantic Schemas

### 4.1 Users

```python
# app/models/user.py
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime, timezone
from .py_object_id import PyObjectId

class UserBase(BaseModel):
    full_name: str = Field(..., min_length=1, max_length=80)
    email: EmailStr
    avatar_color: str = Field(default="#7C5CFC")  # hex, used for avatar bg in UI

class UserCreate(UserBase):
    password: str = Field(..., min_length=8)

class UserInDB(UserBase):
    id: PyObjectId = Field(alias="_id")
    hashed_password: str
    group_ids: List[PyObjectId] = Field(default_factory=list)
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}

class UserPublic(UserBase):
    id: PyObjectId = Field(alias="_id")
    group_ids: List[PyObjectId] = []

    model_config = {"populate_by_name": True}
```

### 4.2 Groups (Shared Living)

```python
# app/models/group.py
from pydantic import BaseModel, Field
from typing import List
from datetime import datetime, timezone
from .py_object_id import PyObjectId

class GroupMember(BaseModel):
    user_id: PyObjectId
    display_name: str
    joined_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

class GroupBase(BaseModel):
    name: str = Field(..., min_length=1, max_length=60)   # e.g. "204 Maple St"
    invite_code: str = Field(..., min_length=6, max_length=8)

class GroupCreate(BaseModel):
    name: str
    created_by: PyObjectId

class GroupInDB(GroupBase):
    id: PyObjectId = Field(alias="_id")
    members: List[GroupMember] = Field(default_factory=list)
    created_by: PyObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    model_config = {"populate_by_name": True}

class GroupPublic(GroupBase):
    id: PyObjectId = Field(alias="_id")
    members: List[GroupMember]

    model_config = {"populate_by_name": True}
```

### 4.3 Expenses (Core Splitting Logic)

```python
# app/models/expense.py
from pydantic import BaseModel, Field, model_validator
from typing import List, Literal, Optional
from datetime import datetime, timezone
from .py_object_id import PyObjectId

SplitMethod = Literal["equal", "exact", "percentage"]

class SplitShare(BaseModel):
    """One member's slice of the expense."""
    user_id: PyObjectId
    amount_owed: float = Field(..., ge=0)     # resolved dollar amount, always stored
    percentage: Optional[float] = Field(None, ge=0, le=100)  # only if split_method == percentage
    is_settled: bool = False

class PaidBy(BaseModel):
    user_id: PyObjectId
    amount_paid: float = Field(..., gt=0)

class ExpenseBase(BaseModel):
    group_id: PyObjectId
    description: str = Field(..., min_length=1, max_length=120)
    total_amount: float = Field(..., gt=0)
    currency: str = Field(default="USD", max_length=3)
    category: Literal["rent", "utilities", "groceries", "dining", "transport", "other"] = "other"
    split_method: SplitMethod = "equal"

class ExpenseCreate(ExpenseBase):
    paid_by: List[PaidBy] = Field(..., min_length=1)   # supports multi-payer
    participant_ids: List[PyObjectId] = Field(..., min_length=1)  # who shares the cost
    custom_shares: Optional[List[SplitShare]] = None    # required if split_method != equal

    @model_validator(mode="after")
    def validate_paid_total(self):
        paid_sum = sum(p.amount_paid for p in self.paid_by)
        if round(paid_sum, 2) != round(self.total_amount, 2):
            raise ValueError("Sum of paid_by amounts must equal total_amount")
        return self

class ExpenseInDB(ExpenseBase):
    id: PyObjectId = Field(alias="_id")
    paid_by: List[PaidBy]
    shares: List[SplitShare]           # resolved, always dollar-amount based regardless of input method
    created_by: PyObjectId
    created_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: Optional[datetime] = None

    model_config = {"populate_by_name": True}

class ExpensePublic(ExpenseBase):
    id: PyObjectId = Field(alias="_id")
    paid_by: List[PaidBy]
    shares: List[SplitShare]
    created_at: datetime

    model_config = {"populate_by_name": True}
```

**Split logic notes:**
- `equal`: `amount_owed = total_amount / len(participant_ids)`, computed server-side in `expense_service.py`, never trusted from client.
- `exact` / `percentage`: client supplies `custom_shares`; service validates sum equals `total_amount` (or 100% for percentage) before persisting.
- `paid_by` is an array to support one roommate fronting cash while another covers a partial amount (multi-payer edge case), keeping the schema future-proof without a migration.

---

## 5. MongoDB Collections & Indexes

```python
# app/database.py
from motor.motor_asyncio import AsyncIOMotorClient
from app.config import settings

client = AsyncIOMotorClient(settings.MONGO_URI)
db = client[settings.MONGO_DB_NAME]

users_collection = db["users"]
groups_collection = db["groups"]
expenses_collection = db["expenses"]

async def init_indexes():
    await users_collection.create_index("email", unique=True)
    await groups_collection.create_index("invite_code", unique=True)
    await expenses_collection.create_index([("group_id", 1), ("created_at", -1)])
    await expenses_collection.create_index("shares.user_id")
```

Call `init_indexes()` in FastAPI's `lifespan` startup hook.

---

## 6. API Routing Structure

Base prefix: `/api/v1`

| Method | Endpoint | Purpose |
|---|---|---|
| `POST` | `/users` | Register user |
| `GET` | `/users/me` | Get current user profile |
| `POST` | `/groups` | Create a group, returns `invite_code` |
| `POST` | `/groups/join` | Join via invite code |
| `GET` | `/groups/{group_id}` | Get group + members |
| `POST` | `/expenses` | Create expense (core write) |
| `GET` | `/expenses/group/{group_id}` | Fetch monthly ledger for a group (paginated, `?month=2026-08`) |
| `GET` | `/expenses/user/{user_id}/ledger` | Fetch a user's personal ledger across all groups |
| `GET` | `/groups/{group_id}/balances` | Calculated net balances per member |
| `PATCH` | `/expenses/{expense_id}` | Edit expense |
| `DELETE` | `/expenses/{expense_id}` | Remove expense |

### 6.1 Create Expense

```python
# app/routers/expenses.py
from fastapi import APIRouter, Depends, HTTPException
from app.models.expense import ExpenseCreate, ExpensePublic
from app.services.expense_service import create_expense

router = APIRouter(prefix="/api/v1/expenses", tags=["expenses"])

@router.post("", response_model=ExpensePublic, status_code=201)
async def add_expense(payload: ExpenseCreate):
    expense = await create_expense(payload)
    return expense
```

### 6.2 Balance Calculation

```python
# app/services/balance_service.py
from collections import defaultdict
from app.database import expenses_collection

async def calculate_group_balances(group_id: str) -> dict:
    """
    Returns net balance per user_id:
      positive = is owed money
      negative = owes money
    """
    balances = defaultdict(float)
    cursor = expenses_collection.find({"group_id": group_id})

    async for expense in cursor:
        for payer in expense["paid_by"]:
            balances[payer["user_id"]] += payer["amount_paid"]
        for share in expense["shares"]:
            balances[share["user_id"]] -= share["amount_owed"]

    return {uid: round(amt, 2) for uid, amt in balances.items()}
```

```python
# app/routers/groups.py (relevant endpoint)
@router.get("/{group_id}/balances")
async def get_balances(group_id: str):
    balances = await calculate_group_balances(group_id)
    return {"group_id": group_id, "balances": balances}
```

---

## 7. CORS & Async DB Setup

```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from app.database import init_indexes
from app.routers import users, groups, expenses

@asynccontextmanager
async def lifespan(app: FastAPI):
    await init_indexes()
    yield

app = FastAPI(title="PocketCampus API", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://pocketcampus.app",   # production PWA domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PATCH", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
)

app.include_router(users.router)
app.include_router(groups.router)
app.include_router(expenses.router)
```

```python
# app/config.py
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    MONGO_URI: str = "mongodb://localhost:27017"
    MONGO_DB_NAME: str = "pocketcampus"
    JWT_SECRET: str
    JWT_ALGORITHM: str = "HS256"

    class Config:
        env_file = ".env"

settings = Settings()
```

```
# requirements.txt
fastapi
uvicorn[standard]
motor
pydantic
pydantic-settings
python-jose[cryptography]
passlib[bcrypt]
```

---

## 8. Instructions for Claude Code

This spec defines Phase 1 (Weeks 1-2): Foundation & Schemas only. When implementing:

1. Scaffold the exact file structure in Section 2 before writing any logic.
2. Implement models in the order: `py_object_id.py` → `user.py` → `group.py` → `expense.py`.
3. Implement `database.py` and confirm `init_indexes()` runs on startup before building routers.
4. Build routers in order: `users.py` → `groups.py` → `expenses.py`, wiring each into `main.py` as completed.
5. Implement `expense_service.py` split-calculation logic (equal/exact/percentage) with unit tests in `tests/test_expenses.py` before moving to `balance_service.py`.
6. Do not implement real JWT auth logic yet — stub `get_current_user` in `deps.py` to accept a `user_id` query/header param for now; note this clearly with a `# TODO: Phase 2 auth` comment.
7. Create `.env.example` with all vars referenced in `config.py`.
8. Do not add features beyond what's specified here (no notifications, no settlements/payments, no recurring expenses) — those are out of scope for Phase 1.
