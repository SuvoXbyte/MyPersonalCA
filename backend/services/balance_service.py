import logging
from datetime import datetime, timezone
from typing import Optional, Literal
from bson import ObjectId
from ..database import get_db
from ..models.base import serialize_doc

logger = logging.getLogger(__name__)

SINGLETON_ID = "singleton"


async def _get_or_create_account() -> dict:
    db = get_db()
    account = await db.account.find_one({"_id": SINGLETON_ID})
    if account is None:
        account = {
            "_id": SINGLETON_ID,
            "current_balance": 0.0,
            "low_balance_threshold": 1000.0,
            "telegram_chat_id": None,
            "last_updated": datetime.now(timezone.utc),
            "habit_streak": 0,
            "last_streak_evaluation_month": None,
            "last_low_balance_alert_sent": None,
        }
        await db.account.insert_one(account)
    return account


async def get_account() -> dict:
    return await _get_or_create_account()


async def deduct(
    amount: float,
    entry_type: Literal["expense", "bill", "loan"],
    reference_id: Optional[str] = None,
    description: str = "Payment",
) -> float:
    """Deduct amount from current balance. Returns new balance."""
    db = get_db()
    account = await _get_or_create_account()
    new_balance = account["current_balance"] - amount

    now = datetime.now(timezone.utc)
    await db.account.update_one(
        {"_id": SINGLETON_ID},
        {"$set": {"current_balance": new_balance, "last_updated": now}},
    )

    history_doc = {
        "amount_change": -amount,
        "type": entry_type,
        "reference_id": reference_id,
        "description": description,
        "date": now,
        "resulting_balance": new_balance,
    }
    await db.balance_history.insert_one(history_doc)

    logger.info("Balance deducted %.2f. New balance: %.2f", amount, new_balance)

    # Send Telegram notification for the expense
    try:
        from .notification_service import send_telegram_message
        msg = (
            f"💸 <b>Expense Logged</b>\n\n"
            f"📝 Description: {description}\n"
            f"🏷️ Category: {entry_type.upper()}\n"
            f"💰 Amount: ₹{amount:,.2f}\n"
            f"⚖️ Current Balance: ₹{new_balance:,.2f}"
        )
        await send_telegram_message(msg)
    except Exception as exc:
        logger.error("Failed to send expense notification: %s", exc)

    return new_balance


async def add_income(amount: float, description: str = "Income") -> float:
    """Add income to current balance. Returns new balance."""
    db = get_db()
    account = await _get_or_create_account()
    new_balance = account["current_balance"] + amount

    now = datetime.now(timezone.utc)
    await db.account.update_one(
        {"_id": SINGLETON_ID},
        {"$set": {"current_balance": new_balance, "last_updated": now}},
    )

    history_doc = {
        "amount_change": amount,
        "type": "income",
        "reference_id": None,
        "description": description,
        "date": now,
        "resulting_balance": new_balance,
    }
    await db.balance_history.insert_one(history_doc)

    logger.info("Balance increased %.2f. New balance: %.2f", amount, new_balance)

    # Send Telegram notification for the deposit/income
    try:
        from .notification_service import send_telegram_message
        msg = (
            f"💰 <b>Funds Deposited / Credited</b>\n\n"
            f"📝 Source: {description}\n"
            f"💰 Amount: +₹{amount:,.2f}\n"
            f"⚖️ Current Balance: ₹{new_balance:,.2f}"
        )
        await send_telegram_message(msg)
    except Exception as exc:
        logger.error("Failed to send deposit notification: %s", exc)

    return new_balance


async def reverse_deduction(original_amount: float, description: str = "Reversal") -> float:
    """Reverse a previous deduction by adding back the amount."""
    return await add_income(original_amount, description)


