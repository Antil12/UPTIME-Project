import React from "react";
import { Bell } from "lucide-react";

const ALERT_LEVELS = [
  { key: "down",     label: "DOWN",     color: "#f87171" },
  { key: "trouble",  label: "TROUBLE",  color: "#fbbf24" },
  { key: "critical", label: "CRITICAL", color: "#a78bfa" },
];

const ALERT_ROLES = [
  { key: "group1", label: "group 1"       },
  { key: "group2",        label: "Group 2" },
  { key: "group3",       label: "Group 3"             },
];

const AlertRoutingForm = ({ value, onChange }) => {
  const handleToggle = (level, role) => {
    const currentRoles = value[level] || [];
    const isChecked    = currentRoles.includes(role);
    const updatedRoles = isChecked
      ? currentRoles.filter((r) => r !== role)
      : [...currentRoles, role];

    onChange({ ...value, [level]: updatedRoles });
  };

  return (
    <div
      style={{
        background:    "rgba(3,7,18,0.72)",
        border:        "1px solid rgba(56,189,248,0.09)",
        borderRadius:  "20px",
        padding:       "24px",
        fontFamily:    "'JetBrains Mono', monospace",
        position:      "relative",
        overflow:      "hidden",
      }}
    >
      {/* Top gradient line — matches other section cards */}
      <div
        style={{
          position:   "absolute",
          top: 0, left: 0, right: 0,
          height:     "1px",
          background: "linear-gradient(90deg, transparent 0%, rgba(129,140,248,0.32) 30%, rgba(56,189,248,0.28) 70%, transparent 100%)",
        }}
      />

      {/* Section Header */}
      <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
        <div
          style={{
            width:           "28px",
            height:          "28px",
            borderRadius:    "8px",
            display:         "flex",
            alignItems:      "center",
            justifyContent:  "center",
            border:          "1px solid rgba(56,189,248,0.12)",
            background:      "rgba(56,189,248,0.04)",
          }}
        >
          <Bell size={13} style={{ color: "#38bdf8" }} />
        </div>
        <span
          style={{
            fontSize:      "9px",
            letterSpacing: "0.22em",
            color: "rgba(56,189,248,0.78)",
            textTransform: "uppercase",
          }}
        >
          Alert Routing
        </span>
        <div style={{ flex: 1, height: "1px", background: "rgba(56,189,248,0.06)" }} />
      </div>

      {/* Grid table: header row + 3 level rows */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr",
          gap:                 "10px",
          fontSize:            "11px",
          letterSpacing:       "0.05em",
          alignItems:          "center",
        }}
      >
        {/* Header row */}
        <div style={{ color: "rgba(248,250,252,0.8)", fontSize: "9px", letterSpacing: "0.1em", textTransform: "uppercase" }}>
          Level
        </div>
        {ALERT_ROLES.map((role) => (
          <div
            key={role.key}
            style={{
              color: "rgba(248,250,252,0.82)",
              textAlign:     "center",
              fontSize:      "10px",
              letterSpacing: "0.08em",
              paddingBottom: "4px",
            }}
          >
            {role.label}
          </div>
        ))}

        {/* Level rows */}
        {ALERT_LEVELS.map((level) => (
          <React.Fragment key={level.key}>

            {/* Level label */}
            <div
              style={{
                color:      level.color,
                fontWeight: "600",
                fontSize:   "10px",
                letterSpacing: "0.12em",
                textTransform: "uppercase",
                display:    "flex",
                alignItems: "center",
                gap:        "6px",
              }}
            >
              {/* Colored dot */}
              <div
                style={{
                  width:        "6px",
                  height:       "6px",
                  borderRadius: "50%",
                  background:   level.color,
                  flexShrink:   0,
                  boxShadow:    `0 0 6px ${level.color}66`,
                }}
              />
              {level.label}
            </div>

            {/* Checkboxes for each role in this level */}
            {ALERT_ROLES.map((role) => {
              const isChecked = (value[level.key] || []).includes(role.key);
              return (
                <div
                  key={`${level.key}-${role.key}`}
                  style={{ display: "flex", justifyContent: "center" }}
                >
                  <label
                    style={{
                      display:        "flex",
                      alignItems:     "center",
                      justifyContent: "center",
                      width:          "28px",
                      height:         "28px",
                      borderRadius:   "8px",
                      cursor:         "pointer",
                      transition:     "background 0.2s",
                      background:     isChecked
                        ? "rgba(56,189,248,0.1)"
                        : "rgba(255,255,255,0.025)",
                      border:         isChecked
                        ? "1px solid rgba(56,189,248,0.3)"
                        : "1px solid rgba(255,255,255,0.07)",
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={isChecked}
                      onChange={() => handleToggle(level.key, role.key)}
                      style={{
                        width:       "14px",
                        height:      "14px",
                        cursor:      "pointer",
                        accentColor: "#38bdf8",
                        margin:      0,
                      }}
                    />
                  </label>
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>

      {/* Helper text */}
      <p
        style={{
          marginTop:     "16px",
          marginBottom:  0,
          fontSize:      "10px",
          color: "rgba(248,250,252,0.8)",
          letterSpacing: "0.03em",
        }}
      >
        Select which roles receive alerts for each severity level. Roles are matched by alertRole + alertCategories.
      </p>
    </div>
  );
};

export default AlertRoutingForm;