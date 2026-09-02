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
