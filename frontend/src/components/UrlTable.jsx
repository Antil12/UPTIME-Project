import {
  Pin, PinOff, Trash2, Filter, Settings2, Search,
} from "lucide-react";
import { useMemo, useState, useEffect, useRef, useCallback, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import SiteReport from "./SiteReport";
import DeleteConfirmationModal from "./DeleteConfirmationModal";
import { useTheme } from "../contexts/ThemeContext";

const API_BASE     = import.meta.env.VITE_API_URL;
const LOG_API_BASE = `${API_BASE}/uptime-logs`;

const monoLabel = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "9px",
  letterSpacing: "0.18em",
  textTransform: "uppercase",
};

// ─── Module-level deduplication for /user/hidden-columns ─────────────────────
let hiddenColumnsFlight = null;

const fetchHiddenColumnsOnce = async () => {
  if (hiddenColumnsFlight) return hiddenColumnsFlight;
  hiddenColumnsFlight = (async () => {
    try {
      const token = localStorage.getItem("loginToken");
      if (!token) return [];
      const res = await axios.get(`${API_BASE}/user/hidden-columns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data.hiddenColumns || [];
    } catch (err) {
      if (err.response?.status === 401) return [];
      console.error("Failed to fetch hidden columns:", err);
      return [];
    } finally {
      hiddenColumnsFlight = null;
    }
  })();
  return hiddenColumnsFlight;
};

// ─── Portal Dropdown Wrapper ──────────────────────────────────────────────────
const PortalDropdown = ({ anchorRef, open, children, align = "left" }) => {
  const [pos, setPos] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (!open || !anchorRef.current) return;
    const update = () => {
      const rect = anchorRef.current.getBoundingClientRect();
      setPos({
        top:  rect.bottom + window.scrollY + 8,
        left: align === "right" ? rect.right + window.scrollX : rect.left + window.scrollX,
      });
    };
    update();
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorRef, align]);

  if (!open) return null;

  return createPortal(
    <div style={{ position: "absolute", top: pos.top, left: pos.left, zIndex: 9999, ...(align === "right" ? { transform: "translateX(-100%)" } : {}) }}>
      {children}
    </div>,
    document.body
  );
};

// ─── HUD Filter Dropdown (SSL / Status / Role) ────────────────────────────────
const FilterDropdown = ({ anchorRef, open, options, value, onSelect, onClear, currentTheme }) => (
  <PortalDropdown anchorRef={anchorRef} open={open}>
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      style={{ width: "192px", background: currentTheme.bgPanel, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(28px)", boxShadow: currentTheme.shadow, borderRadius: "16px", overflow: "hidden" }}
    >
      {options.map((opt) => (
        <button
          key={opt}
          onClick={() => onSelect(opt)}
          className="flex items-center justify-between w-full px-4 py-2.5 transition-all duration-200"
          style={{ ...monoLabel, fontSize: "10px", color: value === opt ? currentTheme.accent : currentTheme.text, fontWeight: value === opt ? 700 : 500, background: value === opt ? currentTheme.accentGlow : "transparent", borderLeft: value === opt ? `2px solid ${currentTheme.accent}` : "2px solid transparent" }}
          onMouseEnter={(e) => { if (value !== opt) e.currentTarget.style.background = currentTheme.bgInput; }}
          onMouseLeave={(e) => { if (value !== opt) e.currentTarget.style.background = "transparent"; }}
        >
          <span>{opt}</span>
          {value === opt && <span style={{ color: currentTheme.accent, fontSize: "8px" }}>✓</span>}
        </button>
      ))}
      <div style={{ borderTop: `1px solid ${currentTheme.borderAccent}`, margin: "4px 0" }} />
      <button
        onClick={onClear}
        className="w-full px-4 py-2.5 text-left transition-all duration-200"
        style={{ ...monoLabel, fontSize: "10px", color: currentTheme.error, fontWeight: 600 }}
        onMouseEnter={(e) => (e.currentTarget.style.background = currentTheme.errorBg)}
        onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
      >
        Clear Filter
      </button>
    </motion.div>
  </PortalDropdown>
);

// ─── Domain Filter Dropdown ───────────────────────────────────────────────────
const DomainFilterDropdown = ({
  anchorRef, open, onClose,
  categories,
  selectedCategories, setSelectedCategories,
  sortOrder, setSortOrder,
  chipStyle,
  dropdownRef,
  currentTheme,
}) => {
  const [draftCategories, setDraftCategories] = useState(selectedCategories);
  const [draftSortOrder,  setDraftSortOrder]  = useState(sortOrder);

  useEffect(() => {
    if (open) {
      setDraftCategories(selectedCategories);
      setDraftSortOrder(sortOrder);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleDraftCategory = (cat) => {
    if (cat === "ALL") {
      setDraftCategories(["ALL"]);
    } else {
      let updated = [...draftCategories].filter((c) => c !== "ALL");
      updated = updated.includes(cat) ? updated.filter((c) => c !== cat) : [...updated, cat];
      setDraftCategories(updated.length === 0 ? ["ALL"] : updated);
    }
  };

  const removeDraftCategory = (cat) => {
    const updated = draftCategories.filter((c) => c !== cat);
    setDraftCategories(updated.length === 0 ? ["ALL"] : updated);
  };

  const handleApply = () => {
    setSelectedCategories(draftCategories);
    setSortOrder(draftSortOrder);
    onClose();
  };

  const handleReset = () => {
    setDraftCategories(["ALL"]);
    setDraftSortOrder("ASC");
    setSelectedCategories(["ALL"]);
    setSortOrder("ASC");
    onClose();
  };

  return (
    <PortalDropdown anchorRef={anchorRef} open={open}>
      <motion.div
        ref={dropdownRef}
        initial={{ opacity: 0, y: 6, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 4, scale: 0.97 }}
        transition={{ duration: 0.18 }}
        onMouseDown={(e) => e.stopPropagation()}
        style={{ width: "288px", background: currentTheme.bgPanel, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(28px)", boxShadow: currentTheme.shadow, borderRadius: "16px", overflow: "hidden" }}
      >
        <div className="h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.4) 40%, transparent)", borderRadius: "16px 16px 0 0" }} />
        <div className="px-4 py-3" style={{ borderBottom: `1px solid ${currentTheme.borderAccent}` }}>
          <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "10px", fontWeight: 700, color: currentTheme.text, letterSpacing: "0.06em" }}>
            FILTER DOMAIN
          </span>
        </div>

        <div className="p-4 space-y-4">
          <div>
            <p style={{ ...monoLabel, fontSize: "9px", color: currentTheme.accent, marginBottom: "10px" }}>Sort Order</p>
            <div className="flex gap-2">
              {["ASC", "DESC"].map((order) => (
                <button
                  key={order}
                  onClick={() => setDraftSortOrder(order)}
                  className="flex-1 py-2 rounded-xl transition-all duration-200"
                  style={{
                    ...monoLabel, fontSize: "10px",
                    background: draftSortOrder === order ? currentTheme.accentGlow : currentTheme.bgInput,
                    border: draftSortOrder === order ? `1px solid ${currentTheme.accent}` : `1px solid ${currentTheme.borderLight}`,
                    color: draftSortOrder === order ? currentTheme.accent : currentTheme.text,
                    fontWeight: draftSortOrder === order ? 700 : 500,
                  }}
                >
                  {order === "ASC" ? "A → Z" : "Z → A"}
                </button>
              ))}
            </div>
          </div>

          <div>
            <p style={{ ...monoLabel, fontSize: "9px", color: currentTheme.accent, marginBottom: "10px" }}>Category</p>

            {!draftCategories.includes("ALL") && draftCategories.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", marginBottom: "10px" }}>
                {draftCategories.map((cat) => (
                  <span key={cat} style={chipStyle}>
                    {cat}
                    <span
                      onClick={() => removeDraftCategory(cat)}
                      style={{ cursor: "pointer", opacity: 0.7, fontSize: "11px", lineHeight: 1, marginLeft: "2px" }}
                    >×</span>
                  </span>
                ))}
              </div>
            )}

            <div style={{ background: currentTheme.bgPanel, border: `1px solid ${currentTheme.borderAccent}`, borderRadius: "12px", overflow: "hidden", maxHeight: "220px", overflowY: "auto" }}>
              {categories.map((cat, idx) => (
                <label
                  key={cat}
                  className="flex items-center gap-3 px-3 py-2.5 cursor-pointer transition-all duration-200"
                  style={{ borderTop: idx === 0 ? "none" : `1px solid ${currentTheme.borderAccent}` }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = currentTheme.accentGlow)}
                  onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                >
                  <div
                    className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 transition-all duration-200"
                    style={{
                      border: draftCategories.includes(cat) ? `1px solid ${currentTheme.accent}` : `1px solid ${currentTheme.borderLight}`,
                      background: draftCategories.includes(cat) ? currentTheme.accentGlow : "transparent",
                    }}
                    onClick={() => toggleDraftCategory(cat)}
                  >
                    {draftCategories.includes(cat) && <span style={{ color: currentTheme.accent, fontSize: "8px" }}>✓</span>}
                  </div>
                  <span style={{ ...monoLabel, fontSize: "10px", color: draftCategories.includes(cat) ? currentTheme.accent : currentTheme.text, fontWeight: draftCategories.includes(cat) ? 700 : 500 }}>
                    {cat}
                  </span>
                </label>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-2 px-4 py-3" style={{ borderTop: `1px solid ${currentTheme.borderAccent}` }}>
          <button
            onClick={handleReset}
            className="flex-1 py-2 rounded-xl transition-all duration-200"
            style={{ ...monoLabel, fontSize: "10px", background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderLight}`, color: currentTheme.textSecondary, fontWeight: 600 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = currentTheme.bgInput; e.currentTarget.style.color = currentTheme.text; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = currentTheme.bgInput; e.currentTarget.style.color = currentTheme.textSecondary; }}
          >
            Reset
          </button>
          <button
            onClick={handleApply}
            className="flex-1 py-2 rounded-xl transition-all duration-200"
            style={{ ...monoLabel, fontSize: "10px", background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}`, color: currentTheme.accent, fontWeight: 700 }}
            onMouseEnter={(e) => { e.currentTarget.style.background = currentTheme.accentGlow; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = currentTheme.accentGlow; }}
          >
            Apply
          </button>
        </div>
      </motion.div>
    </PortalDropdown>
  );
};

// ─── HUD Column Settings ──────────────────────────────────────────────────────
const ColumnMenu = ({ anchorRef, open, filteredColumns, hiddenColumns, toggleColumn, searchColumn, setSearchColumn, DEFAULT_COLUMNS, menuRef, visibleColumnsForRole, currentTheme }) => (
  <PortalDropdown anchorRef={anchorRef} open={open} align="right">
    <motion.div
      ref={menuRef}
      initial={{ opacity: 0, y: 6, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.97 }}
      transition={{ duration: 0.18 }}
      style={{ width: "256px", background: currentTheme.bgPanel, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(28px)", boxShadow: currentTheme.shadow, borderRadius: "16px", overflow: "hidden", transform: "translateX(-100%)" }}
    >
      <div className="h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.4) 40%, rgba(129,140,248,0.3) 70%, transparent)" }} />
      <div className="px-4 py-3" style={{ borderBottom: `1px solid ${currentTheme.borderAccent}` }}>
        <span style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "10px", fontWeight: 700, letterSpacing: "0.08em", color: currentTheme.text }}>MANAGE COLUMNS</span>
      </div>
      <div className="p-3" style={{ borderBottom: `1px solid ${currentTheme.borderAccent}` }}>
        <div className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderLight}` }}>
          <Search size={12} style={{ color: currentTheme.accent }} />
          <input
            type="text"
            placeholder="Search column..."
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
            className="bg-transparent outline-none w-full"
            style={{ ...monoLabel, fontSize: "10px", color: currentTheme.text }}
          />
        </div>
      </div>
      <div className="max-h-56 overflow-y-auto p-2">
        {filteredColumns.map((col) => (
          <label
            key={col}
            className="flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all duration-200"
            style={{ marginBottom: "2px" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = currentTheme.accentGlow)}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <span style={{ ...monoLabel, fontSize: "10px", color: hiddenColumns.includes(col) ? currentTheme.textSecondary : currentTheme.text, fontWeight: hiddenColumns.includes(col) ? 500 : 600 }}>
              {col}
            </span>
            <div
              onClick={() => toggleColumn(col)}
              className="relative w-8 h-4 rounded-full cursor-pointer transition-all duration-300"
              style={{ background: !hiddenColumns.includes(col) ? currentTheme.accentGlow : currentTheme.bgInput, border: !hiddenColumns.includes(col) ? `1px solid ${currentTheme.accent}` : `1px solid ${currentTheme.borderLight}` }}
            >
              <div
                className="absolute top-0.5 w-3 h-3 rounded-full transition-all duration-300"
                style={{ left: !hiddenColumns.includes(col) ? "17px" : "2px", background: !hiddenColumns.includes(col) ? currentTheme.accent : currentTheme.textSecondary, boxShadow: !hiddenColumns.includes(col) ? `0 0 8px ${currentTheme.accent}` : "none" }}
              />
            </div>
          </label>
        ))}
      </div>
      <div className="px-4 py-2.5" style={{ borderTop: `1px solid ${currentTheme.borderAccent}` }}>
        <span style={{ ...monoLabel, fontSize: "9px", color: currentTheme.accent, fontWeight: 700 }}>
          {visibleColumnsForRole.filter((col) => !hiddenColumns.includes(col)).length} columns visible
        </span>
      </div>
    </motion.div>
  </PortalDropdown>
);

const Th = ({ children, className = "", style = {}, currentTheme, ...rest }) => {
  const theme = currentTheme || {
    accent: "#38bdf8",
    bgCard: "rgba(3,7,18,0.72)",
    borderAccent: "rgba(56,189,248,0.15)",
  };
  return (
  <th className={`px-4 py-3 text-left whitespace-nowrap ${className}`}
    style={{ ...monoLabel, fontSize: "9px", color: theme.accent, position: "sticky", top: 0, zIndex: 40, background: theme.bgCard, backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)", borderBottom: `1px solid ${theme.borderAccent}`, fontWeight: 700, ...style }}
    {...rest}
  >
    {children}
  </th>
  );
};

const FilterBtn = ({ active, onClick, btnRef, currentTheme }) => {
  const theme = currentTheme || {
    accentGlow: "rgba(56,189,248,0.15)",
    accent: "#38bdf8",
    textSecondary: "rgba(148,163,184,0.86)",
  };
  return (
  <button
    ref={btnRef}
    onClick={onClick}
    className="inline-flex items-center justify-center w-5 h-5 rounded-md transition-all duration-200"
    style={{ background: active ? theme.accentGlow : "transparent", color: active ? theme.accent : theme.textSecondary, border: active ? `1px solid ${theme.accent}` : "1px solid transparent" }}
  >
    <Filter size={10} />
  </button>
  );
};

const StatusBadge = ({ status, currentTheme }) => {
  const theme = currentTheme || {
    success: "#34d399",
    successBg: "rgba(52,211,153,0.12)",
    warning: "#fbbf24",
    error: "#f87171",
    errorBg: "rgba(248,113,113,0.12)",
    textSecondary: "rgba(148,163,184,0.86)",
    bgInput: "rgba(255,255,255,0.04)",
    borderLight: "rgba(255,255,255,0.08)",
  };
  const map = {
    UP:   { color: theme.success, bg: theme.successBg,  border: `${theme.success}35`  },
    SLOW: { color: theme.warning, bg: `${theme.warning}12`,  border: `${theme.warning}35`  },
    DOWN: { color: theme.error,   bg: theme.errorBg,   border: `${theme.error}35` },
  };
  const s = map[status] || { color: theme.textSecondary, bg: theme.bgInput, border: theme.borderLight };
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full" style={{ background: s.bg, border: `1px solid ${s.border}` }}>
      <motion.span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ background: s.color, boxShadow: `0 0 5px ${s.color}` }}
        animate={status === "DOWN" ? { opacity: [1, 0.3, 1] } : {}} transition={{ duration: 0.9, repeat: Infinity }} />
      <span style={{ ...monoLabel, fontSize: "9px", color: s.color, fontWeight: 700 }}>{status || "CHECKING"}</span>
    </span>
  );
};

