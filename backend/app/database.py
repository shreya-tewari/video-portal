"""
database.py – SQLAlchemy 2.0 async-style engine + session factory.

Supports both PostgreSQL (via psycopg 3, postgresql+psycopg://...)
and SQLite (sqlite:///./app.db) transparently.
"""

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

from app.config import settings


def _make_engine():
    url = settings.DATABASE_URL
    if url.startswith("sqlite"):
        # SQLite needs connect_args to allow usage across threads (FastAPI uses threads)
        return create_engine(
            url,
            connect_args={"check_same_thread": False},
            echo=False,
        )
    # PostgreSQL (Neon uses ?sslmode=require in the URL; psycopg handles it natively)
    return create_engine(url, echo=False)


engine = _make_engine()

SessionLocal = sessionmaker(bind=engine, autocommit=False, autoflush=False)


class Base(DeclarativeBase):
    """Shared declarative base for all ORM models."""
    pass


def get_db():
    """FastAPI dependency that yields a DB session and closes it afterwards."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
