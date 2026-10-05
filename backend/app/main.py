"""
main.py – FastAPI application entry point.

Startup sequence:
  1. Create all DB tables (idempotent via CREATE TABLE IF NOT EXISTS).
  2. Seed roles and super-admin (idempotent).
  3. Mount routers under /api prefix.
  4. Enable CORS for the configured frontend origin.
"""

from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import SessionLocal, engine
from app.models import Base
from app.routers import admin, auth
from app.seed import run_seed

@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────────────────
    # Create tables (idempotent)
    Base.metadata.create_all(bind=engine)
    # Seed roles + super-admin (idempotent)
    db = SessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    yield
    # ── Shutdown (nothing to do) ──────────────────────────────────────────────


app = FastAPI(
    title="User Login & Role Approval API",
    version="1.0.0",
    description="FastAPI backend for user registration, login, and role-based access control.",
    lifespan=lifespan,
)

# ── CORS ──────────────────────────────────────────────────────────────────────
origins = [o.strip() for o in settings.FRONTEND_ORIGIN.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ── Routers ───────────────────────────────────────────────────────────────────
app.include_router(auth.router, prefix="/api")
app.include_router(admin.router, prefix="/api")


# ── Health check ──────────────────────────────────────────────────────────────
@app.get("/health", tags=["health"])
def health():
    return {"status": "ok"}
