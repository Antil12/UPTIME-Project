import { Pin, PinOff, Trash2, Filter } from "lucide-react";
import { useMemo, useState } from "react";

const UrlTable = ({
  urls,
  theme,
  onPin,
  onDelete,
  onEdit,
  selectionMode = false,
  selectedIds = [],
  setSelectedIds = () => {},
  categories = [],
  selectedCategory,
  setSelectedCategory,
  selectedStatus, 
  setSelectedStatus,
}) => {
  const [showFilter, setShowFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  /* ✅ Dynamic Status Options */
  const statusOptions = useMemo(() => {
    const statuses = urls.map((u) => u.status).filter(Boolean);
    return ["ALL", ...Array.from(new Set(statuses))];
  }, [urls]);

  const sortedData = [...urls].sort(
    (a, b) => (b.pinned === true) - (a.pinned === true)
  );

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
            className={`text-sm sticky top-[80px] z-40
            ${theme === "dark"
                ? "bg-gray-800 text-gray-200"
                : "bg-slate-100 text-gray-700"
              }`}
          >
            <tr>
                {selectionMode && <th scope="col" className="px-2 py-2 text-left"> </th>}
              <th scope="col" className="px-2 py-2 text-left">Serial No.</th>

              {/* DOMAIN FILTER */}
              <th scope="col" className="px-2 py-2 text-left relative">
                <div className="flex items-center gap-2">
                  <span>Domain</span>
                  <button
                    onClick={() => {
                      setShowFilter((v) => !v);
                      setShowStatusFilter(false);
                    }}
                    aria-label="Filter by category"
                    className={`p-1 rounded hover:bg-gray-200
                    ${selectedCategory !== "ALL"
                        ? "text-blue-600"
                        : "text-gray-500"
                      }`}
                  >
                    <Filter size={14} />
                  </button>
                </div>

                {showFilter && (
                  <div
                    className={`absolute left-0 mt-2 w-40 rounded shadow z-40
                    ${theme === "dark"
                        ? "bg-gray-800 border border-gray-700"
                        : "bg-white border border-gray-200"
                      }`}
                  >
                    {categories.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => {
                          setSelectedCategory(cat);
                          setShowFilter(false);
                        }}
                        className={`block w-full text-left px-3 py-2 text-sm hover:bg-slate-100
                        ${selectedCategory === cat
                            ? "font-semibold text-blue-600"
                            : ""
                          }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                )}
              </th>

              <th scope="col" className="px-2 py-2 text-left">URL</th>
              <th scope="col" className="px-2 py-2 text-center">SSL Status</th>

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

              <th scope="col" className="px-2 py-2 text-center">Status Code</th>
              <th scope="col" className="px-2 py-2 text-left">Last Check</th>
              <th scope="col" className="px-2 py-2 text-center">Actions</th>
            </tr>
          </thead>

          <tbody>
            {sortedData.map((item, i) => (
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
                <td className="px-2 py-2 font-medium">{item.domain}</td>

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

                <td className="px-2 py-2 text-center">
                  {item.statusCode || "--"}
                </td>
                <td className="px-2 py-2 text-sm text-gray-500">
                  {item.lastCheckedAt
                    ? new Date(item.lastCheckedAt).toLocaleString()
                    : "-"}
                </td>
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
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
    {/* ================= MOBILE + TABLET FILTERS ================= */}
<div className="lg:hidden mb-4 px-1 flex gap-3">

  {/* CATEGORY FILTER */}
  <select
    aria-label="Filter by category"
    value={selectedCategory}
    onChange={(e) => setSelectedCategory(e.target.value)}
    className={`flex-1 p-2 rounded-lg text-sm border
      ${theme === "dark"
        ? "bg-gray-800 border-gray-700 text-gray-200"
        : "bg-white border-gray-300 text-gray-700"}
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
      const statusColor =
        item.status === "UP"
          ? "bg-green-500"
          : item.status === "SLOW"
          ? "bg-yellow-500"
          : item.status === "DOWN"
          ? "bg-red-500"
          : "bg-gray-400";

      return (
        <div
          key={item._id}
          className={`relative rounded-2xl p-4 shadow-sm border transition-all duration-300 hover:shadow-lg hover:-translate-y-1
          ${theme === "dark"
              ? "bg-gray-900 border-gray-800 text-gray-200"
              : "bg-white border-gray-200 text-gray-800"
            }`}
        >

          {/* LEFT STATUS ACCENT */}
          <div className={`absolute left-0 top-0 h-full w-1 rounded-l-2xl ${statusColor}`} />

          {selectionMode && (
            <div className="absolute right-4 top-4">
              <input
                type="checkbox"
                checked={selectedIds.includes(item._id)}
                onChange={(e) => {
                  if (e.target.checked) setSelectedIds((p) => [...p, item._id]);
                  else setSelectedIds((p) => p.filter((id) => id !== item._id));
                }}
                aria-label={`Select ${item.domain}`}
              />
            </div>
          )}

          {/* DOMAIN + STATUS */}
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-base tracking-wide">
              {item.domain}
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

          {/* EDIT BUTTON */}
          <div className="flex justify-center">
            <button
              onClick={() => onEdit(item)}
              aria-label={`Edit ${item.domain}`}
              className="px-4 py-2 text-sm font-medium rounded-xl transition-all duration-200 bg-indigo-600 text-white hover:bg-indigo-700 shadow-sm"
            >
              Edit
            </button>
          </div>

        </div>
      );
    })}

  </div>
</div>


</div>


    
  );
};

export default UrlTable;
