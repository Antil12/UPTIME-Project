import { useEffect, useState } from "react";
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
  User,
  Link2,
  Server,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  FilterX,
  FileClock,
} from "lucide-react";

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
const CursorGlow = () => {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 90, damping: 24 });
  const sy = useSpring(y, { stiffness: 90, damping: 24 });

  useEffect(() => {
    const fn = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        left: sx,
        top: sy,
        translateX: "-50%",
        translateY: "-50%",
        width: 320,
        height: 320,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(56,189,248,0.045) 0%, transparent 72%)",
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Full Page Background
// ─────────────────────────────────────────────────────────────────────────────
const Background = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0" style={{ background: "#030712" }} />

    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(56,189,248,0.045) 0%, transparent 100%)",
      }}
    />

    <div
      className="absolute"
      style={{
        top: "62%",
        left: "16%",
        width: 320,
        height: 320,
        background:
          "radial-gradient(circle, rgba(129,140,248,0.035) 0%, transparent 68%)",
        filter: "blur(90px)",
      }}
    />

    <div
      className="absolute"
      style={{
        top: "18%",
        right: "12%",
        width: 260,
        height: 260,
        background:
          "radial-gradient(circle, rgba(16,185,129,0.025) 0%, transparent 68%)",
        filter: "blur(80px)",
      }}
    />

    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px)",
        backgroundSize: "42px 42px",
      }}
    />

    <motion.div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(to bottom, transparent 48%, rgba(56,189,248,0.012) 50%, transparent 52%)",
      }}
      animate={{ y: ["-100%", "100%"] }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "linear",
        repeatDelay: 2.5,
      }}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// HUD Corner
