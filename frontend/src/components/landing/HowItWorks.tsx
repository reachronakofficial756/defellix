import { motion } from 'framer-motion';
import Customer from '@/assets/customer.webp'
import Compliance from '@/assets/compliance.webp'
import Operations from '@/assets/operations.webp'
import Sales from '@/assets/sales.webp'

const HowItWorks = () => {
  const steps = [
    {
      role: "Identity Extraction",
      title: "Initialize Your Profile",
      desc: "Secure your professional identity by connecting your history to a verifiable node, proving your expertise once and for all.",
      color: "bg-[#0b120c]", // Extremely Dark Green
      accent: "text-[#3cb44f]/40",
      visualBox: "bottom-[-10%] right-[-5%]",
      image: Customer
    },
    {
      role: "Contract Engineering",
      title: "Hard-Code the Trust",
      desc: "Generate immutable agreements where milestones are enforced by code, ensuring total alignment before a single line is delivered.",
      color: "bg-[#111f14]", // Deep Dark Green
      accent: "text-[#3cb44f]/50",
      visualBox: "bottom-[-10%] right-[-5%]",
      image: Sales
    },
    {
      role: "Payment Protocol",
      title: "Automated Settlement",
      desc: "Funds are secured in decentralized escrow and released instantly upon milestone approval—no more manual follow-ups.",
      color: "bg-[#1a2e1d]", // Dark Forest Green
      accent: "text-[#3cb44f]/60",
      visualBox: "bottom-[-10%] right-[-5%]",
      image: Operations
    },
    {
      role: "Evidence Synthesis",
      title: "Synthesize the Evidence",
      desc: "Every successful delivery updates your global credibility score. Turn your track record into a permanent, professional legacy.",
      color: "bg-[#254228]", // Muted Professional Green
      accent: "text-[#3cb44f]/70",
      visualBox: "bottom-[-10%] right-[-5%]",
      image: Compliance
    }
  ];

  return (
    <section className="pt-12 pb-32 px-6 bg-[#000] overflow-hidden">
      <div className="max-w-[100%] mx-20">


        <div className="mb-24 text-center flex flex-col items-center">

          <h2 className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.05] max-w-4xl px-4 sm:px-0">
            <span className="text-white">How Defellix </span>
            <span className="bg-gradient-to-r from-green-400 to-[#3cb44f] bg-clip-text text-transparent">
              Multiplies Your Trust
            </span>
          </h2>

          <p className="mt-6 text-slate-400 text-lg md:text-xl max-w-2xl font-medium leading-relaxed">
            From the first signature to the final settlement, Defellix automates the proof-of-value that traditional platforms ignore.
          </p>

          {/* subtle divider */}
          <div className="mt-8 h-[2px] w-20 bg-gradient-to-r from-[#3cb44f]/0 via-[#3cb44f] to-[#3cb44f]/0 rounded-full" />

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
              className={`relative min-h-[380px] p-8 sm:p-10 rounded-[2.5rem] overflow-hidden group border border-white/5 transition-transform duration-500 hover:scale-[1.01] ${step.color}`}
            >
              <div className="relative z-10 flex flex-col h-full">
                <p className={`${step.accent} font-bold text-sm tracking-widest uppercase mb-4`}>{step.role}</p>
                <h3 className="text-3xl md:text-4xl font-bold text-white mb-6">
                  {step.title}
                </h3>
                <p className="text-slate-400 text-base sm:text-lg font-medium leading-relaxed max-w-sm">
                  {step.desc}
                </p>

                {/* <div className="mt-8 sm:mt-auto">
                  <button
                    onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                    aria-label={`Learn more about ${step.title}`}
                    className="flex items-center gap-2 sm:gap-3 text-white font-bold text-base sm:text-lg group/btn hover:text-[#3cb44f] transition-colors"
                  >
                    See the impact
                    <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#3cb44f] flex items-center justify-center transition-transform group-hover/btn:translate-x-1 group-hover/btn:scale-110 shrink-0">
                      <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 text-black" />
                    </div>
                  </button>
                </div> */}
              </div>

              {/* Decorative wireframe icons (matching the image) */}
              <div className={`absolute ${step.visualBox} opacity-20 group-hover:opacity-40 transition-opacity duration-700 pointer-events-none`}>
                <img src={step.image} alt="How it works" className="w-56 h-56 mr-14 mb-14 object-cover" />
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
