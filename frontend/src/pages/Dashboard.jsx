import React, { useState, useEffect } from "react";
import {
  motion,
  useMotionValue,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import axios from "../api/setupAxios";
import UrlTable from "../components/UrlTable";
import CrystalPopup from "../components/CrystalPopup";
import UptimePopup from "../components/UptimePopup";
import {
  Globe2,
  TrendingUp,
  TrendingDown,
  Activity,
  Search,
  Trash2,
  CheckSquare,
  Square,
  X,
  Wifi,
  ShieldCheck,
} from "lucide-react";

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
const CursorGlow = () => {
  const x = useMotionValue(-400);
  const y = useMotionValue(-400);
  const sx = useSpring(x, { stiffness: 90, damping: 24 });
  const sy = useSpring(y, { stiffness: 90, damping: 24 });

  useEffect(() => {
    const fn = (e) => {
      x.set(e.clientX);
      y.set(e.clientY);
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, [x, y]);

  return (
    <motion.div
      className="pointer-events-none fixed z-0"
      style={{
        left: sx,
        top: sy,
        translateX: "-50%",
        translateY: "-50%",
        width: 300,
        height: 300,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(56,189,248,0.045) 0%, transparent 70%)",
      }}
    />
  );
};

// ─── Full Page Background ─────────────────────────────────────────────────────
const Background = () => (
  <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
    <div className="absolute inset-0" style={{ background: "#030712" }} />

    <div
      className="absolute inset-0"
      style={{
        background:
          "radial-gradient(ellipse 70% 45% at 50% 0%, rgba(56,189,248,0.05) 0%, transparent 100%)",
      }}
    />

    <div
      className="absolute"
      style={{
        top: "60%",
        left: "10%",
        width: 340,
        height: 340,
        background:
          "radial-gradient(circle, rgba(129,140,248,0.035) 0%, transparent 68%)",
        filter: "blur(90px)",
      }}
    />

    <div
      className="absolute"
      style={{
        top: "15%",
        right: "8%",
        width: 260,
        height: 260,
        background:
          "radial-gradient(circle, rgba(16,185,129,0.028) 0%, transparent 68%)",
        filter: "blur(85px)",
      }}
    />

    <div
      className="absolute"
      style={{
        bottom: "5%",
        right: "20%",
        width: 240,
        height: 240,
        background:
          "radial-gradient(circle, rgba(56,189,248,0.022) 0%, transparent 68%)",
        filter: "blur(75px)",
      }}
    />

    <div
      className="absolute inset-0"
      style={{
        backgroundImage:
          "linear-gradient(rgba(148,163,184,0.022) 1px, transparent 1px), linear-gradient(90deg, rgba(148,163,184,0.022) 1px, transparent 1px)",
        backgroundSize: "42px 42px",
      }}
    />

    <motion.div
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(to bottom, transparent 48%, rgba(56,189,248,0.012) 50%, transparent 52%)",
      }}
      animate={{ y: ["-100%", "100%"] }}
      transition={{
        duration: 7,
        repeat: Infinity,
        ease: "linear",
        repeatDelay: 3,
      }}
    />
  </div>
);

// ─── HUD Corner Brackets ─────────────────────────────────────────────────────
const HUDCorner = ({ pos, delay = 0 }) => {
  const cls = {
    tl: "top-4 left-4",
    tr: "top-4 right-4",
    bl: "bottom-4 left-4",
    br: "bottom-4 right-4",
  };
  const rot = {
    tl: "0deg",
    tr: "90deg",
    bl: "-90deg",
    br: "180deg",
  };

  return (
    <motion.div
      className={`fixed ${cls[pos]} w-6 h-6 z-20 pointer-events-none`}
      style={{ transform: `rotate(${rot[pos]})` }}
      initial={{ opacity: 0, scale: 0.3 }}
      animate={{ opacity: 0.75, scale: 1 }}
      transition={{ delay, duration: 0.45, ease: [0.34, 1.56, 0.64, 1] }}
    >
      <motion.div
        className="absolute top-0 left-0 h-[1.5px] bg-sky-400/65"
        initial={{ width: 0 }}
        animate={{ width: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }}
      />
      <motion.div
        className="absolute top-0 left-0 w-[1.5px] bg-sky-400/65"
        initial={{ height: 0 }}
        animate={{ height: "100%" }}
        transition={{ delay: delay + 0.15, duration: 0.35 }}
      />
    </motion.div>
  );
};

