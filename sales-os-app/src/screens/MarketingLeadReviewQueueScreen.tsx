import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Typography } from "@mui/material";
import QuickLeadModal from "../components/QuickLeadModal";
import MarketingLeadDiscardModal, { REASONS as DISCARD_REASONS } from "../components/MarketingLeadDiscardModal";
import MarketingLeadReassignModal from "../components/MarketingLeadReassignModal";
import { listMarketingLeads, markMarketingLeadConverted, type MarketingLead } from "../services/marketingLeads";
import { useAuth } from "../contexts/AuthContext";
import { MARKETING_LEAD_MILESTONE_STYLES, formatMarketingLeadDate, marketingLeadMilestone, marketingLeadRef } from "../utils/marketingLeadMilestone";

// Matches marketing_lead_update's RLS policy shape (0036_marketing_lead_
// manager_update_rights.py): Admin/GM (any lead), SBU Manager (own SBU), or
// Area Manager (their own reports only). As of 0037_marketing_lead_area_
// manager_select_own_reports.py, marketing_lead_select's Area Manager
// clause was narrowed to match this exactly (was SBU-wide before, same as
// SBU Manager -- found live 2026-09-03: an Area Manager could see, and get
// a button for, a lead outside their team, only to have it 403 on attempt)
// -- so every row in "Team Marketing Leads" below is now something the
// viewer can actually act on, not just see. Reassign additionally shows in
// the *personal* queue for any manager role, covering self-delegation (a
// manager who's personally assigned a lead handing it to their own team).
const MANAGER_ROLES = new Set(["Admin", "General Manager", "SBU Manager", "Area Manager"]);

