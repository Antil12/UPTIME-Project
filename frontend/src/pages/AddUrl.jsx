import React from "react";

const AddUrl = ({
  theme,
  domain,
  url,
  setDomain,
  setUrl,
  urlError,
  onSave,
}) => {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave();
  };

  return (
    <div
      className={`p-6 rounded-xl shadow max-w-xl mx-auto ${
        theme === "dark"
          ? "bg-gray-800 text-white border border-gray-700"
          : "bg-white/70 text-black border border-gray-200"
      }`}
    >
      <h2 className="text-lg font-semibold mb-4">Add Website</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Domain Name"
          className="w-full p-2 rounded border"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
        />

        <input
          type="url"
          placeholder="https://example.com"
          className="w-full p-2 rounded border"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
        />

        {urlError && (
          <p className="text-sm text-red-500">{urlError}</p>
        )}

        <button
          type="submit"
          className="w-full bg-slate-900 text-white py-2 rounded hover:bg-slate-800"
        >
          Add URL
        </button>
      </form>
    </div>
  );
};

export default AddUrl;
