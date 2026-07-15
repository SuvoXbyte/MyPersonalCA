from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field


class AccountModel(BaseModel):
    id: str = Field(default="singleton", alias="_id")
    current_balance: float = 0.0
    low_balance_threshold: float = 1000.0
    telegram_chat_id: Optional[str] = None
    last_updated: datetime = Field(default_factory=datetime.utcnow)
    habit_streak: int = 0
    last_streak_evaluation_month: Optional[str] = None  # "2026-07"
    last_low_balance_alert_sent: Optional[datetime] = None

    model_config = {"populate_by_name": True}
