export default function CrystalButton({ label, onClick, active, theme }) {
  // Gradient colors for active button
  const activeGradient = "from-purple-400 via-pink-400 to-red-400";
  const inactiveGradient = "from-white/20 via-white/10 to-white/20";

  return (
    <button
      onClick={onClick}
      className={`
        relative px-5 py-2 rounded-3xl font-semibold text-sm md:text-base
        shadow-2xl backdrop-blur-lg border
        transition-all duration-300 transform hover:scale-105
        ${active
          ? `text-transparent bg-clip-text bg-gradient-to-r ${activeGradient} ring-1 ring-white/30 shadow-xl`
          : theme === "dark"
            ? `text-gray-300 border-gray-600 hover:bg-white/10 hover:shadow-lg hover:ring-1 hover:ring-white/20`
            : `text-blue-800 border-white/30 hover:bg-white/20 hover:shadow-lg hover:ring-1 hover:ring-white/30`
        }
      `}
    >
      {/* Label with gradient and shadow */}
      <span className={`
        relative z-10
        ${active ? "text-transparent bg-clip-text bg-gradient-to-r " + activeGradient : ""}
      `}>
        {label}
      </span>

      {/* Shiny overlay */}
      <span className="
        absolute inset-0 bg-gradient-to-r from-white/30 via-white/10 to-white/30
        opacity-0 hover:opacity-30 rounded-3xl pointer-events-none
        transition-opacity duration-300
      "></span>
    </button>
  );
}
