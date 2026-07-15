from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel


class BalanceInfo(BaseModel):
    current: float
    low_balance_threshold: float
    is_low: bool


class UpcomingDueItem(BaseModel):
    id: str
    name: str
    type: str
    amount: float
    due_date: datetime
    days_until_due: int
    status: str


class OverdueDueItem(BaseModel):
    id: str
    name: str
    type: str
    amount: float
    due_date: datetime
    days_until_due: int
    days_overdue: int
    status: str


class BudgetSummaryItem(BaseModel):
    category: str
    limit: float
    spent: float
    percentage: float


class SpendingBreakdownItem(BaseModel):
    name: str
    amount: float
    category: str


class SpendingGroup(BaseModel):
    total: float
    breakdown: List[SpendingBreakdownItem]


class MonthlyTrendItem(BaseModel):
    month: str
    total: float


class CategoryBreakdownItem(BaseModel):
    category: str
    amount: float


class DailyBudgetInfo(BaseModel):
    limit: float
    spent_today: float
    remaining_days: int


class DashboardResponse(BaseModel):
    balance: BalanceInfo
    projected_balance: float
    upcoming_dues: List[UpcomingDueItem]
    overdue: List[OverdueDueItem]
    budget_summary: List[BudgetSummaryItem]
    fixed_spending: SpendingGroup
    variable_spending: SpendingGroup
    monthly_trend: List[MonthlyTrendItem]
    category_breakdown: List[CategoryBreakdownItem]
    habit_streak: int
    daily_budget: DailyBudgetInfo
