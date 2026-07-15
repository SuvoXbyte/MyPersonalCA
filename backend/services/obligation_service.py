import logging
from datetime import datetime, timezone, timedelta
from typing import Optional, List
from bson import ObjectId
from dateutil.relativedelta import relativedelta
from ..database import get_db
from ..models.base import serialize_doc
from . import balance_service, payment_service

logger = logging.getLogger(__name__)


def _obligation_to_response(doc: dict) -> dict:
    return serialize_doc(doc)


async def create_obligation(data: dict) -> dict:
    db = get_db()
    now = datetime.now(timezone.utc)
    data["created_at"] = now
    data["updated_at"] = now
    data.setdefault("reminder_stage", 0)
    data.setdefault("overdue_notification_stopped", False)
    data.setdefault("last_reminder_sent", None)
    data.setdefault("status", "pending")

    result = await db.obligations.insert_one(data)
    doc = await db.obligations.find_one({"_id": result.inserted_id})
    return _obligation_to_response(doc)


async def get_obligations(
    type_filter: Optional[str] = None,
    status: Optional[str] = None,
    category: Optional[str] = None,
) -> List[dict]:
    db = get_db()
    query: dict = {}
    if type_filter:
        query["type"] = type_filter
    if status:
        query["status"] = status
    if category:
        query["category"] = category

    cursor = db.obligations.find(query).sort("due_date", 1)
    docs = await cursor.to_list(length=1000)
    return [_obligation_to_response(d) for d in docs]


async def get_obligation_by_id(obligation_id: str) -> Optional[dict]:
    db = get_db()
    try:
        oid = ObjectId(obligation_id)
    except Exception:
        return None
    doc = await db.obligations.find_one({"_id": oid})
    return _obligation_to_response(doc) if doc else None


async def update_obligation(obligation_id: str, update_data: dict) -> Optional[dict]:
    db = get_db()
    try:
        oid = ObjectId(obligation_id)
    except Exception:
        return None

    update_data["updated_at"] = datetime.now(timezone.utc)
    result = await db.obligations.update_one({"_id": oid}, {"$set": update_data})
    if result.matched_count == 0:
        return None
    doc = await db.obligations.find_one({"_id": oid})
    return _obligation_to_response(doc)


async def delete_obligation(obligation_id: str) -> bool:
    db = get_db()
    try:
        oid = ObjectId(obligation_id)
    except Exception:
        return False
    result = await db.obligations.delete_one({"_id": oid})
    return result.deleted_count > 0


def _compute_next_due_date(current_due: datetime, recurrence: str, custom_interval_days: Optional[int]) -> datetime:
    if recurrence == "monthly":
        return current_due + relativedelta(months=1)
    elif recurrence == "custom" and custom_interval_days:
        return current_due + timedelta(days=custom_interval_days)
    return current_due  # fallback (one-time shouldn't reach here)


async def mark_paid(obligation_id: str) -> Optional[dict]:
    """
    Full mark-paid flow:
    1. Set status=paid, record paid_at
    2. If loan: decrement outstanding_balance by amount (floor at 0)
    3. Create payment record (auto_linked)
    4. Deduct balance
    5. If recurrence != one-time (and not fully paid loan): create next cycle obligation
    6. Check low balance
    7. Return updated obligation
    """
    db = get_db()
    try:
        oid = ObjectId(obligation_id)
    except Exception:
        return None

    obligation = await db.obligations.find_one({"_id": oid})
    if not obligation:
        return None

    now = datetime.now(timezone.utc)
    amount = obligation["amount"]
    ob_type = obligation["type"]
    recurrence = obligation["recurrence"]
    category = obligation["category"]
    name = obligation["name"]

    update_fields: dict = {
        "status": "paid",
        "paid_at": now,
        "updated_at": now,
    }

    # Handle loan outstanding balance
    fully_paid_loan = False
    if ob_type == "loan":
        outstanding = obligation.get("outstanding_balance") or 0.0
        new_outstanding = max(0.0, outstanding - amount)
        update_fields["outstanding_balance"] = new_outstanding
        if new_outstanding <= 0:
            fully_paid_loan = True
            logger.info("Loan '%s' is fully paid off.", name)

    await db.obligations.update_one({"_id": oid}, {"$set": update_fields})

    # Create payment record
    payment = await payment_service.create_payment(
        amount=amount,
        date=now,
        category=category,
        note=f"Payment: {name}",
        obligation_id=obligation_id,
        source="auto_linked",
        deduct_balance=False,  # We'll deduct below directly
    )
    payment_id = payment["id"]

    # Deduct from balance
    await balance_service.deduct(
        amount,
        entry_type=ob_type,
        reference_id=payment_id,
        description=f"Payment: {name}",
    )

    # Create next cycle if applicable
    if recurrence != "one-time" and not fully_paid_loan:
        current_due = obligation["due_date"]
        next_due = _compute_next_due_date(current_due, recurrence, obligation.get("custom_interval_days"))

        next_cycle = {
            "type": ob_type,
            "name": name,
            "amount": amount,
            "due_date": next_due,
            "recurrence": recurrence,
            "custom_interval_days": obligation.get("custom_interval_days"),
            "status": "pending",
            "outstanding_balance": update_fields.get("outstanding_balance", obligation.get("outstanding_balance")),
            "principal": obligation.get("principal"),
            "category": category,
            "last_reminder_sent": None,
            "reminder_stage": 0,
            "overdue_notification_stopped": False,
            "notes": obligation.get("notes"),
            "created_at": now,
            "updated_at": now,
        }
        await db.obligations.insert_one(next_cycle)
        logger.info("Created next cycle obligation for '%s' due %s", name, next_due)

    # Check low balance
    await balance_service.check_and_alert_low_balance()

    doc = await db.obligations.find_one({"_id": oid})
    return _obligation_to_response(doc)
