import { useState, type FormEvent } from "react";
import { Box, Paper, TextField, Button, Alert, Typography } from "@mui/material";
import { useAuth } from "../contexts/AuthContext";

export default function LoginScreen() {
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (err) {
      const castErr = err as { message?: string };
      setError(castErr.message ?? "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #1e3a8a 0%, #312e81 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        p: 2,
      }}
    >
      <Paper
        elevation={8}
        sx={{ p: "2rem", width: "100%", maxWidth: "28rem", borderRadius: "1.5rem" }}
      >
        <Box sx={{ textAlign: "center", mb: "2rem" }}>
          <Box
            component="img"
            src="/Cabio%20logo.jpeg"
            alt="Cabio Logo"
            sx={{ height: 64, objectFit: "contain", mx: "auto", mb: 2, display: "block" }}
          />
          {/* font-size/weight/tracking match Tailwind text-2xl font-black tracking-tight */}
          <Typography component="h1" sx={{ fontSize: "1.5rem", fontWeight: 900, color: "#1f2937", letterSpacing: "-0.025em", lineHeight: "2rem" }}>
            Cabio Sales OS
          </Typography>
          {/* text-xs font-bold uppercase tracking-widest text-gray-400 */}
          <Typography sx={{ fontSize: "0.75rem", fontWeight: 700, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.1em", lineHeight: "1rem", mt: "0.25rem" }}>
            Calicut Bio Medicals
          </Typography>
        </Box>

        <Box component="form" onSubmit={handleSubmit} sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <TextField
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@calicutbio.com"
            required
            fullWidth
            size="small"
          />

          <TextField
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            required
            fullWidth
            size="small"
          />

          {error && (
            <Alert severity="error" sx={{ py: 0.5 }}>
              {error}
            </Alert>
          )}

          <Button
            type="submit"
            variant="contained"
            disabled={loading}
            fullWidth
            size="large"
            sx={{ fontWeight: 900, letterSpacing: "0.1em", textTransform: "uppercase" }}
          >
            {loading ? "Signing in..." : "Sign In"}
          </Button>
        </Box>
      </Paper>
    </Box>
  );
}
