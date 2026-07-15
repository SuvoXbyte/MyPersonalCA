from fastapi import APIRouter
from ..schemas.dashboard import DashboardResponse
from ..services.dashboard_service import get_dashboard_data

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard():
    return await get_dashboard_data()
