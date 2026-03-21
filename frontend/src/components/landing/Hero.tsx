import { motion } from 'framer-motion';
import { NavLink } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import HeroSpiral from './HeroSpiral';

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
            Decentralized Contract Protocol
          </span>
          <h1 className="text-6xl lg:text-9xl font-black tracking-tighter text-white mb-8 leading-[0.85]">
            New Freedom to Build <br />
            <span className="text-white">With Trust</span>
          </h1>
          <p className="max-w-4xl mx-auto text-base lg:text-lg text-slate-400 mb-12 font-medium leading-relaxed tracking-wide">
            Immutable smart contracts. No middlemen, no manual tracking. Milestone-locked escrow. <br className="hidden lg:block" />
            Verifiable reputation & 100% payment security, delivered.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="flex flex-col sm:flex-row items-center justify-center gap-6"
        >
          <NavLink
            to="/signup"
            className="group relative px-12 py-5 bg-accent text-black font-bold rounded-full overflow-hidden transition-all hover:scale-105 shadow-[0_0_30px_rgba(60,180,79,0.3)] hover:shadow-[0_0_50px_rgba(60,180,79,0.5)]"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative flex items-center gap-3">
              Get Started<ArrowRight className="w-5 h-5" />
            </span>
          </NavLink>
        </motion.div>

        <HeroSpiral />

      </div>
    </section>
  );
};

export default Hero;
