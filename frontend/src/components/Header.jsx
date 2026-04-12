import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import SettingsMenu from "./SettingsMenu";
import CrystalButton from "./CrystalButton";

// ─────────────────────────────────────────────────────────────────────────────
// Premium Refresh Overlay
// ─────────────────────────────────────────────────────────────────────────────

const RefreshFontLoader = () => {
  useEffect(() => {
    const id = "header-refresh-fonts";
    if (document.getElementById(id)) return;

    const link = document.createElement("link");
    link.id = id;
    link.href =
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@300;400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);

  return null;
};

const RefreshCursorGlow = () => {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 120, damping: 20 });
  const sy = useSpring(y, { stiffness: 120, damping: 20 });

  useEffect(() => {
    const move = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed z-[100]"
      style={{
        left: sx,
        top: sy,
        translateX: "-50%",
        translateY: "-50%",
        width: 280,
        height: 280,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(16,185,129,0.08) 0%, rgba(56,189,248,0.06) 35%, transparent 72%)",
      }}
    />
  );
};

const RefreshNoise = () => (
  <div
    className="pointer-events-none absolute inset-0 z-[1] opacity-[0.02]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundSize: "128px 128px",
    }}
  />
);

const RefreshGrid = () => (
  <div
    className="pointer-events-none absolute inset-0 z-0"
    style={{
      backgroundImage:
        "linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
    }}
  />
);

const RefreshPerspectiveGrid = () => (
  <div
    className="pointer-events-none absolute bottom-0 left-0 right-0 z-0"
    style={{ height: "44%", overflow: "hidden" }}
  >
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1200 400"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.07 }}
    >
      {[0.1, 0.2, 0.32, 0.46, 0.62, 0.8, 1.0].map((t, i) => (
        <line
          key={`h${i}`}
          x1={600 - 600 * t}
          y1={400 * t}
          x2={600 + 600 * t}
          y2={400 * t}
          stroke="#10b981"
          strokeWidth={0.5 + t * 0.5}
        />
      ))}

      {Array.from({ length: 17 }, (_, i) => {
        const spread = (i - 8) / 8;
        return (
          <line
            key={`v${i}`}
            x1={600}
            y1={0}
            x2={600 + spread * 600}
            y2={400}
            stroke="#38bdf8"
            strokeWidth={0.35}
          />
        );
      })}
    </svg>

    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(to bottom, #020617 0%, transparent 40%)",
      }}
    />
  </div>
);

const RefreshScanline = () => (
  <motion.div
    className="pointer-events-none absolute inset-0 z-30"
    style={{
      background:
        "linear-gradient(to bottom, transparent 48%, rgba(16,185,129,0.02) 50%, transparent 52%)",
    }}
    animate={{ y: ["-100%", "100%"] }}
    transition={{ duration: 3.8, repeat: Infinity, ease: "linear", repeatDelay: 1.4 }}
  />
);

const RefreshAtmoGlow = () => (
  <>
    <div
      className="pointer-events-none absolute z-0"
      style={{
        top: "34%",
        left: "50%",
        width: 780,
        height: 420,
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(ellipse, rgba(16,185,129,0.07) 0%, transparent 65%)",
        filter: "blur(60px)",
      }}
    />
    <div
      className="pointer-events-none absolute z-0"
      style={{
        top: "56%",
        left: "30%",
        width: 360,
        height: 360,
        background: "radial-gradient(ellipse, rgba(56,189,248,0.05) 0%, transparent 65%)",
        filter: "blur(80px)",
      }}
    />
    <div
      className="pointer-events-none absolute z-0"
      style={{
        top: "52%",
        left: "72%",
        width: 300,
        height: 300,
        background: "radial-gradient(ellipse, rgba(99,102,241,0.04) 0%, transparent 65%)",
        filter: "blur(70px)",
      }}
    />
  </>
);

