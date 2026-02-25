import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import BlurText from "./BlurText";

// ---------- 3D Gradient Background ----------
const Background3D = () => (
  <div className="absolute inset-0 overflow-hidden">
    <motion.div
      className="absolute inset-0"
      style={{
        background: "radial-gradient(circle at 30% 30%, #111827, transparent 80%)",
        transform: "perspective(800px) rotateX(10deg)",
      }}
      animate={{ rotate: [0, 1, 0, -1, 0] }}
      transition={{ repeat: Infinity, duration: 25, ease: "easeInOut" }}
    />
    <motion.div
      className="absolute inset-0"
      style={{
        background: "radial-gradient(circle at 70% 70%, #1f2937, transparent 80%)",
        transform: "perspective(800px) rotateX(-5deg) rotateY(5deg)",
      }}
      animate={{ rotateY: [0, 2, 0, -2, 0] }}
      transition={{ repeat: Infinity, duration: 30, ease: "easeInOut" }}
    />
  </div>
);

// ---------- Diagonal Bubble Particles ----------
const ParticleBackground = ({ count = 50 }) => {
  const particles = Array.from({ length: count });

  return (
    <div className="absolute inset-0 overflow-hidden">
      {particles.map((_, i) => {
        const size = Math.random() * 6 + 3;
        const delay = Math.random() * 2;
        const duration = Math.random() * 6 + 4;
        const startX = 80 + Math.random() * 20;
        const startY = -10 - Math.random() * 50;
        const endX = startX - (Math.random() * 120 + 100);
        const endY = 600 + Math.random() * 100;

        return (
          <motion.div
            key={i}
            className="bg-white/30 rounded-full"
            style={{
              width: size,
              height: size,
              position: "absolute",
              left: `${startX}%`,
              top: `${startY}px`,
            }}
            animate={{
              x: [0, endX - startX],
              y: [0, endY - startY],
              scale: [0.3, 1, 0.5], // perspective scaling
              opacity: [0, 1, 0],
            }}
            transition={{
              repeat: Infinity,
              repeatType: "loop",
              duration,
              delay,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </div>
  );
};

// ---------- Cinematic PreLoginSplash ----------
const PreLoginSplash = () => {
  const [showSplash, setShowSplash] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      setShowSplash(false);
      navigate("/login", { replace: true });
    }, 2500); // slightly longer to finish animations
    return () => clearTimeout(timer);
  }, [navigate]);

  if (!showSplash) return null;

  return (
    <div className="relative flex items-center justify-center h-screen overflow-hidden bg-gray-900">
      {/* 3D background */}
      <Background3D />

      {/* Diagonal bubbles */}
      <ParticleBackground count={60} />

      {/* Cinematic UPTIME letters */}
      <motion.div
        initial={{ scale: 0, opacity: 0, y: -50 }}
        animate={{ scale: [0, 1.2, 1], opacity: [0, 1, 1], y: [ -50, 0, -10 ] }}
        transition={{ duration: 1.5, ease: "easeOut" }}
        className="z-10"
      >
        <BlurText
          text="UPTIME"
          delay={80}
          animateBy="letters"
          className="text-7xl font-extrabold text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]"
        />
      </motion.div>
    </div>
  );
};

export default PreLoginSplash;