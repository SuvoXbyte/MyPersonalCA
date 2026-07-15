import logging
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz

logger = logging.getLogger(__name__)

_scheduler: AsyncIOScheduler = None


def get_scheduler() -> AsyncIOScheduler:
    return _scheduler


async def start_scheduler() -> None:
    global _scheduler
    from .services.reminder_service import run_daily_job

    tz = pytz.timezone("Asia/Kolkata")
    _scheduler = AsyncIOScheduler(timezone=tz)

    # Daily reminder job at 08:00 Asia/Kolkata
    _scheduler.add_job(
        run_daily_job,
        trigger=CronTrigger(hour=8, minute=0, timezone=tz),
        id="daily_reminder_job",
        replace_existing=True,
        misfire_grace_time=3600,
    )

    _scheduler.start()
    logger.info("APScheduler started. Daily job scheduled at 08:00 Asia/Kolkata.")


async def shutdown_scheduler() -> None:
    global _scheduler
    if _scheduler is not None and _scheduler.running:
        _scheduler.shutdown(wait=False)
        logger.info("APScheduler shut down.")
