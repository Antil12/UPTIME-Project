import { useState, useEffect, useRef, useCallback } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import axios from "axios";
import {
  ArrowLeft, Globe2, Link2, Tag, ShieldAlert,
  Mail, Phone, TimerReset, MapPin, Check,
  ChevronDown, Clock, Bell, Plus, X, Zap,
} from "lucide-react";
import AlertRoutingForm from "../components/AlertRoutingForm";
import NotificationGroupSelect from "../components/NotificationGroupSelect";
import { getUserNotificationGroups } from "../api/notificationGroupApi";
import { useTheme } from "../contexts/ThemeContext";

// ─── Constants ────────────────────────────────────────────────────────────────
const REGIONS = ["South America", "Australia", "North America", "Europe", "Asia", "Africa"];
const CATEGORY_OPTIONS = ["JOURNALS", "E-JAYPEE", "JPMEDPUB", "JP-DIGITAL", "DIGINERVE", "Others"];
const FREQUENCY_OPTIONS = [
  { label: "10 seconds", value: 10_000 },
  { label: "1 minute",   value: 60_000 },
  { label: "5 minutes",  value: 300_000 },
  { label: "10 minutes", value: 600_000 },
  { label: "15 minutes", value: 900_000 },
  { label: "30 minutes", value: 1_800_000 },
  { label: "1 hour",     value: 3_600_000 },
  { label: "2 hours",    value: 7_200_000 },
  { label: "3 hours",    value: 10_800_000 },
  { label: "4 hours",    value: 14_400_000 },
  { label: "5 hours",    value: 18_000_000 },
  { label: "6 hours",    value: 21_600_000 },
  { label: "1 day",      value: 86_400_000 },
];

// ─── Font Loader ──────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    const id = "edit-page-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id   = id;
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@300;400;700&display=swap";
    link.rel  = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
};

// ─── Background ───────────────────────────────────────────────────────────────
const PageBackground = ({ currentTheme }) => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0" style={{ background: currentTheme.bg }} />
    <div className="absolute inset-0" style={{ background: `radial-gradient(ellipse 80% 40% at 50% 0%, ${currentTheme.accent}0e 0%, transparent 100%)` }} />
    <div className="absolute" style={{ top: "55%", left: "5%", width: 400, height: 400, background: `radial-gradient(circle, ${currentTheme.accentSecondary}08 0%, transparent 68%)`, filter: "blur(90px)" }} />
    <div className="absolute" style={{ top: "10%", right: "5%", width: 280, height: 280, background: `radial-gradient(circle, ${currentTheme.success}07 0%, transparent 68%)`, filter: "blur(80px)" }} />
    <div className="absolute" style={{ bottom: "10%", right: "20%", width: 200, height: 200, background: `radial-gradient(circle, ${currentTheme.accent}05 0%, transparent 68%)`, filter: "blur(70px)" }} />
    <div className="absolute inset-0" style={{ backgroundImage: `linear-gradient(${currentTheme.gridColor} 1px, transparent 1px), linear-gradient(90deg, ${currentTheme.gridColor} 1px, transparent 1px)`, backgroundSize: "44px 44px" }} />
  </div>
);

// ─── Dropdown ─────────────────────────────────────────────────────────────────
const CustomSelect = ({ value, onChange, options, placeholder, currentTheme }) => {
  const [open, setOpen]         = useState(false);
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef               = useRef(null);
  const selected                = options.find((o) => o.value === value || o === value);
  const displayLabel            = selected ? (typeof selected === "string" ? selected : selected.label) : null;

  const updateMenuRect = useCallback(() => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setMenuRect({ top: rect.bottom + window.scrollY, left: rect.left + window.scrollX, width: rect.width });
  }, []);

  useEffect(() => {
    if (!open) return;
    updateMenuRect();
    window.addEventListener("resize", updateMenuRect);
    window.addEventListener("scroll", updateMenuRect, true);
    return () => {
      window.removeEventListener("resize", updateMenuRect);
      window.removeEventListener("scroll", updateMenuRect, true);
    };
  }, [open, updateMenuRect]);

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={() => { if (!open) updateMenuRect(); setOpen((p) => !p); }}
        className="w-full px-3.5 py-2.5 rounded-xl outline-none transition-all duration-150 flex items-center justify-between"
        style={{
          background:  open ? currentTheme.accentGlow : currentTheme.bgInput,
          border:      open ? `1px solid ${currentTheme.accent}` : `1px solid ${currentTheme.borderLight}`,
          color:       displayLabel ? currentTheme.text : currentTheme.textDim,
          fontFamily:  "'JetBrains Mono', monospace", fontSize: "12px", letterSpacing: "0.01em",
          boxShadow:   open ? `0 0 0 3px ${currentTheme.accentGlow}` : "none",
        }}
      >
        <span>{displayLabel || placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.16 }} style={{ color: currentTheme.accent, opacity: 0.6, flexShrink: 0, marginLeft: 8 }}>
          <ChevronDown size={13} />
        </motion.span>
      </button>

      {open && createPortal(
        <>
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.12 }}
            className="rounded-xl overflow-hidden"
            style={{
              position: "absolute", top: menuRect.top, left: menuRect.left, width: menuRect.width,
              background: currentTheme.bgPanel, border: `1px solid ${currentTheme.borderAccent}`,
              backdropFilter: "blur(32px)", boxShadow: currentTheme.shadow,
              maxHeight: "210px", overflowY: "auto", zIndex: 9999,
            }}
          >
            {options.map((opt, idx) => {
              const optValue = typeof opt === "string" ? opt : opt.value;
              const optLabel = typeof opt === "string" ? opt : opt.label;
              const isSel    = typeof opt === "string" ? opt === value : opt.value === value;
              return (
                <button
                  key={optValue ?? idx} type="button"
                  onClick={() => { onChange(typeof opt === "string" ? opt : opt.value); setOpen(false); }}
                  className="w-full px-3.5 py-2.5 text-left transition-colors duration-100 flex items-center justify-between"
                  style={{
                    fontFamily:  "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "0.03em",
                    color:       isSel ? currentTheme.accent : currentTheme.textSecondary,
                    background:  isSel ? currentTheme.accentGlow : "transparent",
                    borderTop:   idx === 0 ? "none" : `1px solid ${currentTheme.borderLight}`,
                    borderLeft:  isSel ? `2px solid ${currentTheme.accent}` : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = currentTheme.bgInput; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                >
                  <span>{optLabel}</span>
                  {isSel && <Check size={11} style={{ color: currentTheme.accent, flexShrink: 0 }} />}
                </button>
              );
            })}
          </motion.div>
          <div className="fixed inset-0" style={{ zIndex: 9998 }} onClick={() => setOpen(false)} />
        </>,
        document.body,
      )}
    </div>
  );
};

