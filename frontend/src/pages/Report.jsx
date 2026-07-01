import React, { useEffect, useState, useMemo, useRef, useCallback } from "react";
import axios from "axios";
import { useLocation, useNavigate } from "react-router-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  Search,
  CalendarRange,
  Server,
  Link2,
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";

import SiteReport from "../components/SiteReport";
import ExportButtons from "../components/ExportButtons";
import { useTheme } from "../contexts/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL;
const SITE_PER_PAGE = 5;

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
        left: sx, top: sy, translateX: "-50%", translateY: "-50%",
        width: 260, height: 260, borderRadius: "50%",
        background: `radial-gradient(circle, ${currentTheme.accent}15 0%, transparent 72%)`,
      }}
    />
  );
};

// ─── Background ───────────────────────────────────────────────────────────────
const Background = ({ currentTheme }) => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0" style={{ background: currentTheme.bg }} />
    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(ellipse 60% 40% at 50% 20%, ${currentTheme.accent}18 0%, transparent 100%)`,
      }}
    />
    <div
      className="absolute"
      style={{
        top: "62%", left: "16%", width: 260, height: 260,
        background: `radial-gradient(circle, ${currentTheme.accentSecondary}12 0%, transparent 68%)`,
        filter: "blur(90px)",
      }}
    />
    <div
      className="absolute"
      style={{
        top: "18%", right: "12%", width: 220, height: 220,
        background: `radial-gradient(circle, ${currentTheme.success}10 0%, transparent 68%)`,
        filter: "blur(80px)",
      }}
    />
    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(${currentTheme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.gridColor} 1px, transparent 1px)`,
        backgroundSize: "42px 42px",
      }}
    />
    <motion.div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to bottom, transparent 48%, ${currentTheme.accent}08 50%, transparent 52%)`,
      }}
      animate={{ y: ["-100%", "100%"] }}
      transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 2.5 }}
    />
  </div>
);

// ─── HUD Corner ───────────────────────────────────────────────────────────────
const HUDCorner = ({ pos, delay = 0, currentTheme }) => {
  const cls = { tl: "top-4 left-4", tr: "top-4 right-4", bl: "bottom-4 left-4", br: "bottom-4 right-4" };
  const rot = { tl: "0deg", tr: "90deg", bl: "-90deg", br: "180deg" };
  return (
    <motion.div
      className={`fixed ${cls[pos]} w-6 h-6 z-20 pointer-events-none`}
      style={{ transform: `rotate(${rot[pos]})` }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 0.65, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div
        className="absolute top-0 left-0 h-[1px]"
        style={{ background: `${currentTheme.accent}70` }}
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }}
      />
      <motion.div
        className="absolute top-0 left-0 w-[1px]"
        style={{ background: `${currentTheme.accent}70` }}
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }}
      />
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
      opacity: 0.25,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <div className="absolute inset-0 rounded-full" style={{ border: `1px solid ${color}10` }} />
    {Array.from({ length: dotCount }, (_, i) => {
      const angle = (i / dotCount) * 2 * Math.PI;
      const cx = Math.cos(angle) * radius + radius;
      const cy = Math.sin(angle) * radius + radius;
      return (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: i === 0 ? 4 : 2, height: i === 0 ? 4 : 2,
            background: i === 0 ? color : `${color}30`,
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
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: color }}
        animate={{ scale: [1, 2], opacity: [0.45, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
    </div>
    {label && (
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: "8px",
        letterSpacing: "0.14em", color: `${color}88`, textTransform: "uppercase",
      }}>
        {label}
      </span>
    )}
  </div>
);

// ─── Skeleton Loader Card ─────────────────────────────────────────────────────
const SkeletonCard = ({ index = 0, currentTheme }) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: index * 0.06 }}
    className="rounded-xl overflow-hidden relative"
    style={{
      background: currentTheme.bgCard,
      border: `1px solid ${currentTheme.borderAccent}`,
      backdropFilter: "blur(16px)",
    }}
  >
    <div
      className="absolute top-0 left-0 right-0 h-[1px]"
      style={{ background: `${currentTheme.accent}30` }}
    />
    <div className="p-4 sm:p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div
            className="h-4 w-24 rounded-full animate-pulse"
            style={{ background: `${currentTheme.accent}10`, animationDelay: `${index * 80}ms` }}
          />
          <div
            className="h-5 w-48 rounded animate-pulse"
            style={{ background: `${currentTheme.accent}08`, animationDelay: `${index * 80 + 60}ms` }}
          />
          <div
            className="h-3 w-64 rounded animate-pulse"
            style={{ background: `${currentTheme.accent}06`, animationDelay: `${index * 80 + 120}ms` }}
          />
        </div>
        <div
          className="h-7 w-16 rounded-full animate-pulse"
          style={{ background: `${currentTheme.accent}08` }}
        />
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[...Array(4)].map((_, i) => (
          <div
            key={i}
            className="h-16 rounded-lg animate-pulse"
            style={{ background: `${currentTheme.accent}06`, animationDelay: `${i * 60}ms` }}
          />
        ))}
      </div>
      <div
        className="h-40 rounded-xl animate-pulse"
        style={{ background: `${currentTheme.accent}04` }}
      />
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Report({ urls, reportSearch, setReportSearch }) {
  const { currentTheme } = useTheme();

  const [page, setPage] = useState(1);
  const [logsBySite, setLogsBySite] = useState({});
  const [statsMap, setStatsMap] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [range, setRange] = useState("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [tempFrom, setTempFrom] = useState("");
  const [tempTo, setTempTo] = useState("");

  const location = useLocation();
  const navigate = useNavigate();
  const preSelectedSiteId = location.state?.selectedSiteId ?? null;

  const [highlightedSiteId, setHighlightedSiteId] = useState(null);
  const cardRefs = useRef({});
  const abortRef = useRef(null);

  // ─── 1. Filtered sites ────────────────────────────────────────────────────
  const filteredSites = useMemo(
    () =>
      urls.filter(
        (u) =>
          (u.domain || "").toLowerCase().includes(reportSearch.toLowerCase()) ||
          (u.url || "").toLowerCase().includes(reportSearch.toLowerCase())
      ),
    [urls, reportSearch]
  );

  // ─── 2. Total pages ───────────────────────────────────────────────────────
  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(filteredSites.length / SITE_PER_PAGE)),
    [filteredSites.length]
  );

  // ─── 3. Current page slice ────────────────────────────────────────────────
  const paginatedSites = useMemo(() => {
    const start = (page - 1) * SITE_PER_PAGE;
    return filteredSites.slice(start, start + SITE_PER_PAGE);
  }, [filteredSites, page]);

  // ─── 4. Stable key ────────────────────────────────────────────────────────
  const siteIdsKey = useMemo(
    () => paginatedSites.map((s) => s._id).join(","),
    [paginatedSites]
  );

  // ─── 5. Reset page to 1 when filter/range changes ─────────────────────────
  useEffect(() => { setPage(1); }, [reportSearch, range, customFrom, customTo]);

  // ─── 6. Clamp page if filteredSites shrinks ───────────────────────────────
  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [totalPages]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 7. Jump to pre-selected site's page + set highlight ─────────────────
  useEffect(() => {
    if (!preSelectedSiteId || filteredSites.length === 0) return;
    const siteIndex = filteredSites.findIndex((s) => s._id === preSelectedSiteId);
    if (siteIndex === -1) return;
    const targetPage = Math.floor(siteIndex / SITE_PER_PAGE) + 1;
    setPage(targetPage);
    setHighlightedSiteId(preSelectedSiteId);
    navigate(location.pathname, { replace: true, state: {} });
  }, [preSelectedSiteId, filteredSites]); // eslint-disable-line react-hooks/exhaustive-deps

  // ─── 8. Scroll to card + auto-clear highlight ─────────────────────────────
  useEffect(() => {
    if (!highlightedSiteId) return;
    const scrollTimer = setTimeout(() => {
      const el = cardRefs.current[highlightedSiteId];
      if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 120);
    const clearTimer = setTimeout(() => { setHighlightedSiteId(null); }, 2800);
    return () => { clearTimeout(scrollTimer); clearTimeout(clearTimer); };
  }, [highlightedSiteId, page]);

  // ─── 9. Fetch page data ───────────────────────────────────────────────────
  const fetchPageData = useCallback(async () => {
    if (!siteIdsKey) { setLogsBySite({}); setStatsMap({}); return; }

    if (range === "custom") {
      if (!customFrom || !customTo) {
        setError("Please select both dates for custom range");
        setLoading(false);
        return;
      }
      const fromDate = new Date(customFrom);
      const toDate = new Date(customTo);
      if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
        setError("Invalid date format");
        setLoading(false);
        return;
      }
      if (fromDate > toDate) {
        setError("'From' date cannot be after 'To' date");
        setLoading(false);
        return;
      }
    }

    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    setLogsBySite({});
    setStatsMap({});
    setError(null);
    setLoading(true);

    try {
      const token = localStorage.getItem("loginToken");
      if (!token) { setLoading(false); return; }

      const params = { range, siteIds: siteIdsKey };
      if (range === "custom" && customFrom && customTo) {
        params.from = customFrom;
        params.to = customTo;
      }

      const res = await axios.get(`${API_URL}/uptime-logs/report-data`, {
        params,
        headers: { Authorization: `Bearer ${token}` },
        signal: abortRef.current.signal,
      });

      if (res.data?.data) {
        setLogsBySite(res.data.data.logsBySite || {});
        setStatsMap(res.data.data.statsMap || {});
      } else {
        setError("No data received from server");
      }
    } catch (err) {
      if (axios.isCancel(err) || err?.code === "ERR_CANCELED") return;
      console.error("Report fetch error:", err);
      const errorMsg = err.response?.data?.message || err.message || "Failed to load report data. Please try again.";
      setError(errorMsg);
    } finally {
      setLoading(false);
    }
  }, [siteIdsKey, range, customFrom, customTo]);

  useEffect(() => {
    fetchPageData();
    return () => { if (abortRef.current) abortRef.current.abort(); };
  }, [fetchPageData]);

  // ─── Apply custom date range ──────────────────────────────────────────────
  const applyCustomRange = () => {
    if (!tempFrom || !tempTo) {
      setError("Please select both 'From' and 'To' dates");
      setTimeout(() => setError(null), 4000);
      return;
    }
    const fromDate = new Date(tempFrom);
    const toDate = new Date(tempTo);
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      setError("Invalid date format. Please use YYYY-MM-DD");
      setTimeout(() => setError(null), 4000);
      return;
    }
    if (fromDate > toDate) {
      setError("'From' date cannot be after 'To' date");
      setTimeout(() => setError(null), 4000);
      return;
    }
    const oneYear = 365 * 24 * 60 * 60 * 1000;
    if (toDate.getTime() - fromDate.getTime() > oneYear) {
      setError("Date range cannot exceed 1 year");
      setTimeout(() => setError(null), 4000);
      return;
    }
    setCustomFrom(tempFrom);
    setCustomTo(tempTo);
    setError(null);
  };

  const handleRangeChange = (val) => {
    setRange(val);
    if (val !== "custom") {
      setCustomFrom(""); setCustomTo("");
      setTempFrom(""); setTempTo("");
    }
  };

  const startItem = filteredSites.length === 0 ? 0 : (page - 1) * SITE_PER_PAGE + 1;
  const endItem = Math.min(page * SITE_PER_PAGE, filteredSites.length);

  // ─── Derived theme values ─────────────────────────────────────────────────
  const accentColor = currentTheme.accent;

  return (
    <>
      <FontLoader />
      <div
        className="relative min-h-screen w-full overflow-hidden px-3 sm:px-4 lg:px-6 py-4"
        style={{ background: "transparent", color: currentTheme.text }}
      >
        <Background currentTheme={currentTheme} />
        <CursorGlow currentTheme={currentTheme} />
        <OrbitRing radius={210} duration={20} dotCount={8} color={accentColor} tilt={72} />
        <OrbitRing radius={280} duration={30} dotCount={10} color={currentTheme.accentSecondary} tilt={68} delay={1} />
        {["tl", "tr", "bl", "br"].map((p, i) => (
          <HUDCorner key={p} pos={p} delay={0.1 + i * 0.05} currentTheme={currentTheme} />
        ))}

        <div className="relative z-10 w-full">

          {/* ── Header ─────────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}
            className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-[1px] w-6" style={{ background: `${accentColor}40` }} />
                <span style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "8px",
                  letterSpacing: "0.22em", color: `${accentColor}80`,
                  textTransform: "uppercase",
                }}>
                  Uptime Reports
                </span>
                <div className="h-[1px] w-14" style={{ background: `${accentColor}20` }} />
              </div>
              <h1
                className="text-xl sm:text-2xl lg:text-2xl mb-1"
                style={{
                  fontFamily: "'Orbitron', sans-serif", fontWeight: 800,
                  letterSpacing: "0.04em", color: currentTheme.text,
                  textShadow: `0 0 18px ${accentColor}15`,
                }}
              >
                REPORT ANALYTICS
              </h1>
              <p style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                color: currentTheme.textMuted, letterSpacing: "0.02em",
              }}>
                Monitoring reports, response metrics and failures for configured websites.
              </p>
            </div>
            <StatusDot color={currentTheme.success} label="Analytics Active" />
          </motion.div>

          {/* ── Controls ───────────────────────────────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.08, duration: 0.4 }}
            className="mb-4 rounded-xl p-3 sm:p-4 relative z-50 overflow-visible"
            style={{
              background: currentTheme.bgCard,
              border: `1px solid ${currentTheme.borderAccent}`,
              backdropFilter: "blur(14px)",
              boxShadow: currentTheme.shadow,
            }}
          >
            {/* ── Desktop layout (xl+) ── */}
            <div className="hidden xl:flex xl:items-start xl:justify-between gap-4 overflow-visible">
              <div className="flex flex-row gap-3">
                {/* Search */}
                <div className="relative w-72">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `${accentColor}80` }} />
                  <input
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Search domain or URL"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg outline-none text-sm"
                    style={{
                      background: currentTheme.bgInput,
                      border: `1px solid ${currentTheme.border}`,
                      color: currentTheme.text,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                </div>

                {/* Range pills */}
                <div className="flex items-center gap-2 flex-wrap">
                  {[
                    { key: "24h", label: "24H" },
                    { key: "7d",  label: "7D"  },
                    { key: "30d", label: "30D" },
                    { key: "custom", label: "CUSTOM" },
                  ].map((item) => {
                    const active = range === item.key;
                    return (
                      <motion.button
                        key={item.key}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => handleRangeChange(item.key)}
                        className="relative px-4 py-2 rounded-lg overflow-hidden"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "11px", letterSpacing: "0.08em",
                          textTransform: "uppercase",
                          color: active ? accentColor : currentTheme.textMuted,
                          border: active
                            ? `1px solid ${accentColor}50`
                            : `1px solid ${currentTheme.border}`,
                          background: active
                            ? `${accentColor}18`
                            : currentTheme.bgInput,
                        }}
                      >
                        {active && (
                          <motion.div
                            layoutId="rangeGlow-desktop"
                            className="absolute inset-0 rounded-lg"
                            style={{
                              background: `linear-gradient(90deg, ${accentColor}20, ${currentTheme.accentSecondary}20)`,
                              filter: "blur(8px)", zIndex: 0,
                            }}
                          />
                        )}
                        <span className="relative z-10 flex items-center gap-2">
                          <CalendarRange size={12} style={{ color: active ? accentColor : currentTheme.textMuted }} />
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* Export */}
              <div className="relative z-[9999] overflow-visible self-start">
                <div
                  className="rounded-lg px-3 py-2 overflow-visible"
                  style={{
                    background: currentTheme.bgInput,
                    border: `1px solid ${currentTheme.border}`,
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    className="mb-2"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                      letterSpacing: "0.12em", color: `${accentColor}80`,
                      textTransform: "uppercase",
                    }}
                  >
                    Export Data
                  </div>
                  <div className="relative z-[9999] overflow-visible">
                    <ExportButtons urls={filteredSites} range={range} customFrom={customFrom} customTo={customTo} />
                  </div>
                </div>
              </div>
            </div>

            {/* ── Mobile / tablet layout (<xl) ── */}
            <div className="flex xl:hidden flex-col gap-3 overflow-visible">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: `${accentColor}80` }} />
                  <input
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Search domain or URL"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg outline-none text-sm"
                    style={{
                      background: currentTheme.bgInput,
                      border: `1px solid ${currentTheme.border}`,
                      color: currentTheme.text,
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                </div>
                <div className="relative z-[9999] overflow-visible flex-shrink-0 self-start">
                  <div
                    className="rounded-lg px-3 py-2 overflow-visible"
                    style={{
                      background: currentTheme.bgInput,
                      border: `1px solid ${currentTheme.border}`,
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <div
                      className="mb-2"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                        letterSpacing: "0.12em", color: `${accentColor}80`,
                        textTransform: "uppercase",
                      }}
                    >
                      Export Data
                    </div>
                    <div className="relative z-[9999] overflow-visible">
                      <ExportButtons urls={filteredSites} range={range} customFrom={customFrom} customTo={customTo} />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                {[
                  { key: "24h", label: "24H" },
                  { key: "7d",  label: "7D"  },
                  { key: "30d", label: "30D" },
                  { key: "custom", label: "CUSTOM" },
                ].map((item) => {
                  const active = range === item.key;
                  return (
                    <motion.button
                      key={item.key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleRangeChange(item.key)}
                      className="relative px-4 py-2 rounded-lg overflow-hidden"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "11px", letterSpacing: "0.08em",
                        textTransform: "uppercase",
                        color: active ? accentColor : currentTheme.textMuted,
                        border: active
                          ? `1px solid ${accentColor}50`
                          : `1px solid ${currentTheme.border}`,
                        background: active ? `${accentColor}18` : currentTheme.bgInput,
                      }}
                    >
                      {active && (
                        <motion.div
                          layoutId="rangeGlow-mobile"
                          className="absolute inset-0 rounded-lg"
                          style={{
                            background: `linear-gradient(90deg, ${accentColor}20, ${currentTheme.accentSecondary}20)`,
                            filter: "blur(8px)", zIndex: 0,
                          }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <CalendarRange size={12} style={{ color: active ? accentColor : currentTheme.textMuted }} />
                        {item.label}
                      </span>
                    </motion.button>
                  );
                })}
              </div>
            </div>

            {/* Custom Range Picker */}
            {range === "custom" && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-3 rounded-lg px-3 py-3"
                style={{
                  background: currentTheme.bgInput,
                  border: `1px solid ${currentTheme.border}`,
                  backdropFilter: "blur(14px)",
                }}
              >
                <div className="flex flex-col sm:flex-row items-end gap-2.5">
                  {[
                    { label: "FROM", val: tempFrom, set: setTempFrom },
                    { label: "TO",   val: tempTo,   set: setTempTo   },
                  ].map((f) => (
                    <div key={f.label} className="flex flex-col flex-1 min-w-[120px]">
                      <label style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: "8px",
                        color: currentTheme.textDim, letterSpacing: "0.14em", marginBottom: "4px",
                      }}>
                        {f.label}
                      </label>
                      <input
                        type="date"
                        value={f.val}
                        onChange={(e) => f.set(e.target.value)}
                        className="w-full px-2.5 py-2 rounded-md outline-none text-[11px]"
                        style={{
                          background: currentTheme.bgCard,
                          border: `1px solid ${currentTheme.borderLight}`,
                          color: currentTheme.textSecondary,
                          fontFamily: "'JetBrains Mono', monospace",
                        }}
                      />
                    </div>
                  ))}

                  <motion.button
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.96 }}
                    onClick={applyCustomRange}
                    className="h-[34px] px-4 rounded-md flex items-center justify-center"
                    style={{
                      background: `linear-gradient(135deg, ${accentColor}25, ${currentTheme.accentSecondary}20)`,
                      border: `1px solid ${accentColor}35`,
                      color: accentColor,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px", letterSpacing: "0.12em", whiteSpace: "nowrap",
                    }}
                  >
                    APPLY
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* ── Page Info Bar ───────────────────────────────────────────────── */}
          {filteredSites.length > 0 && (
            <div className="mb-3 flex items-center justify-between flex-wrap gap-2">
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                color: currentTheme.textMuted, letterSpacing: "0.1em", textTransform: "uppercase",
              }}>
                Showing {startItem}–{endItem} of {filteredSites.length} sites
              </span>
              {loading && (
                <span className="flex items-center gap-1.5" style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                  color: `${accentColor}90`, letterSpacing: "0.1em", textTransform: "uppercase",
                }}>
                  <Loader2 size={11} className="animate-spin" /> Fetching page {page}…
                </span>
              )}
            </div>
          )}

          {/* ── Error Banner ─────────────────────────────────────────────────── */}
          {error && !loading && (
            <motion.div
              initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}
              className="mb-4 rounded-xl px-4 py-3 flex items-center gap-3"
              style={{
                background: currentTheme.errorBg,
                border: `1px solid ${currentTheme.error}30`,
              }}
            >
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
                color: currentTheme.error,
              }}>
                {error}
              </span>
              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={fetchPageData}
                className="ml-auto text-xs px-3 py-1 rounded-lg"
                style={{
                  background: `${currentTheme.error}18`,
                  border: `1px solid ${currentTheme.error}30`,
                  color: currentTheme.error,
                  fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                Retry
              </motion.button>
            </motion.div>
          )}

          {/* ── Site Cards ──────────────────────────────────────────────────── */}
          <div className="space-y-4">
            {loading
              ? [...Array(paginatedSites.length || SITE_PER_PAGE)].map((_, i) => (
                  <SkeletonCard key={i} index={i} currentTheme={currentTheme} />
                ))
              : paginatedSites.map((site, index) => {
                  const logs    = logsBySite[site._id] || [];
                  const stats   = statsMap[site._id]   || {};
                  const lastLog = logs.length ? logs[logs.length - 1] : null;
                  const isDown  = lastLog?.status === "DOWN";
                  const hasData = logs.length > 0;
                  const isHighlighted = highlightedSiteId === site._id;

                  return (
                    <motion.div
                      key={`${site._id}-${page}`}
                      ref={(el) => {
                        if (el) cardRefs.current[site._id] = el;
                        else delete cardRefs.current[site._id];
                      }}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{
                        opacity: 1, y: 0,
                        boxShadow: isHighlighted
                          ? [
                              `0 0 0px ${accentColor}00`,
                              `0 0 28px ${accentColor}55`,
                              `0 0 18px ${accentColor}35`,
                              `0 0 28px ${accentColor}55`,
                              `0 0 0px ${accentColor}00`,
                            ]
                          : currentTheme.shadow,
                      }}
                      transition={{
                        opacity:   { delay: index * 0.04, duration: 0.4 },
                        y:         { delay: index * 0.04, duration: 0.4 },
                        boxShadow: isHighlighted
                          ? { duration: 2.6, times: [0, 0.2, 0.5, 0.8, 1], ease: "easeInOut" }
                          : { duration: 0.4 },
                      }}
                      whileHover={!isHighlighted ? { y: -2 } : {}}
                      className="group relative overflow-hidden rounded-xl"
                      style={{
                        background: currentTheme.bgCard,
                        border: isHighlighted
                          ? `1px solid ${accentColor}70`
                          : `1px solid ${currentTheme.borderAccent}`,
                        backdropFilter: "blur(16px)",
                        transition: "border-color 0.4s ease",
                      }}
                    >
                      {/* Top accent line */}
                      <div
                        className="absolute top-0 left-0 right-0 h-[1px]"
                        style={{
                          background: isHighlighted
                            ? `${accentColor}90`
                            : `${accentColor}30`,
                          transition: "background 0.4s ease",
                        }}
                      />

                      {/* Left accent bar */}
                      {isHighlighted && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "100%" }}
                          transition={{ duration: 0.35, ease: "easeOut" }}
                          className="absolute left-0 top-0 w-[3px] rounded-r"
                          style={{
                            background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}15)`,
                            boxShadow: `2px 0 12px ${accentColor}50`,
                          }}
                        />
                      )}

                      <div className="relative z-10 p-4 sm:p-5">

                        {/* Site Header */}
                        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <div
                                className="inline-flex items-center gap-2 px-2 py-1 rounded-full border"
                                style={{
                                  borderColor: `${accentColor}18`,
                                  background: `${accentColor}06`,
                                }}
                              >
                                <Server size={11} style={{ color: accentColor }} />
                                <span style={{
                                  fontFamily: "'JetBrains Mono', monospace", fontSize: "8px",
                                  letterSpacing: "0.12em", color: `${accentColor}80`,
                                  textTransform: "uppercase",
                                }}>
                                  Monitored Report
                                </span>
                              </div>
                            </div>
                            <a
                              href={site.url} target="_blank" rel="noopener noreferrer"
                              className="text-sm sm:text-base break-all transition"
                              style={{
                                fontFamily: "'Orbitron', sans-serif",
                                letterSpacing: "0.02em", fontWeight: 700,
                                color: currentTheme.text,
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = accentColor}
                              onMouseLeave={(e) => e.currentTarget.style.color = currentTheme.text}
                            >
                              {site.domain}
                            </a>
                            <div className="mt-2 flex items-start gap-2">
                              <Link2 size={13} className="mt-0.5 shrink-0" style={{ color: accentColor }} />
                              <p className="break-all" style={{
                                fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
                                color: currentTheme.textMuted, letterSpacing: "0.02em",
                              }}>
                                {site.url}
                              </p>
                            </div>
                          </div>

                          {/* Status Badge */}
                          <span
                            className="px-3 py-1.5 text-[10px] font-bold rounded-full inline-flex items-center gap-2"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace", letterSpacing: "0.08em",
                              ...(
                                !hasData
                                  ? { background: `${currentTheme.textMuted}20`, color: currentTheme.textMuted, border: `1px solid ${currentTheme.textMuted}30` }
                                  : isDown
                                  ? { background: currentTheme.errorBg, color: currentTheme.error, border: `1px solid ${currentTheme.error}30` }
                                  : { background: currentTheme.successBg, color: currentTheme.success, border: `1px solid ${currentTheme.success}30` }
                              ),
                            }}
                          >
                            <span className="w-2 h-2 rounded-full bg-current inline-block" />
                            {!hasData ? "NO DATA" : isDown ? "DOWN" : "UP"}
                          </span>
                        </div>

                        {/* Metrics Grid */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                          {[
                            { label: "Total Checks", value: hasData ? (stats.totalChecks ?? 0) : "—" },
                            { label: "Failures",     value: hasData ? (stats.downChecks  ?? 0) : "—" },
                            { label: "Avg Response", value: hasData ? `${stats.avgResponse ?? 0} ms` : "—" },
                            { label: "Fast / Slow",  value: hasData ? `${stats.minResponse ?? 0} / ${stats.maxResponse ?? 0} ms` : "—" },
                          ].map((item, i) => (
                            <div
                              key={i}
                              className="rounded-lg px-3 py-3"
                              style={{
                                background: currentTheme.bgInput,
                                border: `1px solid ${currentTheme.borderLight}`,
                              }}
                            >
                              <div style={{
                                fontFamily: "'JetBrains Mono', monospace", fontSize: "8px",
                                color: currentTheme.textMuted, textTransform: "uppercase",
                                letterSpacing: "0.12em",
                              }}>
                                {item.label}
                              </div>
                              <div
                                className="mt-1 break-words"
                                style={{
                                  fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
                                  fontSize: "14px", color: currentTheme.text,
                                }}
                              >
                                {item.value}
                              </div>
                            </div>
                          ))}
                        </div>

                        {/* Chart Area */}
                        <div
                          className="rounded-xl p-3 sm:p-4"
                          style={{
                            background: currentTheme.bgInput,
                            border: `1px solid ${accentColor}18`,
                          }}
                        >
                          <SiteReport
                            site={site}
                            logs={logs}
                            stats={stats}
                            range={range}
                            customFrom={customFrom}
                            customTo={customTo}
                          />
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
          </div>

          {/* ── No Results ───────────────────────────────────────────────────── */}
          {!loading && filteredSites.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-6 text-center mt-4"
              style={{
                background: currentTheme.bgCard,
                border: `1px solid ${currentTheme.borderAccent}`,
                backdropFilter: "blur(14px)",
              }}
            >
              <div
                className="mx-auto mb-3 w-12 h-12 rounded-xl flex items-center justify-center border"
                style={{ borderColor: currentTheme.borderAccent, background: currentTheme.bgInput }}
              >
                <Search size={18} style={{ color: accentColor }} />
              </div>
              <h3
                className="text-sm mb-2"
                style={{ fontFamily: "'Orbitron', sans-serif", letterSpacing: "0.03em", fontWeight: 700, color: currentTheme.text }}
              >
                NO WEBSITES FOUND
              </h3>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.textMuted }}>
                No websites match your current search or selected filters.
              </p>
            </motion.div>
          )}

          {/* ── Pagination ───────────────────────────────────────────────────── */}
          {filteredSites.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.4 }}
              className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <motion.button
                whileHover={{ scale: page === 1 ? 1 : 1.02, x: page === 1 ? 0 : -1 }}
                whileTap={{ scale: page === 1 ? 1 : 0.98 }}
                disabled={page === 1 || loading}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                style={{
                  background: currentTheme.bgCard,
                  border: `1px solid ${currentTheme.borderAccent}`,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "12px",
                  color: currentTheme.textSecondary,
                }}
              >
                <ChevronLeft size={15} /> Prev
              </motion.button>

              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                  .reduce((acc, p, idx, arr) => {
                    if (idx > 0 && p - arr[idx - 1] > 1) acc.push("ellipsis-" + p);
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((item) =>
                    typeof item === "string" ? (
                      <span key={item} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: currentTheme.textDim, padding: "0 2px" }}>…</span>
                    ) : (
                      <motion.button
                        key={item}
                        whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }}
                        onClick={() => setPage(item)}
                        disabled={loading}
                        className="w-9 h-9 rounded-lg flex items-center justify-center transition-all disabled:opacity-40"
                        style={{
                          background: item === page ? `${accentColor}25` : currentTheme.bgCard,
                          border: `1px solid ${item === page ? `${accentColor}45` : currentTheme.borderAccent}`,
                          fontFamily: "'Orbitron', sans-serif", fontSize: "11px",
                          color: item === page ? accentColor : currentTheme.textMuted,
                          boxShadow: item === page ? `0 0 12px ${accentColor}18` : "none",
                        }}
                      >
                        {item}
                      </motion.button>
                    )
                  )}
              </div>

              <motion.button
                whileHover={{ scale: page === totalPages ? 1 : 1.02, x: page === totalPages ? 0 : 1 }}
                whileTap={{ scale: page === totalPages ? 1 : 0.98 }}
                disabled={page === totalPages || loading}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed transition"
                style={{
                  background: currentTheme.bgCard,
                  border: `1px solid ${currentTheme.borderAccent}`,
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "12px",
                  color: currentTheme.textSecondary,
                }}
              >
                Next <ChevronRight size={15} />
              </motion.button>
            </motion.div>
          )}

        </div>
      </div>
    </>
  );
}