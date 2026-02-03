import * as Dialog from "@radix-ui/react-dialog";

export default function CrystalPopup({
  popupData,
  onClose,
  urls,
  upSites,
  downSites,
}) {
  if (!popupData) return null;

  // Decide which sites to show
  let sitesToShow = [];
  if (popupData.type === "total") sitesToShow = urls;
  if (popupData.type === "up") sitesToShow = upSites;
  if (popupData.type === "down") sitesToShow = downSites;

  return (
    <Dialog.Root open={true} onOpenChange={(open) => !open && onClose()}>
      {/* 🌑 BACKDROP */}
      <Dialog.Overlay
        className="
          fixed inset-0 z-40
          bg-black/60 backdrop-blur-sm
        "
      />

      {/* ✨ POPUP */}
      <Dialog.Content
        className="
          fixed top-1/2 left-1/2 z-50
          -translate-x-1/2 -translate-y-1/2
          bg-white/10 backdrop-blur-md
          border border-white/20
          rounded-2xl
          w-[350px] max-h-[400px] p-4
          text-white overflow-y-auto
          shadow-2xl
          ring-1 ring-white/20
          animate-crystal
        "
        style={{
          boxShadow:
            "0 25px 50px rgba(0,0,0,0.7), 0 0 80px rgba(99,102,241,0.45)",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold">{popupData.title}</h2>
          <Dialog.Close className="text-red-400 hover:text-red-500 font-bold text-lg">
            ✕
          </Dialog.Close>
        </div>

        {/* Website list */}
        {sitesToShow.length > 0 ? (
          <div className="space-y-1">
            {sitesToShow.map((site, i) => (
              <div
                key={i}
                className="p-1 rounded bg-white/20 backdrop-blur-sm text-sm truncate"
              >
                {site.domain}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center text-white/60">
            No websites found
          </div>
        )}

        {/* Optional summary */}
        {popupData.showUptimeSummary && (
          <div className="mt-4 space-y-2 text-center text-sm">
            <div className="p-2 rounded bg-white/20">
              🌐 Total Websites: <b>{urls.length}</b>
            </div>
            <div className="p-2 rounded bg-green-500/20 text-green-300">
              🟢 UP Websites: <b>{upSites.length}</b>
            </div>
            <div className="p-2 rounded bg-red-500/20 text-red-300">
              🔴 DOWN Websites: <b>{downSites.length}</b>
            </div>
            <div className="p-2 rounded bg-blue-500/20 text-blue-300 font-bold">
              📊 Uptime:{" "}
              {urls.length === 0
                ? "0%"
                : `${Math.round(
                    (upSites.length / urls.length) * 100
                  )}%`}
            </div>
          </div>
        )}
      </Dialog.Content>
    </Dialog.Root>
  );
}
