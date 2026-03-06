import React, { useState, useEffect } from "react";
import axios from "axios";
import UrlTable from "../components/UrlTable";
import StatCard from "../components/StatCard";
import CrystalPopup from "../components/CrystalPopup";
import UptimePopup from "../components/UptimePopup"; 

const Dashboard = ({
  urls,
  theme,
  search,
  setSearch,
  filteredUrls,
  upSites,
  downSites,
  onPin,
  onDelete,
  onEdit,
  onBulkDelete,
  popupData,
  setPopupData,
  selectedStatus,
  setSelectedStatus,
}) => {
  /* ===============================
     UPTIME %
  =============================== */
  const uptimePercent =
    urls.length === 0
      ? "0%"
      : `${Math.round((upSites.length / urls.length) * 100)}%`;

  /* ===============================
     NEW: UPTIME POPUP STATE
  =============================== */
  const [popupOpen, setPopupOpen] = useState(false);
  const [filter, setFilter] = useState("24h");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentUser, setCurrentUser] = React.useState(null);
  const isViewer = currentUser?.role === "VIEWER";
  // Example report data (you can replace with API data)
  const reportData = urls;

  /* ===============================
     FILTER STATES
  =============================== */
  const [selectedCategories, setSelectedCategories] = useState(["ALL"]);
  const [categories, setCategories] = useState(["ALL"]);
  const [uptimeData, setUptimeData] = useState(null);
  const [selectedSslStatus, setSelectedSslStatus] = useState("ALL");
 useEffect(() => {
  if (!popupOpen) return;

  const fetchUptimeAnalytics = async () => {
    try {
      const res = await axios.get(
        `http://localhost:5000/api/uptime-logs/analytics?range=${filter}`
      );

      console.log("Analytics Response:", res.data);

      if (res.data.success) {
        setUptimeData(res.data.data);
      }
    } catch (error) {
      console.error("Failed to fetch uptime analytics", error);
    }
  };

  fetchUptimeAnalytics();
}, [filter, popupOpen]);

  

  /* ===============================
     FETCH CATEGORIES
  =============================== */
  useEffect(() => {
    const uniqueCategories = [
      "ALL",
      ...Array.from(
        new Set(urls.map((u) => u.category || "UNCATEGORIZED"))
      ),
    ];
    setCategories(uniqueCategories);
  }, [urls]);

  useEffect(() => {
  const user = JSON.parse(localStorage.getItem("user"));
  if (user) {
    setCurrentUser(user);
  }
}, []);

  /* ===============================
     STATUS LIST
  =============================== */
  const statuses = [
    "ALL",
    ...new Set(urls.map((u) => u.status).filter(Boolean)),
  ];

/* ===============================
   FINAL FILTER PIPELINE
=============================== */
let finalUrls = filteredUrls;

// ✅ Category filter (multi-select)
if (!selectedCategories.includes("ALL")) {
  finalUrls = finalUrls.filter((u) =>
    selectedCategories.includes(u.category || "UNCATEGORIZED")
  );
}

// ✅ Status filter
if (selectedStatus !== "ALL") {
  finalUrls = finalUrls.filter((u) => u.status === selectedStatus);
}

