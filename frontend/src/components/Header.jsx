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
}) => {
  const navigate = useNavigate();

  return (
    <header className="sticky top-0 z-50">
      <div className="backdrop-blur-2xl bg-white/10 border-b border-white/10 shadow-xl">
        <div className="w-full flex items-center justify-between px-3 md:px-8 py-2 md:py-4">

          {/* LOGO */}
          <div className="flex items-center gap-3">

            {/* MOBILE + TABLET REAL WATCH */}
            <div className="md:hidden relative w-11 h-11 flex items-center justify-center watch-logo">
              <div className="dial"></div>

              <div className="marker marker-12"></div>
              <div className="marker marker-3"></div>
              <div className="marker marker-6"></div>
              <div className="marker marker-9"></div>

              <div className="hand hour"></div>
              <div className="hand minute"></div>
              <div className="hand second"></div>

              <div className="center-dot"></div>
            </div>

            {/* DESKTOP TEXT LOGO */}
            <h1 className="hidden md:block text-2xl font-bold 
              bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 
              bg-clip-text text-transparent tracking-wide">
              ⏱️ Uptime Monitor
            </h1>

            {/* INTERNAL CSS */}
            <style>{`
              .watch-logo { position: relative; }

              .dial {
                position: absolute;
                width: 100%;
                height: 100%;
                border-radius: 50%;
                background: white;
                border: 2px solid #d1d5db;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
              }

              .marker { position: absolute; background: #6b7280; }

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
                background: #111827;
                animation: rotateHour 60s linear infinite;
              }

              .minute {
                width: 2px;
                height: 14px;
                background: #2563eb;
                animation: rotateMinute 20s linear infinite;
              }

              .second {
                width: 1px;
                height: 16px;
                background: #ef4444;
                animation: rotateSecond 4s linear infinite;
              }

              .center-dot {
                position: absolute;
                width: 6px;
                height: 6px;
                background: #111827;
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

            <div className="hidden md:flex gap-2 bg-white/5 p-2 rounded-2xl border border-white/10 backdrop-blur-xl">
              <CrystalButton label="Dashboard" onClick={() => navigate("/dashboard")} theme={theme}/>
              <CrystalButton label="Add URL" onClick={() => navigate("/add")} theme={theme}/>
              <CrystalButton label="Reports" onClick={() => navigate("/reports")} theme={theme}/>
            </div>

            <div className="flex md:hidden gap-2">
              <button onClick={() => navigate("/dashboard")} className="px-3 py-2 rounded-lg bg-white/10 text-xs">📊</button>
              <button onClick={() => navigate("/add")} className="px-3 py-2 rounded-lg bg-white/10 text-xs">➕</button>
              <button onClick={() => navigate("/reports")} className="px-3 py-2 rounded-lg bg-white/10 text-xs">📄</button>
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
