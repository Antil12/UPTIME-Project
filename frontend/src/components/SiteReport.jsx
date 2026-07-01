import React, { useMemo } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Server,
  Radar,
  ExternalLink,
} from "lucide-react";
import { useTheme } from "../contexts/ThemeContext";

// ─── MAX chart points ─────────────────────────────────────────────────────────
const MAX_CHART_POINTS = 300;

function downsample(logs) {
  if (logs.length <= MAX_CHART_POINTS) return logs;
  const bucketSize = Math.ceil(logs.length / MAX_CHART_POINTS);
  const result = [];
  for (let i = 0; i < logs.length; i += bucketSize) {
    const bucket    = logs.slice(i, i + bucketSize);
    const validResp = bucket.map((l) => l.responseTimeMs).filter((v) => v != null && v > 0);
    const avgResp   = validResp.length
      ? Math.round(validResp.reduce((a, b) => a + b, 0) / validResp.length)
      : 0;
    const last      = bucket[bucket.length - 1];
    const downCount = bucket.filter((l) => l.status === "DOWN").length;
    result.push({
      ...last,
      responseTimeMs: avgResp,
      status: downCount > 0 ? "DOWN" : last.status,
      _isBucket: true,
      _bucketSize: bucket.length,
      _downCount: downCount,
    });
  }
  return result;
}

function formatXLabel(timestamp, range) {
  if (!timestamp) return "";
  const d = new Date(timestamp);
  if (isNaN(d)) return "";
  if (range === "24h")
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  if (range === "7d")
    return (
      d.toLocaleDateString([], { month: "short", day: "numeric" }) +
      " " +
      d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    );
  return d.toLocaleDateString([], { month: "short", day: "numeric" });
}

// ─── Custom tooltip ───────────────────────────────────────────────────────────
const CustomTooltip = ({ active, payload, label, range, currentTheme }) => {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;
  const statusColors = { UP: currentTheme.success, DOWN: currentTheme.error, SLOW: currentTheme.warning };
  const sc       = statusColors[pt.status] || currentTheme.textSecondary;
  const fullTime = pt.timestamp ? new Date(pt.timestamp).toLocaleString() : label;
  return (
    <div style={{
      background: currentTheme.bgPanel,
      border: `1px solid ${currentTheme.borderAccent}`,
      borderRadius: "12px", padding: "10px 14px",
      fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
      backdropFilter: "blur(20px)", minWidth: 170, boxShadow: currentTheme.shadow,
    }}>
      <div style={{ color: currentTheme.accent, fontSize: "9px", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 6, fontWeight: 700 }}>
        {fullTime}
      </div>
      <div style={{ color: currentTheme.text, marginBottom: 4 }}>
        Response: <span style={{ color: currentTheme.accent, fontWeight: 700 }}>
          {pt.responseTimeMs != null ? `${pt.responseTimeMs} ms` : "—"}
        </span>
      </div>
      <div style={{ color: currentTheme.text }}>
        Status: <span style={{ color: sc, fontWeight: 700 }}>{pt.status || "—"}</span>
      </div>
      {pt._isBucket && (
        <div style={{ color: currentTheme.textSecondary, fontSize: "9px", marginTop: 5, borderTop: `1px solid ${currentTheme.borderAccent}`, paddingTop: 5 }}>
          avg of {pt._bucketSize} checks
          {pt._downCount > 0 && <span style={{ color: currentTheme.error, fontWeight: 600 }}> · {pt._downCount} down</span>}
        </div>
      )}
    </div>
  );
};

function uptimeColor(pct, currentTheme) {
  if (pct === null || pct === undefined) return currentTheme.textSecondary;
  if (pct >= 99) return currentTheme.success;
  if (pct >= 95) return currentTheme.accent;
  if (pct >= 90) return currentTheme.warning;
  return currentTheme.error;
}

