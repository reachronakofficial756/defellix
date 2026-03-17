import { motion, useScroll, useTransform } from 'motion/react';
import { useRef } from 'react';

const cards = [
  {
    title: "Lead the moment, don't chase",
    description: "Instant clarity across CX, compliance, and risk, effortless, actionable, and delivered with confidence.",
    bgColor: "bg-[#7A8A87]",
    dots: [true, false, false, false] // top-left only
  },
  {
    title: "Smart that makes you smarter",
    description: "See what others miss. Discover opportunities in every conversation and turn them into growth, strategy, and stronger customer connections.",
    bgColor: "bg-[#8D9F9B]",
    dots: [true, true, false, false] // both top
  },
  {
    title: "Ask anything. Seriously.",
    description: "Your data, finally chatable. No noise. No clutter. Just clear, contextual answers, in your language, focused on what counts.",
    bgColor: "bg-[#A1B3B0]",
    dots: [true, true, false, false]
  },
  {
    title: "Actionable Insights in Real-Time",
    description: "Empower your team with autonomous intelligence that doesn't just surface problems but suggests and implements solutions instantly.",
    bgColor: "bg-[#B4C7C3]",
    dots: [true, true, true, true]
  }
];

const ScrollingCards = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"]
  });

  return (
    <section ref={containerRef} className="relative h-[400vh] bg-primary/30 py-24 px-6 lg:px-12">
      <div className="sticky top-0 h-screen flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto py-12">
        
        {/* Left Content */}
        <div className="w-full lg:w-1/2 mb-12 lg:mb-0 pr-0 lg:pr-24">
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8 }}
            className="text-slate-500 text-sm font-semibold mb-8 uppercase tracking-widest"
          >
            The Architecture of Autonomous CX
          </motion.p>
          <motion.h2 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="text-5xl lg:text-[72px] font-bold text-white mb-10 leading-[1.1] tracking-tight"
          >
            Built for What's Next. <br />
            Already.
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="text-slate-400 text-xl max-w-lg leading-relaxed font-medium"
          >
            Purpose-built intelligence for CX teams who need clarity, not just dashboards.
          </motion.p>
        </div>

        {/* Right Content - Cards Container */}
        <div className="w-full lg:w-2/5 h-[600px] relative">
          {cards.map((card, index) => {
            // Animating each card based on scroll
            // Cards appear at 0, 0.25, 0.5, 0.75
            const start = index * 0.25;
            const end = (index + 1) * 0.25;
            
            // This transforms the main entrance
            const y = useTransform(scrollYProgress, 
                [start - 0.1, start], 
                [500, 0]
            );
            const scale = useTransform(scrollYProgress, 
                [start - 0.1, start], 
                [0.8, 1]
            );
            const opacity = useTransform(scrollYProgress, 
                [start - 0.1, start], 
                [0, 1]
            );

            // This transforms when it goes behind the NEXT card
            const behindScale = useTransform(scrollYProgress, 
                [end - 0.05, end], 
                [1, 0.9]
            );
            const behindY = useTransform(scrollYProgress, 
                [end - 0.05, end], 
                [0, -40]
            );
            const behindOpacity = useTransform(scrollYProgress, 
                [end - 0.05, end], 
                [1, 0.3]
            );

            return (
              <motion.div
                key={index}
                style={{
                  y: index === 0 ? behindY : y,
                  scale: index === 0 ? behindScale : scale,
                  opacity: index === 0 ? behindOpacity : opacity,
                  zIndex: index + 10,
                }}
                className={`absolute inset-0 flex flex-col justify-start p-10 rounded-[3rem] shadow-2xl ${card.bgColor} backdrop-blur-3xl border border-white/10`}
              >
                {/* Dots Icon - 2x2 Grid */}
                <div className="mb-10 flex flex-col gap-1.5 w-max">
                  <div className="flex gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded-full ${card.dots[0] ? 'bg-[#FF5C5C]' : 'bg-black/10'}`} />
                    <div className={`w-3.5 h-3.5 rounded-full ${card.dots[1] ? 'bg-[#FF5C5C]' : 'bg-black/10'}`} />
                  </div>
                  <div className="flex gap-1.5">
                    <div className={`w-3.5 h-3.5 rounded-full ${card.dots[2] ? 'bg-[#FF5C5C]' : 'bg-black/10'}`} />
                    <div className={`w-3.5 h-3.5 rounded-full ${card.dots[3] ? 'bg-[#FF5C5C]' : 'bg-black/10'}`} />
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-[38px] font-bold text-slate-900 mb-8 leading-[1.2] tracking-tight">
                    {card.title}
                  </h3>
                  <p className="text-slate-800 text-xl font-medium leading-relaxed opacity-80 max-w-sm">
                    {card.description}
                  </p>
                </div>
                
                {/* Subtle Grain Overlay */}
                <div className="absolute inset-0 rounded-[3rem] opacity-[0.03] pointer-events-none mix-blend-overlay"
                   style={{backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")'}}
                />
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};


export default ScrollingCards;
