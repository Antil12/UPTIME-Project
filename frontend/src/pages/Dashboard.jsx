import React, { useState, useEffect, useRef } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import axios from "../api/setupAxios";
import UrlTable from "../components/UrlTable";
import CrystalPopup from "../components/CrystalPopup";
import UptimePopup from "../components/UptimePopup";
import {
  Globe2,
  TrendingUp,
  TrendingDown,
  Activity,
  Search,
  Trash2,
  CheckSquare,
  Square,
  X,
  Wifi,
  ShieldCheck,
  Settings2,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

// ─── Font Loader ──────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    if (document.getElementById("uptime-fonts")) return;
    const link = document.createElement("link");
    link.id = "uptime-fonts";
    link.href =
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@300;400;700&display=swap%22";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
};

// ─── Cursor Glow ──────────────────────────────────────────────────────────────
const CursorGlow = () => {
   const { currentTheme } = useTheme();
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
      className="pointer-events-none fixed z-0"
      style={{
        left: sx, top: sy,
        translateX: "-50%", translateY: "-50%",
        width: 300, height: 300, borderRadius: "50%",
        background: `radial-gradient(circle, ${currentTheme.accent}15 0%, transparent 70%)`,
      }}
    />
  );
};

// ─── Full Page Background ─────────────────────────────────────────────────────
const Background = ({ currentTheme }) => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0" style={{ background: currentTheme.bg }} />
    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 70% 45% at 50% 0%, ${currentTheme.accent}15 0%, transparent 100%)` }} />
    <div className="absolute" style={{ top: "60%", left: "10%", width: 340, height: 340, background: `radial-gradient(circle, ${currentTheme.accent}12 0%, transparent 68%)`, filter: "blur(90px)" }} />
    <div className="absolute" style={{ top: "15%", right: "8%", width: 260, height: 260, background: `radial-gradient(circle, ${currentTheme.success}12 0%, transparent 68%)`, filter: "blur(85px)" }} />
    <div className="absolute" style={{ bottom: "5%", right: "20%", width: 240, height: 240, background: `radial-gradient(circle, ${currentTheme.accent}10 0%, transparent 68%)`, filter: "blur(75px)" }} />
    <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${currentTheme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.gridColor} 1px, transparent 1px)`, backgroundSize: "42px 42px" }} />
    <motion.div
      className="absolute inset-0"
      style={{ background: `linear-gradient(to bottom, transparent 48%, ${currentTheme.accent}08 50%, transparent 52%)` }}
      animate={{ y: ["-100%", "100%"] }}
      transition={{ duration: 7, repeat: Infinity, ease: "linear", repeatDelay: 3 }}
    />
  </div>
);

