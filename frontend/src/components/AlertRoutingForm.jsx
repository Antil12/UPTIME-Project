import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, Plus, X, Mail, Check,
  AlertTriangle, Zap, ShieldAlert, RefreshCw, Users,
} from "lucide-react";
import axios from "axios";

// ─── Design tokens ─────────────────────────────────────────────────────────────
const T = {
  font: "'IBM Plex Mono', 'Fira Code', monospace",
  bg: "rgba(8, 10, 18, 1)",
  surface: "rgba(255,255,255,0.028)",
  surfaceHover: "rgba(255,255,255,0.05)",
  border: "rgba(255,255,255,0.07)",
  borderStrong: "rgba(255,255,255,0.13)",
  dim: "rgba(255,255,255,0.28)",
  mid: "rgba(255,255,255,0.55)",
  bright: "rgba(255,255,255,0.9)",
};

// ─── Scanline / grid overlay for atmosphere ────────────────────────────────────
const ScanlineTexture = () => (
  <div
    aria-hidden
    style={{
      position: "absolute", inset: 0, pointerEvents: "none", zIndex: 0,
      backgroundImage:
        "repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.08) 3px,rgba(0,0,0,0.08) 4px)",
      borderRadius: "inherit",
    }}
  />
);

// ─── Status badge pill ─────────────────────────────────────────────────────────
const StatusDot = ({ color }) => (
  <span style={{
    display: "inline-block", width: 5, height: 5, borderRadius: "50%",
    background: color, boxShadow: `0 0 6px ${color}`, flexShrink: 0,
    marginRight: 6,
  }} />
);

// ─── Portal Multi-Select Dropdown ─────────────────────────────────────────────
const GroupMultiSelect = ({ label, value = [], onChange, groups, color, icon: Icon, loading, routeKey }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
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

  // Close dropdown after selecting a group
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

  return (
    <div className="w-full" style={{ position: "relative" }}>
      {/* Label row */}
      {label && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
          <StatusDot color={color} />
          <span style={{
            fontFamily: T.font, fontSize: 9, letterSpacing: "0.2em",
            color, textTransform: "uppercase", fontWeight: 600,
          }}>
            {label} Alert Route
          </span>
          {Icon && (
            <Icon size={10} style={{ color, opacity: 0.7, marginLeft: 2 }} />
          )}
          {hasSelected && (
            <span style={{
              marginLeft: "auto", fontFamily: T.font, fontSize: 8,
              color: `${color}99`, letterSpacing: "0.1em",
              background: `${color}12`, border: `1px solid ${color}22`,
              padding: "2px 7px", borderRadius: 99,
            }}>
              {selectedGroups.length} group{selectedGroups.length !== 1 ? "s" : ""}
            </span>
          )}
        </div>
      )}

      {/* Trigger button */}
      <button
        ref={triggerRef}
        type="button"
        onClick={handleOpen}
        style={{
          width: "100%", padding: "0 14px", minHeight: 52, borderRadius: 12,
          outline: "none", cursor: "pointer", display: "flex",
          alignItems: "center", justifyContent: "space-between", gap: 8,
          background: open ? `${color}08` : T.surface,
          border: `1px solid ${open ? `${color}35` : T.border}`,
          color: hasSelected ? T.bright : T.dim,
          fontFamily: T.font, fontSize: 11, letterSpacing: "0.04em",
          backdropFilter: "blur(18px)", transition: "all 0.2s",
          textAlign: "left", position: "relative", overflow: "hidden",
          ...glowStyle,
        }}
      >
        <ScanlineTexture />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1, position: "relative", zIndex: 1 }}>
          {loading ? (
            <span style={{ color: T.dim, display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} />
              Fetching groups…
            </span>
          ) : !hasSelected ? (
            <span style={{ color: T.dim }}>Route to escalation group (optional)</span>
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
          style={{ color: open ? color : T.dim, flexShrink: 0, position: "relative", zIndex: 1 }}
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
                background: "rgba(8,10,18,0.98)",
                border: `1px solid ${color}25`,
                backdropFilter: "blur(40px)",
                boxShadow: `0 16px 64px rgba(0,0,0,0.8), 0 0 0 1px ${color}12, inset 0 1px 0 ${color}08`,
                borderRadius: 14, overflow: "hidden",
              }}
            >
              {/* Search bar inside dropdown */}
              <div style={{
                padding: "10px 12px 8px",
                borderBottom: `1px solid ${color}12`,
                position: "relative",
              }}>
                <input
                  ref={searchRef}
                  type="text"
                  placeholder="Search groups…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  style={{
                    width: "100%", padding: "6px 10px", borderRadius: 8,
                    background: `${color}08`, border: `1px solid ${color}18`,
                    color: T.bright, fontFamily: T.font, fontSize: 10,
                    letterSpacing: "0.04em", outline: "none",
                  }}
                />
              </div>

              {/* Items */}
              <div style={{ maxHeight: 220, overflowY: "auto" }}>
                {loading ? (
                  <div style={{ padding: "24px", textAlign: "center", fontFamily: T.font, fontSize: 10, color: T.dim }}>
                    Loading…
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", fontFamily: T.font, fontSize: 10, color: T.dim }}>
                    {search ? "No groups match." : "No groups found."}
                  </div>
                ) : (
                  filtered.map((g, idx) => {
                    const sel = value.includes(g._id);
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
                          color: sel ? color : T.mid,
                          background: sel ? `${color}10` : "transparent",
                          border: "none",
                          borderTop: idx === 0 ? "none" : `1px solid rgba(255,255,255,0.04)`,
                          borderLeft: `2px solid ${sel ? color + "60" : "transparent"}`,
                          cursor: "pointer", transition: "all 0.12s",
                        }}
                        onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = T.surfaceHover; }}
                        onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {sel && <StatusDot color={color} />}
                            <span style={{ fontWeight: sel ? 600 : 400 }}>{g.groupName}</span>
                          </div>
                          {g.description && (
                            <div style={{ fontSize: 9, color: T.dim, marginTop: 2, letterSpacing: "0.05em" }}>
                              {g.description}
                            </div>
                          )}
                          <div style={{ fontSize: 9, color: `${color}55`, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                            <Users size={8} />
                            {g.emails?.length ?? 0} recipient{g.emails?.length !== 1 ? "s" : ""}
                          </div>
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
            </motion.div>
          </>,
          document.body
        )}

      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  );
};

