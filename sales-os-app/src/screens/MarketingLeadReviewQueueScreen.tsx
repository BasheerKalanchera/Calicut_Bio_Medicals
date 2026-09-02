import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Box, Button, Typography } from "@mui/material";
import QuickLeadModal from "../components/QuickLeadModal";
import MarketingLeadDiscardModal from "../components/MarketingLeadDiscardModal";
import { listMarketingLeads, markMarketingLeadConverted, type MarketingLead } from "../services/marketingLeads";
import { useAuth } from "../contexts/AuthContext";

export default function MarketingLeadReviewQueueScreen() {
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [convertingLead, setConvertingLead] = useState<MarketingLead | null>(null);
  const [discardingLead, setDiscardingLead] = useState<MarketingLead | null>(null);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["marketingLeads", "reviewQueue"],
    queryFn: listMarketingLeads,
  });

  // RLS already scopes GET /marketing-leads to what this user may see (own
  // assigned/created rows, plus manager-chain visibility for SBU/Area
  // Manager) -- this narrows further to "mine, still pending", the actual
  // review-queue shape. A manager who can merely see someone else's lead
  // has no action buttons here; marketing_lead_update's RLS policy would
  // reject the attempt anyway (see docs/Lead-Management-Implementation-
  // Plan.md's RLS section).
  const pending = (data ?? []).filter(
    (lead) => lead.status === "NEW" && lead.assigned_to_user_id === (userProfile as { id?: string } | null)?.id
  );

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

        {!isLoading && !isError && pending.length === 0 && (
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
                <Typography sx={{ fontWeight: 700, color: "#1f2937" }}>{lead.account_name ?? "Unknown account"}</Typography>
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
                </Box>
              </Box>
            ))}
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
        onCreated={async (createdOpportunity) => {
          if (!convertingLead) return;
          await markMarketingLeadConverted(convertingLead.id, createdOpportunity.id);
          queryClient.invalidateQueries({ queryKey: ["marketingLeads"] });
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
    </Box>
  );
}
