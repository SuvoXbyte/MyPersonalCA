from typing import Optional, List
from datetime import datetime
from fastapi import APIRouter, HTTPException, Query
from ..schemas.payment import PaymentCreate, PaymentUpdate, PaymentResponse
from ..services import payment_service

router = APIRouter(prefix="/api/payments", tags=["payments"])


@router.get("", response_model=dict)
async def list_payments(
    start_date: Optional[datetime] = Query(None),
    end_date: Optional[datetime] = Query(None),
    category: Optional[str] = Query(None),
    obligation_id: Optional[str] = Query(None),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
):
    return await payment_service.get_payments(
        start_date=start_date,
        end_date=end_date,
        category=category,
        obligation_id=obligation_id,
        page=page,
        limit=limit,
    )


@router.get("/categories", response_model=List[str])
async def get_payment_categories():
    return await payment_service.get_distinct_categories()


@router.post("", response_model=PaymentResponse, status_code=201)
async def create_payment(body: PaymentCreate):
    return await payment_service.create_payment(
        amount=body.amount,
        date=body.date,
        category=body.category,
        note=body.note,
        obligation_id=body.obligation_id,
        source="manual",
        deduct_balance=True,
    )


@router.get("/{payment_id}", response_model=PaymentResponse)
async def get_payment(payment_id: str):
    result = await payment_service.get_payment_by_id(payment_id)
    if not result:
        raise HTTPException(status_code=404, detail="Payment not found")
    return result


@router.put("/{payment_id}", response_model=PaymentResponse)
async def update_payment(payment_id: str, body: PaymentUpdate):
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    result = await payment_service.update_payment(payment_id, update_data)
    if not result:
        raise HTTPException(status_code=404, detail="Payment not found")
    return result


@router.delete("/{payment_id}", status_code=204)
async def delete_payment(payment_id: str):
    deleted = await payment_service.delete_payment(payment_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Payment not found")
