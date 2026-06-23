from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.base import ReferenceRepository
from app.domains.reference.models import OpportunityStage


class OpportunityStageRepository(ReferenceRepository[OpportunityStage]):
    def __init__(self, db: Session):
        super().__init__(OpportunityStage, db)

    def list_active_ordered(self) -> list[OpportunityStage]:
        stmt = (
            select(OpportunityStage)
            .where(OpportunityStage.is_active == True)  # noqa: E712
            .order_by(OpportunityStage.display_order)
        )
        return list(self.db.scalars(stmt).all())
