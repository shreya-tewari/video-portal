"""
tests/conftest.py – pytest fixtures for an in-memory SQLite test DB.
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.database import Base, get_db
from app.main import app
from app.seed import run_seed

# Use an in-memory SQLite database for all tests
TEST_DB_URL = "sqlite:///./test_app.db"

test_engine = create_engine(
    TEST_DB_URL, connect_args={"check_same_thread": False}
)
TestSessionLocal = sessionmaker(bind=test_engine, autocommit=False, autoflush=False)


@pytest.fixture(scope="session", autouse=True)
def setup_db():
    """Create tables and seed data once per test session."""
    Base.metadata.create_all(bind=test_engine)
    db = TestSessionLocal()
    try:
        run_seed(db)
    finally:
        db.close()
    yield
    Base.metadata.drop_all(bind=test_engine)


@pytest.fixture()
def db():
    """Yield a fresh DB session for each test, rolling back afterwards."""
    connection = test_engine.connect()
    transaction = connection.begin()
    session = TestSessionLocal(bind=connection)
    yield session
    session.close()
    transaction.rollback()
    connection.close()


@pytest.fixture()
def client(db):
    """TestClient with the DB dependency overridden to use the test session."""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
