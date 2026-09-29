import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Alert,
  Autocomplete,
  Box,
  Button,
  IconButton,
  MenuItem,
  TextField,
  Typography,
} from "@mui/material";
import FormModal from "./FormModal";
import BusinessPotentialChip from "./BusinessPotentialChip";
import useDebouncedValue from "../hooks/useDebouncedValue";
import { listBrands } from "../services/catalogHierarchy";
import {
  listEligibleAccounts,
  checkPlanOverlaps,
  createTargetPlan,
  updateTargetPlan,
} from "../services/targetPlanning";
import type {
  BrandSplitEntry,
  EligibleAccount,
  PlanAccountEntry,
  TargetPlan,
  VisitFrequency,
} from "../types/targetPlanning";
import type { BrandResponse } from "../types/api-aliases";
import { sumAllocation, isAllocationBalanced, roundToPrecision } from "../utils/allocationSplit";
import { VISIT_FREQUENCY_LABEL, VISIT_FREQUENCIES } from "../utils/visitFrequency";

const DEFAULT_VISIT_FREQUENCY: VisitFrequency = "MONTHLY";

interface PlanRow {
  account: EligibleAccount;
  amount: string;
  visit_frequency: VisitFrequency;
  objective: string;
}

interface EditSplitRow { brand_id: string; amount: string }

// Split editor figures show 2 decimals, matching the paisa-level
// isAllocationBalanced(..., 2) rule (E2E 2026-09-23).
function formatLakhs2(v: number) {
  return `₹${v.toFixed(2)}L`;
}

function isValidAmount(value: string) {
  const n = Number(value);
  return value.trim() !== "" && !Number.isNaN(n) && n >= 0;
}

interface Props {
  sbuId: string;
  period: string;
  existing: TargetPlan | null;
  onClose: () => void;
  onSaved: () => void;
}

