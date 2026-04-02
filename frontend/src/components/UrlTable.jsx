import {
  Pin, PinOff, Trash2, Filter, Settings2, Search,
} from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import SiteReport from "./SiteReport";

// ─── Env-based API base URL ───────────────────────────────────────────────────
const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const LOG_API_BASE = `${API_BASE}/uptime-logs`;

// ─── Mono label style ─────────────────────────────────────────────────────────
const monoLabel = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "9px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

// ─── HUD Filter Dropdown (SSL / Status / Role) ───────────────────────────────
const FilterDropdown = ({ options, value, onSelect, onClear, dropRef, style = {} }) => (
  <motion.div
    ref={dropRef}
    initial={{ opacity: 0, y: 6, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 4, scale: 0.97 }}
    transition={{ duration: 0.18 }}
    style={{
      position: "absolute",
      top: "calc(100% + 8px)",
      left: 0,
      zIndex: 999,
      width: "192px",
      background: "rgba(3,7,18,0.97)",
      border: "1px solid rgba(56,189,248,0.14)",
      backdropFilter: "blur(28px)",
      boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 24px rgba(56,189,248,0.05)",
      borderRadius: "16px",
      overflow: "hidden",
      ...style,
    }}
  >
    {options.map((opt) => (
      <button
        key={opt}
        onClick={() => onSelect(opt)}
        className="flex items-center justify-between w-full px-4 py-2.5 transition-all duration-200"
        style={{
          ...monoLabel,
          fontSize: "10px",
          color: value === opt ? "#38bdf8" : "rgba(148,163,184,0.7)",
          background: value === opt ? "rgba(56,189,248,0.07)" : "transparent",
          borderLeft: value === opt ? "2px solid rgba(56,189,248,0.45)" : "2px solid transparent",
        }}
        onMouseEnter={(e) => {
          if (value !== opt) e.currentTarget.style.background = "rgba(255,255,255,0.03)";
        }}
        onMouseLeave={(e) => {
          if (value !== opt) e.currentTarget.style.background = "transparent";
        }}
      >
        <span>{opt}</span>
        {value === opt && <span style={{ color: "#38bdf8", fontSize: "8px" }}>✓</span>}
      </button>
    ))}
    <div style={{ borderTop: "1px solid rgba(56,189,248,0.07)", margin: "4px 0" }} />
    <button
      onClick={onClear}
      className="w-full px-4 py-2.5 text-left transition-all duration-200"
      style={{ ...monoLabel, fontSize: "10px", color: "rgba(248,113,113,0.6)" }}
      onMouseEnter={(e) => (e.currentTarget.style.color = "#f87171")}
      onMouseLeave={(e) => (e.currentTarget.style.color = "rgba(248,113,113,0.6)")}
    >
      Clear Filter
    </button>
  </motion.div>
);

