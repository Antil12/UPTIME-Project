import { useState, useEffect, useRef } from "react";
import { Download, FileText, FileSpreadsheet, File } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";

const API_URL = import.meta.env.VITE_API_URL;

const ExportButtons = ({
  urls = [],
  range,
  customFrom,
  customTo,
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  // ================= FETCH LOGS =================
  const fetchAllLogs = async () => {
    try {
      const token = localStorage.getItem("loginToken");
      if (!token || !urls.length) return {};

      const siteIds = urls.map((s) => s._id).join(",");

      const res = await axios.get(`${API_URL}/uptime-logs`, {
        params: {
          siteIds,
          range,
          from: customFrom,
          to: customTo,
          limit: 100000,
        },
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const grouped = {};
      res.data?.data?.forEach((log) => {
        const key = log.siteId?.toString();
        if (!grouped[key]) grouped[key] = [];
        grouped[key].push(log);
      });

      return grouped;
    } catch (err) {
      console.error("Export fetch failed:", err);
      return {};
    }
  };

  // ================= BUILD ROWS =================
  const buildRows = (urls, logsBySite) => {
    return urls.map((site) => {
      const logs = logsBySite[site._id] || [];

      const total = logs.length;
      const up = logs.filter((l) => l.status === "UP").length;
      const down = logs.filter((l) => l.status === "DOWN").length;

      const times = logs
        .map((l) => l.responseTimeMs ?? l.responseTime)
        .filter((t) => typeof t === "number" && t > 0);

      const avg = times.length
        ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
        : 0;

      const min = times.length ? Math.min(...times) : 0;
      const max = times.length ? Math.max(...times) : 0;

      const lastLog = logs[logs.length - 1];

      return {
        Domain: site.domain || "",
        URL: site.url || "",
        Email: Array.isArray(site.emailContact)
          ? site.emailContact.join(", ")
          : site.emailContact || "",
        "Total Checks": total,
        Up: up,
        Down: down,
        "Uptime (%)": total ? ((up / total) * 100).toFixed(2) : "0.00",
        "Avg Response (ms)": avg,
        "Min Response (ms)": min,
        "Max Response (ms)": max,
        "Last Checked": lastLog
          ? new Date(lastLog.timestamp).toLocaleString()
          : "",
      };
    });
  };

  // ================= CSV =================
  const exportCSV = async () => {
    setLoading(true);
    const logs = await fetchAllLogs();
    const rows = buildRows(urls, logs);

    const headers = Object.keys(rows[0]);

    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        headers.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `uptime-report-${Date.now()}.csv`;
    link.click();

    setLoading(false);
  };

  // ================= EXCEL =================
  const exportExcel = async () => {
    setLoading(true);
    const logs = await fetchAllLogs();
    const rows = buildRows(urls, logs);

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(wb, ws, "Report");
    XLSX.writeFile(wb, `uptime-report-${Date.now()}.xlsx`);

    setLoading(false);
  };

  // ================= PDF (🔥 FIXED WITHOUT BREAKING) =================
  const exportPDF = async () => {
    setLoading(true);
    const logs = await fetchAllLogs();
    const rows = buildRows(urls, logs);

    const chunkSize = 25; // ✅ prevents cut-off
    const pdf = new jsPDF("landscape", "pt", "a4");

    for (let i = 0; i < rows.length; i += chunkSize) {
      const chunk = rows.slice(i, i + chunkSize);

      const container = document.createElement("div");

      Object.assign(container.style, {
        width: "1400px",
        padding: "20px",
        background: "#fff",
        color: "#000",
        fontFamily: "Arial",
      });

      const title = document.createElement("h3");
      title.innerText = `Uptime Report (${i + 1}-${i + chunk.length} of ${rows.length})`;
      container.appendChild(title);

      const table = document.createElement("table");
      table.style.width = "100%";
      table.style.borderCollapse = "collapse";

      const headers = Object.keys(chunk[0]);

      const trHead = document.createElement("tr");
      headers.forEach((h) => {
        const th = document.createElement("th");
        th.innerText = h;
        th.style.border = "1px solid #ccc";
        th.style.padding = "6px";
        th.style.background = "#f3f4f6";
        trHead.appendChild(th);
      });

      table.appendChild(trHead);

      chunk.forEach((row) => {
        const tr = document.createElement("tr");
        headers.forEach((h) => {
          const td = document.createElement("td");
          td.innerText = row[h];
          td.style.border = "1px solid #eee";
          td.style.padding = "6px";
          tr.appendChild(td);
        });
        table.appendChild(tr);
      });

      container.appendChild(table);
      document.body.appendChild(container);

      const canvas = await html2canvas(container, { scale: 2 });
      const imgData = canvas.toDataURL("image/png");

      const width = pdf.internal.pageSize.getWidth();
      const height = (canvas.height * width) / canvas.width;

      if (i !== 0) pdf.addPage();
      pdf.addImage(imgData, "PNG", 0, 0, width, height);

      container.remove();
    }

    pdf.save(`uptime-report-${Date.now()}.pdf`);
    setLoading(false);
  };

  // ================= CLICK OUTSIDE =================
  useEffect(() => {
    const handler = (e) => {
      if (!wrapperRef.current?.contains(e.target)) setOpen(false);
    };
    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  return (
    <div ref={wrapperRef} className="relative inline-block">
      {/* BUTTON */}
      <button
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 rounded-lg shadow transition bg-green-700 hover:bg-green-600 text-white"
      >
        <Download size={16} />
        {loading ? "Exporting..." : "Export"}
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="absolute right-0 mt-2 w-52 rounded-lg shadow-lg border z-50 bg-gray-900 text-white border-gray-700"
        >
          <button onClick={exportCSV} className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <File size={16} /> CSV
          </button>

          <button onClick={exportExcel} className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <FileSpreadsheet size={16} /> Excel
          </button>

          <button onClick={exportPDF} className="flex items-center gap-2 px-4 py-2 w-full hover:bg-gray-100 dark:hover:bg-gray-800">
            <FileText size={16} /> PDF
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButtons;