import json
from datetime import datetime, timezone

from fastapi import APIRouter, HTTPException, status, Depends
from beanie import PydanticObjectId

from api.schemas.orm.user import User
from api.schemas.orm.connection import ServiceConnection, EndpointConfig
from api.schemas.dto.connection import (
    ConnectionCreate,
    ConnectionUpdate,
    ConnectionResponse,
    ConnectionTestResponse,
)
from api.utils.auth import get_current_user
from api.utils.crypto import encrypt_value, decrypt_value
from api.connectors.presets import get_preset_endpoints
from api.connectors.rest import RESTConnector

router = APIRouter(prefix="/api/connections", tags=["connections"])


def _connection_to_response(conn: ServiceConnection) -> ConnectionResponse:
    return ConnectionResponse(
        id=str(conn.id),
        service_type=conn.service_type,
        display_name=conn.display_name,
        base_url=conn.base_url,
        frontend_url=conn.frontend_url,
        auth_type=conn.auth_type,
        endpoints=[
            {"name": e.name, "path": e.path, "method": e.method, "dashboard_label": e.dashboard_label}
            for e in conn.endpoints
        ],
        enabled=conn.enabled,
        last_sync_at=conn.last_sync_at.isoformat() if conn.last_sync_at else None,
        last_sync_status=conn.last_sync_status,
        last_sync_error=conn.last_sync_error,
        created_at=conn.created_at.isoformat(),
        updated_at=conn.updated_at.isoformat(),
    )


@router.get("", response_model=list[ConnectionResponse])
async def list_connections(current_user: User = Depends(get_current_user)):
    connections = await ServiceConnection.find(
        ServiceConnection.user_id == str(current_user.id)
    ).to_list()
    return [_connection_to_response(c) for c in connections]


@router.post("", response_model=ConnectionResponse, status_code=status.HTTP_201_CREATED)
async def create_connection(
    data: ConnectionCreate,
    current_user: User = Depends(get_current_user),
):
    encrypted_creds = encrypt_value(json.dumps(data.credentials))

    endpoints = [
        EndpointConfig(name=e.name, path=e.path, method=e.method, dashboard_label=e.dashboard_label)
        for e in data.endpoints
    ]

    # If no endpoints provided, use presets for known service types
    if not endpoints:
        preset = get_preset_endpoints(data.service_type)
        if preset:
            endpoints = [
                EndpointConfig(name=e["name"], path=e["path"], method=e.get("method", "GET"), dashboard_label=e.get("dashboard_label"))
                for e in preset
            ]

    conn = ServiceConnection(
        user_id=str(current_user.id),
        service_type=data.service_type,
        display_name=data.display_name,
        base_url=data.base_url.rstrip("/"),
        frontend_url=data.frontend_url,
        auth_type=data.auth_type,
        encrypted_credentials=encrypted_creds,
        endpoints=endpoints,
        enabled=True,
    )
    await conn.insert()
    return _connection_to_response(conn)


@router.put("/{connection_id}", response_model=ConnectionResponse)
async def update_connection(
    connection_id: str,
    data: ConnectionUpdate,
    current_user: User = Depends(get_current_user),
):
    conn = await ServiceConnection.get(PydanticObjectId(connection_id))
    if not conn or conn.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Connection not found")

    if data.display_name is not None:
        conn.display_name = data.display_name
    if data.base_url is not None:
        conn.base_url = data.base_url.rstrip("/")
    if data.frontend_url is not None:
        conn.frontend_url = data.frontend_url
    if data.auth_type is not None:
        conn.auth_type = data.auth_type
    if data.credentials is not None:
        conn.encrypted_credentials = encrypt_value(json.dumps(data.credentials))
    if data.endpoints is not None:
        conn.endpoints = [
            EndpointConfig(name=e.name, path=e.path, method=e.method, dashboard_label=e.dashboard_label)
            for e in data.endpoints
        ]
    if data.enabled is not None:
        conn.enabled = data.enabled

    conn.updated_at = datetime.now(timezone.utc)
    await conn.save()
    return _connection_to_response(conn)


@router.delete("/{connection_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_connection(
    connection_id: str,
    current_user: User = Depends(get_current_user),
):
    conn = await ServiceConnection.get(PydanticObjectId(connection_id))
    if not conn or conn.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Connection not found")
    await conn.delete()


@router.post("/{connection_id}/test", response_model=ConnectionTestResponse)
async def test_connection(
    connection_id: str,
    current_user: User = Depends(get_current_user),
):
    conn = await ServiceConnection.get(PydanticObjectId(connection_id))
    if not conn or conn.user_id != str(current_user.id):
        raise HTTPException(status_code=404, detail="Connection not found")

    creds = json.loads(decrypt_value(conn.encrypted_credentials))
    connector = RESTConnector()

    try:
        token = await connector.authenticate(conn.base_url, conn.auth_type, creds)
        reachable = await connector.test_connection(conn.base_url, token)
        if reachable:
            return ConnectionTestResponse(success=True, message="Connection successful")
        else:
            return ConnectionTestResponse(success=False, message="Service unreachable")
    except Exception as e:
        return ConnectionTestResponse(success=False, message=str(e))
