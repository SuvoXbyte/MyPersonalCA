from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field
from .base import PyObjectId


class BudgetModel(BaseModel):
    id: Optional[PyObjectId] = Field(default=None, alias="_id")
    category: str
    monthly_limit: float
    month: str  # "2026-07" format
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

    model_config = {"populate_by_name": True, "arbitrary_types_allowed": True}
