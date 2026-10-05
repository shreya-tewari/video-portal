"""
config.py – reads settings from the .env file using pydantic-settings.
All fields have sensible defaults so the app starts without a real .env
(useful for running the test suite with SQLite).
"""

from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_file_encoding="utf-8", extra="ignore")

    # Database – default to SQLite so tests need no external DB
    DATABASE_URL: str = "sqlite:///./app.db"

    # JWT
    JWT_SECRET: str = "change-me-in-production"
    ACCESS_TOKEN_MINUTES: int = 60

    # Super-admin seed credentials
    FIRST_SUPERADMIN_EMAIL: str = "admin@example.com"
    FIRST_SUPERADMIN_PASSWORD: str = "superadmin123"

    # CORS
    FRONTEND_ORIGIN: str = "http://localhost:5173"


settings = Settings()
