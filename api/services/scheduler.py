import asyncio
import logging

from api.config import get_settings
from api.schemas.orm.connection import ServiceConnection
from api.services.dashboard import fetch_dashboard_data

logger = logging.getLogger(__name__)


async def run_scheduler():
    settings = get_settings()
    interval = settings.refresh_interval_seconds

    while True:
        try:
            await asyncio.sleep(interval)
            # Find all distinct user IDs with enabled connections
            pipeline = [
                {"$match": {"enabled": True}},
                {"$group": {"_id": "$user_id"}},
            ]
            results = await ServiceConnection.aggregate(pipeline).to_list()
            user_ids = [r["_id"] for r in results]

            for user_id in user_ids:
                try:
                    await fetch_dashboard_data(user_id)
                    logger.info(f"Refreshed dashboard for user {user_id}")
                except Exception as e:
                    logger.error(f"Failed to refresh dashboard for user {user_id}: {e}")

        except asyncio.CancelledError:
            logger.info("Scheduler cancelled")
            break
        except Exception as e:
            logger.error(f"Scheduler error: {e}")
            await asyncio.sleep(60)
