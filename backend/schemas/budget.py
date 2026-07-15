from datetime import datetime
from typing import Optional
from pydantic import BaseModel, field_validator


class BudgetCreate(BaseModel):
    category: str
    monthly_limit: float
    month: str  # "2026-07" format

    @field_validator("monthly_limit")
    @classmethod
    def limit_must_be_positive(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("monthly_limit must be positive")
        return v

    @field_validator("month")
    @classmethod
    def validate_month_format(cls, v: str) -> str:
        import re
        if not re.match(r"^\d{4}-\d{2}$", v):
            raise ValueError("month must be in YYYY-MM format")
        return v


class BudgetUpdate(BaseModel):
    monthly_limit: Optional[float] = None
    month: Optional[str] = None
    category: Optional[str] = None


class BudgetResponse(BaseModel):
    id: str
    category: str
    monthly_limit: float
    month: str
    spent_so_far: float = 0.0
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class BudgetSummaryResponse(BaseModel):
    category: str
    monthly_limit: float
    spent_so_far: float
    percentage: float
    projected_monthly: float
    projected_overspend: float
    days_elapsed: int
    days_remaining: int
