from typing import Optional, List
from fastapi import APIRouter, HTTPException, Query
from ..schemas.budget import BudgetCreate, BudgetUpdate, BudgetResponse, BudgetSummaryResponse
from ..services import budget_service

router = APIRouter(prefix="/api/budgets", tags=["budgets"])


@router.get("/summary", response_model=List[BudgetSummaryResponse])
async def get_budget_summary(month: Optional[str] = Query(None, description="YYYY-MM format")):
    return await budget_service.get_budget_summary(month)


@router.get("", response_model=List[BudgetResponse])
async def list_budgets(month: Optional[str] = Query(None, description="YYYY-MM format")):
    return await budget_service.get_budgets(month)


@router.post("", response_model=BudgetResponse, status_code=201)
async def create_or_upsert_budget(body: BudgetCreate):
    return await budget_service.upsert_budget(
        category=body.category,
        monthly_limit=body.monthly_limit,
        month=body.month,
    )


@router.get("/{budget_id}", response_model=BudgetResponse)
async def get_budget(budget_id: str):
    result = await budget_service.get_budget_by_id(budget_id)
    if not result:
        raise HTTPException(status_code=404, detail="Budget not found")
    return result


@router.put("/{budget_id}", response_model=BudgetResponse)
async def update_budget(budget_id: str, body: BudgetUpdate):
    update_data = {k: v for k, v in body.model_dump().items() if v is not None}
    result = await budget_service.update_budget(budget_id, update_data)
    if not result:
        raise HTTPException(status_code=404, detail="Budget not found")
    return result


@router.delete("/{budget_id}", status_code=204)
async def delete_budget(budget_id: str):
    deleted = await budget_service.delete_budget(budget_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Budget not found")
