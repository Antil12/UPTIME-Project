import { useState } from "react";
import axios from "axios";
import { UploadCloud, FileText, Loader2 } from "lucide-react";

const BulkUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);

  const handleFileChange = (e) => {
    const selected = e.target.files[0];

    if (!selected) return;

    if (!selected.name.endsWith(".csv")) {
      setMessage({ type: "error", text: "Only CSV files are allowed" });
      return;
    }

    setFile(selected);
    setMessage(null);
  };

  const uploadCsv = async () => {
    if (!file) {
      setMessage({ type: "error", text: "Please select a CSV file" });
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setLoading(true);
      setMessage(null);

      const API = import.meta.env.VITE_API_URL;

await axios.post(
  `${API}/monitoredsite/bulk-import`,
  formData,
  {
    headers: {
      "Content-Type": "multipart/form-data",
      Authorization: `Bearer ${localStorage.getItem("loginToken")}`,
    },
  }
);

      setMessage({
        type: "success",
        text: "Sites imported successfully",
      });

      setFile(null);
    } catch (err) {
      setMessage({
        type: "error",
        text: "Upload failed. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto p-6">

      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-6 shadow-sm">

        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          Bulk Upload Sites
        </h2>

        {/* Upload Area */}
        <label className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl p-8 cursor-pointer hover:border-blue-500 transition">

          <UploadCloud size={36} className="text-gray-400 mb-2" />

          <p className="text-sm text-gray-600 dark:text-gray-400">
            Click to upload or drag CSV file
          </p>

          <p className="text-xs text-gray-400 mt-1">
            Only .csv files supported
          </p>

          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
          />
        </label>

        {/* Selected File */}
        {file && (
          <div className="flex items-center gap-2 mt-4 text-sm text-gray-700 dark:text-gray-300">
            <FileText size={16} />
            {file.name}
          </div>
        )}

        {/* Message */}
        {message && (
          <div
            className={`mt-4 text-sm ${
              message.type === "error"
                ? "text-red-500"
                : "text-green-600"
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={uploadCsv}
          disabled={loading}
          className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg transition disabled:opacity-60"
        >
          {loading ? (
            <>
              <Loader2 className="animate-spin" size={18} />
              Uploading...
            </>
          ) : (
            <>
              <UploadCloud size={18} />
              Upload CSV
            </>
          )}
        </button>

      </div>
    </div>
  );
};

export default BulkUpload;