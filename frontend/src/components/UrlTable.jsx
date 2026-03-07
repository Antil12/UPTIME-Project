import { Pin, PinOff, Trash2, Filter } from "lucide-react";
import { useMemo, useState, useEffect, useRef } from "react";
import axios from "axios";
import SiteReport from "./SiteReport";

const UrlTable = ({
  urls,
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
  const [selectedRole, setSelectedRole] = useState("ALL");
const [showRoleFilter, setShowRoleFilter] = useState(false);
const roleFilterRef = useRef(null);
  const isViewer = currentUser?.role?.toUpperCase() === "VIEWER";
  const isSuperAdmin = currentUser?.role?.toUpperCase() === "SUPERADMIN";
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
  const roles = urls.map((u) => u.ownerRole).filter(Boolean);
  return ["ALL", ...Array.from(new Set(roles))];
}, [urls]);
  const sslOptions = useMemo(() => {
  const sslStatuses = urls.map((u) => u.sslStatus).filter(Boolean);
  return ["ALL", ...Array.from(new Set(sslStatuses))];
}, [urls]);

  /* ✅ Dynamic Status Options */
  const statusOptions = useMemo(() => {
    const statuses = urls.map((u) => u.status).filter(Boolean);
    return ["ALL", ...Array.from(new Set(statuses))];
  }, [urls]);

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
  function handleClickOutside(event) {
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
const sortedData = [...filteredData]
  .sort((a, b) => (b.pinned === true) - (a.pinned === true))
  .sort((a, b) => {
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

  return (
    <div className="w-full">
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
              <th scope="col" className="px-2 py-2 text-left">S No.</th>

            {/* ================= DOMAIN FILTER COLUMN ================= */}
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
</th>
              <th scope="col" className="px-2 py-2 text-left">URL</th>
              <th scope="col" className="px-2 py-2 text-center relative">
  <div className="flex items-center justify-center gap-2">
    <span>SSL Status</span>
    <button
      onClick={() => setShowSslFilter((v) => !v)}
      className={`p-1 rounded hover:bg-gray-200
        ${selectedSslStatus !== "ALL"
          ? "text-blue-600"
          : "text-gray-500"
        }`}
    >
      <Filter size={14} />
    </button>
  </div>

  {showSslFilter && (
    <div
      className={`absolute right-0 mt-2 w-36 rounded shadow z-40
        ${theme === "dark"
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
          className={`block w-full text-left px-3 py-2 text-sm hover:bg-slate-100
            ${selectedSslStatus === ssl
              ? "font-semibold text-blue-600"
              : ""
            }`}
        >
          {ssl}
        </button>
      ))}
    </div>
  )}
</th>

              {/* STATUS FILTER */}
              <th scope="col" className="px-2 py-2 text-left relative">
                <div className="flex items-center gap-2">
                  <span>Status</span>
                  <button
                    onClick={() => {
                      setShowStatusFilter((v) => !v);
                      setShowFilter(false);
                    }}
                    aria-label="Filter by status"
                    className={`p-1 rounded hover:bg-gray-200
                    ${selectedStatus !== "ALL"
                        ? "text-blue-600"
                        : "text-gray-500"
                      }`}
                  >
                    <Filter size={14} />
                  </button>
                </div>

                {showStatusFilter && (
                  <div
                    className={`absolute left-0 mt-2 w-36 rounded shadow z-40
                    ${theme === "dark"
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
                        className={`block w-full text-left px-3 py-2 text-sm hover:bg-slate-100
                        ${selectedStatus === status
                            ? "font-semibold text-blue-600"
                            : ""
                          }`}
                      >
                        {status}
                      </button>
                    ))}
                  </div>
                )}
              </th>
              {isSuperAdmin && (
                  <>
              <th scope="col" className="px-2 py-2 text-left">User Email</th>
              <th scope="col" className="px-2 py-2 text-center relative">
  <div className="flex items-center justify-center gap-2">
    <span>User Role</span>

    <button
      onClick={() => setShowRoleFilter((v) => !v)}
      className={`p-1 rounded hover:bg-gray-200
        ${selectedRole !== "ALL" ? "text-blue-600" : "text-gray-500"}
      `}
    >
      <Filter size={14} />
    </button>
  </div>

  {showRoleFilter && (
    <div
      ref={roleFilterRef}
      className={`absolute right-0 mt-2 w-36 rounded shadow z-40
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
          className={`block w-full text-left px-3 py-2 text-sm hover:bg-slate-100
            ${selectedRole === role ? "font-semibold text-blue-600" : ""}
          `}
        >
          {role}
        </button>
      ))}
    </div>
  )}
</th>
              </>
              )}

              <th scope="col" className="px-2 py-2 text-center">Status Code</th>
              <th scope="col" className="px-2 py-2 text-left">Last Check</th>
              {!isViewer && (
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
                    <td className="px-2 py-2">{i + 1}</td>
                    <td className="px-2 py-2 font-medium">
                      <button onClick={(e) => { e.preventDefault(); handleToggle(); }} className="text-left text-blue-600 hover:underline">
                        {item.domain}
                      </button>
                    </td>

                    <td className="px-2 py-2 truncate max-w-xs text-blue-500">
                      <a href={item.url} target="_blank" rel="noreferrer">
                        {item.url}
                      </a>
                    </td>
                    <td className={`px-2 py-2 text-center font-semibold ${getSslColor(item.sslStatus)}`}>
                      {getSslText(item)}
                    </td>
                    <td className={`px-2 py-2 text-center font-semibold ${getStatusColor(item.status)}`}>
                      {item.status || "CHECKING"}
                    </td>
                    {isSuperAdmin && (
  <>
    <td className="px-2 py-2 text-sm text-gray-500">
  {item.ownerEmail || "--"}
</td>

<td className="px-2 py-2 text-center font-medium">
  {item.ownerRole || "--"}
</td>
  </>
)}

                    <td className="px-2 py-2 text-center">
                      {item.statusCode || "--"}
                    </td>
                    <td className="px-2 py-2 text-sm text-gray-500">
                      {item.lastCheckedAt
                        ? new Date(item.lastCheckedAt).toLocaleString()
                        : "-"}
                    </td>
                   {!isViewer && (
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
