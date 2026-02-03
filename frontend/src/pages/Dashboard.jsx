import React from "react";
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
}) => {
  const uptimePercent =
    urls.length === 0
      ? "0%"
      : `${Math.round((upSites.length / urls.length) * 100)}%`;

  return (
    <main className="p-6 max-w-7xl mx-auto space-y-6">

      {/* ===== SEARCH ===== */}
      <div className="flex justify-end">
        <div
          className={`flex items-center w-full max-w-sm border rounded overflow-hidden
            ${theme === "dark"
              ? "bg-gray-700 border-gray-600"
              : "bg-white border-gray-300"
            }`}
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

      {/* ===== STAT CARDS ===== */}
      <section className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="Total Websites"
          value={urls.length}
          icon="🌐"
          theme={theme}
          onClick={() =>
            setPopupData({ title: "Total Websites", type: "total" })
          }
        />

        <StatCard
          title="UP Websites"
          value={upSites.length}
          icon="🟢"
          theme={theme}
          onClick={() =>
            setPopupData({
              title: "UP Websites",
              data: upSites,
              type: "up",
            })
          }
        />

        <StatCard
          title="DOWN Websites"
          value={downSites.length}
          icon="🔴"
          theme={theme}
          onClick={() =>
            setPopupData({
              title: "DOWN Websites",
              data: downSites,
              type: "down",
            })
          }
        />

        <StatCard
          title="Uptime %"
          value={uptimePercent}
          icon="📊"
          theme={theme}
        />
      </section>

      {/* ===== POPUP ===== */}
      {popupData && (
        <CrystalPopup
          popupData={popupData}
          onClose={() => setPopupData(null)}
          urls={urls}
          upSites={upSites}
          downSites={downSites}
        />
      )}

      {/* ===== URL TABLE ===== */}
      <UrlTable
        urls={filteredUrls}
        theme={theme}
        onPin={onPin}
        onDelete={onDelete}
        onEdit={onEdit}
      />
    </main>
  );
};

export default Dashboard;
