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
import { useTheme } from "../contexts/ThemeContext";

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
const Background = ({ currentTheme }) => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div
      className="absolute inset-0"
      style={{
        background: currentTheme.bg,
      }}
    />

    <div
      className="absolute inset-0"
      style={{
        background: `radial-gradient(ellipse 60% 40% at 50% 20%, ${currentTheme.accent}0e 0%, transparent 100%)`,
      }}
    />

    <div
      className="absolute"
      style={{
        top: "62%",
        left: "16%",
        width: 320,
        height: 320,
        background: `radial-gradient(circle, ${currentTheme.accentSecondary}08 0%, transparent 68%)`,
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
        background: `radial-gradient(circle, ${currentTheme.success}07 0%, transparent 68%)`,
        filter: "blur(80px)",
      }}
    />

    <div
      className="absolute inset-0"
      style={{
        backgroundImage: `linear-gradient(${currentTheme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.gridColor} 1px, transparent 1px)`,
        backgroundSize: "42px 42px",
      }}
    />

    <motion.div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to bottom, transparent 48%, ${currentTheme.accent}08 50%, transparent 52%)`,
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
const HUDCorner = ({ pos, delay = 0, currentTheme }) => {
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
        className="absolute top-0 left-0 h-[1.5px]"
        style={{ background: currentTheme.accent, opacity: 0.8 }}
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }}
      />
      <motion.div
        className="absolute top-0 left-0 w-[1.5px]"
        style={{ background: currentTheme.accent, opacity: 0.8 }}
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
const StatusDot = ({ color = "#34d399", label, currentTheme }) => (
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
          color: currentTheme ? `${color}88` : `${color}88`,
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
const StatCard = ({ icon: Icon, label, value, sub, currentTheme }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4 }}
    className="rounded-2xl p-4"
    style={{
      background: currentTheme.bgCard,
      border: `1px solid ${currentTheme.borderAccent}`,
      backdropFilter: "blur(16px)",
      boxShadow: currentTheme.shadow,
    }}
  >
    <div className="flex items-center justify-between mb-3">
      <div
        className="w-10 h-10 rounded-2xl flex items-center justify-center border"
        style={{
          borderColor: currentTheme.borderAccent,
          background: currentTheme.bgInput,
        }}
      >
        <Icon size={16} style={{ color: currentTheme.accent }} />
      </div>

      <StatusDot color={currentTheme.success} currentTheme={currentTheme} />
    </div>

    <div
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        color: currentTheme.textMuted,
        letterSpacing: "0.08em",
        textTransform: "uppercase",
      }}
    >
      {label}
    </div>

    <div
      className="mt-2 text-lg sm:text-xl break-words"
      style={{
        fontFamily: "'Orbitron', sans-serif",
        fontWeight: 700,
        letterSpacing: "0.04em",
        color: currentTheme.text,
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
          color: currentTheme.textMuted,
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
  const { currentTheme } = useTheme();
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

      const response = await axios.post(`${API}/monitoredsite/bulk-import`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${localStorage.getItem("loginToken")}`,
        },
      });

      const { inserted, skipped, reactivated, updated } = response.data;
      const messageParts = [];
      if (inserted > 0) messageParts.push(`${inserted} inserted`);
      if (updated > 0) messageParts.push(`${updated} updated`);
      if (reactivated > 0) messageParts.push(`${reactivated} reactivated`);
      if (skipped > 0) messageParts.push(`${skipped} skipped`);

      setMessage({
        type: "success",
        text: `Bulk upload completed: ${messageParts.join(", ")}`,
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
        className="relative min-h-screen w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-6"
        style={{ background: "transparent", color: currentTheme.text }}
      >
        <Background currentTheme={currentTheme} />
        <CursorGlow />

        <OrbitRing radius={220} duration={20} dotCount={8} color={currentTheme.accent} tilt={72} />
        <OrbitRing radius={290} duration={30} dotCount={10} color={currentTheme.accentSecondary} tilt={68} delay={1} />

        {["tl", "tr", "bl", "br"].map((p, i) => (
          <HUDCorner key={p} pos={p} delay={0.1 + i * 0.05} currentTheme={currentTheme} />
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
                <div className="h-[1px] w-8" style={{ background: currentTheme.accent, opacity: 0.2 }} />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "0.28em",
                    color: currentTheme.accent,
                    opacity: 0.7,
                    textTransform: "uppercase",
                  }}
                >
                  Import Pipeline
                </span>
                <div className="h-[1px] w-16 sm:w-24" style={{ background: currentTheme.accent, opacity: 0.1 }} />
              </div>

              <h1
                className="text-2xl sm:text-3xl lg:text-4xl mb-2"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 800,
                  letterSpacing: "0.05em",
                  color: currentTheme.text,
                  textShadow: `0 0 24px ${currentTheme.accent}15`,
                }}
              >
                BULK SITE UPLOAD
              </h1>

              <p
                className="max-w-2xl"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: currentTheme.textMuted,
                  letterSpacing: "0.03em",
                }}
              >
                Import monitored websites in bulk using a structured CSV file for
                faster deployment and centralized onboarding.
              </p>
            </div>

            <StatusDot
              color={loading ? currentTheme.warning : currentTheme.success}
              label={loading ? "Upload Running" : "Import Ready"}
              currentTheme={currentTheme}
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
                background: currentTheme.bgCard,
                border: `1px solid ${currentTheme.borderAccent}`,
                backdropFilter: "blur(18px)",
                boxShadow: currentTheme.shadow,
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                  background: currentTheme.gradientCard,
                }}
              />

              {/* SECTION HEAD */}
              <div className="mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-[1px] w-8" style={{ background: currentTheme.accent, opacity: 0.2 }} />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      letterSpacing: "0.24em",
                      color: currentTheme.accent,
                      opacity: 0.7,
                      textTransform: "uppercase",
                    }}
                  >
                    Upload Module
                  </span>
                </div>

                <h2
                  className="text-xl sm:text-2xl"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color: currentTheme.text,
                  }}
                >
                  IMPORT CSV FILE
                </h2>

                <p
                  className="mt-2"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: currentTheme.textMuted,
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
                  background: currentTheme.bgInput,
                  border: `1px dashed ${currentTheme.borderAccent}`,
                  backdropFilter: "blur(12px)",
                }}
              >
                <div
                  className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500"
                  style={{
                    background: `radial-gradient(circle at center, ${currentTheme.accent}08, transparent 60%)`,
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
                      background: currentTheme.gradientPrimary,
                      border: `1px solid ${currentTheme.borderAccent}`,
                      boxShadow: currentTheme.shadowGlow,
                    }}
                  >
                    <UploadCloud size={34} style={{ color: currentTheme.accent }} />
                  </div>
                </motion.div>

                <div className="relative z-10 text-center">
                  <h3
                    className="text-lg sm:text-xl"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      color: currentTheme.text,
                    }}
                  >
                    SELECT CSV FILE
                  </h3>

                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      color: currentTheme.textMuted,
                    }}
                  >
                    Click here to browse and attach your import file
                  </p>

                  <div className="mt-5 flex flex-wrap justify-center gap-2">
                    <div
                      className="px-3 py-1.5 rounded-full"
                      style={{
                        background: currentTheme.accentGlow,
                        border: `1px solid ${currentTheme.borderAccent}`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "10px",
                          color: currentTheme.accent,
                          letterSpacing: "0.08em",
                        }}
                      >
                        CSV ONLY
                      </span>
                    </div>

                    <div
                      className="px-3 py-1.5 rounded-full"
                      style={{
                        background: `${currentTheme.accentSecondary}0e`,
                        border: `1px solid ${currentTheme.accentSecondary}20`,
                      }}
                    >
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "10px",
                          color: currentTheme.accentSecondary,
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
                      background: currentTheme.bgInput,
                      border: `1px solid ${currentTheme.borderAccent}`,
                    }}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0"
                        style={{
                          background: currentTheme.accentGlow,
                          border: `1px solid ${currentTheme.borderAccent}`,
                        }}
                      >
                        <FileText size={18} style={{ color: currentTheme.accent }} />
                      </div>

                      <div className="min-w-0">
                        <p
                          className="truncate"
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontWeight: 700,
                            letterSpacing: "0.03em",
                            fontSize: "14px",
                            color: currentTheme.text,
                          }}
                        >
                          {file.name}
                        </p>

                        <p
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "10px",
                            color: currentTheme.textMuted,
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
                        background: currentTheme.errorBg,
                        border: `1px solid ${currentTheme.error}30`,
                        color: currentTheme.error,
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
                          ? currentTheme.errorBg
                          : currentTheme.successBg,
                      border:
                        message.type === "error"
                          ? `1px solid ${currentTheme.error}30`
                          : `1px solid ${currentTheme.success}30`,
                    }}
                  >
                    <div className="mt-0.5">
                      {message.type === "error" ? (
                        <AlertCircle size={18} style={{ color: currentTheme.error }} />
                      ) : (
                        <CheckCircle2 size={18} style={{ color: currentTheme.success }} />
                      )}
                    </div>

                    <div>
                      <p
                        className="font-semibold"
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          letterSpacing: "0.03em",
                          fontSize: "13px",
                          color: message.type === "error" ? currentTheme.error : currentTheme.success,
                        }}
                      >
                        {message.type === "error" ? "IMPORT ERROR" : "IMPORT SUCCESS"}
                      </p>

                      <p
                        className="mt-1"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "11px",
                          color: message.type === "error" ? currentTheme.error : currentTheme.success,
                          opacity: 0.85,
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
                  background: currentTheme.gradientPrimary,
                  boxShadow: currentTheme.shadowGlow,
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  letterSpacing: "0.05em",
                  color: currentTheme.text,
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
                background: currentTheme.bgCard,
                border: `1px solid ${currentTheme.borderAccent}`,
                backdropFilter: "blur(18px)",
                boxShadow: currentTheme.shadow,
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                  background: currentTheme.gradientCard,
                }}
              />

              <div className="mb-5">
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-[1px] w-8" style={{ background: currentTheme.accent, opacity: 0.2 }} />
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "9px",
                      letterSpacing: "0.24em",
                      color: currentTheme.accent,
                      opacity: 0.7,
                      textTransform: "uppercase",
                    }}
                  >
                    Upload Guide
                  </span>
                </div>

                <h2
                  className="text-xl sm:text-2xl"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 700,
                    letterSpacing: "0.04em",
                    color: currentTheme.text,
                  }}
                >
                  CSV SPECIFICATION
                </h2>

                <p
                  className="mt-2"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: currentTheme.textMuted,
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
                    background: currentTheme.bgInput,
                    border: `1px solid ${currentTheme.borderLight}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles size={15} style={{ color: currentTheme.accent }} />
                    <p
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        fontSize: "14px",
                        color: currentTheme.text,
                      }}
                    >
                      Required CSV Headers
                    </p>
                  </div>

                  <div
                    className="rounded-xl px-4 py-3 break-all"
                    style={{
                      background: currentTheme.bgPanel,
                      border: `1px solid ${currentTheme.borderAccent}`,
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "12px",
                      color: currentTheme.accent,
                    }}
                  >
                    domain, url, category, priority
                  </div>
                  <p
                    className="mt-2"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: currentTheme.warning,
                    }}
                  >
                    ✓ Tip: You can also add optional <span style={{ color: currentTheme.accent }}>email</span> and <span style={{ color: currentTheme.accent }}>region</span> columns
                  </p>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: currentTheme.warning,
                    }}
                  >
                    ✓ Multiple emails can be separated by commas (creates separate entries)
                  </p>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: currentTheme.warning,
                    }}
                  >
                    ✓ Multiple regions can be separated by commas (e.g., "Asia, Europe")
                  </p>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: currentTheme.warning,
                    }}
                  >
                    ✓ Valid regions: Asia, South America, North America, Europe, Africa, Australia
                  </p>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: currentTheme.warning,
                    }}
                  >
                    ✓ Region names are case-insensitive (e.g., "asia", "ASIA", "Asia" all work)
                  </p>

                  <p
                    className="mt-3"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: currentTheme.textMuted,
                    }}
                  >
                    Header names must match exactly in the first row.
                  </p>
                </div>

                {/* REQUIRED FIELDS */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: currentTheme.bgInput,
                    border: `1px solid ${currentTheme.borderLight}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck size={15} style={{ color: currentTheme.success }} />
                    <p
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        fontSize: "14px",
                        color: currentTheme.text,
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
                      color: currentTheme.textMuted,
                    }}
                  >
                    <li>• <span style={{ color: currentTheme.text }}>domain</span></li>
                    <li>• <span style={{ color: currentTheme.text }}>url</span> → must start with <span style={{ color: currentTheme.accent }}>http://</span> or <span style={{ color: currentTheme.accent }}>https://</span></li>
                  </ul>
                </div>

                {/* OPTIONAL FIELDS */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: currentTheme.bgInput,
                    border: `1px solid ${currentTheme.borderLight}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Database size={15} style={{ color: currentTheme.accentSecondary }} />
                    <p
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        fontSize: "14px",
                        color: currentTheme.text,
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
                      color: currentTheme.textMuted,
                    }}
                  >
                    <li className="leading-relaxed">
                   • <span style={{ color: currentTheme.text, fontWeight: 500 }}>Category</span>
                     <span style={{ color: currentTheme.textDim }}> (default: </span>
                     <span style={{ color: currentTheme.accent, fontWeight: 600 }}>Others</span>
                     <span style={{ color: currentTheme.textDim }}>)</span>
                     <br />
                     <span style={{ color: currentTheme.textDim }}>Allowed values:</span>
                     <span style={{ color: currentTheme.accent, fontWeight: 500 }}>
                       {" "}
                    JOURNALS, E-JAYPEE, JPMEDPUB, JP-DIGITAL, DIGINERVE
                    </span>
                    </li>
                    <li>• <span style={{ color: currentTheme.text }}>priority</span> → default: <span style={{ color: currentTheme.accent }}>0</span></li>
                    <li>• <span style={{ color: currentTheme.text }}>email</span> → contact email(s), comma-separated for multiple</li>
                    <li>• <span style={{ color: currentTheme.text }}>region</span> → regions(s), comma-separated for multiple</li>
                  </ul>
                </div>

                {/* NOTES */}
                <div
                  className="rounded-2xl p-4"
                  style={{
                    background: currentTheme.bgInput,
                    border: `1px solid ${currentTheme.borderLight}`,
                  }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <Info size={15} style={{ color: currentTheme.warning }} />
                    <p
                      style={{
                        fontFamily: "'Orbitron', sans-serif",
                        fontWeight: 700,
                        letterSpacing: "0.03em",
                        fontSize: "14px",
                        color: currentTheme.text,
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
                      color: currentTheme.textMuted,
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