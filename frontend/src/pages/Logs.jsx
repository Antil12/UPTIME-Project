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
const getLocalDate = (date) => {
  return new Date(date).toISOString().split("T")[0];
};

const filterByDateAndStats = () => {
  let filtered = [...logs];

  // ✅ DATE FILTER (FIXED)
  if (fromDate) {
    filtered = filtered.filter(
      (log) => getLocalDate(log.timestamp) >= fromDate
    );
  }

  if (toDate) {
    filtered = filtered.filter(
      (log) => getLocalDate(log.timestamp) <= toDate
    );
  }

  // ✅ SEARCH
  if (searchQuery.trim()) {
    const q = searchQuery.toLowerCase();
    filtered = filtered.filter(
      (log) =>
        log.domain?.toLowerCase().includes(q) ||
        log.url?.toLowerCase().includes(q) ||
        log.action?.toLowerCase().includes(q) ||
        log.user?.toLowerCase().includes(q)
    );
  }

  // ✅ STATS
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
};

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentLogs = filteredLogs.slice(
    indexOfFirstRow,
    indexOfLastRow
  );

  const totalPages = Math.ceil(
  filteredLogs.length / rowsPerPage
);

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* HEADER */}
     <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-3">

  {/* LEFT SIDE */}
  <div>
    <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
      Website Logs
    </h1>
    <p className="text-sm text-gray-500 dark:text-gray-400">
      Activity history of monitored websites
    </p>
  </div>

  {/* RIGHT SIDE */}
  <div className="flex items-center gap-3 w-full sm:w-auto">

    {/* SEARCH */}
    <div className="relative flex-1 sm:flex-none">
      <input
        type="text"
        placeholder="Search logs..."
        value={searchQuery}
        onChange={(e) => handleSearch(e.target.value)}
        className="w-full sm:w-[220px] px-3 py-2 border rounded-lg text-sm
        dark:bg-gray-800 dark:text-white dark:border-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>

    {/* TOTAL */}
    <div className="text-sm text-gray-500 dark:text-gray-400 whitespace-nowrap">
      Total:{" "}
      <span className="font-medium text-gray-700 dark:text-gray-200">
        {filteredLogs.length}
      </span>
    </div>

  </div>
</div>
      
{/* --------------------------------------------------------------------------------------------------- */}
  {/* ================= FILTER + STATS ================= */}
<div className="mb-6 space-y-4">

  {/* 🔷 FILTER BAR */}
  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 
  bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl 
  border border-gray-200 dark:border-gray-700 
  rounded-xl p-4 shadow-sm">

    {/* DATE FILTER */}
    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">

      {/* FROM */}
      <div className="flex items-center justify-between sm:justify-start gap-2 
      bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg w-full sm:w-auto">
        <span className="text-xs text-gray-500 whitespace-nowrap">From</span>
        <input
          type="date"
          value={fromDate}
          onChange={(e) => setFromDate(e.target.value)}
          className="bg-transparent outline-none text-sm w-full dark:text-white"
        />
      </div>

      {/* TO */}
      <div className="flex items-center justify-between sm:justify-start gap-2 
      bg-gray-100 dark:bg-gray-800 px-3 py-2 rounded-lg w-full sm:w-auto">
        <span className="text-xs text-gray-500 whitespace-nowrap">To</span>
        <input
          type="date"
          value={toDate}
          onChange={(e) => setToDate(e.target.value)}
          className="bg-transparent outline-none text-sm w-full dark:text-white"
        />
      </div>

    </div>

    {/* CLEAR BUTTON */}
    <button
      onClick={() => {
        setFromDate("");
        setToDate("");
      }}
      className="w-full sm:w-auto text-xs px-3 py-2 rounded-lg 
      bg-red-100 text-red-600 hover:bg-red-200 
      dark:bg-red-900/20 dark:text-red-400 
      transition"
    >
      Clear Filter
    </button>

  </div>

 {/* 🔷 STATS CARDS */}
