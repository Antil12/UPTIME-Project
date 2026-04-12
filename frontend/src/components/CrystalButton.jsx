import React, { useEffect } from "react";

// ─── Font Loader ──────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    if (document.getElementById("uptime-fonts")) return;

    const link = document.createElement("link");
    link.id = "uptime-fonts";
    link.href =
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@300;400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return null;
};

export default function CrystalButton({ label, onClick, active }) {
  return (
    <>
      <FontLoader />

      <button
        onClick={onClick}
        className={`
          relative px-3.5 py-2 rounded-xl text-[11px]
          transition-all duration-200 ease-in-out
          focus:outline-none overflow-hidden
          border backdrop-blur-md
          ${
            active
              ? "bg-slate-900/80 text-white border-sky-400/20 shadow-[0_0_18px_rgba(56,189,248,0.08)]"
              : "text-slate-300 border-white/5 bg-white/[0.02] hover:text-white hover:bg-slate-900/60 hover:border-sky-400/15 hover:shadow-[0_0_16px_rgba(56,189,248,0.05)]"
          }
        `}
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
        }}
      >
        {/* Subtle glass shine */}
        <span
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "linear-gradient(135deg, rgba(255,255,255,0.10) 0%, transparent 45%, transparent 100%)",
          }}
        />

        {/* Button Text */}
        <span className="relative z-10 tracking-[0.06em]">
          {label}
        </span>

        {/* Active subtle left indicator */}
        {active && (
          <span
            className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl bg-sky-400"
            style={{
              boxShadow: "0 0 10px rgba(56,189,248,0.45)",
            }}
          />
        )}
      </button>
    </>
  );
}