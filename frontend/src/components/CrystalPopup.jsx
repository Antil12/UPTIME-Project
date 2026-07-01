import * as Dialog from "@radix-ui/react-dialog";
import { useState, useMemo } from "react";
import { useTheme } from "../contexts/ThemeContext";

export default function CrystalPopup({
  popupData,
  onClose,
}) {
  const { currentTheme } = useTheme();
  
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
    if (status === "DOWN") return { bg: currentTheme.errorBg, text: currentTheme.error, border: `${currentTheme.error}30` };
    if (status === "SLOW") return { bg: `${currentTheme.warning}12`, text: currentTheme.warning, border: `${currentTheme.warning}30` };
    if (status === "UP") return { bg: currentTheme.successBg, text: currentTheme.success, border: `${currentTheme.success}30` };
    return { bg: currentTheme.bgInput, text: currentTheme.textMuted, border: currentTheme.borderLight };
  };

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-xl" style={{ background: currentTheme.bg }} />

      <Dialog.Content
        className="fixed top-1/2 left-1/2 z-50 -translate-x-1/2 -translate-y-1/2 w-[min(94vw,560px)] max-h-[86vh] overflow-hidden rounded-[28px] border p-5 backdrop-blur-3xl"
        style={{
          borderColor: currentTheme.borderAccent,
          background: currentTheme.bgCard,
          boxShadow: currentTheme.shadow,
          color: currentTheme.text,
        }}
      >
        <Dialog.Title className="sr-only">
          {title || "Websites"}
        </Dialog.Title>
        <Dialog.Description className="sr-only">
          Quick view of websites and their status
        </Dialog.Description>

        <div className="flex items-center justify-between gap-4 pb-4 mb-4" style={{ borderBottom: `1px solid ${currentTheme.borderAccent}` }}>
          <div>
            <p className="text-[10px] uppercase tracking-[0.35em] font-semibold" style={{ color: currentTheme.accent }}>Quick View</p>
            <h2 className="mt-2 text-2xl font-extrabold tracking-tight" style={{ fontFamily: "'Orbitron', sans-serif", color: currentTheme.text }}>
              {title || "Websites"}
            </h2>
          </div>

          <Dialog.Close className="rounded-2xl px-3 py-2 transition" style={{ color: currentTheme.textMuted, backgroundColor: currentTheme.bgInput, border: `1px solid ${currentTheme.borderLight}` }}>
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
              className="w-full rounded-2xl border px-4 py-3 text-sm outline-none transition"
              style={{
                backgroundColor: currentTheme.bgInput,
                borderColor: currentTheme.borderLight,
                color: currentTheme.text,
                placeholderColor: currentTheme.textDim,
              }}
            />
          </div>
        )}

        <div className="max-h-[42vh] overflow-y-auto pr-2">
          {filteredSites.length > 0 ? (
            <div className="space-y-3">
              {filteredSites.map((site, index) => (
                <div
                  key={site._id || index}
                  className="flex flex-col gap-2 rounded-3xl border p-4 transition"
                  style={{
                    borderColor: currentTheme.borderLight,
                    backgroundColor: currentTheme.bgInput,
                    color: currentTheme.text,
                  }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate" style={{ color: currentTheme.text }}>
                        {site.domain || site.url || "Unnamed Site"}
                      </p>
                      {site.category && (
                        <p className="mt-1 text-[11px] uppercase tracking-[0.18em]" style={{ color: currentTheme.textMuted }}>
                          {site.category}
                        </p>
                      )}
                    </div>
                    {site.status && (() => {
                      const colors = getStatusColor(site.status);
                      return (
                        <span className="rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em]" style={{
                          background: colors.bg,
                          color: colors.text,
                          borderColor: colors.border,
                        }}>
                          {site.status}
                        </span>
                      );
                    })()}
                  </div>
                  {site.url && site.domain && (
                    <p className="text-xs truncate" style={{ color: currentTheme.textDim }}>{site.url}</p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-3xl border px-5 py-10 text-center text-sm" style={{ borderColor: currentTheme.borderLight, backgroundColor: currentTheme.bgInput, color: currentTheme.textMuted }}>
              No websites found
            </div>
          )}
        </div>

        {showUptimeSummary && summary && (
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <div className="rounded-3xl border p-4" style={{ borderColor: currentTheme.borderAccent, backgroundColor: currentTheme.accentGlow }}>
              <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: currentTheme.accent }}>Total</div>
              <div className="mt-3 text-3xl font-bold" style={{ color: currentTheme.text }}>{summary.total}</div>
            </div>
            <div className="rounded-3xl border p-4" style={{ borderColor: currentTheme.borderAccent, backgroundColor: `${currentTheme.success}15` }}>
              <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: currentTheme.success }}>Online</div>
              <div className="mt-3 text-3xl font-bold" style={{ color: currentTheme.text }}>{summary.up}</div>
            </div>
            <div className="rounded-3xl border p-4" style={{ borderColor: currentTheme.borderAccent, backgroundColor: `${currentTheme.error}15` }}>
              <div className="text-[11px] uppercase tracking-[0.24em]" style={{ color: currentTheme.error }}>Down</div>
              <div className="mt-3 text-3xl font-bold" style={{ color: currentTheme.text }}>{summary.down}</div>
            </div>
          </div>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