// ─── Global Check Loading Skeleton ───────────────────────────────────────────
// NOTE: currentTheme must be passed as a prop — it cannot be accessed via hook
// inside a component that is conditionally rendered in AnimatePresence.
function GlobalCheckSkeleton({ currentTheme }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: currentTheme.bgOverlay,
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(6px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: currentTheme.bgPanel,
          border: `1px solid ${currentTheme.borderAccent}`,
          borderRadius: "20px", padding: "36px 40px", width: "420px",
          backdropFilter: "blur(20px)", boxShadow: currentTheme.shadow,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              border: `3px solid ${currentTheme.borderAccent}`,
              borderTopColor: currentTheme.accent, flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "16px", fontWeight: 700, color: currentTheme.text }}>
              Running Global Check…
            </div>
            <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.accent, marginTop: "2px", fontWeight: 600 }}>
              Sending HEAD requests to all regions
            </div>
          </div>
        </div>

        {["North America", "Europe", "Asia", "South America", "Australia", "Africa"].map((r, i) => (
          <motion.div
            key={r}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", marginBottom: "8px", borderRadius: "10px",
              background: currentTheme.accentGlow,
              border: `1px solid ${currentTheme.borderAccent}`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
                style={{ width: "8px", height: "8px", borderRadius: "50%", background: currentTheme.accent }}
              />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: currentTheme.text, fontWeight: 500 }}>
                {r}
              </span>
            </div>
            <motion.div
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12 }}
              style={{ width: "52px", height: "10px", borderRadius: "5px", background: currentTheme.accent }}
            />
          </motion.div>
        ))}

        <div style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
          color: currentTheme.textSecondary, textAlign: "center", marginTop: "18px", letterSpacing: "0.06em",
        }}>
          This may take up to 20 seconds
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status, size = "sm", currentTheme }) {
  const colorMap = {
    UP:      currentTheme.success,
    DOWN:    currentTheme.error,
    SLOW:    currentTheme.warning,
    UNKNOWN: currentTheme.textSecondary,
  };
  const color = colorMap[status] || currentTheme.textSecondary;
  const fs    = size === "lg" ? "15px" : "11px";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: size === "lg" ? "6px 14px" : "4px 10px", borderRadius: "8px",
      background: `${color}18`, border: `1px solid ${color}40`, color,
      fontFamily: "'JetBrains Mono',monospace", fontSize: fs, fontWeight: 700,
    }}>
      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "currentColor" }} />
      {status || "UNKNOWN"}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SiteReport — main component
