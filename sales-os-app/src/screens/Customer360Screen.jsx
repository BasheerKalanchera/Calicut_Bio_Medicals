export default function Customer360Screen({ accountId, onBack }) {
  return (
    <div className="flex-1 overflow-y-auto min-h-0 p-4 bg-gray-50">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-xl text-xs font-black transition-all uppercase tracking-wider"
        >
          &larr; Back
        </button>
        <div>
          <h3 className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">
            Customer 360
          </h3>
          <h2 className="font-extrabold text-xl text-gray-800 tracking-tight">
            Loading...
          </h2>
        </div>
      </div>
      <div className="text-center py-12 text-gray-400 font-bold text-sm animate-pulse">
        Customer 360 — Phase 2D.3
      </div>
    </div>
  );
}
