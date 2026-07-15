from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, field_validator


class ObligationCreate(BaseModel):
    type: Literal["loan", "bill"]
    name: str
    amount: float
    due_date: datetime
    recurrence: Literal["monthly", "one-time", "custom"]
    custom_interval_days: Optional[int] = None
    status: Literal["pending", "paid", "overdue"] = "pending"
    outstanding_balance: Optional[float] = None
    principal: Optional[float] = None
    category: str
    notes: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be positive")
        return v

    @field_validator("custom_interval_days")
    @classmethod
    def validate_custom_interval(cls, v: Optional[int], info) -> Optional[int]:
        # info.data may or may not have recurrence depending on validation order
        return v


class ObligationUpdate(BaseModel):
    type: Optional[Literal["loan", "bill"]] = None
    name: Optional[str] = None
    amount: Optional[float] = None
    due_date: Optional[datetime] = None
    recurrence: Optional[Literal["monthly", "one-time", "custom"]] = None
    custom_interval_days: Optional[int] = None
    status: Optional[Literal["pending", "paid", "overdue"]] = None
    outstanding_balance: Optional[float] = None
    principal: Optional[float] = None
    category: Optional[str] = None
    notes: Optional[str] = None


class ObligationResponse(BaseModel):
    id: str
    type: Literal["loan", "bill"]
    name: str
    amount: float
    due_date: datetime
    recurrence: Literal["monthly", "one-time", "custom"]
    custom_interval_days: Optional[int] = None
    status: Literal["pending", "paid", "overdue"]
    outstanding_balance: Optional[float] = None
    principal: Optional[float] = None
    category: str
    last_reminder_sent: Optional[datetime] = None
    reminder_stage: int
    overdue_notification_stopped: bool
    notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}
