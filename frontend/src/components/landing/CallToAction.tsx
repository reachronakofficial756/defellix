import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { useRef } from 'react';

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
  const smoothDistance = useSpring(scrollYProgress, { damping: 40, stiffness: 120, mass: 0.5 });
  const offsetDistance = useTransform(smoothDistance, v => `${v * 100}%`);

  // Slowly disappear as requested starting at exactly 87.6824% dropping reliably to 0 at 91.4731%
  const ballOpacity = useTransform(
    smoothDistance,
    [0, 0.876824, 0.914731, 1],
    [1, 1, 0, 0]
  );

  return (
    <section ref={containerRef} className="relative w-full bg-[#DE6D55] h-[300vh]">
      {/* sticky layer locks the view strictly in place for the full 300vh duration */}
      <div className="sticky top-0 w-full h-screen flex flex-col items-center overflow-hidden pt-16 pb-20 justify-center">

        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 50 }}
          whileInView={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          viewport={{ once: false, amount: 0.3 }}
          className="w-full max-w-5xl mx-auto flex flex-col items-center text-center px-4 relative z-10 flex-grow justify-center"
        >
          <h2 className="text-[#1C1C1C] text-4xl sm:text-5xl md:text-[4.5rem] font-medium tracking-tight leading-[1.1] mt-8 mb-6 sm:mb-8">
            Built to fit today.<br />
            Ready for tomorrow
          </h2>

          <p className="text-[#1C1C1C] text-base sm:text-lg md:text-xl font-medium max-w-3xl leading-relaxed mb-8 sm:mb-10 px-2 sm:px-0">
            Turn every call into strategy, and get all the capabilities<br className="hidden md:block" />
            to manage it with confidence.
          </p>

          <button className="bg-[#9CA49C] text-[#1C1C1C] px-8 py-3.5 rounded-full text-lg font-medium hover:bg-[#8B938B] transition-colors duration-300">
            Get Started
          </button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          viewport={{ once: false, amount: 0.3 }}
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
      </div>
    </section>
  );
};

export default CallToAction;
