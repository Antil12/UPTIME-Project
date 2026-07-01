import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, Plus, X, Mail, Phone, Users, RefreshCw, Check } from "lucide-react";
import axios from "axios";
import { createNotificationGroup } from "../api/notificationGroupApi";
import { useTheme } from "../contexts/ThemeContext";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  font: "'IBM Plex Mono', 'Fira Code', monospace",
};

// ─── Status badge pill ─────────────────────────────────────────────────────────
const StatusDot = ({ color }) => (
  <span style={{
    display: "inline-block", width: 5, height: 5, borderRadius: "50%",
    background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0,
    marginRight: 6,
  }} />
);

// ─── Notification Group Multi-Select Dropdown ─────────────────────────────────
const NotificationGroupSelect = ({
  label,
  value = [],
  onChange,
  groups,
  color,
  icon: Icon,
  loading,
  type = "email",
  onGroupCreated
}) => {
  const { currentTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const [showCreate, setShowCreate] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupEmails, setNewGroupEmails] = useState("");
  const [newGroupPhones, setNewGroupPhones] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState("");

  const triggerRef = useRef(null);
  const searchRef = useRef(null);

  const calcPos = () => {
    if (!triggerRef.current) return;
    const rect = triggerRef.current.getBoundingClientRect();
    setDropPos({
      top: rect.bottom + window.scrollY + 4,
      left: rect.left + window.scrollX,
      width: rect.width,
    });
  };

  const handleOpen = () => {
    if (!open) { calcPos(); setSearch(""); }
    setOpen((v) => !v);
  };

  useEffect(() => {
    if (!open) return;
    window.addEventListener("scroll", calcPos, true);
    window.addEventListener("resize", calcPos);
    setTimeout(() => searchRef.current?.focus(), 50);
    return () => {
      window.removeEventListener("scroll", calcPos, true);
      window.removeEventListener("resize", calcPos);
    };
  }, [open]);

  const toggle = (id) => {
    const isSelected = value.includes(id);
    const updatedValue = isSelected
      ? value.filter((v) => v !== id)
      : [...value, id];
    onChange(updatedValue);
    if (!isSelected) {
      setOpen(false);
      setSearch("");
    }
  };

  const filtered = groups.filter(
    (g) =>
      !search ||
      g.groupName.toLowerCase().includes(search.toLowerCase()) ||
      g.description?.toLowerCase().includes(search.toLowerCase())
  );

  const selectedGroups = groups.filter((g) => value.includes(g._id));
  const hasSelected = selectedGroups.length > 0;

  const glowStyle = open
    ? { boxShadow: `0 0 0 1px ${color}30, 0 0 20px ${color}12` }
    : {};

  const handleCreateGroup = async () => {
    setCreateError("");
    if (!newGroupName.trim()) {
      setCreateError("Group name is required");
      return;
    }

    const emailArray = newGroupEmails.split(/[,;\n]/).map((e) => e.trim()).filter(Boolean);
    const phoneArray = newGroupPhones.split(/[,;\n]/).map((p) => p.trim()).filter(Boolean);

    if (emailArray.length === 0 && phoneArray.length === 0) {
      setCreateError("At least one email or phone number is required");
      return;
    }

    try {
      setCreating(true);
      const res = await createNotificationGroup({
        groupName: newGroupName.trim(),
        emails: emailArray,
        phoneNumbers: phoneArray,
        description: newGroupDescription.trim(),
      });

      if (res.success && onGroupCreated) {
        onGroupCreated(res.data);
        setNewGroupName("");
        setNewGroupEmails("");
        setNewGroupPhones("");
        setNewGroupDescription("");
        setShowCreate(false);
      }
    } catch (err) {
      setCreateError(err.response?.data?.message || "Failed to create group");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="w-full" style={{ position: "relative" }}>
      {/* Label row */}
      {label && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <StatusDot color={color} />
          <span style={{
            fontFamily: T.font, fontSize: 9, letterSpacing: "0.2em",
            color: currentTheme.accent, textTransform: "uppercase", fontWeight: 600,
          }}>
            {label} Notification Group
          </span>
          {Icon && (
            <Icon size={10} style={{ color, opacity: 0.7, marginLeft: 2 }} />
          )}
          {hasSelected && (
            <span style={{
              marginLeft: "auto", fontFamily: T.font, fontSize: 8,
              color: currentTheme.textSecondary, letterSpacing: "0.1em",
              background: `rgba(255,255,255,0.05)`, border: `1px solid ${currentTheme.borderAccent}`,
              padding: "2px 7px", borderRadius: 99,
            }}>
              {selectedGroups.length} group{selectedGroups.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Trigger button — clean glass, no scanlines */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        style={{
          width: "100%", padding: "0 14px", minHeight: 52, borderRadius: 12,
          outline: "none", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between", gap: 8,
          background: open ? `rgba(255,255,255,0.06)` : `rgba(255,255,255,0.03)`,
          border: `1px solid ${open ? currentTheme.accent : currentTheme.borderAccent}`,
          color: hasSelected ? currentTheme.text : currentTheme.textMuted,
          fontFamily: T.font, fontSize: 11, letterSpacing: "0.04em",
          backdropFilter: "blur(18px)", transition: "all 0.2s",
          textAlign: "left", overflow: "hidden",
          ...glowStyle,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
          {loading ? (
            <span style={{ color: currentTheme.textMuted, display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} />
              Fetching groups…
            </span>
          ) : !hasSelected ? (
            <span style={{ color: currentTheme.textMuted }}>Add from notification group (optional)</span>
          ) : (
            selectedGroups.map((g) => (
              <motion.span
                key={g._id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.8, opacity: 0 }}
                style={{
                  display: "flex", alignItems: "center", gap: 5,
                  padding: "3px 8px 3px 10px", borderRadius: 8,
                  background: `${color}16`, border: `1px solid ${color}30`,
                  color, fontSize: 9, letterSpacing: "0.07em", fontWeight: 600,
                }}
              >
                <StatusDot color={color} />
                {g.groupName}
                <span
                  style={{ cursor: "pointer", display: "flex", opacity: 0.6 }}
                  onClick={(e) => { e.stopPropagation(); toggle(g._id); }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "0.6"}
                >
                  <X size={9} />
                </span>
              </motion.span>
            ))
          )}
        </div>
        <motion.span
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
          style={{ color: open ? currentTheme.accent : currentTheme.textMuted, flexShrink: 0 }}
        >
          <ChevronDown size={14} />
        </motion.span>
      </button>

      {/* Portal dropdown */}
      {open &&
        createPortal(
          <>
            <div
              style={{ position: "fixed", inset: 0, zIndex: 9998 }}
              onClick={() => setOpen(false)}
            />
            <motion.div
              initial={{ opacity: 0, y: -8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
              style={{
                position: "absolute", top: dropPos.top, left: dropPos.left,
                width: dropPos.width, zIndex: 9999,
                background: currentTheme.bgCard,
                border: `1px solid ${currentTheme.borderAccent}`,
                backdropFilter: "blur(40px)",
                boxShadow: currentTheme.shadow,
                borderRadius: 14, overflow: "hidden",
              }}
            >
              {!showCreate ? (
                <>
                  {/* Search bar */}
                  <div style={{
                    padding: "10px 12px 8px",
                    borderBottom: `1px solid ${currentTheme.borderAccent}`,
                  }}>
                    <input
                      ref={searchRef}
                      type="text"
                      placeholder="Search groups…"
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      style={{
                        width: "100%", padding: "6px 10px", borderRadius: 8,
                        background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderAccent}`,
                        color: currentTheme.text, fontFamily: T.font, fontSize: 10,
                        letterSpacing: "0.04em", outline: "none",
                      }}
                    />
                  </div>

                  {/* Items */}
                  <div style={{ maxHeight: 220, overflowY: "auto" }}>
                    {loading ? (
                      <div style={{ padding: "24px", textAlign: "center", fontFamily: T.font, fontSize: 10, color: currentTheme.textMuted }}>
                        Loading…
                      </div>
                    ) : filtered.length === 0 ? (
                      <div style={{ padding: "24px", textAlign: "center", fontFamily: T.font, fontSize: 10, color: currentTheme.textMuted }}>
                        {search ? "No groups match." : "No groups found."}
                      </div>
                    ) : (
                      filtered.map((g, idx) => {
                        const sel = value.includes(g._id);
                        const contactCount = type === "email"
                          ? (g.emails?.length ?? 0)
                          : (g.phoneNumbers?.length ?? 0);
                        return (
                          <button
                            key={g._id}
                            type="button"
                            onClick={() => toggle(g._id)}
                            style={{
                              width: "100%", padding: "11px 14px",
                              textAlign: "left", display: "flex",
                              alignItems: "center", justifyContent: "space-between", gap: 12,
                              fontFamily: T.font, fontSize: 11, letterSpacing: "0.03em",
                              color: sel ? currentTheme.accent : currentTheme.text,
                              background: sel ? `${currentTheme.accent}15` : "transparent",
                              border: "none",
                              borderTop: idx === 0 ? "none" : `1px solid ${currentTheme.borderAccent}`,
                              borderLeft: `2px solid ${sel ? currentTheme.accent : "transparent"}`,
                              cursor: "pointer", transition: "all 0.12s",
                            }}
                            onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = currentTheme.bgInput; }}
                            onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                          >
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                                {sel && <StatusDot color={color} />}
                                <span style={{ fontWeight: sel ? 600 : 400 }}>{g.groupName}</span>
                              </div>
                              {g.description && (
                                <div style={{ fontSize: 9, color: currentTheme.textMuted, marginTop: 2, letterSpacing: "0.05em" }}>
                                  {g.description}
                                </div>
                              )}
                              <div style={{ fontSize: 9, color: currentTheme.textSecondary, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                                <Users size={8} />
                                {contactCount} {type === "email" ? "email" : "phone"}{contactCount !== 1 ? "s" : ""}
                              </div>
                              {g.owner && (
                                <div style={{
                                  fontSize: 9,
                                  color: currentTheme.textSecondary,
                                  marginTop: 4,
                                  letterSpacing: "0.06em",
                                  fontWeight: 500,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 4,
                                  borderTop: `1px solid ${currentTheme.borderAccent}`,
                                  paddingTop: 6
                                }}>
                                  <span style={{ opacity: 0.7 }}>Created by</span>
                                  <span style={{ fontWeight: 600 }}>{g.owner.name || g.owner.email}</span>
                                  <span style={{
                                    background: currentTheme.bgInput,
                                    padding: "1px 6px",
                                    borderRadius: 4,
                                    fontSize: 7,
                                    letterSpacing: "0.1em"
                                  }}>
                                    {g.owner.role}
                                  </span>
                                </div>
                              )}
                            </div>
                            <AnimatePresence>
                              {sel && (
                                <motion.div
                                  initial={{ scale: 0, opacity: 0 }}
                                  animate={{ scale: 1, opacity: 1 }}
                                  exit={{ scale: 0, opacity: 0 }}
                                  style={{
                                    width: 20, height: 20, borderRadius: 6,
                                    background: `${color}20`, border: `1px solid ${color}40`,
                                    display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
                                  }}
                                >
                                  <Check size={11} style={{ color }} />
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </button>
                        );
                      })
                    )}
                  </div>

                  {/* Create new group button */}
                  <div style={{
                    padding: "8px 12px",
                    borderTop: `1px solid ${currentTheme.borderAccent}`,
                  }}>
                    <button
                      type="button"
                      onClick={() => setShowCreate(true)}
                      style={{
                        width: "100%", padding: "8px 12px", borderRadius: 8,
                        background: `rgba(255,255,255,0.04)`, border: `1px solid ${currentTheme.borderAccent}`,
                        color: currentTheme.accent, fontFamily: T.font, fontSize: 10,
                        letterSpacing: "0.04em", cursor: "pointer",
                        display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        transition: "all 0.15s",
                      }}
                      onMouseEnter={(e) => e.currentTarget.style.background = `rgba(255,255,255,0.08)`}
                      onMouseLeave={(e) => e.currentTarget.style.background = `rgba(255,255,255,0.04)`}
                    >
                      <Plus size={12} />
                      Create New Group
                    </button>
                  </div>
                </>
              ) : (
                <>
                  {/* Create group form */}
                  <div style={{ padding: "12px" }}>
                    <div style={{ marginBottom: 10 }}>
                      <label style={{
                        display: "block", fontFamily: T.font, fontSize: 9,
                        color: currentTheme.textSecondary, marginBottom: 4, letterSpacing: "0.05em"
                      }}>
                        Group Name *
                      </label>
                      <input
                        type="text"
                        placeholder="Enter group name"
                        value={newGroupName}
                        onChange={(e) => setNewGroupName(e.target.value)}
                        style={{
                          width: "100%", padding: "8px 10px", borderRadius: 8,
                          background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderAccent}`,
                          color: currentTheme.text, fontFamily: T.font, fontSize: 10,
                          letterSpacing: "0.04em", outline: "none",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <label style={{
                        display: "block", fontFamily: T.font, fontSize: 9,
                        color: currentTheme.textSecondary, marginBottom: 4, letterSpacing: "0.05em"
                      }}>
                        Emails (comma-separated)
                      </label>
                      <textarea
                        placeholder="email1@example.com, email2@example.com"
                        value={newGroupEmails}
                        onChange={(e) => setNewGroupEmails(e.target.value)}
                        rows={2}
                        style={{
                          width: "100%", padding: "8px 10px", borderRadius: 8,
                          background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderAccent}`,
                          color: currentTheme.text, fontFamily: T.font, fontSize: 10,
                          letterSpacing: "0.04em", outline: "none", resize: "none",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <label style={{
                        display: "block", fontFamily: T.font, fontSize: 9,
                        color: currentTheme.textSecondary, marginBottom: 4, letterSpacing: "0.05em"
                      }}>
                        Phone Numbers (comma-separated)
                      </label>
                      <textarea
                        placeholder="+91 9876543210, +1 2345678900"
                        value={newGroupPhones}
                        onChange={(e) => setNewGroupPhones(e.target.value)}
                        rows={2}
                        style={{
                          width: "100%", padding: "8px 10px", borderRadius: 8,
                          background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderAccent}`,
                          color: currentTheme.text, fontFamily: T.font, fontSize: 10,
                          letterSpacing: "0.04em", outline: "none", resize: "none",
                        }}
                      />
                    </div>

                    <div style={{ marginBottom: 10 }}>
                      <label style={{
                        display: "block", fontFamily: T.font, fontSize: 9,
                        color: currentTheme.textSecondary, marginBottom: 4, letterSpacing: "0.05em"
                      }}>
                        Description
                      </label>
                      <input
                        type="text"
                        placeholder="Optional description"
                        value={newGroupDescription}
                        onChange={(e) => setNewGroupDescription(e.target.value)}
                        style={{
                          width: "100%", padding: "8px 10px", borderRadius: 8,
                          background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderAccent}`,
                          color: currentTheme.text, fontFamily: T.font, fontSize: 10,
                          letterSpacing: "0.04em", outline: "none",
                        }}
                      />
                    </div>

                    {createError && (
                      <div style={{
                        padding: "6px 10px", borderRadius: 6, marginBottom: 10,
                        background: currentTheme.errorBg, border: `1px solid ${currentTheme.error}50`,
                        color: currentTheme.error, fontFamily: T.font, fontSize: 9,
                      }}>
                        {createError}
                      </div>
                    )}

                    <div style={{ display: "flex", gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => { setShowCreate(false); setCreateError(""); }}
                        disabled={creating}
                        style={{
                          flex: 1, padding: "8px 12px", borderRadius: 8,
                          background: "transparent", border: `1px solid ${currentTheme.borderAccent}`,
                          color: currentTheme.textSecondary, fontFamily: T.font, fontSize: 10,
                          letterSpacing: "0.04em", cursor: creating ? "not-allowed" : "pointer",
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        onClick={handleCreateGroup}
                        disabled={creating}
                        style={{
                          flex: 1, padding: "8px 12px", borderRadius: 8,
                          background: creating ? `rgba(255,255,255,0.04)` : currentTheme.accentGlow,
                          border: `1px solid ${currentTheme.accent}`,
                          color: currentTheme.accent, fontFamily: T.font, fontSize: 10,
                          letterSpacing: "0.04em", cursor: creating ? "not-allowed" : "pointer",
                          display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
                        }}
                      >
                        {creating ? (
                          <RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} />
                        ) : (
                          <Plus size={10} />
                        )}
                        {creating ? "Creating..." : "Create"}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </motion.div>
          </>,
          document.body
        )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

export default NotificationGroupSelect;