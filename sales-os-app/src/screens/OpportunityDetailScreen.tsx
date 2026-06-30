import { useState, useRef, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  listOpportunityItems,
  listOpportunitySplits,
  listOpportunityStakeholders,
  patchOpportunity,
  replaceOpportunityItems,
  replaceOpportunitySplits,
  addOpportunityStakeholder,
  removeOpportunityStakeholder,
} from "../services/opportunities";
import { listStakeholders } from "../services/accounts";
import { listStages, listStatuses, listUsers } from "../services/masterData";
import { listProducts } from "../services/products";
import type { PipelineOpportunity } from "../types/api";
import ActivityTimeline from "../components/ActivityTimeline";
import LogActivityModal from "../components/LogActivityModal";
import FormModal from "../components/FormModal";
import { useAuth } from "../contexts/AuthContext";

interface Props {
  opportunity: PipelineOpportunity;
  onBack: () => void;
}

const TABS = [
  { id: "overview",      label: "Overview" },
  { id: "activity",      label: "Activity" },
  { id: "products",      label: "Products" },
  { id: "splits",        label: "Splits" },
  { id: "stakeholders",  label: "Stakeholders" },
] as const;

type TabId = typeof TABS[number]["id"];

// Shared style constants — used by tab components and FormModal fields
const lbl = "block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1";
const inp = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium";

// ---------------------------------------------------------------------------
// Shared presentational helpers
// ---------------------------------------------------------------------------
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
      <div className="text-xs font-medium text-gray-800">{value ?? "—"}</div>
    </div>
  );
}

function StageBadge({ name }: { name: string }) {
  return (
    <span className="px-2 py-1 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-black uppercase tracking-wider">
      {name}
    </span>
  );
}