// ─── Orbit Ring ───────────────────────────────────────────────────────────────
const OrbitRing = ({
  radius,
  duration,
  dotCount,
  color,
  delay = 0,
  tilt = 70,
}) => (
  <motion.div
    className="fixed pointer-events-none z-[1]"
    style={{
      width: radius * 2,
      height: radius * 2,
      top: "50%",
      left: "50%",
      marginTop: -radius,
      marginLeft: -radius,
      transform: `perspective(900px) rotateX(${tilt}deg)`,
      opacity: 0.28,
    }}
    animate={{ rotate: 360 }}
    transition={{ duration, repeat: Infinity, ease: "linear", delay }}
  >
    <div
      className="absolute inset-0 rounded-full"
      style={{ border: `1px solid ${color}12` }}
    />
    {Array.from({ length: dotCount }, (_, i) => {
      const angle = (i / dotCount) * 2 * Math.PI;
      const cx = Math.cos(angle) * radius + radius;
      const cy = Math.sin(angle) * radius + radius;
      return (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            width: i === 0 ? 4 : 2,
            height: i === 0 ? 4 : 2,
            background: i === 0 ? color : `${color}35`,
            left: cx - (i === 0 ? 2 : 1),
            top: cy - (i === 0 ? 2 : 1),
            boxShadow: i === 0 ? `0 0 8px ${color}` : "none",
          }}
          animate={i === 0 ? { opacity: [1, 0.3, 1] } : {}}
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
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ background: color }}
        animate={{ scale: [1, 2.1], opacity: [0.5, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      />
      <div className="absolute inset-0 rounded-full" style={{ background: color }} />
    </div>
    {label && (
      <span
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "8px",
          letterSpacing: "0.15em",
          color: `${color}88`,
          textTransform: "uppercase",
        }}
      >
        {label}
      </span>
    )}
  </div>
);

// ─── HUD Stat Card ────────────────────────────────────────────────────────────
const HudStatCard = ({
  icon: Icon,
  label,
  value,
  accentColor = "#38bdf8",
  onClick,
  index = 0,
  sublabel,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 18 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{
      delay: index * 0.08,
      duration: 0.5,
      ease: [0.22, 1, 0.36, 1],
    }}
    whileHover={{ y: -3, scale: 1.01 }}
    onClick={onClick}
    className="relative rounded-2xl p-4 overflow-hidden group cursor-pointer"
    style={{
      background: "rgba(3,7,18,0.74)",
      border: `1px solid ${accentColor}12`,
      backdropFilter: "blur(18px)",
      boxShadow: `0 0 22px ${accentColor}06, inset 0 1px 0 ${accentColor}06`,
    }}
  >
    <div
      className="absolute top-0 left-0 right-0 h-[1px]"
      style={{
        background: `linear-gradient(90deg, transparent 0%, ${accentColor}45 35%, ${accentColor}22 70%, transparent 100%)`,
      }}
    />

    <div className="absolute top-0 right-0 w-7 h-7 overflow-hidden">
      <div
        className="absolute top-0 right-0 w-[1px] h-4"
        style={{ background: `${accentColor}28` }}
      />
      <div
        className="absolute top-0 right-0 h-[1px] w-4"
        style={{ background: `${accentColor}28` }}
      />
    </div>

    <div
      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
      style={{
        background: `radial-gradient(circle at top right, ${accentColor}06, transparent 55%)`,
      }}
    />

    <div className="relative z-10">
      <div className="flex items-center justify-between mb-3">
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center border"
          style={{
            borderColor: `${accentColor}18`,
            background: `${accentColor}07`,
          }}
        >
          <Icon size={15} style={{ color: accentColor }} />
        </div>
        <StatusDot color={accentColor} />
      </div>

      <div
        style={{
          fontFamily: "'JetBrains Mono', monospace",
          fontSize: "8px",
          color: "rgba(148,163,184,0.48)",
          letterSpacing: "0.13em",
          textTransform: "uppercase",
        }}
      >
        {label}
      </div>

      <div
        className="mt-2"
        style={{
          fontFamily: "'Orbitron', sans-serif",
          fontWeight: 700,
          fontSize: "23px",
          letterSpacing: "0.03em",
          color: "white",
          textShadow: `0 0 16px ${accentColor}18`,
        }}
      >
        {value}
      </div>

      {sublabel && (
        <div
          className="mt-1"
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "8px",
            color: `${accentColor}55`,
            letterSpacing: "0.08em",
          }}
        >
          {sublabel}
        </div>
      )}
    </div>
  </motion.div>
);

