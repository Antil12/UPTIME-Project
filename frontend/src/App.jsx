import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import EditPage from "./pages/EditPage";
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
import "./api/setupAxios";
import BulkUpload from "./pages/BulkUpload";
import EscalationGroups from "./pages/EscalationGroups";
import DeleteConfirmationModal from "./components/DeleteConfirmationModal";
import { ThemeProvider, useTheme } from "./contexts/ThemeContext";

const API_BASE = "/monitoredsite";
const PAGE_SIZE = 20;
const DEFAULT_FREQUENCY_MS = 60_000;

// ─── Module-level in-flight deduplication ────────────────────────────────────
let pinnedSitesFlight = null;
let pagedSitesFlight  = null;
let allSitesFullFlight = null;

const isAbortError = (err) =>
  err?.code === "ERR_CANCELED" ||
  err?.name === "CanceledError" ||
  err?.message?.toLowerCase().includes("aborted");

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
      if (err.response?.status === 401 || isAbortError(err)) return new Set();
      console.error("Fetch pinned sites failed:", err);
      return new Set();
    } finally {
      pinnedSitesFlight = null;
    }
  })();
  return pinnedSitesFlight;
};

const fetchPagedSites = async (status, searchQuery, pageNum, limit = PAGE_SIZE) => {
  pagedSitesFlight = (async () => {
    try {
      let url = `${API_BASE}?page=${pageNum}&limit=${limit}`;
      if (status && status !== "ALL") url += `&status=${status}`;
      if (searchQuery && searchQuery.trim())
        url += `&q=${encodeURIComponent(searchQuery.trim())}`;
      const res = await axios.get(url);
      return {
        data: res.data?.data || [],
        totalCount: res.data?.totalCount ?? res.data?.total ?? 0,
      };
    } catch (err) {
      if (err.response?.status === 401 || isAbortError(err))
        return { data: [], totalCount: 0 };
      console.error("Fetch paged sites failed:", err);
      return { data: [], totalCount: 0 };
    } finally {
      pagedSitesFlight = null;
    }
  })();
  return pagedSitesFlight;
};

const fetchAllSitesFull = async () => {
  if (allSitesFullFlight) return allSitesFullFlight;
  allSitesFullFlight = (async () => {
    try {
      const res = await axios.get(`${API_BASE}?status=ALL&page=1&limit=10000`);
      return res.data?.data || [];
    } catch (err) {
      if (err.response?.status === 401 || isAbortError(err)) return [];
      console.error("Fetch all sites (full) failed:", err);
      return [];
    } finally {
      allSitesFullFlight = null;
    }
  })();
  return allSitesFullFlight;
};

// ─── AppContent is defined OUTSIDE App so its identity never changes ─────────
// Defining it inside App would cause React to see a new component type on every
// render, unmounting and remounting the whole tree (losing input focus, etc.).
const AppContent = ({
  // data
  safeUrls, safeAllUrls, upSites, downSites,
  reportData, reportSearch, setReportSearch,
  // pagination / filter
  search, setSearch, selectedStatus, setSelectedStatus,
  page, setPage, totalPages, totalCount,
  // popups
  popupData, setPopupData,
  // handlers
  handlePin, handleDelete, handleEditClick,
  handleBulkDelete, handleRefresh, handleLogout, handleAddUrl, handleSaveEdit,
  // edit state (passed down to EditPage)
  editItem, setEditItem,
  editDomain, setEditDomain,
  editUrl, setEditUrl,
  editEmail, setEditEmail,
  editPhone, setEditPhone,
  editPriority, setEditPriority,
  editResponseThresholdMs, setEditResponseThresholdMs,
  editRegions, setEditRegions,
  editCheckFrequency, setEditCheckFrequency,
  editAlertRouting, setEditAlertRouting,
  editAlertGroups, setEditAlertGroups,
  urlError, setUrlError,
  // add form state
  domain, setDomain,
  url, setUrl,
  // misc
  isRefreshing, currentUser,
  deleteModalOpen, setDeleteModalOpen,
  bulkDeleteIds, setBulkDeleteIds,
  isDeleting, handleConfirmBulkDelete,
  urls,
}) => {
  const { currentTheme } = useTheme();
  const userRole = currentUser?.role?.toUpperCase();

  return (
    <div id="main-container" className="min-h-screen" style={{ background: currentTheme.bg }}>
      <Header
        handleRefresh={handleRefresh}
        isRefreshing={isRefreshing}
        handleLogout={handleLogout}
        currentUser={currentUser}
      />

      <main className="p-4 md:p-6 max-w-6xl mx-auto">
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
              userRole === "SUPERADMIN" ? <Logs /> : <Navigate to="/dashboard" />
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

          <Route path="/escalation-groups" element={<EscalationGroups />} />

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

      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setBulkDeleteIds([]);
        }}
        onConfirm={handleConfirmBulkDelete}
        title="Bulk Delete Websites"
        message={`Are you sure you want to delete ${bulkDeleteIds.length} selected website(s)? This action cannot be undone.`}
        loading={isDeleting}
      />
    </div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────

