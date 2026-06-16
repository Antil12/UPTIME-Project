import React, { useState, useEffect } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { Plus, Trash2, Edit2, Mail, Phone, X, Check, Users, AlertTriangle, RefreshCw, Shield } from "lucide-react";
import axios from "axios";
import DeleteConfirmationModal from "../components/DeleteConfirmationModal";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  font: "'JetBrains Mono', 'IBM Plex Mono', monospace",
  bg: "#030712",
  surface: "rgba(3,7,18,0.74)",
  surfaceHover: "rgba(255,255,255,0.042)",
  surfaceActive: "rgba(255,255,255,0.06)",
  border: "rgba(56,189,248,0.08)",
  borderMid: "rgba(56,189,248,0.15)",
  borderStrong: "rgba(56,189,248,0.25)",
  dim: "rgba(148,163,184,0.45)",
  mid: "rgba(148,163,184,0.7)",
  bright: "rgba(255,255,255,0.95)",
  accent: "#38bdf8",
  accentMid: "rgba(56,189,248,0.55)",
  accentDim: "rgba(56,189,248,0.25)",
  accentFaint: "rgba(56,189,248,0.06)",
  danger: "#f87171",
  dangerFaint: "rgba(248,113,113,0.08)",
  success: "#86efac",
  successFaint: "rgba(134,239,172,0.07)",
};

// ─── Font Loader ──────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    if (document.getElementById("escalation-fonts")) return;
    const link = document.createElement("link");
    link.id = "escalation-fonts";
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@300;400;600;700&display=swap";
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
      style={{
        position: "fixed", pointerEvents: "none", zIndex: 0,
        left: sx, top: sy,
        translateX: "-50%", translateY: "-50%",
        width: 300, height: 300, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(56,189,248,0.045) 0%, transparent 70%)",
      }}
    />
  );
};

// ─── Full Page Background ─────────────────────────────────────────────────────
const Background = () => (
  <div style={{ pointerEvents: "none", position: "fixed", inset: 0, zIndex: 0, overflow: "hidden" }}>
    <div style={{ position: "absolute", inset: 0, background: "#030712" }} />
    <div style={{ position: "absolute", inset: 0, background: "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(56,189,248,0.05) 0%, transparent 100%)" }} />
    <div style={{ position: "absolute", top: "60%", left: "10%", width: 340, height: 340, background: "radial-gradient(circle, rgba(129,140,248,0.035) 0%, transparent 68%)", filter: "blur(90px)" }} />
    <div style={{ position: "absolute", top: "15%", right: "8%", width: 260, height: 260, background: "radial-gradient(circle, rgba(16,185,129,0.028) 0%, transparent 68%)", filter: "blur(85px)" }} />
    <div style={{ position: "absolute", bottom: "5%", right: "20%", width: 240, height: 240, background: "radial-gradient(circle, rgba(56,189,248,0.022) 0%, transparent 68%)", filter: "blur(75px)" }} />
    <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(148,163,184,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.022) 1px, transparent 1px)", backgroundSize: "42px 42px" }} />
    <motion.div
      style={{ position: "absolute", inset: 0, background: "linear-gradient(to bottom, transparent 48%, rgba(56,189,248,0.012) 50%, transparent 52%)" }}
      animate={{ y: ["-100%", "100%"] }}
      transition={{ duration: 7, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
    />
  </div>
);

// ─── HUD Corner Brackets ──────────────────────────────────────────────────────
const HUDCorner = ({ pos, delay = 0 }) => {
  const positions = { tl: { top: 16, left: 16 }, tr: { top: 16, right: 16 }, bl: { bottom: 16, left: 16 }, br: { bottom: 16, right: 16 } };
  const rotations = { tl: "0deg", tr: "90deg", bl: "-90deg", br: "180deg" };
  return (
    <motion.div
      style={{ position: "fixed", ...positions[pos], width: 24, height: 24, zIndex: 20, pointerEvents: "none", transform: `rotate(${rotations[pos]})` }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 0.75, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div style={{ position: "absolute", top: 0, left: 0, height: 1.5, background: "rgba(56,189,248,0.65)" }} initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: delay + 0.15, duration: 0.35 }} />
      <motion.div style={{ position: "absolute", top: 0, left: 0, width: 1.5, background: "rgba(56,189,248,0.65)" }} initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ delay: delay + 0.15, duration: 0.35 }} />
    </motion.div>
  );
};

// ─── Orbit Ring ───────────────────────────────────────────────────────────────
const OrbitRing = ({ radius, duration, dotCount, color, delay = 0, tilt = 70 }) => (
  <motion.div
    style={{
      position: "fixed", pointerEvents: "none", zIndex: 1,
      width: radius * 2, height: radius * 2,
      top: "50%", left: "50%",
      marginTop: -radius, marginLeft: -radius,
      transform: `perspective(900px) rotateX(${tilt}deg)`,
      opacity: 0.28,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: `1px solid ${color}12` }} />
    {Array.from({ length: dotCount }, (_, i) => {
      const angle = (i / dotCount) * 2 * Math.PI;
      const cx = Math.cos(angle) * radius + radius;
      const cy = Math.sin(angle) * radius + radius;
      return (
        <motion.div
          key={i}
          style={{
            position: "absolute", borderRadius: "50%",
            width: i === 0 ? 4 : 2, height: i === 0 ? 4 : 2,
            background: i === 0 ? color : `${color}35`,
            left: cx - (i === 0 ? 2 : 1), top: cy - (i === 0 ? 2 : 1),
            boxShadow: i === 0 ? `0 0 8px ${color}` : "none",
          }}
          animate={i === 0 ? { opacity: [1, 0.3, 1] } : {}}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      );
    })}
  </motion.div>
);

// ─── Status Dot ───────────────────────────────────────────────────────────────
const StatusDot = ({ color = "#34d399", label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
    <div style={{ position: "relative", width: 8, height: 8 }}>
      <motion.div
        style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }}
        animate={{ scale: [1, 2.1], opacity: [0.5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <div style={{ position: "absolute", inset: 0, borderRadius: "50%", background: color }} />
    </div>
    {label && (
      <span style={{ fontFamily: T.font, fontSize: 8, letterSpacing: "0.15em", color: `${color}88`, textTransform: "uppercase" }}>
        {label}
      </span>
    )}
  </div>
);

// ─── Scanline texture ─────────────────────────────────────────────────────────
const Scanline = () => (
  <div aria-hidden style={{
    position: "absolute", inset: 0, pointerEvents: "none",
    backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.055) 3px,rgba(0,0,0,0.055) 4px)",
    borderRadius: "inherit", zIndex: 0,
  }} />
);

// ─── Glowing dot ─────────────────────────────────────────────────────────────
const Dot = ({ color = T.accent, size = 5 }) => (
  <span style={{
    display: "inline-block", width: size, height: size, borderRadius: "50%",
    background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0,
  }} />
);

// ─── Section divider ─────────────────────────────────────────────────────────
const Divider = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "6px 0" }}>
    <div style={{ flex: 1, height: "0.5px", background: T.border }} />
    {label && <span style={{ fontFamily: T.font, fontSize: 8, letterSpacing: "0.22em", color: T.dim, textTransform: "uppercase" }}>{label}</span>}
    <div style={{ flex: 1, height: "0.5px", background: T.border }} />
  </div>
);

