import { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";

// ─── Fonts ───────────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    const link = document.createElement("link");
    link.href =
      "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@300;400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
};

// ─── Cursor Glow ─────────────────────────────────────────────────────────────
const CursorGlow = () => {
  const x = useMotionValue(-200);
  const y = useMotionValue(-200);
  const sx = useSpring(x, { stiffness: 120, damping: 20 });
  const sy = useSpring(y, { stiffness: 120, damping: 20 });

  useEffect(() => {
    const move = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", move);
    return () => window.removeEventListener("mousemove", move);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed z-50"
      style={{
        left: sx,
        top: sy,
        translateX: "-50%",
        translateY: "-50%",
        width: 400,
        height: 400,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(56,189,248,0.07) 0%, transparent 70%)",
      }}
    />
  );
};

// ─── Noise Texture ────────────────────────────────────────────────────────────
const Noise = () => (
  <div
    className="pointer-events-none absolute inset-0 z-[1] opacity-[0.025]"
    style={{
      backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
      backgroundSize: "128px 128px",
    }}
  />
);

// ─── Fine Grid ────────────────────────────────────────────────────────────────
const Grid = () => (
  <div
    className="pointer-events-none absolute inset-0 z-0"
    style={{
      backgroundImage:
        "linear-gradient(rgba(148,163,184,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.04) 1px, transparent 1px)",
      backgroundSize: "40px 40px",
    }}
  />
);

// ─── Perspective Grid Floor ───────────────────────────────────────────────────
const PerspectiveGrid = () => (
  <div
    className="pointer-events-none absolute bottom-0 left-0 right-0 z-0"
    style={{ height: "45%", overflow: "hidden" }}
  >
    <svg
      width="100%"
      height="100%"
      viewBox="0 0 1200 400"
      preserveAspectRatio="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ opacity: 0.07 }}
    >
      {/* Horizontal lines */}
      {[0.1, 0.2, 0.32, 0.46, 0.62, 0.8, 1.0].map((t, i) => (
        <line
          key={`h${i}`}
          x1={600 - 600 * t}
          y1={400 * t}
          x2={600 + 600 * t}
          y2={400 * t}
          stroke="#38bdf8"
          strokeWidth={0.5 + t * 0.5}
        />
      ))}
      {/* Vertical perspective lines */}
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
            strokeWidth={0.4}
          />
        );
      })}
    </svg>
    {/* Fade out the grid at top */}
    <div
      className="absolute inset-0"
      style={{
        background: "linear-gradient(to bottom, #030712 0%, transparent 40%)",
      }}
    />
  </div>
);

// ─── Orbiting Ring ────────────────────────────────────────────────────────────
const OrbitRing = ({ radius, duration, dotCount, color, delay = 0, tilt = 0 }) => {
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
      {/* Ring */}
      <div
        className="absolute inset-0 rounded-full"
        style={{
          border: `1px solid ${color}18`,
          boxShadow: `inset 0 0 40px ${color}06`,
        }}
      />
      {/* Dots on ring */}
      {Array.from({ length: dotCount }, (_, i) => {
        const angle = (i / dotCount) * 2 * Math.PI;
        const cx = Math.cos(angle) * radius + radius;
        const cy = Math.sin(angle) * radius + radius;
        return (
          <motion.div
            key={i}
            className="absolute rounded-full"
            style={{
              width: i === 0 ? 5 : 2,
              height: i === 0 ? 5 : 2,
              background: i === 0 ? color : `${color}80`,
              left: cx - (i === 0 ? 2.5 : 1),
              top: cy - (i === 0 ? 2.5 : 1),
              boxShadow: i === 0 ? `0 0 10px ${color}` : "none",
            }}
            animate={i === 0 ? { opacity: [1, 0.4, 1] } : {}}
            transition={{ duration: 1.8, repeat: Infinity }}
          />
        );
      })}
    </motion.div>
  );
};