const RefreshOrbitRing = ({
  radius,
  duration,
  dotCount,
  color,
  delay = 0,
  tilt = 0,
}) => {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        width: radius * 2,
        height: radius * 2,
        top: "50%",
        left: "50%",
        marginTop: -radius,
        marginLeft: -radius,
        transform: `perspective(800px) rotateX(${tilt}deg)`,
      }}
      animate={{ rotate: 360 }}
      transition={{ duration, repeat: Infinity, ease: "linear", delay }}
    >
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `1px solid ${color}16`,
          boxShadow: `inset 0 0 40px ${color}08`,
        }}
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
              width: i === 0 ? 7 : 2,
              height: i === 0 ? 7 : 2,
              background: i === 0 ? color : `${color}90`,
              left: cx - (i === 0 ? 3.5 : 1),
              top: cy - (i === 0 ? 3.5 : 1),
              boxShadow: i === 0 ? `0 0 14px ${color}` : "none",
            }}
            animate={i === 0 ? { opacity: [1, 0.35, 1], scale: [1, 1.25, 1] } : {}}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        );
      })}
    </motion.div>
  );
};

const RefreshDataBeam = () => (
  <motion.div
    className="absolute left-1/2 top-1/2 pointer-events-none z-20"
    style={{
      width: 2,
      height: 240,
      transform: "translate(-50%, -50%)",
      background:
        "linear-gradient(to bottom, transparent 0%, rgba(16,185,129,0.7) 25%, rgba(56,189,248,0.8) 50%, rgba(16,185,129,0.7) 75%, transparent 100%)",
      boxShadow: "0 0 18px rgba(56,189,248,0.35)",
    }}
    animate={{
      opacity: [0.25, 0.85, 0.25],
      scaleY: [0.85, 1.08, 0.85],
    }}
    transition={{ duration: 1.8, repeat: Infinity }}
  />
);

const RefreshPulseCore = () => (
  <div className="relative w-32 h-32 flex items-center justify-center">
    <motion.div
      className="absolute inset-0 rounded-full border"
      style={{ borderColor: "rgba(16,185,129,0.28)" }}
      animate={{ scale: [1, 1.2, 1], opacity: [0.6, 0.18, 0.6] }}
      transition={{ duration: 2.1, repeat: Infinity }}
    />
    <motion.div
      className="absolute inset-3 rounded-full border"
      style={{ borderColor: "rgba(56,189,248,0.24)" }}
      animate={{ scale: [1, 1.14, 1], opacity: [0.7, 0.22, 0.7] }}
      transition={{ duration: 1.7, repeat: Infinity }}
    />
    <motion.div
      className="absolute inset-6 rounded-full"
      style={{
        background:
          "radial-gradient(circle, rgba(16,185,129,0.22) 0%, rgba(56,189,248,0.10) 55%, transparent 80%)",
        filter: "blur(5px)",
      }}
      animate={{ scale: [1, 1.08, 1] }}
      transition={{ duration: 1.5, repeat: Infinity }}
    />
    <motion.div
      className="absolute inset-[26px] rounded-full border"
      style={{
        borderColor: "rgba(255,255,255,0.08)",
        boxShadow: "0 0 24px rgba(16,185,129,0.18)",
      }}
      animate={{ rotate: 360 }}
      transition={{ duration: 7, repeat: Infinity, ease: "linear" }}
    />
    <motion.div
      className="relative z-10 text-4xl"
      animate={{ rotate: 360 }}
      transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
    >
      🔄
    </motion.div>
  </div>
);

const RefreshStatusText = ({ phaseText = "SYNCING DATA" }) => {
  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        style={{
          fontFamily: "'Orbitron', sans-serif",
          letterSpacing: "0.22em",
        }}
        className="text-2xl md:text-4xl font-black text-white text-center"
      >
        LIVE REFRESH
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.15, duration: 0.4 }}
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.25em",
        }}
        className="text-[10px] md:text-xs uppercase text-emerald-300/75 text-center"
      >
        {phaseText}
      </motion.div>
    </div>
  );
};