// ─── Inline Create Group Panel ────────────────────────────────────────────────
const InlineCreateGroup = ({ onCreated, onCancel }) => {
  const [groupName, setGroupName] = useState("");
  const [emails, setEmails] = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    setError("");
    if (!groupName.trim()) { setError("Group name is required"); return; }
    const emailArray = emails.split(/[,;\n]/).map((e) => e.trim()).filter(Boolean);
    if (emailArray.length === 0) { setError("At least one email is required"); return; }
    try {
      setLoading(true);
      const res = await axios.post("/escalation-groups", {
        groupName: groupName.trim(), emails: emailArray, description: description.trim(),
      });
      if (res.data.success) onCreated(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create group");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = (focused) => ({
    width: "100%", padding: "10px 12px", borderRadius: 10, outline: "none",
    background: "rgba(255,255,255,0.03)", border: `1px solid ${focused ? "rgba(99,179,237,0.35)" : "rgba(255,255,255,0.07)"}`,
    color: T.bright, fontFamily: T.font, fontSize: 11, letterSpacing: "0.03em",
    resize: "none", transition: "border-color 0.15s",
  });

  
  
};

// ─── Route config ─────────────────────────────────────────────────────────────
const ROUTING_CONFIG = [
  {
    key: "down",
    label: "Down",
    description: "Site is completely unreachable — zero connectivity detected",
    color: "#f87171",
    icon: AlertTriangle,
    
  },
  {
    key: "trouble",
    label: "Trouble",
    description: "Site is degraded, slow, or experiencing partial failures",
    color: "#fb923c",
    icon: Zap,
    
  },
  {
    key: "critical",
    label: "Critical",
    description: "High-priority escalation — immediate intervention required",
    color: "#c084fc",
    icon: ShieldAlert,
    
  },
];

// ─── Divider with label ────────────────────────────────────────────────────────
const SectionDivider = ({ label }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
    <div style={{ flex: 1, height: 1, background: T.border }} />
    <span style={{ fontFamily: T.font, fontSize: 8, letterSpacing: "0.2em", color: T.dim, textTransform: "uppercase" }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, background: T.border }} />
  </div>
);

