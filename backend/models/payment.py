from datetime import datetime
from typing import Optional, Literal
from pydantic import BaseModel, Field
from .base import PyObjectId


class PaymentModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    obligation_id: Optional[str] = None  # null = standalone expense
    amount: float
    date: datetime
    category: str
    note: Optional[str] = None
    source: Literal["manual", "auto_linked"] = "manual"
    created_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
