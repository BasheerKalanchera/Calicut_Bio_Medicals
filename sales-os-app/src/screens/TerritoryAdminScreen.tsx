import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Box,
  Typography,
  Button,
  TextField,
  MenuItem,
  IconButton,
  Chip,
  Collapse,
  Alert,
  FormControlLabel,
  Checkbox,
} from "@mui/material";
import FormModal from "../components/FormModal";
import ZonePicker from "../components/ZonePicker";
import useDebouncedValue from "../hooks/useDebouncedValue";
import {
  getZoneTree,
  createZone,
  updateZone,
  deactivateZone,
  reactivateZone,
  getBlastRadius,
  rebuildClosure,
  checkZoneName,
} from "../services/territoryAdmin";
import type { ZoneTreeNode, ZoneBlastRadius } from "../types/territoryAdmin";
import type { ZoneSearchResult } from "../services/masterData";

const EMPTY_FORM = { name: "", zone_level: "", parent_zone_id: "" };
const ZONE_LEVELS = ["STATE", "ZONE", "DISTRICT", "TALUK", "CLUSTER"];

export default function TerritoryAdminScreen() {
  const queryClient = useQueryClient();
  const { data: tree = [], isLoading } = useQuery({
    queryKey: ["zone-tree"],
    queryFn: getZoneTree,
  });

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [showCoverage, setShowCoverage] = useState(false);
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "deactivate" | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [deactivatingZone, setDeactivatingZone] = useState<ZoneTreeNode | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [parentZone, setParentZone] = useState<ZoneSearchResult | null>(null);
  const [isTopLevel, setIsTopLevel] = useState(false);
  // Only set when editing a zone that currently has a parent -- drives the
  // "will be removed from X" warning. Null for Add Zone (nothing to warn
  // about yet) and for editing an already-top-level zone.
  const [originalParentName, setOriginalParentName] = useState<string | null>(null);
  const [blastRadius, setBlastRadius] = useState<ZoneBlastRadius | null>(null);
  const [rebuildMessage, setRebuildMessage] = useState<string | null>(null);

  const debouncedFormName = useDebouncedValue(form.name);
  const effectiveParentId = isTopLevel ? null : form.parent_zone_id || null;
  // Soft, non-blocking heads-up -- uq_zone_parent_name/uq_zone_root_name
  // (migration 0019) deliberately allow the same name in different
  // branches, so this never blocks Create/Save. It just catches the more
  // likely case: the same real place added twice by mistake.
  const { data: nameMatches = [] } = useQuery({
    queryKey: ["zones", "name-check", debouncedFormName, effectiveParentId, editingZoneId],
    enabled: (dialogMode === "create" || dialogMode === "edit") && debouncedFormName.trim().length >= 2,
    queryFn: () => checkZoneName(debouncedFormName.trim(), effectiveParentId, editingZoneId),
  });

  const invalidateTree = () => queryClient.invalidateQueries({ queryKey: ["zone-tree"] });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const openCreate = (parent: ZoneTreeNode | null) => {
    setEditingZoneId(null);
    setForm({ name: "", zone_level: "", parent_zone_id: parent?.id || "" });
    setParentZone(parent ? { id: parent.id, name: parent.name, path: "" } : null);
    // Always starts unchecked, even from the toolbar's parent-less "Add
    // Zone" -- top-level is a rare, deliberate choice the Admin must
    // explicitly opt into, not a default guessed from which button they
    // clicked.
    setIsTopLevel(false);
    setOriginalParentName(null);
    setDialogMode("create");
  };

  const openEdit = (zone: ZoneTreeNode, parent: ZoneTreeNode | null) => {
    setEditingZoneId(zone.id);
    setForm({ name: zone.name, zone_level: zone.zone_level || "", parent_zone_id: parent?.id || "" });
    setParentZone(parent ? { id: parent.id, name: parent.name, path: "" } : null);
    setIsTopLevel(!parent);
    setOriginalParentName(parent?.name ?? null);
    setDialogMode("edit");
  };

  const openDeactivate = async (zone: ZoneTreeNode) => {
    setDeactivatingZone(zone);
    setBlastRadius(null);
    setDialogMode("deactivate");
    const result = await getBlastRadius(zone.id);
    setBlastRadius(result);
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingZoneId(null);
    setDeactivatingZone(null);
    setParentZone(null);
  };

  const validateZoneForm = () => {
    if (!form.name.trim()) throw new Error("Zone name is required");
    if (!isTopLevel && !form.parent_zone_id) {
      throw new Error("Parent Zone is required, or mark this as a top-level zone");
    }
  };

  const handleCreate = async () => {
    validateZoneForm();
    await createZone({
      name: form.name.trim(),
      parent_zone_id: isTopLevel ? null : form.parent_zone_id,
      zone_level: form.zone_level || null,
    });
    invalidateTree();
  };

  const handleEdit = async () => {
    if (!editingZoneId) return;
    validateZoneForm();
    await updateZone(editingZoneId, {
      name: form.name.trim(),
      parent_zone_id: isTopLevel ? null : form.parent_zone_id,
      zone_level: form.zone_level || null,
    });
    invalidateTree();
  };

  const handleDeactivate = async () => {
    if (!deactivatingZone) return;
    await deactivateZone(deactivatingZone.id);
    invalidateTree();
  };

  const handleReactivate = async (zone: ZoneTreeNode) => {
    await reactivateZone(zone.id);
    invalidateTree();
  };

  const handleRebuildClosure = async () => {
    await rebuildClosure();
    setRebuildMessage("Territory visibility refreshed — no changes if everything was already in sync.");
    setTimeout(() => setRebuildMessage(null), 4000);
  };

  const renderNode = (node: ZoneTreeNode, parent: ZoneTreeNode | null, depth: number) => {
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children.length > 0;
    return (
      <Box key={node.id}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.5,
            py: 0.75,
            pl: depth * 3,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          {/* Opacity scoped to the info side only -- a child's own opacity
              can't undo a parent's, so the action buttons have to live
              outside this dimmed Box to stay fully visible. */}
          <Box sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, opacity: node.is_active === false ? 0.5 : 1 }}>
            <IconButton
              size="small"
              onClick={() => toggleExpand(node.id)}
              disabled={!hasChildren}
              sx={{ visibility: hasChildren ? "visible" : "hidden" }}
            >
              <Box component="span" sx={{ fontSize: "0.75rem" }}>{isExpanded ? "▼" : "▶"}</Box>
            </IconButton>
            <Typography sx={{ flex: 1, fontWeight: 600 }}>{node.name}</Typography>
            {node.zone_level && <Chip label={node.zone_level} size="small" sx={{ mr: 1 }} />}
            {node.is_active === false && <Chip label="Inactive" size="small" sx={{ mr: 1 }} />}
          </Box>
          <IconButton size="small" onClick={() => openCreate(node)} title="Add child zone">
            <Box component="span">➕</Box>
          </IconButton>
          <IconButton size="small" onClick={() => openEdit(node, parent)} title="Edit zone">
            <Box component="span">✏️</Box>
          </IconButton>
          <IconButton
            size="small"
            onClick={() => (node.is_active === false ? handleReactivate(node) : openDeactivate(node))}
            title={node.is_active === false ? "Reactivate zone" : "Deactivate zone"}
            sx={{ color: "text.primary" }}
          >
            <Box component="span">{node.is_active === false ? "↩️" : "🚫"}</Box>
          </IconButton>
        </Box>
        {showCoverage && node.assignees.length > 0 && (
          <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, pl: depth * 3 + 5, pb: 0.75 }}>
            {node.assignees.map((a) => (
              <Chip key={a.id} label={`${a.display_name} · ${a.role_name}`} size="small" variant="outlined" />
            ))}
          </Box>
        )}
        {hasChildren && (
          <Collapse in={isExpanded}>
            {node.children.map((child) => renderNode(child, node, depth + 1))}
          </Collapse>
        )}
      </Box>
    );
  };

  return (
    <Box sx={{ p: 3, height: "100%", overflow: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>Territory Map</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={() => setShowCoverage((v) => !v)}>
            {showCoverage ? "Hide Coverage" : "Show Coverage"}
          </Button>
          <Button variant="outlined" onClick={handleRebuildClosure}>Refresh Territory Visibility</Button>
          <Button variant="contained" onClick={() => openCreate(null)}>Add Zone</Button>
        </Box>
      </Box>

      {rebuildMessage && <Alert severity="success" sx={{ mb: 2 }}>{rebuildMessage}</Alert>}

      {isLoading ? (
        <Typography color="text.secondary">Loading...</Typography>
      ) : (
        <Box sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
          {tree.map((node) => renderNode(node, null, 0))}
        </Box>
      )}

      <FormModal
        isOpen={dialogMode === "create" || dialogMode === "edit"}
        onClose={closeDialog}
        title={dialogMode === "create" ? "Add Zone" : "Edit Zone"}
        onSubmit={dialogMode === "create" ? handleCreate : handleEdit}
        submitLabel={dialogMode === "create" ? "Create" : "Save"}
      >
        <TextField
          label="Zone Name *"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          fullWidth
          size="small"
          autoFocus
        />
        {nameMatches.length > 0 && (
          <Alert severity="warning">
            "{debouncedFormName.trim()}" already exists under{" "}
            {nameMatches.map((m) => m.parent_name ?? "the top level").join(", ")}. Make sure this isn't the same
            place added twice.
          </Alert>
        )}
        <TextField
          select
          label="Zone Level"
          value={form.zone_level}
          onChange={(e) => setForm({ ...form, zone_level: e.target.value })}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">No level</MenuItem>
          {ZONE_LEVELS.map((lvl) => (
            <MenuItem key={lvl} value={lvl}>{lvl}</MenuItem>
          ))}
        </TextField>
        <ZonePicker
          label="Parent Zone"
          value={parentZone}
          onChange={(zone) => {
            setParentZone(zone);
            setForm({ ...form, parent_zone_id: zone?.id || "" });
          }}
          excludeIds={editingZoneId ? [editingZoneId] : []}
          disabled={isTopLevel}
        />
        <FormControlLabel
          control={
            <Checkbox
              checked={isTopLevel}
              onChange={(e) => {
                const checked = e.target.checked;
                setIsTopLevel(checked);
                if (checked) {
                  setParentZone(null);
                  setForm({ ...form, parent_zone_id: "" });
                }
              }}
            />
          }
          label="This is a top-level zone (no parent)"
        />
        {isTopLevel && originalParentName && (
          <Alert severity="warning">
            "{form.name || "This zone"}" will no longer belong to "{originalParentName}".
          </Alert>
        )}
      </FormModal>

      <FormModal
        isOpen={dialogMode === "deactivate"}
        onClose={closeDialog}
        title={`Deactivate "${deactivatingZone?.name ?? ""}"?`}
        onSubmit={handleDeactivate}
        submitLabel="Deactivate"
      >
        {blastRadius === null ? (
          <Typography color="text.secondary">Checking current assignments…</Typography>
        ) : (
          <>
            <Typography>
              {blastRadius.account_count} account{blastRadius.account_count === 1 ? "" : "s"} and{" "}
              {blastRadius.user_count} user{blastRadius.user_count === 1 ? "" : "s"} are currently assigned to
              this zone (including its sub-zones).
            </Typography>
            <Alert severity="info">
              They'll keep working exactly as before — deactivating only stops this zone from being picked for{" "}
              <strong>new</strong> assignments going forward.
            </Alert>
          </>
        )}
      </FormModal>
    </Box>
  );
}
