/* eslint-disable no-unused-vars, react-hooks/exhaustive-deps, react-hooks/refs, react-hooks/immutability --
   Pre-existing debt in this file's manual .then()/SWR-cache pattern, which
   docs/Frontend-Implementation-Standards.md §9 marks superseded (pending
   React Query migration). TODO: delete this disable block when this file
   migrates (§9) — do not hand-fix individually, the rewrite removes the
   pattern that causes these. */
import { useEffect, useState, useCallback, useRef } from "react";
import { Box, MenuItem, TextField } from "@mui/material";
import { listAllProjects } from "../services/projects";
import { listAccounts, createProject, updateProject, listOpportunities, updateOpportunity, createOpportunity, listOpportunityItems, addOpportunityItem, deleteOpportunityItem } from "../services/accounts";
import { listProjectStatuses, listUsers, listStages, listStatuses, listLeadSources, listHoldReasons, listLossReasons } from "../services/masterData";
import { listProducts } from "../services/products";
import { useAuth } from "../contexts/AuthContext";
import FormModal from "../components/FormModal";
import ActivityTimeline from "../components/ActivityTimeline";
import useDebouncedValue from "../hooks/useDebouncedValue";

const CACHE_TTL_MS = 30_000;
const projectListCache = new Map();

function getCacheKey(params) {
  return JSON.stringify(params);
}

function getCached(key) {
  const entry = projectListCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    projectListCache.delete(key);
    return null;
  }
  return entry;
}

function setCache(key, data) {
  projectListCache.set(key, { ...data, fetchedAt: Date.now() });
}

