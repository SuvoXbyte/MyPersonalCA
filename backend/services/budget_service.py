import calendar
import logging
from datetime import datetime, timezone, date
from typing import Optional, List
from bson import ObjectId
from ..database import get_db
from ..models.base import serialize_doc

logger = logging.getLogger(__name__)


def _current_month_str() -> str:
    today = date.today()
    return f"{today.year}-{today.month:02d}"


async def _compute_spent_for_category(category: str, month: str) -> float:
    """Sum payments for a category in a given month string (YYYY-MM)."""
    db = get_db()
    try:
        year, mon = int(month.split("-")[0]), int(month.split("-")[1])
    except (ValueError, IndexError):
        return 0.0

    start_dt = datetime(year, mon, 1, tzinfo=timezone.utc)
    last_day = calendar.monthrange(year, mon)[1]
    end_dt = datetime(year, mon, last_day, 23, 59, 59, tzinfo=timezone.utc)

    pipeline = [
        {
            "$match": {
                "category": category,
                "date": {"$gte": start_dt, "$lte": end_dt},
            }
        },
        {"$group": {"_id": None, "total": {"$sum": "$amount"}}},
    ]
    result = await db.payments.aggregate(pipeline).to_list(length=1)
    return result[0]["total"] if result else 0.0


async def upsert_budget(category: str, monthly_limit: float, month: str) -> dict:
    db = get_db()
    now = datetime.now(timezone.utc)
    existing = await db.budgets.find_one({"category": category, "month": month})

    if existing:
        await db.budgets.update_one(
            {"_id": existing["_id"]},
            {"$set": {"monthly_limit": monthly_limit, "updated_at": now}},
        )
        doc = await db.budgets.find_one({"_id": existing["_id"]})
    else:
        new_doc = {
            "category": category,
            "monthly_limit": monthly_limit,
            "month": month,
            "created_at": now,
            "updated_at": now,
        }
        result = await db.budgets.insert_one(new_doc)
        doc = await db.budgets.find_one({"_id": result.inserted_id})

    serialized = serialize_doc(doc)
    serialized["spent_so_far"] = await _compute_spent_for_category(category, month)
    return serialized


async def get_budgets(month: Optional[str] = None) -> List[dict]:
    db = get_db()
    query = {}
    if month:
        query["month"] = month
    else:
        query["month"] = _current_month_str()

    cursor = db.budgets.find(query)
    budgets = await cursor.to_list(length=500)

    result = []
    for b in budgets:
        serialized = serialize_doc(b)
        serialized["spent_so_far"] = await _compute_spent_for_category(b["category"], b["month"])
        result.append(serialized)
    return result


async def get_budget_by_id(budget_id: str) -> Optional[dict]:
    db = get_db()
    try:
        oid = ObjectId(budget_id)
    except Exception:
        return None
    doc = await db.budgets.find_one({"_id": oid})
    if not doc:
        return None
    serialized = serialize_doc(doc)
    serialized["spent_so_far"] = await _compute_spent_for_category(doc["category"], doc["month"])
    return serialized


async def update_budget(budget_id: str, update_data: dict) -> Optional[dict]:
    db = get_db()
    try:
        oid = ObjectId(budget_id)
    except Exception:
        return None

    update_data["updated_at"] = datetime.now(timezone.utc)
    await db.budgets.update_one({"_id": oid}, {"$set": update_data})
    return await get_budget_by_id(budget_id)


async def delete_budget(budget_id: str) -> bool:
    db = get_db()
    try:
        oid = ObjectId(budget_id)
    except Exception:
        return False
    result = await db.budgets.delete_one({"_id": oid})
    return result.deleted_count > 0


async def get_budget_summary(month: Optional[str] = None) -> List[dict]:
    """Return per-category budget summary with spend projection."""
    today = date.today()
    target_month = month or _current_month_str()

    try:
        year, mon = int(target_month.split("-")[0]), int(target_month.split("-")[1])
    except (ValueError, IndexError):
        year, mon = today.year, today.month

    days_in_month = calendar.monthrange(year, mon)[1]
    days_elapsed = today.day if (year == today.year and mon == today.month) else days_in_month
    days_remaining = days_in_month - days_elapsed

    budgets = await get_budgets(target_month)
    summaries = []

    for b in budgets:
        spent = b.get("spent_so_far", 0.0)
        limit = b["monthly_limit"]
        percentage = (spent / limit * 100) if limit > 0 else 0.0

        daily_rate = spent / days_elapsed if days_elapsed > 0 else 0.0
        projected_monthly = daily_rate * days_in_month
        projected_overspend = max(0.0, projected_monthly - limit)

        summaries.append(
            {
                "category": b["category"],
                "monthly_limit": limit,
                "spent_so_far": spent,
                "percentage": round(percentage, 2),
                "projected_monthly": round(projected_monthly, 2),
                "projected_overspend": round(projected_overspend, 2),
                "days_elapsed": days_elapsed,
                "days_remaining": days_remaining,
            }
        )

    return summaries
