import { motion } from 'motion/react';

import { useEffect, useRef, useState } from "react";

const BlurText = ({
  text = "",
  delay = 100,
  className = "",
  animateBy = "letters",
  onAnimationComplete,
}) => {
  const elements = animateBy === "words" ? text.split(" ") : text.split("");
  const [inView, setInView] = useState(false);
  const ref = useRef(null);

  // Observe when component enters viewport
  useEffect(() => {
    if (!ref.current) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.unobserve(ref.current);
      }
    });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <p
      ref={ref}
      className={`flex flex-wrap justify-center ${className}`}
      style={{ perspective: "1000px" }}
    >
      {elements.map((segment, index) => {
        // Random initial positions for bubble effect
        const randomX = Math.floor(Math.random() * 200 - 100); // -100 to 100
        const randomY = Math.floor(Math.random() * 200 - 100); // -100 to 100
        const randomRotate = Math.floor(Math.random() * 720 - 360); // -360 to 360

        return (
          <motion.span
            key={index}
            className="inline-block will-change-[transform,opacity,filter]"
            initial={{
              opacity: 0,
              x: randomX,
              y: randomY,
              rotate: randomRotate,
              scale: 0.3,
              filter: "blur(10px)",
            }}
            animate={
              inView
                ? {
                    opacity: [0, 1, 1, 0], // fade in, stay, fade out
                    x: [randomX, 0, 0, 0],
                    y: [randomY, 0, 0, -50], // slight float up at the end
                    scale: [0.3, 1.2, 1, 1.3], // pop & settle
                    rotate: [randomRotate, 0, 0, 20], // tiny spin at end
                    filter: ["blur(10px)", "blur(0px)", "blur(0px)", "blur(4px)"],
                  }
                : {}
            }
            transition={{
              duration: 2, // total animation 2s
              delay: (index * delay) / 1000,
              ease: "easeInOut",
            }}
            onAnimationComplete={index === elements.length - 1 ? onAnimationComplete : undefined}
          >
            {segment === " " ? "\u00A0" : segment}
            {animateBy === "words" && index < elements.length - 1 && "\u00A0"}
          </motion.span>
        );
      })}
    </p>
  );
};

export default BlurText;