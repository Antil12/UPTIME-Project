  import axios from "axios";
  import { useEffect, useState } from "react";
  import StatCard from "./components/StatCard";
  import SettingsMenu from "./components/SettingsMenu";
  import EditModal from "./components/EditModal";
  import { isValidUrl } from "./utils/validators";
  import CrystalButton from "./components/CrystalButton";
  //import { ThemeProvider } from "./context/ThemeContext";
  import CrystalPopup from "./components/CrystalPopup";
  import UrlTable from "./components/UrlTable";

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
  function App() {
    /* ================= STATE ================= */
    const [activePage, setActivePage] = useState("dashboard");
    const [message, setMessage] = useState("Checking backend...");
    const [urls, setUrls] = useState([]);
    const [domain, setDomain] = useState("");
    const [url, setUrl] = useState("");
    const [urlError, setUrlError] = useState("");
    const [search, setSearch] = useState("");
    const [reportSearch, setReportSearch] = useState("");
    const [statPopup, setStatPopup] = useState(null);
    const [theme, setTheme] = useState(
      localStorage.getItem("theme") || "light"
    );
    const [editItem, setEditItem] = useState(null);
    const [editDomain, setEditDomain] = useState("");
    const [editUrl, setEditUrl] = useState("");
    const [popupData, setPopupData] = useState(null);
    const upSites = urls.filter(u => u.status === "UP");
    const downSites = urls.filter(u => u.status === "DOWN");
    /* ================= EFFECTS ================= */
    // Theme
    useEffect(() => {
      const main = document.getElementById("main-container");
      if (!main) return;

      main.className =
        theme === "dark"
          ? "bg-gray-900 text-white min-h-screen"
          : "bg-gradient-to-br from-slate-100 to-slate-200 min-h-screen";

      localStorage.setItem("theme", theme);
    }, [theme]);

    // Backend check
    useEffect(() => {
      axios
        .get("http://localhost:5000/api/test")
        .then((res) => setMessage(res.data.message))
        .catch(() => setMessage("Backend not connected"));
    }, []);

    /* ================= HANDLERS ================= */

    const handleAddUrl = () => {
      if (!domain.trim() || !url.trim()) {
        setUrlError("Domain and URL are required");
        return;
      }

      if (!isValidUrl(url)) {
        setUrlError("Please enter a valid URL (https://example.com)");
        return;
      }

      setUrls((prev) => [
        ...prev,
        {
          id: Date.now(),
          domain: domain.trim(),
          url: url.trim(),
          status: Math.random() > 0.5 ? "UP" : "DOWN",
          statusCode: 200,
          responseTime: `${Math.floor(Math.random() * 200 + 50)} ms`,
          upTime: Math.floor(Math.random() * 1000),
          downTime: Math.floor(Math.random() * 500),
          pinned: false,
        },
      ]);

      setDomain("");
      setUrl("");
      setUrlError("");
      setActivePage("dashboard");
    };

    const handleDelete = (id) => {
      if (!confirm("Delete this website?")) return;
      setUrls((prev) => prev.filter((u) => u.id !== id));
    };

    const handlePin = (id) => {
      setUrls((prev) =>
        prev.map((u) =>
          u.id === id ? { ...u, pinned: !u.pinned } : u
        )
      );
    };

    const handleEditClick = (item) => {
      setEditItem(item);
      setEditDomain(item.domain);
      setEditUrl(item.url);
    };

    const handleSaveEdit = () => {
      if (!editDomain.trim() || !editUrl.trim()) {
        setUrlError("Domain and URL are required");
        return;
      }

      if (!isValidUrl(editUrl)) {
        setUrlError("Please enter a valid URL");
        return;
      }

      setUrls((prev) =>
        prev.map((u) =>
          u.id === editItem.id
            ? { ...u, domain: editDomain.trim(), url: editUrl.trim() }
            : u
        )
      );

      setEditItem(null);
      setUrlError("");
    };

    const handleRefresh = () => {
      setUrls((prev) =>
        prev.map((u) => ({
          ...u,
          status: Math.random() > 0.5 ? "UP" : "DOWN",
          responseTime: `${Math.floor(Math.random() * 200 + 50)} ms`,
        }))
      );
    };

    const handleLogout = () => {
      setUrls([]);
      setActivePage("dashboard");
      alert("Logged out successfully!");
    };

    /* ================= DERIVED ================= */

    const filteredUrls = [...urls]
      .sort((a, b) => b.pinned - a.pinned)
      .filter(
        (u) =>
          u.domain.toLowerCase().includes(search.toLowerCase()) ||
          u.url.toLowerCase().includes(search.toLowerCase())
      );

    const upCount = urls.filter((u) => u.status === "UP").length;
    const downCount = urls.filter((u) => u.status === "DOWN").length;

    const reportData = urls
      .filter(
        (u) =>
          u.domain.toLowerCase().includes(reportSearch.toLowerCase()) ||
          u.url.toLowerCase().includes(reportSearch.toLowerCase())
      )
      .map((u) => ({
        name: u.domain,
        upTime: u.upTime,
        downTime: u.downTime,
      }));

    /* ================= UI ================= */

    return (
      <div id="main-container">
        {/* ================= HEADER ================= */}
        <header className="sticky top-0 z-50 backdrop-blur-xl shadow flex justify-between items-center px-6 py-4">
          <h1 className="text-xl font-bold">⏱️ Uptime Monitor</h1>

          <div className="flex gap-3 items-center">
            <CrystalButton label="Dashboard" active={activePage === "dashboard"} onClick={() => setActivePage("dashboard")} theme={theme} />
            <CrystalButton label="Add URL" active={activePage === "add"} onClick={() => setActivePage("add")} theme={theme} />
            <CrystalButton label="Reports" active={activePage === "reports"} onClick={() => setActivePage("reports")} theme={theme} />
            <CrystalButton label="🔄 Refresh" onClick={handleRefresh} theme={theme} />

            <SettingsMenu
              theme={theme}
              toggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
              onLogout={handleLogout}
            />
          </div>
        </header>

        {/* ================= MAIN ================= */}
        <main className="p-6 max-w-6xl mx-auto">
          <p className="mb-4 text-green-600">{message}</p>

          {/* DASHBOARD */}
          {activePage === "dashboard" && (
            <>
     <div className="mb-4 flex justify-end w-full">
  <div
    className={`
      flex items-center w-full max-w-sm border rounded overflow-hidden
      ${theme === "dark"
        ? "bg-gray-700 border-gray-600"
        : "bg-white border-gray-300"
      }
    `}
  >
    <span className={theme === "dark" ? "px-2 text-gray-300" : "px-2 text-gray-500"}>
      🔍
    </span>
    <input
      value={search}
      onChange={(e) => setSearch(e.target.value)}
      placeholder="Search domain or URL"
      className={`
        w-full p-1 outline-none text-sm
        ${theme === "dark" ? "bg-transparent text-white placeholder-gray-300" : "bg-transparent text-black placeholder-gray-500"}
      `}
    />
  </div>
</div>
        

                {/* ================= STAT POPUP ================= */}
      {statPopup && (
        <StatPopup
          type={statPopup}
          urls={urls}
          upCount={upCount}
          downCount={downCount}
          onClose={() => setStatPopup(null)}
          theme={theme}
        />
      )}
 {/* STAT CARDS */}
<div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
 <StatCard
  title="Total Websites"
  value={urls.length}
  icon="🌐"
  theme={theme}
  onClick={() =>
    setPopupData({
      title: "Total Websites",
      type: "total", // ✅ add this
    })
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
        type:"up"
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
        type:"down"
      })
    }
  />

  {/* Uptime % card showing overall stats in popup */}
  <StatCard
    title="Uptime %"
    value={urls.length === 0 ? "0%" : `${Math.round((upSites.length / urls.length) * 100)}%`}
    icon="📊 "
    theme={theme}
    onClick={() =>
      setPopupData({
        title: "Uptime Overview",
        data: [], // no individual domain list needed here
        showUptimeSummary: true, // custom flag to indicate we want overall stats
      })
    }
  />
</div>


  {popupData && (
  <CrystalPopup
    popupData={popupData}
    onClose={() => setPopupData(null)}
    urls={urls}
    upSites={upSites}
    downSites={downSites}
  />
)}


   
      
  <UrlTable
  urls={filteredUrls}
  theme={theme}
  onPin={handlePin}
  onDelete={handleDelete}
  onEdit={handleEditClick}
/>


            </>
          )}
        
          

          {/* ADD PAGE */}
         {activePage === "add" && (
  <div
    className={`max-w-md mx-auto p-6 rounded shadow
      ${theme === "dark" ? "bg-gray-800 text-gray-200" : "bg-white text-gray-800"}`}
  >
    {/* Domain Input */}
    <input
      value={domain}
      onChange={(e) => setDomain(e.target.value)}
      placeholder="Domain"
      className={`w-full p-2 mb-3 rounded border
        ${theme === "dark"
          ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
          : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
        }`}
    />

    {/* URL Input */}
    <input
      value={url}
      onChange={(e) => setUrl(e.target.value)}
      placeholder="https://example.com"
      className={`w-full p-2 mb-2 rounded border
        ${theme === "dark"
          ? "bg-gray-700 border-gray-600 text-gray-200 placeholder-gray-400"
          : "bg-white border-gray-300 text-gray-800 placeholder-gray-500"
        }`}
    />

    {/* Error Message */}
    {urlError && (
      <p className="text-red-500 text-sm mb-2">{urlError}</p>
    )}

    {/* Save Button */}
    <button
      onClick={handleAddUrl}
      className={`w-full py-2 rounded
        ${theme === "dark" ? "bg-blue-600 text-white hover:bg-blue-700" : "bg-slate-900 text-white hover:bg-slate-800"}`
      }
    >
      Save URL
    </button>
  </div>
)}

          {/* REPORTS */}
          {/* ================= REPORTS ================= */}
{/* ================= REPORTS ================= */}
{activePage === "reports" && (
  <div className="mb-4">
    {/* SEARCH BAR */}
    <div
      className={`
        mb-4 flex items-center w-full max-w-sm border rounded overflow-hidden
        ${theme === "dark"
          ? "bg-gray-700 border-gray-600"
          : "bg-white border-gray-300"
        }
      `}
    >
      {/* Search Icon */}
      <span className={theme === "dark" ? "px-2 text-gray-300" : "px-2 text-gray-500"}>
        🔍
      </span>

      {/* Input */}
      <input
        value={reportSearch}
        onChange={(e) => setReportSearch(e.target.value)}
        placeholder="Search domain or URL"
        className={`
          w-full p-1 outline-none text-sm
          ${theme === "dark" ? "bg-transparent text-white placeholder-gray-300" : "bg-transparent text-black placeholder-gray-500"}
        `}
      />
    </div>

    {/* BAR CHART */}
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={reportData}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="name" />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey="upTime" fill="#22c55e" />
        <Bar dataKey="downTime" fill="#ef4444" />
      </BarChart>
    </ResponsiveContainer>
  </div>
)}

        </main>

        {/* EDIT MODAL */}
        {editItem && (
          <EditModal
            item={editItem}
            editDomain={editDomain}
            editUrl={editUrl}
            setEditDomain={setEditDomain}
            setEditUrl={setEditUrl}
            urlError={urlError}
            onClose={() => setEditItem(null)}
            onSave={handleSaveEdit}
            theme={theme}
          />
        )}
        
      </div>
    );
  }

  export default App;