// ─── Corner HUD ───────────────────────────────────────────────────────────────
const HUDCorner = ({ pos }) => {
  const classes = {
    tl: "top-6 left-6",
    tr: "top-6 right-6",
    bl: "bottom-6 left-6",
    br: "bottom-6 right-6",
  };
  const rot = { tl: "0deg", tr: "90deg", bl: "-90deg", br: "180deg" };

  return (
    <motion.div
      className={`absolute ${classes[pos]} w-10 h-10 z-20`}
      style={{ transform: `rotate(${rot[pos]})` }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay: 0.4, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div
        className="absolute top-0 left-0 h-[2px] bg-sky-400"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: 0.6, duration: 0.4 }}
      />
      <motion.div
        className="absolute top-0 left-0 w-[2px] bg-sky-400"
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ delay: 0.6, duration: 0.4 }}
      />
      {/* Extra accent dot */}
      <motion.div
        className="absolute top-0 left-0 w-1 h-1 rounded-full bg-sky-400"
        animate={{ opacity: [1, 0.2, 1] }}
        transition={{ duration: 1.5, repeat: Infinity, delay: Math.random() }}
      />
    </motion.div>
  );
};

// ─── HUD Side Panel ───────────────────────────────────────────────────────────
const HUDPanel = ({ side }) => {
  const lines = [
    "NODE_01 ··· ACTIVE",
    "NODE_02 ··· ACTIVE",
    "NODE_03 ··· STANDBY",
    "LATENCY ··· 12ms",
    "UPLINK ···· 100%",
  ];

  return (
    <motion.div
      className={`absolute top-1/2 -translate-y-1/2 z-20 ${side === "left" ? "left-8" : "right-8"}`}
      initial={{ opacity: 0, x: side === "left" ? -20 : 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 1.4, duration: 0.6 }}
      style={{ fontFamily: "'JetBrains Mono', monospace" }}
    >
      <div
        className="flex flex-col gap-1 px-3 py-3"
        style={{
          borderLeft: side === "left" ? "1px solid rgba(56,189,248,0.2)" : "none",
          borderRight: side === "right" ? "1px solid rgba(56,189,248,0.2)" : "none",
        }}
      >
        {lines.map((line, i) => (
          <motion.div
            key={i}
            className="text-[9px] tracking-widest whitespace-nowrap"
            style={{ color: "rgba(56,189,248,0.35)" }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.6 + i * 0.08 }}
          >
            {line}
          </motion.div>
        ))}
        <motion.div
          className="mt-2 h-[1px] w-full"
          style={{ background: "linear-gradient(90deg, rgba(56,189,248,0.3), transparent)" }}
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 2.0, duration: 0.5, transformOrigin: side === "left" ? "left" : "right" }}
        />
      </div>
    </motion.div>
  );
};

// ─── Glitch Title ─────────────────────────────────────────────────────────────
const WORD = "PULSE";

