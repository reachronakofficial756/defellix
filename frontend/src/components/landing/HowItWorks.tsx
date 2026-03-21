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

          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-3xl px-4 sm:px-0">
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
              className={`relative min-h-[380px] p-8 sm:p-10 rounded-[2.5rem] overflow-hidden group transition-transform duration-500 hover:scale-[1.01] ${step.color}`}
            >
              <div className="relative z-10 flex flex-col h-full">
                <p className="text-white/60 font-medium text-lg mb-2">{step.role}</p>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  {step.title}
                </h3>
                <p className="text-white/80 text-base sm:text-lg font-medium leading-relaxed max-w-sm">
                  {step.desc}
                </p>

                <div className="mt-8 sm:mt-auto">
                  <button className="flex items-center gap-2 sm:gap-3 text-white font-bold text-base sm:text-lg group/btn">
                    See the impact
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#fa644d] flex items-center justify-center transition-transform group-hover/btn:translate-x-1 group-hover/btn:scale-110 shrink-0">
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
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
      </div>
    </section>
  );
};

export default HowItWorks;
