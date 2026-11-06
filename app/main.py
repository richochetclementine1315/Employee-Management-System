from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models  # noqa: F401  (registers tables on Base.metadata)
from .config import settings
from .database import Base, engine
from .routers import employees, leaves


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Creates tables on first run. Swap for Alembic migrations once the schema starts changing.
    Base.metadata.create_all(bind=engine)
    yield


app = FastAPI(title="Employee & Leave Management API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(employees.router)
app.include_router(leaves.router)


@app.get("/health", tags=["Health"])
def health():
    return {"status": "ok"}
