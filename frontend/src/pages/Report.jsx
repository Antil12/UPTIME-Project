import React, { useEffect, useState, useMemo } from "react";
import axios from "axios";
import SiteReport from "../components/SiteReport";
import ExportButtons from "../components/ExportButtons";

const API_URL = import.meta.env.VITE_API_URL;

export default function Report({ urls, reportSearch, setReportSearch, theme }) {

  // ================= STATES =================
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [logs, setLogs] = useState([]);

  const LIMIT = 50; // logs per request
  const SITE_PER_PAGE = 5;

  const [range, setRange] = useState("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [tempFrom, setTempFrom] = useState("");
  const [tempTo, setTempTo] = useState("");
  const [statsMap, setStatsMap] = useState({});
  

  // ================= FILTERED SITES (FIRST) =================
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

  // ================= PAGINATED SITES (AFTER filteredSites) =================
  const paginatedSites = useMemo(() => {
    const start = (page - 1) * SITE_PER_PAGE;
    return filteredSites.slice(start, start + SITE_PER_PAGE);
  }, [filteredSites, page]);

  // ================= TOTAL PAGES =================
  useEffect(() => {
    setTotalPages(Math.ceil(filteredSites.length / SITE_PER_PAGE));
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

  

useEffect(() => {
  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("loginToken");
      if (!token) return;

      const siteIds = paginatedSites.map((s) => s._id).join(",");

      const res = await axios.get(`${API_URL}/uptime-logs`, {
        params: {
          
          range,
          from: customFrom,
          to: customTo,
          siteIds,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      setLogs(res.data.data);
      
    } catch (err) {
      console.error(err);
    }
  };

  fetchLogs();
}, [ range, customFrom, customTo, paginatedSites]);

useEffect(() => {
  const fetchStats = async () => {
    try {
      const token = localStorage.getItem("loginToken");
      if (!token) return;

      const siteIds = paginatedSites.map((s) => s._id).join(",");

      const res = await axios.get(`${API_URL}/uptime-logs/analytics`, {
        params: {
          range,
          from: customFrom,
          to: customTo,
          siteIds,
        },
        headers: { Authorization: `Bearer ${token}` },
      });

      const map = {};
      res.data.data.forEach((s) => {
        map[s.siteId] = s;
      });

      setStatsMap(map);

    } catch (err) {
      console.error(err);
    }
  };

  fetchStats();
}, [range, customFrom, customTo, paginatedSites]);


  const logsBySite = useMemo(() => {
  const grouped = {};
  logs.forEach((log) => {
    const key = log.siteId?.toString(); 
    if (!grouped[key]) grouped[key] = [];
grouped[key].push(log);
  });
  return grouped;
}, [logs]);

  

  
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
          <ExportButtons 
  urls={filteredSites}
  theme={theme}
  range={range}
  customFrom={customFrom}
  customTo={customTo}
/>
        </div>
      </div>

      {/* Site Cards */}
      {paginatedSites.map((site) => {
        const logs = logsBySite[site._id] || [];
        const stats = statsMap[site._id] || {};
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
                <p>Total Checks: {stats.totalChecks || 0}</p>
              </div>

              <div>
                <p>Failures: {stats.downChecks || 0}</p>
                {/* <p>
                  Last Checked:{" "}
                  {lastLog
                    ? new Date(lastLog.timestamp).toLocaleString()
                    : "N/A"}
                </p> */}
              </div>

              <div>
                
                <p>Avg: {stats.avgResponse || 0} ms</p>
                <p>Fastest: {stats.minResponse || 0} ms</p>
              </div>

              <div>
                <p>Slowest: {stats.maxResponse || 0} ms</p>
              </div>
            </div>
           <div className="flex justify-center gap-3 mt-6">
 
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

       <button
    disabled={page === 1}
    onClick={() => setPage((p) => p - 1)}
    className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
  >
    Prev
  </button>

  <span className="px-3 py-1">
    Page {page} of {totalPages}
  </span>

  <button
    disabled={page === totalPages}
    onClick={() => setPage((p) => p + 1)}
    className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
  >
    Next
  </button>
    </div>

    
  );
}