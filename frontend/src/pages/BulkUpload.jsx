import { useState, useRef, useEffect } from "react";
import axios from "axios";
import {
  UploadCloud,
  FileText,
  Loader2,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Database,
  FileSpreadsheet,
  X,
  Sparkles,
  Info,
  ScanLine,
} from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";

// ─────────────────────────────────────────────────────────────────────────────
// FONT LOADER
// ─────────────────────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    if (document.getElementById("uptime-fonts")) return;
    const link = document.createElement("link");
    link.id = "uptime-fonts";
    link.href =
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;800;900&family=JetBrains+Mono:wght@300;400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return null;
};

// ─────────────────────────────────────────────────────────────────────────────
// CURSOR GLOW
// ─────────────────────────────────────────────────────────────────────────────
const CursorGlow = () => {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 90, damping: 24 });
  const sy = useSpring(y, { stiffness: 90, damping: 24 });

  useEffect(() => {
    const fn = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        left: sx,
        top: sy,
        translateX: "-50%",
        translateY: "-50%",
        width: 320,
        height: 320,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(56,189,248,0.045) 0%, transparent 72%)",
      }}
    />
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// BACKGROUND
// ─────────────────────────────────────────────────────────────────────────────
const Background = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: "#030712",
      }}
    />

    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 60% 40% at 50% 20%, rgba(56,189,248,0.045) 0%, transparent 100%)",
      }}
    />

    <div
      className="absolute"
      style={{
        top: "62%",
        left: "16%",
        width: 320,
        height: 320,
        background:
          "radial-gradient(circle, rgba(129,140,248,0.035) 0%, transparent 68%)",
        filter: "blur(90px)",
      }}
    />

    <div
      className="absolute"
      style={{
        top: "18%",
        right: "12%",
        width: 260,
        height: 260,
        background:
          "radial-gradient(circle, rgba(16,185,129,0.025) 0%, transparent 68%)",
        filter: "blur(80px)",
      }}
    />

    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px)",
        backgroundSize: "42px 42px",
      }}
    />

    <motion.div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(to bottom, transparent 48%, rgba(56,189,248,0.012) 50%, transparent 52%)",
      }}
      animate={{ y: ["-100%", "100%"] }}
      transition={{
        duration: 6,
        repeat: Infinity,
        ease: "linear",
        repeatDelay: 2.5,
      }}
    />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// HUD CORNERS
// ─────────────────────────────────────────────────────────────────────────────
const HUDCorner = ({ pos, delay = 0 }) => {
  const cls = {
    tl: "top-4 left-4",
    tr: "top-4 right-4",
    bl: "bottom-4 left-4",
    br: "bottom-4 right-4",
  };

  const rot = {
    tl: "0deg",
    tr: "90deg",
    bl: "-90deg",
    br: "180deg",
  };

  return (
    <motion.div
      className={`fixed ${cls[pos]} w-7 h-7 z-20 pointer-events-none`}
      style={{ transform: `rotate(${rot[pos]})` }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 0.8, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div
        className="absolute top-0 left-0 h-[1.5px] bg-sky-400/80"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }}
      />
      <motion.div
        className="absolute top-0 left-0 w-[1.5px] bg-sky-400/80"
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }}
      />
    </motion.div>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// ORBIT RING
