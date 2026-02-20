import React from "react";

export default function StatCard({
  title,
  value,
  icon,
  theme = "dark",
  onClick,
  compact = false,
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
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      className={`
        relative flex flex-col items-center justify-center
        ${compact ? 'px-3 py-2' : 'px-4 py-3'} rounded-2xl
        shadow-xl backdrop-blur-lg border
        transition-all duration-300
        hover:scale-[1.03] ${onClick ? 'cursor-pointer' : ''}
        ${theme === "dark"
          ? "bg-gray-800/70 border-gray-700 text-white"
          : "bg-white/50 border-white/30 text-black"}
        ring-1 ring-white/20
      `}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) onClick();
      }}
    >
      {/* Icon */}
      {icon && (
        <span className={`mb-1 drop-shadow-md ${compact ? 'text-base' : 'text-xl'}`} aria-hidden="true">
          {icon}
        </span>
      )}

      {/* Title */}
      <h3
        className={`
          ${compact ? 'text-xs md:text-sm' : 'text-sm md:text-base'} font-semibold mb-1
          text-transparent bg-clip-text
          bg-gradient-to-r ${selectedGradient}
          drop-shadow
        `}
        aria-label={title}
      >
        {title}
      </h3>

      {/* Value */}
      <p
        className={`
          ${compact ? 'text-base md:text-lg' : 'text-lg md:text-xl'} font-bold
          text-transparent bg-clip-text
          bg-gradient-to-r ${selectedGradient}
          drop-shadow animate-pulse
        `}
        aria-live="polite"
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
