import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, useMotionValue, useSpring } from "framer-motion";
import {
  Globe2,
  Link2,
  Bell,
  Mail,
  Phone,
  MapPin,
  Zap,
  Plus,
  X,
  CheckCircle2,
  ChevronDown,
  Timer,
  ShieldAlert,
} from "lucide-react";
import AlertRoutingForm from "../components/AlertRoutingForm";
import NotificationGroupSelect from "../components/NotificationGroupSelect";
import { getUserNotificationGroups } from "../api/notificationGroupApi";
import { useTheme } from "../contexts/ThemeContext";

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
  const sx = useSpring(x, { stiffness: 90, damping: 24 });
  const sy = useSpring(y, { stiffness: 90, damping: 24 });

  useEffect(() => {
    const fn = (e) => { x.set(e.clientX); y.set(e.clientY); };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed inset-0 z-0"
      style={{
        left: sx, top: sy,
        translateX: "-50%", translateY: "-50%",
        width: 320, height: 320,
        borderRadius: "50%",
        background: `radial-gradient(circle, ${currentTheme.accent}0c 0%, transparent 72%)`,
      }}
    />
  );
};

// ─── Background ───────────────────────────────────────────────────────────────
const Background = ({ currentTheme }) => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0" style={{ background: currentTheme.bg }} />
    <div className="absolute inset-0" style={{
      background: `radial-gradient(ellipse 60% 40% at 50% 20%, ${currentTheme.accent}0c 0%, transparent 100%)`,
    }} />
    <div className="absolute" style={{
      top: "62%", left: "16%", width: 320, height: 320,
      background: `radial-gradient(circle, ${currentTheme.accentSecondary}09 0%, transparent 68%)`,
      filter: "blur(90px)",
    }} />
    <div className="absolute" style={{
      top: "18%", right: "12%", width: 260, height: 260,
      background: `radial-gradient(circle, ${currentTheme.success}06 0%, transparent 68%)`,
      filter: "blur(80px)",
    }} />
    <div className="absolute inset-0" style={{
      backgroundImage:
        `linear-gradient(${currentTheme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.gridColor} 1px, transparent 1px)`,
      backgroundSize: "42px 42px",
    }} />
    <motion.div
      className="absolute inset-0"
      style={{
        background: `linear-gradient(to bottom, transparent 48%, ${currentTheme.accent}06 50%, transparent 52%)`,
      }}
      animate={{ y: ["-100%", "100%"] }}
      transition={{ duration: 6, repeat: Infinity, ease: "linear", repeatDelay: 2.5 }}
    />
  </div>
);