const GlitchTitle = () => {
  const [glitchIdx, setGlitchIdx] = useState(-1);

  useEffect(() => {
    const cycle = () => {
      const idx = Math.floor(Math.random() * WORD.length);
      setGlitchIdx(idx);
      setTimeout(() => setGlitchIdx(-1), 80 + Math.random() * 60);
    };
    const id = setInterval(cycle, 1400 + Math.random() * 800);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      className="relative select-none leading-none"
      style={{
        fontFamily: "'Orbitron', sans-serif",
        fontSize: "clamp(4.5rem, 16vw, 8.5rem)",
        fontWeight: 900,
        letterSpacing: "0.18em",
        color: "white",
      }}
    >
      {/* Main text */}
      <div className="relative z-10 flex">
        {WORD.split("").map((ch, i) => (
          <motion.span
            key={i}
            custom={i}
            initial={{ opacity: 0, y: 40, filter: "blur(20px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: 0.6 + i * 0.1,
              duration: 0.7,
              ease: [0.16, 1, 0.3, 1],
            }}
            style={{
              position: "relative",
              display: "inline-block",
              textShadow:
                glitchIdx === i
                  ? "3px 0 #38bdf8, -3px 0 #f87171"
                  : "0 0 60px rgba(56,189,248,0.25)",
              transform: glitchIdx === i ? "translateX(2px) skewX(-3deg)" : "none",
              transition: "transform 0.04s, text-shadow 0.04s",
            }}
          >
            {ch}
          </motion.span>
        ))}
      </div>

      {/* Chromatic aberration layer */}
      <div
        className="absolute inset-0 flex pointer-events-none"
        style={{ mixBlendMode: "screen", opacity: 0.15 }}
        aria-hidden
      >
        <span
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 900,
            letterSpacing: "0.18em",
            color: "#38bdf8",
            position: "absolute",
            transform: "translate(-2px, 0)",
          }}
        >
          {WORD}
        </span>
        <span
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontWeight: 900,
            letterSpacing: "0.18em",
            color: "#f87171",
            position: "absolute",
            transform: "translate(2px, 0)",
          }}
        >
          {WORD}
        </span>
      </div>

      {/* Reflection */}
      <div
        className="absolute top-full left-0 right-0 pointer-events-none overflow-hidden"
        style={{ height: "2.5rem" }}
        aria-hidden
      >
        <div
          style={{
            fontFamily: "'Orbitron', sans-serif",
            fontSize: "clamp(4.5rem, 16vw, 8.5rem)",
            fontWeight: 900,
            letterSpacing: "0.18em",
            color: "white",
            transform: "scaleY(-1)",
            opacity: 0.06,
            filter: "blur(3px)",
            lineHeight: 1,
            maskImage: "linear-gradient(to bottom, black 0%, transparent 60%)",
            WebkitMaskImage: "linear-gradient(to bottom, black 0%, transparent 60%)",
          }}
        >
          {WORD}
        </div>
      </div>
    </div>
  );
};

// ─── Tagline Typewriter ───────────────────────────────────────────────────────
const TAGLINE = "Monitoring · Performance · Reliability";

const Typewriter = ({ delay = 1.5 }) => {
  const [displayed, setDisplayed] = useState("");
  const [started, setStarted] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), delay * 1000);
    return () => clearTimeout(t);
  }, [delay]);

  useEffect(() => {
    if (!started) return;
    let i = 0;
    const id = setInterval(() => {
      setDisplayed(TAGLINE.slice(0, ++i));
      if (i >= TAGLINE.length) clearInterval(id);
    }, 38);
    return () => clearInterval(id);
  }, [started]);

  return (
    <div
      className="flex items-center gap-1"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "0.65rem",
        letterSpacing: "0.28em",
        color: "rgba(148,163,184,0.5)",
        textTransform: "uppercase",
        minHeight: "1.2em",
      }}
    >
      <span>{displayed}</span>
      {displayed.length < TAGLINE.length && started && (
        <motion.span
          animate={{ opacity: [1, 0] }}
          transition={{ duration: 0.5, repeat: Infinity }}
          style={{ display: "inline-block", width: 6, height: "0.8em", background: "rgba(56,189,248,0.6)" }}
        />
      )}
    </div>
  );
};

// ─── Progress Assembly ────────────────────────────────────────────────────────
const PHASES = ["BOOT", "AUTH", "SYNC", "READY"];

