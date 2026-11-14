import { useState } from "react";
import { motion } from "framer-motion";

const LEAF_COUNT = 18;

const Leaf = () => {
  // Randomise once per leaf so it doesn't jump around on re-render
  const [{ randomX, randomDelay, randomDuration, randomScale, randomSwing }] = useState(() => ({
    randomX: Math.random() * 100,
    randomDelay: Math.random() * 15,
    randomDuration: 12 + Math.random() * 20,
    randomScale: 0.4 + Math.random() * 0.6,
    randomSwing: 20 + Math.random() * 40,
  }));

  return (
    <motion.svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      style={{
        position: "fixed",
        left: `${randomX}%`,
        top: -30,
        zIndex: 100,
        pointerEvents: "none",
        opacity: 0.25,
      }}
      initial={{ y: -30, x: 0, rotate: 0, scale: randomScale }}
      animate={{
        y: "110vh",
        x: [0, randomSwing, -randomSwing, 0],
        rotate: [0, 180, 360, 540],
      }}
      transition={{
        duration: randomDuration,
        delay: randomDelay,
        repeat: Infinity,
        ease: "linear",
      }}
    >
      <path
        d="M17,8C8,10 5,16 5,16C5,16 11,15 15,7C17,3 11,2 11,2C11,2 11,4 8,8C5,12 9,17 12,19C15,21 19,15 19,15C19,15 19,13 17,8Z"
        fill="var(--primary)"
      />
    </motion.svg>
  );
};

export default function BackgroundEffects() {
  return (
    <div className="background-effects" style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: -10, overflow: "hidden" }}>
      {Array.from({ length: LEAF_COUNT }).map((_, i) => (
        <Leaf key={i} />
      ))}
    </div>
  );
}
