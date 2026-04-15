import React, { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  ShieldCheck,
  Users,
  UserPlus,
  Globe2,
  Eye,
  EyeOff,
  CheckCircle2,
  X,
  Tag,
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
        width: 300,
        height: 300,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(56,189,248,0.05) 0%, transparent 72%)",
      }}
    />
  );
};

// ─── Background ───────────────────────────────────────────────────────────────
const Background = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0" style={{ background: "#030712" }} />
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
      opacity: 0.35,
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

// ─── Section Label ────────────────────────────────────────────────────────────
const SectionLabel = ({ icon: Icon, label }) => (
  <div className="flex items-center gap-3 mb-4">
    <div
      className="w-7 h-7 rounded-lg flex items-center justify-center border"
      style={{
        borderColor: "rgba(56,189,248,0.12)",
        background: "rgba(56,189,248,0.04)",
      }}
    >
      <Icon size={13} className="text-sky-400" />
    </div>
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "9px",
        letterSpacing: "0.22em",
        color: "rgba(56,189,248,0.5)",
        textTransform: "uppercase",
      }}
    >
      {label}
    </span>
    <div className="flex-1 h-[1px]" style={{ background: "rgba(56,189,248,0.06)" }} />
  </div>
);

// ─── HUD Input ────────────────────────────────────────────────────────────────
const HudInput = ({
  type = "text",
  placeholder,
  value,
  onChange,
  name,
  ...rest
}) => (
  <div className="relative group">
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      name={name}
      onChange={onChange}
      {...rest}
      className="w-full px-4 py-3.5 rounded-2xl outline-none transition-all duration-300"
      style={{
        background: "rgba(255,255,255,0.022)",
        border: "1px solid rgba(56,189,248,0.09)",
        color: "white",
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        letterSpacing: "0.02em",
        backdropFilter: "blur(12px)",
      }}
      onFocus={(e) => {
        e.target.style.border = "1px solid rgba(56,189,248,0.35)";
        e.target.style.boxShadow =
          "0 0 0 3px rgba(56,189,248,0.06), 0 0 20px rgba(56,189,248,0.04)";
      }}
      onBlur={(e) => {
        e.target.style.border = "1px solid rgba(56,189,248,0.09)";
        e.target.style.boxShadow = "none";
      }}
    />
  </div>
);

// ─── Password Input ───────────────────────────────────────────────────────────
const PasswordInput = ({ placeholder, value, onChange, name }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative">
      <HudInput
        type={show ? "text" : "password"}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        name={name}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-sky-400 transition"
      >
        {show ? <EyeOff size={16} /> : <Eye size={16} />}
      </button>
    </div>
  );
};

// ─── Toggle Chip ──────────────────────────────────────────────────────────────
const ToggleChip = ({ label, active, onClick, activeColor = "#38bdf8" }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ scale: 1.03 }}
    whileTap={{ scale: 0.97 }}
    className="px-3.5 py-2 rounded-2xl font-medium tracking-wide transition-all duration-300"
    style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "10px",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      border: active ? `1px solid ${activeColor}55` : "1px solid rgba(56,189,248,0.08)",
      background: active
        ? `linear-gradient(135deg, ${activeColor}18, ${activeColor}08)`
        : "rgba(255,255,255,0.018)",
      color: active ? activeColor : "rgba(148,163,184,0.6)",
      boxShadow: active ? `0 0 18px ${activeColor}18` : "none",
    }}
  >
    {label}
  </motion.button>
);

// ─── Stat Card ────────────────────────────────────────────────────────────────
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

