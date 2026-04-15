import { useState, useEffect } from "react";
import {
  Settings,
  LogOut,
  Moon,
  Sun,
  Shield,
  X,
  FileText,
  Upload,
  ChevronRight,
  Sparkles,
  User2,
  PanelTop,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";

const SettingsMenu = ({ onLogout }) => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  // CLOSE WITH ESC
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const menuButtonBase = `
    w-full group relative overflow-hidden
    flex items-center justify-between
    rounded-xl md:rounded-2xl px-3 md:px-4 py-2 md:py-3
    transition-all duration-300
  `;

  const menuButtonStyle = {
    background: "rgba(255,255,255,0.025)",
    border: "1px solid rgba(56,189,248,0.08)",
    backdropFilter: "blur(14px)",
    boxShadow: "0 0 14px rgba(56,189,248,0.02)",
  };

  return (
    <>
      {/* SETTINGS BUTTON */}
      <motion.button
        whileHover={{ y: -1, scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        onClick={() => setOpen(true)}
        className="relative flex items-center justify-center p-2 md:p-2.5 rounded-xl md:rounded-2xl overflow-hidden"
        style={{
          background: "rgba(255,255,255,0.05)",
          border: "1px solid rgba(56,189,248,0.14)",
          backdropFilter: "blur(16px)",
          boxShadow: "0 0 18px rgba(56,189,248,0.04)",
        }}
      >
        <div
          className="absolute inset-0 opacity-100"
          style={{
            background:
              "linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(129,140,248,0.06) 100%)",
          }}
        />
        <Settings size={16} className="relative z-10 text-white md:hidden" />
        <Settings size={18} className="relative z-10 text-white hidden md:block" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <>
            {/* OVERLAY */}
            <motion.div
              onClick={() => setOpen(false)}
              className="fixed inset-0 z-40"
              style={{
                background: "rgba(2,6,23,0.65)",
                backdropFilter: "blur(8px)",
              }}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            {/* SIDEBAR PANEL — mobile/tablet: narrower; desktop: 380px unchanged */}
            <motion.div
              initial={{ x: "100%", opacity: 0.8 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0.8 }}
              transition={{ type: "spring", stiffness: 120, damping: 18 }}
              className="fixed top-0 right-0 h-full z-50 overflow-hidden
                         w-[280px] sm:w-[320px] lg:w-[380px]"
              style={{
                background: "rgba(3,7,18,0.92)",
                borderLeft: "1px solid rgba(56,189,248,0.10)",
                backdropFilter: "blur(22px)",
                boxShadow:
                  "-10px 0 40px rgba(0,0,0,0.35), inset 1px 0 0 rgba(255,255,255,0.02)",
              }}
            >
              {/* PANEL BG FX */}
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div
                  className="absolute inset-0"
                  style={{
                    background:
                      "radial-gradient(circle at top right, rgba(56,189,248,0.08), transparent 30%)",
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
                <div
                  className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{
                    background:
                      "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.32) 30%, rgba(129,140,248,0.28) 70%, transparent 100%)",
                  }}
                />
              </div>

              {/* CONTENT */}
              <div className="relative z-10 flex flex-col h-full">
                {/* HEADER */}
                <div className="px-4 md:px-5 pt-4 md:pt-5 pb-3 md:pb-4 border-b border-white/5">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2 md:gap-3 mb-1.5 md:mb-2">
                        <div className="h-[1px] w-5 md:w-7 bg-sky-400/20" />
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "8px",
                            letterSpacing: "0.20em",
                            color: "rgba(56,189,248,0.46)",
                            textTransform: "uppercase",
                          }}
                          className="md:text-[9px]"
                        >
                          Control Panel
                        </span>
                      </div>

                      <h2
                        className="text-white text-base md:text-xl"
                        style={{
                          fontFamily: "'Orbitron', sans-serif",
                          fontWeight: 700,
                          letterSpacing: "0.05em",
                        }}
                      >
                        SETTINGS
                      </h2>
                    </div>

                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => setOpen(false)}
                      className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center"
                      style={{
                        background: "rgba(255,255,255,0.03)",
                        border: "1px solid rgba(56,189,248,0.08)",
                      }}
                    >
                      <X size={14} className="text-slate-200 md:hidden" />
                      <X size={16} className="text-slate-200 hidden md:block" />
                    </motion.button>
                  </div>
                </div>

                {/* BODY */}
                <div className="flex-1 overflow-y-auto px-4 md:px-5 py-4 md:py-5 space-y-4 md:space-y-5">
                  {/* USER CARD */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 }}
                    className="relative overflow-hidden rounded-2xl md:rounded-3xl p-4 md:p-5"
                    style={{
                      background: "rgba(255,255,255,0.025)",
                      border: "1px solid rgba(56,189,248,0.08)",
                      backdropFilter: "blur(16px)",
                      boxShadow: "0 0 20px rgba(56,189,248,0.03)",
                    }}
                  >
                    <div
                      className="absolute top-0 left-0 right-0 h-[1px]"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.22) 30%, rgba(129,140,248,0.18) 70%, transparent 100%)",
                      }}
                    />

                    <div className="flex items-start gap-3 md:gap-4">
                      {/* Avatar */}
                      <div className="relative shrink-0">
                        <div
                          className="w-11 h-11 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white text-base md:text-lg"
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontWeight: 800,
                            letterSpacing: "0.06em",
                            background:
                              "linear-gradient(135deg, rgba(56,189,248,0.95) 0%, rgba(129,140,248,0.9) 100%)",
                            boxShadow: "0 0 24px rgba(56,189,248,0.18)",
                          }}
                        >
                          {initials}
                        </div>

                        <div className="absolute -bottom-1 -right-1 w-4 h-4 md:w-5 md:h-5 rounded-full bg-emerald-400 border-2 border-slate-950" />
                      </div>

                      {/* User Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5 md:gap-2 flex-wrap">
                          <h3
                            className="text-white text-sm md:text-base break-words"
                            style={{
                              fontFamily: "'Orbitron', sans-serif",
                              fontWeight: 700,
                              letterSpacing: "0.03em",
                            }}
                          >
                            {user?.name || "User"}
                          </h3>

                          <span
                            className={`
                              inline-flex items-center gap-1
                              px-2 py-0.5 md:px-2.5 md:py-1 rounded-full font-medium
                              ${
                                isAdmin
                                  ? "bg-purple-500/10 text-purple-300 border border-purple-400/15"
                                  : "bg-sky-500/10 text-sky-300 border border-sky-400/15"
                              }
                            `}
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "9px",
                              letterSpacing: "0.08em",
                            }}
                          >
                            {isAdmin ? <Shield size={9} /> : <User2 size={9} />}
                            {user?.role || "USER"}
                          </span>
                        </div>

                        <p
                          className="mt-1.5 md:mt-2 break-all"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "10px",
                            color: "rgba(148,163,184,0.7)",
                          }}
                        >
                          {user?.email || "user@email.com"}
                        </p>

                        <div className="mt-3 md:mt-4 flex items-center gap-1.5 md:gap-2">
                          <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400" />
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "9px",
                              letterSpacing: "0.10em",
                              color: "rgba(52,211,153,0.75)",
                              textTransform: "uppercase",
                            }}
                          >
                            Session Active
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* SECTION LABEL */}
                  <div className="pt-0.5 md:pt-1">
                    <div className="flex items-center gap-2 md:gap-3 mb-1">
                      <div className="h-[1px] w-6 md:w-8 bg-sky-400/20" />
                      <span
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "8px",
                          letterSpacing: "0.20em",
                          color: "rgba(56,189,248,0.42)",
                          textTransform: "uppercase",
                        }}
                        className="md:text-[9px]"
                      >
                        Preferences
                      </span>
                    </div>
                  </div>

                  {/* NAVIGATION / ACTIONS */}
                  <div className="space-y-2 md:space-y-3">
                    {/* LOGS */}
                    {user?.role === "SUPERADMIN" && (
                      <motion.button
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.12 }}
                        onClick={() => {
                          navigate("/logs");
                          setOpen(false);
                        }}
                        className={menuButtonBase}
                        style={menuButtonStyle}
                      >
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300"
                          style={{
                            background:
                              "radial-gradient(circle at left center, rgba(56,189,248,0.05), transparent 55%)",
                          }}
                        />

                        <div className="relative z-10 flex items-center gap-2 md:gap-3 min-w-0">
                          <div
                            className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0"
                            style={{
                              background: "rgba(56,189,248,0.08)",
                              border: "1px solid rgba(56,189,248,0.10)",
                            }}
                          >
                            <FileText size={15} className="text-sky-300 md:hidden" />
                            <FileText size={18} className="text-sky-300 hidden md:block" />
                          </div>

                          <div className="text-left min-w-0">
                            <p
                              className="text-white text-xs md:text-sm"
                              style={{
                                fontFamily: "'Orbitron', sans-serif",
                                fontWeight: 700,
                                letterSpacing: "0.03em",
                              }}
                            >
                              Audit Logs
                            </p>
                            <p
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "9px",
                                color: "rgba(148,163,184,0.6)",
                              }}
                            >
                              View activity history
                            </p>
                          </div>
                        </div>

                        <ChevronRight size={14} className="relative z-10 text-slate-400 md:hidden" />
                        <ChevronRight size={16} className="relative z-10 text-slate-400 hidden md:block" />
                      </motion.button>
                    )}

                    {/* BULK UPLOAD */}
                    {user?.role !== "VIEWER" && (
                      <motion.button
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.16 }}
                        onClick={() => {
                          navigate("/bulk-import");
                          setOpen(false);
                        }}
                        className={menuButtonBase}
                        style={menuButtonStyle}
                      >
                        <div
                          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition duration-300"
                          style={{
                            background:
                              "radial-gradient(circle at left center, rgba(129,140,248,0.05), transparent 55%)",
                          }}
                        />

                        <div className="relative z-10 flex items-center gap-2 md:gap-3 min-w-0">
                          <div
                            className="w-8 h-8 md:w-10 md:h-10 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0"
                            style={{
                              background: "rgba(129,140,248,0.08)",
                              border: "1px solid rgba(129,140,248,0.10)",
                            }}
                          >
                            <Upload size={15} className="text-indigo-300 md:hidden" />
                            <Upload size={18} className="text-indigo-300 hidden md:block" />
                          </div>

                          <div className="text-left min-w-0">
                            <p
                              className="text-white text-xs md:text-sm"
                              style={{
                                fontFamily: "'Orbitron', sans-serif",
                                fontWeight: 700,
                                letterSpacing: "0.03em",
                              }}
                            >
                              Bulk Upload Sites
                            </p>
                            <p
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "9px",
                                color: "rgba(148,163,184,0.6)",
                              }}
                            >
                              Import monitored URLs quickly
                            </p>
                          </div>
                        </div>

                        <ChevronRight size={14} className="relative z-10 text-slate-400 md:hidden" />
                        <ChevronRight size={16} className="relative z-10 text-slate-400 hidden md:block" />
                      </motion.button>
                    )}
                  </div>
                </div>

                {/* FOOTER */}
                <div className="p-4 md:p-5 border-t border-white/5">
                  <div
                    className="rounded-xl md:rounded-2xl p-2.5 md:p-3"
                    style={{
                      background: "rgba(255,255,255,0.02)",
                      border: "1px solid rgba(255,255,255,0.04)",
                    }}
                  >
                    <div className="flex items-center justify-between mb-2 md:mb-3 px-1">
                      <div className="flex items-center gap-1.5 md:gap-2">
                        <PanelTop size={12} className="text-sky-300 md:hidden" />
                        <PanelTop size={14} className="text-sky-300 hidden md:block" />
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "9px",
                            color: "rgba(148,163,184,0.62)",
                            letterSpacing: "0.10em",
                            textTransform: "uppercase",
                          }}
                        >
                          Secure Session
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 md:gap-2">
                        <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full bg-emerald-400" />
                        <span
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "9px",
                            color: "rgba(52,211,153,0.72)",
                          }}
                        >
                          Online
                        </span>
                      </div>
                    </div>

                    <motion.button
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={onLogout}
                      className="w-full flex items-center justify-center gap-2 px-3 md:px-4 py-2.5 md:py-3 rounded-xl md:rounded-2xl text-xs md:text-sm"
                      style={{
                        background: "rgba(239,68,68,0.08)",
                        border: "1px solid rgba(239,68,68,0.18)",
                        color: "#fca5a5",
                        fontFamily: "'JetBrains Mono', monospace",
                      }}
                    >
                      <LogOut size={14} className="md:hidden" />
                      <LogOut size={16} className="hidden md:block" />
                      Logout
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SettingsMenu;