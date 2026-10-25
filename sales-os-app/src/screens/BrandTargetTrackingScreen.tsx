import { Fragment, useState } from "react";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Alert,
  Box,
  Typography,
  Button,
  Checkbox,
  FormControlLabel,
  IconButton,
  TextField,
  MenuItem,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";
import KeyboardArrowDownIcon from "@mui/icons-material/KeyboardArrowDown";
import KeyboardArrowRightIcon from "@mui/icons-material/KeyboardArrowRight";
import FormModal from "../components/FormModal";
import { useAuth } from "../contexts/AuthContext";
import { listSbus } from "../services/masterData";
import {
  getBrandRollups,
  getSeasonalPattern,
  listBrandAnnualTargets,
  setBrandAnnualTarget,
  setBrandVendorTarget,
  setBrandYearStart,
  setSeasonalPattern,
} from "../services/targetPlanning";
import { formatLakhs, formatPlanningPeriod } from "../utils/formatter";
import type { BrandAnnualTargetRow, SbuSeasonalPattern, SeasonalPattern } from "../types/targetPlanning";

interface SbuOption { id: string; name: string }

// Admin/GM only (Annual Target Planning D23) -- gated at the nav level in
// DemoApp.tsx, same as the other ADMINISTRATION-section screens, and by the
// backend on every /planning brand-target route. This screen is always
// mounted in the background (DemoApp.tsx) regardless of who's logged in, so
// without this its queries fire for every non-admin user and get a 403 --
// same fix as AuditLogScreen.
const BRAND_TRACKING_ADMIN_ROLES = new Set(["Admin", "General Manager"]);

// "Year starts in" choices: one Cabio quarter per brand quarter (D40).
const YEAR_START_MONTHS = [
  { value: 1, label: "January" },
  { value: 4, label: "April" },
  { value: 7, label: "July" },
  { value: 10, label: "October" },
];
const MONTH_SHORT = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// On a phone the brand table drops its own-figure and stretch columns so the
// "Set target" button stays on screen; both still show in the Set target box
// (Basheer, 2026-10-22).
const HIDE_ON_PHONE = { display: { xs: "none", sm: "table-cell" } };

// The pattern is tied to calendar months, whatever month a brand's year
// starts in (D41).
const PATTERN_FIELDS: { key: keyof SeasonalPattern; label: string }[] = [
  { key: "pct_jan_mar", label: "Jan–Mar %" },
  { key: "pct_apr_jun", label: "Apr–Jun %" },
  { key: "pct_jul_sep", label: "Jul–Sep %" },
  { key: "pct_oct_dec", label: "Oct–Dec %" },
];

type PatternDraft = Record<keyof SeasonalPattern, string>;

const EMPTY_PATTERN: PatternDraft = { pct_jan_mar: "", pct_apr_jun: "", pct_jul_sep: "", pct_oct_dec: "" };

function toDraft(p: SeasonalPattern | null): PatternDraft {
  if (!p) return EMPTY_PATTERN;
  return {
    pct_jan_mar: String(Number(p.pct_jan_mar)),
    pct_apr_jun: String(Number(p.pct_apr_jun)),
    pct_jul_sep: String(Number(p.pct_jul_sep)),
    pct_oct_dec: String(Number(p.pct_oct_dec)),
  };
}

// The four shares as numbers, or an error to show (they must add up to 100).
function parsePattern(d: PatternDraft): { values: Record<keyof SeasonalPattern, number> } | { error: string } {
  const values = {} as Record<keyof SeasonalPattern, number>;
  for (const { key } of PATTERN_FIELDS) {
    const n = Number(d[key]);
    if (d[key].trim() === "" || !Number.isFinite(n) || n < 0 || n > 100) {
      return { error: "Enter each quarter's share, between 0 and 100" };
    }
    values[key] = n;
  }
  const sum = PATTERN_FIELDS.reduce((s, { key }) => s + values[key], 0);
  if (Math.round(sum * 100) !== 10000) {
    return { error: `The four shares add up to ${Math.round(sum * 100) / 100}%; they must add up to 100%` };
  }
  return { values };
}

