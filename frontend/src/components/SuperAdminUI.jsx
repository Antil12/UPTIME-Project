import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Users, UserPlus, Globe2, Eye, EyeOff,
  CheckCircle2, X, Tag, Search, Edit2, Trash2,
  ChevronUp, ChevronDown, AlertTriangle, Activity,
  Lock, Mail, User2, Database, RefreshCw,
} from "lucide-react";

// ─── Font Loader ──────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    if (document.getElementById("sa-fonts")) return;
    const l = document.createElement("link");
    l.id = "sa-fonts";
    l.rel = "stylesheet";
    l.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@300;400;600;700&display=swap";
    document.head.appendChild(l);
  }, []);
  return null;
};

// ─── Cursor Glow ──────────────────────────────────────────────────────────────
const CursorGlow = () => {
  const x = useMotionValue(-600);
  const y = useMotionValue(-600);
  const sx = useSpring(x, { stiffness: 80, damping: 22 });
  const sy = useSpring(y, { stiffness: 80, damping: 22 });
  useEffect(() => {
    const fn = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [x, y]);
  return (
    <motion.div
      className="pointer-events-none fixed z-0"
      style={{
        left: sx, top: sy,
        translateX: "-50%", translateY: "-50%",
        width: 380, height: 380, borderRadius: "50%",
        background: "radial-gradient(circle, rgba(56,189,248,0.042) 0%, transparent 70%)",
      }}
    />
  );
};

// ─── Background ───────────────────────────────────────────────────────────────
const Background = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0" style={{ background: "#020810" }} />
    <div className="absolute inset-0" style={{
      background: "radial-gradient(ellipse 55% 35% at 50% 0%, rgba(56,189,248,0.055) 0%, transparent 100%)",
    }} />
    <div className="absolute" style={{
      bottom: "20%", left: "10%", width: 400, height: 400,
      background: "radial-gradient(circle, rgba(99,102,241,0.03) 0%, transparent 65%)",
      filter: "blur(100px)",
    }} />
    <div className="absolute" style={{
      top: "15%", right: "8%", width: 300, height: 300,
      background: "radial-gradient(circle, rgba(16,185,129,0.025) 0%, transparent 65%)",
      filter: "blur(80px)",
    }} />
    <div className="absolute inset-0" style={{
      backgroundImage: "linear-gradient(rgba(148,163,184,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.022) 1px, transparent 1px)",
      backgroundSize: "44px 44px",
    }} />
    <motion.div
      className="absolute inset-0"
      style={{ background: "linear-gradient(to bottom, transparent 48%, rgba(56,189,248,0.01) 50%, transparent 52%)" }}
      animate={{ y: ["-100%", "100%"] }}
      transition={{ duration: 7, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
    />
  </div>
);

// ─── HUD Corner ───────────────────────────────────────────────────────────────
const HUDCorner = ({ pos, delay = 0 }) => {
  const cls = { tl: "top-3 left-3", tr: "top-3 right-3", bl: "bottom-3 left-3", br: "bottom-3 right-3" };
  const rot = { tl: "0deg", tr: "90deg", bl: "-90deg", br: "180deg" };
  return (
    <motion.div
      className={`fixed ${cls[pos]} w-6 h-6 z-20 pointer-events-none`}
      style={{ transform: `rotate(${rot[pos]})` }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 0.7, scale: 1 }}
      transition={{ delay, duration: 0.4, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div className="absolute top-0 left-0 h-[1.5px] bg-sky-400/70"
        initial={{ width: 0 }} animate={{ width: "100%" }}
        transition={{ delay: delay + 0.12, duration: 0.3 }} />
      <motion.div className="absolute top-0 left-0 w-[1.5px] bg-sky-400/70"
        initial={{ height: 0 }} animate={{ height: "100%" }}
        transition={{ delay: delay + 0.12, duration: 0.3 }} />
    </motion.div>
  );
};

// ─── Status Dot ───────────────────────────────────────────────────────────────
const StatusDot = ({ color = "#34d399", label }) => (
  <div className="flex items-center gap-2">
    <div className="relative w-2 h-2">
      <motion.div className="absolute inset-0 rounded-full" style={{ background: color }}
        animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
        transition={{ duration: 1.6, repeat: Infinity }} />
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
    </div>
    {label && (
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", letterSpacing: "0.16em", color: `${color}99`, textTransform: "uppercase" }}>
        {label}
      </span>
    )}
  </div>
);

// ─── Section Label ────────────────────────────────────────────────────────────
const SectionLabel = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: "rgba(56,189,248,0.06)", border: "1px solid rgba(56,189,248,0.14)" }}>
      <Icon size={13} className="text-sky-400" />
    </div>
    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", letterSpacing: "0.22em", color: "rgba(56,189,248,0.55)", textTransform: "uppercase" }}>
      {label}
    </span>
    <div className="flex-1 h-px" style={{ background: "linear-gradient(90deg, rgba(56,189,248,0.1), transparent)" }} />
  </div>
);

