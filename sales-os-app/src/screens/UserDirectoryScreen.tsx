import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Typography, Button, TextField, MenuItem, List, ListItemButton, ListItemText, Chip, IconButton } from "@mui/material";
import FormModal from "../components/FormModal";
import ZonePicker from "../components/ZonePicker";
import { listUsers, listRoles, listSbus, listZones, createUser, updateUser } from "../services/masterData";
import type { UserListResponse } from "../types/api";
import type { ZoneSearchResult } from "../services/masterData";

interface MasterDataOption {
  id: string;
  name: string;
}

interface RoleOption {
  id: string;
  role_name: string;
}

const EMPTY_FORM = { id: "", display_name: "", sbu_id: "", role_id: "", zone_id: "", manager_id: "", additionalZones: [] as string[] };

export default function UserDirectoryScreen() {
  const queryClient = useQueryClient();
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [primaryZone, setPrimaryZone] = useState<ZoneSearchResult | null>(null);
  const [addingZone, setAddingZone] = useState(false);

  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", "directory"],
    queryFn: () => listUsers(),
  });
  const { data: roles = [] } = useQuery({
    queryKey: ["roles"],
    queryFn: () => listRoles() as Promise<RoleOption[]>,
  });
  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    queryFn: () => listSbus() as Promise<MasterDataOption[]>,
  });
  const { data: zones = [] } = useQuery({
    queryKey: ["zones"],
    queryFn: () => listZones() as Promise<MasterDataOption[]>,
  });

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setPrimaryZone(null);
    setAddingZone(false);
    setDialogMode("create");
  };

  const openEdit = (u: UserListResponse) => {
    setEditingUserId(u.id);
    setForm({
      id: u.id,
      display_name: u.display_name,
      sbu_id: u.sbu_id,
      role_id: u.role_id,
      zone_id: u.zone_id || "",
      manager_id: u.manager_id || "",
      additionalZones: u.zone_ids.filter((zid) => zid !== u.zone_id),
    });
    const zoneName = zones.find((z) => z.id === u.zone_id)?.name;
    setPrimaryZone(u.zone_id && zoneName ? { id: u.zone_id, name: zoneName, path: "" } : null);
    setAddingZone(false);
    setDialogMode("edit");
  };

  const closeDialog = () => setDialogMode(null);

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const combinedZoneIds = () => Array.from(new Set([form.zone_id, ...form.additionalZones].filter(Boolean)));

  const handleCreate = async () => {
    if (!form.id.trim()) throw new Error("Supabase user UUID is required");
    if (!form.display_name.trim()) throw new Error("Display name is required");
    if (!form.sbu_id) throw new Error("SBU is required");
    if (!form.role_id) throw new Error("Role is required");
    await createUser({
      id: form.id.trim(),
      display_name: form.display_name.trim(),
      sbu_id: form.sbu_id,
      role_id: form.role_id,
      zone_id: form.zone_id || undefined,
      zone_ids: combinedZoneIds(),
      manager_id: form.manager_id || undefined,
    });
    invalidateUsers();
  };

  const handleUpdate = async () => {
    if (!editingUserId) return;
    if (!form.display_name.trim()) throw new Error("Display name is required");
    if (!form.sbu_id) throw new Error("SBU is required");
    if (!form.role_id) throw new Error("Role is required");
    await updateUser(editingUserId, {
      display_name: form.display_name.trim(),
      sbu_id: form.sbu_id,
      role_id: form.role_id,
      zone_id: form.zone_id || undefined,
      zone_ids: combinedZoneIds(),
      manager_id: form.manager_id || undefined,
    });
    invalidateUsers();
  };

  const managerOptions = users.filter((u) => u.id !== editingUserId);

  return (
    <Box sx={{ p: 3, height: "100%", overflow: "auto" }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>User Directory</Typography>
        <Button variant="contained" onClick={openCreate}>Add User</Button>
      </Box>

      {isLoading ? (
        <Typography color="text.secondary">Loading...</Typography>
      ) : (
        <List sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
          {users.map((u) => {
            const sbuName = sbus.find((s) => s.id === u.sbu_id)?.name;
            const zoneNames = u.zone_ids.map((zid) => zones.find((z) => z.id === zid)?.name).filter(Boolean).join(", ");
            const manager = users.find((m) => m.id === u.manager_id);
            const secondaryParts = [sbuName, zoneNames || null, manager ? `reports to ${manager.display_name}` : null].filter(Boolean);
            return (
              <ListItemButton
                key={u.id}
                onClick={() => openEdit(u)}
                sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
              >
                <ListItemText primary={u.display_name} secondary={secondaryParts.join(" · ")} />
                <Chip label={u.role_name} size="small" />
              </ListItemButton>
            );
          })}
        </List>
      )}

      <FormModal
        isOpen={dialogMode !== null}
        onClose={closeDialog}
        title={dialogMode === "create" ? "Add User" : "Edit User"}
        onSubmit={dialogMode === "create" ? handleCreate : handleUpdate}
        submitLabel={dialogMode === "create" ? "Create" : "Save"}
      >
        {dialogMode === "create" && (
          <TextField
            label="Supabase User UUID *"
            value={form.id}
            onChange={(e) => setForm({ ...form, id: e.target.value })}
            placeholder="Paste the UUID from the Supabase Auth dashboard"
            autoFocus
            fullWidth
            size="small"
            sx={{ mt: 1.5 }}
          />
        )}
        <TextField
          label="Display Name *"
          value={form.display_name}
          onChange={(e) => setForm({ ...form, display_name: e.target.value })}
          fullWidth
          size="small"
          sx={dialogMode === "edit" ? { mt: 1.5 } : undefined}
        />
        <TextField
          select
          label="SBU *"
          value={form.sbu_id}
          onChange={(e) => setForm({ ...form, sbu_id: e.target.value })}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select SBU</MenuItem>
          {sbus.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Role *"
          value={form.role_id}
          onChange={(e) => setForm({ ...form, role_id: e.target.value })}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select role</MenuItem>
          {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.role_name}</MenuItem>)}
        </TextField>
        <ZonePicker
          label="Zone"
          value={primaryZone}
          onChange={(zone) => {
            setPrimaryZone(zone);
            setForm({ ...form, zone_id: zone?.id || "" });
          }}
        />

        {form.additionalZones.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
            {form.additionalZones.map((zid) => {
              const name = zones.find((z) => z.id === zid)?.name || zid;
              return (
                <Box
                  key={zid}
                  sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", bgcolor: "action.hover", borderRadius: 1, px: 1.5, py: 0.5 }}
                >
                  <Typography variant="body2">{name}</Typography>
                  <IconButton
                    size="small"
                    onClick={() => setForm({ ...form, additionalZones: form.additionalZones.filter((z) => z !== zid) })}
                  >
                    <Box component="span" sx={{ fontWeight: 900, fontSize: "1.125rem", lineHeight: 1 }}>×</Box>
                  </IconButton>
                </Box>
              );
            })}
          </Box>
        )}

        {addingZone ? (
          <ZonePicker
            label="Add zone"
            value={null}
            excludeIds={[form.zone_id, ...form.additionalZones].filter(Boolean)}
            onChange={(zone) => {
              if (!zone) return;
              setForm({ ...form, additionalZones: [...form.additionalZones, zone.id] });
              setAddingZone(false);
            }}
          />
        ) : (
          <Button size="small" onClick={() => setAddingZone(true)} sx={{ alignSelf: "flex-start", textTransform: "none" }}>
            + Add another zone
          </Button>
        )}

        <TextField
          select
          label="Manager"
          value={form.manager_id}
          onChange={(e) => setForm({ ...form, manager_id: e.target.value })}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">No manager</MenuItem>
          {managerOptions.map((u) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
      </FormModal>
    </Box>
  );
}
