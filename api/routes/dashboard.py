from fastapi import APIRouter, Depends

from api.schemas.orm.user import User
from api.schemas.orm.dashboard import DashboardSnapshot
from api.schemas.dto.dashboard import DashboardResponse, RefreshResponse, WidgetData
from api.services.dashboard import fetch_dashboard_data
from api.utils.auth import get_current_user

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


@router.get("", response_model=DashboardResponse)
async def get_dashboard(current_user: User = Depends(get_current_user)):
    snapshot = await DashboardSnapshot.find_one(
        DashboardSnapshot.user_id == str(current_user.id)
    )

    if not snapshot:
        return DashboardResponse(
            widgets=[],
            last_refreshed_at=None,
            refresh_errors=[],
        )

    return DashboardResponse(
        widgets=[WidgetData(**w) for w in snapshot.widgets],
        last_refreshed_at=snapshot.last_refreshed_at.isoformat() if snapshot.last_refreshed_at else None,
        refresh_errors=snapshot.refresh_errors,
    )


@router.post("/refresh", response_model=RefreshResponse)
async def refresh_dashboard(current_user: User = Depends(get_current_user)):
    snapshot = await fetch_dashboard_data(str(current_user.id))
    return RefreshResponse(
        success=len(snapshot.refresh_errors) == 0,
        message="Dashboard refreshed" if not snapshot.refresh_errors else f"{len(snapshot.refresh_errors)} error(s) during refresh",
        widgets_count=len(snapshot.widgets),
    )
