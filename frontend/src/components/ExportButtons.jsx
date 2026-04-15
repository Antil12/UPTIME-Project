import { useState, useEffect, useRef } from "react";
import { Download, FileText, FileSpreadsheet, File } from "lucide-react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";
import axios from "axios";
import { motion, AnimatePresence } from "framer-motion";

const API_URL = import.meta.env.VITE_API_URL;

const mono = {
  fontFamily: "'JetBrains Mono', monospace",
  letterSpacing: "0.08em",
};

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
      if (range === "custom") {
        if (!customFrom || !customTo) {
          throw new Error("Please select both dates for custom range");
        }
        const fromDate = new Date(customFrom);
        const toDate = new Date(customTo);
        if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
          throw new Error("Invalid date format");
        }
        if (fromDate > toDate) {
          throw new Error("'From' date cannot be after 'To' date");
        }
      }

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

  // ================= PDF =================
// ================= PDF (🔥 PREMIUM TEMPLATE) =================
const exportPDF = async () => {
  setLoading(true);
  const logs = await fetchAllLogs();
  const rows = buildRows(urls, logs);

  const chunkSize = 20; // better spacing
  const pdf = new jsPDF("landscape", "pt", "a4");

  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);

    const container = document.createElement("div");

    Object.assign(container.style, {
      width: "1400px",
      padding: "28px",
      background: "#ffffff",
      color: "#0f172a",
      fontFamily: "Arial, sans-serif",
    });

    // ===== HEADER =====
    const header = document.createElement("div");
    header.style.marginBottom = "18px";

    const title = document.createElement("div");
    title.innerText = "UPTIME ANALYTICS REPORT";
    Object.assign(title.style, {
      fontSize: "18px",
      fontWeight: "700",
      letterSpacing: "1px",
      marginBottom: "6px",
    });

    const meta = document.createElement("div");
    meta.innerText = `Generated: ${new Date().toLocaleString()} | Records ${
      i + 1
    } - ${i + chunk.length} of ${rows.length}`;
    Object.assign(meta.style, {
      fontSize: "11px",
      color: "#64748b",
    });

    header.appendChild(title);
    header.appendChild(meta);

    // ===== DIVIDER =====
    const divider = document.createElement("div");
    Object.assign(divider.style, {
      height: "1px",
      background: "#e2e8f0",
      margin: "12px 0 18px 0",
    });

    // ===== TABLE =====
    const table = document.createElement("table");
    table.style.width = "100%";
    table.style.borderCollapse = "collapse";
    table.style.fontSize = "10px";

    const headers = Object.keys(chunk[0]);

    // Header Row
    const trHead = document.createElement("tr");

    headers.forEach((h) => {
      const th = document.createElement("th");
      th.innerText = h;

      Object.assign(th.style, {
        textAlign: "left",
        padding: "8px",
        background: "#f1f5f9",
        color: "#0f172a",
        borderBottom: "1px solid #cbd5f5",
        fontWeight: "600",
      });

      trHead.appendChild(th);
    });

    table.appendChild(trHead);

    // Data Rows
    chunk.forEach((row, idx) => {
      const tr = document.createElement("tr");

      headers.forEach((h) => {
        const td = document.createElement("td");
        td.innerText = row[h];

        Object.assign(td.style, {
          padding: "7px",
          borderBottom: "1px solid #e5e7eb",
          background: idx % 2 === 0 ? "#ffffff" : "#f8fafc",
        });

        tr.appendChild(td);
      });

      table.appendChild(tr);
    });

    // ===== FOOTER =====
    const footer = document.createElement("div");
    footer.innerText = "Generated by Uptime Monitoring System";
    Object.assign(footer.style, {
      marginTop: "18px",
      fontSize: "10px",
      color: "#94a3b8",
      textAlign: "right",
    });

    // ===== APPEND =====
    container.appendChild(header);
    container.appendChild(divider);
    container.appendChild(table);
    container.appendChild(footer);

    document.body.appendChild(container);

    const canvas = await html2canvas(container, {
      scale: 2,
      useCORS: true,
    });

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
      {/* PREMIUM BUTTON */}
      <motion.button
        whileHover={{ scale: 1.04 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(!open)}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2.5 rounded-lg"
        style={{
          ...mono,
          fontSize: "11px",
          textTransform: "uppercase",
          color: "#38bdf8",
          background: "rgba(56,189,248,0.08)",
          border: "1px solid rgba(56,189,248,0.2)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Download size={14} />
        {loading ? "Exporting..." : "Export"}
      </motion.button>

      {/* DROPDOWN */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 6, scale: 0.96 }}
            className="absolute right-0 mt-2 w-52 rounded-xl overflow-hidden z-50"
            style={{
              background: "rgba(3,7,18,0.95)",
              border: "1px solid rgba(56,189,248,0.12)",
              backdropFilter: "blur(20px)",
              boxShadow: "0 10px 40px rgba(0,0,0,0.6)",
            }}
          >
            {/* Top glow line */}
            <div className="h-[1px]" style={{
              background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.4), transparent)"
            }} />

            {[
              { label: "CSV", icon: File, action: exportCSV },
              { label: "Excel", icon: FileSpreadsheet, action: exportExcel },
              { label: "PDF", icon: FileText, action: exportPDF },
            ].map((item, i) => (
              <motion.button
                key={item.label}
                onClick={item.action}
                whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
                className="flex items-center justify-between w-full px-4 py-2.5"
                style={{
                  ...mono,
                  fontSize: "10px",
                  color: "rgba(226,232,240,0.8)",
                  borderBottom:
                    i !== 2 ? "1px solid rgba(56,189,248,0.05)" : "none",
                }}
              >
                <span className="flex items-center gap-2">
                  <item.icon size={13} className="text-sky-400" />
                  {item.label}
                </span>

                <span style={{ fontSize: "9px", color: "rgba(148,163,184,0.4)" }}>
                  →
                </span>
              </motion.button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default ExportButtons;