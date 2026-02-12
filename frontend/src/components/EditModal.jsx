import { useState, useEffect } from "react";

export default function EditModal({
  item,
  theme,
  editDomain,
  editUrl,
  setEditDomain,
  setEditUrl,
  urlError,
  onClose,
  onSave,
  initialCategory,     
}) {
  if (!item) return null;

  // Local state for category
  const [category, setCategory] = useState(item.category || "");

  // If parent passes category, sync it
  useEffect(() => {
    if (initialCategory !== undefined) setCategory(initialCategory);
  }, [initialCategory]);

  // Dynamic classes based on theme
  const bgClass =
    theme === "dark"
      ? "bg-gray-800 text-white border-gray-700"
      : "bg-white text-black border-gray-300";
  const inputClass =
    theme === "dark"
      ? "w-full p-2 mb-3 rounded border border-gray-600 bg-gray-700 text-white placeholder-gray-400"
      : "w-full p-2 mb-3 rounded border border-gray-300 bg-white text-black placeholder-gray-500";
  const errorClass = "text-sm text-red-500 mb-3";
  const cancelBtnClass =
    theme === "dark"
      ? "px-4 py-2 rounded bg-gray-600 text-white hover:bg-gray-500"
      : "px-4 py-2 rounded bg-gray-300 text-black hover:bg-gray-400";
  const saveBtnClass =
    theme === "dark"
      ? "px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-500"
      : "px-4 py-2 rounded bg-blue-500 text-white hover:bg-blue-400";

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div className={`w-[90%] max-w-md rounded-3xl p-6 border shadow-lg ${bgClass}`}>
        <h2 className="text-xl font-semibold mb-4">✏️ Edit Website</h2>

        <input
          value={editDomain}
          onChange={(e) => setEditDomain(e.target.value)}
          placeholder="Domain name"
          className={inputClass}
        />

        <input
          value={editUrl}
          onChange={(e) => setEditUrl(e.target.value)}
          placeholder="Website URL"
          className={inputClass}
        />

        <input
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder="Category (optional)"
          className={inputClass}
        />

        {urlError && <p className={errorClass}>{urlError}</p>}

        <div className="flex justify-end gap-3">
          <button onClick={onClose} className={cancelBtnClass}>
            Cancel
          </button>
          <button
            onClick={() => onSave(category)}
            className={saveBtnClass}
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