// ─── Stat badge ───────────────────────────────────────────────────────────────
const StatBadge = ({ value, label, color = T.accent }) => (
  <div style={{
    padding: "12px 18px", borderRadius: 12,
    background: "rgba(3,7,18,0.74)",
    border: `1px solid ${color}12`,
    backdropFilter: "blur(18px)",
    boxShadow: `0 0 22px ${color}06, inset 0 1px 0 ${color}06`,
    position: "relative", overflow: "hidden",
    display: "flex", flexDirection: "column", gap: 4,
  }}>
    {/* top accent line */}
    <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent 0%, ${color}45 35%, ${color}22 70%, transparent 100%)` }} />
    <Scanline />
    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 22, fontWeight: 700, color, position: "relative", zIndex: 1, lineHeight: 1, textShadow: `0 0 16px ${color}18` }}>
      {value}
    </span>
    <span style={{ fontFamily: T.font, fontSize: 8, letterSpacing: "0.16em", color: T.dim, textTransform: "uppercase", position: "relative", zIndex: 1 }}>
      {label}
    </span>
  </div>
);

// ─── Input field ──────────────────────────────────────────────────────────────
const Field = ({ label, hint, children }) => (
  <div>
    <div style={{ fontFamily: T.font, fontSize: 8, letterSpacing: "0.2em", color: T.dim, textTransform: "uppercase", marginBottom: 7 }}>
      {label}
    </div>
    {children}
    {hint && <div style={{ fontFamily: T.font, fontSize: 8, color: T.dim, marginTop: 5, letterSpacing: "0.05em" }}>{hint}</div>}
  </div>
);

const inputStyle = {
  width: "100%", padding: "10px 13px", borderRadius: 10, outline: "none",
  background: "rgba(255,255,255,0.025)",
  border: "1px solid rgba(56,189,248,0.09)",
  color: T.bright, fontFamily: T.font, fontSize: 11, letterSpacing: "0.03em",
  transition: "border-color 0.15s, box-shadow 0.15s",
  backdropFilter: "blur(12px)",
};

// ─── Email chip (read-only) ───────────────────────────────────────────────────
const EmailChip = ({ email }) => (
  <div style={{
    display: "flex", alignItems: "center", gap: 6,
    padding: "5px 10px", borderRadius: 7,
    background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.12)",
  }}>
    <Mail size={9} style={{ color: T.accentDim, flexShrink: 0 }} />
    <span style={{ fontFamily: T.font, fontSize: 10, color: T.mid, letterSpacing: "0.02em", wordBreak: "break-all" }}>
      {email}
    </span>
  </div>
);

// ─── Email chip (removable) ───────────────────────────────────────────────────
const EmailTag = ({ email, onRemove, disabled }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85 }}
    transition={{ duration: 0.15 }}
    style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 8px 4px 10px", borderRadius: 8,
      background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)",
      maxWidth: "100%",
    }}
  >
    <Mail size={8} style={{ color: T.accentMid, flexShrink: 0 }} />
    <span style={{ fontFamily: T.font, fontSize: 10, color: T.accent, letterSpacing: "0.02em", wordBreak: "break-all", lineHeight: 1.3 }}>
      {email}
    </span>
    {!disabled && (
      <button
        type="button"
        onClick={() => onRemove(email)}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, borderRadius: 4, color: "rgba(56,189,248,0.45)", transition: "color 0.12s", flexShrink: 0 }}
        onMouseEnter={(e) => e.currentTarget.style.color = T.danger}
        onMouseLeave={(e) => e.currentTarget.style.color = "rgba(56,189,248,0.45)"}
      >
        <X size={9} />
      </button>
    )}
  </motion.div>
);

// ─── Multi-email input widget ─────────────────────────────────────────────────
const EmailListInput = ({ emails, onChange, disabled }) => {
  const [inputVal, setInputVal] = useState("");
  const [inputError, setInputError] = useState("");
  const inputRef = React.useRef(null);

  const isValidEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

  const addEmail = (raw) => {
    const parts = raw.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
    const toAdd = [];
    let hasInvalid = false;
    for (const part of parts) {
      if (!isValidEmail(part)) { hasInvalid = true; continue; }
      if (!emails.includes(part)) toAdd.push(part);
    }
    if (toAdd.length) onChange([...emails, ...toAdd]);
    if (hasInvalid && parts.length > 0) {
      setInputError("Invalid email address");
      setTimeout(() => setInputError(""), 2200);
    }
    setInputVal("");
  };

  const handleKey = (e) => {
    if (["Enter", ",", ";", "Tab"].includes(e.key)) {
      e.preventDefault();
      if (inputVal.trim()) addEmail(inputVal);
    } else if (e.key === "Backspace" && !inputVal && emails.length) {
      onChange(emails.slice(0, -1));
    }
    setInputError("");
  };

  const handleRemove = (email) => onChange(emails.filter((e) => e !== email));

  const handlePaste = (e) => {
    e.preventDefault();
    addEmail(e.clipboardData.getData("text"));
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          minHeight: 48, padding: "8px 10px", borderRadius: 10, cursor: "text",
          background: "rgba(255,255,255,0.025)",
          border: `1px solid ${inputError ? "rgba(248,113,113,0.45)" : "rgba(56,189,248,0.09)"}`,
          transition: "border-color 0.15s",
          display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-start",
          backdropFilter: "blur(12px)",
        }}
        onFocusCapture={(e) => { if (!inputError) e.currentTarget.style.borderColor = "rgba(56,189,248,0.34)"; }}
        onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.style.borderColor = inputError ? "rgba(248,113,113,0.45)" : "rgba(56,189,248,0.09)"; }}
      >
        <AnimatePresence>
          {emails.map((email) => (
            <EmailTag key={email} email={email} onRemove={handleRemove} disabled={disabled} />
          ))}
        </AnimatePresence>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setInputError(""); }}
          onKeyDown={handleKey}
          onPaste={handlePaste}
          onBlur={() => { if (inputVal.trim()) addEmail(inputVal); }}
          disabled={disabled}
          placeholder={emails.length === 0 ? "ops@company.com, sre@company.com…" : "Add another…"}
          style={{ flex: 1, minWidth: 140, background: "none", border: "none", outline: "none", color: T.bright, fontFamily: T.font, fontSize: 11, letterSpacing: "0.03em", padding: "3px 2px", opacity: disabled ? 0.5 : 1 }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 7, gap: 8 }}>
        <div style={{ fontFamily: T.font, fontSize: 8, color: inputError ? "rgba(248,113,113,0.8)" : T.dim, letterSpacing: "0.05em", transition: "color 0.2s", display: "flex", alignItems: "center", gap: 4 }}>
          {inputError ? <><AlertTriangle size={8} /> {inputError}</> : "Press Enter, comma or Tab to add · Backspace to remove last"}
        </div>
        <button
          type="button"
          disabled={disabled || !inputVal.trim()}
          onClick={() => { if (inputVal.trim()) addEmail(inputVal); }}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 7,
            cursor: (disabled || !inputVal.trim()) ? "not-allowed" : "pointer",
            background: inputVal.trim() ? "rgba(56,189,248,0.12)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${inputVal.trim() ? "rgba(56,189,248,0.28)" : "rgba(56,189,248,0.09)"}`,
            color: inputVal.trim() ? T.accent : T.dim,
            fontFamily: T.font, fontSize: 9, letterSpacing: "0.1em", fontWeight: 600,
            transition: "all 0.15s", flexShrink: 0,
          }}
          onMouseEnter={(e) => { if (inputVal.trim()) e.currentTarget.style.background = "rgba(56,189,248,0.2)"; }}
          onMouseLeave={(e) => { if (inputVal.trim()) e.currentTarget.style.background = "rgba(56,189,248,0.12)"; }}
        >
          <Plus size={9} /> Add
        </button>
      </div>

      {emails.length > 0 && (
        <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 9px", borderRadius: 99,
            background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.14)",
            fontFamily: T.font, fontSize: 8, color: T.accentMid, letterSpacing: "0.1em",
          }}>
            <Users size={8} />
            {emails.length} recipient{emails.length !== 1 ? "s" : ""} added
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Phone tag (removable) ───────────────────────────────────────────────────
const PhoneTag = ({ phone, onRemove, disabled }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.85 }}
    transition={{ duration: 0.15 }}
    style={{
      display: "inline-flex", alignItems: "center", gap: 5,
      padding: "4px 8px 4px 10px", borderRadius: 8,
      background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)",
      maxWidth: "100%",
    }}
  >
    <Phone size={8} style={{ color: "rgba(129,140,248,0.7)", flexShrink: 0 }} />
    <span style={{ fontFamily: T.font, fontSize: 10, color: "#818cf8", letterSpacing: "0.02em", wordBreak: "break-all", lineHeight: 1.3 }}>
      {phone}
    </span>
    {!disabled && (
      <button
        type="button"
        onClick={() => onRemove(phone)}
        style={{ background: "none", border: "none", cursor: "pointer", display: "flex", alignItems: "center", padding: 2, borderRadius: 4, color: "rgba(129,140,248,0.45)", transition: "color 0.12s", flexShrink: 0 }}
        onMouseEnter={(e) => e.currentTarget.style.color = T.danger}
        onMouseLeave={(e) => e.currentTarget.style.color = "rgba(129,140,248,0.45)"}
      >
        <X size={9} />
      </button>
    )}
  </motion.div>
);