// ✅ SSL filter
if (selectedSslStatus !== "ALL") {
  finalUrls = finalUrls.filter(
    (u) => u.sslStatus === selectedSslStatus
  );
}

  /* ===============================
     GLOBAL DATA
  =============================== */
  const globalUpSites = urls.filter(
    (u) => u.status === "UP" || u.status === "SLOW"
  );

  const globalDownSites = urls.filter(
    (u) => u.status === "DOWN"
  );

  return (
    <main className="p-3 md:p-4 max-w-7xl mx-auto space-y-5">

      {/* ===============================
         STAT CARDS
      =============================== */}
      <section className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">

        <StatCard
          compact
          title="Total Websites"
          value={urls.length}
          icon="🌐"
          theme={theme}
          onClick={() =>
            setPopupData({
              title: "Total Websites",
              sites: urls,
            })
          }
        />

        <StatCard
          compact
          title="UP Websites"
          value={globalUpSites.length}
          icon="🟢"
          theme={theme}
          onClick={() =>
            setPopupData({
              title: "UP Websites",
              sites: globalUpSites,
            })
          }
        />

        <StatCard
          compact
          title="DOWN Websites"
          value={globalDownSites.length}
          icon="🔴"
          theme={theme}
          onClick={() =>
            setPopupData({
              title: "DOWN Websites",
              sites: globalDownSites,
            })
          }
        />

     {/* ✅ UPDATED UPTIME CARD — FULL CARD CLICKABLE */}
<StatCard
  compact
  title="Uptime %"
  value={uptimePercent}
  icon="📊"
  theme={theme}
  onClick={() => setPopupOpen(true)}
/>
      </section>

   {/* ===============================
   SELECT + SEARCH
================================ */}
<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">

  {/* 🔍 SEARCH — LEFT SIDE */}
  <div className="flex justify-center sm:justify-start w-full max-w-sm">
    <div
      className={`flex items-center w-full border rounded overflow-hidden
      ${
        theme === "dark"
          ? "bg-gray-700 border-gray-600"
          : "bg-white border-gray-300"
      }`}
    >
      <span className="px-2" aria-hidden>🔍</span>
      <input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search domain or URL"
        aria-label="Search websites by domain or URL"
        className="w-full p-1 outline-none bg-transparent text-sm"
      />
    </div>
  </div>

  {/* ✅ SELECT OPTIONS — RIGHT SIDE */}
{!isViewer && (
<div className="flex items-center gap-2 justify-end">

    <button
      onClick={() => {
        setSelectionMode((v) => !v);
        if (selectionMode) setSelectedIds([]);
      }}
      className={`px-3 py-2 rounded text-sm border
      ${
        theme === "dark"
          ? "bg-gray-800 border-gray-700 text-gray-200"
          : "bg-white border-gray-300 text-gray-800"
      }`}
      aria-pressed={selectionMode}
      aria-label={selectionMode ? "Cancel selection" : "Select websites"}
    >
      {selectionMode ? "Cancel Select" : "Select"}
    </button>

    {selectionMode && (
      <>
        <button
          onClick={() => {
            const allIds = finalUrls.map((u) => u._id);
            const allSelected =
              allIds.length > 0 &&
              allIds.every((id) => selectedIds.includes(id));

            if (allSelected) setSelectedIds([]);
            else setSelectedIds(allIds);
          }}
          className={`px-3 py-2 rounded text-sm border
          ${
            theme === "dark"
              ? "bg-gray-800 border-gray-700 text-gray-200 hover:bg-gray-700"
              : "bg-gray-100 border-gray-200 text-gray-800 hover:bg-gray-200"
          }`}
        >
          {finalUrls.length > 0 &&
          finalUrls.every((u) => selectedIds.includes(u._id))
            ? "Deselect All"
            : "Select All"}
        </button>

        <button
          onClick={async () => {
            if (selectedIds.length === 0)
              return alert("No websites selected");

            if (typeof onBulkDelete === "function") {
              await onBulkDelete(selectedIds);
            } else if (typeof onDelete === "function") {
              for (const id of selectedIds) {
                try {
                  await onDelete(id);
                } catch (err) {
                  console.error("Failed to delete", id, err);
                }
              }
            }

            setSelectedIds([]);
          }}
          className="px-3 py-2 rounded bg-red-500 text-white text-sm hover:bg-red-600"
          aria-label={`Delete selected ${selectedIds.length} websites`}
        >
          Delete Selected ({selectedIds.length})
        </button>
      </>
    )}
  </div>
)}
</div>

      {/* ===============================
         URL TABLE
      =============================== */}
   <UrlTable
  urls={urls}
  theme={theme}
  currentUser={currentUser}
  selectedSslStatus={selectedSslStatus}
  setSelectedSslStatus={setSelectedSslStatus}
  onPin={onPin}
  onDelete={onDelete}
  onEdit={onEdit}
  categories={categories}
  selectedCategories={selectedCategories}
  setSelectedCategories={setSelectedCategories}
  selectedStatus={selectedStatus}
  setSelectedStatus={setSelectedStatus}
/>

      {/* ===============================
         EXISTING POPUP
      =============================== */}
      {popupData && (
        <CrystalPopup
          popupData={popupData}
          onClose={() => setPopupData(null)}
        />
      )}

      {/* ===============================
         NEW UPTIME POPUP
      =============================== */}
      {popupOpen && (
        <UptimePopup
          data={uptimeData}
          filter={filter}
          setFilter={setFilter}
          onClose={() => setPopupOpen(false)}
        />
      )}
    </main>
  );
};

export default Dashboard;
