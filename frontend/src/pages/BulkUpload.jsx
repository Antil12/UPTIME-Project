import { useState } from "react";
import axios from "axios";
import {
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { motion } from "framer-motion";

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

      await axios.post(`${API}/monitoredsite/bulk-import`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("loginToken")}`,
        },
      });

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
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-6xl grid md:grid-cols-2 gap-6"
      >
        {/* ================= LEFT: UPLOAD ================= */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-8 shadow-xl">
          
          {/* HEADER */}
          <div className="mb-6 text-center">
            <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
              Bulk Upload Sites
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Upload your CSV file to import multiple sites instantly
            </p>
          </div>

          {/* DROP ZONE */}
          <label className="group relative flex flex-col items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-2xl p-10 cursor-pointer hover:border-blue-500 transition overflow-hidden">

            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 bg-gradient-to-r from-blue-500/10 to-purple-500/10 transition" />

            <UploadCloud
              size={40}
              className="text-gray-400 group-hover:text-blue-500 transition mb-3"
            />

            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Click to select CSV file
            </p>

            <p className="text-xs text-gray-400 mt-1">
              Max size: 2MB • CSV only
            </p>

            <input
              type="file"
              accept=".csv"
              className="hidden"
              onChange={handleFileChange}
            />
          </label>

          {/* FILE PREVIEW */}
          {file && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-5 flex items-center justify-between bg-gray-100 dark:bg-gray-800 px-4 py-3 rounded-xl"
            >
              <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <FileText size={18} />
                {file.name}
              </div>

              <button
                onClick={() => setFile(null)}
                className="text-xs text-red-500 hover:underline"
              >
                Remove
              </button>
            </motion.div>
          )}

          {/* MESSAGE */}
          {message && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`mt-5 flex items-center gap-2 px-4 py-3 rounded-xl text-sm ${
                message.type === "error"
                  ? "bg-red-50 text-red-600 dark:bg-red-900/20"
                  : "bg-green-50 text-green-600 dark:bg-green-900/20"
              }`}
            >
              {message.type === "error" ? (
                <AlertCircle size={16} />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {message.text}
            </motion.div>
          )}

          {/* BUTTON */}
          <button
            onClick={uploadCsv}
            disabled={loading}
            className="mt-6 w-full flex items-center justify-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:opacity-90 text-white py-3 rounded-xl font-medium transition disabled:opacity-60 shadow-lg"
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

        {/* ================= RIGHT: INSTRUCTIONS ================= */}
        <div className="bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl border border-gray-200 dark:border-gray-700 rounded-2xl p-6 shadow-xl h-fit sticky top-6">

          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">
            CSV Upload Guide
          </h3>

          {/* HEADERS */}
          <div className="mb-5">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Required CSV Headers
            </p>

            <div className="mt-2 bg-gray-100 dark:bg-gray-800 rounded-lg p-3 text-xs font-mono">
              domain, url, category, priority
            </div>

            <p className="text-xs text-gray-500 mt-2">
              Headers must match exactly. 
            </p>
          </div>

          {/* REQUIRED */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Required Field
            </p>

            <ul className="text-xs text-gray-500 mt-1 list-disc ml-4 space-y-1">
               <li><b>domain</b></li>
              <li>
                <b>url</b> → must start with http:// or https://
              </li>
            </ul>
          </div>

          {/* OPTIONAL */}
          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Optional Fields
            </p>

            <ul className="text-xs text-gray-500 mt-1 list-disc ml-4 space-y-1">
             
              <li><b>category</b> (default: UNCATEGORIZED)</li>
              <li><b>priority</b> (default: 0)</li>
            </ul>
          </div>

          
          {/* NOTES */}
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
              Notes
            </p>

            <ul className="text-xs text-gray-500 mt-1 list-disc ml-4 space-y-1">
              <li>Invalid URLs will be skipped</li>
              <li>Empty rows are ignored</li>
              <li>Only CSV files are allowed</li>
            </ul>
          </div>
        </div>

      </motion.div>
    </div>
  );
};

export default BulkUpload;