function ProjectDetailView({ project: p, onBack, onEdit, refreshOppsRef, openLogActivityRef, onSelectOpportunity }) {
  const { userProfile } = useAuth();
  const [opps, setOpps] = useState([]);
  const [oppsLoading, setOppsLoading] = useState(true);

  const [editingOpp, setEditingOpp] = useState(null);
  const [editOppName, setEditOppName] = useState("");
  const [editOppStageId, setEditOppStageId] = useState("");
  const [editOppStatusId, setEditOppStatusId] = useState("");
  const [editOppOwnerId, setEditOppOwnerId] = useState("");
  const [editOppWinProb, setEditOppWinProb] = useState("");
  const [editOppValue, setEditOppValue] = useState("");
  const [oppStages, setOppStages] = useState([]);
  const [oppStatuses, setOppStatuses] = useState([]);
  const [oppUsers, setOppUsers] = useState([]);

  const [oppProducts, setOppProducts] = useState([]);
  const [editOppItems, setEditOppItems] = useState([]);
  const [editOppOriginalItemIds, setEditOppOriginalItemIds] = useState([]);
  const [editOppItemProdId, setEditOppItemProdId] = useState("");
  const [editOppItemQty, setEditOppItemQty] = useState("1");
  const [editOppItemPrice, setEditOppItemPrice] = useState("");
  const [editOppItemDisc, setEditOppItemDisc] = useState("0");
  const [showEditOppItemsModal, setShowEditOppItemsModal] = useState(false);
  const [leadSources, setLeadSources] = useState([]);
  const [editOppLeadSourceId, setEditOppLeadSourceId] = useState("");
  const [holdReasons, setHoldReasons] = useState([]);
  const [lossReasons, setLossReasons] = useState([]);
  const [editOppPoNumber, setEditOppPoNumber] = useState("");
  const [editOppHoldReasonId, setEditOppHoldReasonId] = useState("");
  const [editOppReactivationDate, setEditOppReactivationDate] = useState("");
  const [editOppLossReasonId, setEditOppLossReasonId] = useState("");
  const [editOppCompetitorName, setEditOppCompetitorName] = useState("");

  const [showAddOpp, setShowAddOpp] = useState(false);
  const [addOppName, setAddOppName] = useState("");
  const [addOppStageId, setAddOppStageId] = useState("");
  const [addOppStatusId, setAddOppStatusId] = useState("");
  const [addOppOwnerId, setAddOppOwnerId] = useState("");
  const [addOppWinProb, setAddOppWinProb] = useState("");
  const [addOppValue, setAddOppValue] = useState("");
  const [addOppLeadSourceId, setAddOppLeadSourceId] = useState("");
  const [addOppDemoStart, setAddOppDemoStart] = useState("");
  const [addOppDemoEnd, setAddOppDemoEnd] = useState("");
  const [addOppClosureDate, setAddOppClosureDate] = useState("");
  const [addOppPoNumber, setAddOppPoNumber] = useState("");

  const loadOpps = () => {
    setOppsLoading(true);
    listOpportunities(p.account.id)
      .then((all) => setOpps(all.filter((o) => o.project_id === p.id)))
      .catch(() => setOpps([]))
      .finally(() => setOppsLoading(false));
  };

  useEffect(() => { loadOpps(); }, [p.id, p.account.id]);

  if (refreshOppsRef) refreshOppsRef.current = loadOpps;

  useEffect(() => {
    if (editOppItems.length > 0) {
      const total = editOppItems.reduce((s, i) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0);
      setEditOppValue(total.toFixed(2));
    }
  }, [editOppItems]);

  async function openEditOpp(opp) {
    setEditingOpp(opp);
    setEditOppName(opp.name || "");
    setEditOppStageId(opp.stage?.id || "");
    setEditOppStatusId(opp.status?.id || "");
    setEditOppOwnerId(opp.owner?.id || "");
    setEditOppWinProb(String(opp.win_probability ?? ""));
    setEditOppValue(opp.indicative_value != null ? String(opp.indicative_value) : "");
    setEditOppItems([]); setEditOppOriginalItemIds([]);
    setEditOppItemProdId(""); setEditOppItemQty("1"); setEditOppItemPrice(""); setEditOppItemDisc("0");
    setEditOppLeadSourceId(opp.lead_source_id || "");
    setEditOppPoNumber(opp.po_number || "");
    setEditOppHoldReasonId(opp.hold_reason_id || "");
    setEditOppReactivationDate(opp.reactivation_date || "");
    setEditOppLossReasonId(opp.loss_reason_id || "");
    setEditOppCompetitorName(opp.competitor_name || "");
    await Promise.all([
      oppStages.length === 0 && listStages().then(setOppStages).catch(() => {}),
      oppStatuses.length === 0 && listStatuses().then(setOppStatuses).catch(() => {}),
      oppUsers.length === 0 && listUsers().then(setOppUsers).catch(() => {}),
      oppProducts.length === 0 && listProducts({ page_size: 100, sbu_id: userProfile?.sbu?.id }).then((d) => setOppProducts(d.items || [])).catch(() => {}),
      leadSources.length === 0 && listLeadSources().then(setLeadSources).catch(() => {}),
      holdReasons.length === 0 && listHoldReasons().then(setHoldReasons).catch(() => {}),
      lossReasons.length === 0 && listLossReasons().then(setLossReasons).catch(() => {}),
      listOpportunityItems(opp.id).then((items) => {
        const mapped = items.map((i) => ({
          id: i.id,
          product_id: i.product_id,
          product_name: i.product?.name || "",
          quantity: i.quantity,
          unit_price_lakhs: Number(i.unit_price_lakhs),
          discount_lakhs: Number(i.discount_lakhs),
        }));
        setEditOppItems(mapped);
        setEditOppOriginalItemIds(mapped.map((i) => i.id));
      }).catch(() => {}),
    ]);
  }

  async function handleUpdateOpp() {
    if (!editOppName.trim()) throw new Error("Opportunity name is required");
    // BR-OP-02/03/05: status-gated required fields. Re-checked/re-sent on every save
    // while the selected status is On Hold/Lost/Won, same pattern as Customer360Screen.tsx.
    const _newStatus = oppStatuses.find((s) => s.id === editOppStatusId);
    const _selectedLossReason = lossReasons.find((r) => r.id === editOppLossReasonId);
    if (_newStatus?.status_code === "ON_HOLD") {
      if (!editOppHoldReasonId) throw new Error("Hold Reason is required to put an opportunity On-Hold");
      if (!editOppReactivationDate) throw new Error("Reactivation Date is required to put an opportunity On-Hold");
      if (editOppReactivationDate <= new Date().toISOString().slice(0, 10)) throw new Error("Reactivation Date must be a future date");
    }
    if (_newStatus?.status_code === "LOST") {
      if (!editOppLossReasonId) throw new Error("Loss Reason is required to mark an opportunity as Lost");
      if (_selectedLossReason?.reason_code === "COMPETITOR_WON" && !editOppCompetitorName.trim()) {
        throw new Error("Competitor Name is required when Loss Reason is 'Competitor Won'");
      }
    }
    if (_newStatus?.status_code === "WON" && !editOppPoNumber.trim()) {
      throw new Error("PO Number is required to mark an opportunity as Won");
    }
    const payload = {
      name: editOppName.trim(),
      stage_id: editOppStageId || undefined,
      status_id: editOppStatusId || undefined,
      owner_id: editOppOwnerId || undefined,
      win_probability: editOppWinProb !== "" ? Number(editOppWinProb) : undefined,
    };
    if (editOppValue !== "") payload.indicative_value = Number(editOppValue);
    payload.lead_source_id = editOppLeadSourceId || null;
    payload.po_number = editOppPoNumber.trim() || null;
    if (_newStatus?.status_code === "ON_HOLD") {
      payload.hold_reason_id = editOppHoldReasonId;
      payload.reactivation_date = editOppReactivationDate;
    }
    if (_newStatus?.status_code === "LOST") {
      payload.loss_reason_id = editOppLossReasonId;
      if (editOppCompetitorName.trim()) payload.competitor_name = editOppCompetitorName.trim();
    }
    await updateOpportunity(editingOpp.id, payload);
    const currentItemIds = editOppItems.filter((i) => i.id).map((i) => i.id);
    const toDelete = editOppOriginalItemIds.filter((id) => !currentItemIds.includes(id));
    const toAdd = editOppItems.filter((i) => !i.id);
    await Promise.all([
      ...toDelete.map((id) => deleteOpportunityItem(id).catch(() => {})),
      ...toAdd.map((i) => addOpportunityItem(editingOpp.id, {
        product_id: i.product_id,
        quantity: i.quantity,
        unit_price_lakhs: i.unit_price_lakhs,
        discount_lakhs: i.discount_lakhs,
      }).catch(() => {})),
    ]);
    const all = await listOpportunities(p.account.id);
    setOpps(all.filter((o) => o.project_id === p.id));
    setEditingOpp(null);
  }

  async function openAddOpp() {
    setAddOppName(p.name);
    setAddOppStageId(""); setAddOppStatusId(""); setAddOppOwnerId("");
    setAddOppWinProb(""); setAddOppValue("");
    setAddOppLeadSourceId(""); setAddOppDemoStart(""); setAddOppDemoEnd("");
    setAddOppClosureDate(""); setAddOppPoNumber("");
    setShowAddOpp(true);
    await Promise.all([
      oppStages.length === 0 && listStages().then(setOppStages).catch(() => {}),
      oppStatuses.length === 0 && listStatuses().then(setOppStatuses).catch(() => {}),
      oppUsers.length === 0 && listUsers().then(setOppUsers).catch(() => {}),
      leadSources.length === 0 && listLeadSources().then(setLeadSources).catch(() => {}),
    ]);
  }

  async function handleCreateOpp() {
    if (!addOppName.trim()) throw new Error("Opportunity name is required");
    if (!addOppStageId) throw new Error("Stage is required");
    if (!addOppStatusId) throw new Error("Status is required");
    if (!addOppOwnerId) throw new Error("Owner is required");
    if (addOppWinProb === "") throw new Error("Win probability is required");
    const payload = {
      name: addOppName.trim(),
      stage_id: addOppStageId,
      status_id: addOppStatusId,
      owner_id: addOppOwnerId,
      win_probability: Number(addOppWinProb),
      project_id: p.id,
    };
    if (addOppValue !== "") payload.indicative_value = Number(addOppValue);
    if (addOppLeadSourceId) payload.lead_source_id = addOppLeadSourceId;
    if (addOppDemoStart) payload.demo_start_date = addOppDemoStart;
    if (addOppDemoEnd) payload.demo_end_date = addOppDemoEnd;
    if (addOppClosureDate) payload.expected_closure_date = addOppClosureDate;
    if (addOppPoNumber.trim()) payload.po_number = addOppPoNumber.trim();
    await createOpportunity(p.account.id, payload);
    const all = await listOpportunities(p.account.id);
    setOpps(all.filter((o) => o.project_id === p.id));
    setShowAddOpp(false);
  }

  const fields = [
    { label: "Account", value: p.account?.name },
    { label: "Status", value: p.status?.status_name },
    { label: "Owner", value: p.owner?.display_name },
    { label: "Bid Submission Date", value: p.bid_submission_date || "—" },
  ];

  const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1";
  const inputClass = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium";
  const editOppStatusCode = oppStatuses.find((s) => s.id === editOppStatusId)?.status_code;
  const editOppLossReasonCode = lossReasons.find((r) => r.id === editOppLossReasonId)?.reason_code;

  return (
    <>
      <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 animate-in fade-in duration-200">
        {/* Fixed header */}
        <div className="px-4 pt-4 bg-gray-50">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onBack}
              className="flex items-center justify-center w-10 h-10 rounded-full text-gray-600 hover:bg-gray-200 transition-all shrink-0"
              aria-label="Back"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </button>
            <div className="flex-1 min-w-0">
              <h2 className="font-extrabold text-xl text-gray-800 tracking-tight leading-tight truncate">{p.name}</h2>
            </div>
            <button
              onClick={onEdit}
              className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider shrink-0"
            >
              Edit
            </button>
          </div>
        </div>
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4 space-y-4">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4">
              Project Details
            </h4>
            <div className="space-y-4">
              {fields.map((f) => (
                <div key={f.label}>
                  <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{f.label}</div>
                  <div className="font-bold text-gray-800">{f.value || "—"}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Opportunities */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-4">
              <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">
                Opportunities
              </h4>
              <button
                type="button"
                onClick={openAddOpp}
                className="px-3 py-1.5 rounded-xl text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all uppercase tracking-wider shrink-0"
              >
                + Add
              </button>
            </div>
            {oppsLoading ? (
              <div className="text-center py-4 text-gray-400 font-bold text-sm animate-pulse">Loading...</div>
            ) : opps.length === 0 ? (
              <div className="text-center py-4 text-gray-400 italic text-sm">No opportunities linked to this project.</div>
            ) : (
              <div className="space-y-3">
                {opps.map((opp) => (
                  <div
                    key={opp.id}
                    onClick={() => onSelectOpportunity?.({ id: opp.id, name: opp.name })}
                    className={`flex items-center justify-between gap-3 p-3 bg-gray-50 rounded-xl${onSelectOpportunity ? " cursor-pointer hover:bg-gray-100" : ""}`}
                  >
                    <div className="min-w-0">
                      <div className="font-bold text-gray-800 text-sm truncate">{opp.name}</div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="px-2 py-0.5 rounded-lg text-[10px] font-black border bg-emerald-50 text-emerald-700 border-emerald-200">
                          {opp.stage?.stage_name}
                        </span>
                        <span className="text-[10px] font-bold text-gray-400">{opp.win_probability}% win</span>
                        {opp.indicative_value != null && (
                          <span className="text-[10px] font-bold text-gray-400">₹{opp.indicative_value}L</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); openEditOpp(opp); }}
                      className="px-3 py-1.5 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider shrink-0"
                    >
                      Edit
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Activity */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
            <ActivityTimeline projectId={p.id} onLogActivity={() => openLogActivityRef?.current?.()} />
          </div>
        </div>
      </div>

      {/* Edit Opportunity Modal */}
      <FormModal
        isOpen={editingOpp !== null}
        onClose={() => setEditingOpp(null)}
        title="Edit Opportunity"
        onSubmit={handleUpdateOpp}
      >
        {editingOpp && (
          <div className="px-3 py-2 bg-blue-50 rounded-xl text-xs font-bold text-blue-700 mb-1">
            {p.name}
          </div>
        )}
        <div>
          <label className={labelClass}>Name *</label>
          <input type="text" value={editOppName} onChange={(e) => setEditOppName(e.target.value)} className={inputClass} autoFocus />
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className={labelClass}>Stage</label>
            <select value={editOppStageId} onChange={(e) => { const s = oppStages.find((x) => x.id === e.target.value); setEditOppStageId(e.target.value); if (s) setEditOppWinProb(String(s.default_win_probability)); }} className={inputClass}>
              <option value="">Select stage</option>
              {oppStages.map((s) => <option key={s.id} value={s.id}>{s.stage_name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className={labelClass}>Status</label>
            <select value={editOppStatusId} onChange={(e) => setEditOppStatusId(e.target.value)} className={inputClass}>
              <option value="">Select status</option>
              {oppStatuses.map((s) => <option key={s.id} value={s.id}>{s.status_name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={labelClass}>Lead Source</label>
          <select value={editOppLeadSourceId} onChange={(e) => setEditOppLeadSourceId(e.target.value)} className={inputClass}>
            <option value="">Select source</option>
            {leadSources.map((ls) => <option key={ls.id} value={ls.id}>{ls.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Owner</label>
          <select value={editOppOwnerId} onChange={(e) => setEditOppOwnerId(e.target.value)} className={inputClass}>
            <option value="">Select owner</option>
            {oppUsers.map((u) => <option key={u.id} value={u.id}>{u.display_name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Win Probability %</label>
          <input type="number" min="0" max="100" value={editOppWinProb} onChange={(e) => setEditOppWinProb(e.target.value)} className={inputClass} placeholder="0 – 100" />
        </div>
        <div>
          <label className={labelClass}>
            Indicative Value (Lakhs)
            {editOppItems.length > 0 && <span className="ml-1 text-blue-400 font-normal normal-case tracking-normal">(auto)</span>}
          </label>
          <input type="number" step="any" min="0" value={editOppValue} onChange={(e) => setEditOppValue(e.target.value)} readOnly={editOppItems.length > 0} className={editOppItems.length > 0 ? "w-full px-3 py-2 bg-gray-100 border border-gray-200 rounded-xl outline-none text-sm font-medium text-gray-500 cursor-not-allowed" : inputClass} placeholder="e.g. 25.50" />
        </div>
        <TextField label="PO Number" value={editOppPoNumber} onChange={(e) => setEditOppPoNumber(e.target.value)} placeholder="e.g. PO-2024-001" fullWidth size="small" />
        {editOppStatusCode === "ON_HOLD" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 1.5, borderRadius: "0.75rem", bgcolor: "#fffbeb", border: "1px solid #fde68a" }}>
            <TextField
              select label="Hold Reason *" value={editOppHoldReasonId} onChange={(e) => setEditOppHoldReasonId(e.target.value)}
              fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Select reason</MenuItem>
              {holdReasons.map((r) => <MenuItem key={r.id} value={r.id}>{r.reason_name}</MenuItem>)}
            </TextField>
            <TextField
              label="Reactivation Date *" type="date" value={editOppReactivationDate} onChange={(e) => setEditOppReactivationDate(e.target.value)}
              fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }}
            />
          </Box>
        )}
        {editOppStatusCode === "LOST" && (
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, p: 1.5, borderRadius: "0.75rem", bgcolor: "#fef2f2", border: "1px solid #fecaca" }}>
            <TextField
              select label="Loss Reason *" value={editOppLossReasonId} onChange={(e) => setEditOppLossReasonId(e.target.value)}
              fullWidth size="small" slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
            >
              <MenuItem value="">Select reason</MenuItem>
              {lossReasons.map((r) => <MenuItem key={r.id} value={r.id}>{r.reason_name}</MenuItem>)}
            </TextField>
            {editOppLossReasonCode === "COMPETITOR_WON" && (
              <TextField label="Competitor Name *" value={editOppCompetitorName} onChange={(e) => setEditOppCompetitorName(e.target.value)} placeholder="e.g. Siemens" fullWidth size="small" />
            )}
          </Box>
        )}
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Products</div>
            <button type="button" onClick={() => setShowEditOppItemsModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all uppercase tracking-wider shrink-0">
              {editOppItems.length > 0 ? `Edit (${editOppItems.length})` : "+ Add Products"}
            </button>
          </div>
          {editOppItems.length > 0 ? (
            <div className="space-y-1">
              {editOppItems.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl text-xs">
                  <div className="flex-1 font-bold truncate">{item.product_name}</div>
                  <div className="text-gray-400 shrink-0">{item.quantity}×₹{item.unit_price_lakhs}L{item.discount_lakhs > 0 ? ` −₹${item.discount_lakhs}L` : ""}</div>
                </div>
              ))}
              <div className="text-right text-[10px] font-black text-gray-500 uppercase tracking-wider pr-1">
                Total: ₹{editOppItems.reduce((s, i) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">No products added</div>
          )}
        </div>
      </FormModal>

      {/* Add Opportunity Modal */}
      <FormModal
        isOpen={showAddOpp}
        onClose={() => setShowAddOpp(false)}
        title="Add Opportunity"
        onSubmit={handleCreateOpp}
      >
        <div className="px-3 py-2 bg-blue-50 rounded-xl text-xs font-bold text-blue-700 mb-1">
          {p.name}
        </div>
        <TextField
          label="Name *"
          value={addOppName}
          onChange={(e) => setAddOppName(e.target.value)}
          autoFocus
          fullWidth
          size="small"
        />
        <div className="flex gap-3">
          <TextField
            select
            label="Stage *"
            value={addOppStageId}
            onChange={(e) => { const s = oppStages.find((x) => x.id === e.target.value); setAddOppStageId(e.target.value); if (s) setAddOppWinProb(String(s.default_win_probability)); }}
            fullWidth
            size="small"
            sx={{ flex: 1 }}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select stage</MenuItem>
            {oppStages.map((s) => <MenuItem key={s.id} value={s.id}>{s.stage_name}</MenuItem>)}
          </TextField>
          <TextField
            select
            label="Status *"
            value={addOppStatusId}
            onChange={(e) => setAddOppStatusId(e.target.value)}
            fullWidth
            size="small"
            sx={{ flex: 1 }}
            slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
          >
            <MenuItem value="">Select status</MenuItem>
            {oppStatuses.map((s) => <MenuItem key={s.id} value={s.id}>{s.status_name}</MenuItem>)}
          </TextField>
        </div>
        <TextField
          select
          label="Lead Source"
          value={addOppLeadSourceId}
          onChange={(e) => setAddOppLeadSourceId(e.target.value)}
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
          value={addOppOwnerId}
          onChange={(e) => setAddOppOwnerId(e.target.value)}
          fullWidth
          size="small"
          slotProps={{ select: { displayEmpty: true }, inputLabel: { shrink: true } }}
        >
          <MenuItem value="">Select owner</MenuItem>
          {oppUsers.map((u) => <MenuItem key={u.id} value={u.id}>{u.display_name}</MenuItem>)}
        </TextField>
        <TextField
          label="Win Probability % *"
          type="number"
          value={addOppWinProb}
          onChange={(e) => setAddOppWinProb(e.target.value)}
          placeholder="0 – 100"
          fullWidth
          size="small"
          slotProps={{ htmlInput: { min: 0, max: 100 } }}
        />
        <TextField
          label="Indicative Value (Lakhs)"
          type="number"
          value={addOppValue}
          onChange={(e) => setAddOppValue(e.target.value)}
          placeholder="e.g. 25.50"
          fullWidth
          size="small"
          slotProps={{ htmlInput: { min: 0, step: "any" } }}
        />
        {leadSources.find((ls) => ls.id === addOppLeadSourceId)?.name !== "REPEAT_ORDER" && (
          <>
            <TextField label="Expected Closure Date" type="date" value={addOppClosureDate} onChange={(e) => setAddOppClosureDate(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Demo Start Date" type="date" value={addOppDemoStart} onChange={(e) => setAddOppDemoStart(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
            <TextField label="Demo End Date" type="date" value={addOppDemoEnd} onChange={(e) => setAddOppDemoEnd(e.target.value)} fullWidth size="small" slotProps={{ inputLabel: { shrink: true } }} />
          </>
        )}
        <TextField label="PO Number" value={addOppPoNumber} onChange={(e) => setAddOppPoNumber(e.target.value)} placeholder="e.g. PO-2024-001" fullWidth size="small" />
      </FormModal>

      {/* Edit Opportunity — Products secondary modal */}
      <FormModal
        isOpen={showEditOppItemsModal}
        onClose={() => setShowEditOppItemsModal(false)}
        title="Products"
        onSubmit={async () => {}}
        submitLabel="Done"
      >
        {editOppItems.length > 0 && (
          <div className="space-y-2">
            {editOppItems.map((item, i) => (
              <div key={i} className="px-3 py-2 bg-gray-50 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold truncate">{item.product_name}</div>
                  <button type="button" onClick={() => setEditOppItems(editOppItems.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 font-black shrink-0 ml-2">×</button>
                </div>
                <div className="flex gap-2">
                  <div className="w-20">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Qty</div>
                    <input type="number" min="1" value={item.quantity} onChange={(e) => { const { id, ...rest } = item; setEditOppItems(editOppItems.map((it, j) => j === i ? { ...rest, quantity: Number(e.target.value) } : it)); }} className={inputClass} />
                  </div>
                  <div className="w-20">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Price (₹L)</div>
                    <input type="number" min="0" step="any" value={item.unit_price_lakhs} onChange={(e) => { const { id, ...rest } = item; setEditOppItems(editOppItems.map((it, j) => j === i ? { ...rest, unit_price_lakhs: Number(e.target.value) } : it)); }} className={inputClass} />
                  </div>
                  <div className="w-20">
                    <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">Disc (₹L)</div>
                    <input type="number" min="0" step="any" value={item.discount_lakhs} onChange={(e) => { const { id, ...rest } = item; setEditOppItems(editOppItems.map((it, j) => j === i ? { ...rest, discount_lakhs: Number(e.target.value) } : it)); }} className={inputClass} />
                  </div>
                </div>
              </div>
            ))}
            <div className="text-right text-[10px] font-black text-gray-500 uppercase tracking-wider pr-1">
              Total: ₹{editOppItems.reduce((s, i) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L
            </div>
          </div>
        )}
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Add Product</div>
          <select value={editOppItemProdId} onChange={(e) => setEditOppItemProdId(e.target.value)} className={inputClass}>
            <option value="">Select product</option>
            {oppProducts.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex gap-2">
            <div className="w-20">
              <label className={labelClass}>Qty</label>
              <input type="number" min="1" value={editOppItemQty} onChange={(e) => setEditOppItemQty(e.target.value)} className={inputClass} placeholder="e.g. 2" />
            </div>
            <div className="w-20">
              <label className={labelClass}>Price (₹L)</label>
              <input type="number" min="0" step="any" value={editOppItemPrice} onChange={(e) => setEditOppItemPrice(e.target.value)} className={inputClass} placeholder="e.g. 12.5" />
            </div>
            <div className="w-20">
              <label className={labelClass}>Disc (₹L)</label>
              <input type="number" min="0" step="any" value={editOppItemDisc} onChange={(e) => setEditOppItemDisc(e.target.value)} className={inputClass} placeholder="0" />
            </div>
          </div>
          <button type="button" onClick={() => {
            if (!editOppItemProdId || !editOppItemQty || !editOppItemPrice) return;
            const prod = oppProducts.find((p) => p.id === editOppItemProdId);
            setEditOppItems([...editOppItems, { product_id: editOppItemProdId, product_name: prod?.name || "", quantity: Number(editOppItemQty), unit_price_lakhs: Number(editOppItemPrice), discount_lakhs: Number(editOppItemDisc || 0) }]);
            setEditOppItemProdId(""); setEditOppItemQty("1"); setEditOppItemPrice(""); setEditOppItemDisc("0");
          }} className="w-full py-2 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider">
            + Add Product
          </button>
        </div>
      </FormModal>
    </>
  );
}

export default function ProjectDirectoryScreen({ onDetailModeChange, openCreateRef, refreshOppsRef, onSelectProject, openLogActivityRef, resetDetailRef, onSelectOpportunity, openProjectRef, onDetailBack }) {
  const [projects, setProjects] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [selectedProject, setSelectedProject] = useState(null);


  // Master data (lazy-loaded)
  const [accounts, setAccounts] = useState([]);
  const [projectStatuses, setProjectStatuses] = useState([]);
  const [users, setUsers] = useState([]);

  // Create form
  const [showCreateProject, setShowCreateProject] = useState(false);
  const [newProjectAccountId, setNewProjectAccountId] = useState("");
  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectStatusId, setNewProjectStatusId] = useState("");
  const [newProjectOwnerId, setNewProjectOwnerId] = useState("");
  const [newProjectBidDate, setNewProjectBidDate] = useState("");

  // Edit form
  const [editingProject, setEditingProject] = useState(null);
  const [editProjectName, setEditProjectName] = useState("");
  const [editProjectStatusId, setEditProjectStatusId] = useState("");
  const [editProjectOwnerId, setEditProjectOwnerId] = useState("");
  const [editProjectBidDate, setEditProjectBidDate] = useState("");

  const debouncedSearch = useDebouncedValue(search);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchProjects = useCallback((opts = {}) => {
    const params = { page, page_size: pageSize };
    if (debouncedSearch) params.search = debouncedSearch;

    const cacheKey = getCacheKey(params);
    const cached = getCached(cacheKey);
    const isBackgroundRefresh = opts.background === true;

    if (cached && !isBackgroundRefresh) {
      setProjects(cached.items);
      setTotal(cached.total);
      setLoading(false);
      setError(null);
      fetchProjects({ background: true });
      return;
    }

    if (!isBackgroundRefresh) {
      setLoading(true);
      setError(null);
    }

    listAllProjects(params)
      .then((data) => {
        if (!isMountedRef.current) return;
        setProjects(data.items);
        setTotal(data.total);
        if (!isBackgroundRefresh) setLoading(false);
        setCache(cacheKey, { items: data.items, total: data.total });
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        if (!isBackgroundRefresh) {
          setError(err.message || "Failed to load projects");
          setLoading(false);
        }
      });
  }, [debouncedSearch, page]);

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const loadMasterData = async () => {
    const loads = [];
    if (accounts.length === 0)
      loads.push(
        listAccounts({ page_size: 100 })
          .then((d) => setAccounts(d.items || []))
          .catch(() => {})
      );
    if (projectStatuses.length === 0)
      loads.push(listProjectStatuses().then(setProjectStatuses).catch(() => {}));
    if (users.length === 0)
      loads.push(listUsers().then(setUsers).catch(() => {}));
    await Promise.all(loads);
  };

  const openCreateProject = async () => {
    setNewProjectAccountId("");
    setNewProjectName("");
    setNewProjectStatusId("");
    setNewProjectOwnerId("");
    setNewProjectBidDate("");
    setShowCreateProject(true);
    await loadMasterData();
  };
  if (openCreateRef) openCreateRef.current = openCreateProject;

  // Called by DemoApp.tsx's navigate() when leaving this screen via the sidebar —
  // this screen stays mounted (hidden via CSS) rather than unmounting like
  // Customer360Screen/OpportunityDetailScreen, so its own detail-mode state
  // doesn't reset for free and needs this explicit nudge from the parent.
  if (resetDetailRef) resetDetailRef.current = () => {
    setSelectedProject(null);
    setEditingProject(null);
    onSelectProject?.(null);
  };

  // Called by DemoApp.tsx to jump straight to a specific project's detail
  // view from outside this screen (e.g. clicking a project card on Customer
  // 360) — mirrors what clicking a project row already does internally.
  if (openProjectRef) openProjectRef.current = (p) => {
    setSelectedProject(p);
    onSelectProject?.(p);
    onDetailModeChange?.(true);
  };

  const handleCreateProject = async () => {
    if (!newProjectAccountId) throw new Error("Account is required");
    if (!newProjectName.trim()) throw new Error("Project name is required");
    if (!newProjectStatusId) throw new Error("Status is required");
    if (!newProjectOwnerId) throw new Error("Owner is required");
    const payload = {
      name: newProjectName.trim(),
      owner_id: newProjectOwnerId,
      status_id: newProjectStatusId,
    };
    if (newProjectBidDate) payload.bid_submission_date = newProjectBidDate;
    await createProject(newProjectAccountId, payload);
    projectListCache.clear();
    fetchProjects({ background: true });
  };

  const openEditProject = async (p) => {
    setEditingProject(p);
    setEditProjectName(p.name || "");
    setEditProjectStatusId(p.status?.id || "");
    setEditProjectOwnerId(p.owner?.id || "");
    setEditProjectBidDate(p.bid_submission_date || "");
    await loadMasterData();
  };

  const handleUpdateProject = async () => {
    if (!editProjectName.trim()) throw new Error("Project name is required");
    const payload = {
      name: editProjectName.trim(),
      owner_id: editProjectOwnerId || undefined,
      status_id: editProjectStatusId || undefined,
    };
    if (editProjectBidDate) payload.bid_submission_date = editProjectBidDate;
    await updateProject(editingProject.id, payload);
    projectListCache.clear();
    fetchProjects({ background: true });
    setSelectedProject(null);
    onSelectProject?.(null);
    onDetailModeChange?.(false);
  };

  const totalPages = Math.ceil(total / pageSize) || 1;

  const labelClass = "block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1";
  const inputClass = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium";

  if (selectedProject) {
    return (
      <>
        <ProjectDetailView
          project={selectedProject}
          onBack={() => { setSelectedProject(null); onSelectProject?.(null); onDetailModeChange?.(false); onDetailBack?.(); }}
          onEdit={() => openEditProject(selectedProject)}
          refreshOppsRef={refreshOppsRef}
          openLogActivityRef={openLogActivityRef}
          onSelectOpportunity={onSelectOpportunity}
        />
        <FormModal
          isOpen={editingProject !== null}
          onClose={() => setEditingProject(null)}
          title="Edit Project"
          onSubmit={handleUpdateProject}
        >
          {editingProject && (
            <div className="px-3 py-2 bg-blue-50 rounded-xl text-xs font-bold text-blue-700 mb-1">
              {editingProject.account?.name}
            </div>
          )}
          <div>
            <label className={labelClass}>Name *</label>
            <input type="text" value={editProjectName} onChange={(e) => setEditProjectName(e.target.value)} className={inputClass} autoFocus />
          </div>
          <div>
            <label className={labelClass}>Status</label>
            <select value={editProjectStatusId} onChange={(e) => setEditProjectStatusId(e.target.value)} className={inputClass}>
              <option value="">Select status</option>
              {projectStatuses.map((s) => <option key={s.id} value={s.id}>{s.status_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Owner</label>
            <select value={editProjectOwnerId} onChange={(e) => setEditProjectOwnerId(e.target.value)} className={inputClass}>
              <option value="">Select owner</option>
              {users.map((u) => <option key={u.id} value={u.id}>{u.display_name}</option>)}
            </select>
          </div>
          <div>
            <label className={labelClass}>Bid Submission Date</label>
            <input type="date" value={editProjectBidDate} onChange={(e) => setEditProjectBidDate(e.target.value)} className={inputClass} />
          </div>
        </FormModal>
      </>
    );
  }

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 animate-in fade-in duration-200">
      {/* Fixed header */}
      <div className="px-4 pt-4 bg-gray-50">

        <div className="flex gap-3 mb-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex-1 relative">
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
            <input
              type="text"
              placeholder="Search by project or hospital..."
              className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              autoComplete="off"
            />
            {search && (
              <button
                onClick={() => { setSearch(""); setPage(1); }}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-bold text-xs"
              >
                &times;
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold mb-4 flex items-center justify-between">
            <span>{error}</span>
            <button
              onClick={() => fetchProjects()}
              className="ml-4 shrink-0 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-12">
            <div className="text-gray-400 font-bold text-sm animate-pulse">Loading projects...</div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="space-y-3">
              {projects.map((p) => (
                <div
                  key={p.id}
                  onClick={() => { setSelectedProject(p); onSelectProject?.(p); onDetailModeChange?.(true); }}
                  className="bg-white py-3 px-4 rounded-2xl shadow-sm border border-gray-100 cursor-pointer hover:border-blue-400 hover:shadow-[0_4px_6px_rgba(0,0,0,0.07)] transition-all group"
                >
                  <div className="flex gap-3">
                    <div className="w-9 h-9 bg-amber-50 text-amber-600 rounded-xl flex items-center justify-center font-black text-sm shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0 self-center">
                      {p.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold text-gray-800 text-sm group-hover:text-blue-900 transition-colors truncate">{p.name}</div>
                      <div className="flex items-center justify-between gap-3 mt-0.5">
                        <div className="text-sm font-bold text-gray-400 truncate">{p.account.name}</div>
                        <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-blue-50 transition-colors shrink-0">
                          <svg className="w-[18px] h-[18px] text-gray-400 group-hover:text-blue-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="9 18 15 12 9 6" />
                          </svg>
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                        <span className="px-2.5 py-1 rounded-lg text-[10px] font-black border bg-teal-50 text-teal-700 border-teal-200">
                          {p.status.status_name}
                        </span>
                        <div>
                          <span className="font-black text-gray-400 uppercase tracking-wider text-[10px]">Owner: </span>
                          <span className="font-bold text-xs">{p.owner.display_name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {projects.length === 0 && (
              <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
                {search ? `No projects or hospitals matching "${search}".` : "No projects found."}
              </div>
            )}

            {totalPages > 1 && (
              <div className="flex items-center justify-center gap-3 mt-6">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all"
                >
                  Prev
                </button>
                <span className="text-xs font-bold text-gray-500">
                  Page {page} of {totalPages} ({total} total)
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider bg-white border border-gray-200 text-gray-500 hover:bg-gray-50 disabled:opacity-40 transition-all"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Project Modal */}
      <FormModal
        isOpen={showCreateProject}
        onClose={() => setShowCreateProject(false)}
        title="New Project"
        onSubmit={handleCreateProject}
        submitLabel="Create"
      >
        <div>
          <label className={labelClass}>Account *</label>
          <select
            value={newProjectAccountId}
            onChange={(e) => setNewProjectAccountId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select account</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Name *</label>
          <input
            type="text"
            value={newProjectName}
            onChange={(e) => setNewProjectName(e.target.value)}
            className={inputClass}
            placeholder="Enter project name"
            autoFocus
          />
        </div>
        <div>
          <label className={labelClass}>Status *</label>
          <select
            value={newProjectStatusId}
            onChange={(e) => setNewProjectStatusId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select status</option>
            {projectStatuses.map((s) => (
              <option key={s.id} value={s.id}>{s.status_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Owner *</label>
          <select
            value={newProjectOwnerId}
            onChange={(e) => setNewProjectOwnerId(e.target.value)}
            className={inputClass}
          >
            <option value="">Select owner</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>{u.display_name}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={labelClass}>Bid Submission Date</label>
          <input
            type="date"
            value={newProjectBidDate}
            onChange={(e) => setNewProjectBidDate(e.target.value)}
            className={inputClass}
          />
        </div>
      </FormModal>

    </div>
  );
}