const RefreshProgress = ({ progress }) => {
  return (
    <div className="w-[290px] md:w-[380px] flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span
          className="text-[10px] uppercase tracking-[0.28em] text-sky-300/50"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          CACHE · METRICS · HEALTH
        </span>
        <span
          className="text-[10px] uppercase tracking-[0.28em] text-emerald-300/80"
          style={{ fontFamily: "'JetBrains Mono', monospace" }}
        >
          {String(progress).padStart(3, "0")}%
        </span>
      </div>

      <div className="relative h-[5px] w-full rounded-full overflow-hidden bg-white/5 border border-white/5">
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #10b981, #38bdf8, #6366f1)",
            boxShadow: "0 0 18px rgba(16,185,129,0.6)",
          }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.18, ease: "easeOut" }}
        />
        <motion.div
          className="absolute top-0 bottom-0 w-20"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.55), transparent)",
            filter: "blur(3px)",
          }}
          animate={{ x: ["-120%", "560%"] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
        />
      </div>
    </div>
  );
};

const RefreshOverlay = ({ visible, progress = 0, phaseText = "SYNCING DATA" }) => {
  return (
    <>
      <RefreshFontLoader />
      <AnimatePresence>
        {visible && (
          <motion.div
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
            style={{ background: "#020617" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{
              opacity: 0,
              scale: 1.04,
              filter: "blur(10px) brightness(1.25)",
            }}
            transition={{ duration: 0.55, ease: [0.4, 0, 0.2, 1] }}
          >
            <RefreshAtmoGlow />
            <RefreshGrid />
            <RefreshNoise />
            <RefreshScanline />
            <RefreshPerspectiveGrid />
            <RefreshCursorGlow />
            <RefreshDataBeam />

            <RefreshOrbitRing radius={120} duration={6} dotCount={5} color="#10b981" tilt={76} />
            <RefreshOrbitRing radius={180} duration={10} dotCount={8} color="#38bdf8" tilt={72} delay={0.2} />
            <RefreshOrbitRing radius={250} duration={16} dotCount={12} color="#6366f1" tilt={68} delay={0.4} />
            <RefreshOrbitRing radius={320} duration={24} dotCount={14} color="#22c55e" tilt={64} delay={0.6} />

            <div className="relative z-20 flex flex-col items-center gap-8 px-6">
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: -14 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1, duration: 0.4 }}
              >
                <motion.div
                  className="h-[1px] bg-emerald-400/30"
                  initial={{ width: 0 }}
                  animate={{ width: 40 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                />
                <span
                  className="text-[9px] uppercase tracking-[0.45em] text-emerald-300/55"
                  style={{ fontFamily: "'JetBrains Mono', monospace" }}
                >
                  System Sync Sequence
                </span>
                <motion.div
                  className="h-[1px] bg-emerald-400/30"
                  initial={{ width: 0 }}
                  animate={{ width: 40 }}
                  transition={{ delay: 0.2, duration: 0.4 }}
                />
              </motion.div>

              <RefreshPulseCore />
              <RefreshStatusText phaseText={phaseText} />
              <RefreshProgress progress={progress} />

              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-[10px] uppercase tracking-[0.22em] text-slate-400/60 text-center"
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                Updating dashboards · verifying uptime nodes · rebuilding live state
              </motion.div>
            </div>

            <motion.div
              className="absolute bottom-7 left-8 z-20 hidden md:flex items-center gap-2.5"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <motion.div className="relative" style={{ width: 8, height: 8 }}>
                <motion.div
                  className="absolute inset-0 rounded-full bg-emerald-400"
                  animate={{ scale: [1, 2], opacity: [0.6, 0] }}
                  transition={{ duration: 1.4, repeat: Infinity }}
                />
                <div className="absolute inset-0 rounded-full bg-emerald-400" />
              </motion.div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  letterSpacing: "0.22em",
                  color: "rgba(52,211,153,0.55)",
                  textTransform: "uppercase",
                }}
              >
                Sync Pipeline Active
              </span>
            </motion.div>

            <motion.div
              className="absolute bottom-7 right-8 z-20 hidden md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.7 }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                letterSpacing: "0.22em",
                color: "rgba(100,116,139,0.5)",
              }}
            >
              REFRESH ENGINE · PROD
            </motion.div>

            <motion.div
              className="absolute top-7 right-8 z-20 hidden md:block"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.8 }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                letterSpacing: "0.22em",
                color: "rgba(56,189,248,0.35)",
              }}
            >
              {new Date().toISOString().replace("T", " ").slice(0, 19)} UTC
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

