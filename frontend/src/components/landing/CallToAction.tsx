import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const rings = Array.from({ length: 40 }).map((_, i) => ({
  top: i * 10,
  left: i * 10,
  width: 1000 - i * 20,
  height: 567 - i * 10,
}));
const CallToAction = () => {
  const containerRef = useRef<HTMLElement>(null);

  // We assign useScroll to the h-[300vh] parent section.
  // This smoothly tracks the scrollbar strictly whilst the user is locked
  // inside the pinned viewport for a fluid scroll-tied storytelling sequence!
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Automatically start at 0% and map directly relative to the scroll depth natively
  // Tuning TIP: To make it follow your scroll wheel "intensity" more (less snappy):
  // Increase damping (50+) or decrease stiffness (< 100).
  const smoothDistance = useSpring(scrollYProgress, { damping: 50, stiffness: 100, mass: 0.8 });

  // Phase 1: Tunnel (0 to 0.5)
  // 0.0-0.1: Hold (Wait for scroll)
  // 0.1-0.5: Enlarge (The Zoom)
  const tunnelScale = useTransform(smoothDistance, [0, 0.1, 0.5], [1, 1, 30]);
  const tunnelOpacity = useTransform(smoothDistance, [0, 0.45, 0.5], [1, 1, 0]);

  // Transition Glow - using exactly the accent color #3cb44f
  const accentGlowScale = useTransform(smoothDistance, [0.1, 0.5], [0, 50]);
  const accentGlowOpacity = useTransform(smoothDistance, [0.1, 0.45, 0.5], [0, 1, 1]);

  // Phase 2: Main Content Fades in at 0.5
  // mainScreenOpacity comes in smoothly from the glow
  const mainScreenOpacity = useTransform(smoothDistance, [0.45, 0.5], [0, 1]);

  const contentOpacity = useTransform(smoothDistance, [0.5, 0.55], [0, 1]);
  const contentScale = useTransform(smoothDistance, [0.5, 0.55], [0.9, 1]);
  const contentY = useTransform(smoothDistance, [0.5, 0.55], [50, 0]);

  const wormholeOpacity = useTransform(smoothDistance, [0.55, 0.6], [0, 1]);
  const wormholeY = useTransform(smoothDistance, [0.55, 0.6], [50, 0]);

  // Map ball dropping specifically for the second half [0.6, 0.85]
  const ctaProgress = useTransform(smoothDistance, [0.6, 0.85], [0, 1]);
  const offsetDistance = useTransform(ctaProgress, v => `${Math.max(0, v) * 100}%`);

  // Slowly disappear exactly at the relative points of the second half
  const ballOpacity = useTransform(
    smoothDistance,
    [0, 0.8, 0.85, 1],
    [1, 1, 0, 0]
  );

  // Scroll snap
  useGSAP(() => {
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      snap: {
        snapTo: [0, 0.1, 0.5, 0.85, 1], // [Start, Hold, ZoomComplete, BallComplete, End]
        duration: { min: 0.3, max: 0.8 },
        delay: 0.1,
        ease: 'power2.inOut'
      }
    });
  }, { scope: containerRef });

  return (
    <section ref={containerRef} className="relative w-full bg-[#000000] h-[600vh]">
      {/* sticky layer locks the view strictly in place for the full 600vh duration */}
      <div className="sticky top-0 w-full h-screen flex flex-col items-center justify-center overflow-hidden">

        {/* ── PHASE 1: The Tunnel ── */}
        {/* CONTROL TIP:
            SIZE: Adjust 'width' and 'height' in the 'rings' array at the top of the file.
            POSITION: Adjust 'x' and 'y' in the 'style' prop below. 
            X: -50% centers it horizontally. 
            Y: -40% shifts it slightly above center for a "perspective" baseline.  */}
        <motion.div
          className="absolute top-[67%] left-1/2 flex items-center justify-center origin-bottom z-10"
          style={{ width: 1000, height: 567, x: '-50%', y: '-40%', scale: tunnelScale, opacity: tunnelOpacity }}
        >
          {rings.map((r, i) => (
            <div
              key={i}
              className="absolute overflow-x-hidden rounded-t-full scale-175"
              style={{
                top: r.top, left: r.left, width: r.width, height: r.height,
                borderTop: '1px solid rgba(255,255,255,0.4)',
                borderLeft: '1px solid rgba(255,255,255,0.4)',
                borderRight: '1px solid rgba(255,255,255,0.4)'
              }}
            />
          ))}
          {/* Subtle accent glow at the base of the rings */}
          <span className="bg-[#3cb44f] absolute aspect-square bottom-0 left-1/2 -translate-x-1/2 rounded-full" style={{ boxShadow: 'rgba(60, 180, 79, 0.8) 0px 4px 16px 24px', width: 0, height: 0 }}></span>
        </motion.div>

        {/* Transitioning Accent Blur Overlay - This expands to be the screen itself */}
        <motion.div
          className="absolute bottom-[-100px] left-1/2 rounded-full bg-[#3cb44f] z-20"
          style={{
            width: 300, height: 300,
            x: '-50%',
            scale: accentGlowScale,
            opacity: accentGlowOpacity,
            filter: 'blur(50px)'
          }}
        />

        {/* ── PHASE 2: Main Green Content ── */}
        <motion.div
          className="absolute inset-0 bg-[#3cb44f] z-30 flex flex-col items-center pt-16 pb-20 justify-center"
          style={{ opacity: mainScreenOpacity }}
        >

          <motion.div
            style={{ opacity: contentOpacity, scale: contentScale, y: contentY }}
            className="w-full max-w-5xl mx-auto flex flex-col items-center text-center px-4 relative z-10 flex-grow justify-center"
          >
            <h2 className="text-[#1C1C1C] text-4xl sm:text-5xl md:text-[4.5rem] font-medium tracking-tight leading-[1.1] mt-8 mb-6 sm:mb-8">
              Ready to Build<br />
              With Total Trust?
            </h2>

            <p className="text-[#1C1C1C] text-base sm:text-lg md:text-xl font-medium max-w-3xl leading-relaxed mb-8 sm:mb-10 px-2 sm:px-0">
              Stop worrying about payments and start focusing on your craft. Join the first platform where your hard work becomes your permanent legacy.
            </p>

            <button className="bg-[#1C1C1C] text-[#3cb44f] px-8 py-3.5 rounded-full text-lg font-medium hover:bg-[#3cb44f] hover:text-black hover:border-bg-[#000] border cursor-pointer transition-colors duration-300">
              Start Your First Contract
            </button>
          </motion.div>

          <motion.div
            style={{ opacity: wormholeOpacity, y: wormholeY }}
            className="relative w-full max-w-5xl mx-auto mt-16 px-4 pointer-events-none pb-12"
          >
            <div className="relative w-full">
              <img
                src="/circularHole.svg"
                alt="Wormhole Grid"
                className="w-full h-auto object-contain"
              />

              {/* The SVG adopts the precise w-full h-full framing with native viewBox mirroring your snippet. 
                Crucially removing preserveAspectRatio enables it to center identically over the grid layer. */}
              <svg
                className="w-full h-full absolute top-0 mix-blend-plus-lighter pointer-events-none overflow-visible"
                viewBox="0 0 508 168"
              >
                <defs>
                  <filter id="ball-glow" x="-100%" y="-100%" width="300%" height="300%">
                    <feDropShadow dx="0" dy="0" stdDeviation="4" floodColor="white" floodOpacity="0.8" />
                  </filter>
                </defs>

                <path
                  id="wormhole-path-visible"
                  d="M507.17 20.5339C508.493 15.9689 393.859 -0.340403 325.67 0.533854C257.481 1.40811 221.56 -1.45657 154.67 10.5339C87.781 22.5243 33.1704 43.0339 33.1704 43.0339L0.67041 86.5339L45.6704 128.034L154.67 156.534L282.67 166.534L397.67 150.034L455.67 122.534L462.67 97.5339C462.67 97.5339 475.769 81.789 451.67 72.0339C427.571 62.2787 413.444 59.8959 387.67 58.5339C358.38 56.0936 341.961 56.3113 312.67 58.5339C282.06 63.6897 269.23 66.662 250.17 72.0339C232.226 77.526 226.257 83.2144 222.17 97.5339L288.67 128.034L294.67 156.534"
                  fill="none" stroke="none"
                />

                <motion.circle
                  cx="0" cy="0" r="6"
                  fill="white"
                  filter="url(#ball-glow)"
                  style={{
                    offsetPath: 'path("M 507.17 20.5339 C 508.493 15.9689 393.859 -0.340403 325.67 0.533854 C 257.481 1.40811 221.56 -1.45657 154.67 10.5339 C 87.781 22.5243 33.1704 43.0339 33.1704 43.0339 L 0.67041 86.5339 L 45.6704 128.034 L 154.67 156.534 L 282.67 166.534 L 397.67 150.034 L 455.67 122.534 L 462.67 97.5339 C 462.67 97.5339 475.769 81.789 451.67 72.0339 C 427.571 62.2787 413.444 59.8959 387.67 58.5339 C 358.38 56.0936 341.961 56.3113 312.67 58.5339 C 282.06 63.6897 269.23 66.662 250.17 72.0339 C 232.226 77.526 226.257 83.2144 222.17 97.5339 L 288.67 128.034 L 294.67 156.534")',
                    offsetDistance,
                    opacity: ballOpacity
                  }}
                />
              </svg>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default CallToAction;
