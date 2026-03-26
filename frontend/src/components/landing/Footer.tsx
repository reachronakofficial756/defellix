import { Linkedin, Twitter, Facebook, Instagram, Youtube } from 'lucide-react';
import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

void [Linkedin, Twitter, Facebook, Instagram, Youtube];

const Footer = () => {
  const containerRef = useRef<HTMLElement>(null);

  // Create parallax effect: content slides up as the footer enters the viewport
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start end", "end end"]
  });

  // Slide content to create a deep parallax "entry"
  const y = useTransform(scrollYProgress, [0, 1], [200, 0]);

  return (
    <footer
      ref={containerRef}
      className="bg-[#050505] text-white pt-16 pb-8 px-6 border-t border-[#3cb44f]/20 font-sans relative overflow-hidden z-20 -mt-[45vh] h-[45vh] flex flex-col justify-center"
    >
      {/* Subtle Bottom Glow Overlay */}
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-[600px] bg-[#3cb44f]/5 blur-[140px] pointer-events-none rounded-full" />

      <motion.div
        style={{ y }}
        className="max-w-8xl mx-auto relative z-10"
      >
        <div className=" mb-40">

          {/* Slogan & Logo Concept Column */}
          <div className="flex flex-col justify-center items-center">
            <h2 className="text-white text-3xl md:text-5xl lg:text-6xl text-center font-semibold leading-[1.1] mb-8 tracking-tighter">
              {/* The Architecture of <br />
              Professional Proof. */}
            </h2>
            <p className="text-slate-500 text-lg md:text-2xl text-center font-medium leading-relaxed mb-10 mt-24 max-w-md">
              Unlocking the next era of decentralized trust through verifiable infrastructure.
            </p>

            <div className="relative h-64 md:h-80 overflow-hidden flex items-center -ml-12 pointer-events-none">
              <img
                src="/logo.svg"
                alt="Defellix Logo Background"
                className="h-[700%] w-[600%] scale-125"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </footer>
  );
};

export default Footer;
