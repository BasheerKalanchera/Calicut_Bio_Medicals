import { useEffect, useState, useCallback } from "react";
import { listAccounts } from "../services/accounts";
import useDebouncedValue from "../hooks/useDebouncedValue";

export default function CustomerDirectoryScreen({ onSelectAccount }) {
  const [accounts, setAccounts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [search, setSearch] = useState("");
  const [sbuFilter, setSbuFilter] = useState("");
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const debouncedSearch = useDebouncedValue(search);

  const fetchAccounts = useCallback(() => {
    setLoading(true);
    setError(null);

    const params = { page, page_size: pageSize };
    if (debouncedSearch) params.search = debouncedSearch;
    if (sbuFilter) params.sbu_id = sbuFilter;

    listAccounts(params)
      .then((data) => {
        setAccounts(data.items);
        setTotal(data.total);
      })
      .catch((err) => setError(err.message || "Failed to load accounts"))
      .finally(() => setLoading(false));
  }, [debouncedSearch, sbuFilter, page]);

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-gray-50 animate-in fade-in duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">
            Sales Execution
          </h3>
          <h2 className="font-extrabold text-2xl text-gray-800 tracking-tight">
            Customer Directory
          </h2>
        </div>
      </div>

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
                onClick={() => onSelectAccount(account.id)}
                className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-center cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group"
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center font-black text-lg shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-colors">
                    {account.name.charAt(0)}
                  </div>
                  <div>
                    <div className="font-bold text-gray-800 text-lg group-hover:text-blue-900 transition-colors">
                      {account.name}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider mt-1">
                      {account.managing_sbu && (
                        <span
                          className={`px-2 py-0.5 rounded-md text-[10px] font-black tracking-normal normal-case border ${
                            account.managing_sbu.name === "Imaging"
                              ? "bg-indigo-50 text-indigo-700 border-indigo-200"
                              : "bg-rose-50 text-rose-700 border-rose-200"
                          }`}
                        >
                          {account.managing_sbu.name}
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
                  <span className="text-gray-400 group-hover:text-blue-600 transition-colors">
                    &rarr;
                  </span>
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
    </div>
  );
}
