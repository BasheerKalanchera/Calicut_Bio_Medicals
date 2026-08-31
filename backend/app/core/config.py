from typing import Literal

from pydantic import SecretStr
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    APP_ENV: Literal["development", "staging", "production"] = "development"
    APP_VERSION: str = "1.0.0"

    DATABASE_URL: SecretStr
    ADMIN_DATABASE_URL: SecretStr
    SUPABASE_URL: str
    SUPABASE_ANON_KEY: SecretStr
    SUPABASE_JWT_SECRET: SecretStr | None = None
    # Privileged server-side Storage operations (Opportunity Document Upload) --
    # uploading/deleting objects and minting signed download URLs in the private
    # "documents" bucket. Distinct from SUPABASE_ANON_KEY, which is RLS-scoped and
    # cannot perform these. Optional so the app still boots before an environment
    # provisions it (feature degrades, doesn't crash startup).
    SUPABASE_SERVICE_ROLE_KEY: SecretStr | None = None
    CABIO_APP_DB_PASSWORD: SecretStr | None = None

    DB_POOL_SIZE: int = 10
    DB_MAX_OVERFLOW: int = 20

    # BR-ACC-03: how similar a new hospital name has to be to an existing one
    # (within the same zone branch) before the rep is warned. Tunable without a
    # redeploy since the brief anticipated this needing real-world adjustment
    # in the first few weeks -- see docs/Duplicate-Hospital-Decision-Brief-
    # 2026-08-29.md.
    ACCOUNT_DUPLICATE_SIMILARITY_THRESHOLD: float = 0.5

    LOG_LEVEL: Literal["DEBUG", "INFO", "WARNING", "ERROR"] = "INFO"

    CORS_ORIGINS: list[str] = ["http://localhost:5173"]


settings = Settings()