// ─── HUD Corner ───────────────────────────────────────────────────────────────
const HUDCorner = ({ pos, delay = 0, currentTheme }) => {
  const cls = { tl: "top-4 left-4", tr: "top-4 right-4", bl: "bottom-4 left-4", br: "bottom-4 right-4" };
  const rot = { tl: "0deg", tr: "90deg", bl: "-90deg", br: "180deg" };
  return (
    <motion.div
      className={`fixed ${cls[pos]} w-7 h-7 z-20 pointer-events-none`}
      style={{ transform: `rotate(${rot[pos]})` }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 0.8, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div className="absolute top-0 left-0 h-[1.5px]" style={{ background: currentTheme.accent, opacity: 0.8 }}
        initial={{ width: 0 }} animate={{ width: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }} />
      <motion.div className="absolute top-0 left-0 w-[1.5px]" style={{ background: currentTheme.accent, opacity: 0.8 }}
        initial={{ height: 0 }} animate={{ height: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }} />
    </motion.div>
  );
};

// ─── Orbit Ring ───────────────────────────────────────────────────────────────
const OrbitRing = ({ radius, duration, dotCount, color, delay = 0, tilt = 70 }) => (
  <motion.div
    className="fixed pointer-events-none z-[1]"
    style={{
      width: radius * 2, height: radius * 2,
      top: "50%", left: "50%",
      marginTop: -radius, marginLeft: -radius,
      transform: `perspective(900px) rotateX(${tilt}deg)`,
      opacity: 0.4,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <div className="absolute inset-0 rounded-full" style={{ border: `1px solid ${color}14` }} />
    {Array.from({ length: dotCount }, (_, i) => {
      const angle = (i / dotCount) * 2 * Math.PI;
      const cx = Math.cos(angle) * radius + radius;
      const cy = Math.sin(angle) * radius + radius;
      return (
        <motion.div key={i} className="absolute rounded-full"
          style={{
            width: i === 0 ? 4 : 2, height: i === 0 ? 4 : 2,
            background: i === 0 ? color : `${color}40`,
            left: cx - (i === 0 ? 2 : 1), top: cy - (i === 0 ? 2 : 1),
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
      <motion.div className="absolute inset-0 rounded-full" style={{ background: color }}
        animate={{ scale: [1, 2], opacity: [0.45, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }} />
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
    </div>
    {label && (
      <span style={{
        fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
        letterSpacing: "0.16em", color: `${color}cc`, textTransform: "uppercase", fontWeight: 500,
      }}>
        {label}
      </span>
    )}
  </div>
);

// ─── Section Label ────────────────────────────────────────────────────────────
const SectionLabel = ({ icon: Icon, label, currentTheme }) => (
  <div className="flex items-center gap-3 mb-4">
    <div className="w-7 h-7 rounded-lg flex items-center justify-center border"
      style={{ borderColor: currentTheme.borderAccent, background: currentTheme.accentGlow }}>
      <Icon size={13} style={{ color: currentTheme.accent }} />
    </div>
    <span style={{
      fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
      letterSpacing: "0.22em", color: currentTheme.accent, textTransform: "uppercase", fontWeight: 600,
    }}>
      {label}
    </span>
    <div className="flex-1 h-[1px]" style={{ background: currentTheme.borderAccent, opacity: 0.5 }} />
  </div>
);

// ─── HUD Input ────────────────────────────────────────────────────────────────
const HudInput = ({ type = "text", placeholder, value, onChange, required, label, currentTheme, ...rest }) => (
  <div className="relative group w-full">
    {label && (
      <label className="block text-xs font-medium mb-2" style={{
        fontFamily: "'JetBrains Mono', monospace",
        letterSpacing: "0.1em",
        color: currentTheme.accent,
        textTransform: "uppercase",
        fontWeight: 600
      }}>
        {label}
      </label>
    )}
    <input
      type={type}
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      required={required}
      {...rest}
      className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-300"
      style={{
        background: currentTheme.bgInput,
        border: `1px solid ${currentTheme.borderLight}`,
        color: currentTheme.text,
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "12px",
        letterSpacing: "0.02em",
        backdropFilter: "blur(12px)",
      }}
      onFocus={e => {
        e.target.style.border = `1px solid ${currentTheme.accent}`;
        e.target.style.boxShadow = `0 0 0 3px ${currentTheme.accentGlow}, 0 0 20px ${currentTheme.accentGlow}`;
      }}
      onBlur={e => {
        e.target.style.border = `1px solid ${currentTheme.borderLight}`;
        e.target.style.boxShadow = "none";
      }}
    />
  </div>
);

// ─── Check Frequency Options ──────────────────────────────────────────────────
export const CHECK_FREQUENCY_OPTIONS = [
  { label: "10 sec",  value: 10_000 },
  { label: "1 min",   value: 60_000 },
  { label: "5 min",   value: 300_000 },
  { label: "10 min",  value: 600_000 },
  { label: "15 min",  value: 900_000 },
  { label: "30 min",  value: 1_800_000 },
  { label: "1 hour",  value: 3_600_000 },
  { label: "2 hour",  value: 7_200_000 },
  { label: "3 hour",  value: 10_800_000 },
  { label: "4 hour",  value: 14_400_000 },
  { label: "5 hour",  value: 18_000_000 },
  { label: "6 hour",  value: 21_600_000 },
  { label: "1 day",   value: 86_400_000 },
];

// ─── Generic Portal Dropdown ──────────────────────────────────────────────────
const PortalDropdown = ({ value, onChange, options, placeholder, label, currentTheme }) => {
  const [open, setOpen] = useState(false);
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);

  const selectedOption = options.find((o) => o.value === value || o === value);
  const displayLabel = selectedOption
    ? (typeof selectedOption === "object" ? selectedOption.label : selectedOption)
    : null;

  const calcPos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropPos({ top: rect.bottom + window.scrollY + 6, left: rect.left + window.scrollX, width: rect.width });
  };

  const handleOpen = () => {
    if (!open) calcPos();
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    return () => {
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [open]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-xs font-medium mb-2" style={{
          fontFamily: "'JetBrains Mono', monospace",
          letterSpacing: "0.1em",
          color: currentTheme.accent,
          textTransform: "uppercase",
          fontWeight: 600
        }}>
          {label}
        </label>
      )}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        className="w-full px-4 py-3 rounded-xl outline-none transition-all duration-300 flex items-center justify-between"
        style={{
          background: currentTheme.bgInput,
          border: open ? `1px solid ${currentTheme.accent}` : `1px solid ${currentTheme.borderLight}`,
          color: displayLabel ? currentTheme.text : currentTheme.textMuted,
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          letterSpacing: "0.02em",
          backdropFilter: "blur(12px)",
          boxShadow: open ? `0 0 0 3px ${currentTheme.accentGlow}, 0 0 20px ${currentTheme.accentGlow}` : "none",
          textAlign: "left",
        }}
      >
        <span>{displayLabel || placeholder}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: currentTheme.accent, opacity: 0.78, flexShrink: 0 }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      {open && createPortal(
        <>
          <div style={{ position: "fixed", inset: 0, zIndex: 9998 }} onClick={() => setOpen(false)} />
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.15 }}
            style={{
              position: "absolute",
              top: dropPos.top, left: dropPos.left, width: dropPos.width,
              zIndex: 9999,
              background: currentTheme.bgPanel,
              border: `1px solid ${currentTheme.borderAccent}`,
              backdropFilter: "blur(28px)",
              boxShadow: currentTheme.shadow,
              borderRadius: "12px",
              overflow: "hidden",
              maxHeight: "260px",
              overflowY: "auto",
            }}
          >
            {options.map((opt, idx) => {
              const optValue = typeof opt === "object" ? opt.value : opt;
              const optLabel = typeof opt === "object" ? opt.label : opt;
              const isSelected = value === optValue || value === opt;
              return (
                <button
                  key={optValue ?? idx}
                  type="button"
                  onClick={() => { onChange(optValue); setOpen(false); }}
                  className="w-full px-4 py-2.5 text-left transition-all duration-150 flex items-center justify-between"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    letterSpacing: "0.06em",
                    color: isSelected ? currentTheme.accent : currentTheme.textSecondary,
                    background: isSelected ? currentTheme.accentGlow : "transparent",
                    borderTop: idx === 0 ? "none" : `1px solid ${currentTheme.borderLight}`,
                    borderLeft: isSelected ? `2px solid ${currentTheme.accent}` : "2px solid transparent",
                    fontWeight: isSelected ? 600 : 400,
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = currentTheme.bgInput; }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent"; }}
                >
                  <span>{optLabel}</span>
                  {isSelected && <span style={{ color: currentTheme.accent, fontSize: "9px" }}>✓</span>}
                </button>
              );
            })}
          </motion.div>
        </>,
        document.body
      )}
    </div>
  );
};

// ─── Category Options ─────────────────────────────────────────────────────────
const CATEGORY_OPTIONS = [
  "JOURNALS", "E-JAYPEE", "JPMEDPUB", "JP-DIGITAL", "DIGINERVE", "Others",
];

// ─── Toggle Chip ──────────────────────────────────────────────────────────────
const ToggleChip = ({ label, active, onClick, activeColor = "#38bdf8", currentTheme }) => (
  <motion.button
    type="button"
    onClick={onClick}
    whileHover={{ scale: 1.04 }}
    whileTap={{ scale: 0.96 }}
    className="px-4 py-2 rounded-lg font-medium tracking-wide transition-all duration-300"
    style={{
      fontFamily: "'JetBrains Mono', monospace",
      fontSize: "10px",
      letterSpacing: "0.1em",
      textTransform: "uppercase",
      border: active ? `1px solid ${activeColor}55` : `1px solid ${currentTheme.borderLight}`,
      background: active
        ? `linear-gradient(135deg, ${activeColor}18, ${activeColor}08)`
        : currentTheme.bgInput,
      color: active ? activeColor : currentTheme.textSecondary,
      boxShadow: active ? `0 0 18px ${activeColor}18` : "none",
    }}
  >
    {label}
  </motion.button>
);

// ─── Main Component ───────────────────────────────────────────────────────────
const AddUrl = ({
  domain,
  url,
  setDomain,
  setUrl,
  urlError,
  onSave,
  urls = [],
}) => {
  const { currentTheme } = useTheme();
  const [responseThresholdMs, setResponseThresholdMs] = useState("15000");
  const [alertChannels, setAlertChannels]             = useState([]);
  const [regions, setRegions]                         = useState([]);
  const [alertIfAllRegionsDown, setAlertIfAllRegionsDown] = useState(false);
  const [category, setCategory]                       = useState("Others");
  const [manualCategory, setManualCategory]           = useState("");
  const [useManualCategory, setUseManualCategory]     = useState(false);
  const [localError, setLocalError]                   = useState("");
  const [emailContacts, setEmailContacts]             = useState([]);
  const [emailInput, setEmailInput]                   = useState("");
  const [phoneContacts, setPhoneContacts]             = useState([]);
  const [phoneInput, setPhoneInput]                   = useState("+91");
  const [priority, setPriority]                       = useState(0);
  const [submitted, setSubmitted]                     = useState(false);
  const [checkFrequency, setCheckFrequency]           = useState(60_000);

  // ── alertRouting now stores arrays of escalation group _ids ──────────────
  const [alertRouting, setAlertRouting] = useState({
    down: [],
    trouble: [],
    critical: [],
  });

  // ── Notification groups state ───────────────────────────────────────────────
  const [notificationGroups, setNotificationGroups]   = useState([]);
  const [loadingNotificationGroups, setLoadingNotificationGroups] = useState(false);
  const [selectedEmailGroups, setSelectedEmailGroups] = useState([]);
  const [selectedPhoneGroups, setSelectedPhoneGroups] = useState([]);
  const [groupWarning, setGroupWarning] = useState(null);
  const [responseThresholdError, setResponseThresholdError] = useState("");

  // Custom handler for email group selection - adds/removes contacts when groups are selected/deselected
  const handleSetSelectedEmailGroups = (newGroups) => {
    const oldGroups = selectedEmailGroups;
    const removedGroups = oldGroups.filter(g => !newGroups.includes(g));
    const addedGroups = newGroups.filter(g => !oldGroups.includes(g));

    const currentEmails = Array.isArray(emailContacts) ? emailContacts : [];
    let updatedEmails = [...currentEmails];

    // Remove emails from deselected groups
    if (removedGroups.length > 0) {
      const emailsToRemove = removedGroups
        .map(groupId => {
          const group = notificationGroups.find(g => g._id === groupId);
          return group ? (group.emails || []) : [];
        })
        .flat();
      updatedEmails = updatedEmails.filter(email => !emailsToRemove.includes(email));
    }

    // Add emails from newly selected groups
    if (addedGroups.length > 0) {
      const emailsToAdd = addedGroups
        .map(groupId => {
          const group = notificationGroups.find(g => g._id === groupId);
          return group ? (group.emails || []) : [];
        })
        .flat();
      const uniqueEmailsToAdd = emailsToAdd.filter(email => !updatedEmails.includes(email));
      updatedEmails = [...updatedEmails, ...uniqueEmailsToAdd];
    }

    setEmailContacts(updatedEmails);
    setSelectedEmailGroups(newGroups);
  };

  // Custom handler for phone group selection - adds/removes contacts when groups are selected/deselected
  const handleSetSelectedPhoneGroups = (newGroups) => {
    const oldGroups = selectedPhoneGroups;
    const removedGroups = oldGroups.filter(g => !newGroups.includes(g));
    const addedGroups = newGroups.filter(g => !oldGroups.includes(g));

    const currentPhones = Array.isArray(phoneContacts) ? phoneContacts : [];
    let updatedPhones = [...currentPhones];

    // Check for duplicates when adding groups
    if (addedGroups.length > 0) {
      const duplicateWarnings = [];
      addedGroups.forEach(groupId => {
        const group = notificationGroups.find(g => g._id === groupId);
        if (group && group.phoneNumbers) {
          group.phoneNumbers.forEach(groupPhone => {
            if (currentPhones.includes(groupPhone)) {
              duplicateWarnings.push(`${groupPhone} already exists in group "${group.groupName}"`);
            }
          });
        }
      });

      if (duplicateWarnings.length > 0) {
        setGroupWarning(duplicateWarnings.join(', '));
        // Auto-clear warning after 5 seconds
        setTimeout(() => setGroupWarning(null), 5000);
      }
    }

    // Remove phones from deselected groups
    if (removedGroups.length > 0) {
      const phonesToRemove = removedGroups
        .map(groupId => {
          const group = notificationGroups.find(g => g._id === groupId);
          return group ? (group.phoneNumbers || []) : [];
        })
        .flat();
      updatedPhones = updatedPhones.filter(phone => !phonesToRemove.includes(phone));
    }

    // Add phones from newly selected groups (excluding duplicates from manual entry)
    if (addedGroups.length > 0) {
      const phonesToAdd = addedGroups
        .map(groupId => {
          const group = notificationGroups.find(g => g._id === groupId);
          return group ? (group.phoneNumbers || []) : [];
        })
        .flat();
      const uniquePhonesToAdd = phonesToAdd.filter(phone => !updatedPhones.includes(phone));
      updatedPhones = [...updatedPhones, ...uniquePhonesToAdd];
    }

    setPhoneContacts(updatedPhones);
    setSelectedPhoneGroups(newGroups);
  };

  // Fetch notification groups on mount
  useEffect(() => {
    const fetchNotificationGroups = async () => {
      try {
        setLoadingNotificationGroups(true);
        const response = await getUserNotificationGroups();
        if (response.success) {
          setNotificationGroups(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch notification groups:", error);
      } finally {
        setLoadingNotificationGroups(false);
      }
    };
    fetchNotificationGroups();
  }, []);

  // Handle notification group creation
  const handleNotificationGroupCreated = (newGroup) => {
    setNotificationGroups((prev) => [newGroup, ...prev]);
  };

  // Get all emails from selected notification groups
  const getGroupEmails = () => {
    return selectedEmailGroups
      .map((groupId) => {
        const group = notificationGroups.find((g) => g._id === groupId);
        return group ? (Array.isArray(group.emails) ? group.emails : []) : [];
      })
      .flat();
  };

  // Get all phones from selected notification groups
  const getGroupPhones = () => {
    return selectedPhoneGroups
      .map((groupId) => {
        const group = notificationGroups.find((g) => g._id === groupId);
        return group ? (Array.isArray(group.phoneNumbers) ? group.phoneNumbers : []) : [];
      })
      .flat();
  };

  // Merge contacts from manual entry and selected groups
  const getMergedEmailContacts = () => {
    const groupEmails = getGroupEmails();
    return [...new Set([...emailContacts, ...groupEmails])];
  };

  const getMergedPhoneContacts = () => {
    const groupPhones = getGroupPhones();
    return [...new Set([...phoneContacts, ...groupPhones])];
  };

  // Filter out notification group contacts from manual display
  const groupEmails = getGroupEmails();
  const groupPhones = getGroupPhones();
  const manualOnlyEmails = emailContacts.filter(email => !groupEmails.includes(email));
  const manualOnlyPhones = phoneContacts.filter(phone => !groupPhones.includes(phone));

  const normalize = (v = "") => v.trim().toLowerCase().replace(/\/$/, "");

  const handleSubmit = (e) => {
    e.preventDefault();
    setLocalError("");

    const nd = normalize(domain);
    const nu = normalize(url);
    if (!nd || !nu) { setLocalError("Domain and URL are required."); return; }
    if (!responseThresholdMs || responseThresholdMs === "") {
      setLocalError("Response threshold is required.");
      return;
    }
    if (urls.some((u) => normalize(u.domain) === nd)) { setLocalError("Domain name already exists."); return; }
    if (urls.some((u) => normalize(u.url) === nu))    { setLocalError("URL already exists."); return; }

    onSave({
      domain: domain.trim(),
      url: url.trim(),
      category: useManualCategory ? manualCategory.trim() : (category.trim() || "Others"),
      responseThresholdMs,
      alertChannels,
      regions,
      alertIfAllRegionsDown,
      emailContact: getMergedEmailContacts(),
      phoneContact: getMergedPhoneContacts(),
      priority,
      checkFrequency,
      // alertRouting contains group _ids for down / trouble / critical
      alertRouting,
      // Send selected notification group IDs
      selectedEmailNotificationGroups: selectedEmailGroups,
      selectedPhoneNotificationGroups: selectedPhoneGroups,
    });

    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
    setCategory("Others");
    setManualCategory("");
    setUseManualCategory(false);
    setEmailContacts([]);
    setEmailInput("");
    setPhoneContacts([]);
    setPhoneInput("+91");
    setAlertChannels([]);
    setResponseThresholdMs("15000");
    setCheckFrequency(60_000);
    setAlertRouting({ down: [], trouble: [], critical: [] });
    setSelectedEmailGroups([]);
    setSelectedPhoneGroups([]);
  };

  const toggleChannel = (ch) =>
    setAlertChannels((p) => p.includes(ch) ? p.filter((c) => c !== ch) : [...p, ch]);

  const toggleRegion = (r) =>
    setRegions((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r]);

  return (
    <>
      <FontLoader />

      <div
        className="relative min-h-screen w-full overflow-hidden px-4 sm:px-6 lg:px-8 py-5"
        style={{ background: "transparent", color: currentTheme.text }}
      >
        <Background currentTheme={currentTheme} />
        <CursorGlow currentTheme={currentTheme} />

        <OrbitRing radius={220} duration={20} dotCount={8}  color={currentTheme.accent} tilt={72} />
        <OrbitRing radius={290} duration={30} dotCount={10} color={currentTheme.accentSecondary} tilt={68} delay={1} />

        {["tl", "tr", "bl", "br"].map((p, i) => (
          <HUDCorner key={p} pos={p} delay={0.1 + i * 0.05} currentTheme={currentTheme} />
        ))}

        {/* ─── Page Content ─── */}
        <div className="relative z-10 w-full max-w-4xl mx-auto">

          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className="h-[1px] w-8" style={{ background: currentTheme.accent, opacity: 0.2 }} />
              <span style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "8px",
                letterSpacing: "0.28em", color: currentTheme.accent, textTransform: "uppercase", fontWeight: 600,
              }}>
                Configuration
              </span>
              <div className="h-[1px] w-24" style={{ background: currentTheme.accent, opacity: 0.1 }} />
            </div>

            <div className="flex items-center justify-between">
              <h1 className="text-xl sm:text-2xl" style={{
                fontFamily: "'Orbitron', sans-serif", fontWeight: 800,
                letterSpacing: "0.05em", textShadow: `0 0 24px ${currentTheme.accent}14`, color: currentTheme.text,
              }}>
                ADD WEBSITE
              </h1>
              <StatusDot color={currentTheme.success} label="Ready" />
            </div>

            <p className="mt-2" style={{
              fontFamily: "'JetBrains Mono', monospace", fontSize: "10px",
              color: currentTheme.textSecondary, letterSpacing: "0.03em",
            }}>
              Configure uptime monitoring, alert channels, and regional tracking.
            </p>
          </motion.div>

          {/* Top status bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08, duration: 0.45 }}
            className="mb-5 rounded-xl px-4 py-3 flex items-center justify-between"
            style={{
              background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`,
              backdropFilter: "blur(14px)", boxShadow: currentTheme.shadow,
            }}
          >
            <div>
              <div style={{
                fontFamily: "'Orbitron', sans-serif", fontWeight: 700,
                fontSize: "11px", letterSpacing: "0.06em", color: currentTheme.text,
              }}>
                SITE CONFIGURATION PANEL
              </div>
              <div style={{
                fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                color: currentTheme.textSecondary, marginTop: "3px", fontWeight: 500,
              }}>
                Fill all required fields to activate monitoring.
              </div>
            </div>
            <StatusDot color={currentTheme.accent} label="Input Mode" />
          </motion.div>

          {/* ─── Form ─── */}
          <form onSubmit={handleSubmit}>
            <div className="space-y-4">

              {/* ── Identity Section ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.12, duration: 0.45 }}
                className="rounded-xl p-5 relative overflow-visible"
                style={{
                  background: currentTheme.bgCard,
                  border: `1px solid ${currentTheme.borderAccent}`,
                  backdropFilter: "blur(18px)",
                  boxShadow: currentTheme.shadow,
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: currentTheme.gradientCard }} />

                <SectionLabel icon={Globe2} label="Site Identity" currentTheme={currentTheme} />
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <HudInput 
                    placeholder="Domain Name (e.g myapp.com)" 
                    value={domain} 
                    onChange={(e) => setDomain(e.target.value)}
                    label="Domain"
                    currentTheme={currentTheme}
                  />
                  <HudInput 
                    type="url" 
                    placeholder="https://example.com" 
                    value={url} 
                    onChange={(e) => setUrl(e.target.value)}
                    label="URL"
                    currentTheme={currentTheme}
                  />
                </div>

                <div className="mt-4">
                  <label className="block text-xs font-medium mb-2" style={{ 
                    fontFamily: "'JetBrains Mono', monospace",
                    letterSpacing: "0.1em",
                    color: currentTheme.accent, 
                    textTransform: "uppercase"
                  }}>
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <PortalDropdown
                      value={useManualCategory ? "" : category}
                      onChange={(val) => {
                        setCategory(val);
                        setUseManualCategory(false);
                        setManualCategory("");
                      }}
                      options={CATEGORY_OPTIONS}
                      placeholder="Select Category"
                      currentTheme={currentTheme}
                    />
                    <HudInput
                      placeholder="Or enter manually"
                      value={useManualCategory ? manualCategory : ""}
                      onChange={(e) => {
                        setManualCategory(e.target.value);
                        setUseManualCategory(true);
                      }}
                      currentTheme={currentTheme}
                    />
                  </div>
                </div>
              </motion.div>

              {/* ── Performance + Check Frequency ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.18, duration: 0.45 }}
                className="rounded-xl p-5 relative overflow-hidden"
                style={{
                  background: currentTheme.bgCard,
                  border: `1px solid ${currentTheme.borderAccent}`,
                  backdropFilter: "blur(18px)",
                  boxShadow: currentTheme.shadow,
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: currentTheme.gradientCard }} />

                <div className="flex items-center justify-between mb-4">
                  <SectionLabel icon={Zap} label="Performance Threshold" currentTheme={currentTheme} />
                  <label className="flex items-center gap-2 cursor-pointer"
                    style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: priority === 1 ? currentTheme.error : currentTheme.textSecondary, letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600 }}>
                    <div
                      className="relative w-8 h-4 rounded-full cursor-pointer transition-all duration-300"
                      style={{
                        background: priority === 1 ? currentTheme.errorBg : currentTheme.bgInput,
                        border: priority === 1 ? `1px solid ${currentTheme.error}` : `1px solid ${currentTheme.borderLight}`,
                      }}
                      onClick={() => setPriority(priority === 1 ? 0 : 1)}
                    >
                      <motion.div
                        className="absolute top-0.5 w-3 h-3 rounded-full"
                        animate={{ left: priority === 1 ? "17px" : "2px" }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        style={{ background: priority === 1 ? currentTheme.error : currentTheme.textMuted, boxShadow: priority === 1 ? `0 0 6px ${currentTheme.error}` : "none" }}
                      />
                    </div>
                    HIGH PRIORITY
                  </label>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div className="relative lg:col-span-1">
                    <HudInput
                      type="number"
                      placeholder="Max Response Time (ms)"
                      value={responseThresholdMs}
                      onChange={(e) => {
                        const value = e.target.value;
                        setResponseThresholdMs(value);
                        const numValue = Number(value);
                        if (value && (isNaN(numValue) || numValue < 5000 || numValue > 60000)) {
                          setResponseThresholdError("Response threshold must be between 5 sec (5000ms) and 60 sec (60000ms)");
                        } else {
                          setResponseThresholdError("");
                        }
                      }}
                      required
                      min="5000"
                      max="60000"
                      label="Response Threshold"
                      currentTheme={currentTheme}
                    />
                    {responseThresholdError && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="mt-2"
                        style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: currentTheme.error, letterSpacing: "0.05em" }}
                      >
                        {responseThresholdError}
                      </motion.div>
                    )}
                    <div className="mt-2 flex items-center gap-2">
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: currentTheme.textDim, letterSpacing: "0.08em" }}>
                        Default: 15s
                      </span>
                      {responseThresholdMs && (
                        <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: currentTheme.success }}>
                          ✓
                        </motion.span>
                      )}
                    </div>
                  </div>

                  <div className="lg:col-span-1">
                    <PortalDropdown
                      value={checkFrequency}
                      onChange={(val) => setCheckFrequency(Number(val))}
                      options={CHECK_FREQUENCY_OPTIONS}
                      placeholder="Select check interval"
                      label="Check Frequency"
                      currentTheme={currentTheme}
                    />
                    <div className="mt-2">
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: currentTheme.textDim, letterSpacing: "0.08em" }}>
                        Default: 1 min
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* ── Notification Channels ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.24, duration: 0.45 }}
                className="rounded-xl p-5 relative overflow-hidden"
                style={{
                  background: currentTheme.bgCard,
                  border: `1px solid ${currentTheme.borderAccent}`,
                  backdropFilter: "blur(18px)",
                  boxShadow: currentTheme.shadow,
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: `linear-gradient(90deg, transparent 0%, ${currentTheme.success}32 30%, ${currentTheme.accent}28 70%, transparent 100%)` }} />

                <SectionLabel icon={Bell} label="Notification Channels" currentTheme={currentTheme} />

                <div className="flex flex-wrap gap-2 mb-4">
                  {["email", "sms", "whatsapp", "voice"].map((ch) => (
                    <ToggleChip key={ch} label={ch} active={alertChannels.includes(ch)} onClick={() => toggleChannel(ch)} currentTheme={currentTheme} />
                  ))}
                </div>

                {alertChannels.includes("email") && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mb-4">
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "0.16em", color: currentTheme.accent, textTransform: "uppercase", marginBottom: "10px" }}>
                      <Mail size={10} style={{ display: "inline", marginRight: "6px" }} />
                      Alert Emails
                    </div>
                    
                    {/* Notification Group Select */}
                    <NotificationGroupSelect
                      label="Email"
                      value={selectedEmailGroups}
                      onChange={handleSetSelectedEmailGroups}
                      groups={notificationGroups}
                      color={currentTheme.accent}
                      icon={Mail}
                      loading={loadingNotificationGroups}
                      type="email"
                      onGroupCreated={handleNotificationGroupCreated}
                    />
                    
                    {/* Manual Email Entry */}
                    <div style={{ marginTop: "12px" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.12em", color: currentTheme.textDim, textTransform: "uppercase", marginBottom: "8px" }}>
                        Or add email  manually
                      </div>
                      <div className="flex gap-2 mb-3">
                        <HudInput
                          type="email"
                          placeholder="Add email and press Enter"
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const v = emailInput.trim();
                              if (v && !emailContacts.includes(v)) { setEmailContacts((p) => [...p, v]); setEmailInput(""); }
                            }
                          }}
                          currentTheme={currentTheme}
                        />
                        <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => { const v = emailInput.trim(); if (v && !emailContacts.includes(v)) { setEmailContacts((p) => [...p, v]); setEmailInput(""); } }}
                          className="px-3 rounded-xl flex items-center justify-center"
                          style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}`, color: currentTheme.accent, minWidth: "44px", height: "44px" }}>
                          <Plus size={14} />
                        </motion.button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {manualOnlyEmails.map((em, idx) => (
                          <motion.span key={idx} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                            style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}`, fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textSecondary }}>
                            {em}
                            <button type="button" onClick={() => setEmailContacts((p) => p.filter((x) => x !== em))} style={{ color: currentTheme.error }} className="hover:opacity-80 transition-colors">
                              <X size={9} />
                            </button>
                          </motion.span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}

                {(alertChannels.includes("sms") || alertChannels.includes("whatsapp") || alertChannels.includes("voice")) && (
                  <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}>
                    <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "0.16em", color: currentTheme.accent, textTransform: "uppercase", marginBottom: "10px" }}>
                      <Phone size={10} style={{ display: "inline", marginRight: "6px" }} />
                      Mobile Contacts
                    </div>
                    
                    {/* Notification Group Select */}
                    <NotificationGroupSelect
                      label="Phone"
                      value={selectedPhoneGroups}
                      onChange={handleSetSelectedPhoneGroups}
                      groups={notificationGroups}
                      color={currentTheme.accent}
                      icon={Phone}
                      loading={loadingNotificationGroups}
                      type="phone"
                      onGroupCreated={handleNotificationGroupCreated}
                    />
                    
                    {/* Manual Phone Entry */}
                    <div style={{ marginTop: "12px" }}>
                      <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.12em", color: currentTheme.textDim, textTransform: "uppercase", marginBottom: "8px" }}>
                        Or add phone number manually
                      </div>
                      <div className="flex gap-2 mb-3">
                        <HudInput
                          type="tel"
                          placeholder="+91 "
                          value={phoneInput}
                          onChange={(e) => {
                            const value = e.target.value;
                            // Only allow numbers, +, spaces, hyphens, and parentheses
                            const validated = value.replace(/[^0-9+\s\-\(\)]/g, '');
                            setPhoneInput(validated);
                          }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              const v = phoneInput.trim();
                              if (v && !phoneContacts.includes(v)) {
                                // Check if phone exists in selected groups
                                const duplicateInGroups = selectedPhoneGroups
                                  .map(groupId => {
                                    const group = notificationGroups.find(g => g._id === groupId);
                                    return group ? (group.phoneNumbers || []) : [];
                                  })
                                  .flat()
                                  .includes(v);

                                if (duplicateInGroups) {
                                  const groupName = notificationGroups.find(g =>
                                    g._id === selectedPhoneGroups.find(groupId => {
                                      const group = notificationGroups.find(grp => grp._id === groupId);
                                      return group && group.phoneNumbers && group.phoneNumbers.includes(v);
                                    })
                                  )?.groupName || 'selected group';
                                  setGroupWarning(`${v} already exists in group "${groupName}"`);
                                  setTimeout(() => setGroupWarning(null), 5000);
                                } else {
                                  setPhoneContacts((p) => [...p, v]);
                                  setPhoneInput("+91 ");
                                }
                              }
                            }
                          }}
                          currentTheme={currentTheme}
                         />
                        <motion.button type="button" whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          onClick={() => {
                            const v = phoneInput.trim();
                            if (v && !phoneContacts.includes(v)) {
                              // Check if phone exists in selected groups
                              const duplicateInGroups = selectedPhoneGroups
                                .map(groupId => {
                                  const group = notificationGroups.find(g => g._id === groupId);
                                  return group ? (group.phoneNumbers || []) : [];
                                })
                                .flat()
                                .includes(v);

                              if (duplicateInGroups) {
                                const groupName = notificationGroups.find(g =>
                                  g._id === selectedPhoneGroups.find(groupId => {
                                    const group = notificationGroups.find(grp => grp._id === groupId);
                                    return group && group.phoneNumbers && group.phoneNumbers.includes(v);
                                  })
                                )?.groupName || 'selected group';
                                setGroupWarning(`${v} already exists in group "${groupName}"`);
                                setTimeout(() => setGroupWarning(null), 5000);
                              } else {
                                setPhoneContacts((p) => [...p, v]);
                                setPhoneInput("+91");
                              }
                            }
                          }}
                          className="px-3 rounded-xl flex items-center justify-center"
                          style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}`, color: currentTheme.accent, minWidth: "44px", height: "44px" }}>
                          <Plus size={14} />
                        </motion.button>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {manualOnlyPhones.length > 0 ? (
                          manualOnlyPhones.map((phone, idx) => (
                            <motion.span key={idx} initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
                              className="flex items-center gap-2 px-3 py-1.5 rounded-lg"
                              style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}`, fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textSecondary }}>
                              {phone}
                              <button type="button" onClick={() => setPhoneContacts((p) => p.filter((x) => x !== phone))} style={{ color: currentTheme.error }} className="hover:opacity-80 transition-colors">
                                <X size={9} />
                              </button>
                            </motion.span>
                          ))
                        ) : (
                          <span className="text-sm font-mono" style={{ color: currentTheme.textDim }}>No phone numbers added yet</span>
                        )}
                      </div>

                      {/* Warning message for duplicate contacts */}
                      {groupWarning && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-3 rounded-xl px-3 py-2"
                          style={{
                            background: currentTheme.errorBg,
                            border: `1px solid ${currentTheme.error}`,
                            backdropFilter: "blur(14px)",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <ShieldAlert size={14} style={{ color: currentTheme.error }} />
                            <span style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "9px",
                              color: currentTheme.error,
                              letterSpacing: "0.02em",
                            }}>
                              {groupWarning}
                            </span>
                          </div>
                        </motion.div>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>

              {/* ── Monitoring Regions ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.45 }}
                className="rounded-xl p-5 relative overflow-hidden"
                style={{
                  background: currentTheme.bgCard,
                  border: `1px solid ${currentTheme.borderAccent}`,
                  backdropFilter: "blur(18px)",
                  boxShadow: currentTheme.shadow,
                }}
              >
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: `linear-gradient(90deg, transparent 0%, ${currentTheme.accentSecondary}32 50%, transparent 100%)` }} />

                <SectionLabel icon={MapPin} label="Monitoring Regions" currentTheme={currentTheme} />

                <div className="flex flex-wrap gap-2 mb-4">
                  {["South America", "Australia", "North America", "Europe", "Asia", "Africa"].map((r) => (
                    <ToggleChip key={r} label={r} active={regions.includes(r)} onClick={() => toggleRegion(r)} activeColor={currentTheme.success} currentTheme={currentTheme} />
                  ))}
                </div>

                <label className="flex items-center gap-3 cursor-pointer group">
                  <div
                    className="relative w-8 h-4 rounded-full transition-all duration-300"
                    style={{
                      background: alertIfAllRegionsDown ? currentTheme.accentGlow : currentTheme.bgInput,
                      border: alertIfAllRegionsDown ? `1px solid ${currentTheme.accent}` : `1px solid ${currentTheme.borderLight}`,
                    }}
                    onClick={() => setAlertIfAllRegionsDown(!alertIfAllRegionsDown)}
                  >
                    <motion.div
                      className="absolute top-0.5 w-3 h-3 rounded-full"
                      animate={{ left: alertIfAllRegionsDown ? "17px" : "2px" }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                      style={{
                        background: alertIfAllRegionsDown ? currentTheme.accent : currentTheme.textMuted,
                        boxShadow: alertIfAllRegionsDown ? `0 0 6px ${currentTheme.accent}` : "none",
                      }}
                    />
                  </div>
                  <span style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "9px",
                    letterSpacing: "0.1em", color: alertIfAllRegionsDown ? currentTheme.accent : currentTheme.textSecondary,
                    textTransform: "uppercase",
                  }}>
                    Alert only if ALL regions are down
                  </span>
                </label>
              </motion.div>

              {/* ── ✅ NEW: Alert Routing (Escalation Groups) ── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.33, duration: 0.45 }}
                className="rounded-xl p-5 relative overflow-visible"
                style={{
                  background: currentTheme.bgCard,
                  border: `1px solid ${currentTheme.borderAccent}`,
                  backdropFilter: "blur(18px)",
                  boxShadow: currentTheme.shadow,
                }}
              >
                {/* purple-ish top gradient to visually differentiate */}
                <div className="absolute top-0 left-0 right-0 h-[1px]"
                  style={{ background: "linear-gradient(90deg, transparent 0%, rgba(192,132,252,0.35) 30%, rgba(248,113,113,0.28) 70%, transparent 100%)" }} />

                <SectionLabel icon={ShieldAlert} label="Alert Routing — Escalation Groups" currentTheme={currentTheme} />

                <p style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  color: currentTheme.textDim,
                  letterSpacing: "0.05em",
                  marginBottom: "16px",
                  lineHeight: 1.6,
                }}>
                  Assign escalation groups to each alert level. When triggered, emails stored in those groups will be notified automatically.
                </p>

                {/* AlertRoutingForm handles fetching groups + inline create */}
                <AlertRoutingForm
                  alertRouting={alertRouting}
                  setAlertRouting={setAlertRouting}
                />
              </motion.div>

              {/* ─── Error ─── */}
              {(urlError || localError) && (
                <motion.div
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-xl px-4 py-3 flex items-center gap-3"
                  style={{ background: currentTheme.errorBg, border: `1px solid ${currentTheme.error}`, backdropFilter: "blur(12px)" }}
                >
                  <X size={13} style={{ color: currentTheme.error }} className="shrink-0" />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.error, letterSpacing: "0.02em" }}>
                    {localError || urlError}
                  </span>
                </motion.div>
              )}

              {/* ─── Submit ─── */}
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.38, duration: 0.45 }}
              >
                <motion.button
                  type="submit"
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.99 }}
                  className="w-full py-4 rounded-xl relative overflow-hidden"
                  style={{
                    background: submitted
                      ? currentTheme.successBg
                      : currentTheme.gradientPrimary,
                    border: submitted ? `1px solid ${currentTheme.success}` : `1px solid ${currentTheme.accent}`,
                    boxShadow: submitted ? `0 0 28px ${currentTheme.success}20` : currentTheme.shadowGlow,
                    transition: "all 0.4s ease",
                  }}
                >
                  <motion.div
                    className="absolute inset-0 pointer-events-none"
                    style={{ background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.04) 50%, transparent 100%)" }}
                    animate={{ x: ["-100%", "100%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "linear" }}
                  />
                  <div className="relative flex items-center justify-center gap-3">
                    {submitted ? (
                      <>
                        <CheckCircle2 size={15} style={{ color: currentTheme.success }} />
                        <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "0.12em", color: currentTheme.success }}>
                          SITE ADDED
                        </span>
                      </>
                    ) : (
                      <>
                        <Link2 size={15} style={{ color: currentTheme.accent }} />
                        <span style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 700, fontSize: "12px", letterSpacing: "0.12em", color: currentTheme.text }}>
                          ACTIVATE MONITORING
                        </span>
                      </>
                    )}
                  </div>
                </motion.button>
              </motion.div>

            </div>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddUrl;