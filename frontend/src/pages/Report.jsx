import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const LOG_API = "http://localhost:5000/api/uptime-logs/all";

function SiteReport({ site, logs, theme }) {
  const chartData = logs.map((log) => ({
    time: new Date(log.timestamp).toLocaleTimeString(),
    UP: log.status === "UP" || log.status === "SLOW" ? 1 : 0,
    DOWN: log.status === "DOWN" ? 1 : 0,
  }));

  if (chartData.length === 0) {
    return <p className="text-sm text-gray-500">No data yet.</p>;
  }

  return (
    <div className="w-full h-64 md:h-80">
  <ResponsiveContainer width="100%" height="100%">

      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" tick={{ fontSize: 10 }} />
        <YAxis hide />
        <Tooltip />
        <Legend />
        <Bar dataKey="UP" fill="#22c55e" />
        <Bar dataKey="DOWN" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
    </div>
  );
}

export default function Report({ urls, reportSearch, setReportSearch, theme }) {
  const [allLogs, setAllLogs] = useState([]);

  // ✅ ONE API CALL ONLY
  useEffect(() => {
    const fetchAllLogs = async () => {
      try {
        const token = localStorage.getItem("loginToken");
        if (!token) return;

        const res = await axios.get(LOG_API, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setAllLogs(res.data?.data || []);
      } catch (err) {
        console.error("Failed to fetch logs", err);
      }
    };

    fetchAllLogs();
  }, []);

  // ✅ Group logs by siteId
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
