import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Typography } from "@mui/material";
import MarketingLeadCreateModal from "../components/MarketingLeadCreateModal";
import { REASONS as DISCARD_REASONS } from "../components/MarketingLeadDiscardModal";
import { listMarketingLeads } from "../services/marketingLeads";
import { MARKETING_LEAD_MILESTONE_STYLES, formatMarketingLeadDate, marketingLeadMilestone, marketingLeadRef } from "../utils/marketingLeadMilestone";

export default function MarketingLeadEntryScreen({ active }: { active: boolean }) {
  const queryClient = useQueryClient();
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // RLS (marketing_lead_select policy) already restricts this to the
  // Marketing User's own created_by=self rows -- reference/history only,
  // per docs/Lead-Management-Implementation-Plan.md's RLS section. No
  // manual filtering.
  //
  // enabled: active -- this screen stays mounted in the background for
  // EVERY logged-in user, not just Marketing User (DemoApp toggles it via
  // display:none, not unmount/role-gate), so without this it fires the
  // instant any user's session loads. GET /marketing-leads also marks the
  // *caller's own* MARKETING_LEAD_ASSIGNED notifications read server-side
  // -- ungated, this was marking a rep's own assignment notifications read
  // moments after login, before they ever looked at the bell (found live
  // 2026-09-03, same bug as MarketingLeadReviewQueueScreen's).
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["marketingLeads", "mine"],
    queryFn: listMarketingLeads,
    enabled: active,
  });

  const leads = data ?? [];

  return (
    <Box sx={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column", bgcolor: "background.default" }}>
      <Box sx={{ px: 2, pt: 2, pb: 1, flexShrink: 0, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <Typography sx={{ fontSize: "1.125rem", fontWeight: 900, color: "#1f2937" }}>Marketing Leads</Typography>
        <Button variant="contained" onClick={() => setIsCreateOpen(true)}>
          + New Marketing Lead
        </Button>
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
            Couldn't load your marketing leads.
          </Alert>
        )}

        {!isLoading && !isError && leads.length === 0 && (
          <Box sx={{ textAlign: "center", py: 6, bgcolor: "#fff", borderRadius: "1.5rem", border: "2px dashed #f3f4f6", fontStyle: "italic", color: "#9ca3af" }}>
            No marketing leads entered yet.
          </Box>
        )}

        {!isLoading && leads.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
            {leads.map((lead) => {
              const { pill, date } = marketingLeadMilestone(lead);
              const pillStyle = MARKETING_LEAD_MILESTONE_STYLES[pill] ?? MARKETING_LEAD_MILESTONE_STYLES.NEW;
              return (
                <Box
                  key={lead.id}
                  sx={{ p: 2, borderRadius: "1rem", border: "1px solid #f3f4f6", bgcolor: "#fff", display: "flex", flexDirection: "column", gap: 0.5 }}
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
                    {lead.lead_source_name}{lead.event_name ? ` — ${lead.event_name}` : ""} · Assigned to {lead.assigned_to_user.display_name}
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
                </Box>
              );
            })}
          </Box>
        )}
      </Box>

      <MarketingLeadCreateModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onCreated={() => {
          queryClient.invalidateQueries({ queryKey: ["marketingLeads"] });
          setIsCreateOpen(false);
        }}
      />
    </Box>
  );
}