// ─── HUD Corner Brackets ─────────────────────────────────────────────────────
const HUDCorner = ({ pos, delay = 0, currentTheme }) => {
  const cls = { tl: "top-4 left-4", tr: "top-4 right-4", bl: "bottom-4 left-4", br: "bottom-4 right-4" };
  const rot = { tl: "0deg", tr: "90deg", bl: "-90deg", br: "180deg" };
  return (
    <motion.div
      className={`fixed ${cls[pos]} w-6 h-6 z-20 pointer-events-none`}
      style={{ transform: `rotate(${rot[pos]})` }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 0.85, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div className="absolute top-0 left-0 h-[1.5px]" style={{ background: currentTheme.accent }} initial={{ width: 0 }} animate={{ width: "100%" }} transition={{ delay: delay + 0.15, duration: 0.35 }} />
      <motion.div className="absolute top-0 left-0 w-[1.5px]" style={{ background: currentTheme.accent }} initial={{ height: 0 }} animate={{ height: "100%" }} transition={{ delay: delay + 0.15, duration: 0.35 }} />
    </motion.div>
  );
};

// ─── Orbit Ring ───────────────────────────────────────────────────────────────
const OrbitRing = ({ radius, duration, dotCount, color, delay = 0, tilt = 70 }) => (
  <motion.div
    className="fixed pointer-events-none z-[1]"
    style={{ width: radius * 2, height: radius * 2, top: "50%", left: "50%", marginTop: -radius, marginLeft: -radius, transform: `perspective(900px) rotateX(${tilt}deg)`, opacity: 0.28 }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <div className="absolute inset-0 rounded-full" style={{ border: `1px solid ${color}12` }} />
    {Array.from({ length: dotCount }, (_, i) => {
      const angle = (i / dotCount) * 2 * Math.PI;
      const cx = Math.cos(angle) * radius + radius;
      const cy = Math.sin(angle) * radius + radius;
      return (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{ width: i === 0 ? 4 : 2, height: i === 0 ? 4 : 2, background: i === 0 ? color : `${color}35`, left: cx - (i === 0 ? 2 : 1), top: cy - (i === 0 ? 2 : 1), boxShadow: i === 0 ? `0 0 8px ${color}` : "none" }}
          animate={i === 0 ? { opacity: [1, 0.3, 1] } : {}}
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
      <motion.div className="absolute inset-0 rounded-full" style={{ background: color }} animate={{ scale: [1, 2.1], opacity: [0.5, 0] }} transition={{ duration: 1.5, repeat: Infinity }} />
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
    </div>
    {label && (
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "0.15em", color, opacity: 0.85, textTransform: "uppercase", fontWeight: 600 }}>
        {label}
      </span>
    )}
  </div>
);

// ─── HUD Stat Card ────────────────────────────────────────────────────────────
const HudStatCard = ({ icon: Icon, label, value, accentColor = "#38bdf8", onClick, index = 0, sublabel, disabled = false, currentTheme }) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
    whileHover={disabled ? {} : { y: -3, scale: 1.01 }}
    onClick={disabled ? undefined : onClick}
    className={`relative rounded-2xl p-4 overflow-hidden group ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
    style={{ background: currentTheme.bgCard, border: `1px solid ${accentColor}25`, backdropFilter: "blur(18px)", boxShadow: `0 0 22px ${accentColor}08, inset 0 1px 0 ${accentColor}10` }}
  >
    <div className="absolute top-0 left-0 right-0 h-[1px]" style={{ background: `linear-gradient(90deg, transparent 0%, ${accentColor}45 35%, ${accentColor}22 70%, transparent 100%)` }} />
    <div className="absolute top-0 right-0 w-7 h-7 overflow-hidden">
      <div className="absolute top-0 right-0 w-[1px] h-4" style={{ background: `${accentColor}28` }} />
      <div className="absolute top-0 right-0 h-[1px] w-4" style={{ background: `${accentColor}28` }} />
    </div>
    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" style={{ background: `radial-gradient(circle at top right, ${accentColor}06, transparent 55%)` }} />
    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div className="w-9 h-9 rounded-xl flex items-center justify-center border" style={{ borderColor: `${accentColor}30`, background: `${accentColor}10` }}>
          <Icon size={15} style={{ color: accentColor }} />
        </div>
        <StatusDot color={accentColor} />
      </div>
      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: currentTheme.textSecondary, letterSpacing: "0.13em", textTransform: "uppercase", fontWeight: 600 }}>{label}</div>
      <div className="mt-2" style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "23px", letterSpacing: "0.03em", color: currentTheme.text, textShadow: `0 0 16px ${accentColor}18` }}>{value}</div>
      {sublabel && <div className="mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: accentColor, opacity: 0.8, letterSpacing: "0.08em", fontWeight: 600 }}>{sublabel}</div>}
    </div>
  </motion.div>
);

// ─── Ticker / Live Feed Bar ───────────────────────────────────────────────────
const LiveTicker = ({ urls, currentTheme }) => {
  const downSites = urls.filter((u) => u.status === "DOWN");
  const slowSites = urls.filter((u) => u.status === "SLOW");
  const items = [
    ...downSites.map((s) => ({ label: s.domain, type: "DOWN", color: currentTheme.error })),
    ...slowSites.map((s) => ({ label: s.domain, type: "SLOW", color: currentTheme.warning })),
    { label: `${urls.filter((u) => u.status === "UP").length} sites nominal`, type: "OK", color: currentTheme.success },
  ];
  return (
    <div className="relative overflow-hidden rounded-xl py-2 px-4" style={{ background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(10px)" }}>
      <div className="flex items-center gap-3 overflow-hidden">
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "0.18em", color: currentTheme.accent, textTransform: "uppercase", whiteSpace: "nowrap", fontWeight: 700 }}>LIVE ●</span>
        <div className="flex gap-6 overflow-hidden" style={{ maskImage: "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)" }}>
          <motion.div className="flex gap-6 whitespace-nowrap" animate={{ x: ["0%", "-50%"] }} transition={{ duration: 20, repeat: Infinity, ease: "linear" }}>
            {[...items, ...items].map((item, i) => (
              <span key={i} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: item.color, letterSpacing: "0.08em", fontWeight: 600 }}>
                <span style={{ opacity: 0.6 }}>◆</span> {item.label} <span style={{ opacity: 0.55 }}>[{item.type}]</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = ({
  urls,
  search,
  setSearch,
  filteredUrls,
  upSites,
  downSites,
  onPin,
  onDelete,
  onEdit,
  onBulkDelete,
  popupData,
  setPopupData,
  selectedStatus,
  setSelectedStatus,
  page,
  setPage,
  totalPages,
  totalCount,
}) => {
  const { currentTheme } = useTheme();
  const uptimePercent =
    urls.length === 0 ? "0%" : `${Math.round((upSites.length / urls.length) * 100)}%`;

  const [popupOpen, setPopupOpen] = useState(false);
  const [filter, setFilter] = useState("24h");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const isViewer = currentUser?.role === "VIEWER";

  const [selectedCategories, setSelectedCategories] = useState(["ALL"]);
  const [categories, setCategories] = useState(["ALL"]);
  const [uptimeData, setUptimeData] = useState(null);
  const [selectedSslStatus, setSelectedSslStatus] = useState("ALL");

  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const columnBtnRef = useRef(null);
  const urlTableRef = useRef(null);

  useEffect(() => {
    if (!popupOpen) return;
    const fetchUptimeAnalytics = async () => {
      try {
        const res = await axios.get(`/uptime-logs/analytics?range=${filter}`);
        if (res.data.success) setUptimeData(res.data.data);
      } catch (error) {
        console.error("Failed to fetch uptime analytics", error);
      }
    };
    fetchUptimeAnalytics();
  }, [filter, popupOpen]);

  useEffect(() => {
    const uniqueCategories = [
      "ALL",
      ...Array.from(new Set(urls.map((u) => u.category || "UNCATEGORIZED"))),
    ];
    setCategories(uniqueCategories);
  }, [urls]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) setCurrentUser(user);
  }, []);

  useEffect(() => {
    if (urlTableRef.current) {
      const handle = urlTableRef.current;
      if (handle.getColumnBtnRef) {
        const internalRef = handle.getColumnBtnRef();
        internalRef.current = columnBtnRef.current;
      }
    }
  }, [showColumnMenu]);

  const filtersActive =
    !selectedCategories.includes("ALL") ||
    selectedStatus !== "ALL" ||
    selectedSslStatus !== "ALL";

  let tableRows;
  if (filtersActive) {
    tableRows = urls.filter((u) => {
      const categoryMatch =
        selectedCategories.includes("ALL") ||
        selectedCategories.includes(u.category || "Others");
      const statusMatch = selectedStatus === "ALL" || u.status === selectedStatus;
      const sslMatch = selectedSslStatus === "ALL" || u.sslStatus === selectedSslStatus;
      return categoryMatch && statusMatch && sslMatch;
    });
    tableRows = [...tableRows].sort((a, b) => (b.pinned === true) - (a.pinned === true));
  } else {
    tableRows = filteredUrls;
  }

  const globalUpSites = urls.filter((u) => u.status === "UP" || u.status === "SLOW");
  const globalDownSites = urls.filter((u) => u.status === "DOWN");
  const sslIssues = urls.filter((u) => u.sslStatus === "EXPIRING" || u.sslStatus === "ERROR");

  const handleColumnBtnClick = () => {
    if (urlTableRef.current) {
      urlTableRef.current.toggleColumnMenu();
      setShowColumnMenu((v) => !v);
    }
  };

  return (
    <>
      <FontLoader />
      <Background currentTheme={currentTheme} />
      <CursorGlow />

      <OrbitRing radius={220} duration={22} dotCount={8} color={currentTheme.accent} tilt={72} />
      <OrbitRing radius={290} duration={34} dotCount={12} color={currentTheme.accentSecondary} tilt={66} delay={1.2} />
      <OrbitRing radius={155} duration={15} dotCount={5} color={currentTheme.success} tilt={74} delay={0.5} />

      {["tl", "tr", "bl", "br"].map((p, i) => (
        <HUDCorner key={p} pos={p} delay={0.1 + i * 0.06} currentTheme={currentTheme} />
      ))}

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-5 max-w-[1500px] mx-auto space-y-4">

        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="h-[1px] w-7" style={{ background: currentTheme.accent }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "0.28em", color: currentTheme.accent, textTransform: "uppercase", fontWeight: 700 }}>
                Uptime Command Center
              </span>
              <div className="h-[1px] w-20" style={{ background: currentTheme.borderAccent }} />
            </div>
            <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: "clamp(22px, 4vw, 30px)", letterSpacing: "0.05em", color: currentTheme.text, textShadow: `0 0 28px ${currentTheme.accent}15` }}>
              DASHBOARD
            </h1>
            <div className="mt-2" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textSecondary, letterSpacing: "0.05em" }}>
              {new Date().toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {downSites.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{ background: currentTheme.errorBg, border: `1px solid ${currentTheme.error}` }}
              >
                <motion.div className="w-1.5 h-1.5 rounded-full" style={{ background: currentTheme.error }} animate={{ opacity: [1, 0.3, 1] }} transition={{ duration: 0.8, repeat: Infinity }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: currentTheme.error, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>
                  {downSites.length} Down
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ─── Live Ticker ─── */}
        {urls.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15, duration: 0.45 }}>
            <LiveTicker urls={urls} currentTheme={currentTheme} />
          </motion.div>
        )}

        {/* ─── Stat Cards ─── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <HudStatCard
            index={0} icon={Globe2} label="Total Websites"
            value={urls.length} accentColor={currentTheme.accent}
            sublabel={filtersActive ? `${tableRows.length} match filters` : `${totalCount} total configured`}
            onClick={() => setPopupData({ title: "Total Websites", sites: urls })}
            currentTheme={currentTheme}
          />
          <HudStatCard
            index={1} icon={TrendingUp} label="Sites Online"
            value={globalUpSites.length} accentColor={currentTheme.success}
            sublabel="UP + SLOW"
            onClick={() => setPopupData({ title: "UP Websites", sites: globalUpSites })}
            currentTheme={currentTheme}
          />
          <HudStatCard
            index={2} icon={TrendingDown} label="Sites Down"
            value={globalDownSites.length} accentColor={currentTheme.error}
            sublabel={globalDownSites.length > 0 ? "Needs attention" : "All clear"}
            onClick={() => setPopupData({ title: "DOWN Websites", sites: globalDownSites })}
            currentTheme={currentTheme}
          />
          <HudStatCard
            index={3} icon={Activity} label="Uptime %"
            value={uptimePercent} accentColor={currentTheme.accentSecondary}
            sublabel="Current Percentage"
            onClick={() => {
              if (currentUser?.role?.toUpperCase() === "SUPERADMIN") {
                setPopupOpen(true);
              } else {
                alert("Only Super Admin can access analytics");
              }
            }}
            disabled={currentUser?.role?.toUpperCase() !== "SUPERADMIN"}
            currentTheme={currentTheme}
          />
        </section>

        {/* ─── Secondary Stat Row ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="w-full"
        >
          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            {[
              {
                label: "SSL Issues",
                value: sslIssues.length,
                color: sslIssues.length > 0 ? currentTheme.warning : currentTheme.success,
                icon: ShieldCheck,
                sub:
                  sslIssues.length > 0
                    ? `${sslIssues.length} certs expiring/erroring`
                    : "All certs healthy",
              },
              {
                label: "Categories",
                value: categories.length - 1,
                color: currentTheme.accent,
                icon: Globe2,
                sub: "Monitored groups",
              },
              {
                label: "Slow Sites",
                value: urls.filter((u) => u.status === "SLOW").length,
                color: currentTheme.warning,
                icon: Wifi,
                sub: "Latency detected",
              },
            ].map((stat) => (
              <motion.div
                key={stat.label}
                whileHover={{ y: -2 }}
                className="
                  flex items-center gap-2 sm:gap-3
                  px-2 py-2 sm:px-4 sm:py-3
                  rounded-xl sm:rounded-2xl
                "
                style={{
                  background: currentTheme.bgCard,
                  border: `1px solid ${stat.color}25`,
                  backdropFilter: "blur(15px)",
                }}
              >
                {/* ICON */}
                <div
                  className="
                    w-6 h-6 sm:w-8 sm:h-8
                    rounded-lg sm:rounded-xl
                    flex items-center justify-center
                  "
                  style={{
                    background: `${stat.color}12`,
                    border: `1px solid ${stat.color}30`,
                  }}
                >
                  <stat.icon
                    size={12}
                    className="sm:hidden"
                    style={{ color: stat.color }}
                  />
                  <stat.icon
                    size={14}
                    className="hidden sm:block"
                    style={{ color: stat.color }}
                  />
                </div>

                {/* TEXT */}
                <div className="min-w-0">
                  <div
                    className="text-[7px] sm:text-[8px]"
                    style={{
                      fontFamily: "'JetBrains Mono'",
                      color: currentTheme.textSecondary,
                      fontWeight: 600,
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                    }}
                  >
                    {stat.label}
                  </div>

                  <div className="flex items-baseline gap-1 sm:gap-2 mt-0.5">
                    <span
                      className="text-[13px] sm:text-[18px]"
                      style={{
                        fontFamily: "'Orbitron'",
                        fontWeight: 700,
                        color: currentTheme.text,
                      }}
                    >
                      {stat.value}
                    </span>

                    {/* Hide sub text on mobile to save space */}
                    <span
                      className="hidden sm:block"
                      style={{
                        fontSize: "8px",
                        color: stat.color,
                        opacity: 0.85,
                        fontWeight: 600,
                      }}
                    >
                      {stat.sub}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* ─── Panel Status Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.45 }}
          className="rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{ background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(14px)", boxShadow: currentTheme.shadow }}
        >
          <div className="flex items-center gap-4">
            <div className="h-7 w-[2px] rounded-full" style={{ background: `linear-gradient(to bottom, ${currentTheme.accent}, transparent)` }} />
            <div>
              <div style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "10px", letterSpacing: "0.08em", color: currentTheme.text }}>SITE MONITORING PANEL</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textSecondary, marginTop: "3px" }}>
                {filtersActive
                  ? `${tableRows.length} site${tableRows.length !== 1 ? "s" : ""} match filters · ${urls.length} total`
                  : `${filteredUrls.length} site${filteredUrls.length !== 1 ? "s" : ""} in view · ${totalCount} total configured`}
              </div>
            </div>
          </div>
          <StatusDot color={currentTheme.accent} label="Live Feed" />
        </motion.div>

        {/* ─── Search + Controls ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          {/* Search */}
          <div className="relative w-full max-w-sm group">
            <Search size={13} className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: currentTheme.accent }} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search domain or URL..."
              aria-label="Search websites by domain or URL"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl outline-none transition-all duration-300"
              style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.border}`, color: currentTheme.text, fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "0.02em", backdropFilter: "blur(12px)" }}
              onFocus={(e) => { e.target.style.border = `1px solid ${currentTheme.accent}`; e.target.style.boxShadow = `0 0 0 3px ${currentTheme.accentGlow}, 0 0 18px ${currentTheme.shadowGlow}`; }}
              onBlur={(e) => { e.target.style.border = `1px solid ${currentTheme.border}`; e.target.style.boxShadow = "none"; }}
            />
          </div>

          {/* ─── Right controls ──────*/}
          <div className="flex items-center gap-3 justify-end">

            {/* Dynamic selection buttons — animate in/out without shifting siblings */}
            <div className="flex items-center gap-3 overflow-hidden">
              <AnimatePresence initial={false}>
                {selectionMode && !isViewer && (
                  <>
                    <motion.button
                      key="select-all"
                      initial={{ opacity: 0, width: 0, marginRight: 0 }}
                      animate={{ opacity: 1, width: "auto", marginRight: 0 }}
                      exit={{ opacity: 0, width: 0, marginRight: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        // Select ALL websites in dashboard, not just paginated ones
                        const allIds = urls.map((u) => u._id);
                        const allSelected = allIds.length > 0 && allIds.every((id) => selectedIds.includes(id));
                        setSelectedIds(allSelected ? [] : allIds);
                      }}
                      disabled={urls.length === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-colors duration-200 disabled:opacity-40"
                      style={{ overflow: "hidden", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderLight}`, color: currentTheme.text, fontWeight: 600 }}
                    >
                      {urls.length > 0 && urls.every((u) => selectedIds.includes(u._id)) ? (
                      <CheckSquare size={12} />
                    ) : (
                      <Square size={12} />
                    )}
                    {urls.length > 0 && urls.every((u) => selectedIds.includes(u._id)) ? "Deselect All" : "Select All"}
                    </motion.button>

                    <motion.button
                      key="bulk-delete"
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: "auto" }}
                      exit={{ opacity: 0, width: 0 }}
                      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                      whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                      onClick={async () => {
                        if (selectedIds.length === 0) return;
                        try {
                          if (typeof onBulkDelete === "function") {
                            await onBulkDelete(selectedIds);
                          } else if (typeof onDelete === "function") {
                            await Promise.all(selectedIds.map((id) => onDelete(id)));
                          }
                          setSelectedIds([]);
                        } catch (err) {
                          console.error("Bulk delete failed", err);
                        }
                      }}
                      disabled={selectedIds.length === 0}
                      aria-label={`Delete selected ${selectedIds.length} websites`}
                      className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-colors duration-200 disabled:opacity-40"
                      style={{ overflow: "hidden", whiteSpace: "nowrap", fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", background: currentTheme.errorBg, border: `1px solid ${currentTheme.error}`, color: currentTheme.error, fontWeight: 700 }}
                    >
                      <Trash2 size={12} />
                      Delete ({selectedIds.length})
                    </motion.button>
                  </>
                )}
              </AnimatePresence>
            </div>

            {/* Select / Cancel — always in place */}
            {!isViewer && (
              <motion.button
                whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }}
                onClick={() => { setSelectionMode((v) => !v); if (selectionMode) setSelectedIds([]); }}
                aria-pressed={selectionMode}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 flex-shrink-0"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", background: selectionMode ? currentTheme.accentGlow : currentTheme.bgInput, border: selectionMode ? `1px solid ${currentTheme.accent}` : `1px solid ${currentTheme.borderLight}`, color: selectionMode ? currentTheme.accent : currentTheme.text, fontWeight: 600 }}
              >
                {selectionMode ? <X size={12} /> : <CheckSquare size={12} />}
                {selectionMode ? "Cancel" : "Select"}
              </motion.button>
            )}

            {/* Columns — always rightmost, always in place, desktop only */}
            <motion.button
              ref={columnBtnRef}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleColumnBtnClick}
              className="hidden lg:flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 flex-shrink-0"
              style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                letterSpacing: "0.1em", textTransform: "uppercase",
                background: showColumnMenu ? currentTheme.accentGlow : currentTheme.bgInput,
                border: showColumnMenu ? `1px solid ${currentTheme.accent}` : `1px solid ${currentTheme.borderLight}`,
                color: showColumnMenu ? currentTheme.accent : currentTheme.text,
                fontWeight: 600,
              }}
            >
              <Settings2 size={13} />
              Columns
            </motion.button>

          </div>
        </motion.div>

        {/* ─── Table / Empty State ─── */}
        <motion.div initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.5 }}>
          {tableRows.length === 0 && !filtersActive && !search ? (
            <div className="rounded-2xl p-12 text-center" style={{ background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(16px)" }}>
              <div className="mx-auto mb-5 w-14 h-14 rounded-2xl flex items-center justify-center border" style={{ borderColor: currentTheme.borderAccent, background: currentTheme.bgInput }}>
                <Globe2 size={22} style={{ color: currentTheme.accent }} />
              </div>
              <h3 className="mb-2" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.05em", fontWeight: 700, fontSize: "14px", color: currentTheme.text }}>NO SITES FOUND</h3>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.textSecondary }}>Try adjusting your search or filters.</p>
            </div>
          ) : (
            <>
              <UrlTable
                ref={urlTableRef}
                urls={tableRows}
                allUrls={urls}
                currentUser={currentUser}
                selectionMode={selectionMode}
                selectedIds={selectedIds}
                setSelectedIds={setSelectedIds}
                selectedSslStatus={selectedSslStatus}
                setSelectedSslStatus={setSelectedSslStatus}
                onPin={onPin}
                onDelete={onDelete}
                onEdit={onEdit}
                categories={categories}
                selectedCategories={selectedCategories}
                setSelectedCategories={setSelectedCategories}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
              />
              {tableRows.length === 0 && (filtersActive || search) && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.3 }} className="rounded-2xl p-12 text-center mt-4" style={{ background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(16px)" }}>
                  <div className="mx-auto mb-5 w-14 h-14 rounded-2xl flex items-center justify-center border" style={{ borderColor: currentTheme.borderAccent, background: currentTheme.bgInput }}>
                    <Globe2 size={22} style={{ color: currentTheme.accent }} />
                  </div>
                  <h3 className="mb-2" style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.05em", fontWeight: 700, fontSize: "14px", color: currentTheme.text }}>NO RESULTS FOUND</h3>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.textSecondary }}>Try adjusting your search or filters.</p>
                </motion.div>
              )}
            </>
          )}
        </motion.div>

        {/* ─── Pagination ─── */}
        {!filtersActive && totalPages > 1 && (
          <div className="mt-4 flex items-center justify-center gap-3">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              className="px-3 py-1 rounded-md"
              style={{ background: currentTheme.bgInput, color: currentTheme.text, fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 600, border: `1px solid ${currentTheme.borderLight}` }}
            >
              Prev
            </button>
            <div style={{ color: currentTheme.textSecondary, fontSize: 13, fontFamily: "'JetBrains Mono', monospace", fontWeight: 500 }}>
              Page {page} of {totalPages} — {totalCount} sites
            </div>
            <button
              onClick={() => setPage(Math.min(totalPages, page + 1))}
              className="px-3 py-1 rounded-md"
              style={{ background: currentTheme.bgInput, color: currentTheme.text, fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 600, border: `1px solid ${currentTheme.borderLight}` }}
            >
              Next
            </button>
          </div>
        )}

        {/* ─── Popups ─── */}
        {popupData && <CrystalPopup popupData={popupData} onClose={() => setPopupData(null)} />}
        {popupOpen && currentUser?.role?.toUpperCase() === "SUPERADMIN" && <UptimePopup data={uptimeData} filter={filter} setFilter={setFilter} onClose={() => setPopupOpen(false)} userRole={currentUser?.role?.toLowerCase()} currentTheme={currentTheme} />}
      </main>
    </>
  );
};

export default Dashboard;