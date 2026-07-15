import logging
from datetime import datetime, timezone, date
from typing import Optional
import pytz
from ..database import get_db
from .notification_service import (
    send_telegram_message,
    build_upcoming_reminder_message,
    build_due_today_message,
    build_overdue_message,
)
from .balance_service import check_and_alert_low_balance

logger = logging.getLogger(__name__)

IST = pytz.timezone("Asia/Kolkata")


def _today_ist() -> date:
    return datetime.now(IST).date()


async def _evaluate_streak() -> None:
    """
    Check if we need to evaluate the streak for the new month.
    Called at the start of each run_daily_job.
    """
    db = get_db()
    account = await db.account.find_one({"_id": "singleton"})
    if not account:
        return

    today = _today_ist()
    current_month_str = f"{today.year}-{today.month:02d}"
    last_eval = account.get("last_streak_evaluation_month")

    if last_eval == current_month_str:
        return  # Already evaluated this month

    # Evaluate previous month
    if today.month == 1:
        prev_year = today.year - 1
        prev_month = 12
    else:
        prev_year = today.year
        prev_month = today.month - 1

    prev_month_str = f"{prev_year}-{prev_month:02d}"

    import calendar
    from datetime import timedelta

    prev_year_int = int(prev_month_str.split("-")[0])
    prev_mon_int = int(prev_month_str.split("-")[1])
    days_in_prev = calendar.monthrange(prev_year_int, prev_mon_int)[1]

    start_dt = datetime(prev_year_int, prev_mon_int, 1, tzinfo=timezone.utc)
    end_dt = datetime(prev_year_int, prev_mon_int, days_in_prev, 23, 59, 59, tzinfo=timezone.utc)

    # Get budgets for previous month
    budgets = await db.budgets.find({"month": prev_month_str}).to_list(length=500)

    all_within = True
    if not budgets:
        # No budgets set, streak continues
        all_within = True
    else:
        for budget in budgets:
            pipeline = [
                {
                    "$match": {
                        "category": budget["category"],
                        "date": {"$gte": start_dt, "$lte": end_dt},
                    }
                },
                {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
            ]
            result = await db.payments.aggregate(pipeline).to_list(length=1)
            spent = result[0]["total"] if result else 0.0
            if spent > budget["monthly_limit"]:
                all_within = False
                break

    current_streak = account.get("habit_streak", 0)
    new_streak = current_streak + 1 if all_within else 0

    await db.account.update_one(
        {"_id": "singleton"},
        {
            "$set": {
                "habit_streak": new_streak,
                "last_streak_evaluation_month": current_month_str,
            }
        },
    )
    logger.info(
        "Streak evaluated for %s → %s (all_within=%s). New streak: %d",
        prev_month_str,
        current_month_str,
        all_within,
        new_streak,
    )


async def run_daily_job() -> None:
    """Main daily job: evaluate streak, process obligation reminders, check low balance."""
    logger.info("Running daily reminder job...")

    try:
        await _evaluate_streak()
    except Exception as exc:
        logger.error("Streak evaluation failed: %s", exc)

    db = get_db()
    today = _today_ist()
    now = datetime.now(timezone.utc)

    # Fetch all non-paid obligations
    obligations = await db.obligations.find(
        {"status": {"$ne": "paid"}}
    ).to_list(length=5000)

    for ob in obligations:
        try:
            await _process_obligation_reminder(db, ob, today, now)
        except Exception as exc:
            logger.error("Error processing obligation %s: %s", ob.get("_id"), exc)

    try:
        await check_and_alert_low_balance()
    except Exception as exc:
        logger.error("Low balance check failed: %s", exc)

    logger.info("Daily reminder job completed. Processed %d obligations.", len(obligations))


async def _process_obligation_reminder(db, ob: dict, today: date, now: datetime) -> None:
    ob_id = ob["_id"]
    name = ob.get("name", "Unknown")
    amount = ob.get("amount", 0.0)
    status = ob.get("status", "pending")
    overdue_notification_stopped = ob.get("overdue_notification_stopped", False)

    # Parse due_date (stored as UTC datetime)
    due_date_dt = ob.get("due_date")
    if not due_date_dt:
        return

    # Convert due_date to IST date for comparison
    if due_date_dt.tzinfo is None:
        due_date_dt = due_date_dt.replace(tzinfo=timezone.utc)
    due_date_ist = due_date_dt.astimezone(IST).date()
    due_date_str = due_date_ist.strftime("%d %b %Y")

    days_until_due = (due_date_ist - today).days  # negative if overdue

    update_fields: dict = {}

    # Auto-mark overdue
    if days_until_due < 0 and status != "overdue":
        update_fields["status"] = "overdue"
        status = "overdue"

    # Decide whether to send a reminder
    should_send = False
    last_reminder = ob.get("last_reminder_sent")
    if last_reminder is not None and last_reminder.tzinfo is None:
        last_reminder = last_reminder.replace(tzinfo=timezone.utc)
    last_reminder_date = last_reminder.astimezone(IST).date() if last_reminder else None
    days_since_last = (today - last_reminder_date).days if last_reminder_date else None

    message: Optional[str] = None

    if days_until_due >= 14:
        should_send = False

    elif 7 <= days_until_due < 14:
        # Weekly reminder (Bypassed frequency checks for testing/unlimited mode)
        should_send = True
        message = build_upcoming_reminder_message(name, amount, days_until_due, due_date_str)

    elif 0 < days_until_due <= 7:
        # Every 2 days (Bypassed frequency checks for testing/unlimited mode)
        should_send = True
        message = build_upcoming_reminder_message(name, amount, days_until_due, due_date_str)

    elif days_until_due == 0:
        # Due today — always send
        should_send = True
        message = build_due_today_message(name, amount, due_date_str)

    elif -30 <= days_until_due < 0:
        # Overdue — send every 2 days (Bypassed frequency checks for testing/unlimited mode)
        if not overdue_notification_stopped:
            should_send = True
            days_overdue = abs(days_until_due)
            message = build_overdue_message(name, amount, days_overdue, due_date_str)

    else:
        # days_until_due < -30: stop notifications
        if not overdue_notification_stopped:
            update_fields["overdue_notification_stopped"] = True
            logger.info("Stopping overdue notifications for '%s' (>30 days overdue).", name)

    if should_send and message:
        await send_telegram_message(message)
        update_fields["last_reminder_sent"] = now

        # Update reminder_stage
        current_stage = ob.get("reminder_stage", 0)
        if days_until_due < 0:
            update_fields["reminder_stage"] = 3
        elif days_until_due == 0:
            update_fields["reminder_stage"] = 3
        elif 0 < days_until_due <= 7:
            update_fields["reminder_stage"] = 2
        elif 7 <= days_until_due < 14:
            update_fields["reminder_stage"] = 1

    if update_fields:
        await db.obligations.update_one({"_id": ob_id}, {"$set": update_fields})
