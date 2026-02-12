import React, { useState } from "react";

const AddUrl = ({
  theme,
  domain,
  url,
  setDomain,
  setUrl,
  urlError,
  onSave,
  urls = [],
}) => {
  const [category, setCategory] = useState("");
  const [localError, setLocalError] = useState("");

  const normalize = (value = "") =>
    value.trim().toLowerCase().replace(/\/$/, "");

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    const normalizedDomain = normalize(domain);
    const normalizedUrl = normalize(url);

    if (!normalizedDomain || !normalizedUrl) {
      setLocalError("❌ Domain and URL are required");
      return;
    }

    const duplicateDomain = urls.some(
      (u) => normalize(u.domain) === normalizedDomain
    );

    if (duplicateDomain) {
      setLocalError("❌ Domain name already exists");
      return;
    }

    const duplicateUrl = urls.some(
      (u) => normalize(u.url) === normalizedUrl
    );

    if (duplicateUrl) {
      setLocalError("❌ URL already exists");
      return;
    }

  
    onSave({
      domain: domain.trim(),
      url: url.trim(),
      category: category.trim() || null,
    });
    setCategory("");
  };

  const containerClass =
    theme === "dark"
      ? "bg-gray-800 text-white border border-gray-700"
      : "bg-white/80 text-black border border-gray-200";

  const inputClass =
    theme === "dark"
      ? "w-full p-2 rounded border bg-gray-700 border-gray-600 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
      : "w-full p-2 rounded border bg-white border-gray-300 text-black placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500";

  const buttonClass =
    theme === "dark"
      ? "w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700 transition-colors duration-200"
      : "w-full py-2 rounded bg-slate-900 text-white hover:bg-slate-800 transition-colors duration-200";

  return (
    <div className={`p-6 rounded-xl shadow max-w-xl mx-auto ${containerClass}`}>
      <h2 className="text-lg font-semibold mb-4">Add Website</h2>

      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          placeholder="Domain Name"
          value={domain}
          onChange={(e) => setDomain(e.target.value)}
          className={inputClass}
        />

        <input
          type="url"
          placeholder="https://example.com"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          className={inputClass}
        />

        <input
          type="text"
          placeholder="Category (optional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className={inputClass}
        />

        {(urlError || localError) && (
          <p className="text-sm text-red-500">
            {localError || urlError}
          </p>
        )}

        <button type="submit" className={buttonClass}>
          Add URL
        </button>
      </form>
    </div>
  );
};

export default AddUrl;