const CategorySelect  = ({ value, onChange, currentTheme }) => <CustomSelect value={value} onChange={onChange} options={CATEGORY_OPTIONS} placeholder="Select category (optional)" currentTheme={currentTheme} />;
const FrequencySelect = ({ value, onChange, currentTheme }) => <CustomSelect value={value} onChange={(v) => onChange(Number(v))} options={FREQUENCY_OPTIONS} placeholder="Select check frequency" currentTheme={currentTheme} />;

// ─── Field Label ──────────────────────────────────────────────────────────────
const FieldLabel = ({ icon: Icon, text, currentTheme }) => (
  <div className="flex items-center gap-1.5 mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: currentTheme.accent, opacity: 0.7 }}>
    {Icon && <Icon size={10} style={{ color: currentTheme.accent, opacity: 0.8, flexShrink: 0 }} />}
    <span>{text}</span>
  </div>
);

// ─── Controlled Input ─────────────────────────────────────────────────────────
const Input = ({ value, onChange, placeholder, type = "text", onKeyDown, currentTheme }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type} value={value} onChange={onChange} placeholder={placeholder} onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
      className="w-full px-3.5 py-2.5 rounded-xl outline-none transition-all duration-150"
      style={{
        background:  focused ? currentTheme.accentGlow : currentTheme.bgInput,
        border:      focused ? `1px solid ${currentTheme.accent}` : `1px solid ${currentTheme.borderLight}`,
        boxShadow:   focused ? `0 0 0 3px ${currentTheme.accentGlow}` : "none",
        fontSize:    "12px", letterSpacing: "0.01em", fontFamily: "'JetBrains Mono', monospace",
        color:       currentTheme.text,
      }}
    />
  );
};

// ─── Tag Chip ─────────────────────────────────────────────────────────────────
const Chip = ({ label, onRemove, color = "#38bdf8" }) => (
  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg" style={{ background: `${color}0e`, border: `1px solid ${color}20`, color: `${color}bb` }}>
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.01em" }}>{label}</span>
    <button type="button" onClick={onRemove} className="flex items-center justify-center transition-colors hover:text-red-400" style={{ color: `${color}50`, lineHeight: 1 }}>
      <X size={9} />
    </button>
  </span>
);

