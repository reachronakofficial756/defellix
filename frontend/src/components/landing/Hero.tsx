import { motion } from 'framer-motion';
import HeroSpiral from './HeroSpiral';
import BetaLaunchLink from './BetaLaunchLink';

const Hero = () => {
  return (
    <section className="relative pt-32 pb-12 lg:pt-48 lg:pb-20 overflow-hidden px-6 bg-gradient-hero">
      {/* Background Orbs */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-accent/10 blur-[120px] rounded-full -z-10" />

      <div className="max-w-7xl mx-auto text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
        >
          <span className="inline-block mb-6 text-sm lg:text-base font-bold tracking-[0.2em] text-slate-500 uppercase">
          Trusted by freelancers across India
          </span>
          <h1 className="text-6xl lg:text-9xl font-black tracking-tight text-white mb-8 leading-[0.85]">
            New Freedom to Build <br />
            <span
              className="relative font-black"
              style={{
                background: "linear-gradient(135deg, rgba(60,180,79,0.9) 0%, rgba(92,184,112,0.57) 48%, rgba(212,237,218,0.54) 85%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
                filter: "drop-shadow(0 0 10px rgba(60,180,79,0.16))",
              }}
            >
              With Trust
            </span>
          </h1>
          <p className="max-w-4xl mx-auto text-base lg:text-lg text-slate-400 mb-12 font-medium leading-relaxed tracking-wide">
          One platform for contracts, payments, and reputation. <br className="hidden lg:block" />
          So you can focus on the work, not the follow-ups.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <BetaLaunchLink variant="hero" />
        </motion.div>

        <HeroSpiral />

      </div>
    </section>
  );
};

export default Hero;
