import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  Globe2,
  Link2,
  Bell,
  Mail,
  Phone,
  MapPin,
  Zap,
  Plus,
  X,
  CheckCircle2,
  ChevronDown,
} from "lucide-react";


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

// ─── Cursor Glow ──────────────────────────────────────────────────────────────
const CursorGlow = () => {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 90, damping: 24 });
  const sy = useSpring(y, { stiffness: 90, damping: 24 });

  useEffect(() => {
    const fn = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        left: sx, top: sy,
        translateX: "-50%", translateY: "-50%",
        width: 320, height: 320,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(56,189,248,0.045) 0%, transparent 72%)",
      }}
    />
  );
};

// ─── Background ───────────────────────────────────────────────────────────────
const Background = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0" style={{ background: "#030712" }} />
    <div className="absolute inset-0" style={{
      background: "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(56,189,248,0.045) 0%, transparent 100%)",
    }} />
    <div className="absolute" style={{
      top: "62%", left: "16%", width: 320, height: 320,
      background: "radial-gradient(circle, rgba(129,140,248,0.035) 0%, transparent 68%)",
      filter: "blur(90px)",
    }} />
    <div className="absolute" style={{
      top: "18%", right: "12%", width: 260, height: 260,
      background: "radial-gradient(circle, rgba(16,185,129,0.025) 0%, transparent 68%)",
      filter: "blur(80px)",
    }} />
    <div className="absolute inset-0" style={{
      backgroundImage:
        "linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px)",
      backgroundSize: "42px 42px",
    }} />
    <motion.div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(to bottom, transparent 48%, rgba(56,189,248,0.012) 50%, transparent 52%)",
      }}
      animate={{ y: ["-100%", "100%"] }}
      transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 2.5 }}
    />
  </div>
);

// ─── HUD Corner ───────────────────────────────────────────────────────────────
const HUDCorner = ({ pos, delay = 0 }) => {
  const cls = { tl: "top-4 left-4", tr: "top-4 right-4", bl: "bottom-4 left-4", br: "bottom-4 right-4" };
  const rot = { tl: "0deg", tr: "90deg", bl: "-90deg", br: "180deg" };
  return (
    <motion.div
      className={`fixed ${cls[pos]} w-7 h-7 z-20 pointer-events-none`}
      style={{ transform: `rotate(${rot[pos]})` }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 0.8, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div className="absolute top-0 left-0 h-[1.5px] bg-sky-400/80"
        initial={{ width: 0 }} animate={{ width: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }} />
      <motion.div className="absolute top-0 left-0 w-[1.5px] bg-sky-400/80"
        initial={{ height: 0 }} animate={{ height: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }} />
    </motion.div>
  );
};

// ─── Orbit Ring ───────────────────────────────────────────────────────────────
const OrbitRing = ({ radius, duration, dotCount, color, delay = 0, tilt = 70 }) => (
  <motion.div
    className="fixed pointer-events-none z-[1]"
    style={{
      width: radius * 2, height: radius * 2,
      top: "50%", left: "50%",
      marginTop: -radius, marginLeft: -radius,
      transform: `perspective(900px) rotateX(${tilt}deg)`,
      opacity: 0.4,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <div className="absolute inset-0 rounded-full" style={{ border: `1px solid ${color}14` }} />
    {Array.from({ length: dotCount }, (_, i) => {
      const angle = (i / dotCount) * 2 * Math.PI;
      const cx = Math.cos(angle) * radius + radius;
      const cy = Math.sin(angle) * radius + radius;
      return (
        <motion.div key={i} className="absolute rounded-full"
          style={{
            width: i === 0 ? 4 : 2, height: i === 0 ? 4 : 2,
            background: i === 0 ? color : `${color}40`,
            left: cx - (i === 0 ? 2 : 1), top: cy - (i === 0 ? 2 : 1),
            boxShadow: i === 0 ? `0 0 8px ${color}` : "none",
          }}
          animate={i === 0 ? { opacity: [1, 0.35, 1] } : {}}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      );
    })}
  </motion.div>
);

// ─── Status Dot ───────────────────────────────────────────────────────────────
const StatusDot = ({ color = "#34d399", label }) => (
  <div className="flex items-center gap-2">
    <div className="relative w-2 h-2">
      <motion.div className="absolute inset-0 rounded-full" style={{ background: color }}
        animate={{ scale: [1, 2], opacity: [0.45, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }} />
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
    </div>
    {label && (
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
        letterSpacing: "0.16em", color: `${color}88`, textTransform: "uppercase",
      }}>
        {label}
      </span>
    )}
  </div>
);

// ─── Section Label ────────────────────────────────────────────────────────────
const SectionLabel = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center border"
      style={{ borderColor: "rgba(56,189,248,0.12)", background: "rgba(56,189,248,0.04)" }}>
      <Icon size={13} className="text-sky-400" />
    </div>
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
      letterSpacing: "0.22em", color: "rgba(56,189,248,0.5)", textTransform: "uppercase",
    }}>
      {label}
    </span>
    <div className="flex-1 h-[1px]" style={{ background: "rgba(56,189,248,0.06)" }} />
  </div>
);

