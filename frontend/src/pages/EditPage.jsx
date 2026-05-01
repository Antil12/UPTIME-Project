import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, Globe2, Link2, Tag, ShieldAlert,
  Mail, Phone, TimerReset, MapPin, Check,
  ChevronDown, Clock, Bell, Plus, X, Zap,
} from "lucide-react";
import AlertRoutingForm from "../components/AlertRoutingForm";

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
  { label: "1 hour",  value: 3_600_000 },
  { label: "2 hours",  value: 7_200_000 },
  { label: "3 hours",  value: 10_800_000 },
  { label: "4 hours",  value: 14_400_000 },
  { label: "5 hours",  value: 18_000_000 },
  { label: "6 hours",    value: 21_600_000 },
 
  { label: "1 day",      value: 86_400_000 },
];

// ─── Font Loader ──────────────────────────────────────────────────────────────
const FontLoader = () => {
  useEffect(() => {
    const id = "edit-page-fonts";
    if (document.getElementById(id)) return;
    const link = document.createElement("link");
    link.id = id;
    link.href = "https://fonts.googleapis.com/css2?family=Orbitron:wght@400;700;900&family=JetBrains+Mono:wght@300;400;700&display=swap";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }, []);
  return null;
};

// ─── Background ───────────────────────────────────────────────────────────────
const PageBackground = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0" style={{ background: "#030712" }} />
    <div className="absolute inset-0" style={{ background: "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(56,189,248,0.055) 0%, transparent 100%)" }} />
    <div className="absolute" style={{ top: "55%", left: "5%", width: 400, height: 400, background: "radial-gradient(circle, rgba(129,140,248,0.032) 0%, transparent 68%)", filter: "blur(90px)" }} />
    <div className="absolute" style={{ top: "10%", right: "5%", width: 280, height: 280, background: "radial-gradient(circle, rgba(16,185,129,0.026) 0%, transparent 68%)", filter: "blur(80px)" }} />
    <div className="absolute" style={{ bottom: "10%", right: "20%", width: 200, height: 200, background: "radial-gradient(circle, rgba(56,189,248,0.02) 0%, transparent 68%)", filter: "blur(70px)" }} />
    <div className="absolute inset-0" style={{ backgroundImage: "linear-gradient(rgba(148,163,184,0.016) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.016) 1px, transparent 1px)", backgroundSize: "44px 44px" }} />
  </div>
);

