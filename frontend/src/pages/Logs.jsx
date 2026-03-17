import { useEffect, useState } from "react";
import axios from "axios";
import { Globe, Search } from "lucide-react";

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [filteredLogs, setFilteredLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchQuery, setSearchQuery] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  const [stats, setStats] = useState({
    created: 0,
    updated: 0,
    deleted: 0,
});
  const filterByDateAndStats = () => {
  let filtered = logs;

  // DATE FILTER
  if (fromDate && toDate) {
    const from = new Date(fromDate);
    const to = new Date(toDate);

    // include full day
    to.setHours(23, 59, 59, 999);

    filtered = logs.filter((log) => {
      const logDate = new Date(log.timestamp);
      return logDate >= from && logDate <= to;
    });
  }

  // SEARCH FILTER (reuse your existing logic)
  if (searchQuery) {
    const lowerQuery = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.domain?.toLowerCase().includes(lowerQuery) ||
        log.url?.toLowerCase().includes(lowerQuery) ||
        log.action?.toLowerCase().includes(lowerQuery) ||
        log.user?.toLowerCase().includes(lowerQuery)
    );
  }

  // CALCULATE STATS
  const created = filtered.filter((l) => l.action === "Created").length;
  const updated = filtered.filter((l) => l.action === "Updated").length;
  const deleted = filtered.filter((l) => l.action === "Deleted").length;

  setStats({ created, updated, deleted });
  setFilteredLogs(filtered);
  setCurrentPage(1);
};
  useEffect(() => {
    fetchLogs();
  }, []);
useEffect(() => {
  filterByDateAndStats();
}, [logs, searchQuery, fromDate, toDate]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("loginToken");
      const API = import.meta.env.VITE_API_URL;

const res = await axios.get(
  `${API}/monitoredsite/logs`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setLogs(res.data.data || []);
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query) {
      setFilteredLogs(logs);
      setCurrentPage(1);
      return;
    }

    const lowerQuery = query.toLowerCase();
    const filtered = logs.filter(
      (log) =>
        log.domain?.toLowerCase().includes(lowerQuery) ||
        log.url?.toLowerCase().includes(lowerQuery) ||
        log.action?.toLowerCase().includes(lowerQuery) ||
        log.user?.toLowerCase().includes(lowerQuery)
    );
    setFilteredLogs(filtered);
    setCurrentPage(1);
  };

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentLogs = filteredLogs.slice(
    indexOfFirstRow,
    indexOfLastRow
  );

  const totalPages = Math.ceil(
    (searchQuery ? filteredLogs.length : logs.length) / rowsPerPage
  );

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Website Logs
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Activity history of monitored websites
          </p>
        </div>

        <div className="flex items-center gap-4">
          <input
            type="text"
            placeholder="Search logs..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="px-3 py-1 border rounded text-sm dark:bg-gray-800 dark:text-white"
          />
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total: {searchQuery ? filteredLogs.length : logs.length}
          </div>
        </div>
      </div>

      
{/* --------------------------------------------------------------------------------------------------- */}
  {/* ================= FILTER + STATS ================= */}
<div className="mb-6 space-y-4">

  {/* 🔷 FILTER BAR */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-xl p-4 shadow-sm">

    {/* DATE FILTER */}
    <div className="flex items-center gap-3 flex-wrap">

      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
        <span className="text-xs text-gray-500">From</span>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="bg-transparent outline-none text-sm dark:text-white"
        />
      </div>

      <div className="flex items-center gap-2 bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg">
        <span className="text-xs text-gray-500">To</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="bg-transparent outline-none text-sm dark:text-white"
        />
      </div>

    </div>

    {/* CLEAR BUTTON */}
    <button
      onClick={() => {
        setFromDate("");
        setToDate("");
      }}
      className="text-xs px-3 py-2 rounded-lg bg-red-100 text-red-600 hover:bg-red-200 dark:bg-red-900/20 dark:text-red-400 transition"
    >
      Clear Filter
    </button>

  </div>

  {/* 🔷 STATS CARDS */}
  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

    {/* CREATED */}
    <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-green-100 to-green-50 dark:from-green-900/20 dark:to-green-900/10 border border-green-200 dark:border-green-800 shadow-sm">
      
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-green-600">Created</p>
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-green-200 dark:bg-green-800">
          ✅
        </div>
      </div>

      <p className="mt-2 text-2xl font-bold text-green-700 dark:text-green-400">
        {stats.created}
      </p>

      <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-green-300/30 rounded-full blur-2xl" />
    </div>

    {/* UPDATED */}
    <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-blue-100 to-blue-50 dark:from-blue-900/20 dark:to-blue-900/10 border border-blue-200 dark:border-blue-800 shadow-sm">
      
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-blue-600">Updated</p>
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-blue-200 dark:bg-blue-800">
          🔄
        </div>
      </div>

      <p className="mt-2 text-2xl font-bold text-blue-700 dark:text-blue-400">
        {stats.updated}
      </p>

      <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-blue-300/30 rounded-full blur-2xl" />
    </div>

    {/* DELETED */}
    <div className="relative overflow-hidden rounded-xl p-4 bg-gradient-to-br from-red-100 to-red-50 dark:from-red-900/20 dark:to-red-900/10 border border-red-200 dark:border-red-800 shadow-sm">
      
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-red-600">Deleted</p>
        <div className="w-8 h-8 flex items-center justify-center rounded-full bg-red-200 dark:bg-red-800">
          ❌
        </div>
      </div>

      <p className="mt-2 text-2xl font-bold text-red-700 dark:text-red-400">
        {stats.deleted}
      </p>

      <div className="absolute -right-6 -bottom-6 w-20 h-20 bg-red-300/30 rounded-full blur-2xl" />
    </div>

  </div>
  
</div>
      {/* CARD */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
        {loading ? (
          <div className="p-10 text-center text-gray-500">Loading logs...</div>
        ) : logs.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-gray-500">
            <Globe size={32} />
            <p>No logs found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              {/* TABLE HEADER */}
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-5 py-3 text-left">S No.</th>
                  <th className="px-5 py-3 text-left">Domain</th>
                  <th className="px-5 py-3 text-left">URL</th>
                  <th className="px-5 py-3 text-left">Action</th>
                  <th className="px-5 py-3 text-left">Action By</th>
                  <th className="px-5 py-3 text-left">Timestamp</th>
                </tr>
              </thead>

              {/* TABLE BODY */}
              <tbody>
                {currentLogs.map((log, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >
                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      {indexOfFirstRow + index + 1}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-800 dark:text-gray-200">
                      {log.domain}
                    </td>

                    <td className="px-5 py-4">
                      <a
                        href={log.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-xs"
                      >
                        {log.url}
                      </a>
                    </td>

                    {/* ACTION */}
                    <td className="px-5 py-4">
                      <span
                        className={`px-2 py-1 text-xs rounded-md font-medium
                        ${
                          log.action === "Created"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : log.action === "Updated"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {log.action}
                      </span>
                    </td>

                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {log.user}
                    </td>

                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleString()
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            

            {/* PAGINATION */}
            <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-500 dark:text-gray-400">Rows:</span>
                <select
                  value={rowsPerPage}
                  onChange={(e) => {
                    setRowsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="border rounded px-2 py-1 text-sm dark:bg-gray-800"
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Prev
                </button>

                <span className="text-sm text-gray-600 dark:text-gray-300">
                  Page {currentPage} of {totalPages}
                </span>

                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                  className="px-3 py-1 text-sm border rounded disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Logs;