import { useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import paths from './heroSpiralPaths.json';

const HeroSpiral = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end start"]
  });

  // Smooth out the scroll progress
  const smoothProgress = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Map scroll progress to path animation
  const pathLength = useTransform(smoothProgress, [0, 0.45], [0, 1]);

  const opacity = useTransform(smoothProgress, [0, 0.1, 0.9, 1], [0, 1, 1, 0]);
  const scale = useTransform(smoothProgress, [0, 0.5, 1], [0.95, 1.05, 0.95]);

  // Pulse offsets for revolving effect (different speeds)
  const pulseOffsetSlow = useTransform(smoothProgress, [0, 1], [0, -1200]);
  const pulseOffsetMid = useTransform(smoothProgress, [0, 1], [0, -2000]);
  const pulseOffsetFast = useTransform(smoothProgress, [0, 1], [0, -2800]);
  const pulseOffsets = [pulseOffsetSlow, pulseOffsetMid, pulseOffsetFast];
  const pulseOpacity = useTransform(smoothProgress, [0, 0.1], [0, 1]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="w-full relative flex items-center justify-center py-5 mt-20 overflow-hidden pointer-events-none"
    >
      <div className="relative w-full max-w-6xl aspect-[2/1] flex items-center justify-center">
        <motion.svg
          viewBox="0 0 1547 773"
          style={{
            opacity,
            scale,
            filter: 'drop-shadow(0 0 25px rgba(110, 140, 150, 0.2))'
          }}
          className="w-full h-auto block overflow-visible"
        >
          {/* 
            Magnetic Field Logic:
            The group containing all paths is skewed around the central red dot.
            This mathematically ensures that the coordinates at the very center (773.5, 386.5) 
            remain visually static while the loops "bulge" or "sway" horizontally.
          */}
          <motion.g
            style={{
              transformOrigin: "773.5px 386.5px" // Lock the transformation to the red dot
            }}
          >
            {paths.map((d, index) => (
              <motion.g key={index}>
                {/* Background static line for the path structure */}
                <motion.path
                  d={d}
                  stroke="rgba(110, 140, 150, 0.15)"
                  strokeWidth="0.8"
                  fill="none"
                  strokeLinecap="round"
                  style={{ pathLength }}
                />
                {/* Moving pulse line */}
                <motion.path
                  d={d}
                  stroke="rgba(255, 255, 255, 0.5)"
                  strokeWidth="1.6"
                  fill="none"
                  strokeLinecap="round"
                  style={{
                    pathLength: 1,
                    strokeDasharray: "20 450", // Short pulse with long gap
                    strokeDashoffset: pulseOffsets[index % 3], // Circular speed variation
                    opacity: pulseOpacity
                  }}
                />
              </motion.g>
            ))}
          </motion.g>

          {/* The "Dot Red" - Fixed Center of the field */}
          <circle
            cx="773.5"
            cy="386.5"
            r="8"
            fill="#3cb44f" // Bright red
            style={{
              filter: 'drop-shadow(0 0 15px rgba(60, 180, 79, 0.8))'
            }}
          />
        </motion.svg>

        {/* Ambient center glow that remains fixed with the dot */}
        <motion.div
          style={{ opacity: useTransform(opacity, [0, 1], [0, 0.4]) }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-[#3cb44f]/20 blur-[80px] rounded-full -z-10"
        />
      </div>
    </div>
  );
};

export default HeroSpiral;