const SslBadge = ({ item, currentTheme }) => {
  const theme = currentTheme || {
    success: "#34d399",
    warning: "#fbbf24",
    error: "#f87171",
    textSecondary: "rgba(148,163,184,0.86)",
  };
  const getText = () => {
    if (!item.sslStatus) return "Checking";
    if (item.sslStatus === "VALID")    return "Secure";
    if (item.sslStatus === "EXPIRING") return `Expiring (${item.sslDaysRemaining}d)`;
    if (item.sslStatus === "ERROR")    return "Error";
    return item.sslStatus;
  };
  const colorMap = { VALID: theme.success, EXPIRING: theme.warning, EXPIRED: theme.error, ERROR: theme.error };
  const color    = colorMap[item.sslStatus] || theme.textSecondary;
  return <span style={{ ...monoLabel, fontSize: "10px", color, fontWeight: 600 }}>{getText()}</span>;
};

// ─── ActionBtn — stops propagation so row-click selection isn't triggered ─────
const ActionBtn = ({ onClick, title, children, danger = false, currentTheme }) => {
  const theme = currentTheme || {
    errorBg: "rgba(248,113,113,0.12)",
    accentGlow: "rgba(56,189,248,0.15)",
    error: "#f87171",
    accent: "#38bdf8",
    borderAccent: "rgba(56,189,248,0.15)",
  };
  return (
  <motion.button
    whileHover={{ scale: 1.14, y: -1 }} whileTap={{ scale: 0.88 }}
    onClick={(e) => { e.stopPropagation(); onClick?.(e); }}
    title={title}
    className="w-7 h-7 flex items-center justify-center rounded-lg transition-all duration-200"
    style={{ background: danger ? theme.errorBg : theme.accentGlow, border: danger ? `1px solid ${theme.error}30` : `1px solid ${theme.borderAccent}`, color: danger ? theme.error : theme.accent }}
  >
    {children}
  </motion.button>
  );
};

