from pathlib import Path
from pydantic_settings import BaseSettings
from typing import Optional

# Resolve .env from project root (parent of backend/) so it works
# regardless of whether uvicorn is invoked from root or from backend/
_PROJECT_ROOT = Path(__file__).parent.parent
_ENV_FILE = _PROJECT_ROOT / ".env"


class Settings(BaseSettings):
    mongodb_uri: str = "mongodb://localhost:27017"
    database_name: str = "finance_tracker"
    telegram_bot_token: Optional[str] = None
    telegram_chat_id: Optional[str] = None
    app_timezone: str = "Asia/Kolkata"

    model_config = {
        "env_file": str(_ENV_FILE),
        "env_file_encoding": "utf-8",
        "extra": "ignore",
    }


settings = Settings()
