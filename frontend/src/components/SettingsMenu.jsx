import { useState, useEffect } from "react";
import { Settings, LogOut, Moon, Sun, User, Shield, X } from "lucide-react";

const SettingsMenu = ({ theme, toggleTheme, onLogout }) => {
  const [open, setOpen] = useState(false);

  const user = JSON.parse(localStorage.getItem("user") || "null");
  const isAdmin = user?.role === "ADMIN" || user?.role === "SUPERADMIN";

  const initials =
    user?.name
      ?.split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase() || "U";

  /* CLOSE WITH ESC */
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") setOpen(false);
    };

    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  return (
    <>
      {/* SETTINGS BUTTON */}
      <button
        onClick={() => setOpen(true)}
        className="
        flex items-center justify-center
        p-2 rounded-xl
        bg-white/10 hover:bg-white/20
        backdrop-blur-lg
        border border-white/20
        transition
        "
      >
        <Settings size={20} />
      </button>

      {/* OVERLAY */}
      <div
        onClick={() => setOpen(false)}
        className={`
        fixed inset-0 bg-black/40 backdrop-blur-sm z-40
        transition-opacity duration-300
        ${open ? "opacity-100 visible" : "opacity-0 invisible"}
        `}
      />

      {/* SIDEBAR PANEL */}
      <div
        className={`
        fixed top-0 right-0 h-full w-[320px]
        bg-white dark:bg-gray-900
        border-l border-gray-200 dark:border-gray-700
        shadow-2xl
        z-50
        transform transition-transform duration-300 ease-out
        ${open ? "translate-x-0" : "translate-x-full"}
        `}
      >
        {/* HEADER */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200 dark:border-gray-700">

          <h2 className="font-semibold text-gray-800 dark:text-white">
            Settings
          </h2>

          <button
            onClick={() => setOpen(false)}
            className="p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition"
          >
            <X size={18} />
          </button>

        </div>

        {/* USER PROFILE */}
        <div className="px-5 py-5 border-b border-gray-200 dark:border-gray-700 flex items-center gap-4">

          <div className="
            w-11 h-11 rounded-full
            flex items-center justify-center
            text-white font-semibold
            bg-gradient-to-r from-blue-500 to-purple-600
          ">
            {initials}
          </div>

          <div className="flex flex-col">

            <div className="flex items-center gap-2">

              <span className="font-medium text-gray-800 dark:text-white">
                {user?.name || "User"}
              </span>

              <span
                className={`
                flex items-center gap-1
                text-[10px] px-2 py-0.5 rounded-full font-medium
                ${
                  isAdmin
                    ? "bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-300"
                    : "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300"
                }
                `}
              >
                {isAdmin && <Shield size={10} />}
                {user?.role || "USER"}
              </span>

            </div>

            <span className="text-xs text-gray-500 dark:text-gray-400">
              {user?.email || "user@email.com"}
            </span>

          </div>

        </div>

        {/* SETTINGS OPTIONS */}
        <div className="p-5 space-y-5">

          {/* THEME TOGGLE */}
          <div className="flex items-center justify-between">

            <div className="flex items-center gap-3 text-gray-700 dark:text-gray-200">
              {theme === "light" ? <Moon size={18} /> : <Sun size={18} />}
              Theme
            </div>

            {/* TOGGLE SWITCH */}
            <button
              onClick={toggleTheme}
              className={`
                relative w-11 h-6 rounded-full transition
                ${theme === "dark" ? "bg-blue-600" : "bg-gray-300"}
              `}
            >
              <span
                className={`
                absolute top-0.5 left-0.5
                w-5 h-5 bg-white rounded-full shadow
                transform transition
                ${theme === "dark" ? "translate-x-5" : ""}
                `}
              />
            </button>

          </div>

        </div>

        {/* FOOTER */}
        <div className="absolute bottom-0 left-0 w-full p-5 border-t border-gray-200 dark:border-gray-700">

          <button
            onClick={onLogout}
            className="
            w-full flex items-center justify-center gap-2
            px-4 py-2 rounded-lg
            text-red-500
            hover:bg-red-50 dark:hover:bg-red-900/20
            transition
            "
          >
            <LogOut size={18} />
            Logout
          </button>

        </div>

      </div>
    </>
  );
};

export default SettingsMenu;