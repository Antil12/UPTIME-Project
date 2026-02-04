import axios from "axios";
import { useEffect, useState } from "react";

import SettingsMenu from "./components/SettingsMenu";
import EditModal from "./components/EditModal";
import { isValidUrl } from "./utils/validators";
import CrystalButton from "./components/CrystalButton";
import Dashboard from "./pages/Dashboard";
import AddUrl from "./pages/AddUrl";

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

const API_BASE = "http://localhost:5000/api/monitoredsite";

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

  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");

  const [editItem, setEditItem] = useState(null);
  const [editDomain, setEditDomain] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [popupData, setPopupData] = useState(null);

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

  // Backend health check
  useEffect(() => {
    axios
      .get("http://localhost:5000/api/test")
      .then((res) => setMessage(res.data.message))
      .catch(() => setMessage("Backend not connected"));
  }, []);

  // Fetch sites
  const fetchSites = async () => {
    try {
      const res = await axios.get(API_BASE);
      setUrls(res.data?.data || []);
    } catch (err) {
      console.error("Fetch sites failed", err);
      setUrls([]);
    }
  };

  useEffect(() => {
    fetchSites();
  }, []);

  /* ================= HANDLERS ================= */

  // ADD SITE
  const handleAddUrl = async () => {
    if (!domain.trim() || !url.trim()) {
      setUrlError("Domain and URL are required");
      return;
    }

    if (!isValidUrl(url)) {
      setUrlError("Please enter a valid URL (https://example.com)");
      return;
    }

    try {
      await axios.post(API_BASE, {
        domain: domain.trim(),
        url: url.trim(),
      });

      setDomain("");
      setUrl("");
      setUrlError("");
      setActivePage("dashboard");
      fetchSites();
    } catch (err) {
      console.error(err);
      setUrlError(err.response?.data?.message || "Failed to add site");
    }
  };

  // DELETE SITE
  const handleDelete = async (id) => {
    if (!confirm("Delete this website?")) return;

    try {
      await axios.delete(`${API_BASE}/${id}`);
      fetchSites();
    } catch (err) {
      console.error(err);
      alert("Failed to delete site");
    }
  };

  // PIN SITE
  const handlePin = (id) => {
  setUrls(prevUrls => {
    const newUrls = prevUrls.map(u =>
      u._id === id ? { ...u, pinned: !u.pinned } : u
    );
    localStorage.setItem("pinnedUrls", JSON.stringify(newUrls));
    return newUrls;
  });
};

// Load pinned state on initial render
useEffect(() => {
  const saved = localStorage.getItem("pinnedUrls");
  if (saved) setUrls(JSON.parse(saved));
}, []);



  // EDIT SITE
  const handleEditClick = (item) => {
    setEditItem(item);
    setEditDomain(item.domain || "");
    setEditUrl(item.url || "");
  };

  const handleSaveEdit = async () => {
    if (!editDomain.trim() || !editUrl.trim()) {
      setUrlError("Domain and URL are required");
      return;
    }

    if (!isValidUrl(editUrl)) {
      setUrlError("Please enter a valid URL");
      return;
    }

    try {
      await axios.put(`${API_BASE}/${editItem._id}`, {
        domain: editDomain.trim(),
        url: editUrl.trim(),
      });

      setEditItem(null);
      setUrlError("");
      fetchSites();
    } catch (err) {
      console.error(err);
      alert("Failed to update site");
    }
  };

  const handleRefresh = () => fetchSites();

  const handleLogout = () => {
    setUrls([]);
    setActivePage("dashboard");
    alert("Logged out successfully!");
  };

  /* ================= DERIVED ================= */

  const safeUrls = Array.isArray(urls) ? urls : [];

  const filteredUrls = [...safeUrls]
    .sort((a, b) => (b.pinned === true) - (a.pinned === true))
    .filter(
      (u) =>
        (u.domain || "").toLowerCase().includes(search.toLowerCase()) ||
        (u.url || "").toLowerCase().includes(search.toLowerCase())
    );

  const upSites = safeUrls.filter((u) =>
    ["UP", "SLOW"].includes(u.status)
  );

  const downSites = safeUrls.filter((u) => u.status === "DOWN");

  const reportData = safeUrls
    .filter(
      (u) =>
        (u.domain || "")
          .toLowerCase()
          .includes(reportSearch.toLowerCase()) ||
        (u.url || "")
          .toLowerCase()
          .includes(reportSearch.toLowerCase())
    )
    .map((u) => ({
      name: u.domain,
      upTime: u.upTime || 0,
      downTime: u.downTime || 0,
    }));

  /* ================= UI ================= */

  return (
    <div id="main-container">
      <header className="sticky top-0 z-50 backdrop-blur-xl shadow flex justify-between items-center px-6 py-4">
        <h1 className="text-xl font-bold">⏱️ Uptime Monitor</h1>

        <div className="flex gap-3 items-center">
          <CrystalButton
            label="Dashboard"
            active={activePage === "dashboard"}
            onClick={() => setActivePage("dashboard")}
            theme={theme}
          />
          <CrystalButton
            label="Add URL"
            active={activePage === "add"}
            onClick={() => setActivePage("add")}
            theme={theme}
          />
          <CrystalButton
            label="Reports"
            active={activePage === "reports"}
            onClick={() => setActivePage("reports")}
            theme={theme}
          />
          <CrystalButton label="🔄 Refresh" onClick={handleRefresh} theme={theme} />

          <SettingsMenu
            theme={theme}
            toggleTheme={() =>
              setTheme(theme === "light" ? "dark" : "light")
            }
            onLogout={handleLogout}
          />
        </div>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        <p className="mb-4 text-green-600">{message}</p>

        {activePage === "dashboard" && (
          <Dashboard
            urls={urls}
            theme={theme}
            search={search}
            setSearch={setSearch}
            filteredUrls={filteredUrls}
            upSites={upSites}
            downSites={downSites}
            onPin={handlePin}
            onDelete={handleDelete}
            onEdit={handleEditClick}
            popupData={popupData}
            setPopupData={setPopupData}
          />
        )}

        {activePage === "add" && (
          <AddUrl
            theme={theme}
            domain={domain}
            url={url}
            setDomain={setDomain}
            setUrl={setUrl}
            urlError={urlError}
            onSave={handleAddUrl}
          />
        )}

        {activePage === "reports" && (
          <div className="mb-4">
            <div className="mb-4 max-w-sm">
              <input
                value={reportSearch}
                onChange={(e) => setReportSearch(e.target.value)}
                placeholder="Search domain or URL"
                className="w-full p-2 border rounded"
              />
            </div>

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
