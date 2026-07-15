from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, field_validator


class PaymentCreate(BaseModel):
    obligation_id: Optional[str] = None
    amount: float
    date: datetime
    category: str
    note: Optional[str] = None

    @field_validator("amount")
    @classmethod
    def amount_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("amount must be positive")
        return v


class PaymentUpdate(BaseModel):
    amount: Optional[float] = None
    date: Optional[datetime] = None
    category: Optional[str] = None
    note: Optional[str] = None
    obligation_id: Optional[str] = None


class PaymentResponse(BaseModel):
    id: str
    obligation_id: Optional[str] = None
    amount: float
    date: datetime
    category: str
    note: Optional[str] = None
    source: Literal["manual", "auto_linked"]
    created_at: datetime

    model_config = {"from_attributes": True}
