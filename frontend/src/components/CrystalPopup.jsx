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

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
      
      {/* Backdrop */}
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-md" />

      {/* Popup */}
      <Dialog.Content
        className="
          fixed top-1/2 left-1/2 z-50
          -translate-x-1/2 -translate-y-1/2
          w-[400px] max-h-[500px]
          p-6
          rounded-3xl
          bg-gradient-to-br from-white/10 to-white/5
          backdrop-blur-2xl
          border border-white/20
          text-white
          overflow-hidden
          shadow-2xl
        "
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">
            {title || "Websites"}
          </h2>

          <Dialog.Close className="text-white/70 hover:text-red-400 text-xl font-bold transition">
            ✕
          </Dialog.Close>
        </div>

        {/* 🔎 SEARCH BAR (only if list exists and not uptime summary only) */}
        {!showUptimeSummary && sites.length > 0 && (
          <div className="mb-4">
            <input
              type="text"
              placeholder="Search website..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="
                w-full px-4 py-2
                rounded-xl
                bg-white/10
                border border-white/20
                text-white
                placeholder-white/50
                focus:outline-none
                focus:ring-2 focus:ring-blue-400/50
                text-sm
              "
            />
          </div>
        )}

        {/* Scrollable Content */}
        <div className="max-h-[280px] overflow-y-auto pr-1">
          {filteredSites.length > 0 ? (
            <div className="space-y-2">
              {filteredSites.map((site, index) => (
                <div
                  key={site._id || index}
                  className="
                    px-4 py-2
                    rounded-xl
                    bg-white/10
                    border border-white/10
                    hover:bg-white/20
                    transition-all duration-200
                    text-sm truncate
                  "
                >
                  {site.domain || site.url || "Unnamed Site"}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-white/60 py-8 text-sm">
              No websites found
            </div>
          )}
        </div>

        {/* Uptime Summary */}
        {showUptimeSummary && (
          <div className="mt-6 space-y-3 text-sm text-center">

            <div className="p-3 rounded-xl bg-white/10 border border-white/10">
              🌐 Total Websites: <b>{sites.length}</b>
            </div>

          </div>
        )}

      </Dialog.Content>
    </Dialog.Root>
  );
}
