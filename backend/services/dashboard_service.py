import calendar
import logging
from datetime import datetime, timezone, date, timedelta
from typing import List
from ..database import get_db
from .balance_service import get_account
from .reminder_service import _evaluate_streak

logger = logging.getLogger(__name__)

FIXED_CATEGORIES = {"loan", "bill", "emi", "rent", "insurance", "subscription"}


async def get_dashboard_data() -> dict:
    """Aggregate all dashboard data in one call."""
    db = get_db()

    # Evaluate streak if new month
    try:
        await _evaluate_streak()
    except Exception as exc:
        logger.warning("Streak evaluation error in dashboard: %s", exc)

    account = await get_account()
    current_balance = account["current_balance"]
    low_balance_threshold = account["low_balance_threshold"]
    habit_streak = account.get("habit_streak", 0)
    is_low = current_balance < low_balance_threshold

    today = date.today()
    now = datetime.now(timezone.utc)

    # --- Upcoming dues (next 7 days, not paid) ---
    seven_days_later = now + timedelta(days=7)
    upcoming_obligations = await db.obligations.find(
        {
            "due_date": {"$gte": now, "$lte": seven_days_later},
            "status": {"$ne": "paid"},
        }
    ).to_list(length=200)

    upcoming_dues = []
    projected_deduction = 0.0
    for ob in upcoming_obligations:
        due_dt = ob["due_date"]
        if due_dt.tzinfo is None:
            due_dt = due_dt.replace(tzinfo=timezone.utc)
        days_until = (due_dt.date() - today).days
        upcoming_dues.append(
            {
                "id": str(ob["_id"]),
                "name": ob["name"],
                "type": ob["type"],
                "amount": ob["amount"],
                "due_date": due_dt,
                "days_until_due": days_until,
                "status": ob["status"],
            }
        )
        projected_deduction += ob["amount"]

    projected_balance = current_balance - projected_deduction

    # --- Overdue ---
    overdue_obligations = await db.obligations.find(
        {"status": "overdue"}
    ).to_list(length=200)

    overdue = []
    for ob in overdue_obligations:
        due_dt = ob["due_date"]
        if due_dt.tzinfo is None:
            due_dt = due_dt.replace(tzinfo=timezone.utc)
        days_until = (due_dt.date() - today).days
        days_overdue = abs(min(0, days_until))
        overdue.append(
            {
                "id": str(ob["_id"]),
                "name": ob["name"],
                "type": ob["type"],
                "amount": ob["amount"],
                "due_date": due_dt,
                "days_until_due": days_until,
                "days_overdue": days_overdue,
                "status": ob["status"],
            }
        )

    # --- Budget summary (current month) ---
    current_month_str = f"{today.year}-{today.month:02d}"
    days_in_month = calendar.monthrange(today.year, today.month)[1]
    month_start = datetime(today.year, today.month, 1, tzinfo=timezone.utc)
    month_end = datetime(today.year, today.month, days_in_month, 23, 59, 59, tzinfo=timezone.utc)

    budgets = await db.budgets.find({"month": current_month_str}).to_list(length=500)
    budget_summary = []

    for b in budgets:
        pipeline = [
            {
                "$match": {
                    "category": b["category"],
                    "date": {"$gte": month_start, "$lte": month_end},
                }
            },
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        result = await db.payments.aggregate(pipeline).to_list(length=1)
        spent = result[0]["total"] if result else 0.0
        limit = b["monthly_limit"]
        percentage = round((spent / limit * 100) if limit > 0 else 0.0, 2)
        budget_summary.append(
            {
                "category": b["category"],
                "limit": limit,
                "spent": spent,
                "percentage": percentage,
            }
        )

    # --- Current month payments for fixed/variable split ---
    all_payments = await db.payments.find(
        {"date": {"$gte": month_start, "$lte": month_end}}
    ).to_list(length=5000)

    fixed_items = []
    variable_items = []
    category_totals: dict = {}

    for p in all_payments:
        cat = p.get("category", "other").lower()
        amt = p.get("amount", 0.0)
        item = {"name": p.get("note") or p.get("category", ""), "amount": amt, "category": p.get("category", "")}
        if cat in FIXED_CATEGORIES:
            fixed_items.append(item)
        else:
            variable_items.append(item)
        category_totals[p.get("category", "other")] = category_totals.get(p.get("category", "other"), 0.0) + amt

    fixed_spending = {
        "total": round(sum(i["amount"] for i in fixed_items), 2),
        "breakdown": fixed_items,
    }
    variable_spending = {
        "total": round(sum(i["amount"] for i in variable_items), 2),
        "breakdown": variable_items,
    }

    category_breakdown = [
        {"category": cat, "amount": round(amt, 2)}
        for cat, amt in sorted(category_totals.items(), key=lambda x: -x[1])
    ]

    # --- Monthly trend (last 6 months) ---
    monthly_trend = []
    for i in range(5, -1, -1):
        # Go back i months from today
        target_month = today.month - i
        target_year = today.year
        while target_month <= 0:
            target_month += 12
            target_year -= 1

        m_str = f"{target_year}-{target_month:02d}"
        m_days = calendar.monthrange(target_year, target_month)[1]
        m_start = datetime(target_year, target_month, 1, tzinfo=timezone.utc)
        m_end = datetime(target_year, target_month, m_days, 23, 59, 59, tzinfo=timezone.utc)

        pipeline = [
            {"$match": {"date": {"$gte": m_start, "$lte": m_end}}},
            {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
        ]
        result = await db.payments.aggregate(pipeline).to_list(length=1)
        total = result[0]["total"] if result else 0.0
        monthly_trend.append({"month": m_str, "total": round(total, 2)})

    # --- Daily Budget Calculations ---
    import pytz
    kolkata_tz = pytz.timezone("Asia/Kolkata")
    local_now = datetime.now(kolkata_tz)
    local_today = local_now.date()

    days_in_month_local = calendar.monthrange(local_today.year, local_today.month)[1]
    remaining_days = days_in_month_local - local_today.day + 1

    total_budget_limit = sum(b.get("monthly_limit", 0.0) for b in budgets)

    pipeline_month = [
        {
            "$match": {
                "date": {"$gte": month_start, "$lte": month_end}
            }
        },
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    result_month = await db.payments.aggregate(pipeline_month).to_list(length=1)
    total_spent_this_month = result_month[0]["total"] if result_month else 0.0

    today_start_local = datetime(local_today.year, local_today.month, local_today.day, 0, 0, 0)
    today_end_local = datetime(local_today.year, local_today.month, local_today.day, 23, 59, 59)
    today_start_utc = kolkata_tz.localize(today_start_local).astimezone(timezone.utc)
    today_end_utc = kolkata_tz.localize(today_end_local).astimezone(timezone.utc)

    pipeline_today = [
        {
            "$match": {
                "date": {"$gte": today_start_utc, "$lte": today_end_utc}
            }
        },
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    result_today = await db.payments.aggregate(pipeline_today).to_list(length=1)
    spent_today = result_today[0]["total"] if result_today else 0.0

    remaining_budget = max(0.0, total_budget_limit - total_spent_this_month)
    daily_budget = remaining_budget / remaining_days if total_budget_limit > 0 and remaining_days > 0 else 0.0

    return {
        "balance": {
            "current": current_balance,
            "low_balance_threshold": low_balance_threshold,
            "is_low": is_low,
        },
        "projected_balance": projected_balance,
        "upcoming_dues": upcoming_dues,
        "overdue": overdue,
        "budget_summary": budget_summary,
        "fixed_spending": fixed_spending,
        "variable_spending": variable_spending,
        "monthly_trend": monthly_trend,
        "category_breakdown": category_breakdown,
        "habit_streak": habit_streak,
        "daily_budget": {
            "limit": round(daily_budget, 2),
            "spent_today": round(spent_today, 2),
            "remaining_days": remaining_days,
        },
    }
