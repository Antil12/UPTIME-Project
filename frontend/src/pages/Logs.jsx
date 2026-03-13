import { useEffect, useState } from "react";
import axios from "axios";
import { Globe } from "lucide-react";

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
const [rowsPerPage, setRowsPerPage] = useState(10);

  useEffect(() => {
    fetchLogs();
  }, []);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem("loginToken");

      const res = await axios.get(
        "http://localhost:5000/api/monitoredsite/logs",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setLogs(res.data.data || []);
    } catch (error) {
      console.error("Failed to load logs:", error);
    } finally {
      setLoading(false);
    }
  };
  const indexOfLastRow = currentPage * rowsPerPage;
const indexOfFirstRow = indexOfLastRow - rowsPerPage;
const currentLogs = logs.slice(indexOfFirstRow, indexOfLastRow);

const totalPages = Math.ceil(logs.length / rowsPerPage);

  return (
    <div className="max-w-7xl mx-auto p-6">

      {/* HEADER */}
      <div className="flex justify-between items-center mb-6">

        <div>
          <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
            Website Logs
          </h1>

          <p className="text-sm text-gray-500 dark:text-gray-400">
            Activity history of monitored websites
          </p>
        </div>

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {logs.length}
        </div>

      </div>


      {/* CARD */}
      <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-sm overflow-hidden">

        {loading ? (
          <div className="p-10 text-center text-gray-500">
            Loading logs...
          </div>
        ) : logs.length === 0 ? (
          <div className="p-10 flex flex-col items-center gap-3 text-gray-500">
            <Globe size={32} />
            <p>No logs found</p>
          </div>
        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              {/* TABLE HEADER */}
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                <tr>
                  <th className="px-5 py-3 text-left">S No.</th>
                  <th className="px-5 py-3 text-left">Domain</th>
                  <th className="px-5 py-3 text-left">URL</th>
                  <th className="px-5 py-3 text-left">Action</th>
                  <th className="px-5 py-3 text-left">Action By</th>
                  <th className="px-5 py-3 text-left">Timestamp</th>
                </tr>
              </thead>

            
              {/* TABLE BODY */}
              <tbody>

                {currentLogs.map((log, index) => (

                  <tr
                    key={index}
                    className="border-t border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition"
                  >

                    <td className="px-5 py-4 text-gray-600 dark:text-gray-300">
                      {index + 1}
                    </td>

                    <td className="px-5 py-4 font-medium text-gray-800 dark:text-gray-200">
                      {log.domain}
                    </td>

                    <td className="px-5 py-4">
                      <a
                        href={log.url}
                        target="_blank"
                        rel="noreferrer"
                        className="text-blue-600 dark:text-blue-400 hover:underline truncate block max-w-xs"
                      >
                        {log.url}
                      </a>
                    </td>
                    

                    
                    {/* ACTION */}
                    <td className="px-5 py-4">

                      <span
                        className={`px-2 py-1 text-xs rounded-md font-medium
                        ${
                          log.action === "Created"
                            ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                            : log.action === "Updated"
                            ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
                            : "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                        }`}
                      >
                        {log.action}
                      </span>

                    </td>

                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {log.user}
                    </td>

                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                      {log.timestamp
                        ? new Date(log.timestamp).toLocaleString()
                        : "—"}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>
           <div className="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">

  {/* PAGE SIZE */}
  <div className="flex items-center gap-2 text-sm">
    <span className="text-gray-500 dark:text-gray-400">Rows:</span>

    <select
      value={rowsPerPage}
      onChange={(e) => {
        setRowsPerPage(Number(e.target.value));
        setCurrentPage(1);
      }}
      className="border rounded px-2 py-1 text-sm dark:bg-gray-800"
    >
      <option value={10}>10</option>
      <option value={20}>20</option>
      <option value={50}>50</option>
      <option value={100}>100</option>
    </select>
  </div>

  {/* PAGE NAVIGATION */}
  <div className="flex items-center gap-2">

    <button
      disabled={currentPage === 1}
      onClick={() => setCurrentPage((prev) => prev - 1)}
      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
    >
      Prev
    </button>

    <span className="text-sm text-gray-600 dark:text-gray-300">
      Page {currentPage} of {totalPages}
    </span>

    <button
      disabled={currentPage === totalPages}
      onClick={() => setCurrentPage((prev) => prev + 1)}
      className="px-3 py-1 text-sm border rounded disabled:opacity-50"
    >
      Next
    </button>

  </div>

</div>
          </div>
          

        )}

      </div>

    </div>
  );
};

export default Logs;