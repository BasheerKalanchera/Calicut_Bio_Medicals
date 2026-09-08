import type { NotificationResponse } from "../types/api-aliases";
import { marketingLeadRef } from "./marketingLeadMilestone";

// Shared by NotificationBell.tsx (dropdown) and UrgentNotificationDialog.tsx
// (interrupting popup) so both render identical copy for the same
// notification -- UrgentNotificationDialog previously hardcoded its own
// IndiaMART-only copy and never got a MANAGER_NOTE_ADDED case when that type
// gained urgent support (2026-09-08).
export function describeNotification(n: NotificationResponse): string {
  const who = n.actor.display_name;
  if (n.type === "MARKETING_LEAD_ASSIGNED") {
    // A marketing lead has no name/title of its own (unlike an Opportunity),
    // so a reassigned-then-reassigned-back lead produces two notifications
    // that otherwise read as identical events ("assigned you a marketing
    // lead") -- weeks later there's no way to tell they're the same lead,
    // not two different ones, or notice the system silently reused an id.
    // entity_id is the same underlying marketing_lead row across all its
    // notifications -- marketingLeadRef shows consistently everywhere a
    // lead appears (this bell, the queue cards, the Marketing User's own
    // list), letting it visually recur without a backend lookup (Basheer,
    // 2026-09-03: keep this simple, don't build a live-status enrichment).
    return `${who} assigned you marketing lead ${marketingLeadRef(n.entity_id)}`;
  }
  if (n.type === "MANAGER_NOTE_ADDED") {
    return n.is_urgent
      ? `${who} left you an urgent manager note`
      : `${who} left you a manager note`;
  }
  const what = n.opportunity_name ?? "an Opportunity";
  if (n.type === "GATE_OVERRIDE_NAMED") {
    return `${who} named you as approving manager for ${what}`;
  }
  return `${who} assigned you ${what}`;
}