const ExpandChevron = ({ expanded, currentTheme }) => {
  const theme = currentTheme || { accent: "#38bdf8" };
  return (
  <motion.span animate={{ rotate: expanded ? 180 : 0 }} transition={{ duration: 0.22 }}
    style={{ display: "inline-block", color: theme.accent, opacity: 0.85, fontSize: "10px" }}>
    ▼
  </motion.span>
  );
};

// ─── Main UrlTable ─────────────────────────────────────────────────────────────
const UrlTable = forwardRef(({
  urls, allUrls, theme, currentUser,
  selectedSslStatus, setSelectedSslStatus,
  onPin, onDelete, onEdit,
  selectionMode = false, selectedIds = [], setSelectedIds = () => {},
  categories = [],
  selectedCategories, setSelectedCategories,
  selectedStatus, setSelectedStatus,
}, ref) => {
  const { currentTheme } = useTheme();
  const isViewer    = currentUser?.role?.toUpperCase() === "VIEWER";
  const isSuperAdmin = currentUser?.role?.toUpperCase() === "SUPERADMIN";

  const BASE_COLUMNS    = ["sno", "domain", "url", "ssl", "status", "globalStatus", "statusCode", "lastCheckedAt", "actions"];
  const ADMIN_COLUMNS   = ["userEmail", "userRole"];
  const DEFAULT_COLUMNS = isSuperAdmin
    ? [...BASE_COLUMNS.slice(0, 5), ...ADMIN_COLUMNS, ...BASE_COLUMNS.slice(5)]
    : BASE_COLUMNS;

  const [searchColumn,        setSearchColumn]        = useState("");
  const [globalCheckLoading,  setGlobalCheckLoading]  = useState(null);
  const [globalCheckModalData,setGlobalCheckModalData]= useState(null);
  const [deleteModalOpen,    setDeleteModalOpen]    = useState(false);
  const [deleteTarget,       setDeleteTarget]       = useState(null);
  const [isDeleting,         setIsDeleting]         = useState(false);

  const visibleColumnsForRole = DEFAULT_COLUMNS.filter((col) => {
    if (!isSuperAdmin && (col === "userEmail" || col === "userRole")) return false;
    if (isViewer && col === "actions") return false;
    return true;
  });

  const filteredColumns = visibleColumnsForRole.filter((col) =>
    col.toLowerCase().includes(searchColumn.toLowerCase())
  );

  const columnBtnRef      = useRef(null);
  const domainBtnRef      = useRef(null);
  const sslBtnRef         = useRef(null);
  const statusBtnRef      = useRef(null);
  const roleBtnRef        = useRef(null);
  const columnMenuRef     = useRef(null);
  const domainDropdownRef = useRef(null);

  const [hiddenColumns,      setHiddenColumns]      = useState([]);
  const [showColumnMenu,     setShowColumnMenu]      = useState(false);
  const [selectedRole,       setSelectedRole]        = useState("ALL");
  const [sortOrder,          setSortOrder]           = useState("ASC");
  const [expandedSite,       setExpandedSite]        = useState(null);
  const [siteLogs,           setSiteLogs]            = useState({});
  const [siteStats,          setSiteStats]           = useState({});

  const [showDomainFilter,   setShowDomainFilter]    = useState(false);
  const [showSslFilter,      setShowSslFilter]       = useState(false);
  const [showStatusFilter,   setShowStatusFilter]    = useState(false);
  const [showRoleFilter,     setShowRoleFilter]      = useState(false);

  useImperativeHandle(ref, () => ({
    getColumnBtnRef:   () => columnBtnRef,
    toggleColumnMenu:  () => setShowColumnMenu((v) => !v),
    isColumnMenuOpen:  () => showColumnMenu,
  }));

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

  const filteredData = urls.filter((u) => {
    const categoryMatch = selectedCategories.includes("ALL") || selectedCategories.some(cat => {
      if (cat === "Others") {
        return !u.category || u.category === "Others";
      }
      return u.category === cat;
    });
    const statusMatch   = selectedStatus    === "ALL" || u.status    === selectedStatus;
    const sslMatch      = selectedSslStatus === "ALL" || u.sslStatus === selectedSslStatus;
    const roleMatch     = selectedRole      === "ALL" || u.ownerRole === selectedRole;
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

  useEffect(() => {
    let cancelled = false;
    fetchHiddenColumnsOnce().then((cols) => { if (!cancelled) setHiddenColumns(cols); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showColumnMenu && columnMenuRef.current && !columnMenuRef.current.contains(e.target) && !columnBtnRef.current?.contains(e.target)) {
        setShowColumnMenu(false);
      }
      if (showDomainFilter && !domainBtnRef.current?.contains(e.target) && !domainDropdownRef.current?.contains(e.target)) {
        setShowDomainFilter(false);
      }
      if (showSslFilter    && !sslBtnRef.current?.contains(e.target))    setShowSslFilter(false);
      if (showStatusFilter && !statusBtnRef.current?.contains(e.target)) setShowStatusFilter(false);
      if (showRoleFilter   && !roleBtnRef.current?.contains(e.target))   setShowRoleFilter(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [showColumnMenu, showDomainFilter, showSslFilter, showStatusFilter, showRoleFilter]);

  const toggleColumn = async (column) => {
    if (!isSuperAdmin && (column === "userEmail" || column === "userRole")) return;
    const updated = hiddenColumns.includes(column)
      ? hiddenColumns.filter((c) => c !== column)
      : [...hiddenColumns, column];
    setHiddenColumns(updated);
    try {
      const token = localStorage.getItem("loginToken");
      await axios.put(`${API_BASE}/user/hidden-columns`, { hiddenColumns: updated }, { headers: { Authorization: `Bearer ${token}` } });
      hiddenColumnsFlight = null;
    } catch (err) {
      console.error("Save hidden column failed:", err);
      setHiddenColumns(hiddenColumns);
    }
  };

  const handleToggleSite = async (item) => {
    const next = expandedSite === item._id ? null : item._id;
    setExpandedSite(next);
    if (next && !siteLogs[item._id]) {
      try {
        const token = localStorage.getItem("loginToken");

        // Fetch logs
        const logsRes = await axios.get(`${LOG_API_BASE}/${item._id}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });
        setSiteLogs((prev) => ({ ...prev, [item._id]: logsRes.data?.data || [] }));

        // Fetch stats (7 days by default)
        const statsRes = await axios.get(`${LOG_API_BASE}/report-data`, {
          params: { siteIds: item._id, range: "7d" },
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        });

        if (statsRes.data?.data?.statsMap?.[item._id]) {
          setSiteStats((prev) => ({ ...prev, [item._id]: statsRes.data.data.statsMap[item._id] }));
        }
      } catch (err) {
        console.error("Failed to fetch site logs or stats", err);
        setSiteLogs((prev) => ({ ...prev, [item._id]: [] }));
        setSiteStats((prev) => ({ ...prev, [item._id]: {} }));
      }
    }
  };

  const handleGlobalCheck = async (siteId) => {
    setGlobalCheckLoading(siteId);
    try {
      const token = localStorage.getItem("loginToken");
      const res   = await axios.post(
        `${API_BASE}/monitoredsite/global-check/${siteId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setGlobalCheckModalData(res.data.data);
    } catch (err) {
      console.error("Failed to perform global check:", err);
      alert("Global check failed. Please try again.");
    } finally {
      setGlobalCheckLoading(null);
    }
  };

  const closeNonDomainFilters = useCallback(() => {
    setShowSslFilter(false);
    setShowStatusFilter(false);
    setShowRoleFilter(false);
  }, []);

  const closeAllFilters = useCallback(() => {
    setShowDomainFilter(false);
    setShowSslFilter(false);
    setShowStatusFilter(false);
    setShowRoleFilter(false);
  }, []);

  const handleDeleteClick = useCallback((item) => {
    setDeleteTarget(item);
    setDeleteModalOpen(true);
  }, []);

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      await onDelete(deleteTarget._id);
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      console.error("Delete failed:", error);
    } finally {
      setIsDeleting(false);
    }
  }, [deleteTarget, onDelete]);

  const handleDeleteCancel = useCallback(() => {
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  }, []);

  const visibleColsCount = DEFAULT_COLUMNS.filter((col) => {
    if (hiddenColumns.includes(col)) return false;
    if (!isSuperAdmin && (col === "userEmail" || col === "userRole")) return false;
    if (isViewer && col === "actions") return false;
    return true;
  }).length + (selectionMode ? 1 : 0);

  const chipStyle = {
    display: "inline-flex", alignItems: "center", gap: "4px",
    padding: "3px 8px", borderRadius: "999px",
    background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}`,
    ...monoLabel, fontSize: "9px", color: currentTheme.accent, fontWeight: 700, whiteSpace: "nowrap",
  };

  // ─── Row click handler for selection mode ─────────────────────────────────
  const handleRowClick = useCallback((itemId) => {
    if (!selectionMode) return;
    setSelectedIds((prev) =>
      prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId]
    );
  }, [selectionMode, setSelectedIds]);

  return (
    <div className="w-full">
      {/* ─── Global Check Modal ─── */}
      <AnimatePresence>
        {globalCheckModalData && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setGlobalCheckModalData(null)}
            style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999, backdropFilter: "blur(4px)" }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              style={{ background: currentTheme.bgPanel, border: `1px solid ${currentTheme.borderAccent}`, borderRadius: "20px", backdropFilter: "blur(20px)", boxShadow: currentTheme.shadow, padding: "32px", maxWidth: "600px", width: "90%", maxHeight: "80vh", overflowY: "auto" }}
            >
              <div className="flex items-center justify-between mb-6 gap-4">
                <div>
                  <h2 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "20px", fontWeight: 700, color: currentTheme.text, marginBottom: "4px" }}>🌍 Global Status Check</h2>
                  <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: currentTheme.textSecondary }}>{globalCheckModalData.domain}</p>
                </div>
                <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setGlobalCheckModalData(null)}
                  style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}`, borderRadius: "8px", padding: "8px 12px", color: currentTheme.accent, cursor: "pointer", fontFamily: "'JetBrains Mono', monospace", fontSize: "18px", flexShrink: 0 }}>
                  ✕
                </motion.button>
              </div>

              <div className="mb-6 p-4 rounded-xl" style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}` }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.accent, marginBottom: "8px", letterSpacing: "0.06em", fontWeight: 700 }}>GLOBAL STATUS</p>
                <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <StatusBadge status={globalCheckModalData.globalStatus} currentTheme={currentTheme} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", color: currentTheme.textSecondary }}>
                    {new Date(globalCheckModalData.checkTimestamp).toLocaleString()}
                  </span>
                </div>
              </div>

              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.accent, marginBottom: "12px", letterSpacing: "0.06em", fontWeight: 700 }}>REGIONAL BREAKDOWN</p>
              <div className="space-y-2">
                {globalCheckModalData.regionalBreakdown.map((region, idx) => {
                  const statusColors = { UP: currentTheme.success, DOWN: currentTheme.error, SLOW: currentTheme.warning, UNKNOWN: currentTheme.textSecondary };
                  const color        = statusColors[region.status] || currentTheme.textSecondary;
                  return (
                    <motion.div key={idx} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: idx * 0.05 }}
                      className="p-3 rounded-lg"
                      style={{ background: `${color}12`, border: `1px solid ${color}30` }}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: color, boxShadow: `0 0 8px ${color}`, flexShrink: 0 }} />
                          <div className="flex-1 min-w-0">
                            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 600, color: currentTheme.text }}>{region.region}</p>
                            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textSecondary }}>
                              {region.lastCheckedAt ? new Date(region.lastCheckedAt).toLocaleTimeString() : "Never"}
                            </p>
                          </div>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color, fontWeight: 700 }}>{region.status}</p>
                          {region.responseTimeMs != null && (
                            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textSecondary }}>{region.responseTimeMs}ms</p>
                          )}
                          {region.statusCode != null && (
                            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textSecondary }}>HTTP {region.statusCode}</p>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => setGlobalCheckModalData(null)}
                style={{ width: "100%", marginTop: "24px", padding: "12px", borderRadius: "12px", background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}`, color: currentTheme.accent, fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", fontWeight: 700, cursor: "pointer", letterSpacing: "0.06em" }}>
                Close
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Column Menu Portal ─── */}
      <AnimatePresence>
        {showColumnMenu && (
          <ColumnMenu
            anchorRef={columnBtnRef} open={showColumnMenu} menuRef={columnMenuRef}
            filteredColumns={filteredColumns} hiddenColumns={hiddenColumns}
            toggleColumn={toggleColumn} searchColumn={searchColumn}
            setSearchColumn={setSearchColumn} DEFAULT_COLUMNS={DEFAULT_COLUMNS}
            visibleColumnsForRole={visibleColumnsForRole}
            currentTheme={currentTheme}
          />
        )}
      </AnimatePresence>

      {/* ─── Desktop Table ─── */}
      <div className="hidden lg:block">
        <div className="rounded-2xl" style={{ background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(22px)", boxShadow: currentTheme.shadow }}>
          <div className="h-[1px]" style={{ background: "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.4) 30%, rgba(129,140,248,0.32) 70%, transparent 100%)", flexShrink: 0 }} />

          <div style={{ overflowX: "auto", overflowY: "auto", maxHeight: "calc(100vh - 220px)", borderRadius: "0 0 16px 16px", position: "relative", paddingBottom: "8px" }}>
            <table className="w-full text-sm" style={{ borderCollapse: "separate", borderSpacing: 0 }}>
              <thead style={{ position: "relative", zIndex: 40 }}>
                <tr>
                  {selectionMode && <Th currentTheme={currentTheme} style={{ width: "40px" }} />}
                  {!hiddenColumns.includes("sno") && <Th currentTheme={currentTheme} style={{ width: "50px" }}>S.No</Th>}

                  {!hiddenColumns.includes("domain") && (
                    <Th currentTheme={currentTheme}>
                      <div className="flex items-center gap-2">
                        <span>Domain</span>
                        <FilterBtn
                          btnRef={domainBtnRef}
                          active={!selectedCategories.includes("ALL") || sortOrder !== "ASC"}
                          currentTheme={currentTheme}
                          onClick={() => {
                            closeNonDomainFilters();
                            setShowColumnMenu(false);
                            setShowDomainFilter((v) => !v);
                          }}
                        />
                        <AnimatePresence>
                          {showDomainFilter && (
                            <DomainFilterDropdown
                              anchorRef={domainBtnRef}
                              dropdownRef={domainDropdownRef}
                              open={showDomainFilter}
                              currentTheme={currentTheme}
                              onClose={() => setShowDomainFilter(false)}
                              categories={categories}
                              selectedCategories={selectedCategories}
                              setSelectedCategories={setSelectedCategories}
                              sortOrder={sortOrder}
                              setSortOrder={setSortOrder}
                              chipStyle={chipStyle}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </Th>
                  )}

                  {!hiddenColumns.includes("url") && <Th currentTheme={currentTheme}>URL</Th>}

                  {!hiddenColumns.includes("ssl") && (
                    <Th currentTheme={currentTheme}>
                      <div className="flex items-center gap-2">
                        <span>SSL</span>
                        <FilterBtn
                          btnRef={sslBtnRef}
                          active={selectedSslStatus !== "ALL"}
                          currentTheme={currentTheme}
                          onClick={() => { const next = !showSslFilter; closeAllFilters(); if (next) setShowSslFilter(true); }}
                        />
                        <AnimatePresence>
                          {showSslFilter && (
                            <FilterDropdown anchorRef={sslBtnRef} open={showSslFilter} options={sslOptions} value={selectedSslStatus}
                              onSelect={(v) => { setSelectedSslStatus(v); setShowSslFilter(false); }}
                              onClear={() => { setSelectedSslStatus("ALL"); setShowSslFilter(false); }}
                              currentTheme={currentTheme}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </Th>
                  )}

                  {!hiddenColumns.includes("status") && (
                    <Th currentTheme={currentTheme}>
                      <div className="flex items-center gap-2">
                        <span>Status</span>
                        <FilterBtn
                          btnRef={statusBtnRef}
                          active={selectedStatus !== "ALL"}
                          currentTheme={currentTheme}
                          onClick={() => { const next = !showStatusFilter; closeAllFilters(); if (next) setShowStatusFilter(true); }}
                        />
                        <AnimatePresence>
                          {showStatusFilter && (
                            <FilterDropdown anchorRef={statusBtnRef} open={showStatusFilter} options={statusOptions} value={selectedStatus}
                              onSelect={(v) => { setSelectedStatus(v); setShowStatusFilter(false); }}
                              onClear={() => { setSelectedStatus("ALL"); setShowStatusFilter(false); }}
                              currentTheme={currentTheme}
                            />
                          )}
                        </AnimatePresence>
                      </div>
                    </Th>
                  )}

                  {!hiddenColumns.includes("globalStatus") && <Th currentTheme={currentTheme}><span>Global Status</span></Th>}

                  {isSuperAdmin && (
                    <>
                      {!hiddenColumns.includes("userEmail") && <Th currentTheme={currentTheme}>User Email</Th>}
                      {!hiddenColumns.includes("userRole") && (
                        <Th currentTheme={currentTheme}>
                          <div className="flex items-center gap-2">
                            <span>User Role</span>
                            <FilterBtn
                              btnRef={roleBtnRef}
                              active={selectedRole !== "ALL"}
                              currentTheme={currentTheme}
                              onClick={() => { const next = !showRoleFilter; closeAllFilters(); if (next) setShowRoleFilter(true); }}
                            />
                            <AnimatePresence>
                              {showRoleFilter && (
                                <FilterDropdown anchorRef={roleBtnRef} open={showRoleFilter} options={roleOptions} value={selectedRole}
                                  onSelect={(v) => { setSelectedRole(v); setShowRoleFilter(false); }}
                                  onClear={() => { setSelectedRole("ALL"); setShowRoleFilter(false); }}
                                  currentTheme={currentTheme}
                                />
                              )}
                            </AnimatePresence>
                          </div>
                        </Th>
                      )}
                    </>
                  )}

                  {!hiddenColumns.includes("statusCode")    && <Th currentTheme={currentTheme} style={{ textAlign: "center" }}>Status Code</Th>}
                  {!hiddenColumns.includes("lastCheckedAt") && <Th currentTheme={currentTheme}>Last Check</Th>}
                  {!isViewer && !hiddenColumns.includes("actions") && <Th currentTheme={currentTheme} style={{ textAlign: "center" }}>Actions</Th>}
                </tr>
              </thead>

              <tbody>
                {sortedData.map((item, i) => (
                  <FragmentRow
                    key={item._id}
                    item={item} i={i}
                    selectionMode={selectionMode} selectedIds={selectedIds} setSelectedIds={setSelectedIds}
                    hiddenColumns={hiddenColumns} isSuperAdmin={isSuperAdmin} isViewer={isViewer}
                    expandedSite={expandedSite} handleToggleSite={handleToggleSite}
                    onPin={onPin} onEdit={onEdit} onDelete={handleDeleteClick}
                    siteLogs={siteLogs} siteStats={siteStats} theme={theme} colSpan={visibleColsCount}
                    handleGlobalCheck={handleGlobalCheck} globalCheckLoading={globalCheckLoading}
                    onRowClick={handleRowClick}
                    currentTheme={currentTheme}
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
          onChange={(e) => { const v = e.target.value; setSelectedCategories(v === "ALL" ? ["ALL"] : [v]); }}
          className="flex-1 px-3 py-2.5 rounded-2xl outline-none"
          style={{ background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`, color: currentTheme.text, ...monoLabel, fontSize: "10px", fontWeight: 600, backdropFilter: "blur(12px)" }}
        >
          {categories.map((cat) => (
            <option key={cat} value={cat} style={{ background: currentTheme.bgPanel, color: currentTheme.text }}>
              {cat}
            </option>
          ))}
        </select>

        <select
          aria-label="Filter by status"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
          className="flex-1 px-3 py-2.5 rounded-2xl outline-none"
          style={{ background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`, color: currentTheme.text, ...monoLabel, fontSize: "10px", fontWeight: 600, backdropFilter: "blur(12px)" }}
        >
          {statusOptions.map((status) => (
            <option key={status} value={status} style={{ background: currentTheme.bgPanel, color: currentTheme.text }}>
              {status}
            </option>
          ))}
        </select>
      </div>

      {/* ─── Mobile Card View ─── */}
      <div className="lg:hidden space-y-4">
        {sortedData.map((item, idx) => {
          const isExpanded     = expandedSite === item._id;
          const isSelected     = selectedIds.includes(item._id);
          const statusColorMap = { UP: currentTheme.success, SLOW: currentTheme.warning, DOWN: currentTheme.error };
          const accentColor    = statusColorMap[item.status] || currentTheme.textSecondary;

          return (
            <motion.div
              key={item._id}
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.04, duration: 0.42, ease: [0.22, 1, 0.36, 1] }}
              onClick={() => selectionMode && handleRowClick(item._id)}
            >
              <div
                className="relative rounded-2xl overflow-hidden transition-all duration-200"
                style={{
                  background: isSelected && selectionMode ? currentTheme.accentGlow : currentTheme.bgCard,
                  border: isSelected && selectionMode ? `1px solid ${currentTheme.accent}` : `1px solid ${currentTheme.borderAccent}`,
                  backdropFilter: "blur(20px)",
                  boxShadow: currentTheme.shadow,
                  cursor: selectionMode ? "pointer" : "default",
                }}
              >
                <div className="h-[1px]" style={{ background: `linear-gradient(90deg, transparent 0%, ${currentTheme.accent}55 40%, transparent 100%)` }} />
                <div className="absolute left-0 top-0 bottom-0 w-[2px]" style={{ background: `linear-gradient(to bottom, ${currentTheme.accent}70, transparent)` }} />

                <div className="p-5 pl-6">
                  <div className="flex items-center justify-between mb-4">
                    {selectionMode && (
                      <div
                        className="w-4 h-4 rounded flex items-center justify-center flex-shrink-0 mr-3 transition-all duration-200"
                        style={{
                          border: isSelected ? `1px solid ${currentTheme.accent}` : `1px solid ${currentTheme.borderLight}`,
                          background: isSelected ? currentTheme.accentGlow : "transparent",
                        }}
                      >
                        {isSelected && <span style={{ color: currentTheme.accent, fontSize: "8px" }}>✓</span>}
                      </div>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleSite(item); }}
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "13px", color: currentTheme.accent, fontWeight: 700 }}
                      className="hover:underline text-left flex items-center gap-2 flex-1"
                    >
                      {item.domain}<ExpandChevron expanded={isExpanded} currentTheme={currentTheme} />
                    </button>
                    <StatusBadge status={item.status} currentTheme={currentTheme} />
                  </div>

                  <a href={item.url} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()} className="block mb-4 break-all hover:underline" style={{ ...monoLabel, fontSize: "9px", color: currentTheme.accent, opacity: 0.85 }}>{item.url}</a>

                  <div className="grid grid-cols-2 gap-3 mb-4">
                    {[{ label: "Status Code", value: item.statusCode != null ? item.statusCode : "--" }, { label: "SSL", value: <SslBadge item={item} currentTheme={currentTheme} /> }].map(({ label, value }) => (
                      <div key={label} className="rounded-xl px-3 py-2.5" style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderLight}` }}>
                        <div style={{ ...monoLabel, fontSize: "8px", color: currentTheme.textSecondary, marginBottom: "6px" }}>{label}</div>
                        <div style={{ ...monoLabel, fontSize: "11px", color: currentTheme.text, fontWeight: 600 }}>{value}</div>
                      </div>
                    ))}
                  </div>

                  <div style={{ borderTop: `1px solid ${currentTheme.borderAccent}`, marginBottom: "16px" }} />

                  <div className="flex items-center justify-between">
                    {!isViewer && (
                      <motion.button
                        whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                        onClick={(e) => { e.stopPropagation(); onEdit(item); }}
                        className="px-4 py-2 rounded-xl"
                        style={{ ...monoLabel, fontSize: "10px", background: currentTheme.accentGlow, border: `1px solid ${currentTheme.borderAccent}`, color: currentTheme.accent, fontWeight: 700 }}
                      >
                        Edit
                      </motion.button>
                    )}
                    <button
                      onClick={(e) => { e.stopPropagation(); handleToggleSite(item); }}
                      style={{ ...monoLabel, fontSize: "10px", color: currentTheme.accent, opacity: 0.9, fontWeight: 600 }}
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
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                    className="mt-3 rounded-2xl overflow-hidden"
                    style={{ background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(16px)" }}
                  >
                    <div className="p-4">
                      {/* ── showFullDetailBtn=true for mobile card view ── */}
                      <SiteReport
                        site={item}
                        logs={siteLogs[item._id] || []}
                        stats={siteStats[item._id] || {}}
                        theme={theme}
                        showFullDetailBtn={true}
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
      </div>

      {/* ─── Delete Confirmation Modal ─── */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        onClose={handleDeleteCancel}
        onConfirm={handleDeleteConfirm}
        title="Delete Website"
        message="Are you sure you want to delete this website? All monitoring data, logs, and configurations will be permanently removed."
        itemName={deleteTarget?.domain || ""}
        loading={isDeleting}
      />
    </div>
  );
});

UrlTable.displayName = "UrlTable";

// ─── Row Component ─────────────────────────────────────────────────────────────
const FragmentRow = ({
  item, i, selectionMode, selectedIds, setSelectedIds, hiddenColumns,
  isSuperAdmin, isViewer, expandedSite, handleToggleSite, onPin, onEdit,
  onDelete, siteLogs, siteStats, theme, colSpan, handleGlobalCheck, globalCheckLoading,
  onRowClick, currentTheme,
}) => {
  const isSelected = selectedIds.includes(item._id);

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
        transition={{ delay: i * 0.025, duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
        role="row" tabIndex={0}
        className="group transition-all duration-200"
        onClick={() => onRowClick(item._id)}
        style={{
          borderTop: `1px solid ${currentTheme.borderAccent}`,
          cursor: selectionMode ? "pointer" : "default",
          background: isSelected && selectionMode ? currentTheme.accentGlow : "transparent",
          boxShadow: isSelected && selectionMode ? `inset 2px 0 0 ${currentTheme.accent}` : "none",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = isSelected && selectionMode
            ? currentTheme.accentGlow
            : currentTheme.bgInput;
          if (!isSelected) e.currentTarget.style.boxShadow = `inset 2px 0 0 ${currentTheme.accent}40`;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = isSelected && selectionMode ? currentTheme.accentGlow : "transparent";
          e.currentTarget.style.boxShadow  = isSelected && selectionMode ? `inset 2px 0 0 ${currentTheme.accent}` : "none";
        }}
      >
        {selectionMode && (
          <td className="px-4 py-3">
            <div
              className="w-4 h-4 rounded flex items-center justify-center cursor-pointer transition-all duration-200"
              style={{
                border: isSelected ? `1px solid ${currentTheme.accent}` : `1px solid ${currentTheme.borderLight}`,
                background: isSelected ? currentTheme.accentGlow : "transparent",
              }}
              onClick={(e) => {
                e.stopPropagation();
                onRowClick(item._id);
              }}
            >
              {isSelected && <span style={{ color: currentTheme.accent, fontSize: "8px" }}>✓</span>}
            </div>
          </td>
        )}

        {!hiddenColumns.includes("sno") && (
          <td className="px-4 py-3" style={{ ...monoLabel, fontSize: "10px", color: currentTheme.textSecondary, fontWeight: 600 }}>{i + 1}</td>
        )}

        {!hiddenColumns.includes("domain") && (
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              {item.pinned && <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} style={{ color: currentTheme.accent, opacity: 0.85, fontSize: "11px" }}>📌</motion.span>}
              <button
                onClick={(e) => { e.stopPropagation(); handleToggleSite(item); }}
                style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "12px", color: currentTheme.accent, letterSpacing: "0.02em", fontWeight: 600 }}
                className="hover:underline text-left flex items-center gap-1.5"
              >
                {item.domain}<ExpandChevron expanded={expandedSite === item._id} currentTheme={currentTheme} />
              </button>
            </div>
          </td>
        )}

        {!hiddenColumns.includes("url") && (
          <td className="px-4 py-3 max-w-xs">
            <a
              href={item.url} target="_blank" rel="noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="hover:underline truncate block"
              style={{ ...monoLabel, fontSize: "10px", color: currentTheme.accent, opacity: 0.92 }}
            >{item.url}</a>
          </td>
        )}

        {!hiddenColumns.includes("ssl") && (
          <td className="px-4 py-3"><SslBadge item={item} currentTheme={currentTheme} /></td>
        )}

        {!hiddenColumns.includes("status") && (
          <td className="px-4 py-3"><StatusBadge status={item.status} currentTheme={currentTheme} /></td>
        )}

        {!hiddenColumns.includes("globalStatus") && (
          <td className="px-4 py-3">
            <div className="flex items-center gap-2">
              <StatusBadge status={item.globalStatus || "UNKNOWN"} currentTheme={currentTheme} />
              <motion.button
                whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.95 }}
                onClick={(e) => { e.stopPropagation(); handleGlobalCheck(item._id); }}
                disabled={globalCheckLoading === item._id}
                title="Manual Global Check — runs real HTTP check for each region"
                className="w-5 h-5 flex items-center justify-center rounded transition-all"
                style={{
                  background: globalCheckLoading === item._id ? currentTheme.accentGlow : currentTheme.bgInput,
                  border: `1px solid ${currentTheme.borderAccent}`,
                  color: currentTheme.accent,
                  opacity: globalCheckLoading === item._id ? 1 : 0.85,
                  cursor: globalCheckLoading === item._id ? "wait" : "pointer",
                }}
              >
                {globalCheckLoading === item._id ? (
                  <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }} style={{ fontSize: "10px" }}>⟳</motion.span>
                ) : (
                  <span style={{ fontSize: "10px" }}>🌍</span>
                )}
              </motion.button>
            </div>
          </td>
        )}

        {isSuperAdmin && (
          <>
            {!hiddenColumns.includes("userEmail") && <td className="px-4 py-3" style={{ ...monoLabel, fontSize: "10px", color: currentTheme.textSecondary, fontWeight: 500 }}>{item.ownerEmail || "--"}</td>}
            {!hiddenColumns.includes("userRole")  && <td className="px-4 py-3" style={{ ...monoLabel, fontSize: "10px", color: currentTheme.textSecondary, fontWeight: 500 }}>{item.ownerRole  || "--"}</td>}
          </>
        )}

        {!hiddenColumns.includes("statusCode") && (
          <td className="px-4 py-3 text-center" style={{ ...monoLabel, fontSize: "11px", color: currentTheme.text, fontWeight: 600 }}>
            {item.statusCode != null ? (
              <span style={{ color: item.statusCode >= 200 && item.statusCode < 300 ? currentTheme.success : item.statusCode >= 400 ? currentTheme.error : currentTheme.text }}>{item.statusCode}</span>
            ) : "--"}
          </td>
        )}

        {!hiddenColumns.includes("lastCheckedAt") && (
          <td className="px-4 py-3" style={{ ...monoLabel, fontSize: "9px", color: currentTheme.textSecondary, fontWeight: 500 }}>
            {item.lastCheckedAt ? new Date(item.lastCheckedAt).toLocaleString() : "-"}
          </td>
        )}

        {!isViewer && !hiddenColumns.includes("actions") && (
          <td className="px-4 py-3">
            <div className="flex items-center justify-center gap-2">
              <ActionBtn onClick={() => onPin(item._id)} title={item.pinned ? "Unpin" : "Pin"} currentTheme={currentTheme}>
                {item.pinned ? <PinOff size={13} /> : <Pin size={13} />}
              </ActionBtn>
              <ActionBtn onClick={() => onEdit(item)} title="Edit" currentTheme={currentTheme}>
                <span style={{ fontSize: "12px" }}>✏️</span>
              </ActionBtn>
              <ActionBtn onClick={() => onDelete(item)} title="Delete" danger currentTheme={currentTheme}>
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
                initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
                style={{ background: currentTheme.bgInput, borderTop: `1px solid ${currentTheme.borderAccent}`, borderBottom: `1px solid ${currentTheme.borderAccent}` }}
              >
                <div className="p-5">
                  {/* ── showFullDetailBtn=true for desktop expanded row ── */}
                  <SiteReport
                    site={item}
                    logs={siteLogs[item._id] || []}
                    stats={siteStats[item._id] || {}}
                    theme={theme}
                    showFullDetailBtn={true}
                  />
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