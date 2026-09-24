import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Typography,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import FormModal from "../components/FormModal";
import { useAuth } from "../contexts/AuthContext";
import { listSbus } from "../services/masterData";
import { listBrands } from "../services/catalogHierarchy";
import { getBrandRollups, setBrandVendorTarget } from "../services/targetPlanning";
import { getCurrentPlanningPeriod, shiftPlanningPeriod, formatLakhs } from "../utils/formatter";
import type { BrandResponse } from "../types/api-aliases";

interface SbuOption { id: string; name: string }

// Admin/GM only (docs/Brand-Level-Target-Planning-Implementation-Plan.md
// decision #2) -- gated at the nav level in DemoApp.tsx, same as the other
// ADMINISTRATION-section screens. Mirrors the backend's own gate on
// /planning/targets/brand-rollups. This screen is always mounted in the
// background (DemoApp.tsx) regardless of who's logged in, so without this the
// rollup query fires for every non-admin user and gets a 403 -- same fix as
// AuditLogScreen.
const BRAND_TRACKING_ADMIN_ROLES = new Set(["Admin", "General Manager"]);

export default function BrandTargetTrackingScreen() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const isAdmin = BRAND_TRACKING_ADMIN_ROLES.has((userProfile as any)?.role_name);
  const [period, setPeriod] = useState(() => getCurrentPlanningPeriod());
  const [sbuId, setSbuId] = useState<string | null>(null);
  const [editingBrand, setEditingBrand] = useState<BrandResponse | null>(null);
  const [amountInput, setAmountInput] = useState("");

  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    queryFn: () => listSbus() as Promise<SbuOption[]>,
  });
  const activeSbuId = sbuId ?? sbus[0]?.id ?? null;

  const { data: brands = [] } = useQuery({
    queryKey: ["brands", activeSbuId],
    queryFn: () => listBrands(activeSbuId as string) as Promise<BrandResponse[]>,
    enabled: !!activeSbuId,
  });

  // One batched call for every brand in the SBU (/code-review 2026-09-23 --
  // this used to fire one HTTP round trip per brand via useQueries).
  const brandIds = brands.map((b) => b.id);
  const { data: rollups = [], isError: rollupsFailed } = useQuery({
    queryKey: ["brand-rollups", brandIds, period],
    queryFn: () => getBrandRollups(brandIds, period),
    enabled: isAdmin && brandIds.length > 0,
  });

  const rows = brands.map((b) => ({ brand: b, rollup: rollups.find((r) => r.brand_id === b.id) }));

  const openEdit = (brand: BrandResponse, currentVendorTarget: string | null) => {
    setEditingBrand(brand);
    setAmountInput(currentVendorTarget ?? "");
  };

  const handleSaveVendorTarget = async () => {
    const amount = Number(amountInput);
    if (!amountInput.trim() || Number.isNaN(amount) || amount < 0) {
      throw new Error("Enter a vendor target amount of zero or more");
    }
    if (!editingBrand) return;
    await setBrandVendorTarget({
      brand_id: editingBrand.id,
      planning_period: period,
      vendor_target_amount_lakhs: amount,
    });
    await queryClient.invalidateQueries({ queryKey: ["brand-rollups"] });
  };

  if (!isAdmin) return null;

  return (
    <Box sx={{ height: "100%", overflow: "auto", p: 3, display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton size="small" onClick={() => setPeriod((p) => shiftPlanningPeriod(p, -1))} title="Previous quarter">
            <Box component="span">◀</Box>
          </IconButton>
          <Typography sx={{ fontWeight: 700, minWidth: "6rem", textAlign: "center" }}>{period}</Typography>
          <IconButton size="small" onClick={() => setPeriod((p) => shiftPlanningPeriod(p, 1))} title="Next quarter">
            <Box component="span">▶</Box>
          </IconButton>
        </Box>
        <TextField
          select
          size="small"
          label="SBU"
          value={activeSbuId ?? ""}
          onChange={(e) => setSbuId(e.target.value)}
          sx={{ minWidth: "12rem" }}
        >
          {sbus.map((s) => (
            <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>
          ))}
        </TextField>
      </Box>

      <Box sx={{ bgcolor: "background.paper", borderRadius: 2, p: 2.5 }}>
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1.5 }}>Brand vs. Committed</Typography>
        {rollupsFailed && (
          <Alert severity="error" sx={{ mb: 1.5 }}>
            Couldn't load brand totals — the figures below are incomplete. Try refreshing.
          </Alert>
        )}
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Brand</TableCell>
              <TableCell>Vendor Target</TableCell>
              <TableCell>Team Committed</TableCell>
              <TableCell>Gap</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map(({ brand, rollup }) => {
              const vendorTarget = rollup?.vendor_target ?? null;
              const gap = rollup?.gap ?? null;
              return (
                <TableRow key={brand.id}>
                  <TableCell>{brand.name}</TableCell>
                  <TableCell>{vendorTarget !== null ? formatLakhs(Number(vendorTarget)) : "Not set"}</TableCell>
                  <TableCell>{rollup ? formatLakhs(Number(rollup.committed_total)) : "—"}</TableCell>
                  <TableCell sx={{ color: gap === null ? "text.secondary" : Number(gap) < 0 ? "success.main" : "warning.main" }}>
                    {gap !== null ? formatLakhs(Number(gap)) : "—"}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => openEdit(brand, vendorTarget)}>
                      {vendorTarget !== null ? "Revise" : "Set Target"}
                    </Button>
                  </TableCell>
                </TableRow>
              );
            })}
            {rows.length === 0 && (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography color="text.secondary">No brands set up for this SBU yet.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </Box>

      <FormModal
        isOpen={editingBrand !== null}
        onClose={() => setEditingBrand(null)}
        title={editingBrand ? `Vendor Target — ${editingBrand.name} · ${period}` : ""}
        onSubmit={handleSaveVendorTarget}
        submitLabel="Save"
      >
        <TextField
          label="Vendor Target Amount (₹ Lakhs) *"
          type="number"
          value={amountInput}
          onChange={(e) => setAmountInput(e.target.value)}
          fullWidth
          size="small"
          autoFocus
        />
      </FormModal>
    </Box>
  );
}
