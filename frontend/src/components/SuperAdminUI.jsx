import React, { useEffect, useState, useMemo, useCallback, useRef } from "react";
import { motion, useMotionValue, useSpring, AnimatePresence } from "framer-motion";
import {
  ShieldCheck, Users, UserPlus, Globe2, Eye, EyeOff,
  CheckCircle2, X, Tag, Search, Edit2, Trash2,
  ChevronUp, ChevronDown, AlertTriangle, Activity,
  Lock, Mail, User2, Database, RefreshCw,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

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
const CursorGlow = ({ currentTheme }) => {
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
        background: `radial-gradient(circle, ${currentTheme.accent}18 0%, transparent 70%)`,
      }}
    />
  );
};

// ─── Background ───────────────────────────────────────────────────────────────
const Background = ({ currentTheme }) => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0" style={{ background: currentTheme.bg }} />
    <div className="absolute inset-0" style={{
      background: `radial-gradient(ellipse 55% 35% at 50% 0%, ${currentTheme.accent}18 0%, transparent 100%)`,
    }} />
    <div className="absolute" style={{
      bottom: "20%", left: "10%", width: 400, height: 400,
      background: `radial-gradient(circle, ${currentTheme.accentSecondary}10 0%, transparent 65%)`,
      filter: "blur(100px)",
    }} />
    <div className="absolute" style={{
      top: "15%", right: "8%", width: 300, height: 300,
      background: `radial-gradient(circle, ${currentTheme.success}10 0%, transparent 65%)`,
      filter: "blur(80px)",
    }} />
    <div className="absolute inset-0" style={{
      backgroundImage: `linear-gradient(${currentTheme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.gridColor} 1px, transparent 1px)`,
      backgroundSize: "44px 44px",
    }} />
    <motion.div
      className="absolute inset-0"
      style={{ background: `linear-gradient(to bottom, transparent 48%, ${currentTheme.accent}08 50%, transparent 52%)` }}
      animate={{ y: ["-100%", "100%"] }}
      transition={{ duration: 7, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
    />
  </div>
);

// ─── HUD Corner ───────────────────────────────────────────────────────────────
const HUDCorner = ({ pos, delay = 0, currentTheme }) => {
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
      <motion.div
        className="absolute top-0 left-0 h-[1.5px]"
        style={{ background: `${currentTheme.accent}80` }}
        initial={{ width: 0 }} animate={{ width: "100%" }}
        transition={{ delay: delay + 0.12, duration: 0.3 }}
      />
      <motion.div
        className="absolute top-0 left-0 w-[1.5px]"
        style={{ background: `${currentTheme.accent}80` }}
        initial={{ height: 0 }} animate={{ height: "100%" }}
        transition={{ delay: delay + 0.12, duration: 0.3 }}
      />
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
const SectionLabel = ({ icon: Icon, label, currentTheme }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: `${currentTheme.accent}12`, border: `1px solid ${currentTheme.accent}28` }}>
      <Icon size={13} style={{ color: currentTheme.accent }} />
    </div>
    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", letterSpacing: "0.22em", color: `${currentTheme.accent}88`, textTransform: "uppercase" }}>
      {label}
    </span>
    <div className="flex-1 h-px" style={{ background: `linear-gradient(90deg, ${currentTheme.accent}25, transparent)` }} />
  </div>
);

// ─── Field Label ──────────────────────────────────────────────────────────────
const FieldLabel = ({ icon: Icon, children, note, currentTheme }) => (
  <label className="flex items-center gap-2 mb-2" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9.5px", letterSpacing: "0.14em", color: `${currentTheme.accent}88`, textTransform: "uppercase" }}>
    {Icon && <Icon size={10} className="shrink-0" style={{ color: currentTheme.accent }} />}
    {children}
    {note && <span style={{ fontSize: "8.5px", color: currentTheme.textDim, letterSpacing: "0.06em", fontWeight: 400, textTransform: "none" }}>{note}</span>}
  </label>
);

// ─── Glass Card ───────────────────────────────────────────────────────────────
const GlassCard = ({ children, className = "", currentTheme, style = {} }) => (
  <div
    className={`relative overflow-hidden rounded-2xl ${className}`}
    style={{
      background: currentTheme.bgCard,
      border: `1px solid ${currentTheme.borderAccent}`,
      backdropFilter: "blur(18px)",
      boxShadow: currentTheme.shadow,
      ...style,
    }}
  >
    <div
      aria-hidden
      className="pointer-events-none absolute inset-x-0 top-0 h-px"
      style={{ background: currentTheme.gradientTopBar }}
    />
    {children}
  </div>
);

// ─── HUD Input ────────────────────────────────────────────────────────────────
const HudInput = ({ type = "text", placeholder, value, onChange, name, currentTheme, ...rest }) => (
  <input
    type={type} placeholder={placeholder} value={value} name={name} onChange={onChange} {...rest}
    className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-200"
    style={{
      background: currentTheme.bgInput,
      border: `1px solid ${currentTheme.border}`,
      color: currentTheme.text,
      fontFamily: "'JetBrains Mono',monospace",
      fontSize: "12px",
      letterSpacing: "0.02em",
    }}
    onFocus={e => {
      e.target.style.border = `1px solid ${currentTheme.accent}55`;
      e.target.style.boxShadow = `0 0 0 3px ${currentTheme.accent}12`;
    }}
    onBlur={e => {
      e.target.style.border = `1px solid ${currentTheme.border}`;
      e.target.style.boxShadow = "none";
    }}
  />
);