function patternSum(d: PatternDraft): number {
  return Math.round(PATTERN_FIELDS.reduce((s, { key }) => s + (Number(d[key]) || 0), 0) * 100) / 100;
}

// "Jan–Dec 2027" or "Apr 2027–Mar 2028" (D43).
function brandYearLabel(yearStartMonth: number, startYear: number): string {
  if (yearStartMonth === 1) return `Jan–Dec ${startYear}`;
  return `${MONTH_SHORT[yearStartMonth - 1]} ${startYear}–${MONTH_SHORT[yearStartMonth - 2]} ${startYear + 1}`;
}

function PatternFields({ draft, onChange }: { draft: PatternDraft; onChange: (d: PatternDraft) => void }) {
  const sum = patternSum(draft);
  return (
    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", alignItems: "center" }}>
      {PATTERN_FIELDS.map(({ key, label }) => (
        <TextField
          key={key}
          label={label}
          type="number"
          size="small"
          value={draft[key]}
          onChange={(e) => onChange({ ...draft, [key]: e.target.value })}
          slotProps={{ htmlInput: { min: 0, max: 100, step: "0.01" } }}
          sx={{ width: "7.5rem" }}
        />
      ))}
      <Typography variant="body2" color={sum === 100 ? "text.secondary" : "warning.main"}>
        {sum === 100 ? "Total 100%" : `Total ${sum}% — must add up to 100%`}
      </Typography>
    </Box>
  );
}

