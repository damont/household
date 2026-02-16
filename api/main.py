import asyncio
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie

from api.config import get_settings
from api.schemas.orm.user import User
from api.schemas.orm.connection import ServiceConnection
from api.schemas.orm.dashboard import DashboardSnapshot
from api.schemas.orm.chat import ChatSession
from api.routes import auth, dashboard, connections, agent
from api.services.scheduler import run_scheduler


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_url)
    await init_beanie(
        database=client[settings.mongodb_db_name],
        document_models=[User, ServiceConnection, DashboardSnapshot, ChatSession],
    )

    # Start background scheduler
    scheduler_task = asyncio.create_task(run_scheduler())

    yield

    # Shutdown
    scheduler_task.cancel()
    try:
        await scheduler_task
    except asyncio.CancelledError:
        pass
    client.close()


app = FastAPI(
    title="Household API",
    description="Household management dashboard API",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS middleware
settings = get_settings()
cors_origins = settings.cors_origins.split(",") if settings.cors_origins != "*" else ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router)
app.include_router(dashboard.router)
app.include_router(connections.router)
app.include_router(agent.router)


@app.get("/api/health")
async def health_check():
    return {"status": "healthy"}


@app.get("/api/schema")
async def get_schema():
    return app.openapi()
