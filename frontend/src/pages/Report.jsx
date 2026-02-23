import React, { useEffect, useState } from "react";
import axios from "axios";
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
import SiteReport from "../components/SiteReport";

const LOG_API = "http://localhost:5000/api/uptime-logs/all"; // Backend route

// SiteReport component moved to /src/components/SiteReport.jsx
// ================= Report Component =================
export default function Report({ urls, reportSearch, setReportSearch, theme }) {
  const [allLogs, setAllLogs] = useState([]);

  useEffect(() => {
    const fetchAllLogs = async () => {
      try {
        const token = localStorage.getItem("loginToken");
        if (!token) return;

        const res = await axios.get(LOG_API, {
          headers: { Authorization: `Bearer ${token}` },
        });

        setAllLogs(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }
    };

    fetchAllLogs();
  }, []);

  const logsBySite = allLogs.reduce((acc, log) => {
    if (!acc[log.siteId]) acc[log.siteId] = [];
    acc[log.siteId].push(log);
    return acc;
  }, {});

  const filteredSites = urls.filter(
    (u) =>
      (u.domain || "").toLowerCase().includes(reportSearch.toLowerCase()) ||
      (u.url || "").toLowerCase().includes(reportSearch.toLowerCase())
  );

  return (
    <div className="mb-4">
      <div className="mb-6 max-w-sm relative">
        <input
          value={reportSearch}
          onChange={(e) => setReportSearch(e.target.value)}
          placeholder="Search domain or URL"
          className={`w-full p-2 border rounded ${
            theme === "dark"
              ? "bg-gray-800 text-white border-gray-600"
              : "bg-white text-gray-900 border-gray-300"
          }`}
        />
      </div>

      {filteredSites.map((site) => (
        <div
          key={site._id}
          className={`mb-8 p-4 rounded-lg shadow ${
            theme === "dark" ? "bg-gray-900" : "bg-white"
          }`}
        >
          <h2 className="font-semibold mb-2">
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline"
            >
              {site.domain}
            </a>
          </h2>

          <SiteReport
            site={site}
            logs={logsBySite[site._id] || []}
            theme={theme}
          />
        </div>
      ))}

      {filteredSites.length === 0 && (
        <p className="text-gray-500">No websites found.</p>
      )}
    </div>
  );
}