// ─── Dropdown ─────────────────────────────────────────────────────────────────
const CustomSelect = ({ value, onChange, options, placeholder }) => {
  const [open, setOpen] = useState(false);
  const [menuRect, setMenuRect] = useState({ top: 0, left: 0, width: 0 });
  const buttonRef = useRef(null);
  const selected = options.find((o) => o.value === value || o === value);
  const displayLabel = selected ? (typeof selected === "string" ? selected : selected.label) : null;

  const updateMenuRect = () => {
    const button = buttonRef.current;
    if (!button) return;
    const rect = button.getBoundingClientRect();
    setMenuRect({
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  useEffect(() => {
    if (!open) return undefined;
    updateMenuRect();

    const handleResize = () => updateMenuRect();
    window.addEventListener("resize", handleResize);
    window.addEventListener("scroll", handleResize, true);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleResize, true);
    };
  }, [open]);

  const handleToggle = () => {
    if (!open) updateMenuRect();
    setOpen((prev) => !prev);
  };

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        type="button"
        onClick={handleToggle}
        className="w-full px-3.5 py-2.5 rounded-xl outline-none transition-all duration-150 flex items-center justify-between"
        style={{
          background: open ? "rgba(56,189,248,0.04)" : "rgba(255,255,255,0.018)",
          border: open ? "1px solid rgba(56,189,248,0.32)" : "1px solid rgba(56,189,248,0.1)",
          color: displayLabel ? "rgba(248,250,252,0.92)" : "rgba(148,163,184,0.4)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "12px",
          letterSpacing: "0.01em",
          boxShadow: open ? "0 0 0 3px rgba(56,189,248,0.07)" : "none",
          zIndex: 10,
        }}
      >
        <span>{displayLabel || placeholder}</span>
        <motion.span animate={{ rotate: open ? 180 : 0 }} transition={{ duration: 0.16 }} style={{ color: "rgba(56,189,248,0.55)", flexShrink: 0, marginLeft: 8 }}>
          <ChevronDown size={13} />
        </motion.span>
      </button>

      {open && createPortal(
        <>
          <motion.div
            initial={{ opacity: 0, y: 5, scale: 0.975 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 3, scale: 0.975 }}
            transition={{ duration: 0.12 }}
            className="rounded-xl overflow-hidden"
            style={{
              position: "absolute",
              top: menuRect.top,
              left: menuRect.left,
              width: menuRect.width,
              background: "rgba(4,9,20,0.98)",
              border: "1px solid rgba(56,189,248,0.13)",
              backdropFilter: "blur(32px)",
              boxShadow: "0 12px 40px rgba(0,0,0,0.65)",
              maxHeight: "210px",
              overflowY: "auto",
              zIndex: 9999,
            }}
          >
            {options.map((opt, idx) => {
              const optValue = typeof opt === "string" ? opt : opt.value;
              const optLabel = typeof opt === "string" ? opt : opt.label;
              const isSel = typeof opt === "string" ? opt === value : opt.value === value;
              return (
                <button
                  key={optValue ?? idx}
                  type="button"
                  onClick={() => { onChange(typeof opt === "string" ? opt : opt.value); setOpen(false); }}
                  className="w-full px-3.5 py-2.5 text-left transition-colors duration-100 flex items-center justify-between"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace", fontSize: "11px", letterSpacing: "0.03em",
                    color: isSel ? "#38bdf8" : "rgba(148,163,184,0.7)",
                    background: isSel ? "rgba(56,189,248,0.08)" : "transparent",
                    borderTop: idx === 0 ? "none" : "1px solid rgba(56,189,248,0.045)",
                    borderLeft: isSel ? "2px solid rgba(56,189,248,0.45)" : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => { if (!isSel) e.currentTarget.style.background = "rgba(255,255,255,0.028)"; }}
                  onMouseLeave={(e) => { if (!isSel) e.currentTarget.style.background = "transparent"; }}
                >
                  <span>{optLabel}</span>
                  {isSel && <Check size={11} style={{ color: "#38bdf8", flexShrink: 0 }} />}
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

const CategorySelect  = ({ value, onChange }) => <CustomSelect value={value} onChange={onChange} options={CATEGORY_OPTIONS} placeholder="Select category (optional)" />;
const FrequencySelect = ({ value, onChange }) => <CustomSelect value={value} onChange={(v) => onChange(Number(v))} options={FREQUENCY_OPTIONS} placeholder="Select check frequency" />;

// ─── Field Label ──────────────────────────────────────────────────────────────
const FieldLabel = ({ icon: Icon, text }) => (
  <div className="flex items-center gap-1.5 mb-1.5" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", letterSpacing: "0.14em", textTransform: "uppercase", color: "rgba(56,189,248,0.48)" }}>
    {Icon && <Icon size={10} style={{ color: "rgba(56,189,248,0.55)", flexShrink: 0 }} />}
    <span>{text}</span>
  </div>
);

// ─── Controlled Input ─────────────────────────────────────────────────────────
const Input = ({ value, onChange, placeholder, type = "text", onKeyDown }) => {
  const [focused, setFocused] = useState(false);
  return (
    <input
      type={type}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      onKeyDown={onKeyDown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      className="w-full px-3.5 py-2.5 rounded-xl outline-none transition-all duration-150 text-white placeholder:text-slate-600"
      style={{
        background: focused ? "rgba(56,189,248,0.03)" : "rgba(255,255,255,0.018)",
        border: focused ? "1px solid rgba(56,189,248,0.3)" : "1px solid rgba(56,189,248,0.1)",
        boxShadow: focused ? "0 0 0 3px rgba(56,189,248,0.06)" : "none",
        fontSize: "12px",
        letterSpacing: "0.01em",
        fontFamily: "'JetBrains Mono', monospace",
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
const AddRow = ({ value, onChange, onAdd, placeholder, type = "text" }) => (
  <div className="flex gap-2">
    <Input type={type} value={value} onChange={onChange} placeholder={placeholder}
      onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); onAdd(); } }}
    />
    <motion.button
      type="button" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }} onClick={onAdd}
      className="px-3 py-2 rounded-xl shrink-0 flex items-center gap-1.5"
      style={{ background: "rgba(56,189,248,0.1)", border: "1px solid rgba(56,189,248,0.2)", fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.08em", textTransform: "uppercase", color: "#38bdf8", whiteSpace: "nowrap" }}
    >
      <Plus size={11} />Add
    </motion.button>
  </div>
);

// ─── Chip List ────────────────────────────────────────────────────────────────
const ChipList = ({ items, onRemove, color, emptyText }) => (
  <div className="flex flex-wrap gap-1.5 min-h-[22px] mt-2">
    {items.length > 0
      ? items.map((item, i) => <Chip key={i} label={item} onRemove={() => onRemove(item)} color={color} />)
      : <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(100,116,139,0.38)" }}>{emptyText}</span>
    }
  </div>
);

// ─── Card Header ─────────────────────────────────────────────────────────────
const CardHeader = ({ icon: Icon, title }) => (
  <div className="px-4 py-2.5 border-b flex items-center gap-2" style={{ borderBottomColor: "rgba(56,189,248,0.07)", background: "rgba(56,189,248,0.022)" }}>
    {Icon && <Icon size={11} style={{ color: "rgba(56,189,248,0.7)" }} />}
    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(56,189,248,0.55)" }}>
      {title}
    </span>
  </div>
);

// ─── Card Wrapper ─────────────────────────────────────────────────────────────
const Card = ({ children, header }) => (
  <div className="rounded-2xl overflow-visible" style={{ background: "rgba(3,7,18,0.68)", border: "1px solid rgba(56,189,248,0.09)", backdropFilter: "blur(20px)" }}>
    {header}
    <div className="p-4">{children}</div>
  </div>
);

// ─── Button styles ────────────────────────────────────────────────────────────
const primaryBtnStyle = {
  background: "linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(59,130,246,0.15) 100%)",
  border: "1px solid rgba(56,189,248,0.22)",
  boxShadow: "0 0 18px rgba(56,189,248,0.06)",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "10px", letterSpacing: "0.12em", textTransform: "uppercase",
  color: "rgba(186,230,253,0.9)",
};
const secondaryBtnStyle = {
  background: "rgba(255,255,255,0.024)",
  border: "1px solid rgba(148,163,184,0.1)",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "10px", letterSpacing: "0.1em", textTransform: "uppercase",
  color: "rgba(148,163,184,0.6)",
};

// ═════════════════════════════════════════════════════════════════════════════
// Main Component
// ═════════════════════════════════════════════════════════════════════════════
export default function EditPage({
  item, editDomain, editUrl, setEditDomain, setEditUrl,
  editEmail, editPhone, editPriority, editResponseThresholdMs,
  editRegions, editCheckFrequency, editAlertRouting, editAlertGroups,
  setEditEmail, setEditPhone, setEditPriority, setEditResponseThresholdMs,
  setEditRegions, setEditCheckFrequency, setEditAlertRouting, setEditAlertGroups,
  urlError, onSave, onClose, initialCategory,
}) {
  const navigate = useNavigate();
  const [category,      setCategory]      = useState(item?.category || "");
  const [emailInput,    setEmailInput]    = useState("");
  const [phoneInput,    setPhoneInput]    = useState("");
  const [groupInput,    setGroupInput]    = useState({ developer: "", pm: "", avp: "" });
  const [showGroupForm, setShowGroupForm] = useState(false);

  useEffect(() => { if (item?.category !== undefined) setCategory(item.category || ""); }, [item]);
  useEffect(() => { if (initialCategory !== undefined) setCategory(initialCategory || ""); }, [initialCategory]);
  useEffect(() => { if (!item) navigate("/dashboard", { replace: true }); }, [item, navigate]);

  if (!item) return null;

  const isValidEmail     = (v = "") => /\S+@\S+\.\S+/.test(v.trim());
  const normalizedEmails = Array.isArray(editEmail) ? editEmail : editEmail ? [editEmail] : [];
  const normalizedPhones = Array.isArray(editPhone) ? editPhone : editPhone ? [editPhone] : [];

  const toggleRegion = (r) => setEditRegions((p) => p.includes(r) ? p.filter((x) => x !== r) : [...p, r]);

  const handleAddEmail = () => {
    const v = emailInput.trim();
    if (!v) return;
    if (!normalizedEmails.includes(v)) setEditEmail([...normalizedEmails, v]);
    setEmailInput("");
  };
  const handleAddPhone = () => {
    const v = phoneInput.trim();
    if (!v) return;
    if (!normalizedPhones.includes(v)) setEditPhone([...normalizedPhones, v]);
    setPhoneInput("");
  };
  const addGroupEmail = (role) => {
    const v = groupInput[role]?.trim();
    if (!v || !isValidEmail(v)) return;
    const cur = Array.isArray(editAlertGroups?.[role]) ? editAlertGroups[role] : [];
    if (!cur.includes(v)) setEditAlertGroups((p) => ({ ...p, [role]: [...cur, v] }));
    setGroupInput((p) => ({ ...p, [role]: "" }));
  };
  const removeGroupEmail = (role, email) => {
    const cur = Array.isArray(editAlertGroups?.[role]) ? editAlertGroups[role] : [];
    setEditAlertGroups((p) => ({ ...p, [role]: cur.filter((e) => e !== email) }));
  };
  const handleClose = () => {
    if (typeof onClose === "function") onClose();
    navigate("/dashboard");
  };

  return (
    <>
      <FontLoader />
      <PageBackground />

      <div className="relative z-10 min-h-screen flex flex-col">

        {/* ── Top Nav ── */}
        <div
          className="sticky top-0 z-30 px-4 sm:px-6 h-11 flex items-center gap-3 border-b"
          style={{ background: "rgba(3,7,18,0.92)", borderBottomColor: "rgba(56,189,248,0.07)", backdropFilter: "blur(20px)" }}
        >
          <motion.button
            whileHover={{ x: -2 }} whileTap={{ scale: 0.97 }} onClick={handleClose}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all duration-150"
            style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(56,189,248,0.11)", fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase", color: "rgba(56,189,248,0.75)" }}
          >
            <ArrowLeft size={11} style={{ color: "#38bdf8" }} />
            Dashboard
          </motion.button>

          <div className="flex items-center gap-1.5" style={{ opacity: 0.35 }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(148,163,184,0.7)", letterSpacing: "0.04em" }}>Dashboard</span>
            <span style={{ color: "rgba(56,189,248,0.4)", fontSize: "11px" }}>/</span>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(56,189,248,0.8)", letterSpacing: "0.04em" }}>Edit Monitor</span>
          </div>

          <div className="ml-auto hidden sm:flex items-center gap-2 px-3 py-1 rounded-lg" style={{ background: "rgba(56,189,248,0.05)", border: "1px solid rgba(56,189,248,0.1)" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#38bdf8", boxShadow: "0 0 5px #38bdf8" }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9px", color: "rgba(56,189,248,0.7)", letterSpacing: "0.04em" }}>{item.domain}</span>
          </div>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 px-3 sm:px-5 lg:px-8 py-4 w-full" style={{ maxWidth: "1280px", margin: "0 auto" }}>

          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.32, ease: [0.22, 1, 0.36, 1] }}
            className="mb-3 flex items-end justify-between"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <div className="h-px w-4" style={{ background: "rgba(56,189,248,0.25)" }} />
                <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", letterSpacing: "0.28em", color: "rgba(56,189,248,0.35)", textTransform: "uppercase" }}>
                  Edit Monitor
                </span>
              </div>
              <h1 style={{ fontFamily: "'Orbitron', sans-serif", fontWeight: 800, fontSize: "clamp(16px, 2.5vw, 21px)", letterSpacing: "0.05em", color: "white", lineHeight: 1.2 }}>
                EDIT WEBSITE
              </h1>
            </div>
            
          </motion.div>

          {/* ── Grid Layout ── */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06, duration: 0.36, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-3"
          >

            {/* ── LEFT (2/3) ── */}
            <div className="lg:col-span-2 space-y-3">

              {/* Basic Details */}
              <Card header={<CardHeader icon={Globe2} title="Basic Details" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <FieldLabel icon={Globe2} text="Domain Name" />
                    <Input value={editDomain} onChange={(e) => setEditDomain(e.target.value)} placeholder="example.com" />
                  </div>
                  <div>
                    <FieldLabel icon={Tag} text="Category" />
                    <CategorySelect value={category} onChange={setCategory} />
                  </div>
                  <div className="sm:col-span-2">
                    <FieldLabel icon={Link2} text="Website URL" />
                    <Input value={editUrl} onChange={(e) => setEditUrl(e.target.value)} placeholder="https://example.com" />
                  </div>
                </div>
              </Card>

              {/* Monitoring Settings */}
              <Card header={<CardHeader icon={Zap} title="Monitoring Settings" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2">
                    <FieldLabel icon={Clock} text="Check Frequency" />
                    <FrequencySelect value={editCheckFrequency} onChange={setEditCheckFrequency} />
                    <p className="mt-1" style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", color: "rgba(100,116,139,0.42)", letterSpacing: "0.02em" }}>
                      Min: 10 sec · Max: 1 day · Default: 1 min
                    </p>
                  </div>
                  <div>
                    <FieldLabel icon={TimerReset} text="Max Response (ms)" />
                    <Input type="number" value={editResponseThresholdMs} onChange={(e) => setEditResponseThresholdMs(e.target.value)} placeholder="2000" />
                  </div>
                  <div>
                    <FieldLabel icon={ShieldAlert} text="Priority" />
                    <label
                      className="flex items-center gap-2.5 cursor-pointer px-3.5 rounded-xl h-[42px] transition-all duration-150"
                      style={{
                        background: Number(editPriority) === 1 ? "rgba(248,113,113,0.08)" : "rgba(255,255,255,0.018)",
                        border: Number(editPriority) === 1 ? "1px solid rgba(248,113,113,0.22)" : "1px solid rgba(56,189,248,0.1)",
                      }}
                    >
                      <input type="checkbox" checked={Number(editPriority) === 1} onChange={(e) => setEditPriority(e.target.checked ? 1 : 0)} className="accent-red-500 w-3.5 h-3.5 shrink-0" />
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: Number(editPriority) === 1 ? "#f87171" : "rgba(148,163,184,0.5)", letterSpacing: "0.05em", textTransform: "uppercase" }}>
                        High Priority
                      </span>
                    </label>
                  </div>
                </div>
              </Card>

              {/* Alert Contacts */}
              <Card header={<CardHeader icon={Mail} title="Alert Contacts" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <FieldLabel icon={Mail} text="Contact Emails" />
                    <AddRow value={emailInput} onChange={(e) => setEmailInput(e.target.value)} onAdd={handleAddEmail} placeholder="alert@example.com" type="email" />
                    <ChipList items={normalizedEmails} onRemove={(e) => setEditEmail((p) => p.filter((x) => x !== e))} emptyText="No emails added" />
                  </div>
                  <div>
                    <FieldLabel icon={Phone} text="Contact Phones" />
                    <AddRow value={phoneInput} onChange={(e) => setPhoneInput(e.target.value)} onAdd={handleAddPhone} placeholder="+91 9876543210" />
                    <ChipList items={normalizedPhones} onRemove={(p) => setEditPhone((prev) => prev.filter((x) => x !== p))} emptyText="No numbers added" />
                  </div>
                </div>
              </Card>

              {/* Alert Groups */}
              <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(3,7,18,0.68)", border: "1px solid rgba(56,189,248,0.09)", backdropFilter: "blur(20px)" }}>
                <button
                  type="button"
                  onClick={() => setShowGroupForm(!showGroupForm)}
                  className="w-full px-4 py-2.5 flex items-center justify-between transition-colors duration-150"
                  style={{ borderBottom: showGroupForm ? "1px solid rgba(56,189,248,0.07)" : "1px solid transparent", background: showGroupForm ? "rgba(56,189,248,0.03)" : "rgba(56,189,248,0.018)" }}
                >
                  <div className="flex items-center gap-2">
                    <Bell size={11} style={{ color: showGroupForm ? "#38bdf8" : "rgba(56,189,248,0.45)" }} />
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", letterSpacing: "0.2em", textTransform: "uppercase", color: showGroupForm ? "rgba(56,189,248,0.65)" : "rgba(56,189,248,0.4)" }}>
                      Alert Group Configuration
                    </span>
                  </div>
                  <motion.span animate={{ rotate: showGroupForm ? 180 : 0 }} transition={{ duration: 0.18 }} style={{ color: "rgba(56,189,248,0.38)" }}>
                    <ChevronDown size={13} />
                  </motion.span>
                </button>

                <AnimatePresence>
                  {showGroupForm && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
                      className="overflow-hidden"
                    >
                      <div className="p-4 space-y-4">
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                          {[{ key: "developer", label: "Developer" }, { key: "pm", label: "Product Manager" }, { key: "avp", label: "AVP" }].map(({ key, label }) => (
                            <div key={key}>
                              <FieldLabel text={`${label} Email`} />
                              <AddRow
                                type="email"
                                value={groupInput[key] || ""}
                                onChange={(e) => setGroupInput((p) => ({ ...p, [key]: e.target.value }))}
                                onAdd={() => addGroupEmail(key)}
                                placeholder="user@company.com"
                              />
                              <ChipList
                                items={Array.isArray(editAlertGroups?.[key]) ? editAlertGroups[key] : []}
                                onRemove={(email) => removeGroupEmail(key, email)}
                                emptyText={`No ${label.toLowerCase()} emails`}
                              />
                            </div>
                          ))}
                        </div>
                        <div className="pt-3 border-t" style={{ borderTopColor: "rgba(56,189,248,0.07)" }}>
                          <AlertRoutingForm
                            value={editAlertRouting || { down: [], trouble: [], critical: [] }}
                            onChange={setEditAlertRouting}
                          />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

            </div>

            {/* ── RIGHT (1/3) ── */}
            <div className="space-y-3">

              {/* Regions */}
              <Card header={<CardHeader icon={MapPin} title="Monitor Regions" />}>
                <div className="space-y-1.5">
                  {REGIONS.map((region) => {
                    const sel = editRegions.includes(region);
                    return (
                      <button
                        key={region}
                        type="button"
                        onClick={() => toggleRegion(region)}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all duration-150 text-left"
                        style={{
                          background: sel ? "rgba(52,211,153,0.09)" : "rgba(255,255,255,0.018)",
                          border: sel ? "1px solid rgba(52,211,153,0.24)" : "1px solid rgba(56,189,248,0.08)",
                        }}
                      >
                        <div className="w-3.5 h-3.5 rounded flex items-center justify-center shrink-0"
                          style={{ background: sel ? "rgba(52,211,153,0.18)" : "rgba(255,255,255,0.03)", border: sel ? "1px solid rgba(52,211,153,0.35)" : "1px solid rgba(56,189,248,0.12)" }}>
                          {sel && <Check size={8} className="text-emerald-400" />}
                        </div>
                        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", letterSpacing: "0.04em", color: sel ? "#86efac" : "rgba(148,163,184,0.52)" }}>
                          {region}
                        </span>
                        {sel && <div className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#34d399", boxShadow: "0 0 4px #34d399" }} />}
                      </button>
                    );
                  })}
                </div>
                {editRegions.length > 0 && (
                  <div className="mt-3 pt-2.5 border-t flex items-center justify-between" style={{ borderTopColor: "rgba(56,189,248,0.07)" }}>
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", color: "rgba(52,211,153,0.55)", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                      {editRegions.length} active
                    </span>
                    <button type="button" onClick={() => setEditRegions([])}
                      style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8px", color: "rgba(248,113,113,0.45)", letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Clear all
                    </button>
                  </div>
                )}
              </Card>

              {/* Summary */}
              <Card header={<CardHeader title="Monitor Summary" />}>
                <div className="space-y-2">
                  {[
                    { label: "Domain",   value: editDomain || item.domain || "—" },
                    { label: "Category", value: category || "—" },
                    { label: "Priority", value: Number(editPriority) === 1 ? "High" : "Normal", accent: Number(editPriority) === 1 ? "#f87171" : null },
                    { label: "Regions",  value: editRegions.length > 0 ? `${editRegions.length} selected` : "None", accent: editRegions.length > 0 ? "#34d399" : null },
                    { label: "Emails",   value: normalizedEmails.length > 0 ? `${normalizedEmails.length} contact${normalizedEmails.length > 1 ? "s" : ""}` : "None" },
                    { label: "Phones",   value: normalizedPhones.length > 0 ? `${normalizedPhones.length} number${normalizedPhones.length > 1 ? "s" : ""}` : "None" },
                  ].map(({ label, value, accent }) => (
                    <div key={label} className="flex items-start justify-between gap-3 py-1.5 border-b last:border-0" style={{ borderBottomColor: "rgba(56,189,248,0.05)" }}>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", color: "rgba(100,116,139,0.55)", letterSpacing: "0.08em", textTransform: "uppercase", flexShrink: 0 }}>
                        {label}
                      </span>
                      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "9.5px", color: accent || "rgba(248,250,252,0.6)", letterSpacing: "0.02em", textAlign: "right", wordBreak: "break-all" }}>
                        {value}
                      </span>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Error */}
              <AnimatePresence>
                {urlError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
                    className="rounded-xl px-3.5 py-3"
                    style={{ background: "rgba(248,113,113,0.07)", border: "1px solid rgba(248,113,113,0.2)" }}
                  >
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "10px", color: "#fca5a5", letterSpacing: "0.02em" }}>
                      ⚠️ {urlError}
                    </span>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Mobile save buttons */}
              <div className="flex flex-col gap-2 lg:hidden">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => onSave(category)} className="w-full py-2.5 rounded-xl text-white" style={primaryBtnStyle}>
                  Save Changes
                </motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleClose} className="w-full py-2.5 rounded-xl text-white" style={secondaryBtnStyle}>
                  Cancel
                </motion.button>
              </div>

            </div>
          </motion.div>

          {/* ── Bottom Save Bar (desktop) ── */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18, duration: 0.32 }}
            className="hidden lg:flex items-center justify-between mt-3 px-4 py-2.5 rounded-2xl"
            style={{ background: "rgba(3,7,18,0.72)", border: "1px solid rgba(56,189,248,0.08)", backdropFilter: "blur(16px)" }}
          >
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: "8.5px", color: "rgba(100,116,139,0.45)", letterSpacing: "0.06em" }}>
              Editing · <span style={{ color: "rgba(56,189,248,0.45)" }}>{item.domain}</span>
            </span>
            <div className="flex items-center gap-2">
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={handleClose} className="px-4 py-2 rounded-xl text-white" style={secondaryBtnStyle}>
                Cancel
              </motion.button>
              <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => onSave(category)} className="px-5 py-2 rounded-xl text-white" style={primaryBtnStyle}>
                Save Changes
              </motion.button>
            </div>
          </motion.div>

        </div>
      </div>
    </>
  );
}