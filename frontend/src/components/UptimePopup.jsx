import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { createPortal } from "react-dom";
import {
  Activity,
  Clock,
  Zap,
  TrendingUp,
  AlertTriangle,
} from "lucide-react";

const monoLabel = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "9px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

const StatCard = ({ icon: Icon, label, value, color, delay = 0 }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.3 }}
      whileHover={{ y: -2 }}
      className="relative rounded-xl p-3 overflow-hidden"
      style={{
        background: "rgba(3,7,18,0.75)",
        border: `1px solid ${color}12`,
        backdropFilter: "blur(12px)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background: `linear-gradient(90deg, transparent, ${color}40, transparent)`,
        }}
      />

      <div className="flex items-center justify-between mb-2">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: `${color}10`,
            border: `1px solid ${color}20`,
          }}
        >
          <Icon size={13} style={{ color }} />
        </div>

        <div className="w-1.5 h-1.5 relative">
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{ background: color }}
            animate={{ scale: [1, 1.8], opacity: [0.5, 0] }}
            transition={{ duration: 1.4, repeat: Infinity }}
          />
          <div className="absolute inset-0 rounded-full" style={{ background: color }} />
        </div>
      </div>

      <div style={{ ...monoLabel, fontSize: "8px", color: "rgba(148,163,184,0.5)" }}>
        {label}
      </div>

      <div
        className="mt-1"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "16px",
          fontWeight: 700,
          color: "white",
          textShadow: `0 0 10px ${color}20`,
        }}
      >
        {value}
      </div>
    </motion.div>
  );
};

// ─── HUD-style Range Dropdown ─────────────────────────────────────────────────
const RangeDropdown = ({ anchorRef, open, value, onChange, onClose }) => {
  const options = [
    { value: "24h", label: "Last 24 Hours" },
    { value: "7d", label: "Last 7 Days" },
    { value: "30d", label: "Last 30 Days" },
  ];

  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;

    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top: rect.bottom + window.scrollY + 10,
        left: rect.left + window.scrollX,
      });
    };

    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef]);

  if (!open) return null;

  return createPortal(
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 6, scale: 0.96 }}
      transition={{ duration: 0.18 }}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        zIndex: 9999,
        width: "210px",
        borderRadius: "18px",
        overflow: "hidden",
        background: "rgba(3,7,18,0.96)",
        border: "1px solid rgba(56,189,248,0.15)",
        backdropFilter: "blur(30px)",
        boxShadow:
          "0 20px 60px rgba(0,0,0,0.6), 0 0 30px rgba(56,189,248,0.08)",
      }}
    >
      {/* Top Glow Line */}
      <div
        style={{
          height: "1px",
          background:
            "linear-gradient(90deg, transparent, rgba(56,189,248,0.5), transparent)",
        }}
      />

      {/* Title */}
      <div
        className="px-4 py-2"
        style={{
          borderBottom: "1px solid rgba(56,189,248,0.08)",
        }}
      >
        <span
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.06em",
            color: "white",
          }}
        >
          SELECT RANGE
        </span>
      </div>

      {/* Options */}
      {options.map((opt) => {
        const active = value === opt.value;

        return (
          <motion.button
            key={opt.value}
            onClick={() => {
              onChange(opt.value);
              onClose();
            }}
            whileHover={{ x: 2 }}
            className="flex items-center justify-between w-full px-4 py-2.5 transition-all"
            style={{
              ...monoLabel,
              fontSize: "10px",
              color: active ? "#38bdf8" : "rgba(148,163,184,0.7)",
              background: active
                ? "linear-gradient(90deg, rgba(56,189,248,0.08), transparent)"
                : "transparent",
              borderLeft: active
                ? "2px solid rgba(56,189,248,0.5)"
                : "2px solid transparent",
            }}
          >
            <span>{opt.label}</span>

            {active && (
              <motion.span
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                style={{
                  fontSize: "9px",
                  color: "#38bdf8",
                }}
              >
                ✓
              </motion.span>
            )}
          </motion.button>
        );
      })}
    </motion.div>,
    document.body
  );
};
const UptimePopup = ({ data, filter, setFilter, onClose, userRole }) => {
  if (userRole !== "superadmin") return null;
  const [showRangeDropdown, setShowRangeDropdown] = useState(false);
  const rangeBtnRef = useRef(null);
  const dropdownRef = useRef(null);

  const rangeLabels = { "24h": "Last 24 Hours", "7d": "Last 7 Days", "30d": "Last 30 Days" };

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        showRangeDropdown &&
        dropdownRef.current && !dropdownRef.current.contains(e.target) &&
        !rangeBtnRef.current?.contains(e.target)
      ) {
        setShowRangeDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showRangeDropdown]);

  const stats = [
    { label: "Uptime %",    value: `${data?.uptimePercent ?? 0}%`, icon: TrendingUp,    color: "#34d399" },
    { label: "Downtime",    value: data?.downChecks ?? 0,          icon: AlertTriangle, color: "#f87171" },
    { label: "Total Checks",value: data?.totalChecks ?? 0,         icon: Activity,      color: "#38bdf8" },
    { label: "Avg ms",      value: `${data?.avgResponse ?? 0}`,    icon: Clock,         color: "#60a5fa" },
    { label: "Fastest",     value: `${data?.minResponse ?? 0}`,    icon: Zap,           color: "#34d399" },
    { label: "Slowest",     value: `${data?.maxResponse ?? 0}`,    icon: Zap,           color: "#fbbf24" },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 flex items-center justify-center px-3"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{
          background: "rgba(0,0,0,0.75)",
          backdropFilter: "blur(8px)",
        }}
      >
        <motion.div
          initial={{ scale: 0.92, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.92, opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-[500px] rounded-2xl overflow-hidden"
          style={{
            background: "rgba(3,7,18,0.95)",
            border: "1px solid rgba(56,189,248,0.1)",
          }}
        >
          {/* Header */}
          <div className="h-[1px]" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.4) 30%, rgba(129,140,248,0.32) 70%, transparent 100%)" }} />
          <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">
            <div>
              <div style={{ ...monoLabel, fontSize: "8px", color: "rgba(56,189,248,0.5)" }}>
                ANALYTICS
              </div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontSize: "16px",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                Uptime
              </div>
            </div>

            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg text-xs"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "rgba(255,255,255,0.6)",
              }}
            >
              ✕
            </button>
          </div>

          {/* Controls — HUD range picker */}
        
