import React, { useEffect } from "react";
import { useTheme } from "../contexts/ThemeContext";

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
  const { currentTheme } = useTheme();

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
        `}
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          background: active ? currentTheme.bgCard : currentTheme.bgInput,
          border: active ? `1px solid ${currentTheme.accent}30` : `1px solid ${currentTheme.borderLight}`,
          color: active ? currentTheme.text : currentTheme.textMuted,
          boxShadow: active ? `0 0 18px ${currentTheme.accent}15` : "none",
        }}
      >
        {/* Subtle glass shine */}
        <span
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background: `linear-gradient(135deg, ${currentTheme.accent}20 0%, transparent 45%, transparent 100%)`,
          }}
        />

        {/* Button Text */}
        <span className="relative z-10 tracking-[0.06em]">
          {label}
        </span>

        {/* Active subtle left indicator */}
        {active && (
          <span
            className="absolute left-0 top-0 bottom-0 w-[3px] rounded-l-xl"
            style={{
              background: currentTheme.accent,
              boxShadow: `0 0 10px ${currentTheme.accent}60`,
            }}
          />
        )}
      </button>
    </>
  );
}