import { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  Globe2,
  Search,
  CalendarDays,
  Trash2,
  RefreshCcw,
  PlusCircle,
  Activity,
  Link2,
  Server,
  FileClock,
  ChevronLeft,
  ChevronRight,
  FilterX,
  SlidersHorizontal,
  Layers,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

// ─────────────────────────────────────────────────────────────────────────────
// Font Loader
// ─────────────────────────────────────────────────────────────────────────────
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

// ─────────────────────────────────────────────────────────────────────────────
// Cursor Glow
// ─────────────────────────────────────────────────────────────────────────────
const CursorGlow = ({ currentTheme }) => {
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
        width: 320, height: 320, borderRadius: "50%",
        background: `radial-gradient(circle, ${currentTheme.accent}15 0%, transparent 72%)`,
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Background
// ─────────────────────────────────────────────────────────────────────────────
const Background = ({ currentTheme }) => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0" style={{ background: currentTheme.bg }} />
    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 60% 40% at 50% 20%, ${currentTheme.accent}15 0%, transparent 100%)` }} />
    <div className="absolute" style={{ top: "62%", left: "16%", width: 320, height: 320, background: `radial-gradient(circle, ${currentTheme.accent}12 0%, transparent 68%)`, filter: "blur(90px)" }} />
    <div className="absolute" style={{ top: "18%", right: "12%", width: 260, height: 260, background: `radial-gradient(circle, ${currentTheme.success}10 0%, transparent 68%)`, filter: "blur(80px)" }} />
    <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${currentTheme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.gridColor} 1px, transparent 1px)`, backgroundSize: "42px 42px" }} />
    <motion.div
      className="absolute inset-0"
      style={{ background: `linear-gradient(to bottom, transparent 48%, ${currentTheme.accent}08 50%, transparent 52%)` }}
      animate={{ y: ["-100%", "100%"] }}
      transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 2.5 }}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// HUD Corner
