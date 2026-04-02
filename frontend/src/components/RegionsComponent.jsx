import React, { useEffect } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import { Globe2, ArrowRight, Activity, Radar, ShieldCheck } from "lucide-react";

const regions = [
  { name: "South America", code: "SA", status: "Monitoring Zone" },
  { name: "Australia", code: "AU", status: "Monitoring Zone" },
  { name: "North America", code: "NA", status: "Monitoring Zone" },
  { name: "Europe", code: "EU", status: "Monitoring Zone" },
  { name: "Asia", code: "AS", status: "Monitoring Zone" },
  { name: "Africa", code: "AF", status: "Monitoring Zone" },
];

// ─── Font Loader ──────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    if (document.getElementById("uptime-fonts")) return;
    const link = document.createElement("link");
    link.id = "uptime-fonts";
    link.href =
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@500;700;800&family=JetBrains+Mono:wght@400;500;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
};

// ─── Full Cursor Glow ─────────────────────────────────────────────────────────
const CursorGlow = () => {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 100, damping: 22 });
  const sy = useSpring(y, { stiffness: 100, damping: 22 });

  useEffect(() => {
    const fn = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [x, y]);

  return (
    <motion.div className="pointer-events-none fixed inset-0 z-[1] overflow-hidden">
      <motion.div
        className="absolute"
        style={{
          left: sx,
          top: sy,
          translateX: "-50%",
          translateY: "-50%",
          width: 420,
          height: 420,
          borderRadius: "9999px",
          background:
            "radial-gradient(circle, rgba(56,189,248,0.045) 0%, transparent 70%)",
        }}
      />
    </motion.div>
  );
};

// ─── Full Page Background ─────────────────────────────────────────────────────
const FullPageBackground = () => (
  <div className="fixed inset-0 w-screen h-screen overflow-hidden z-0 bg-[#030712]">
    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 65% 42% at 50% 18%, rgba(56,189,248,0.045) 0%, transparent 100%)",
      }}
    />
    <div
      className="absolute"
      style={{
        top: "58%",
        left: "12%",
        width: 360,
        height: 360,
        background:
          "radial-gradient(ellipse, rgba(129,140,248,0.035) 0%, transparent 65%)",
        filter: "blur(90px)",
      }}
    />
    <div
      className="absolute"
      style={{
        top: "18%",
        right: "8%",
        width: 260,
        height: 260,
        background:
          "radial-gradient(ellipse, rgba(16,185,129,0.02) 0%, transparent 65%)",
        filter: "blur(70px)",
      }}
    />

    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(rgba(148,163,184,0.025) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.025) 1px, transparent 1px)",
        backgroundSize: "38px 38px",
      }}
    />

    <motion.div
      className="absolute inset-0 z-[2] pointer-events-none"
      style={{
        background:
          "linear-gradient(to bottom, transparent 48%, rgba(56,189,248,0.015) 50%, transparent 52%)",
      }}
      animate={{ y: ["-100%", "100%"] }}
      transition={{
        duration: 5.5,
        repeat: Infinity,
        ease: "linear",
        repeatDelay: 3,
      }}
    />
  </div>
);

// ─── HUD Corners ──────────────────────────────────────────────────────────────
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
      className={`fixed ${cls[pos]} w-8 h-8 z-[5] pointer-events-none`}
      style={{ transform: `rotate(${rot[pos]})` }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.45 }}
    >
      <motion.div
        className="absolute top-0 left-0 h-[2px] bg-sky-400/80"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: delay + 0.12, duration: 0.35 }}
      />
      <motion.div
        className="absolute top-0 left-0 w-[2px] bg-sky-400/80"
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ delay: delay + 0.12, duration: 0.35 }}
      />
    </motion.div>
  );
};