<div className="relative">
  <motion.button
    ref={rangeBtnRef}
    onClick={() => setShowRangeDropdown((v) => !v)}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.96 }}
    className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all duration-200"
    style={{
      background: showRangeDropdown
        ? "linear-gradient(135deg, rgba(56,189,248,0.15), rgba(129,140,248,0.12))"
        : "rgba(255,255,255,0.035)",
      border: showRangeDropdown
        ? "1px solid rgba(56,189,248,0.35)"
        : "1px solid rgba(56,189,248,0.12)",
      color: "#38bdf8",
      boxShadow: showRangeDropdown
        ? "0 0 18px rgba(56,189,248,0.15)"
        : "inset 0 1px 0 rgba(255,255,255,0.05)",
    }}
  >
    <span
      style={{
        ...monoLabel,
        fontSize: "10px",
        color: "#38bdf8",
      }}
    >
      {rangeLabels[filter] || filter}
    </span>

    <motion.span
      animate={{ rotate: showRangeDropdown ? 180 : 0 }}
      transition={{ duration: 0.25 }}
      style={{
        fontSize: "8px",
        color: "rgba(56,189,248,0.7)",
      }}
    >
      ▼
    </motion.span>
  </motion.button>

  <AnimatePresence>
    {showRangeDropdown && (
      <RangeDropdown
        anchorRef={rangeBtnRef}
        open={showRangeDropdown}
        value={filter}
        onChange={setFilter}
        onClose={() => setShowRangeDropdown(false)}
      />
    )}
  </AnimatePresence>
</div>
          

          {/* Content */}
          <div className="px-4 pb-4 pt-3">
            {!data ? (
              <div className="grid grid-cols-2 gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[70px] rounded-xl animate-pulse"
                    style={{
                      background: "rgba(255,255,255,0.04)",
                      border: "1px solid rgba(255,255,255,0.06)",
                    }}
                  />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                {stats.map((s, i) => (
                  <StatCard key={s.label} {...s} delay={i * 0.04} />
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-4 pb-4">
            <button
              onClick={onClose}
              className="w-full py-2 rounded-lg text-xs font-semibold"
              style={{
                background: "rgba(56,189,248,0.12)",
                border: "1px solid rgba(56,189,248,0.25)",
                color: "#38bdf8",
              }}
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default UptimePopup;