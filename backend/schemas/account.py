from datetime import datetime
from typing import Optional, Literal, List
from pydantic import BaseModel, field_validator


class AccountResponse(BaseModel):
    current_balance: float
    low_balance_threshold: float
    telegram_chat_id: Optional[str] = None
    habit_streak: int
    last_updated: datetime

    model_config = {"from_attributes": True}


class SetBalanceRequest(BaseModel):
    amount: float
    description: Optional[str] = "Manual balance adjustment"


class AddFundsRequest(BaseModel):
    amount: float
    description: str = "Income"

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be positive")
        return v


class UpdateSettingsRequest(BaseModel):
    low_balance_threshold: Optional[float] = None
    telegram_chat_id: Optional[str] = None


class BalanceHistoryResponse(BaseModel):
    id: str
    amount_change: float
    type: Literal["expense", "bill", "loan", "adjustment", "income"]
    reference_id: Optional[str] = None
    description: str
    date: datetime
    resulting_balance: float

    model_config = {"from_attributes": True}


class UpcomingDueItem(BaseModel):
    id: str
    name: str
    type: str
    amount: float
    due_date: datetime
    days_until_due: int
    status: str


class ProjectedBalanceResponse(BaseModel):
    current_balance: float
    upcoming_dues: List[UpcomingDueItem]
    projected_balance: float
