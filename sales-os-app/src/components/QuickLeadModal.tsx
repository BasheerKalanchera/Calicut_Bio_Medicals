import { useState, useEffect } from "react";
import FormModal from "./FormModal";
import { listAccounts, listProjects, createOpportunity } from "../services/accounts";
import { listProducts } from "../services/products";
import { listStages, listStatuses, listUsers, listLeadSources } from "../services/masterData";

interface QuickLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated?: () => void;
  sbuId?: string;
}

export default function QuickLeadModal({ isOpen, onClose, onCreated, sbuId }: QuickLeadModalProps) {
  const [accounts, setAccounts]               = useState<any[]>([]);
  const [stages, setStages]                   = useState<any[]>([]);
  const [statuses, setStatuses]               = useState<any[]>([]);
  const [users, setUsers]                     = useState<any[]>([]);
  const [products, setProducts]               = useState<any[]>([]);
  const [leadSources, setLeadSources]         = useState<any[]>([]);

  const [accountId, setAccountId]             = useState("");
  const [projects, setProjects]               = useState<any[]>([]);
  const [projectsLoading, setProjectsLoading] = useState(false);
  const [projectId, setProjectId]             = useState("");
  const [name, setName]                       = useState("");
  const [stageId, setStageId]                 = useState("");
  const [statusId, setStatusId]               = useState("");
  const [ownerId, setOwnerId]                 = useState("");
  const [winProb, setWinProb]                 = useState("");
  const [value, setValue]                     = useState("");
  const [leadSourceId, setLeadSourceId]       = useState("");

  const [items, setItems]                     = useState<any[]>([]);
  const [showItemsModal, setShowItemsModal]   = useState(false);
  const [itemProdId, setItemProdId]           = useState("");
  const [itemQty, setItemQty]                 = useState("1");
  const [itemPrice, setItemPrice]             = useState("");
  const [itemDisc, setItemDisc]               = useState("0");

  useEffect(() => {
    if (items.length > 0) {
      const total = items.reduce((s, i) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0);
      setValue(total.toFixed(2));
    } else {
      setValue("");
    }
  }, [items]);

  async function handleOpen() {
    setAccountId(""); setProjects([]); setProjectId("");
    setName(""); setStageId(""); setStatusId(""); setOwnerId("");
    setWinProb(""); setValue(""); setItems([]);
    setItemProdId(""); setItemQty("1"); setItemPrice(""); setItemDisc("0");
    setLeadSourceId("");
    await Promise.all([
      accounts.length === 0 && listAccounts({ page_size: 100 }).then((d: any) => setAccounts(d.items || [])).catch(() => {}),
      stages.length === 0 && listStages().then((d: any) => setStages(d)).catch(() => {}),
      statuses.length === 0 && listStatuses().then((d: any) => setStatuses(d)).catch(() => {}),
      users.length === 0 && listUsers().then((d: any) => setUsers(d)).catch(() => {}),
      products.length === 0 && listProducts({ page_size: 100, sbu_id: sbuId as any }).then((d: any) => setProducts(d.items || [])).catch(() => {}),
      leadSources.length === 0 && listLeadSources().then((d: any) => setLeadSources(d)).catch(() => {}),
    ]);
  }

  useEffect(() => {
    if (isOpen) handleOpen();
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  async function handleSubmit() {
    if (!name.trim()) throw new Error("Opportunity name is required");
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

  const cls = "w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium";
  const lbl = "block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1";

  return (
    <>
      <FormModal isOpen={isOpen} onClose={onClose} title="New Opportunity" onSubmit={handleSubmit} submitLabel="Create">
        <div>
          <label className={lbl}>Name *</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={cls} placeholder="Enter opportunity name" autoFocus />
        </div>
        <div>
          <label className={lbl}>Account *</label>
          <select value={accountId} onChange={(e) => {
            const id = e.target.value;
            setAccountId(id); setProjectId(""); setProjects([]);
            if (id) {
              setProjectsLoading(true);
              listProjects(id as any).then((d: any) => setProjects(Array.isArray(d) ? d : [])).catch(() => {}).finally(() => setProjectsLoading(false));
            }
          }} className={cls}>
            <option value="">Select account</option>
            {accounts.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Project {projectsLoading && <span className="text-gray-300 font-normal normal-case tracking-normal">— loading…</span>}</label>
          <select value={projectId} onChange={(e) => setProjectId(e.target.value)} disabled={!accountId || projectsLoading} className={`${cls} disabled:opacity-40`}>
            <option value="">None</option>
            {projects.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className={lbl}>Stage *</label>
            <select value={stageId} onChange={(e) => { const s = stages.find((x) => x.id === e.target.value); setStageId(e.target.value); if (s) setWinProb(String(s.default_win_probability)); }} className={cls}>
              <option value="">Select stage</option>
              {stages.map((s) => <option key={s.id} value={s.id}>{s.stage_name}</option>)}
            </select>
          </div>
          <div className="flex-1">
            <label className={lbl}>Status *</label>
            <select value={statusId} onChange={(e) => setStatusId(e.target.value)} className={cls}>
              <option value="">Select status</option>
              {statuses.map((s) => <option key={s.id} value={s.id}>{s.status_name}</option>)}
            </select>
          </div>
        </div>
        <div>
          <label className={lbl}>Lead Source</label>
          <select value={leadSourceId} onChange={(e) => setLeadSourceId(e.target.value)} className={cls}>
            <option value="">Select source</option>
            {leadSources.map((ls) => <option key={ls.id} value={ls.id}>{ls.name}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Owner *</label>
          <select value={ownerId} onChange={(e) => setOwnerId(e.target.value)} className={cls}>
            <option value="">Select owner</option>
            {users.map((u) => <option key={u.id} value={u.id}>{u.display_name}</option>)}
          </select>
        </div>
        <div>
          <label className={lbl}>Win Probability % *</label>
          <input type="number" min="0" max="100" value={winProb} onChange={(e) => setWinProb(e.target.value)} className={cls} placeholder="0 – 100" />
        </div>
        <div>
          <label className={lbl}>
            Indicative Value (Lakhs)
            {items.length > 0 && <span className="ml-1 text-blue-400 font-normal normal-case tracking-normal">(auto)</span>}
          </label>
          <input type="number" step="any" min="0" value={value} onChange={(e) => setValue(e.target.value)} readOnly={items.length > 0}
            className={items.length > 0 ? `${cls} bg-gray-100 text-gray-500 cursor-not-allowed` : cls} placeholder="e.g. 25.50" />
        </div>
        <div className="border-t border-gray-100 pt-3">
          <div className="flex items-center justify-between mb-2">
            <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider">Products</div>
            <button type="button" onClick={() => setShowItemsModal(true)} className="px-3 py-1.5 rounded-xl text-xs font-black text-emerald-600 bg-emerald-50 hover:bg-emerald-100 transition-all uppercase tracking-wider shrink-0">
              {items.length > 0 ? `Edit (${items.length})` : "+ Add Products"}
            </button>
          </div>
          {items.length > 0 ? (
            <div className="space-y-1">
              {items.map((item, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-xl text-xs">
                  <div className="flex-1 font-bold truncate">{item.product_name}</div>
                  <div className="text-gray-400 shrink-0">{item.quantity}×₹{item.unit_price_lakhs}L{item.discount_lakhs > 0 ? ` −₹${item.discount_lakhs}L` : ""}</div>
                </div>
              ))}
              <div className="text-right text-[10px] font-black text-gray-500 uppercase tracking-wider pr-1">
                Total: ₹{items.reduce((s, i) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L
              </div>
            </div>
          ) : (
            <div className="text-xs text-gray-400 italic">No products added</div>
          )}
        </div>
      </FormModal>

      {/* Products secondary modal */}
      <FormModal isOpen={showItemsModal} onClose={() => setShowItemsModal(false)} title="Products" onSubmit={async () => {}} submitLabel="Done">
        {items.length > 0 && (
          <div className="space-y-2">
            {items.map((item, i) => (
              <div key={i} className="px-3 py-2 bg-gray-50 rounded-xl text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <div className="font-bold truncate">{item.product_name}</div>
                  <button type="button" onClick={() => setItems(items.filter((_, j) => j !== i))} className="text-red-400 hover:text-red-600 font-black shrink-0 ml-2">×</button>
                </div>
                <div className="flex gap-2">
                  {[
                    { label: "Qty", key: "quantity", type: "number", min: "1" },
                    { label: "Price (₹L)", key: "unit_price_lakhs", type: "number", min: "0", step: "any" },
                    { label: "Disc (₹L)", key: "discount_lakhs", type: "number", min: "0", step: "any" },
                  ].map(({ label, key, ...rest }) => (
                    <div key={key} className="w-20">
                      <div className="text-[9px] font-black text-gray-400 uppercase tracking-wider mb-0.5">{label}</div>
                      <input {...rest} value={item[key]} onChange={(e) => setItems(items.map((it, j) => j === i ? { ...it, [key]: Number(e.target.value) } : it))}
                        className="w-full px-3 py-2 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
                    </div>
                  ))}
                </div>
              </div>
            ))}
            <div className="text-right text-[10px] font-black text-gray-500 uppercase tracking-wider pr-1">
              Total: ₹{items.reduce((s, i) => s + i.quantity * i.unit_price_lakhs - i.discount_lakhs, 0).toFixed(2)}L
            </div>
          </div>
        )}
        <div className="border-t border-gray-100 pt-3 space-y-2">
          <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-2">Add Product</div>
          <select value={itemProdId} onChange={(e) => setItemProdId(e.target.value)} className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium">
            <option value="">Select product</option>
            {products.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          <div className="flex gap-2">
            {[
              { label: "Qty", state: itemQty, setState: setItemQty, min: "1" },
              { label: "Price (₹L)", state: itemPrice, setState: setItemPrice, min: "0", step: "any" },
              { label: "Disc (₹L)", state: itemDisc, setState: setItemDisc, min: "0", step: "any" },
            ].map(({ label, state, setState, ...rest }) => (
              <div key={label} className="w-20">
                <div className="text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">{label}</div>
                <input type="number" value={state} onChange={(e) => setState(e.target.value)} {...rest}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium" />
              </div>
            ))}
          </div>
          <button type="button" onClick={() => {
            if (!itemProdId || !itemQty || !itemPrice) return;
            const prod = products.find((p) => p.id === itemProdId);
            setItems([...items, { product_id: itemProdId, product_name: prod?.name || "", quantity: Number(itemQty), unit_price_lakhs: Number(itemPrice), discount_lakhs: Number(itemDisc || 0) }]);
            setItemProdId(""); setItemQty("1"); setItemPrice(""); setItemDisc("0");
          }} className="w-full py-2 rounded-xl text-xs font-black text-blue-600 bg-blue-50 hover:bg-blue-100 transition-all uppercase tracking-wider">
            + Add Product
          </button>
        </div>
      </FormModal>
    </>
  );
}