// ─────────────────────────────────────────────────────────────────────────────
// Main Header
// ─────────────────────────────────────────────────────────────────────────────

const Header = ({
  handleRefresh,
  isRefreshing,
  handleLogout,
  currentUser,
}) => {
  const navigate = useNavigate();

  const [showRefreshOverlay, setShowRefreshOverlay] = useState(false);
  const [localRefreshing, setLocalRefreshing] = useState(false);
  const [refreshProgress, setRefreshProgress] = useState(0);
  const [refreshPhase, setRefreshPhase] = useState("SYNCING DATA");

  const refreshLocked = isRefreshing || localRefreshing;

  const runRefreshSequence = useCallback(async () => {
    if (refreshLocked) return;

    setLocalRefreshing(true);
    setShowRefreshOverlay(true);
    setRefreshProgress(0);
    setRefreshPhase("INITIALIZING");

    let progress = 0;
    let finished = false;

    const phases = [
      { at: 8, text: "INITIALIZING CORE" },
      { at: 20, text: "CONNECTING NODES" },
      { at: 38, text: "FETCHING HEALTH DATA" },
      { at: 55, text: "SYNCING METRICS" },
      { at: 72, text: "REBUILDING DASHBOARD" },
      { at: 88, text: "VERIFYING STATUS" },
      { at: 96, text: "FINALIZING" },
    ];

    const interval = setInterval(() => {
      if (!finished) {
        const nextIncrement =
          progress < 25 ? 4 + Math.random() * 5 :
          progress < 55 ? 2.5 + Math.random() * 3 :
          progress < 82 ? 1.2 + Math.random() * 2 :
          0.4 + Math.random() * 0.8;

        progress = Math.min(progress + nextIncrement, 96);
        setRefreshProgress(Math.floor(progress));

        const currentPhase = [...phases].reverse().find((p) => progress >= p.at);
        if (currentPhase) setRefreshPhase(currentPhase.text);
      }
    }, 90);

    const start = performance.now();

    try {
      if (typeof handleRefresh === "function") {
        await Promise.resolve(handleRefresh());
      }

      finished = true;
      setRefreshPhase("SYSTEM ONLINE");
      setRefreshProgress(100);

      const elapsed = performance.now() - start;
      const minVisible = 2000;
      const remaining = Math.max(0, minVisible - elapsed);

      await new Promise((res) => setTimeout(res, remaining));
      await new Promise((res) => setTimeout(res, 450));
    } catch (error) {
      console.error("Refresh failed:", error);
      finished = true;
      setRefreshPhase("RECOVERING");
      setRefreshProgress(100);
      await new Promise((res) => setTimeout(res, 950));
    } finally {
      clearInterval(interval);
      setShowRefreshOverlay(false);
      setTimeout(() => {
        setLocalRefreshing(false);
        setRefreshProgress(0);
        setRefreshPhase("SYNCING DATA");
      }, 250);
    }
  }, [handleRefresh, refreshLocked]);

  return (
    <>
      <RefreshOverlay
        visible={showRefreshOverlay}
        progress={refreshProgress}
        phaseText={refreshPhase}
      />

      <header className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
        <div className="w-full flex items-center justify-between px-4 md:px-10 py-3">
          <div className="w-full flex items-center justify-between px-3 md:px-8 py-2 md:py-4">

            {/* LOGO */}
            <div className="flex items-center gap-3">
              {/* Icon */}
              <div
                className="w-9 h-9 flex items-center justify-center rounded-lg text-base font-semibold"
                style={{
                  background: "hsl(var(--chart-4) / 0.12)",
                  color: "hsl(var(--chart-4))",
                }}
              >
                ⏱️
              </div>

              {/* Title — Orbitron + JetBrains Mono */}
              <div className="hidden md:flex flex-col leading-tight">
                <span
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 800,
                    fontSize: "14px",
                    letterSpacing: "0.05em",
                  }}
                  className="text-gray-900 dark:text-white"
                >
                  Uptime Monitor
                </span>
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "0.18em",
                    textTransform: "uppercase",
                    color: "rgba(56,189,248,0.6)",
                  }}
                >
                  Real-time Monitoring
                </span>
              </div>
            </div>

            {/* RIGHT SIDE */}
   <div className="flex items-center gap-2 md:gap-4">
  <div className="hidden md:flex items-center gap-2">
    <CrystalButton
      label="Dashboard"
      onClick={() => navigate("/dashboard")}
    />

    {currentUser?.role !== "VIEWER" && (
      <CrystalButton
        label="Add URL"
        onClick={() => navigate("/add")}
      />
    )}

    <CrystalButton
      label="Reports"
      onClick={() => navigate("/reports")}
    />

    {currentUser?.role?.toUpperCase() === "SUPERADMIN" && (
      <CrystalButton
        label="Super Admin"
        onClick={() => navigate("/superadmin")}
      />
    )}
  </div>

              <div className="flex md:hidden gap-2">
                <button
                  onClick={() => navigate("/dashboard")}
                  className="px-3 py-2 rounded-lg bg-white/10 text-xs"
                >
                  📊
                </button>

                {currentUser?.role !== "VIEWER" && (
                  <button
                    onClick={() => navigate("/add")}
                    className="px-3 py-2 rounded-lg bg-white/10 text-xs"
                  >
                    ➕
                  </button>
                )}

                <button
                  onClick={() => navigate("/reports")}
                  className="px-3 py-2 rounded-lg bg-white/10 text-xs"
                >
                  📄
                </button>

                {currentUser?.role?.toUpperCase() === "SUPERADMIN" && (
                  <button
                    onClick={() => navigate("/superadmin")}
                    className="px-3 py-2 rounded-lg bg-white/10 text-xs"
                  >
                    👑
                  </button>
                )}
              </div>

              {/* Refresh Button */}
              <motion.button
                whileTap={{ scale: refreshLocked ? 1 : 0.95 }}
                whileHover={{ scale: refreshLocked ? 1 : 1.05 }}
                onClick={runRefreshSequence}
                disabled={refreshLocked}
                className={`relative w-9 h-9 flex items-center justify-center rounded-lg text-white text-sm overflow-hidden
                  ${refreshLocked ? "bg-gray-500" : "bg-gradient-to-r from-emerald-500 to-green-600 shadow-lg shadow-emerald-500/20"}`}
              >
                {!refreshLocked && (
                  <motion.div
                    className="absolute inset-0 opacity-30"
                    style={{
                      background:
                        "linear-gradient(120deg, transparent 20%, rgba(255,255,255,0.45) 50%, transparent 80%)",
                    }}
                    animate={{ x: ["-120%", "140%"] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "linear" }}
                  />
                )}

                <motion.span
                  animate={refreshLocked ? { rotate: 360 } : { rotate: 0 }}
                  transition={
                    refreshLocked
                      ? { duration: 0.8, repeat: Infinity, ease: "linear" }
                      : { duration: 0.25 }
                  }
                  className="relative z-10"
                >
                  🔄
                </motion.span>
              </motion.button>

              {/* SETTINGS MENU */}
              <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10">
                <SettingsMenu
                  onLogout={handleLogout}
                />
              </div>
            </div>
          </div>
        </div>
      </header>
    </>
  );
};

export default Header;