// ─── Add Row ──────────────────────────────────────────────────────────────────
const AddRow = ({ value, onChange, onAdd, placeholder, type = "text", currentTheme }) => (
  <div className="flex gap-2">
    <Input type={type} value={value} onChange={onChange} placeholder={placeholder} currentTheme={currentTheme}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
    />
    <motion.button
      type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onAdd}
      className="px-3 py-2 rounded-xl shrink-0 flex items-center gap-1.5"
      style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.borderAccent}`, fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: currentTheme.accent, whiteSpace: "nowrap" }}
    >
      <Plus size={11} />Add
    </motion.button>
  </div>
);

// ─── Chip List ────────────────────────────────────────────────────────────────
const ChipList = ({ items, onRemove, color, emptyText, currentTheme }) => (
  <div className="flex flex-wrap gap-1.5 min-h-[22px] mt-2">
    {items.length > 0
      ? items.map((item, i) => <Chip key={i} label={item} onRemove={() => onRemove(item)} color={color} />)
      : <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textDim }}>{emptyText}</span>
    }
  </div>
);

// ─── Card Header ─────────────────────────────────────────────────────────────
const CardHeader = ({ icon: Icon, title, accentColor = "#38bdf8", currentTheme }) => (
  <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderBottomColor: `${accentColor}15`, background: `${accentColor}08` }}>
    {Icon && <Icon size={11} style={{ color: accentColor }} />}
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: accentColor }}>
      {title}
    </span>
  </div>
);

// ─── Card Wrapper ─────────────────────────────────────────────────────────────
const Card = ({ children, header, accentColor = "#38bdf8", currentTheme }) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
    className="rounded-2xl overflow-visible"
    style={{
      background:     currentTheme.bgCard,
      border:         `1px solid ${accentColor}15`,
      backdropFilter: "blur(20px)",
      boxShadow:      currentTheme.shadow,
    }}
  >
    {header}
    <div className="p-4">{children}</div>
  </motion.div>
);

// ─── Section Header ───────────────────────────────────────────────────────────
const SectionHeader = ({ icon: Icon, title, subtitle, color, currentTheme, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: -10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: [0.22, 1, 0.36, 1] }}
    className="flex items-center gap-3 mb-3 px-2"
  >
    <div
      className="flex items-center justify-center w-8 h-8 rounded-lg"
      style={{ background: `linear-gradient(135deg, ${color}26 0%, ${color}1a 100%)`, border: `1px solid ${color}33` }}
    >
      <Icon size={14} style={{ color }} />
    </div>
    <div className="flex-1">
      <h3 style={{ fontFamily: "'Orbitron', sans-serif", fontSize: "13px", fontWeight: 700, letterSpacing: "0.1em", color: currentTheme.text, textTransform: "uppercase" }}>
        {title}
      </h3>
      <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: currentTheme.textMuted, letterSpacing: "0.05em" }}>
        {subtitle}
      </p>
    </div>
    <div className="h-px flex-1" style={{ background: `linear-gradient(90deg, ${color}33 0%, transparent 100%)`, marginLeft: "16px" }} />
  </motion.div>
);

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════
export default function EditPage({
  item,
  editDomain, editUrl, setEditDomain, setEditUrl,
  editEmail, editPhone, editPriority, editResponseThresholdMs,
  editRegions, editCheckFrequency,
  editAlertRouting,
  setEditEmail, setEditPhone, setEditPriority, setEditResponseThresholdMs,
  setEditRegions, setEditCheckFrequency,
  setEditAlertRouting,
  urlError, onSave, onClose, initialCategory,
}) {
  const { currentTheme } = useTheme();
  const navigate         = useNavigate();

  // ── Local UI state ─────────────────────────────────────────────────────────
  const [category,               setCategory]               = useState(item?.category || "");
  const [manualCategory,         setManualCategory]         = useState("");
  const [useManualCategory,      setUseManualCategory]      = useState(false);
  const [emailInput,             setEmailInput]             = useState("");
  const [phoneInput,             setPhoneInput]             = useState("+91");
  const [showRoutingPanel,       setShowRoutingPanel]       = useState(false);
  const [responseThresholdError, setResponseThresholdError] = useState("");
  const [groupWarning,           setGroupWarning]           = useState(null);
  const groupWarningTimerRef     = useRef(null);

  // ── Notification groups ────────────────────────────────────────────────────
  const [notificationGroups,        setNotificationGroups]        = useState([]);
  const [loadingNotificationGroups, setLoadingNotificationGroups] = useState(false);
  const [selectedEmailGroups,       setSelectedEmailGroups]       = useState([]);
  const [selectedPhoneGroups,       setSelectedPhoneGroups]       = useState([]);

  // ── Refs — always hold the latest value, safe to read inside callbacks ─────
  // This pattern lets effects/callbacks read current data without listing it
  // as a dependency (which would cause re-runs / loops).
  const notificationGroupsRef  = useRef([]);
  const selectedEmailGroupsRef = useRef([]);
  const selectedPhoneGroupsRef = useRef([]);
  const editPhoneRef           = useRef([]);
  // Store setter refs once — React guarantees useState setters are stable,
  // but wrapping in a ref lets us call them from non-reactive code safely.
  const setEditEmailRef        = useRef(setEditEmail);
  const setEditPhoneRef        = useRef(setEditPhone);

  // Track the last set of emails/phones that came FROM the currently-selected
  // groups. This lets us detect "this contact just fell out of a deselected
  // group" and drop it outright, instead of it silently getting reclassified
  // as a "manual" entry and leaking the group's contact list in the chips.
  const prevGroupEmailsRef = useRef([]);
  const prevGroupPhonesRef = useRef([]);

  notificationGroupsRef.current  = notificationGroups;
  selectedEmailGroupsRef.current = selectedEmailGroups;
  selectedPhoneGroupsRef.current = selectedPhoneGroups;
  editPhoneRef.current           = Array.isArray(editPhone) ? editPhone : [];
  // Setters from props may technically be recreated if the parent isn't memoised;
  // keeping the ref updated every render costs nothing and avoids stale refs.
  setEditEmailRef.current = setEditEmail;
  setEditPhoneRef.current = setEditPhone;

  // ── Redirect if no item ────────────────────────────────────────────────────
  useEffect(() => {
    if (!item) navigate("/dashboard", { replace: true });
  }, [item, navigate]);

  // ── Sync category from props ───────────────────────────────────────────────
  const syncCategory = useCallback((val) => {
    const v = val || "Others";
    if (CATEGORY_OPTIONS.includes(v)) {
      setCategory(v);
      setUseManualCategory(false);
      setManualCategory("");
    } else {
      setCategory("");
      setUseManualCategory(true);
      setManualCategory(v);
    }
  }, []);

  useEffect(() => { if (item?.category !== undefined)  syncCategory(item.category);  }, [item,            syncCategory]);
  useEffect(() => { if (initialCategory !== undefined) syncCategory(initialCategory); }, [initialCategory, syncCategory]);

  // ── Fetch notification groups — ONCE on mount ─────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    let cancelled    = false;

    (async () => {
      setLoadingNotificationGroups(true);
      try {
        const response = await getUserNotificationGroups({ signal: controller.signal });
        if (!cancelled && response.success) setNotificationGroups(response.data);
      } catch (err) {
        if (!cancelled && err?.code !== "ERR_CANCELED" && err?.name !== "AbortError") {
          console.error("Failed to fetch notification groups:", err);
        }
      } finally {
        if (!cancelled) setLoadingNotificationGroups(false);
      }
    })();

    return () => { cancelled = true; controller.abort(); };
  }, []); // mount only

  // ── Fetch fresh site data — only when item._id changes ────────────────────
  const itemId = item?._id;
  useEffect(() => {
    if (!itemId) return;
    const controller = new AbortController();
    let cancelled    = false;

    (async () => {
      try {
        const token    = localStorage.getItem("loginToken");
        const response = await axios.get(`/monitoredsite/${itemId}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal:  controller.signal,
        });
        if (cancelled) return;

        const source        = response.data?.success ? response.data.data : item;
        const emailGroupIds = (source.selectedEmailNotificationGroups ?? []).map((g) => g._id ?? g);
        const phoneGroupIds = (source.selectedPhoneNotificationGroups ?? []).map((g) => g._id ?? g);

        setSelectedEmailGroups(emailGroupIds);
        setSelectedPhoneGroups(phoneGroupIds);
      } catch (err) {
        if (cancelled || err?.code === "ERR_CANCELED" || err?.name === "AbortError") return;
        console.error("Failed to fetch fresh site data:", err);
        // Fallback to prop
        const emailGroupIds = (item?.selectedEmailNotificationGroups ?? []).map((g) => g._id ?? g);
        const phoneGroupIds = (item?.selectedPhoneNotificationGroups ?? []).map((g) => g._id ?? g);
        setSelectedEmailGroups(emailGroupIds);
        setSelectedPhoneGroups(phoneGroupIds);
      }
    })();

    return () => { cancelled = true; controller.abort(); };
  }, [itemId]); // re-runs only when navigating to a different monitor

  // ── Contact sync — emails ─────────────────────────────────────────────────
  // THE KEY FIX:
  //   • setEditEmail / setEditPhone are NOT in the dep array.
  //     React guarantees their identity is stable, so omitting them is safe
  //     and avoids the infinite loop caused by a parent that passes a new
  //     arrow-function wrapper on every render.
  //   • We use the ref variants (setEditEmailRef / setEditPhoneRef) so we
  //     always call the latest version without adding them as deps.
  //   • The early-exit equality check means React skips re-rendering
  //     when the derived array is identical to the previous one.
  //   • PRIVACY FIX: when a group is deselected, its emails must disappear
  //     completely — not get reclassified as "manual" entries. We compare
  //     against prevGroupEmailsRef (the group-derived list from the last
  //     run) to find exactly which emails just fell out of a group, and
  //     strip those out before deciding what counts as "manual".
  useEffect(() => {
    const groupEmails = selectedEmailGroups.flatMap(
      (id) => notificationGroupsRef.current.find((g) => g._id === id)?.emails ?? []
    );

    // Emails that were group-derived last run but are not group-derived now
    // (i.e. their group was just deselected) — these must be dropped, not
    // kept around as if the user had typed them manually.
    const removedGroupEmails = prevGroupEmailsRef.current.filter((e) => !groupEmails.includes(e));
    prevGroupEmailsRef.current = groupEmails;

    setEditEmailRef.current((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const withoutRemoved = safePrev.filter((e) => !removedGroupEmails.includes(e));
      // Keep manual entries (not in any currently-selected group); append group emails; deduplicate
      const manual = withoutRemoved.filter((e) => !groupEmails.includes(e));
      const next   = [...new Set([...manual, ...groupEmails])];
      // Bail if nothing changed — prevents a downstream re-render cascade
      if (next.length === safePrev.length && next.every((v, i) => v === safePrev[i])) return prev;
      return next;
    });
  }, [selectedEmailGroups, notificationGroups]); // notificationGroups (not ref) ensures we re-run once data loads

  // ── Contact sync — phones ─────────────────────────────────────────────────
  // Same privacy fix as emails above: deselecting a group must fully remove
  // its phone numbers rather than silently promoting them to "manual".
  useEffect(() => {
    const groupPhones = selectedPhoneGroups.flatMap(
      (id) => notificationGroupsRef.current.find((g) => g._id === id)?.phoneNumbers ?? []
    );

    const removedGroupPhones = prevGroupPhonesRef.current.filter((p) => !groupPhones.includes(p));
    prevGroupPhonesRef.current = groupPhones;

    setEditPhoneRef.current((prev) => {
      const safePrev = Array.isArray(prev) ? prev : [];
      const withoutRemoved = safePrev.filter((p) => !removedGroupPhones.includes(p));
      const manual = withoutRemoved.filter((p) => !groupPhones.includes(p));
      const next   = [...new Set([...manual, ...groupPhones])];
      if (next.length === safePrev.length && next.every((v, i) => v === safePrev[i])) return prev;
      return next;
    });
  }, [selectedPhoneGroups, notificationGroups]);

  // ── Cleanup timer on unmount ───────────────────────────────────────────────
  useEffect(() => () => {
    if (groupWarningTimerRef.current) clearTimeout(groupWarningTimerRef.current);
  }, []);

  // ── Helpers ────────────────────────────────────────────────────────────────
  const showGroupWarning = useCallback((msg) => {
    setGroupWarning(msg);
    if (groupWarningTimerRef.current) clearTimeout(groupWarningTimerRef.current);
    groupWarningTimerRef.current = setTimeout(() => setGroupWarning(null), 5000);
  }, []);

  // Pure derivation — reads refs, no state, no effect needed
  const getGroupEmails = useCallback(() =>
    selectedEmailGroupsRef.current.flatMap(
      (id) => notificationGroupsRef.current.find((g) => g._id === id)?.emails ?? []
    ), []);

  const getGroupPhones = useCallback(() =>
    selectedPhoneGroupsRef.current.flatMap(
      (id) => notificationGroupsRef.current.find((g) => g._id === id)?.phoneNumbers ?? []
    ), []);

  // ── Group selection handlers ───────────────────────────────────────────────
  const handleSetSelectedEmailGroups = useCallback((newGroups) => {
    setSelectedEmailGroups(newGroups);
    // Contact merge/removal is handled by the sync effect
  }, []);

  const handleSetSelectedPhoneGroups = useCallback((newGroups) => {
    // Warn about phones that already exist as manual entries
    const addedIds = newGroups.filter((id) => !selectedPhoneGroupsRef.current.includes(id));
    if (addedIds.length > 0) {
      const current  = editPhoneRef.current;
      const warnings = addedIds.flatMap((id) => {
        const grp = notificationGroupsRef.current.find((g) => g._id === id);
        return (grp?.phoneNumbers ?? [])
          .filter((p) => current.includes(p))
          .map((p) => `${p} already exists in group "${grp.groupName}"`);
      });
      if (warnings.length) showGroupWarning(warnings.join(", "));
    }
    setSelectedPhoneGroups(newGroups);
  }, [showGroupWarning]);

  const handleNotificationGroupCreated = useCallback((newGroup) => {
    setNotificationGroups((prev) => [newGroup, ...prev]);
  }, []);

  // ── Guard ─────────────────────────────────────────────────────────────────
  if (!item) return null;

  // ── Derived display values (pure — no state, computed each render) ─────────
  const normalizedEmails = Array.isArray(editEmail) ? editEmail : editEmail ? [editEmail] : [];
  const normalizedPhones = Array.isArray(editPhone) ? editPhone : editPhone ? [editPhone] : [];
  const groupEmails      = getGroupEmails();
  const groupPhones      = getGroupPhones();
  const manualOnlyEmails = normalizedEmails.filter((e) => !groupEmails.includes(e));
  const manualOnlyPhones = normalizedPhones.filter((p) => !groupPhones.includes(p));

  const safeAlertRouting = {
    down:     Array.isArray(editAlertRouting?.down)     ? editAlertRouting.down     : [],
    trouble:  Array.isArray(editAlertRouting?.trouble)  ? editAlertRouting.trouble  : [],
    critical: Array.isArray(editAlertRouting?.critical) ? editAlertRouting.critical : [],
  };
  const totalRoutingAssigned =
    safeAlertRouting.down.length + safeAlertRouting.trouble.length + safeAlertRouting.critical.length;

  // ── Interaction handlers ───────────────────────────────────────────────────
  const toggleRegion = (r) =>
    setEditRegions((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r]);

  const handleAddEmail = () => {
    const v = emailInput.trim();
    if (!v || normalizedEmails.includes(v)) return;
    setEditEmail([...normalizedEmails, v]);
    setEmailInput("");
  };

  const handleAddPhone = () => {
    const v = phoneInput.trim();
    if (!v || normalizedPhones.includes(v)) return;
    if (groupPhones.includes(v)) {
      const grp = notificationGroups.find(
        (g) => selectedPhoneGroups.includes(g._id) && g.phoneNumbers?.includes(v)
      );
      showGroupWarning(`${v} already exists in group "${grp?.groupName ?? "selected group"}"`);
      return;
    }
    setEditPhone([...normalizedPhones, v]);
    setPhoneInput("+91");
  };

  const handleClose = () => {
    if (typeof onClose === "function") onClose();
    navigate("/dashboard");
  };

  const handleSave = () => {
    onSave(useManualCategory ? manualCategory : category, selectedEmailGroups, selectedPhoneGroups);
  };

  // ── Button styles ──────────────────────────────────────────────────────────
  const primaryBtnStyle = {
    background:  currentTheme.gradientPrimary,
    border:      `1px solid ${currentTheme.accent}`,
    boxShadow:   currentTheme.shadowGlow,
    fontFamily:  "'JetBrains Mono', monospace",
    fontSize:    "10px", letterSpacing: "0.12em", textTransform: "uppercase",
    color:       currentTheme.text,
  };
  const secondaryBtnStyle = {
    background:  currentTheme.bgInput,
    border:      `1px solid ${currentTheme.borderLight}`,
    fontFamily:  "'JetBrains Mono', monospace",
    fontSize:    "10px", letterSpacing: "0.1em", textTransform: "uppercase",
    color:       currentTheme.textMuted,
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <>
      <FontLoader />
      <PageBackground currentTheme={currentTheme} />

      <div className="relative z-10 min-h-screen flex flex-col" style={{ color: currentTheme.text }}>

        {/* ── Top Nav ── */}
        <div
          className="sticky top-0 z-30 px-4 sm:px-6 h-11 flex items-center gap-3 border-b"
          style={{ background: currentTheme.bgCard, borderBottomColor: currentTheme.borderAccent, backdropFilter: "blur(20px)" }}
        >
          <motion.button
            whileHover={{ x: -2 }} whileTap={{ scale: 0.97 }} onClick={handleClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150"
            style={{ background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderLight}`, fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: currentTheme.accent }}
          >
            <ArrowLeft size={11} style={{ color: currentTheme.accent }} />
            Dashboard
          </motion.button>

          <div className="flex items-center gap-1.5" style={{ opacity: 0.35 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textMuted, letterSpacing: "0.04em" }}>Dashboard</span>
            <span style={{ color: currentTheme.accent, fontSize: "11px" }}>/</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.accent, letterSpacing: "0.04em" }}>Edit Monitor</span>
          </div>

          <div className="ml-auto hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: currentTheme.accentGlow, border: `1px solid ${currentTheme.accent}` }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentTheme.accent, boxShadow: `0 0 5px ${currentTheme.accent}` }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.accent, letterSpacing: "0.04em" }}>{item.domain}</span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 px-3 sm:px-5 lg:px-8 py-4 w-full" style={{ maxWidth: "1280px", margin: "0 auto" }}>

          <motion.div
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 flex items-end justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px w-4" style={{ background: currentTheme.accent }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "0.28em", color: currentTheme.accent, textTransform: "uppercase" }}>
                  Edit Monitor
                </span>
              </div>
              <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: "clamp(16px, 2.5vw, 21px)", letterSpacing: "0.05em", color: currentTheme.text, lineHeight: 1.2 }}>
                EDIT WEBSITE
              </h1>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-3"
          >
            {/* ── LEFT (8/12) ── */}
            <div className="lg:col-span-8 space-y-3">

              {/* 1 — Basic */}
              <div className="space-y-3">
                <SectionHeader icon={Globe2} title="Basic Configuration" subtitle="Website identity and basic information" color={currentTheme.accent} currentTheme={currentTheme} />
                <Card header={<CardHeader icon={Globe2} title="Website Details" accentColor={currentTheme.accent} currentTheme={currentTheme} />} accentColor={currentTheme.accent} currentTheme={currentTheme}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <FieldLabel icon={Globe2} text="Domain Name" currentTheme={currentTheme} />
                      <Input value={editDomain} onChange={(e) => setEditDomain(e.target.value)} placeholder="example.com" currentTheme={currentTheme} />
                    </div>
                    <div>
                      <FieldLabel icon={Tag} text="Category" currentTheme={currentTheme} />
                      <div className="grid grid-cols-2 gap-2">
                        <CategorySelect value={useManualCategory ? "" : category} onChange={(val) => { setCategory(val); setUseManualCategory(false); setManualCategory(""); }} currentTheme={currentTheme} />
                        <Input placeholder="Or enter manually" value={useManualCategory ? manualCategory : ""} onChange={(e) => { setManualCategory(e.target.value); setUseManualCategory(true); }} currentTheme={currentTheme} />
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <FieldLabel icon={Link2} text="Website URL" currentTheme={currentTheme} />
                      <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://example.com" currentTheme={currentTheme} />
                    </div>
                  </div>
                </Card>
              </div>

              {/* 2 — Monitoring */}
              <div className="space-y-3">
                <SectionHeader icon={Zap} title="Monitoring Configuration" subtitle="Check frequency, response time & regions" color={currentTheme.success} currentTheme={currentTheme} delay={0.1} />
                <Card header={<CardHeader icon={Zap} title="Monitoring Settings" accentColor={currentTheme.success} currentTheme={currentTheme} />} accentColor={currentTheme.success} currentTheme={currentTheme}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div className="sm:col-span-2">
                      <FieldLabel icon={Clock} text="Check Frequency" currentTheme={currentTheme} />
                      <FrequencySelect value={editCheckFrequency} onChange={setEditCheckFrequency} currentTheme={currentTheme} />
                      <p className="mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", color: currentTheme.textDim, letterSpacing: "0.02em" }}>
                        Min: 10 sec · Max: 1 day · Default: 1 min
                      </p>
                    </div>
                    <div>
                      <FieldLabel icon={TimerReset} text="Max Response (ms)" currentTheme={currentTheme} />
                      <Input
                        type="number" value={editResponseThresholdMs}
                        onChange={(e) => {
                          const val = e.target.value;
                          setEditResponseThresholdMs(val);
                          const num = Number(val);
                          setResponseThresholdError(val && (isNaN(num) || num < 5000 || num > 60000) ? "Must be between 5 000 ms and 60 000 ms" : "");
                        }}
                        placeholder="2000" currentTheme={currentTheme}
                      />
                      <AnimatePresence>
                        {responseThresholdError && (
                          <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="mt-1"
                            style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: currentTheme.error, letterSpacing: "0.05em" }}>
                            {responseThresholdError}
                          </motion.p>
                        )}
                      </AnimatePresence>
                    </div>
                    <div>
                      <FieldLabel icon={ShieldAlert} text="Priority" currentTheme={currentTheme} />
                      <label className="flex items-center gap-2.5 cursor-pointer px-3.5 rounded-xl h-[42px] transition-all duration-150"
                        style={{ background: Number(editPriority) === 1 ? currentTheme.errorBg : currentTheme.bgInput, border: Number(editPriority) === 1 ? `1px solid ${currentTheme.error}38` : `1px solid ${currentTheme.borderLight}` }}>
                        <input type="checkbox" checked={Number(editPriority) === 1} onChange={(e) => setEditPriority(e.target.checked ? 1 : 0)} className="accent-red-500 w-3.5 h-3.5 shrink-0" />
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: Number(editPriority) === 1 ? currentTheme.error : currentTheme.textMuted, letterSpacing: "0.05em", textTransform: "uppercase" }}>High Priority</span>
                      </label>
                    </div>
                  </div>
                </Card>

                <Card header={<CardHeader icon={MapPin} title="Monitor Regions" accentColor={currentTheme.success} currentTheme={currentTheme} />} accentColor={currentTheme.success} currentTheme={currentTheme}>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {REGIONS.map((region) => {
                      const sel = editRegions.includes(region);
                      return (
                        <motion.button key={region} type="button" onClick={() => toggleRegion(region)} whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                          className="flex items-center gap-2 px-3 py-2.5 rounded-lg transition-all duration-200 text-left relative overflow-hidden"
                          style={{ background: sel ? `${currentTheme.success}1f` : currentTheme.bgInput, border: sel ? `1px solid ${currentTheme.success}4d` : `1px solid ${currentTheme.borderLight}` }}>
                          {sel && (
                            <motion.div layoutId={`glow-${region}`} className="absolute inset-0"
                              style={{ background: `radial-gradient(circle at center, ${currentTheme.success}26 0%, transparent 70%)` }}
                              initial={false} transition={{ type: "spring", stiffness: 300, damping: 30 }} />
                          )}
                          <div className="relative flex items-center gap-2 w-full">
                            <div className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0"
                              style={{ background: sel ? `${currentTheme.success}33` : currentTheme.bgInput, border: sel ? `1px solid ${currentTheme.success}66` : `1px solid ${currentTheme.borderLight}` }}>
                              {sel && <Check size={7} style={{ color: currentTheme.success }} />}
                            </div>
                            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.04em", color: sel ? currentTheme.success : currentTheme.textMuted, fontWeight: sel ? 500 : 400 }}>
                              {region}
                            </span>
                          </div>
                        </motion.button>
                      );
                    })}
                  </div>
                  <AnimatePresence>
                    {editRegions.length > 0 && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
                        className="mt-3 pt-2.5 border-t flex items-center justify-between" style={{ borderTopColor: currentTheme.successBg }}>
                        <div className="flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full" style={{ background: currentTheme.success, boxShadow: `0 0 6px ${currentTheme.success}` }} />
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", color: currentTheme.success, letterSpacing: "0.1em", textTransform: "uppercase" }}>
                            {editRegions.length} active
                          </span>
                        </div>
                        <motion.button type="button" onClick={() => setEditRegions([])} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                          style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: currentTheme.error, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                          Clear all
                        </motion.button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </Card>
              </div>

              {/* 3 — Alerts */}
              <div className="space-y-3">
                <SectionHeader icon={Bell} title="Alert Configuration" subtitle="Notification contacts & escalation groups" color="#c084fc" currentTheme={currentTheme} delay={0.2} />

                <Card header={<CardHeader icon={Mail} title="Alert Contacts" accentColor="#c084fc" currentTheme={currentTheme} />} accentColor="#c084fc" currentTheme={currentTheme}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <FieldLabel icon={Mail} text="Contact Emails" currentTheme={currentTheme} />
                      <NotificationGroupSelect label="Email" value={selectedEmailGroups} onChange={handleSetSelectedEmailGroups}
                        groups={notificationGroups} color={currentTheme.accent} icon={Mail}
                        loading={loadingNotificationGroups} type="email" onGroupCreated={handleNotificationGroupCreated} />
                      <div style={{ marginTop: 12 }}>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.12em", color: currentTheme.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Or add manually</p>
                        <AddRow value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onAdd={handleAddEmail} placeholder="alert@example.com" type="email" currentTheme={currentTheme} />
                        <ChipList items={manualOnlyEmails} onRemove={(e) => setEditEmail((p) => p.filter((x) => x !== e))} emptyText="No emails added" currentTheme={currentTheme} />
                      </div>
                    </div>
                    <div>
                      <FieldLabel icon={Phone} text="Contact Phones" currentTheme={currentTheme} />
                      <NotificationGroupSelect label="Phone" value={selectedPhoneGroups} onChange={handleSetSelectedPhoneGroups}
                        groups={notificationGroups} color={currentTheme.accent} icon={Phone}
                        loading={loadingNotificationGroups} type="phone" onGroupCreated={handleNotificationGroupCreated} />
                      <div style={{ marginTop: 12 }}>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "7px", letterSpacing: "0.12em", color: currentTheme.textMuted, textTransform: "uppercase", marginBottom: 8 }}>Or add manually</p>
                        <AddRow value={phoneInput} onChange={(e) => setPhoneInput(e.target.value.replace(/[^0-9+\s\-()]/g, ""))} onAdd={handleAddPhone} placeholder="+91 " currentTheme={currentTheme} />
                        <ChipList items={manualOnlyPhones} onRemove={(p) => setEditPhone((prev) => prev.filter((x) => x !== p))} emptyText="No numbers added" currentTheme={currentTheme} />
                        <AnimatePresence>
                          {groupWarning && (
                            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                              className="mt-3 rounded-xl px-3 py-2"
                              style={{ background: currentTheme.errorBg, border: `1px solid ${currentTheme.error}4d`, backdropFilter: "blur(14px)" }}>
                              <div className="flex items-center gap-2">
                                <ShieldAlert size={14} style={{ color: currentTheme.error }} />
                                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.error, letterSpacing: "0.02em" }}>{groupWarning}</span>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Alert Routing */}
                <div className="rounded-2xl overflow-visible" style={{ background: currentTheme.bgCard, border: `1px solid ${currentTheme.borderAccent}`, backdropFilter: "blur(20px)" }}>
                  <button type="button" onClick={() => setShowRoutingPanel((p) => !p)}
                    className="w-full px-4 py-2.5 flex items-center justify-between transition-colors duration-150"
                    style={{ borderBottom: showRoutingPanel ? `1px solid ${currentTheme.borderAccent}` : "1px solid transparent", background: showRoutingPanel ? currentTheme.accentGlow : currentTheme.bgInput, borderRadius: showRoutingPanel ? "16px 16px 0 0" : "16px" }}>
                    <div className="flex items-center gap-2">
                      <ShieldAlert size={11} style={{ color: showRoutingPanel ? "#c084fc" : currentTheme.textMuted }} />
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: showRoutingPanel ? currentTheme.accent : currentTheme.textMuted }}>
                        Alert Routing — Escalation Groups
                      </span>
                      {totalRoutingAssigned > 0 && (
                        <span className="px-2 py-0.5 rounded-full" style={{ background: "rgba(192,132,252,0.12)", border: "1px solid rgba(192,132,252,0.25)", fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: "#c084fc", letterSpacing: "0.06em" }}>
                          {totalRoutingAssigned} assigned
                        </span>
                      )}
                    </div>
                    <motion.span animate={{ rotate: showRoutingPanel ? 180 : 0 }} transition={{ duration: 0.18 }} style={{ color: "rgba(192,132,252,0.38)" }}>
                      <ChevronDown size={13} />
                    </motion.span>
                  </button>
                  <AnimatePresence>
                    {showRoutingPanel && (
                      <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }} className="overflow-visible">
                        <div className="p-4">
                          <p className="mb-4" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: currentTheme.textDim, letterSpacing: "0.04em", lineHeight: 1.7 }}>
                            Assign escalation groups to each alert level. When an alert fires, all emails in the selected groups are notified.
                          </p>
                          <AlertRoutingForm alertRouting={safeAlertRouting} setAlertRouting={setEditAlertRouting} />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            {/* ── RIGHT (4/12) ── */}
            <div className="lg:col-span-4 space-y-3">
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}>
                <Card header={<CardHeader title="Monitor Summary" accentColor={currentTheme.accent} currentTheme={currentTheme} />} accentColor={currentTheme.accent} currentTheme={currentTheme}>
                  <div className="space-y-2">
                    {[
                      { label: "Domain",   value: editDomain || item.domain || "—",                                                                                       icon: Globe2 },
                      { label: "Category", value: useManualCategory ? manualCategory : category,                                                                           icon: Tag },
                      { label: "Priority", value: Number(editPriority) === 1 ? "High" : "Normal",        accent: Number(editPriority) === 1 ? currentTheme.error   : null, icon: ShieldAlert },
                      { label: "Regions",  value: editRegions.length > 0 ? `${editRegions.length} selected` : "None", accent: editRegions.length > 0 ? currentTheme.success : null, icon: MapPin },
                      { label: "Emails",   value: normalizedEmails.length > 0 ? `${normalizedEmails.length} contact${normalizedEmails.length > 1 ? "s" : ""}` : "None", icon: Mail },
                      { label: "Phones",   value: normalizedPhones.length > 0 ? `${normalizedPhones.length} number${normalizedPhones.length > 1 ? "s" : ""}` : "None",  icon: Phone },
                      { label: "Routing",  value: totalRoutingAssigned > 0 ? `${totalRoutingAssigned} group${totalRoutingAssigned > 1 ? "s" : ""} assigned` : "None",   accent: totalRoutingAssigned > 0 ? "#c084fc" : null, icon: Bell },
                    ].map(({ label, value, accent, icon: Icon }) => (
                      <motion.div key={label} whileHover={{ x: 2 }}
                        className="flex items-start justify-between gap-3 py-2 px-2 rounded-lg transition-all duration-150"
                        style={{ borderBottom: `1px solid ${currentTheme.borderLight}` }}>
                        <div className="flex items-center gap-2">
                          {Icon && <Icon size={10} style={{ color: accent || currentTheme.textDim }} />}
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", color: currentTheme.textMuted, letterSpacing: "0.08em", textTransform: "uppercase" }}>{label}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {accent && <div className="w-1.5 h-1.5 rounded-full" style={{ background: accent, boxShadow: `0 0 6px ${accent}40` }} />}
                          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", color: accent || currentTheme.textSecondary, letterSpacing: "0.02em", textAlign: "right", wordBreak: "break-all" }}>{value}</span>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </Card>
              </motion.div>

              <AnimatePresence>
                {urlError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} className="rounded-xl px-3.5 py-3"
                    style={{ background: currentTheme.errorBg, border: `1px solid ${currentTheme.error}33` }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: currentTheme.error, letterSpacing: "0.02em" }}>⚠️ {urlError}</span>
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.4, ease: [0.22, 1, 0.36, 1] }} className="hidden lg:block">
                <div className="space-y-2">
                  <motion.button whileHover={{ scale: 1.02, boxShadow: currentTheme.shadowGlow }} whileTap={{ scale: 0.97 }} onClick={handleSave} className="w-full py-3 rounded-xl relative overflow-hidden" style={primaryBtnStyle}>
                    <span className="relative z-10">Save Changes</span>
                  </motion.button>
                  <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleClose} className="w-full py-2.5 rounded-xl" style={secondaryBtnStyle}>Cancel</motion.button>
                </div>
              </motion.div>

              <div className="flex flex-col gap-2 lg:hidden">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleSave} className="w-full py-2.5 rounded-xl" style={primaryBtnStyle}>Save Changes</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleClose} className="w-full py-2.5 rounded-xl" style={secondaryBtnStyle}>Cancel</motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
} 