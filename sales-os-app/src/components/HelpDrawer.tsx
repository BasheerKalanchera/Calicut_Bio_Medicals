import { Box, Drawer, IconButton, Typography } from "@mui/material";
import { HELP_CONTENT } from "../utils/helpContent";

// Generalized from the 2026-08-01 Pipeline-only spike once that experience
// checked out -- content lives in helpContent.tsx, keyed by DemoApp.tsx's
// `view` state. DemoApp only renders the [?] trigger button for a viewId
// that has an entry here; screens without one simply don't show it yet.
interface Props {
  isOpen: boolean;
  onClose: () => void;
  viewId: string;
}

export default function HelpDrawer({ isOpen, onClose, viewId }: Props) {
  const topic = HELP_CONTENT[viewId];
  if (!topic) return null;

  return (
    <Drawer anchor="right" open={isOpen} onClose={onClose} slotProps={{ paper: { sx: { width: { xs: "100%", sm: 380 } } } }}>
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", px: 2, py: 1.5, borderBottom: "1px solid #f3f4f6" }}>
        <Typography sx={{ fontWeight: 900, fontSize: "0.95rem", color: "#1f2937" }}>{topic.title}</Typography>
        <IconButton onClick={onClose} sx={{ color: "#9ca3af" }}>
          <Box component="span" sx={{ fontSize: "1.25rem", lineHeight: 1 }}>&times;</Box>
        </IconButton>
      </Box>

      <Box sx={{ px: 2, py: 2, overflowY: "auto", display: "flex", flexDirection: "column", gap: 2 }}>
        {topic.sections.map((section) => (
          <Box key={section.heading}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.8rem", color: "#1f2937", mb: 0.5 }}>
              {section.heading}
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "#4b5563", lineHeight: 1.6 }}>
              {section.body}
            </Typography>
          </Box>
        ))}

        {topic.managerNote && (
          <Box sx={{ mt: 1, pt: 1.5, borderTop: "1px solid #f3f4f6" }}>
            <Typography sx={{ fontWeight: 800, fontSize: "0.7rem", color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 0.5 }}>
              If you're a Manager
            </Typography>
            <Typography sx={{ fontSize: "0.8rem", color: "#4b5563", lineHeight: 1.6 }}>
              {topic.managerNote}
            </Typography>
          </Box>
        )}
      </Box>
    </Drawer>
  );
}