// ─────────────────────────────────────────────────────────────────────────────
const HUDCorner = ({ pos, delay = 0 }) => {
  const cls = {
    tl: "top-4 left-4",
    tr: "top-4 right-4",
    bl: "bottom-4 left-4",
    br: "bottom-4 right-4",
  };

  const rot = {
    tl: "0deg",
    tr: "90deg",
    bl: "-90deg",
    br: "180deg",
  };

  return (
    <motion.div
      className={`fixed ${cls[pos]} w-7 h-7 z-20 pointer-events-none`}
      style={{ transform: `rotate(${rot[pos]})` }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 0.8, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div
        className="absolute top-0 left-0 h-[1.5px] bg-sky-400/80"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }}
      />
      <motion.div
        className="absolute top-0 left-0 w-[1.5px] bg-sky-400/80"
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }}
      />
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Orbit Ring
// ─────────────────────────────────────────────────────────────────────────────
const OrbitRing = ({ radius, duration, dotCount, color, delay = 0, tilt = 70 }) => (
  <motion.div
    className="fixed pointer-events-none z-[1]"
    style={{
      width: radius * 2,
      height: radius * 2,
      top: "50%",
      left: "50%",
      marginTop: -radius,
      marginLeft: -radius,
      transform: `perspective(900px) rotateX(${tilt}deg)`,
      opacity: 0.4,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <div
      className="absolute inset-0 rounded-full"
      style={{ border: `1px solid ${color}14` }}
    />
    {Array.from({ length: dotCount }, (_, i) => {
      const angle = (i / dotCount) * 2 * Math.PI;
      const cx = Math.cos(angle) * radius + radius;
      const cy = Math.sin(angle) * radius + radius;

      return (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: i === 0 ? 4 : 2,
            height: i === 0 ? 4 : 2,
            background: i === 0 ? color : `${color}40`,
            left: cx - (i === 0 ? 2 : 1),
            top: cy - (i === 0 ? 2 : 1),
            boxShadow: i === 0 ? `0 0 8px ${color}` : "none",
          }}
          animate={i === 0 ? { opacity: [1, 0.35, 1] } : {}}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
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
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: color }}
        animate={{ scale: [1, 2], opacity: [0.45, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
    </div>
    {label && (
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.16em",
          color: `${color}88`,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Glass Input
// ─────────────────────────────────────────────────────────────────────────────
const GlassInput = ({ icon: Icon, children, className = "" }) => (
  <div
    className={`flex items-center gap-2 rounded-xl px-3 py-2 ${className}`}
    style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(56,189,248,0.08)",
      backdropFilter: "blur(14px)",
      boxShadow: "0 0 14px rgba(56,189,248,0.02)",
    }}
  >
    {Icon && <Icon size={14} className="text-sky-400 shrink-0" />}
    {children}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Stat Card
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, color = "text-sky-400" }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="rounded-2xl p-4"
    style={{
      background: "rgba(3,7,18,0.68)",
      border: "1px solid rgba(56,189,248,0.08)",
      backdropFilter: "blur(16px)",
      boxShadow: "0 0 18px rgba(56,189,248,0.025)",
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <div
        className="w-9 h-9 rounded-xl flex items-center justify-center border"
        style={{
          borderColor: "rgba(56,189,248,0.1)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <Icon size={16} className={color} />
      </div>
    </div>

    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        color: "rgba(148,163,184,0.52)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>

    <div
      className="mt-2 text-white text-lg sm:text-xl break-words"
      style={{
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: 700,
        letterSpacing: "0.04em",
      }}
    >
      {value}
    </div>
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// Action Badge
// ─────────────────────────────────────────────────────────────────────────────
const getActionStyles = (action) => {
  switch (action) {
    case "Created":
      return {
        pill: "bg-emerald-500/10 text-emerald-300 border border-emerald-400/20",
        dot: "#34d399",
        icon: PlusCircle,
      };
    case "Updated":
      return {
        pill: "bg-sky-500/10 text-sky-300 border border-sky-400/20",
        dot: "#38bdf8",
        icon: RefreshCcw,
      };
    case "Deleted":
      return {
        pill: "bg-red-500/10 text-red-300 border border-red-400/20",
        dot: "#f87171",
        icon: Trash2,
      };
    default:
      return {
        pill: "bg-slate-500/10 text-slate-300 border border-slate-400/20",
        dot: "#94a3b8",
        icon: Activity,
      };
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────────────────────
const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [stats, setStats] = useState({
    created: 0,
    updated: 0,
    deleted: 0,
  });

  const getLocalDate = (date) => {
    return new Date(date).toISOString().split("T")[0];
  };
  useEffect(() => {
    fetchLogs();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, rowsPerPage, searchQuery, fromDate, toDate]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("loginToken");
      const API = import.meta.env.VITE_API_URL;
      const params = {
        page: currentPage,
        limit: rowsPerPage,
      };
      if (searchQuery) params.q = searchQuery;
      if (fromDate) params.fromDate = fromDate;
      if (toDate) params.toDate = toDate;

      const res = await axios.get(`${API}/monitoredsite/logs`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setLogs(res.data.data || []);
      setTotalCount(res.data.totalCount || 0);
      setTotalPages(res.data.totalPages || 1);
      setStats(res.data.stats || { created: 0, updated: 0, deleted: 0 });
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const indexOfFirstRow = (currentPage - 1) * rowsPerPage;
  const currentLogs = logs;

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

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {/* ───────────────── Header ───────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-[1px] w-8 bg-sky-400/20" />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "0.28em",
                    color: "rgba(56,189,248,0.42)",
                    textTransform: "uppercase",
                  }}
                >
                  Audit Timeline
                </span>
                <div className="h-[1px] w-16 sm:w-24 bg-sky-400/10" />
              </div>

              <h1
                className="text-2xl sm:text-3xl lg:text-4xl mb-2"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textShadow: "0 0 24px rgba(56,189,248,0.08)",
                }}
              >
                WEBSITE LOGS
              </h1>

              <p
                className="max-w-2xl"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "rgba(148,163,184,0.52)",
                  letterSpacing: "0.03em",
                }}
              >
                Review creation, updates, deletions, and monitored website activity
                across your infrastructure.
              </p>
            </div>

            <StatusDot color="#34d399" label={loading ? "Fetching Logs" : "Logs Synced"} />
          </motion.div>

          {/* ───────────────── Top Status Bar ───────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="mb-6 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            style={{
              background: "rgba(3,7,18,0.64)",
              border: "1px solid rgba(56,189,248,0.08)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 0 18px rgba(56,189,248,0.02)",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  fontSize: "13px",
                  letterSpacing: "0.06em",
                  color: "white",
                }}
              >
                SYSTEM ACTIVITY PANEL
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "rgba(148,163,184,0.48)",
                  marginTop: "4px",
                }}
              >
                Search, inspect and filter website audit events.
              </div>
            </div>

            <div className="text-sm text-slate-300">
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "rgba(148,163,184,0.65)",
                }}
              >
                Total Records:{" "}
              </span>
              <span
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  color: "white",
                }}
              >
                {totalCount}
              </span>
            </div>
          </motion.div>

          {/* ───────────────── Stats ───────────────── */}
          <div className="grid grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard icon={FileClock} label="Total Logs" value={totalCount} />
            <StatCard icon={PlusCircle} label="Created" value={stats.created} color="text-emerald-400" />
            <StatCard icon={RefreshCcw} label="Updated" value={stats.updated} color="text-sky-400" />
            <StatCard icon={Trash2} label="Deleted" value={stats.deleted} color="text-red-400" />
          </div>

          {/* ───────────────── Filters ───────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.45 }}
            className="mb-6 rounded-2xl p-4"
            style={{
              background: "rgba(3,7,18,0.64)",
              border: "1px solid rgba(56,189,248,0.08)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 0 18px rgba(56,189,248,0.02)",
            }}
          >
            <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_220px_220px_auto] gap-3">
              {/* Search */}
              <GlassInput icon={Search}>
                <input
                  type="text"
                  placeholder="Search domain, URL, action, user..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-white placeholder:text-slate-500"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                  }}
                />
              </GlassInput>

              {/* From */}
              <GlassInput icon={CalendarDays}>
                <input
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-white"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    colorScheme: "dark",
                  }}
                />
              </GlassInput>

              {/* To */}
              <GlassInput icon={CalendarDays}>
                <input
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="w-full bg-transparent outline-none text-sm text-white"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    colorScheme: "dark",
                  }}
                />
              </GlassInput>

              {/* Clear */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setFromDate("");
                  setToDate("");
                  setSearchQuery("");
                }}
                className="rounded-xl px-4 py-2.5 flex items-center justify-center gap-2 text-sm"
                style={{
                  background: "rgba(239,68,68,0.08)",
                  border: "1px solid rgba(239,68,68,0.18)",
                  color: "#fca5a5",
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <FilterX size={14} />
                Clear
              </motion.button>
            </div>
          </motion.div>

          {/* ───────────────── Logs Panel ───────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15, duration: 0.45 }}
            className="rounded-2xl overflow-hidden"
            style={{
              background: "rgba(3,7,18,0.72)",
              border: "1px solid rgba(56,189,248,0.09)",
              backdropFilter: "blur(18px)",
              boxShadow:
                "0 0 22px rgba(56,189,248,0.03), inset 0 1px 0 rgba(56,189,248,0.035)",
            }}
          >
            {/* top glow line */}
            <div
              className="h-[1px] w-full"
              style={{
                background:
                  "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.32) 30%, rgba(129,140,248,0.28) 70%, transparent 100%)",
              }}
            />

            {loading ? (
              <div className="p-10 sm:p-14 text-center">
                <div className="flex justify-center mb-4">
                  <motion.div
                    className="w-12 h-12 rounded-full border-2 border-sky-400/20 border-t-sky-400"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                </div>

                <h3
                  className="text-white text-lg mb-2"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    letterSpacing: "0.04em",
                    fontWeight: 700,
                  }}
                >
                  LOADING ACTIVITY LOGS
                </h3>

                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: "rgba(148,163,184,0.5)",
                  }}
                >
                  Fetching monitored website audit timeline...
                </p>
              </div>
            ) : totalCount === 0 ? (
              <div className="p-10 sm:p-14 text-center">
                <div
                  className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center border"
                  style={{
                    borderColor: "rgba(56,189,248,0.1)",
                    background: "rgba(255,255,255,0.02)",
                  }}
                >
                  <Globe2 size={22} className="text-sky-400" />
                </div>

                <h3
                  className="text-white text-lg mb-2"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    letterSpacing: "0.04em",
                    fontWeight: 700,
                  }}
                >
                  NO LOGS FOUND
                </h3>

                <p
                  className="max-w-xl mx-auto"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: "rgba(148,163,184,0.5)",
                  }}
                >
                  No audit records match the selected search or date filters.
                </p>
              </div>
            ) : (
              <>
                {/* ───────────────── Mobile Cards ───────────────── */}
                <div className="md:hidden p-3 space-y-4">
                  {currentLogs.map((log, index) => {
                    const actionMeta = getActionStyles(log.action);
                    const ActionIcon = actionMeta.icon;

                    return (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, y: 14 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03, duration: 0.35 }}
                        whileHover={{ y: -2 }}
                        className="relative overflow-hidden rounded-2xl p-4"
                        style={{
                          background: "rgba(255,255,255,0.018)",
                          border: "1px solid rgba(255,255,255,0.05)",
                        }}
                      >
                        <div
                          className="absolute top-0 left-0 right-0 h-[1px]"
                          style={{
                            background:
                              "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.22) 30%, rgba(129,140,248,0.18) 70%, transparent 100%)",
                          }}
                        />

                        <div className="flex items-center justify-between mb-4">
                          <span
                            className="text-[10px] text-slate-500"
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            LOG #{indexOfFirstRow + index + 1}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-medium tracking-wide ${actionMeta.pill}`}
                            style={{ fontFamily: "'JetBrains Mono', monospace" }}
                          >
                            <ActionIcon size={11} />
                            {log.action}
                          </span>
                        </div>

                        <div className="mb-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Server size={13} className="text-sky-400" />
                            <p
                              className="text-white text-sm break-all"
                              style={{
                                fontFamily: "'Orbitron', sans-serif",
                                fontWeight: 700,
                                letterSpacing: "0.03em",
                              }}
                            >
                              {log.domain || "Unknown Domain"}
                            </p>
                          </div>

                          <div className="flex items-start gap-2">
                            <Link2 size={12} className="text-slate-400 mt-0.5 shrink-0" />
                            <a
                              href={log.url}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs break-all text-sky-300 hover:underline"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {log.url}
                            </a>
                          </div>
                        </div>

                        <div className="h-px bg-white/5 my-3" />

                        <div className="grid grid-cols-2 gap-3 text-[11px]">
                          <div>
                            <p
                              className="text-slate-500 mb-1"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              ACTION BY
                            </p>
                            <p
                              className="text-slate-200 truncate"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {log.user || "Unknown"}
                            </p>
                          </div>

                          <div className="text-right">
                            <p
                              className="text-slate-500 mb-1"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              TIMESTAMP
                            </p>
                            <p
                              className="text-slate-200"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {log.timestamp
                                ? new Date(log.timestamp).toLocaleDateString()
                                : "—"}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>

                {/* ───────────────── Desktop Table ───────────────── */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead
                      className="sticky top-0 z-10"
                      style={{
                        background: "rgba(15,23,42,0.92)",
                        backdropFilter: "blur(12px)",
                      }}
                    >
                      <tr
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "11px",
                          letterSpacing: "0.08em",
                          color: "rgba(148,163,184,0.7)",
                          textTransform: "uppercase",
                        }}
                      >
                        <th className="px-5 py-4 text-left">S No.</th>
                        <th className="px-5 py-4 text-left">Domain</th>
                        <th className="px-5 py-4 text-left">URL</th>
                        <th className="px-5 py-4 text-left">Action</th>
                        <th className="px-5 py-4 text-left">Action By</th>
                        <th className="px-5 py-4 text-left">Timestamp</th>
                      </tr>
                    </thead>

                    <tbody>
                      {currentLogs.map((log, index) => {
                        const actionMeta = getActionStyles(log.action);
                        const ActionIcon = actionMeta.icon;

                        return (
                          <tr
                            key={index}
                            className="border-t border-white/5 hover:bg-white/[0.025] transition"
                          >
                            <td
                              className="px-5 py-4 text-slate-400"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {indexOfFirstRow + index + 1}
                            </td>

                            <td className="px-5 py-4">
                              <div className="flex items-center gap-2">
                                <Server size={14} className="text-sky-400 shrink-0" />
                                <span
                                  className="text-white break-all"
                                  style={{
                                    fontFamily: "'Orbitron', sans-serif",
                                    fontWeight: 700,
                                    letterSpacing: "0.02em",
                                    fontSize: "14px",
                                  }}
                                >
                                  {log.domain}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-4 max-w-[260px]">
                              <a
                                href={log.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-sky-300 hover:underline break-all block"
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                {log.url}
                              </a>
                            </td>

                            <td className="px-5 py-4">
                              <span
                                className={`inline-flex items-center gap-2 px-2.5 py-1 rounded-full text-xs ${actionMeta.pill}`}
                                style={{ fontFamily: "'JetBrains Mono', monospace" }}
                              >
                                <ActionIcon size={12} />
                                {log.action}
                              </span>
                            </td>

                            <td
                              className="px-5 py-4 text-slate-300"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {log.user || "Unknown"}
                            </td>

                            <td
                              className="px-5 py-4 text-slate-400"
                              style={{ fontFamily: "'JetBrains Mono', monospace" }}
                            >
                              {log.timestamp
                                ? new Date(log.timestamp).toLocaleString()
                                : "—"}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* ───────────────── Pagination ───────────────── */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 border-t border-white/5">
                  <div className="flex items-center gap-3">
                    <span
                      className="text-slate-500 text-sm"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      Rows
                    </span>

                    <select
                      value={rowsPerPage}
                      onChange={(e) => {
                        setRowsPerPage(Number(e.target.value));
                        setCurrentPage(1);
                      }}
                      className="rounded-xl px-3 py-2 text-sm bg-transparent text-white outline-none"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(56,189,248,0.08)",
                        backdropFilter: "blur(14px)",
                      }}
                    >
                      <option className="bg-slate-900" value={10}>10</option>
                      <option className="bg-slate-900" value={20}>20</option>
                      <option className="bg-slate-900" value={50}>50</option>
                      <option className="bg-slate-900" value={100}>100</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((prev) => prev - 1)}
                      className="px-3 py-2 rounded-xl disabled:opacity-40"
                      style={{
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(56,189,248,0.08)",
                      }}
                    >
                      <ChevronLeft size={16} className="text-slate-200" />
                    </motion.button>

                    <span
                      className="px-3 text-sm text-slate-300"
                      style={{ fontFamily: "'JetBrains Mono', monospace" }}
                    >
                      {currentPage} / {totalPages}
                    </span>

                    <motion.button
                      whileTap={{ scale: 0.98 }}
                      disabled={currentPage === totalPages}
                      onClick={() => setCurrentPage((prev) => prev + 1)}
                      className="px-3 py-2 rounded-xl disabled:opacity-40"
                      style={{
                        background: "rgba(255,255,255,0.025)",
                        border: "1px solid rgba(56,189,248,0.08)",
                      }}
                    >
                      <ChevronRight size={16} className="text-slate-200" />
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