// The SBU's seasonal pattern for the year (D25): set once per SBU per year;
// saving it re-saves the brands that follow it (D50).
function SeasonalPatternBox({ sbuId, year, saved, onSaved }: { sbuId: string; year: number; saved: SbuSeasonalPattern | null; onSaved: () => void }) {
  const [draft, setDraft] = useState<PatternDraft>(() => toDraft(saved));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const unchanged = PATTERN_FIELDS.every(({ key }) => draft[key] === toDraft(saved)[key]);
  // Greyed out until the shares add up to 100, so a save that would be
  // refused can't be pressed (mostly used on a phone; Basheer, 2026-10-22).
  // parsePattern still checks on save.
  const adds = patternSum(draft) === 100;

  const handleSave = async () => {
    const parsed = parsePattern(draft);
    if ("error" in parsed) {
      setError(parsed.error);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await setSeasonalPattern({ sbu_id: sbuId, year, ...parsed.values });
      onSaved();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Couldn't save the seasonal pattern.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: 2, p: 2.5, mb: 2 }}>
      <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Seasonal pattern for {year}</Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
        {saved
          ? "How this SBU's year is shared across the quarters. Brands following it are worked out again when you change it; quarters already ended keep their targets."
          : "Not set yet. Set it before entering brand targets for this year, unless a brand has its own pattern."}
      </Typography>
      <Box sx={{ display: "flex", gap: 1.5, flexWrap: "wrap", alignItems: "center" }}>
        <PatternFields draft={draft} onChange={setDraft} />
        <Button variant="contained" size="small" onClick={handleSave} disabled={saving || unchanged || !adds}>
          {saving ? "Saving…" : "Save pattern"}
        </Button>
      </Box>
      {error && <Alert severity="error" sx={{ mt: 1.5 }}>{error}</Alert>}
    </Box>
  );
}

export default function BrandTargetTrackingScreen() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const isAdmin = BRAND_TRACKING_ADMIN_ROLES.has((userProfile as any)?.role_name);
  const [year, setYear] = useState(() => new Date().getFullYear());
  const [sbuId, setSbuId] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<Set<string>>(() => new Set());
  const [editing, setEditing] = useState<BrandAnnualTargetRow | null>(null);
  const [yearStartInput, setYearStartInput] = useState(1);
  const [amountInput, setAmountInput] = useState("");
  const [stretchInput, setStretchInput] = useState("");
  const [ownPattern, setOwnPattern] = useState(false);
  const [patternInput, setPatternInput] = useState<PatternDraft>(EMPTY_PATTERN);
  // One brand quarter whose target the GM is typing by hand (D70).
  const [quarterEdit, setQuarterEdit] = useState<{ row: BrandAnnualTargetRow; period: string } | null>(null);
  const [quarterInput, setQuarterInput] = useState("");

  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    queryFn: () => listSbus() as Promise<SbuOption[]>,
    enabled: isAdmin,
  });
  const activeSbuId = sbuId ?? sbus[0]?.id ?? null;

  const patternQuery = useQuery({
    queryKey: ["planning", "seasonal-pattern", activeSbuId, year],
    queryFn: () => getSeasonalPattern(activeSbuId as string, year),
    enabled: isAdmin && !!activeSbuId,
  });

  const targetsQuery = useQuery({
    queryKey: ["planning", "brand-annual-targets", activeSbuId, year],
    queryFn: () => listBrandAnnualTargets(activeSbuId as string, year),
    enabled: isAdmin && !!activeSbuId,
  });
  const rows = targetsQuery.data ?? [];

  // Committed and gap per quarter: one batched call per distinct quarter
  // (brands whose year starts in different months span different quarters).
  const brandIds = rows.map((r) => r.brand_id);
  const periods = [...new Set(rows.flatMap((r) => r.quarters.map((q) => q.planning_period)))].sort();
  const rollupQueries = useQueries({
    queries: periods.map((period) => ({
      queryKey: ["brand-rollups", brandIds, period],
      queryFn: () => getBrandRollups(brandIds, period),
      enabled: isAdmin && brandIds.length > 0,
    })),
  });
  const rollupsFailed = rollupQueries.some((q) => q.isError);
  const rollupFor = (brandId: string, period: string) => {
    const i = periods.indexOf(period);
    return rollupQueries[i]?.data?.find((r) => r.brand_id === brandId);
  };

  const invalidateTargets = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["planning", "brand-annual-targets"] }),
      queryClient.invalidateQueries({ queryKey: ["planning", "seasonal-pattern"] }),
      queryClient.invalidateQueries({ queryKey: ["brand-rollups"] }),
      queryClient.invalidateQueries({ queryKey: ["planning", "sbu-targets"] }),
      queryClient.invalidateQueries({ queryKey: ["planning", "team-targets"] }),
      queryClient.invalidateQueries({ queryKey: ["planning", "target-vs-actuals"] }),
    ]);
  };

  const toggle = (id: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  const openEdit = (row: BrandAnnualTargetRow) => {
    setEditing(row);
    setYearStartInput(row.year_start_month);
    setAmountInput(row.vendor_amount_lakhs !== null ? String(Number(row.vendor_amount_lakhs)) : "");
    setStretchInput(row.stretch_pct !== null ? String(Number(row.stretch_pct)) : "0");
    setOwnPattern(row.own_pattern !== null);
    setPatternInput(toDraft(row.own_pattern ?? row.effective_pattern));
  };

  const handleSave = async () => {
    if (!editing) return;
    const amount = Number(amountInput);
    if (!amountInput.trim() || !Number.isFinite(amount) || amount < 0) {
      throw new Error("Enter the brand's yearly figure, zero or more");
    }
    const stretch = stretchInput.trim() === "" ? 0 : Number(stretchInput);
    if (!Number.isFinite(stretch) || stretch < 0 || stretch > 999.99) {
      throw new Error("Enter a stretch between 0 and 999.99%");
    }
    let pattern = null;
    if (ownPattern) {
      const parsed = parsePattern(patternInput);
      if ("error" in parsed) throw new Error(parsed.error);
      pattern = parsed.values;
    }
    // The year start first: the yearly figure is saved against the brand's
    // year, and the start can't change once a figure exists (D59).
    // Refreshed either way: a refused figure can follow a saved year start.
    try {
      if (yearStartInput !== editing.year_start_month) {
        await setBrandYearStart(editing.brand_id, yearStartInput);
        await queryClient.invalidateQueries({ queryKey: ["brands"] });
      }
      await setBrandAnnualTarget({
        brand_id: editing.brand_id,
        start_year: year,
        vendor_amount_lakhs: amount,
        stretch_pct: stretch,
        pattern,
      });
    } finally {
      await invalidateTargets();
    }
  };

  const openQuarterEdit = (row: BrandAnnualTargetRow, period: string, saved: string | null) => {
    setQuarterEdit({ row, period });
    setQuarterInput(saved !== null ? String(Number(saved)) : "");
  };

  const handleQuarterSave = async () => {
    if (!quarterEdit) return;
    const amount = Number(quarterInput);
    if (!quarterInput.trim() || !Number.isFinite(amount) || amount < 0) {
      throw new Error("Enter the quarter's target, zero or more");
    }
    try {
      await setBrandVendorTarget({
        brand_id: quarterEdit.row.brand_id,
        planning_period: quarterEdit.period,
        vendor_target_amount_lakhs: amount,
      });
    } finally {
      await invalidateTargets();
    }
  };

  if (!isAdmin) return null;

  const stretchedPreview = (() => {
    const amount = Number(amountInput);
    const stretch = stretchInput.trim() === "" ? 0 : Number(stretchInput);
    if (!amountInput.trim() || !Number.isFinite(amount) || !Number.isFinite(stretch)) return null;
    return amount * (1 + stretch / 100);
  })();

  return (
    <Box sx={{ height: "100%", overflow: "hidden", display: "flex", flexDirection: "column" }}>
      {/* Fixed: year + SBU pickers — do not scroll */}
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 1.5, flexShrink: 0, px: 3, pt: 3, pb: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton size="small" onClick={() => setYear((y) => y - 1)} title="Previous year">
            <Box component="span">◀</Box>
          </IconButton>
          <Typography sx={{ fontWeight: 700, minWidth: "6rem", textAlign: "center" }}>{year}</Typography>
          <IconButton size="small" onClick={() => setYear((y) => y + 1)} title="Next year">
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

      {/* Scrollable content */}
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: 3, pb: 3 }}>
        {activeSbuId && patternQuery.isSuccess && (
          <SeasonalPatternBox
            // Keyed on the saved values, not the fetch time: a window-focus
            // refetch with the same pattern must keep the unsaved typing.
            key={`${activeSbuId}-${year}-${PATTERN_FIELDS.map(({ key }) => patternQuery.data?.[key] ?? "none").join("-")}`}
            sbuId={activeSbuId}
            year={year}
            saved={patternQuery.data}
            onSaved={invalidateTargets}
          />
        )}
        {patternQuery.isError && (
          <Alert severity="error" sx={{ mb: 2 }}>Couldn't load the seasonal pattern. Try refreshing.</Alert>
        )}

        <Box sx={{ bgcolor: "background.paper", borderRadius: 2, p: 2.5 }}>
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 0.5 }}>Brand targets</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
            Each brand's year that starts in {year}. Open a brand to see its quarters, the team's committed figure and the gap.
          </Typography>
          {targetsQuery.isError && (
            <Alert severity="error" sx={{ mb: 1.5 }}>Couldn't load brand targets. Try refreshing.</Alert>
          )}
          {rollupsFailed && (
            <Alert severity="error" sx={{ mb: 1.5 }}>
              Couldn't load the team's committed totals — the quarter figures are incomplete. Try refreshing.
            </Alert>
          )}
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ width: 40 }} />
                <TableCell>Brand</TableCell>
                <TableCell sx={HIDE_ON_PHONE}>Brand's own figure</TableCell>
                <TableCell sx={HIDE_ON_PHONE}>Stretch</TableCell>
                <TableCell>Stretched target</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => {
                const open = expanded.has(row.brand_id);
                const isSet = row.vendor_amount_lakhs !== null;
                return (
                  <Fragment key={row.brand_id}>
                    <TableRow hover>
                      <TableCell>
                        <IconButton size="small" onClick={() => toggle(row.brand_id)} aria-expanded={open} aria-label={open ? "Hide quarters" : "Show quarters"}>
                          {open ? <KeyboardArrowDownIcon fontSize="small" /> : <KeyboardArrowRightIcon fontSize="small" />}
                        </IconButton>
                      </TableCell>
                      <TableCell>
                        {row.brand_name}
                        <Typography component="span" color="text.secondary"> · {brandYearLabel(row.year_start_month, row.start_year)}</Typography>
                        {/* On a phone the two hidden columns show here instead. */}
                        <Typography variant="caption" color="text.secondary" sx={{ display: { xs: "block", sm: "none" } }}>
                          {isSet ? `Own figure ${formatLakhs(Number(row.vendor_amount_lakhs))}` : "Own figure not set"}
                          {row.stretch_pct !== null && ` · Stretch ${Number(row.stretch_pct)}%`}
                        </Typography>
                      </TableCell>
                      <TableCell sx={HIDE_ON_PHONE}>{isSet ? formatLakhs(Number(row.vendor_amount_lakhs)) : <Typography component="span" color="text.secondary">Not set</Typography>}</TableCell>
                      <TableCell sx={HIDE_ON_PHONE}>{row.stretch_pct !== null ? `${Number(row.stretch_pct)}%` : "—"}</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>{row.stretched_lakhs !== null ? formatLakhs(Number(row.stretched_lakhs)) : "—"}</TableCell>
                      <TableCell align="right">
                        <Button size="small" sx={{ whiteSpace: "nowrap" }} onClick={() => openEdit(row)}>{isSet ? "Revise" : "Set target"}</Button>
                      </TableCell>
                    </TableRow>
                    {open && (
                      <TableRow>
                        <TableCell sx={HIDE_ON_PHONE} />
                        <TableCell colSpan={5}>
                          <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 0.5 }}>
                            {row.own_pattern
                              ? "Spread by this brand's own seasonal pattern."
                              : row.effective_pattern
                                ? `Spread by the SBU's seasonal pattern for ${row.start_year}.`
                                : `No seasonal pattern for ${row.start_year} yet.`}
                          </Typography>
                          {(() => {
                            const quarters = row.quarters.map((q) => {
                              const rollup = rollupFor(row.brand_id, q.planning_period);
                              const gap = rollup?.gap ?? null;
                              return {
                                q,
                                target: (
                                  <>
                                    {q.saved_lakhs !== null ? formatLakhs(Number(q.saved_lakhs)) : <Typography component="span" color="text.secondary">Not set</Typography>}
                                    {/* Kept when the year is worked out again (D71); never removed (D73). */}
                                    {q.set_by_hand && (
                                      <Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>changed by hand</Typography>
                                    )}
                                  </>
                                ),
                                // Shown only, never typed (D54, D68).
                                billing: q.billing_lakhs !== null ? formatLakhs(Number(q.billing_lakhs)) : "—",
                                committed: rollup ? formatLakhs(Number(rollup.committed_total)) : "—",
                                gap: gap !== null ? formatLakhs(Number(gap)) : "—",
                                gapColor: gap === null ? "text.secondary" : Number(gap) < 0 ? "success.main" : "warning.main",
                                // Ended quarters, and those before Oct–Dec 2026, stay locked (D51, D70).
                                change: !q.locked && (
                                  <Button size="small" onClick={() => openQuarterEdit(row, q.planning_period, q.saved_lakhs)}>Change</Button>
                                ),
                              };
                            });
                            return (
                              <>
                                {/* On a phone each quarter is a stacked block, so nothing leaves the card. */}
                                <Box sx={{ display: { xs: "block", sm: "none" } }}>
                                  {quarters.map((x) => (
                                    <Box key={x.q.planning_period} sx={{ py: 1, borderBottom: 1, borderColor: "divider" }}>
                                      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 1 }}>
                                        <Box sx={{ fontWeight: 700 }}>{formatPlanningPeriod(x.q.planning_period)}</Box>
                                        {x.change}
                                      </Box>
                                      {([
                                        ["Target", x.target, undefined],
                                        ["Brands Billing to Cabio", x.billing, undefined],
                                        ["Team committed", x.committed, undefined],
                                        ["Gap", x.gap, x.gapColor],
                                      ] as const).map(([label, value, color]) => (
                                        <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 1, fontSize: "0.8125rem" }}>
                                          <Box component="span" sx={{ color: "text.secondary" }}>{label}</Box>
                                          <Box component="span" sx={{ textAlign: "right", color }}>{value}</Box>
                                        </Box>
                                      ))}
                                    </Box>
                                  ))}
                                </Box>
                                <Table size="small" sx={{ display: { xs: "none", sm: "table" } }}>
                                  <TableHead>
                                    <TableRow>
                                      <TableCell>Quarter</TableCell>
                                      <TableCell>Target</TableCell>
                                      <TableCell>Brands Billing to Cabio</TableCell>
                                      <TableCell>Team committed</TableCell>
                                      <TableCell>Gap</TableCell>
                                      <TableCell />
                                    </TableRow>
                                  </TableHead>
                                  <TableBody>
                                    {quarters.map((x) => (
                                      <TableRow key={x.q.planning_period}>
                                        <TableCell>{formatPlanningPeriod(x.q.planning_period)}</TableCell>
                                        <TableCell>{x.target}</TableCell>
                                        <TableCell>{x.billing}</TableCell>
                                        <TableCell>{x.committed}</TableCell>
                                        <TableCell sx={{ color: x.gapColor }}>{x.gap}</TableCell>
                                        <TableCell align="right">{x.change}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </>
                            );
                          })()}
                        </TableCell>
                      </TableRow>
                    )}
                  </Fragment>
                );
              })}
              {targetsQuery.isSuccess && rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6}>
                    <Typography color="text.secondary">No brands set up for this SBU yet.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </Box>
      </Box>

      <FormModal
        isOpen={editing !== null}
        onClose={() => setEditing(null)}
        title={editing ? `${editing.brand_name} · year starting ${year}` : ""}
        onSubmit={handleSave}
        submitLabel="Save"
      >
        {editing && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              select
              label="Year starts in"
              size="small"
              value={yearStartInput}
              onChange={(e) => setYearStartInput(Number(e.target.value))}
              disabled={editing.has_any_annual}
              helperText={
                editing.has_any_annual
                  ? "Can't be changed once the brand has a yearly figure in any year."
                  : `This brand's year: ${brandYearLabel(yearStartInput, year)}`
              }
              fullWidth
            >
              {YEAR_START_MONTHS.map((m) => (
                <MenuItem key={m.value} value={m.value}>{m.label}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Brand's own yearly figure (₹ Lakhs) *"
              type="number"
              size="small"
              value={amountInput}
              onChange={(e) => setAmountInput(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              fullWidth
              autoFocus
            />
            <TextField
              label="Stretch (%)"
              type="number"
              size="small"
              value={stretchInput}
              onChange={(e) => setStretchInput(e.target.value)}
              slotProps={{ htmlInput: { min: 0, max: 999.99, step: "0.01" } }}
              helperText={stretchedPreview !== null ? `Stretched target: ${formatLakhs(stretchedPreview)}` : " "}
              fullWidth
            />
            <FormControlLabel
              control={<Checkbox checked={ownPattern} onChange={(e) => setOwnPattern(e.target.checked)} />}
              label="This brand has its own seasonal pattern"
            />
            {ownPattern && <PatternFields draft={patternInput} onChange={setPatternInput} />}
            <Typography variant="caption" color="text.secondary">
              The stretched target is spread over the brand's four quarters. Quarters already ended keep their targets.
            </Typography>
          </Box>
        )}
      </FormModal>

      <FormModal
        isOpen={quarterEdit !== null}
        onClose={() => setQuarterEdit(null)}
        title={quarterEdit ? `${quarterEdit.row.brand_name} · ${formatPlanningPeriod(quarterEdit.period)}` : ""}
        onSubmit={handleQuarterSave}
        submitLabel="Save"
      >
        {quarterEdit && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
            <TextField
              label="Target for this quarter (₹ Lakhs) *"
              type="number"
              size="small"
              value={quarterInput}
              onChange={(e) => setQuarterInput(e.target.value)}
              slotProps={{ htmlInput: { min: 0, step: "0.01" } }}
              fullWidth
              autoFocus
            />
            <Typography variant="caption" color="text.secondary">
              This quarter is marked "changed by hand" and keeps this figure when the brand's yearly figure, stretch or pattern changes. The other quarters are not adjusted.
            </Typography>
          </Box>
        )}
      </FormModal>
    </Box>
  );
}
