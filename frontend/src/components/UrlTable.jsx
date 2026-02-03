import { Pin, PinOff, Trash2 } from "lucide-react";

const UrlTable = ({
  urls,
  theme,
  onPin,
  onDelete,
  onEdit,
}) => {
  const sortedData = [...urls].sort(
    (a, b) => b.pinned - a.pinned
  );

  return (
    <table
      className={`w-full rounded shadow text-sm overflow-hidden
        ${theme === "dark"
          ? "bg-gray-900 text-gray-200"
          : "bg-white text-gray-800"}`}
    >
      <thead
        className={`text-sm ${
          theme === "dark"
            ? "bg-gray-800 text-gray-200"
            : "bg-slate-100 text-gray-700"
        }`}
      >
        <tr>
          <th className="pl-3 pr-3 py-3 text-left">Serial No.</th>
          <th className="pl-3 pr-3 py-3 text-left">Domain</th>
          <th className="pl-3 pr-3 py-3 text-left">URL</th>
          <th className="pl-3 pr-3 py-3 text-left">Status Code</th>
          <th className="pl-3 pr-3 py-3 text-left">Code</th>
          <th className="pl-3 pr-3 py-3 text-left">Actions</th>
        </tr>
      </thead>

      <tbody>
        {sortedData.map((item, i) => (
          <tr
            key={item.id}
            className={`border-t transition ${
              theme === "dark"
                ? "border-gray-700 hover:bg-gray-800"
                : "border-slate-200 hover:bg-slate-50"
            }`}
          >
            <td className="pl-3 pr-3 py-3">{i + 1}</td>
            <td className="pl-3 pr-3 py-3 font-medium">
              {item.domain}
            </td>

            <td className="pl-3 pr-3 py-3 truncate max-w-xs text-blue-500">
              <a href={item.url} target="_blank" rel="noreferrer">
                {item.url}
              </a>
            </td>

            <td className="pl-3 pr-3 py-3">
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  item.status === "UP"
                    ? "bg-green-500/20 text-green-300"
                    : "bg-red-500/20 text-red-300"
                }`}
              >
                {item.status}
              </span>
            </td>

            <td className="pl-3 pr-3 py-3">
              {item.statusCode || "--"}
            </td>

            <td className="pl-3 pr-3 py-3 flex gap-3">
              <button onClick={() => onPin(item.id)}>
                {item.pinned ? <PinOff size={16} /> : <Pin size={16} />}
              </button>
              <button onClick={() => onEdit(item)}>✏️</button>
              <button onClick={() => onDelete(item.id)}>
                <Trash2 size={16} />
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
 

   
};

export default UrlTable;
