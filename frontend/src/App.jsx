import axios from "axios";
import { useEffect, useState, useRef, useCallback } from "react";
import EditPage from "./pages/EditPage"; 
// import EditModal from "./components/EditModal";
import { isValidUrl } from "./utils/validators";
import PreLoginSplash from "./components/PreLoginSplash";
import Dashboard from "./pages/Dashboard";
import AddUrl from "./pages/AddUrl";
import Report from "./pages/Report";
import Login from "./pages/Login";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import Header from "./components/Header";
import SuperAdmin from "./pages/SuperAdmin";
import Logs from "./pages/Logs";
import setupaxios from "./api/setupAxios";
import BulkUpload from "./pages/BulkUpload";

setupaxios();

const API_BASE = "/monitoredsite";
const PAGE_SIZE = 20;

// ─── Default check frequency (1 minute, matches backend default) ──────────────
const DEFAULT_FREQUENCY_MS = 60_000;

// ─── Module-level in-flight deduplication ────────────────────────────────────
let pinnedSitesFlight = null;
let pagedSitesFlight = null;
let allSitesFullFlight = null;

/** Returns a Set of pinned _id strings. Only one request at a time. */
const fetchPinnedIds = async () => {
  if (pinnedSitesFlight) return pinnedSitesFlight;

  pinnedSitesFlight = (async () => {
    try {
      const token = localStorage.getItem("loginToken");
      if (!token) return new Set();
      const res = await axios.get("/user/pinned-sites", {
        headers: { Authorization: `Bearer ${token}` },
      });
      return new Set((res.data?.pinnedSites || []).map((s) => s._id));
    } catch (err) {
      if (err.response?.status === 401 || isAbortError(err)) {
        return new Set();
      }
      console.error("Fetch pinned sites failed:", err);
      return new Set();
    } finally {
      pinnedSitesFlight = null;
    }
  })();

  return pinnedSitesFlight;
};

/**
 * Fetches ONE page of monitored sites from the server.
 */
const fetchPagedSites = async (status, searchQuery, pageNum) => {
  pagedSitesFlight = (async () => {
    try {
      let url = `${API_BASE}?page=${pageNum}&limit=${PAGE_SIZE}`;
      if (status && status !== "ALL") url += `&status=${status}`;
      if (searchQuery && searchQuery.trim())
        url += `&q=${encodeURIComponent(searchQuery.trim())}`;

      const res = await axios.get(url);
      return {
        data: res.data?.data || [],
        totalCount: res.data?.totalCount ?? res.data?.total ?? 0,
      };
    } catch (err) {
      if (err.response?.status === 401 || isAbortError(err)) {
        return { data: [], totalCount: 0 };
      }
      console.error("Fetch paged sites failed:", err);
      return { data: [], totalCount: 0 };
    } finally {
      pagedSitesFlight = null;
    }
  })();

  return pagedSitesFlight;
};

/**
 * Fetches ALL monitored sites (no pagination).
 */
const isAbortError = (err) =>
  err?.code === "ERR_CANCELED" ||
  err?.name === "CanceledError" ||
  err?.message?.toLowerCase().includes("aborted");

const fetchAllSitesFull = async () => {
  if (allSitesFullFlight) return allSitesFullFlight;

  allSitesFullFlight = (async () => {
    try {
      const res = await axios.get(`${API_BASE}?status=ALL&page=1&limit=10000`);
      return res.data?.data || [];
    } catch (err) {
      if (err.response?.status === 401) return [];
      if (isAbortError(err)) return [];
      console.error("Fetch all sites (full) failed:", err);
      return [];
    } finally {
      allSitesFullFlight = null;
    }
  })();

  return allSitesFullFlight;
};

