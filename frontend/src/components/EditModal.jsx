import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Globe2,
  Link2,
  Tag,
  ShieldAlert,
  Mail,
  Phone,
  TimerReset,
  MapPin,
  Check,
  ChevronDown,
  Clock,
  Bell,
} from "lucide-react";
import AlertRoutingForm from "./AlertRoutingForm";

const REGIONS = [
  "South America",
  "Australia",
  "North America",
  "Europe",
  "Asia",
  "Africa",
];

const CATEGORY_OPTIONS = [
  "JOURNALS",
  "E-JAYPEE",
  "JPMEDPUB",
  "JP-DIGITAL",
  "DIGINERVE",
  "Others",
];

const FREQUENCY_OPTIONS = [
  { label: "10 seconds",  value: 10_000 },
  { label: "30 seconds",  value: 30_000 },
  { label: "1 minute",    value: 60_000 },
  { label: "2 minutes",   value: 120_000 },
  { label: "5 minutes",   value: 300_000 },
  { label: "10 minutes",  value: 600_000 },
  { label: "15 minutes",  value: 900_000 },
  { label: "30 minutes",  value: 1_800_000 },
  { label: "1 hour",      value: 3_600_000 },
  { label: "6 hours",     value: 21_600_000 },
  { label: "12 hours",    value: 43_200_000 },
  { label: "1 day",       value: 86_400_000 },
];

// ─── Generic Dropdown ─────────────────────────────────────────────────────────
const CustomSelect = ({ value, onChange, options, placeholder, icon: Icon }) => {
  const [open, setOpen] = useState(false);
  const selected = options.find((o) => o.value === value || o === value);
  const displayLabel = selected
    ? typeof selected === "string" ? selected : selected.label
    : null;

  const handleSelect = (opt) => {
    onChange(typeof opt === "string" ? opt : opt.value);
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full px-4 py-3 rounded-2xl outline-none transition-all duration-200 flex items-center justify-between"
        style={{
          background: "rgba(255,255,255,0.02)",
          border: open
            ? "1px solid rgba(56,189,248,0.30)"
            : "1px solid rgba(56,189,248,0.10)",
          color: displayLabel ? "white" : "rgba(100,116,139,1)",
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "14px",
          boxShadow: open ? "0 0 0 2px rgba(56,189,248,0.15)" : "none",
          textAlign: "left",
        }}
      >
        <span style={{ fontSize: "14px" }}>{displayLabel || placeholder}</span>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: "rgba(56,189,248,0.5)", flexShrink: 0 }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 6, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 4, scale: 0.97 }}
            transition={{ duration: 0.15 }}
            className="absolute left-0 right-0 mt-2 rounded-2xl overflow-hidden z-[60]"
            style={{
              background: "rgba(3,7,18,0.97)",
              border: "1px solid rgba(56,189,248,0.14)",
              backdropFilter: "blur(28px)",
              boxShadow:
                "0 8px 40px rgba(0,0,0,0.7), 0 0 24px rgba(56,189,248,0.05)",
              maxHeight: "220px",
              overflowY: "auto",
            }}
          >
            {options.map((opt, idx) => {
              const optValue = typeof opt === "string" ? opt : opt.value;
              const optLabel = typeof opt === "string" ? opt : opt.label;
              const isSelected =
                typeof opt === "string" ? opt === value : opt.value === value;

              return (
                <button
                  key={optValue ?? idx}
                  type="button"
                  onClick={() => handleSelect(opt)}
                  className="w-full px-4 py-3 text-left transition-all duration-150 flex items-center justify-between"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "12px",
                    letterSpacing: "0.04em",
                    color: isSelected
                      ? "#38bdf8"
                      : "rgba(148,163,184,0.75)",
                    background: isSelected
                      ? "rgba(56,189,248,0.07)"
                      : "transparent",
                    borderTop:
                      idx === 0
                        ? "none"
                        : "1px solid rgba(56,189,248,0.045)",
                    borderLeft: isSelected
                      ? "2px solid rgba(56,189,248,0.45)"
                      : "2px solid transparent",
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background =
                        "rgba(255,255,255,0.03)";
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected)
                      e.currentTarget.style.background = "transparent";
                  }}
                >
                  <span>{optLabel}</span>
                  {isSelected && (
                    <span style={{ color: "#38bdf8", fontSize: "10px" }}>✓</span>
                  )}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

      {open && (
        <div className="fixed inset-0 z-50" onClick={() => setOpen(false)} />
      )}
    </div>
  );
};

