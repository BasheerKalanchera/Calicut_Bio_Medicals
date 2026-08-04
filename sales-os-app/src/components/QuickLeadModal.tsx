import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Box, Button, IconButton, MenuItem, TextField, Typography } from "@mui/material";
import FormModal from "./FormModal";
import { listAccounts, listProjects, createOpportunity } from "../services/accounts";
import { listProducts } from "../services/products";
import { listStages, listStatuses, listUsers, listLeadSources, listSbus } from "../services/masterData";
import { useAuth } from "../contexts/AuthContext";

interface QuickLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  sbuId?: string;
}

// Local stopgap types — these services return Promise<unknown> today.
// TODO(fix-at-service-layer): give these functions real return types; see
// active_progress.md deferred list. Remove these once fixed.
interface AccountOption { id: string; name: string }
interface ProjectOption { id: string; name: string }
interface StageOption { id: string; stage_name: string; stage_code: string; display_order: number; default_win_probability: number }
interface StatusOption { id: string; status_name: string }
interface UserOption { id: string; display_name: string }
interface ProductOption { id: string; name: string }
interface LeadSourceOption { id: string; name: string }
interface SbuOption { id: string; name: string }

interface LineItem {
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price_lakhs: number;
  discount_lakhs: number;
}

export default function QuickLeadModal({ isOpen, onClose, onCreated, sbuId }: QuickLeadModalProps) {
  const { userProfile } = useAuth();
  // BR-OP-12: Admin/General Manager only — everyone else creates in their own SBU
  // (the sbuId prop) and never sees the override field.
  const isSbuOverrideRole = ["Admin", "General Manager"].includes((userProfile as any)?.role_name);

  const [accountId, setAccountId]       = useState("");
  const [projectId, setProjectId]       = useState("");
  const [name, setName]                 = useState("");
  const [sbuOverrideId, setSbuOverrideId] = useState("");
  const [stageId, setStageId]           = useState("");
  const [statusId, setStatusId]         = useState("");
  const [ownerId, setOwnerId]           = useState("");
  const [winProb, setWinProb]           = useState("");
  const [value, setValue]               = useState("");
  const [leadSourceId, setLeadSourceId] = useState("");

  const effectiveSbuId = (isSbuOverrideRole && sbuOverrideId) ? sbuOverrideId : sbuId;

  const [items, setItems]                   = useState<LineItem[]>([]);
  const [showItemsModal, setShowItemsModal] = useState(false);
  const [itemProdId, setItemProdId]         = useState("");
  const [itemQty, setItemQty]               = useState("1");
  const [itemPrice, setItemPrice]           = useState("0");
  const [itemDisc, setItemDisc]             = useState("0");
  const [addItemError, setAddItemError]     = useState<string | null>(null);

  const { data: accounts = [] } = useQuery({
    queryKey: ["accounts", "picker"],
    enabled: isOpen,
    queryFn: async () => {
      const d = await listAccounts({ page_size: 100 });
      return (d as { items?: AccountOption[] }).items ?? [];
    },
  });

  const { data: stages = [] } = useQuery({
    queryKey: ["stages"],
    enabled: isOpen,
    queryFn: async () => (await listStages()) as StageOption[],
  });

  const { data: statuses = [] } = useQuery({
    queryKey: ["statuses"],
    enabled: isOpen,
    queryFn: async () => (await listStatuses()) as StatusOption[],
  });

  const { data: users = [] } = useQuery({
    queryKey: ["users", "all"],
    enabled: isOpen,
    queryFn: async () => {
      const d = await listUsers();
      return Array.isArray(d) ? (d as UserOption[]) : [];
    },
  });

  const { data: products = [] } = useQuery({
    queryKey: ["products", "picker", effectiveSbuId],
    enabled: isOpen,
    queryFn: async () => {
      const d = await listProducts({ page_size: 100, sbu_id: effectiveSbuId as any });
      return (d as { items?: ProductOption[] }).items ?? [];
    },
  });

  const { data: sbus = [] } = useQuery({
    queryKey: ["sbus"],
    enabled: isOpen && isSbuOverrideRole,
    queryFn: async () => (await listSbus()) as SbuOption[],
  });

  const { data: leadSources = [] } = useQuery({
    queryKey: ["leadSources"],
    enabled: isOpen,
    queryFn: async () => (await listLeadSources()) as LeadSourceOption[],
  });

  const { data: projects = [], isFetching: projectsLoading } = useQuery({
    queryKey: ["projects", "byAccount", accountId],
    enabled: isOpen && !!accountId,
    queryFn: async () => {
      const d = await listProjects(accountId as any);
      return Array.isArray(d) ? (d as ProjectOption[]) : [];
    },
  });

  useEffect(() => {
    if (items.length > 0) {
      const total = items.reduce((s, i) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0);
      setValue(total.toFixed(2));
    } else {
      setValue("");
    }
  }, [items]);

  useEffect(() => {
    if (!isOpen) return;
    setAccountId(""); setProjectId("");
    setName(""); setSbuOverrideId(""); setStageId(""); setStatusId(""); setOwnerId("");
    setWinProb(""); setValue(""); setItems([]);
    setItemProdId(""); setItemQty("1"); setItemPrice("0"); setItemDisc("0");
    setAddItemError(null);
    setLeadSourceId("");
  }, [isOpen]);

  async function handleSubmit() {
    if (!name.trim()) throw new Error("Opportunity name is required");
    // BR-OP-12: Admin/GM have no meaningful "own" SBU -- must always explicitly choose.
    if (isSbuOverrideRole && !sbuOverrideId) throw new Error("SBU is required");
    if (!accountId) throw new Error("Account is required");
    if (!stageId) throw new Error("Stage is required");
    if (!statusId) throw new Error("Status is required");
    if (!ownerId) throw new Error("Owner is required");
    if (winProb === "") throw new Error("Win probability is required");
    const _stage = stages.find((s) => s.id === stageId);
    const _qualified = stages.find((s) => s.stage_code === "QUALIFIED");
    if (_stage && _qualified && _stage.display_order >= _qualified.display_order && value === "") {
      throw new Error("Indicative value is required for Qualified stage and above");
    }
    const payload: Record<string, unknown> = {
      name: name.trim(),
      stage_id: stageId,
      status_id: statusId,
      owner_id: ownerId,
      win_probability: Number(winProb),
    };
    if (isSbuOverrideRole && sbuOverrideId) payload.sbu_id = sbuOverrideId;
    if (value !== "") payload.indicative_value = Number(value);
    if (projectId) payload.project_id = projectId;
    if (leadSourceId) payload.lead_source_id = leadSourceId;
    if (items.length > 0) payload.items = items.map((i) => ({
      product_id: i.product_id,
      quantity: i.quantity,
      unit_price_lakhs: i.unit_price_lakhs,
      discount_lakhs: i.discount_lakhs,
    }));
    await createOpportunity(accountId as any, payload);
    onCreated?.();
  }

  const itemsTotal = items.reduce((s, i) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0);

  return (
    <>
      <FormModal isOpen={isOpen} onClose={onClose} title="New Opportunity" onSubmit={handleSubmit} submitLabel="Create" disableEnforceFocus={showItemsModal}>
        <TextField
          label="Name *"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Enter opportunity name"
          autoFocus
          fullWidth
          size="small"
          sx={{ mt: 1.5 }}
        />
        {isSbuOverrideRole && (
          <TextField
            select
            label="SBU *"
            value={sbuOverrideId}
            onChange={(e) => setSbuOverrideId(e.target.value)}
            fullWidth
            size="small"
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select SBU</MenuItem>
            {sbus.map((s) => <MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>)}
          </TextField>
        )}
        <TextField
          select
          label="Account *"
          value={accountId}
          onChange={(e) => { setAccountId(e.target.value); setProjectId(""); }}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select account</MenuItem>
          {accounts.map((a) => <MenuItem key={a.id} value={a.id}>{a.name}</MenuItem>)}
        </TextField>
        <TextField
          select
          label={`Project${projectsLoading ? " — loading…" : ""}`}
          value={projectId}
          onChange={(e) => setProjectId(e.target.value)}
          disabled={!accountId}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">None</MenuItem>
          {projects.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
        </TextField>
        <Box sx={{ display: "flex", gap: "0.75rem" }}>
          <TextField
            select
            label="Stage *"
            value={stageId}
            onChange={(e) => {
              const s = stages.find((x) => x.id === e.target.value);
              setStageId(e.target.value);
              if (s) setWinProb(String(s.default_win_probability));
            }}
            fullWidth
            size="small"
            sx={{ flex: 1 }}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select stage</MenuItem>
            {stages.map((s) => <MenuItem key={s.id} value={s.id}>{s.stage_name}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Status *"
            value={statusId}
            onChange={(e) => setStatusId(e.target.value)}
            fullWidth
            size="small"
            sx={{ flex: 1 }}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select status</MenuItem>
            {statuses.map((s) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
          </TextField>
        </Box>
        <TextField
          select
          label="Lead Source"
          value={leadSourceId}
          onChange={(e) => setLeadSourceId(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select source</MenuItem>
          {leadSources.map((ls) => <MenuItem key={ls.id} value={ls.id}>{ls.name}</MenuItem>)}
        </TextField>
        <TextField
          select
          label="Owner *"
          value={ownerId}
          onChange={(e) => setOwnerId(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select owner</MenuItem>
          {users.map((u) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
        <TextField
          label="Win Probability % *"
          type="number"
          value={winProb}
          onChange={(e) => setWinProb(e.target.value)}
          placeholder="Enter Win Probability %"
          fullWidth
          size="small"
          slotProps={{ htmlInput: { min: 0, max: 100 } }}
        />
        <TextField
          label={`Indicative Value (Lakhs)${items.length > 0 ? " (auto)" : ""}`}
          type="number"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          disabled={items.length > 0}
          placeholder="Enter Indicative Value (Lakhs)"
          fullWidth
          size="small"
          slotProps={{ htmlInput: { min: 0, step: "any" } }}
        />
        <Box sx={{ borderTop: "1px solid #f3f4f6", pt: "0.75rem" }}>
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
            <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em" }}>
              Products
            </Typography>
            <Button
              type="button"
              onClick={() => setShowItemsModal(true)}
              sx={{
                px: 1.5, py: 0.5, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900,
                textTransform: "uppercase", letterSpacing: "0.05em", color: "#059669", bgcolor: "#ecfdf5",
                "&:hover": { bgcolor: "#d1fae5" },
              }}
            >
              {items.length > 0 ? `Edit (${items.length})` : "+ Add Products"}
            </Button>
          </Box>
          {items.length > 0 ? (
            <Box sx={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              {items.map((item, i) => (
                <Box key={i} sx={{ display: "flex", alignItems: "center", gap: 1, px: 1.5, py: 0.75, bgcolor: "#f9fafb", borderRadius: "0.75rem", fontSize: "0.75rem" }}>
                  <Typography sx={{ flex: 1, fontWeight: 700, fontSize: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.product_name}
                  </Typography>
                  <Typography sx={{ color: "#9ca3af", fontSize: "inherit", flexShrink: 0 }}>
                    {item.quantity}×₹{item.unit_price_lakhs}L{item.discount_lakhs > 0 ? ` −₹${item.discount_lakhs}L` : ""}
                  </Typography>
                </Box>
              ))}
              <Typography sx={{ textAlign: "right", fontSize: "10px", fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", pr: 0.5 }}>
                Total: ₹{itemsTotal.toFixed(2)}L
              </Typography>
            </Box>
          ) : (
            <Typography sx={{ fontSize: "0.75rem", color: "#9ca3af", fontStyle: "italic" }}>
              No products added
            </Typography>
          )}
        </Box>
      </FormModal>

      {/* Products secondary modal */}
      <FormModal isOpen={showItemsModal} onClose={() => setShowItemsModal(false)} title="Products" onSubmit={async () => {}} submitLabel="Done">
        {items.length > 0 && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
            {items.map((item, i) => (
              <Box key={i} sx={{ px: 1.5, py: 1, bgcolor: "#f9fafb", borderRadius: "0.75rem", fontSize: "0.75rem", display: "flex", flexDirection: "column", gap: 1 }}>
                <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <Typography sx={{ fontWeight: 700, fontSize: "inherit", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {item.product_name}
                  </Typography>
                  <IconButton
                    type="button"
                    size="small"
                    onClick={() => setItems(items.filter((_, j) => j !== i))}
                    sx={{ ml: 1 }}
                  >
                    <Box component="span" sx={{ fontWeight: 700, fontSize: "0.75rem", color: "#f87171", "&:hover": { color: "#dc2626" } }}>×</Box>
                  </IconButton>
                </Box>
                <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1 }}>
                  <TextField
                    label="Qty" type="number" size="small" value={item.quantity}
                    onChange={(e) => setItems(items.map((it, j) => j === i ? { ...it, quantity: Number(e.target.value) } : it))}
                    slotProps={{ htmlInput: { min: 1 } }}
                    sx={{ width: "5rem", "& .MuiOutlinedInput-root": { backgroundColor: "#fff" } }}
                  />
                  <TextField
                    label="Price (₹L)" type="number" size="small" value={item.unit_price_lakhs}
                    onChange={(e) => setItems(items.map((it, j) => j === i ? { ...it, unit_price_lakhs: Number(e.target.value) } : it))}
                    slotProps={{ htmlInput: { min: 0, step: "any" } }}
                    sx={{ width: "7.5rem", "& .MuiOutlinedInput-root": { backgroundColor: "#fff" } }}
                  />
                  <TextField
                    label="Disc (₹L)" type="number" size="small" value={item.discount_lakhs}
                    onChange={(e) => setItems(items.map((it, j) => j === i ? { ...it, discount_lakhs: Number(e.target.value) } : it))}
                    slotProps={{ htmlInput: { min: 0, step: "any" } }}
                    sx={{ width: "7.5rem", "& .MuiOutlinedInput-root": { backgroundColor: "#fff" } }}
                  />
                </Box>
              </Box>
            ))}
            <Typography sx={{ textAlign: "right", fontSize: "10px", fontWeight: 900, color: "#6b7280", textTransform: "uppercase", letterSpacing: "0.05em", pr: 0.5 }}>
              Total: ₹{itemsTotal.toFixed(2)}L
            </Typography>
          </Box>
        )}
        <Box sx={{ borderTop: "1px solid #f3f4f6", pt: "0.75rem", display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography sx={{ fontSize: "10px", fontWeight: 900, color: "#9ca3af", textTransform: "uppercase", letterSpacing: "0.05em", mb: 1 }}>
            Add Product
          </Typography>
          <TextField
            select
            value={itemProdId}
            onChange={(e) => { setItemProdId(e.target.value); setAddItemError(null); }}
            fullWidth
            size="small"
            slotProps={{ select: { displayEmpty: true } }}
          >
            <MenuItem value="">Select product</MenuItem>
            {products.map((p) => <MenuItem key={p.id} value={p.id}>{p.name}</MenuItem>)}
          </TextField>
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 1, mt: 1.5 }}>
            <TextField
              label="Qty" type="number" size="small" value={itemQty}
              onChange={(e) => { setItemQty(e.target.value); setAddItemError(null); }}
              slotProps={{ htmlInput: { min: 1 }, inputLabel: { shrink: true } }}
              sx={{ width: "5rem" }}
            />
            <TextField
              label="Price (₹L)" type="number" size="small" value={itemPrice}
              onChange={(e) => { setItemPrice(e.target.value); setAddItemError(null); }}
              slotProps={{ htmlInput: { min: 0, step: "any" }, inputLabel: { shrink: true } }}
              sx={{ width: "7.5rem" }}
            />
            <TextField
              label="Disc (₹L)" type="number" size="small" value={itemDisc}
              onChange={(e) => { setItemDisc(e.target.value); setAddItemError(null); }}
              slotProps={{ htmlInput: { min: 0, step: "any" }, inputLabel: { shrink: true } }}
              sx={{ width: "7.5rem" }}
            />
          </Box>
          {addItemError && (
            <Alert severity="error" sx={{ fontSize: "0.75rem" }}>
              {addItemError}
            </Alert>
          )}
          <Button
            type="button"
            fullWidth
            onClick={() => {
              if (!itemProdId) { setAddItemError("Select a product"); return; }
              if (Number(itemQty) <= 0) { setAddItemError("Quantity must be greater than 0"); return; }
              if (Number(itemPrice) <= 0) { setAddItemError("Price must be greater than 0"); return; }
              setAddItemError(null);
              const prod = products.find((p) => p.id === itemProdId);
              setItems([...items, { product_id: itemProdId, product_name: prod?.name || "", quantity: Number(itemQty), unit_price_lakhs: Number(itemPrice), discount_lakhs: Number(itemDisc || 0) }]);
              setItemProdId(""); setItemQty("1"); setItemPrice("0"); setItemDisc("0");
            }}
            sx={{
              py: 1, borderRadius: "0.75rem", fontSize: "0.75rem", fontWeight: 900,
              textTransform: "uppercase", letterSpacing: "0.05em", color: "primary.main", bgcolor: "#eff6ff",
              "&:hover": { bgcolor: "#dbeafe" },
            }}
          >
            + Add Product
          </Button>
        </Box>
      </FormModal>
    </>
  );
}
