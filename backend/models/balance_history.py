from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
from .base import PyObjectId


class BalanceHistoryModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    amount_change: float  # positive = income/addition, negative = deduction
    type: Literal["expense", "bill", "loan", "adjustment", "income"]
    reference_id: Optional[str] = None  # payment or obligation id
    description: str
    date: datetime
    resulting_balance: float

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
