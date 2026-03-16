import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import SiteReport from "../components/SiteReport";
import ExportButtons from "../components/ExportButtons";

const API_URL = import.meta.env.VITE_API_URL;

export default function Report({ urls, reportSearch, setReportSearch, theme }) {
  const [allLogs, setAllLogs] = useState([]);
  const [range, setRange] = useState("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [tempFrom, setTempFrom] = useState("");
  const [tempTo, setTempTo] = useState("");
  const applyCustomRange = () => {
  if (!tempFrom || !tempTo) return;

  setCustomFrom(tempFrom);
  setCustomTo(tempTo);
};
  // ================= Fetch Logs =================
  useEffect(() => {
    const fetchAllLogs = async () => {
      try {
        const token = localStorage.getItem("loginToken");
        if (!token) return;

       const res = await axios.get(`${API_URL}/uptime-logs/all`, {
  headers: { Authorization: `Bearer ${token}` },
});

        setAllLogs(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }
    };

    fetchAllLogs();
  }, []);

  // ================= Filter Logs By Date Range =================
  const filteredLogsByRange = useMemo(() => {
  const now = Date.now();

  if (range === "custom" && customFrom && customTo) {
    const from = new Date(customFrom).getTime();
    const to = new Date(customTo).getTime();

    return allLogs.filter((log) => {
      const ts = new Date(log.timestamp).getTime();
      return ts >= from && ts <= to;
    });
  }

  const rangeMs =
    range === "24h"
      ? 24 * 60 * 60 * 1000
      : range === "7d"
      ? 7 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;

  return allLogs.filter(
    (log) => now - new Date(log.timestamp).getTime() <= rangeMs
  );
}, [allLogs, range, customFrom, customTo]);

  // ================= Group Logs By Site =================
  const logsBySite = useMemo(() => {
    return filteredLogsByRange.reduce((acc, log) => {
      if (!acc[log.siteId]) acc[log.siteId] = [];
      acc[log.siteId].push(log);
      return acc;
    }, {});
  }, [filteredLogsByRange]);

  // ================= Filter Sites By Search =================
  const filteredSites = useMemo(() => {
    return urls.filter(
      (u) =>
        (u.domain || "")
          .toLowerCase()
          .includes(reportSearch.toLowerCase()) ||
        (u.url || "")
          .toLowerCase()
          .includes(reportSearch.toLowerCase())
    );
  }, [urls, reportSearch]);

  // ================= Helper Functions =================
  const calculateStats = (logs = []) => {
    const total = logs.length;
    const up = logs.filter((l) => l.status === "UP").length;
    const down = logs.filter((l) => l.status === "DOWN").length;
    const uptimePercent = total ? ((up / total) * 100).toFixed(2) : 0;

    return { total, up, down, uptimePercent };
  };

  const getResponseStats = (logs = []) => {
  if (!logs.length) return { avg: 0, min: 0, max: 0 };

  // Extract valid numeric response times
  const times = logs
    .map((l) => l.responseTimeMs ?? l.responseTime)
    .filter(
      (t) =>
        typeof t === "number" &&
        !isNaN(t) &&
        t > 0
    );

  if (!times.length) return { avg: 0, min: 0, max: 0 };

  const total = times.reduce((a, b) => a + b, 0);

  return {
    avg: Math.round(total / times.length),
    min: Math.min(...times),
    max: Math.max(...times),
  };
};
  // ================= UI =================
  return (
    <div className="mb-6">
      {/* Top Controls */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4 w-full md:w-auto">
          <input
            value={reportSearch}
            onChange={(e) => setReportSearch(e.target.value)}
            placeholder="Search domain or URL"
            className={`p-2 border rounded w-full md:w-80 ${
              theme === "dark"
                ? "bg-gray-800 text-white border-gray-600"
                : "bg-white text-gray-900 border-gray-300"
            }`}
          />

          <select
            value={range}
            onChange={(e) => setRange(e.target.value)}
            className="p-2 border rounded"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="custom">Custom Range</option>
          </select>
        </div>
      {range === "custom" && (
  <div
    className={`mt-3 p-3 rounded-lg flex flex-col items-center gap-3
    ${theme === "dark" ? "bg-gray-900 text-white" : "bg-gray-100 text-gray-800"}`}
  >
    <div className="flex items-end gap-3">
      
      {/* FROM */}
      <div className="flex flex-col text-sm">
        <label className="text-xs">From</label>
        <input
          type="date"
          value={tempFrom}
          onChange={(e) => setTempFrom(e.target.value)}
          className={`p-1.5 rounded border text-sm ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        />
      </div>

      {/* TO */}
      <div className="flex flex-col text-sm">
        <label className="text-xs">To</label>
        <input
          type="date"
          value={tempTo}
          onChange={(e) => setTempTo(e.target.value)}
          className={`p-1.5 rounded border text-sm ${
            theme === "dark"
              ? "bg-gray-800 border-gray-600"
              : "bg-white border-gray-300"
          }`}
        />
      </div>

      {/* APPLY */}
      <button
        onClick={applyCustomRange}
        className="px-4 py-1.5 rounded text-sm text-white bg-blue-600 hover:bg-blue-700"
      >
        Apply
      </button>

    </div>
  </div>
)}

        <div className="flex items-center justify-end">
          <ExportButtons urls={filteredSites} logsBySite={logsBySite} theme={theme} />
        </div>
      </div>

      {/* Site Cards */}
      {filteredSites.map((site) => {
        const logs = logsBySite[site._id] || [];
        const stats = calculateStats(logs);
        const response = getResponseStats(logs);
        const lastLog = logs.slice(-1)[0];

        const isDown =
          lastLog && lastLog.status === "DOWN";

        return (
          <div
            key={site._id}
            className={`mb-8 p-6 rounded-xl shadow-lg ${
              theme === "dark" ? "bg-gray-900" : "bg-white"
            }`}
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <div>
                <a
                  href={site.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-lg font-semibold text-blue-600 hover:underline"
                >
                  {site.domain}
                </a>
              </div>

              <span
                className={`px-3 py-1 text-xs font-bold rounded-full ${
                  isDown
                    ? "bg-red-500 text-white"
                    : "bg-green-500 text-white"
                }`}
              >
                {isDown ? "DOWN" : "UP"}
              </span>
            </div>

            {/* Metrics Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-4">
              <div>
                {/* <p className="font-semibold">
                  Uptime: {stats.uptimePercent}%
                </p> */}
                <p>Total Checks: {stats.total}</p>
              </div>

              <div>
                <p>Failures: {stats.down}</p>
                {/* <p>
                  Last Checked:{" "}
                  {lastLog
                    ? new Date(lastLog.timestamp).toLocaleString()
                    : "N/A"}
                </p> */}
              </div>

              <div>
                <p>Avg: {response.avg} ms</p>
                <p>Fastest: {response.min} ms</p>
              </div>

              <div>
                <p>Slowest: {response.max} ms</p>
              </div>
            </div>

            {/* Charts Section */}
            <SiteReport
              site={site}
              logs={logs}
              theme={theme}
              range={range}
              customFrom={customFrom}
              customTo={customTo}
            />
          </div>
        );
      })}

      {filteredSites.length === 0 && (
        <p className="text-gray-500">No websites found.</p>
      )}
    </div>
  );
}