// ─── HUD Select ───────────────────────────────────────────────────────────────
const HudSelect = ({ value, onChange, children, name, currentTheme }) => (
  <select
    value={value} onChange={onChange} name={name}
    className="w-full px-4 py-3 rounded-xl outline-none appearance-none"
    style={{
      background: currentTheme.bgInput,
      border: `1px solid ${currentTheme.border}`,
      color: currentTheme.text,
      fontFamily: "'JetBrains Mono',monospace",
      fontSize: "12px",
    }}
    onFocus={e => e.target.style.border = `1px solid ${currentTheme.accent}55`}
    onBlur={e => e.target.style.border = `1px solid ${currentTheme.border}`}
  >
    {children}
  </select>
);

// ─── Password Input ───────────────────────────────────────────────────────────
const PasswordInput = ({ placeholder, value, onChange, name, currentTheme }) => {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <HudInput
        type={show ? "text" : "password"}
        placeholder={placeholder} value={value} onChange={onChange} name={name}
        currentTheme={currentTheme}
        style={{ paddingRight: "2.5rem" }}
      />
      <button
        type="button"
        onClick={() => setShow(s => !s)}
        className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
        style={{ color: currentTheme.textMuted }}
        onMouseEnter={e => e.currentTarget.style.color = currentTheme.accent}
        onMouseLeave={e => e.currentTarget.style.color = currentTheme.textMuted}
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  );
};

// ─── Role Badge ───────────────────────────────────────────────────────────────
const getRoleMeta = (role = "USER", currentTheme) => {
  const map = {
    SUPERADMIN: { color: currentTheme.accentSecondary, label: "Superadmin" },
    VIEWER:     { color: currentTheme.textMuted,       label: "Viewer"     },
    USER:       { color: currentTheme.accent,          label: "User"       },
  };
  return map[role] ?? map.USER;
};

const RoleBadge = ({ role, currentTheme }) => {
  const m = getRoleMeta(role, currentTheme);
  return (
    <span
      className="inline-flex items-center px-2.5 py-1 rounded-lg text-[9px] font-semibold tracking-widest uppercase"
      style={{
        fontFamily: "'JetBrains Mono',monospace",
        color: m.color,
        background: `${m.color}18`,
        border: `1px solid ${m.color}35`,
      }}
    >
      {m.label}
    </span>
  );
};

// ─── Avatar ───────────────────────────────────────────────────────────────────
const Avatar = ({ name = "", size = 34, currentTheme }) => {
  const initials = name.split(" ").filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join("") || "?";
  return (
    <div
      className="rounded-xl flex items-center justify-center shrink-0 font-black"
      style={{
        width: size, height: size,
        fontFamily: "'Orbitron',sans-serif",
        fontSize: size * 0.30,
        letterSpacing: ".06em",
        color: "#ffffff",
        background: `linear-gradient(135deg, ${currentTheme.accent}dd, ${currentTheme.accentSecondary}cc)`,
        boxShadow: `0 0 14px ${currentTheme.accent}28`,
      }}
    >
      {initials}
    </div>
  );
};

// ─── Stat Card ────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, accentColor, delay = 0, currentTheme }) => (
  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.35 }}>
    <GlassCard className="p-4 h-full" currentTheme={currentTheme}>
      <div className="flex items-start justify-between mb-3">
        <div
          className="w-8 h-8 rounded-xl flex items-center justify-center"
          style={{ background: `${accentColor}14`, border: `1px solid ${accentColor}28` }}
        >
          <Icon size={15} style={{ color: accentColor }} />
        </div>
        <div
          className="w-1.5 h-1.5 rounded-full mt-1"
          style={{ background: accentColor, boxShadow: `0 0 6px ${accentColor}` }}
        />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", color: currentTheme.textMuted, letterSpacing: "0.10em", textTransform: "uppercase" }}>
        {label}
      </div>
      <div className="mt-1.5 text-xl" style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 800, letterSpacing: "0.04em", color: currentTheme.text }}>
        {value}
      </div>
    </GlassCard>
  </motion.div>
);

