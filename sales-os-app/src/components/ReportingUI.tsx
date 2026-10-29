import { Alert, Box, Button, ButtonBase } from "@mui/material";
import { shadows } from "../theme/shadows";

// dataviz skill: a single-series magnitude comparison -- one sequential hue,
// thin bar with rounded ends, value always shown as visible text (never
// color alone), native `title` as the hover layer (redundant with the
// visible label, but still the expected affordance on a bar).
export function MiniBar({
  label,
  value,
  max,
  formatValue,
  secondaryValue,
  secondaryLabel = "weighted",
  count,
  indent = 0,
  onClick,
}: {
  label: string;
  value: number;
  max: number;
  formatValue: (v: number) => string;
  // Optional second figure shown under the primary one (e.g. the same
  // slice's weighted forecast next to its open pipeline value) -- doesn't
  // affect the bar's width, which is still driven by `value` alone.
  secondaryValue?: number;
  secondaryLabel?: string;
  // How many Opportunities make up this bar -- shown under the label so a bar can
  // be checked against the list it drills into.
  count?: number;
  // Tree depth (Zone breakdown) -- indents the label only; the bar still
  // scales against the same max as every other row.
  indent?: number;
  // Report Drill-down (Feature 11.2): when present, the row becomes
  // clickable (pointer cursor + hover background) -- clicking it should
  // land on the Opportunities that make up this bar's number. Doesn't
  // change the bar's layout or sizing at all.
  onClick?: () => void;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  const title =
    secondaryValue === undefined
      ? `${label}: ${formatValue(value)}`
      : `${label}: ${formatValue(value)} (${formatValue(secondaryValue)} ${secondaryLabel})`;
  return (
    <Box
      onClick={onClick}
      sx={{
        display: "flex",
        alignItems: "center",
        gap: 1.5,
        ...(onClick && {
          cursor: "pointer",
          borderRadius: "0.5rem",
          mx: -1,
          px: 1,
          py: 0.25,
          "&:hover": { bgcolor: "gray.100" },
        }),
      }}
      title={title}
    >
      <Box sx={{ flex: "0 0 38%", minWidth: 0, pl: indent * 1.5 }}>
        <Box
          sx={{
            typography: "body3",
            fontWeight: 600,
            color: "text.primary",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {label}
        </Box>
        {count !== undefined && (
          <Box sx={{ typography: "caption2", color: "text.secondary" }}>
            {count} {count === 1 ? "Opportunity" : "Opportunities"}
          </Box>
        )}
      </Box>
      <Box sx={{ flex: 1, height: 10, borderRadius: "5px", bgcolor: "gray.100", overflow: "hidden" }}>
        <Box sx={{ width: `${pct}%`, height: "100%", borderRadius: "5px", bgcolor: "report.bar" }} />
      </Box>
      <Box sx={{ flex: "0 0 auto", minWidth: secondaryValue === undefined ? 64 : 92, textAlign: "right" }}>
        <Box sx={{ typography: "caption", fontWeight: 700, color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
          {formatValue(value)}
        </Box>
        {secondaryValue !== undefined && (
          <Box sx={{ typography: "caption2", color: "gray.400", fontVariantNumeric: "tabular-nums" }}>
            {formatValue(secondaryValue)} {secondaryLabel}
          </Box>
        )}
      </Box>
    </Box>
  );
}

// With onClick the tile is a button (keyboard and focus included), e.g. My
// Work's Summary boxes that open their list (Weekly Follow-up plan D33).
export function StatTile({ label, value, sublabel, onClick, children, inGrid = false }: {
  label: string;
  value: string;
  sublabel?: string;
  onClick?: () => void;
  // A bar or note under the figure.
  children?: React.ReactNode;
  // Sits in a grid that sets the widths (two to a row on a phone): no minimum width of its own.
  inGrid?: boolean;
}) {
  return (
    <Box
      component={onClick ? ButtonBase : "div"}
      onClick={onClick}
      sx={{
        ...(onClick && { display: "block", textAlign: "left", font: "inherit", transition: "border-color 0.2s", "&:hover": { borderColor: "blue.300" } }),
        flex: 1,
        minWidth: inGrid ? 0 : 160,
        bgcolor: "background.paper",
        borderRadius: "1rem",
        border: 1,
        borderColor: "gray.100",
        boxShadow: shadows.sm,
        p: 2,
      }}
    >
      <Box sx={{ typography: "tiny", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "gray.400", mb: 0.5 }}>
        {label}
      </Box>
      <Box sx={{ typography: "h5", fontWeight: 900, color: "report.figure", fontVariantNumeric: "tabular-nums" }}>{value}</Box>
      {sublabel && <Box sx={{ typography: "caption", color: "gray.500", mt: 0.25 }}>{sublabel}</Box>}
      {children && <Box sx={{ mt: 1 }}>{children}</Box>}
    </Box>
  );
}

export function SectionCard({
  title,
  action,
  stackActionOnPhone = false,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  // On a phone, put the action on its own lines under the title, full width,
  // so a wide action stays inside the card (Annual Target Planning D77).
  stackActionOnPhone?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ bgcolor: "background.paper", borderRadius: "1rem", border: 1, borderColor: "gray.100", boxShadow: shadows.sm, p: 2 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          mb: 1.5,
          ...(stackActionOnPhone
            ? { flexDirection: { xs: "column", sm: "row" }, alignItems: { xs: "stretch", sm: "center" }, gap: 1 }
            : { alignItems: "center" }),
        }}
      >
        <Box sx={{ typography: "caption", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "gray.500" }}>
          {title}
        </Box>
        {action}
      </Box>
      {children}
    </Box>
  );
}

export function LoadingOrEmpty({
  isLoading,
  isError,
  isEmpty,
  emptyText,
  onRetry,
  errorText,
}: {
  isLoading: boolean;
  isError: boolean;
  isEmpty: boolean;
  emptyText: string;
  errorText: string;
  onRetry: () => void;
}) {
  if (isLoading) {
    return <Box sx={{ color: "gray.400", typography: "body2", py: 2, textAlign: "center" }}>Loading...</Box>;
  }
  if (isError) {
    return (
      <Alert severity="error" action={<Button color="inherit" size="small" onClick={onRetry}>Retry</Button>}>
        {errorText}
      </Alert>
    );
  }
  if (isEmpty) {
    return (
      <Box sx={{ color: "gray.400", typography: "body2", py: 2, textAlign: "center", fontStyle: "italic" }}>
        {emptyText}
      </Box>
    );
  }
  return null;
}

// Shown under a Zone breakdown -- its rows are a tree, so only the
// top-level rows add up to the report total.
export function ZoneTreeNote() {
  return (
    <Box sx={{ typography: "caption2", color: "text.secondary", mt: 1 }}>
      Each zone's figures include the zones listed under it.
    </Box>
  );
}