// ─── Orbit Rings ──────────────────────────────────────────────────────────────
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
      opacity: 0.45,
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
            background: i === 0 ? color : `${color}45`,
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
        animate={{ scale: [1, 2.1], opacity: [0.45, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
    </div>
    {label && (
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "8px",
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

// ─── Region Card ──────────────────────────────────────────────────────────────
const RegionCard = ({ region, index, onClick }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{
        delay: index * 0.08,
        duration: 0.45,
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -4 }}
      className="group relative overflow-hidden rounded-2xl"
      style={{
        background: "rgba(3,7,18,0.8)",
        border: "1px solid rgba(56,189,248,0.1)",
        backdropFilter: "blur(18px)",
        boxShadow:
          "0 0 24px rgba(56,189,248,0.035), inset 0 1px 0 rgba(56,189,248,0.04)",
      }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-[1px]"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.35) 30%, rgba(129,140,248,0.25) 70%, transparent 100%)",
        }}
      />

      <div className="absolute top-0 left-0 w-5 h-5">
        <div className="absolute top-0 left-0 w-full h-[2px] bg-sky-400/55" />
        <div className="absolute top-0 left-0 h-full w-[2px] bg-sky-400/55" />
      </div>

      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-500 pointer-events-none">
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(56,189,248,0.05), transparent 45%)",
          }}
        />
      </div>

      <div className="relative z-10 p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <div
              className="mb-2 inline-flex items-center gap-2 px-2.5 py-1 rounded-full border"
              style={{
                borderColor: "rgba(56,189,248,0.1)",
                background: "rgba(56,189,248,0.035)",
              }}
            >
              <Globe2 size={12} className="text-sky-400" />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  letterSpacing: "0.14em",
                  color: "rgba(56,189,248,0.65)",
                  textTransform: "uppercase",
                }}
              >
                {region.code}
              </span>
            </div>

            <h3
              className="text-white text-base sm:text-lg mb-1"
              style={{
                fontFamily: "'Orbitron', sans-serif",
                letterSpacing: "0.04em",
                fontWeight: 700,
              }}
            >
              {region.name}
            </h3>

            <p
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "10px",
                color: "rgba(148,163,184,0.54)",
                letterSpacing: "0.03em",
                lineHeight: 1.55,
              }}
            >
              Run distributed website checks from this region.
            </p>
          </div>

          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center border"
            style={{
              borderColor: "rgba(56,189,248,0.1)",
              background: "rgba(255,255,255,0.02)",
            }}
          >
            <Activity size={15} className="text-sky-400" />
          </div>
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-white/5">
          <StatusDot color="#34d399" label={region.status} />

          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className="group/btn inline-flex items-center gap-2 px-3.5 py-2 rounded-xl"
            style={{
              background:
                "linear-gradient(135deg, rgba(56,189,248,0.09) 0%, rgba(129,140,248,0.08) 100%)",
              border: "1px solid rgba(56,189,248,0.16)",
              color: "white",
              fontFamily: "'Orbitron', sans-serif",
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.14em",
              boxShadow: "0 0 14px rgba(56,189,248,0.04)",
            }}
          >
            CHECK
            <ArrowRight
              size={13}
              className="transition-transform duration-300 group-hover/btn:translate-x-1"
            />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};

// ─── Main Component ───────────────────────────────────────────────────────────
const RegionsComponent = ({ onRegionClick }) => {
  return (
    <>
      <FontLoader />

      <FullPageBackground />
      <CursorGlow />
      <OrbitRing radius={230} duration={18} dotCount={8} color="#38bdf8" tilt={72} />
      <OrbitRing radius={310} duration={28} dotCount={12} color="#818cf8" tilt={68} delay={1} />

      {["tl", "tr", "bl", "br"].map((p, i) => (
        <HUDCorner key={p} pos={p} delay={0.08 + i * 0.04} />
      ))}

      <div className="relative z-10 min-h-screen w-full text-white px-4 sm:px-5 lg:px-8 xl:px-10 py-5 lg:py-6">
        {/* Top Bar */}
        <motion.div
          initial={{ opacity: 0, y: -12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3 mb-5"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center border"
              style={{
                borderColor: "rgba(56,189,248,0.12)",
                background: "rgba(56,189,248,0.04)",
                boxShadow: "0 0 18px rgba(56,189,248,0.04)",
              }}
            >
              <Radar size={17} className="text-sky-400" />
            </div>

            <div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  fontSize: "13px",
                  letterSpacing: "0.08em",
                  color: "white",
                }}
              >
                REGION NETWORK
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "rgba(148,163,184,0.48)",
                  letterSpacing: "0.04em",
                }}
              >
                Distributed monitoring control
              </div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <StatusDot color="#34d399" label="Monitoring Active" />
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border"
              style={{
                borderColor: "rgba(56,189,248,0.1)",
                background: "rgba(255,255,255,0.025)",
              }}
            >
              <ShieldCheck size={12} className="text-sky-400" />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  letterSpacing: "0.12em",
                  color: "rgba(56,189,248,0.62)",
                  textTransform: "uppercase",
                }}
              >
                Secure Nodes
              </span>
            </div>
          </div>
        </motion.div>

        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.5 }}
          className="mb-6"
        >
          <div className="flex items-center gap-3 mb-2">
            <div className="h-[1px] w-8 bg-sky-400/25" />
            <span
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "8px",
                letterSpacing: "0.24em",
                color: "rgba(56,189,248,0.42)",
                textTransform: "uppercase",
              }}
            >
              Global Monitoring Grid
            </span>
            <div className="h-[1px] flex-1 bg-sky-400/8" />
          </div>

          <h1
            className="text-xl sm:text-2xl lg:text-3xl xl:text-4xl leading-none mb-2"
            style={{
              fontFamily: "'Orbitron', sans-serif",
              fontWeight: 800,
              letterSpacing: "0.05em",
              textShadow: "0 0 28px rgba(56,189,248,0.12)",
            }}
          >
            REGIONS
          </h1>

          <p
            className="max-w-3xl"
            style={{
              fontFamily: "'JetBrains Mono', monospace",
              fontSize: "10px",
              color: "rgba(148,163,184,0.56)",
              letterSpacing: "0.03em",
              lineHeight: 1.75,
            }}
          >
            Select a region to inspect websites and trigger distributed uptime checks
            across geographical zones.
          </p>
        </motion.div>

        {/* Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-4 pb-4">
          {regions.map((region, index) => (
            <RegionCard
              key={region.name}
              region={region}
              index={index}
              onClick={() => onRegionClick(region.name)}
            />
          ))}
        </div>
      </div>
    </>
  );
};

export default RegionsComponent;