// ─── Category Assign List ─────────────────────────────────────────────────────
const CategoryAssignList = ({
  availableCategories,
  selectedCategories,
  setSelectedCategories,
  availableSites,
  setSelectedSites,
}) => {
  const handleCategoryToggle = (category, checked) => {
    let updatedCategories;
    if (checked) {
      updatedCategories = [...selectedCategories, category];
    } else {
      updatedCategories = selectedCategories.filter((c) => c !== category);
    }
    setSelectedCategories(updatedCategories);

    // Auto-select / deselect sites belonging to this category
    const sitesInCategory = availableSites
      .filter((s) => s.category === category)
      .map((s) => s._id.toString());

    setSelectedSites((prev) => {
      if (checked) {
        return [...new Set([...prev, ...sitesInCategory])];
      } else {
        const remainingCategories = updatedCategories;
        return prev.filter((id) => {
          const site = availableSites.find((s) => s._id.toString() === id);
          if (!site) return false;
          if (!site.category) return true;
          if (remainingCategories.includes(site.category)) return true;
          return !sitesInCategory.includes(id) || remainingCategories.includes(site.category);
        });
      }
    });
  };

  const filteredCategories = availableCategories.filter(
    (c) => c && c !== "ALL" && c !== "UNCATEGORIZED"
  );

  if (filteredCategories.length === 0) {
    return (
      <div
        className="rounded-2xl p-3.5"
        style={{
          background: "rgba(255,255,255,0.018)",
          border: "1px solid rgba(255,255,255,0.05)",
        }}
      >
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            color: "rgba(148,163,184,0.55)",
          }}
        >
          No categories available
        </p>
      </div>
    );
  }

  return (
    <div
      className="rounded-2xl p-3.5 max-h-40 overflow-y-auto"
      style={{
        background: "rgba(255,255,255,0.018)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      <div className="flex flex-wrap gap-2">
        {filteredCategories.map((category) => {
          const checked = selectedCategories.includes(category);
          const siteCount = availableSites.filter((s) => s.category === category).length;

          return (
            <motion.label
              key={category}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200"
              style={{
                background: checked
                  ? "rgba(56,189,248,0.1)"
                  : "rgba(255,255,255,0.02)",
                border: checked
                  ? "1px solid rgba(56,189,248,0.28)"
                  : "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => handleCategoryToggle(category, e.target.checked)}
                className="hidden"
              />
              <div
                className="w-4 h-4 rounded-md flex items-center justify-center shrink-0 transition-all duration-200"
                style={{
                  background: checked ? "rgba(56,189,248,0.3)" : "rgba(255,255,255,0.05)",
                  border: checked
                    ? "1px solid rgba(56,189,248,0.6)"
                    : "1px solid rgba(255,255,255,0.15)",
                }}
              >
                {checked && (
                  <svg width="9" height="7" viewBox="0 0 9 7" fill="none">
                    <path
                      d="M1 3.5L3.5 6L8 1"
                      stroke="#38bdf8"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </div>
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "0.06em",
                  color: checked ? "rgba(226,232,240,0.95)" : "rgba(148,163,184,0.7)",
                  textTransform: "uppercase",
                }}
              >
                {category}
              </span>
              <span
                className="rounded-md px-1.5 py-0.5"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  background: checked ? "rgba(56,189,248,0.15)" : "rgba(255,255,255,0.04)",
                  color: checked ? "#38bdf8" : "rgba(148,163,184,0.45)",
                  border: checked
                    ? "1px solid rgba(56,189,248,0.2)"
                    : "1px solid rgba(255,255,255,0.06)",
                }}
              >
                {siteCount}
              </span>
            </motion.label>
          );
        })}
      </div>
    </div>
  );
};

// ─── Site Assign List ─────────────────────────────────────────────────────────
const SiteAssignList = ({
  sites,
  selectedSites,
  setSelectedSites,
  highlightedCategories = [],
}) => {
  return (
    <div
      className="rounded-2xl p-3.5 max-h-52 overflow-y-auto space-y-2"
      style={{
        background: "rgba(255,255,255,0.018)",
        border: "1px solid rgba(255,255,255,0.05)",
      }}
    >
      {sites.length === 0 ? (
        <p
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "11px",
            color: "rgba(148,163,184,0.55)",
          }}
        >
          No sites available
        </p>
      ) : (
        sites.map((site) => {
          const siteId = site._id.toString();
          const checked = selectedSites.includes(siteId);
          const isCategoryHighlighted =
            site.category && highlightedCategories.includes(site.category);

          return (
            <label
              key={site._id}
              className="flex items-center justify-between gap-3 rounded-xl px-3 py-2.5 cursor-pointer transition-all duration-200"
              style={{
                background: checked
                  ? isCategoryHighlighted
                    ? "rgba(129,140,248,0.08)"
                    : "rgba(56,189,248,0.06)"
                  : "rgba(255,255,255,0.01)",
                border: checked
                  ? isCategoryHighlighted
                    ? "1px solid rgba(129,140,248,0.2)"
                    : "1px solid rgba(56,189,248,0.16)"
                  : "1px solid rgba(255,255,255,0.03)",
              }}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSites([...selectedSites, siteId]);
                    } else {
                      setSelectedSites(selectedSites.filter((id) => id !== siteId));
                    }
                  }}
                />
                <div className="min-w-0">
                  <span
                    className="truncate block"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "11px",
                      color: "rgba(226,232,240,0.9)",
                    }}
                  >
                    {site.domain || site.url || site.name}
                  </span>
                  {site.category && (
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        color: isCategoryHighlighted
                          ? "rgba(129,140,248,0.7)"
                          : "rgba(148,163,184,0.4)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      {site.category}
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                {isCategoryHighlighted && (
                  <Tag size={11} style={{ color: "rgba(129,140,248,0.6)" }} />
                )}
                {checked && <CheckCircle2 size={14} className="text-sky-400" />}
              </div>
            </label>
          );
        })
      )}
    </div>
  );
};

