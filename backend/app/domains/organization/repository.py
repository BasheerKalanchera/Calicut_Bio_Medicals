import uuid
from collections.abc import Callable

from sqlalchemy import ColumnElement, and_, delete, func, or_, select
from sqlalchemy.orm import Session

from app.db.base import BaseRepository
from app.domains.organization.models import UserProfile, UserZone
from app.domains.reference.models import ZoneClosure

# Mirrors opportunity_tier_visibility's OR-chain (alembic/versions/0010_rls_opportunity_children.py)
# applied to user_profile rows instead of opportunity rows. Admin/General Manager are unrestricted
# (not listed here). Sales Manager's manager_id check is deliberately one level deep, not a
# recursive org-chart walk -- same "flat" scope Opportunity's own Level 5 rule uses, per
# Opportunity-Access-Hierarchy-Technical-Design.md SS6. Every tier also always sees itself, applied
# unconditionally below.
UNRESTRICTED_ROLES = {"Admin", "General Manager"}
TEAM_SCOPE_BUILDERS: dict[str, Callable[[UserProfile], ColumnElement[bool]]] = {
    "SBU Manager": lambda u: UserProfile.sbu_id == u.sbu_id,
    # Closure-based, not flat set-intersection (rewritten again, migration 0019 --
    # see that migration's docstring): a candidate is in scope if their own zone
    # is a descendant (via zone_closure, which includes a self-row per zone) of
    # any zone the caller is responsible for. A single-zone caller/candidate with
    # no children behaves identically to Milestone 1's flat version -- this is a
    # strict superset, not a divergent code path. A caller or candidate with zero
    # user_zone rows never matches -- same fail-closed behavior as before.
    "Area Manager": lambda u: and_(
        UserProfile.sbu_id == u.sbu_id,
        UserProfile.id.in_(
            select(UserZone.user_id).where(
                UserZone.zone_id.in_(
                    select(ZoneClosure.descendant_zone_id).where(
                        ZoneClosure.ancestor_zone_id.in_(
                            select(UserZone.zone_id).where(UserZone.user_id == u.id)
                        )
                    )
                )
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
        include_inactive: bool = False,
    ) -> tuple[list[UserProfile], int]:
        # include_inactive is for User Directory's own listing only (grayed-
        # out, findable, reversible -- same "visible but deprecated" pattern
        # as Territory Map's zones). The three picker scopes below (all/sbu/
        # scoped) always call this with include_inactive=False -- you never
        # want to assign work to a deactivated person.
        stmt = select(UserProfile)
        if not include_inactive:
            stmt = stmt.where(UserProfile.is_active == True)  # noqa: E712

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

    def blast_radius(self, user_id: uuid.UUID) -> tuple[int, int]:
        """(direct_report_count, open_opportunity_count) -- backs the
        Deactivate confirmation, same spirit as ZoneRepository.blast_radius.
        "Open" mirrors the terminal/non-terminal distinction already used
        for opportunity status elsewhere (OpportunityStatus.is_terminal)."""
        from app.domains.opportunity.models import Opportunity
        from app.domains.reference.models import OpportunityStatus

        direct_report_count = self.db.scalar(
            select(func.count()).where(UserProfile.manager_id == user_id)
        ) or 0
        open_opportunity_count = self.db.scalar(
            select(func.count())
            .select_from(Opportunity)
            .join(OpportunityStatus, Opportunity.status_id == OpportunityStatus.id)
            .where(Opportunity.owner_id == user_id, OpportunityStatus.is_terminal == False)  # noqa: E712
        ) or 0
        return direct_report_count, open_opportunity_count

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
