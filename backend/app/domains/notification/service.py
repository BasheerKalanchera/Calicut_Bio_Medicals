import uuid

from app.domains.notification.models import Notification
from app.domains.notification.repository import NotificationRepository, NotificationRow


class NotificationService:
    def __init__(self, repository: NotificationRepository):
        self.repository = repository

    def list_for_user(self, user_id: uuid.UUID, *, limit: int = 20) -> list[NotificationRow]:
        return self.repository.list_for_user(user_id, limit=limit)

    def list_urgent_unread(self, user_id: uuid.UUID) -> list[NotificationRow]:
        return self.repository.list_urgent_unread(user_id)

    def count_unread(self, user_id: uuid.UUID) -> tuple[int, int]:
        return self.repository.count_unread(user_id)

    def mark_read_for_entity(self, user_id: uuid.UUID, entity_type: str, entity_id: uuid.UUID) -> None:
        self.repository.mark_read_for_entity(user_id, entity_type, entity_id)

    def mark_read_for_type(self, user_id: uuid.UUID, entity_type: str) -> None:
        self.repository.mark_read_for_type(user_id, entity_type)

    def notify_opportunity_assigned(
        self,
        *,
        recipient_user_id: uuid.UUID,
        opportunity_id: uuid.UUID,
        actor_id: uuid.UUID,
    ) -> Notification:
        # Always False as of the Lead Management change (docs/Lead-
        # Management-Implementation-Plan.md): an IndiaMART inquiry now
        # arrives as a `lead` first, reviewed by a rep before it ever
        # becomes an Opportunity assignment -- IndiaMART's own 4-hour SLA
        # is met by the Marketing User directly on IndiaMART's platform,
        # before anything reaches this notification at all. Matches
        # notify_gate_override_named's own hardcoded False just below, same
        # reasoning: nothing should wait on this.
        #
        # is_urgent is a point-in-time value frozen on the row at creation
        # (Notification model's own comment) -- this hardcoded False only
        # stops *new* rows from being flagged urgent. It does not retroactively
        # touch existing rows: a pre-2026-09-02 row created back when this
        # computed is_urgent from URGENT_LEAD_SOURCE_NAMES can still be
        # sitting unread and will still pop UrgentNotificationDialog until
        # its read_at is set (confirmed live 2026-09-03, see docs/Progress-
        # Archive-2026-09.md).
        #
        # The urgent-notification machinery itself (this is_urgent column,
        # NotificationRepository.list_urgent_unread/count_unread's urgent
        # split, GET /notifications/urgent-unread, and the frontend's
        # UrgentNotificationDialog.tsx) is deliberately NOT being removed --
        # kept in place on purpose for a future urgent-notification need.
        # To light it back up for some other case, pass is_urgent=True from
        # a notify_* method here for whatever condition warrants it; no new
        # infrastructure required. See docs/Backlog.md, "Urgent-notification
        # infrastructure retained for future reuse."
        notification = Notification(
            recipient_user_id=recipient_user_id,
            type="OPPORTUNITY_ASSIGNED",
            entity_type="opportunity",
            entity_id=opportunity_id,
            created_by=actor_id,
            is_urgent=False,
        )
        return self.repository.create(notification)

    def notify_gate_override_named(
        self,
        *,
        recipient_user_id: uuid.UUID,
        opportunity_id: uuid.UUID,
        actor_id: uuid.UUID,
    ) -> Notification:
        # BR-OP-14: awareness only, never urgent -- the deal is already
        # fast-tracked by the time this fires, nothing waits on the named
        # approver acting on it, so this must never trigger
        # UrgentNotificationDialog (that's gated on is_urgent server-side).
        notification = Notification(
            recipient_user_id=recipient_user_id,
            type="GATE_OVERRIDE_NAMED",
            entity_type="opportunity",
            entity_id=opportunity_id,
            created_by=actor_id,
            is_urgent=False,
        )
        return self.repository.create(notification)

    def notify_marketing_lead_assigned(
        self,
        *,
        recipient_user_id: uuid.UUID,
        marketing_lead_id: uuid.UUID,
        actor_id: uuid.UUID,
    ) -> Notification:
        # Non-urgent, same reasoning as notify_opportunity_assigned above --
        # the IndiaMART 4-hour SLA is the Marketing User's responsibility on
        # IndiaMART's own platform, not the assigned rep's.
        notification = Notification(
            recipient_user_id=recipient_user_id,
            type="MARKETING_LEAD_ASSIGNED",
            entity_type="marketing_lead",
            entity_id=marketing_lead_id,
            created_by=actor_id,
            is_urgent=False,
        )
        return self.repository.create(notification)