// ─── Main UI ──────────────────────────────────────────────────────────────────
const SuperAdminUI = ({
  form,
  handleChange,
  passwordStrength,
  assignedSites,
  setAssignedSites,
  assignedCategories,
  setAssignedCategories,
  availableSites,
  availableCategories,
  handleSubmit,
  users,
  handleDelete,
  editUser,
  setEditUser,
  newPassword,
  setNewPassword,
  editForm,
  setEditForm,
  editAssignedSites,
  setEditAssignedSites,
  editAssignedCategories,
  setEditAssignedCategories,
  handleUpdateUser,
  // ✅ centralised open-modal handler from SuperAdmin.jsx
  openEditModal,
}) => {
  return (
    <>
      <FontLoader />

      <div
        className="relative min-h-screen w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-5 text-white"
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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-5 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4"
          >
            <div>
              <div className="flex items-center gap-3 mb-2">
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
                  Admin Control Center
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
                SUPER ADMIN
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
                Manage users, assign monitored websites, control access roles, and update account permissions.
              </p>
            </div>

            <StatusDot color="#34d399" label="Superadmin Access" />
          </motion.div>

          {/* Top Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="mb-5 rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3"
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
                USER ACCESS MANAGEMENT PANEL
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "rgba(148,163,184,0.48)",
                  marginTop: "4px",
                }}
              >
                Create users, assign sites, categories, and manage role-based access.
              </div>
            </div>

            <StatusDot color="#38bdf8" label="System Ready" />
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-5">
            <StatCard icon={Users} label="Total Users" value={users.length} />
            <StatCard icon={Globe2} label="Available Sites" value={availableSites.length} />
            <StatCard icon={ShieldCheck} label="SuperAdmin" value="ACTIVE" />
          </div>

          {/* Create User */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12, duration: 0.45 }}
            className="rounded-2xl p-5 sm:p-6 relative overflow-hidden mb-5"
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

            <SectionLabel icon={UserPlus} label="Create New User" />

            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <HudInput
                placeholder="Username"
                name="username"
                value={form.username}
                onChange={handleChange}
              />

              <HudInput
                placeholder="Email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
              />

              <PasswordInput
                placeholder="Password"
                name="password"
                value={form.password}
                onChange={handleChange}
              />
            </div>

            {passwordStrength && (
              <p
                className={`mb-4 text-xs ${
                  passwordStrength === "Strong"
                    ? "text-emerald-400"
                    : passwordStrength === "Medium"
                    ? "text-yellow-400"
                    : "text-red-400"
                }`}
                style={{ fontFamily: "'JetBrains Mono', monospace" }}
              >
                {passwordStrength.toUpperCase()} PASSWORD
              </p>
            )}

            <div className="mb-4">
              <label
                className="block mb-2"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  letterSpacing: "0.12em",
                  color: "rgba(56,189,248,0.48)",
                  textTransform: "uppercase",
                }}
              >
                Select Role
              </label>

              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="w-full px-4 py-3.5 rounded-2xl outline-none"
                style={{
                  background: "rgba(255,255,255,0.022)",
                  border: "1px solid rgba(56,189,248,0.09)",
                  color: "white",
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "12px",
                  backdropFilter: "blur(12px)",
                }}
              >
                <option value="USER" className="bg-slate-900">User</option>
                <option value="SUPERADMIN" className="bg-slate-900">Super Admin</option>
                <option value="VIEWER" className="bg-slate-900">Viewer</option>
              </select>
            </div>

            {form.role !== "SUPERADMIN" && (
              <>
                {/* Assign Categories */}
                <div className="mb-4">
                  <label
                    className="block mb-3"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      color: "rgba(129,140,248,0.6)",
                      textTransform: "uppercase",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Tag size={11} />
                      Assign Categories
                      <span
                        style={{
                          fontSize: "9px",
                          color: "rgba(148,163,184,0.4)",
                          letterSpacing: "0.06em",
                          fontWeight: 400,
                        }}
                      >
                        — auto-selects sites below
                      </span>
                    </span>
                  </label>
                  <CategoryAssignList
                    availableCategories={availableCategories}
                    selectedCategories={assignedCategories}
                    setSelectedCategories={setAssignedCategories}
                    availableSites={availableSites}
                    setSelectedSites={setAssignedSites}
                  />
                </div>

                {/* Assign Websites */}
                <div className="mb-5">
                  <label
                    className="block mb-3"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      letterSpacing: "0.12em",
                      color: "rgba(56,189,248,0.48)",
                      textTransform: "uppercase",
                    }}
                  >
                    <span className="flex items-center gap-2">
                      <Globe2 size={11} />
                      Assign Websites
                      {assignedSites.length > 0 && (
                        <span
                          className="rounded-md px-1.5 py-0.5"
                          style={{
                            fontSize: "9px",
                            background: "rgba(56,189,248,0.12)",
                            color: "#38bdf8",
                            border: "1px solid rgba(56,189,248,0.2)",
                          }}
                        >
                          {assignedSites.length} selected
                        </span>
                      )}
                    </span>
                  </label>
                  <SiteAssignList
                    sites={availableSites}
                    selectedSites={assignedSites}
                    setSelectedSites={setAssignedSites}
                    highlightedCategories={assignedCategories}
                  />
                </div>
              </>
            )}

            <div className="flex justify-end">
              <motion.button
                type="button"
                onClick={handleSubmit}
                whileHover={{ scale: 1.015 }}
                whileTap={{ scale: 0.985 }}
                className="px-7 py-3.5 rounded-2xl"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(129,140,248,0.1) 100%)",
                  border: "1px solid rgba(56,189,248,0.2)",
                  boxShadow: "0 0 28px rgba(56,189,248,0.06)",
                }}
              >
                <div className="flex items-center justify-center gap-3">
                  <UserPlus size={16} className="text-sky-400" />
                  <span
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: 700,
                      fontSize: "12px",
                      letterSpacing: "0.12em",
                      color: "white",
                    }}
                  >
                    CREATE USER
                  </span>
                </div>
              </motion.button>
            </div>
          </motion.div>

          {/* Manage Users */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.45 }}
            className="rounded-2xl p-5 sm:p-6 relative overflow-hidden"
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
                  "linear-gradient(90deg, transparent 0%, rgba(129,140,248,0.32) 30%, rgba(56,189,248,0.28) 70%, transparent 100%)",
              }}
            />

            <SectionLabel icon={Users} label="Manage Users" />

            {users.length === 0 ? (
              <div
                className="rounded-2xl p-8 text-center"
                style={{
                  background: "rgba(255,255,255,0.018)",
                  border: "1px solid rgba(255,255,255,0.05)",
                }}
              >
                <p
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "12px",
                    color: "rgba(148,163,184,0.55)",
                  }}
                >
                  No users found
                </p>
              </div>
            ) : (
              <>
                {/* Mobile Cards */}
                <div className="grid gap-3 lg:hidden">
                  {users.map((user) => (
                    <div
                      key={user._id}
                      className="rounded-2xl p-4"
                      style={{
                        background: "rgba(255,255,255,0.018)",
                        border: "1px solid rgba(255,255,255,0.05)",
                      }}
                    >
                      <div className="space-y-2 mb-4">
                        <p
                          className="text-white"
                          style={{
                            fontFamily: "'Orbitron', sans-serif",
                            fontWeight: 700,
                            fontSize: "15px",
                          }}
                        >
                          {user.name}
                        </p>

                        <p
                          className="break-all"
                          style={{
                            fontFamily: "'JetBrains Mono', monospace",
                            fontSize: "11px",
                            color: "rgba(148,163,184,0.65)",
                          }}
                        >
                          {user.email}
                        </p>

                        <div className="pt-1 flex flex-wrap gap-2">
                          <ToggleChip label={user.role} active activeColor="#818cf8" />
                          {user.assignedCategories && user.assignedCategories.length > 0 && (
                            <span
                              className="px-2.5 py-1.5 rounded-xl"
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "9px",
                                letterSpacing: "0.08em",
                                background: "rgba(129,140,248,0.1)",
                                border: "1px solid rgba(129,140,248,0.2)",
                                color: "rgba(129,140,248,0.8)",
                              }}
                            >
                              {user.assignedCategories.length} categor{user.assignedCategories.length === 1 ? "y" : "ies"}
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="flex gap-2">
                        {/* ✅ Use centralised openEditModal */}
                        <button
                          onClick={() => openEditModal(user)}
                          className="flex-1 py-3 rounded-xl text-sm"
                          style={{
                            background: "rgba(59,130,246,0.14)",
                            border: "1px solid rgba(59,130,246,0.22)",
                            color: "#60a5fa",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          Edit
                        </button>

                        <button
                          onClick={() => handleDelete(user._id)}
                          className="flex-1 py-3 rounded-xl text-sm"
                          style={{
                            background: "rgba(239,68,68,0.12)",
                            border: "1px solid rgba(239,68,68,0.22)",
                            color: "#f87171",
                            fontFamily: "'JetBrains Mono', monospace",
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Desktop Table */}
                <div className="hidden lg:block overflow-x-auto rounded-2xl border border-white/5">
                  <table className="w-full text-sm">
                    <thead style={{ background: "rgba(255,255,255,0.02)" }}>
                      <tr>
                        {["Name", "Email", "Role",, "Actions"].map((head, idx) => (
                          <th
                            key={head}
                            className={`p-4 ${idx === 4 ? "text-right" : "text-left"}`}
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "10px",
                              letterSpacing: "0.14em",
                              color: "rgba(56,189,248,0.58)",
                              textTransform: "uppercase",
                            }}
                          >
                            {head}
                          </th>
                        ))}
                      </tr>
                    </thead>

                    <tbody>
                      {users.map((user) => (
                        <tr
                          key={user._id}
                          className="border-t border-white/5 hover:bg-white/[0.02] transition"
                          style={{ background: "rgba(255,255,255,0.008)" }}
                        >
                          <td
                            className="p-4 text-white"
                            style={{
                              fontFamily: "'Orbitron', sans-serif",
                              fontWeight: 700,
                              fontSize: "13px",
                            }}
                          >
                            {user.name}
                          </td>

                          <td
                            className="p-4"
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "11px",
                              color: "rgba(148,163,184,0.75)",
                            }}
                          >
                            {user.email}
                          </td>

                          <td className="p-4">
                            <ToggleChip label={user.role} active activeColor="#818cf8" />
                          </td>

                          {/* <td className="p-4">
                            {user.assignedCategories && user.assignedCategories.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {user.assignedCategories.slice(0, 2).map((cat) => (
                                  <span
                                    key={cat}
                                    className="px-2 py-1 rounded-lg"
                                    style={{
                                      fontFamily: "'JetBrains Mono', monospace",
                                      fontSize: "9px",
                                      letterSpacing: "0.06em",
                                      textTransform: "uppercase",
                                      background: "rgba(129,140,248,0.1)",
                                      border: "1px solid rgba(129,140,248,0.18)",
                                      color: "rgba(129,140,248,0.8)",
                                    }}
                                  >
                                    {cat}
                                  </span>
                                ))}
                                {user.assignedCategories.length > 2 && (
                                  <span
                                    className="px-2 py-1 rounded-lg"
                                    style={{
                                      fontFamily: "'JetBrains Mono', monospace",
                                      fontSize: "9px",
                                      background: "rgba(255,255,255,0.04)",
                                      border: "1px solid rgba(255,255,255,0.08)",
                                      color: "rgba(148,163,184,0.5)",
                                    }}
                                  >
                                    +{user.assignedCategories.length - 2}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span
                                style={{
                                  fontFamily: "'JetBrains Mono', monospace",
                                  fontSize: "10px",
                                  color: "rgba(148,163,184,0.3)",
                                }}
                              >
                                —
                              </span>
                            )}
                          </td> */}

                          <td className="p-4 text-right space-x-2">
                            {/* ✅ Use centralised openEditModal */}
                            <button
                              onClick={() => openEditModal(user)}
                              className="px-4 py-2 rounded-xl text-xs"
                              style={{
                                background: "rgba(59,130,246,0.14)",
                                border: "1px solid rgba(59,130,246,0.22)",
                                color: "#60a5fa",
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              Edit
                            </button>

                            <button
                              onClick={() => handleDelete(user._id)}
                              className="px-4 py-2 rounded-xl text-xs"
                              style={{
                                background: "rgba(239,68,68,0.12)",
                                border: "1px solid rgba(239,68,68,0.22)",
                                color: "#f87171",
                                fontFamily: "'JetBrains Mono', monospace",
                              }}
                            >
                              Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </motion.div>
        </div>

        {/* Edit Modal */}
        {editUser && (
          <div className="fixed inset-0 bg-black/55 backdrop-blur-md flex items-center justify-center z-50 px-4">
            <motion.div
              initial={{ opacity: 0, y: 12, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              className="w-full max-w-2xl rounded-2xl p-5 sm:p-6 relative overflow-hidden max-h-[90vh] overflow-y-auto"
              style={{
                background: "rgba(3,7,18,0.92)",
                border: "1px solid rgba(56,189,248,0.12)",
                backdropFilter: "blur(18px)",
                boxShadow:
                  "0 0 30px rgba(56,189,248,0.06), inset 0 1px 0 rgba(56,189,248,0.04)",
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[1px]"
                style={{
                  background:
                    "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.32) 30%, rgba(129,140,248,0.28) 70%, transparent 100%)",
                }}
              />

              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3
                    className="text-white"
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: 700,
                      fontSize: "20px",
                      letterSpacing: "0.04em",
                    }}
                  >
                    EDIT USER
                  </h3>
                  <p
                    className="mt-1"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: "rgba(148,163,184,0.5)",
                    }}
                  >
                    Update profile, role, password, categories, and assigned websites.
                  </p>
                </div>

                <button
                  onClick={() => setEditUser(null)}
                  className="w-10 h-10 rounded-xl flex items-center justify-center border border-white/10 bg-white/5 text-slate-300 hover:text-white transition"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <HudInput
                  placeholder="Name"
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />

                <HudInput
                  type="email"
                  placeholder="Email"
                  value={editForm.email}
                  onChange={(e) =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />

                <div className="md:col-span-2">
                  <select
                    value={editForm.role}
                    onChange={(e) =>
                      setEditForm({ ...editForm, role: e.target.value })
                    }
                    className="w-full px-4 py-3.5 rounded-2xl outline-none"
                    style={{
                      background: "rgba(255,255,255,0.022)",
                      border: "1px solid rgba(56,189,248,0.09)",
                      color: "white",
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "12px",
                      backdropFilter: "blur(12px)",
                    }}
                  >
                    <option value="USER" className="bg-slate-900">User</option>
                    <option value="SUPERADMIN" className="bg-slate-900">Super Admin</option>
                    <option value="VIEWER" className="bg-slate-900">Viewer</option>
                  </select>
                </div>

                {editForm.role !== "SUPERADMIN" && (
                  <>
                    {/* Edit — Assign Categories */}
                    <div className="md:col-span-2">
                      <label
                        className="block mb-3"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "10px",
                          letterSpacing: "0.12em",
                          color: "rgba(129,140,248,0.6)",
                          textTransform: "uppercase",
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <Tag size={11} />
                          Assign Categories
                          <span
                            style={{
                              fontSize: "9px",
                              color: "rgba(148,163,184,0.4)",
                              letterSpacing: "0.06em",
                              fontWeight: 400,
                            }}
                          >
                            — auto-selects sites below
                          </span>
                        </span>
                      </label>
                      <CategoryAssignList
                        availableCategories={availableCategories}
                        selectedCategories={editAssignedCategories}
                        setSelectedCategories={setEditAssignedCategories}
                        availableSites={availableSites}
                        setSelectedSites={setEditAssignedSites}
                      />
                    </div>

                    {/* Edit — Assign Websites */}
                    <div className="md:col-span-2">
                      <label
                        className="block mb-2"
                        style={{
                          fontFamily: "'JetBrains Mono', monospace",
                          fontSize: "10px",
                          letterSpacing: "0.12em",
                          color: "rgba(56,189,248,0.48)",
                          textTransform: "uppercase",
                        }}
                      >
                        <span className="flex items-center gap-2">
                          <Globe2 size={11} />
                          Assign Websites
                          {editAssignedSites.length > 0 && (
                            <span
                              className="rounded-md px-1.5 py-0.5"
                              style={{
                                fontSize: "9px",
                                background: "rgba(56,189,248,0.12)",
                                color: "#38bdf8",
                                border: "1px solid rgba(56,189,248,0.2)",
                              }}
                            >
                              {editAssignedSites.length} selected
                            </span>
                          )}
                        </span>
                      </label>
                      <SiteAssignList
                        sites={availableSites}
                        selectedSites={editAssignedSites}
                        setSelectedSites={setEditAssignedSites}
                        highlightedCategories={editAssignedCategories}
                      />
                    </div>
                  </>
                )}

                <div className="md:col-span-2">
                  <PasswordInput
                    placeholder="New password (optional)"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => setEditUser(null)}
                  className="px-5 py-3 rounded-xl"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.08)",
                    color: "rgba(226,232,240,0.8)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                  }}
                >
                  Cancel
                </button>

                <button
                  onClick={handleUpdateUser}
                  className="px-5 py-3 rounded-xl"
                  style={{
                    background:
                      "linear-gradient(135deg, rgba(56,189,248,0.15) 0%, rgba(129,140,248,0.1) 100%)",
                    border: "1px solid rgba(56,189,248,0.2)",
                    color: "white",
                    fontFamily: "'Orbitron', sans-serif",
                    fontSize: "12px",
                    letterSpacing: "0.08em",
                    fontWeight: 700,
                  }}
                >
                  SAVE CHANGES
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </>
  );
};

export default SuperAdminUI;