// ─────────────────────────────────────────────────────────────────────────────
export default function SiteReport({
  site,
  logs = [],
  stats = {},
  range = "7d",
  customFrom,
  customTo,
  showFullDetailBtn = false,
}) {
  const navigate = useNavigate();
  const { currentTheme } = useTheme();

  const [isCheckingGlobal, setIsCheckingGlobal]         = React.useState(false);
  const [globalCheckModalData, setGlobalCheckModalData] = React.useState(null);
  const [globalCheckError, setGlobalCheckError]         = React.useState(null);

  const handleGlobalCheck = async () => {
    setIsCheckingGlobal(true);
    setGlobalCheckError(null);
    try {
      const token = localStorage.getItem("loginToken");
      const res   = await axios.post(
        `${import.meta.env.VITE_API_URL}/monitoredsite/global-check/${site._id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGlobalCheckModalData(res.data.data);
    } catch (err) {
      console.error("Global check failed:", err);
      setGlobalCheckError(
        err?.response?.data?.message || "Global check failed. Please try again."
      );
    } finally {
      setIsCheckingGlobal(false);
    }
  };

  const handleViewFullDetail = () => {
    navigate("/reports", { state: { selectedSiteId: site._id } });
  };

  // ── Sort & downsample ─────────────────────────────────────────────────────
  const sortedLogs = useMemo(
    () => [...logs].sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp)),
    [logs]
  );
  const chartLogs = useMemo(() => downsample(sortedLogs), [sortedLogs]);

  const series = useMemo(
    () => chartLogs.map((l) => ({
      label:          formatXLabel(l.timestamp, range),
      responseTimeMs: l.responseTimeMs ?? 0,
      status:         l.status,
      timestamp:      l.timestamp,
      _isBucket:      l._isBucket   ?? false,
      _bucketSize:    l._bucketSize ?? 1,
      _downCount:     l._downCount  ?? 0,
    })),
    [chartLogs, range]
  );

  const primaryUptime =
    stats.uptimePercent != null
      ? stats.uptimePercent
      : stats.totalChecks > 0
      ? parseFloat(((stats.upChecks / stats.totalChecks) * 100).toFixed(2))
      : null;

  const uptime24h = stats.uptime24h ?? null;
  const uptime7d  = stats.uptime7d  ?? null;
  const uptime30d = stats.uptime30d ?? null;

  const latestDown = useMemo(
    () => [...sortedLogs].reverse().find((l) => l.status === "DOWN"),
    [sortedLogs]
  );

  const currentStatus = sortedLogs.length > 0 ? sortedLogs[sortedLogs.length - 1]?.status : null;
  const statusColorMap = {
    UP:   currentTheme.success,
    DOWN: currentTheme.error,
    SLOW: currentTheme.warning,
  };
  const statusColor = statusColorMap[currentStatus] || currentTheme.textSecondary;

  const rangeLabel =
    range === "custom"
      ? customFrom && customTo ? `${customFrom} → ${customTo}` : "CUSTOM"
      : range.toUpperCase();

  const downEvents = useMemo(
    () => series.filter((s) => s.status === "DOWN").slice(0, 30),
    [series]
  );

  const gradientId = `grad-${site._id}`;

  if (sortedLogs.length === 0) {
    return (
      <div
        className="rounded-2xl p-8 text-center"
        style={{
          background: currentTheme.bgCard,
          border: `1px solid ${currentTheme.borderAccent}`,
          backdropFilter: "blur(14px)",
        }}
      >
        <p style={{
          fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
          color: currentTheme.textSecondary, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 600,
        }}>
          No data available for the selected range
        </p>
        {showFullDetailBtn && (
          <ViewFullDetailButton onClick={handleViewFullDetail} domain={site.domain} currentTheme={currentTheme} />
        )}
      </div>
    );
  }

  return (
    <>
      {/* ── Loading skeleton overlay ── */}
      <AnimatePresence>
        {isCheckingGlobal && <GlobalCheckSkeleton currentTheme={currentTheme} />}
      </AnimatePresence>

      {/* ── Result modal ── */}
      <AnimatePresence>
        {globalCheckModalData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setGlobalCheckModalData(null)}
            style={{
              position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
              background: currentTheme.bgOverlay,
              display: "flex", alignItems: "center", justifyContent: "center",
              zIndex: 9999, backdropFilter: "blur(4px)",
            }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: currentTheme.bgPanel,
                border: `1px solid ${currentTheme.borderAccent}`,
                borderRadius: "20px", backdropFilter: "blur(20px)",
                boxShadow: currentTheme.shadow, padding: "32px",
                maxWidth: "600px", width: "90%", maxHeight: "80vh", overflowY: "auto",
              }}
            >
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "20px", fontWeight: 700, color: currentTheme.text, marginBottom: "4px" }}>
                    🌍 Global Status Check
                  </h2>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: currentTheme.textSecondary }}>
                    {globalCheckModalData.domain}
                  </p>
                </div>
                <motion.button
                  whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                  onClick={() => setGlobalCheckModalData(null)}
                  style={{
                    background: currentTheme.accentGlow,
                    border: `1px solid ${currentTheme.borderAccent}`,
                    borderRadius: "8px", padding: "8px 12px",
                    color: currentTheme.accent, cursor: "pointer",
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "18px",
                  }}
                >
                  ✕
                </motion.button>
              </div>

              {globalCheckModalData.liveStatus && (
                <div
                  className="mb-4 p-3 rounded-xl"
                  style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.borderAccent}` }}
                >
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.accent, marginBottom: "6px", letterSpacing: "0.06em", fontWeight: 700 }}>
                    LIVE HTTP CHECK (server-side)
                  </p>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                    <StatusBadge status={globalCheckModalData.liveStatus} currentTheme={currentTheme} />
                    {globalCheckModalData.liveStatusCode != null && (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.text, fontWeight: 600 }}>
                        HTTP {globalCheckModalData.liveStatusCode}
                      </span>
                    )}
                    {globalCheckModalData.liveResponseTime != null && (
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.accent, fontWeight: 700 }}>
                        {globalCheckModalData.liveResponseTime} ms
                      </span>
                    )}
                    {globalCheckModalData.methodUsed && (
                      <span style={{
                        fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textSecondary,
                        padding: "2px 7px", borderRadius: "4px",
                        background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderLight}`,
                      }}>
                        via {globalCheckModalData.methodUsed}
                      </span>
                    )}
                  </div>
                </div>
              )}

              <div
                className="mb-6 p-4 rounded-xl"
                style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.borderAccent}` }}
              >
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.accent, marginBottom: "8px", letterSpacing: "0.06em", fontWeight: 700 }}>
                  AGGREGATED GLOBAL STATUS
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                  <StatusBadge status={globalCheckModalData.globalStatus} size="lg" currentTheme={currentTheme} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: currentTheme.textSecondary }}>
                    {new Date(globalCheckModalData.checkTimestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {Array.isArray(globalCheckModalData.regionalBreakdown) && globalCheckModalData.regionalBreakdown.length > 0 && (
                <>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.accent, marginBottom: "12px", letterSpacing: "0.06em", fontWeight: 700 }}>
                    REGIONAL BREAKDOWN
                  </p>
                  <div className="space-y-2">
                    {globalCheckModalData.regionalBreakdown.map((region, idx) => {
                      const colorMap = {
                        UP:      currentTheme.success,
                        DOWN:    currentTheme.error,
                        SLOW:    currentTheme.warning,
                        UNKNOWN: currentTheme.textSecondary,
                      };
                      const color = colorMap[region.status] || currentTheme.textSecondary;
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-3 rounded-lg"
                          style={{ background: `${color}12`, border: `1px solid ${color}30` }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
                              <div className="flex-1 min-w-0">
                                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, color: currentTheme.text }}>
                                  {region.region}
                                </p>
                                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textSecondary }}>
                                  {region.lastCheckedAt ? new Date(region.lastCheckedAt).toLocaleTimeString() : "Never checked"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color, fontWeight: 700 }}>{region.status}</p>
                              {region.responseTimeMs != null && (
                                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textSecondary }}>{region.responseTimeMs}ms</p>
                              )}
                              {region.statusCode != null && (
                                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textSecondary }}>HTTP {region.statusCode}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}

              {(!globalCheckModalData.regionalBreakdown || globalCheckModalData.regionalBreakdown.length === 0) && (
                <div style={{
                  padding: "16px", borderRadius: "10px",
                  background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderLight}`,
                  textAlign: "center",
                }}>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.textSecondary, letterSpacing: "0.06em" }}>
                    No regions assigned — showing direct check result
                  </p>
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                onClick={() => setGlobalCheckModalData(null)}
                style={{
                  width: "100%", marginTop: "24px", padding: "12px", borderRadius: "12px",
                  background: currentTheme.accentGlow, border: `1px solid ${currentTheme.borderAccent}`,
                  color: currentTheme.accent, fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em",
                }}
              >
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error toast ── */}
      <AnimatePresence>
        {globalCheckError && (
          <motion.div
            initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
            style={{
              position: "fixed", top: "24px", left: "50%", transform: "translateX(-50%)",
              zIndex: 10000, background: currentTheme.errorBg,
              border: `1px solid ${currentTheme.error}40`,
              borderRadius: "12px", padding: "12px 20px",
              fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
              color: currentTheme.error, backdropFilter: "blur(16px)",
              display: "flex", alignItems: "center", gap: "10px", fontWeight: 600,
            }}
          >
            <span>⚠</span>
            {globalCheckError}
            <button
              onClick={() => setGlobalCheckError(null)}
              style={{ marginLeft: "8px", background: "none", border: "none", color: currentTheme.error, cursor: "pointer", fontSize: "14px" }}
            >
              ✕
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        {/* ── LEFT: chart area ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Uptime bar */}
          <GlassCard currentTheme={currentTheme}>
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <SectionTitle icon={ShieldCheck} title={`UPTIME · ${rangeLabel}`} currentTheme={currentTheme} />
              <div style={{
                fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: "20px",
                color: uptimeColor(primaryUptime, currentTheme), letterSpacing: "0.04em",
              }}>
                {primaryUptime != null ? `${primaryUptime}%` : "—"}
              </div>
            </div>
            <div
              className="w-full h-2.5 rounded-full overflow-hidden"
              style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderAccent}` }}
            >
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, primaryUptime ?? 0))}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                style={{
                  height: "100%",
                  background: `linear-gradient(90deg, ${currentTheme.success} 0%, ${currentTheme.accent} 100%)`,
                  boxShadow: `0 0 10px ${currentTheme.success}40`,
                }}
              />
            </div>
            <div
              className="mt-2 flex items-center justify-between flex-wrap gap-1"
              style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                color: currentTheme.textSecondary, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500,
              }}
            >
              <span>Availability index · {rangeLabel}</span>
              <span>
                {sortedLogs.length.toLocaleString()} checks
                {chartLogs.length < sortedLogs.length && ` · chart sampled to ${chartLogs.length} pts`}
              </span>
            </div>
          </GlassCard>

          {/* Response time chart */}
          <GlassCard currentTheme={currentTheme}>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <SectionTitle icon={Activity} title={`RESPONSE TIME · ${rangeLabel}`} currentTheme={currentTheme} />
              <div className="flex items-center gap-3">
                {stats.avgResponse > 0 && (
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.accent, letterSpacing: "0.06em", fontWeight: 700 }}>
                    avg {stats.avgResponse} ms
                  </span>
                )}
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.textSecondary, letterSpacing: "0.06em", textTransform: "uppercase", fontWeight: 500 }}>
                  latency (ms)
                </span>
              </div>
            </div>
            <div style={{ width: "100%", height: 280, minWidth: 0 }}>
              <ResponsiveContainer width="100%" height={280}>
                <AreaChart data={series} margin={{ top: 6, right: 12, left: 0, bottom: 4 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={currentTheme.accent} stopOpacity={0.4} />
                      <stop offset="100%" stopColor={currentTheme.accent} stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={currentTheme.gridColor} vertical={false} />
                  <XAxis
                    dataKey="label"
                    tick={{ fontSize: 9, fill: currentTheme.textSecondary, fontFamily: "JetBrains Mono" }}
                    axisLine={false} tickLine={false}
                    hide={series.length > 60} interval="preserveStartEnd"
                  />
                  <YAxis
                    dataKey="responseTimeMs"
                    tick={{ fontSize: 9, fill: currentTheme.textSecondary, fontFamily: "JetBrains Mono" }}
                    axisLine={false} tickLine={false}
                    tickFormatter={(v) => `${v}ms`} width={52}
                  />
                  <Tooltip
                    content={<CustomTooltip range={range} currentTheme={currentTheme} />}
                    cursor={{ stroke: `${currentTheme.accent}25`, strokeWidth: 1, strokeDasharray: "4 4" }}
                  />
                  <Area
                    type="monotone" dataKey="responseTimeMs"
                    stroke={currentTheme.accent} strokeWidth={2}
                    fill={`url(#${gradientId})`} dot={false}
                    activeDot={{ r: 5, fill: currentTheme.accent, stroke: `${currentTheme.accent}40`, strokeWidth: 3 }}
                    isAnimationActive={series.length < 400}
                  />
                  {downEvents.map((pt, i) => (
                    <ReferenceLine key={i} x={pt.label} stroke={`${currentTheme.error}50`} strokeWidth={1} strokeDasharray="3 3" />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              <LegendItem color={currentTheme.accent} label="Response time" currentTheme={currentTheme} />
              {downEvents.length > 0 && <LegendItem color={currentTheme.error} dashed label="Downtime event" currentTheme={currentTheme} />}
            </div>
          </GlassCard>
        </div>

        {/* ── RIGHT: stats panel ── */}
        <aside className="space-y-5">

          {/* Current Status */}
          <GlassCard currentTheme={currentTheme}>
            <SectionTitle icon={Radar} title="CURRENT STATUS" currentTheme={currentTheme} />
            <div className="flex justify-center mt-4 gap-3 flex-wrap">
              <div
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full"
                style={{
                  background: `${statusColor}12`,
                  border: `1px solid ${statusColor}40`,
                  color: statusColor,
                }}
              >
                <motion.span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background: statusColor, boxShadow: `0 0 8px ${statusColor}` }}
                  animate={currentStatus === "DOWN" ? { opacity: [1, 0.2, 1] } : { scale: [1, 1.3, 1] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: "15px", letterSpacing: "0.08em" }}>
                  {currentStatus ?? "UNKNOWN"}
                </span>
              </div>

              {/* Global Check Button */}
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleGlobalCheck}
                disabled={isCheckingGlobal}
                title="Perform live HTTP check across all regions"
                className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full transition-all"
                style={{
                  background: isCheckingGlobal ? currentTheme.accentGlow : currentTheme.bgInput,
                  border: isCheckingGlobal
                    ? `1px solid ${currentTheme.accent}`
                    : `1px solid ${currentTheme.borderLight}`,
                  color: isCheckingGlobal ? currentTheme.accent : currentTheme.text,
                  cursor: isCheckingGlobal ? "wait" : "pointer",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px", fontWeight: 600, letterSpacing: "0.06em",
                }}
              >
                {isCheckingGlobal ? (
                  <>
                    <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>⟳</motion.span>
                    Checking…
                  </>
                ) : (
                  <><span>🌍</span> Global Check</>
                )}
              </motion.button>
            </div>

            {sortedLogs.length > 0 && (
              <div
                className="mt-3 text-center"
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textSecondary, letterSpacing: "0.06em" }}
              >
                Last check {new Date(sortedLogs[sortedLogs.length - 1].timestamp).toLocaleString()}
              </div>
            )}
          </GlassCard>

          {/* Uptime Breakdown */}
          <GlassCard currentTheme={currentTheme}>
            <SectionTitle icon={Server} title="UPTIME BREAKDOWN" currentTheme={currentTheme} />
            <div className="space-y-3 mt-4">
              <UptimeRow label="Last 24 Hours" pct={uptime24h} checks={stats.checks24h} currentTheme={currentTheme} />
              <UptimeRow label="Last 7 Days"   pct={uptime7d}  checks={stats.checks7d}  currentTheme={currentTheme} />
              <UptimeRow label="Last 30 Days"  pct={uptime30d} checks={stats.checks30d} currentTheme={currentTheme} />
            </div>
          </GlassCard>

          {/* Latest Downtime */}
          <GlassCard currentTheme={currentTheme}>
            <SectionTitle icon={AlertTriangle} title="LATEST DOWNTIME" currentTheme={currentTheme} />
            <div className="mt-4">
              {latestDown ? (
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: currentTheme.text, lineHeight: 1.9 }}>
                  <div className="mb-2 uppercase text-[9px] tracking-widest" style={{ color: currentTheme.error, fontWeight: 700 }}>
                    Incident Recorded
                  </div>
                  <div style={{ fontWeight: 600 }}>{new Date(latestDown.timestamp).toLocaleString()}</div>
                  {latestDown.responseTimeMs > 0 && (
                    <div style={{ color: currentTheme.textSecondary, fontSize: "10px", marginTop: 2 }}>
                      Response: {latestDown.responseTimeMs} ms
                    </div>
                  )}
                  {latestDown.statusCode != null && (
                    <div style={{ color: currentTheme.textSecondary, fontSize: "10px" }}>
                      HTTP {latestDown.statusCode}
                    </div>
                  )}
                </div>
              ) : (
                <div style={{
                  fontFamily: "'JetBrains Mono', monospace", fontSize: "11px",
                  color: currentTheme.textSecondary, letterSpacing: "0.04em", textTransform: "uppercase", fontWeight: 500,
                }}>
                  No downtimes in selected range
                </div>
              )}
            </div>
          </GlassCard>

          {/* View Full Detail button — only shown from UrlTable */}
          {showFullDetailBtn && (
            <ViewFullDetailButton
              onClick={handleViewFullDetail}
              domain={site.domain}
              currentTheme={currentTheme}
            />
          )}
        </aside>
      </div>
    </>
  );
}

// ─── View Full Detail Button ──────────────────────────────────────────────────
function ViewFullDetailButton({ onClick, domain, currentTheme }) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -1 }}
      whileTap={{ scale: 0.97 }}
      onClick={onClick}
      className="w-full flex items-center justify-center gap-2.5 py-3 rounded-2xl transition-all duration-200"
      style={{
        background: `linear-gradient(135deg, ${currentTheme.accentGlow} 0%, ${currentTheme.bgInput} 100%)`,
        border: `1px solid ${currentTheme.accent}`,
        color: currentTheme.accent,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "11px", fontWeight: 700,
        letterSpacing: "0.1em", textTransform: "uppercase", cursor: "pointer",
        boxShadow: `0 0 20px ${currentTheme.accent}15, inset 0 1px 0 ${currentTheme.accent}20`,
      }}
    >
      <ExternalLink size={13} />
      View Full Detail
      {domain && (
        <span style={{ color: currentTheme.textSecondary, fontSize: "9px", fontWeight: 500, letterSpacing: "0.06em", marginLeft: 2 }}>
          · {domain}
        </span>
      )}
    </motion.button>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function GlassCard({ children, currentTheme }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}
      className="rounded-2xl p-5"
      style={{
        background: currentTheme.bgCard,
        border: `1px solid ${currentTheme.borderAccent}`,
        backdropFilter: "blur(16px)",
        boxShadow: currentTheme.shadow,
      }}
    >
      {children}
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, title, currentTheme }) {
  return (
    <div className="flex items-center gap-2">
      <div
        className="w-8 h-8 rounded-xl flex items-center justify-center border"
        style={{ borderColor: currentTheme.borderAccent, background: currentTheme.bgInput }}
      >
        <Icon size={14} style={{ color: currentTheme.accent }} />
      </div>
      <span style={{
        fontFamily: "'JetBrains Mono',monospace", fontSize: "9px",
        letterSpacing: "0.18em", textTransform: "uppercase", color: currentTheme.accent, fontWeight: 700,
      }}>
        {title}
      </span>
    </div>
  );
}

function UptimeRow({ label, pct, checks, currentTheme }) {
  const color   = uptimeColor(pct, currentTheme);
  const display = pct != null ? `${pct}%` : "—";
  return (
    <div
      className="rounded-xl px-3 py-3 space-y-1.5"
      style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderLight}` }}
    >
      <div className="flex items-center justify-between">
        <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: currentTheme.text, fontWeight: 600 }}>
          {label}
        </span>
        <span style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, fontSize: "13px", color, letterSpacing: "0.04em" }}>
          {display}
        </span>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background: currentTheme.bgCard }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: pct != null ? `${Math.min(100, pct)}%` : "0%" }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ height: "100%", background: color, opacity: 0.85 }}
        />
      </div>
      {checks != null && checks > 0 && (
        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "8px", color: currentTheme.textSecondary, letterSpacing: "0.06em" }}>
          based on {checks.toLocaleString()} checks
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label, dashed, currentTheme }) {
  return (
    <div className="flex items-center gap-1.5">
      <div style={{ width: 18, height: 2, background: dashed ? "transparent" : color, borderTop: dashed ? `2px dashed ${color}` : "none", opacity: 0.9 }} />
      <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", color: currentTheme.textSecondary, letterSpacing: "0.06em", fontWeight: 500 }}>
        {label}
      </span>
    </div>
  );
}