<div className="grid grid-cols-3 sm:grid-cols-3 gap-2 sm:gap-3">

  {/* CREATED */}
  <div className="aspect-square sm:aspect-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between
  p-2 sm:px-3 sm:py-2 rounded-md
  bg-gradient-to-r from-green-200/70 to-transparent 
  dark:from-green-900/40 border border-green-200 dark:border-green-800">

    <div className="text-center sm:text-left">
      <p className="text-[10px] sm:text-xs text-green-600">Created</p>
      <p className="text-sm sm:text-base font-semibold text-green-700 dark:text-green-400">
        {stats.created}
      </p>
    </div>

    <span className="text-sm sm:ml-2">✅</span>
  </div>

  {/* UPDATED */}
  <div className="aspect-square sm:aspect-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between
  p-2 sm:px-3 sm:py-2 rounded-md
  bg-gradient-to-r from-blue-200/70 to-transparent 
  dark:from-blue-900/40 border border-blue-200 dark:border-blue-800">

    <div className="text-center sm:text-left">
      <p className="text-[10px] sm:text-xs text-blue-600">Updated</p>
      <p className="text-sm sm:text-base font-semibold text-blue-700 dark:text-blue-400">
        {stats.updated}
      </p>
    </div>

    <span className="text-sm sm:ml-2">🔄</span>
  </div>

  {/* DELETED */}
  <div className="aspect-square sm:aspect-auto flex flex-col sm:flex-row items-center justify-center sm:justify-between
  p-2 sm:px-3 sm:py-2 rounded-md
  bg-gradient-to-r from-red-200/70 to-transparent 
  dark:from-red-900/40 border border-red-200 dark:border-red-800">

    <div className="text-center sm:text-left">
      <p className="text-[10px] sm:text-xs text-red-600">Deleted</p>
      <p className="text-sm sm:text-base font-semibold text-red-700 dark:text-red-400">
        {stats.deleted}
      </p>
    </div>

    <span className="text-sm sm:ml-2">❌</span>
  </div>

</div>
  
</div>
      {/* CARD */}
   <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">
  {loading ? (
    <div className="p-10 text-center text-gray-500 animate-pulse">
  Loading logs...
</div>
  ) : logs.length === 0 ? (
    <div className="p-10 flex flex-col items-center gap-3 text-gray-500">
      <Globe size={32} />
      <p className="text-sm">No logs found for selected filters</p>
    </div>

  ) : (
    <>
      {/* ================= MOBILE VIEW (CARDS) ================= */}
    {/* ================= MOBILE VIEW (ENHANCED CARDS) ================= */}
<div className="md:hidden p-3 space-y-4">
  {currentLogs.map((log, index) => (
    <div
      key={index}
      className="rounded-xl border border-gray-200 dark:border-gray-700 
      bg-white dark:bg-gray-900 
      p-4 shadow-sm hover:shadow-md active:scale-[0.98] 
      transition-all duration-200"
    >
      {/* TOP BAR */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[11px] text-gray-400">
          #{indexOfFirstRow + index + 1}
        </span>

        <span
          className={`px-2.5 py-1 text-[10px] rounded-full font-medium tracking-wide
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
      </div>

      {/* DOMAIN */}
      <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
        {log.domain}
      </p>

      {/* URL */}
      <a
        href={log.url}
        target="_blank"
        rel="noreferrer"
        className="block mt-1 text-xs text-blue-600 dark:text-blue-400 break-all hover:underline"
      >
        {log.url}
      </a>

      {/* DIVIDER */}
      <div className="my-3 h-px bg-gray-200 dark:bg-gray-700" />

      {/* FOOTER */}
      <div className="flex items-center justify-between text-[11px] text-gray-500 dark:text-gray-400">
        <span className="truncate max-w-[45%]">
          👤 {log.user || "Unknown"}
        </span>

        <span className="text-right">
          {log.timestamp
            ? new Date(log.timestamp).toLocaleDateString()
            : "—"}
        </span>
      </div>
    </div>
  ))}
</div>

      {/* ================= DESKTOP VIEW (TABLE) ================= */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-sm">
          
          {/* TABLE HEADER */}
          <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
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
                className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 even:bg-gray-50/50 dark:even:bg-gray-800/50 transition"
              >
                <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                  {indexOfFirstRow + index + 1}
                </td>

                <td className="px-5 py-4 font-medium text-gray-800 dark:text-gray-200">
                  {log.domain}
                </td>

                <td className="px-5 py-4 max-w-[200px] truncate">
                  <a
                    href={log.url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
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
      </div>

      {/* ================= PAGINATION (RESPONSIVE FIX) ================= */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 border-t border-gray-200 dark:border-gray-700">
        
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
            className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
          >
            Prev
          </button>

          <span className="text-sm text-gray-600 dark:text-gray-300">
            {currentPage} / {totalPages}
          </span>

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((prev) => prev + 1)}
            className="px-3 py-1 text-sm border rounded hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50 transition"
          >
            Next
          </button>
        </div>
      </div>
    </>
  )}
</div>
    </div>
  );
};

export default Logs;