  import { Pin, PinOff, Trash2, Filter ,SlidersHorizontal, Settings2, Search, RotateCcw  } from "lucide-react";
  import { useMemo, useState, useEffect, useRef } from "react";
  import axios from "axios";
  import SiteReport from "./SiteReport";

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
   const BASE_COLUMNS = [
  "sno",
  "domain",
  "url",
  "ssl",
  "status",
  "statusCode",
  "lastCheckedAt",
  "actions"
];

const ADMIN_COLUMNS = ["userEmail", "userRole"];

const DEFAULT_COLUMNS = isSuperAdmin
  ? [...BASE_COLUMNS.slice(0, 5), ...ADMIN_COLUMNS, ...BASE_COLUMNS.slice(5)]
  : BASE_COLUMNS;

  const [searchColumn, setSearchColumn] = useState("");

const visibleColumnsForRole = DEFAULT_COLUMNS.filter((col) => {
  if (!isSuperAdmin && (col === "userEmail" || col === "userRole")) {
    return false;
  }
    // 🚀 Hide actions column from VIEWER in column settings
  if (isViewer && col === "actions") {
    return false;
  }
  return true;
});

const filteredColumns = visibleColumnsForRole.filter((col) =>
  col.toLowerCase().includes(searchColumn.toLowerCase())
);
  const columnMenuRef = useRef(null);
  const [hiddenColumns, setHiddenColumns] = useState([]);
  const [showColumnMenu, setShowColumnMenu] = useState(false);
    const [selectedRole, setSelectedRole] = useState("ALL");
  const [showRoleFilter, setShowRoleFilter] = useState(false);
  const roleFilterRef = useRef(null);
    
    const [categoryOpen, setCategoryOpen] = useState(false);
    const [showDomainFilter, setShowDomainFilter] = useState(false);
    const [sortOrder, setSortOrder] = useState("ASC"); // ASC | DESC
    const [showSslFilter, setShowSslFilter] = useState(false);
    const [showFilter, setShowFilter] = useState(false);
    const [showStatusFilter, setShowStatusFilter] = useState(false);
    const [expandedSite, setExpandedSite] = useState(null);
    const [siteLogs, setSiteLogs] = useState({});
    const domainFilterRef = useRef(null);
  const categoryRef = useRef(null);
  const sslFilterRef = useRef(null);
  const statusFilterRef = useRef(null);
    const LOG_API_BASE = "http://localhost:5000/api/uptime-logs";

    const toggleSite = async (item) => {
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
    const categoryMatch =
      selectedCategories.includes("ALL") ||
      selectedCategories.includes(u.category);

    const statusMatch =
      selectedStatus === "ALL" || u.status === selectedStatus;

    const sslMatch =
      selectedSslStatus === "ALL" || u.sslStatus === selectedSslStatus;

    const roleMatch =
      selectedRole === "ALL" || u.ownerRole === selectedRole;

    return categoryMatch && statusMatch && sslMatch && roleMatch;
  });


  useEffect(() => {
    const fetchHiddenColumns = async () => {
      try {
        const token = localStorage.getItem("loginToken");

        const res = await axios.get("/user/hidden-columns", {
          headers: { Authorization: `Bearer ${token}` }
        });

        setHiddenColumns(res.data.hiddenColumns || []);
      } catch (err) {
        console.error("Failed to fetch hidden columns");
      }
    };

    fetchHiddenColumns();
  }, []);



    useEffect(() => {
    function handleClickOutside(event) {
      if (
      columnMenuRef.current &&
      !columnMenuRef.current.contains(event.target)
    ) {
      setShowColumnMenu(false);
    }

      if (
        domainFilterRef.current &&
        !domainFilterRef.current.contains(event.target)
      ) {
        setShowDomainFilter(false);
        setCategoryOpen(false);
      }

      if (
        sslFilterRef.current &&
        !sslFilterRef.current.contains(event.target)
      ) {
        setShowSslFilter(false);
      }

      if (
        statusFilterRef.current &&
        !statusFilterRef.current.contains(event.target)
      ) {
        setShowStatusFilter(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);
  const sortedData = [...filteredData].sort((a, b) => {

    // 1️⃣ Pinned first
    if (a.pinned !== b.pinned) {
      return (b.pinned === true) - (a.pinned === true);
    }

    // 2️⃣ HTTP Status Priority
    const statusA = a.statusPriority ?? 4;
    const statusB = b.statusPriority ?? 4;

    if (statusA !== statusB) {
      return statusA - statusB;
    }

    // 3️⃣ SSL Priority
    const sslA = a.sslPriority ?? 5;
    const sslB = b.sslPriority ?? 5;

    if (sslA !== sslB) {
      return sslA - sslB;
    }

    // 4️⃣ Domain sorting
    if (sortOrder === "ASC") {
      return a.domain.localeCompare(b.domain);
    } else {
      return b.domain.localeCompare(a.domain);
    }

  });
    const getStatusColor = (status) => {
      if (status === "UP") return "text-green-600";
      if (status === "SLOW") return "text-yellow-500";
      if (status === "DOWN") return "text-red-600";
      return "text-gray-400";
    };

    const getSslText = (item) => {
      if (!item.sslStatus) return "Checking";
      if (item.sslStatus === "VALID") return "Secure";
      if (item.sslStatus === "EXPIRING")
        return `Expiring (${item.sslDaysRemaining}d)`;
      if (item.sslStatus === "ERROR") return "Error";
      return item.sslStatus;
    };

    const getSslColor = (status) => {
      if (status === "VALID") return "text-green-600";
      if (status === "EXPIRING") return "text-yellow-500";
      if (status === "EXPIRED") return "text-red-600";
      return "text-gray-400";
    };


    const toggleColumn = async (column) => {

  // ❌ Prevent non-admin from modifying restricted columns
  if (!isSuperAdmin && (column === "userEmail" || column === "userRole")) {
    return;
  }

  let updated;

  if (hiddenColumns.includes(column)) {
    updated = hiddenColumns.filter((c) => c !== column);
  } else {
    updated = [...hiddenColumns, column];
  }

  setHiddenColumns(updated);

  try {
    const token = localStorage.getItem("loginToken");

    await axios.put(
      "/user/hidden-columns",
      { hiddenColumns: updated },
      { headers: { Authorization: `Bearer ${token}` } }
    );
  } catch (err) {
    console.error("Save hidden column failed");
  }
};


    return (
      <div className="w-full">
      
<div className="hidden lg:flex justify-end mb-3 relative">

  {/* Button */}
  <button
    onClick={() => setShowColumnMenu(!showColumnMenu)}
    className="flex items-center gap-2 px-4 py-2 text-sm font-medium
    bg-gray-100 dark:bg-gray-700
    hover:bg-gray-200 dark:hover:bg-gray-600
    border border-gray-300 dark:border-gray-600
    rounded-xl shadow-sm transition"
  >
    <Settings2 size={16} />
    Columns
  </button>

  {showColumnMenu && (
    <div
  ref={columnMenuRef}
  className="absolute right-0 top-full mt-2 w-64
  bg-white dark:bg-gray-800
  border border-gray-200 dark:border-gray-700
  rounded-xl shadow-xl z-50"
>
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 border-b dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">
          Manage Columns
        </span>

        
      </div>

      {/* Search */}
      <div className="p-3 border-b dark:border-gray-700">
        <div className="flex items-center gap-2 px-2 py-1.5 bg-gray-100 dark:bg-gray-700 rounded-md">
          <Search size={14} className="text-gray-500" />
          <input
            type="text"
            placeholder="Search column..."
            value={searchColumn}
            onChange={(e) => setSearchColumn(e.target.value)}
            className="bg-transparent outline-none text-sm w-full"
          />
        </div>
      </div>

      {/* Column List */}
      <div className="max-h-64 overflow-y-auto p-2 space-y-1">

        {filteredColumns.map((col) => (
          <label
            key={col}
            className="flex items-center justify-between px-3 py-2
            rounded-md hover:bg-gray-100 dark:hover:bg-gray-700
            cursor-pointer text-sm transition"
          >
            <span className="text-gray-700 dark:text-gray-200">{col}</span>

            <input
              type="checkbox"
              checked={!hiddenColumns.includes(col)}
              onChange={() => toggleColumn(col)}
              className="accent-blue-500 w-4 h-4 cursor-pointer"
            />
          </label>
        ))}

      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t dark:border-gray-700 text-xs text-gray-500">
        {DEFAULT_COLUMNS.length - hiddenColumns.length} columns visible
      </div>

    </div>
  )}
</div>
        {/* ================= DESKTOP TABLE ================= */}
        <div className="hidden lg:block">

          <table
            className={`table-dark w-full rounded shadow text-sm
            ${theme === "dark"
                ? "bg-gray-900 text-gray-200"
                : "bg-white text-gray-800"}`}>
          {/* > */}
            <thead
              className={`text-sm sticky top-[90px] z-40
              ${theme === "dark"
                  ? "bg-gray-800 text-gray-200"
                  : "bg-slate-100 text-gray-700"
                }`}
            >
              <tr>
                  {selectionMode && <th scope="col" className="px-2 py-2 text-left"> </th>}
                {!hiddenColumns.includes("sno") && (
                <th scope="col" className="px-2 py-2 text-left">S No.</th>
                )}

              {/* ================= DOMAIN FILTER COLUMN ================= */}
  {!hiddenColumns.includes("domain") && (
  <th scope="col" className="px-3 py-3 text-left relative">
    <div className="flex items-center gap-2">
      <span className="font-medium">Domain</span>

      <button
        onClick={() => {
          setShowDomainFilter((v) => !v);
          setShowStatusFilter(false);
          setShowSslFilter(false);
        }}
        className={`relative p-1.5 rounded-lg transition-all duration-200
          ${
            !selectedCategories.includes("ALL") || sortOrder !== "ASC"
              ? "text-blue-600 bg-blue-50 dark:bg-blue-900/30"
              : "text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700"
          }`}
      >
        <Filter size={16} />

        {(!selectedCategories.includes("ALL") || sortOrder !== "ASC") && (
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-blue-600 rounded-full" />
        )}
      </button>
    </div>

    {/* ================= FILTER PANEL ================= */}
  {showDomainFilter && (
    <div
      ref={domainFilterRef}
      className={`absolute left-0 mt-2 w-72 rounded-xl shadow-xl z-50
        ${
          theme === "dark"
            ? "bg-gray-900 border border-gray-700 text-gray-200"
            : "bg-white border border-gray-200 text-gray-800"
        }`}
    >
      {/* HEADER */}
      <div className="px-4 py-3 border-b dark:border-gray-700 flex justify-between items-center">
        <h3 className="text-sm font-semibold">Filter Domain</h3>
      </div>

      <div className="p-4 space-y-4">

        {/* SORT */}
        <div>
          <p className="text-xs font-semibold mb-2 opacity-70">
            Sort
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder("ASC")}
              className={`flex-1 text-xs py-2 rounded-lg border
                ${
                  sortOrder === "ASC"
                    ? "bg-blue-600 text-white border-blue-600"
                    : theme === "dark"
                    ? "border-gray-600 hover:bg-gray-800"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
            >
              A → Z
            </button>

            <button
              onClick={() => setSortOrder("DESC")}
              className={`flex-1 text-xs py-2 rounded-lg border
                ${
                  sortOrder === "DESC"
                    ? "bg-blue-600 text-white border-blue-600"
                    : theme === "dark"
                    ? "border-gray-600 hover:bg-gray-800"
                    : "border-gray-300 hover:bg-gray-50"
                }`}
            >
              Z → A
            </button>
          </div>
        </div>

        {/* CATEGORY */}
        <div ref={categoryRef} className="relative">
          <p className="text-xs font-semibold mb-2 opacity-70">
            Category
          </p>

          <button
            onClick={() => setCategoryOpen((v) => !v)}
            className={`w-full px-3 py-2 text-xs flex justify-between items-center rounded-lg border
              ${
                theme === "dark"
                  ? "bg-gray-800 border-gray-600 hover:bg-gray-700"
                  : "bg-white border-gray-300 hover:bg-gray-50"
              }`}
          >
            <span className="truncate">
              {selectedCategories.includes("ALL")
                ? "All Categories"
                : selectedCategories.join(", ")}
            </span>

            <span className={`transition ${categoryOpen ? "rotate-180" : ""}`}>
              ▼
            </span>
          </button>

          {categoryOpen && (
            <div
              className={`absolute mt-2 w-full max-h-48 overflow-y-auto rounded-lg border shadow-lg z-50
                ${
                  theme === "dark"
                    ? "bg-gray-800 border-gray-600"
                    : "bg-white border-gray-200"
                }`}
            >
              {categories.map((cat) => {
                const checked = selectedCategories.includes(cat);

                return (
                  <label
                    key={cat}
                    className={`flex items-center gap-2 px-3 py-2 text-xs cursor-pointer
                      ${
                        theme === "dark"
                          ? "hover:bg-gray-700"
                          : "hover:bg-gray-50"
                      }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      className="accent-blue-600"
                      onChange={() => {
                        if (cat === "ALL") {
                          setSelectedCategories(["ALL"]);
                        } else {
                          let updated = [...selectedCategories];
                          updated = updated.filter((c) => c !== "ALL");

                          if (updated.includes(cat)) {
                            updated = updated.filter((c) => c !== cat);
                          } else {
                            updated.push(cat);
                          }

                          if (updated.length === 0) updated = ["ALL"];

                          setSelectedCategories(updated);
                        }
                      }}
                    />

                    {cat}
                  </label>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* FOOTER */}
      <div
        className={`flex gap-2 px-4 py-3 border-t
          ${
            theme === "dark"
              ? "border-gray-700 bg-gray-800"
              : "border-gray-200 bg-gray-50"
          }`}
      >
        <button
          onClick={() => {
            setSelectedCategories(["ALL"]);
            setSortOrder("ASC");
          }}
          className={`flex-1 text-xs py-2 rounded-lg border
            ${
              theme === "dark"
                ? "border-gray-600 hover:bg-gray-700"
                : "border-gray-300 hover:bg-gray-100"
            }`}
        >
          Reset
        </button>

        <button
          onClick={() => setShowDomainFilter(false)}
          className="flex-1 text-xs py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          Apply
        </button>
      </div>
    </div>
  )}
  </th>)}       
              {!hiddenColumns.includes("url") && (
                <th scope="col" className="px-2 py-2 text-left">URL</th>)}
                {!hiddenColumns.includes("ssl") && (
  <th scope="col" className="px-2 py-2 text-center relative">
    <div className="flex items-center justify-center gap-2">
      <span>SSL Status</span>

      <button
        onClick={() => {
          setShowSslFilter((v) => !v);
          setShowStatusFilter(false);
        }}
        className={`p-1 rounded transition
        ${
          selectedSslStatus !== "ALL"
            ? "text-blue-600 bg-blue-50"
            : "text-gray-500 hover:bg-gray-200"
        }`}
      >
        <Filter size={14} />
      </button>
    </div>

    {showSslFilter && (
      <div
        ref={sslFilterRef}
        className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg z-40 overflow-hidden
        ${
          theme === "dark"
            ? "bg-gray-800 border border-gray-700"
            : "bg-white border border-gray-200"
        }`}
      >
        {sslOptions.map((ssl) => (
          <button
            key={ssl}
            onClick={() => {
              setSelectedSslStatus(ssl);
              setShowSslFilter(false);
            }}
            className={`flex justify-between items-center w-full px-3 py-2 text-sm transition
            ${
              selectedSslStatus === ssl
  ? "bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-300"
  : theme === "dark"
  ? "hover:bg-gray-700"
  : "hover:bg-gray-100"
            }`}
          >
            <span>{ssl}</span>

            {selectedSslStatus === ssl && (
              <span className="text-xs">✓</span>
            )}
          </button>
        ))}

        <div className="border-t border-gray-200 dark:border-gray-700" />

        <button
          onClick={() => setSelectedSslStatus("ALL")}
          className="block w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-100"
        >
          Clear Filter
        </button>
      </div>
    )}
  </th>
)}

                {/* STATUS FILTER */}
            {!hiddenColumns.includes("status") && (
  <th scope="col" className="px-2 py-2 text-left relative">
    <div className="flex items-center gap-2">
      <span>Status</span>

      <button
        onClick={() => {
          setShowStatusFilter((v) => !v);
          setShowSslFilter(false);
        }}
        className={`p-1 rounded transition
        ${
          selectedStatus !== "ALL"
            ? "text-blue-600 bg-blue-50"
            : "text-gray-500 hover:bg-gray-200"
        }`}
      >
        <Filter size={14} />
      </button>
    </div>

    {showStatusFilter && (
      <div
        ref={statusFilterRef}
        className={`absolute left-0 mt-2 w-40 rounded-lg shadow-lg z-40 overflow-hidden
        ${
          theme === "dark"
            ? "bg-gray-800 border border-gray-700"
            : "bg-white border border-gray-200"
        }`}
      >
        {statusOptions.map((status) => (
          <button
            key={status}
            onClick={() => {
              setSelectedStatus(status);
              setShowStatusFilter(false);
            }}
            className={`flex justify-between items-center w-full px-3 py-2 text-sm transition
            ${
             selectedStatus === status
  ? "bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-300"
  : theme === "dark"
  ? "hover:bg-gray-700"
  : "hover:bg-gray-100"
            }`}
          >
            <span>{status}</span>

            {selectedStatus === status && (
              <span className="text-xs">✓</span>
            )}
          </button>
        ))}

        <div className="border-t border-gray-200 dark:border-gray-700" />

        <button
          onClick={() => {
  setSelectedStatus("ALL");
  setShowStatusFilter(false);
}}
          className="block w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-100"
        >
          Clear Filter
        </button>
      </div>
    )}
  </th>
)}
                
                {isSuperAdmin && (
                    <>
                {isSuperAdmin && !hiddenColumns.includes("userEmail") && (   
                <th scope="col" className="px-2 py-2 text-left">User Email</th>)}
                 {isSuperAdmin && !hiddenColumns.includes("userRole") && (
  <th scope="col" className="px-2 py-2 text-center relative">
    <div className="flex items-center justify-center gap-2">
      <span>User Role</span>

      <button
        onClick={() => setShowRoleFilter((v) => !v)}
        
        className={`p-1 rounded transition
        ${
          selectedRole !== "ALL"
            ? "text-blue-600 bg-blue-50"
            : "text-gray-500 hover:bg-gray-200"
        }`}
      >
        <Filter size={14} />
      </button>
    </div>

    {showRoleFilter && (
      <div
        ref={roleFilterRef}
        className={`absolute right-0 mt-2 w-40 rounded-lg shadow-lg z-40 overflow-hidden
        ${
          theme === "dark"
            ? "bg-gray-800 border border-gray-700"
            : "bg-white border border-gray-200"
        }`}
      >
        {roleOptions.map((role) => (
          <button
            key={role}
            onClick={() => {
              setSelectedRole(role);
              setShowRoleFilter(false);
              
            }}
            className={`flex justify-between items-center w-full px-3 py-2 text-sm transition
            ${
              selectedRole === role
  ? "bg-blue-100 text-blue-700 font-semibold dark:bg-blue-900/40 dark:text-blue-300"
  : theme === "dark"
  ? "hover:bg-gray-700"
  : "hover:bg-gray-100"
            }`}
          >
            <span>{role}</span>

            {selectedRole === role && (
              <span className="text-xs">✓</span>
            )}
          </button>
        ))}

        <div className="border-t border-gray-200 dark:border-gray-700" />

        <button
          onClick={() => {
  setSelectedRole("ALL");
  setShowRoleFilter(false);
}}
          className="block w-full text-left px-3 py-2 text-sm text-red-500 hover:bg-gray-100"
        >
          Clear Filter
        </button>
      </div>
    )}
  </th>
)}
                </>
                )}
                {!hiddenColumns.includes("statusCode") && (
                <th scope="col" className="px-2 py-2 text-center">Status Code</th>)}
                  {!hiddenColumns.includes("lastCheckedAt") && (
                <th scope="col" className="px-2 py-2 text-left">Last Check</th>)}
                
              {!isViewer && !hiddenColumns.includes("actions") && (
                  
                  
                <th scope="col" className="px-2 py-2 text-center">Actions</th>
                )}
              </tr>
            </thead>

            <tbody>
              {sortedData.map((item, i) => {
                const handleToggle = async () => {
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

                return (
                  <>
                    <tr
                      key={item._id}
                      role="row"
                      tabIndex={0}
                      className={`border-t transition
                      ${theme === "dark"
                          ? "border-gray-700 hover:bg-gray-800"
                          : "border-slate-200 hover:bg-slate-50"
                        }`}
                      onKeyDown={(e) => { if (e.key === 'Enter') { /* noop - row is focusable */ } }}
                    >
                      {selectionMode && (
                        <td className="px-2 py-2">
                          <input
                            type="checkbox"
                            checked={selectedIds.includes(item._id)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setSelectedIds((prev) => [...prev, item._id]);
                              } else {
                                setSelectedIds((prev) => prev.filter((id) => id !== item._id));
                              }
                            }}
                          />
                        </td>
                      )}
                    {!hiddenColumns.includes("sno") && (
                      <td className="px-2 py-2">{i + 1}</td>)}
                      {!hiddenColumns.includes("domain") && (
                      <td className="px-2 py-2 font-medium">
                        <button onClick={(e) => { e.preventDefault(); handleToggle(); }} className="text-left text-blue-600 hover:underline">
                          {item.domain}
                        </button>
                      </td>
                      )}
                      {!hiddenColumns.includes("url") && (
                      <td className="px-2 py-2 truncate max-w-xs text-blue-500">
                        <a href={item.url} target="_blank" rel="noreferrer">
                          {item.url}
                        </a>
                      </td>)}

                      {!hiddenColumns.includes("ssl") && (
                      <td className={`px-2 py-2 text-center font-semibold ${getSslColor(item.sslStatus)}`}>
                        {getSslText(item)}
                      </td>
                      )}
                      {!hiddenColumns.includes("status") && (
                      <td className={`px-2 py-2 text-center font-semibold ${getStatusColor(item.status)}`}>
                        {item.status || "CHECKING"}
                      </td>
                      )}

                      {isSuperAdmin && (
    <>
    {!hiddenColumns.includes("userEmail") && (
      <td className="px-2 py-2 text-sm text-gray-500">
    {item.ownerEmail || "--"}
  </td>)}
  {!hiddenColumns.includes("userRole") && (
  <td className="px-2 py-2 text-center font-medium">
    {item.ownerRole || "--"}
  </td>)}
    </>
  )}
                      {!hiddenColumns.includes("statusCode") && (
                      <td className="px-2 py-2 text-center">
                        {item.statusCode || "--"}
                      </td>
                      )}
                      {!hiddenColumns.includes("lastCheckedAt") && (
                      <td className="px-2 py-2 text-sm text-gray-500">
                        {item.lastCheckedAt
                          ? new Date(item.lastCheckedAt).toLocaleString()
                          : "-"}
                      </td>)}

                    {!isViewer && !hiddenColumns.includes("actions") && (
  <td className="px-2 py-2">
    <div className="flex justify-center gap-3">
                          <button aria-label={item.pinned ? 'Unpin site' : 'Pin site'} title={item.pinned ? 'Unpin' : 'Pin'} onClick={() => onPin(item._id)}>
                            {item.pinned ? <PinOff size={16} aria-hidden="true" /> : <Pin size={16} aria-hidden="true" />}
                            <span className="sr-only">{item.pinned ? 'Unpin site' : 'Pin site'}</span>
                          </button>
                          <button aria-label="Edit site" title="Edit" onClick={() => onEdit(item)}>✏️ <span className="sr-only">Edit site</span></button>
                          <button
                            onClick={() => onDelete(item._id)}
                            className="text-red-500"
                            aria-label="Delete site"
                            title="Delete"
                          >
                            <Trash2 size={16} aria-hidden="true" />
                          </button>
                        </div>
                      </td>
                      )}
                    </tr>

                    {expandedSite === item._id && (
                      <tr key={`${item._id}-report`} className={`${theme === 'dark' ? 'bg-gray-900' : 'bg-white'}`}>
                      <td colSpan={
    isSuperAdmin
      ? (selectionMode ? 11 : 10)
      : isViewer
      ? (selectionMode ? 8 : 7)
      : (selectionMode ? 9 : 8)
  } className="p-4">
                          <SiteReport site={item} logs={siteLogs[item._id] || []} theme={theme} />
                        </td>
                      </tr>
                    )}
                  </>
                );
              })}
            </tbody>
          </table>
        </div>
        
      {/* ================= MOBILE + TABLET FILTERS ================= */}
  <div className="lg:hidden mb-4 px-1 flex gap-3">

    {/* CATEGORY FILTER */}
  <select
    aria-label="Filter by category"
    value={selectedCategories[0] || "ALL"}
    onChange={(e) => {
      const value = e.target.value;
      if (value === "ALL") {
        setSelectedCategories(["ALL"]);
      } else {
        setSelectedCategories([value]);
      }
    }}
    className={`flex-1 p-2 rounded-lg text-sm border
      ${
        theme === "dark"
          ? "bg-gray-800 border-gray-700 text-gray-200"
          : "bg-white border-gray-300 text-gray-700"
      }
    `}
  >
    {categories.map((cat) => (
      <option key={cat} value={cat}>
        {cat}
      </option>
    ))}
  </select>

    {/* STATUS FILTER */}
    <select
      aria-label="Filter by status"
      value={selectedStatus}
      onChange={(e) => setSelectedStatus(e.target.value)}
      className={`flex-1 p-2 rounded-lg text-sm border
        ${theme === "dark"
          ? "bg-gray-800 border-gray-700 text-gray-200"
          : "bg-white border-gray-300 text-gray-700"}
      `}
    >
      {statusOptions.map((status) => (
        <option key={status} value={status}>
          {status}
        </option>
      ))}
    </select>
    

  </div>

  {/* ================= MOBILE + TABLET CARD VIEW ================= */}
  <div className="lg:hidden px-4 pb-8">
    <div className="grid sm:grid-cols-2 gap-6">

      {sortedData.map((item) => {
        const isExpanded = expandedSite === item._id;

        const statusColor =
          item.status === "UP"
            ? "bg-green-500"
            : item.status === "SLOW"
            ? "bg-yellow-500"
            : item.status === "DOWN"
            ? "bg-red-500"
            : "bg-gray-400";

        return (
          <div key={item._id}>

            {/* CARD */}
            <div
              className={`relative rounded-2xl p-4 shadow-sm border transition-all duration-300 hover:shadow-lg
              ${theme === "dark"
                  ? "bg-gray-900 border-gray-800 text-gray-200"
                  : "bg-white border-gray-200 text-gray-800"
                }`}
            >

              {/* LEFT STATUS ACCENT */}
              <div className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${statusColor}`} />

              {/* DOMAIN + STATUS */}
              <div className="flex justify-between items-center mb-5">
                <h3 className="font-semibold text-base tracking-wide">
                  <button
                    onClick={() => toggleSite(item)}
                    className="text-left text-blue-600 hover:underline"
                  >
                    {item.domain}
                  </button>
                </h3>

                <span
                  className={`text-xs px-2 py-1 rounded-full font-semibold
                  ${item.status === "UP"
                    ? "bg-green-100 text-green-700"
                    : item.status === "SLOW"
                    ? "bg-yellow-100 text-yellow-700"
                    : item.status === "DOWN"
                    ? "bg-red-100 text-red-700"
                    : "bg-gray-100 text-gray-500"
                  }`}
                >
                  {item.status || "CHECKING"}
                </span>
              </div>

              {/* URL */}
              <div className="text-sm text-blue-500 break-all mb-4">
                {item.url}
              </div>

              {/* INFO GRID */}
              <div className="grid grid-cols-2 gap-y-3 text-sm mb-4">
                <div className="text-gray-400">Status Code</div>
                <div className="font-semibold text-right">
                  {item.statusCode || "--"}
                </div>

                <div className="text-gray-400">SSL Status</div>
                <div
                  className={`font-semibold text-right
                    ${item.sslStatus === "VALID"
                      ? "text-green-600"
                      : item.sslStatus === "EXPIRING"
                      ? "text-yellow-500"
                      : item.sslStatus === "EXPIRED"
                      ? "text-red-600"
                      : "text-gray-400"
                    }`}
                >
                  {getSslText(item)}
                </div>
              </div>

              {/* DIVIDER */}
              <div className={`border-t mb-4 ${theme === "dark" ? "border-gray-800" : "border-gray-200"}`} />

              {/* ACTIONS */}
              <div className="flex justify-between items-center">
                {!isViewer && (
  <button
    onClick={() => onEdit(item)}
    className="px-4 py-2 text-sm font-medium rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition"
  >
    Edit
  </button>
  )}

                <button
                  onClick={() => toggleSite(item)}
                  className="text-sm font-medium text-blue-600 hover:underline"
                >
                  {isExpanded ? "Hide Report" : "View Report"}
                </button>
              </div>

            </div>

            {/* EXPANDABLE REPORT SECTION */}
            {isExpanded && (
              <div
                className={`mt-3 rounded-2xl p-4 border transition-all duration-300
                ${theme === "dark"
                    ? "bg-gray-900 border-gray-800"
                    : "bg-white border-gray-200"
                  }`}
              >
                <SiteReport
                  site={item}
                  logs={siteLogs[item._id] || []}
                  theme={theme}
                />
              </div>
            )}

          </div>
        );
      })}

    </div>
  </div>
  </div>


      
    );
  };

  export default UrlTable;
