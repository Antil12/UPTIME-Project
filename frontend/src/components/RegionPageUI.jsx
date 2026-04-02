import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  Globe2,
  ArrowLeft,
  Server,
  Link2,
  Radar,
  ShieldCheck,
} from "lucide-react";

// ─── Font Loader ──────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    if (document.getElementById("uptime-fonts")) return;
    const link = document.createElement("link");
    link.id = "uptime-fonts";
    link.href =
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@300;400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
};

// ─── Cursor Glow ──────────────────────────────────────────────────────────────
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

// ─── Full Page Background ─────────────────────────────────────────────────────
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

// ─── HUD Corner ───────────────────────────────────────────────────────────────
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

// ─── Orbit Ring ───────────────────────────────────────────────────────────────
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

// ─── Status Dot ───────────────────────────────────────────────────────────────
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

// ─── Small Stat Card ──────────────────────────────────────────────────────────
const StatCard = ({ icon: Icon, label, value }) => (
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
        className="w-9 h-9 rounded-xl flex items-center justify-center border"
        style={{
          borderColor: "rgba(56,189,248,0.1)",
          background: "rgba(255,255,255,0.02)",
        }}
      >
        <Icon size={16} className="text-sky-400" />
      </div>
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
  </motion.div>
);

// ─── Site Card ────────────────────────────────────────────────────────────────
const SiteCard = ({ site, index }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.45 }}
      whileHover={{ y: -3 }}
      className="group relative overflow-hidden rounded-2xl"
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

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(56,189,248,0.04), transparent 45%)",
          }}
        />
      </div>

      <div className="relative z-10 p-5">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-3">
              <div
                className="inline-flex items-center gap-2 px-2 py-1 rounded-full border"
                style={{
                  borderColor: "rgba(56,189,248,0.1)",
                  background: "rgba(56,189,248,0.035)",
                }}
              >
                <Server size={12} className="text-sky-400" />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "0.14em",
                    color: "rgba(56,189,248,0.62)",
                    textTransform: "uppercase",
                  }}
                >
                  Monitored Site
                </span>
              </div>
            </div>

            <h3
              className="text-white text-base sm:text-lg break-all"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: "0.03em",
                fontWeight: 700,
              }}
            >
              {site.domain || "Unknown Domain"}
            </h3>

            <div className="mt-3 flex items-start gap-3">
              <Link2 size={14} className="text-sky-400 mt-0.5 shrink-0" />
              <p
                className="break-all"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "rgba(148,163,184,0.64)",
                  letterSpacing: "0.02em",
                }}
              >
                {site.url}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div
              className="rounded-xl px-4 py-3 min-w-[120px]"
              style={{
                background: "rgba(255,255,255,0.018)",
                border: "1px solid rgba(255,255,255,0.045)",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  color: "rgba(148,163,184,0.48)",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                Priority
              </div>
              <div
                className="mt-2 text-white"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  fontSize: "17px",
                }}
              >
                {site.priority ?? 0}
              </div>
            </div>

            <div
              className="rounded-xl px-4 py-3 min-w-[145px]"
              style={{
                background: "rgba(255,255,255,0.018)",
                border: "1px solid rgba(255,255,255,0.045)",
              }}
            >
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  color: "rgba(148,163,184,0.48)",
                  textTransform: "uppercase",
                  letterSpacing: "0.14em",
                }}
              >
                Status
              </div>
              <div className="mt-2">
                <StatusDot color="#34d399" label="Tracking Active" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main UI Component ────────────────────────────────────────────────────────
const RegionPageUI = ({
  decodedRegion,
  sites,
  loading,
  onBack,
}) => {
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

        <div className="relative z-10 w-full">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5"
          >
            <div className="flex items-start gap-3">
              <motion.button
                whileHover={{ scale: 1.03, x: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={onBack}
                className="mt-1 inline-flex items-center justify-center rounded-xl w-10 h-10 shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(129,140,248,0.08) 100%)",
                  border: "1px solid rgba(56,189,248,0.16)",
                  boxShadow: "0 0 14px rgba(56,189,248,0.04)",
                }}
              >
                <ArrowLeft size={16} className="text-white" />
              </motion.button>

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
                    Region Monitoring
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
                  {decodedRegion?.toUpperCase()}
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
                  Websites monitored from this region with active region-level
                  tracking and availability inspection.
                </p>
              </div>
            </div>

            <StatusDot color="#34d399" label="Region Active" />
          </motion.div>

          {/* Top Status Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="mb-6 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
            style={{
              background: "rgba(3,7,18,0.64)",
              border: "1px solid rgba(56,189,248,0.08)",
              backdropFilter: "blur(14px)",
              boxShadow: "0 0 18px rgba(56,189,248,0.02)",
            }}
          >
            <div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  fontSize: "13px",
                  letterSpacing: "0.06em",
                  color: "white",
                }}
              >
                REGION INSPECTION PANEL
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "rgba(148,163,184,0.48)",
                  marginTop: "4px",
                }}
              >
                Monitoring nodes and configured sites for this zone.
              </div>
            </div>

            <StatusDot color="#34d399" label={loading ? "Fetching Data" : "Data Ready"} />
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
            <StatCard icon={Globe2} label="Region" value={decodedRegion || "--"} />
            <StatCard icon={Server} label="Configured Sites" value={sites.length} />
            <StatCard icon={Radar} label="Scan State" value={loading ? "SYNC" : "LIVE"} />
            <StatCard icon={ShieldCheck} label="Zone Status" value="ACTIVE" />
          </div>

          {/* Content */}
          {loading ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-2xl p-8 text-center"
              style={{
                background: "rgba(3,7,18,0.64)",
                border: "1px solid rgba(56,189,248,0.08)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 0 18px rgba(56,189,248,0.02)",
              }}
            >
              <div className="flex justify-center mb-4">
                <motion.div
                  className="w-12 h-12 rounded-full border-2 border-sky-400/20 border-t-sky-400"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                />
              </div>

              <h3
                className="text-white text-lg mb-2"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: "0.04em",
                  fontWeight: 700,
                }}
              >
                LOADING REGION DATA
              </h3>

              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "rgba(148,163,184,0.5)",
                }}
              >
                Fetching monitored websites and active configuration...
              </p>
            </motion.div>
          ) : sites.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-8 text-center"
              style={{
                background: "rgba(3,7,18,0.64)",
                border: "1px solid rgba(56,189,248,0.08)",
                backdropFilter: "blur(14px)",
                boxShadow: "0 0 18px rgba(56,189,248,0.02)",
              }}
            >
              <div
                className="mx-auto mb-4 w-14 h-14 rounded-2xl flex items-center justify-center border"
                style={{
                  borderColor: "rgba(56,189,248,0.1)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <Server size={22} className="text-sky-400" />
              </div>

              <h3
                className="text-white text-lg mb-2"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: "0.04em",
                  fontWeight: 700,
                }}
              >
                NO SITES CONFIGURED
              </h3>

              <p
                className="max-w-xl mx-auto"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "11px",
                  color: "rgba(148,163,184,0.5)",
                }}
              >
                No websites are currently assigned to the{" "}
                <span className="text-sky-400">{decodedRegion}</span> monitoring region.
              </p>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {sites.map((site, index) => (
                <SiteCard key={site._id} site={site} index={index} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default RegionPageUI;