import React from "react";
import {
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function SiteReport({ site, logs, range = "24h", theme }) {
  const logsWithTs = logs.map((l) => ({ ...l, ts: new Date(l.timestamp).getTime() }));
  const now = Date.now();

  const computeUptime = (logsArray, windowMs) => {
    const since = now - windowMs;
    const slice = logsArray.filter((l) => l.ts >= since);
    if (!slice.length) return 0;
    const upCount = slice.filter((l) => l.status === "UP" || l.status === "SLOW").length;
    return Math.round((upCount / slice.length) * 10000) / 100;
  };

  const uptime24 = computeUptime(logsWithTs, 24 * 3600 * 1000);
  const uptime7 = computeUptime(logsWithTs, 7 * 24 * 3600 * 1000);
  const uptime30 = computeUptime(logsWithTs, 30 * 24 * 3600 * 1000);

  const rangeMs =
    range === "24h" ? 24 * 3600 * 1000 : range === "7d" ? 7 * 24 * 3600 * 1000 : 30 * 24 * 3600 * 1000;
  const filtered = logsWithTs.filter((l) => l.ts >= now - rangeMs);

  if (!filtered.length) return <p className="text-sm text-gray-500">No data in selected range.</p>;

  const series = filtered
    .sort((a, b) => a.ts - b.ts)
    .map((l) => ({
      time: new Date(l.timestamp).toLocaleString(),
      response: l.responseTimeMs ?? l.responseTime ?? 0,
      status: l.status,
    }));

  const uptimePercent = range === "24h" ? uptime24 : range === "7d" ? uptime7 : uptime30;
  const latestDown = [...filtered].reverse().find((l) => l.status === "DOWN");

  const colors = {
    UP: "#4ade80",
    DOWN: "#f87171",
    SLOW: "#facc15",
  };

  const currentStatus = filtered[filtered.length - 1]?.status || "CHECKING";

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
      <div className="lg:col-span-2 space-y-4">
        <div
          className="p-4 rounded-lg"
          style={{
            background: theme === "dark" ? "#1e1e1e" : "hsl(var(--card) / 0.04)",
            border: theme === "dark" ? "1px solid #444" : "1px solid hsl(var(--border) / 0.6)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Uptime (last {range})</div>
            <div className="text-sm font-medium" style={{ color: theme === "dark" ? "#fff" : "hsl(var(--card-foreground))" }}>
              {uptimePercent}%
            </div>
          </div>
          <div className="w-full h-3 rounded-full overflow-hidden" style={{ background: theme === "dark" ? "#2c2c2c" : "hsl(var(--card) / 0.02)" }}>
            <div
              style={{
                width: `${Math.min(100, Math.max(0, uptimePercent))}%`,
                height: "100%",
                background: theme === "dark" ? colors.UP : "linear-gradient(90deg, hsl(var(--chart-1)), hsl(var(--chart-2)))",
              }}
            />
          </div>
        </div>

        <div
          className="p-4 rounded-lg"
          style={{
            background: theme === "dark" ? "#1e1e1e" : "hsl(var(--card) / 0.04)",
            border: theme === "dark" ? "1px solid #444" : "1px solid hsl(var(--border) / 0.6)",
          }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="text-sm font-semibold">Response Time (last {range})</div>
            <div className="text-sm opacity-70">Shows the instant response in ms</div>
          </div>
          <div style={{ width: "100%", height: 220 }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 6 }}>
                <defs>
                  <linearGradient id={`grad-${site._id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={theme === "dark" ? colors.UP : "hsl(var(--chart-4))"} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={theme === "dark" ? colors.UP : "hsl(var(--chart-4))"} stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" strokeOpacity={theme === "dark" ? 0.2 : 0.06} />
                <XAxis dataKey="time" tick={{ fontSize: 10, fill: theme === "dark" ? "#fff" : undefined }} hide={series.length > 40} />
                <YAxis tick={{ fontSize: 11, fill: theme === "dark" ? "#fff" : undefined }} />
                <Tooltip />
                <Area type="monotone" dataKey="response" stroke={theme === "dark" ? colors.UP : "hsl(var(--chart-4))"} fill={`url(#grad-${site._id})`} />
                <Line type="monotone" dataKey="response" stroke={theme === "dark" ? colors.SLOW : "hsl(var(--chart-2))"} dot={false} strokeWidth={1.5} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <aside className="space-y-4">
        <div
          className="p-4 rounded-lg text-center"
          style={{
            background: theme === "dark" ? "#1e1e1e" : "hsl(var(--card) / 0.03)",
            border: theme === "dark" ? "1px solid #444" : "1px solid hsl(var(--border) / 0.6)",
          }}
        >
          <div className="text-sm opacity-70">Current Status</div>
          <div
            className="mt-3 inline-flex items-center gap-2 px-3 py-2 rounded-full"
            style={{
              background: theme === "dark" ? colors[currentStatus] + "33" : "hsl(var(--chart-1) / 0.12)",
              color: theme === "dark" ? colors[currentStatus] : "hsl(var(--chart-1))",
              fontSize: 18,
              fontWeight: 700,
            }}
          >
            {currentStatus}
          </div>
        </div>

        <div
          className="p-4 rounded-lg"
          style={{
            background: theme === "dark" ? "#1e1e1e" : "hsl(var(--card) / 0.03)",
            border: theme === "dark" ? "1px solid #444" : "1px solid hsl(var(--border) / 0.6)",
          }}
        >
          <div className="text-sm font-semibold mb-2">Uptime</div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-sm">Last 24 hours</span>
              <span style={{ color: theme === "dark" ? colors.UP : "hsl(var(--chart-1))" }}>{uptime24}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Last 7 days</span>
              <span style={{ color: theme === "dark" ? colors.UP : "hsl(var(--chart-1))" }}>{uptime7}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm">Last 30 days</span>
              <span style={{ color: theme === "dark" ? colors.UP : "hsl(var(--chart-1))" }}>{uptime30}%</span>
            </div>
          </div>
        </div>

        <div
          className="p-4 rounded-lg"
          style={{
            background: theme === "dark" ? "#1e1e1e" : "hsl(var(--card) / 0.03)",
            border: theme === "dark" ? "1px solid #444" : "1px solid hsl(var(--border) / 0.6)",
          }}
        >
          <div className="text-sm font-semibold mb-2">Latest downtime</div>
          {latestDown ? (
            <div className="text-sm text-left" style={{ color: theme === "dark" ? "#fff" : "hsl(var(--card-foreground) / 0.85)" }}>
              <div>Recorded: {new Date(latestDown.timestamp).toLocaleString()}</div>
              {/* <div className="mt-1 text-xs opacity-70">Details: {latestDown.message || latestDown.note || "—"}</div> */}
            </div>
          ) : (
            <div className="text-sm opacity-70">No downtimes in range</div>
          )}
        </div>
      </aside>
    </div>
  );
}
