import { useState, useEffect, useCallback, useRef } from "react";
import {
  Settings,
  LogOut,
  Shield,
  X,
  FileText,
  Upload,
  ChevronRight,
  User2,
  PanelTop,
  Activity,
  Sun,
  Moon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useTheme } from "../contexts/ThemeContext";

// ─── Helpers ────────────────────────────────────────────────────────────────

const getInitials = (name = "") =>
  name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("") || "U";

const ROLE_CONFIG = {
  SUPERADMIN: {
    label: "Superadmin",
    icon: <Shield size={9} />,
    cls: "bg-violet-500/10 text-violet-300 border-violet-400/20",
  },
  ADMIN: {
    label: "Admin",
    icon: <Shield size={9} />,
    cls: "bg-purple-500/10 text-purple-300 border-purple-400/20",
  },
  VIEWER: {
    label: "Viewer",
    icon: <User2 size={9} />,
    cls: "bg-slate-500/10 text-slate-300 border-slate-400/20",
  },
};

const getRoleConfig = (role = "USER") =>
  ROLE_CONFIG[role] ?? {
    label: role,
    icon: <User2 size={9} />,
    cls: "bg-sky-500/10 text-sky-300 border-sky-400/20",
  };

// ─── Sub-components ─────────────────────────────────────────────────────────

