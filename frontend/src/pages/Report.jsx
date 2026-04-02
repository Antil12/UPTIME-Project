import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  FileBarChart2,
  Search,
  CalendarRange,
  Globe2,
  Activity,
  ShieldCheck,
  Server,
  Link2,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import SiteReport from "../components/SiteReport";
import ExportButtons from "../components/ExportButtons";

const API_URL = import.meta.env.VITE_API_URL;

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
        width: 260,
        height: 260,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(56,189,248,0.035) 0%, transparent 72%)",
      }}
    />
  );
};

// ─── Background ───────────────────────────────────────────────────────────────
const Background = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0 bg-[#030712]" />

    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(56,189,248,0.035) 0%, transparent 100%)",
      }}
    />

    <div
      className="absolute"
      style={{
        top: "62%",
        left: "16%",
        width: 260,
        height: 260,
        background:
          "radial-gradient(circle, rgba(129,140,248,0.025) 0%, transparent 68%)",
        filter: "blur(90px)",
      }}
    />

    <div
      className="absolute"
      style={{
        top: "18%",
        right: "12%",
        width: 220,
        height: 220,
        background:
          "radial-gradient(circle, rgba(16,185,129,0.02) 0%, transparent 68%)",
        filter: "blur(80px)",
      }}
    />

    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(rgba(148,163,184,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.02) 1px, transparent 1px)",
        backgroundSize: "42px 42px",
      }}
    />

    <motion.div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(to bottom, transparent 48%, rgba(56,189,248,0.01) 50%, transparent 52%)",
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

// ─── HUD Corner ───────────────────────────────────────────────────────────────
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
      className={`fixed ${cls[pos]} w-6 h-6 z-20 pointer-events-none`}
      style={{ transform: `rotate(${rot[pos]})` }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 0.65, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div
        className="absolute top-0 left-0 h-[1px] bg-sky-400/70"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }}
      />
      <motion.div
        className="absolute top-0 left-0 w-[1px] bg-sky-400/70"
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
      width: radius * 2,
      height: radius * 2,
      top: "50%",
      left: "50%",
      marginTop: -radius,
      marginLeft: -radius,
      transform: `perspective(900px) rotateX(${tilt}deg)`,
      opacity: 0.25,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <div
      className="absolute inset-0 rounded-full"
      style={{ border: `1px solid ${color}10` }}
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
            background: i === 0 ? color : `${color}30`,
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
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "8px",
          letterSpacing: "0.14em",
          color: `${color}88`,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    )}
  </div>
);

