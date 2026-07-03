/* eslint-disable no-unused-vars, no-empty, react-hooks/immutability --
   Pre-existing debt in this file's manual .then()/SWR-cache pattern, which
   docs/Frontend-Implementation-Standards.md §9 marks superseded (pending
   React Query migration). TODO: delete this disable block when this file
   migrates (§9) — do not hand-fix individually, the rewrite removes the
   pattern that causes these. */
import { useEffect, useState, useCallback, useRef } from "react";
import { listAccounts, createAccount, getAccountCounts } from "../services/accounts";
import { listZones } from "../services/masterData";
import FormModal from "../components/FormModal";
import useDebouncedValue from "../hooks/useDebouncedValue";

// ---------------------------------------------------------------------------
// Module-level stale-while-revalidate cache
// Persists across component mounts so navigating back from Customer 360
// shows the list instantly instead of showing a loading spinner every time.
// ---------------------------------------------------------------------------
const CACHE_TTL_MS = 30_000; // 30 seconds
const accountListCache = new Map(); // key → { items, total, fetchedAt }

function getCacheKey(params) {
  return JSON.stringify(params);
}

function getCached(key) {
  const entry = accountListCache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.fetchedAt > CACHE_TTL_MS) {
    accountListCache.delete(key);
    return null;
  }
  return entry;
}

function setCache(key, data) {
  accountListCache.set(key, { ...data, fetchedAt: Date.now() });
}

export default function CustomerDirectoryScreen({ onSelectAccount, openCreateRef, accountUpdateRef }) {
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [zoneFilter, setZoneFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [zones, setZones] = useState([]);
  const [formName, setFormName] = useState("");
  const [formZoneId, setFormZoneId] = useState("");
  const [formPayerBehavior, setFormPayerBehavior] = useState("");

  const debouncedSearch = useDebouncedValue(search);

  const openCreateModal = async () => {
    setFormName("");
    setFormZoneId("");
    setFormPayerBehavior("");
    setShowCreateModal(true);
    if (zones.length === 0) {
      try {
        const data = await listZones();
        setZones(data.items || data);
      } catch {}
    }
  };
  if (openCreateRef) openCreateRef.current = openCreateModal;

  if (accountUpdateRef) accountUpdateRef.current = (updatedAccount) => {
    setAccounts((prev) => prev.map((a) => a.id === updatedAccount.id ? { ...a, ...updatedAccount } : a));
    const params = { page, page_size: pageSize };
    if (debouncedSearch) params.search = debouncedSearch;
    if (zoneFilter) params.zone_id = zoneFilter;
    const cacheKey = getCacheKey(params);
    const cached = getCached(cacheKey);
    if (cached) {
      accountListCache.set(cacheKey, { ...cached, items: cached.items.map((a) => a.id === updatedAccount.id ? { ...a, ...updatedAccount } : a) });
    }
  };

  const listContainerRef = useRef(null);

  const handleCreateAccount = async () => {
    if (!formName.trim()) throw new Error("Customer name is required");
    if (!formZoneId) throw new Error("Zone is required");
    const payload = { name: formName.trim(), zone_id: formZoneId };
    if (formPayerBehavior) payload.payer_behavior = formPayerBehavior;
    await createAccount(payload);
    accountListCache.clear();
    fetchAccounts({ background: true });
    listContainerRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => { isMountedRef.current = false; };
  }, []);

  const fetchAccounts = useCallback((opts = {}) => {
    const params = { page, page_size: pageSize };
    if (debouncedSearch) params.search = debouncedSearch;
    if (zoneFilter) params.zone_id = zoneFilter;

    const cacheKey = getCacheKey(params);
    const cached = getCached(cacheKey);
    const isBackgroundRefresh = opts.background === true;

    if (cached && !isBackgroundRefresh) {
      // Serve cached data immediately — no loading spinner
      setAccounts(cached.items);
      setTotal(cached.total);
      setLoading(false);
      setError(null);
      // Kick off a silent background refresh to keep data fresh
      fetchAccounts({ background: true });
      return;
    }

    if (!isBackgroundRefresh) {
      setLoading(true);
      setError(null);
    }

    listAccounts(params)
      .then((data) => {
        if (!isMountedRef.current) return;
        const items = data.items;
        // On background refresh, do NOT update state yet — we hold until counts arrive
        // so the accounts list never briefly loses its count columns mid-session.
        if (!isBackgroundRefresh) {
          setAccounts(items);
          setTotal(data.total);
          setLoading(false);
        }

        const ids = items.map((a) => a.id);
        if (ids.length === 0) {
          setCache(cacheKey, { items, total: data.total });
          return;
        }
        getAccountCounts(ids)
          .then((counts) => {
            if (!isMountedRef.current) return;
            const merged = items.map((a) => ({ ...a, ...(counts[a.id] || {}) }));
            setAccounts(merged);
            setTotal(data.total);
            setCache(cacheKey, { items: merged, total: data.total });
          })
          .catch(() => {
            // On foreground, cache without counts so at least the list renders.
            // On background, leave the cache untouched — it still has the previous
            // merged items with counts, which is better than overwriting with count-less items.
            if (!isBackgroundRefresh) {
              setCache(cacheKey, { items, total: data.total });
            }
          });
      })
      .catch((err) => {
        if (!isMountedRef.current) return;
        if (!isBackgroundRefresh) {
          setError(err.message || "Failed to load accounts");
          setLoading(false);
        }
      });
  }, [debouncedSearch, zoneFilter, page]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-gray-50 animate-in fade-in duration-200">
      {/* Fixed: title + search bar — does not scroll */}
      <div className="px-4 pt-4 bg-gray-50">

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="flex-1 relative">
          <span className="absolute left-3 top-2.5 text-gray-400">🔍</span>
          <input
            type="text"
            placeholder="Search customers..."
            className="w-full pl-9 pr-4 py-2 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            autoComplete="off"
          />
          {search && (
            <button
              onClick={() => {
                setSearch("");
                setPage(1);
              }}
              className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600 font-bold text-xs"
            >
              &times;
            </button>
          )}
        </div>
      </div>
      </div>{/* end fixed header */}

      {/* Scrollable list content */}
      <div ref={listContainerRef} className="flex-1 overflow-y-auto min-h-0 px-4 pb-4">
      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-bold mb-4 flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={fetchAccounts}
            className="ml-4 shrink-0 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-wider transition-all"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="text-center py-12">
          <div className="text-gray-400 font-bold text-sm animate-pulse">
            Loading customers...
          </div>
        </div>
      )}

      {/* Account list */}
      {!loading && !error && (
        <>
          <div className="space-y-3">
            {accounts.map((account) => (
              <div
                key={account.id}
                onClick={() => onSelectAccount(account)}
                className="bg-white py-3 px-4 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-10 bg-amber-50 text-amber-600 rounded-full flex items-center justify-center font-black text-sm shadow-sm group-hover:bg-amber-600 group-hover:text-white transition-colors shrink-0">
                    {account.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-sm group-hover:text-blue-900 transition-colors">
                      {account.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                      {account.zone && (
                        <span className="px-2 py-0.5 rounded-md text-[10px] font-black tracking-normal normal-case border bg-teal-50 text-teal-700 border-teal-200">
                          {account.zone.name}
                        </span>
                      )}
                      {account.payer_behavior && (
                        <>
                          <span className="w-1 h-1 bg-gray-300 rounded-full" />
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-normal normal-case border ${
                              account.payer_behavior === "GOOD"
                                ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                                : account.payer_behavior === "PROBLEMATIC"
                                ? "bg-red-50 text-red-700 border-red-200"
                                : "bg-gray-50 text-gray-600 border-gray-200"
                            }`}
                          >
                            {account.payer_behavior}
                          </span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-gray-50 p-2 rounded-xl group-hover:bg-blue-50 transition-colors">
                  <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-600 transition-colors" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </div>
              </div>
            ))}
          </div>

          {/* Empty state */}
          {accounts.length === 0 && (
            <div className="text-center py-12 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
              {search
                ? "No customers match your search."
                : "No customers found."}
            </div>
          )}

          {/* Pagination */}
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

      </div>{/* end scrollable content */}

      <FormModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="New Customer"
        onSubmit={handleCreateAccount}
        submitLabel="Create"
      >
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
            Name *
          </label>
          <input
            type="text"
            value={formName}
            onChange={(e) => setFormName(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
            placeholder="Enter customer name"
            autoFocus
          />
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
            Zone *
          </label>
          <select
            value={formZoneId}
            onChange={(e) => setFormZoneId(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
          >
            <option value="">Select zone</option>
            {zones.map((z) => (
              <option key={z.id} value={z.id}>
                {z.name}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-[10px] font-black text-gray-400 uppercase tracking-wider mb-1">
            Payer Behavior
          </label>
          <select
            value={formPayerBehavior}
            onChange={(e) => setFormPayerBehavior(e.target.value)}
            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none text-sm font-medium"
          >
            <option value="">Select behavior</option>
            <option value="GOOD">Good</option>
            <option value="AVERAGE">Average</option>
            <option value="PROBLEMATIC">Problematic</option>
            <option value="UNKNOWN">Unknown</option>
          </select>
        </div>
      </FormModal>
    </div>
  );
}