const GlassCard = ({ children, className = "", style = {}, ...rest }) => {
  const { currentTheme } = useTheme();
  return (
    <div
      className={`relative overflow-hidden rounded-2xl ${className}`}
      style={{
        background: currentTheme.bgCard,
        border: `1px solid ${currentTheme.border}`,
        backdropFilter: "blur(18px)",
        ...style,
      }}
      {...rest}
    >
      {/* top-edge highlight */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px"
        style={{
          background: currentTheme.gradientTopBar,
        }}
      />
      {children}
    </div>
  );
};

const ToggleSwitch = ({ isOn, onToggle, accent = "#38bdf8" }) => {
  const { currentTheme } = useTheme();
  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={onToggle}
      className="relative w-12 h-6 rounded-full transition-colors duration-300"
      style={{
        background: isOn ? accent : currentTheme.bgInput,
        border: `1px solid ${isOn ? accent : currentTheme.borderLight}`,
      }}
    >
      <motion.div
        animate={{ x: isOn ? 24 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
        className="absolute top-1 w-4 h-4 rounded-full shadow-md"
        style={{
          background: isOn ? "#ffffff" : currentTheme.textMuted,
        }}
      />
    </motion.button>
  );
};

const SectionLabel = ({ children }) => (
  <div className="flex items-center gap-2 mb-2">
    <div className="h-px w-6 bg-sky-400/25" />
    <span
      className="uppercase tracking-[.20em] text-[8px] text-sky-400/45"
      style={{ fontFamily: "'JetBrains Mono',monospace" }}
    >
      {children}
    </span>
  </div>
);

// ─── Menu Item ───────────────────────────────────────────────────────────────

const MenuItem = ({ icon, accent = "#38bdf8", title, subtitle, onClick, delay = 0 }) => {
  const { currentTheme } = useTheme();
  return (
    <motion.button
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay, duration: 0.22 }}
      whileHover={{ x: 2 }}
      whileTap={{ scale: 0.985 }}
      onClick={onClick}
      className="w-full group relative overflow-hidden flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200"
      style={{
        background: currentTheme.bgInput,
        border: `1px solid ${currentTheme.borderLight}`,
      }}
    >
      {/* hover glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-xl"
        style={{
          background: `radial-gradient(ellipse 60% 80% at 10% 50%, ${accent}12, transparent)`,
        }}
      />

      <div className="relative z-10 flex items-center gap-3 min-w-0">
        <div
          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
          style={{
            background: `${accent}12`,
            border: `1px solid ${accent}20`,
          }}
        >
          {icon}
        </div>

        <div className="text-left min-w-0">
          <p
            className="text-[11px] font-semibold tracking-wide truncate"
            style={{ fontFamily: "'Orbitron',sans-serif", letterSpacing: ".04em", color: currentTheme.text }}
          >
            {title}
          </p>
          <p
            className="text-[9px] mt-0.5 truncate"
            style={{
              fontFamily: "'JetBrains Mono',monospace",
              color: currentTheme.textMuted,
            }}
          >
            {subtitle}
          </p>
        </div>
      </div>

      <ChevronRight
        size={14}
        className="relative z-10 shrink-0 transition-colors duration-200"
        style={{ color: currentTheme.textMuted }}
      />
    </motion.button>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────────

const SettingsMenu = ({ onLogout }) => {
  const [open, setOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const closeTimeoutRef = useRef(null);
  const { theme, toggleTheme, currentTheme } = useTheme();

  const user = (() => {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  })();

  const role = user?.role ?? "USER";
  const isSuperAdmin = role === "SUPERADMIN";
  const isViewer = role === "VIEWER";
  const roleConfig = getRoleConfig(role);
  const initials = getInitials(user?.name);

  // ── keyboard & focus trap ────────────────────────────────────────────────
  const panelRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    const el = panelRef.current;
    if (!el) return;

    // shift focus into panel on open
    const firstFocusable = el.querySelector("button, [tabindex='0']");
    firstFocusable?.focus();

    const handleKey = (e) => {
      if (e.key === "Escape") {
        setOpen(false);
        setLogoutConfirm(false);
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  // ── body scroll lock ─────────────────────────────────────────────────────
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // ── cleanup timeout on unmount ───────────────────────────────────────────
  useEffect(() => () => clearTimeout(closeTimeoutRef.current), []);

  const handleClose = useCallback(() => {
    setOpen(false);
    setLogoutConfirm(false);
  }, []);

  const handleNavigate = useCallback((path) => {
    handleClose();
    // slight delay lets the panel animate out
    closeTimeoutRef.current = setTimeout(() => navigate(path), 220);
  }, [handleClose, navigate]);

  const handleLogoutClick = () => {
    if (logoutConfirm) {
      handleClose();
      onLogout?.();
    } else {
      setLogoutConfirm(true);
    }
  };

  // ── animation variants ───────────────────────────────────────────────────
  const panelVariants = {
    hidden: prefersReducedMotion
      ? { opacity: 0 }
      : { x: "100%", opacity: 0.7 },
    visible: prefersReducedMotion
      ? { opacity: 1 }
      : { x: 0, opacity: 1, transition: { type: "spring", stiffness: 130, damping: 20 } },
    exit: prefersReducedMotion
      ? { opacity: 0 }
      : { x: "100%", opacity: 0.7, transition: { duration: 0.2, ease: "easeIn" } },
  };

  const overlayVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1 },
    exit: { opacity: 0 },
  };

  return (
    <>
      {/* ── Trigger Button ─────────────────────────────────────────────── */}
      <motion.button
        whileHover={{ y: -1, scale: 1.03 }}
        whileTap={{ scale: 0.96 }}
        onClick={() => setOpen(true)}
        aria-label="Open settings"
        aria-haspopup="dialog"
        aria-expanded={open}
        className="relative flex items-center justify-center p-2 md:p-2.5 rounded-xl overflow-hidden"
        style={{
          background: currentTheme.bgInput,
          border: `1px solid ${currentTheme.borderAccent}`,
          backdropFilter: "blur(16px)",
          boxShadow: currentTheme.shadow,
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background: `linear-gradient(135deg,${currentTheme.accent}12 0%,${currentTheme.accent}08 100%)`,
          }}
        />
        <Settings size={17} className="relative z-10" style={{ color: currentTheme.text }} />
      </motion.button>

      {/* ── Panel + Overlay ────────────────────────────────────────────── */}
      <AnimatePresence>
        {open && (
          <>
            {/* Overlay */}
            <motion.div
              key="overlay"
              variants={overlayVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              transition={{ duration: 0.2 }}
              onClick={handleClose}
              className="fixed inset-0 z-40"
              style={{ background: currentTheme.bgOverlay, backdropFilter: "blur(6px)" }}
              aria-hidden
            />

            {/* Panel */}
            <motion.aside
              key="panel"
              ref={panelRef}
              role="dialog"
              aria-modal="true"
              aria-label="Settings"
              variants={panelVariants}
              initial="hidden"
              animate="visible"
              exit="exit"
              className="fixed top-0 right-0 h-full z-50 flex flex-col
                         w-[280px] sm:w-[320px] lg:w-[360px] overflow-hidden"
              style={{
                background: currentTheme.bgPanel,
                borderLeft: `1px solid ${currentTheme.border}`,
                backdropFilter: "blur(24px)",
                boxShadow: currentTheme.shadow,
              }}
            >
              {/* decorative bg */}
              <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background: `radial-gradient(ellipse 70% 50% at 90% 0%,${currentTheme.accent}12,transparent)`,
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `linear-gradient(${currentTheme.gridColor} 1px,transparent 1px),linear-gradient(90deg,${currentTheme.gridColor} 1px,transparent 1px)`,
                    backgroundSize: "40px 40px",
                  }}
                />
                {/* top rainbow bar */}
                <div
                  className="absolute top-0 inset-x-0 h-px"
                  style={{
                    background: currentTheme.gradientTopBar,
                  }}
                />
              </div>

              {/* ── Header ─────────────────────────────────────────────── */}
              <div className="relative z-10 px-4 pt-4 pb-3 border-b shrink-0" style={{ borderColor: currentTheme.borderLight }}>
                <div className="flex items-center justify-between">
                  <div>
                    <SectionLabel>Control Panel</SectionLabel>
                    <h2
                      className="text-base tracking-wider"
                      style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700, color: currentTheme.text }}
                    >
                      SETTINGS
                    </h2>
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.06, rotate: 90 }}
                    whileTap={{ scale: 0.94 }}
                    transition={{ duration: 0.18 }}
                    onClick={handleClose}
                    aria-label="Close settings"
                    className="w-9 h-9 rounded-xl flex items-center justify-center"
                    style={{
                      background: currentTheme.bgInput,
                      border: `1px solid ${currentTheme.borderLight}`,
                    }}
                  >
                    <X size={15} style={{ color: currentTheme.textMuted }} />
                  </motion.button>
                </div>
              </div>

              {/* ── Body (scrollable) ───────────────────────────────────── */}
              <div className="relative z-10 flex-1 overflow-y-auto overscroll-contain px-4 py-4 space-y-4">

                {/* User Card */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.06 }}
                >
                  <GlassCard className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div
                          className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-sm font-extrabold"
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            letterSpacing: ".06em",
                            background: `linear-gradient(135deg,${currentTheme.accent},${currentTheme.accent})`,
                            boxShadow: `0 0 24px ${currentTheme.accent}30`,
                          }}
                        >
                          {initials}
                        </div>
                        {/* online dot */}
                        <div
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2"
                          style={{ background: currentTheme.success, borderColor: currentTheme.bgSecondary }}
                        />
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className="text-[11px] font-bold truncate max-w-[130px]"
                            style={{ fontFamily: "'Orbitron',sans-serif", letterSpacing: ".04em", color: currentTheme.text }}
                          >
                            {user?.name || "User"}
                          </span>

                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full border text-[8.5px] font-medium tracking-wider ${roleConfig.cls}`}
                            style={{ fontFamily: "'JetBrains Mono',monospace" }}
                          >
                            {roleConfig.icon}
                            {roleConfig.label}
                          </span>
                        </div>

                        <p
                          className="text-[9.5px] break-all"
                          style={{
                            fontFamily: "'JetBrains Mono',monospace",
                            color: currentTheme.textMuted,
                          }}
                        >
                          {user?.email || "—"}
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                          <Activity size={10} style={{ color: currentTheme.success }} />
                          <span
                            className="text-[8px] uppercase tracking-[.12em]"
                            style={{ fontFamily: "'JetBrains Mono',monospace", color: currentTheme.success }}
                          >
                            Session Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>

                {/* Navigation */}
                <div>
                  <SectionLabel>Preferences</SectionLabel>
                  <div className="space-y-2">
                    <motion.div
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.08, duration: 0.22 }}
                      className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5"
                      style={{
                        background: currentTheme.bgInput,
                        border: `1px solid ${currentTheme.borderLight}`,
                      }}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                          style={{
                            background: `${theme === "dark" ? "#fbbf24" : "#6366f1"}12`,
                            border: `1px solid ${theme === "dark" ? "#fbbf24" : "#6366f1"}20`,
                          }}
                        >
                          {theme === "dark" ? <Sun size={16} className="text-amber-300" /> : <Moon size={16} className="text-indigo-300" />}
                        </div>
                        <div className="text-left min-w-0">
                          <p
                            className="text-[11px] font-semibold tracking-wide"
                            style={{ fontFamily: "'Orbitron',sans-serif", letterSpacing: ".04em", color: currentTheme.text }}
                          >
                            {theme === "dark" ? "Light Theme" : "Dark Theme"}
                          </p>
                          <p
                            className="text-[9px] mt-0.5"
                            style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              color: currentTheme.textMuted,
                            }}
                          >
                            {theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                          </p>
                        </div>
                      </div>
                      <ToggleSwitch
                        isOn={theme === "dark"}
                        onToggle={toggleTheme}
                        accent={theme === "dark" ? "#fbbf24" : "#6366f1"}
                      />
                    </motion.div>
                  </div>
                </div>

                {/* Navigation */}
                <div>
                  <SectionLabel>Navigation</SectionLabel>
                  <div className="space-y-2">
                    {isSuperAdmin && (
                      <MenuItem
                        icon={<FileText size={16} className="text-sky-300" />}
                        accent="#38bdf8"
                        title="Audit Logs"
                        subtitle="View full activity history"
                        delay={0.10}
                        onClick={() => handleNavigate("/logs")}
                      />
                    )}

                    {!isViewer && (
                      <MenuItem
                        icon={<Upload size={16} className="text-indigo-300" />}
                        accent="#818cf8"
                        title="Bulk Upload Sites"
                        subtitle="Import monitored URLs quickly"
                        delay={0.14}
                        onClick={() => handleNavigate("/bulk-import")}
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* ── Footer ─────────────────────────────────────────────── */}
              <div className="relative z-10 px-4 pb-4 pt-3 border-t shrink-0" style={{ borderColor: currentTheme.borderLight }}>
                <GlassCard className="p-3" style={{ background: currentTheme.bgInput }}>
                  <div className="flex items-center justify-between mb-3 px-0.5">
                    <div className="flex items-center gap-1.5">
                      <PanelTop size={12} style={{ color: currentTheme.accent }} />
                      <span
                        className="text-[8.5px] uppercase tracking-[.12em]"
                        style={{ fontFamily: "'JetBrains Mono',monospace", color: currentTheme.textMuted }}
                      >
                        Secure Session
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentTheme.success }} />
                      <span
                        className="text-[8.5px]"
                        style={{ fontFamily: "'JetBrains Mono',monospace", color: currentTheme.success }}
                      >
                        Online
                      </span>
                    </div>
                  </div>

                  <AnimatePresence mode="wait">
                    {logoutConfirm ? (
                      <motion.div
                        key="confirm"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        className="space-y-2"
                      >
                        <p
                          className="text-center text-[9px] tracking-wide"
                          style={{ fontFamily: "'JetBrains Mono',monospace", color: currentTheme.error }}
                        >
                          Confirm logout?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setLogoutConfirm(false)}
                            className="flex-1 py-2 rounded-xl text-[10px] transition-colors duration-150"
                            style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              background: currentTheme.bgInput,
                              border: `1px solid ${currentTheme.borderLight}`,
                              color: currentTheme.textMuted,
                            }}
                          >
                            Cancel
                          </button>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleLogoutClick}
                            className="flex-1 py-2 rounded-xl text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all duration-150"
                            style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              background: currentTheme.errorBg,
                              border: `1px solid ${currentTheme.error}`,
                              color: currentTheme.error,
                            }}
                          >
                            <LogOut size={12} />
                            Yes, logout
                          </motion.button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="logout"
                        initial={{ opacity: 0, y: 4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -4 }}
                        whileHover={{ y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={handleLogoutClick}
                        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-[11px] transition-all duration-200"
                        style={{
                          fontFamily: "'JetBrains Mono',monospace",
                          background: currentTheme.errorBg,
                          border: `1px solid ${currentTheme.error}`,
                          color: currentTheme.error,
                        }}
                      >
                        <LogOut size={13} />
                        Logout
                      </motion.button>
                    )}
                  </AnimatePresence>
                </GlassCard>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsMenu;