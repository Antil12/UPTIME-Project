import React, { useRef, useState, useEffect } from "react";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";


const ReportPage = () => {
  const reportRef = useRef();

  return (
    <>
      <div ref={reportRef}>
        {/* EVERYTHING that shows in your analytics page */}
        {/* Charts */}
        {/* Cards */}
        {/* Tables */}
        {/* Metrics */}
      </div>

      <ExportButtons reportRef={reportRef} />
    </>
  );
};

const buildRows = (urls, logsBySite) => {
  const rows = [];

  urls.forEach((site) => {
    const logs = logsBySite[site._id] || [];
    const total = logs.length;
    const up = logs.filter((l) => l.status === "UP").length;
    const down = logs.filter((l) => l.status === "DOWN").length;

    const times = logs
      .map((l) => l.responseTimeMs ?? l.responseTime)
      .filter((t) => typeof t === "number" && !isNaN(t) && t > 0);

    const avg = times.length ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    const min = times.length ? Math.min(...times) : 0;
    const max = times.length ? Math.max(...times) : 0;

    const lastLog = logs.slice(-1)[0];

    rows.push({
      Domain: site.domain || "",
      URL: site.url || "",
      Email: Array.isArray(site.emailContact) ? site.emailContact.join(", ") : site.emailContact || "",
      "Total Checks": total,
      Up: up,
      Down: down,
      "Uptime (%)": total ? ((up / total) * 100).toFixed(2) : "0.00",
      "Avg Response (ms)": avg,
      "Min Response (ms)": min,
      "Max Response (ms)": max,
      "Last Checked": lastLog ? new Date(lastLog.timestamp).toLocaleString() : "",
    });
  });

  return rows;
};

