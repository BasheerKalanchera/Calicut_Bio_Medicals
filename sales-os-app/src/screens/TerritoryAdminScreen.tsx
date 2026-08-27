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
import { useAuth } from "../contexts/AuthContext";
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
// Mirrors the backend's own gate (ReferenceService._TERRITORY_ADMIN_ROLES) --
// this screen is always mounted in the background (DemoApp.tsx, for instant
// tab switching) regardless of who's logged in, so without this the zone-tree
// fetch below fires for every non-admin user and gets a 403 it was never
// going to get past. Same set as DemoApp.tsx's ADMIN_ROLES, which already
// hides this screen's own nav entry the same way.
const TERRITORY_ADMIN_ROLES = new Set(["Admin", "General Manager"]);

export default function TerritoryAdminScreen() {
  const queryClient = useQueryClient();
  const { userProfile } = useAuth();
  const { data: tree = [], isLoading } = useQuery({
    queryKey: ["zone-tree"],
    queryFn: getZoneTree,
    enabled: TERRITORY_ADMIN_ROLES.has(userProfile?.role_name),
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
        {/* Bug fix, 2026-08-19: border was on the row alone, so it drew directly
            under the row -- the coverage pills below then rendered past that line,
            visually reading as the start of the *next* zone's card instead of the
            tail end of this one's. Row + pills now share one wrapper so the border
            only appears after both. */}
        <Box sx={{ borderBottom: "1px solid", borderColor: "divider" }}>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              py: 0.75,
              // Reduced from depth * 3 -- 5 possible zone levels (STATE down to
              // CLUSTER) made the old per-level indent add up to a lot of wasted
              // width on mobile.
              pl: depth * 1.5,
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
              {/* Bug fix, 2026-08-19: no truncation here meant a long zone name pushed
                  past its allotted width instead of shrinking -- since nothing clips
                  the overflow, the zone-level pill right after it spilled out over the
                  "+" (add child zone) icon button for some zones. minWidth: 0 is what
                  actually fixes that (lets this flex item shrink to the row's available
                  width instead of forcing it wider); wraps onto a second line rather
                  than truncating with an ellipsis, so the full name stays visible
                  without opening Edit. */}
              <Typography sx={{ flex: 1, minWidth: 0, fontWeight: 600, overflowWrap: "break-word", wordBreak: "break-word" }}>{node.name}</Typography>
              {node.zone_level && <Chip label={node.zone_level} size="small" sx={{ mr: 1, flexShrink: 0 }} />}
              {node.is_active === false && <Chip label="Inactive" size="small" sx={{ mr: 1, flexShrink: 0 }} />}
            </Box>
            <IconButton size="small" onClick={() => openCreate(node)} title="Add child zone" sx={{ flexShrink: 0 }}>
              <Box component="span">➕</Box>
            </IconButton>
            <IconButton size="small" onClick={() => openEdit(node, parent)} title="Edit zone" sx={{ flexShrink: 0 }}>
              <Box component="span">✏️</Box>
            </IconButton>
            <IconButton
              size="small"
              onClick={() => (node.is_active === false ? handleReactivate(node) : openDeactivate(node))}
              title={node.is_active === false ? "Reactivate zone" : "Deactivate zone"}
              sx={{ color: "text.primary", flexShrink: 0 }}
            >
              <Box component="span">{node.is_active === false ? "↩️" : "🚫"}</Box>
            </IconButton>
          </Box>
          {showCoverage && node.assignees.length > 0 && (
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.5, pl: depth * 1.5 + 5, pb: 0.75 }}>
              {node.assignees.map((a) => (
                <Chip key={a.id} label={`${a.display_name} · ${a.role_name}`} size="small" variant="outlined" />
              ))}
            </Box>
          )}
        </Box>
        {hasChildren && (
          <Collapse in={isExpanded}>
            {node.children.map((child) => renderNode(child, node, depth + 1))}
          </Collapse>
        )}
      </Box>
    );
  };

  // Button sx shared by all 3 header actions -- shrinks on mobile (xs) so
  // "Refresh Territory Visibility" doesn't force horizontal overflow next to
  // the other two buttons on a narrow phone screen.
  const headerButtonSx = { fontSize: { xs: "0.6875rem", sm: "0.8125rem" }, px: { xs: 1, sm: 1.5 }, whiteSpace: "nowrap" as const };

  return (
    // Bug fix, 2026-08-19: header (title + action buttons) used to scroll away
    // with the zone tree below it. Split into a fixed-height header (flexShrink:
    // 0) and a separately scrollable content area (flex:1, overflow:auto) so the
    // header stays visible while the tree scrolls independently.
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      <Box sx={{ p: 3, pb: rebuildMessage ? 0 : 2, flexShrink: 0 }}>
        {/* Mobile (xs): Add Zone shares the title's row to save vertical space;
            Show Coverage/Refresh get their own row below. Desktop (sm+): all
            3 buttons stay on the title's row, as before. Two blocks (CSS
            display toggle, not JS breakpoint detection) since flex-wrap alone
            can't put just one of three buttons on the title's line. */}
        <Box sx={{ display: { xs: "flex", sm: "none" }, justifyContent: "space-between", alignItems: "center", gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Territory Map</Typography>
          <Button variant="contained" size="small" sx={headerButtonSx} onClick={() => openCreate(null)}>Add Zone</Button>
        </Box>
        <Box sx={{ display: { xs: "flex", sm: "none" }, gap: 1, flexWrap: "wrap", mt: 1 }}>
          <Button variant="outlined" size="small" sx={headerButtonSx} onClick={() => setShowCoverage((v) => !v)}>
            {showCoverage ? "Hide Coverage" : "Show Coverage"}
          </Button>
          <Button variant="outlined" size="small" sx={headerButtonSx} onClick={handleRebuildClosure}>Refresh Territory Visibility</Button>
        </Box>

        <Box sx={{ display: { xs: "none", sm: "flex" }, justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 1 }}>
          <Typography variant="h6" sx={{ fontWeight: 700 }}>Territory Map</Typography>
          <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
            <Button variant="outlined" size="small" sx={headerButtonSx} onClick={() => setShowCoverage((v) => !v)}>
              {showCoverage ? "Hide Coverage" : "Show Coverage"}
            </Button>
            <Button variant="outlined" size="small" sx={headerButtonSx} onClick={handleRebuildClosure}>Refresh Territory Visibility</Button>
            <Button variant="contained" size="small" sx={headerButtonSx} onClick={() => openCreate(null)}>Add Zone</Button>
          </Box>
        </Box>

        {rebuildMessage && <Alert severity="success" sx={{ mt: 2 }}>{rebuildMessage}</Alert>}
      </Box>

      <Box sx={{ flex: 1, overflow: "auto", px: 3, pb: 3 }}>
        {isLoading ? (
          <Typography color="text.secondary">Loading...</Typography>
        ) : (
          <Box sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
            {tree.map((node) => renderNode(node, null, 0))}
          </Box>
        )}
      </Box>

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
