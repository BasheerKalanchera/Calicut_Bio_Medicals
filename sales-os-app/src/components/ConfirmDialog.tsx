import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  // Button that goes ahead with the action; defaults to "Delete" because the
  // first users are the two file-delete buttons (Opportunity Documents,
  // Product Catalogue brochures).
  confirmLabel?: string;
  // True while the action is running: greys out both buttons and blocks closing.
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

// A short "Are you sure?" question before an action that cannot be undone.
// Frontend standards §6.11 rule 3: a short confirmation is a plain Dialog and
// stays a floating box on a phone; a form uses FormModal instead.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open={open}
      onClose={() => { if (!busy) onCancel(); }}
      fullWidth
      maxWidth="xs"
    >
      <DialogTitle component="h3">{title}</DialogTitle>
      <DialogContent>
        <DialogContentText>{message}</DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={onCancel} disabled={busy} color="inherit">
          Cancel
        </Button>
        <Button onClick={onConfirm} disabled={busy} variant="contained" color="error" autoFocus>
          {confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