// ─── Multi-phone input widget ─────────────────────────────────────────────────
const PhoneListInput = ({ phones, onChange, disabled }) => {
  const [inputVal, setInputVal] = useState("");
  const [inputError, setInputError] = useState("");
  const inputRef = React.useRef(null);

  const isValidPhone = (v) => /^[+]?[(]?[0-9]{1,4}[)]?[-\s.]?[(]?[0-9]{1,4}[)]?[-\s.]?[0-9]{1,9}$/.test(v.trim());

  const addPhone = (raw) => {
    const parts = raw.split(/[,;\s]+/).map((s) => s.trim()).filter(Boolean);
    const toAdd = [];
    let hasInvalid = false;
    for (const part of parts) {
      if (!isValidPhone(part)) { hasInvalid = true; continue; }
      if (!phones.includes(part)) toAdd.push(part);
    }
    if (toAdd.length) onChange([...phones, ...toAdd]);
    if (hasInvalid && parts.length > 0) {
      setInputError("Invalid phone number");
      setTimeout(() => setInputError(""), 2200);
    }
    setInputVal("");
  };

  const handleKey = (e) => {
    if (["Enter", ",", ";", "Tab"].includes(e.key)) {
      e.preventDefault();
      if (inputVal.trim()) addPhone(inputVal);
    } else if (e.key === "Backspace" && !inputVal && phones.length) {
      onChange(phones.slice(0, -1));
    }
    setInputError("");
  };

  const handleRemove = (phone) => onChange(phones.filter((p) => p !== phone));

  const handlePaste = (e) => {
    e.preventDefault();
    addPhone(e.clipboardData.getData("text"));
  };

  return (
    <div>
      <div
        onClick={() => inputRef.current?.focus()}
        style={{
          minHeight: 48, padding: "8px 10px", borderRadius: 10, cursor: "text",
          background: "rgba(255,255,255,0.025)",
          border: `1px solid ${inputError ? "rgba(248,113,113,0.45)" : "rgba(56,189,248,0.09)"}`,
          transition: "border-color 0.15s",
          display: "flex", flexWrap: "wrap", gap: 6, alignItems: "flex-start",
          backdropFilter: "blur(12px)",
        }}
        onFocusCapture={(e) => { if (!inputError) e.currentTarget.style.borderColor = "rgba(56,189,248,0.34)"; }}
        onBlurCapture={(e) => { if (!e.currentTarget.contains(e.relatedTarget)) e.currentTarget.style.borderColor = inputError ? "rgba(248,113,113,0.45)" : "rgba(56,189,248,0.09)"; }}
      >
        <AnimatePresence>
          {phones.map((phone) => (
            <PhoneTag key={phone} phone={phone} onRemove={handleRemove} disabled={disabled} />
          ))}
        </AnimatePresence>
        <input
          ref={inputRef}
          type="text"
          value={inputVal}
          onChange={(e) => { setInputVal(e.target.value); setInputError(""); }}
          onKeyDown={handleKey}
          onPaste={handlePaste}
          onBlur={() => { if (inputVal.trim()) addPhone(inputVal); }}
          disabled={disabled}
          placeholder={phones.length === 0 ? "+91 9876543210, +1 2345678900…" : "Add another…"}
          style={{ flex: 1, minWidth: 140, background: "none", border: "none", outline: "none", color: T.bright, fontFamily: T.font, fontSize: 11, letterSpacing: "0.03em", padding: "3px 2px", opacity: disabled ? 0.5 : 1 }}
        />
      </div>

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 7, gap: 8 }}>
        <div style={{ fontFamily: T.font, fontSize: 8, color: inputError ? "rgba(248,113,113,0.8)" : T.dim, letterSpacing: "0.05em", transition: "color 0.2s", display: "flex", alignItems: "center", gap: 4 }}>
          {inputError ? <><AlertTriangle size={8} /> {inputError}</> : "Press Enter, comma or Tab to add · Backspace to remove last"}
        </div>
        <button
          type="button"
          disabled={disabled || !inputVal.trim()}
          onClick={() => { if (inputVal.trim()) addPhone(inputVal); }}
          style={{
            display: "flex", alignItems: "center", gap: 5,
            padding: "4px 10px", borderRadius: 7,
            cursor: (disabled || !inputVal.trim()) ? "not-allowed" : "pointer",
            background: inputVal.trim() ? "rgba(129,140,248,0.12)" : "rgba(255,255,255,0.03)",
            border: `1px solid ${inputVal.trim() ? "rgba(129,140,248,0.28)" : "rgba(56,189,248,0.09)"}`,
            color: inputVal.trim() ? "#818cf8" : T.dim,
            fontFamily: T.font, fontSize: 9, letterSpacing: "0.1em", fontWeight: 600,
            transition: "all 0.15s", flexShrink: 0,
          }}
          onMouseEnter={(e) => { if (inputVal.trim()) e.currentTarget.style.background = "rgba(129,140,248,0.2)"; }}
          onMouseLeave={(e) => { if (inputVal.trim()) e.currentTarget.style.background = "rgba(129,140,248,0.12)"; }}
        >
          <Plus size={9} /> Add
        </button>
      </div>

      {phones.length > 0 && (
        <div style={{ marginTop: 7, display: "flex", alignItems: "center", gap: 6 }}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            padding: "3px 9px", borderRadius: 99,
            background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.14)",
            fontFamily: T.font, fontSize: 8, color: "rgba(129,140,248,0.7)", letterSpacing: "0.1em",
          }}>
            <Phone size={8} />
            {phones.length} phone{phones.length !== 1 ? "s" : ""} added
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Notification Group card ───────────────────────────────────────────────────────
const NotificationGroupCard = ({ group, index, onEdit, onDelete, isDeleting }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        borderRadius: 14, position: "relative", overflow: "hidden",
        background: "rgba(3,7,18,0.74)", border: "1px solid rgba(129,140,248,0.08)",
        backdropFilter: "blur(16px)",
        boxShadow: "0 0 18px rgba(129,140,248,0.04), inset 0 1px 0 rgba(129,140,248,0.06)",
      }}
    >
      <Scanline />
      <div style={{ position: "relative", zIndex: 1 }}>
        {/* Card header */}
        <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: expanded ? "1px solid rgba(129,140,248,0.08)" : "none" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12, flex: 1 }}>
            <div style={{ width: 38, height: 38, borderRadius: 10, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.18)" }}>
              <Phone size={16} style={{ color: "#818cf8" }} />
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, color: "white", letterSpacing: "0.05em", marginBottom: 3, display: "flex", alignItems: "center", gap: 8 }}>
                {group.groupName}
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.14)" }}>
                  <Mail size={7} style={{ color: "rgba(129,140,248,0.7)" }} />
                  <span style={{ fontFamily: T.font, fontSize: 7, color: "rgba(129,140,248,0.8)", letterSpacing: "0.08em" }}>{group.emails?.length || 0}</span>
                </div>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 4, padding: "2px 8px", borderRadius: 99, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.14)" }}>
                  <Phone size={7} style={{ color: "rgba(34,197,94,0.7)" }} />
                  <span style={{ fontFamily: T.font, fontSize: 7, color: "rgba(34,197,94,0.8)", letterSpacing: "0.08em" }}>{group.phoneNumbers?.length || 0}</span>
                </div>
              </div>
              <div style={{ fontFamily: T.font, fontSize: 8, color: T.dim, letterSpacing: "0.05em", display: "flex", alignItems: "center", gap: 8 }}>
                <span>Created {new Date(group.createdAt).toLocaleDateString()}</span>
                {group.owner && (
            <span style={{ fontFamily: T.font, fontSize: 8, color: T.dim, letterSpacing: "0.08em" }}>
              By {group.owner.name || group.owner.email} ({group.owner.role})
            </span>
          )}
                {group.description && <span style={{ color: "rgba(129,140,248,0.5)" }}>· {group.description}</span>}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <button
              onClick={() => setExpanded(!expanded)}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, display: "flex", padding: 6, borderRadius: 6, transition: "all 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = T.mid}
              onMouseLeave={(e) => e.currentTarget.style.color = T.dim}
            >
              <motion.div animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.2 }}>
                <RefreshCw size={11} />
              </motion.div>
            </button>
            <button
              onClick={() => onEdit(group)}
              style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, display: "flex", padding: 6, borderRadius: 6, transition: "color 0.15s" }}
              onMouseEnter={(e) => e.currentTarget.style.color = "#818cf8"}
              onMouseLeave={(e) => e.currentTarget.style.color = T.dim}
            >
              <Edit2 size={11} />
            </button>
            <button
              onClick={() => onDelete(group._id)}
              disabled={isDeleting}
              style={{ background: "none", border: "none", cursor: isDeleting ? "not-allowed" : "pointer", color: isDeleting ? "rgba(248,113,113,0.3)" : "rgba(248,113,113,0.5)", display: "flex", padding: 6, borderRadius: 6, transition: "color 0.15s" }}
              onMouseEnter={(e) => { if (!isDeleting) e.currentTarget.style.color = T.danger; }}
              onMouseLeave={(e) => e.currentTarget.style.color = isDeleting ? "rgba(248,113,113,0.3)" : "rgba(248,113,113,0.5)"}
            >
              {isDeleting ? <RefreshCw size={11} style={{ animation: "spin 0.8s linear infinite" }} /> : <Trash2 size={11} />}
            </button>
          </div>
        </div>

        {/* Expanded details */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ padding: "16px", borderTop: "1px solid rgba(129,140,248,0.08)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                  {group.emails && group.emails.length > 0 && (
                    <div>
                      <div style={{ fontFamily: T.font, fontSize: 8, color: "rgba(129,140,248,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <Mail size={8} /> Email Addresses
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {group.emails.map((email, idx) => (
                          <div key={idx} style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(129,140,248,0.08)", border: "1px solid rgba(129,140,248,0.14)", fontFamily: T.font, fontSize: 9, color: "rgba(129,140,248,0.9)", letterSpacing: "0.03em" }}>
                            {email}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {group.phoneNumbers && group.phoneNumbers.length > 0 && (
                    <div>
                      <div style={{ fontFamily: T.font, fontSize: 8, color: "rgba(34,197,94,0.7)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 }}>
                        <Phone size={8} /> Phone Numbers
                      </div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                        {group.phoneNumbers.map((phone, idx) => (
                          <div key={idx} style={{ padding: "4px 10px", borderRadius: 6, background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.14)", fontFamily: T.font, fontSize: 9, color: "rgba(34,197,94,0.9)", letterSpacing: "0.03em" }}>
                            {phone}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

// ─── Group card ───────────────────────────────────────────────────────────────
const GroupCard = ({ group, index, onEdit, onDelete, isDeleting }) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.97 }}
      transition={{ delay: index * 0.04, duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      style={{
        borderRadius: 16, overflow: "hidden", position: "relative",
        background: "rgba(3,7,18,0.74)",
        border: "1px solid rgba(56,189,248,0.08)",
        backdropFilter: "blur(18px)",
        boxShadow: "0 0 22px rgba(56,189,248,0.04)",
        transition: "border-color 0.2s, box-shadow 0.2s",
      }}
      whileHover={{ borderColor: "rgba(56,189,248,0.18)" }}
    >
      {/* top accent line */}
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.35) 35%, rgba(56,189,248,0.15) 70%, transparent 100%)" }} />
      {/* top-right corner bracket */}
      <div style={{ position: "absolute", top: 0, right: 0, width: 28, height: 28, overflow: "hidden" }}>
        <div style={{ position: "absolute", top: 0, right: 0, width: 1, height: 16, background: "rgba(56,189,248,0.22)" }} />
        <div style={{ position: "absolute", top: 0, right: 0, height: 1, width: 16, background: "rgba(56,189,248,0.22)" }} />
      </div>
      <Scanline />

      <div style={{ position: "relative", zIndex: 1, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Dot color={T.accent} />
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, fontWeight: 700, color: T.bright, letterSpacing: "0.06em" }}>
                {group.groupName}
              </span>
            </div>
            {group.description && (
              <div style={{ fontFamily: T.font, fontSize: 9, color: T.dim, letterSpacing: "0.06em", paddingLeft: 13 }}>
                {group.description}
              </div>
            )}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            <ActionBtn icon={<Edit2 size={12} />} label="Edit" color="#38bdf8" onClick={() => onEdit(group)} />
            <ActionBtn
              icon={isDeleting ? <RefreshCw size={12} style={{ animation: "spin 1s linear infinite" }} /> : <Trash2 size={12} />}
              label="Delete" color={T.danger}
              onClick={() => onDelete(group._id)}
              disabled={isDeleting}
            />
          </div>
        </div>

        <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "4px 10px", borderRadius: 7, background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.13)" }}>
            <Users size={9} style={{ color: T.accentDim }} />
            <span style={{ fontFamily: T.font, fontSize: 9, color: T.accentMid, letterSpacing: "0.08em" }}>
              {group.emails.length} recipient{group.emails.length !== 1 ? "s" : ""}
            </span>
          </div>

          {group.createdAt && (
            <span style={{ fontFamily: T.font, fontSize: 8, color: T.dim, letterSpacing: "0.08em" }}>
              {new Date(group.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
          )}

          {group.owner && (
            <span style={{ fontFamily: T.font, fontSize: 8, color: T.dim, letterSpacing: "0.08em" }}>
              By {group.owner.name || group.owner.email} ({group.owner.role})
            </span>
          )}

          <button
            onClick={() => setExpanded((v) => !v)}
            style={{ marginLeft: "auto", fontFamily: T.font, fontSize: 8, letterSpacing: "0.12em", color: T.dim, background: "none", border: "none", cursor: "pointer", textTransform: "uppercase", transition: "color 0.15s", display: "flex", alignItems: "center", gap: 4 }}
            onMouseEnter={(e) => e.currentTarget.style.color = T.accent}
            onMouseLeave={(e) => e.currentTarget.style.color = T.dim}
          >
            {expanded ? "Hide" : "Show"} emails
            <span style={{ transform: expanded ? "rotate(180deg)" : "none", display: "inline-block", transition: "transform 0.2s" }}>▾</span>
          </button>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.22 }}
              style={{ overflow: "hidden" }}
            >
              <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 5 }}>
                <Divider label="Recipients" />
                <div style={{ marginTop: 6, display: "flex", flexDirection: "column", gap: 5 }}>
                  {group.emails.map((email, i) => (
                    <motion.div key={i} initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}>
                      <EmailChip email={email} />
                    </motion.div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: 1, background: `linear-gradient(90deg, transparent, ${T.accentDim}, transparent)`, opacity: 0.5 }} />
    </motion.div>
  );
};

// ─── Icon action button ───────────────────────────────────────────────────────
const ActionBtn = ({ icon, label, color, onClick, disabled }) => (
  <button
    type="button" onClick={onClick} disabled={disabled} title={label}
    style={{ width: 30, height: 30, borderRadius: 8, display: "flex", alignItems: "center", justifyContent: "center", background: "transparent", border: "1px solid rgba(56,189,248,0.08)", color: T.dim, cursor: disabled ? "not-allowed" : "pointer", transition: "all 0.15s", opacity: disabled ? 0.5 : 1 }}
    onMouseEnter={(e) => { if (!disabled) { e.currentTarget.style.background = `${color}14`; e.currentTarget.style.borderColor = `${color}35`; e.currentTarget.style.color = color; } }}
    onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "rgba(56,189,248,0.08)"; e.currentTarget.style.color = T.dim; }}
  >
    {icon}
  </button>
);

// ─── Primary button ───────────────────────────────────────────────────────────
const PrimaryBtn = ({ children, onClick, type = "button", disabled, loading }) => (
  <button
    type={type} onClick={onClick} disabled={disabled || loading}
    style={{
      flex: 1, padding: "10px 14px", borderRadius: 10,
      cursor: (disabled || loading) ? "not-allowed" : "pointer",
      background: loading || disabled ? "rgba(56,189,248,0.06)" : "rgba(56,189,248,0.12)",
      border: `1px solid ${loading || disabled ? "rgba(56,189,248,0.13)" : "rgba(56,189,248,0.28)"}`,
      color: loading || disabled ? "rgba(56,189,248,0.35)" : T.accent,
      fontFamily: T.font, fontSize: 10, letterSpacing: "0.1em", fontWeight: 600,
      display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
      transition: "all 0.15s", backdropFilter: "blur(12px)",
    }}
    onMouseEnter={(e) => { if (!disabled && !loading) e.currentTarget.style.background = "rgba(56,189,248,0.18)"; }}
    onMouseLeave={(e) => { if (!disabled && !loading) e.currentTarget.style.background = "rgba(56,189,248,0.12)"; }}
  >
    {loading ? <><RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} /> Saving…</> : children}
  </button>
);

const GhostBtn = ({ children, onClick, type = "button", disabled }) => (
  <button
    type={type} onClick={onClick} disabled={disabled}
    style={{ flex: 1, padding: "10px 14px", borderRadius: 10, cursor: "pointer", background: "transparent", border: "1px solid rgba(56,189,248,0.08)", color: T.dim, fontFamily: T.font, fontSize: 10, letterSpacing: "0.08em", transition: "all 0.15s" }}
    onMouseEnter={(e) => { e.currentTarget.style.color = T.mid; e.currentTarget.style.borderColor = "rgba(56,189,248,0.25)"; }}
    onMouseLeave={(e) => { e.currentTarget.style.color = T.dim; e.currentTarget.style.borderColor = "rgba(56,189,248,0.08)"; }}
  >
    {children}
  </button>
);

// ─── Main Component ──────────────────────────────────────────────────────────
const EscalationGroups = () => {
  // Tab state
  const [activeTab, setActiveTab] = useState("escalation");

  // Escalation Groups state
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);
  const [formData, setFormData] = useState({ groupName: "", emails: [], description: "" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Notification Groups state
  const [notificationGroups, setNotificationGroups] = useState([]);
  const [notificationLoading, setNotificationLoading] = useState(true);
  const [notificationEditingId, setNotificationEditingId] = useState(null);
  const [notificationDeletingId, setNotificationDeletingId] = useState(null);
  const [notificationFormData, setNotificationFormData] = useState({ groupName: "", emails: [], phoneNumbers: [], description: "" });
  const [notificationFormOpen, setNotificationFormOpen] = useState(false);
  const [notificationDeleteModalOpen, setNotificationDeleteModalOpen] = useState(false);
  const [notificationDeleteTarget, setNotificationDeleteTarget] = useState(null);
  const [notificationIsDeleting, setNotificationIsDeleting] = useState(false);

  useEffect(() => { fetchGroups(); fetchNotificationGroups(); }, []);

  useEffect(() => {
    if (success || error) {
      const t = setTimeout(() => { setSuccess(""); setError(""); }, 4000);
      return () => clearTimeout(t);
    }
  }, [success, error]);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const r = await axios.get("/escalation-groups/my-groups");
      if (r.data.success) setGroups(r.data.data);
    } catch (e) {
      setError("Failed to fetch groups");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotificationGroups = async () => {
    try {
      setNotificationLoading(true);
      const r = await axios.get("/notification-groups/my-groups");
      if (r.data.success) setNotificationGroups(r.data.data);
    } catch (e) {
      setError("Failed to fetch notification groups");
    } finally {
      setNotificationLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!formData.groupName.trim()) { setError("Group name is required"); return; }
    const emailArray = formData.emails.filter(Boolean);
    if (!emailArray.length) { setError("At least one email is required"); return; }

    try {
      setIsSubmitting(true);
      const payload = { groupName: formData.groupName.trim(), emails: emailArray, description: formData.description.trim() };
      if (editingId) {
        const r = await axios.put(`/escalation-groups/${editingId}`, payload);
        if (r.data.success) { setSuccess("Group updated successfully"); setGroups(groups.map((g) => g._id === editingId ? r.data.data : g)); resetForm(); }
      } else {
        const r = await axios.post("/escalation-groups", payload);
        if (r.data.success) { setSuccess("Group created successfully"); setGroups([r.data.data, ...groups]); resetForm(); }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = (group) => {
    setFormData({ groupName: group.groupName, emails: group.emails || [], description: group.description || "" });
    setEditingId(group._id);
    setFormOpen(true);
    setError(""); setSuccess("");
  };

  const handleDeleteClick = (group) => {
    setDeleteTarget(group);
    setDeleteModalOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      setDeletingId(deleteTarget._id);
      const r = await axios.delete(`/escalation-groups/${deleteTarget._id}`);
      if (r.data.success) {
        setGroups(groups.filter((g) => g._id !== deleteTarget._id));
        setSuccess("Group deleted");
        setDeleteModalOpen(false);
        setDeleteTarget(null);
      }
    } catch {
      setError("Failed to delete group");
    } finally {
      setDeletingId(null);
      setIsDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  const handleDelete = async (id) => {
    const group = groups.find((g) => g._id === id);
    if (group) {
      handleDeleteClick(group);
    }
  };

  const resetForm = () => {
    setFormData({ groupName: "", emails: [], description: "" });
    setEditingId(null);
    setFormOpen(false);
  };

  // Notification Groups CRUD
  const handleNotificationSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSuccess("");
    if (!notificationFormData.groupName.trim()) { setError("Group name is required"); return; }
    const emailArray = notificationFormData.emails.filter(Boolean);
    const phoneArray = notificationFormData.phoneNumbers.filter(Boolean);
    if (!emailArray.length && !phoneArray.length) { setError("At least one email or phone number is required"); return; }

    try {
      setIsSubmitting(true);
      const payload = {
        groupName: notificationFormData.groupName.trim(),
        emails: emailArray,
        phoneNumbers: phoneArray,
        description: notificationFormData.description.trim()
      };
      if (notificationEditingId) {
        const r = await axios.put(`/notification-groups/${notificationEditingId}`, payload);
        if (r.data.success) {
          setSuccess("Group updated successfully");
          setNotificationGroups(notificationGroups.map((g) => g._id === notificationEditingId ? r.data.data : g));
          resetNotificationForm();
        }
      } else {
        const r = await axios.post("/notification-groups", payload);
        if (r.data.success) {
          setSuccess("Group created successfully");
          setNotificationGroups([r.data.data, ...notificationGroups]);
          resetNotificationForm();
        }
      }
    } catch (err) {
      setError(err.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNotificationEdit = (group) => {
    setNotificationFormData({
      groupName: group.groupName,
      emails: group.emails || [],
      phoneNumbers: group.phoneNumbers || [],
      description: group.description || ""
    });
    setNotificationEditingId(group._id);
    setNotificationFormOpen(true);
    setError(""); setSuccess("");
  };

  const handleNotificationDeleteClick = (group) => {
    setNotificationDeleteTarget(group);
    setNotificationDeleteModalOpen(true);
  };

  const handleNotificationDeleteConfirm = async () => {
    if (!notificationDeleteTarget) return;
    setNotificationIsDeleting(true);
    try {
      setNotificationDeletingId(notificationDeleteTarget._id);
      const r = await axios.delete(`/notification-groups/${notificationDeleteTarget._id}`);
      if (r.data.success) {
        setNotificationGroups(notificationGroups.filter((g) => g._id !== notificationDeleteTarget._id));
        setSuccess("Group deleted");
        setNotificationDeleteModalOpen(false);
        setNotificationDeleteTarget(null);
      }
    } catch {
      setError("Failed to delete group");
    } finally {
      setNotificationDeletingId(null);
      setNotificationIsDeleting(false);
    }
  };

  const handleNotificationDeleteCancel = () => {
    setNotificationDeleteModalOpen(false);
    setNotificationDeleteTarget(null);
  };

  const handleNotificationDelete = async (id) => {
    const group = notificationGroups.find((g) => g._id === id);
    if (group) {
      handleNotificationDeleteClick(group);
    }
  };

  const resetNotificationForm = () => {
    setNotificationFormData({ groupName: "", emails: [], phoneNumbers: [], description: "" });
    setNotificationEditingId(null);
    setNotificationFormOpen(false);
  };

  const totalEmails = groups.reduce((acc, g) => acc + (g.emails?.length || 0), 0);
  const totalNotificationEmails = notificationGroups.reduce((acc, g) => acc + (g.emails?.length || 0), 0);
  const totalNotificationPhones = notificationGroups.reduce((acc, g) => acc + (g.phoneNumbers?.length || 0), 0);

  return (
    <>
      <FontLoader />
      <Background />
      <CursorGlow />

      <OrbitRing radius={220} duration={22} dotCount={8} color="#38bdf8" tilt={72} />
      <OrbitRing radius={290} duration={34} dotCount={12} color="#818cf8" tilt={66} delay={1.2} />
      <OrbitRing radius={155} duration={15} dotCount={5} color="#34d399" tilt={74} delay={0.5} />

      {[["tl", 0.10], ["tr", 0.16], ["bl", 0.22], ["br", 0.28]].map(([pos, delay]) => (
        <HUDCorner key={pos} pos={pos} delay={delay} />
      ))}

      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        input::placeholder, textarea::placeholder { color: rgba(148,163,184,0.3); }
        input:focus, textarea:focus { border-color: rgba(56,189,248,0.34) !important; box-shadow: 0 0 0 3px rgba(56,189,248,0.06), 0 0 18px rgba(56,189,248,0.035) !important; outline: none; }
        ::-webkit-scrollbar { width: 4px; } ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: rgba(56,189,248,0.15); border-radius: 4px; }
        * { box-sizing: border-box; }
      `}</style>

      <div style={{ position: "relative", zIndex: 10, minHeight: "100vh", fontFamily: T.font }}>
        <div style={{ maxWidth: 1100, margin: "0 auto", padding: "40px 24px" }}>

          {/* ── Page header ── */}
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
            style={{ marginBottom: 36 }}
          >
            {/* Breadcrumb */}
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 16, fontFamily: T.font, fontSize: 8, letterSpacing: "0.28em", textTransform: "uppercase", color: T.dim }}>
              <div style={{ height: 1, width: 28, background: "rgba(56,189,248,0.25)" }} />
              <Shield size={9} style={{ color: T.accentDim }} />
              <span>Alert System › Groups</span>
              <div style={{ height: 1, width: 80, background: "rgba(56,189,248,0.1)" }} />
            </div>

            <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
                  <div style={{ width: 42, height: 42, borderRadius: 12, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)" }}>
                    <Mail size={18} style={{ color: T.accent }} />
                  </div>
                  <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "clamp(20px, 4vw, 28px)", fontWeight: 800, color: "white", letterSpacing: "0.05em", margin: 0, textShadow: "0 0 28px rgba(56,189,248,0.08)" }}>
                    GROUPS
                  </h1>
                </div>
                <div style={{ fontFamily: T.font, fontSize: "9px", color: T.dim, letterSpacing: "0.05em" }}>
                  {new Date().toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <StatBadge value={activeTab === "escalation" ? groups.length : notificationGroups.length} label="Groups" color={T.accent} />
                <StatBadge value={activeTab === "escalation" ? totalEmails : totalNotificationEmails} label="Emails" color="rgba(167,139,250,0.9)" />
                {activeTab === "notification" && <StatBadge value={totalNotificationPhones} label="Phones" color="rgba(34,197,94,0.9)" />}
              </div>
            </div>
          </motion.div>

          {/* ── Tab Switcher ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            style={{ marginBottom: 20 }}
          >
            <div style={{ display: "flex", gap: 8, padding: 4, borderRadius: 12, background: "rgba(3,7,18,0.66)", border: "1px solid rgba(56,189,248,0.08)", backdropFilter: "blur(14px)" }}>
              <button
                onClick={() => setActiveTab("escalation")}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: 10,
                  cursor: "pointer", background: activeTab === "escalation" ? "rgba(56,189,248,0.12)" : "transparent",
                  border: activeTab === "escalation" ? "1px solid rgba(56,189,248,0.28)" : "1px solid transparent",
                  color: activeTab === "escalation" ? T.accent : T.dim,
                  fontFamily: T.font, fontSize: 10, letterSpacing: "0.1em", fontWeight: 600,
                  transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
                onMouseEnter={(e) => { if (activeTab !== "escalation") e.currentTarget.style.background = "rgba(56,189,248,0.06)"; }}
                onMouseLeave={(e) => { if (activeTab !== "escalation") e.currentTarget.style.background = "transparent"; }}
              >
                <Mail size={12} /> Escalation Groups
              </button>
              <button
                onClick={() => setActiveTab("notification")}
                style={{
                  flex: 1, padding: "10px 16px", borderRadius: 10,
                  cursor: "pointer", background: activeTab === "notification" ? "rgba(129,140,248,0.12)" : "transparent",
                  border: activeTab === "notification" ? "1px solid rgba(129,140,248,0.28)" : "1px solid transparent",
                  color: activeTab === "notification" ? "#818cf8" : T.dim,
                  fontFamily: T.font, fontSize: 10, letterSpacing: "0.1em", fontWeight: 600,
                  transition: "all 0.15s", display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                }}
                onMouseEnter={(e) => { if (activeTab !== "notification") e.currentTarget.style.background = "rgba(129,140,248,0.06)"; }}
                onMouseLeave={(e) => { if (activeTab !== "notification") e.currentTarget.style.background = "transparent"; }}
              >
                <Phone size={12} /> Notification Groups
              </button>
            </div>
          </motion.div>

          {/* ── Status bar ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45 }}
            style={{
              marginBottom: 20, padding: "10px 16px", borderRadius: 12,
              background: "rgba(3,7,18,0.66)", border: "1px solid rgba(56,189,248,0.08)",
              backdropFilter: "blur(14px)", boxShadow: "0 0 18px rgba(56,189,248,0.02)",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ height: 28, width: 2, borderRadius: 99, background: "linear-gradient(to bottom, rgba(56,189,248,0.6), transparent)" }} />
              <div>
                <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: 10, letterSpacing: "0.08em", color: "white" }}>
                  {activeTab === "escalation" ? "ALERT ROUTING PANEL" : "NOTIFICATION GROUPS PANEL"}
                </div>
                <div style={{ fontFamily: T.font, fontSize: 9, color: T.dim, marginTop: 3 }}>
                  {activeTab === "escalation"
                    ? `${groups.length} group${groups.length !== 1 ? "s" : ""} configured · ${totalEmails} total recipients`
                    : `${notificationGroups.length} group${notificationGroups.length !== 1 ? "s" : ""} configured · ${totalNotificationEmails} emails · ${totalNotificationPhones} phones`
                  }
                </div>
              </div>
            </div>
            <StatusDot color="#38bdf8" label="Live" />
          </motion.div>

          {/* ── Global feedback bar ── */}
          <AnimatePresence>
            {(error || success) && (
              <motion.div
                initial={{ opacity: 0, y: -8, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -8, height: 0 }}
                style={{
                  marginBottom: 20, padding: "10px 16px", borderRadius: 10,
                  background: error ? T.dangerFaint : T.successFaint,
                  border: `1px solid ${error ? "rgba(248,113,113,0.22)" : "rgba(134,239,172,0.22)"}`,
                  color: error ? "rgba(252,165,165,0.9)" : "rgba(134,239,172,0.9)",
                  fontFamily: T.font, fontSize: 10, letterSpacing: "0.06em",
                  display: "flex", alignItems: "center", gap: 8,
                  backdropFilter: "blur(12px)",
                }}
              >
                {error ? <AlertTriangle size={11} /> : <Check size={11} />}
                {error || success}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Main layout ── */}
          {activeTab === "escalation" ? (
            <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>

              {/* ─── Left: Form panel ─── */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
              >
                <div style={{
                  borderRadius: 16, overflow: "hidden", position: "sticky", top: 24,
                  background: "rgba(3,7,18,0.74)",
                  border: "1px solid rgba(56,189,248,0.08)",
                  backdropFilter: "blur(18px)",
                  boxShadow: "0 0 22px rgba(56,189,248,0.04), inset 0 1px 0 rgba(56,189,248,0.06)",
                }}>
                  {/* top accent line */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.45) 35%, rgba(56,189,248,0.22) 70%, transparent 100%)" }} />
                  <Scanline />
                  <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Form header */}
                    <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid rgba(56,189,248,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.18)" }}>
                          {editingId ? <Edit2 size={11} style={{ color: T.accent }} /> : <Plus size={11} style={{ color: T.accent }} />}
                        </div>
                        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: T.accent, textTransform: "uppercase" }}>
                          {editingId ? "Edit Group" : "New Group"}
                        </span>
                      </div>
                      {(formOpen || editingId) && (
                        <button onClick={resetForm} style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, display: "flex", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
                          onMouseEnter={(e) => e.currentTarget.style.color = T.bright}
                          onMouseLeave={(e) => e.currentTarget.style.color = T.dim}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <div style={{ padding: "20px" }}>
                      <form onSubmit={handleSubmit}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <Field label="Group Name *">
                            <input
                              type="text"
                              placeholder="e.g. Critical Alert Team"
                              value={formData.groupName}
                              onChange={(e) => setFormData({ ...formData, groupName: e.target.value })}
                              disabled={isSubmitting}
                              style={{ ...inputStyle, opacity: isSubmitting ? 0.6 : 1 }}
                            />
                          </Field>

                          <Field label="Recipient Emails *">
                            <EmailListInput
                              emails={formData.emails}
                              onChange={(arr) => setFormData({ ...formData, emails: arr })}
                              disabled={isSubmitting}
                            />
                          </Field>

                          <Field label="Description">
                            <input
                              type="text"
                              placeholder="e.g. 24/7 on-call engineers"
                              value={formData.description}
                              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                              disabled={isSubmitting}
                              style={{ ...inputStyle, opacity: isSubmitting ? 0.6 : 1 }}
                            />
                          </Field>

                          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                            <PrimaryBtn type="submit" loading={isSubmitting}>
                              {editingId ? "Update Group" : "Create Group"}
                            </PrimaryBtn>
                            {(formOpen || editingId) && (
                              <GhostBtn type="button" onClick={resetForm} disabled={isSubmitting}>Cancel</GhostBtn>
                            )}
                          </div>
                        </div>
                      </form>

                      {!formOpen && !editingId && (
                        <div style={{ marginTop: 16 }}>
                          <Divider />
                          <button
                            onClick={() => setFormOpen(true)}
                            style={{
                              width: "100%", marginTop: 12, padding: "10px 14px", borderRadius: 10,
                              cursor: "pointer", background: "rgba(56,189,248,0.06)",
                              border: "1px dashed rgba(56,189,248,0.22)",
                              color: "rgba(56,189,248,0.55)", fontFamily: T.font,
                              fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
                              transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(56,189,248,0.1)"; e.currentTarget.style.color = T.accent; e.currentTarget.style.borderColor = "rgba(56,189,248,0.35)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(56,189,248,0.06)"; e.currentTarget.style.color = "rgba(56,189,248,0.55)"; e.currentTarget.style.borderColor = "rgba(56,189,248,0.22)"; }}
                          >
                            <Plus size={12} /> Create new group
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ─── Right: Groups list ─── */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.15 }}
              >
                {/* List header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 16, padding: "10px 16px", borderRadius: 12,
                  background: "rgba(3,7,18,0.66)", border: "1px solid rgba(56,189,248,0.08)",
                  backdropFilter: "blur(14px)", position: "relative", overflow: "hidden",
                }}>
                  <Scanline />
                  <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                    <Users size={12} style={{ color: T.accentDim }} />
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: T.mid, fontWeight: 700 }}>
                      Active Groups
                    </span>
                  </div>
                  <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                    {loading && <RefreshCw size={10} style={{ color: T.dim, animation: "spin 1s linear infinite" }} />}
                    <button
                      onClick={fetchGroups}
                      style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, display: "flex", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
                      title="Refresh"
                      onMouseEnter={(e) => e.currentTarget.style.color = T.accent}
                      onMouseLeave={(e) => e.currentTarget.style.color = T.dim}
                    >
                      <RefreshCw size={11} />
                    </button>
                  </div>
                </div>

                {loading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <RefreshCw size={20} style={{ color: T.accentDim, animation: "spin 1s linear infinite" }} />
                      <span style={{ fontFamily: T.font, fontSize: 9, color: T.dim, letterSpacing: "0.14em", textTransform: "uppercase" }}>Loading groups…</span>
                    </div>
                  </div>
                ) : groups.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      padding: "60px 32px", borderRadius: 16, textAlign: "center",
                      background: "rgba(3,7,18,0.68)", border: "1px dashed rgba(56,189,248,0.08)",
                      backdropFilter: "blur(16px)", position: "relative", overflow: "hidden",
                    }}
                  >
                    <Scanline />
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px", background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Mail size={22} style={{ color: T.accentDim }} />
                      </div>
                      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, color: T.mid, fontWeight: 700, marginBottom: 8, letterSpacing: "0.06em" }}>
                        NO ESCALATION GROUPS
                      </div>
                      <div style={{ fontFamily: T.font, fontSize: 9, color: T.dim, letterSpacing: "0.07em", lineHeight: 1.7 }}>
                        Create your first group to define<br />alert recipients and routing destinations.
                      </div>
                      <button
                        onClick={() => setFormOpen(true)}
                        style={{ marginTop: 20, padding: "9px 20px", borderRadius: 10, cursor: "pointer", background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.25)", color: T.accent, fontFamily: T.font, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 6 }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(56,189,248,0.18)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(56,189,248,0.1)"}
                      >
                        <Plus size={11} /> Create first group
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <AnimatePresence>
                      {groups.map((group, i) => (
                        <GroupCard key={group._id} group={group} index={i} onEdit={handleEdit} onDelete={handleDelete} isDeleting={deletingId === group._id} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "340px 1fr", gap: 20, alignItems: "start" }}>
              {/* ─── Left: Notification Form panel ─── */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.1 }}
              >
                <div style={{
                  borderRadius: 16, overflow: "hidden", position: "sticky", top: 24,
                  background: "rgba(3,7,18,0.74)",
                  border: "1px solid rgba(129,140,248,0.08)",
                  backdropFilter: "blur(18px)",
                  boxShadow: "0 0 22px rgba(129,140,248,0.04), inset 0 1px 0 rgba(129,140,248,0.06)",
                }}>
                  {/* top accent line */}
                  <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, transparent 0%, rgba(129,140,248,0.45) 35%, rgba(129,140,248,0.22) 70%, transparent 100%)" }} />
                  <Scanline />
                  <div style={{ position: "relative", zIndex: 1 }}>
                    {/* Form header */}
                    <div style={{ padding: "16px 20px 14px", borderBottom: "1px solid rgba(129,140,248,0.08)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <div style={{ width: 26, height: 26, borderRadius: 7, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.18)" }}>
                          {notificationEditingId ? <Edit2 size={11} style={{ color: "#818cf8" }} /> : <Plus size={11} style={{ color: "#818cf8" }} />}
                        </div>
                        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, fontWeight: 700, letterSpacing: "0.14em", color: "#818cf8", textTransform: "uppercase" }}>
                          {notificationEditingId ? "Edit Group" : "New Group"}
                        </span>
                      </div>
                      {(notificationFormOpen || notificationEditingId) && (
                        <button onClick={resetNotificationForm} style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, display: "flex", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
                          onMouseEnter={(e) => e.currentTarget.style.color = T.bright}
                          onMouseLeave={(e) => e.currentTarget.style.color = T.dim}
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    <div style={{ padding: "20px" }}>
                      <form onSubmit={handleNotificationSubmit}>
                        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                          <Field label="Group Name *">
                            <input
                              type="text"
                              placeholder="e.g. Critical Alert Team"
                              value={notificationFormData.groupName}
                              onChange={(e) => setNotificationFormData({ ...notificationFormData, groupName: e.target.value })}
                              disabled={isSubmitting}
                              style={{ ...inputStyle, opacity: isSubmitting ? 0.6 : 1 }}
                            />
                          </Field>

                          <Field label="Email Addresses">
                            <EmailListInput
                              emails={notificationFormData.emails}
                              onChange={(arr) => setNotificationFormData({ ...notificationFormData, emails: arr })}
                              disabled={isSubmitting}
                            />
                          </Field>

                          <Field label="Phone Numbers">
                            <PhoneListInput
                              phones={notificationFormData.phoneNumbers}
                              onChange={(arr) => setNotificationFormData({ ...notificationFormData, phoneNumbers: arr })}
                              disabled={isSubmitting}
                            />
                          </Field>

                          <Field label="Description">
                            <input
                              type="text"
                              placeholder="e.g. 24/7 on-call engineers"
                              value={notificationFormData.description}
                              onChange={(e) => setNotificationFormData({ ...notificationFormData, description: e.target.value })}
                              disabled={isSubmitting}
                              style={{ ...inputStyle, opacity: isSubmitting ? 0.6 : 1 }}
                            />
                          </Field>

                          <div style={{ display: "flex", gap: 8, paddingTop: 4 }}>
                            <PrimaryBtn type="submit" loading={isSubmitting}>
                              {notificationEditingId ? "Update Group" : "Create Group"}
                            </PrimaryBtn>
                            {(notificationFormOpen || notificationEditingId) && (
                              <GhostBtn type="button" onClick={resetNotificationForm} disabled={isSubmitting}>Cancel</GhostBtn>
                            )}
                          </div>
                        </div>
                      </form>

                      {!notificationFormOpen && !notificationEditingId && (
                        <div style={{ marginTop: 16 }}>
                          <Divider />
                          <button
                            onClick={() => setNotificationFormOpen(true)}
                            style={{
                              width: "100%", marginTop: 12, padding: "10px 14px", borderRadius: 10,
                              cursor: "pointer", background: "rgba(129,140,248,0.06)",
                              border: "1px dashed rgba(129,140,248,0.22)",
                              color: "rgba(129,140,248,0.55)", fontFamily: T.font,
                              fontSize: 9, letterSpacing: "0.14em", textTransform: "uppercase",
                              transition: "all 0.2s", display: "flex", alignItems: "center", justifyContent: "center", gap: 7,
                            }}
                            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(129,140,248,0.1)"; e.currentTarget.style.color = "#818cf8"; e.currentTarget.style.borderColor = "rgba(129,140,248,0.35)"; }}
                            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(129,140,248,0.06)"; e.currentTarget.style.color = "rgba(129,140,248,0.55)"; e.currentTarget.style.borderColor = "rgba(129,140,248,0.22)"; }}
                          >
                            <Plus size={12} /> Create new group
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ─── Right: Notification Groups list ─── */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.45, delay: 0.15 }}
              >
                {/* List header */}
                <div style={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  marginBottom: 16, padding: "10px 16px", borderRadius: 12,
                  background: "rgba(3,7,18,0.66)", border: "1px solid rgba(129,140,248,0.08)",
                  backdropFilter: "blur(14px)", position: "relative", overflow: "hidden",
                }}>
                  <Scanline />
                  <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                    <Users size={12} style={{ color: "rgba(129,140,248,0.5)" }} />
                    <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: T.mid, fontWeight: 700 }}>
                      Active Groups
                    </span>
                  </div>
                  <div style={{ position: "relative", zIndex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                    {notificationLoading && <RefreshCw size={10} style={{ color: T.dim, animation: "spin 1s linear infinite" }} />}
                    <button
                      onClick={fetchNotificationGroups}
                      style={{ background: "none", border: "none", cursor: "pointer", color: T.dim, display: "flex", padding: 4, borderRadius: 6, transition: "color 0.15s" }}
                      title="Refresh"
                      onMouseEnter={(e) => e.currentTarget.style.color = "#818cf8"}
                      onMouseLeave={(e) => e.currentTarget.style.color = T.dim}
                    >
                      <RefreshCw size={11} />
                    </button>
                  </div>
                </div>

                {notificationLoading ? (
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 0" }}>
                    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10 }}>
                      <RefreshCw size={20} style={{ color: "rgba(129,140,248,0.5)", animation: "spin 1s linear infinite" }} />
                      <span style={{ fontFamily: T.font, fontSize: 9, color: T.dim, letterSpacing: "0.14em", textTransform: "uppercase" }}>Loading groups…</span>
                    </div>
                  </div>
                ) : notificationGroups.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    style={{
                      padding: "60px 32px", borderRadius: 16, textAlign: "center",
                      background: "rgba(3,7,18,0.68)", border: "1px dashed rgba(129,140,248,0.08)",
                      backdropFilter: "blur(16px)", position: "relative", overflow: "hidden",
                    }}
                  >
                    <Scanline />
                    <div style={{ position: "relative", zIndex: 1 }}>
                      <div style={{ width: 52, height: 52, borderRadius: 14, margin: "0 auto 16px", background: "rgba(129,140,248,0.06)", border: "1px solid rgba(129,140,248,0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                        <Phone size={22} style={{ color: "rgba(129,140,248,0.5)" }} />
                      </div>
                      <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: 11, color: T.mid, fontWeight: 700, marginBottom: 8, letterSpacing: "0.06em" }}>
                        NO NOTIFICATION GROUPS
                      </div>
                      <div style={{ fontFamily: T.font, fontSize: 9, color: T.dim, letterSpacing: "0.07em", lineHeight: 1.7 }}>
                        Create your first group to define<br />notification recipients for alerts.
                      </div>
                      <button
                        onClick={() => setNotificationFormOpen(true)}
                        style={{ marginTop: 20, padding: "9px 20px", borderRadius: 10, cursor: "pointer", background: "rgba(129,140,248,0.1)", border: "1px solid rgba(129,140,248,0.25)", color: "#818cf8", fontFamily: T.font, fontSize: 9, letterSpacing: "0.12em", textTransform: "uppercase", transition: "all 0.15s", display: "inline-flex", alignItems: "center", gap: 6 }}
                        onMouseEnter={(e) => e.currentTarget.style.background = "rgba(129,140,248,0.18)"}
                        onMouseLeave={(e) => e.currentTarget.style.background = "rgba(129,140,248,0.1)"}
                      >
                        <Plus size={11} /> Create first group
                      </button>
                    </div>
                  </motion.div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    <AnimatePresence>
                      {notificationGroups.map((group, i) => (
                        <NotificationGroupCard key={group._id} group={group} index={i} onEdit={handleNotificationEdit} onDelete={handleNotificationDelete} isDeleting={notificationDeletingId === group._id} />
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Escalation Group"
        message="Are you sure you want to delete this escalation group? All email recipients and routing configurations will be permanently removed."
        itemName={deleteTarget?.groupName || ""}
        loading={isDeleting}
      />

      {/* ─── Notification Delete Confirmation Modal ─── */}
      <DeleteConfirmationModal
        isOpen={notificationDeleteModalOpen}
        onClose={handleNotificationDeleteCancel}
        onConfirm={handleNotificationDeleteConfirm}
        title="Delete Notification Group"
        message="Are you sure you want to delete this notification group? All email and phone recipients will be permanently removed."
        itemName={notificationDeleteTarget?.groupName || ""}
        loading={notificationIsDeleting}
      />
    </>
  );
};

export default EscalationGroups;