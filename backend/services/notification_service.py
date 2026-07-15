import logging
import httpx
from typing import Optional
from ..config import settings
from ..database import get_db

logger = logging.getLogger(__name__)


async def _get_effective_chat_id(chat_id: Optional[str] = None) -> Optional[str]:
    """
    Priority: 1) passed-in chat_id, 2) account.telegram_chat_id, 3) settings.telegram_chat_id
    """
    if chat_id:
        return chat_id

    try:
        db = get_db()
        account = await db.account.find_one({"_id": "singleton"})
        if account and account.get("telegram_chat_id"):
            return account["telegram_chat_id"]
    except Exception:
        pass

    return settings.telegram_chat_id or None


async def send_telegram_message(text: str, chat_id: Optional[str] = None) -> None:
    """Send a message via Telegram Bot API. Silently skips if not configured."""
    token = settings.telegram_bot_token
    if not token:
        logger.warning("Telegram bot token not configured. Skipping notification.")
        return

    effective_chat_id = await _get_effective_chat_id(chat_id)
    if not effective_chat_id:
        logger.warning("Telegram chat_id not configured. Skipping notification.")
        return

    url = f"https://api.telegram.org/bot{token}/sendMessage"
    payload = {
        "chat_id": effective_chat_id,
        "text": text,
        "parse_mode": "HTML",
    }

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.post(url, json=payload)
            if response.status_code != 200:
                logger.warning(
                    "Telegram API returned %s: %s",
                    response.status_code,
                    response.text,
                )
            else:
                logger.info("Telegram message sent to chat_id=%s", effective_chat_id)
    except Exception as exc:
        logger.error("Failed to send Telegram message: %s", exc)


def build_upcoming_reminder_message(name: str, amount: float, days: int, due_date: str) -> str:
    return (
        f"🔔 <b>Payment Reminder</b>\n\n"
        f"📋 <b>{name}</b>\n"
        f"💰 Amount: ₹{amount:,.2f}\n"
        f"📅 Due in {days} days ({due_date})\n"
        f"⚠️ Status: Pending\n\n"
        f"Pay soon to avoid overdue!"
    )


def build_due_today_message(name: str, amount: float, due_date: str) -> str:
    return (
        f"🚨 <b>Due TODAY</b>\n\n"
        f"📋 <b>{name}</b>\n"
        f"💰 Amount: ₹{amount:,.2f}\n"
        f"📅 Due Date: {due_date}\n\n"
        f"Please pay today!"
    )


def build_overdue_message(name: str, amount: float, days_overdue: int, due_date: str) -> str:
    return (
        f"🚨 <b>OVERDUE — Action Required</b>\n\n"
        f"📋 <b>{name}</b>\n"
        f"💰 Amount: ₹{amount:,.2f}\n"
        f"📅 Was due: {days_overdue} days ago ({due_date})\n\n"
        f"Please pay immediately!"
    )


def build_low_balance_message(balance: float, threshold: float) -> str:
    return (
        f"⚠️ <b>Low Balance Warning</b>\n\n"
        f"💰 Current Balance: ₹{balance:,.2f}\n"
        f"🎯 Threshold: ₹{threshold:,.2f}\n\n"
        f"Please top up your account."
    )
