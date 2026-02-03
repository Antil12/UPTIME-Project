import { useState, useEffect, useRef } from "react";

export default function SettingsMenu({ theme, toggleTheme, onLogout }) {
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = () => {
    setOpen(false);
    if (onLogout) onLogout();
  };

  return (
    <div style={{ position: "relative" }}>
      {/* Hamburger button */}
      <div
        style={{ width: "25px", cursor: "pointer" }}
        onClick={() => setOpen(!open)}
      >
        <span style={styles.line}></span>
        <span style={styles.line}></span>
        <span style={styles.line}></span>
      </div>

      {open && (
        <div
          ref={dropdownRef}
          style={{
            ...styles.dropdown,
            background: theme === "dark" ? "#333" : "#fff",
            color: theme === "dark" ? "#fff" : "#000",
          }}
        >
          {/* Crystal Slider Theme Toggle */}
          <div style={{ ...styles.item, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span>Theme</span>
            <div
              onClick={toggleTheme}
              style={{
                width: "50px",
                height: "26px",
                borderRadius: "20px",
                background: theme === "dark"
                  ? "linear-gradient(145deg, #FFD700, #FFA500)" // gold gradient
                  : "linear-gradient(145deg, #3B82F6, #60A5FA)", // blue gradient
                position: "relative",
                cursor: "pointer",
                boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                transition: "background 0.3s",
              }}
            >
              <div
                style={{
                  width: "22px",
                  height: "22px",
                  borderRadius: "50%",
                  background: theme === "dark" ? "#FFF59D" : "#BFDBFE",
                  position: "absolute",
                  top: "2px",
                  left: theme === "dark" ? "26px" : "2px",
                  transition: "left 0.3s, background 0.3s",
                  boxShadow: "0 2px 6px rgba(0,0,0,0.3)",
                }}
              ></div>
            </div>
          </div>

          {/* Logout Option */}
          <div
            style={{ ...styles.item, borderBottom: "none", marginTop: "6px" }}
            onClick={handleLogout}
          >
            🚪 Logout
          </div>
        </div>
      )}
    </div>
  );
}

const styles = {
  line: {
    display: "block",
    height: "3px",
    background: "#333",
    margin: "4px 0",
    borderRadius: "2px",
  },
  dropdown: {
    position: "absolute",
    right: 0,
    top: "30px",
    borderRadius: "8px",
    boxShadow: "0 4px 10px rgba(0,0,0,0.15)",
    width: "160px",
    zIndex: 1000,
    padding: "10px 0",
  },
  item: {
    padding: "10px 15px",
    cursor: "pointer",
    borderBottom: "1px solid #eee",
  },
};