// Set / revise one person's hospital-wise plan for one SBU and quarter
// (docs/Hospital-Wise-Target-Planning-Implementation-Plan.md). The target is
// the sum of the hospitals' amounts -- the server computes it the same way.
// Mounted only while open, so every opening starts from `existing` afresh.
export default function TargetPlanDialog({ sbuId, period, existing, onClose, onSaved }: Props) {
  const [rows, setRows] = useState<PlanRow[]>(() =>
    (existing?.accounts ?? []).map((a) => ({
      account: a.account,
      amount: a.planned_amount_lakhs,
      visit_frequency: a.visit_frequency,
      objective: a.strategic_objective ?? "",
    })),
  );
  const [editSplits, setEditSplits] = useState<EditSplitRow[]>(() =>
    (existing?.brand_splits ?? []).map((s) => ({ brand_id: s.brand_id, amount: s.split_amount_lakhs })),
  );
  const [addBrandId, setAddBrandId] = useState("");
  const [addBrandAmount, setAddBrandAmount] = useState("");
  const [changeNote, setChangeNote] = useState("");
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const isDraft = existing?.status === "DRAFT";
  // Once a plan has been submitted, every revision needs a reason, and it
  // can't go back to being a draft (server-enforced too).
  const needsChangeNote = !!existing && !isDraft;
  const canSaveDraft = !existing || isDraft;

  const { data: brands = [] } = useQuery({
    queryKey: ["brands", sbuId],
    queryFn: () => listBrands(sbuId) as Promise<BrandResponse[]>,
  });

  const { data: eligible = [], isFetching: eligibleLoading } = useQuery({
    queryKey: ["planning", "eligible-accounts", debouncedSearch],
    queryFn: () => listEligibleAccounts(debouncedSearch),
  });
  const addedIds = new Set(rows.map((r) => r.account.id));
  const pickerOptions = eligible.filter((a) => !addedIds.has(a.id));

  // Debounced as a string -- a fresh array every render would restart the
  // debounce timer (and re-render) forever.
  const debouncedIdsKey = useDebouncedValue(rows.map((r) => r.account.id).sort().join(","), 500);
  const debouncedAccountIds = debouncedIdsKey ? debouncedIdsKey.split(",") : [];
  const { data: overlaps = [] } = useQuery({
    queryKey: ["planning", "overlaps", sbuId, period, debouncedIdsKey],
    queryFn: () => checkPlanOverlaps(sbuId, period, debouncedAccountIds),
    enabled: debouncedAccountIds.length > 0,
  });
  // A hospital removed since the last check shouldn't keep its warning.
  const liveOverlaps = overlaps.filter((w) => addedIds.has(w.account_id));
  const highAtZero = rows.filter(
    (r) => r.account.business_potential === "HIGH" && isValidAmount(r.amount) && Number(r.amount) === 0,
  );

  const total = roundToPrecision(sumAllocation(rows.map((r) => Number(r.amount))), 2);
  // BR-PL-05: an approved plan is its own benchmark; a revision still in
  // flight carries the last approved total. Drafts have none.
  const approvedBenchmark =
    existing?.status === "APPROVED"
      ? Number(existing.target_amount_lakhs)
      : existing?.previous_approved_total_lakhs != null
        ? Number(existing.previous_approved_total_lakhs)
        : null;
  const splitTotal = sumAllocation(editSplits.map((s) => Number(s.amount)));
  const splitBalanced = isAllocationBalanced(splitTotal, total, 2);

  const updateRow = (i: number, patch: Partial<PlanRow>) =>
    setRows(rows.map((r, j) => (j === i ? { ...r, ...patch } : r)));

  const addHospital = (account: EligibleAccount | null) => {
    if (!account || addedIds.has(account.id)) return;
    setRows([...rows, { account, amount: "", visit_frequency: DEFAULT_VISIT_FREQUENCY, objective: "" }]);
    setSearch("");
  };

  const addBrandSplitRow = () => {
    if (!addBrandId || !addBrandAmount) return;
    if (editSplits.find((s) => s.brand_id === addBrandId)) return;
    setEditSplits([...editSplits, { brand_id: addBrandId, amount: addBrandAmount }]);
    setAddBrandId("");
    setAddBrandAmount("");
  };

  // Save draft (submit=false) is deliberately lenient -- blank amounts go
  // as ₹0, the total may be ₹0 and the brand split needn't balance yet. All
  // of that is enforced on Submit, here and server-side (Basheer, 2026-09-28).
  const save = async (submit: boolean) => {
    if (rows.length === 0) throw new Error("Add at least one hospital to the plan.");
    const invalidRow = rows.find((r) => r.amount.trim() !== "" && !isValidAmount(r.amount));
    if (invalidRow) throw new Error(`The amount for ${invalidRow.account.name} isn't a valid number.`);
    const blankRow = rows.find((r) => r.amount.trim() === "");
    if (submit && blankRow) throw new Error(`Enter an amount for ${blankRow.account.name} (₹0 is allowed).`);
    if (submit && total <= 0) throw new Error("The plan's total must be more than ₹0 — enter an amount for at least one hospital.");
    const badSplit = editSplits.find((s) => !isValidAmount(s.amount));
    if (badSplit) throw new Error("Each brand split amount must be a number of ₹0 or more.");

    let brand_splits: BrandSplitEntry[] | undefined;
    if (brands.length > 0) {
      if (submit && (editSplits.length === 0 || !splitBalanced)) {
        throw new Error(
          `Brand splits must add up to exactly the plan total (currently ${formatLakhs2(splitTotal)} of ${formatLakhs2(total)}).`,
        );
      }
      brand_splits = editSplits.map((s) => ({
        brand_id: s.brand_id,
        split_amount_lakhs: roundToPrecision(Number(s.amount), 2),
      }));
    }

    const trimmedNote = changeNote.trim();
    if (needsChangeNote && !trimmedNote) throw new Error("Please add a short note saying why the plan changed.");

    const accounts: PlanAccountEntry[] = rows.map((r) => ({
      account_id: r.account.id,
      planned_amount_lakhs: roundToPrecision(Number(r.amount) || 0, 2),
      visit_frequency: r.visit_frequency,
      strategic_objective: r.objective.trim() || null,
    }));

    if (existing) {
      await updateTargetPlan(existing.id, {
        accounts,
        brand_splits,
        change_note: trimmedNote || null,
        submit,
      });
    } else {
      await createTargetPlan({ sbu_id: sbuId, planning_period: period, accounts, brand_splits, submit });
    }
    onSaved();
  };

  const title = `${existing && !isDraft ? "Revise " : ""}Target & Coverage Plan — ${period}`;

  return (
    <FormModal
      isOpen
      onClose={onClose}
      title={title}
      onSubmit={() => save(true)}
      submitLabel="Submit for approval"
      secondaryAction={canSaveDraft ? { label: "Save draft", onClick: () => save(false) } : undefined}
      maxWidth="64rem"
    >
      {existing?.status === "APPROVED" && (
        <Alert severity="info">Revising an approved plan sends it back for a fresh approval.</Alert>
      )}
      {existing?.status === "REJECTED" && (
        <Alert severity="info">Revising a rejected plan sends it back for a fresh approval.</Alert>
      )}
      {existing?.status === "REJECTED" && existing.decision_note && (
        <Alert severity="warning">Manager's note: {existing.decision_note}</Alert>
      )}
      {isDraft && (
        <Alert severity="info">This is a draft — only you can see it until you submit it.</Alert>
      )}

      {/* Hospitals */}
      <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Hospitals *</Typography>
        <Autocomplete
          options={pickerOptions}
          getOptionLabel={(a) => a.name}
          isOptionEqualToValue={(a, v) => a.id === v.id}
          filterOptions={(x) => x}
          value={null}
          inputValue={search}
          loading={eligibleLoading}
          onChange={(_e, account) => addHospital(account)}
          onInputChange={(_e, value, reason) => { if (reason !== "reset") setSearch(value); }}
          renderOption={(props, a) => {
            const { key, ...optionProps } = props;
            return (
              <Box component="li" key={key} {...optionProps} sx={{ display: "flex", gap: 1, alignItems: "center" }}>
                <Box sx={{ flex: 1 }}>
                  {a.name}
                  <Typography component="span" variant="caption" color="text.secondary" sx={{ ml: 1 }}>{a.zone.name}</Typography>
                </Box>
                <BusinessPotentialChip value={a.business_potential} />
              </Box>
            );
          }}
          noOptionsText={search ? "No hospitals in your area match" : "No more hospitals in your area"}
          renderInput={(params) => (
            <TextField {...params} size="small" placeholder="Search to add a hospital from your area" />
          )}
          size="small"
          fullWidth
        />

        {rows.length === 0 && (
          <Typography color="text.secondary" variant="body2">No hospitals added yet.</Typography>
        )}

        {rows.map((r, i) => (
          <Box
            key={r.account.id}
            sx={{ border: "1px solid", borderColor: "divider", borderRadius: 1.5, p: 1.25, display: "flex", flexDirection: "column", gap: 1 }}
          >
            <Box sx={{ display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap" }}>
              <Typography sx={{ fontWeight: 700, fontSize: "0.875rem" }}>{r.account.name}</Typography>
              <Typography variant="caption" color="text.secondary">{r.account.zone.name}</Typography>
              <BusinessPotentialChip value={r.account.business_potential} />
              <Box sx={{ flex: 1 }} />
              <IconButton size="small" aria-label={`Remove ${r.account.name}`} onClick={() => setRows(rows.filter((_, j) => j !== i))}>
                <Box component="span" sx={{ fontWeight: 900, lineHeight: 1 }}>×</Box>
              </IconButton>
            </Box>
            <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
              <TextField
                select
                size="small"
                label="Visits"
                value={r.visit_frequency}
                onChange={(e) => updateRow(i, { visit_frequency: e.target.value as VisitFrequency })}
                sx={{ width: "9rem" }}
              >
                {VISIT_FREQUENCIES.map((f) => (
                  <MenuItem key={f} value={f}>{VISIT_FREQUENCY_LABEL[f]}</MenuItem>
                ))}
              </TextField>
              <TextField
                size="small"
                type="number"
                label="Amount (₹ Lakhs)"
                value={r.amount}
                onChange={(e) => updateRow(i, { amount: e.target.value })}
                slotProps={{ htmlInput: { min: 0, step: "any", style: { textAlign: "right" } } }}
                sx={{ width: "9rem" }}
              />
              <TextField
                size="small"
                label="Objective (optional)"
                value={r.objective}
                onChange={(e) => updateRow(i, { objective: e.target.value })}
                slotProps={{ htmlInput: { maxLength: 1000 } }}
                sx={{ flex: 1, minWidth: "12rem" }}
              />
            </Box>
          </Box>
        ))}

        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "2px solid", borderColor: "divider", pt: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {rows.length} hospital{rows.length === 1 ? "" : "s"}
          </Typography>
          <Typography sx={{ fontWeight: 800 }}>Target: {formatLakhs2(total)}</Typography>
        </Box>
      </Box>

      {approvedBenchmark !== null && total < approvedBenchmark && (
        <Alert severity="warning">
          {formatLakhs2(total)} is {formatLakhs2(approvedBenchmark - total)} below your approved target of{" "}
          {formatLakhs2(approvedBenchmark)} — add hospitals or raise amounts to close the gap. You can still submit;
          your manager will see both figures.
        </Alert>
      )}

      {(highAtZero.length > 0 || liveOverlaps.length > 0) && (
        <Alert severity="warning">
          <Box component="ul" sx={{ m: 0, pl: 2 }}>
            {highAtZero.map((r) => (
              <li key={`hz-${r.account.id}`}>{r.account.name} is rated High potential but planned at ₹0.</li>
            ))}
            {liveOverlaps.map((w) => (
              <li key={`ov-${w.account_id}-${w.colleague_name}`}>
                {w.colleague_name ?? "A colleague"} in your SBU has also planned {w.account_name} this quarter.
              </li>
            ))}
          </Box>
          <Typography variant="caption" sx={{ display: "block", mt: 0.5 }}>These are reminders only — you can still save.</Typography>
        </Alert>
      )}

      {/* Brand split -- mandatory whenever the SBU has an active brand
          (Brand-Level Target Planning decision #1), now against the live
          hospital total instead of a typed-in amount. */}
      {brands.length > 0 && (
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 700 }}>Split by Brand *</Typography>
            <Typography variant="caption" sx={{ fontWeight: 700, color: splitBalanced ? "success.main" : "warning.main" }}>
              Remaining to allocate: {formatLakhs2(total - splitTotal)}
            </Typography>
          </Box>

          {editSplits.map((s, i) => {
            const brand = brands.find((b) => b.id === s.brand_id);
            return (
              <Box key={s.brand_id} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography sx={{ flex: 1, fontSize: "0.875rem" }}>{brand?.name ?? s.brand_id}</Typography>
                <TextField
                  type="number"
                  size="small"
                  value={s.amount}
                  onChange={(e) => setEditSplits(editSplits.map((sp, j) => (j === i ? { ...sp, amount: e.target.value } : sp)))}
                  slotProps={{ htmlInput: { min: 0, step: "any", style: { textAlign: "right" } } }}
                  sx={{ width: "7rem" }}
                />
                <IconButton size="small" onClick={() => setEditSplits(editSplits.filter((_, j) => j !== i))}>
                  <Box component="span" sx={{ fontWeight: 900, lineHeight: 1 }}>×</Box>
                </IconButton>
              </Box>
            );
          })}

          {brands.filter((b) => !editSplits.find((s) => s.brand_id === b.id)).length > 0 && (
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <TextField
                select
                size="small"
                value={addBrandId}
                onChange={(e) => setAddBrandId(e.target.value)}
                sx={{ flex: 1 }}
                slotProps={{ select: { displayEmpty: true } }}
              >
                <MenuItem value="">Select brand</MenuItem>
                {brands
                  .filter((b) => !editSplits.find((s) => s.brand_id === b.id))
                  .map((b) => (
                    <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>
                  ))}
              </TextField>
              <TextField
                type="number"
                size="small"
                placeholder="Amount"
                value={addBrandAmount}
                onChange={(e) => setAddBrandAmount(e.target.value)}
                sx={{ width: "7rem" }}
              />
              <Button size="small" onClick={addBrandSplitRow} disabled={!addBrandId || !addBrandAmount}>
                Add
              </Button>
            </Box>
          )}
        </Box>
      )}

      {needsChangeNote && (
        <TextField
          label="Why did the plan change? *"
          value={changeNote}
          onChange={(e) => setChangeNote(e.target.value)}
          fullWidth
          size="small"
          multiline
          minRows={2}
          slotProps={{ htmlInput: { maxLength: 2000 } }}
          helperText="Your manager sees this when approving the revised plan."
        />
      )}
    </FormModal>
  );
}
