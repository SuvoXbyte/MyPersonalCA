from fastapi import APIRouter, HTTPException, Query
from ..schemas.account import (
    AccountResponse,
    SetBalanceRequest,
    AddFundsRequest,
    UpdateSettingsRequest,
    BalanceHistoryResponse,
    ProjectedBalanceResponse,
)
from ..services import balance_service

router = APIRouter(prefix="/api/account", tags=["account"])


@router.get("", response_model=AccountResponse)
async def get_account():
    account = await balance_service.get_account()
    return account


@router.put("/balance", response_model=AccountResponse)
async def set_balance(body: SetBalanceRequest):
    await balance_service.set_balance(body.amount, description=body.description or "Manual balance adjustment")
    return await balance_service.get_account()


@router.post("/add-funds", response_model=AccountResponse)
async def add_funds(body: AddFundsRequest):
    await balance_service.add_income(body.amount, description=body.description)
    return await balance_service.get_account()


@router.get("/history")
async def get_balance_history(
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500),
):
    return await balance_service.get_history(page=page, limit=limit)


@router.get("/projected", response_model=ProjectedBalanceResponse)
async def get_projected_balance():
    return await balance_service.get_projected(horizon_days=7)


@router.put("/settings", response_model=AccountResponse)
async def update_account_settings(body: UpdateSettingsRequest):
    updated = await balance_service.update_settings(
        low_balance_threshold=body.low_balance_threshold,
        telegram_chat_id=body.telegram_chat_id,
    )
    return updated