// ─── Field Label ─────────────────────────────────────────────────────────────
const FieldLabel = ({ icon: Icon, children, note }) => (
  <label className="flex items-center gap-2 mb-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9.5px", letterSpacing: "0.14em", color: "rgba(56,189,248,0.5)", textTransform: "uppercase" }}>
    {Icon && <Icon size={10} className="shrink-0" />}
    {children}
    {note && <span style={{ fontSize: "8.5px", color: "rgba(148,163,184,0.38)", letterSpacing: "0.06em", fontWeight: 400, textTransform: "none" }}>{note}</span>}
  </label>
);

// ─── Glass Card ───────────────────────────────────────────────────────────────
const GlassCard = ({ children, className = "", accent = "rgba(56,189,248,0.09)", style = {} }) => (
  <div className={`relative overflow-hidden rounded-2xl ${className}`}
    style={{ background: "rgba(3,7,18,0.74)", border: `1px solid ${accent}`, backdropFilter: "blur(18px)", ...style }}>
    <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-px"
      style={{ background: "linear-gradient(90deg,transparent,rgba(56,189,248,0.28) 30%,rgba(99,102,241,0.22) 70%,transparent)" }} />
    {children}
  </div>
);

// ─── HUD Input ────────────────────────────────────────────────────────────────
const HudInput = ({ type = "text", placeholder, value, onChange, name, ...rest }) => (
  <input
    type={type} placeholder={placeholder} value={value} name={name} onChange={onChange} {...rest}
    className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
    style={{ background: "rgba(255,255,255,0.022)", border: "1px solid rgba(56,189,248,0.09)", color: "white", fontFamily: "'JetBrains Mono',monospace", fontSize: "12px", letterSpacing: "0.02em" }}
    onFocus={e => { e.target.style.border = "1px solid rgba(56,189,248,0.32)"; e.target.style.boxShadow = "0 0 0 3px rgba(56,189,248,0.05)"; }}
    onBlur={e => { e.target.style.border = "1px solid rgba(56,189,248,0.09)"; e.target.style.boxShadow = "none"; }}
  />
);

// ─── HUD Select ───────────────────────────────────────────────────────────────
const HudSelect = ({ value, onChange, children, name }) => (
  <select value={value} onChange={onChange} name={name}
    className="w-full px-4 py-3 rounded-xl outline-none appearance-none"
    style={{ background: "rgba(255,255,255,0.022)", border: "1px solid rgba(56,189,248,0.09)", color: "white", fontFamily: "'JetBrains Mono',monospace", fontSize: "12px" }}
    onFocus={e => { e.target.style.border = "1px solid rgba(56,189,248,0.32)"; }}
    onBlur={e => { e.target.style.border = "1px solid rgba(56,189,248,0.09)"; }}
  >
    {children}
  </select>
);

// ─── Password Input ───────────────────────────────────────────────────────────
const PasswordInput = ({ placeholder, value, onChange, name }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <HudInput type={show ? "text" : "password"} placeholder={placeholder} value={value} onChange={onChange} name={name} style={{ paddingRight: "2.5rem" }} />
      <button type="button" onClick={() => setShow(s => !s)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-sky-400 transition-colors">
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
};

// ─── Role Badge ───────────────────────────────────────────────────────────────
const ROLE_META = {
  SUPERADMIN: { color: "#a78bfa", bg: "rgba(139,92,246,.12)", border: "rgba(139,92,246,.22)", label: "Superadmin" },
  // ADMIN:      { color: "#818cf8", bg: "rgba(99,102,241,.12)",  border: "rgba(99,102,241,.22)",  label: "Admin"      },
  VIEWER:     { color: "#94a3b8", bg: "rgba(100,116,139,.10)", border: "rgba(100,116,139,.20)", label: "Viewer"     },
  USER:       { color: "#38bdf8", bg: "rgba(56,189,248,.10)",  border: "rgba(56,189,248,.20)",  label: "User"       },
};
const roleMeta = (role = "USER") => ROLE_META[role] ?? ROLE_META.USER;

const RoleBadge = ({ role }) => {
  const m = roleMeta(role);
  return (
    <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-semibold tracking-widest uppercase"
      style={{ fontFamily: "'JetBrains Mono',monospace", color: m.color, background: m.bg, border: `1px solid ${m.border}` }}>
      {m.label}
    </span>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name = "", size = 34 }) => {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join("") || "?";
  return (
    <div className="rounded-xl flex items-center justify-center shrink-0 text-white font-black"
      style={{ width: size, height: size, fontFamily: "'Orbitron',sans-serif", fontSize: size * 0.30, letterSpacing: ".06em", background: "linear-gradient(135deg,rgba(56,189,248,.85),rgba(99,102,241,.80))", boxShadow: "0 0 14px rgba(56,189,248,.14)" }}>
      {initials}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, accent = "#38bdf8", delay = 0 }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}>
    <GlassCard className="p-4 h-full">
      <div className="flex items-start justify-between mb-3">
        <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: `${accent}12`, border: `1px solid ${accent}20` }}>
          <Icon size={15} style={{ color: accent }} />
        </div>
        <div className="w-1.5 h-1.5 rounded-full mt-1" style={{ background: accent, boxShadow: `0 0 6px ${accent}` }} />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", color: "rgba(148,163,184,0.48)", letterSpacing: "0.10em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div className="mt-1.5 text-white text-xl" style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, letterSpacing: "0.04em" }}>
        {value}
      </div>
    </GlassCard>
  </motion.div>
);

