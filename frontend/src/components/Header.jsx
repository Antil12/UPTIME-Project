import React from "react";
import { useNavigate } from "react-router-dom";
import SettingsMenu from "./SettingsMenu";
import CrystalButton from "./CrystalButton";

const Header = ({
  theme,
  setTheme,
  handleRefresh,
  isRefreshing,
  handleLogout,
   currentUser,
}) => {
  const navigate = useNavigate();

  return (
           <header className="sticky top-0 z-50 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm">
           <div className="w-full flex items-center justify-between px-4 md:px-10 py-3">


        <div className="w-full flex items-center justify-between px-3 md:px-8 py-2 md:py-4">

          {/* LOGO */}
          <div className="flex items-center gap-3">

            

{/* ----------------------------------------------------------------------------------------------- */}
            {/* DESKTOP TEXT LOGO */}
            
<div className="flex items-center gap-3">

  {/* Icon (always visible) */}
            <div className="w-9 h-9 flex items-center justify-center rounded-lg text-base font-semibold" style={{background: 'hsl(var(--chart-4) / 0.12)', color: 'hsl(var(--chart-4))'}}>
    ⏱️
  </div>

  {/* Title (desktop only) */}
  <div className="hidden md:flex flex-col leading-tight">
    <span className="text-base font-semibold text-gray-900 dark:text-white">
      Uptime Monitor
    </span>
    <span className="text-xs text-gray-500 dark:text-gray-400">
      Real-time Monitoring
    </span>
  </div>

</div>

            {/* INTERNAL CSS */}
            <style>{`
              .watch-logo { position: relative; }

              .dial {
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: hsl(var(--card));
                border: 2px solid hsl(var(--border));
                box-shadow: 0 4px 12px hsl(0 0% 0% / 0.15);
              }

              .marker { position: absolute; background: hsl(var(--muted)); }

              .marker-12 { width: 2px; height: 6px; top: 4px; left: 50%; transform: translateX(-50%); }
              .marker-3 { width: 6px; height: 2px; right: 4px; top: 50%; transform: translateY(-50%); }
              .marker-6 { width: 2px; height: 6px; bottom: 4px; left: 50%; transform: translateX(-50%); }
              .marker-9 { width: 6px; height: 2px; left: 4px; top: 50%; transform: translateY(-50%); }

              .hand {
                position: absolute;
                bottom: 50%;
                left: 50%;
                transform-origin: bottom;
                transform: translateX(-50%);
                border-radius: 2px;
              }

              .hour {
                width: 3px;
                height: 10px;
                background: hsl(var(--foreground));
                animation: rotateHour 60s linear infinite;
              }

              .minute {
                width: 2px;
                height: 14px;
                background: hsl(var(--chart-4));
                animation: rotateMinute 20s linear infinite;
              }

              .second {
                width: 1px;
                height: 16px;
                background: hsl(var(--chart-3));
                animation: rotateSecond 4s linear infinite;
              }

              .center-dot {
                position: absolute;
                width: 6px;
                height: 6px;
                background: hsl(var(--foreground));
                border-radius: 50%;
                z-index: 10;
              }

              @keyframes rotateSecond {
                from { transform: translateX(-50%) rotate(0deg); }
                to { transform: translateX(-50%) rotate(360deg); }
              }

              @keyframes rotateMinute {
                from { transform: translateX(-50%) rotate(0deg); }
                to { transform: translateX(-50%) rotate(360deg); }
              }

              @keyframes rotateHour {
                from { transform: translateX(-50%) rotate(0deg); }
                to { transform: translateX(-50%) rotate(360deg); }
              }
            `}</style>
          </div>

          {/* RIGHT SIDE */}
          <div className="flex items-center gap-2 md:gap-4">

            <div className="hidden md:flex gap-2">

              <CrystalButton label="Dashboard" onClick={() => navigate("/dashboard")} theme={theme}/>
              <CrystalButton label="Add URL" onClick={() => navigate("/add")} theme={theme}/>
              <CrystalButton label="Reports" onClick={() => navigate("/reports")} theme={theme}/>
              {/* <CrystalButton label="Super Admin" onClick={() => navigate("/superadmin")} theme={theme}/> */}

              {/* {JSON.parse(localStorage.getItem("user"))?.role === "SUPERADMIN" && ( */}
{currentUser?.role?.toUpperCase() === "SUPERADMIN" && (
  <CrystalButton
    label="Super Admin"
    onClick={() => navigate("/superadmin")}
    theme={theme}
  />
)}

            </div>

            <div className="flex md:hidden gap-2">
              <button onClick={() => navigate("/dashboard")} className="px-3 py-2 rounded-lg bg-white/10 text-xs">📊</button>
              <button onClick={() => navigate("/add")} className="px-3 py-2 rounded-lg bg-white/10 text-xs">➕</button>
              <button onClick={() => navigate("/reports")} className="px-3 py-2 rounded-lg bg-white/10 text-xs">📄</button>
              <button onClick={() => navigate("/superadmin")} className="px-3 py-2 rounded-lg bg-white/10 text-xs">👑</button>
            </div>

            <button
              onClick={handleRefresh}
              disabled={isRefreshing}
              className={`w-9 h-9 flex items-center justify-center rounded-lg text-white text-sm
                ${isRefreshing ? "bg-gray-500" : "bg-gradient-to-r from-emerald-500 to-green-600"}`}
            >
              🔄
            </button>

            <div className="w-9 h-9 flex items-center justify-center rounded-lg bg-white/10">
              <SettingsMenu
                theme={theme}
                toggleTheme={() => setTheme(theme === "light" ? "dark" : "light")}
                onLogout={handleLogout}
              />
            </div>

          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
