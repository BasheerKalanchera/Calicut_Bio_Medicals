import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Typography, Button, TextField, MenuItem, IconButton, Chip, Collapse, Alert } from "@mui/material";
import FormModal from "../components/FormModal";
import { getZoneTree, createZone, updateZone, deprecateZone, getBlastRadius, rebuildClosure } from "../services/territoryAdmin";
import type { ZoneTreeNode, ZoneBlastRadius } from "../types/territoryAdmin";

const EMPTY_FORM = { name: "", zone_level: "", parent_zone_id: "" };
const ZONE_LEVELS = ["STATE", "ZONE", "DISTRICT", "TALUK", "CLUSTER"];

interface FlatZone {
  id: string;
  name: string;
  depth: number;
}

function flattenTree(nodes: ZoneTreeNode[], depth = 0): FlatZone[] {
  return nodes.flatMap((n) => [{ id: n.id, name: n.name, depth }, ...flattenTree(n.children, depth + 1)]);
}

export default function TerritoryAdminScreen() {
  const queryClient = useQueryClient();
  const { data: tree = [], isLoading } = useQuery({
    queryKey: ["zone-tree"],
    queryFn: getZoneTree,
  });

  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "deprecate" | null>(null);
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [deprecatingZone, setDeprecatingZone] = useState<ZoneTreeNode | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [blastRadius, setBlastRadius] = useState<ZoneBlastRadius | null>(null);
  const [rebuildMessage, setRebuildMessage] = useState<string | null>(null);

  const invalidateTree = () => queryClient.invalidateQueries({ queryKey: ["zone-tree"] });

  const toggleExpand = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const flatZones = flattenTree(tree);

  const openCreate = (parent: ZoneTreeNode | null) => {
    setEditingZoneId(null);
    setForm({ name: "", zone_level: "", parent_zone_id: parent?.id || "" });
    setDialogMode("create");
  };

  const openEdit = (zone: ZoneTreeNode, parentId: string | null) => {
    setEditingZoneId(zone.id);
    setForm({ name: zone.name, zone_level: zone.zone_level || "", parent_zone_id: parentId || "" });
    setDialogMode("edit");
  };

  const openDeprecate = async (zone: ZoneTreeNode) => {
    setDeprecatingZone(zone);
    setBlastRadius(null);
    setDialogMode("deprecate");
    const result = await getBlastRadius(zone.id);
    setBlastRadius(result);
  };

  const closeDialog = () => {
    setDialogMode(null);
    setEditingZoneId(null);
    setDeprecatingZone(null);
  };

  const handleCreate = async () => {
    if (!form.name.trim()) throw new Error("Zone name is required");
    await createZone({
      name: form.name.trim(),
      parent_zone_id: form.parent_zone_id || null,
      zone_level: form.zone_level || null,
    });
    invalidateTree();
  };

  const handleEdit = async () => {
    if (!editingZoneId) return;
    if (!form.name.trim()) throw new Error("Zone name is required");
    await updateZone(editingZoneId, {
      name: form.name.trim(),
      parent_zone_id: form.parent_zone_id || null,
      zone_level: form.zone_level || null,
    });
    invalidateTree();
  };

  const handleDeprecate = async () => {
    if (!deprecatingZone) return;
    await deprecateZone(deprecatingZone.id);
    invalidateTree();
  };

  const handleRebuildClosure = async () => {
    await rebuildClosure();
    setRebuildMessage("Territory visibility refreshed — no changes if everything was already in sync.");
    setTimeout(() => setRebuildMessage(null), 4000);
  };

  const renderNode = (node: ZoneTreeNode, parentId: string | null, depth: number) => {
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
            opacity: node.is_active === false ? 0.5 : 1,
          }}
        >
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
          {node.is_active === false && <Chip label="Deprecated" size="small" sx={{ mr: 1 }} />}
          <IconButton size="small" onClick={() => openCreate(node)} title="Add child zone">
            <Box component="span">➕</Box>
          </IconButton>
          <IconButton size="small" onClick={() => openEdit(node, parentId)} title="Edit zone">
            <Box component="span">✏️</Box>
          </IconButton>
          <IconButton
            size="small"
            onClick={() => openDeprecate(node)}
            disabled={node.is_active === false}
            title="Deprecate zone"
          >
            <Box component="span">🚫</Box>
          </IconButton>
        </Box>
        {hasChildren && (
          <Collapse in={isExpanded}>
            {node.children.map((child) => renderNode(child, node.id, depth + 1))}
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
        <TextField
          select
          label="Parent Zone"
          value={form.parent_zone_id}
          onChange={(e) => setForm({ ...form, parent_zone_id: e.target.value })}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">No parent (top-level)</MenuItem>
          {flatZones
            .filter((z) => z.id !== editingZoneId)
            .map((z) => (
              <MenuItem key={z.id} value={z.id}>{"— ".repeat(z.depth)}{z.name}</MenuItem>
            ))}
        </TextField>
      </FormModal>

      <FormModal
        isOpen={dialogMode === "deprecate"}
        onClose={closeDialog}
        title={`Deprecate "${deprecatingZone?.name ?? ""}"?`}
        onSubmit={handleDeprecate}
        submitLabel="Deprecate"
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
              They'll keep working exactly as before — deprecating only stops this zone from being picked for{" "}
              <strong>new</strong> assignments going forward. This cannot be undone from here.
            </Alert>
          </>
        )}
      </FormModal>
    </Box>
  );
}