// ─── Main AlertRoutingForm ─────────────────────────────────────────────────────
const AlertRoutingForm = ({ alertRouting, setAlertRouting }) => {
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);
  const [showCreate, setShowCreate] = useState(false);

  useEffect(() => { fetchGroups(); }, []);

  const fetchGroups = async () => {
    try {
      setLoadingGroups(true);
      const res = await axios.get("/escalation-groups/my-groups");
      if (res.data.success) setGroups(res.data.data);
    } catch (err) {
      console.error("Failed to fetch escalation groups", err);
    } finally {
      setLoadingGroups(false);
    }
  };

  const handleGroupCreated = (newGroup) => {
    setGroups((prev) => [newGroup, ...prev]);
    setShowCreate(false);
  };

  const totalSelected = ROUTING_CONFIG.reduce(
    (acc, { key }) => acc + (alertRouting[key]?.length || 0), 0
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header strip */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
        padding: "10px 14px", borderRadius: 10,
        background: T.surface, border: `1px solid ${T.border}`,
        position: "relative", overflow: "hidden",
      }}>
        <ScanlineTexture />
        <div style={{
          width: 30, height: 30, borderRadius: 8, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: "rgba(248,250,252,0.04)", border: `1px solid ${T.border}`,
          position: "relative", zIndex: 1,
        }}>
          <Mail size={13} style={{ color: T.mid }} />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ fontFamily: T.font, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: T.mid, fontWeight: 600 }}>
            Alert Routing Matrix
          </div>
          <div style={{ fontFamily: T.font, fontSize: 8, color: T.dim, marginTop: 2, letterSpacing: "0.05em" }}>
            Configure escalation paths for each alert severity
          </div>
        </div>
        {totalSelected > 0 && (
          <div style={{ marginLeft: "auto", position: "relative", zIndex: 1 }}>
            <span style={{
              fontFamily: T.font, fontSize: 8, letterSpacing: "0.12em",
              color: "rgba(134,239,172,0.8)", background: "rgba(134,239,172,0.08)",
              border: "1px solid rgba(134,239,172,0.18)", padding: "3px 9px", borderRadius: 99,
            }}>
              {totalSelected} route{totalSelected !== 1 ? "s" : ""} active
            </span>
          </div>
        )}
      </div>

      {/* Route selectors */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {ROUTING_CONFIG.map(({ key, label, description, color, icon, severity }) => (
          <div key={key} style={{ position: "relative" }}>
            {/* Severity label */}
            <div style={{
              position: "absolute", top: 0, right: 0,
              fontFamily: T.font, fontSize: 7, letterSpacing: "0.2em",
              color: `${color}55`, textTransform: "uppercase",
            }}>
              {severity}
            </div>

            <GroupMultiSelect
              label={label}
              value={alertRouting[key] || []}
              onChange={(val) => setAlertRouting((prev) => ({ ...prev, [key]: val }))}
              groups={groups}
              color={color}
              icon={icon}
              loading={loadingGroups}
              routeKey={key}
            />

            {/* Description */}
            <div style={{
              marginTop: 6, display: "flex", alignItems: "center", gap: 6,
              fontFamily: T.font, fontSize: 8, color: T.dim, letterSpacing: "0.05em",
              paddingLeft: 2,
            }}>
              <div style={{ width: 12, height: 1, background: `${color}30` }} />
              {description}
            </div>
          </div>
        ))}
      </div>

     

      {/* Routing summary */}
      <AnimatePresence>
        {!loadingGroups && groups.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            style={{ marginTop: 20 }}
          >
            <SectionDivider label="Routing Summary" />
            <div style={{
              marginTop: 12, padding: "14px 16px", borderRadius: 12,
              background: T.surface, border: `1px solid ${T.border}`,
              position: "relative", overflow: "hidden",
            }}>
              <ScanlineTexture />
              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", gap: 9 }}>
                {ROUTING_CONFIG.map(({ key, label, color, icon: Icon }) => {
                  const selectedNames = (alertRouting[key] || [])
                    .map((id) => groups.find((g) => g._id === id)?.groupName)
                    .filter(Boolean);
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 80 }}>
                        <StatusDot color={color} />
                        <span style={{ fontFamily: T.font, fontSize: 8, color, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 600 }}>
                          {label}
                        </span>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {selectedNames.length === 0 ? (
                          <span style={{ fontFamily: T.font, fontSize: 8, color: "rgba(255,255,255,0.18)", fontStyle: "italic" }}>
                            Unrouted
                          </span>
                        ) : (
                          selectedNames.map((name) => (
                            <span key={name} style={{
                              fontFamily: T.font, fontSize: 8, color: `${color}cc`,
                              background: `${color}0f`, border: `1px solid ${color}20`,
                              padding: "2px 7px", borderRadius: 5, letterSpacing: "0.05em",
                            }}>
                              {name}
                            </span>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AlertRoutingForm;