// ─────────────────────────────────────────────────────────────────────────────

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
  const [activePage, setActivePage] = useState("dashboard");
  const [message, setMessage] = useState("");

  // ─── Paginated table slice (current page from server) ───────────────────
  const [urls, setUrls] = useState([]);

  // ─── Full data store — for popups & reports ONLY ─────────────────────────
  const [allUrls, setAllUrls] = useState([]);

  // ─── Filter / pagination state ───────────────────────────────────────────
  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // ─── Edit form state ─────────────────────────────────────────────────────
  const [domain, setDomain] = useState("");
  const [url, setUrl] = useState("");
  const [urlError, setUrlError] = useState("");
  const [reportSearch, setReportSearch] = useState("");
  const [editItem, setEditItem] = useState(null);
  const [editDomain, setEditDomain] = useState("");
  const [editUrl, setEditUrl] = useState("");
  const [editEmail, setEditEmail] = useState([]);
  const [editPhone, setEditPhone] = useState([]);
  const [editPriority, setEditPriority] = useState(0);
  const [editResponseThresholdMs, setEditResponseThresholdMs] = useState("");
  const [editRegions, setEditRegions] = useState([]);
  // ─── NEW: check frequency edit state ─────────────────────────────────────
  const [editCheckFrequency, setEditCheckFrequency] = useState(DEFAULT_FREQUENCY_MS);

  // ─── NEW: alert routing edit state ───────────────────────────────────────
  const [editAlertRouting, setEditAlertRouting] = useState({
    down: [], trouble: [], critical: []
  });

  // ─── NEW: alert groups edit state ─────────────────────────────────────────
  const [editAlertGroups, setEditAlertGroups] = useState({
    group1: [],
    group2: [],
    group3: [],
  });

  const [popupData, setPopupData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ================= HELPERS ================= */

  const loadData = useCallback(
    async (status, searchQuery, pageNum) => {
      const token = localStorage.getItem("loginToken");
      if (!token) return;

      const resolvedStatus = status ?? selectedStatus;
      const resolvedSearch = searchQuery ?? search;
      const resolvedPage = pageNum ?? page;

      try {
        const { data: pagedData, totalCount } =
          await fetchPagedSites(resolvedStatus, resolvedSearch, resolvedPage);

        const pinnedIds = await fetchPinnedIds();

        let pageData = pagedData.map((u) => ({
          ...u,
          pinned: pinnedIds.has(u._id),
        }));

        if (resolvedPage === 1 && pinnedIds.size > 0) {
          const rawAll = await fetchAllSitesFull();

          let pinnedFull = rawAll
            .filter((u) => pinnedIds.has(u._id))
            .map((u) => ({ ...u, pinned: true }));

          if (resolvedSearch && resolvedSearch.trim()) {
            const q = resolvedSearch.toLowerCase();
            pinnedFull = pinnedFull.filter(
              (u) =>
                (u.domain || "").toLowerCase().includes(q) ||
                (u.url || "").toLowerCase().includes(q)
            );
          }

          if (resolvedStatus && resolvedStatus !== "ALL") {
            pinnedFull = pinnedFull.filter(
              (u) => u.status === resolvedStatus
            );
          }

          const pinnedSet = new Set(pinnedFull.map((p) => p._id));
          const unpinnedPage = pageData.filter((u) => !pinnedSet.has(u._id));
          pageData = [...pinnedFull, ...unpinnedPage].slice(0, PAGE_SIZE);
        } else {
          pageData = pageData.filter((u) => !u.pinned);
        }

        setUrls(pageData);

        const pages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
        setTotalCount(totalCount);
        setTotalPages(pages);
        setPage(Math.min(resolvedPage, pages));

        fetchAllSitesFull().then((rawAll) => {
          const allWithPinned = rawAll.map((u) => ({
            ...u,
            pinned: pinnedIds.has(u._id),
          }));
          setAllUrls(allWithPinned);
        });
      } catch (err) {
        if (!isAbortError(err)) {
          console.error("Load data failed:", err);
        }
      }
    },
    [selectedStatus, search, page]
  );

  /* ================= EFFECTS ================= */

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadData(selectedStatus, search, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    loadData(selectedStatus, search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, search, page]);

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
      checkFrequency,
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
        checkFrequency,
        alertRouting: data.alertRouting || { down: [], trouble: [], critical: [] },
        alertGroups: data.alertGroups || { group1: [], group2: [], group3: [] },
      });
      setDomain("");
      setUrl("");
      setUrlError("");
      setActivePage("dashboard");
      await loadData(selectedStatus, search, 1);
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
      await loadData(selectedStatus, search, page);
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
      await loadData(selectedStatus, search, page);
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Failed to delete selected sites");
    }
  };

  // PIN / UNPIN SITE
  const handlePin = async (id) => {
    try {
      const token = localStorage.getItem("loginToken");
      const site =
        urls.find((u) => u._id === id) || allUrls.find((u) => u._id === id);
      if (!site) return;

      const isCurrentlyPinned = site.pinned || false;

      const togglePin = (list) =>
        list.map((u) =>
          u._id === id ? { ...u, pinned: !isCurrentlyPinned } : u
        );
      setUrls(togglePin(urls));
      setAllUrls(togglePin(allUrls));

      if (isCurrentlyPinned) {
        await axios.delete(`/user/unpin-site/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post(
          `/user/pin-site/${id}`,
          {},
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      await loadData(selectedStatus, search, page);
    } catch (err) {
      console.error("Pin/Unpin failed:", err);
      alert("Failed to pin/unpin website");
      await loadData(selectedStatus, search, page);
    }
  };

  // EDIT SITE — open modal
  const handleEditClick = (item) => {
    setEditItem(item);
    setEditDomain(item.domain || "");
    setEditUrl(item.url || "");
    setEditEmail(
      Array.isArray(item.emailContact)
        ? item.emailContact
        : item.emailContact
        ? [item.emailContact]
        : []
    );
    setEditPhone(
      Array.isArray(item.phoneContact)
        ? item.phoneContact
        : item.phoneContact
        ? [item.phoneContact]
        : []
    );
    setEditPriority(
      item.priority !== undefined && item.priority !== null
        ? Number(item.priority)
        : 0
    );
    setEditResponseThresholdMs(
      item.responseThresholdMs !== undefined &&
        item.responseThresholdMs !== null
        ? item.responseThresholdMs
        : ""
    );
    setEditRegions(Array.isArray(item.regions) ? item.regions : []);
    // ─── Load saved checkFrequency, fallback to default ───────────────────
    setEditCheckFrequency(
      item.checkFrequency !== undefined && item.checkFrequency !== null
        ? Number(item.checkFrequency)
        : DEFAULT_FREQUENCY_MS
    );
    // ─── Load saved alertRouting, fallback to empty ──────────────────────
    setEditAlertRouting(
      item.alertRouting || { down: [], trouble: [], critical: [] }
    );
    // ─── Load saved alertGroups, fallback to empty ───────────────────────
    setEditAlertGroups(
      item.alertGroups || { group1: [], group2: [], group3: [] }
      
    );
    navigate("/edit");
  };

  // EDIT SITE — save
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
          emailContact: Array.isArray(editEmail)
            ? editEmail
            : editEmail
            ? [editEmail]
            : [],
          phoneContact: Array.isArray(editPhone)
            ? editPhone
            : editPhone
            ? [editPhone]
            : [],
          priority: Number(editPriority || 0),
          responseThresholdMs:
            editResponseThresholdMs !== "" &&
            editResponseThresholdMs !== null
              ? Number(editResponseThresholdMs)
              : null,
          regions: Array.isArray(editRegions) ? editRegions : [],
          // ─── NEW: send checkFrequency to backend ──────────────────────
          checkFrequency:
            editCheckFrequency !== null && editCheckFrequency !== undefined
              ? Number(editCheckFrequency)
              : DEFAULT_FREQUENCY_MS,
          // ─── NEW: send alertRouting to backend ───────────────────────
          alertRouting: editAlertRouting,
          // ─── NEW: send alertGroups to backend ─────────────────────────
          alertGroups: editAlertGroups,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      console.log("DEBUG: Sending update alertGroups:", editAlertGroups);

      setEditItem(null);
      setUrlError("");
      setEditEmail([]);
      setEditPhone("");
      setEditPriority(0);
      setEditResponseThresholdMs("");
      setEditRegions([]);
      setEditCheckFrequency(DEFAULT_FREQUENCY_MS); // reset to default
      setEditAlertRouting({ down: [], trouble: [], critical: [] }); // reset alertRouting
      setEditAlertGroups({ group1: [], group2: [], group3: [] }); // reset alertGroups
      await loadData(selectedStatus, search, page);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to update site");
    }
  };

  // REFRESH BUTTON
  const handleRefresh = async () => {
    try {
      setIsRefreshing(true);
      await loadData(selectedStatus, search, page);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  };

  // LOGOUT
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

  const allStatusMap = safeAllUrls.reduce((acc, u) => {
    const s = u.status || "UNKNOWN";
    if (!acc[s]) acc[s] = [];
    acc[s].push(u);
    return acc;
  }, {});

  const upSites = [
    ...(allStatusMap["UP"] || []),
    ...(allStatusMap["SLOW"] || []),
  ];
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

  /* ================= RENDER ================= */

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
                urls={safeAllUrls}
                search={search}
                setSearch={setSearch}
                filteredUrls={safeUrls}
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
  path="/edit"
  element={
    <EditPage
      item={editItem}
      editDomain={editDomain}
      editUrl={editUrl}
      setEditDomain={setEditDomain}
      setEditUrl={setEditUrl}
      editEmail={editEmail}
      editPhone={editPhone}
      editPriority={editPriority}
      editResponseThresholdMs={editResponseThresholdMs}
      editRegions={editRegions}
      editCheckFrequency={editCheckFrequency}
      editAlertRouting={editAlertRouting}
      editAlertGroups={editAlertGroups}
      setEditEmail={setEditEmail}
      setEditPhone={setEditPhone}
      setEditPriority={setEditPriority}
      setEditResponseThresholdMs={setEditResponseThresholdMs}
      setEditRegions={setEditRegions}
      setEditCheckFrequency={setEditCheckFrequency}
      setEditAlertRouting={setEditAlertRouting}
      setEditAlertGroups={setEditAlertGroups}
      urlError={urlError}
      onSave={handleSaveEdit}
      onClose={() => {
        setEditItem(null);
        setUrlError("");
      }}
    />
  }
/>
          <Route
            path="/add"
            element={
              <AddUrl
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
          <Route
            path="/logs"
            element={
              userRole === "SUPERADMIN" ? (
                <Logs />
              ) : (
                <Navigate to="/dashboard" />
              )
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
              />
            }
          />
          <Route
            path="/superadmin"
            element={
              userRole === "SUPERADMIN" ? (
                <SuperAdmin />
              ) : (
                <Navigate to="/dashboard" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/dashboard" />} />
        </Routes>
      </main>

      
    </div>
  );
}

export default App;