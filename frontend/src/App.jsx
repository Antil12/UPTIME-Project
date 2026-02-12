import axios from "axios"; 
import { useEffect, useState } from "react";
import SettingsMenu from "./components/SettingsMenu";
import EditModal from "./components/EditModal";
import { isValidUrl } from "./utils/validators";
import CrystalButton from "./components/CrystalButton";
import Dashboard from "./pages/Dashboard";
import AddUrl from "./pages/AddUrl";
import Report from "./pages/Report";
import Login from "./pages/Login";
import Signup from "./pages/Signup";

const API_BASE = "http://localhost:5000/api/monitoredsite";

function App() {
  
  /* ================= STATE ================= */
  const [isLoggedIn, setIsLoggedIn] = useState(
  !!localStorage.getItem("loginToken")
);

  const [authPage, setAuthPage] = useState("login"); 

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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("ALL");

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
  const fetchSites = async (status = "ALL") => {
    try {
      const res = await axios.get(`${API_BASE}?status=${status}`);
      setUrls(res.data?.data || []);
    } catch (err) {
      console.error("Fetch sites failed", err);
      setUrls([]);
    }
  };

  useEffect(() => {
    fetchSites(selectedStatus);
  }, [selectedStatus]);

  /* ================= HANDLERS ================= */

  // ADD SITE
const handleAddUrl = async ({ domain, url, category }) => {
  if (!domain || !url) {
    setUrlError("Domain and URL are required");
    return;
  }

  if (!isValidUrl(url)) {
    setUrlError("Please enter a valid URL (https://example.com)");
    return;
  }

  try {
    await axios.post(API_BASE, {
      domain,
      url,
      category, 
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
    setUrls((prevUrls) => {
      const newUrls = prevUrls.map((u) =>
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

  const handleSaveEdit = async (category) => {
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
      category: category?.trim() || null, 
    });

    setEditItem(null);
    setUrlError("");
    fetchSites();
  } catch (err) {
    console.error(err);
    alert("Failed to update site");
  }
};


  //const handleRefresh = () => fetchSites();
  const handleRefresh = async () => {
  try {
    setIsRefreshing(true);
    await fetchSites(selectedStatus);

    // Optional small delay for smooth UX
    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  } catch (err) {
    setIsRefreshing(false);
  }
};

 const handleLogout = () => {
  localStorage.removeItem("loginToken");
  localStorage.removeItem("user");
  setIsLoggedIn(false);
  setUrls([]);
  setActivePage("dashboard");
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

  // DYNAMIC STATUS MAP
  const statusMap = safeUrls.reduce((acc, u) => {
    const s = u.status || "UNKNOWN";
    if (!acc[s]) acc[s] = [];
    acc[s].push(u);
    return acc;
  }, {});

  const upSites = [...(statusMap["UP"] || []), ...(statusMap["SLOW"] || [])];
  const downSites = [...(statusMap["DOWN"] || [])];

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
  
  if (!isLoggedIn) {
  return authPage === "login" ? (
    <Login
      onLogin={() => setIsLoggedIn(true)}
      goToSignup={() => setAuthPage("signup")}
    />
  ) : (
    <Signup
      onSignup={() => setIsLoggedIn(true)}
    />
  );
}

  /* ================= UI ================= */
  return (
    
    <div id="main-container">
     <header className="sticky top-0 z-50">
  <div className="backdrop-blur-2xl bg-white/10 border-b border-white/10 shadow-xl">
    <div className="w-full flex justify-between items-center px-8 py-4">


      {/* LOGO */}
      <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 bg-clip-text text-transparent tracking-wide">
        ⏱️ Uptime Monitor
      </h1>

      {/* NAVIGATION */}
      <div className="flex gap-4 items-center">

        <div className="flex gap-2 bg-white/5 p-1 rounded-2xl border border-white/10 backdrop-blur-xl">

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

        </div>

        {/* REFRESH BUTTON */}
        <button
  onClick={handleRefresh}
  disabled={isRefreshing}
  className={`
    relative px-5 py-2.5
    rounded-xl
    font-medium
    text-white
    transition-all duration-300
    ${
      isRefreshing
        ? "bg-gray-500 cursor-not-allowed"
        : "bg-gradient-to-r from-emerald-500 to-green-600 hover:scale-105 hover:shadow-lg"
    }
  `}
>
  {isRefreshing ? (
    <span className="flex items-center gap-2">
      
      {/* Spinner */}
      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
      
      Refreshing...
    </span>
  ) : (
    "🔄 Refresh"
  )}
</button>


        {/* SETTINGS */}
        <div className="bg-white/5 p-1 rounded-xl border border-white/10">
          <SettingsMenu
            theme={theme}
            toggleTheme={() =>
              setTheme(theme === "light" ? "dark" : "light")
            }
            onLogout={handleLogout}
          />
        </div>

      </div>
    </div>
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
            selectedStatus={selectedStatus}
            setSelectedStatus={setSelectedStatus}
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
            urls={urls}
          />
        )}

        {activePage === "reports" && (
          <Report
            urls={safeUrls}
            reportData={reportData}
            reportSearch={reportSearch}
            setReportSearch={setReportSearch}
            theme={theme}
          />
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
