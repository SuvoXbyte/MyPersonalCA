from fastapi import APIRouter
from ..services.reminder_service import run_daily_job

router = APIRouter(prefix="/api", tags=["scheduler"])


@router.post("/trigger-daily-job")
async def trigger_daily_job():
    """Manually trigger the daily reminder/overdue job. Useful for testing and cron-job.org."""
    await run_daily_job()
    return {"status": "ok", "message": "Daily job executed successfully"}