// ─── HUD Input ────────────────────────────────────────────────────────────────
const HudInput = ({ type = "text", placeholder, value, onChange, required, ...rest }) => (
  <div className="relative group">
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      {...rest}
      className="w-full px-5 py-4 rounded-2xl outline-none transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.022)",
        border: "1px solid rgba(56,189,248,0.09)",
        color: "white",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        letterSpacing: "0.02em",
        backdropFilter: "blur(12px)",
      }}
      onFocus={e => {
        e.target.style.border = "1px solid rgba(56,189,248,0.35)";
        e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.06), 0 0 20px rgba(56,189,248,0.04)";
      }}
      onBlur={e => {
        e.target.style.border = "1px solid rgba(56,189,248,0.09)";
        e.target.style.boxShadow = "none";
      }}
    />
  </div>
);

// ─── HUD Select Dropdown ──────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  "JOURNALS",
  "E-JAYPEE",
  "JPMEDPUB",
  "JP-DIGITAL",
  "DIGINERVE",
  "Others",
];

const HudSelect = ({ value, onChange, placeholder = "Select category" }) => {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropPos({
      top:   rect.bottom + window.scrollY + 6,
      left:  rect.left   + window.scrollX,
      width: rect.width,
    });
  };

  const handleOpen = () => {
    if (!open) calcPos();
    setOpen((v) => !v);
  };

  const handleSelect = (opt) => {
    onChange(opt);
    setOpen(false);
  };

  // Keep position in sync while dropdown is open
  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [open]);

  return (
    <div className="relative">
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="w-full px-5 py-4 rounded-2xl outline-none transition-all duration-300 flex items-center justify-between"
        style={{
          background: "rgba(255,255,255,0.022)",
          border: open ? "1px solid rgba(56,189,248,0.35)" : "1px solid rgba(56,189,248,0.09)",
          color: value ? "white" : "rgba(148,163,184,0.45)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          letterSpacing: "0.02em",
          backdropFilter: "blur(12px)",
          boxShadow: open ? "0 0 0 3px rgba(56,189,248,0.06), 0 0 20px rgba(56,189,248,0.04)" : "none",
          textAlign: "left",
        }}
      >
        <span>{value || placeholder}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: "rgba(56,189,248,0.5)", flexShrink: 0 }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      {open && createPortal(
        <>
          {/* Backdrop */}
          <div
            style={{ position: "fixed", inset: 0, zIndex: 9998 }}
            onClick={() => setOpen(false)}
          />
          {/* Dropdown panel — rendered in <body>, escapes all overflow:hidden parents */}
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top:      dropPos.top,
              left:     dropPos.left,
              width:    dropPos.width,
              zIndex:   9999,
              background: "rgba(3,7,18,0.97)",
              border: "1px solid rgba(56,189,248,0.14)",
              backdropFilter: "blur(28px)",
              boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 24px rgba(56,189,248,0.05)",
              borderRadius: "16px",
              overflow: "hidden",
            }}
          >
            {CATEGORY_OPTIONS.map((opt, idx) => (
              <button
                key={opt}
                type="button"
                onClick={() => handleSelect(opt)}
                className="w-full px-5 py-3 text-left transition-all duration-150 flex items-center justify-between"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  letterSpacing: "0.06em",
                  color: value === opt ? "#38bdf8" : "rgba(148,163,184,0.75)",
                  background: value === opt ? "rgba(56,189,248,0.07)" : "transparent",
                  borderTop: idx === 0 ? "none" : "1px solid rgba(56,189,248,0.045)",
                  borderLeft: value === opt ? "2px solid rgba(56,189,248,0.45)" : "2px solid transparent",
                }}
                onMouseEnter={(e) => { if (value !== opt) e.currentTarget.style.background = "rgba(255,255,255,0.03)"; }}
                onMouseLeave={(e) => { if (value !== opt) e.currentTarget.style.background = "transparent"; }}
              >
                <span>{opt}</span>
                {value === opt && <span style={{ color: "#38bdf8", fontSize: "9px" }}>✓</span>}
              </button>
            ))}
          </motion.div>
        </>,
        document.body
      )}
    </div>
  );
};

