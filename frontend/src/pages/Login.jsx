import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff } from "lucide-react";
import { motion, AnimatePresence, useMotionValue, useSpring } from "framer-motion";
import { scheduleProactiveRefresh } from "../api/setupAxios"; // ← NEW
import { useTheme } from "../contexts/ThemeContext";

const API_URL = import.meta.env.VITE_API_URL;

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
const CursorGlow = ({ currentTheme }) => {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 100, damping: 22 });
  const sy = useSpring(y, { stiffness: 100, damping: 22 });
  useEffect(() => {
    const fn = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [x, y]);
  return (
    <motion.div
      className="pointer-events-none fixed z-0"
      style={{
        left: sx, top: sy,
        translateX: "-50%", translateY: "-50%",
        width: 500, height: 500, borderRadius: "50%",
        background: `radial-gradient(circle, ${currentTheme.accent}10 0%, transparent 70%)`,
      }}
    />
  );
};

// ─── Background Layers ────────────────────────────────────────────────────────
const Background = ({ currentTheme }) => (
  <>
    <div className="pointer-events-none absolute inset-0 z-0" style={{
      background: `radial-gradient(ellipse 70% 50% at 50% 30%, ${currentTheme.accent}10 0%, transparent 100%)`,
    }} />
    <div className="pointer-events-none absolute z-0" style={{
      top: "65%", left: "20%", width: 400, height: 400,
      background: `radial-gradient(ellipse, ${currentTheme.accent}08 0%, transparent 65%)`,
      filter: "blur(80px)",
    }} />
    <div className="pointer-events-none absolute z-0" style={{
      top: "40%", right: "10%", width: 320, height: 320,
      background: `radial-gradient(ellipse, ${currentTheme.success}08 0%, transparent 65%)`,
      filter: "blur(70px)",
    }} />
    <div className="pointer-events-none absolute inset-0 z-0" style={{
      backgroundImage: `linear-gradient(${currentTheme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.gridColor} 1px, transparent 1px)`,
      backgroundSize: "40px 40px",
    }} />
    <div className="pointer-events-none absolute bottom-0 left-0 right-0 z-0" style={{ height: "40%", overflow: "hidden" }}>
      <svg width="100%" height="100%" viewBox="0 0 1200 380" preserveAspectRatio="none"
        xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.07 }}>
        {[0.1, 0.2, 0.34, 0.5, 0.68, 0.88, 1.0].map((t, i) => (
          <line key={`h${i}`} x1={600 - 600 * t} y1={380 * t} x2={600 + 600 * t} y2={380 * t}
            stroke="#38bdf8" strokeWidth={0.4 + t * 0.6} />
        ))}
        {Array.from({ length: 17 }, (_, i) => {
          const s = (i - 8) / 8;
          return <line key={`v${i}`} x1={600} y1={0} x2={600 + s * 600} y2={380}
            stroke="#38bdf8" strokeWidth={0.35} />;
        })}
      </svg>
      <div className="absolute inset-0" style={{
        background: `linear-gradient(to bottom, ${currentTheme.bg} 0%, transparent 45%)`,
      }} />
    </div>
    <motion.div
      className="pointer-events-none absolute inset-0 z-[2]"
      style={{
        background: `linear-gradient(to bottom, transparent 48%, ${currentTheme.accent}08 50%, transparent 52%)`,
      }}
      animate={{ y: ["-100%", "100%"] }}
      transition={{ duration: 4.5, repeat: Infinity, ease: "linear", repeatDelay: 2.5 }}
    />
  </>
);