// ─── Category Select (string values) ─────────────────────────────────────────
const CategorySelect = ({ value, onChange }) => (
  <CustomSelect
    value={value}
    onChange={onChange}
    options={CATEGORY_OPTIONS}
    placeholder="Select Category (optional)"
  />
);

// ─── Frequency Select (numeric values) ───────────────────────────────────────
const FrequencySelect = ({ value, onChange }) => (
  <CustomSelect
    value={value}
    onChange={(v) => onChange(Number(v))}
    options={FREQUENCY_OPTIONS}
    placeholder="Select Check Frequency"
    icon={Clock}
  />
);

export default function EditModal({
  item,
  editDomain,
  editUrl,
  setEditDomain,
  setEditUrl,
  editEmail,
  editPhone,
  editPriority,
  editResponseThresholdMs,
  editRegions,
  editCheckFrequency,
  editAlertRouting,
  editAlertGroups,
  setEditEmail,
  setEditPhone,
  setEditPriority,
  setEditResponseThresholdMs,
  setEditRegions,
  setEditCheckFrequency,
  setEditAlertRouting,
  setEditAlertGroups,
  urlError,
  onClose,
  onSave,
  initialCategory,
}) {
  const [category, setCategory] = useState(item?.category || "");
  const [emailInput, setEmailInput] = useState("");
  const [showGroupForm, setShowGroupForm] = useState(false);

  useEffect(() => {
    if (item?.category !== undefined) {
      setCategory(item.category || "");
    }
  }, [item]);

  useEffect(() => {
    if (initialCategory !== undefined) {
      setCategory(initialCategory || "");
    }
  }, [initialCategory]);

  if (!item) return null;

  const normalizedEmails = Array.isArray(editEmail)
    ? editEmail
    : editEmail
    ? [editEmail]
    : [];

  const toggleRegion = (region) => {
    setEditRegions((prev) =>
      prev.includes(region)
        ? prev.filter((r) => r !== region)
        : [...prev, region]
    );
  };

  const removeRegion = (region) => {
    setEditRegions((prev) => prev.filter((r) => r !== region));
  };

  const handleAddEmail = () => {
    const value = (emailInput || "").trim();
    if (!value) return;
    if (!normalizedEmails.includes(value)) {
      setEditEmail([...normalizedEmails, value]);
    }
    setEmailInput("");
  };

  const handleRemoveEmail = (email) => {
    setEditEmail((prev) =>
      Array.isArray(prev) ? prev.filter((e) => e !== email) : []
    );
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-md flex items-center justify-center px-4 py-6">
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 18, scale: 0.98 }}
        transition={{ duration: 0.25 }}
        className="relative w-full max-w-4xl max-h-[92vh] rounded-[28px] overflow-hidden"
        style={{
          background: "rgba(3,7,18,0.88)",
          border: "1px solid rgba(56,189,248,0.10)",
          backdropFilter: "blur(22px)",
          WebkitBackdropFilter: "blur(22px)",
          boxShadow:
            "0 0 30px rgba(56,189,248,0.05), 0 0 80px rgba(129,140,248,0.03)",
        }}
      >
        {/* Ambient Glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(circle at top right, rgba(56,189,248,0.08) 0%, transparent 30%), radial-gradient(circle at bottom left, rgba(129,140,248,0.06) 0%, transparent 28%)",
          }}
        />

        {/* Grid Overlay */}
        <div
          className="absolute inset-0 pointer-events-none opacity-40"
          style={{
            backgroundImage:
              "linear-gradient(rgba(148,163,184,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.03) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
          }}
        />

        <div className="relative z-10 flex flex-col max-h-[92vh]">
          {/* Sticky Header */}
          <div className="sticky top-0 z-20 px-6 sm:px-8 pt-6 sm:pt-8 pb-5 border-b border-sky-400/10 backdrop-blur-xl bg-[rgba(3,7,18,0.72)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-3">
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
                    Edit Monitor
                  </span>
                  <div className="h-[1px] w-16 bg-sky-400/10" />
                </div>

                <h2
                  className="text-2xl sm:text-3xl text-white"
                  style={{
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 800,
                    letterSpacing: "0.05em",
                    textShadow: "0 0 24px rgba(56,189,248,0.08)",
                  }}
                >
                  EDIT WEBSITE
                </h2>

                <p
                  className="mt-2"
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    color: "rgba(148,163,184,0.52)",
                    letterSpacing: "0.03em",
                  }}
                >
                  Update monitoring details and response behavior.
                </p>
              </div>

              <motion.button
                whileHover={{ scale: 1.04, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={onClose}
                className="inline-flex items-center justify-center rounded-xl w-10 h-10 shrink-0"
                style={{
                  background:
                    "linear-gradient(135deg, rgba(56,189,248,0.08) 0%, rgba(129,140,248,0.08) 100%)",
                  border: "1px solid rgba(56,189,248,0.16)",
                }}
              >
                <X size={16} className="text-white" />
              </motion.button>
            </div>
          </div>

          {/* Scrollable Body */}
          <div className="overflow-y-auto px-6 sm:px-8 py-6 custom-scroll">
            <div className="space-y-8">
              {/* Section: Basic Info */}
              <SectionTitle title="Basic Details" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <FieldWrapper label="Domain Name" icon={Globe2}>
                  <input
                    value={editDomain}
                    onChange={(e) => setEditDomain(e.target.value)}
                    placeholder="example.com"
                    className={inputClass}
                  />
                </FieldWrapper>

                {/* Category Dropdown */}
                <FieldWrapper label="Category" icon={Tag}>
                  <CategorySelect value={category} onChange={setCategory} />
                </FieldWrapper>

                <FieldWrapper label="Website URL" icon={Link2} full>
                  <input
                    value={editUrl}
                    onChange={(e) => setEditUrl(e.target.value)}
                    placeholder="https://example.com"
                    className={inputClass}
                  />
                </FieldWrapper>
              </div>

              {/* Section: Monitoring */}
              <SectionTitle title="Monitoring Settings" />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Priority */}
                <div>
                  <FieldLabel icon={ShieldAlert} text="Priority" />
                  <label
                    className="flex items-center gap-3 cursor-pointer px-4 rounded-2xl h-[50px]"
                    style={cardFieldStyle}
                  >
                    <input
                      type="checkbox"
                      checked={Number(editPriority) === 1}
                      onChange={(e) =>
                        setEditPriority(e.target.checked ? 1 : 0)
                      }
                      className="accent-red-500 w-4 h-4 shrink-0"
                    />
                    <span
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "11px",
                        color:
                          Number(editPriority) === 1
                            ? "#f87171"
                            : "rgba(148,163,184,0.70)",
                        letterSpacing: "0.06em",
                        textTransform: "uppercase",
                      }}
                    >
                      High Priority Monitor
                    </span>
                  </label>
                </div>

                {/* Response Threshold */}
                <div>
                  <FieldLabel icon={TimerReset} text="Max Response (ms)" />
                  <input
                    type="number"
                    value={editResponseThresholdMs}
                    onChange={(e) =>
                      setEditResponseThresholdMs(e.target.value)
                    }
                    placeholder="2000"
                    className={inputClass}
                  />
                </div>

                {/* Check Frequency Dropdown — full width */}
                <div className="md:col-span-2">
                  <FieldLabel icon={Clock} text="Check Frequency" />
                  <FrequencySelect
                    value={editCheckFrequency}
                    onChange={setEditCheckFrequency}
                  />
                  <p
                    className="mt-1.5"
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "10px",
                      color: "rgba(100,116,139,0.6)",
                      letterSpacing: "0.02em",
                    }}
                  >
                    How often this site is pinged. Min: 10 sec · Max: 1 day ·
                    Default: 1 min
                  </p>
                </div>
              </div>

              {/* Regions */}
              <div>
                <FieldLabel icon={MapPin} text="Regions" />
                <div className="rounded-2xl p-4" style={cardFieldStyle}>
                  <div className="flex flex-wrap gap-3">
                    {REGIONS.map((region) => {
                      const selected = editRegions.includes(region);

                      return (
                        <button
                          key={region}
                          type="button"
                          onClick={() => toggleRegion(region)}
                          className="group inline-flex items-center gap-2 px-4 py-2.5 rounded-full transition-all duration-200"
                          style={{
                            background: selected
                              ? "rgba(52,211,153,0.14)"
                              : "rgba(255,255,255,0.03)",
                            border: selected
                              ? "1px solid rgba(52,211,153,0.30)"
                              : "1px solid rgba(56,189,248,0.12)",
                            boxShadow: selected
                              ? "0 0 20px rgba(52,211,153,0.06)"
                              : "none",
                          }}
                        >
                          <div
                            className="w-4 h-4 rounded-md flex items-center justify-center"
                            style={{
                              background: selected
                                ? "rgba(52,211,153,0.18)"
                                : "rgba(255,255,255,0.04)",
                              border: selected
                                ? "1px solid rgba(52,211,153,0.35)"
                                : "1px solid rgba(56,189,248,0.10)",
                            }}
                          >
                            {selected && (
                              <Check size={10} className="text-emerald-400" />
                            )}
                          </div>

                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "10px",
                              letterSpacing: "0.05em",
                              textTransform: "uppercase",
                              color: selected
                                ? "#86efac"
                                : "rgba(148,163,184,0.70)",
                            }}
                          >
                            {region}
                          </span>
                        </button>
                      );
                    })}
                  </div>

                  <AnimatePresence>
                    {editRegions.length > 0 && (
                      <motion.div
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: 6 }}
                        className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-sky-400/10"
                      >
                        {editRegions.map((region) => (
                          <motion.span
                            key={region}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.9 }}
                            className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                            style={{
                              background: "rgba(52,211,153,0.12)",
                              border: "1px solid rgba(52,211,153,0.22)",
                            }}
                          >
                            <span
                              style={{
                                fontFamily: "'JetBrains Mono', monospace",
                                fontSize: "10px",
                                letterSpacing: "0.04em",
                                textTransform: "uppercase",
                                color: "#6ee7b7",
                              }}
                            >
                              {region}
                            </span>
                            <button
                              type="button"
                              onClick={() => removeRegion(region)}
                              className="hover:text-red-400 transition-colors"
                              style={{ color: "rgba(110,231,183,0.55)" }}
                            >
                              <X size={10} />
                            </button>
                          </motion.span>
                        ))}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Section: Notifications */}
              <SectionTitle title="Alert Contacts" />

              <div className="space-y-5">
                <FieldWrapper label="Contact Emails" icon={Mail}>
                  <div className="flex flex-col sm:flex-row gap-3 mb-4">
                    <input
                      type="email"
                      placeholder="Add email"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddEmail();
                        }
                      }}
                      className={inputClass}
                    />

                    <motion.button
                      type="button"
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleAddEmail}
                      className="px-5 py-3 rounded-2xl text-white shrink-0"
                      style={primaryButtonStyle}
                    >
                      Add
                    </motion.button>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {normalizedEmails.length > 0 ? (
                      normalizedEmails.map((email, i) => (
                        <span
                          key={i}
                          className="px-3 py-2 rounded-full flex items-center gap-2"
                          style={{
                            background: "rgba(56,189,248,0.08)",
                            border: "1px solid rgba(56,189,248,0.18)",
                            color: "#7dd3fc",
                          }}
                        >
                          <span
                            style={{
                              fontFamily: "'JetBrains Mono', monospace",
                              fontSize: "11px",
                            }}
                          >
                            {email}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveEmail(email)}
                            className="text-red-400 text-xs hover:text-red-300 transition"
                          >
                            ✕
                          </button>
                        </span>
                      ))
                    ) : (
                      <span className="text-slate-500 text-sm font-mono">
                        No emails added yet
                      </span>
                    )}
                  </div>
                </FieldWrapper>

                <FieldWrapper label="Contact Phone" icon={Phone}>
                  <input
                    value={editPhone}
                    onChange={(e) => setEditPhone(e.target.value)}
                    placeholder="+91 9876543210"
                    className={inputClass}
                  />
                </FieldWrapper>
              </div>

              {/* Section: Alert Group Configuration */}
              <SectionTitle title="Alert Group Configuration" />
              <div className="space-y-4">
                {/* Create Group Button */}
                <motion.button
                  type="button"
                  onClick={() => setShowGroupForm(!showGroupForm)}
                  className="w-full px-4 py-3 rounded-2xl flex items-center justify-between"
                  style={{
                    background: "rgba(255,255,255,0.02)",
                    border: "1px solid rgba(56,189,248,0.10)",
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "11px",
                    letterSpacing: "0.10em",
                    textTransform: "uppercase",
                    color: "rgba(56,189,248,0.8)",
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span className="flex items-center gap-2">
                    <Bell size={14} />
                    Configure Alert Group
                  </span>
                  <ChevronDown
                    size={14}
                    style={{
                      transform: showGroupForm ? "rotate(180deg)" : "rotate(0deg)",
                      transition: "transform 0.2s",
                    }}
                  />
                </motion.button>

                {/* Collapsible Group Form */}
                {showGroupForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    {/* Email Fields */}
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "rgba(56,189,248,0.7)" }}>
                          Developer Email
                        </label>
                        <input
                          type="email"
                          value={editAlertGroups?.developer || ""}
                          onChange={(e) => setEditAlertGroups(prev => ({ ...prev, developer: e.target.value }))}
                          placeholder="developer@company.com"
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(56,189,248,0.10)",
                            color: "white",
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "rgba(56,189,248,0.7)" }}>
                          Product Manager Email
                        </label>
                        <input
                          type="email"
                          value={editAlertGroups?.pm || ""}
                          onChange={(e) => setEditAlertGroups(prev => ({ ...prev, pm: e.target.value }))}
                          placeholder="pm@company.com"
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(56,189,248,0.10)",
                            color: "white",
                          }}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium mb-1" style={{ color: "rgba(56,189,248,0.7)" }}>
                          AVP Email
                        </label>
                        <input
                          type="email"
                          value={editAlertGroups?.avp || ""}
                          onChange={(e) => setEditAlertGroups(prev => ({ ...prev, avp: e.target.value }))}
                          placeholder="avp@company.com"
                          className="w-full px-3 py-2 rounded-lg text-sm"
                          style={{
                            background: "rgba(255,255,255,0.02)",
                            border: "1px solid rgba(56,189,248,0.10)",
                            color: "white",
                          }}
                        />
                      </div>
                    </div>

                    {/* Alert Routing */}
                    <AlertRoutingForm
                      value={editAlertRouting || { down: [], trouble: [], critical: [] }}
                      onChange={setEditAlertRouting}
                    />
                  </motion.div>
                )}
              </div>

              {/* Error */}
              <AnimatePresence>
                {urlError && (
                  <motion.div
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-2xl px-4 py-3"
                    style={{
                      background: "rgba(248,113,113,0.08)",
                      border: "1px solid rgba(248,113,113,0.24)",
                    }}
                  >
                    <div
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "11px",
                        color: "#fca5a5",
                        letterSpacing: "0.02em",
                      }}
                    >
                      ⚠️ {urlError}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          {/* Sticky Footer */}
          <div className="sticky bottom-0 z-20 px-6 sm:px-8 py-5 border-t border-sky-400/10 backdrop-blur-xl bg-[rgba(3,7,18,0.72)]">
            <div className="flex flex-col sm:flex-row justify-end gap-3">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={onClose}
                className="px-5 py-3 rounded-2xl text-white"
                style={secondaryButtonStyle}
              >
                Cancel
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSave(category)}
                className="px-6 py-3 rounded-2xl text-white"
                style={primaryButtonStyle}
              >
                Save Changes
              </motion.button>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ─────────────────────── Section Title ─────────────────────── */
function SectionTitle({ title }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-[1px] w-8 bg-sky-400/20" />
      <h3
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "11px",
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: "rgba(56,189,248,0.62)",
        }}
      >
        {title}
      </h3>
      <div className="h-[1px] flex-1 bg-sky-400/10" />
    </div>
  );
}

/* ─────────────────────── Compact field label ─────────────────────── */
function FieldLabel({ icon: Icon, text }) {
  return (
    <div
      className="flex items-center gap-1.5 mb-2"
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: "10px",
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        color: "rgba(56,189,248,0.55)",
      }}
    >
      <Icon size={12} className="text-sky-400 shrink-0" />
      <span>{text}</span>
    </div>
  );
}

/* ─────────────────────── Field Wrapper ─────────────────────── */
function FieldWrapper({ label, icon: Icon, children, full = false }) {
  return (
    <div className={full ? "md:col-span-2" : ""}>
      <label
        className="flex items-center gap-2 mb-2"
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "10px",
          letterSpacing: "0.14em",
          textTransform: "uppercase",
          color: "rgba(56,189,248,0.55)",
        }}
      >
        <Icon size={13} className="text-sky-400" />
        {label}
      </label>
      {children}
    </div>
  );
}

/* ─────────────────────── Shared Styles ─────────────────────── */
const inputClass = `
  w-full px-4 py-3 rounded-2xl
  bg-[rgba(255,255,255,0.02)]
  border border-[rgba(56,189,248,0.10)]
  text-white placeholder:text-slate-500
  focus:outline-none focus:ring-2 focus:ring-sky-500/40 focus:border-sky-400/30
  transition-all duration-200
  font-mono text-sm
`;

const cardFieldStyle = {
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(56,189,248,0.10)",
};

const primaryButtonStyle = {
  background:
    "linear-gradient(135deg, rgba(14,165,233,0.18) 0%, rgba(59,130,246,0.18) 100%)",
  border: "1px solid rgba(56,189,248,0.22)",
  boxShadow: "0 0 20px rgba(56,189,248,0.06)",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "11px",
  letterSpacing: "0.10em",
  textTransform: "uppercase",
};

const secondaryButtonStyle = {
  background: "rgba(255,255,255,0.03)",
  border: "1px solid rgba(148,163,184,0.12)",
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: "11px",
  letterSpacing: "0.08em",
  textTransform: "uppercase",
};