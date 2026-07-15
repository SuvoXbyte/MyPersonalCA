import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
import os

from .database import connect_db, close_db
from .scheduler import start_scheduler, shutdown_scheduler
from .routers import (
    health,
    obligations,
    payments,
    budgets,
    account,
    dashboard,
    export,
    scheduler,
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: connect DB and start scheduler. Shutdown: stop both."""
    logger.info("Starting up Finance Tracker backend...")
    await connect_db()
    await start_scheduler()
    yield
    logger.info("Shutting down Finance Tracker backend...")
    await shutdown_scheduler()
    await close_db()


app = FastAPI(
    title="Personal Finance & Obligation Tracker API",
    description="Track loans, bills, budgets, payments and get smart reminders.",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS — allow all origins for development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount routers
app.include_router(health.router)
app.include_router(obligations.router)
app.include_router(payments.router)
app.include_router(budgets.router)
app.include_router(account.router)
app.include_router(dashboard.router)
app.include_router(export.router)
app.include_router(scheduler.router)

# Mount frontend static files if built
_frontend_dist = os.path.join(os.path.dirname(__file__), "..", "frontend", "dist")
try:
    if os.path.isdir(_frontend_dist):
        app.mount("/", StaticFiles(directory=_frontend_dist, html=True), name="frontend")
        logger.info("Frontend static files mounted from: %s", _frontend_dist)
    else:
        logger.warning("Frontend dist not found at %s. Skipping static mount.", _frontend_dist)
except Exception as exc:
    logger.warning("Could not mount frontend static files: %s", exc)
