import { useEffect, useState } from "react";
import axios from "axios";
import { Globe, Trash2 } from "lucide-react";

const Logs = () => {
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="max-w-7xl mx-auto p-6">

      {/* HEADER
      <div className="flex items-center justify-between mb-6">

        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
            <Trash2 size={18} className="text-red-600 dark:text-red-400"/>
          </div> */}

          <div>
            <h1 className="text-xl font-semibold text-gray-800 dark:text-white">
               Website Logs
            </h1>

            <p className="text-sm text-gray-500 dark:text-gray-400">
              Websites removed from monitoring system
            </p>
          </div>
       

        <div className="text-sm text-gray-500 dark:text-gray-400">
          Total: {logs.length}
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

            <p>No deleted websites found</p>

          </div>
        ) : (

          <div className="overflow-x-auto">

            <table className="w-full text-sm">

              {/* TABLE HEADER */}
              <thead className="bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300">

                <tr>
                  <th className="px-5 py-3 text-left font-medium">S No.</th>
                  <th className="px-5 py-3 text-left font-medium">Domain</th>
                  <th className="px-5 py-3 text-left font-medium">URL</th>
                  <th className="px-5 py-3 text-left font-medium">SSL</th>
                  <th className="px-5 py-3 text-left font-medium">User</th>
                  <th className="px-5 py-3 text-left font-medium">Email Contact</th>
                </tr>

              </thead>


              {/* TABLE BODY */}
              <tbody>

                {logs.map((log, index) => (

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

                    <td className="px-5 py-4">

                      <span className="px-2 py-1 text-xs rounded-md bg-gray-200 text-gray-800 dark:bg-gray-700 dark:text-gray-200">

                        {log.sslStatus || "UNKNOWN"}

                      </span>

                    </td>

                    <td className="px-5 py-4 text-gray-700 dark:text-gray-300">
                      {log.deletedBy}
                    </td>

                    <td className="px-5 py-4 text-gray-500 dark:text-gray-400">
                      {log.emailContact?.join(", ") || "—"}
                    </td>

                  </tr>

                ))}

              </tbody>

            </table>

          </div>

        )}

      </div>

    </div>
  );
};

export default Logs;

