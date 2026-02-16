import json
from datetime import datetime, timezone

from api.schemas.orm.connection import ServiceConnection
from api.schemas.orm.dashboard import DashboardSnapshot
from api.connectors.rest import RESTConnector
from api.utils.crypto import decrypt_value


async def fetch_dashboard_data(user_id: str) -> DashboardSnapshot:
    connections = await ServiceConnection.find(
        ServiceConnection.user_id == user_id,
        ServiceConnection.enabled == True,
    ).to_list()

    connector = RESTConnector()
    widgets = []
    errors = []

    for conn in connections:
        try:
            creds = json.loads(decrypt_value(conn.encrypted_credentials))
            token = await connector.authenticate(conn.base_url, conn.auth_type, creds)
            results = await connector.fetch_all(conn.base_url, token, conn.endpoints)

            for result in results:
                widget = {
                    "service_type": conn.service_type,
                    "service_name": conn.display_name,
                    "frontend_url": conn.frontend_url,
                    "endpoint_name": result["name"],
                    "label": result["label"],
                    "data": result.get("data"),
                    "error": result.get("error"),
                }
                widgets.append(widget)

            # Update connection sync status
            conn.last_sync_at = datetime.now(timezone.utc)
            conn.last_sync_status = "success"
            conn.last_sync_error = None
            await conn.save()

        except Exception as e:
            error_msg = f"{conn.display_name}: {str(e)}"
            errors.append(error_msg)
            conn.last_sync_at = datetime.now(timezone.utc)
            conn.last_sync_status = "error"
            conn.last_sync_error = str(e)
            await conn.save()

    # Upsert dashboard snapshot
    snapshot = await DashboardSnapshot.find_one(
        DashboardSnapshot.user_id == user_id
    )
    if snapshot:
        snapshot.widgets = widgets
        snapshot.last_refreshed_at = datetime.now(timezone.utc)
        snapshot.refresh_errors = errors
        await snapshot.save()
    else:
        snapshot = DashboardSnapshot(
            user_id=user_id,
            widgets=widgets,
            last_refreshed_at=datetime.now(timezone.utc),
            refresh_errors=errors,
        )
        await snapshot.insert()

    return snapshot