// ─── Toggle Chip ─────────────────────────────────────────────────────────────
const ToggleChip = ({ label, active, onClick, activeColor = "#38bdf8" }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.96 }}
    className="px-5 py-3 rounded-2xl font-medium tracking-wide transition-all duration-300"
    style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "11px",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      border: active ? `1px solid ${activeColor}55` : "1px solid rgba(56,189,248,0.08)",
      background: active
        ? `linear-gradient(135deg, ${activeColor}18, ${activeColor}08)`
        : "rgba(255,255,255,0.018)",
      color: active ? activeColor : "rgba(148,163,184,0.6)",
      boxShadow: active ? `0 0 18px ${activeColor}18` : "none",
    }}
  >
    {label}
  </motion.button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AddUrl = ({
  domain,
  url,
  setDomain,
  setUrl,
  urlError,
  onSave,
  urls = [],
}) => {
  // Default responseThresholdMs to 15000
  const [responseThresholdMs, setResponseThresholdMs] = useState("15000");
  const [alertChannels, setAlertChannels] = useState([]);
  const [regions, setRegions] = useState([]);
  const [alertIfAllRegionsDown, setAlertIfAllRegionsDown] = useState(false);
  const [category, setCategory] = useState("");
  const [localError, setLocalError] = useState("");
  const [emailContacts, setEmailContacts] = useState([]);
  const [emailInput, setEmailInput] = useState("");
  const [phoneContact, setPhoneContact] = useState("");
  const [priority, setPriority] = useState(0);
  const [submitted, setSubmitted] = useState(false);

  const normalize = (v = "") => v.trim().toLowerCase().replace(/\/$/, "");

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    const nd = normalize(domain);
    const nu = normalize(url);
    if (!nd || !nu) { setLocalError("Domain and URL are required."); return; }
    if (!responseThresholdMs || responseThresholdMs === "") {
      setLocalError("Response threshold is required.");
      return;
    }
    if (urls.some((u) => normalize(u.domain) === nd)) { setLocalError("Domain name already exists."); return; }
    if (urls.some((u) => normalize(u.url) === nu)) { setLocalError("URL already exists."); return; }

    onSave({
      domain: domain.trim(), url: url.trim(),
      category: category.trim() || null,
      responseThresholdMs, alertChannels, regions,
      alertIfAllRegionsDown,
      emailContact: emailContacts, phoneContact, priority,
    });

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
    setCategory(""); setEmailContacts([]); setEmailInput("");
    setPhoneContact(""); setAlertChannels([]);
    setResponseThresholdMs("15000");
  };

  const toggleChannel = (ch) =>
    setAlertChannels((p) => p.includes(ch) ? p.filter((c) => c !== ch) : [...p, ch]);

  const toggleRegion = (r) =>
    setRegions((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r]);

  return (
    <>
      <FontLoader />

      <div
        className="relative min-h-screen w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6 text-white"
        style={{ background: "transparent" }}
      >
        <Background />
        <CursorGlow />

        <OrbitRing radius={220} duration={20} dotCount={8} color="#38bdf8" tilt={72} />
        <OrbitRing radius={290} duration={30} dotCount={10} color="#818cf8" tilt={68} delay={1} />

        {["tl", "tr", "bl", "br"].map((p, i) => (
          <HUDCorner key={p} pos={p} delay={0.1 + i * 0.05} />
        ))}

        {/* ─── Page Content ─── */}
        <div className="relative z-10 w-full max-w-2xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="h-[1px] w-8 bg-sky-400/20" />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                letterSpacing: "0.28em", color: "rgba(56,189,248,0.42)", textTransform: "uppercase",
              }}>
                Monitor Configuration
              </span>
              <div className="h-[1px] w-24 bg-sky-400/10" />
            </div>

            <div className="flex items-center justify-between">
              <h1 className="text-3xl sm:text-4xl" style={{
                fontFamily: "'Orbitron', sans-serif", fontWeight: 800,
                letterSpacing: "0.05em", textShadow: "0 0 24px rgba(56,189,248,0.08)",
              }}>
                ADD WEBSITE
              </h1>
              <StatusDot color="#34d399" label="Ready" />
            </div>

            <p className="mt-3" style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
              color: "rgba(148,163,184,0.52)", letterSpacing: "0.03em",
            }}>
              Configure uptime monitoring, alert channels, and regional tracking.
            </p>
          </motion.div>

          {/* Top status bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="mb-6 rounded-2xl px-4 py-3 flex items-center justify-between"
            style={{
              background: "rgba(3,7,18,0.64)", border: "1px solid rgba(56,189,248,0.08)",
              backdropFilter: "blur(14px)", boxShadow: "0 0 18px rgba(56,189,248,0.02)",
            }}
          >
            <div>
              <div style={{
                fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
                fontSize: "12px", letterSpacing: "0.06em", color: "white",
              }}>
                SITE CONFIGURATION PANEL
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                color: "rgba(148,163,184,0.48)", marginTop: "3px",
              }}>
                Fill all required fields to activate monitoring.
              </div>
            </div>
            <StatusDot color="#38bdf8" label="Input Mode" />
          </motion.div>

          {/* ─── Form ─── */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-6">

              {/* ── Identity ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.45 }}
                className="rounded-2xl p-6 relative overflow-visible"
                style={{
                  background: "rgba(3,7,18,0.72)",
                  border: "1px solid rgba(56,189,248,0.09)",
                  backdropFilter: "blur(18px)",
                  boxShadow: "0 0 22px rgba(56,189,248,0.03), inset 0 1px 0 rgba(56,189,248,0.035)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.32) 30%, rgba(129,140,248,0.28) 70%, transparent 100%)" }} />

                <SectionLabel icon={Globe2} label="Site Identity" />
                <div className="space-y-3">
                  <HudInput placeholder="Domain Name (e.g. myapp.com)" value={domain} onChange={(e) => setDomain(e.target.value)} />
                  <HudInput type="url" placeholder="https://example.com" value={url} onChange={(e) => setUrl(e.target.value)} />

                  {/* ── Category Dropdown ── */}
                  <HudSelect
                    value={category}
                    onChange={setCategory}
                    placeholder="Select Category (optional)"
                  />
                </div>
              </motion.div>

              {/* ── Performance ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.45 }}
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: "rgba(3,7,18,0.72)",
                  border: "1px solid rgba(56,189,248,0.09)",
                  backdropFilter: "blur(18px)",
                  boxShadow: "0 0 22px rgba(56,189,248,0.03), inset 0 1px 0 rgba(56,189,248,0.035)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(129,140,248,0.32) 30%, rgba(56,189,248,0.28) 70%, transparent 100%)" }} />

                <div className="flex items-center justify-between mb-4">
                  <SectionLabel icon={Zap} label="Performance Threshold" />
                  <label className="flex items-center gap-2 cursor-pointer -mt-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: priority === 1 ? "#f87171" : "rgba(148,163,184,0.5)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                    <div
                      className="relative w-8 h-4 rounded-full cursor-pointer transition-all duration-300"
                      style={{ background: priority === 1 ? "rgba(248,113,113,0.3)" : "rgba(255,255,255,0.06)", border: priority === 1 ? "1px solid rgba(248,113,113,0.4)" : "1px solid rgba(255,255,255,0.08)" }}
                      onClick={() => setPriority(priority === 1 ? 0 : 1)}
                    >
                      <motion.div
                        className="absolute top-0.5 w-3 h-3 rounded-full"
                        animate={{ left: priority === 1 ? "17px" : "2px" }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        style={{ background: priority === 1 ? "#f87171" : "rgba(148,163,184,0.4)", boxShadow: priority === 1 ? "0 0 6px rgba(248,113,113,0.6)" : "none" }}
                      />
                    </div>
                    HIGH PRIORITY
                  </label>
                </div>

                {/* Response threshold — required, default 15000 */}
                <div className="relative">
                  <HudInput
                    type="number"
                    placeholder="Max Response Time (ms) *"
                    value={responseThresholdMs}
                    onChange={(e) => setResponseThresholdMs(e.target.value)}
                    required
                    min="1"
                  />
                  <div className="mt-1.5 flex items-center gap-2">
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                      color: "rgba(56,189,248,0.35)", letterSpacing: "0.08em",
                    }}>
                      Default: 15000 ms · Required field
                    </span>
                    {responseThresholdMs && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        style={{
                          fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                          color: "rgba(52,211,153,0.6)",
                        }}
                      >
                        ✓ {Number(responseThresholdMs).toLocaleString()} ms
                      </motion.span>
                    )}
                  </div>
                </div>
              </motion.div>

              {/* ── Notification Channels ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.45 }}
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: "rgba(3,7,18,0.72)",
                  border: "1px solid rgba(56,189,248,0.09)",
                  backdropFilter: "blur(18px)",
                  boxShadow: "0 0 22px rgba(56,189,248,0.03), inset 0 1px 0 rgba(56,189,248,0.035)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(16,185,129,0.32) 30%, rgba(56,189,248,0.28) 70%, transparent 100%)" }} />

                <SectionLabel icon={Bell} label="Notification Channels" />

                <div className="flex flex-wrap gap-3 mb-5">
                  {["email", "sms", "whatsapp", "voice"].map((ch) => (
                    <ToggleChip key={ch} label={ch} active={alertChannels.includes(ch)} onClick={() => toggleChannel(ch)} />
                  ))}
                </div>

                {/* Email inputs */}
                {alertChannels.includes("email") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4">
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.16em", color: "rgba(56,189,248,0.4)", textTransform: "uppercase", marginBottom: "10px" }}>
                      <Mail size={10} style={{ display: "inline", marginRight: "6px" }} />
                      Alert Emails
                    </div>
                    <div className="flex gap-2 mb-3">
                      <HudInput
                        type="email"
                        placeholder="Add email and press Enter"
                        value={emailInput}
                        onChange={(e) => setEmailInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            const v = emailInput.trim();
                            if (v && !emailContacts.includes(v)) { setEmailContacts((p) => [...p, v]); setEmailInput(""); }
                          }
                        }}
                      />
                      <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                        onClick={() => { const v = emailInput.trim(); if (v && !emailContacts.includes(v)) { setEmailContacts((p) => [...p, v]); setEmailInput(""); } }}
                        className="px-4 rounded-2xl flex items-center justify-center"
                        style={{ background: "rgba(56,189,248,0.12)", border: "1px solid rgba(56,189,248,0.2)", color: "#38bdf8", minWidth: "48px" }}>
                        <Plus size={16} />
                      </motion.button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {emailContacts.map((em, idx) => (
                        <motion.span key={idx} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                          className="flex items-center gap-2 px-3 py-1 rounded-full"
                          style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.14)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "rgba(148,163,184,0.8)" }}>
                          {em}
                          <button type="button" onClick={() => setEmailContacts((p) => p.filter((x) => x !== em))}
                            className="text-red-400/60 hover:text-red-400 transition-colors">
                            <X size={10} />
                          </button>
                        </motion.span>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* Phone input */}
                {(alertChannels.includes("sms") || alertChannels.includes("whatsapp") || alertChannels.includes("voice")) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.16em", color: "rgba(56,189,248,0.4)", textTransform: "uppercase", marginBottom: "10px" }}>
                      <Phone size={10} style={{ display: "inline", marginRight: "6px" }} />
                      Mobile Contact
                    </div>
                    <HudInput type="tel" placeholder="+91 9876543210" value={phoneContact} onChange={(e) => setPhoneContact(e.target.value)} />
                  </motion.div>
                )}
              </motion.div>

              {/* ── Monitoring Regions ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.45 }}
                className="rounded-2xl p-6 relative overflow-hidden"
                style={{
                  background: "rgba(3,7,18,0.72)",
                  border: "1px solid rgba(56,189,248,0.09)",
                  backdropFilter: "blur(18px)",
                  boxShadow: "0 0 22px rgba(56,189,248,0.03), inset 0 1px 0 rgba(56,189,248,0.035)",
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(129,140,248,0.32) 50%, transparent 100%)" }} />

                <SectionLabel icon={MapPin} label="Monitoring Regions" />

                <div className="flex flex-wrap gap-3 mb-5">
                  {["South America", "Australia", "North America", "Europe", "Asia", "Africa"].map((r) => (
                    <ToggleChip key={r} label={r} active={regions.includes(r)} onClick={() => toggleRegion(r)} activeColor="#34d399" />
                  ))}
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className="relative w-8 h-4 rounded-full transition-all duration-300"
                    style={{
                      background: alertIfAllRegionsDown ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.04)",
                      border: alertIfAllRegionsDown ? "1px solid rgba(56,189,248,0.35)" : "1px solid rgba(255,255,255,0.07)",
                    }}
                    onClick={() => setAlertIfAllRegionsDown(!alertIfAllRegionsDown)}
                  >
                    <motion.div
                      className="absolute top-0.5 w-3 h-3 rounded-full"
                      animate={{ left: alertIfAllRegionsDown ? "17px" : "2px" }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      style={{
                        background: alertIfAllRegionsDown ? "#38bdf8" : "rgba(148,163,184,0.3)",
                        boxShadow: alertIfAllRegionsDown ? "0 0 6px rgba(56,189,248,0.6)" : "none",
                      }}
                    />
                  </div>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                    letterSpacing: "0.1em", color: alertIfAllRegionsDown ? "rgba(56,189,248,0.7)" : "rgba(148,163,184,0.45)",
                    textTransform: "uppercase",
                  }}>
                    Alert only if ALL regions are down
                  </span>
                </label>
              </motion.div>

              {/* ─── Error ─── */}
              {(urlError || localError) && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl px-5 py-4 flex items-center gap-3"
                  style={{
                    background: "rgba(239,68,68,0.06)",
                    border: "1px solid rgba(239,68,68,0.18)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <X size={14} className="text-red-400 shrink-0" />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: "rgba(248,113,113,0.85)", letterSpacing: "0.02em" }}>
                    {localError || urlError}
                  </span>
                </motion.div>
              )}

              {/* ─── Submit ─── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.36, duration: 0.45 }}
              >
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  className="w-full py-5 rounded-2xl relative overflow-hidden"
                  style={{
                    background: submitted
                      ? "linear-gradient(135deg, rgba(52,211,153,0.2), rgba(16,185,129,0.1))"
                      : "linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(129,140,248,0.1) 100%)",
                    border: submitted
                      ? "1px solid rgba(52,211,153,0.35)"
                      : "1px solid rgba(56,189,248,0.2)",
                    boxShadow: submitted
                      ? "0 0 28px rgba(52,211,153,0.1)"
                      : "0 0 28px rgba(56,189,248,0.06)",
                    transition: "all 0.4s ease",
                  }}
                >
                  {/* Shimmer */}
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                      background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)",
                    }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  />

                  <div className="relative flex items-center justify-center gap-3">
                    {submitted ? (
                      <>
                        <CheckCircle2 size={17} className="text-emerald-400" />
                        <span style={{
                          fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
                          fontSize: "13px", letterSpacing: "0.12em", color: "#34d399",
                        }}>
                          SITE ADDED
                        </span>
                      </>
                    ) : (
                      <>
                        <Link2 size={16} className="text-sky-400" />
                        <span style={{
                          fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
                          fontSize: "13px", letterSpacing: "0.12em", color: "white",
                        }}>
                          ACTIVATE MONITORING
                        </span>
                      </>
                    )}
                  </div>
                </motion.button>
              </motion.div>

            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddUrl;