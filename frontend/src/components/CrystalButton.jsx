export default function CrystalButton({ label, onClick, active, theme }) {
  const isDark = theme === "dark";

  return (
    <button
      onClick={onClick}
      className={`
        relative px-4 py-2 rounded-md text-sm font-medium
        transition-all duration-200 ease-in-out
        focus:outline-none

        ${
          active
            ? isDark
              ? "bg-gray-800 text-white shadow-sm"
              : "bg-gray-200 text-gray-900 shadow-sm"
            : isDark
              ? "text-gray-400 hover:text-white hover:bg-gray-800/70"
              : "text-gray-600 hover:text-gray-900 hover:bg-gray-100"
        }
      `}
    >
      <span className="relative z-10 tracking-wide">
        {label}
      </span>

      {/* Active subtle left indicator */}
      {active && (
        <span
          className={`
            absolute left-0 top-0 bottom-0 w-[3px] rounded-l-md
            ${isDark ? "bg-indigo-500" : "bg-indigo-600"}
          `}
        />
      )}
    </button>
  );
}
