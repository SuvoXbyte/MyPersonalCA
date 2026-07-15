import logging
from datetime import datetime, timezone
from typing import Optional, List
from bson import ObjectId
from ..database import get_db
from ..models.base import serialize_doc
from . import balance_service

logger = logging.getLogger(__name__)


async def create_payment(
    amount: float,
    date: datetime,
    category: str,
    note: Optional[str] = None,
    obligation_id: Optional[str] = None,
    source: str = "manual",
    deduct_balance: bool = True,
) -> dict:
    db = get_db()
    now = datetime.now(timezone.utc)

    doc = {
        "obligation_id": obligation_id,
        "amount": amount,
        "date": date,
        "category": category,
        "note": note,
        "source": source,
        "created_at": now,
    }
    result = await db.payments.insert_one(doc)
    payment_id = str(result.inserted_id)

    if deduct_balance:
        entry_type = "expense"
        if obligation_id:
            # Determine entry type from the linked obligation
            ob = await db.obligations.find_one({"_id": ObjectId(obligation_id)}) if ObjectId.is_valid(obligation_id) else None
            if ob:
                entry_type = ob.get("type", "expense")
        await balance_service.deduct(
            amount,
            entry_type=entry_type,
            reference_id=payment_id,
            description=f"Payment: {category}" + (f" - {note}" if note else ""),
        )

    payment = await db.payments.find_one({"_id": result.inserted_id})
    return serialize_doc(payment)


async def get_payments(
    start_date: Optional[datetime] = None,
    end_date: Optional[datetime] = None,
    category: Optional[str] = None,
    obligation_id: Optional[str] = None,
    page: int = 1,
    limit: int = 50,
) -> dict:
    db = get_db()
    query: dict = {}

    date_filter: dict = {}
    if start_date:
        date_filter["$gte"] = start_date
    if end_date:
        date_filter["$lte"] = end_date
    if date_filter:
        query["date"] = date_filter

    if category:
        query["category"] = category
    if obligation_id:
        query["obligation_id"] = obligation_id

    skip = (page - 1) * limit
    cursor = db.payments.find(query).sort("date", -1).skip(skip).limit(limit)
    items = await cursor.to_list(length=limit)
    total = await db.payments.count_documents(query)

    return {
        "items": [serialize_doc(item) for item in items],
        "total": total,
        "page": page,
        "limit": limit,
    }


async def get_payment_by_id(payment_id: str) -> Optional[dict]:
    db = get_db()
    try:
        oid = ObjectId(payment_id)
    except Exception:
        return None
    doc = await db.payments.find_one({"_id": oid})
    return serialize_doc(doc) if doc else None


async def update_payment(payment_id: str, update_data: dict) -> Optional[dict]:
    db = get_db()
    try:
        oid = ObjectId(payment_id)
    except Exception:
        return None

    existing = await db.payments.find_one({"_id": oid})
    if not existing:
        return None

    old_amount = existing["amount"]
    new_amount = update_data.get("amount", old_amount)

    await db.payments.update_one({"_id": oid}, {"$set": update_data})

    # Reverse old balance change and apply new if amount changed
    if new_amount != old_amount:
        diff = old_amount - new_amount  # positive = we refund a bit
        if diff > 0:
            await balance_service.reverse_deduction(diff, description=f"Payment amount reduced for payment {payment_id}")
        else:
            await balance_service.deduct(
                abs(diff),
                entry_type="expense",
                reference_id=payment_id,
                description=f"Payment amount increased for payment {payment_id}",
            )

    doc = await db.payments.find_one({"_id": oid})
    return serialize_doc(doc)


async def delete_payment(payment_id: str) -> bool:
    db = get_db()
    try:
        oid = ObjectId(payment_id)
    except Exception:
        return False

    existing = await db.payments.find_one({"_id": oid})
    if not existing:
        return False

    # Reverse the balance change
    amount = existing["amount"]
    await balance_service.reverse_deduction(amount, description=f"Reversed payment deletion: {existing.get('category', '')} - {payment_id}")

    result = await db.payments.delete_one({"_id": oid})
    return result.deleted_count > 0


async def get_distinct_categories() -> List[str]:
    db = get_db()
    categories = await db.payments.distinct("category")
    return sorted(categories)
