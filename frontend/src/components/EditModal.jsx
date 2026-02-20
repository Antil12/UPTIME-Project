import { useState, useEffect } from "react";
import { X } from "lucide-react";

export default function EditModal({
  item,
  theme,
  editDomain,
  editUrl,
  setEditDomain,
  setEditUrl,
  editEmail,
  editPhone,
  editPriority,
  editResponseThresholdMs,
  setEditEmail,
  setEditPhone,
  setEditPriority,
  setEditResponseThresholdMs,
  urlError,
  onClose,
  onSave,
  initialCategory,
}) {
  if (!item) return null;

  const [category, setCategory] = useState(item.category || "");

  useEffect(() => {
    if (initialCategory !== undefined) setCategory(initialCategory);
  }, [initialCategory]);

  const isDark = theme === "dark";

  const modalClass = isDark
    ? "bg-gray-900 text-gray-100 border border-gray-800"
    : "bg-white text-gray-800 border border-gray-200";

  const labelClass = "text-sm font-medium mb-1 block";

  const inputClass = isDark
    ? "w-full px-4 py-2.5 rounded-2xl border border-gray-700 bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
    : "w-full px-4 py-2.5 rounded-2xl border border-gray-300 bg-white text-gray-800 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition";

  const cancelBtnClass = isDark
    ? "px-5 py-2.5 rounded-2xl bg-gray-800 hover:bg-gray-700 text-white font-medium transition"
    : "px-5 py-2.5 rounded-2xl bg-gray-100 hover:bg-gray-200 text-gray-800 font-medium transition";

  const saveBtnClass =
    "px-6 py-2.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-md hover:shadow-lg transition";

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div
        className={`w-full max-w-lg rounded-3xl p-7 shadow-2xl ${modalClass}`}
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">
              Edit Website
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Update monitoring details below
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-gray-200 dark:hover:bg-gray-800 transition"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <label className={labelClass}>Domain Name</label>
            <input
              value={editDomain}
              onChange={(e) => setEditDomain(e.target.value)}
              placeholder="example.com"
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Website URL</label>
            <input
              value={editUrl}
              onChange={(e) => setEditUrl(e.target.value)}
              placeholder="https://example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Category</label>
            <input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="E-commerce, Blog, SaaS..."
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Priority</label>
            <input
              value={editPriority}
              onChange={(e) => setEditPriority(e.target.value)}
              placeholder="Low / Medium / High"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Contact Email</label>
            <input
              type="email"
              value={editEmail}
              onChange={(e) => setEditEmail(e.target.value)}
              placeholder="admin@example.com"
              className={inputClass}
            />
          </div>

          <div>
            <label className={labelClass}>Contact Phone</label>
            <input
              value={editPhone}
              onChange={(e) => setEditPhone(e.target.value)}
              placeholder="+91 9876543210"
              className={inputClass}
            />
          </div>

          <div className="md:col-span-2">
            <label className={labelClass}>Max Response Time (ms)</label>
            <input
              type="number"
              value={editResponseThresholdMs}
              onChange={(e) => setEditResponseThresholdMs(e.target.value)}
              placeholder="2000"
              className={inputClass}
            />
          </div>
        </div>

        {urlError && (
          <p className="text-sm text-red-500 mt-4">{urlError}</p>
        )}

        {/* Buttons */}
        <div className="flex justify-end gap-3 mt-8">
          <button onClick={onClose} className={cancelBtnClass}>
            Cancel
          </button>
          <button
            onClick={() => onSave(category)}
            className={saveBtnClass}
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
