import * as Dialog from "@radix-ui/react-dialog";
import { useState, useMemo } from "react";

export default function CrystalPopup({
  popupData,
  onClose,
}) {
  if (!popupData) return null;

  const { sites = [], title, showUptimeSummary } = popupData;
  const [search, setSearch] = useState("");

  /* ================= FILTER LOGIC ================= */

  const filteredSites = useMemo(() => {
    if (!search.trim()) return sites;

    return sites.filter((site) =>
      (site.domain || site.url || "")
        .toLowerCase()
        .includes(search.toLowerCase())
    );
  }, [sites, search]);

  /* ================= UI ================= */

  const summary = useMemo(() => {
    if (!showUptimeSummary || sites.length === 0) return null;
    const up = sites.filter((site) => site.status === "UP" || site.status === "SLOW").length;
    const down = sites.filter((site) => site.status === "DOWN").length;
    const slow = sites.filter((site) => site.status === "SLOW").length;
    return { total: sites.length, up, down, slow };
  }, [showUptimeSummary, sites]);

  const getStatusColor = (status) => {
    if (status === "DOWN") return "bg-red-500/15 text-red-300 border-red-500/20";
    if (status === "SLOW") return "bg-yellow-400/15 text-yellow-300 border-yellow-400/20";
    if (status === "UP") return "bg-emerald-400/15 text-emerald-300 border-emerald-400/20";
    return "bg-slate-500/10 text-slate-300 border-slate-500/20";
  };

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xl" />

      <Dialog.Content
        className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(94vw,560px)] max-h-[86vh] overflow-hidden rounded-[28px] border border-sky-400/10 bg-[rgba(3,7,18,0.92)] p-5 shadow-[0_30px_80px_rgba(8,20,48,0.45)] backdrop-blur-3xl text-white"
      >
        <Dialog.Title className="sr-only">
          {title || "Websites"}
        </Dialog.Title>
        <Dialog.Description className="sr-only">
          Quick view of websites and their status
        </Dialog.Description>

        <div className="flex items-center justify-between gap-4 pb-4 border-b border-white/10 mb-4">
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] text-sky-300/70 font-semibold">Quick View</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif" }}>
              {title || "Websites"}
            </h2>
          </div>

          <Dialog.Close className="rounded-2xl px-3 py-2 text-white/80 transition hover:text-white hover:bg-white/10">
            ✕
          </Dialog.Close>
        </div>

        {!showUptimeSummary && sites.length > 0 && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search website..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-white placeholder-white/40 outline-none transition focus:border-sky-400/40 focus:bg-white/10 focus:ring-2 focus:ring-sky-400/20"
            />
          </div>
        )}

        <div className="max-h-[42vh] overflow-y-auto pr-2">
          {filteredSites.length > 0 ? (
            <div className="space-y-3">
              {filteredSites.map((site, index) => (
                <div
                  key={site._id || index}
                  className="flex flex-col gap-2 rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/10"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">
                        {site.domain || site.url || "Unnamed Site"}
                      </p>
                      {site.category && (
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-slate-400/80">
                          {site.category}
                        </p>
                      )}
                    </div>
                    {site.status && (
                      <span className={`rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${getStatusColor(site.status)}`}>
                        {site.status}
                      </span>
                    )}
                  </div>
                  {site.url && site.domain && (
                    <p className="text-xs text-slate-300/70 truncate">{site.url}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/5 px-5 py-10 text-center text-sm text-slate-300/70">
              No websites found
            </div>
          )}
        </div>

        {showUptimeSummary && summary && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border border-sky-400/10 bg-sky-500/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-sky-200/70">Total</div>
              <div className="mt-3 text-3xl font-bold text-white">{summary.total}</div>
            </div>
            <div className="rounded-3xl border border-emerald-400/10 bg-emerald-500/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-emerald-200/70">Online</div>
              <div className="mt-3 text-3xl font-bold text-white">{summary.up}</div>
            </div>
            <div className="rounded-3xl border border-red-400/10 bg-red-500/5 p-4">
              <div className="text-[11px] uppercase tracking-[0.24em] text-red-200/70">Down</div>
              <div className="mt-3 text-3xl font-bold text-white">{summary.down}</div>
            </div>
          </div>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
