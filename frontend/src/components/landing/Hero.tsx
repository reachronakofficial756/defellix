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
          <span className="inline-block px-4 py-1.5 mb-6 text-[10px] font-bold tracking-[0.25em] text-accent uppercase bg-accent/10 border border-accent/20 rounded-full">
            Immutable Trust for Premium Freelancers
          </span>
          <h1 className="text-5xl lg:text-8xl font-black tracking-tighter text-white mb-8 leading-[0.9]">
            Freelance without the friction. <br />
            <span className="text-gradient-accent">
              Get paid without the chase.
            </span>
          </h1>
          <p className="max-w-3xl mx-auto text-lg lg:text-2xl text-slate-400 mb-12 font-medium leading-relaxed">
            Secure your projects with decentralized contracts, automated milestones, and verifiable credibility scores. Retention, protection, and reputation—all in one place.
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
            className="group relative px-10 py-5 bg-accent text-primary font-bold rounded-2xl overflow-hidden transition-all hover:scale-105 shadow-[0_0_30px_rgba(34,197,94,0.4)] hover:shadow-[0_0_50px_rgba(34,197,94,0.6)]"
          >
            <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300" />
            <span className="relative flex items-center gap-3 text-primary">
              Start<ArrowRight className="w-5 h-5 text-primary" />
            </span>
          </NavLink>
        </motion.div>

        <HeroSpiral />

      </div>
    </section>
  );
};

export default Hero;
