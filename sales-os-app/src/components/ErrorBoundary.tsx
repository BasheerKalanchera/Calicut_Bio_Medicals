import { Component, type ReactNode } from "react";
import { Box, Typography, Button } from "@mui/material";

const SHADOW_SM = "0 1px 2px rgba(0,0,0,0.05)";

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export default class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return { hasError: true, error };
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <Box sx={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", p: 4, bgcolor: "background.default" }}>
        <Box sx={{ bgcolor: "#fff", borderRadius: "1.5rem", boxShadow: SHADOW_SM, border: "1px solid #f3f4f6", p: 4, maxWidth: "28rem", width: "100%", textAlign: "center" }}>
          <Box sx={{ width: 64, height: 64, bgcolor: "#fef2f2", color: "#ef4444", borderRadius: "1rem", display: "flex", alignItems: "center", justifyContent: "center", mx: "auto", mb: 2, fontSize: "1.5rem", fontWeight: 900 }}>
            !
          </Box>
          <Typography component="h2" sx={{ fontWeight: 800, fontSize: "1.25rem", color: "#1f2937", mb: 1 }}>
            Something went wrong
          </Typography>
          <Typography sx={{ fontSize: "0.875rem", color: "#6b7280", mb: 3 }}>
            {this.state.error?.message || "An unexpected error occurred."}
          </Typography>
          <Button
            variant="contained"
            onClick={() => this.setState({ hasError: false, error: null })}
            sx={{ px: 3, py: 1.25, fontSize: "0.75rem", fontWeight: 900, textTransform: "uppercase", letterSpacing: "0.1em" }}
          >
            Try Again
          </Button>
        </Box>
      </Box>
    );
  }
}
