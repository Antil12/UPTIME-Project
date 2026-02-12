import { Pin, PinOff, Trash2, Filter } from "lucide-react";
import { useMemo, useState } from "react";
//import CategoryFilter from "./CategoryFilter";


const UrlTable = ({
  urls,
  theme,
  onPin,
  onDelete,
  onEdit,
  categories = [],
  selectedCategory,
  setSelectedCategory,
  selectedStatus,
  setSelectedStatus,
}) => {
  const [showFilter, setShowFilter] = useState(false);
  const [showCategoryFilter, setShowCategoryFilter] = useState(false);
  const [showStatusFilter, setShowStatusFilter] = useState(false);

  /* =====================================================
     ✅ DYNAMIC STATUS OPTIONS (FROM DATABASE)
     ❌ NO HARD CODE
  ===================================================== */
  const statusOptions = useMemo(() => {
    const statuses = urls
      .map((u) => u.status)
      .filter(Boolean); // remove null / undefined

    return ["ALL", ...Array.from(new Set(statuses))];
  }, [urls]);

  const sortedData = [...urls].sort(
    (a, b) => (b.pinned === true) - (a.pinned === true)
  );

  return (
    <table
      className={`w-full rounded shadow text-sm overflow-hidden
        ${theme === "dark"
          ? "bg-gray-900 text-gray-200"
          : "bg-white text-gray-800"}`}
    >
      <thead
        className={`text-sm sticky top-[72px] z-30
          ${theme === "dark"
            ? "bg-gray-800 text-gray-200"
            : "bg-slate-100 text-gray-700"
          }`}
      >
        <tr>
          <th className="px-3 py-3 text-left">Serial No.</th>

          {/* ===== DOMAIN + CATEGORY FILTER ===== */}
          <th className="px-3 py-3 text-left relative">
            <div className="flex items-center gap-2">
              <span>Domain</span>
              <button
                onClick={() => {
                  setShowFilter((v) => !v);
                  setShowStatusFilter(false);
                }}
                className={`p-1 rounded hover:bg-gray-200
                  ${selectedCategory !== "ALL"
                    ? "text-blue-600"
                    : "text-gray-500"}
                `}
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
                    className={`block w-full text-left px-3 py-2 text-sm
                      hover:bg-slate-100
                      ${selectedCategory === cat
                        ? "font-semibold text-blue-600"
                        : ""}
                    `}
                  >
                    {cat}
                  </button>
                ))}
                {/* <th className="px-3 py-3 text-left">
  <div className="flex items-center gap-3">
    <span>Domain</span>

    <CategoryFilter
      categories={categories}
      selectedCategory={selectedCategory}
      onSelect={setSelectedCategory}
      theme={theme}
    />
  </div>
</th> */}

              </div>
            )}
          </th>

          <th className="px-3 py-3 text-left">URL</th>

          {/* 🔒 SSL STATUS — UNTOUCHED */}
          <th className="px-3 py-3 text-center">SSL Status</th>

          {/* ===== STATUS FILTER (DYNAMIC) ===== */}
          <th className="px-3 py-3 text-left relative">
            <div className="flex items-center gap-2">
              <span>Status</span>
              <button
                onClick={() => {
                  setShowStatusFilter((v) => !v);
                  setShowCategoryFilter(false);
                }}
                className={`p-1 rounded hover:bg-gray-200
                  ${selectedStatus !== "ALL"
                    ? "text-blue-600"
                    : "text-gray-500"}
                `}
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
                    className={`block w-full text-left px-3 py-2 text-sm
                      hover:bg-slate-100
                      ${selectedStatus === status
                        ? "font-semibold text-blue-600"
                        : ""}
                    `}
                  >
                    {status}
                  </button>
                ))}
              </div>
            )}
          </th>

          <th className="px-3 py-3 text-center">Status Code</th>
          <th className="px-3 py-3 text-left">Last Check</th>
          <th className="px-3 py-3 text-center">Actions</th>
        </tr>
      </thead>

      <tbody>
        {sortedData.map((item, i) => (
          <tr
            key={item._id}
            className={`border-t transition
              ${theme === "dark"
                ? "border-gray-700 hover:bg-gray-800"
                : "border-slate-200 hover:bg-slate-50"
              }`}
          >
            <td className="px-3 py-3">{i + 1}</td>

            <td className="px-3 py-3 font-medium">{item.domain}</td>

            <td className="px-3 py-3 truncate max-w-xs text-blue-500">
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.url}
              </a>
            </td>

            {/* 🔒 SSL STATUS — UNTOUCHED */}
            <td className="px-3 py-3 text-center font-semibold">
              {item.sslStatus ? (
                <span
                  className={
                    item.sslStatus === "VALID"
                      ? "text-green-600"
                      : item.sslStatus === "EXPIRING"
                      ? "text-yellow-500"
                      : item.sslStatus === "EXPIRED"
                      ? "text-red-600"
                      : "text-gray-400"
                  }
                >
                  {item.sslStatus === "VALID" && "Secure"}
                  {item.sslStatus === "EXPIRING" &&
                    `Expiring (${item.sslDaysRemaining}d)`}
                  {item.sslStatus === "ERROR" && "Error"}
                </span>
              ) : (
                <span className="text-gray-400">Checking</span>
              )}
            </td>

            {/* STATUS DISPLAY — SAME AS BEFORE */}
            <td className="px-3 py-3 text-center font-semibold">
              <span
                className={
                  item.status === "UP"
                    ? "text-green-600"
                    : item.status === "SLOW"
                    ? "text-yellow-500"
                    : item.status === "DOWN"
                    ? "text-red-600"
                    : "text-gray-400"
                }
              >
                {item.status || "CHECKING"}
              </span>
            </td>

            <td className="px-3 py-3 text-center">
              {item.statusCode || "--"}
            </td>

            <td className="px-3 py-3 text-sm text-gray-500">
              {item.lastCheckedAt
                ? new Date(item.lastCheckedAt).toLocaleString()
                : "-"}
            </td>

            <td className="px-3 py-3">
              <div className="flex justify-center gap-3">
                <button onClick={() => onPin(item._id)}>
                  {item.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                </button>

                <button onClick={() => onEdit(item)}>✏️</button>

                <button
                  onClick={() => onDelete(item._id)}
                  className="text-red-500"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export default UrlTable;
