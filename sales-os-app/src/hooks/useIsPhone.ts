import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

// True below 600 px, the standard's phone cut-off (Frontend standards §6.11
// rule 1).
export default function useIsPhone(): boolean {
  const theme = useTheme();
  return useMediaQuery(theme.breakpoints.down("sm"));
}