function StatusBadge({ code, name }: { code: string; name: string }) {
  const colours: Record<string, string> = {
    ACTIVE:  "bg-emerald-50 text-emerald-700",
    ON_HOLD: "bg-amber-50 text-amber-700",
    STALLED: "bg-gray-100 text-gray-500",
    WON:     "bg-blue-50 text-blue-700",
    LOST:    "bg-red-50 text-red-600",
  };
  return (
    <span className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider ${colours[code] ?? "bg-gray-100 text-gray-500"}`}>
      {name}
    </span>
  );
}

function LoadingPlaceholder() {
  return (
    <div className="py-12 flex items-center justify-center text-xs text-gray-300 font-black uppercase tracking-widest animate-pulse">
      Loading…
    </div>
  );
}

function EmptyPlaceholder({ message }: { message: string }) {
  return (
    <div className="py-12 flex items-center justify-center text-xs text-gray-400 text-center px-8">
      {message}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview tab
// ---------------------------------------------------------------------------
function OverviewTab({ opp, onEdit }: { opp: PipelineOpportunity; onEdit: () => void }) {
  return (
    <div className="space-y-4">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
        <div className="flex items-center justify-between mb-4">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Opportunity Details</h4>
          <button
            onClick={onEdit}
            className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider"
          >
            Edit
          </button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Expected Closure" value={opp.expected_closure_date ?? null} />
          <Field label="Demo Start"       value={opp.demo_start_date ?? null} />
          <Field label="PO Number"        value={opp.po_number ?? null} />
          <Field label="SBU"              value={opp.sbu.name} />
        </div>
        <div className="mt-4 pt-4 border-t border-gray-50">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Created</div>
          <div className="text-xs text-gray-500">
            {new Date(opp.created_at).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Products tab
// ---------------------------------------------------------------------------
function ProductsTab({ opportunityId, sbuId }: { opportunityId: string; sbuId: string }) {
  const queryClient = useQueryClient();
  const { data: items, isLoading } = useQuery({
    queryKey: ["opp-items", opportunityId],
    queryFn:  () => listOpportunityItems(opportunityId),
  });

  const [editing, setEditing]     = useState(false);
  const [editItems, setEditItems] = useState<any[]>([]);
  const [products, setProducts]   = useState<any[]>([]);
  const [addProdId, setAddProdId] = useState("");
  const [addQty, setAddQty]       = useState("1");
  const [addPrice, setAddPrice]   = useState("");
  const [addDisc, setAddDisc]     = useState("0");
  const [saving, setSaving]       = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const openEdit = async () => {
    setEditItems(
      (items ?? []).map((i) => ({
        product_id:        i.product_id,
        product_name:      i.product.name,
        quantity:          i.quantity,
        unit_price_lakhs:  parseFloat(i.unit_price_lakhs),
        discount_lakhs:    parseFloat(i.discount_lakhs),
      })),
    );
    setSaveError(null);
    setEditing(true);
    if (products.length === 0) {
      listProducts({ page_size: 100, sbu_id: sbuId } as any)
        .then((d: any) => setProducts(d.items || []))
        .catch(() => {});
    }
  };

  const addItem = () => {
    if (!addProdId || !addPrice) return;
    const prod = products.find((p: any) => p.id === addProdId);
    setEditItems([...editItems, {
      product_id: addProdId, product_name: prod?.name || "",
      quantity: Number(addQty), unit_price_lakhs: Number(addPrice), discount_lakhs: Number(addDisc || 0),
    }]);
    setAddProdId(""); setAddQty("1"); setAddPrice(""); setAddDisc("0");
  };

  const saveItems = async () => {
    setSaving(true); setSaveError(null);
    try {
      await replaceOpportunityItems(
        opportunityId,
        editItems.map((i) => ({
          product_id: i.product_id, quantity: i.quantity,
          unit_price_lakhs: i.unit_price_lakhs, discount_lakhs: i.discount_lakhs,
        })),
      );
      await queryClient.invalidateQueries({ queryKey: ["opp-items", opportunityId] });
      setEditing(false);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save products");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingPlaceholder />;

  if (editing) {
    const total = editItems.reduce((s, i) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Products</h4>
          <div className="flex items-center gap-2">
            <button onClick={() => setEditing(false)} className="px-3 py-1.5 rounded-xl text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all uppercase tracking-wider">Cancel</button>
            <button onClick={saveItems} disabled={saving} className="px-3 py-1.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition-all uppercase tracking-wider disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {saveError && <div className="text-xs text-red-600 font-bold bg-red-50 px-3 py-2 rounded-xl">{saveError}</div>}

        {editItems.length > 0 ? (
          <div className="space-y-2">
            {editItems.map((item, i) => (
              <div key={i} className="bg-white p-3 rounded-2xl border border-gray-100 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold text-xs text-gray-800 truncate">{item.product_name}</div>
                  <button
                    onClick={() => setEditItems(editItems.filter((_, j) => j !== i))}
                    className="text-red-400 hover:text-red-600 font-black ml-2 shrink-0 text-lg leading-none"
                  >×</button>
                </div>
                <div className="flex gap-2">
                  {(["quantity", "unit_price_lakhs", "discount_lakhs"] as const).map((key) => (
                    <div key={key} className="w-20">
                      <div className={lbl}>{key === "quantity" ? "Qty" : key === "unit_price_lakhs" ? "Price ₹L" : "Disc ₹L"}</div>
                      <input
                        type="number" min="0" step="any" value={item[key]}
                        onChange={(e) => setEditItems(editItems.map((it, j) => j === i ? { ...it, [key]: Number(e.target.value) } : it))}
                        className={inp}
                      />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-right text-[10px] font-black text-gray-500 uppercase tracking-wider">
              Total: ₹{total.toFixed(2)}L
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-400 italic text-center py-4">No products — add one below</div>
        )}

        {/* Add product row */}
        <div className="bg-white p-3 rounded-2xl border border-gray-100 space-y-2">
          <div className={lbl}>Add Product</div>
          <select value={addProdId} onChange={(e) => setAddProdId(e.target.value)} className={inp}>
            <option value="">Select product</option>
            {products.map((p: any) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex gap-2">
            {([["Qty", addQty, setAddQty], ["Price ₹L", addPrice, setAddPrice], ["Disc ₹L", addDisc, setAddDisc]] as any[]).map(([label, val, setVal]: any) => (
              <div key={label} className="w-20">
                <div className={lbl}>{label}</div>
                <input type="number" min="0" step="any" value={val} onChange={(e) => setVal(e.target.value)} className={inp} />
              </div>
            ))}
          </div>
          <button
            onClick={addItem} disabled={!addProdId || !addPrice}
            className="w-full py-2 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider disabled:opacity-40"
          >
            + Add Product
          </button>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Products ({items?.length ?? 0})</h4>
        <button onClick={openEdit} className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider">
          {items?.length ? "Edit" : "+ Add"}
        </button>
      </div>
      {!items?.length ? (
        <EmptyPlaceholder message="No products added to this opportunity." />
      ) : (
        <>
          {items.map((item) => (
            <div key={item.id} className="bg-gray-50 rounded-2xl p-3 space-y-0.5">
              <div className="font-bold text-xs text-gray-800">{item.product.name}</div>
              <div className="flex items-center gap-3 text-[10px] text-gray-500">
                <span>Qty: {item.quantity}</span>
                <span>₹{parseFloat(item.unit_price_lakhs).toFixed(2)}L each</span>
                {parseFloat(item.discount_lakhs) > 0 && (
                  <span className="text-red-500">−₹{parseFloat(item.discount_lakhs).toFixed(2)}L disc</span>
                )}
              </div>
              <div className="text-[10px] font-black text-emerald-600">
                ₹{parseFloat(item.extended_value_lakhs).toFixed(2)}L
              </div>
            </div>
          ))}
          <div className="text-right text-xs font-black text-gray-700 pt-2 border-t border-gray-100">
            Total: ₹{items.reduce((s, i) => s + parseFloat(i.extended_value_lakhs), 0).toFixed(2)}L
          </div>
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Splits tab
// ---------------------------------------------------------------------------
function SplitsTab({ opportunityId }: { opportunityId: string }) {
  const queryClient = useQueryClient();
  const { data: splits, isLoading } = useQuery({
    queryKey: ["opp-splits", opportunityId],
    queryFn:  () => listOpportunitySplits(opportunityId),
  });

  const [editing, setEditing]       = useState(false);
  const [editSplits, setEditSplits] = useState<any[]>([]);
  const [users, setUsers]           = useState<any[]>([]);
  const [addUserId, setAddUserId]   = useState("");
  const [addPct, setAddPct]         = useState("");
  const [saving, setSaving]         = useState(false);
  const [saveError, setSaveError]   = useState<string | null>(null);

  const openEdit = async () => {
    setEditSplits(
      (splits ?? []).map((s) => ({
        user_id:          s.user_id,
        display_name:     s.user.display_name,
        split_percentage: parseFloat(s.split_percentage),
      })),
    );
    setSaveError(null);
    setEditing(true);
    if (users.length === 0) {
      listUsers().then((d: any) => setUsers(d)).catch(() => {});
    }
  };

  const addSplit = () => {
    if (!addUserId || !addPct) return;
    if (editSplits.find((s) => s.user_id === addUserId)) return;
    const user = users.find((u: any) => u.id === addUserId);
    setEditSplits([...editSplits, { user_id: addUserId, display_name: user?.display_name || "", split_percentage: Number(addPct) }]);
    setAddUserId(""); setAddPct("");
  };

  const saveSplits = async () => {
    const total = editSplits.reduce((s, sp) => s + sp.split_percentage, 0);
    if (editSplits.length > 0 && Math.abs(total - 100) > 0.01) {
      setSaveError(`Splits must total 100% (currently ${total.toFixed(1)}%)`);
      return;
    }
    setSaving(true); setSaveError(null);
    try {
      await replaceOpportunitySplits(
        opportunityId,
        editSplits.map((s) => ({ user_id: s.user_id, split_percentage: s.split_percentage })),
      );
      await queryClient.invalidateQueries({ queryKey: ["opp-splits", opportunityId] });
      setEditing(false);
    } catch (e: any) {
      setSaveError(e.message || "Failed to save splits");
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) return <LoadingPlaceholder />;

  if (editing) {
    const total = editSplits.reduce((s, sp) => s + sp.split_percentage, 0);
    return (
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Splits</h4>
            <span className={`text-[10px] font-black ${Math.abs(total - 100) < 0.01 ? "text-emerald-600" : "text-amber-500"}`}>
              {total.toFixed(0)}%
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setEditing(false); setSaveError(null); }} className="px-3 py-1.5 rounded-xl text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all uppercase tracking-wider">Cancel</button>
            <button onClick={saveSplits} disabled={saving} className="px-3 py-1.5 rounded-xl text-xs font-black text-white bg-blue-600 hover:bg-blue-700 transition-all uppercase tracking-wider disabled:opacity-50">
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        </div>

        {saveError && <div className="text-xs text-red-600 font-bold bg-red-50 px-3 py-2 rounded-xl">{saveError}</div>}

        {editSplits.map((s, i) => (
          <div key={s.user_id} className="flex items-center gap-3 bg-white px-3 py-2.5 rounded-2xl border border-gray-100">
            <div className="flex-1 text-xs font-bold text-gray-800">{s.display_name}</div>
            <input
              type="number" min="0" max="100" step="any" value={s.split_percentage}
              onChange={(e) => setEditSplits(editSplits.map((sp, j) => j === i ? { ...sp, split_percentage: Number(e.target.value) } : sp))}
              className="w-16 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg text-xs font-black text-blue-600 outline-none text-right"
            />
            <span className="text-xs text-gray-400">%</span>
            <button onClick={() => setEditSplits(editSplits.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 font-black text-lg leading-none">×</button>
          </div>
        ))}

        {/* Add contributor row */}
        <div className="bg-white p-3 rounded-2xl border border-gray-100 space-y-2">
          <div className={lbl}>Add Contributor</div>
          <select value={addUserId} onChange={(e) => setAddUserId(e.target.value)} className={inp}>
            <option value="">Select user</option>
            {users.filter((u: any) => !editSplits.find((s) => s.user_id === u.id)).map((u: any) => (
              <option key={u.id} value={u.id}>{u.display_name}</option>
            ))}
          </select>
          <div>
            <label className={lbl}>Split %</label>
            <input type="number" min="0" max="100" step="any" value={addPct} onChange={(e) => setAddPct(e.target.value)} className={inp} placeholder="e.g. 50" />
          </div>
          <button
            onClick={addSplit} disabled={!addUserId || !addPct}
            className="w-full py-2 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider disabled:opacity-40"
          >
            + Add Contributor
          </button>
        </div>
      </div>
    );
  }

  // View mode
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Splits ({splits?.length ?? 0})</h4>
        <button onClick={openEdit} className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider">
          {splits?.length ? "Edit" : "+ Add"}
        </button>
      </div>
      {!splits?.length ? (
        <EmptyPlaceholder message="No contributor splits defined." />
      ) : (
        splits.map((s) => (
          <div key={s.user_id} className="flex items-center justify-between bg-gray-50 rounded-2xl px-3 py-2.5">
            <span className="text-xs font-bold text-gray-800">{s.user.display_name}</span>
            <span className="text-xs font-black text-blue-600">{parseFloat(s.split_percentage).toFixed(0)}%</span>
          </div>
        ))
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Stakeholders tab
// ---------------------------------------------------------------------------
function StakeholdersTab({ opportunityId, accountId }: { opportunityId: string; accountId: string }) {
  const queryClient = useQueryClient();
  const { data: links, isLoading } = useQuery({
    queryKey: ["opp-stakeholders", opportunityId],
    queryFn:  () => listOpportunityStakeholders(opportunityId),
  });

  const [showAdd, setShowAdd]                         = useState(false);
  const [accountStakeholders, setAccountStakeholders] = useState<any[]>([]);
  const [addStakeholderId, setAddStakeholderId]       = useState("");
  const [addInfluence, setAddInfluence]               = useState("");
  const [addRole, setAddRole]                         = useState("");
  const [addNotes, setAddNotes]                       = useState("");
  const [linking, setLinking]                         = useState(false);
  const [linkError, setLinkError]                     = useState<string | null>(null);

  const openAdd = async () => {
    setAddStakeholderId(""); setAddInfluence(""); setAddRole(""); setAddNotes("");
    setLinkError(null);
    setShowAdd(true);
    if (accountStakeholders.length === 0) {
      listStakeholders(accountId as any).then((d: any) => setAccountStakeholders(d)).catch(() => {});
    }
  };

  const handleLink = async () => {
    if (!addStakeholderId) { setLinkError("Select a stakeholder"); return; }
    setLinking(true); setLinkError(null);
    try {
      await addOpportunityStakeholder(opportunityId, {
        stakeholder_id: addStakeholderId,
        influence_level: addInfluence || null,
        decision_role:   addRole.trim() || null,
        notes:           addNotes.trim() || null,
      });
      await queryClient.invalidateQueries({ queryKey: ["opp-stakeholders", opportunityId] });
      setShowAdd(false);
    } catch (e: any) {
      setLinkError(e.message || "Failed to link stakeholder");
    } finally {
      setLinking(false);
    }
  };

  const handleUnlink = async (stakeholderId: string) => {
    try {
      await removeOpportunityStakeholder(opportunityId, stakeholderId);
      await queryClient.invalidateQueries({ queryKey: ["opp-stakeholders", opportunityId] });
    } catch {}
  };

  if (isLoading) return <LoadingPlaceholder />;

  const linkedIds  = new Set((links ?? []).map((l) => l.stakeholder_id));
  const available  = accountStakeholders.filter((s: any) => !linkedIds.has(s.id));

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between mb-1">
        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">Stakeholders ({(links ?? []).length})</h4>
        <button onClick={openAdd} className="px-3 py-1.5 rounded-xl text-xs font-black text-violet-600 bg-violet-50 hover:bg-violet-100 transition-all uppercase tracking-wider">
          + Link
        </button>
      </div>

      {!links?.length && !showAdd && <EmptyPlaceholder message="No stakeholders linked to this opportunity." />}

      {links?.map((lnk) => (
        <div key={lnk.stakeholder_id} className="bg-white rounded-2xl px-3 py-2.5 border border-gray-100">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="font-bold text-xs text-gray-800">{lnk.stakeholder.name}</div>
              <div className="flex items-center gap-2 mt-0.5 text-[10px] text-gray-500">
                {lnk.influence_level && (
                  <span className={`font-black uppercase ${
                    lnk.influence_level === "HIGH" ? "text-red-500" :
                    lnk.influence_level === "MEDIUM" ? "text-amber-500" : "text-gray-400"
                  }`}>{lnk.influence_level}</span>
                )}
                {lnk.decision_role && <span>{lnk.decision_role}</span>}
              </div>
              {lnk.notes && <div className="text-[10px] text-gray-400 italic mt-0.5">{lnk.notes}</div>}
            </div>
            <button
              onClick={() => handleUnlink(lnk.stakeholder_id)}
              className="text-red-400 hover:text-red-600 font-black shrink-0 text-lg leading-none px-1 mt-0.5"
            >×</button>
          </div>
        </div>
      ))}

      {showAdd && (
        <div className="bg-white p-3 rounded-2xl border border-gray-100 space-y-2">
          <div className={lbl}>Link Stakeholder</div>
          {linkError && <div className="text-xs text-red-600 font-bold bg-red-50 px-3 py-2 rounded-xl">{linkError}</div>}
          <select value={addStakeholderId} onChange={(e) => setAddStakeholderId(e.target.value)} className={inp}>
            <option value="">Select stakeholder</option>
            {available.map((s: any) => (
              <option key={s.id} value={s.id}>{s.name}{s.designation ? ` — ${s.designation}` : ""}</option>
            ))}
          </select>
          <div>
            <label className={lbl}>Influence Level</label>
            <select value={addInfluence} onChange={(e) => setAddInfluence(e.target.value)} className={inp}>
              <option value="">None</option>
              <option value="HIGH">High</option>
              <option value="MEDIUM">Medium</option>
              <option value="LOW">Low</option>
            </select>
          </div>
          <div>
            <label className={lbl}>Decision Role</label>
            <input type="text" value={addRole} onChange={(e) => setAddRole(e.target.value)} className={inp} placeholder="e.g. Approver" />
          </div>
          <div>
            <label className={lbl}>Notes</label>
            <input type="text" value={addNotes} onChange={(e) => setAddNotes(e.target.value)} className={inp} placeholder="Optional" />
          </div>
          <div className="flex gap-2 pt-1">
            <button
              onClick={() => { setShowAdd(false); setLinkError(null); }}
              className="flex-1 py-2 rounded-xl text-xs font-black text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all uppercase tracking-wider"
            >Cancel</button>
            <button
              onClick={handleLink} disabled={!addStakeholderId || linking}
              className="flex-1 py-2 rounded-xl text-xs font-black text-violet-600 bg-violet-50 hover:bg-violet-100 transition-all uppercase tracking-wider disabled:opacity-40"
            >{linking ? "Linking…" : "Link"}</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Screen
// ---------------------------------------------------------------------------
export default function OpportunityDetailScreen({ opportunity: initialOpp, onBack }: Props) {
  const { userProfile }                           = useAuth();
  const [opp, setOpp]                             = useState<PipelineOpportunity>(initialOpp);
  const [activeTab, setActiveTab]                 = useState<TabId>("overview");
  const [showLogActivity, setShowLogActivity]     = useState(false);
  const chipBarRef = useRef<HTMLDivElement>(null);

  // Overview edit state
  const [showEditOpp, setShowEditOpp]             = useState(false);
  const [stages, setStages]                       = useState<any[]>([]);
  const [oppStatuses, setOppStatuses]             = useState<any[]>([]);
  const [users, setUsers]                         = useState<any[]>([]);
  const [editName, setEditName]                   = useState("");
  const [editStageId, setEditStageId]             = useState("");
  const [editStatusId, setEditStatusId]           = useState("");
  const [editOwnerId, setEditOwnerId]             = useState("");
  const [editWinProb, setEditWinProb]             = useState("");
  const [editValue, setEditValue]                 = useState("");
  const [editClosureDate, setEditClosureDate]     = useState("");
  const [editDemoStart, setEditDemoStart]         = useState("");
  const [editPoNumber, setEditPoNumber]           = useState("");

  const handleTabChange = useCallback((tabId: TabId) => {
    setActiveTab(tabId);
    setTimeout(() => {
      const container = chipBarRef.current;
      if (container) {
        const chip = container.querySelector(`[data-tab="${tabId}"]`) as HTMLElement | null;
        if (chip) {
          const scrollLeft = chip.offsetLeft - container.offsetWidth / 2 + chip.offsetWidth / 2;
          container.scrollTo({ left: scrollLeft, behavior: "smooth" });
        }
      }
    }, 50);
  }, []);

  const openEditOpp = async () => {
    setEditName(opp.name);
    setEditStageId(opp.stage.id);
    setEditStatusId(opp.status.id);
    setEditOwnerId(opp.owner.id);
    setEditWinProb(String(parseFloat(opp.win_probability)));
    setEditValue(opp.indicative_value ? String(parseFloat(opp.indicative_value)) : "");
    setEditClosureDate(opp.expected_closure_date ?? "");
    setEditDemoStart(opp.demo_start_date ?? "");
    setEditPoNumber(opp.po_number ?? "");
    setShowEditOpp(true);
    const loads: Promise<any>[] = [];
    if (stages.length === 0)      loads.push(listStages().then((d: any) => setStages(d)).catch(() => {}));
    if (oppStatuses.length === 0) loads.push(listStatuses().then((d: any) => setOppStatuses(d)).catch(() => {}));
    if (users.length === 0)       loads.push(listUsers().then((d: any) => setUsers(d)).catch(() => {}));
    await Promise.all(loads);
  };

  const handleUpdateOpp = async () => {
    if (!editName.trim()) throw new Error("Name is required");
    await patchOpportunity(opp.id, {
      name:                  editName.trim(),
      stage_id:              editStageId  || undefined,
      status_id:             editStatusId || undefined,
      owner_id:              editOwnerId  || undefined,
      win_probability:       editWinProb !== "" ? Number(editWinProb) : undefined,
      indicative_value:      editValue   !== "" ? Number(editValue)   : null,
      expected_closure_date: editClosureDate || null,
      demo_start_date:       editDemoStart   || null,
      po_number:             editPoNumber.trim() || null,
    });
    // Reconstruct nested objects from loaded master data so header + strip re-render immediately
    const newStage  = stages.find((s: any) => s.id === editStageId);
    const newStatus = oppStatuses.find((s: any) => s.id === editStatusId);
    const newOwner  = users.find((u: any) => u.id === editOwnerId);
    setOpp((prev) => ({
      ...prev,
      name:                  editName.trim(),
      win_probability:       editWinProb !== "" ? editWinProb : prev.win_probability,
      indicative_value:      editValue   !== "" ? editValue   : null,
      expected_closure_date: editClosureDate || null,
      demo_start_date:       editDemoStart   || null,
      po_number:             editPoNumber.trim() || null,
      ...(newStage  && { stage:  { id: newStage.id,  stage_code: newStage.stage_code,   stage_name: newStage.stage_name,   display_order: newStage.display_order,   default_win_probability: newStage.default_win_probability } }),
      ...(newStatus && { status: { id: newStatus.id, status_code: newStatus.status_code, status_name: newStatus.status_name, is_terminal: newStatus.is_terminal ?? prev.status.is_terminal } }),
      ...(newOwner  && { owner:  { id: newOwner.id,  display_name: newOwner.display_name } }),
    }));
  };

  return (
    <div className="flex-1 overflow-hidden flex flex-col bg-gray-50">
      {/* Header */}
      <div className="px-4 pt-4 bg-gray-50 shrink-0">
        <div className="flex items-center gap-3 mb-3">
          <button
            onClick={onBack}
            className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:bg-gray-200 transition-all shrink-0"
            aria-label="Back"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="flex-1 min-w-0">
            <h2 className="font-extrabold text-xl text-gray-800 tracking-tight leading-tight truncate">{opp.name}</h2>
            <div className="text-xs font-medium text-gray-500 mt-0.5 truncate">{opp.account.name}</div>
            <div className="flex items-center gap-2 mt-1.5 flex-wrap">
              <StageBadge name={opp.stage.stage_name} />
              <StatusBadge code={opp.status.status_code} name={opp.status.status_name} />
            </div>
          </div>
        </div>

        {/* Stats strip */}
        <div className="flex items-center justify-around bg-white rounded-2xl shadow-sm border border-gray-100 px-4 py-3 mb-4">
          <div className="text-center">
            <div className={`text-xl font-black ${
              parseFloat(opp.win_probability) >= 70 ? "text-emerald-600" :
              parseFloat(opp.win_probability) >= 40 ? "text-amber-500" : "text-red-500"
            }`}>
              {parseFloat(opp.win_probability).toFixed(0)}%
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">Win Prob</div>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center">
            <div className="text-xl font-black text-emerald-600">
              {opp.indicative_value ? `₹${parseFloat(opp.indicative_value).toFixed(1)}L` : "—"}
            </div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">Value</div>
          </div>
          <div className="w-px h-8 bg-gray-100" />
          <div className="text-center">
            <div className="text-sm font-black text-gray-700 truncate max-w-[80px]">{opp.owner.display_name}</div>
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mt-0.5">Owner</div>
          </div>
        </div>

        {/* Tab chip bar */}
        <div className="relative mb-4">
          <div ref={chipBarRef} className="flex gap-2 overflow-x-auto pb-1 [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: "none", paddingRight: "50vw" }}>
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  data-tab={tab.id}
                  onClick={() => handleTabChange(tab.id)}
                  className={`shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 border focus:outline-none active:scale-95 ${
                    isActive
                      ? "bg-blue-600 text-white border-blue-600 shadow-sm"
                      : "bg-white text-gray-600 border-gray-200 hover:border-blue-300 hover:text-blue-600"
                  }`}
                >
                  {isActive && (
                    <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  )}
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div className="absolute right-0 top-0 h-full w-10 pointer-events-none" style={{ background: "linear-gradient(to left, #f9fafb, transparent)" }} />
        </div>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {activeTab === "overview"     && <OverviewTab opp={opp} onEdit={openEditOpp} />}
        {activeTab === "products"     && <ProductsTab opportunityId={opp.id} sbuId={opp.sbu.id} />}
        {activeTab === "splits"       && <SplitsTab opportunityId={opp.id} />}
        {activeTab === "stakeholders" && <StakeholdersTab opportunityId={opp.id} accountId={opp.account.id} />}
        {activeTab === "activity"     && (
          <ActivityTimeline opportunityId={opp.id} accountId={opp.account.id} onLogActivity={() => setShowLogActivity(true)} />
        )}
      </div>

      {/* Edit Opportunity modal */}
      <FormModal isOpen={showEditOpp} onClose={() => setShowEditOpp(false)} title="Edit Opportunity" onSubmit={handleUpdateOpp}>
        <div><label className={lbl}>Name *</label><input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className={inp} autoFocus /></div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className={lbl}>Stage</label>
            <select value={editStageId} onChange={(e) => { const s: any = stages.find((x: any) => x.id === e.target.value); setEditStageId(e.target.value); if (s) setEditWinProb(String(s.default_win_probability)); }} className={inp}>
              <option value="">Select stage</option>
              {stages.map((s: any) => <option key={s.id} value={s.id}>{s.stage_name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className={lbl}>Status</label>
            <select value={editStatusId} onChange={(e) => setEditStatusId(e.target.value)} className={inp}>
              <option value="">Select status</option>
              {oppStatuses.map((s: any) => <option key={s.id} value={s.id}>{s.status_name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={lbl}>Owner</label>
          <select value={editOwnerId} onChange={(e) => setEditOwnerId(e.target.value)} className={inp}>
            <option value="">Select owner</option>
            {users.map((u: any) => <option key={u.id} value={u.id}>{u.display_name}</option>)}
          </select>
        </div>
        <div><label className={lbl}>Win Probability %</label><input type="number" min="0" max="100" value={editWinProb} onChange={(e) => setEditWinProb(e.target.value)} className={inp} placeholder="0–100" /></div>
        <div><label className={lbl}>Indicative Value (₹ Lakhs)</label><input type="number" step="any" min="0" value={editValue} onChange={(e) => setEditValue(e.target.value)} className={inp} placeholder="e.g. 25.50" /></div>
        <div><label className={lbl}>Expected Closure Date</label><input type="date" value={editClosureDate} onChange={(e) => setEditClosureDate(e.target.value)} className={inp} /></div>
        <div><label className={lbl}>Demo Start Date</label><input type="date" value={editDemoStart} onChange={(e) => setEditDemoStart(e.target.value)} className={inp} /></div>
        <div><label className={lbl}>PO Number</label><input type="text" value={editPoNumber} onChange={(e) => setEditPoNumber(e.target.value)} className={inp} placeholder="e.g. PO-2024-001" /></div>
      </FormModal>

      <LogActivityModal
        isOpen={showLogActivity}
        onClose={() => setShowLogActivity(false)}
        accountId={opp.account.id}
        opportunityId={opp.id}
        currentUserId={(userProfile as any)?.id}
      />
    </div>
  );
}
