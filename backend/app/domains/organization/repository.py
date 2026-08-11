import uuid
from collections.abc import Callable

from sqlalchemy import ColumnElement, and_, delete, func, or_, select
from sqlalchemy.orm import Session

from app.db.base import BaseRepository
from app.domains.organization.models import UserProfile, UserZone

# Mirrors opportunity_tier_visibility's OR-chain (alembic/versions/0010_rls_opportunity_children.py)
# applied to user_profile rows instead of opportunity rows. Admin/General Manager are unrestricted
# (not listed here). Sales Manager's manager_id check is deliberately one level deep, not a
# recursive org-chart walk -- same "flat" scope Opportunity's own Level 5 rule uses, per
# Opportunity-Access-Hierarchy-Technical-Design.md SS6. Every tier also always sees itself, applied
# unconditionally below.
UNRESTRICTED_ROLES = {"Admin", "General Manager"}
TEAM_SCOPE_BUILDERS: dict[str, Callable[[UserProfile], ColumnElement[bool]]] = {
    "SBU Manager": lambda u: UserProfile.sbu_id == u.sbu_id,
    # Set-intersection, not scalar equality: a candidate is in scope if they share
    # at least one zone with the caller (both may now be multi-zone via user_zone,
    # Milestone 1). A caller or candidate with zero user_zone rows never matches --
    # same fail-closed behavior as the old zone_id IS NULL case.
    "Area Manager": lambda u: and_(
        UserProfile.sbu_id == u.sbu_id,
        UserProfile.id.in_(
            select(UserZone.user_id).where(
                UserZone.zone_id.in_(select(UserZone.zone_id).where(UserZone.user_id == u.id))
            )
        ),
    ),
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
        #   "all" -- Next Action assignee (Business-Rules.md BR-ACT-06): any active
        #            user, any SBU/zone. The permanent cabio_app_assigned_reminder()
        #            RLS carve-out grants visibility *after* assignment, so
        #            eligibility isn't gated here.
        #   "sbu" -- Split participant (BR-FIN-06): same SBU as the caller, any zone.
        #            Matches the server-side rule exactly (Issue 2 SS3.1,
        #            Discussion-SplitParticipant-SBU-Scope.md) -- previously also
        #            required matching zone, which was narrower than what
        #            replace_splits actually accepts.
        #   "scoped" -- Opportunity Owner (re)assignment: caller's own tier-visibility
        #               scope (the 2026-07-28 fix), unchanged.
        if scope == "all":
            pass
        elif scope == "sbu":
            from app.domains.reference.models import Role

            not_unrestricted = UserProfile.role_id.not_in(
                select(Role.id).where(Role.role_name.in_(UNRESTRICTED_ROLES))
            )
            if current_user.role.role_name in UNRESTRICTED_ROLES:
                # Admin/GM carry an sbu_id only to satisfy the NOT NULL column -- it's
                # a placeholder, not a real SBU membership (see the identical note on
                # the "scoped" branch below). Comparing candidates against it would
                # wrongly restrict the split-participant picker to whichever SBU
                # happens to be on the caller's placeholder row. Admin/GM are an
                # unrestricted overlay tier, so show every active, non-unrestricted
                # user regardless of SBU -- BR-FIN-06 itself is still enforced
                # server-side in replace_splits against the *opportunity's* sbu_id.
                stmt = stmt.where(not_unrestricted)
            else:
                self_row = UserProfile.id == current_user.id
                same_sbu = UserProfile.sbu_id == current_user.sbu_id
                stmt = stmt.where(and_(not_unrestricted, or_(same_sbu, self_row)))
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

    def replace_zones(self, user: UserProfile, zone_ids: list[uuid.UUID]) -> list[UserZone]:
        self.db.execute(delete(UserZone).where(UserZone.user_id == user.id))
        for zone_id in zone_ids:
            self.db.add(UserZone(user_id=user.id, zone_id=zone_id))
        self.db.flush()
        # A raw Core-style delete+insert doesn't retroactively refresh an
        # already-loaded (selectin) user.zones collection -- expire it so the
        # next access re-queries instead of returning stale data. Deliberately
        # not a direct `user.zones = [...]` reassignment: with a composite PK
        # on user_zone, the ORM's bulk-collection-diff logic would try to null
        # out the FK on "removed" members instead of just leaving the rows
        # already deleted above alone.
        self.db.expire(user, ["zones"])
        return list(
            self.db.scalars(select(UserZone).where(UserZone.user_id == user.id)).all()
        )
