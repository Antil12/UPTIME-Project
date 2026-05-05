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
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

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

const GlassCard = ({ children, className = "", style = {}, ...rest }) => (
  <div
    className={`relative overflow-hidden rounded-2xl ${className}`}
    style={{
      background: "rgba(255,255,255,0.028)",
      border: "1px solid rgba(255,255,255,0.07)",
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
        background:
          "linear-gradient(90deg,transparent 0%,rgba(56,189,248,.22) 35%,rgba(139,92,246,.18) 65%,transparent 100%)",
      }}
    />
    {children}
  </div>
);

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

const MenuItem = ({ icon, accent = "#38bdf8", title, subtitle, onClick, delay = 0 }) => (
  <motion.button
    initial={{ opacity: 0, x: 10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay, duration: 0.22 }}
    whileHover={{ x: 2 }}
    whileTap={{ scale: 0.985 }}
    onClick={onClick}
    className="w-full group relative overflow-hidden flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 transition-colors duration-200"
    style={{
      background: "rgba(255,255,255,0.025)",
      border: "1px solid rgba(255,255,255,0.06)",
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
          className="text-white text-[11px] font-semibold tracking-wide truncate"
          style={{ fontFamily: "'Orbitron',sans-serif", letterSpacing: ".04em" }}
        >
          {title}
        </p>
        <p
          className="text-[9px] mt-0.5 truncate"
          style={{
            fontFamily: "'JetBrains Mono',monospace",
            color: "rgba(148,163,184,.60)",
          }}
        >
          {subtitle}
        </p>
      </div>
    </div>

    <ChevronRight
      size={14}
      className="relative z-10 shrink-0 text-slate-500 group-hover:text-slate-300 transition-colors duration-200"
    />
  </motion.button>
);

// ─── Main Component ──────────────────────────────────────────────────────────

const SettingsMenu = ({ onLogout }) => {
  const [open, setOpen] = useState(false);
  const [logoutConfirm, setLogoutConfirm] = useState(false);
  const navigate = useNavigate();
  const prefersReducedMotion = useReducedMotion();
  const closeTimeoutRef = useRef(null);

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
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(56,189,248,0.15)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 0 20px rgba(56,189,248,0.05)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg,rgba(56,189,248,.08) 0%,rgba(139,92,246,.06) 100%)",
          }}
        />
        <Settings size={17} className="relative z-10 text-white" />
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
              style={{ background: "rgba(2,6,23,.72)", backdropFilter: "blur(6px)" }}
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
                background: "rgba(3,7,18,.94)",
                borderLeft: "1px solid rgba(255,255,255,.06)",
                backdropFilter: "blur(24px)",
                boxShadow: "-12px 0 48px rgba(0,0,0,.40)",
              }}
            >
              {/* decorative bg */}
              <div aria-hidden className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(ellipse 70% 50% at 90% 0%,rgba(56,189,248,.07),transparent)",
                  }}
                />
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage:
                      "linear-gradient(rgba(148,163,184,.018) 1px,transparent 1px),linear-gradient(90deg,rgba(148,163,184,.018) 1px,transparent 1px)",
                    backgroundSize: "40px 40px",
                  }}
                />
                {/* top rainbow bar */}
                <div
                  className="absolute top-0 inset-x-0 h-px"
                  style={{
                    background:
                      "linear-gradient(90deg,transparent,rgba(56,189,248,.38) 30%,rgba(139,92,246,.30) 70%,transparent)",
                  }}
                />
              </div>

              {/* ── Header ─────────────────────────────────────────────── */}
              <div className="relative z-10 px-4 pt-4 pb-3 border-b border-white/[.05] shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <SectionLabel>Control Panel</SectionLabel>
                    <h2
                      className="text-white text-base tracking-wider"
                      style={{ fontFamily: "'Orbitron',sans-serif", fontWeight: 700 }}
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
                      background: "rgba(255,255,255,.04)",
                      border: "1px solid rgba(255,255,255,.07)",
                    }}
                  >
                    <X size={15} className="text-slate-300" />
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
                            fontFamily: "'Orbitron',sans-serif",
                            letterSpacing: ".06em",
                            background:
                              "linear-gradient(135deg,rgba(56,189,248,.95),rgba(139,92,246,.90))",
                            boxShadow: "0 0 24px rgba(56,189,248,.22)",
                          }}
                        >
                          {initials}
                        </div>
                        {/* online dot */}
                        <div
                          className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-[#030712]"
                          style={{ background: "#34d399" }}
                        />
                      </div>

                      {/* Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <span
                            className="text-white text-[11px] font-bold truncate max-w-[130px]"
                            style={{ fontFamily: "'Orbitron',sans-serif", letterSpacing: ".04em" }}
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
                            color: "rgba(148,163,184,.62)",
                          }}
                        >
                          {user?.email || "—"}
                        </p>

                        <div className="mt-3 flex items-center gap-2">
                          <Activity size={10} className="text-emerald-400" />
                          <span
                            className="text-[8px] uppercase tracking-[.12em] text-emerald-400/75"
                            style={{ fontFamily: "'JetBrains Mono',monospace" }}
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
              <div className="relative z-10 px-4 pb-4 pt-3 border-t border-white/[.04] shrink-0">
                <GlassCard className="p-3" style={{ background: "rgba(255,255,255,.018)" }}>
                  <div className="flex items-center justify-between mb-3 px-0.5">
                    <div className="flex items-center gap-1.5">
                      <PanelTop size={12} className="text-sky-400/60" />
                      <span
                        className="text-[8.5px] uppercase tracking-[.12em] text-slate-400/60"
                        style={{ fontFamily: "'JetBrains Mono',monospace" }}
                      >
                        Secure Session
                      </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      <span
                        className="text-[8.5px] text-emerald-400/70"
                        style={{ fontFamily: "'JetBrains Mono',monospace" }}
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
                          className="text-center text-[9px] text-red-300/80 tracking-wide"
                          style={{ fontFamily: "'JetBrains Mono',monospace" }}
                        >
                          Confirm logout?
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setLogoutConfirm(false)}
                            className="flex-1 py-2 rounded-xl text-[10px] text-slate-300 transition-colors duration-150"
                            style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              background: "rgba(255,255,255,.05)",
                              border: "1px solid rgba(255,255,255,.08)",
                            }}
                          >
                            Cancel
                          </button>
                          <motion.button
                            whileTap={{ scale: 0.97 }}
                            onClick={handleLogoutClick}
                            className="flex-1 py-2 rounded-xl text-[10px] font-semibold text-red-300 flex items-center justify-center gap-1.5 transition-all duration-150"
                            style={{
                              fontFamily: "'JetBrains Mono',monospace",
                              background: "rgba(239,68,68,.12)",
                              border: "1px solid rgba(239,68,68,.28)",
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
                          background: "rgba(239,68,68,.07)",
                          border: "1px solid rgba(239,68,68,.16)",
                          color: "#fca5a5",
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