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
import axios from "axios";
import {
  Activity,
  ShieldCheck,
  AlertTriangle,
  Server,
  Radar,
} from "lucide-react";

// ─── MAX chart points ─────────────────────────────────────────────────────────
const MAX_CHART_POINTS = 300;

function downsample(logs) {
  if (logs.length <= MAX_CHART_POINTS) return logs;
  const bucketSize = Math.ceil(logs.length / MAX_CHART_POINTS);
  const result = [];
  for (let i = 0; i < logs.length; i += bucketSize) {
    const bucket       = logs.slice(i, i + bucketSize);
    const validResp    = bucket.map((l) => l.responseTimeMs).filter((v) => v != null && v > 0);
    const avgResp      = validResp.length
      ? Math.round(validResp.reduce((a, b) => a + b, 0) / validResp.length)
      : 0;
    const last         = bucket[bucket.length - 1];
    const downCount    = bucket.filter((l) => l.status === "DOWN").length;
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
const CustomTooltip = ({ active, payload, label, range }) => {
  if (!active || !payload?.length) return null;
  const pt = payload[0]?.payload;
  if (!pt) return null;
  const statusColors = { UP: "#34d399", DOWN: "#f87171", SLOW: "#fbbf24" };
  const sc       = statusColors[pt.status] || "#94a3b8";
  const fullTime = pt.timestamp ? new Date(pt.timestamp).toLocaleString() : label;
  return (
    <div style={{ background:"rgba(2,6,16,0.97)", border:"1px solid rgba(56,189,248,0.18)", borderRadius:"12px", padding:"10px 14px", fontFamily:"'JetBrains Mono',monospace", fontSize:"11px", backdropFilter:"blur(20px)", minWidth:170, boxShadow:"0 4px 24px rgba(0,0,0,0.4)" }}>
      <div style={{ color:"#38bdf8", fontSize:"9px", letterSpacing:"0.08em", textTransform:"uppercase", marginBottom:6 }}>{fullTime}</div>
      <div style={{ color:"rgba(226,232,240,0.9)", marginBottom:4 }}>Response: <span style={{ color:"#38bdf8", fontWeight:700 }}>{pt.responseTimeMs != null ? `${pt.responseTimeMs} ms` : "—"}</span></div>
      <div>Status: <span style={{ color:sc, fontWeight:700 }}>{pt.status || "—"}</span></div>
      {pt._isBucket && (
        <div style={{ color:"rgba(148,163,184,0.45)", fontSize:"9px", marginTop:5, borderTop:"1px solid rgba(56,189,248,0.07)", paddingTop:5 }}>
          avg of {pt._bucketSize} checks
          {pt._downCount > 0 && <span style={{ color:"#f87171" }}> · {pt._downCount} down</span>}
        </div>
      )}
    </div>
  );
};

function uptimeColor(pct) {
  if (pct === null || pct === undefined) return "#94a3b8";
  if (pct >= 99) return "#34d399";
  if (pct >= 95) return "#38bdf8";
  if (pct >= 90) return "#fbbf24";
  return "#f87171";
}

// ─── Global Check Loading Skeleton ───────────────────────────────────────────
function GlobalCheckSkeleton() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      style={{
        position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
        background: "rgba(0,0,0,0.75)",
        display: "flex", alignItems: "center", justifyContent: "center",
        zIndex: 9999, backdropFilter: "blur(6px)",
      }}
    >
      <motion.div
        initial={{ scale: 0.92, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        style={{
          background: "rgba(3,7,18,0.97)",
          border: "1px solid rgba(56,189,248,0.2)",
          borderRadius: "20px",
          padding: "36px 40px",
          width: "420px",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(56,189,248,0.08)",
        }}
      >
        {/* Spinner + title */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "28px" }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
            style={{
              width: "36px", height: "36px", borderRadius: "50%",
              border: "3px solid rgba(56,189,248,0.15)",
              borderTopColor: "#38bdf8",
              flexShrink: 0,
            }}
          />
          <div>
            <div style={{ fontFamily: "'Orbitron',sans-serif", fontSize: "16px", fontWeight: 700, color: "white" }}>
              Running Global Check…
            </div>
            <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "10px", color: "rgba(56,189,248,0.5)", marginTop: "2px" }}>
              Sending HEAD requests to all regions
            </div>
          </div>
        </div>

        {/* Skeleton rows */}
        {["North America", "Europe", "Asia", "South America", "Australia", "Africa"].map((r, i) => (
          <motion.div
            key={r}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.07 }}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "10px 14px", marginBottom: "8px", borderRadius: "10px",
              background: "rgba(56,189,248,0.04)",
              border: "1px solid rgba(56,189,248,0.08)",
            }}
          >
            {/* Dot pulse */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <motion.div
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.18 }}
                style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#38bdf8" }}
              />
              <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "11px", color: "rgba(148,163,184,0.7)" }}>
                {r}
              </span>
            </div>
            {/* Skeleton shimmer bar */}
            <motion.div
              animate={{ opacity: [0.2, 0.5, 0.2] }}
              transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.12 }}
              style={{ width: "52px", height: "10px", borderRadius: "5px", background: "rgba(56,189,248,0.2)" }}
            />
          </motion.div>
        ))}

        <div style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: "9px", color: "rgba(148,163,184,0.3)", textAlign: "center", marginTop: "18px", letterSpacing: "0.06em" }}>
          This may take up to 20 seconds
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Status badge helper ──────────────────────────────────────────────────────
function StatusBadge({ status, size = "sm" }) {
  const colors = { UP: "#34d399", DOWN: "#f87171", SLOW: "#fbbf24", UNKNOWN: "#94a3b8" };
  const color  = colors[status] || "#94a3b8";
  const fs     = size === "lg" ? "15px" : "11px";
  return (
    <span style={{
      display: "inline-flex", alignItems: "center", gap: "6px",
      padding: size === "lg" ? "6px 14px" : "4px 10px", borderRadius: "8px",
      background: `${color}14`, border: `1px solid ${color}30`, color,
      fontFamily: "'JetBrains Mono',monospace", fontSize: fs, fontWeight: 600,
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
}) {
  const [isCheckingGlobal, setIsCheckingGlobal]     = React.useState(false);
  const [globalCheckModalData, setGlobalCheckModalData] = React.useState(null);
  const [globalCheckError, setGlobalCheckError]     = React.useState(null);

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
  const statusColorMap = { UP: "#34d399", DOWN: "#f87171", SLOW: "#fbbf24" };
  const statusColor    = statusColorMap[currentStatus] || "#94a3b8";

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
      <div className="rounded-2xl p-8 text-center" style={{ background:"rgba(3,7,18,0.68)", border:"1px solid rgba(56,189,248,0.08)", backdropFilter:"blur(14px)" }}>
        <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"11px", color:"rgba(148,163,184,0.5)", letterSpacing:"0.06em", textTransform:"uppercase" }}>
          No data available for the selected range
        </p>
      </div>
    );
  }

  return (
    <>
      {/* ── Loading skeleton overlay while check is running ── */}
      <AnimatePresence>
        {isCheckingGlobal && <GlobalCheckSkeleton />}
      </AnimatePresence>

      {/* ── Result modal ── */}
      <AnimatePresence>
        {globalCheckModalData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setGlobalCheckModalData(null)}
            style={{ position:"fixed", top:0, left:0, right:0, bottom:0, background:"rgba(0,0,0,0.7)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:9999, backdropFilter:"blur(4px)" }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background:"rgba(3,7,18,0.95)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:"20px", backdropFilter:"blur(20px)", boxShadow:"0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(56,189,248,0.1)", padding:"32px", maxWidth:"600px", width:"90%", maxHeight:"80vh", overflowY:"auto" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <h2 style={{ fontFamily:"'Orbitron',sans-serif", fontSize:"20px", fontWeight:700, color:"white", marginBottom:"4px" }}>
                    🌍 Global Status Check
                  </h2>
                  <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"11px", color:"rgba(148,163,184,0.6)" }}>
                    {globalCheckModalData.domain}
                  </p>
                </div>
                <motion.button whileHover={{ scale:1.1 }} whileTap={{ scale:0.9 }} onClick={() => setGlobalCheckModalData(null)}
                  style={{ background:"rgba(56,189,248,0.1)", border:"1px solid rgba(56,189,248,0.2)", borderRadius:"8px", padding:"8px 12px", color:"#38bdf8", cursor:"pointer", fontFamily:"'JetBrains Mono',monospace", fontSize:"18px" }}>
                  ✕
                </motion.button>
              </div>

              {/* Live check result banner */}
              {globalCheckModalData.liveStatus && (
                <div className="mb-4 p-3 rounded-xl" style={{ background:"rgba(129,140,248,0.06)", border:"1px solid rgba(129,140,248,0.15)" }}>
                  <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", color:"rgba(129,140,248,0.5)", marginBottom:"6px", letterSpacing:"0.06em" }}>
                    LIVE HTTP CHECK (server-side)
                  </p>
                  <div style={{ display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
                    <StatusBadge status={globalCheckModalData.liveStatus} />
                    {globalCheckModalData.liveStatusCode && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"10px", color:"rgba(148,163,184,0.5)" }}>
                        HTTP {globalCheckModalData.liveStatusCode}
                      </span>
                    )}
                    {globalCheckModalData.liveResponseTime != null && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"10px", color:"#38bdf8" }}>
                        {globalCheckModalData.liveResponseTime} ms
                      </span>
                    )}
                    {globalCheckModalData.methodUsed && (
                      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", color:"rgba(148,163,184,0.35)", padding:"2px 7px", borderRadius:"4px", background:"rgba(255,255,255,0.03)", border:"1px solid rgba(255,255,255,0.06)" }}>
                        via {globalCheckModalData.methodUsed}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Aggregated global status */}
              <div className="mb-6 p-4 rounded-xl" style={{ background:"rgba(56,189,248,0.08)", border:"1px solid rgba(56,189,248,0.15)" }}>
                <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"10px", color:"rgba(56,189,248,0.5)", marginBottom:"8px", letterSpacing:"0.06em" }}>
                  AGGREGATED GLOBAL STATUS
                </p>
                <div style={{ display:"flex", alignItems:"center", gap:"12px", flexWrap:"wrap" }}>
                  <StatusBadge status={globalCheckModalData.globalStatus} size="lg" />
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"11px", color:"rgba(148,163,184,0.6)" }}>
                    {new Date(globalCheckModalData.checkTimestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Regional breakdown */}
              {Array.isArray(globalCheckModalData.regionalBreakdown) && globalCheckModalData.regionalBreakdown.length > 0 && (
                <>
                  <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"10px", color:"rgba(56,189,248,0.5)", marginBottom:"12px", letterSpacing:"0.06em" }}>
                    REGIONAL BREAKDOWN
                  </p>
                  <div className="space-y-2">
                    {globalCheckModalData.regionalBreakdown.map((region, idx) => {
                      const colors = { UP:"#34d399", DOWN:"#f87171", SLOW:"#fbbf24", UNKNOWN:"#94a3b8" };
                      const color  = colors[region.status] || "#94a3b8";
                      return (
                        <motion.div
                          key={idx}
                          initial={{ opacity:0, x:-10 }} animate={{ opacity:1, x:0 }}
                          transition={{ delay: idx * 0.05 }}
                          className="p-3 rounded-lg"
                          style={{ background:`${color}12`, border:`1px solid ${color}30` }}
                        >
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div style={{ width:"8px", height:"8px", borderRadius:"50%", background:color, boxShadow:`0 0 8px ${color}`, flexShrink:0 }} />
                              <div className="flex-1 min-w-0">
                                <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"11px", fontWeight:600, color }}>
                                  {region.region}
                                </p>
                                <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", color:"rgba(148,163,184,0.5)" }}>
                                  {region.lastCheckedAt ? new Date(region.lastCheckedAt).toLocaleTimeString() : "Never checked"}
                                </p>
                              </div>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"10px", color, fontWeight:600 }}>{region.status}</p>
                              {region.responseTimeMs != null && (
                                <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", color:"rgba(148,163,184,0.5)" }}>{region.responseTimeMs}ms</p>
                              )}
                              {region.statusCode && (
                                <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", color:"rgba(148,163,184,0.5)" }}>HTTP {region.statusCode}</p>
                              )}
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </>
              )}

              {/* No regions message */}
              {(!globalCheckModalData.regionalBreakdown || globalCheckModalData.regionalBreakdown.length === 0) && (
                <div style={{ padding:"16px", borderRadius:"10px", background:"rgba(148,163,184,0.04)", border:"1px solid rgba(148,163,184,0.1)", textAlign:"center" }}>
                  <p style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"10px", color:"rgba(148,163,184,0.45)", letterSpacing:"0.06em" }}>
                    No regions assigned — showing direct check result
                  </p>
                </div>
              )}

              <motion.button
                whileHover={{ scale:1.02 }} whileTap={{ scale:0.98 }}
                onClick={() => setGlobalCheckModalData(null)}
                style={{ width:"100%", marginTop:"24px", padding:"12px", borderRadius:"12px", background:"rgba(56,189,248,0.12)", border:"1px solid rgba(56,189,248,0.2)", color:"#38bdf8", fontFamily:"'JetBrains Mono',monospace", fontSize:"11px", fontWeight:600, cursor:"pointer", letterSpacing:"0.06em" }}
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
            initial={{ opacity:0, y:-20 }} animate={{ opacity:1, y:0 }} exit={{ opacity:0, y:-20 }}
            style={{ position:"fixed", top:"24px", left:"50%", transform:"translateX(-50%)", zIndex:10000, background:"rgba(248,113,113,0.12)", border:"1px solid rgba(248,113,113,0.3)", borderRadius:"12px", padding:"12px 20px", fontFamily:"'JetBrains Mono',monospace", fontSize:"11px", color:"#f87171", backdropFilter:"blur(16px)", display:"flex", alignItems:"center", gap:"10px" }}
          >
            <span>⚠</span>
            {globalCheckError}
            <button onClick={() => setGlobalCheckError(null)} style={{ marginLeft:"8px", background:"none", border:"none", color:"#f87171", cursor:"pointer", fontSize:"14px" }}>✕</button>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="w-full grid grid-cols-1 xl:grid-cols-3 gap-5 items-start">
        {/* ── LEFT: chart area ── */}
        <div className="xl:col-span-2 space-y-5">

          {/* Uptime bar */}
          <GlassCard>
            <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
              <SectionTitle icon={ShieldCheck} title={`UPTIME · ${rangeLabel}`} />
              <div style={{ fontFamily:"'Orbitron',sans-serif", fontWeight:700, fontSize:"20px", color: primaryUptime != null ? uptimeColor(primaryUptime) : "#94a3b8", letterSpacing:"0.04em" }}>
                {primaryUptime != null ? `${primaryUptime}%` : "—"}
              </div>
            </div>
            <div className="w-full h-2.5 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.04)", border:"1px solid rgba(56,189,248,0.07)" }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, primaryUptime ?? 0))}%` }}
                transition={{ duration: 0.9, ease: "easeOut" }}
                style={{ height:"100%", background:"linear-gradient(90deg,#34d399 0%,#38bdf8 100%)", boxShadow:"0 0 10px rgba(52,211,153,0.3)" }}
              />
            </div>
            <div className="mt-2 flex items-center justify-between flex-wrap gap-1" style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", color:"rgba(148,163,184,0.4)", letterSpacing:"0.06em", textTransform:"uppercase" }}>
              <span>Availability index · {rangeLabel}</span>
              <span>
                {sortedLogs.length.toLocaleString()} checks
                {chartLogs.length < sortedLogs.length && ` · chart sampled to ${chartLogs.length} pts`}
              </span>
            </div>
          </GlassCard>

          {/* Response time chart */}
          <GlassCard>
            <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
              <SectionTitle icon={Activity} title={`RESPONSE TIME · ${rangeLabel}`} />
              <div className="flex items-center gap-3">
                {stats.avgResponse > 0 && (
                  <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"10px", color:"rgba(56,189,248,0.65)", letterSpacing:"0.06em" }}>
                    avg {stats.avgResponse} ms
                  </span>
                )}
                <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"10px", color:"rgba(148,163,184,0.4)", letterSpacing:"0.06em", textTransform:"uppercase" }}>
                  latency (ms)
                </span>
              </div>
            </div>
            <div style={{ width:"100%", height:280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={series} margin={{ top:6, right:12, left:0, bottom:4 }}>
                  <defs>
                    <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor="#38bdf8" stopOpacity={0.45} />
                      <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.07)" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize:9, fill:"rgba(148,163,184,0.5)", fontFamily:"JetBrains Mono" }} axisLine={false} tickLine={false} hide={series.length > 60} interval="preserveStartEnd" />
                  <YAxis dataKey="responseTimeMs" tick={{ fontSize:9, fill:"rgba(148,163,184,0.5)", fontFamily:"JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}ms`} width={52} />
                  <Tooltip content={<CustomTooltip range={range} />} cursor={{ stroke:"rgba(56,189,248,0.15)", strokeWidth:1, strokeDasharray:"4 4" }} />
                  <Area type="monotone" dataKey="responseTimeMs" stroke="#38bdf8" strokeWidth={2} fill={`url(#${gradientId})`} dot={false} activeDot={{ r:5, fill:"#38bdf8", stroke:"rgba(56,189,248,0.3)", strokeWidth:3 }} isAnimationActive={series.length < 400} />
                  {downEvents.map((pt, i) => (
                    <ReferenceLine key={i} x={pt.label} stroke="rgba(248,113,113,0.4)" strokeWidth={1} strokeDasharray="3 3" />
                  ))}
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-3 flex items-center gap-4 flex-wrap">
              <LegendItem color="#38bdf8" label="Response time" />
              {downEvents.length > 0 && <LegendItem color="#f87171" dashed label="Downtime event" />}
            </div>
          </GlassCard>
        </div>

        {/* ── RIGHT: stats panel ── */}
        <aside className="space-y-5">

          {/* Current Status */}
          <GlassCard>
            <SectionTitle icon={Radar} title="CURRENT STATUS" />
            <div className="flex justify-center mt-4 gap-3 flex-wrap">
              <div className="inline-flex items-center gap-2.5 px-5 py-2.5 rounded-full" style={{ background:`${statusColor}12`, border:`1px solid ${statusColor}30`, color:statusColor }}>
                <motion.span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ background:statusColor, boxShadow:`0 0 8px ${statusColor}` }}
                  animate={currentStatus === "DOWN" ? { opacity:[1,0.2,1] } : { scale:[1,1.3,1] }}
                  transition={{ duration:1.2, repeat:Infinity }}
                />
                <span style={{ fontFamily:"'Orbitron',sans-serif", fontWeight:700, fontSize:"15px", letterSpacing:"0.08em" }}>
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
                  background: isCheckingGlobal ? "rgba(56,189,248,0.2)" : "rgba(129,140,248,0.12)",
                  border:     isCheckingGlobal ? "1px solid rgba(56,189,248,0.4)" : "1px solid rgba(129,140,248,0.3)",
                  color:      isCheckingGlobal ? "#38bdf8" : "#818cf8",
                  cursor:     isCheckingGlobal ? "wait" : "pointer",
                  fontFamily: "'JetBrains Mono',monospace",
                  fontSize:   "12px",
                  fontWeight: 600,
                  letterSpacing: "0.06em",
                }}
              >
                {isCheckingGlobal ? (
                  <>
                    <motion.span animate={{ rotate:360 }} transition={{ duration:1, repeat:Infinity, ease:"linear" }}>⟳</motion.span>
                    Checking…
                  </>
                ) : (
                  <><span>🌍</span> Global Check</>
                )}
              </motion.button>
            </div>

            {sortedLogs.length > 0 && (
              <div className="mt-3 text-center" style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", color:"rgba(148,163,184,0.38)", letterSpacing:"0.06em" }}>
                Last check {new Date(sortedLogs[sortedLogs.length - 1].timestamp).toLocaleString()}
              </div>
            )}
          </GlassCard>

          {/* Uptime Breakdown */}
          <GlassCard>
            <SectionTitle icon={Server} title="UPTIME BREAKDOWN" />
            <div className="space-y-3 mt-4">
              <UptimeRow label="Last 24 Hours" pct={uptime24h} checks={stats.checks24h} />
              <UptimeRow label="Last 7 Days"   pct={uptime7d}  checks={stats.checks7d}  />
              <UptimeRow label="Last 30 Days"  pct={uptime30d} checks={stats.checks30d} />
            </div>
          </GlassCard>

          {/* Latest Downtime */}
          <GlassCard>
            <SectionTitle icon={AlertTriangle} title="LATEST DOWNTIME" />
            <div className="mt-4">
              {latestDown ? (
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"11px", color:"rgba(226,232,240,0.85)", lineHeight:1.9 }}>
                  <div className="mb-2 uppercase text-[9px] tracking-widest" style={{ color:"#f87171" }}>Incident Recorded</div>
                  <div>{new Date(latestDown.timestamp).toLocaleString()}</div>
                  {latestDown.responseTimeMs > 0 && (
                    <div style={{ color:"rgba(148,163,184,0.55)", fontSize:"10px", marginTop:2 }}>Response: {latestDown.responseTimeMs} ms</div>
                  )}
                  {latestDown.statusCode && (
                    <div style={{ color:"rgba(148,163,184,0.55)", fontSize:"10px" }}>HTTP {latestDown.statusCode}</div>
                  )}
                </div>
              ) : (
                <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"11px", color:"rgba(148,163,184,0.5)", letterSpacing:"0.04em", textTransform:"uppercase" }}>
                  No downtimes in selected range
                </div>
              )}
            </div>
          </GlassCard>

        </aside>
      </div>
    </>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────
