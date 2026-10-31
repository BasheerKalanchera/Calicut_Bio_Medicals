import type { Ref } from "react";
import { Box, Button } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import { shadows } from "../theme/shadows";

// The row of pill-shaped tabs used by My Work and Target & Coverage Planning
// (Target-Coverage-Planning-Tabs plan D10): one tab open at a time, the row
// scrolls sideways when it doesn't fit, and a fade on the right edge hints
// that there is more. The screen owns which tab is open and, when it wants
// the open one brought to the middle of the row, calls centerChip
// (utils/centerChip.ts) with the ref it passes as barRef.

export default function ChipTabs<T extends string>({
  tabs,
  value,
  onChange,
  barRef,
}: {
  tabs: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  barRef?: Ref<HTMLDivElement>;
}) {
  return (
    <Box sx={{ position: "relative", px: 2, pt: 2, pb: 1.5, flexShrink: 0 }}>
      <Box
        ref={barRef}
        sx={{
          display: "flex", gap: 1, overflowX: "auto", pb: 0.5,
          "&::-webkit-scrollbar": { display: "none" },
          scrollbarWidth: "none",
          pr: "50vw",
        }}
      >
        {tabs.map((tab) => {
          const isOpen = value === tab.id;
          return (
            <Button
              key={tab.id}
              data-tab={tab.id}
              onClick={() => onChange(tab.id)}
              sx={{
                flexShrink: 0, display: "flex", alignItems: "center", gap: 0.75, px: 2, py: 1,
                borderRadius: "9999px", typography: "body2", fontWeight: 700, whiteSpace: "nowrap",
                transition: "all 0.2s", border: "1px solid", textTransform: "none",
                ...(isOpen
                  ? { bgcolor: "primary.main", color: "common.white", borderColor: "primary.main", boxShadow: shadows.sm }
                  : { bgcolor: "background.paper", color: "gray.500", borderColor: "gray.200", "&:hover": { borderColor: "blue.300", color: "primary.main" } }),
              }}
            >
              {isOpen && <CheckIcon fontSize="inherit" sx={{ flexShrink: 0 }} />}
              {tab.label}
            </Button>
          );
        })}
      </Box>
      <Box sx={{ position: "absolute", right: 0, top: 0, height: "100%", width: 40, pointerEvents: "none", background: (theme) => `linear-gradient(to left, ${theme.palette.background.default}, transparent)` }} />
    </Box>
  );
}
