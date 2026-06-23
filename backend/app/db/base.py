import uuid
from datetime import datetime
from typing import Generic, TypeVar

from sqlalchemy import UUID, DateTime, ForeignKey, func, select
from sqlalchemy.orm import DeclarativeBase, Mapped, Session, mapped_column


class Base(DeclarativeBase):
    pass


class AuditMixin:
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_profile.id"),
        nullable=True,
    )
    updated_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_profile.id"),
        nullable=True,
    )


class CreatedAtMixin:
    """For immutable entities — Activity (BR-ACT-01)."""

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
    )
    created_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("user_profile.id"),
        nullable=True,
    )


# ---------------------------------------------------------------------------
# Repository foundations
# ---------------------------------------------------------------------------

ModelType = TypeVar("ModelType")


class BaseRepository(Generic[ModelType]):
    def __init__(self, model: type[ModelType], db: Session):
        self.model = model
        self.db = db

    def get_by_id(self, id: uuid.UUID) -> ModelType | None:
        return self.db.get(self.model, id)

    def list(
        self,
        offset: int = 0,
        limit: int = 50,
    ) -> tuple[list[ModelType], int]:
        stmt = select(self.model)
        total = self.db.scalar(
            select(func.count()).select_from(stmt.subquery())
        )
        results = list(
            self.db.scalars(stmt.offset(offset).limit(limit)).all()
        )
        return results, total or 0

    def create(self, obj: ModelType) -> ModelType:
        self.db.add(obj)
        self.db.flush()
        return obj

    def update(self, obj: ModelType) -> ModelType:
        self.db.flush()
        return obj

    def delete(self, obj: ModelType) -> None:
        self.db.delete(obj)
        self.db.flush()


class ReferenceRepository(BaseRepository[ModelType]):
    def list_active(self) -> list[ModelType]:
        stmt = select(self.model).where(self.model.is_active == True)  # noqa: E712
        return list(self.db.scalars(stmt).all())

    def get_active_by_id(self, id: uuid.UUID) -> ModelType | None:
        obj = self.db.get(self.model, id)
        if obj and not obj.is_active:
            return None
        return obj
