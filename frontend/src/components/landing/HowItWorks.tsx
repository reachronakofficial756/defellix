import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const HowItWorks = () => {
  const steps = [
    {
      role: "User Onboarding",
      title: "Create Profile",
      desc: "Set up your professional identity in seconds. Link your portfolio and let our AI highlight your best work history.",
      color: "bg-[#2d3a44]", // Muted Dark Slate/Teal
      accent: "text-[#4a5f6b]",
      visualBox: "bottom-[-10%] right-[-5%]"
    },
    {
      role: "Contract Engineering",
      title: "Build Contracts",
      desc: "Draft immutable agreements with zero legal jargon. Define milestones and deliverables that our smart contracts enforce.",
      color: "bg-[#7ba392]", // Muted Seafoam Green
      accent: "text-[#5e8272]",
      visualBox: "bottom-[-10%] right-[-5%]"
    },
    {
      role: "Financial Flow",
      title: "Get Paid",
      desc: "Funds are held in a secure, audited escrow. Once milestones are approved, payout is released instantly without delays.",
      color: "bg-[#7a8da3]", // Muted Blueish
      accent: "text-[#5b6a7a]",
      visualBox: "bottom-[-10%] right-[-5%]"
    },
    {
      role: "Reputation Engine",
      title: "Earn Credibility",
      desc: "Every successful project boosts your on-chain Credibility Score, making it easier to land high-value premium clients.",
      color: "bg-[#9d84a3]", // Muted Purple/Pink
      accent: "text-[#76637a]",
      visualBox: "bottom-[-10%] right-[-5%]"
    }
  ];

  return (
    <section className="pt-12 pb-32 px-6 bg-[#04070B] overflow-hidden">
      <div className="max-w-[1400px] mx-auto">

       
        <div className="mb-24 text-center flex flex-col items-center">

          <h2 className="text-2xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-3xl">
            <span className="text-white">How </span>
            <span className="bg-gradient-to-r from-green-400 to-green-600 bg-clip-text text-transparent">
              Defellix Works
            </span>
          </h2>

          <p className="mt-6 text-slate-400 text-lg md:text-xl max-w-xl font-medium leading-relaxed">
            Create contracts, secure payments, and build your reputation — all in one seamless flow.
          </p>

          {/* subtle divider */}
          <div className="mt-8 h-[2px] w-20 bg-gradient-to-r from-green-500/0 via-green-500 to-green-500/0 rounded-full" />

        </div>
        {/* 4-Card Grid matching the image layout */}
        <div className="grid md:grid-cols-2 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: i * 0.1, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={`relative h-[380px] p-10 rounded-[2.5rem] overflow-hidden group transition-transform duration-500 hover:scale-[1.01] ${step.color}`}
            >
              <div className="relative z-10 flex flex-col h-full">
                <p className="text-white/60 font-medium text-lg mb-2">{step.role}</p>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  {step.title}
                </h3>
                <p className="text-white/80 text-lg font-medium leading-relaxed max-w-sm">
                  {step.desc}
                </p>

                <div className="mt-auto">
                  <button className="flex items-center gap-3 text-white font-bold text-lg group/btn">
                    See the impact
                    <div className="w-10 h-10 rounded-full bg-[#fa644d] flex items-center justify-center transition-transform group-hover/btn:translate-x-1 group-hover/btn:scale-110">
                      <ArrowRight className="w-5 h-5" />
                    </div>
                  </button>
                </div>
              </div>

              {/* Decorative wireframe icons (matching the image) */}
              <div className={`absolute ${step.visualBox} opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none`}>
                <svg width="240" height="240" viewBox="0 0 200 200">
                  <defs>
                    <filter id={`glow-${i}`}>
                      <feGaussianBlur stdDeviation="2" result="blur" />
                      <feComposite in="SourceGraphic" in2="blur" operator="over" />
                    </filter>
                  </defs>
                  {[1, 2, 3, 4, 5, 6].map((j) => (
                    <circle
                      key={j}
                      cx="100"
                      cy="100"
                      r={40 + j * 12}
                      fill="none"
                      stroke="white"
                      strokeWidth="1.5"
                      opacity={0.1 + j * 0.1}
                      style={{
                        strokeDasharray: j % 2 === 0 ? "4 8" : "none",
                        transformOrigin: "center",
                        animation: i % 2 === 0 ? `spin ${10 + j * 2}s linear infinite` : `spin-reverse ${12 + j * 2}s linear infinite`
                      }}
                    />
                  ))}
                  <circle cx="100" cy="100" r="30" fill="white" opacity="0.1" />
                </svg>
              </div>
            </motion.div>
          ))}
        </div>
        {/* Interactive Escrow Visualizer - "The Trust Protocol" */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          className="mt-32 p-8 md:p-16 rounded-[3rem] bg-secondary/20 border border-white/5 backdrop-blur-3xl relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-right from-transparent via-accent/30 to-transparent" />

          <div className="grid lg:grid-cols-2 gap-16 items-center relative z-10">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/20 text-[10px] font-black text-accent uppercase tracking-widest mb-6">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                Live Escrow Protocol
              </div>
              <h3 className="text-4xl font-black text-white mb-6 leading-tight">
                Demystifying the <br />
                <span className="text-gradient-accent text-5xl">Smart Contract</span>
              </h3>
              <p className="text-slate-400 text-lg font-medium leading-relaxed mb-8">
                On Defellix, the code is the arbitrator. No more "I'll pay you next week." Funds are locked in a neutral vault and released only when deliverables meet the agreed-upon criteria.
              </p>
              <div className="space-y-4">
                {[
                  { t: "Transparent Verification", d: "On-chain proof of every milestone." },
                  { t: "Immutable Agreements", d: "Terms cannot be changed once funded." },
                  { t: "Automated Payouts", d: "Zero wait time after approval." }
                ].map((item, i) => (
                  <div key={i} className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors">
                    <div className="w-6 h-6 rounded-full bg-accent/20 flex items-center justify-center text-accent flex-shrink-0">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent" />
                    </div>
                    <div>
                      <h4 className="text-white font-bold text-sm tracking-tight">{item.t}</h4>
                      <p className="text-slate-500 text-xs font-medium">{item.d}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Visual Representation of Flow */}
            <div className="relative h-[400px] flex items-center justify-center">
              {/* Client Node */}
              <motion.div
                animate={{ y: [-10, 10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                className="absolute left-0 w-24 h-24 rounded-3xl bg-secondary border border-white/10 flex flex-col items-center justify-center p-4 shadow-2xl"
              >
                <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center mb-2">
                  <div className="w-4 h-4 bg-blue-400 rounded-sm" />
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase">Client</span>
              </motion.div>

              {/* Escrow Vault (Center) */}
              <div className="relative z-20">
                <motion.div
                  animate={{ scale: [1, 1.05, 1] }}
                  transition={{ duration: 3, repeat: Infinity }}
                  className="w-40 h-40 rounded-[2.5rem] bg-accent/10 border-2 border-accent/40 flex items-center justify-center relative shadow-[0_0_50px_rgba(34,197,94,0.15)] backdrop-blur-xl"
                >
                  <div className="absolute inset-4 rounded-[2rem] border border-accent/20 flex items-center justify-center">
                    <div className="text-accent flex flex-col items-center">
                      <div className="w-12 h-1 bg-accent/30 rounded-full mb-3 overflow-hidden">
                        <motion.div
                          animate={{ x: [-40, 40] }}
                          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                          className="w-10 h-full bg-accent"
                        />
                      </div>
                      <span className="text-xs font-black uppercase tracking-widest italic">Vault Locked</span>
                    </div>
                  </div>
                </motion.div>

                {/* Flow Particles */}
                <motion.div
                  animate={{
                    x: [-150, 0],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeIn" }}
                  className="absolute top-1/2 left-0 w-4 h-4 bg-blue-400 blur-sm rounded-full"
                />
                <motion.div
                  animate={{
                    x: [0, 150],
                    opacity: [0, 1, 0]
                  }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeOut", delay: 2 }}
                  className="absolute top-1/2 left-1/2 w-4 h-4 bg-accent blur-sm rounded-full"
                />
              </div>

              {/* Freelancer Node */}
              <motion.div
                animate={{ y: [10, -10] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute right-0 w-24 h-24 rounded-3xl bg-secondary border border-white/10 flex flex-col items-center justify-center p-4 shadow-2xl"
              >
                <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center mb-2">
                  <div className="w-4 h-4 bg-accent rounded-sm" />
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase">Freelancer</span>
              </motion.div>

              {/* Connecting Lines */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-[80%] h-px bg-gradient-to-r from-blue-500/20 via-accent/50 to-accent/20" />
              </div>
            </div>
          </div>
        </motion.div>
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          from { transform: rotate(360deg); }
          to { transform: rotate(0deg); }
        }
      `}</style>
    </section>
  );
};

export default HowItWorks;
