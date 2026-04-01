import axios from "axios"; 
import { useEffect, useState, useRef } from "react";
import EditModal from "./components/EditModal";
import { isValidUrl } from "./utils/validators";
import PreLoginSplash from "./components/PreLoginSplash";
import Dashboard from "./pages/Dashboard";
import AddUrl from "./pages/AddUrl";
import Report from "./pages/Report";
import Login from "./pages/Login";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import { startSlowAlertListener } from "./api/alertApi";
import SuperAdmin from "./pages/SuperAdmin";
import Logs from "./pages/Logs";
import setupaxios from "./api/setupAxios";
import BulkUpload from "./pages/BulkUpload";
import Regions from "./pages/Regions";
import Region from "./pages/Region";

setupaxios();
const API_BASE = "/monitoredsite";

function App() {
  
const [currentUser, setCurrentUser] = useState(() => {
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
});
const userRole = currentUser?.role?.toUpperCase();
  const [isLoggedIn, setIsLoggedIn] = useState(
  !!localStorage.getItem("loginToken")
);
  const navigate = useNavigate();
  const [authPage, setAuthPage] = useState("login"); 
  const [activePage, setActivePage] = useState("dashboard");
  const [message, setMessage] = useState("");
  const [urls, setUrls] = useState([]);
  const [tableUrls, setTableUrls] = useState([]); 
  const [domain, setDomain] = useState("");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [search, setSearch] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [theme, setTheme] = useState(localStorage.getItem("theme") || "light");
  const [editItem, setEditItem] = useState(null);
  const [editDomain, setEditDomain] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editEmail, setEditEmail] = useState([]);
  const [editPhone, setEditPhone] = useState("");
  const [editPriority, setEditPriority] = useState(0);
  const [editResponseThresholdMs, setEditResponseThresholdMs] = useState("");
  const [popupData, setPopupData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const logoutTimerRef = useRef(null);

  /* ================= EFFECTS ================= */
useEffect(() => {
  let interval;

  if (isLoggedIn) {
    interval = startSlowAlertListener();
  }

  return () => {
    if (interval) clearInterval(interval);
  };
}, [isLoggedIn]);

  useEffect(() => {
  document.documentElement.classList.toggle("dark", theme === "dark");
  localStorage.setItem("theme", theme);
}, [theme]);

  // Fetch sites
const fetchSites = async (status = "ALL") => {
  try {
    const token = localStorage.getItem("loginToken");
    if (!token) return;

    const res = await axios.get(`${API_BASE}?status=${status}`);
    const data = res.data?.data || [];

    setTableUrls(data); 
    if (status === "ALL") {
      setUrls(data);
    }

  } catch (err) {
    console.error("Fetch sites failed", err);
    setTableUrls([]);
  }
};

 useEffect(() => {
  if (!isLoggedIn) return;
  fetchSites(selectedStatus);
}, [selectedStatus, isLoggedIn]);

  /* ================= HANDLERS ================= */
  // ADD SITE
const handleAddUrl = async (data) => {
  const {
    domain,
    url,
    category,
    responseThresholdMs,
    alertChannels,
    regions,
    alertIfAllRegionsDown,
    emailContact,
    phoneContact,
      priority, 
  } = data;

  if (!domain || !url) {
    setUrlError("Domain and URL are required");
    return;
  }

  if (!isValidUrl(url)) {
    setUrlError("Please enter a valid URL (https://example.com)");
    return;
  }

  try {
    const token = localStorage.getItem("loginToken");

 await axios.post(API_BASE, {
  domain,
  url,
  category,
  responseThresholdMs,
  alertChannels,
  regions,
  alertIfAllRegionsDown,
  emailContact,
  phoneContact,
  priority,
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
    
      const token = localStorage.getItem("loginToken");

await axios.delete(`${API_BASE}/${id}`);

      fetchSites();
    } catch (err) {
      console.error(err);
      alert("Failed to delete site");
    }
  };

  // BULK DELETE SITES
  const handleBulkDelete = async (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    if (!confirm(`Delete ${ids.length} selected website(s)?`)) return;

    try {
      const token = localStorage.getItem("loginToken");
      await Promise.all(
        ids.map((id) =>
          axios.delete(`${API_BASE}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      fetchSites();
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Failed to delete selected sites");
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
    setEditEmail(Array.isArray(item.emailContact) ? item.emailContact : item.emailContact ? [item.emailContact] : []);
    setEditPhone(item.phoneContact || "");
    setEditPriority(item.priority !== undefined && item.priority !== null ? Number(item.priority) : 0);
    setEditResponseThresholdMs(
      item.responseThresholdMs !== undefined && item.responseThresholdMs !== null
        ? item.responseThresholdMs
        : ""
    );
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
    const token = localStorage.getItem("loginToken");

    await axios.put(
  `${API_BASE}/${editItem._id}`,
  {
    domain: editDomain.trim(),
    url: editUrl.trim(),
    category: category?.trim() || null,
    emailContact: Array.isArray(editEmail) ? editEmail : editEmail ? [editEmail] : [],
    phoneContact: editPhone?.trim() || null,
    priority: Number(editPriority || 0),
    responseThresholdMs:
      editResponseThresholdMs !== "" && editResponseThresholdMs !== null
        ? Number(editResponseThresholdMs)
        : null,
  },
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);
    setEditItem(null);
    setUrlError("");
    setEditEmail([]);
    setEditPhone("");
    setEditPriority(0);
    setEditResponseThresholdMs("");
    fetchSites();
  } catch (err) {
    console.error(err);
    alert("Failed to update site");
  }
};

  const handleRefresh = async () => {
  try {
    setIsRefreshing(true);
    await fetchSites(selectedStatus);

    setTimeout(() => {
      setIsRefreshing(false);
    }, 600);
  } catch (err) {
    setIsRefreshing(false);
  }
};

const handleLogout = async () => {
  try {
    await axios.post("/auth/logout");
  } catch (err) {
    console.error("Logout error:", err);
  }

  localStorage.removeItem("loginToken");
  localStorage.removeItem("user");

  setIsLoggedIn(false);
  setCurrentUser(null);
  setUrls([]);

  navigate("/login");
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
  return (
    <Routes>
      {/* SPLASH SCREEN */}
      <Route path="/" element={<PreLoginSplash />} />
      
      {/* LOGIN */}
      <Route
        path="/login"
        element={
          <Login
            onLogin={(userData) => {
              setCurrentUser(userData);
              setIsLoggedIn(true);
            }}
          />
        }
      />
  
      {/* DEFAULT REDIRECT */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

  return (
    <div id="main-container" className="min-h-screen">

      {/* HEADER */}
      <Header
        theme={theme}
        setTheme={setTheme}
        handleRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        handleLogout={handleLogout}
        currentUser={currentUser}
      />

      {/* MAIN CONTENT */}
      <main className="p-4 md:p-6 max-w-6xl mx-auto">
        <p className="mb-4 text-green-600">{message}</p>

        <Routes>
          <Route
            path="/dashboard"
            element={
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
                onBulkDelete={handleBulkDelete}
                popupData={popupData}
                setPopupData={setPopupData}
                selectedStatus={selectedStatus}
                setSelectedStatus={setSelectedStatus}
              />
            }
          />

          <Route
            path="/add"
            element={
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
            }
          />
          <Route path="/region" element={<Regions theme={theme} />} />
          <Route path="/region/:region" element={<Region theme={theme} />} />
          <Route
path="/logs"
element={
userRole === "SUPERADMIN"
? <Logs theme={theme}/>
: <Navigate to="/dashboard"/>
}
/>
<Route
  path="/bulk-import"
  element={
    userRole !== "VIEWER" ? (
      <BulkUpload />
    ) : (
      <Navigate to="/dashboard" replace />
    )
  }
/>

          <Route
            path="/reports"
            element={
              <Report
                urls={safeUrls}
                reportData={reportData}
                reportSearch={reportSearch}
                setReportSearch={setReportSearch}
                theme={theme}
              />
            }
          />
 

  <Route
  path="/superadmin"
  element={
    userRole === "SUPERADMIN" ? (
      <SuperAdmin theme={theme} />
    ) : (
      <Navigate to="/dashboard" replace />
    )
  }
/><Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
        
      </main>
      {/* EDIT MODAL */}
      {editItem && (
  <EditModal
    item={editItem}
    theme={theme}
    editDomain={editDomain}
    editUrl={editUrl}
    setEditDomain={setEditDomain}
    setEditUrl={setEditUrl}
    editEmail={editEmail}
    editPhone={editPhone}
    editPriority={editPriority}
    editResponseThresholdMs={editResponseThresholdMs}
    setEditEmail={setEditEmail}
    setEditPhone={setEditPhone}
    setEditPriority={setEditPriority}
    setEditResponseThresholdMs={setEditResponseThresholdMs}
    urlError={urlError}
    onClose={() => setEditItem(null)}
    onSave={handleSaveEdit}
  />
)}
    </div>
  );
}

export default App;