// ─── Small Stat Card ──────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.35 }}
    className="rounded-xl p-3"
    style={{
      background: "rgba(3,7,18,0.7)",
      border: "1px solid rgba(56,189,248,0.07)",
      backdropFilter: "blur(14px)",
      boxShadow: "0 0 14px rgba(56,189,248,0.02)",
    }}
  >
    <div className="flex items-center justify-between mb-2">
      <div
        className="w-8 h-8 rounded-lg flex items-center justify-center border"
        style={{
          borderColor: "rgba(56,189,248,0.08)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <Icon size={14} className="text-sky-400" />
      </div>
    </div>

    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "9px",
        color: "rgba(148,163,184,0.5)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>

    <div
      className="mt-1 text-white text-sm sm:text-base break-words"
      style={{
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: 700,
        letterSpacing: "0.03em",
      }}
    >
      {value}
    </div>
  </motion.div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export default function Report({ urls, reportSearch, setReportSearch, theme }) {
  // ================= STATES =================
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const SITE_PER_PAGE = 5;
  const [logsBySite, setLogsBySite] = useState({});
  const [statsMap, setStatsMap] = useState({});
  const [range, setRange] = useState("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [tempFrom, setTempFrom] = useState("");
  const [tempTo, setTempTo] = useState("");

  // ================= FILTERED SITES =================
  const filteredSites = useMemo(() => {
    return urls.filter(
      (u) =>
        (u.domain || "").toLowerCase().includes(reportSearch.toLowerCase()) ||
        (u.url || "").toLowerCase().includes(reportSearch.toLowerCase())
    );
  }, [urls, reportSearch]);

  // ================= PAGINATED SITES =================
  const paginatedSites = useMemo(() => {
    const start = (page - 1) * SITE_PER_PAGE;
    return filteredSites.slice(start, start + SITE_PER_PAGE);
  }, [filteredSites, page]);

  // ================= TOTAL PAGES =================
  useEffect(() => {
    setTotalPages(Math.ceil(filteredSites.length / SITE_PER_PAGE) || 1);
  }, [filteredSites]);

  // ================= RESET PAGE ON FILTER CHANGE =================
  useEffect(() => {
    setPage(1);
  }, [reportSearch, range]);

  // ================= APPLY CUSTOM RANGE =================
  const applyCustomRange = () => {
    if (!tempFrom || !tempTo) return;
    setCustomFrom(tempFrom);
    setCustomTo(tempTo);
  };

  // ================= FETCH DATA =================
  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem("loginToken");
        if (!token) return;

        const siteIds = paginatedSites.map((s) => s._id).join(",");

        const res = await axios.get(`${API_URL}/uptime-logs/report-data`, {
          params: {
            range,
            from: customFrom,
            to: customTo,
            siteIds,
          },
          headers: { Authorization: `Bearer ${token}` },
        });

        setLogsBySite(res.data.data.logsBySite);
        setStatsMap(res.data.data.statsMap);
      } catch (err) {
        console.error(err);
      }
    };

    fetchData();
  }, [range, customFrom, customTo, paginatedSites]);

  return (
    <>
      <FontLoader />

      <div
        className="relative min-h-screen w-full overflow-hidden px-3 sm:px-4 lg:px-6 py-4 text-white"
        style={{ background: "transparent" }}
      >
        <Background />
        <CursorGlow />

        <OrbitRing radius={210} duration={20} dotCount={8} color="#38bdf8" tilt={72} />
        <OrbitRing radius={280} duration={30} dotCount={10} color="#818cf8" tilt={68} delay={1} />

        {["tl", "tr", "bl", "br"].map((p, i) => (
          <HUDCorner key={p} pos={p} delay={0.1 + i * 0.05} />
        ))}

        <div className="relative z-10 w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45 }}
            className="mb-4 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="h-[1px] w-6 bg-sky-400/20" />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "8px",
                    letterSpacing: "0.22em",
                    color: "rgba(56,189,248,0.42)",
                    textTransform: "uppercase",
                  }}
                >
                  Uptime Reports
                </span>
                <div className="h-[1px] w-14 bg-sky-400/10" />
              </div>

              <h1
                className="text-xl sm:text-2xl lg:text-3xl mb-1"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  textShadow: "0 0 18px rgba(56,189,248,0.05)",
                }}
              >
                REPORT ANALYTICS
              </h1>

              <p
                className="max-w-2xl"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "rgba(148,163,184,0.5)",
                  letterSpacing: "0.02em",
                }}
              >
                Monitoring reports, response metrics and failures for configured websites.
              </p>
            </div>

            <StatusDot color="#34d399" label="Analytics Active" />
          </motion.div>

        
          {/* Controls */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.4 }}
            className="mb-4 rounded-xl p-3 sm:p-4 relative z-50 overflow-visible"
            style={{
              background: "rgba(3,7,18,0.72)",
              border: "1px solid rgba(56,189,248,0.07)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 0 14px rgba(56,189,248,0.02)",
            }}
          >
            <div className="flex flex-col xl:flex-row xl:items-start xl:justify-between gap-4 overflow-visible">
              <div className="flex flex-col md:flex-row gap-3 w-full xl:w-auto">
                {/* Search */}
                <div className="relative w-full md:w-72">
                  <Search
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400/60"
                  />
                  <input
                    value={reportSearch}
                    onChange={(e) => setReportSearch(e.target.value)}
                    placeholder="Search domain or URL"
                    className="w-full pl-9 pr-3 py-2.5 rounded-lg outline-none text-sm"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(56,189,248,0.07)",
                      color: "white",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  />
                </div>

                {/* Range */}
                <div className="relative min-w-[180px]">
                  <CalendarRange
                    size={14}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-sky-400/60 pointer-events-none"
                  />
                  <select
                    value={range}
                    onChange={(e) => setRange(e.target.value)}
                    className="w-full pl-9 pr-9 py-2.5 rounded-lg outline-none text-sm appearance-none"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(56,189,248,0.07)",
                      color: "white",
                      fontFamily: "'JetBrains Mono', monospace",
                    }}
                  >
                    <option value="24h" className="bg-gray-900 text-white">
                      Last 24 Hours
                    </option>
                    <option value="7d" className="bg-gray-900 text-white">
                      Last 7 Days
                    </option>
                    <option value="30d" className="bg-gray-900 text-white">
                      Last 30 Days
                    </option>
                    <option value="custom" className="bg-gray-900 text-white">
                      Custom Range
                    </option>
                  </select>
                </div>
              </div>

              {/* Export - fixed visibility */}
              <div className="relative z-[9999] overflow-visible self-start">
                <div
                  className="rounded-lg px-3 py-2 overflow-visible"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(56,189,248,0.07)",
                    backdropFilter: "blur(12px)",
                  }}
                >
                  <div
                    className="mb-2"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      letterSpacing: "0.12em",
                      color: "rgba(56,189,248,0.58)",
                      textTransform: "uppercase",
                    }}
                  >
                    Export Data
                  </div>

                  <div className="relative z-[9999] overflow-visible">
                    <ExportButtons
                      urls={filteredSites}
                      theme={theme}
                      range={range}
                      customFrom={customFrom}
                      customTo={customTo}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Custom Range */}
            {range === "custom" && (
              <motion.div
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-4 rounded-lg p-3"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px solid rgba(56,189,248,0.05)",
                }}
              >
                <div className="flex flex-col md:flex-row md:items-end gap-3">
                  <div className="flex flex-col text-sm">
                    <label
                      className="mb-1.5"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        color: "rgba(148,163,184,0.55)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      From
                    </label>
                    <input
                      type="date"
                      value={tempFrom}
                      onChange={(e) => setTempFrom(e.target.value)}
                      className="px-3 py-2.5 rounded-lg outline-none text-sm"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(56,189,248,0.07)",
                        color: "white",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    />
                  </div>

                  <div className="flex flex-col text-sm">
                    <label
                      className="mb-1.5"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        color: "rgba(148,163,184,0.55)",
                        textTransform: "uppercase",
                        letterSpacing: "0.1em",
                      }}
                    >
                      To
                    </label>
                    <input
                      type="date"
                      value={tempTo}
                      onChange={(e) => setTempTo(e.target.value)}
                      className="px-3 py-2.5 rounded-lg outline-none text-sm"
                      style={{
                        background: "rgba(255,255,255,0.02)",
                        border: "1px solid rgba(56,189,248,0.07)",
                        color: "white",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    />
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.02, y: -1 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={applyCustomRange}
                    className="px-4 py-2.5 rounded-lg text-xs text-white"
                    style={{
                      background: "rgba(14,165,233,0.16)",
                      border: "1px solid rgba(56,189,248,0.16)",
                      boxShadow: "0 0 12px rgba(56,189,248,0.04)",
                      fontFamily: "'JetBrains Mono', monospace",
                      letterSpacing: "0.08em",
                      textTransform: "uppercase",
                    }}
                  >
                    Apply
                  </motion.button>
                </div>
              </motion.div>
            )}
          </motion.div>

          {/* Site Cards */}
          <div className="space-y-4">
            {paginatedSites.map((site, index) => {
              const logs = logsBySite[site._id] || [];
              const stats = statsMap[site._id] || {};
              const lastLog = logs.length ? logs[logs.length - 1] : null;

              const isDown = lastLog && lastLog.status === "DOWN";

              return (
                <motion.div
                  key={site._id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04, duration: 0.4 }}
                  whileHover={{ y: -2 }}
                  className="group relative overflow-hidden rounded-xl"
                  style={{
                    background: "rgba(3,7,18,0.74)",
                    border: "1px solid rgba(56,189,248,0.08)",
                    backdropFilter: "blur(16px)",
                    boxShadow:
                      "0 0 18px rgba(56,189,248,0.025), inset 0 1px 0 rgba(56,189,248,0.03)",
                  }}
                >
                  <div
                    className="absolute top-0 left-0 right-0 h-[1px]"
                    style={{
                      background: "rgba(56,189,248,0.18)",
                    }}
                  />

                  <div className="relative z-10 p-4 sm:p-5">
                    {/* Header */}
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-4">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <div
                            className="inline-flex items-center gap-2 px-2 py-1 rounded-full border"
                            style={{
                              borderColor: "rgba(56,189,248,0.08)",
                              background: "rgba(56,189,248,0.03)",
                            }}
                          >
                            <Server size={11} className="text-sky-400" />
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "8px",
                                letterSpacing: "0.12em",
                                color: "rgba(56,189,248,0.58)",
                                textTransform: "uppercase",
                              }}
                            >
                              Monitored Report
                            </span>
                          </div>
                        </div>

                        <a
                          href={site.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-white text-sm sm:text-base break-all hover:text-sky-300 transition"
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            letterSpacing: "0.02em",
                            fontWeight: 700,
                          }}
                        >
                          {site.domain}
                        </a>

                        <div className="mt-2 flex items-start gap-2">
                          <Link2 size={13} className="text-sky-400 mt-0.5 shrink-0" />
                          <p
                            className="break-all"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "10px",
                              color: "rgba(148,163,184,0.6)",
                              letterSpacing: "0.02em",
                            }}
                          >
                            {site.url}
                          </p>
                        </div>
                      </div>

                      <div>
                        <span
                          className={`px-3 py-1.5 text-[10px] font-bold rounded-full inline-flex items-center gap-2 ${
                            isDown
                              ? "bg-red-500/20 text-red-300 border border-red-500/20"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-500/20"
                          }`}
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            letterSpacing: "0.08em",
                          }}
                        >
                          <span className="w-2 h-2 rounded-full bg-current inline-block" />
                          {isDown ? "DOWN" : "UP"}
                        </span>
                      </div>
                    </div>

                    {/* Metrics */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                      {[
                        {
                          label: "Total Checks",
                          value: stats.totalChecks || 0,
                        },
                        {
                          label: "Failures",
                          value: stats.downChecks || 0,
                        },
                        {
                          label: "Avg Response",
                          value: `${stats.avgResponse || 0} ms`,
                        },
                        {
                          label: "Fast / Slow",
                          value: `${stats.minResponse || 0} / ${stats.maxResponse || 0} ms`,
                        },
                      ].map((item, i) => (
                        <div
                          key={i}
                          className="rounded-lg px-3 py-3"
                          style={{
                            background: "rgba(255,255,255,0.016)",
                            border: "1px solid rgba(255,255,255,0.04)",
                          }}
                        >
                          <div
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "8px",
                              color: "rgba(148,163,184,0.45)",
                              textTransform: "uppercase",
                              letterSpacing: "0.12em",
                            }}
                          >
                            {item.label}
                          </div>
                          <div
                            className="mt-1 text-white break-words"
                            style={{
                              fontFamily: "'Orbitron', sans-serif",
                              fontWeight: 700,
                              fontSize: "14px",
                            }}
                          >
                            {item.value}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Report */}
                    <div
                      className="rounded-xl p-3 sm:p-4"
                      style={{
                        background: "rgba(255,255,255,0.014)",
                        border: "1px solid rgba(56,189,248,0.045)",
                      }}
                    >
                      <SiteReport
                        site={site}
                        logs={logs}
                        theme={theme}
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

          {/* No Results */}
          {filteredSites.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-xl p-6 text-center mt-4"
              style={{
                background: "rgba(3,7,18,0.66)",
                border: "1px solid rgba(56,189,248,0.07)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 0 14px rgba(56,189,248,0.02)",
              }}
            >
              <div
                className="mx-auto mb-3 w-12 h-12 rounded-xl flex items-center justify-center border"
                style={{
                  borderColor: "rgba(56,189,248,0.08)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <Search size={18} className="text-sky-400" />
              </div>

              <h3
                className="text-white text-sm mb-2"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: "0.03em",
                  fontWeight: 700,
                }}
              >
                NO WEBSITES FOUND
              </h3>

              <p
                className="max-w-xl mx-auto"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "rgba(148,163,184,0.48)",
                }}
              >
                No websites match your current search or selected filters.
              </p>
            </motion.div>
          )}

          {/* Pagination */}
          {filteredSites.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3"
            >
              <motion.button
                whileHover={{ scale: page === 1 ? 1 : 1.02, x: page === 1 ? 0 : -1 }}
                whileTap={{ scale: page === 1 ? 1 : 0.98 }}
                disabled={page === 1}
                onClick={() => setPage((p) => p - 1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(3,7,18,0.72)",
                  border: "1px solid rgba(56,189,248,0.07)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                }}
              >
                <ChevronLeft size={15} />
                Prev
              </motion.button>

              <div
                className="px-4 py-2.5 rounded-lg"
                style={{
                  background: "rgba(3,7,18,0.72)",
                  border: "1px solid rgba(56,189,248,0.07)",
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: "0.04em",
                  fontSize: "12px",
                }}
              >
                Page {page} of {totalPages}
              </div>

              <motion.button
                whileHover={{
                  scale: page === totalPages ? 1 : 1.02,
                  x: page === totalPages ? 0 : 1,
                }}
                whileTap={{ scale: page === totalPages ? 1 : 0.98 }}
                disabled={page === totalPages}
                onClick={() => setPage((p) => p + 1)}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-lg disabled:opacity-40 disabled:cursor-not-allowed"
                style={{
                  background: "rgba(3,7,18,0.72)",
                  border: "1px solid rgba(56,189,248,0.07)",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                }}
              >
                Next
                <ChevronRight size={15} />
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </>
  );
}