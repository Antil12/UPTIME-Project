import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronDown, X, Mail, Check,
  AlertTriangle, Zap, ShieldAlert, RefreshCw, Users, Phone,
} from "lucide-react";
import axios from "axios";
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

// ─── Portal Multi-Select Dropdown ─────────────────────────────────────────────
const GroupMultiSelect = ({ label, value = [], onChange, groups, color, icon: Icon, loading, routeKey, currentTheme }) => {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [dropPos, setDropPos] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef(null);
  const searchRef = useRef(null);

  // bgPanel is the near-opaque surface defined in ThemeContext
  // (dark: rgba(3,7,18,0.94), light: rgba(255,255,255,0.96)) — using it
  // here instead of bgCard keeps dropdown text legible regardless of
  // whatever content sits behind the portal.
  const panelBg = currentTheme.bgPanel;

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
              color: color, letterSpacing: "0.1em", fontWeight: 600,
              background: `${color}12`, border: `1px solid ${color}30`,
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
          background: open ? `${color}10` : currentTheme.bgInput,
          border: `1px solid ${open ? `${color}50` : currentTheme.borderLight}`,
          color: hasSelected ? currentTheme.text : currentTheme.textSecondary,
          fontFamily: T.font, fontSize: 11, letterSpacing: "0.04em",
          backdropFilter: "blur(18px)", transition: "all 0.2s",
          textAlign: "left", overflow: "hidden",
          ...glowStyle,
        }}
      >
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, flex: 1 }}>
          {loading ? (
            <span style={{ color: currentTheme.textSecondary, display: "flex", alignItems: "center", gap: 6 }}>
              <RefreshCw size={10} style={{ animation: "spin 1s linear infinite" }} />
              Fetching groups…
            </span>
          ) : !hasSelected ? (
            <span style={{ color: currentTheme.textSecondary }}>Route to escalation group (optional)</span>
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
                  background: `${color}1f`, border: `1px solid ${color}40`,
                  color, fontSize: 9, letterSpacing: "0.07em", fontWeight: 700,
                }}
              >
                <StatusDot color={color} />
                {g.groupName}
                <span
                  style={{ cursor: "pointer", display: "flex", opacity: 0.7 }}
                  onClick={(e) => { e.stopPropagation(); toggle(g._id); }}
                  onMouseEnter={(e) => e.currentTarget.style.opacity = "1"}
                  onMouseLeave={(e) => e.currentTarget.style.opacity = "0.7"}
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
          style={{ color: open ? color : currentTheme.textSecondary, flexShrink: 0 }}
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
                background: panelBg,
                border: `1px solid ${color}40`,
                backdropFilter: "blur(20px)",
                boxShadow: currentTheme.shadow || "0 20px 50px rgba(0,0,0,0.45)",
                borderRadius: 14, overflow: "hidden",
              }}
            >
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
                    width: "100%", padding: "8px 10px", borderRadius: 8,
                    background: currentTheme.bgInput, border: `1px solid ${currentTheme.borderLight}`,
                    color: currentTheme.text, fontFamily: T.font, fontSize: 11,
                    letterSpacing: "0.04em", outline: "none",
                  }}
                  onFocus={(e) => { e.target.style.border = `1px solid ${color}`; }}
                  onBlur={(e) => { e.target.style.border = `1px solid ${currentTheme.borderLight}`; }}
                />
              </div>

              {/* Items */}
              <div style={{ maxHeight: 260, overflowY: "auto" }}>
                {loading ? (
                  <div style={{ padding: "24px", textAlign: "center", fontFamily: T.font, fontSize: 10, color: currentTheme.textSecondary }}>
                    Loading…
                  </div>
                ) : filtered.length === 0 ? (
                  <div style={{ padding: "24px", textAlign: "center", fontFamily: T.font, fontSize: 10, color: currentTheme.textSecondary }}>
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
                          color: sel ? color : currentTheme.text,
                          background: sel ? `${color}18` : "transparent",
                          border: "none",
                          borderTop: idx === 0 ? "none" : `1px solid ${currentTheme.borderAccent}`,
                          borderLeft: `2px solid ${sel ? color : "transparent"}`,
                          cursor: "pointer", transition: "all 0.12s",
                        }}
                        onMouseEnter={(e) => { if (!sel) e.currentTarget.style.background = currentTheme.bgInput; }}
                        onMouseLeave={(e) => { if (!sel) e.currentTarget.style.background = "transparent"; }}
                      >
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                            {sel && <StatusDot color={color} />}
                            <span style={{ fontWeight: sel ? 700 : 500, color: sel ? color : currentTheme.text }}>
                              {g.groupName}
                            </span>
                          </div>
                          {g.description && (
                            <div style={{ fontSize: 9, color: currentTheme.textSecondary, marginTop: 2, letterSpacing: "0.05em" }}>
                              {g.description}
                            </div>
                          )}
                          <div style={{ fontSize: 9, color: currentTheme.textSecondary, marginTop: 3, display: "flex", alignItems: "center", gap: 4 }}>
                            <Users size={8} style={{ color: `${color}cc` }} />
                            {g.emails?.length ?? 0} email{g.emails?.length !== 1 ? "s" : ""}
                          </div>
                          {g.phoneNumbers && g.phoneNumbers.length > 0 && (
                            <div style={{ fontSize: 9, color: currentTheme.textSecondary, marginTop: 2, display: "flex", alignItems: "center", gap: 4 }}>
                              <Phone size={8} style={{ color: `${color}cc` }} />
                              {g.phoneNumbers.length} phone{g.phoneNumbers.length !== 1 ? "s" : ""}
                            </div>
                          )}
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
                              padding: "3px 0",
                              borderTop: `1px solid ${currentTheme.borderAccent}`,
                              paddingTop: 6
                            }}>
                              <span style={{ opacity: 0.8 }}>Created by</span>
                              <span style={{ fontWeight: 700, color: currentTheme.text }}>{g.owner.name || g.owner.email}</span>
                              <span style={{
                                background: `${color}22`,
                                color,
                                padding: "1px 6px",
                                borderRadius: 4,
                                fontSize: 7,
                                letterSpacing: "0.1em",
                                fontWeight: 700,
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
                                background: `${color}25`, border: `1px solid ${color}50`,
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

// ─── Route config ─────────────────────────────────────────────────────────────
const getRoutingConfig = (currentTheme) => [
  {
    key: "down",
    label: "Down",
    description: "Site is completely unreachable — zero connectivity detected",
    color: currentTheme.error,
    icon: AlertTriangle,
  },
  {
    key: "trouble",
    label: "Trouble",
    description: "Site is degraded, slow, or experiencing partial failures",
    color: currentTheme.warning,
    icon: Zap,
  },
  {
    key: "critical",
    label: "Critical",
    description: "High-priority escalation — immediate intervention required",
    color: currentTheme.accentSecondary,
    icon: ShieldAlert,
  },
];

// ─── Divider with label ────────────────────────────────────────────────────────
const SectionDivider = ({ label, currentTheme }) => (
  <div style={{ display: "flex", alignItems: "center", gap: 10, margin: "4px 0" }}>
    <div style={{ flex: 1, height: 1, background: currentTheme.borderAccent }} />
    <span style={{ fontFamily: T.font, fontSize: 8, letterSpacing: "0.2em", color: currentTheme.textSecondary, textTransform: "uppercase" }}>
      {label}
    </span>
    <div style={{ flex: 1, height: 1, background: currentTheme.borderAccent }} />
  </div>
);

// ─── Main AlertRoutingForm ─────────────────────────────────────────────────────
const AlertRoutingForm = ({ alertRouting, setAlertRouting }) => {
  const { currentTheme } = useTheme();
  const [groups, setGroups] = useState([]);
  const [loadingGroups, setLoadingGroups] = useState(true);

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

  const ROUTING_CONFIG = getRoutingConfig(currentTheme);
  const totalSelected = ROUTING_CONFIG.reduce(
    (acc, { key }) => acc + (alertRouting[key]?.length || 0), 0
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      {/* Header strip */}
      <div style={{
        display: "flex", alignItems: "center", gap: 10, marginBottom: 20,
        padding: "10px 14px", borderRadius: 10,
        background: currentTheme.bgInput,
        border: `1px solid ${currentTheme.borderAccent}`,
        backdropFilter: "blur(16px)",
      }}>
        <div style={{
          width: 30, height: 30, borderRadius: 8, display: "flex",
          alignItems: "center", justifyContent: "center",
          background: currentTheme.bgCard,
          border: `1px solid ${currentTheme.borderAccent}`,
        }}>
          <Mail size={13} style={{ color: currentTheme.textSecondary }} />
        </div>
        <div>
          <div style={{ fontFamily: T.font, fontSize: 9, letterSpacing: "0.18em", textTransform: "uppercase", color: currentTheme.text, fontWeight: 700 }}>
            Alert Routing Matrix
          </div>
          <div style={{ fontFamily: T.font, fontSize: 8, color: currentTheme.textSecondary, marginTop: 2, letterSpacing: "0.05em" }}>
            Configure escalation paths for each alert severity
          </div>
        </div>
        {totalSelected > 0 && (
          <div style={{ marginLeft: "auto" }}>
            <span style={{
              fontFamily: T.font, fontSize: 8, letterSpacing: "0.12em",
              color: currentTheme.success, background: `${currentTheme.success}1a`,
              border: `1px solid ${currentTheme.success}40`, padding: "3px 9px", borderRadius: 99,
              fontWeight: 700,
            }}>
              {totalSelected} route{totalSelected !== 1 ? "s" : ""} active
            </span>
          </div>
        )}
      </div>

      {/* Route selectors */}
      <div style={{ display: "flex", flexDirection: "column", gap: 22 }}>
        {ROUTING_CONFIG.map(({ key, label, description, color, icon }) => (
          <div key={key} style={{ position: "relative" }}>
            <GroupMultiSelect
              label={label}
              value={alertRouting[key] || []}
              onChange={(val) => setAlertRouting((prev) => ({ ...prev, [key]: val }))}
              groups={groups}
              color={color}
              icon={icon}
              loading={loadingGroups}
              routeKey={key}
              currentTheme={currentTheme}
            />

            {/* Description */}
            <div style={{
              marginTop: 6, display: "flex", alignItems: "center", gap: 6,
              fontFamily: T.font, fontSize: 8, color: currentTheme.textSecondary, letterSpacing: "0.05em",
              paddingLeft: 2,
            }}>
              <div style={{ width: 12, height: 1, background: `${color}50` }} />
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
            <SectionDivider label="Routing Summary" currentTheme={currentTheme} />
            <div style={{
              marginTop: 12, padding: "14px 16px", borderRadius: 12,
              background: currentTheme.bgInput,
              border: `1px solid ${currentTheme.borderAccent}`,
              backdropFilter: "blur(16px)",
            }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 9 }}>
                {ROUTING_CONFIG.map(({ key, label, color, icon: Icon }) => {
                  const selectedNames = (alertRouting[key] || [])
                    .map((id) => groups.find((g) => g._id === id)?.groupName)
                    .filter(Boolean);
                  return (
                    <div key={key} style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, minWidth: 80 }}>
                        <StatusDot color={color} />
                        <span style={{ fontFamily: T.font, fontSize: 8, color, letterSpacing: "0.12em", textTransform: "uppercase", fontWeight: 700 }}>
                          {label}
                        </span>
                      </div>
                      <div style={{ flex: 1, display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {selectedNames.length === 0 ? (
                          <span style={{ fontFamily: T.font, fontSize: 8, color: currentTheme.textSecondary, fontStyle: "italic" }}>
                            Unrouted
                          </span>
                        ) : (
                          selectedNames.map((name) => (
                            <span key={name} style={{
                              fontFamily: T.font, fontSize: 8, color,
                              background: `${color}16`, border: `1px solid ${color}35`,
                              padding: "2px 7px", borderRadius: 5, letterSpacing: "0.05em",
                              fontWeight: 600,
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