// ─── HUD Column Settings ──────────────────────────────────────────────────────
const ColumnMenu = ({
  filteredColumns,
  hiddenColumns,
  toggleColumn,
  searchColumn,
  setSearchColumn,
  DEFAULT_COLUMNS,
  menuRef,
}) => (
  <motion.div
    ref={menuRef}
    initial={{ opacity: 0, y: 6, scale: 0.97 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    exit={{ opacity: 0, y: 4, scale: 0.97 }}
    transition={{ duration: 0.18 }}
    className="absolute right-0 top-full mt-2 w-64 rounded-2xl z-50"
    style={{
      background: "rgba(3,7,18,0.97)",
      border: "1px solid rgba(56,189,248,0.14)",
      backdropFilter: "blur(28px)",
      boxShadow: "0 8px 40px rgba(0,0,0,0.6), 0 0 24px rgba(56,189,248,0.04)",
      overflow: "hidden",
    }}
  >
    <div
      className="h-[1px]"
      style={{
        background:
          "linear-gradient(90deg, transparent, rgba(56,189,248,0.4) 40%, rgba(129,140,248,0.3) 70%, transparent)",
      }}
    />
    <div className="px-4 py-3" style={{ borderBottom: "1px solid rgba(56,189,248,0.07)" }}>
      <span
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontSize: "10px",
          fontWeight: 700,
          letterSpacing: "0.08em",
          color: "white",
        }}
      >
        MANAGE COLUMNS
      </span>
    </div>
    <div className="p-3" style={{ borderBottom: "1px solid rgba(56,189,248,0.07)" }}>
      <div
        className="flex items-center gap-2 px-3 py-2 rounded-xl"
        style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(56,189,248,0.09)" }}
      >
        <Search size={12} style={{ color: "rgba(56,189,248,0.4)" }} />
        <input
          type="text"
          placeholder="Search column..."
          value={searchColumn}
          onChange={(e) => setSearchColumn(e.target.value)}
          className="bg-transparent outline-none w-full"
          style={{ ...monoLabel, fontSize: "10px", color: "rgba(148,163,184,0.8)" }}
        />
      </div>
    </div>
    <div className="max-h-56 overflow-y-auto p-2">
      {filteredColumns.map((col) => (
        <label
          key={col}
          className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200"
          style={{ marginBottom: "2px" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(56,189,248,0.05)")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
        >
          <span
            style={{
              ...monoLabel,
              fontSize: "10px",
              color: hiddenColumns.includes(col) ? "rgba(148,163,184,0.3)" : "rgba(148,163,184,0.8)",
            }}
          >
            {col}
          </span>
          <div
            onClick={() => toggleColumn(col)}
            className="relative w-8 h-4 rounded-full cursor-pointer transition-all duration-300"
            style={{
              background: !hiddenColumns.includes(col) ? "rgba(56,189,248,0.28)" : "rgba(255,255,255,0.06)",
              border: !hiddenColumns.includes(col)
                ? "1px solid rgba(56,189,248,0.45)"
                : "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <div
              className="absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300"
              style={{
                left: !hiddenColumns.includes(col) ? "17px" : "2px",
                background: !hiddenColumns.includes(col) ? "#38bdf8" : "rgba(148,163,184,0.3)",
                boxShadow: !hiddenColumns.includes(col) ? "0 0 8px rgba(56,189,248,0.6)" : "none",
              }}
            />
          </div>
        </label>
      ))}
    </div>
    <div className="px-4 py-2.5" style={{ borderTop: "1px solid rgba(56,189,248,0.07)" }}>
      <span style={{ ...monoLabel, fontSize: "9px", color: "rgba(56,189,248,0.35)" }}>
        {DEFAULT_COLUMNS.length - hiddenColumns.length} columns visible
      </span>
    </div>
  </motion.div>
);

// ─── Th Cell — sticky-aware + relative for attached dropdowns ────────────────
const Th = ({ children, className = "", style = {}, ...rest }) => (
  <th
    className={`px-4 py-3 text-left whitespace-nowrap ${className}`}
    style={{
      ...monoLabel,
      fontSize: "9px",
      color: "rgba(56,189,248,0.5)",
      position: "sticky",
      top: 0,
      zIndex: 40,
      background: "rgba(3,7,18,0.97)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderBottom: "1px solid rgba(56,189,248,0.13)",
      fontWeight: 400,
      ...style,
    }}
    {...rest}
  >
    <div style={{ position: "relative", display: "inline-block" }}>{children}</div>
  </th>
);

// ─── Filter Button ────────────────────────────────────────────────────────────
const FilterBtn = ({ active, onClick, btnRef }) => (
  <button
    ref={btnRef}
    onClick={onClick}
    className="inline-flex items-center justify-center w-5 h-5 rounded-md transition-all duration-200"
    style={{
      background: active ? "rgba(56,189,248,0.15)" : "transparent",
      color: active ? "#38bdf8" : "rgba(148,163,184,0.3)",
      border: active ? "1px solid rgba(56,189,248,0.28)" : "1px solid transparent",
    }}
  >
    <Filter size={10} />
  </button>
);

// ─── Status Badge ─────────────────────────────────────────────────────────────
const StatusBadge = ({ status }) => {
  const map = {
    UP: { color: "#34d399", bg: "rgba(52,211,153,0.08)", border: "rgba(52,211,153,0.22)" },
    SLOW: { color: "#fbbf24", bg: "rgba(251,191,36,0.08)", border: "rgba(251,191,36,0.22)" },
    DOWN: { color: "#f87171", bg: "rgba(248,113,113,0.08)", border: "rgba(248,113,113,0.22)" },
  };
  const s =
    map[status] || {
      color: "rgba(148,163,184,0.5)",
      bg: "rgba(255,255,255,0.04)",
      border: "rgba(255,255,255,0.08)",
    };
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full"
      style={{ background: s.bg, border: `1px solid ${s.border}` }}
    >
      <motion.span
        className="w-1.5 h-1.5 rounded-full flex-shrink-0"
        style={{ background: s.color, boxShadow: `0 0 5px ${s.color}` }}
        animate={status === "DOWN" ? { opacity: [1, 0.3, 1] } : {}}
        transition={{ duration: 0.9, repeat: Infinity }}
      />
      <span style={{ ...monoLabel, fontSize: "9px", color: s.color }}>{status || "CHECKING"}</span>
    </span>
  );
};

// ─── SSL Badge ────────────────────────────────────────────────────────────────
const SslBadge = ({ item }) => {
  const getText = () => {
    if (!item.sslStatus) return "Checking";
    if (item.sslStatus === "VALID") return "Secure";
    if (item.sslStatus === "EXPIRING") return `Expiring (${item.sslDaysRemaining}d)`;
    if (item.sslStatus === "ERROR") return "Error";
    return item.sslStatus;
  };
  const colorMap = { VALID: "#34d399", EXPIRING: "#fbbf24", EXPIRED: "#f87171", ERROR: "#f87171" };
  const color = colorMap[item.sslStatus] || "rgba(148,163,184,0.5)";
  return <span style={{ ...monoLabel, fontSize: "10px", color }}>{getText()}</span>;
};

// ─── Action Button ────────────────────────────────────────────────────────────
const ActionBtn = ({ onClick, title, children, danger = false }) => (
  <motion.button
    whileHover={{ scale: 1.14, y: -1 }}
    whileTap={{ scale: 0.88 }}
    onClick={onClick}
    title={title}
    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200"
    style={{
      background: danger ? "rgba(248,113,113,0.07)" : "rgba(56,189,248,0.07)",
      border: danger ? "1px solid rgba(248,113,113,0.14)" : "1px solid rgba(56,189,248,0.12)",
      color: danger ? "rgba(248,113,113,0.7)" : "rgba(56,189,248,0.65)",
    }}
  >
    {children}
  </motion.button>
);

// ─── Row Expand Icon ──────────────────────────────────────────────────────────
const ExpandChevron = ({ expanded }) => (
  <motion.span
    animate={{ rotate: expanded ? 180 : 0 }}
    transition={{ duration: 0.22 }}
    style={{ display: "inline-block", color: "rgba(56,189,248,0.45)", fontSize: "10px" }}
  >
    ▼
  </motion.span>
);

// ─── Main UrlTable ────────────────────────────────────────────────────────────
const UrlTable = ({
  urls,
  allUrls,
  theme,
  currentUser,
  selectedSslStatus,
  setSelectedSslStatus,
  onPin,
  onDelete,
  onEdit,
  selectionMode = false,
  selectedIds = [],
  setSelectedIds = () => {},
  categories = [],
  selectedCategories,
  setSelectedCategories,
  selectedStatus,
  setSelectedStatus,
}) => {
  const isViewer = currentUser?.role?.toUpperCase() === "VIEWER";
  const isSuperAdmin = currentUser?.role?.toUpperCase() === "SUPERADMIN";

  const BASE_COLUMNS = ["sno", "domain", "url", "ssl", "status", "statusCode", "lastCheckedAt", "actions"];
  const ADMIN_COLUMNS = ["userEmail", "userRole"];
  const DEFAULT_COLUMNS = isSuperAdmin
    ? [...BASE_COLUMNS.slice(0, 5), ...ADMIN_COLUMNS, ...BASE_COLUMNS.slice(5)]
    : BASE_COLUMNS;

  // ── Scroll container ref ────────────────────────────────────────────────────
  const scrollContainerRef = useRef(null);

  // ── Column state ────────────────────────────────────────────────────────────
  const [searchColumn, setSearchColumn] = useState("");
  const visibleColumnsForRole = DEFAULT_COLUMNS.filter((col) => {
    if (!isSuperAdmin && (col === "userEmail" || col === "userRole")) return false;
    if (isViewer && col === "actions") return false;
    return true;
  });
  const filteredColumns = visibleColumnsForRole.filter((col) =>
    col.toLowerCase().includes(searchColumn.toLowerCase())
  );

  // ── Refs ────────────────────────────────────────────────────────────────────
  const columnMenuRef = useRef(null);
  const domainFilterRef = useRef(null);
  const sslFilterRef = useRef(null);
  const statusFilterRef = useRef(null);
  const roleFilterRef = useRef(null);

  // ── UI state ────────────────────────────────────────────────────────────────
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
  const [selectedRole, setSelectedRole] = useState("ALL");
  const [sortOrder, setSortOrder] = useState("ASC");
  const [expandedSite, setExpandedSite] = useState(null);
  const [siteLogs, setSiteLogs] = useState({});

  // dropdown open states
  const [showDomainFilter, setShowDomainFilter] = useState(false);
  const [showSslFilter, setShowSslFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);
  const [showRoleFilter, setShowRoleFilter] = useState(false);

  // ── Derived options ─────────────────────────────────────────────────────────
  const roleOptions = useMemo(() => {
    const roles = allUrls.map((u) => u.ownerRole).filter(Boolean);
    return ["ALL", ...Array.from(new Set(roles))];
  }, [allUrls]);

  const sslOptions = useMemo(() => {
    const sslStatuses = allUrls.map((u) => u.sslStatus).filter(Boolean);
    return ["ALL", ...Array.from(new Set(sslStatuses))];
  }, [allUrls]);

  const statusOptions = useMemo(() => {
    const statuses = allUrls.map((u) => u.status).filter(Boolean);
    return ["ALL", ...Array.from(new Set(statuses))];
  }, [allUrls]);

  // ── Filtered + sorted data ──────────────────────────────────────────────────
  const filteredData = urls.filter((u) => {
    const categoryMatch = selectedCategories.includes("ALL") || selectedCategories.includes(u.category);
    const statusMatch = selectedStatus === "ALL" || u.status === selectedStatus;
    const sslMatch = selectedSslStatus === "ALL" || u.sslStatus === selectedSslStatus;
    const roleMatch = selectedRole === "ALL" || u.ownerRole === selectedRole;
    return categoryMatch && statusMatch && sslMatch && roleMatch;
  });

  const sortedData = [...filteredData].sort((a, b) => {
    if (a.pinned !== b.pinned) return (b.pinned === true) - (a.pinned === true);
    const statusA = a.statusPriority ?? 4;
    const statusB = b.statusPriority ?? 4;
    if (statusA !== statusB) return statusA - statusB;
    const sslA = a.sslPriority ?? 5;
    const sslB = b.sslPriority ?? 5;
    if (sslA !== sslB) return sslA - sslB;
    return sortOrder === "ASC" ? a.domain.localeCompare(b.domain) : b.domain.localeCompare(a.domain);
  });

  // ── Fetch hidden columns on mount ───────────────────────────────────────────
  useEffect(() => {
    const fetchHiddenColumns = async () => {
      try {
        const token = localStorage.getItem("loginToken");
        const res = await axios.get(`${API_BASE}/user/hidden-columns`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHiddenColumns(res.data.hiddenColumns || []);
      } catch (err) {
        console.error("Failed to fetch hidden columns");
      }
    };
    fetchHiddenColumns();
  }, []);

  // ── Close all dropdowns on outside click ────────────────────────────────────
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target)) {
        setShowColumnMenu(false);
      }

      if (domainFilterRef.current && !domainFilterRef.current.contains(event.target)) {
        if (!event.target.closest("[data-domain-filter-btn]")) setShowDomainFilter(false);
      }

      if (sslFilterRef.current && !sslFilterRef.current.contains(event.target)) {
        if (!event.target.closest("[data-ssl-filter-btn]")) setShowSslFilter(false);
      }

      if (statusFilterRef.current && !statusFilterRef.current.contains(event.target)) {
        if (!event.target.closest("[data-status-filter-btn]")) setShowStatusFilter(false);
      }

      if (roleFilterRef.current && !roleFilterRef.current.contains(event.target)) {
        if (!event.target.closest("[data-role-filter-btn]")) setShowRoleFilter(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // ── Toggle column visibility ────────────────────────────────────────────────
  const toggleColumn = async (column) => {
    if (!isSuperAdmin && (column === "userEmail" || column === "userRole")) return;
    const updated = hiddenColumns.includes(column)
      ? hiddenColumns.filter((c) => c !== column)
      : [...hiddenColumns, column];
    setHiddenColumns(updated);
    try {
      const token = localStorage.getItem("loginToken");
      await axios.put(
        `${API_BASE}/user/hidden-columns`,
        { hiddenColumns: updated },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (err) {
      console.error("Save hidden column failed");
    }
  };

  // ── Expand / collapse site report row ──────────────────────────────────────
  const handleToggleSite = async (item) => {
    const next = expandedSite === item._id ? null : item._id;
    setExpandedSite(next);
    if (next && !siteLogs[item._id]) {
      try {
        const token = localStorage.getItem("loginToken");
        const res = await axios.get(`${LOG_API_BASE}/${item._id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        setSiteLogs((prev) => ({ ...prev, [item._id]: res.data?.data || [] }));
      } catch (err) {
        console.error("Failed to fetch site logs", err);
        setSiteLogs((prev) => ({ ...prev, [item._id]: [] }));
      }
    }
  };

  // ── Close all filter dropdowns helper ──────────────────────────────────────
  const closeAllFilters = () => {
    setShowDomainFilter(false);
    setShowSslFilter(false);
    setShowStatusFilter(false);
    setShowRoleFilter(false);
  };

  // ── Category helper ─────────────────────────────────────────────────────────
  const removeCategory = (cat) => {
    const updated = selectedCategories.filter((c) => c !== cat);
    setSelectedCategories(updated.length === 0 ? ["ALL"] : updated);
  };

  const toggleCategory = (cat) => {
    if (cat === "ALL") {
      setSelectedCategories(["ALL"]);
    } else {
      let updated = [...selectedCategories].filter((c) => c !== "ALL");
      updated = updated.includes(cat) ? updated.filter((c) => c !== cat) : [...updated, cat];
      setSelectedCategories(updated.length === 0 ? ["ALL"] : updated);
    }
  };

  // ── colSpan for expanded row ────────────────────────────────────────────────
  const visibleColsCount = DEFAULT_COLUMNS.filter((col) => {
    if (hiddenColumns.includes(col)) return false;
    if (!isSuperAdmin && (col === "userEmail" || col === "userRole")) return false;
    if (isViewer && col === "actions") return false;
    return true;
  }).length + (selectionMode ? 1 : 0);

  // ── Shared chip style ───────────────────────────────────────────────────────
  const chipStyle = {
    display: "inline-flex",
    alignItems: "center",
    gap: "4px",
    padding: "3px 8px",
    borderRadius: "999px",
    background: "rgba(56,189,248,0.12)",
    border: "1px solid rgba(56,189,248,0.3)",
    ...monoLabel,
    fontSize: "9px",
    color: "#38bdf8",
    whiteSpace: "nowrap",
  };

  return (
    <div className="w-full">
      {/* ─── Column Settings (Desktop) ─── */}
      <div className="hidden lg:flex justify-end mb-3 relative">
        <motion.button
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={() => setShowColumnMenu(!showColumnMenu)}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl transition-all duration-300"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "10px",
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            background: showColumnMenu ? "rgba(56,189,248,0.1)" : "rgba(255,255,255,0.04)",
            border: showColumnMenu ? "1px solid rgba(56,189,248,0.28)" : "1px solid rgba(255,255,255,0.08)",
            color: showColumnMenu ? "#38bdf8" : "rgba(148,163,184,0.6)",
          }}
        >
          <Settings2 size={13} />
          Columns
        </motion.button>

        <AnimatePresence>
          {showColumnMenu && (
            <ColumnMenu
              menuRef={columnMenuRef}
              filteredColumns={filteredColumns}
              hiddenColumns={hiddenColumns}
              toggleColumn={toggleColumn}
              searchColumn={searchColumn}
              setSearchColumn={setSearchColumn}
              DEFAULT_COLUMNS={DEFAULT_COLUMNS}
            />
          )}
        </AnimatePresence>
      </div>

      {/* ─── Desktop Table ─── */}
      <div className="hidden lg:block">
        <div
          className="rounded-2xl"
          style={{
            background: "rgba(3,7,18,0.75)",
            border: "1px solid rgba(56,189,248,0.1)",
            backdropFilter: "blur(22px)",
            boxShadow: "0 0 28px rgba(56,189,248,0.04), inset 0 1px 0 rgba(56,189,248,0.05)",
            overflow: "hidden",
          }}
        >
          <div
            className="h-[1px]"
            style={{
              background:
                "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.4) 30%, rgba(129,140,248,0.32) 70%, transparent 100%)",
              flexShrink: 0,
            }}
          />

          <div
            ref={scrollContainerRef}
            style={{
              overflowX: "auto",
              overflowY: "auto",
              maxHeight: "calc(100vh - 220px)",
              borderRadius: "0 0 16px 16px",
            }}
          >
            <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead>
                <tr>
                  {selectionMode && <Th style={{ width: "40px" }} />}
                  {!hiddenColumns.includes("sno") && <Th style={{ width: "50px" }}>S.No</Th>}

                  {/* ── Domain column with attached filter ── */}
                  {!hiddenColumns.includes("domain") && (
                    <Th>
                      <div className="flex items-center gap-2">
                        <span>Domain</span>
                        <div style={{ position: "relative" }}>
                          <div data-domain-filter-btn>
                            <FilterBtn
                              active={!selectedCategories.includes("ALL") || sortOrder !== "ASC"}
                              onClick={() => {
                                const next = !showDomainFilter;
                                closeAllFilters();
                                setShowDomainFilter(next);
                              }}
                            />
                          </div>

                          <AnimatePresence>
                            {showDomainFilter && (
                              <motion.div
                                ref={domainFilterRef}
                                initial={{ opacity: 0, y: 6, scale: 0.97 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 4, scale: 0.97 }}
                                transition={{ duration: 0.18 }}
                                style={{
                                  position: "absolute",
                                  top: "calc(100% + 8px)",
                                  left: 0,
                                  width: "288px",
                                  zIndex: 999,
                                  background: "rgba(3,7,18,0.98)",
                                  border: "1px solid rgba(56,189,248,0.14)",
                                  backdropFilter: "blur(28px)",
                                  boxShadow: "0 8px 40px rgba(0,0,0,0.7), 0 0 24px rgba(56,189,248,0.05)",
                                  borderRadius: "16px",
                                  overflow: "visible",
                                }}
                              >
                                <div
                                  className="h-[1px]"
                                  style={{
                                    background:
                                      "linear-gradient(90deg, transparent, rgba(56,189,248,0.4) 40%, transparent)",
                                    borderRadius: "16px 16px 0 0",
                                  }}
                                />

                                <div
                                  className="px-4 py-3"
                                  style={{ borderBottom: "1px solid rgba(56,189,248,0.07)" }}
                                >
                                  <span
                                    style={{
                                      fontFamily: "'Orbitron', sans-serif",
                                      fontSize: "10px",
                                      fontWeight: 700,
                                      color: "white",
                                      letterSpacing: "0.06em",
                                    }}
                                  >
                                    FILTER DOMAIN
                                  </span>
                                </div>

                                <div className="p-4 space-y-4">
                                  <div>
                                    <p
                                      style={{
                                        ...monoLabel,
                                        fontSize: "9px",
                                        color: "rgba(56,189,248,0.4)",
                                        marginBottom: "10px",
                                      }}
                                    >
                                      Sort Order
                                    </p>
                                    <div className="flex gap-2">
                                      {["ASC", "DESC"].map((order) => (
                                        <button
                                          key={order}
                                          onClick={() => setSortOrder(order)}
                                          className="flex-1 py-2 rounded-xl transition-all duration-200"
                                          style={{
                                            ...monoLabel,
                                            fontSize: "10px",
                                            background:
                                              sortOrder === order
                                                ? "rgba(56,189,248,0.12)"
                                                : "rgba(255,255,255,0.03)",
                                            border:
                                              sortOrder === order
                                                ? "1px solid rgba(56,189,248,0.32)"
                                                : "1px solid rgba(255,255,255,0.06)",
                                            color:
                                              sortOrder === order ? "#38bdf8" : "rgba(148,163,184,0.6)",
                                          }}
                                        >
                                          {order === "ASC" ? "A → Z" : "Z → A"}
                                        </button>
                                      ))}
                                    </div>
                                  </div>

                                  <div>
                                    <p
                                      style={{
                                        ...monoLabel,
                                        fontSize: "9px",
                                        color: "rgba(56,189,248,0.4)",
                                        marginBottom: "10px",
                                      }}
                                    >
                                      Category
                                    </p>

                                    {!selectedCategories.includes("ALL") && selectedCategories.length > 0 && (
                                      <div
                                        style={{
                                          display: "flex",
                                          flexWrap: "wrap",
                                          gap: "4px",
                                          marginBottom: "10px",
                                        }}
                                      >
                                        {selectedCategories.map((cat) => (
                                          <span key={cat} style={chipStyle}>
                                            {cat}
                                            <span
                                              onClick={() => removeCategory(cat)}
                                              style={{
                                                cursor: "pointer",
                                                opacity: 0.7,
                                                fontSize: "11px",
                                                lineHeight: 1,
                                                marginLeft: "2px",
                                              }}
                                            >
                                              ×
                                            </span>
                                          </span>
                                        ))}
                                      </div>
                                    )}

                                    <div
                                      style={{
                                        background: "rgba(3,7,18,0.6)",
                                        border: "1px solid rgba(56,189,248,0.1)",
                                        borderRadius: "12px",
                                        overflow: "hidden",
                                        maxHeight: "220px",
                                        overflowY: "auto",
                                      }}
                                    >
                                      {categories.map((cat, idx) => (
                                        <label
                                          key={cat}
                                          className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-200"
                                          style={{
                                            borderTop: idx === 0 ? "none" : "1px solid rgba(56,189,248,0.04)",
                                          }}
                                          onMouseEnter={(e) =>
                                            (e.currentTarget.style.background = "rgba(56,189,248,0.06)")
                                          }
                                          onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                                        >
                                          <div
                                            className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all duration-200"
                                            style={{
                                              border: selectedCategories.includes(cat)
                                                ? "1px solid rgba(56,189,248,0.5)"
                                                : "1px solid rgba(255,255,255,0.1)",
                                              background: selectedCategories.includes(cat)
                                                ? "rgba(56,189,248,0.15)"
                                                : "transparent",
                                            }}
                                            onClick={() => toggleCategory(cat)}
                                          >
                                            {selectedCategories.includes(cat) && (
                                              <span style={{ color: "#38bdf8", fontSize: "8px" }}>✓</span>
                                            )}
                                          </div>
                                          <span
                                            style={{
                                              ...monoLabel,
                                              fontSize: "10px",
                                              color: selectedCategories.includes(cat)
                                                ? "#38bdf8"
                                                : "rgba(148,163,184,0.7)",
                                            }}
                                          >
                                            {cat}
                                          </span>
                                        </label>
                                      ))}
                                    </div>
                                  </div>
                                </div>

                                <div
                                  className="flex gap-2 px-4 py-3"
                                  style={{ borderTop: "1px solid rgba(56,189,248,0.07)" }}
                                >
                                  <button
                                    onClick={() => {
                                      setSelectedCategories(["ALL"]);
                                      setSortOrder("ASC");
                                    }}
                                    className="flex-1 py-2 rounded-xl transition-all duration-200"
                                    style={{
                                      ...monoLabel,
                                      fontSize: "10px",
                                      background: "rgba(255,255,255,0.03)",
                                      border: "1px solid rgba(255,255,255,0.06)",
                                      color: "rgba(148,163,184,0.6)",
                                    }}
                                  >
                                    Reset
                                  </button>
                                  <button
                                    onClick={() => setShowDomainFilter(false)}
                                    className="flex-1 py-2 rounded-xl transition-all duration-200"
                                    style={{
                                      ...monoLabel,
                                      fontSize: "10px",
                                      background: "rgba(56,189,248,0.1)",
                                      border: "1px solid rgba(56,189,248,0.28)",
                                      color: "#38bdf8",
                                    }}
                                  >
                                    Apply
                                  </button>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </Th>
                  )}

                  {!hiddenColumns.includes("url") && <Th>URL</Th>}

                  {/* ── SSL column ── */}
                  {!hiddenColumns.includes("ssl") && (
                    <Th>
                      <div className="flex items-center gap-2">
                        <span>SSL</span>
                        <div style={{ position: "relative" }}>
                          <div data-ssl-filter-btn>
                            <FilterBtn
                              active={selectedSslStatus !== "ALL"}
                              onClick={() => {
                                const next = !showSslFilter;
                                closeAllFilters();
                                setShowSslFilter(next);
                              }}
                            />
                          </div>

                          <AnimatePresence>
                            {showSslFilter && (
                              <FilterDropdown
                                dropRef={sslFilterRef}
                                options={sslOptions}
                                value={selectedSslStatus}
                                onSelect={(v) => {
                                  setSelectedSslStatus(v);
                                  setShowSslFilter(false);
                                }}
                                onClear={() => {
                                  setSelectedSslStatus("ALL");
                                  setShowSslFilter(false);
                                }}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </Th>
                  )}

                  {/* ── Status column ── */}
                  {!hiddenColumns.includes("status") && (
                    <Th>
                      <div className="flex items-center gap-2">
                        <span>Status</span>
                        <div style={{ position: "relative" }}>
                          <div data-status-filter-btn>
                            <FilterBtn
                              active={selectedStatus !== "ALL"}
                              onClick={() => {
                                const next = !showStatusFilter;
                                closeAllFilters();
                                setShowStatusFilter(next);
                              }}
                            />
                          </div>

                          <AnimatePresence>
                            {showStatusFilter && (
                              <FilterDropdown
                                dropRef={statusFilterRef}
                                options={statusOptions}
                                value={selectedStatus}
                                onSelect={(v) => {
                                  setSelectedStatus(v);
                                  setShowStatusFilter(false);
                                }}
                                onClear={() => {
                                  setSelectedStatus("ALL");
                                  setShowStatusFilter(false);
                                }}
                              />
                            )}
                          </AnimatePresence>
                        </div>
                      </div>
                    </Th>
                  )}

                  {/* ── SuperAdmin columns ── */}
                  {isSuperAdmin && (
                    <>
                      {!hiddenColumns.includes("userEmail") && <Th>User Email</Th>}
                      {!hiddenColumns.includes("userRole") && (
                        <Th>
                          <div className="flex items-center gap-2">
                            <span>User Role</span>
                            <div style={{ position: "relative" }}>
                              <div data-role-filter-btn>
                                <FilterBtn
                                  active={selectedRole !== "ALL"}
                                  onClick={() => {
                                    const next = !showRoleFilter;
                                    closeAllFilters();
                                    setShowRoleFilter(next);
                                  }}
                                />
                              </div>

                              <AnimatePresence>
                                {showRoleFilter && (
                                  <FilterDropdown
                                    dropRef={roleFilterRef}
                                    options={roleOptions}
                                    value={selectedRole}
                                    onSelect={(v) => {
                                      setSelectedRole(v);
                                      setShowRoleFilter(false);
                                    }}
                                    onClear={() => {
                                      setSelectedRole("ALL");
                                      setShowRoleFilter(false);
                                    }}
                                  />
                                )}
                              </AnimatePresence>
                            </div>
                          </div>
                        </Th>
                      )}
                    </>
                  )}

                  {!hiddenColumns.includes("statusCode") && (
                    <Th style={{ textAlign: "center" }}>Status Code</Th>
                  )}
                  {!hiddenColumns.includes("lastCheckedAt") && <Th>Last Check</Th>}
                  {!isViewer && !hiddenColumns.includes("actions") && (
                    <Th style={{ textAlign: "center" }}>Actions</Th>
                  )}
                </tr>
              </thead>

              <tbody>
                {sortedData.map((item, i) => (
                  <FragmentRow
                    key={item._id}
                    item={item}
                    i={i}
                    selectionMode={selectionMode}
                    selectedIds={selectedIds}
                    setSelectedIds={setSelectedIds}
                    hiddenColumns={hiddenColumns}
                    isSuperAdmin={isSuperAdmin}
                    isViewer={isViewer}
                    expandedSite={expandedSite}
                    handleToggleSite={handleToggleSite}
                    onPin={onPin}
                    onEdit={onEdit}
                    onDelete={onDelete}
                    siteLogs={siteLogs}
                    theme={theme}
                    colSpan={visibleColsCount}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* ─── Mobile Filters ─── */}
      <div className="lg:hidden mb-4 flex gap-3">
        <select
          aria-label="Filter by category"
          value={selectedCategories[0] || "ALL"}
          onChange={(e) => {
            const value = e.target.value;
            setSelectedCategories(value === "ALL" ? ["ALL"] : [value]);
          }}
          className="flex-1 px-3 py-2.5 rounded-2xl outline-none"
          style={{
            background: "rgba(3,7,18,0.75)",
            border: "1px solid rgba(56,189,248,0.1)",
            color: "rgba(148,163,184,0.8)",
            ...monoLabel,
            fontSize: "10px",
            backdropFilter: "blur(12px)",
          }}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat} style={{ background: "#030712" }}>
              {cat}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-2xl outline-none"
          style={{
            background: "rgba(3,7,18,0.75)",
            border: "1px solid rgba(56,189,248,0.1)",
            color: "rgba(148,163,184,0.8)",
            ...monoLabel,
            fontSize: "10px",
            backdropFilter: "blur(12px)",
          }}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status} style={{ background: "#030712" }}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* ─── Mobile Card View ─── */}
      <div className="lg:hidden space-y-4">
        {sortedData.map((item, idx) => {
          const isExpanded = expandedSite === item._id;
          const statusColorMap = { UP: "#34d399", SLOW: "#fbbf24", DOWN: "#f87171" };
          const accentColor = statusColorMap[item.status] || "rgba(148,163,184,0.3)";

          return (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="relative rounded-2xl overflow-hidden"
                style={{
                  background: "rgba(3,7,18,0.75)",
                  border: "1px solid rgba(56,189,248,0.1)",
                  backdropFilter: "blur(20px)",
                  boxShadow: "0 0 24px rgba(56,189,248,0.03)",
                }}
              >
                <div
                  className="h-[1px]"
                  style={{
                    background: `linear-gradient(90deg, transparent 0%, ${accentColor}55 40%, transparent 100%)`,
                  }}
                />
                <div
                  className="absolute left-0 top-0 bottom-0 w-[2px]"
                  style={{ background: `linear-gradient(to bottom, ${accentColor}70, transparent)` }}
                />

                <div className="p-5 pl-6">
                  <div className="flex items-center justify-between mb-4">
                    <button
                      onClick={() => handleToggleSite(item)}
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "13px",
                        color: "#38bdf8",
                        fontWeight: 400,
                      }}
                      className="hover:underline text-left flex items-center gap-2"
                    >
                      {item.domain}
                      <ExpandChevron expanded={isExpanded} />
                    </button>
                    <StatusBadge status={item.status} />
                  </div>

                  <a
                    href={item.url}
                    target="_blank"
                    rel="noreferrer"
                    className="block mb-4 break-all hover:underline"
                    style={{ ...monoLabel, fontSize: "9px", color: "rgba(56,189,248,0.4)" }}
                  >
                    {item.url}
                  </a>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[
                      { label: "Status Code", value: item.statusCode || "--" },
                      { label: "SSL", value: <SslBadge item={item} /> },
                    ].map(({ label, value }) => (
                      <div
                        key={label}
                        className="rounded-xl px-3 py-2.5"
                        style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.04)" }}
                      >
                        <div
                          style={{
                            ...monoLabel,
                            fontSize: "8px",
                            color: "rgba(148,163,184,0.4)",
                            marginBottom: "6px",
                          }}
                        >
                          {label}
                        </div>
                        <div style={{ ...monoLabel, fontSize: "11px", color: "rgba(148,163,184,0.8)" }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: "1px solid rgba(56,189,248,0.06)", marginBottom: "16px" }} />

                  <div className="flex items-center justify-between">
                    {!isViewer && (
                      <motion.button
                        whileHover={{ scale: 1.04 }}
                        whileTap={{ scale: 0.96 }}
                        onClick={() => onEdit(item)}
                        className="px-4 py-2 rounded-xl"
                        style={{
                          ...monoLabel,
                          fontSize: "10px",
                          background: "rgba(56,189,248,0.1)",
                          border: "1px solid rgba(56,189,248,0.22)",
                          color: "#38bdf8",
                        }}
                      >
                        Edit
                      </motion.button>
                    )}
                    <button
                      onClick={() => handleToggleSite(item)}
                      style={{ ...monoLabel, fontSize: "10px", color: "rgba(56,189,248,0.6)" }}
                      className="hover:underline ml-auto"
                    >
                      {isExpanded ? "Hide Report ↑" : "View Report ↓"}
                    </button>
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-3 rounded-2xl overflow-hidden"
                    style={{
                      background: "rgba(3,7,18,0.68)",
                      border: "1px solid rgba(56,189,248,0.09)",
                      backdropFilter: "blur(16px)",
                    }}
                  >
                    <div className="p-4">
                      <SiteReport site={item} logs={siteLogs[item._id] || []} theme={theme} />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Row Component to avoid map fragment key warning ──────────────────────────
const FragmentRow = ({
  item,
  i,
  selectionMode,
  selectedIds,
  setSelectedIds,
  hiddenColumns,
  isSuperAdmin,
  isViewer,
  expandedSite,
  handleToggleSite,
  onPin,
  onEdit,
  onDelete,
  siteLogs,
  theme,
  colSpan,
}) => {
  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.025, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        role="row"
        tabIndex={0}
        className="group transition-all duration-200"
        style={{ borderTop: "1px solid rgba(56,189,248,0.045)" }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = "rgba(56,189,248,0.03)";
          e.currentTarget.style.boxShadow = "inset 2px 0 0 rgba(56,189,248,0.25)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.boxShadow = "none";
        }}
      >
        {selectionMode && (
          <td className="px-4 py-3">
            <div
              className="w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-all duration-200"
              style={{
                border: selectedIds.includes(item._id)
                  ? "1px solid rgba(56,189,248,0.5)"
                  : "1px solid rgba(255,255,255,0.1)",
                background: selectedIds.includes(item._id) ? "rgba(56,189,248,0.15)" : "transparent",
              }}
              onClick={() =>
                setSelectedIds((prev) =>
                  prev.includes(item._id) ? prev.filter((id) => id !== item._id) : [...prev, item._id]
                )
              }
            >
              {selectedIds.includes(item._id) && <span style={{ color: "#38bdf8", fontSize: "8px" }}>✓</span>}
            </div>
          </td>
        )}

        {!hiddenColumns.includes("sno") && (
          <td className="px-4 py-3" style={{ ...monoLabel, fontSize: "10px", color: "rgba(148,163,184,0.3)" }}>
            {i + 1}
          </td>
        )}

        {!hiddenColumns.includes("domain") && (
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              {item.pinned && (
                <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: "rgba(56,189,248,0.6)", fontSize: "11px" }}>
                  📌
                </motion.span>
              )}
              <button
                onClick={() => handleToggleSite(item)}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                  color: "#38bdf8",
                  letterSpacing: "0.02em",
                  fontWeight: 400,
                }}
                className="hover:underline text-left flex items-center gap-1.5"
              >
                {item.domain}
                <ExpandChevron expanded={expandedSite === item._id} />
              </button>
            </div>
          </td>
        )}

        {!hiddenColumns.includes("url") && (
          <td className="px-4 py-3 max-w-xs">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="hover:underline truncate block"
              style={{ ...monoLabel, fontSize: "10px", color: "rgba(56,189,248,0.5)" }}
            >
              {item.url}
            </a>
          </td>
        )}

        {!hiddenColumns.includes("ssl") && (
          <td className="px-4 py-3">
            <SslBadge item={item} />
          </td>
        )}

        {!hiddenColumns.includes("status") && (
          <td className="px-4 py-3">
            <StatusBadge status={item.status} />
          </td>
        )}

        {isSuperAdmin && (
          <>
            {!hiddenColumns.includes("userEmail") && (
              <td className="px-4 py-3" style={{ ...monoLabel, fontSize: "10px", color: "rgba(148,163,184,0.5)" }}>
                {item.ownerEmail || "--"}
              </td>
            )}
            {!hiddenColumns.includes("userRole") && (
              <td className="px-4 py-3" style={{ ...monoLabel, fontSize: "10px", color: "rgba(148,163,184,0.6)" }}>
                {item.ownerRole || "--"}
              </td>
            )}
          </>
        )}

        {!hiddenColumns.includes("statusCode") && (
          <td className="px-4 py-3 text-center" style={{ ...monoLabel, fontSize: "11px", color: "rgba(148,163,184,0.6)" }}>
            {item.statusCode ? (
              <span
                style={{
                  color:
                    item.statusCode >= 200 && item.statusCode < 300
                      ? "#34d399"
                      : item.statusCode >= 400
                      ? "#f87171"
                      : "rgba(148,163,184,0.6)",
                }}
              >
                {item.statusCode}
              </span>
            ) : (
              "--"
            )}
          </td>
        )}

        {!hiddenColumns.includes("lastCheckedAt") && (
          <td className="px-4 py-3" style={{ ...monoLabel, fontSize: "9px", color: "rgba(148,163,184,0.38)" }}>
            {item.lastCheckedAt ? new Date(item.lastCheckedAt).toLocaleString() : "-"}
          </td>
        )}

        {!isViewer && !hiddenColumns.includes("actions") && (
          <td className="px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <ActionBtn onClick={() => onPin(item._id)} title={item.pinned ? "Unpin" : "Pin"}>
                {item.pinned ? <PinOff size={13} /> : <Pin size={13} />}
              </ActionBtn>
              <ActionBtn onClick={() => onEdit(item)} title="Edit">
                <span style={{ fontSize: "12px" }}>✏️</span>
              </ActionBtn>
              <ActionBtn onClick={() => onDelete(item._id)} title="Delete" danger>
                <Trash2 size={13} />
              </ActionBtn>
            </div>
          </td>
        )}
      </motion.tr>

      <AnimatePresence>
        {expandedSite === item._id && (
          <tr>
            <td colSpan={colSpan} style={{ padding: 0 }}>
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                style={{
                  background: "rgba(56,189,248,0.018)",
                  borderTop: "1px solid rgba(56,189,248,0.09)",
                  borderBottom: "1px solid rgba(56,189,248,0.09)",
                }}
              >
                <div className="p-5">
                  <SiteReport site={item} logs={siteLogs[item._id] || []} theme={theme} />
                </div>
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  );
};

export default UrlTable;