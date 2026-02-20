import React from "react";

const UptimePopup = ({ data, filter, setFilter, onClose, theme }) => {
  const isDark = theme === "dark";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 transition-all duration-200">
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Uptime analytics"
        className={`w-[360px] rounded-xl p-4 shadow-lg transition-all duration-200
        ${
          isDark
            ? "bg-gray-900 text-white border border-gray-700"
            : "bg-white text-gray-800 border border-gray-200"
        }`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Uptime Analytics</h2>
          <button onClick={onClose} aria-label="Close analytics" className="text-sm text-gray-400 hover:text-gray-600">✕</button>
        </div>

        {/* Filter Dropdown */}
        <select
          aria-label="Select analytics range"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className={`w-full mb-4 p-2 rounded-md border text-sm outline-none transition
          ${
            isDark
              ? "bg-gray-800 border-gray-600 text-white focus:ring-2 focus:ring-blue-500"
              : "bg-gray-50 border-gray-300 text-gray-800 focus:ring-2 focus:ring-blue-500"
          }`}
        >
          <option value="24h">Last 24 Hours</option>
          <option value="7d">Last 7 Days</option>
          <option value="30d">Last 30 Days</option>
        </select>

        {/* Stats Section */}
        {!data ? (
          <div className="text-center text-sm opacity-60 py-4">Loading analytics...</div>
        ) : (
          <div className="space-y-2 text-sm">
            <div className={`flex justify-between p-2 rounded-md ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
              <span>Total Uptime</span>
              <span className="font-semibold text-green-500">{data.totalUptime}%</span>
            </div>

            <div className={`flex justify-between p-2 rounded-md ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
              <span>Downtime Incidents</span>
              <span className="font-semibold text-red-500">{data.downtimeCount}</span>
            </div>

            <div className={`flex justify-between p-2 rounded-md ${isDark ? "bg-gray-800" : "bg-gray-100"}`}>
              <span>Total Checks</span>
              <span className="font-semibold">{data.totalChecks}</span>
            </div>
          </div>
        )}

        {/* Close Button */}
        <button
          onClick={onClose}
          aria-label="Close analytics"
          className={`mt-4 w-full p-2 rounded-md font-medium transition-all duration-150
          ${isDark ? "bg-blue-600 hover:bg-blue-500 text-white" : "bg-blue-600 hover:bg-blue-700 text-white"}`}
        >
          Close
        </button>
      </div>
    </div>
  );
};

export default UptimePopup;