function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [isLoggedIn, setIsLoggedIn]   = useState(!!localStorage.getItem("loginToken"));
  const navigate                       = useNavigate();
  const [message, setMessage]          = useState("");        // eslint-disable-line no-unused-vars

  const [urls, setUrls]       = useState([]);
  const [allUrls, setAllUrls] = useState([]);

  const [selectedStatus, setSelectedStatus] = useState("ALL");
  const [search, setSearch]                 = useState("");
  const [page, setPage]                     = useState(1);
  const [totalPages, setTotalPages]         = useState(1);
  const [totalCount, setTotalCount]         = useState(0);

  const [domain, setDomain]   = useState("");
  const [url, setUrl]         = useState("");
  const [urlError, setUrlError] = useState("");

  const [reportSearch, setReportSearch] = useState("");

  const [editItem, setEditItem]                             = useState(null);
  const [editDomain, setEditDomain]                         = useState("");
  const [editUrl, setEditUrl]                               = useState("");
  const [editEmail, setEditEmail]                           = useState([]);
  const [editPhone, setEditPhone]                           = useState([]);
  const [editPriority, setEditPriority]                     = useState(0);
  const [editResponseThresholdMs, setEditResponseThresholdMs] = useState("");
  const [editRegions, setEditRegions]                       = useState([]);
  const [editCheckFrequency, setEditCheckFrequency]         = useState(DEFAULT_FREQUENCY_MS);
  const [editAlertRouting, setEditAlertRouting]             = useState({ down: [], trouble: [], critical: [] });
  const [editAlertGroups, setEditAlertGroups]               = useState({ group1: [], group2: [], group3: [] });

  const [popupData, setPopupData]     = useState(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [bulkDeleteIds, setBulkDeleteIds]     = useState([]);
  const [isDeleting, setIsDeleting]           = useState(false);

  /* ================= HELPERS ================= */

  const loadData = useCallback(
    async (status, searchQuery, pageNum) => {
      const token = localStorage.getItem("loginToken");
      if (!token) return;

      const resolvedStatus = status ?? selectedStatus;
      const resolvedSearch = searchQuery ?? search;
      const resolvedPage   = pageNum ?? page;

      try {
        const pinnedIds = await fetchPinnedIds();

        if (pinnedIds.size > 0) {
          const rawAll = await fetchAllSitesFull();

          let pinned   = rawAll.filter((u) =>  pinnedIds.has(u._id)).map((u) => ({ ...u, pinned: true }));
          let unpinned = rawAll.filter((u) => !pinnedIds.has(u._id)).map((u) => ({ ...u, pinned: false }));

          if (resolvedSearch && resolvedSearch.trim()) {
            const q = resolvedSearch.toLowerCase();
            const matchesSearch = (u) =>
              (u.domain || "").toLowerCase().includes(q) ||
              (u.url    || "").toLowerCase().includes(q);
            pinned   = pinned.filter(matchesSearch);
            unpinned = unpinned.filter(matchesSearch);
          }

          if (resolvedStatus && resolvedStatus !== "ALL") {
            pinned   = pinned.filter((u)   => u.status === resolvedStatus);
            unpinned = unpinned.filter((u) => u.status === resolvedStatus);
          }

          const combined        = [...pinned, ...unpinned];
          const actualTotalCount = combined.length;
          const start            = (resolvedPage - 1) * PAGE_SIZE;
          const pageData         = combined.slice(start, start + PAGE_SIZE);

          setUrls(pageData);
          const pages = Math.max(1, Math.ceil(actualTotalCount / PAGE_SIZE));
          setTotalCount(actualTotalCount);
          setTotalPages(pages);
          setPage(Math.min(resolvedPage, pages));
          setAllUrls(rawAll.map((u) => ({ ...u, pinned: pinnedIds.has(u._id) })));
        } else {
          const { data: pagedData, totalCount } =
            await fetchPagedSites(resolvedStatus, resolvedSearch, resolvedPage);

          const pageData = pagedData.map((u) => ({ ...u, pinned: false }));

          setUrls(pageData);
          const pages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
          setTotalCount(totalCount);
          setTotalPages(pages);
          setPage(Math.min(resolvedPage, pages));

          fetchAllSitesFull().then((rawAll) => {
            setAllUrls(rawAll.map((u) => ({ ...u, pinned: pinnedIds.has(u._id) })));
          });
        }
      } catch (err) {
        if (!isAbortError(err)) console.error("Load data failed:", err);
      }
    },
    [selectedStatus, search, page]
  );

  /* ================= EFFECTS ================= */

  useEffect(() => { document.documentElement.classList.add("dark"); }, []);

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

  useEffect(() => { setPage(1); }, [search, selectedStatus]);

  /* ================= HANDLERS ================= */

  const handleAddUrl = useCallback(async (data) => {
    const {
      domain, url, category, responseThresholdMs, alertChannels,
      regions, alertIfAllRegionsDown, emailContact, phoneContact,
      priority, checkFrequency, selectedEmailNotificationGroups,
      selectedPhoneNotificationGroups,
    } = data;

    if (!domain || !url) { setUrlError("Domain and URL are required"); return; }
    if (!isValidUrl(url)) { setUrlError("Please enter a valid URL (https://example.com)"); return; }

    try {
      await axios.post(API_BASE, {
        domain, url, category, responseThresholdMs, alertChannels,
        regions, alertIfAllRegionsDown, emailContact, phoneContact,
        priority, checkFrequency,
        alertRouting: data.alertRouting || { down: [], trouble: [], critical: [] },
        alertGroups:  data.alertGroups  || { group1: [], group2: [], group3: [] },
        selectedEmailNotificationGroups: selectedEmailNotificationGroups || [],
        selectedPhoneNotificationGroups: selectedPhoneNotificationGroups || [],
      });
      setDomain("");
      setUrl("");
      setUrlError("");
      await loadData(selectedStatus, search, 1);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      setUrlError(err.response?.data?.message || "Failed to add site");
    }
  }, [loadData, selectedStatus, search, navigate]);

  const handleDelete = useCallback(async (id) => {
    try {
      await axios.delete(`${API_BASE}/${id}`);
      await loadData(selectedStatus, search, page);
    } catch (err) {
      console.error(err);
      alert("Failed to delete site");
    }
  }, [loadData, selectedStatus, search, page]);

  const handleBulkDelete = useCallback(async (ids = []) => {
    if (!Array.isArray(ids) || ids.length === 0) return;
    setBulkDeleteIds(ids);
    setDeleteModalOpen(true);
  }, []);

  const handleConfirmBulkDelete = useCallback(async () => {
    setIsDeleting(true);
    try {
      const token = localStorage.getItem("loginToken");
      await Promise.all(
        bulkDeleteIds.map((id) =>
          axios.delete(`${API_BASE}/${id}`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      setDeleteModalOpen(false);
      setBulkDeleteIds([]);
      await loadData(selectedStatus, search, page);
    } catch (err) {
      console.error("Bulk delete failed", err);
      alert("Failed to delete selected sites");
    } finally {
      setIsDeleting(false);
    }
  }, [bulkDeleteIds, loadData, selectedStatus, search, page]);

  const handlePin = useCallback(async (id) => {
    try {
      const token = localStorage.getItem("loginToken");
      const site  = urls.find((u) => u._id === id) || allUrls.find((u) => u._id === id);
      if (!site) return;

      const isCurrentlyPinned = site.pinned || false;
      const togglePin = (list) =>
        list.map((u) => u._id === id ? { ...u, pinned: !isCurrentlyPinned } : u);
      setUrls(togglePin(urls));
      setAllUrls(togglePin(allUrls));

      if (isCurrentlyPinned) {
        await axios.delete(`/user/unpin-site/${id}`, { headers: { Authorization: `Bearer ${token}` } });
      } else {
        await axios.post(`/user/pin-site/${id}`, {}, { headers: { Authorization: `Bearer ${token}` } });
      }

      await loadData(selectedStatus, search, page);
    } catch (err) {
      console.error("Pin/Unpin failed:", err);
      alert("Failed to pin/unpin website");
      await loadData(selectedStatus, search, page);
    }
  }, [urls, allUrls, loadData, selectedStatus, search, page]);

  const handleEditClick = useCallback((item) => {
    setEditItem(item);
    setEditDomain(item.domain || "");
    setEditUrl(item.url || "");
    setEditEmail(
      Array.isArray(item.emailContact) ? item.emailContact
      : item.emailContact ? [item.emailContact] : []
    );
    setEditPhone(
      Array.isArray(item.phoneContact) ? item.phoneContact
      : item.phoneContact ? [item.phoneContact] : []
    );
    setEditPriority(
      item.priority !== undefined && item.priority !== null ? Number(item.priority) : 0
    );
    setEditResponseThresholdMs(
      item.responseThresholdMs !== undefined && item.responseThresholdMs !== null
        ? item.responseThresholdMs : ""
    );
    setEditRegions(Array.isArray(item.regions) ? item.regions : []);
    setEditCheckFrequency(
      item.checkFrequency !== undefined && item.checkFrequency !== null
        ? Number(item.checkFrequency) : DEFAULT_FREQUENCY_MS
    );
    setEditAlertRouting(item.alertRouting || { down: [], trouble: [], critical: [] });
    setEditAlertGroups(item.alertGroups  || { group1: [], group2: [], group3: [] });
    navigate("/edit");
  }, [navigate]);

  const handleSaveEdit = useCallback(async (category, selectedEmailGroups, selectedPhoneGroups) => {
    if (!editDomain.trim() || !editUrl.trim()) { setUrlError("Domain and URL are required"); return; }
    if (!isValidUrl(editUrl)) { setUrlError("Please enter a valid URL"); return; }

    try {
      const token = localStorage.getItem("loginToken");
      await axios.put(
        `${API_BASE}/${editItem._id}`,
        {
          domain: editDomain.trim(),
          url:    editUrl.trim(),
          category: category?.trim() || null,
          emailContact: Array.isArray(editEmail) ? editEmail : editEmail ? [editEmail] : [],
          phoneContact: Array.isArray(editPhone) ? editPhone : editPhone ? [editPhone] : [],
          priority:     Number(editPriority || 0),
          responseThresholdMs:
            editResponseThresholdMs !== "" && editResponseThresholdMs !== null
              ? Number(editResponseThresholdMs) : null,
          regions: Array.isArray(editRegions) ? editRegions : [],
          checkFrequency:
            editCheckFrequency !== null && editCheckFrequency !== undefined
              ? Number(editCheckFrequency) : DEFAULT_FREQUENCY_MS,
          alertRouting: editAlertRouting,
          alertGroups:  editAlertGroups,
          selectedEmailNotificationGroups: selectedEmailGroups || [],
          selectedPhoneNotificationGroups: selectedPhoneGroups || [],
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
      setEditCheckFrequency(DEFAULT_FREQUENCY_MS);
      setEditAlertRouting({ down: [], trouble: [], critical: [] });
      setEditAlertGroups({ group1: [], group2: [], group3: [] });
      await loadData(selectedStatus, search, page);
      navigate("/dashboard");
    } catch (err) {
      console.error(err);
      alert("Failed to update site");
    }
  }, [
    editItem, editDomain, editUrl, editEmail, editPhone, editPriority,
    editResponseThresholdMs, editRegions, editCheckFrequency,
    editAlertRouting, editAlertGroups, loadData, selectedStatus, search, page, navigate,
  ]);

  const handleRefresh = useCallback(async () => {
    try {
      setIsRefreshing(true);
      await loadData(selectedStatus, search, page);
    } finally {
      setTimeout(() => setIsRefreshing(false), 600);
    }
  }, [loadData, selectedStatus, search, page]);

  const handleLogout = useCallback(async () => {
    try { await axios.post("/auth/logout"); } catch (err) { console.error("Logout error:", err); }
    localStorage.removeItem("loginToken");
    localStorage.removeItem("user");
    setIsLoggedIn(false);
    setCurrentUser(null);
    setUrls([]);
    setAllUrls([]);
    navigate("/login");
  }, [navigate]);

  /* ================= DERIVED ================= */

  const safeUrls    = Array.isArray(urls)    ? urls    : [];
  const safeAllUrls = Array.isArray(allUrls) ? allUrls : [];

  const allStatusMap = safeAllUrls.reduce((acc, u) => {
    const s = u.status || "UNKNOWN";
    if (!acc[s]) acc[s] = [];
    acc[s].push(u);
    return acc;
  }, {});

  const upSites   = [...(allStatusMap["UP"] || []), ...(allStatusMap["SLOW"] || [])];
  const downSites = [...(allStatusMap["DOWN"] || [])];

  const reportData = safeAllUrls
    .filter(
      (u) =>
        (u.domain || "").toLowerCase().includes(reportSearch.toLowerCase()) ||
        (u.url    || "").toLowerCase().includes(reportSearch.toLowerCase())
    )
    .map((u) => ({ name: u.domain, upTime: u.upTime || 0, downTime: u.downTime || 0 }));

  /* ================= RENDER ================= */

  if (!isLoggedIn) {
    return (
      <ThemeProvider>
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
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <AppContent
        // data
        safeUrls={safeUrls}
        safeAllUrls={safeAllUrls}
        upSites={upSites}
        downSites={downSites}
        reportData={reportData}
        reportSearch={reportSearch}
        setReportSearch={setReportSearch}
        // pagination / filter
        search={search}
        setSearch={setSearch}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        page={page}
        setPage={setPage}
        totalPages={totalPages}
        totalCount={totalCount}
        // popups
        popupData={popupData}
        setPopupData={setPopupData}
        // handlers
        handlePin={handlePin}
        handleDelete={handleDelete}
        handleEditClick={handleEditClick}
        handleBulkDelete={handleBulkDelete}
        handleRefresh={handleRefresh}
        handleLogout={handleLogout}
        handleAddUrl={handleAddUrl}
        handleSaveEdit={handleSaveEdit}
        // edit state
        editItem={editItem}
        setEditItem={setEditItem}
        editDomain={editDomain}
        setEditDomain={setEditDomain}
        editUrl={editUrl}
        setEditUrl={setEditUrl}
        editEmail={editEmail}
        setEditEmail={setEditEmail}
        editPhone={editPhone}
        setEditPhone={setEditPhone}
        editPriority={editPriority}
        setEditPriority={setEditPriority}
        editResponseThresholdMs={editResponseThresholdMs}
        setEditResponseThresholdMs={setEditResponseThresholdMs}
        editRegions={editRegions}
        setEditRegions={setEditRegions}
        editCheckFrequency={editCheckFrequency}
        setEditCheckFrequency={setEditCheckFrequency}
        editAlertRouting={editAlertRouting}
        setEditAlertRouting={setEditAlertRouting}
        editAlertGroups={editAlertGroups}
        setEditAlertGroups={setEditAlertGroups}
        urlError={urlError}
        setUrlError={setUrlError}
        // add form state
        domain={domain}
        setDomain={setDomain}
        url={url}
        setUrl={setUrl}
        // misc
        isRefreshing={isRefreshing}
        currentUser={currentUser}
        deleteModalOpen={deleteModalOpen}
        setDeleteModalOpen={setDeleteModalOpen}
        bulkDeleteIds={bulkDeleteIds}
        setBulkDeleteIds={setBulkDeleteIds}
        isDeleting={isDeleting}
        handleConfirmBulkDelete={handleConfirmBulkDelete}
        urls={urls}
      />
    </ThemeProvider>
  );
}

export default App;