async def set_balance(amount: float, description: str = "Manual balance adjustment") -> float:
    """Set absolute balance. Records adjustment history entry."""
    db = get_db()
    account = await _get_or_create_account()
    old_balance = account["current_balance"]
    change = amount - old_balance

    now = datetime.now(timezone.utc)
    await db.account.update_one(
        {"_id": SINGLETON_ID},
        {"$set": {"current_balance": amount, "last_updated": now}},
    )

    history_doc = {
        "amount_change": change,
        "type": "adjustment",
        "reference_id": None,
        "description": description,
        "date": now,
        "resulting_balance": amount,
    }
    await db.balance_history.insert_one(history_doc)

    logger.info("Balance set to %.2f (was %.2f).", amount, old_balance)

    # Send Telegram notification for manual balance adjustment
    try:
        from .notification_service import send_telegram_message
        msg = (
            f"⚙️ <b>Balance Manually Adjusted</b>\n\n"
            f"📝 Reason: {description}\n"
            f"⚖️ Old Balance: ₹{old_balance:,.2f}\n"
            f"⚖️ New Balance: ₹{amount:,.2f}"
        )
        await send_telegram_message(msg)
    except Exception as exc:
        logger.error("Failed to send adjustment notification: %s", exc)

    return amount


async def update_settings(low_balance_threshold: Optional[float] = None, telegram_chat_id: Optional[str] = None) -> dict:
    await _get_or_create_account()
    db = get_db()
    update_fields: dict = {}
    if low_balance_threshold is not None:
        update_fields["low_balance_threshold"] = low_balance_threshold
    if telegram_chat_id is not None:
        update_fields["telegram_chat_id"] = telegram_chat_id

    if update_fields:
        update_fields["last_updated"] = datetime.now(timezone.utc)
        await db.account.update_one({"_id": SINGLETON_ID}, {"$set": update_fields})

    return await _get_or_create_account()


async def get_history(page: int = 1, limit: int = 50) -> dict:
    db = get_db()
    skip = (page - 1) * limit
    cursor = db.balance_history.find({}).sort("date", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.balance_history.count_documents({})

    serialized = []
    for item in items:
        doc = serialize_doc(item)
        serialized.append(doc)

    return {"items": serialized, "total": total, "page": page, "limit": limit}


async def get_projected(horizon_days: int = 7) -> dict:
    from datetime import timedelta
    db = get_db()
    account = await _get_or_create_account()
    current_balance = account["current_balance"]

    now = datetime.now(timezone.utc)
    future_cutoff = now + timedelta(days=horizon_days)

    # Get obligations due in next horizon_days with status != "paid"
    obligations = await db.obligations.find(
        {
            "due_date": {"$gte": now, "$lte": future_cutoff},
            "status": {"$ne": "paid"},
        }
    ).to_list(length=200)

    upcoming_dues = []
    total_upcoming = 0.0
    for ob in obligations:
        days_until_due = (ob["due_date"].date() - now.date()).days
        upcoming_dues.append(
            {
                "id": str(ob["_id"]),
                "name": ob["name"],
                "type": ob["type"],
                "amount": ob["amount"],
                "due_date": ob["due_date"],
                "days_until_due": days_until_due,
                "status": ob["status"],
            }
        )
        total_upcoming += ob["amount"]

    projected_balance = current_balance - total_upcoming

    return {
        "current_balance": current_balance,
        "upcoming_dues": upcoming_dues,
        "projected_balance": projected_balance,
    }


async def check_and_alert_low_balance() -> None:
    """Send a low balance alert if balance is below threshold and we haven't sent one today."""
    from .notification_service import send_telegram_message, build_low_balance_message

    db = get_db()
    account = await _get_or_create_account()
    balance = account["current_balance"]
    threshold = account["low_balance_threshold"]

    if balance >= threshold:
        return

    now = datetime.now(timezone.utc)
    last_alert = account.get("last_low_balance_alert_sent")

    # Only send once per day (Disabled for testing/unlimited mode)
    # if last_alert is not None:
    #     if last_alert.date() == now.date():
    #         return

    msg = build_low_balance_message(balance, threshold)
    await send_telegram_message(msg)

    await db.account.update_one(
        {"_id": SINGLETON_ID},
        {"$set": {"last_low_balance_alert_sent": now}},
    )
    logger.info("Low balance alert sent. Balance: %.2f, Threshold: %.2f", balance, threshold)
