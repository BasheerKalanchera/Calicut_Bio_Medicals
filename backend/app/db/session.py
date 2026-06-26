import uuid
from collections.abc import Generator

from sqlalchemy import create_engine, text
from sqlalchemy.orm import Session, sessionmaker

import app.db.registry  # noqa: F401
from app.core.config import settings

engine = create_engine(
    settings.DATABASE_URL.get_secret_value(),
    pool_pre_ping=True,
    pool_size=settings.DB_POOL_SIZE,
    max_overflow=settings.DB_MAX_OVERFLOW,
    connect_args={"connect_timeout": 10},
)

SessionLocal = sessionmaker(bind=engine, autoflush=False, expire_on_commit=False)


def get_db() -> Generator[Session, None, None]:
    db = SessionLocal()
    try:
        yield db
        db.commit()
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()


def warm_pool() -> None:
    """Pre-establish the database connection at startup.

    SQLAlchemy creates connections lazily — the first request after a
    server boot pays a 4-6 second cold-start penalty while the TCP
    connection to Supabase (AWS ap-south-1) is established. Calling this
    during the FastAPI startup event hides that cost from users.
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception:
        pass  # Non-fatal — server still starts, first request will pay the cost


def set_rls_context(db: Session, user_id: uuid.UUID) -> None:
    # Phase 2E will implement: db.execute(text("SET LOCAL app.current_user_id = :id"), {"id": str(user_id)})
    pass