// ─── Ticker / Live Feed Bar ───────────────────────────────────────────────────
const LiveTicker = ({ urls }) => {
  const downSites = urls.filter((u) => u.status === "DOWN");
  const slowSites = urls.filter((u) => u.status === "SLOW");

  const items = [
    ...downSites.map((s) => ({
      label: s.domain,
      type: "DOWN",
      color: "#f87171",
    })),
    ...slowSites.map((s) => ({
      label: s.domain,
      type: "SLOW",
      color: "#fbbf24",
    })),
    {
      label: `${urls.filter((u) => u.status === "UP").length} sites nominal`,
      type: "OK",
      color: "#34d399",
    },
  ];

  return (
    <div
      className="relative overflow-hidden rounded-xl py-2 px-4"
      style={{
        background: "rgba(3,7,18,0.58)",
        border: "1px solid rgba(56,189,248,0.07)",
        backdropFilter: "blur(10px)",
      }}
    >
      <div className="flex items-center gap-3 overflow-hidden">
        <span
          style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: "8px",
            letterSpacing: "0.18em",
            color: "rgba(56,189,248,0.45)",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
          }}
        >
          LIVE ●
        </span>

        <div
          className="flex gap-6 overflow-hidden"
          style={{
            maskImage:
              "linear-gradient(90deg, transparent, black 8%, black 92%, transparent)",
          }}
        >
          <motion.div
            className="flex gap-6 whitespace-nowrap"
            animate={{ x: ["0%", "-50%"] }}
            transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
          >
            {[...items, ...items].map((item, i) => (
              <span
                key={i}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "8px",
                  color: item.color,
                  letterSpacing: "0.08em",
                }}
              >
                <span style={{ opacity: 0.5 }}>◆</span> {item.label}{" "}
                <span style={{ opacity: 0.35 }}>[{item.type}]</span>
              </span>
            ))}
          </motion.div>
        </div>
      </div>
    </div>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = ({
  urls,
  theme,
  search,
  setSearch,
  filteredUrls,
  upSites,
  downSites,
  onPin,
  onDelete,
  onEdit,
  onBulkDelete,
  popupData,
  setPopupData,
  selectedStatus,
  setSelectedStatus,
}) => {
  const uptimePercent =
    urls.length === 0 ? "0%" : `${Math.round((upSites.length / urls.length) * 100)}%`;

  const [popupOpen, setPopupOpen] = useState(false);
  const [filter, setFilter] = useState("24h");
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const isViewer = currentUser?.role === "VIEWER";

  const [selectedCategories, setSelectedCategories] = useState(["ALL"]);
  const [categories, setCategories] = useState(["ALL"]);
  const [uptimeData, setUptimeData] = useState(null);
  const [selectedSslStatus, setSelectedSslStatus] = useState("ALL");

  useEffect(() => {
    if (!popupOpen) return;

    const fetchUptimeAnalytics = async () => {
      try {
        const res = await axios.get(`/uptime-logs/analytics?range=${filter}`);
        if (res.data.success) setUptimeData(res.data.data);
      } catch (error) {
        console.error("Failed to fetch uptime analytics", error);
      }
    };

    fetchUptimeAnalytics();
  }, [filter, popupOpen]);

  useEffect(() => {
    const uniqueCategories = [
      "ALL",
      ...Array.from(new Set(urls.map((u) => u.category || "UNCATEGORIZED"))),
    ];
    setCategories(uniqueCategories);
  }, [urls]);

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    if (user) setCurrentUser(user);
  }, []);

  let finalUrls = filteredUrls;

  if (!selectedCategories.includes("ALL")) {
    finalUrls = finalUrls.filter((u) =>
      selectedCategories.includes(u.category || "UNCATEGORIZED")
    );
  }

  if (selectedStatus !== "ALL") {
    finalUrls = finalUrls.filter((u) => u.status === selectedStatus);
  }

  if (selectedSslStatus !== "ALL") {
    finalUrls = finalUrls.filter((u) => u.sslStatus === selectedSslStatus);
  }

  const globalUpSites = urls.filter(
    (u) => u.status === "UP" || u.status === "SLOW"
  );
  const globalDownSites = urls.filter((u) => u.status === "DOWN");
  const sslIssues = urls.filter(
    (u) => u.sslStatus === "EXPIRING" || u.sslStatus === "ERROR"
  );

  return (
    <>
      <FontLoader />
      <Background />
      <CursorGlow />

      <OrbitRing radius={220} duration={22} dotCount={8} color="#38bdf8" tilt={72} />
      <OrbitRing
        radius={290}
        duration={34}
        dotCount={12}
        color="#818cf8"
        tilt={66}
        delay={1.2}
      />
      <OrbitRing
        radius={155}
        duration={15}
        dotCount={5}
        color="#34d399"
        tilt={74}
        delay={0.5}
      />

      {["tl", "tr", "bl", "br"].map((p, i) => (
        <HUDCorner key={p} pos={p} delay={0.1 + i * 0.06} />
      ))}

      <main className="relative z-10 px-4 sm:px-6 lg:px-8 py-5 max-w-[1500px] mx-auto space-y-4">
        {/* ─── Header ─── */}
        <motion.div
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4"
        >
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div
                className="h-[1px] w-7"
                style={{ background: "rgba(56,189,248,0.25)" }}
              />
              <span
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "8px",
                  letterSpacing: "0.28em",
                  color: "rgba(56,189,248,0.45)",
                  textTransform: "uppercase",
                }}
              >
                Uptime Command Center
              </span>
              <div
                className="h-[1px] w-20"
                style={{ background: "rgba(56,189,248,0.1)" }}
              />
            </div>

            <h1
              style={{
                fontFamily: "'Orbitron', sans-serif",
                fontWeight: 800,
                fontSize: "clamp(22px, 4vw, 30px)",
                letterSpacing: "0.05em",
                color: "white",
                textShadow: "0 0 28px rgba(56,189,248,0.08)",
              }}
            >
              DASHBOARD
            </h1>

            <div
              className="mt-2"
              style={{
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "9px",
                color: "rgba(148,163,184,0.4)",
                letterSpacing: "0.05em",
              }}
            >
              {new Date().toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
              })}
            </div>
          </div>

          <div className="flex items-center gap-4">
            {downSites.length > 0 && (
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex items-center gap-2 px-3 py-1.5 rounded-full"
                style={{
                  background: "rgba(248,113,113,0.08)",
                  border: "1px solid rgba(248,113,113,0.18)",
                }}
              >
                <motion.div
                  className="w-1.5 h-1.5 rounded-full bg-red-400"
                  animate={{ opacity: [1, 0.3, 1] }}
                  transition={{ duration: 0.8, repeat: Infinity }}
                />
                <span
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "8px",
                    color: "#f87171",
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                  }}
                >
                  {downSites.length} Down
                </span>
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* ─── Live Ticker ─── */}
        {urls.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15, duration: 0.45 }}
          >
            <LiveTicker urls={urls} />
          </motion.div>
        )}

        {/* ─── Stat Cards ─── */}
        <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <HudStatCard
            index={0}
            icon={Globe2}
            label="Total Websites"
            value={urls.length}
            accentColor="#38bdf8"
            sublabel={`${finalUrls.length} in view`}
            onClick={() => setPopupData({ title: "Total Websites", sites: urls })}
          />
          <HudStatCard
            index={1}
            icon={TrendingUp}
            label="Sites Online"
            value={globalUpSites.length}
            accentColor="#34d399"
            sublabel="UP + SLOW"
            onClick={() => setPopupData({ title: "UP Websites", sites: globalUpSites })}
          />
          <HudStatCard
            index={2}
            icon={TrendingDown}
            label="Sites Down"
            value={globalDownSites.length}
            accentColor="#f87171"
            sublabel={globalDownSites.length > 0 ? "Needs attention" : "All clear"}
            onClick={() => setPopupData({ title: "DOWN Websites", sites: globalDownSites })}
          />
          <HudStatCard
            index={3}
            icon={Activity}
            label="Uptime %"
            value={uptimePercent}
            accentColor="#a78bfa"
            sublabel="Current Percentage"
            onClick={() => setPopupOpen(true)}
          />
        </section>

        {/* ─── Secondary Stat Row ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, duration: 0.45 }}
          className="grid grid-cols-1 sm:grid-cols-3 gap-3"
        >
          {[
            {
              label: "SSL Issues",
              value: sslIssues.length,
              color: sslIssues.length > 0 ? "#fbbf24" : "#34d399",
              icon: ShieldCheck,
              sub:
                sslIssues.length > 0
                  ? `${sslIssues.length} certs expiring/erroring`
                  : "All certs healthy",
            },
            {
              label: "Categories",
              value: categories.length - 1,
              color: "#38bdf8",
              icon: Globe2,
              sub: "Monitored groups",
            },
            {
              label: "Slow Sites",
              value: urls.filter((u) => u.status === "SLOW").length,
              color: "#fbbf24",
              icon: Wifi,
              sub: "Latency detected",
            },
          ].map((stat) => (
            <motion.div
              key={stat.label}
              whileHover={{ y: -2 }}
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{
                background: "rgba(3,7,18,0.64)",
                border: `1px solid ${stat.color}10`,
                backdropFilter: "blur(15px)",
              }}
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{
                  background: `${stat.color}09`,
                  border: `1px solid ${stat.color}18`,
                }}
              >
                <stat.icon size={14} style={{ color: stat.color }} />
              </div>

              <div className="min-w-0">
                <div
                  style={{
                    fontFamily: "'JetBrains Mono', monospace",
                    fontSize: "8px",
                    color: "rgba(148,163,184,0.45)",
                    letterSpacing: "0.13em",
                    textTransform: "uppercase",
                  }}
                >
                  {stat.label}
                </div>

                <div className="flex items-baseline gap-2 mt-0.5">
                  <span
                    style={{
                      fontFamily: "'Orbitron', sans-serif",
                      fontWeight: 700,
                      fontSize: "18px",
                      color: "white",
                    }}
                  >
                    {stat.value}
                  </span>
                  <span
                    style={{
                      fontFamily: "'JetBrains Mono', monospace",
                      fontSize: "8px",
                      color: `${stat.color}60`,
                    }}
                  >
                    {stat.sub}
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* ─── Panel Status Bar ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22, duration: 0.45 }}
          className="rounded-2xl px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
          style={{
            background: "rgba(3,7,18,0.66)",
            border: "1px solid rgba(56,189,248,0.08)",
            backdropFilter: "blur(14px)",
            boxShadow: "0 0 18px rgba(56,189,248,0.02)",
          }}
        >
          <div className="flex items-center gap-4">
            <div
              className="h-7 w-[2px] rounded-full"
              style={{
                background:
                  "linear-gradient(to bottom, rgba(56,189,248,0.6), transparent)",
              }}
            />
            <div>
              <div
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  fontWeight: 700,
                  fontSize: "10px",
                  letterSpacing: "0.08em",
                  color: "white",
                }}
              >
                SITE MONITORING PANEL
              </div>
              <div
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  color: "rgba(148,163,184,0.45)",
                  marginTop: "3px",
                }}
              >
                {finalUrls.length} site{finalUrls.length !== 1 ? "s" : ""} in view ·{" "}
                {urls.length} total configured
              </div>
            </div>
          </div>

          <StatusDot color="#38bdf8" label="Live Feed" />
        </motion.div>

        {/* ─── Search + Controls ─── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.28, duration: 0.45 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div className="relative w-full max-w-sm group">
            <Search
              size={13}
              className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none"
              style={{ color: "rgba(56,189,248,0.4)" }}
            />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search domain or URL..."
              aria-label="Search websites by domain or URL"
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl outline-none transition-all duration-300"
              style={{
                background: "rgba(255,255,255,0.025)",
                border: "1px solid rgba(56,189,248,0.09)",
                color: "white",
                fontFamily: "'JetBrains Mono', monospace",
                fontSize: "11px",
                letterSpacing: "0.02em",
                backdropFilter: "blur(12px)",
              }}
              onFocus={(e) => {
                e.target.style.border = "1px solid rgba(56,189,248,0.34)";
                e.target.style.boxShadow =
                  "0 0 0 3px rgba(56,189,248,0.06), 0 0 18px rgba(56,189,248,0.035)";
              }}
              onBlur={(e) => {
                e.target.style.border = "1px solid rgba(56,189,248,0.09)";
                e.target.style.boxShadow = "none";
              }}
            />
          </div>

          {!isViewer && (
            <div className="flex items-center gap-3 flex-wrap justify-end">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => {
                  setSelectionMode((v) => !v);
                  if (selectionMode) setSelectedIds([]);
                }}
                aria-pressed={selectionMode}
                className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300"
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "9px",
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  background: selectionMode
                    ? "rgba(56,189,248,0.12)"
                    : "rgba(255,255,255,0.04)",
                  border: selectionMode
                    ? "1px solid rgba(56,189,248,0.28)"
                    : "1px solid rgba(255,255,255,0.08)",
                  color: selectionMode ? "#38bdf8" : "rgba(148,163,184,0.7)",
                }}
              >
                {selectionMode ? <X size={12} /> : <CheckSquare size={12} />}
                {selectionMode ? "Cancel" : "Select"}
              </motion.button>

              <AnimatePresence>
                {selectionMode && (
                  <>
                    <motion.button
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => {
                        const allIds = finalUrls.map((u) => u._id);
                        const allSelected =
                          allIds.length > 0 &&
                          allIds.every((id) => selectedIds.includes(id));
                        setSelectedIds(allSelected ? [] : allIds);
                      }}
                      disabled={finalUrls.length === 0}
                      className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 disabled:opacity-40"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        background: "rgba(255,255,255,0.04)",
                        border: "1px solid rgba(255,255,255,0.08)",
                        color: "rgba(148,163,184,0.7)",
                      }}
                    >
                      <Square size={12} />
                      {finalUrls.length > 0 &&
                      finalUrls.every((u) => selectedIds.includes(u._id))
                        ? "Deselect All"
                        : "Select All"}
                    </motion.button>

                    <motion.button
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      whileHover={{ scale: 1.03 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={async () => {
                        if (selectedIds.length === 0) return;
                        if (!confirm(`Delete ${selectedIds.length} websites?`)) return;

                        try {
                          if (typeof onBulkDelete === "function") {
                            await onBulkDelete(selectedIds);
                          } else if (typeof onDelete === "function") {
                            await Promise.all(selectedIds.map((id) => onDelete(id)));
                          }
                          setSelectedIds([]);
                        } catch (err) {
                          console.error("Bulk delete failed", err);
                        }
                      }}
                      disabled={selectedIds.length === 0}
                      aria-label={`Delete selected ${selectedIds.length} websites`}
                      className="flex items-center gap-2 px-4 py-2 rounded-2xl transition-all duration-300 disabled:opacity-40"
                      style={{
                        fontFamily: "'JetBrains Mono', monospace",
                        fontSize: "9px",
                        letterSpacing: "0.1em",
                        textTransform: "uppercase",
                        background: "rgba(248,113,113,0.1)",
                        border: "1px solid rgba(248,113,113,0.23)",
                        color: "#f87171",
                      }}
                    >
                      <Trash2 size={12} />
                      Delete ({selectedIds.length})
                    </motion.button>
                  </>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* ─── Table / Empty State ─── */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.5 }}
        >
          {finalUrls.length === 0 ? (
            <div
              className="rounded-2xl p-12 text-center"
              style={{
                background: "rgba(3,7,18,0.68)",
                border: "1px solid rgba(56,189,248,0.08)",
                backdropFilter: "blur(16px)",
              }}
            >
              <div
                className="mx-auto mb-5 w-14 h-14 rounded-2xl flex items-center justify-center border"
                style={{
                  borderColor: "rgba(56,189,248,0.12)",
                  background: "rgba(255,255,255,0.02)",
                }}
              >
                <Globe2 size={22} style={{ color: "#38bdf8" }} />
              </div>

              <h3
                className="text-white mb-2"
                style={{
                  fontFamily: "'Orbitron', sans-serif",
                  letterSpacing: "0.05em",
                  fontWeight: 700,
                  fontSize: "14px",
                }}
              >
                NO SITES FOUND
              </h3>

              <p
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: "10px",
                  color: "rgba(148,163,184,0.45)",
                }}
              >
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <UrlTable
              urls={finalUrls}
              allUrls={urls}
              theme={theme}
              currentUser={currentUser}
              selectionMode={selectionMode}
              selectedIds={selectedIds}
              setSelectedIds={setSelectedIds}
              selectedSslStatus={selectedSslStatus}
              setSelectedSslStatus={setSelectedSslStatus}
              onPin={onPin}
              onDelete={onDelete}
              onEdit={onEdit}
              categories={categories}
              selectedCategories={selectedCategories}
              setSelectedCategories={setSelectedCategories}
              selectedStatus={selectedStatus}
              setSelectedStatus={setSelectedStatus}
            />
          )}
        </motion.div>

        {/* ─── Popups ─── */}
        {popupData && (
          <CrystalPopup
            popupData={popupData}
            onClose={() => setPopupData(null)}
          />
        )}

        {popupOpen && (
          <UptimePopup
            data={uptimeData}
            filter={filter}
            setFilter={setFilter}
            onClose={() => setPopupOpen(false)}
          />
        )}
      </main>
    </>
  );
};

export default Dashboard;