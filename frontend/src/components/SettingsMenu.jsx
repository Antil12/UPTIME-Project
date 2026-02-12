import { useState, useRef, useEffect } from "react";
import { Settings, LogOut, Moon, Sun, User } from "lucide-react";

const SettingsMenu = ({ theme, toggleTheme, onLogout }) => {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () =>
      document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* SETTINGS BUTTON */}
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="p-2 rounded-xl bg-white/10 hover:bg-white/20 transition backdrop-blur-lg border border-white/20"
      >
        <Settings size={20} />
      </button>

      {/* DROPDOWN */}
      {open && (
        <div
          className="
            absolute right-0 top-full mt-3
            w-64
            rounded-2xl
            bg-white dark:bg-gray-900
            shadow-2xl
            border border-gray-200 dark:border-gray-700
            z-[999]
            overflow-hidden
            animate-dropdown
          "
        >
          {/* USER INFO */}
          <div className="flex items-center gap-3 px-4 py-4 border-b border-gray-200 dark:border-gray-700">
            <div className="w-10 h-10 flex items-center justify-center rounded-full bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              <User size={18} />
            </div>
            <div>
              <p className="font-semibold text-gray-800 dark:text-white">
                {user?.name || "User"}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {user?.email}
              </p>
            </div>
          </div>

          {/* MENU OPTIONS */}
          <div className="p-2">

           <button
  onClick={toggleTheme}
  className="
    w-full flex items-center justify-between gap-3
    px-3 py-2 rounded-lg
    bg-gray-50 dark:bg-gray-800
    text-gray-700 dark:text-gray-200
    hover:bg-gray-100 dark:hover:bg-gray-700
    transition-all duration-200
  "
>
  <div className="flex items-center gap-3">
    {theme === "light" ? (
      <Moon size={18} className="text-gray-600 dark:text-gray-300" />
    ) : (
      <Sun size={18} className="text-yellow-500" />
    )}
    <span>
      {theme === "light" ? "Dark Mode" : "Light Mode"}
    </span>
  </div>
</button>

            <button
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg
                         text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
            >
              <LogOut size={18} />
              Logout
            </button>

          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsMenu;
