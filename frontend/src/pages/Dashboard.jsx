import React, { useState, useEffect } from "react";
import axios from "axios";
import UrlTable from "../components/UrlTable";
import StatCard from "../components/StatCard";
import CrystalPopup from "../components/CrystalPopup";

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
     FILTER STATES
  =============================== */
  const [selectedCategory, setSelectedCategory] = useState("ALL");
  const [categories, setCategories] = useState(["ALL"]); 

  /* ===============================
     FETCH CATEGORIES FROM API
  =============================== */
 useEffect(() => {
  const uniqueCategories = ["ALL", ...Array.from(
    new Set(urls.map(u => u.category || "UNCATEGORIZED"))
  )];
  setCategories(uniqueCategories);
}, [urls]);

  /* ===============================
     STATUS LIST (dynamic)
  =============================== */
  const statuses = ["ALL", ...new Set(urls.map((u) => u.status).filter(Boolean))];

  /* ===============================
     FINAL FILTERING PIPELINE
     search → category → status
  =============================== */
let finalUrls = filteredUrls;

if (selectedCategory !== "ALL") {
  finalUrls = finalUrls.filter(
    (u) => (u.category || "UNCATEGORIZED") === selectedCategory
  );
}

if (selectedStatus !== "ALL") {
  finalUrls = finalUrls.filter((u) => u.status === selectedStatus);
}


  /* ===============================
   GLOBAL (UNFILTERED) DATA
  =============================== */
  const globalUpSites = urls.filter(
    (u) => u.status === "UP" || u.status === "SLOW"
  );

  const globalDownSites = urls.filter(
    (u) => u.status === "DOWN"
  );

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">
      {/* ===============================
         STAT CARDS
      =============================== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
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

        <StatCard title="Uptime %" value={uptimePercent} icon="📊" theme={theme} />
      </section>

      {/* ===============================
         SEARCH
      =============================== */}
      <div className="flex justify-end">
        <div
          className={`flex items-center w-full max-w-sm border rounded overflow-hidden
            ${theme === "dark" ? "bg-gray-700 border-gray-600" : "bg-white border-gray-300"}`}
        >
          <span className="px-2">🔍</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search domain or URL"
            className="w-full p-1 outline-none bg-transparent text-sm"
          />
        </div>
      </div>

      {/* ===========
         URL TABLE*/}
      <UrlTable
        urls={finalUrls}
        theme={theme}
        categories={categories}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        onPin={onPin}
        onDelete={onDelete}
        onEdit={onEdit}
      />

      {/* ===============================
         POPUP
      =============================== */}
      {popupData && (
        <CrystalPopup
          popupData={popupData}
          onClose={() => setPopupData(null)}
        />
      )}
    </main>
  );
};

export default Dashboard;