export default function MarketingLeadReviewQueueScreen({ active }: { active: boolean }) {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [convertingLead, setConvertingLead] = useState<MarketingLead | null>(null);
  const [discardingLead, setDiscardingLead] = useState<MarketingLead | null>(null);
  const [reassigningLead, setReassigningLead] = useState<MarketingLead | null>(null);
  const myId = (userProfile as { id?: string } | null)?.id;
  const isManager = MANAGER_ROLES.has((userProfile as { role_name?: string } | null)?.role_name ?? "");

  // enabled: active -- this screen stays mounted in the background (DemoApp
  // toggles it via display:none, not unmount, for instant tab switching), so
  // without this gate the GET fires the moment the app loads regardless of
  // whether the rep ever opens this tab. GET /marketing-leads also marks
  // MARKETING_LEAD_ASSIGNED notifications read server-side -- an ungated
  // query would silently mark them read before the rep ever saw the bell
  // (found live 2026-09-03).
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["marketingLeads", "reviewQueue"],
    queryFn: listMarketingLeads,
    enabled: active,
  });

  // Viewing this screen marks MARKETING_LEAD_ASSIGNED notifications read
  // server-side (the GET above), but only NotificationBell's click-through
  // path invalidates its own unread-count/list caches -- navigating here
  // any other way (sidebar nav, not the bell) left the bell's red dot
  // stale for up to its own 60s poll interval, showing "unread" while the
  // dropdown (which always refetches fresh on open) correctly showed the
  // same item as read. Found live 2026-09-03 (Fahad -> Rudrappa
  // assignment): dot present, dropdown entry unhighlighted, ~36s after the
  // notification's own read_at -- exactly this staleness window.
  useEffect(() => {
    if (!active) return;
    queryClient.invalidateQueries({ queryKey: ["notifications", "unread-count"] });
    queryClient.invalidateQueries({ queryKey: ["notifications", "list"] });
  }, [active, queryClient]);

  // RLS already scopes GET /marketing-leads to what this user may see (own
  // assigned/created rows, plus manager-chain visibility for SBU/Area
  // Manager, plus everything for Admin/GM) -- this narrows to "mine, still
  // pending", the actual personal-queue shape every rep (and Admin/GM, on
  // anything assigned directly to them) sees first.
  const pending = (data ?? []).filter((lead) => lead.status === "NEW" && lead.assigned_to_user_id === myId);

  // Anything else RLS returned -- naturally empty for a plain rep (their
  // grant only ever covers their own rows), populated for SBU/Area Manager
  // (own SBU, any status -- "how many leads are sitting unreviewed" per the
  // plan) and Admin/GM (every SBU). No action buttons unless Admin/GM --
  // marketing_lead_update's RLS policy would reject an SBU/Area Manager's
  // attempt anyway, this just avoids offering a button that would 403.
  // Found live 2026-09-03: this section didn't exist at all -- the RLS
  // visibility grant had no UI surfacing it (docs/Progress-Archive-2026-09.md).
  const pendingIds = new Set(pending.map((lead) => lead.id));
  const others = (data ?? []).filter((lead) => !pendingIds.has(lead.id));

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Box sx={{ px: 2, pt: 2, pb: 1, flexShrink: 0 }}>
        <Typography sx={{ fontSize: "1.125rem", fontWeight: 900, color: "#1f2937" }}>Marketing Lead Review Queue</Typography>
      </Box>

      <Box sx={{ flex: 1, overflowY: "auto", px: 2, pb: 2, pt: 1 }}>
        {isLoading && (
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", py: 6 }}>
            <Box sx={{ color: "#9ca3af", fontWeight: 700, fontSize: "0.875rem" }}>Loading marketing leads...</Box>
          </Box>
        )}

        {isError && (
          <Alert
            severity="error"
            action={<Button color="inherit" size="small" onClick={() => refetch()}>Retry</Button>}
            sx={{ mb: 2 }}
          >
            Couldn't load your marketing lead queue.
          </Alert>
        )}

        {!isLoading && !isError && pending.length === 0 && others.length === 0 && (
          <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", fontStyle: "italic", color: "#9ca3af" }}>
            No marketing leads waiting on you.
          </Box>
        )}

        {!isLoading && pending.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {pending.map((lead) => (
              <Box
                key={lead.id}
                sx={{ p: 2, borderRadius: "1rem", border: "1px solid #f3f4f6", bgcolor: "#fff", display: "flex", flexDirection: "column", gap: 1 }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                  <Box sx={{ px: 1, py: 0.25, borderRadius: "0.375rem", fontSize: "0.6875rem", fontWeight: 900, letterSpacing: "0.05em", bgcolor: "#eef2ff", color: "#4338ca", whiteSpace: "nowrap" }}>
                    {marketingLeadRef(lead.id)}
                  </Box>
                  <Typography sx={{ fontWeight: 700, color: "#1f2937" }}>{lead.account_name ?? "Unknown account"}</Typography>
                </Box>
                <Typography sx={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                  {lead.lead_source_name}{lead.event_name ? ` — ${lead.event_name}` : ""}
                  {lead.product_name ? ` · ${lead.product_name}` : ""}
                </Typography>
                {lead.raw_interest_note && (
                  <Typography sx={{ fontSize: "0.8125rem", color: "#374151" }}>{lead.raw_interest_note}</Typography>
                )}
                <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                  <Button variant="contained" size="small" onClick={() => setConvertingLead(lead)}>
                    Convert
                  </Button>
                  <Button variant="outlined" color="inherit" size="small" onClick={() => setDiscardingLead(lead)}>
                    Discard
                  </Button>
                  {/* Reassign only shown here when the viewer also holds a
                      manager role -- a manager can be personally assigned
                      leads too (Area Manager isn't excluded from the Assign
                      To picker at creation) and should be able to delegate
                      their own down to their team, same as they could act on
                      a report's lead directly. A plain rep never gets this
                      button for their own queue (found live 2026-09-03). */}
                  {isManager && (
                    <Button variant="outlined" color="inherit" size="small" onClick={() => setReassigningLead(lead)}>
                      Reassign
                    </Button>
                  )}
                </Box>
              </Box>
            ))}
          </Box>
        )}

        {!isLoading && others.length > 0 && (
          <Box sx={{ mt: pending.length > 0 ? 3 : 0 }}>
            <Typography sx={{ fontSize: "0.75rem", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
              Team Marketing Leads
            </Typography>
            <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
              {others.map((lead) => {
                const { pill, date } = marketingLeadMilestone(lead);
                const pillStyle = MARKETING_LEAD_MILESTONE_STYLES[pill] ?? MARKETING_LEAD_MILESTONE_STYLES.NEW;
                const canAct = isManager && lead.status === "NEW";
                return (
                  <Box
                    key={lead.id}
                    sx={{ p: 2, borderRadius: "1rem", border: "1px solid #f3f4f6", bgcolor: "#fff", display: "flex", flexDirection: "column", gap: 1 }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
                        <Box sx={{ px: 1, py: 0.25, borderRadius: "0.375rem", fontSize: "0.6875rem", fontWeight: 900, letterSpacing: "0.05em", bgcolor: "#eef2ff", color: "#4338ca", whiteSpace: "nowrap" }}>
                          {marketingLeadRef(lead.id)}
                        </Box>
                        <Typography sx={{ fontWeight: 700, color: "#1f2937" }}>{lead.account_name ?? "Unknown account"}</Typography>
                      </Box>
                      <Box sx={{ px: 1.25, py: 0.25, borderRadius: "9999px", fontSize: "0.6875rem", fontWeight: 900, letterSpacing: "0.05em", bgcolor: pillStyle.bg, color: pillStyle.color, whiteSpace: "nowrap" }}>
                        {pill} {formatMarketingLeadDate(date)}
                      </Box>
                    </Box>
                    <Typography sx={{ fontSize: "0.8125rem", color: "#6b7280" }}>
                      {lead.lead_source_name}{lead.event_name ? ` — ${lead.event_name}` : ""}
                      {lead.product_name ? ` · ${lead.product_name}` : ""} · Assigned to {lead.assigned_to_user.display_name}
                    </Typography>
                    {lead.raw_interest_note && (
                      <Typography sx={{ fontSize: "0.8125rem", color: "#374151" }}>{lead.raw_interest_note}</Typography>
                    )}
                    {lead.status === "DISCARDED" && lead.discard_reason && (
                      <Typography sx={{ fontSize: "0.8125rem", color: "#dc2626" }}>
                        Reason: {DISCARD_REASONS.find((r) => r.value === lead.discard_reason)?.label ?? lead.discard_reason}
                        {lead.discard_note ? ` — ${lead.discard_note}` : ""}
                      </Typography>
                    )}
                    {canAct && (
                      <Box sx={{ display: "flex", gap: 1, mt: 0.5 }}>
                        <Button variant="contained" size="small" onClick={() => setConvertingLead(lead)}>
                          Convert
                        </Button>
                        <Button variant="outlined" color="inherit" size="small" onClick={() => setDiscardingLead(lead)}>
                          Discard
                        </Button>
                        <Button variant="outlined" color="inherit" size="small" onClick={() => setReassigningLead(lead)}>
                          Reassign
                        </Button>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Box>
          </Box>
        )}
      </Box>

      <QuickLeadModal
        isOpen={!!convertingLead}
        onClose={() => setConvertingLead(null)}
        sbuId={convertingLead?.sbu_id}
        initialAccountId={convertingLead?.account_id ?? undefined}
        initialLeadSourceId={convertingLead?.lead_source_id}
        marketingLeadContextNote={convertingLead?.raw_interest_note}
        marketingLeadEventName={convertingLead?.event_name}
        marketingLeadSourceName={convertingLead?.lead_source_name}
        marketingLeadId={convertingLead?.id}
        onCreated={async (createdOpportunity) => {
          if (!convertingLead) return;
          await markMarketingLeadConverted(convertingLead.id, createdOpportunity.id);
          queryClient.invalidateQueries({ queryKey: ["marketingLeads"] });
          // Pipeline doesn't know a new Opportunity exists otherwise -- the
          // header's own "+ Lead" QuickLeadModal already does this
          // (DemoApp.tsx), missed here since this is a separate mount of the
          // same component (found live 2026-09-03).
          queryClient.invalidateQueries({ queryKey: ["pipeline"] });
          setConvertingLead(null);
        }}
      />

      <MarketingLeadDiscardModal
        lead={discardingLead}
        onClose={() => setDiscardingLead(null)}
        onDiscarded={() => {
          queryClient.invalidateQueries({ queryKey: ["marketingLeads"] });
          setDiscardingLead(null);
        }}
      />

      <MarketingLeadReassignModal
        lead={reassigningLead}
        onClose={() => setReassigningLead(null)}
        onReassigned={() => {
          queryClient.invalidateQueries({ queryKey: ["marketingLeads"] });
          setReassigningLead(null);
        }}
      />
    </Box>
  );
}
