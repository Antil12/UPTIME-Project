import axios from "axios";
import { useEffect, useState, useRef, useCallback } from "react";
import EditModal from "./components/EditModal";
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

// ─── Module-level in-flight deduplication ────────────────────────────────────
let pinnedSitesFlight = null;
let pagedSitesFlight = null; // dedup for the current paged request
let allSitesFullFlight = null; // dedup for the full-list request (reports/popups)

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
 * Returns { data: [], totalCount: N } from the API response.
 * Only one request in-flight at a time (last one wins via reset).
 */
const fetchPagedSites = async (status, searchQuery, pageNum) => {
  // Cancel any previous in-flight paged request by resetting the ref —
  // the new promise simply overwrites it so only the latest result is used.
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
      console.error("Fetch paged sites failed:", err);
      return { data: [], totalCount: 0 };
    } finally {
      pagedSitesFlight = null;
    }
  })();

  return pagedSitesFlight;
};

/**
 * Fetches ALL monitored sites (no pagination) — used exclusively for
 * popups and the report page so their data is never affected by the
 * dashboard's current page/filter state.
 * Only one request in-flight at a time.
 */
const fetchAllSitesFull = async () => {
  if (allSitesFullFlight) return allSitesFullFlight;

  allSitesFullFlight = (async () => {
    try {
      const res = await axios.get(`${API_BASE}?status=ALL&page=1&limit=10000`);
      return res.data?.data || [];
    } catch (err) {
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
  // Never re-filtered by dashboard state; always the complete list with pins.
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
  const [editPhone, setEditPhone] = useState("");
  const [editPriority, setEditPriority] = useState(0);
  const [editResponseThresholdMs, setEditResponseThresholdMs] = useState("");
  const [editRegions, setEditRegions] = useState([]);
  const [popupData, setPopupData] = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  /* ================= HELPERS ================= */

  /**
   * Loads ONE page of data from the server and updates the table slice.
   * Also refreshes the full list (allUrls) in parallel so popups/reports
   * always have complete, up-to-date data.
   */
 const loadData = useCallback(
  async (status, searchQuery, pageNum) => {
    const token = localStorage.getItem("loginToken");
    if (!token) return;

    const resolvedStatus = status ?? selectedStatus;
    const resolvedSearch = searchQuery ?? search;
    const resolvedPage = pageNum ?? page;

    try {
      // 🟢 1. Get paginated data (MAIN SOURCE)
      const { data: pagedData, totalCount } =
        await fetchPagedSites(resolvedStatus, resolvedSearch, resolvedPage);

      // 🟢 2. Get pinned IDs
      const pinnedIds = await fetchPinnedIds();

      // 🟢 3. Mark pinned in current page
      let pageData = pagedData.map((u) => ({
        ...u,
        pinned: pinnedIds.has(u._id),
      }));

      // 🔥 4. PAGE 1 → inject pinned
      if (resolvedPage === 1 && pinnedIds.size > 0) {
        const rawAll = await fetchAllSitesFull(); // ONLY for pinned extraction

        let pinnedFull = rawAll
          .filter((u) => pinnedIds.has(u._id))
          .map((u) => ({ ...u, pinned: true }));

        // 👉 Apply SAME filters (IMPORTANT)
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

        // 👉 Remove duplicates from page
        const pinnedSet = new Set(pinnedFull.map((p) => p._id));

        const unpinnedPage = pageData.filter(
          (u) => !pinnedSet.has(u._id)
        );

        // 👉 Final merge
        pageData = [...pinnedFull, ...unpinnedPage].slice(0, PAGE_SIZE);
      } else {
        // 👉 Other pages → remove pinned
        pageData = pageData.filter((u) => !u.pinned);
      }

      // 🟢 5. Update table
      setUrls(pageData);

      // 🟢 6. Keep backend pagination untouched
      const pages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
      setTotalCount(totalCount);
      setTotalPages(pages);
      setPage(Math.min(resolvedPage, pages));

      // 🟢 7. Keep popup data EXACTLY as before (no change)
      fetchAllSitesFull().then((rawAll) => {
        const allWithPinned = rawAll.map((u) => ({
          ...u,
          pinned: pinnedIds.has(u._id),
        }));
        setAllUrls(allWithPinned);
      });

    } catch (err) {
      console.error("Load data failed:", err);
    }
  },
  [selectedStatus, search, page]
);

  /* ================= EFFECTS ================= */

  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  // Initial load on login
  useEffect(() => {
    if (!isLoggedIn) return;
    loadData(selectedStatus, search, 1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  // Re-fetch whenever filter or page changes
  useEffect(() => {
    if (!isLoggedIn) return;
    loadData(selectedStatus, search, page);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedStatus, search, page]);

  // Reset to first page whenever filter criteria change
  useEffect(() => {
    setPage(1);
  }, [search, selectedStatus]);

  /* ================= HANDLERS ================= */

  // ADD SITE
  const handleAddUrl = async (data) => {
    const {
      domain, url, category, responseThresholdMs,
      alertChannels, regions, alertIfAllRegionsDown,
      emailContact, phoneContact, priority,
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
        domain, url, category, responseThresholdMs,
        alertChannels, regions, alertIfAllRegionsDown,
        emailContact, phoneContact, priority,
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

      // Find site in either list
      const site = urls.find((u) => u._id === id) || allUrls.find((u) => u._id === id);
      if (!site) return;

      const isCurrentlyPinned = site.pinned || false;

      // Optimistic update on both lists
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

      // Sync with server after API call settles
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
    setEditPhone(item.phoneContact || "");
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
          phoneContact: editPhone?.trim() || null,
          priority: Number(editPriority || 0),
          responseThresholdMs:
            editResponseThresholdMs !== "" &&
            editResponseThresholdMs !== null
              ? Number(editResponseThresholdMs)
              : null,
          regions: Array.isArray(editRegions) ? editRegions : [],
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setEditItem(null);
      setUrlError("");
      setEditEmail([]);
      setEditPhone("");
      setEditPriority(0);
      setEditResponseThresholdMs("");
      setEditRegions([]);
      await loadData(selectedStatus, search, page);
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

  // safeUrls  → current page slice (dashboard table)
  // safeAllUrls → full list (popups & reports) — untouched by pagination
  const safeUrls = Array.isArray(urls) ? urls : [];
  const safeAllUrls = Array.isArray(allUrls) ? allUrls : [];

  // Up/Down counts derived from the full list (accurate totals for popups)
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

  // Report data derived from the full list — unaffected by page/filter
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
                urls={safeAllUrls}        // full list → popups see everything
                search={search}
                setSearch={setSearch}
                filteredUrls={safeUrls}   // current page slice → table rows
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
                urls={safeAllUrls}        // full list for report page
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

      {/* EDIT MODAL */}
      {editItem && (
        <EditModal
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
          setEditEmail={setEditEmail}
          setEditPhone={setEditPhone}
          setEditPriority={setEditPriority}
          setEditResponseThresholdMs={setEditResponseThresholdMs}
          setEditRegions={setEditRegions}
          urlError={urlError}
          onClose={() => setEditItem(null)}
          onSave={handleSaveEdit}
        />
      )}
    </div>
  );
}

export default App;