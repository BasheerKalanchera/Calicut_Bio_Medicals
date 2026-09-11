import { Alert, Box, Button } from "@mui/material";

// dataviz skill: a single-series magnitude comparison -- one sequential hue,
// thin bar with rounded ends, value always shown as visible text (never
// color alone), native `title` as the hover layer (redundant with the
// visible label, but still the expected affordance on a bar).
export function MiniBar({
  label,
  value,
  max,
  formatValue,
}: {
  label: string;
  value: number;
  max: number;
  formatValue: (v: number) => string;
}) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }} title={`${label}: ${formatValue(value)}`}>
      <Box
        sx={{
          flex: "0 0 38%",
          fontSize: "0.8125rem",
          fontWeight: 600,
          color: "text.primary",
          overflow: "hidden",
          textOverflow: "ellipsis",
          whiteSpace: "nowrap",
        }}
      >
        {label}
      </Box>
      <Box sx={{ flex: 1, height: 10, borderRadius: "5px", bgcolor: "#f3f4f6", overflow: "hidden" }}>
        <Box sx={{ width: `${pct}%`, height: "100%", borderRadius: "5px", bgcolor: "#2a78d6" }} />
      </Box>
      <Box
        sx={{
          flex: "0 0 auto",
          fontSize: "0.75rem",
          fontWeight: 700,
          color: "text.secondary",
          minWidth: 64,
          textAlign: "right",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {formatValue(value)}
      </Box>
    </Box>
  );
}

export function StatTile({ label, value, sublabel }: { label: string; value: string; sublabel?: string }) {
  return (
    <Box
      sx={{
        flex: 1,
        minWidth: 160,
        bgcolor: "#fff",
        borderRadius: "1rem",
        border: "1px solid #f3f4f6",
        boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
        p: 2,
      }}
    >
      <Box sx={{ fontSize: "10px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#9ca3af", mb: 0.5 }}>
        {label}
      </Box>
      <Box sx={{ fontSize: "1.5rem", fontWeight: 900, color: "#0b0b0b", fontVariantNumeric: "tabular-nums" }}>{value}</Box>
      {sublabel && <Box sx={{ fontSize: "0.75rem", color: "#6b7280", mt: 0.25 }}>{sublabel}</Box>}
    </Box>
  );
}

export function SectionCard({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <Box sx={{ bgcolor: "#fff", borderRadius: "1rem", border: "1px solid #f3f4f6", boxShadow: "0 1px 2px rgba(0,0,0,0.05)", p: 2 }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1.5 }}>
        <Box sx={{ fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.05em", color: "#6b7280" }}>
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
    return <Box sx={{ color: "#9ca3af", fontSize: "0.875rem", py: 2, textAlign: "center" }}>Loading...</Box>;
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
      <Box sx={{ color: "#9ca3af", fontSize: "0.875rem", py: 2, textAlign: "center", fontStyle: "italic" }}>
        {emptyText}
      </Box>
    );
  }
  return null;
}
