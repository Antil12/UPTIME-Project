import { createContext, useContext, useState, useEffect, useRef } from "react";
import axios from "axios";

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const saved = localStorage.getItem("theme");
    return saved || "dark";
  });

  // Tracks whether we've already hydrated from the server this session,
  // so we don't re-fetch on every re-render and don't fire PUT during
  // the initial GET-driven setTheme().
  const hasHydratedFromServer = useRef(false);
  const isHydrating = useRef(false);

  // ── Hydrate from server on login (server theme wins) ──────────────────────
  useEffect(() => {
    const token = localStorage.getItem("loginToken");
    if (!token) {
      hasHydratedFromServer.current = false;
      return;
    }
    if (hasHydratedFromServer.current) return;

    let cancelled = false;
    isHydrating.current = true;

    axios
      .get("/user/theme", { headers: { Authorization: `Bearer ${token}` } })
      .then((res) => {
        if (cancelled) return;
        const serverTheme = res.data?.theme;
        if (serverTheme === "dark" || serverTheme === "light") {
          setTheme(serverTheme);
          localStorage.setItem("theme", serverTheme);
        }
      })
      .catch((err) => {
        // No theme saved yet, or request failed — silently keep local value.
        if (err.response?.status !== 404) {
          console.error("Failed to fetch theme:", err);
        }
      })
      .finally(() => {
        if (!cancelled) {
          hasHydratedFromServer.current = true;
          isHydrating.current = false;
        }
      });

    return () => { cancelled = true; };
    // Re-run when login state changes (loginToken appears/disappears).
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [localStorage.getItem("loginToken")]);

  // ── Persist locally always, persist to server only when logged in ─────────
  useEffect(() => {
    localStorage.setItem("theme", theme);

    if (isHydrating.current) return; // don't echo the value we just hydrated

    const token = localStorage.getItem("loginToken");
    if (!token) return; // logged out — localStorage only

    axios
      .put(
        "/user/theme",
        { theme },
        { headers: { Authorization: `Bearer ${token}` } }
      )
      .catch((err) => {
        console.error("Failed to save theme:", err);
      });
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  const themes = {
    dark: {
      // Background colors
      bg: "#060e1c",
      bgSecondary: "#030712",
      bgCard: "rgba(3,7,18,0.72)",
      bgInput: "rgba(255,255,255,0.025)",
      bgPanel: "rgba(3,7,18,0.94)",
      bgOverlay: "rgba(2,6,23,0.72)",
      // Text colors
      text: "#ffffff",
      textSecondary: "rgba(248,250,252,0.86)",
      textMuted: "rgba(148,163,184,0.60)",
      textDim: "rgba(100,116,139,0.42)",
      // Border colors
      border: "rgba(255,255,255,0.07)",
      borderLight: "rgba(255,255,255,0.06)",
      borderAccent: "rgba(56,189,248,0.15)",
      // Accent colors
      accent: "#38bdf8",
      accentSecondary: "#818cf8",
      accentGlow: "rgba(56,189,248,0.15)",
      // Status colors
      success: "#34d399",
      successBg: "rgba(52,211,153,0.12)",
      error: "#f87171",
      errorBg: "rgba(248,113,113,0.12)",
      warning: "#fbbf24",
      // Grid pattern
      gridColor: "rgba(148,163,184,0.018)",
      // Gradient backgrounds
      gradientPrimary: "linear-gradient(135deg,rgba(56,189,248,.08) 0%,rgba(139,92,246,.06) 100%)",
      gradientCard: "linear-gradient(90deg, transparent 0%, rgba(129,140,248,0.32) 30%, rgba(56,189,248,0.28) 70%, transparent 100%)",
      gradientTopBar: "linear-gradient(90deg,transparent,rgba(56,189,248,.38) 30%,rgba(139,92,246,.30) 70%,transparent)",
      // Shadow
      shadow: "0 0 22px rgba(56,189,248,0.03)",
      shadowGlow: "0 0 20px rgba(56,189,248,0.05)",
    },
    light: {
      // Background colors
      bg: "#f8fafc",
      bgSecondary: "#ffffff",
      bgCard: "rgba(255,255,255,0.85)",
      bgInput: "rgba(241,245,249,0.8)",
      bgPanel: "rgba(255,255,255,0.96)",
      bgOverlay: "rgba(15,23,42,0.65)",
      // Text colors
      text: "#0f172a",
      textSecondary: "#1e293b",
      textMuted: "rgba(71,85,105,0.85)",
      textDim: "rgba(100,116,139,0.70)",
      // Border colors
      border: "rgba(148,163,184,0.25)",
      borderLight: "rgba(148,163,184,0.18)",
      borderAccent: "rgba(56,189,248,0.35)",
      // Accent colors
      accent: "#0284c7",
      accentSecondary: "#6366f1",
      accentGlow: "rgba(56,189,248,0.12)",
      // Status colors
      success: "#059669",
      successBg: "rgba(5,150,105,0.1)",
      error: "#dc2626",
      errorBg: "rgba(220,38,38,0.1)",
      warning: "#d97706",
      // Grid pattern
      gridColor: "rgba(148,163,184,0.08)",
      // Gradient backgrounds
      gradientPrimary: "linear-gradient(135deg,rgba(56,189,248,.12) 0%,rgba(139,92,246,.08) 100%)",
      gradientCard: "linear-gradient(90deg, transparent 0%, rgba(56,189,248,0.25) 30%, rgba(99,102,241,0.2) 70%, transparent 100%)",
      gradientTopBar: "linear-gradient(90deg,transparent,rgba(56,189,248,.45) 30%,rgba(99,102,241,.35) 70%,transparent)",
      // Shadow
      shadow: "0 4px 24px rgba(148,163,184,0.12)",
      shadowGlow: "0 0 20px rgba(56,189,248,0.12)",
    },
  };

  const currentTheme = themes[theme];

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, currentTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};