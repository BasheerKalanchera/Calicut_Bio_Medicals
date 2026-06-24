from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    APP_ENV: Literal["development", "staging", "production"] = "development"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: SecretStr
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: SecretStr
    SUPABASE_JWT_SECRET: SecretStr | None = None

    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    CORS_ORIGINS: list[str] = ["http://localhost:5173"]


settings = Settings()