const ProgressAssembly = () => {
  const [phase, setPhase] = useState(0);
  const [pct, setPct] = useState(0);

  useEffect(() => {
    let current = 0;
    let currentPhase = 0;
    const id = setInterval(() => {
      current += Math.ceil(Math.random() * 14);
      if (current >= 100) {
        current = 100;
        clearInterval(id);
      }
      setPct(current);
      const newPhase = Math.min(3, Math.floor((current / 100) * 4));
      if (newPhase !== currentPhase) {
        currentPhase = newPhase;
        setPhase(newPhase);
      }
    }, 55);
    return () => clearInterval(id);
  }, []);

  return (
    <motion.div
      className="flex flex-col items-center gap-4 w-72"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 0.5 }}
    >
      {/* Phase indicators */}
      <div className="flex items-center gap-0 w-full">
        {PHASES.map((label, i) => (
          <div key={i} className="flex items-center flex-1">
            <div className="flex flex-col items-center gap-1">
              <motion.div
                className="w-1.5 h-1.5 rounded-full"
                animate={{
                  background: i <= phase ? "#38bdf8" : "rgba(56,189,248,0.15)",
                  boxShadow: i === phase ? "0 0 8px #38bdf8" : "none",
                }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "8px",
                  letterSpacing: "0.15em",
                  color: i <= phase ? "rgba(56,189,248,0.7)" : "rgba(56,189,248,0.2)",
                }}
              >
                {label}
              </span>
            </div>
            {i < PHASES.length - 1 && (
              <div className="flex-1 h-[1px] mx-1" style={{ background: "rgba(56,189,248,0.1)" }}>
                <motion.div
                  className="h-full"
                  style={{ background: "#38bdf8", originX: 0 }}
                  animate={{ scaleX: i < phase ? 1 : 0 }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Progress bar */}
      <div
        className="w-full h-[3px] rounded-full overflow-hidden"
        style={{ background: "rgba(56,189,248,0.08)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{
            background: "linear-gradient(90deg, #0ea5e9, #38bdf8, #818cf8)",
            boxShadow: "0 0 12px rgba(56,189,248,0.9)",
            width: `${pct}%`,
            transition: "width 0.1s ease-out",
          }}
        />
      </div>

      {/* Counter row */}
      <div
        className="flex items-center justify-between w-full"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "9px",
          letterSpacing: "0.2em",
        }}
      >
        <motion.span
          style={{ color: "rgba(56,189,248,0.4)" }}
          animate={{ opacity: [0.4, 0.7, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          INIT SYS
        </motion.span>
        <span style={{ color: "rgba(56,189,248,0.7)" }}>
          {String(pct).padStart(3, "0")}%
        </span>
      </div>
    </motion.div>
  );
};

// ─── Floating Glyphs ──────────────────────────────────────────────────────────
const GLYPHS = "01アイウエオ∑∆∇λΩ∞≈∈ABCDEF01101100";

const FloatingGlyph = ({ i }) => {
  const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  const x = Math.random() * 100;
  const duration = 6 + Math.random() * 8;
  const delay = Math.random() * 4;
  const opacity = 0.04 + Math.random() * 0.1;
  const size = Math.random() > 0.7 ? 11 : 9;

  return (
    <motion.span
      className="absolute font-mono pointer-events-none"
      style={{
        left: `${x}%`,
        bottom: "-5%",
        fontSize: size,
        color: `rgba(56,189,248,${opacity})`,
        fontFamily: "'JetBrains Mono', monospace",
      }}
      animate={{ y: [0, -(window.innerHeight + 60)], opacity: [0, opacity * 10, 0] }}
      transition={{ duration, delay, repeat: Infinity, ease: "linear" }}
    >
      {char}
    </motion.span>
  );
};

// ─── Scanline ─────────────────────────────────────────────────────────────────
const Scanline = () => (
  <motion.div
    className="pointer-events-none absolute inset-0 z-30"
    style={{
      background:
        "linear-gradient(to bottom, transparent 48%, rgba(56,189,248,0.025) 50%, transparent 52%)",
    }}
    animate={{ y: ["-100%", "100%"] }}
    transition={{ duration: 4, repeat: Infinity, ease: "linear", repeatDelay: 2 }}
  />
);

// ─── Atmospheric Glow ─────────────────────────────────────────────────────────
const AtmoGlow = () => (
  <>
    <div
      className="pointer-events-none absolute z-0"
      style={{
        top: "30%",
        left: "50%",
        width: 700,
        height: 400,
        transform: "translate(-50%, -50%)",
        background: "radial-gradient(ellipse, rgba(56,189,248,0.05) 0%, transparent 65%)",
        filter: "blur(60px)",
      }}
    />
    <div
      className="pointer-events-none absolute z-0"
      style={{
        top: "60%",
        left: "30%",
        width: 400,
        height: 400,
        background: "radial-gradient(ellipse, rgba(129,140,248,0.04) 0%, transparent 65%)",
        filter: "blur(80px)",
      }}
    />
    <div
      className="pointer-events-none absolute z-0"
      style={{
        top: "50%",
        left: "70%",
        width: 300,
        height: 300,
        background: "radial-gradient(ellipse, rgba(16,185,129,0.03) 0%, transparent 65%)",
        filter: "blur(60px)",
      }}
    />
  </>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const PreLoginSplash = () => {
  const [visible, setVisible] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      setTimeout(() => navigate("/login", { replace: true }), 800);
    }, 3800);
    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <>
      <FontLoader />
      <AnimatePresence>
        {visible && (
          <motion.div
            key="splash"
            className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden z-[9999]"
            style={{ background: "#030712" }}
            exit={{
              opacity: 0,
              scale: 1.06,
              filter: "blur(12px) brightness(2)",
            }}
            transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
          >
            {/* Layers */}
            <AtmoGlow />
            <Grid />
            <Noise />
            <Scanline />
            <PerspectiveGrid />
            <CursorGlow />

            {/* Orbiting rings */}
            <OrbitRing radius={220} duration={14} dotCount={8} color="#38bdf8" tilt={72} />
            <OrbitRing radius={280} duration={22} dotCount={12} color="#818cf8" tilt={68} delay={1} />
            <OrbitRing radius={160} duration={9} dotCount={5} color="#10b981" tilt={75} delay={0.5} />

            {/* Floating glyphs */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 40 }).map((_, i) => (
                <FloatingGlyph key={i} i={i} />
              ))}
            </div>

            {/* HUD corners */}
            {["tl", "tr", "bl", "br"].map((p) => (
              <HUDCorner key={p} pos={p} />
            ))}

            {/* Side panels (hidden on small screens) */}
            <div className="hidden lg:block">
              <HUDPanel side="left" />
              <HUDPanel side="right" />
            </div>

            {/* Center content */}
            <div className="relative z-20 flex flex-col items-center gap-6">
              {/* Eyebrow */}
              <motion.div
                className="flex items-center gap-3"
                initial={{ opacity: 0, y: -16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              >
                <motion.div
                  className="h-[1px] bg-sky-400/30"
                  initial={{ width: 0 }}
                  animate={{ width: 32 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "0.4em",
                    color: "rgba(56,189,248,0.45)",
                    textTransform: "uppercase",
                  }}
                >
                  System Online
                </span>
                <motion.div
                  className="h-[1px] bg-sky-400/30"
                  initial={{ width: 0 }}
                  animate={{ width: 32 }}
                  transition={{ delay: 0.5, duration: 0.5 }}
                />
              </motion.div>

              {/* Main logo */}
              <GlitchTitle />

              {/* Tagline */}
              <Typewriter delay={1.6} />

              {/* Divider */}
              <motion.div
                className="flex items-center gap-4 w-72"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1.2 }}
              >
                <div className="flex-1 h-[1px]" style={{ background: "linear-gradient(90deg, transparent, rgba(56,189,248,0.2))" }} />
                <div className="w-1 h-1 rounded-full" style={{ background: "rgba(56,189,248,0.4)" }} />
                <div className="flex-1 h-[1px]" style={{ background: "linear-gradient(90deg, rgba(56,189,248,0.2), transparent)" }} />
              </motion.div>

              {/* Progress */}
              <ProgressAssembly />
            </div>

            {/* Bottom left — status */}
            <motion.div
              className="absolute bottom-7 left-8 flex items-center gap-2.5 z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.2 }}
            >
              <motion.div
                className="relative"
                style={{ width: 8, height: 8 }}
              >
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
                All Systems Nominal
              </span>
            </motion.div>

            {/* Bottom right — version */}
            <motion.div
              className="absolute bottom-7 right-8 z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.3 }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                letterSpacing: "0.22em",
                color: "rgba(100,116,139,0.5)",
              }}
            >
              v2.4.1 · PROD · BUILD 20240401
            </motion.div>

            {/* Top right — timestamp */}
            <motion.div
              className="absolute top-7 right-8 z-20"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 1.0 }}
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                letterSpacing: "0.2em",
                color: "rgba(56,189,248,0.3)",
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

export default PreLoginSplash;