// ─────────────────────────────────────────────────────────────────────────────
const OrbitRing = ({ radius, duration, dotCount, color, delay = 0, tilt = 70 }) => (
  <motion.div
    className="fixed pointer-events-none z-[1]"
    style={{
      width: radius * 2,
      height: radius * 2,
      top: "50%",
      left: "50%",
      marginTop: -radius,
      marginLeft: -radius,
      transform: `perspective(900px) rotateX(${tilt}deg)`,
      opacity: 0.4,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <div
      className="absolute inset-0 rounded-full"
      style={{ border: `1px solid ${color}14` }}
    />
    {Array.from({ length: dotCount }, (_, i) => {
      const angle = (i / dotCount) * 2 * Math.PI;
      const cx = Math.cos(angle) * radius + radius;
      const cy = Math.sin(angle) * radius + radius;

      return (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: i === 0 ? 4 : 2,
            height: i === 0 ? 4 : 2,
            background: i === 0 ? color : `${color}40`,
            left: cx - (i === 0 ? 2 : 1),
            top: cy - (i === 0 ? 2 : 1),
            boxShadow: i === 0 ? `0 0 8px ${color}` : "none",
          }}
          animate={i === 0 ? { opacity: [1, 0.35, 1] } : {}}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      );
    })}
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// STATUS DOT
// ─────────────────────────────────────────────────────────────────────────────
const StatusDot = ({ color = "#34d399", label }) => (
  <div className="flex items-center gap-2">
    <div className="relative w-2 h-2">
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: color }}
        animate={{ scale: [1, 2], opacity: [0.45, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
    </div>
    {label && (
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.16em",
          color: `${color}88`,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    )}
  </div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MINI STAT CARD
// ─────────────────────────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value, sub }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="rounded-2xl p-4"
    style={{
      background: "rgba(3,7,18,0.68)",
      border: "1px solid rgba(56,189,248,0.08)",
      backdropFilter: "blur(16px)",
      boxShadow: "0 0 18px rgba(56,189,248,0.025)",
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center border"
        style={{
          borderColor: "rgba(56,189,248,0.1)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <Icon size={16} className="text-sky-400" />
      </div>

      <StatusDot color="#34d399" />
    </div>

    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        color: "rgba(148,163,184,0.52)",
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>

    <div
      className="mt-2 text-white text-lg sm:text-xl break-words"
      style={{
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: 700,
        letterSpacing: "0.04em",
      }}
    >
      {value}
    </div>

    {sub && (
      <div
        className="mt-2"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10px",
          color: "rgba(148,163,184,0.5)",
        }}
      >
        {sub}
      </div>
    )}
  </motion.div>
);

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────
const BulkUpload = () => {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const inputRef = useRef(null);

  const handleFileChange = (e) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (!selected.name.toLowerCase().endsWith(".csv")) {
      setMessage({ type: "error", text: "Only CSV files are allowed" });
      setFile(null);
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
      if (inputRef.current) inputRef.current.value = "";
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
    <>
      <FontLoader />

      <div
        className="relative min-h-screen w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6 text-white"
        style={{ background: "transparent" }}
      >
        <Background />
        <CursorGlow />

        <OrbitRing radius={220} duration={20} dotCount={8} color="#38bdf8" tilt={72} />
        <OrbitRing radius={290} duration={30} dotCount={10} color="#818cf8" tilt={68} delay={1} />

        {["tl", "tr", "bl", "br"].map((p, i) => (
          <HUDCorner key={p} pos={p} delay={0.1 + i * 0.05} />
        ))}

        <div className="relative z-10 w-full max-w-7xl mx-auto">
          {/* HEADER */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
          >
            <div>
              <div className="flex items-center gap-3 mb-3">
                <div className="h-[1px] w-8 bg-sky-400/20" />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "0.28em",
                    color: "rgba(56,189,248,0.42)",
                    textTransform: "uppercase",
                  }}
                >
                  Import Pipeline
                </span>
                <div className="h-[1px] w-16 sm:w-24 bg-sky-400/10" />
              </div>

              <h1
                className="text-2xl sm:text-3xl lg:text-4xl mb-2"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  textShadow: "0 0 24px rgba(56,189,248,0.08)",
                }}
              >
                BULK SITE UPLOAD
              </h1>

              <p
                className="max-w-2xl"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "rgba(148,163,184,0.52)",
                  letterSpacing: "0.03em",
                }}
              >
                Import monitored websites in bulk using a structured CSV file for
                faster deployment and centralized onboarding.
              </p>
            </div>

            <StatusDot
              color={loading ? "#f59e0b" : "#34d399"}
              label={loading ? "Upload Running" : "Import Ready"}
            />
          </motion.div>

         

         

          {/* MAIN GRID */}
          <div className="grid xl:grid-cols-[1.35fr_0.95fr] gap-6">
            {/* LEFT PANEL */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="relative overflow-hidden rounded-3xl p-5 sm:p-6"
              style={{
                background: "rgba(3,7,18,0.72)",
                border: "1px solid rgba(56,189,248,0.09)",
                backdropFilter: "blur(18px)",
                boxShadow:
                  "0 0 22px rgba(56,189,248,0.03), inset 0 1px 0 rgba(56,189,248,0.035)",
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.32) 30%, rgba(129,140,248,0.28) 70%, transparent 100%)",
                }}
              />

              {/* SECTION HEAD */}
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-[1px] w-8 bg-sky-400/20" />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      letterSpacing: "0.24em",
                      color: "rgba(56,189,248,0.46)",
                      textTransform: "uppercase",
                    }}
                  >
                    Upload Module
                  </span>
                </div>

                <h2
                  className="text-white text-xl sm:text-2xl"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  IMPORT CSV FILE
                </h2>

                <p
                  className="mt-2"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: "rgba(148,163,184,0.56)",
                  }}
                >
                  Select a valid CSV file and upload your monitored site entries securely.
                </p>
              </div>

              {/* DROP ZONE */}
              <motion.label
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.998 }}
                className="group relative flex flex-col items-center justify-center rounded-3xl p-8 sm:p-10 cursor-pointer overflow-hidden min-h-[280px]"
                style={{
                  background: "rgba(255,255,255,0.02)",
                  border: "1px dashed rgba(56,189,248,0.18)",
                  backdropFilter: "blur(12px)",
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500"
                  style={{
                    background:
                      "radial-gradient(circle at center, rgba(56,189,248,0.05), transparent 60%)",
                  }}
                />

                <motion.div
                  animate={{ y: [0, -6, 0] }}
                  transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
                  className="relative z-10 mb-5"
                >
                  <div
                    className="w-20 h-20 rounded-3xl flex items-center justify-center"
                    style={{
                      background:
                        "linear-gradient(135deg, rgba(56,189,248,0.12) 0%, rgba(129,140,248,0.08) 100%)",
                      border: "1px solid rgba(56,189,248,0.14)",
                      boxShadow: "0 0 24px rgba(56,189,248,0.06)",
                    }}
                  >
                    <UploadCloud size={34} className="text-sky-300" />
                  </div>
                </motion.div>

                <div className="relative z-10 text-center">
                  <h3
                    className="text-white text-lg sm:text-xl"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                    }}
                  >
                    SELECT CSV FILE
                  </h3>

                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      color: "rgba(148,163,184,0.6)",
                    }}
                  >
                    Click here to browse and attach your import file
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <div
                      className="px-3 py-1.5 rounded-full"
                      style={{
                        background: "rgba(56,189,248,0.08)",
                        border: "1px solid rgba(56,189,248,0.12)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "10px",
                          color: "rgba(56,189,248,0.82)",
                          letterSpacing: "0.08em",
                        }}
                      >
                        CSV ONLY
                      </span>
                    </div>

                    <div
                      className="px-3 py-1.5 rounded-full"
                      style={{
                        background: "rgba(129,140,248,0.08)",
                        border: "1px solid rgba(129,140,248,0.12)",
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "10px",
                          color: "rgba(165,180,252,0.82)",
                          letterSpacing: "0.08em",
                        }}
                      >
                        MAX 2MB
                      </span>
                    </div>
                  </div>
                </div>

                <input
                  ref={inputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </motion.label>

              {/* FILE PREVIEW */}
              <AnimatePresence>
                {file && (
                  <motion.div
                    initial={{ opacity: 0, y: 14 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 14 }}
                    className="mt-5 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(56,189,248,0.08)",
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                        style={{
                          background: "rgba(56,189,248,0.08)",
                          border: "1px solid rgba(56,189,248,0.12)",
                        }}
                      >
                        <FileText size={18} className="text-sky-300" />
                      </div>

                      <div className="min-w-0">
                        <p
                          className="text-white truncate"
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontWeight: 700,
                            letterSpacing: "0.03em",
                            fontSize: "14px",
                          }}
                        >
                          {file.name}
                        </p>

                        <p
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "10px",
                            color: "rgba(148,163,184,0.6)",
                          }}
                        >
                          {(file.size / 1024).toFixed(1)} KB • ready for import
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        setFile(null);
                        if (inputRef.current) inputRef.current.value = "";
                      }}
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-sm self-start sm:self-auto"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.18)",
                        color: "#fca5a5",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <X size={14} />
                      Remove
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* MESSAGE */}
              <AnimatePresence>
                {message && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    className="mt-5 rounded-2xl p-4 flex items-start gap-3"
                    style={{
                      background:
                        message.type === "error"
                          ? "rgba(239,68,68,0.08)"
                          : "rgba(34,197,94,0.08)",
                      border:
                        message.type === "error"
                          ? "1px solid rgba(239,68,68,0.16)"
                          : "1px solid rgba(34,197,94,0.16)",
                    }}
                  >
                    <div className="mt-0.5">
                      {message.type === "error" ? (
                        <AlertCircle size={18} className="text-red-300" />
                      ) : (
                        <CheckCircle2 size={18} className="text-emerald-300" />
                      )}
                    </div>

                    <div>
                      <p
                        className={`font-semibold ${
                          message.type === "error" ? "text-red-300" : "text-emerald-300"
                        }`}
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          letterSpacing: "0.03em",
                          fontSize: "13px",
                        }}
                      >
                        {message.type === "error" ? "IMPORT ERROR" : "IMPORT SUCCESS"}
                      </p>

                      <p
                        className="mt-1"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "11px",
                          color:
                            message.type === "error"
                              ? "rgba(252,165,165,0.82)"
                              : "rgba(134,239,172,0.82)",
                        }}
                      >
                        {message.text}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* BUTTON */}
              <motion.button
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.99 }}
                onClick={uploadCsv}
                disabled={loading}
                className="mt-6 w-full flex items-center justify-center gap-3 rounded-2xl px-5 py-4 disabled:opacity-60"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(56,189,248,0.9) 0%, rgba(129,140,248,0.9) 100%)",
                  boxShadow: "0 0 26px rgba(56,189,248,0.16)",
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: "white",
                }}
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={18} />
                    UPLOADING...
                  </>
                ) : (
                  <>
                    <UploadCloud size={18} />
                    UPLOAD CSV
                  </>
                )}
              </motion.button>
            </motion.div>

            {/* RIGHT PANEL */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.14 }}
              className="relative overflow-hidden rounded-3xl p-5 sm:p-6 h-fit xl:sticky xl:top-6"
              style={{
                background: "rgba(3,7,18,0.72)",
                border: "1px solid rgba(56,189,248,0.09)",
                backdropFilter: "blur(18px)",
                boxShadow:
                  "0 0 22px rgba(56,189,248,0.03), inset 0 1px 0 rgba(56,189,248,0.035)",
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.32) 30%, rgba(129,140,248,0.28) 70%, transparent 100%)",
                }}
              />

              <div className="mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-[1px] w-8 bg-sky-400/20" />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      letterSpacing: "0.24em",
                      color: "rgba(56,189,248,0.46)",
                      textTransform: "uppercase",
                    }}
                  >
                    Upload Guide
                  </span>
                </div>

                <h2
                  className="text-white text-xl sm:text-2xl"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                  }}
                >
                  CSV SPECIFICATION
                </h2>

                <p
                  className="mt-2"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: "rgba(148,163,184,0.56)",
                  }}
                >
                  Follow the correct structure to ensure a clean and successful import.
                </p>
              </div>

              <div className="space-y-4">
                {/* REQUIRED HEADERS */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={15} className="text-sky-300" />
                    <p
                      className="text-white"
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        fontSize: "14px",
                      }}
                    >
                      Required CSV Headers
                    </p>
                  </div>

                  <div
                    className="rounded-xl px-4 py-3 break-all"
                    style={{
                      background: "rgba(2,6,23,0.65)",
                      border: "1px solid rgba(56,189,248,0.08)",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "12px",
                      color: "rgba(125,211,252,0.9)",
                    }}
                  >
                    domain, url, category, priority
                  </div>

                  <p
                    className="mt-3"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: "rgba(148,163,184,0.56)",
                    }}
                  >
                    Header names must match exactly in the first row.
                  </p>
                </div>

                {/* REQUIRED FIELDS */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={15} className="text-emerald-300" />
                    <p
                      className="text-white"
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        fontSize: "14px",
                      }}
                    >
                      Required Fields
                    </p>
                  </div>

                  <ul
                    className="space-y-2"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      color: "rgba(148,163,184,0.74)",
                    }}
                  >
                    <li>• <span className="text-white">domain</span></li>
                    <li>• <span className="text-white">url</span> → must start with <span className="text-sky-300">http://</span> or <span className="text-sky-300">https://</span></li>
                  </ul>
                </div>

                {/* OPTIONAL FIELDS */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Database size={15} className="text-indigo-300" />
                    <p
                      className="text-white"
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        fontSize: "14px",
                      }}
                    >
                      Optional Fields
                    </p>
                  </div>

                  <ul
                    className="space-y-2"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      color: "rgba(148,163,184,0.74)",
                    }}
                  >
                    <li>• <span className="text-white">category</span> → default: <span className="text-sky-300">UNCATEGORIZED</span></li>
                    <li>• <span className="text-white">priority</span> → default: <span className="text-sky-300">0</span></li>
                  </ul>
                </div>

                {/* NOTES */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(255,255,255,0.04)",
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Info size={15} className="text-amber-300" />
                    <p
                      className="text-white"
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        fontSize: "14px",
                      }}
                    >
                      Import Notes
                    </p>
                  </div>

                  <ul
                    className="space-y-2"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      color: "rgba(148,163,184,0.74)",
                    }}
                  >
                    <li>• Invalid URLs may be skipped</li>
                    <li>• Empty rows are ignored</li>
                    <li>• Only CSV files are accepted</li>
                    <li>• Use clean formatting for best results</li>
                  </ul>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </>
  );
};

export default BulkUpload;