import uuid
from datetime import date

from sqlalchemy import UUID, Date, ForeignKey, Index, String
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import AuditMixin, Base


class Project(AuditMixin, Base):
    __tablename__ = "project"
    __table_args__ = (
        Index("idx_project_name_trgm", "name", postgresql_using="gin", postgresql_ops={"name": "gin_trgm_ops"}),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    account_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("account.id"), nullable=False, index=True
    )
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("user_profile.id"), nullable=False, index=True
    )
    name: Mapped[str] = mapped_column(String(255), nullable=False)
    status_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("project_status.id"), nullable=False
    )
    bid_submission_date: Mapped[date | None] = mapped_column(Date, nullable=True)

    account: Mapped["Account"] = relationship(back_populates="projects", lazy="joined")
    owner: Mapped["UserProfile"] = relationship(
        back_populates="owned_projects", foreign_keys=[owner_id], lazy="joined"
    )
    status: Mapped["ProjectStatus"] = relationship(back_populates="projects", lazy="joined")

    opportunities: Mapped[list["Opportunity"]] = relationship(back_populates="project", lazy="select")
    activities: Mapped[list["Activity"]] = relationship(back_populates="project", lazy="select")
    documents: Mapped[list["Document"]] = relationship(back_populates="project", lazy="select")
