import React from "react";

export default function StatCard({
  title,
  value,
  icon,
  theme = "dark",
  onClick,
}) {
  // Gradient colors for different stats
  const gradientColors = {
    Total: "from-purple-400 via-pink-400 to-red-400",
    UP: "from-green-400 via-green-300 to-green-200",
    DOWN: "from-red-500 via-red-400 to-red-300",
    "Uptime %": "from-yellow-400 via-yellow-300 to-yellow-200",
    "Avg Response": "from-indigo-400 via-blue-400 to-cyan-400",
    Settings: "from-purple-500 via-pink-500 to-red-500",
  };

  const selectedGradient =
    gradientColors[title] ||
    "from-blue-400 via-indigo-400 to-purple-400";

  return (
    <div
      onClick={onClick}
      className={`
        relative flex flex-col items-center justify-center
        px-4 py-3 rounded-2xl
        shadow-xl backdrop-blur-lg border
        transition-all duration-300
        hover:scale-[1.03] cursor-pointer
        ${theme === "dark"
          ? "bg-gray-800/70 border-gray-700 text-white"
          : "bg-white/50 border-white/30 text-black"}
        ring-1 ring-white/20
      `}
    >
      {/* Icon */}
      {icon && (
        <span className="text-xl mb-1 drop-shadow-md">
          {icon}
        </span>
      )}

      {/* Title */}
      <h3
        className={`
          text-sm md:text-base font-semibold mb-1
          text-transparent bg-clip-text
          bg-gradient-to-r ${selectedGradient}
          drop-shadow
        `}
      >
        {title}
      </h3>

      {/* Value */}
      <p
        className={`
          text-lg md:text-xl font-bold
          text-transparent bg-clip-text
          bg-gradient-to-r ${selectedGradient}
          drop-shadow animate-pulse
        `}
      >
        {value}
      </p>

      {/* Shiny hover overlay */}
      <span
        className="
          absolute inset-0 bg-gradient-to-r
          from-white/20 via-white/5 to-white/20
          opacity-0 hover:opacity-25
          rounded-2xl pointer-events-none
          transition-opacity duration-300
        "
      />
    </div>
  );
}
