import logging
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from .config import settings

logger = logging.getLogger(__name__)

_client: AsyncIOMotorClient = None
_db: AsyncIOMotorDatabase = None


async def connect_db() -> None:
    global _client, _db
    try:
        _client = AsyncIOMotorClient(
            settings.mongodb_uri,
            maxPoolSize=5,
            serverSelectionTimeoutMS=5000,
        )
        # Ping to verify connection
        await _client.admin.command("ping")
        _db = _client[settings.database_name]
        logger.info("Connected to MongoDB: %s / %s", settings.mongodb_uri, settings.database_name)

        # Ensure indexes
        await _create_indexes()
    except Exception as exc:
        logger.error("Failed to connect to MongoDB: %s", exc)
        raise


async def _create_indexes() -> None:
    if _db is None:
        return
    await _db.obligations.create_index("status")
    await _db.obligations.create_index("type")
    await _db.obligations.create_index("due_date")
    await _db.payments.create_index("date")
    await _db.payments.create_index("category")
    await _db.payments.create_index("obligation_id")
    await _db.budgets.create_index([("category", 1), ("month", 1)], unique=True)
    await _db.balance_history.create_index("date")
    logger.info("MongoDB indexes ensured.")


async def close_db() -> None:
    global _client, _db
    if _client is not None:
        _client.close()
        _client = None
        _db = None
        logger.info("MongoDB connection closed.")


def get_db() -> AsyncIOMotorDatabase:
    if _db is None:
        raise RuntimeError("Database not connected. Call connect_db() first.")
    return _db