// ─── Password Strength ────────────────────────────────────────────────────────
const StrengthBar = ({ strength, currentTheme }) => {
  if (!strength) return null;
  const map = {
    Weak:   { w: "33%",  color: currentTheme.error   },
    Medium: { w: "66%",  color: currentTheme.warning  },
    Strong: { w: "100%", color: currentTheme.success  },
  };
  const m = map[strength] ?? map.Weak;
  return (
    <div className="mt-1.5 flex items-center gap-2">
      <div className="flex-1 h-1 rounded-full overflow-hidden" style={{ background: currentTheme.bgInput }}>
        <motion.div
          className="h-1 rounded-full"
          style={{ background: m.color }}
          initial={{ width: 0 }}
          animate={{ width: m.w }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", color: m.color, letterSpacing: ".08em" }}>
        {strength.toUpperCase()}
      </span>
    </div>
  );
};

// ─── Category Assign List ─────────────────────────────────────────────────────
const CategoryAssignList = ({ availableCategories, selectedCategories, setSelectedCategories, availableSites, setSelectedSites, currentTheme }) => {
  const filtered = availableCategories.filter(c => c && c !== "ALL");
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
    <div className="rounded-xl p-3 text-center" style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.border}` }}>
      <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "11px", color: currentTheme.textMuted }}>No categories available</p>
    </div>
  );

  return (
    <div className="rounded-xl p-3 max-h-36 overflow-y-auto" style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.border}` }}>
      <div className="flex flex-wrap gap-1.5">
        {filtered.map(category => {
          const checked = selectedCategories.includes(category);
          const count = availableSites.filter(s => s.category === category).length;
          return (
            <motion.label
              key={category}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 cursor-pointer transition-all duration-200"
              style={{
                background: checked ? `${currentTheme.accent}16` : currentTheme.bgCard,
                border: checked ? `1px solid ${currentTheme.accent}45` : `1px solid ${currentTheme.border}`,
              }}
            >
              <input type="checkbox" checked={checked} onChange={e => toggle(category, e.target.checked)} className="hidden" />
              <div
                className="w-3.5 h-3.5 rounded flex items-center justify-center"
                style={{
                  background: checked ? `${currentTheme.accent}28` : currentTheme.bgInput,
                  border: checked ? `1px solid ${currentTheme.accent}70` : `1px solid ${currentTheme.border}`,
                }}
              >
                {checked && (
                  <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                    <path d="M1 3L3 5L7 1" stroke={currentTheme.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </div>
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9.5px", letterSpacing: "0.06em", color: checked ? currentTheme.text : currentTheme.textMuted, textTransform: "uppercase" }}>
                {category}
              </span>
              <span
                className="rounded px-1 py-0.5"
                style={{
                  fontFamily: "'JetBrains Mono',monospace", fontSize: "8px",
                  background: checked ? `${currentTheme.accent}20` : currentTheme.bgInput,
                  color: checked ? currentTheme.accent : currentTheme.textDim,
                  border: checked ? `1px solid ${currentTheme.accent}30` : `1px solid ${currentTheme.border}`,
                }}
              >
                {count}
              </span>
            </motion.label>
          );
        })}
      </div>
    </div>
  );
};

// ─── Site Assign List ─────────────────────────────────────────────────────────
const SiteAssignList = ({ sites, selectedSites, setSelectedSites, highlightedCategories = [], currentTheme }) => {
  const [search, setSearch] = useState("");
  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return q ? sites.filter(s => (s.domain || s.url || s.name || "").toLowerCase().includes(q)) : sites;
  }, [sites, search]);

  return (
    <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${currentTheme.border}` }}>
      {/* Search bar */}
      <div
        className="px-3 py-2 flex items-center gap-2"
        style={{ background: currentTheme.bgInput, borderBottom: `1px solid ${currentTheme.border}` }}
      >
        <Search size={11} className="shrink-0" style={{ color: `${currentTheme.accent}60` }} />
        <input
          type="text" placeholder="Filter sites…" value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-transparent outline-none"
          style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10.5px", color: currentTheme.text }}
          placeholder-style={{ color: currentTheme.textDim }}
        />
        {search && (
          <button onClick={() => setSearch("")} style={{ color: currentTheme.textDim }}>
            <X size={10} />
          </button>
        )}
      </div>

      {/* Site list */}
      <div className="max-h-48 overflow-y-auto" style={{ background: currentTheme.bgCard }}>
        {filtered.length === 0 ? (
          <p className="p-3 text-center" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: currentTheme.textMuted }}>
            No sites found
          </p>
        ) : filtered.map(site => {
          const siteId = site._id.toString();
          const checked = selectedSites.includes(siteId);
          const catHL = site.category && highlightedCategories.includes(site.category);
          return (
            <label
              key={site._id}
              className="flex items-center justify-between gap-3 px-3 py-2 cursor-pointer transition-colors duration-150"
              style={{
                background: checked ? `${currentTheme.accent}10` : "transparent",
                borderBottom: `1px solid ${currentTheme.border}`,
              }}
              onMouseEnter={e => { if (!checked) e.currentTarget.style.background = `${currentTheme.accent}06`; }}
              onMouseLeave={e => { if (!checked) e.currentTarget.style.background = "transparent"; }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-4 h-4 rounded flex items-center justify-center shrink-0 transition-all"
                  style={{
                    background: checked ? `${currentTheme.accent}22` : currentTheme.bgInput,
                    border: checked ? `1px solid ${currentTheme.accent}60` : `1px solid ${currentTheme.border}`,
                  }}
                >
                  <input
                    type="checkbox" checked={checked}
                    onChange={e => {
                      if (e.target.checked) setSelectedSites([...selectedSites, siteId]);
                      else setSelectedSites(selectedSites.filter(id => id !== siteId));
                    }}
                    className="hidden"
                  />
                  {checked && (
                    <svg width="8" height="6" viewBox="0 0 8 6" fill="none">
                      <path d="M1 3L3 5L7 1" stroke={currentTheme.accent} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </div>
                <div className="min-w-0">
                  <span className="block truncate" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10.5px", color: currentTheme.textSecondary }}>
                    {site.domain || site.url || site.name}
                  </span>
                  {site.category && (
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8.5px", color: catHL ? currentTheme.accentSecondary : currentTheme.textDim, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                      {site.category}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {catHL && <Tag size={10} style={{ color: `${currentTheme.accentSecondary}80` }} />}
                {checked && <CheckCircle2 size={13} style={{ color: currentTheme.accent }} />}
              </div>
            </label>
          );
        })}
      </div>

      {/* Footer */}
      {filtered.length > 0 && (
        <div
          className="px-3 py-1.5 flex items-center justify-between"
          style={{ background: currentTheme.bgInput, borderTop: `1px solid ${currentTheme.border}` }}
        >
          <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8.5px", color: currentTheme.textDim }}>
            {selectedSites.length} selected of {sites.length}
          </span>
          {selectedSites.length > 0 && (
            <button
              onClick={() => setSelectedSites([])}
              className="text-[8.5px] transition-colors"
              style={{ fontFamily: "'JetBrains Mono',monospace", color: currentTheme.textDim }}
              onMouseEnter={e => e.currentTarget.style.color = currentTheme.error}
              onMouseLeave={e => e.currentTarget.style.color = currentTheme.textDim}
            >
              clear all
            </button>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Delete Confirm Modal ─────────────────────────────────────────────────────
const DeleteModal = ({ user, onConfirm, onCancel, currentTheme }) => (
  <motion.div
    key="del-overlay"
    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
    className="fixed inset-0 z-[60] flex items-center justify-center p-4"
    style={{ background: currentTheme.bgOverlay, backdropFilter: "blur(10px)" }}
    onClick={onCancel}
  >
    <motion.div
      initial={{ scale: 0.93, opacity: 0, y: 10 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.93, opacity: 0, y: 10 }}
      transition={{ type: "spring", stiffness: 160, damping: 20 }}
      className="relative w-full max-w-xs rounded-2xl overflow-hidden p-5"
      style={{
        background: currentTheme.bgPanel,
        border: `1px solid ${currentTheme.error}30`,
        backdropFilter: "blur(24px)",
        boxShadow: `0 0 48px ${currentTheme.error}12`,
      }}
      onClick={e => e.stopPropagation()}
    >
      <div aria-hidden className="absolute inset-x-0 top-0 h-px" style={{ background: `linear-gradient(90deg,transparent,${currentTheme.error}60,transparent)` }} />

      <div className="flex items-start gap-3 mb-4">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: currentTheme.errorBg, border: `1px solid ${currentTheme.error}30` }}>
          <AlertTriangle size={16} style={{ color: currentTheme.error }} />
        </div>
        <div className="min-w-0">
          <p className="text-[12px] font-bold mb-0.5" style={{ fontFamily: "'Orbitron',sans-serif", letterSpacing: ".04em", color: currentTheme.text }}>
            Delete User
          </p>
          <p className="text-[10px] leading-relaxed" style={{ fontFamily: "'JetBrains Mono',monospace", color: currentTheme.textMuted }}>
            Permanently remove <span style={{ color: currentTheme.error, fontWeight: 600 }}>{user.name}</span>? This cannot be undone.
          </p>
        </div>
      </div>

      <div className="flex gap-2">
        <button
          onClick={onCancel}
          className="flex-1 py-2.5 rounded-xl text-[10.5px] transition-colors"
          style={{ fontFamily: "'JetBrains Mono',monospace", background: currentTheme.bgInput, border: `1px solid ${currentTheme.border}`, color: currentTheme.textSecondary }}
        >
          Cancel
        </button>
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={onConfirm}
          className="flex-1 py-2.5 rounded-xl text-[10.5px] font-semibold flex items-center justify-center gap-1.5"
          style={{ fontFamily: "'JetBrains Mono',monospace", background: currentTheme.errorBg, border: `1px solid ${currentTheme.error}40`, color: currentTheme.error }}
        >
          <Trash2 size={11} /> Delete
        </motion.button>
      </div>
    </motion.div>
  </motion.div>
);

// ─── Action Button ────────────────────────────────────────────────────────────
const ActionBtn = ({ icon, label, color, bg, border, onClick, compact = false }) => (
  <motion.button
    whileHover={{ y: -1 }} whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className={`flex items-center justify-center gap-1.5 rounded-xl font-medium transition-all duration-150 ${compact ? "px-3 py-1.5" : "flex-1 py-2.5"}`}
    style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10.5px", background: bg, border: `1px solid ${border}`, color }}
  >
    {icon}{label}
  </motion.button>
);

// ─── Sort Button ──────────────────────────────────────────────────────────────
const SortBtn = ({ label, field, sort, onSort, currentTheme }) => {
  const active = sort.field === field;
  return (
    <button
      onClick={() => onSort(field)}
      className="flex items-center gap-1 transition-colors duration-150"
      style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: "9px",
        letterSpacing: ".14em", textTransform: "uppercase",
        color: active ? currentTheme.accent : `${currentTheme.accent}55`,
      }}
    >
      {label}
      <span className="flex flex-col gap-[1px]">
        <ChevronUp size={7} style={{ opacity: active && sort.dir === "asc" ? 1 : 0.3 }} />
        <ChevronDown size={7} style={{ opacity: active && sort.dir === "desc" ? 1 : 0.3 }} />
      </span>
    </button>
  );
};

// ─── Users Table Section ──────────────────────────────────────────────────────
const UsersSection = ({ users, openEditModal, handleDelete, currentTheme }) => {
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState({ field: "name", dir: "asc" });
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleSort = field => setSort(s => ({ field, dir: s.field === field && s.dir === "asc" ? "desc" : "asc" }));

  const processed = useMemo(() => {
    const q = search.toLowerCase();
    const filtered = q
      ? users.filter(u => (u.name || "").toLowerCase().includes(q) || (u.email || "").toLowerCase().includes(q) || (u.role || "").toLowerCase().includes(q))
      : users;
    return [...filtered].sort((a, b) => {
      const va = (a[sort.field] ?? "").toString().toLowerCase();
      const vb = (b[sort.field] ?? "").toString().toLowerCase();
      return sort.dir === "asc" ? va.localeCompare(vb) : vb.localeCompare(va);
    });
  }, [users, search, sort]);

  return (
    <>
      <AnimatePresence>
        {deleteTarget && (
          <DeleteModal
            user={deleteTarget}
            onConfirm={() => { handleDelete(deleteTarget._id); setDeleteTarget(null); }}
            onCancel={() => setDeleteTarget(null)}
            currentTheme={currentTheme}
          />
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.18, duration: 0.38 }}>
        <GlassCard className="p-4 sm:p-5" currentTheme={currentTheme}>
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <SectionLabel icon={Users} label="Manage Users" currentTheme={currentTheme} />
            <div className="flex items-center gap-2 shrink-0">
              <div
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                style={{ background: `${currentTheme.accent}10`, border: `1px solid ${currentTheme.accent}20` }}
              >
                <Users size={10} style={{ color: currentTheme.accent }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9.5px", color: `${currentTheme.accent}90` }}>
                  {users.length} total
                </span>
              </div>
              <div className="relative flex items-center" style={{ width: 170 }}>
                <Search size={11} className="absolute left-2.5 pointer-events-none" style={{ color: `${currentTheme.accent}60` }} />
                <input
                  type="text" placeholder="Search…" value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="w-full pl-7 pr-6 py-1.5 rounded-lg text-[10.5px] outline-none"
                  style={{
                    fontFamily: "'JetBrains Mono',monospace",
                    background: currentTheme.bgInput,
                    border: `1px solid ${currentTheme.border}`,
                    color: currentTheme.text,
                  }}
                  onFocus={e => e.target.style.border = `1px solid ${currentTheme.accent}45`}
                  onBlur={e => e.target.style.border = `1px solid ${currentTheme.border}`}
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2" style={{ color: currentTheme.textDim }}>
                    <X size={10} />
                  </button>
                )}
              </div>
            </div>
          </div>

          <AnimatePresence mode="wait">
            {processed.length === 0 ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                className="rounded-xl p-8 text-center"
                style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.border}` }}
              >
                <Users size={24} className="mx-auto mb-2" style={{ color: `${currentTheme.accent}30` }} />
                <p style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "11px", color: currentTheme.textMuted }}>
                  {search ? `No match for "${search}"` : "No users found"}
                </p>
              </motion.div>
            ) : (
              <motion.div key="table" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>

                {/* Mobile cards */}
                <div className="grid gap-2 lg:hidden">
                  <AnimatePresence>
                    {processed.map((user, i) => (
                      <motion.div
                        key={user._id}
                        initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                        transition={{ delay: i * 0.03 }}
                        className="rounded-xl p-3.5 transition-colors duration-200"
                        style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.border}` }}
                        onMouseEnter={e => e.currentTarget.style.background = `${currentTheme.accent}08`}
                        onMouseLeave={e => e.currentTarget.style.background = currentTheme.bgInput}
                      >
                        <div className="flex items-start gap-3 mb-3">
                          <Avatar name={user.name} size={36} currentTheme={currentTheme} />
                          <div className="min-w-0 flex-1">
                            <p className="text-[12px] font-bold truncate" style={{ fontFamily: "'Orbitron',sans-serif", letterSpacing: ".03em", color: currentTheme.text }}>
                              {user.name}
                            </p>
                            <p className="text-[9.5px] mt-0.5 break-all" style={{ fontFamily: "'JetBrains Mono',monospace", color: currentTheme.textMuted }}>
                              {user.email}
                            </p>
                            <div className="flex flex-wrap gap-1.5 mt-1.5">
                              <RoleBadge role={user.role} currentTheme={currentTheme} />
                              {user.assignedCategories?.length > 0 && (
                                <span
                                  className="px-2 py-0.5 rounded-lg text-[8.5px]"
                                  style={{ fontFamily: "'JetBrains Mono',monospace", background: `${currentTheme.accentSecondary}14`, border: `1px solid ${currentTheme.accentSecondary}28`, color: currentTheme.accentSecondary }}
                                >
                                  {user.assignedCategories.length} {user.assignedCategories.length === 1 ? "category" : "categories"}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <ActionBtn icon={<Edit2 size={12} />} label="Edit" color={currentTheme.accent} bg={`${currentTheme.accent}12`} border={`${currentTheme.accent}28`} onClick={() => openEditModal?.(user)} />
                          <ActionBtn icon={<Trash2 size={12} />} label="Delete" color={currentTheme.error} bg={currentTheme.errorBg} border={`${currentTheme.error}30`} onClick={() => setDeleteTarget(user)} />
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {/* Desktop table */}
                <div className="hidden lg:block overflow-x-auto rounded-xl" style={{ border: `1px solid ${currentTheme.border}` }}>
                  <table className="w-full">
                    <thead>
                      <tr style={{ background: currentTheme.bgInput, borderBottom: `1px solid ${currentTheme.border}` }}>
                        {[
                          { label: "User",  field: "name"  },
                          { label: "Email", field: "email" },
                          { label: "Role",  field: "role"  },
                          { label: null,    field: null     },
                        ].map(({ label, field }, i) => (
                          <th key={i} className={`px-4 py-2.5 ${i === 0 ? "text-left" : i < 3 ? "text-left" : "text-right"}`}>
                            {label && field
                              ? <SortBtn label={label} field={field} sort={sort} onSort={handleSort} currentTheme={currentTheme} />
                              : label
                              ? <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", letterSpacing: ".14em", textTransform: "uppercase", color: `${currentTheme.accent}55` }}>{label}</span>
                              : null}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      <AnimatePresence>
                        {processed.map((user, i) => (
                          <motion.tr
                            key={user._id}
                            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                            transition={{ delay: i * 0.025 }}
                            className="transition-colors duration-150"
                            style={{ borderTop: `1px solid ${currentTheme.border}`, background: currentTheme.bgCard }}
                            onMouseEnter={e => e.currentTarget.style.background = `${currentTheme.accent}06`}
                            onMouseLeave={e => e.currentTarget.style.background = currentTheme.bgCard}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2.5">
                                <Avatar name={user.name} size={30} currentTheme={currentTheme} />
                                <span className="text-[11.5px] font-bold" style={{ fontFamily: "'Orbitron',sans-serif", letterSpacing: ".03em", color: currentTheme.text }}>
                                  {user.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-[10.5px]" style={{ fontFamily: "'JetBrains Mono',monospace", color: currentTheme.textMuted }}>
                                {user.email}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                <RoleBadge role={user.role} currentTheme={currentTheme} />
                                {user.assignedCategories?.length > 0 && (
                                  <span
                                    className="px-1.5 py-0.5 rounded text-[8.5px]"
                                    style={{ fontFamily: "'JetBrains Mono',monospace", background: `${currentTheme.accentSecondary}10`, border: `1px solid ${currentTheme.accentSecondary}22`, color: currentTheme.accentSecondary }}
                                  >
                                    {user.assignedCategories.length}×cat
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5 justify-end">
                                <ActionBtn icon={<Edit2 size={11} />} label="Edit" color={currentTheme.accent} bg={`${currentTheme.accent}12`} border={`${currentTheme.accent}25`} onClick={() => openEditModal?.(user)} compact />
                                <ActionBtn icon={<Trash2 size={11} />} label="Delete" color={currentTheme.error} bg={currentTheme.errorBg} border={`${currentTheme.error}28`} onClick={() => setDeleteTarget(user)} compact />
                              </div>
                            </td>
                          </motion.tr>
                        ))}
                      </AnimatePresence>
                    </tbody>
                  </table>
                  <div
                    className="px-4 py-2 flex justify-between"
                    style={{ background: currentTheme.bgInput, borderTop: `1px solid ${currentTheme.border}` }}
                  >
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8.5px", color: currentTheme.textDim }}>
                      {processed.length} of {users.length} users
                    </span>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8.5px", color: `${currentTheme.accent}55` }}>
                      sorted by {sort.field} · {sort.dir}
                    </span>
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
const EditModal = ({
  editUser, editForm, setEditForm,
  newPassword, setNewPassword,
  editAssignedSites, setEditAssignedSites,
  editAssignedCategories, setEditAssignedCategories,
  availableSites, availableCategories,
  handleUpdateUser, onClose,
  currentTheme,
}) => {
  const isSuper = editForm.role === "SUPERADMIN";
  return (
    <AnimatePresence>
      {editUser && (
        <motion.div
          key="edit-overlay"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: currentTheme.bgOverlay, backdropFilter: "blur(10px)" }}
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 10 }}
            transition={{ type: "spring", stiffness: 150, damping: 20 }}
            className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl"
            style={{
              background: currentTheme.bgPanel,
              border: `1px solid ${currentTheme.borderAccent}`,
              backdropFilter: "blur(20px)",
              boxShadow: currentTheme.shadow,
            }}
            onClick={e => e.stopPropagation()}
          >
            <div
              aria-hidden
              className="sticky top-0 inset-x-0 h-px"
              style={{ background: currentTheme.gradientTopBar }}
            />

            <div className="p-5 sm:p-6">
              {/* Modal header */}
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-3">
                  <Avatar name={editUser.name} size={40} currentTheme={currentTheme} />
                  <div>
                    <h3 className="text-[14px] font-black" style={{ fontFamily: "'Orbitron',sans-serif", letterSpacing: ".06em", color: currentTheme.text }}>
                      EDIT USER
                    </h3>
                    <p className="mt-0.5" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9.5px", color: currentTheme.textMuted }}>
                      Update profile, role, access &amp; password
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.06, rotate: 90 }} whileTap={{ scale: 0.94 }}
                  transition={{ duration: 0.15 }}
                  onClick={onClose}
                  className="w-8 h-8 rounded-xl flex items-center justify-center"
                  style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.border}` }}
                >
                  <X size={13} style={{ color: currentTheme.textSecondary }} />
                </motion.button>
              </div>

              <div className="grid md:grid-cols-2 gap-3">
                <div>
                  <FieldLabel icon={User2} currentTheme={currentTheme}>Name</FieldLabel>
                  <HudInput placeholder="Name" value={editForm.name} onChange={e => setEditForm({ ...editForm, name: e.target.value })} currentTheme={currentTheme} />
                </div>
                <div>
                  <FieldLabel icon={Mail} currentTheme={currentTheme}>Email</FieldLabel>
                  <HudInput type="email" placeholder="Email" value={editForm.email} onChange={e => setEditForm({ ...editForm, email: e.target.value })} currentTheme={currentTheme} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel icon={ShieldCheck} currentTheme={currentTheme}>Role</FieldLabel>
                  <HudSelect value={editForm.role} onChange={e => setEditForm({ ...editForm, role: e.target.value })} currentTheme={currentTheme}>
                    <option value="USER">User</option>
                    <option value="SUPERADMIN">Super Admin</option>
                    <option value="VIEWER">Viewer</option>
                  </HudSelect>
                </div>

                {!isSuper && (
                  <>
                    <div className="md:col-span-2">
                      <FieldLabel icon={Tag} note="— auto-selects sites" currentTheme={currentTheme}>Assign Categories</FieldLabel>
                      <CategoryAssignList
                        availableCategories={availableCategories}
                        selectedCategories={editAssignedCategories}
                        setSelectedCategories={setEditAssignedCategories}
                        availableSites={availableSites}
                        setSelectedSites={setEditAssignedSites}
                        currentTheme={currentTheme}
                      />
                    </div>
                    <div className="md:col-span-2">
                      <FieldLabel icon={Globe2} currentTheme={currentTheme}>
                        Assign Websites
                        {editAssignedSites.length > 0 && (
                          <span
                            className="ml-1 px-1.5 py-0.5 rounded text-[8px]"
                            style={{ background: `${currentTheme.accent}18`, color: currentTheme.accent, border: `1px solid ${currentTheme.accent}30` }}
                          >
                            {editAssignedSites.length} selected
                          </span>
                        )}
                      </FieldLabel>
                      <SiteAssignList
                        sites={availableSites}
                        selectedSites={editAssignedSites}
                        setSelectedSites={setEditAssignedSites}
                        highlightedCategories={editAssignedCategories}
                        currentTheme={currentTheme}
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <FieldLabel icon={Lock} currentTheme={currentTheme}>
                    New Password
                    <span style={{ color: currentTheme.textDim, fontWeight: 400, textTransform: "none", letterSpacing: ".04em" }}>(optional)</span>
                  </FieldLabel>
                  <PasswordInput placeholder="Leave blank to keep current" value={newPassword} onChange={e => setNewPassword(e.target.value)} currentTheme={currentTheme} />
                </div>
              </div>

              <div className="flex justify-end gap-2 mt-5">
                <button
                  onClick={onClose}
                  className="px-4 py-2.5 rounded-xl text-[10.5px] transition-colors"
                  style={{ fontFamily: "'JetBrains Mono',monospace", background: currentTheme.bgInput, border: `1px solid ${currentTheme.border}`, color: currentTheme.textSecondary }}
                >
                  Cancel
                </button>
                <motion.button
                  whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                  onClick={handleUpdateUser}
                  className="px-5 py-2.5 rounded-xl flex items-center gap-2"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.accent}22, ${currentTheme.accentSecondary}18)`,
                    border: `1px solid ${currentTheme.accent}35`,
                    boxShadow: `0 0 22px ${currentTheme.accent}12`,
                  }}
                >
                  <RefreshCw size={12} style={{ color: currentTheme.accent }} />
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: "11px", letterSpacing: ".10em", color: currentTheme.text }}>
                    SAVE CHANGES
                  </span>
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
}) => {
  const { currentTheme } = useTheme();

  return (
    <>
      <FontLoader />

      <div
        className="relative min-h-screen w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-5"
        style={{ background: "transparent", color: currentTheme.text }}
      >
        <Background currentTheme={currentTheme} />
        <CursorGlow currentTheme={currentTheme} />
        {["tl", "tr", "bl", "br"].map((p, i) => (
          <HUDCorner key={p} pos={p} delay={0.08 + i * 0.04} currentTheme={currentTheme} />
        ))}

        <div className="relative z-10 w-full max-w-6xl mx-auto space-y-4">

          {/* ── Page Header ─────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
            className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="h-px w-7" style={{ background: `${currentTheme.accent}35` }} />
                <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8.5px", letterSpacing: "0.28em", color: `${currentTheme.accent}70`, textTransform: "uppercase" }}>
                  Admin Control Center
                </span>
                <div className="h-px w-12" style={{ background: `${currentTheme.accent}18` }} />
              </div>
              <h1
                className="text-2xl sm:text-3xl"
                style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 900, letterSpacing: "0.06em", color: currentTheme.text, textShadow: `0 0 28px ${currentTheme.accent}18` }}
              >
                SUPER ADMIN
              </h1>
              <p className="mt-1 max-w-xl" style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10.5px", color: currentTheme.textMuted, letterSpacing: "0.02em" }}>
                Manage users, assign websites, control roles and access permissions.
              </p>
            </div>
            <StatusDot color={currentTheme.success} label="Superadmin Access" />
          </motion.div>

          {/* ── Stats Row ───────────────────────────────────────────────── */}
          <div className="grid grid-cols-3 gap-3">
            <StatCard icon={Users}       label="Total Users"   value={users.length}          accentColor={currentTheme.accent}          delay={0.05} currentTheme={currentTheme} />
            <StatCard icon={Globe2}      label="Sites"         value={availableSites.length}  accentColor={currentTheme.accentSecondary} delay={0.08} currentTheme={currentTheme} />
            <StatCard icon={ShieldCheck} label="Access Level"  value="SUPER"                 accentColor={currentTheme.success}         delay={0.11} currentTheme={currentTheme} />
          </div>

          {/* ── Create User Form ────────────────────────────────────────── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.14, duration: 0.38 }}>
            <GlassCard className="p-4 sm:p-5" currentTheme={currentTheme}>
              <SectionLabel icon={UserPlus} label="Create New User" currentTheme={currentTheme} />

              <div className="grid md:grid-cols-2 gap-3 mb-3">
                <div>
                  <FieldLabel icon={User2} currentTheme={currentTheme}>Username</FieldLabel>
                  <HudInput placeholder="Enter username" name="username" value={form.username} onChange={handleChange} currentTheme={currentTheme} />
                </div>
                <div>
                  <FieldLabel icon={Mail} currentTheme={currentTheme}>Email</FieldLabel>
                  <HudInput placeholder="user@domain.com" name="email" type="email" value={form.email} onChange={handleChange} currentTheme={currentTheme} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel icon={Lock} currentTheme={currentTheme}>Password</FieldLabel>
                  <PasswordInput placeholder="Set a strong password" name="password" value={form.password} onChange={handleChange} currentTheme={currentTheme} />
                  <StrengthBar strength={passwordStrength} currentTheme={currentTheme} />
                </div>
                <div className="md:col-span-2">
                  <FieldLabel icon={ShieldCheck} currentTheme={currentTheme}>Role</FieldLabel>
                  <HudSelect name="role" value={form.role} onChange={handleChange} currentTheme={currentTheme}>
                    <option value="USER">User</option>
                    <option value="SUPERADMIN">Super Admin</option>
                    <option value="VIEWER">Viewer</option>
                  </HudSelect>
                </div>
              </div>

              {form.role !== "SUPERADMIN" && (
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <div>
                    <FieldLabel icon={Tag} note="— auto-selects sites" currentTheme={currentTheme}>
                      Assign Categories
                    </FieldLabel>
                    <CategoryAssignList
                      availableCategories={availableCategories}
                      selectedCategories={assignedCategories}
                      setSelectedCategories={setAssignedCategories}
                      availableSites={availableSites}
                      setSelectedSites={setAssignedSites}
                      currentTheme={currentTheme}
                    />
                  </div>
                  <div>
                    <FieldLabel icon={Globe2} currentTheme={currentTheme}>
                      Assign Websites
                      {assignedSites.length > 0 && (
                        <span
                          className="ml-1 px-1.5 py-0.5 rounded text-[8px]"
                          style={{ background: `${currentTheme.accent}18`, color: currentTheme.accent, border: `1px solid ${currentTheme.accent}30` }}
                        >
                          {assignedSites.length} selected
                        </span>
                      )}
                    </FieldLabel>
                    <SiteAssignList
                      sites={availableSites}
                      selectedSites={assignedSites}
                      setSelectedSites={setAssignedSites}
                      highlightedCategories={assignedCategories}
                      currentTheme={currentTheme}
                    />
                  </div>
                </div>
              )}

              <div className="flex justify-end pt-1">
                <motion.button
                  type="button"
                  onClick={handleSubmit}
                  whileHover={{ scale: 1.015 }} whileTap={{ scale: 0.985 }}
                  className="flex items-center gap-2.5 px-6 py-3 rounded-xl"
                  style={{
                    background: `linear-gradient(135deg, ${currentTheme.accent}20, ${currentTheme.accentSecondary}15)`,
                    border: `1px solid ${currentTheme.accent}35`,
                    boxShadow: `0 0 26px ${currentTheme.accent}12`,
                  }}
                >
                  <UserPlus size={15} style={{ color: currentTheme.accent }} />
                  <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: "11px", letterSpacing: ".12em", color: currentTheme.text }}>
                    CREATE USER
                  </span>
                </motion.button>
              </div>
            </GlassCard>
          </motion.div>

          {/* ── Users Table ─────────────────────────────────────────────── */}
          <UsersSection users={users} openEditModal={openEditModal} handleDelete={handleDelete} currentTheme={currentTheme} />

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
        currentTheme={currentTheme}
      />
    </>
  );
};

export default SuperAdminUI;