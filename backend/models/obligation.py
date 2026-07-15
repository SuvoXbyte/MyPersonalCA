from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
from .base import PyObjectId


class ObligationModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
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
    last_reminder_sent: Optional[datetime] = None
    reminder_stage: int = 0
    overdue_notification_stopped: bool = False
    notes: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
