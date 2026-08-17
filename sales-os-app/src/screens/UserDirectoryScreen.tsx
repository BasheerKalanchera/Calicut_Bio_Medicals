import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Box, Typography, Button, TextField, MenuItem, List, ListItemButton, ListItemText, Chip, IconButton, Alert, ListSubheader } from "@mui/material";
import FormModal from "../components/FormModal";
import ZonePicker from "../components/ZonePicker";
import {
  listUsers,
  listRoles,
  listSbus,
  listZones,
  createUser,
  updateUser,
  getUserBlastRadius,
  deactivateUser,
  reactivateUser,
} from "../services/masterData";
import type { UserBlastRadius, UserListResponse } from "../types/api";
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
  const [dialogMode, setDialogMode] = useState<"create" | "edit" | "deactivate" | null>(null);
  const [editingUserId, setEditingUserId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [primaryZone, setPrimaryZone] = useState<ZoneSearchResult | null>(null);
  const [addingZone, setAddingZone] = useState(false);
  const [showInactive, setShowInactive] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<UserListResponse | null>(null);
  const [userBlastRadius, setUserBlastRadius] = useState<UserBlastRadius | null>(null);
  const [blastRadiusError, setBlastRadiusError] = useState<string | null>(null);

  // Always fetches the full roster (active + inactive) -- name lookups
  // (manager labels, the Manager dropdown) need to resolve a deactivated
  // person's name even when they're not otherwise being displayed as a
  // row. "Show Inactive" is applied client-side below, purely to decide
  // which rows render -- it never changes what's available to look up.
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["users", "directory"],
    queryFn: () => listUsers("scoped", true),
  });
  const visibleUsers = showInactive ? users : users.filter((u) => u.is_active !== false);
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

  // Admin/General Manager are an SBU-agnostic overlay tier -- backend mirror
  // in organization/service.py's create_user (BR-OP-12's user-creation
  // equivalent). Every other role still requires an SBU, same as always.
  const isSbuAgnosticRole = (roleId: string) => {
    const roleName = roles.find((r) => r.id === roleId)?.role_name;
    return roleName === "Admin" || roleName === "General Manager";
  };

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
      sbu_id: u.sbu_id || "",
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

  const closeDialog = () => {
    setDialogMode(null);
    setDeactivatingUser(null);
    setUserBlastRadius(null);
    setBlastRadiusError(null);
  };

  const invalidateUsers = () => queryClient.invalidateQueries({ queryKey: ["users"] });

  const combinedZoneIds = () => Array.from(new Set([form.zone_id, ...form.additionalZones].filter(Boolean)));

  const handleCreate = async () => {
    if (!form.id.trim()) throw new Error("Supabase user UUID is required");
    if (!form.display_name.trim()) throw new Error("Display name is required");
    if (!form.role_id) throw new Error("Role is required");
    if (!form.sbu_id && !isSbuAgnosticRole(form.role_id)) throw new Error("SBU is required");
    await createUser({
      id: form.id.trim(),
      display_name: form.display_name.trim(),
      sbu_id: form.sbu_id || undefined,
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
    if (!form.role_id) throw new Error("Role is required");
    if (!form.sbu_id && !isSbuAgnosticRole(form.role_id)) throw new Error("SBU is required");
    await updateUser(editingUserId, {
      display_name: form.display_name.trim(),
      sbu_id: form.sbu_id || undefined,
      role_id: form.role_id,
      zone_id: form.zone_id || undefined,
      zone_ids: combinedZoneIds(),
      // null, not undefined -- an omitted key means "leave unchanged" under
      // the backend's partial-update semantics, so clearing the Manager
      // field (here or via the SBU-mismatch auto-clear above) would
      // otherwise silently no-op and leave the stale manager_id in place.
      manager_id: form.manager_id || null,
    });
    invalidateUsers();
  };

  const openDeactivate = async (u: UserListResponse) => {
    setDeactivatingUser(u);
    setUserBlastRadius(null);
    setBlastRadiusError(null);
    setDialogMode("deactivate");
    try {
      const result = await getUserBlastRadius(u.id);
      setUserBlastRadius(result);
    } catch {
      setBlastRadiusError("Couldn't check this person's current assignments — try again.");
    }
  };

  const handleDeactivate = async () => {
    if (!deactivatingUser) return;
    await deactivateUser(deactivatingUser.id);
    invalidateUsers();
  };

  const handleReactivate = async (u: UserListResponse) => {
    await reactivateUser(u.id);
    invalidateUsers();
  };

  // Active managers are freely pickable. Inactive ones are still listed --
  // disabled -- so an *existing* assignment to a now-deactivated manager
  // still renders correctly instead of going blank (MUI can't show a
  // value's label without a matching option present); disabled blocks
  // freshly picking a deactivated person as someone's new manager.
  const otherUsers = users.filter((u) => u.id !== editingUserId);
  const activeManagerOptions = otherUsers.filter((u) => u.is_active !== false);
  const inactiveManagerOptions = otherUsers.filter((u) => u.is_active === false);
  const selectedManagerIsInactive = inactiveManagerOptions.some((u) => u.id === form.manager_id);

  return (
    <Box sx={{ height: "100%", display: "flex", flexDirection: "column", overflow: "hidden" }}>
      {/* Fixed: title + actions — does not scroll */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", p: 3, pb: 2 }}>
        <Typography variant="h6" sx={{ fontWeight: 700 }}>User Directory</Typography>
        <Box sx={{ display: "flex", gap: 1 }}>
          <Button variant="outlined" onClick={() => setShowInactive((v) => !v)}>
            {showInactive ? "Hide Inactive" : "Show Inactive"}
          </Button>
          <Button variant="contained" onClick={openCreate}>Add User</Button>
        </Box>
      </Box>

      {/* Scrollable: user list only */}
      <Box sx={{ flex: 1, overflowY: "auto", minHeight: 0, px: 3, pb: 3 }}>
        {isLoading ? (
          <Typography color="text.secondary">Loading...</Typography>
        ) : (
          <List sx={{ bgcolor: "background.paper", borderRadius: 2 }}>
            {visibleUsers.map((u) => {
              const sbuName = sbus.find((s) => s.id === u.sbu_id)?.name;
              const zoneNames = u.zone_ids.map((zid) => zones.find((z) => z.id === zid)?.name).filter(Boolean).join(", ");
              const manager = users.find((m) => m.id === u.manager_id);
              const secondaryParts = [sbuName, zoneNames || null, manager ? `reports to ${manager.display_name}` : null].filter(Boolean);
              const inactive = u.is_active === false;
              return (
                <ListItemButton
                  key={u.id}
                  onClick={() => openEdit(u)}
                  sx={{ py: 1.5, borderBottom: "1px solid", borderColor: "divider" }}
                >
                  {/* Opacity scoped to the info side only -- a child's own
                      opacity can't undo a parent's, so the action button has
                      to live outside this dimmed Box to stay fully visible. */}
                  <Box sx={{ display: "flex", alignItems: "center", flex: 1, minWidth: 0, opacity: inactive ? 0.5 : 1 }}>
                    <ListItemText primary={u.display_name} secondary={secondaryParts.join(" · ")} />
                    {inactive && <Chip label="Inactive" size="small" sx={{ mr: 1 }} />}
                    <Chip label={u.role_name} size="small" sx={{ mr: 1 }} />
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (inactive) handleReactivate(u);
                      else openDeactivate(u);
                    }}
                    title={inactive ? "Reactivate user" : "Deactivate user"}
                    sx={{ color: "text.primary" }}
                  >
                    <Box component="span">{inactive ? "↩️" : "🚫"}</Box>
                  </IconButton>
                </ListItemButton>
              );
            })}
          </List>
        )}
      </Box>

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
          label="Role *"
          value={form.role_id}
          onChange={(e) => {
            const roleId = e.target.value;
            // Admin/General Manager have no meaningful SBU -- switching to
            // either role clears whatever was selected rather than leaving a
            // stale, now-hidden value behind.
            setForm({ ...form, role_id: roleId, sbu_id: isSbuAgnosticRole(roleId) ? "" : form.sbu_id });
          }}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select role</MenuItem>
          {roles.map((r) => <MenuItem key={r.id} value={r.id}>{r.role_name}</MenuItem>)}
        </TextField>
        {!isSbuAgnosticRole(form.role_id) && (
          <TextField
            select
            label="SBU *"
            value={form.sbu_id}
            onChange={(e) => {
              const sbuId = e.target.value;
              const currentManager = users.find((u) => u.id === form.manager_id);
              // The edit form always resends manager_id on save, even
              // untouched -- if the SBU change leaves a normal (non-Admin/GM)
              // manager mismatched, resending it would silently trip the
              // backend's same-SBU check on a field the admin never meant to
              // touch. Clear it here instead, visibly, forcing an explicit
              // re-pick -- Admin/GM managers are exempt, same as the backend.
              const managerNowInvalid =
                currentManager &&
                currentManager.role_name !== "Admin" &&
                currentManager.role_name !== "General Manager" &&
                currentManager.sbu_id !== sbuId;
              setForm({ ...form, sbu_id: sbuId, manager_id: managerNowInvalid ? "" : form.manager_id });
            }}
            fullWidth
            size="small"
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select SBU</MenuItem>
            {sbus.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
        )}
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
          // The closed field's displayed text doesn't inherit the matched
          // MenuItem's own sx -- MUI just reads its label, not its style --
          // so the "reporting to an inactive manager" signal needs setting
          // here too, not just on the open dropdown's red MenuItem.
          sx={
            selectedManagerIsInactive
              ? { "& .MuiSelect-select": { color: "error.main", opacity: 0.7 } }
              : undefined
          }
        >
          <MenuItem value="">No manager</MenuItem>
          {activeManagerOptions.map((u) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
          {inactiveManagerOptions.length > 0 && [
            <ListSubheader key="inactive-managers-header" sx={{ fontWeight: 700 }}>Inactive</ListSubheader>,
            ...inactiveManagerOptions.map((u) => (
              <MenuItem key={u.id} value={u.id} disabled sx={{ color: "error.main" }}>
                {u.display_name}
              </MenuItem>
            )),
          ]}
        </TextField>
      </FormModal>

      <FormModal
        isOpen={dialogMode === "deactivate"}
        onClose={closeDialog}
        title={`Deactivate "${deactivatingUser?.display_name ?? ""}"?`}
        onSubmit={handleDeactivate}
        submitLabel="Deactivate"
      >
        {blastRadiusError ? (
          <Alert severity="error">{blastRadiusError}</Alert>
        ) : userBlastRadius === null ? (
          <Typography color="text.secondary">Checking current assignments…</Typography>
        ) : (
          <>
            <Typography>
              {userBlastRadius.direct_report_count} direct report{userBlastRadius.direct_report_count === 1 ? "" : "s"} and{" "}
              {userBlastRadius.open_opportunity_count} open opportunit
              {userBlastRadius.open_opportunity_count === 1 ? "y" : "ies"} are currently tied to this person.
            </Typography>
            <Alert severity="info">
              They'll keep working exactly as before — deactivating only stops this person from logging in
              and being picked for <strong>new</strong> assignments going forward. Reactivate any time from
              this same screen.
            </Alert>
          </>
        )}
      </FormModal>
    </Box>
  );
}
