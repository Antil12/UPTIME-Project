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

  // ─── Paginated URLs (for the table) ───────────────────────────────────────
  const [urls, setUrls] = useState([]);

  // ─── ALL URLs unpaginated (for stat cards + popups) ───────────────────────
  const [allUrls, setAllUrls] = useState([]);

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
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
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

  // ─── Fetch paginated sites (for the table) ────────────────────────────────
  const fetchSites = async (status = "ALL", searchQuery = "", pageNum = 1) => {
    try {
      const token = localStorage.getItem("loginToken");
      if (!token) return;

      let url = `${API_BASE}?status=${status}&page=${pageNum}&limit=20`;
      if (searchQuery) url += `&q=${encodeURIComponent(searchQuery)}`;

      const res = await axios.get(url);
      const data = res.data?.data || [];

      setTableUrls(data);
      setUrls(data);

      setTotalCount(res.data?.totalCount || 0);
      setTotalPages(res.data?.totalPages || 1);
      setPage(res.data?.page || pageNum);
    } catch (err) {
      console.error("Fetch sites failed", err);
      setTableUrls([]);
      setUrls([]);
    }
  };

  // ─── Fetch ALL sites unpaginated (for stat cards + popups) ───────────────
  const fetchAllSites = async () => {
    try {
      const token = localStorage.getItem("loginToken");
      if (!token) return;

      // Request a very large limit to get everything, or use a dedicated endpoint
      // if your backend supports ?limit=all or similar
      const res = await axios.get(`${API_BASE}?status=ALL&page=1&limit=10000`);
      const data = res.data?.data || [];
      setAllUrls(data);
    } catch (err) {
      console.error("Fetch all sites failed", err);
      setAllUrls([]);
    }
  };

  useEffect(() => {
    if (!isLoggedIn) return;
    fetchSites(selectedStatus, search, page);
  }, [selectedStatus, isLoggedIn, search, page]);

  // Fetch all sites once on login and whenever sites change
  useEffect(() => {
    if (!isLoggedIn) return;
    fetchAllSites();
  }, [isLoggedIn]);

  // Reset to first page when search or status changes
  useEffect(() => {
    setPage(1);
  }, [search, selectedStatus]);

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
      setPage(1);
      fetchSites(selectedStatus, search, 1);
      fetchAllSites(); // refresh global stats too
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
      fetchSites(selectedStatus, search, page);
      fetchAllSites(); // refresh global stats too
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
      fetchSites(selectedStatus, search, page);
      fetchAllSites(); // refresh global stats too
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
      fetchSites(selectedStatus, search, page);
      fetchAllSites(); // refresh global stats too
    } catch (err) {
      console.error(err);
      alert("Failed to update site");
    }
  };

  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await Promise.all([
        fetchSites(selectedStatus, search, page),
        fetchAllSites(),
      ]);
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
    setAllUrls([]);

    navigate("/login");
  };

  /* ================= DERIVED ================= */

  const safeUrls = Array.isArray(urls) ? urls : [];
  const safeAllUrls = Array.isArray(allUrls) ? allUrls : [];

  const filteredUrls = [...safeUrls].sort(
    (a, b) => (b.pinned === true) - (a.pinned === true)
  );

  // Global status maps computed from ALL sites (not paginated)
  const allStatusMap = safeAllUrls.reduce((acc, u) => {
    const s = u.status || "UNKNOWN";
    if (!acc[s]) acc[s] = [];
    acc[s].push(u);
    return acc;
  }, {});

  const upSites = [...(allStatusMap["UP"] || []), ...(allStatusMap["SLOW"] || [])];
  const downSites = [...(allStatusMap["DOWN"] || [])];

  const reportData = safeAllUrls
    .filter(
      (u) =>
        (u.domain || "").toLowerCase().includes(reportSearch.toLowerCase()) ||
        (u.url || "").toLowerCase().includes(reportSearch.toLowerCase())
    )
    .map((u) => ({
      name: u.domain,
      upTime: u.upTime || 0,
      downTime: u.downTime || 0,
    }));
  
  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/" element={<PreLoginSplash />} />
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
                // allUrls powers the stat cards and popups (all sites, no pagination)
                urls={safeAllUrls}
                theme={theme}
                search={search}
                setSearch={setSearch}
                // filteredUrls powers the table (paginated)
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
                page={page}
                setPage={setPage}
                totalPages={totalPages}
                totalCount={totalCount}
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
                urls={safeAllUrls}
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
          />
          <Route path="*" element={<Navigate to="/dashboard" />} />
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