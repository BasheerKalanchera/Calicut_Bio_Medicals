import uuid
from collections.abc import Callable

from sqlalchemy import ColumnElement, and_, func, or_, select
from sqlalchemy.orm import Session

from app.db.base import BaseRepository
from app.domains.organization.models import UserProfile

# Mirrors opportunity_tier_visibility's OR-chain (alembic/versions/0010_rls_opportunity_children.py)
# applied to user_profile rows instead of opportunity rows. Admin/General Manager are unrestricted
# (not listed here). Sales Manager's manager_id check is deliberately one level deep, not a
# recursive org-chart walk -- same "flat" scope Opportunity's own Level 5 rule uses, per
# Opportunity-Access-Hierarchy-Technical-Design.md SS6. Every tier also always sees itself, applied
# unconditionally below.
UNRESTRICTED_ROLES = {"Admin", "General Manager"}
TEAM_SCOPE_BUILDERS: dict[str, Callable[[UserProfile], ColumnElement[bool]]] = {
    "SBU Manager": lambda u: UserProfile.sbu_id == u.sbu_id,
    "Area Manager": lambda u: and_(UserProfile.sbu_id == u.sbu_id, UserProfile.zone_id == u.zone_id),
    "Sales Manager": lambda u: UserProfile.manager_id == u.id,
}


class UserRepository(BaseRepository[UserProfile]):
    def __init__(self, db: Session):
        super().__init__(UserProfile, db)

    def list_active(
        self,
        current_user: UserProfile,
        offset: int = 0,
        limit: int = 50,
        *,
        scope: str = "scoped",
    ) -> tuple[list[UserProfile], int]:
        stmt = select(UserProfile).where(UserProfile.is_active == True)  # noqa: E712

        # Three pickers, three different eligibility rules:
        #   "all"      -- Next Action assignee (Business-Rules.md BR-ACT-06): any active
        #                  user, any SBU/zone. The permanent cabio_app_assigned_reminder()
        #                  RLS carve-out grants visibility *after* assignment, so
        #                  eligibility isn't gated here.
        #   "sbu_zone" -- Split participant (BR-FIN-06): same SBU + zone as the caller
        #                  (interim rule per ADR-037; revisit if a real cross-zone need
        #                  surfaces).
        #   "scoped"   -- Opportunity Owner (re)assignment: caller's own tier-visibility
        #                  scope (the 2026-07-28 fix), unchanged.
        if scope == "all":
            pass
        elif scope == "sbu_zone":
            from app.domains.reference.models import Role

            self_row = UserProfile.id == current_user.id
            same_sbu_zone = and_(
                UserProfile.sbu_id == current_user.sbu_id,
                UserProfile.zone_id == current_user.zone_id,
            )
            not_unrestricted = UserProfile.role_id.not_in(
                select(Role.id).where(Role.role_name.in_(UNRESTRICTED_ROLES))
            )
            stmt = stmt.where(and_(not_unrestricted, or_(same_sbu_zone, self_row)))
        elif current_user.role.role_name not in UNRESTRICTED_ROLES:
            from app.domains.reference.models import Role

            self_row = UserProfile.id == current_user.id
            scope_builder = TEAM_SCOPE_BUILDERS.get(current_user.role.role_name)
            visible = or_(scope_builder(current_user), self_row) if scope_builder else self_row

            # Admin/General Manager carry an sbu_id/zone_id only to satisfy the NOT NULL
            # columns -- they're an unrestricted overlay tier, not members of any operational
            # SBU/zone/team, so they must never surface as a match under another tier's scoped
            # branch just because their placeholder values happen to coincide (e.g. an SBU
            # Manager whose SBU happens to match an Admin's on-paper sbu_id).
            not_unrestricted = UserProfile.role_id.not_in(
                select(Role.id).where(Role.role_name.in_(UNRESTRICTED_ROLES))
            )
            stmt = stmt.where(and_(not_unrestricted, visible))

        total = self.db.scalar(
            select(func.count()).select_from(stmt.subquery())
        )
        results = list(
            self.db.scalars(stmt.offset(offset).limit(limit)).all()
        )
        return results, total or 0

    def sbu_exists(self, sbu_id: uuid.UUID) -> bool:
        from app.domains.reference.models import SBU

        return self.db.get(SBU, sbu_id) is not None

    def role_exists(self, role_id: uuid.UUID) -> bool:
        from app.domains.reference.models import Role

        return self.db.get(Role, role_id) is not None

    def zone_exists(self, zone_id: uuid.UUID) -> bool:
        from app.domains.reference.models import Zone

        return self.db.get(Zone, zone_id) is not None