// ─── HUD Corner ───────────────────────────────────────────────────────────────
const HUDCorner = ({ pos, delay = 0, currentTheme }) => {
  const cls = { tl: "top-5 left-5", tr: "top-5 right-5", bl: "bottom-5 left-5", br: "bottom-5 right-5" };
  const rot = { tl: "0deg", tr: "90deg", bl: "-90deg", br: "180deg" };
  return (
    <motion.div
      className={`absolute ${cls[pos]} w-9 h-9 z-20`}
      style={{ transform: `rotate(${rot[pos]})` }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ delay, duration: 0.5, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div className="absolute top-0 left-0 h-[2px]"
        initial={{ width: 0 }} animate={{ width: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.4 }}
        style={{ background: currentTheme.accent }} />
      <motion.div className="absolute top-0 left-0 w-[2px]"
        initial={{ height: 0 }} animate={{ height: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.4 }}
        style={{ background: currentTheme.accent }} />
    </motion.div>
  );
};

// ─── Floating Glyphs ──────────────────────────────────────────────────────────
const GLYPHS = "01アイウエオ∑∆∇λΩ∞ABCDEF01101100≈∈";
const FloatingGlyph = ({ i, currentTheme }) => {
  const char = GLYPHS[Math.floor(Math.random() * GLYPHS.length)];
  const x = Math.random() * 100;
  const dur = 7 + Math.random() * 9;
  const delay = Math.random() * 5;
  const op = 0.03 + Math.random() * 0.08;
  return (
    <motion.span
      className="absolute pointer-events-none"
      style={{
        left: `${x}%`, bottom: "-5%",
        fontSize: Math.random() > 0.7 ? 11 : 9,
        color: `${currentTheme.accent}${Math.round(op * 255).toString(16).padStart(2, '0')}`,
        fontFamily: "'JetBrains Mono', monospace",
      }}
      animate={{ y: [0, -(window.innerHeight + 80)], opacity: [0, op * 9, 0] }}
      transition={{ duration: dur, delay, repeat: Infinity, ease: "linear" }}
    >
      {char}
    </motion.span>
  );
};

// ─── Orbit Ring ───────────────────────────────────────────────────────────────
const OrbitRing = ({ radius, duration, dotCount, color, delay = 0, tilt = 70 }) => (
  <motion.div
    className="absolute pointer-events-none"
    style={{
      width: radius * 2, height: radius * 2,
      top: "50%", left: "50%",
      marginTop: -radius, marginLeft: -radius,
      transform: `perspective(900px) rotateX(${tilt}deg)`,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <div className="absolute inset-0 rounded-full"
      style={{ border: `1px solid ${color}20` }} />
    {Array.from({ length: dotCount }, (_, i) => {
      const angle = (i / dotCount) * 2 * Math.PI;
      const cx = Math.cos(angle) * radius + radius;
      const cy = Math.sin(angle) * radius + radius;
      return (
        <motion.div key={i} className="absolute rounded-full"
          style={{
            width: i === 0 ? 5 : 2, height: i === 0 ? 5 : 2,
            background: i === 0 ? color : `${color}60`,
            left: cx - (i === 0 ? 2.5 : 1),
            top: cy - (i === 0 ? 2.5 : 1),
            boxShadow: i === 0 ? `0 0 10px ${color}` : "none",
          }}
          animate={i === 0 ? { opacity: [1, 0.3, 1] } : {}}
          transition={{ duration: 1.8, repeat: Infinity }}
        />
      );
    })}
  </motion.div>
);

// ─── Card HUD Frame ───────────────────────────────────────────────────────────
const CardHUD = ({ currentTheme }) => (
  <>
    <div className="absolute top-0 left-0 right-0 h-[1px]"
      style={{ background: `linear-gradient(90deg, transparent 0%, ${currentTheme.accent}80 30%, ${currentTheme.accentSecondary}80 70%, transparent 100%)` }} />
    <div className="absolute bottom-0 left-0 right-0 h-[1px]"
      style={{ background: `linear-gradient(90deg, transparent 0%, ${currentTheme.accent}40 50%, transparent 100%)` }} />
    <div className="absolute top-0 left-0 w-5 h-5">
      <div className="absolute top-0 left-0 w-full h-[2px]" style={{ background: currentTheme.accent }} />
      <div className="absolute top-0 left-0 h-full w-[2px]" style={{ background: currentTheme.accent }} />
    </div>
    <div className="absolute top-0 right-0 w-5 h-5">
      <div className="absolute top-0 right-0 w-full h-[2px]" style={{ background: currentTheme.accent }} />
      <div className="absolute top-0 right-0 h-full w-[2px]" style={{ background: currentTheme.accent }} />
    </div>
    <div className="absolute bottom-0 left-0 w-5 h-5">
      <div className="absolute bottom-0 left-0 w-full h-[2px]" style={{ background: `${currentTheme.accent}60` }} />
      <div className="absolute bottom-0 left-0 h-full w-[2px]" style={{ background: `${currentTheme.accent}60` }} />
    </div>
    <div className="absolute bottom-0 right-0 w-5 h-5">
      <div className="absolute bottom-0 right-0 w-full h-[2px]" style={{ background: `${currentTheme.accent}60` }} />
      <div className="absolute bottom-0 right-0 h-full w-[2px]" style={{ background: `${currentTheme.accent}60` }} />
    </div>
  </>
);

// ─── Animated Input ───────────────────────────────────────────────────────────
const HUDInput = ({ label, type = "text", value, onChange, required, rightSlot, placeholder, delay = 0, currentTheme }) => {
  const [focused, setFocused] = useState(false);
  return (
    <motion.div
      className="flex flex-col gap-1.5"
      initial={{ opacity: 0, x: -16 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
    >
      <label style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "9px",
        letterSpacing: "0.3em",
        color: focused ? `${currentTheme.accent}bb` : `${currentTheme.accent}60`,
        textTransform: "uppercase",
        transition: "color 0.2s",
      }}>
        {label}
      </label>
      <div className="relative">
        <motion.div
          className="absolute bottom-0 left-0 h-[1px] rounded-full"
          animate={{ width: focused ? "100%" : "0%", opacity: focused ? 1 : 0 }}
          transition={{ duration: 0.3 }}
          style={{ background: `linear-gradient(90deg, ${currentTheme.accent}, ${currentTheme.accentSecondary})` }}
        />
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          required={required}
          style={{
            width: "100%",
            padding: "12px 44px 12px 14px",
            background: focused ? `${currentTheme.accent}10` : currentTheme.bgInput,
            border: `1px solid ${focused ? `${currentTheme.accent}70` : currentTheme.borderAccent}`,
            borderRadius: "6px",
            color: currentTheme.text,
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "13px",
            letterSpacing: "0.05em",
            outline: "none",
            transition: "background 0.2s, border-color 0.2s",
          }}
          className="placeholder-slate-600"
        />
        {rightSlot && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">{rightSlot}</div>
        )}
      </div>
    </motion.div>
  );
};

// ─── Pulsing Status Dot ───────────────────────────────────────────────────────
const StatusDot = ({ color, label, currentTheme }) => (
  <div className="flex items-center gap-2">
    <div className="relative w-2 h-2">
      <motion.div className="absolute inset-0 rounded-full"
        style={{ background: color }}
        animate={{ scale: [1, 2.2], opacity: [0.5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }} />
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
    </div>
    {label && (
      <span style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "8px",
        letterSpacing: "0.22em",
        color: currentTheme.textSecondary,
        textTransform: "uppercase",
      }}>{label}</span>
    )}
  </div>
);

// ─── Main Login Component ─────────────────────────────────────────────────────
const Login = ({ onLogin }) => {
  const { currentTheme } = useTheme();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loginSuccess, setLoginSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/auth/login`,
        { email, password },
        { withCredentials: true }
      );

      const { accessToken, user } = res.data;

      localStorage.setItem("loginToken", accessToken);
      localStorage.setItem("user", JSON.stringify(user));

      // ── Start the proactive refresh timer immediately after login ──
      scheduleProactiveRefresh(accessToken);

      setLoginSuccess(true);
      setTimeout(() => onLogin(user), 900);
    } catch (err) {
      setError(err.response?.data?.message || "Authentication failed");
      setLoading(false);
    }
  };

  return (
    <>
      <FontLoader />
      <div className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{ background: currentTheme.bg }}>

        <CursorGlow currentTheme={currentTheme} />
        <Background currentTheme={currentTheme} />

        <OrbitRing radius={240} duration={16} dotCount={8} color={currentTheme.accent} tilt={72} />
        <OrbitRing radius={310} duration={26} dotCount={12} color={currentTheme.accentSecondary} tilt={68} delay={1} />

        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {Array.from({ length: 30 }).map((_, i) => <FloatingGlyph key={i} i={i} currentTheme={currentTheme} />)}
        </div>

        {["tl", "tr", "bl", "br"].map((p, i) => (
          <HUDCorner key={p} pos={p} delay={0.1 + i * 0.05} currentTheme={currentTheme} />
        ))}

        <motion.div
          className="absolute top-6 right-10 z-20"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.2em", color: `${currentTheme.accent}50` }}
        >
          {new Date().toISOString().replace("T", " ").slice(0, 19)} UTC
        </motion.div>

        <motion.div
          className="absolute bottom-6 left-8 z-20"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
        >
          <StatusDot color={currentTheme.success} label="Auth Service Online" currentTheme={currentTheme} />
        </motion.div>

        <motion.div
          className="absolute bottom-6 right-8 z-20"
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}
          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.2em", color: currentTheme.textMuted }}
        >
          v2.4.1 · PROD
        </motion.div>

        {/* ── The Card ── */}
        <AnimatePresence>
          {!loginSuccess ? (
            <motion.div
              key="card"
              className="relative z-10 w-full max-w-[420px] mx-4"
              initial={{ opacity: 0, y: 32, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 1.08, filter: "blur(10px) brightness(2)", y: -20 }}
              transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            >
              <div
                className="relative overflow-hidden"
                style={{
                  background: currentTheme.bgCard,
                  border: `1px solid ${currentTheme.borderAccent}`,
                  borderRadius: "12px",
                  backdropFilter: "blur(24px)",
                  boxShadow: currentTheme.shadowGlow,
                  padding: "40px 36px 36px",
                }}
              >
                <CardHUD currentTheme={currentTheme} />

                <motion.div
                  className="mb-8"
                  initial={{ opacity: 0, y: -12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25, duration: 0.55 }}
                >
                  <div className="flex items-center gap-2.5 mb-4">
                    <motion.div className="h-[1px]"
                      initial={{ width: 0 }} animate={{ width: 20 }}
                      transition={{ delay: 0.4, duration: 0.4 }}
                      style={{ background: `${currentTheme.accent}50` }} />
                    <span style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "8px",
                      letterSpacing: "0.4em",
                      color: `${currentTheme.accent}70`,
                      textTransform: "uppercase",
                    }}>
                      Secure Access Portal
                    </span>
                    <motion.div className="h-[1px] flex-1"
                      initial={{ scaleX: 0 }} animate={{ scaleX: 1 }}
                      transition={{ delay: 0.5, duration: 0.5, transformOrigin: "left" }}
                      style={{ background: `${currentTheme.accent}20` }} />
                  </div>

                  <h1 style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 900,
                    fontSize: "1.75rem",
                    letterSpacing: "0.12em",
                    color: currentTheme.text,
                    lineHeight: 1,
                    textShadow: `0 0 40px ${currentTheme.accent}30`,
                    marginBottom: "6px",
                  }}>
                    PULSE
                  </h1>
                  <p style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "10px",
                    letterSpacing: "0.2em",
                    color: currentTheme.textMuted,
                    textTransform: "uppercase",
                  }}>
                    Authenticate to continue
                  </p>
                </motion.div>

                <motion.div
                  className="flex items-center gap-3 mb-7"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
                >
                  <div className="flex-1 h-[1px]" style={{ background: `linear-gradient(90deg, transparent, ${currentTheme.accent}30)` }} />
                  <div className="w-1 h-1 rounded-full" style={{ background: `${currentTheme.accent}50` }} />
                  <div className="flex-1 h-[1px]" style={{ background: `linear-gradient(90deg, ${currentTheme.accent}30, transparent)` }} />
                </motion.div>

                <AnimatePresence>
                  {error && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: -8, height: 0 }}
                      className="mb-5 overflow-hidden"
                    >
                      <div style={{
                        background: currentTheme.errorBg,
                        border: `1px solid ${currentTheme.error}40`,
                        borderRadius: "6px",
                        padding: "10px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: "10px",
                      }}>
                        <div style={{
                          width: 6, height: 6, borderRadius: "50%",
                          background: currentTheme.error, flexShrink: 0,
                          boxShadow: `0 0 8px ${currentTheme.error}`,
                        }} />
                        <span style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "11px",
                          color: currentTheme.error,
                          letterSpacing: "0.04em",
                        }}>
                          {error}
                        </span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                  <HUDInput
                    label="Identifier / Email"
                    type="email"
                    placeholder="user@domain.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    delay={0.35}
                    currentTheme={currentTheme}
                  />

                  <HUDInput
                    label="Access Key"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    delay={0.45}
                    currentTheme={currentTheme}
                    rightSlot={
                      <button
                        type="button"
                        onClick={() => setShowPassword((p) => !p)}
                        aria-label={showPassword ? "Hide password" : "Show password"}
                        style={{
                          background: "none",
                          border: "none",
                          cursor: "pointer",
                          color: currentTheme.textMuted,
                          padding: 4,
                          display: "flex",
                          alignItems: "center",
                          transition: "color 0.2s",
                        }}
                        onMouseEnter={(e) => (e.currentTarget.style.color = currentTheme.accent)}
                        onMouseLeave={(e) => (e.currentTarget.style.color = currentTheme.textMuted)}
                      >
                        {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    }
                  />

                  <motion.button
                    type="submit"
                    disabled={loading}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.55, duration: 0.45 }}
                    whileHover={{ scale: loading ? 1 : 1.015 }}
                    whileTap={{ scale: loading ? 1 : 0.985 }}
                    style={{
                      marginTop: "4px",
                      width: "100%",
                      padding: "13px 0",
                      borderRadius: "6px",
                      border: `1px solid ${currentTheme.accent}40`,
                      background: loading
                        ? `${currentTheme.accent}10`
                        : currentTheme.gradientPrimary,
                      color: loading ? `${currentTheme.accent}60` : currentTheme.text,
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: 700,
                      fontSize: "11px",
                      letterSpacing: "0.25em",
                      cursor: loading ? "not-allowed" : "pointer",
                      position: "relative",
                      overflow: "hidden",
                      transition: "background 0.3s, color 0.3s, border-color 0.3s",
                      boxShadow: loading ? "none" : currentTheme.shadowGlow,
                    }}
                  >
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background: `linear-gradient(105deg, transparent 30%, ${currentTheme.accent}15 50%, transparent 70%)`,
                      }}
                      animate={{ x: ["-100%", "200%"] }}
                      transition={{ duration: 2.5, repeat: Infinity, repeatDelay: 1.5, ease: "easeInOut" }}
                    />
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <motion.span
                          style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: currentTheme.accent }}
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
                        />
                        <motion.span
                          style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: currentTheme.accent }}
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
                        />
                        <motion.span
                          style={{ display: "inline-block", width: 6, height: 6, borderRadius: "50%", background: currentTheme.accent }}
                          animate={{ scale: [1, 1.5, 1], opacity: [0.5, 1, 0.5] }}
                          transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
                        />
                      </span>
                    ) : (
                      "AUTHENTICATE"
                    )}
                  </motion.button>
                </form>

                <motion.div
                  className="flex items-center justify-between mt-6"
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65 }}
                >
                  <StatusDot color={currentTheme.success} label="Secure" currentTheme={currentTheme} />
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "8px",
                    letterSpacing: "0.18em",
                    color: currentTheme.textMuted,
                    textTransform: "uppercase",
                  }}>
                    TLS 1.3 · AES-256
                  </span>
                </motion.div>
              </div>

              <motion.div
                className="absolute inset-0 rounded-xl pointer-events-none"
                style={{ border: `1px solid ${currentTheme.accent}15`, borderRadius: "12px" }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 3, repeat: Infinity }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="success"
              className="relative z-10 flex flex-col items-center gap-5"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="relative w-20 h-20">
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: `1px solid ${currentTheme.accent}50` }}
                  animate={{ scale: [1, 1.6], opacity: [0.6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity }}
                />
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{ border: `1px solid ${currentTheme.accent}35` }}
                  animate={{ scale: [1, 2.2], opacity: [0.4, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: 0.3 }}
                />
                <div className="absolute inset-0 rounded-full flex items-center justify-center"
                  style={{ border: `1px solid ${currentTheme.accent}70`, background: `${currentTheme.accent}10` }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <motion.path
                      d="M5 13l4 4L19 7"
                      stroke={currentTheme.accent} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                      transition={{ duration: 0.5, delay: 0.1 }}
                    />
                  </svg>
                </div>
              </div>
              <div style={{
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 700, fontSize: "13px",
                letterSpacing: "0.3em", color: currentTheme.accent,
                textTransform: "uppercase",
              }}>
                Access Granted
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px", letterSpacing: "0.25em",
                color: currentTheme.textMuted, textTransform: "uppercase",
              }}>
                Redirecting to dashboard…
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export default Login;