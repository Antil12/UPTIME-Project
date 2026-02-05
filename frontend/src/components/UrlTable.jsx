import { Pin, PinOff, Trash2 } from "lucide-react";

const UrlTable = ({ urls, theme, onPin, onDelete, onEdit }) => {
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
          <th className="px-3 py-3 text-left">Domain</th>
          <th className="px-3 py-3 text-left">URL</th>
          <th className="px-3 py-3 text-center">SSL Status</th>
          <th className="px-3 py-3 text-center">Status</th>
          <th className="px-3 py-3 text-center">Status Code</th>
          <th className="px-3 py-3 text-left">Last Check</th>
          <th className="px-3 py-3 text-center">Actions</th>
        </tr>
      </thead>

      <tbody>
        {sortedData.map((item, i) => (
          <tr
            key={item._id}
            className={`border-t transition ${
              theme === "dark"
                ? "border-gray-700 hover:bg-gray-800"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <td className="px-3 py-3">{i + 1}</td>

            <td className="px-3 py-3 font-medium">
              {item.domain}
            </td>

            <td className="px-3 py-3 truncate max-w-xs text-blue-500">
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.url}
              </a>
            </td>

            {/* SSL STATUS */}
<td className="px-3 py-3 text-center font-semibold">
  {item.sslStatus ? (
    <span
      title={
        item.sslValidTo
          ? `Valid till ${new Date(item.sslValidTo).toLocaleDateString()}`
          : ""
      }
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
      {item.sslStatus === "EXPIRED" && "Expired"}
      {item.sslStatus === "ERROR" && "Error"}
    </span>
  ) : (
    <span className="text-gray-400">Checking</span>
  )}
</td>


            {/* STATUS */}
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

            {/* STATUS CODE */}
            <td className="px-3 py-3 text-center">
              {item.statusCode || "--"}
            </td>

            {/* LAST CHECK */}
            <td className="px-3 py-3 text-sm text-gray-500">
              {item.lastCheckedAt
                ? new Date(item.lastCheckedAt).toLocaleString()
                : "-"}
            </td>

            {/* ACTIONS */}
            <td className="px-3 py-3">
              <div className="flex justify-center gap-3">
                {/* PIN */}
                <button onClick={() => onPin(item._id)}>
                    {item.pinned ? <PinOff size={16} /> : <Pin size={16} />}
                  </button>


                {/* EDIT */}
                <button
                  onClick={() => onEdit(item)}
                  title="Edit"
                  className="text-blue-500 hover:text-blue-700"
                >
                  ✏️
                </button>

                {/* DELETE */}
                <button
                  onClick={() => onDelete(item._id)}
                  title="Delete"
                  className="text-red-500 hover:text-red-700"
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
