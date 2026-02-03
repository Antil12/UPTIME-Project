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
}) {
  if (!item) return null;

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
      <div
        className={`w-[90%] max-w-md rounded-3xl p-6 border shadow-lg ${
          theme === "dark"
            ? "bg-gray-800 text-white border-gray-700"
            : "bg-white text-black border-gray-300"
        }`}
      >
        <h2 className="text-xl font-semibold mb-4">✏️ Edit Website</h2>

        <input
          value={editDomain}
          onChange={(e) => setEditDomain(e.target.value)}
          placeholder="Domain name"
          className="w-full p-2 mb-3 rounded border"
        />

        <input
          value={editUrl}
          onChange={(e) => setEditUrl(e.target.value)}
          placeholder="Website URL"
          className="w-full p-2 mb-2 rounded border"
        />

        {urlError && (
          <p className="text-sm text-red-500 mb-3">{urlError}</p>
        )}

        <div className="flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded bg-gray-400 text-white"
          >
            Cancel
          </button>
          <button
            onClick={onSave}
            className="px-4 py-2 rounded bg-blue-600 text-white"
          >
            Update
          </button>
        </div>
      </div>
    </div>
  );
}
