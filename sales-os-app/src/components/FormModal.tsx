import { useState, useEffect, type ReactNode, type FormEvent } from "react";
import {
  Box,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from "@mui/material";

interface FormModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  onSubmit: () => Promise<void>;
  submitLabel?: string;
  children: ReactNode;
  // MUI nested-dialog caveat: when this FormModal stays open underneath a second,
  // nested FormModal (e.g. an "Add Product" sub-dialog), its focus trap fights the
  // inner dialog's for focus on every re-render -- kicking focus out of the inner
  // dialog's inputs after each keystroke. Pass true while the nested dialog is open
  // to stand this dialog's trap down; MUI's own documented fix for nested modals.
  disableEnforceFocus?: boolean;
}

export default function FormModal({
  isOpen,
  onClose,
  title,
  onSubmit,
  submitLabel = "Save",
  children,
  disableEnforceFocus,
}: FormModalProps) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) setError(null);
  }, [isOpen]);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit();
      onClose();
    } catch (err) {
      const axiosErr = err as { response?: { data?: { detail?: string } }; message?: string };
      setError(axiosErr.response?.data?.detail ?? axiosErr.message ?? "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog
      open={isOpen}
      onClose={() => { if (!submitting) onClose(); }}
      fullWidth
      maxWidth={false}
      disableEnforceFocus={disableEnforceFocus}
      slotProps={{ paper: { sx: { maxWidth: "28rem" } } }}
    >
      <form
        onSubmit={handleSubmit}
        onKeyDown={(e) => {
          const tag = (e.target as HTMLElement).tagName;
          if (e.key === "Enter" && (tag === "INPUT" || tag === "TEXTAREA")) {
            e.preventDefault();
          }
        }}
      >
        <DialogTitle component="h3">{title}</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
              {error}
            </Alert>
          )}
          <Box sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            {children}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} disabled={submitting} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? "Saving..." : submitLabel}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
}