function GlassCard({ children }) {
  return (
    <motion.div initial={{ opacity:0, y:10 }} animate={{ opacity:1, y:0 }} transition={{ duration:0.3 }}
      className="rounded-2xl p-5"
      style={{ background:"rgba(3,7,18,0.7)", border:"1px solid rgba(56,189,248,0.08)", backdropFilter:"blur(16px)", boxShadow:"0 0 20px rgba(56,189,248,0.02)" }}>
      {children}
    </motion.div>
  );
}

function SectionTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-2">
      <div className="w-8 h-8 rounded-xl flex items-center justify-center border" style={{ borderColor:"rgba(56,189,248,0.1)", background:"rgba(255,255,255,0.02)" }}>
        <Icon size={14} className="text-sky-400" />
      </div>
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", letterSpacing:"0.18em", textTransform:"uppercase", color:"rgba(56,189,248,0.5)" }}>
        {title}
      </span>
    </div>
  );
}

function UptimeRow({ label, pct, checks }) {
  const color   = uptimeColor(pct);
  const display = pct != null ? `${pct}%` : "—";
  return (
    <div className="rounded-xl px-3 py-3 space-y-1.5" style={{ background:"rgba(255,255,255,0.02)", border:"1px solid rgba(56,189,248,0.06)" }}>
      <div className="flex items-center justify-between">
        <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"10px", color:"rgba(148,163,184,0.7)" }}>{label}</span>
        <span style={{ fontFamily:"'Orbitron',sans-serif", fontWeight:700, fontSize:"13px", color, letterSpacing:"0.04em" }}>{display}</span>
      </div>
      <div className="w-full h-1 rounded-full overflow-hidden" style={{ background:"rgba(255,255,255,0.04)" }}>
        <motion.div initial={{ width:0 }} animate={{ width: pct != null ? `${Math.min(100,pct)}%` : "0%" }} transition={{ duration:0.7, ease:"easeOut" }} style={{ height:"100%", background:color, opacity:0.7 }} />
      </div>
      {checks != null && checks > 0 && (
        <div style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"8px", color:"rgba(148,163,184,0.32)", letterSpacing:"0.06em" }}>
          based on {checks.toLocaleString()} checks
        </div>
      )}
    </div>
  );
}

function LegendItem({ color, label, dashed }) {
  return (
    <div className="flex items-center gap-1.5">
      <div style={{ width:18, height:2, background: dashed ? "transparent" : color, borderTop: dashed ? `2px dashed ${color}` : "none", opacity:0.8 }} />
      <span style={{ fontFamily:"'JetBrains Mono',monospace", fontSize:"9px", color:"rgba(148,163,184,0.45)", letterSpacing:"0.06em" }}>{label}</span>
    </div>
  );
}