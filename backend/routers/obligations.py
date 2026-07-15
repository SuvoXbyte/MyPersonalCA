from typing import Optional
from fastapi import APIRouter, HTTPException, Query
from ..schemas.obligation import ObligationCreate, ObligationUpdate, ObligationResponse
from ..services import obligation_service

router = APIRouter(prefix="/api/obligations", tags=["obligations"])


@router.get("", response_model=list[ObligationResponse])
async def list_obligations(
    type: Optional[str] = Query(None, description="Filter by type: loan|bill"),
    status: Optional[str] = Query(None, description="Filter by status: pending|paid|overdue"),
    category: Optional[str] = Query(None, description="Filter by category"),
):
    return await obligation_service.get_obligations(
        type_filter=type, status=status, category=category
    )


@router.post("", response_model=ObligationResponse, status_code=201)
async def create_obligation(body: ObligationCreate):
    return await obligation_service.create_obligation(body.model_dump())


@router.get("/{obligation_id}", response_model=ObligationResponse)
async def get_obligation(obligation_id: str):
    result = await obligation_service.get_obligation_by_id(obligation_id)
    if not result:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return result


@router.put("/{obligation_id}", response_model=ObligationResponse)
async def update_obligation(obligation_id: str, body: ObligationUpdate):
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    result = await obligation_service.update_obligation(obligation_id, update_data)
    if not result:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return result


@router.delete("/{obligation_id}", status_code=204)
async def delete_obligation(obligation_id: str):
    deleted = await obligation_service.delete_obligation(obligation_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Obligation not found")


@router.post("/{obligation_id}/mark-paid", response_model=ObligationResponse)
async def mark_obligation_paid(obligation_id: str):
    result = await obligation_service.mark_paid(obligation_id)
    if not result:
        raise HTTPException(status_code=404, detail="Obligation not found")
    return result
