// Shared between MarketingLeadEntryScreen (Marketing User's own list) and
// MarketingLeadReviewQueueScreen (rep's queue + the team/all-visible section
// for SBU/Area Manager and Admin/GM) -- one pill definition so a lead's
// status reads identically everywhere it's shown.
//
// Pill reflects the milestone (NEW -> SEEN -> CONVERTED/DISCARDED), not the
// raw `status` column directly -- a bare "NEW" pill next to a "Seen
// <timestamp>" line read as contradictory (Basheer, 2026-09-03). `status`
// itself is untouched in the DB/API (still just NEW/CONVERTED/DISCARDED --
// that's what governs the Convert/Discard authorization gate), this is
// purely a display refinement. DISCARDED reuses OpportunityPipelineScreen's
// LOST color for consistency (`#fee2e2`/`#dc2626`) -- same "negative outcome,
// not an error" register.
export const MARKETING_LEAD_MILESTONE_STYLES: Record<string, { bg: string; color: string }> = {
  NEW: { bg: "#eff6ff", color: "#2563eb" },
  SEEN: { bg: "#fffbeb", color: "#d97706" },
  CONVERTED: { bg: "#f0fdf4", color: "#16a34a" },
  DISCARDED: { bg: "#fee2e2", color: "#dc2626" },
};

// Short, stable per-lead reference tag (e.g. "#A1B2C3") shown wherever a
// lead appears -- the queue cards, the Marketing User's own list, and
// NotificationBell's message text -- so the same lead reads identically
// everywhere, including across a reassign-away-and-back history where two
// notifications would otherwise look like two unrelated leads (Basheer,
// 2026-09-03). Deliberately just a slice of the id, not a live-status
// lookup -- keep this simple.
export function marketingLeadRef(id: string) {
  return `#${id.slice(0, 6).toUpperCase()}`;
}

export function formatMarketingLeadDate(iso: string) {
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", hour12: true });
}

// One rotating milestone, not a history line -- whichever is furthest along
// wins (Created -> Seen -> Converted/Discarded). created_at/first_viewed_at/
// reviewed_at all still live on the row underneath for later reporting (e.g.
// time-to-follow-up analysis); this is just what's shown here.
export function marketingLeadMilestone(lead: { status: string; created_at: string; first_viewed_at: string | null; reviewed_at: string | null }) {
  if (lead.status === "CONVERTED" && lead.reviewed_at) {
    return { pill: "CONVERTED", date: lead.reviewed_at };
  }
  if (lead.status === "DISCARDED" && lead.reviewed_at) {
    return { pill: "DISCARDED", date: lead.reviewed_at };
  }
  if (lead.first_viewed_at) {
    return { pill: "SEEN", date: lead.first_viewed_at };
  }
  return { pill: "NEW", date: lead.created_at };
}