// ─── Category Assign List ─────────────────────────────────────────────────────
const CategoryAssignList = ({ availableCategories, selectedCategories, setSelectedCategories, availableSites, setSelectedSites }) => {
  const filtered = availableCategories.filter(c => c && c !== "ALL" && c !== "UNCATEGORIZED");
  const toggle = (category, checked) => {
    const updated = checked ? [...selectedCategories, category] : selectedCategories.filter(c => c !== category);
    setSelectedCategories(updated);
    const siteIds = availableSites.filter(s => s.category === category).map(s => s._id.toString());
    setSelectedSites(prev => {
      if (checked) return [...new Set([...prev, ...siteIds])];
      return prev.filter(id => {
        const site = availableSites.find(s => s._id.toString() === id);
        if (!site?.category) return true;
        if (updated.includes(site.category)) return true;
        return !siteIds.includes(id);
      });
    });
  };
  if (filtered.length === 0) return (
    <div className="rounded-xl p-3 text-center" style={{ background: "rgba(255,255,255,0.016)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "11px", color: "rgba(148,163,184,0.45)" }}>No categories available</p>
    </div>
  );
  return (
    <div className="rounded-xl p-3 max-h-36 overflow-y-auto" style={{ background: "rgba(255,255,255,0.016)", border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="flex flex-wrap gap-1.5">
        {filtered.map(category => {
          const checked = selectedCategories.includes(category);
          const count = availableSites.filter(s => s.category === category).length;
          return (
            <motion.label key={category} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all duration-200"
              style={{ background: checked ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.02)", border: checked ? "1px solid rgba(56,189,248,0.28)" : "1px solid rgba(255,255,255,0.06)" }}>
              <input type="checkbox" checked={checked} onChange={e => toggle(category, e.target.checked)} className="hidden" />
              <div className="w-3.5 h-3.5 rounded flex items-center justify-center" style={{ background: checked ? "rgba(56,189,248,0.25)" : "rgba(255,255,255,0.04)", border: checked ? "1px solid rgba(56,189,248,0.55)" : "1px solid rgba(255,255,255,0.12)" }}>
                {checked && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9.5px", letterSpacing: "0.06em", color: checked ? "rgba(226,232,240,0.95)" : "rgba(148,163,184,0.65)", textTransform: "uppercase" }}>{category}</span>
              <span className="rounded px-1 py-0.5" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8px", background: checked ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)", color: checked ? "#38bdf8" : "rgba(148,163,184,0.4)", border: checked ? "1px solid rgba(56,189,248,0.2)" : "1px solid rgba(255,255,255,0.05)" }}>{count}</span>
            </motion.label>
          );
        })}
      </div>
    </div>
  );
};

// ─── Site Assign List ─────────────────────────────────────────────────────────
const SiteAssignList = ({ sites, selectedSites, setSelectedSites, highlightedCategories = [] }) => {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? sites.filter(s => (s.domain || s.url || s.name || "").toLowerCase().includes(q)) : sites;
  }, [sites, search]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.05)" }}>
      <div className="px-3 py-2 flex items-center gap-2" style={{ background: "rgba(255,255,255,0.018)", borderBottom: "1px solid rgba(255,255,255,0.04)" }}>
        <Search size={11} className="text-sky-400/50 shrink-0" />
        <input type="text" placeholder="Filter sites…" value={search} onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none text-slate-300 placeholder-slate-600"
          style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10.5px" }} />
        {search && <button onClick={() => setSearch("")} className="text-slate-600 hover:text-slate-300"><X size={10} /></button>}
      </div>
      <div className="max-h-48 overflow-y-auto" style={{ background: "rgba(255,255,255,0.012)" }}>
        {filtered.length === 0 ? (
          <p className="p-3 text-center" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "rgba(148,163,184,0.45)" }}>No sites found</p>
        ) : filtered.map(site => {
          const siteId = site._id.toString();
          const checked = selectedSites.includes(siteId);
          const catHL = site.category && highlightedCategories.includes(site.category);
          return (
            <label key={site._id} className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer transition-colors duration-150"
              style={{ background: checked ? (catHL ? "rgba(99,102,241,0.06)" : "rgba(56,189,248,0.05)") : "transparent", borderBottom: "1px solid rgba(255,255,255,0.025)" }}
              onMouseEnter={e => !checked && (e.currentTarget.style.background = "rgba(255,255,255,0.018)")}
              onMouseLeave={e => !checked && (e.currentTarget.style.background = "transparent")}>
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all"
                  style={{ background: checked ? "rgba(56,189,248,0.2)" : "rgba(255,255,255,0.04)", border: checked ? "1px solid rgba(56,189,248,0.5)" : "1px solid rgba(255,255,255,0.10)" }}>
                  <input type="checkbox" checked={checked} onChange={e => { if (e.target.checked) setSelectedSites([...selectedSites, siteId]); else setSelectedSites(selectedSites.filter(id => id !== siteId)); }} className="hidden" />
                  {checked && <svg width="8" height="6" viewBox="0 0 8 6" fill="none"><path d="M1 3L3 5L7 1" stroke="#38bdf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </div>
                <div className="min-w-0">
                  <span className="block truncate" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10.5px", color: "rgba(226,232,240,0.88)" }}>{site.domain || site.url || site.name}</span>
                  {site.category && <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8.5px", color: catHL ? "rgba(99,102,241,0.65)" : "rgba(148,163,184,0.38)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{site.category}</span>}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {catHL && <Tag size={10} style={{ color: "rgba(99,102,241,0.55)" }} />}
                {checked && <CheckCircle2 size={13} className="text-sky-400" />}
              </div>
            </label>
          );
        })}
      </div>
      {filtered.length > 0 && (
        <div className="px-3 py-1.5 flex items-center justify-between" style={{ background: "rgba(255,255,255,0.012)", borderTop: "1px solid rgba(255,255,255,0.04)" }}>
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8.5px", color: "rgba(148,163,184,0.35)" }}>{selectedSites.length} selected of {sites.length}</span>
          {selectedSites.length > 0 && (
            <button onClick={() => setSelectedSites([])} className="text-[8.5px] text-slate-500 hover:text-red-400 transition-colors" style={{ fontFamily: "'JetBrains Mono',monospace" }}>clear all</button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Password Strength ────────────────────────────────────────────────────────
const StrengthBar = ({ strength }) => {
  if (!strength) return null;
  const map = { Weak: { w: "w-1/3", color: "#ef4444" }, Medium: { w: "w-2/3", color: "#f59e0b" }, Strong: { w: "w-full", color: "#10b981" } };
  const m = map[strength] ?? map.Weak;
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full" style={{ background: "rgba(255,255,255,0.06)" }}>
        <motion.div className={`h-1 rounded-full ${m.w}`} style={{ background: m.color }} initial={{ width: 0 }} animate={{ width: undefined }} />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", color: m.color, letterSpacing: ".08em" }}>{strength.toUpperCase()}</span>
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ user, onConfirm, onCancel }) => (
  <motion.div key="del-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    style={{ background: "rgba(2,8,23,.80)", backdropFilter: "blur(10px)" }} onClick={onCancel}>
    <motion.div initial={{ scale: 0.93, opacity: 0, y: 10 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.93, opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 160, damping: 20 }}
      className="relative w-full max-w-xs rounded-2xl overflow-hidden p-5"
      style={{ background: "rgba(5,10,25,.97)", border: "1px solid rgba(239,68,68,.20)", backdropFilter: "blur(24px)", boxShadow: "0 0 48px rgba(239,68,68,.08)" }}
      onClick={e => e.stopPropagation()}>
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(239,68,68,.45),transparent)" }} />
      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: "rgba(239,68,68,.10)", border: "1px solid rgba(239,68,68,.20)" }}>
          <AlertTriangle size={16} className="text-red-400" />
        </div>
        <div className="min-w-0">
          <p className="text-white text-[12px] font-bold mb-0.5" style={{ fontFamily: "'Orbitron',sans-serif", letterSpacing: ".04em" }}>Delete User</p>
          <p className="text-[10px] leading-relaxed" style={{ fontFamily: "'JetBrains Mono',monospace", color: "rgba(148,163,184,.60)" }}>
            Permanently remove <span className="text-red-300 font-semibold">{user.name}</span>? This cannot be undone.
          </p>
        </div>
      </div>
      <div className="flex gap-2">
        <button onClick={onCancel} className="flex-1 py-2.5 rounded-xl text-[10.5px] text-slate-300 transition-colors"
          style={{ fontFamily: "'JetBrains Mono',monospace", background: "rgba(255,255,255,.05)", border: "1px solid rgba(255,255,255,.08)" }}>
          Cancel
        </button>
        <motion.button whileTap={{ scale: 0.97 }} onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl text-[10.5px] font-semibold text-red-300 flex items-center justify-center gap-1.5"
          style={{ fontFamily: "'JetBrains Mono',monospace", background: "rgba(239,68,68,.12)", border: "1px solid rgba(239,68,68,.28)" }}>
          <Trash2 size={11} /> Delete
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Action Button ────────────────────────────────────────────────────────────
const ActionBtn = ({ icon, label, color, bg, border, onClick, compact = false }) => (
  <motion.button whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }} onClick={onClick}
    className={`flex items-center justify-center gap-1.5 rounded-xl font-medium transition-all duration-150 ${compact ? "px-3 py-1.5" : "flex-1 py-2.5"}`}
    style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10.5px", background: bg, border: `1px solid ${border}`, color }}>
    {icon}{label}
  </motion.button>
);

// ─── Sort Button ──────────────────────────────────────────────────────────────
const SortBtn = ({ label, field, sort, onSort }) => {
  const active = sort.field === field;
  return (
    <button onClick={() => onSort(field)} className="flex items-center gap-1 transition-colors duration-150"
      style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", letterSpacing: ".14em", textTransform: "uppercase", color: active ? "rgba(56,189,248,.85)" : "rgba(56,189,248,.40)" }}>
      {label}
      <span className="flex flex-col gap-[1px]">
        <ChevronUp size={7} style={{ opacity: active && sort.dir === "asc" ? 1 : 0.3 }} />
        <ChevronDown size={7} style={{ opacity: active && sort.dir === "desc" ? 1 : 0.3 }} />
      </span>
    </button>
  );
};

// ─── Users Table Section ──────────────────────────────────────────────────────
const UsersSection = ({ users, openEditModal, handleDelete }) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ field: "name", dir: "asc" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleSort = field => setSort(s => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  const processed = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = q ? users.filter(u => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q)) : users;
    return [...filtered].sort((a, b) => {
      const va = (a[sort.field] ?? "").toString().toLowerCase();
      const vb = (b[sort.field] ?? "").toString().toLowerCase();
      return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [users, search, sort]);

  return (
    <>
      <AnimatePresence>{deleteTarget && <DeleteModal user={deleteTarget} onConfirm={() => { handleDelete(deleteTarget._id); setDeleteTarget(null); }} onCancel={() => setDeleteTarget(null)} />}</AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.38 }}>
        <GlassCard className="p-4 sm:p-5">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <SectionLabel icon={Users} label="Manage Users" />
            <div className="flex items-center gap-2 shrink-0">
              <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg" style={{ background: "rgba(56,189,248,.07)", border: "1px solid rgba(56,189,248,.12)" }}>
                <Users size={10} className="text-sky-400" />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9.5px", color: "rgba(56,189,248,.70)" }}>{users.length} total</span>
              </div>
              <div className="relative flex items-center" style={{ width: 170 }}>
                <Search size={11} className="absolute left-2.5 text-sky-400/45 pointer-events-none" />
                <input type="text" placeholder="Search…" value={search} onChange={e => setSearch(e.target.value)}
                  className="w-full pl-7 pr-6 py-1.5 rounded-lg text-[10.5px] text-slate-300 placeholder-slate-600 outline-none"
                  style={{ fontFamily: "'JetBrains Mono',monospace", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.07)" }}
                  onFocus={e => e.target.style.border = "1px solid rgba(56,189,248,.28)"}
                  onBlur={e => e.target.style.border = "1px solid rgba(255,255,255,.07)"} />
                {search && <button onClick={() => setSearch("")} className="absolute right-2 text-slate-600 hover:text-slate-300"><X size={10} /></button>}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {processed.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-xl p-8 text-center" style={{ background: "rgba(255,255,255,.016)", border: "1px solid rgba(255,255,255,.05)" }}>
                <Users size={24} className="mx-auto mb-2 text-sky-400/15" />
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "11px", color: "rgba(148,163,184,.42)" }}>{search ? `No match for "${search}"` : "No users found"}</p>
              </motion.div>
            ) : (
              <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                {/* Mobile cards */}
                <div className="grid gap-2 lg:hidden">
                  <AnimatePresence>
                    {processed.map((user, i) => (
                      <motion.div key={user._id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.03 }}
                        className="rounded-xl p-3.5 transition-colors duration-200"
                        style={{ background: "rgba(255,255,255,.020)", border: "1px solid rgba(255,255,255,.055)" }}
                        onMouseEnter={e => e.currentTarget.style.background = "rgba(56,189,248,.024)"}
                        onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.020)"}>
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar name={user.name} size={36} />
                          <div className="min-w-0 flex-1">
                            <p className="text-white text-[12px] font-bold truncate" style={{ fontFamily: "'Orbitron',sans-serif", letterSpacing: ".03em" }}>{user.name}</p>
                            <p className="text-[9.5px] mt-0.5 break-all" style={{ fontFamily: "'JetBrains Mono',monospace", color: "rgba(148,163,184,.56)" }}>{user.email}</p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <RoleBadge role={user.role} />
                              {user.assignedCategories?.length > 0 && (
                                <span className="px-2 py-0.5 rounded-lg text-[8.5px]" style={{ fontFamily: "'JetBrains Mono',monospace", background: "rgba(99,102,241,.10)", border: "1px solid rgba(99,102,241,.18)", color: "rgba(99,102,241,.80)" }}>
                                  {user.assignedCategories.length} {user.assignedCategories.length === 1 ? "category" : "categories"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <ActionBtn icon={<Edit2 size={12} />} label="Edit" color="#60a5fa" bg="rgba(59,130,246,.10)" border="rgba(59,130,246,.20)" onClick={() => openEditModal?.(user)} />
                          <ActionBtn icon={<Trash2 size={12} />} label="Delete" color="#f87171" bg="rgba(239,68,68,.08)" border="rgba(239,68,68,.18)" onClick={() => setDeleteTarget(user)} />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto rounded-xl" style={{ border: "1px solid rgba(255,255,255,.05)" }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: "rgba(255,255,255,.022)", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                        {[{ label: "User", field: "name" }, { label: "Email", field: "email" }, { label: "Role", field: "role" }, { label: null, field: null }].map(({ label, field }, i) => (
                          <th key={i} className={`px-4 py-2.5 ${i === 0 ? "text-left" : i < 3 ? "text-left" : "text-right"}`}>
                            {label && field ? <SortBtn label={label} field={field} sort={sort} onSort={handleSort} /> : label ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", letterSpacing: ".14em", textTransform: "uppercase", color: "rgba(56,189,248,.40)" }}>{label}</span> : null}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {processed.map((user, i) => (
                          <motion.tr key={user._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: i * 0.025 }}
                            className="border-t border-white/[.04] transition-colors duration-150"
                            style={{ background: "rgba(255,255,255,.005)" }}
                            onMouseEnter={e => e.currentTarget.style.background = "rgba(56,189,248,.018)"}
                            onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,.005)"}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={user.name} size={30} />
                                <span className="text-white text-[11.5px] font-bold" style={{ fontFamily: "'Orbitron',sans-serif", letterSpacing: ".03em" }}>{user.name}</span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10.5px]" style={{ fontFamily: "'JetBrains Mono',monospace", color: "rgba(148,163,184,.68)" }}>{user.email}</span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <RoleBadge role={user.role} />
                                {user.assignedCategories?.length > 0 && (
                                  <span className="px-1.5 py-0.5 rounded text-[8.5px]" style={{ fontFamily: "'JetBrains Mono',monospace", background: "rgba(99,102,241,.08)", border: "1px solid rgba(99,102,241,.15)", color: "rgba(99,102,241,.70)" }}>
                                    {user.assignedCategories.length}×cat
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 justify-end">
                                <ActionBtn icon={<Edit2 size={11} />} label="Edit" color="#60a5fa" bg="rgba(59,130,246,.10)" border="rgba(59,130,246,.18)" onClick={() => openEditModal?.(user)} compact />
                                <ActionBtn icon={<Trash2 size={11} />} label="Delete" color="#f87171" bg="rgba(239,68,68,.08)" border="rgba(239,68,68,.16)" onClick={() => setDeleteTarget(user)} compact />
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                  <div className="px-4 py-2 flex justify-between" style={{ background: "rgba(255,255,255,.010)", borderTop: "1px solid rgba(255,255,255,.04)" }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8.5px", color: "rgba(148,163,184,.30)" }}>{processed.length} of {users.length} users</span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8.5px", color: "rgba(56,189,248,.28)" }}>sorted by {sort.field} · {sort.dir}</span>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </GlassCard>
      </motion.div>
    </>
  );
};

// ─── Edit Modal ───────────────────────────────────────────────────────────────
const EditModal = ({ editUser, editForm, setEditForm, newPassword, setNewPassword, editAssignedSites, setEditAssignedSites, editAssignedCategories, setEditAssignedCategories, availableSites, availableCategories, handleUpdateUser, onClose }) => {
  const isSuper = editForm.role === "SUPERADMIN";
  return (
    <AnimatePresence>
      {editUser && (
        <motion.div key="edit-overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: "rgba(2,8,23,.78)", backdropFilter: "blur(10px)" }} onClick={onClose}>
          <motion.div initial={{ opacity: 0, scale: 0.96, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{ background: "rgba(3,7,18,.95)", border: "1px solid rgba(56,189,248,.12)", backdropFilter: "blur(20px)", boxShadow: "0 0 40px rgba(56,189,248,.06)" }}
            onClick={e => e.stopPropagation()}>
            <div aria-hidden className="sticky top-0 inset-x-0 h-px" style={{ background: "linear-gradient(90deg,transparent,rgba(56,189,248,.35) 30%,rgba(99,102,241,.28) 70%,transparent)" }} />

            <div className="p-5 sm:p-6">
              {/* Modal header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Avatar name={editUser.name} size={40} />
                  <div>
                    <h3 className="text-white text-[14px] font-black" style={{ fontFamily: "'Orbitron',sans-serif", letterSpacing: ".06em" }}>EDIT USER</h3>
                    <p className="mt-0.5" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9.5px", color: "rgba(148,163,184,.50)" }}>Update profile, role, access &amp; password</p>
                  </div>
                </div>
                <motion.button whileHover={{ scale: 1.06, rotate: 90 }} whileTap={{ scale: 0.94 }} transition={{ duration: 0.15 }} onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                  <X size={13} className="text-slate-300" />
                </motion.button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <FieldLabel icon={User2}>Name</FieldLabel>
                  <HudInput placeholder="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} />
                </div>
                <div>
                  <FieldLabel icon={Mail}>Email</FieldLabel>
                  <HudInput type="email" placeholder="Email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel icon={ShieldCheck}>Role</FieldLabel>
                  <HudSelect value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })}>
                    <option value="USER" className="bg-slate-900">User</option>
                    {/* <option value="ADMIN" className="bg-slate-900">Admin</option> */}
                    <option value="SUPERADMIN" className="bg-slate-900">Super Admin</option>
                    <option value="VIEWER" className="bg-slate-900">Viewer</option>
                  </HudSelect>
                </div>

                {!isSuper && (
                  <>
                    <div className="md:col-span-2">
                      <FieldLabel icon={Tag} note="— auto-selects sites">Assign Categories</FieldLabel>
                      <CategoryAssignList availableCategories={availableCategories} selectedCategories={editAssignedCategories} setSelectedCategories={setEditAssignedCategories} availableSites={availableSites} setSelectedSites={setEditAssignedSites} />
                    </div>
                    <div className="md:col-span-2">
                      <FieldLabel icon={Globe2}>
                        Assign Websites
                        {editAssignedSites.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded text-[8px]" style={{ background: "rgba(56,189,248,.12)", color: "#38bdf8", border: "1px solid rgba(56,189,248,.2)" }}>{editAssignedSites.length} selected</span>}
                      </FieldLabel>
                      <SiteAssignList sites={availableSites} selectedSites={editAssignedSites} setSelectedSites={setEditAssignedSites} highlightedCategories={editAssignedCategories} />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <FieldLabel icon={Lock}>New Password <span style={{ color: "rgba(148,163,184,.38)", fontWeight: 400, textTransform: "none", letterSpacing: ".04em" }}>(optional)</span></FieldLabel>
                  <PasswordInput placeholder="Leave blank to keep current" value={newPassword} onChange={e => setNewPassword(e.target.value)} />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-[10.5px] text-slate-300"
                  style={{ fontFamily: "'JetBrains Mono',monospace", background: "rgba(255,255,255,.04)", border: "1px solid rgba(255,255,255,.08)" }}>
                  Cancel
                </button>
                <motion.button whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }} onClick={handleUpdateUser}
                  className="px-5 py-2.5 rounded-xl flex items-center gap-2"
                  style={{ background: "linear-gradient(135deg,rgba(56,189,248,.16),rgba(99,102,241,.12))", border: "1px solid rgba(56,189,248,.22)", boxShadow: "0 0 22px rgba(56,189,248,.06)" }}>
                  <RefreshCw size={12} className="text-sky-400" />
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: "11px", letterSpacing: ".10em", color: "white" }}>SAVE CHANGES</span>
                </motion.button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const SuperAdminUI = ({
  form, handleChange, passwordStrength,
  assignedSites, setAssignedSites, assignedCategories, setAssignedCategories,
  availableSites, availableCategories, handleSubmit,
  users, handleDelete,
  editUser, setEditUser, newPassword, setNewPassword,
  editForm, setEditForm, editAssignedSites, setEditAssignedSites,
  editAssignedCategories, setEditAssignedCategories,
  handleUpdateUser, openEditModal,
}) => (
  <>
    <FontLoader />

    <div className="relative min-h-screen w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-5 text-white" style={{ background: "transparent" }}>
      <Background />
      <CursorGlow />
      {["tl", "tr", "bl", "br"].map((p, i) => <HUDCorner key={p} pos={p} delay={0.08 + i * 0.04} />)}

      <div className="relative z-10 w-full max-w-6xl mx-auto space-y-4">

        {/* ── Page Header ─────────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div>
            <div className="flex items-center gap-2.5 mb-1.5">
              <div className="h-px w-7 bg-sky-400/20" />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8.5px", letterSpacing: "0.28em", color: "rgba(56,189,248,0.40)", textTransform: "uppercase" }}>Admin Control Center</span>
              <div className="h-px w-12 bg-sky-400/10" />
            </div>
            <h1 className="text-2xl sm:text-3xl" style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 900, letterSpacing: "0.06em", textShadow: "0 0 28px rgba(56,189,248,0.10)" }}>
              SUPER ADMIN
            </h1>
            <p className="mt-1 max-w-xl" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10.5px", color: "rgba(148,163,184,0.48)", letterSpacing: "0.02em" }}>
              Manage users, assign websites, control roles and access permissions.
            </p>
          </div>
          <StatusDot color="#34d399" label="Superadmin Access" />
        </motion.div>

        {/* ── Stats Row ───────────────────────────────────────────────── */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard icon={Users}      label="Total Users"   value={users.length}         accent="#38bdf8" delay={0.05} />
          <StatCard icon={Globe2}     label="Sites"         value={availableSites.length} accent="#818cf8" delay={0.08} />
          <StatCard icon={ShieldCheck} label="Access Level" value="SUPER"                accent="#10b981" delay={0.11} />
        </div>

        {/* ── Create User Form ────────────────────────────────────────── */}
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.38 }}>
          <GlassCard className="p-4 sm:p-5">
            <SectionLabel icon={UserPlus} label="Create New User" />

            <div className="grid md:grid-cols-2 gap-3 mb-3">
              <div>
                <FieldLabel icon={User2}>Username</FieldLabel>
                <HudInput placeholder="Enter username" name="username" value={form.username} onChange={handleChange} />
              </div>
              <div>
                <FieldLabel icon={Mail}>Email</FieldLabel>
                <HudInput placeholder="user@domain.com" name="email" type="email" value={form.email} onChange={handleChange} />
              </div>
              <div className="md:col-span-2">
                <FieldLabel icon={Lock}>Password</FieldLabel>
                <PasswordInput placeholder="Set a strong password" name="password" value={form.password} onChange={handleChange} />
                <StrengthBar strength={passwordStrength} />
              </div>
              <div className="md:col-span-2">
                <FieldLabel icon={ShieldCheck}>Role</FieldLabel>
                <HudSelect name="role" value={form.role} onChange={handleChange}>
                  <option value="USER" className="bg-slate-900">User</option>
                  {/* <option value="ADMIN" className="bg-slate-900">Admin</option> */}
                  <option value="SUPERADMIN" className="bg-slate-900">Super Admin</option>
                  <option value="VIEWER" className="bg-slate-900">Viewer</option>
                </HudSelect>
              </div>
            </div>

            {form.role !== "SUPERADMIN" && (
              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div>
                  <FieldLabel icon={Tag} note="— auto-selects sites">Assign Categories</FieldLabel>
                  <CategoryAssignList availableCategories={availableCategories} selectedCategories={assignedCategories} setSelectedCategories={setAssignedCategories} availableSites={availableSites} setSelectedSites={setAssignedSites} />
                </div>
                <div>
                  <FieldLabel icon={Globe2}>
                    Assign Websites
                    {assignedSites.length > 0 && <span className="ml-1 px-1.5 py-0.5 rounded text-[8px]" style={{ background: "rgba(56,189,248,.12)", color: "#38bdf8", border: "1px solid rgba(56,189,248,.2)" }}>{assignedSites.length} selected</span>}
                  </FieldLabel>
                  <SiteAssignList sites={availableSites} selectedSites={assignedSites} setSelectedSites={setAssignedSites} highlightedCategories={assignedCategories} />
                </div>
              </div>
            )}

            <div className="flex justify-end pt-1">
              <motion.button type="button" onClick={handleSubmit} whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl"
                style={{ background: "linear-gradient(135deg,rgba(56,189,248,.15),rgba(99,102,241,.10))", border: "1px solid rgba(56,189,248,.22)", boxShadow: "0 0 26px rgba(56,189,248,.07)" }}>
                <UserPlus size={15} className="text-sky-400" />
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: "11px", letterSpacing: ".12em", color: "white" }}>CREATE USER</span>
              </motion.button>
            </div>
          </GlassCard>
        </motion.div>

        {/* ── Users Table ─────────────────────────────────────────────── */}
        <UsersSection users={users} openEditModal={openEditModal} handleDelete={handleDelete} />
      </div>
    </div>

    {/* ── Edit Modal ──────────────────────────────────────────────────── */}
    <EditModal
      editUser={editUser} editForm={editForm} setEditForm={setEditForm}
      newPassword={newPassword} setNewPassword={setNewPassword}
      editAssignedSites={editAssignedSites} setEditAssignedSites={setEditAssignedSites}
      editAssignedCategories={editAssignedCategories} setEditAssignedCategories={setEditAssignedCategories}
      availableSites={availableSites} availableCategories={availableCategories}
      handleUpdateUser={handleUpdateUser} onClose={() => setEditUser(null)}
    />
  </>
);

export default SuperAdminUI;        