// ─────────────────────────────────────────────────────────────────────────────
const HUDCorner = ({ pos, delay = 0, currentTheme }) => {
  const cls = { tl: "top-4 left-4", tr: "top-4 right-4", bl: "bottom-4 left-4", br: "bottom-4 right-4" };
  const rot = { tl: "0deg", tr: "90deg", bl: "-90deg", br: "180deg" };
  return (
    <motion.div className={`fixed ${cls[pos]} w-7 h-7 z-20 pointer-events-none`} style={{ transform: `rotate(${rot[pos]})` }} initial={{ opacity: 0, scale: 0.3 }} animate={{ opacity: 0.8, scale: 1 }} transition={{ delay, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}>
      <motion.div className="absolute top-0 left-0 h-[1.5px]" style={{ background: currentTheme.accent, opacity: 0.8 }} initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: delay + 0.15, duration: 0.35 }} />
      <motion.div className="absolute top-0 left-0 w-[1.5px]" style={{ background: currentTheme.accent, opacity: 0.8 }} initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ delay: delay + 0.15, duration: 0.35 }} />
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Orbit Ring
// ─────────────────────────────────────────────────────────────────────────────
const OrbitRing = ({ radius, duration, dotCount, color, delay = 0, tilt = 70 }) => (
  <motion.div
    className="fixed pointer-events-none z-[1]"
    style={{ width: radius * 2, height: radius * 2, top: "50%", left: "50%", marginTop: -radius, marginLeft: -radius, transform: `perspective(900px) rotateX(${tilt}deg)`, opacity: 0.4 }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <div className="absolute inset-0 rounded-full" style={{ border: `1px solid ${color}14` }} />
    {Array.from({ length: dotCount }, (_, i) => {
      const angle = (i / dotCount) * 2 * Math.PI;
      const cx = Math.cos(angle) * radius + radius;
      const cy = Math.sin(angle) * radius + radius;
      return (
        <motion.div key={i} className="absolute rounded-full" style={{ width: i === 0 ? 4 : 2, height: i === 0 ? 4 : 2, background: i === 0 ? color : `${color}40`, left: cx - (i === 0 ? 2 : 1), top: cy - (i === 0 ? 2 : 1), boxShadow: i === 0 ? `0 0 8px ${color}` : "none" }} animate={i === 0 ? { opacity: [1, 0.35, 1] } : {}} transition={{ duration: 1.8, repeat: Infinity }} />
      );
    })}
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Status Dot
// ─────────────────────────────────────────────────────────────────────────────
const StatusDot = ({ color = "#34d399", label }) => (
  <div className="flex items-center gap-2">
    <div className="relative w-2 h-2">
      <motion.div className="absolute inset-0 rounded-full" style={{ background: color }} animate={{ scale: [1, 2], opacity: [0.45, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
    </div>
    {label && <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.16em", color: `${color}88`, textTransform: "uppercase" }}>{label}</span>}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Glass Input
// ─────────────────────────────────────────────────────────────────────────────
const GlassInput = ({ icon: Icon, children, className = "", currentTheme }) => (
  <div className={`flex items-center gap-2 rounded-xl px-3 py-2 ${className}`} style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(14px)", boxShadow: `0 0 14px ${currentTheme.accent}08` }}>
    {Icon && <Icon size={14} style={{ color: currentTheme.accent }} className="shrink-0" />}
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color, currentTheme }) => (
  <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="rounded-2xl p-4" style={{ background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(16px)", boxShadow: currentTheme.shadow }}>
    <div className="flex items-center justify-between mb-3">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center border" style={{ borderColor: currentTheme.borderAccent, background: currentTheme.bgInput }}>
        <Icon size={16} style={{ color: color || currentTheme.accent }} />
      </div>
    </div>
    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</div>
    <div className="mt-2 text-lg sm:text-xl break-words" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: "0.04em", color: currentTheme.text }}>{value}</div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Action Badge
// ─────────────────────────────────────────────────────────────────────────────
const getActionStyles = (action, currentTheme) => {
  switch (action) {
    case "Created": return { pill: "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20", dot: currentTheme.success, icon: PlusCircle };
    case "Updated": return { pill: "bg-sky-500/10 text-sky-300 border border-sky-400/20", dot: currentTheme.accent, icon: RefreshCcw };
    case "Deleted": return { pill: "bg-red-500/10 text-red-300 border border-red-400/20", dot: currentTheme.error, icon: Trash2 };
    default:        return { pill: "bg-slate-500/10 text-slate-300 border border-slate-400/20", dot: currentTheme.textMuted, icon: Activity };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Action Filter Component
// ─────────────────────────────────────────────────────────────────────────────
const ActionFilter = ({ filter, onFilterChange, currentTheme }) => {
  const filters = [
    { value: "all", label: "All Actions", icon: <Layers size={14} />, description: "View all activities", color: currentTheme.textMuted },
    { value: "Created", label: "Created", icon: <PlusCircle size={14} />, description: "New websites", color: currentTheme.success },
    { value: "Updated", label: "Updated", icon: <RefreshCcw size={14} />, description: "Modified websites", color: currentTheme.accent },
    { value: "Deleted", label: "Deleted", icon: <Trash2 size={14} />, description: "Removed websites", color: currentTheme.error },
  ];

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, padding: "8px 12px", borderRadius: 14, background: `rgba(255,255,255,0.04)`, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(20px)", boxShadow: currentTheme.shadow }}>
      {filters.map((f) => (
        <button
          key={f.value}
          onClick={() => onFilterChange(f.value)}
          style={{
            flex: 1,
            padding: "12px 14px",
            borderRadius: 10,
            cursor: "pointer",
            background: filter === f.value
              ? `linear-gradient(135deg, ${f.color}20 0%, ${f.color}10 100%)`
              : "transparent",
            border: filter === f.value
              ? `1.5px solid ${f.color}50`
              : `1px solid ${currentTheme.border}40`,
            color: filter === f.value ? f.color : currentTheme.textMuted,
            fontFamily: "'Inter', sans-serif",
            fontSize: 11,
            fontWeight: filter === f.value ? 600 : 500,
            letterSpacing: "0.02em",
            transition: "all 0.2s cubic-bezier(0.4, 0, 0.2, 1)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            position: "relative",
            overflow: "hidden",
          }}
          onMouseEnter={(e) => {
            if (filter !== f.value) {
              e.currentTarget.style.background = `${f.color}08`;
              e.currentTarget.style.borderColor = `${f.color}30`;
              e.currentTarget.style.transform = "translateY(-1px)";
            }
          }}
          onMouseLeave={(e) => {
            if (filter !== f.value) {
              e.currentTarget.style.background = "transparent";
              e.currentTarget.style.borderColor = `${currentTheme.border}40`;
              e.currentTarget.style.transform = "translateY(0)";
            }
          }}
        >
          {filter === f.value && (
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                background: `linear-gradient(135deg, ${f.color}15 0%, transparent 50%)`,
                pointerEvents: "none",
              }}
            />
          )}
          <div style={{ display: "flex", alignItems: "center", gap: 8, zIndex: 1 }}>
            <span style={{ 
              display: "flex", 
              alignItems: "center", 
              justifyContent: "center",
              padding: "6px",
              borderRadius: 8,
              background: filter === f.value ? `${f.color}25` : "transparent",
              transition: "all 0.2s"
            }}>
              {f.icon}
            </span>
            <span style={{ textTransform: "none" }}>{f.label}</span>
          </div>
          <span style={{ 
            fontSize: 9, 
            fontWeight: 400, 
            opacity: 0.7,
            fontFamily: "'JetBrains Mono', monospace",
            letterSpacing: "0.05em",
            textTransform: "uppercase",
            zIndex: 1
          }}>
            {f.description}
          </span>
        </button>
      ))}
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Logs = () => {
  const { currentTheme } = useTheme();
  const [logs, setLogs]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount]   = useState(0);
  const [totalPages, setTotalPages]   = useState(1);

  // ── Action filter ───────────────────────────────────────────────────────────
  const [actionFilter, setActionFilter] = useState("all");

  // ── Search: instant with debounce ─────────────────────────────────────────
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const debounceTimer                 = useRef(null);

  // ── Date: staged (input) vs applied (sent to API) ─────────────────────────
  const [fromDateInput, setFromDateInput] = useState("");
  const [toDateInput,   setToDateInput]   = useState("");
  const [appliedFrom,   setAppliedFrom]   = useState("");
  const [appliedTo,     setAppliedTo]     = useState("");

  // Dirty flag: true when staged dates differ from applied dates
  const datesDirty =
    fromDateInput !== appliedFrom || toDateInput !== appliedTo;

  const [stats, setStats] = useState({ created: 0, updated: 0, deleted: 0 });

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchLogs = useCallback(async (page, limit, q, from, to, action) => {
    try {
      setLoading(true);
      const token = localStorage.getItem("loginToken");
      const API   = import.meta.env.VITE_API_URL;

      const params = { page, limit };
      if (q)      params.q        = q;
      if (from)   params.fromDate = from;
      if (to)     params.toDate   = to;
      if (action && action !== "all") params.action = action;

      const res = await axios.get(`${API}/monitoredsite/logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setLogs(res.data.data         || []);
      setTotalCount(res.data.totalCount ?? 0);
      setTotalPages(res.data.totalPages ?? 1);
      setStats(res.data.stats       || { created: 0, updated: 0, deleted: 0 });
    } catch (err) {
      console.error("Failed to load logs:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Re-fetch on page / rowsPerPage / searchQuery / appliedFrom / appliedTo / actionFilter change
  useEffect(() => {
    fetchLogs(currentPage, rowsPerPage, searchQuery, appliedFrom, appliedTo, actionFilter);
  }, [currentPage, rowsPerPage, searchQuery, appliedFrom, appliedTo, actionFilter, fetchLogs]);

  // ── Debounced search — resets to page 1 ───────────────────────────────────
  const handleSearchChange = (value) => {
    setSearchInput(value);
    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      setCurrentPage(1);
      setSearchQuery(value);
    }, 350);
  };

  // ── Apply date filters ────────────────────────────────────────────────────
  const handleApplyFilters = () => {
    setCurrentPage(1);
    setAppliedFrom(fromDateInput);
    setAppliedTo(toDateInput);
  };

  // ── Clear all filters ─────────────────────────────────────────────────────
  const handleClear = () => {
    setSearchInput("");
    setSearchQuery("");
    setFromDateInput("");
    setToDateInput("");
    setAppliedFrom("");
    setAppliedTo("");
    setActionFilter("all");
    setCurrentPage(1);
  };

  const indexOfFirstRow = (currentPage - 1) * rowsPerPage;

  // Active chips use *applied* values (not staged)
  const hasActiveFilters = searchQuery || appliedFrom || appliedTo || actionFilter !== "all";

  return (
    <>
      <FontLoader />

      <div className="relative min-h-screen w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6" style={{ background: "transparent", color: currentTheme.text }}>
        <Background currentTheme={currentTheme} />
        <CursorGlow currentTheme={currentTheme} />

        <OrbitRing radius={220} duration={20} dotCount={8}  color={currentTheme.accent} tilt={72} />
        <OrbitRing radius={290} duration={30} dotCount={10} color={currentTheme.accentSecondary} tilt={68} delay={1} />

        {["tl", "tr", "bl", "br"].map((p, i) => (
          <HUDCorner key={p} pos={p} delay={0.1 + i * 0.05} currentTheme={currentTheme} />
        ))}

        <div className="relative z-10 w-full max-w-7xl mx-auto">

          {/* ── Header ── */}
          <motion.div initial={{ opacity: 0, y: -14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-[1px] w-8" style={{ background: currentTheme.accent }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.28em", color: currentTheme.accent, textTransform: "uppercase" }}>Audit Timeline</span>
                <div className="h-[1px] w-16 sm:w-24" style={{ background: currentTheme.borderAccent }} />
              </div>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl mb-2" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800, letterSpacing: "0.05em", color: currentTheme.text, textShadow: `0 0 24px ${currentTheme.accent}15` }}>WEBSITE LOGS</h1>
              <p className="max-w-2xl" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: currentTheme.textMuted, letterSpacing: "0.03em" }}>
                Review creation, updates, deletions, and monitored website activity across your infrastructure.
              </p>
            </div>
            <StatusDot color={currentTheme.success} label={loading ? "Fetching Logs" : "Logs Synced"} />
          </motion.div>

          {/* ── Top Status Bar ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.45 }} className="mb-6 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4" style={{ background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(14px)", boxShadow: currentTheme.shadow }}>
            <div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "13px", letterSpacing: "0.06em", color: currentTheme.text }}>SYSTEM ACTIVITY PANEL</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.textMuted, marginTop: "4px" }}>Search, inspect and filter website audit events.</div>
            </div>
            <div>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: currentTheme.textSecondary }}>Total Records: </span>
              <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, color: currentTheme.text }}>{totalCount}</span>
            </div>
          </motion.div>

          {/* ── Stats ── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard icon={FileClock}  label="Total Logs" value={totalCount} currentTheme={currentTheme} />
            <StatCard icon={PlusCircle} label="Created"    value={stats.created} color={currentTheme.success} currentTheme={currentTheme} />
            <StatCard icon={RefreshCcw} label="Updated"    value={stats.updated} color={currentTheme.accent} currentTheme={currentTheme} />
            <StatCard icon={Trash2}     label="Deleted"    value={stats.deleted} color={currentTheme.error} currentTheme={currentTheme} />
          </div>

          {/* ── Action Filter ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.45 }} className="mb-6">
            <ActionFilter filter={actionFilter} onFilterChange={(value) => { setActionFilter(value); setCurrentPage(1); }} currentTheme={currentTheme} />
          </motion.div>

          {/* ── Filters ── */}
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.12, duration: 0.45 }} className="mb-6 rounded-2xl p-4" style={{ background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(14px)", boxShadow: currentTheme.shadow }}>

            {/* Row 1: Search (full width) */}
            <div className="mb-3">
              <GlassInput icon={Search} currentTheme={currentTheme}>
                <input
                  type="text"
                  placeholder="Search domain, URL, action, user..."
                  value={searchInput}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm"
                  style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.text }}
                />
              </GlassInput>
            </div>

            {/* Row 2: Date pickers + Apply + Clear */}
            <div className="grid grid-cols-1 lg:grid-cols-[1fr_1fr_auto_auto] gap-3 items-center">

              {/* From Date */}
              <GlassInput icon={CalendarDays} currentTheme={currentTheme}>
                <div className="flex flex-col w-full">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px" }}>From</span>
                  <input
                    type="date"
                    value={fromDateInput}
                    onChange={(e) => setFromDateInput(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.text, colorScheme: currentTheme.bg === "#f8fafc" ? "light" : "dark" }}
                  />
                </div>
              </GlassInput>

              {/* To Date */}
              <GlassInput icon={CalendarDays} currentTheme={currentTheme}>
                <div className="flex flex-col w-full">
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textMuted, letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "2px" }}>To</span>
                  <input
                    type="date"
                    value={toDateInput}
                    onChange={(e) => setToDateInput(e.target.value)}
                    className="w-full bg-transparent outline-none text-sm"
                    style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.text, colorScheme: currentTheme.bg === "#f8fafc" ? "light" : "dark" }}
                  />
                </div>
              </GlassInput>

              {/* Apply Button */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleApplyFilters}
                disabled={!datesDirty}
                className="rounded-xl px-5 py-2.5 flex items-center justify-center gap-2 text-sm relative overflow-hidden disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: datesDirty
                    ? `linear-gradient(135deg, ${currentTheme.accentGlow} 0%, ${currentTheme.bgInput} 100%)`
                    : currentTheme.bgInput,
                  border: datesDirty
                    ? `1px solid ${currentTheme.accent}`
                    : `1px solid ${currentTheme.borderAccent}`,
                  color: datesDirty ? currentTheme.accent : currentTheme.textMuted,
                  fontFamily: "'JetBrains Mono', monospace",
                  boxShadow: datesDirty ? `0 0 14px ${currentTheme.accent}20` : "none",
                  transition: "all 0.2s ease",
                }}
              >
                <SlidersHorizontal size={14} />
                Apply
                {datesDirty && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full"
                    style={{ background: currentTheme.accent, boxShadow: `0 0 6px ${currentTheme.accent}` }}
                  />
                )}
              </motion.button>

              {/* Clear */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={handleClear}
                className="rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-sm"
                style={{ background: `${currentTheme.error}15`, border: `1px solid ${currentTheme.error}30`, color: currentTheme.error, fontFamily: "'JetBrains Mono', monospace" }}
              >
                <FilterX size={14} />
                Clear
              </motion.button>
            </div>

            {/* ── Active filter chips (reflect applied state) ── */}
            {hasActiveFilters && (
              <div className="flex flex-wrap gap-2 mt-3">
                {actionFilter !== "all" && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px]" style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}`, color: currentTheme.accent, fontFamily: "'JetBrains Mono', monospace" }}>
                    <Layers size={10} /> {actionFilter}
                  </span>
                )}
                {searchQuery && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px]" style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}`, color: currentTheme.accent, fontFamily: "'JetBrains Mono', monospace" }}>
                    <Search size={10} /> {searchQuery}
                  </span>
                )}
                {appliedFrom && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px]" style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}`, color: currentTheme.accent, fontFamily: "'JetBrains Mono', monospace" }}>
                    <CalendarDays size={10} /> From: {appliedFrom}
                  </span>
                )}
                {appliedTo && (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px]" style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}`, color: currentTheme.accent, fontFamily: "'JetBrains Mono', monospace" }}>
                    <CalendarDays size={10} /> To: {appliedTo}
                  </span>
                )}
              </div>
            )}

            {/* ── Pending (unapplied) date hint ── */}
            {datesDirty && (fromDateInput || toDateInput) && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 flex items-center gap-2"
              >
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.accent, letterSpacing: "0.06em" }}>
                  ⚠ Date range not applied yet — click Apply to filter
                </span>
              </motion.div>
            )}
          </motion.div>

          {/* ── Logs Panel ── */}
          <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.45 }} className="rounded-2xl overflow-hidden" style={{ background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(18px)", boxShadow: currentTheme.shadow }}>

            <div className="h-[1px] w-full" style={{ background: `linear-gradient(90deg, transparent 0%, ${currentTheme.accent}50 30%, ${currentTheme.accent}40 70%, transparent 100%)` }} />

            {loading ? (
              <div className="p-10 sm:p-14 text-center">
                <div className="flex justify-center mb-4">
                  <motion.div className="w-12 h-12 rounded-full" style={{ border: `2px solid ${currentTheme.accent}33`, borderTopColor: currentTheme.accent }} animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} />
                </div>
                <h3 className="text-lg mb-2" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.04em", fontWeight: 700, color: currentTheme.text }}>LOADING ACTIVITY LOGS</h3>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: currentTheme.textMuted }}>Fetching monitored website audit timeline...</p>
              </div>
            ) : totalCount === 0 ? (
              <div className="p-10 sm:p-14 text-center">
                <div className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center border" style={{ borderColor: currentTheme.borderAccent, background: currentTheme.bgInput }}>
                  <Globe2 size={22} style={{ color: currentTheme.accent }} />
                </div>
                <h3 className="text-lg mb-2" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.04em", fontWeight: 700, color: currentTheme.text }}>NO LOGS FOUND</h3>
                <p className="max-w-xl mx-auto" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: currentTheme.textMuted }}>
                  No audit records match the selected search or date filters.
                </p>
              </div>
            ) : (
              <>
                {/* ── Mobile Cards ── */}
                <div className="md:hidden p-3 space-y-4">
                  {logs.map((log, index) => {
                    const actionMeta = getActionStyles(log.action, currentTheme);
                    const ActionIcon = actionMeta.icon;
                    return (
                      <motion.div key={index} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: index * 0.03, duration: 0.35 }} whileHover={{ y: -2 }} className="relative overflow-hidden rounded-2xl p-4" style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderAccent}` }}>
                        <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent 0%, ${currentTheme.accent}50 30%, ${currentTheme.accent}40 70%, transparent 100%)` }} />
                        <div className="flex items-center justify-between mb-4">
                          <span className="text-[10px]" style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.textDim }}>LOG #{indexOfFirstRow + index + 1}</span>
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide ${actionMeta.pill}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                            <ActionIcon size={11} />{log.action}
                          </span>
                        </div>
                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Server size={13} style={{ color: currentTheme.accent }} />
                            <p className="text-sm break-all" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: "0.03em", color: currentTheme.text }}>{log.domain || "Unknown Domain"}</p>
                          </div>
                          <div className="flex items-start gap-2">
                            <Link2 size={12} style={{ color: currentTheme.textSecondary, marginTop: "2px" }} className="shrink-0" />
                            <a href={log.url} target="_blank" rel="noreferrer" className="text-xs break-all hover:underline" style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.accent }}>{log.url}</a>
                          </div>
                        </div>
                        <div className="h-px my-3" style={{ background: currentTheme.borderAccent }} />
                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <p className="mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.textMuted }}>ACTION BY</p>
                            <p className="truncate" style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.text }}>{log.user || "Unknown"}</p>
                          </div>
                          <div className="text-right">
                            <p className="mb-1" style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.textMuted }}>TIMESTAMP</p>
                            <p style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.text }}>
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* ── Desktop Table ── */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="sticky top-0 z-10" style={{ background: currentTheme.bgCard, backdropFilter: "blur(12px)" }}>
                      <tr style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "0.08em", color: currentTheme.textMuted, textTransform: "uppercase" }}>
                        <th className="px-5 py-4 text-left">S No.</th>
                        <th className="px-5 py-4 text-left">Domain</th>
                        <th className="px-5 py-4 text-left">URL</th>
                        <th className="px-5 py-4 text-left">Action</th>
                        <th className="px-5 py-4 text-left">Action By</th>
                        <th className="px-5 py-4 text-left">Timestamp</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log, index) => {
                        const actionMeta = getActionStyles(log.action, currentTheme);
                        const ActionIcon = actionMeta.icon;
                        return (
                          <tr key={index} className="border-t transition" style={{ borderColor: currentTheme.borderAccent }} onMouseEnter={(e) => e.currentTarget.style.background = currentTheme.bgInput} onMouseLeave={(e) => e.currentTarget.style.background = "transparent"}>
                            <td className="px-5 py-4" style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.textDim }}>{indexOfFirstRow + index + 1}</td>
                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <Server size={14} style={{ color: currentTheme.accent }} className="shrink-0" />
                                <span className="break-all" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, letterSpacing: "0.02em", fontSize: "14px", color: currentTheme.text }}>{log.domain}</span>
                              </div>
                            </td>
                            <td className="px-5 py-4 max-w-[260px]">
                              <a href={log.url} target="_blank" rel="noreferrer" className="hover:underline break-all block" style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.accent }}>{log.url}</a>
                            </td>
                            <td className="px-5 py-4">
                              <span className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs ${actionMeta.pill}`} style={{ fontFamily: "'JetBrains Mono', monospace" }}>
                                <ActionIcon size={12} />{log.action}
                              </span>
                            </td>
                            <td className="px-5 py-4" style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.text }}>{log.user || "Unknown"}</td>
                            <td className="px-5 py-4" style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.text }}>
                              {log.timestamp ? new Date(log.timestamp).toLocaleString() : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ── Pagination ── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4" style={{ borderTop: `1px solid ${currentTheme.borderAccent}` }}>
                  <div className="flex items-center gap-3">
                    <span className="text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.textMuted }}>Rows</span>
                    <select
                      value={rowsPerPage}
                      onChange={(e) => { setRowsPerPage(Number(e.target.value)); setCurrentPage(1); }}
                      className="rounded-xl px-3 py-2 text-sm bg-transparent outline-none"
                      style={{ fontFamily: "'JetBrains Mono', monospace", background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(14px)", color: currentTheme.text }}
                    >
                      <option style={{ background: currentTheme.bgSecondary, color: currentTheme.text }} value={10}>10</option>
                      <option style={{ background: currentTheme.bgSecondary, color: currentTheme.text }} value={20}>20</option>
                      <option style={{ background: currentTheme.bgSecondary, color: currentTheme.text }} value={50}>50</option>
                      <option style={{ background: currentTheme.bgSecondary, color: currentTheme.text }} value={100}>100</option>
                    </select>
                    <span className="text-xs" style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.textMuted }}>
                      {indexOfFirstRow + 1}–{Math.min(indexOfFirstRow + rowsPerPage, totalCount)} of {totalCount}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((p) => p - 1)}
                      className="px-3 py-2 rounded-xl disabled:opacity-40"
                      style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderAccent}` }}
                    >
                      <ChevronLeft size={16} style={{ color: currentTheme.text }} />
                    </motion.button>
                    <span className="px-3 text-sm" style={{ fontFamily: "'JetBrains Mono', monospace", color: currentTheme.text }}>{currentPage} / {totalPages}</span>
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      disabled={currentPage >= totalPages}
                      onClick={() => setCurrentPage((p) => p + 1)}
                      className="px-3 py-2 rounded-xl disabled:opacity-40"
                      style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderAccent}` }}
                    >
                      <ChevronRight size={16} style={{ color: currentTheme.text }} />
                    </motion.button>
                  </div>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </div>
    </>
  );
};

export default Logs;