const ExportButtons = ({ urls = [], logsBySite = {}, theme = "light" }) => {
  const hiddenRef = useRef();

  const onExportCSV = () => {
    const rows = buildRows(urls, logsBySite);
    if (!rows.length) return;

    const header = Object.keys(rows[0]);
    const csv = [header.join(","), ...rows.map((r) => header.map((h) => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");

    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `uptime-report-${Date.now()}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const onExportExcel = () => {
    const rows = buildRows(urls, logsBySite);
    if (!rows.length) return;

    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Report");
    const wbout = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([wbout], { type: "application/octet-stream" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `uptime-report-${Date.now()}.xlsx`;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const onExportPDF = async () => {
  const rows = buildRows(urls, logsBySite);
  if (!rows.length) return;

  // Create temporary container
  const container = document.createElement("div");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";
  container.style.width = "1400px";
  container.style.padding = "30px";
  container.style.background = "#ffffff";
  container.style.color = "#000000";
  container.style.fontFamily = "Arial, Helvetica, sans-serif";

  // ===== Title =====
  const title = document.createElement("h2");
  title.innerText = `UPTIME Report — ${rows.length} Sites`;
  title.style.marginBottom = "20px";
  container.appendChild(title);

  // ===== Chart Section =====
  const chartTitle = document.createElement("h3");
  chartTitle.innerText = "Average Response Time (ms)";
  chartTitle.style.margin = "10px 0";
  container.appendChild(chartTitle);

  const canvasChart = document.createElement("canvas");
  canvasChart.width = 1200;
  canvasChart.height = 300;
  container.appendChild(canvasChart);

  const ctx = canvasChart.getContext("2d");

  // Prepare chart data
  const labels = rows.map(r => r.Domain);
  const values = rows.map(r => Number(r["Avg Response (ms)"]));

  // Simple bar chart (manual draw for lightweight)
  const maxValue = Math.max(...values, 100);
  const barWidth = 50;
  const gap = 40;

  values.forEach((val, i) => {
    const barHeight = (val / maxValue) * 200;
    const x = 80 + i * (barWidth + gap);
    const y = 250 - barHeight;

    ctx.fillStyle = "#6366f1";
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = "#000";
    ctx.font = "12px Arial";
    ctx.fillText(labels[i], x, 270);
    ctx.fillText(val + "ms", x, y - 5);
  });

  // ===== Table Section =====
  const tableTitle = document.createElement("h3");
  tableTitle.innerText = "Detailed Report";
  tableTitle.style.margin = "30px 0 10px 0";
  container.appendChild(tableTitle);

  const table = document.createElement("table");
  table.style.borderCollapse = "collapse";
  table.style.width = "100%";
  table.style.background = "#ffffff";

  const headerRow = document.createElement("tr");
  const headerKeys = Object.keys(rows[0]);

  headerKeys.forEach((h) => {
    const th = document.createElement("th");
    th.innerText = h;
    th.style.border = "1px solid #d1d5db";
    th.style.padding = "8px";
    th.style.fontSize = "12px";
    th.style.textAlign = "left";
    th.style.background = "#f3f4f6";
    headerRow.appendChild(th);
  });

  table.appendChild(headerRow);

  rows.forEach((r) => {
    const tr = document.createElement("tr");
    headerKeys.forEach((h) => {
      const td = document.createElement("td");
      td.innerText = r[h];
      td.style.border = "1px solid #e5e7eb";
      td.style.padding = "6px";
      td.style.fontSize = "11px";
      tr.appendChild(td);
    });
    table.appendChild(tr);
  });

  container.appendChild(table);
  document.body.appendChild(container);

  try {
    const canvas = await html2canvas(container, {
      scale: 2,
      backgroundColor: "#ffffff"
    });

    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF({
      orientation: "landscape",
      unit: "pt",
      format: "a4"
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`uptime-report-${Date.now()}.pdf`);
  } catch (err) {
    console.error("PDF export failed:", err);
  } finally {
    container.remove();
  }
};
  const [open, setOpen] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const onDocClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("click", onDocClick);
    return () => document.removeEventListener("click", onDocClick);
  }, []);

  const isDark = theme === "dark";

  return (
    <div className="relative" ref={wrapperRef}>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        aria-expanded={open}
        className={`inline-flex items-center gap-3 px-4 py-2 rounded-full text-sm font-semibold shadow-lg transition transform hover:-translate-y-0.5 focus:outline-none ${
          isDark
            ? "bg-gradient-to-r from-indigo-700 to-purple-700 text-white"
            : "bg-gradient-to-r from-indigo-500 to-purple-500 text-white"
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path d="M3 3a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V3z" />
          <path d="M3 8a1 1 0 011-1h12a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1V8z" />
        </svg>
        <span>Export</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div
          className={`absolute right-0 mt-3 w-56 z-50 rounded-lg shadow-xl overflow-hidden border ${
            isDark ? "bg-gray-800 border-gray-700" : "bg-white border-gray-200"
          }`}>
          <button
            onClick={() => {
              onExportCSV();
              setOpen(false);
            }}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 ${isDark ? "hover:bg-gray-700" : "hover:bg-gray-50"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21H5a2 2 0 01-2-2V7a2 2 0 012-2h5l2 2h5a2 2 0 012 2v12a2 2 0 01-2 2z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 7v6M13 7v6M9 7v6" />
            </svg>
            <div>
              <div className="font-medium">Export CSV</div>
              <div className="text-xs opacity-70">Comma separated values</div>
            </div>
          </button>

          <button
            onClick={() => {
              onExportExcel();
              setOpen(false);
            }}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 border-t ${isDark ? "border-gray-700 hover:bg-gray-700" : "border-gray-100 hover:bg-gray-50"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-green-700" viewBox="0 0 24 24" fill="currentColor">
              <path d="M19 3H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2V5a2 2 0 00-2-2z" />
            </svg>
            <div>
              <div className="font-medium">Export Excel</div>
              <div className="text-xs opacity-70">Download .xlsx file</div>
            </div>
          </button>

          <button
            onClick={() => {
              onExportPDF();
              setOpen(false);
            }}
            className={`w-full text-left px-4 py-3 flex items-center gap-3 border-t ${isDark ? "border-gray-700 hover:bg-gray-700" : "border-gray-100 hover:bg-gray-50"}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-red-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 2v20M5 12h14" />
            </svg>
            <div>
              <div className="font-medium">Export PDF</div>
              <div className="text-xs opacity-70">Save printable report</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );
};

export default ExportButtons;
