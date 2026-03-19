import { motion, useScroll, useTransform, useSpring, MotionValue } from 'motion/react';
import { useRef } from 'react';

const cards = [
  {
    title: "Lead the moment, don't chase",
    description: "Instant clarity across CX, compliance, and risk, effortless, actionable, and delivered with confidence.",
    bgColor: "bg-[#7A8A87]",
    dots: [true, false, false, false]
  },
  {
    title: "Smart that makes you smarter",
    description: "See what others miss. Discover opportunities in every conversation and turn them into growth, strategy, and stronger customer connections.",
    bgColor: "bg-[#8D9F9B]",
    dots: [true, true, false, false]
  },
  {
    title: "Ask anything. Seriously.",
    description: "Your data, finally chatable. No noise. No clutter. Just clear, contextual answers, in your language, focused on what counts.",
    bgColor: "bg-[#8FA0A4]", // Bluish-grey representing the 3rd photo design
    dots: [true, true, true, false]
  },
  {
    title: "Complete autonomous action.",
    description: "Drive powerful workflows, automate repetitive tasks, and let clarity become measurable acceleration.",
    bgColor: "bg-[#A1B3B0]", // Greenish representing the 4th card
    dots: [true, true, true, true]
  }
];

// ── Each card is its own component so hooks are called at the component top-level

// Card 0 — visible from start, exits when card 1 arrives (~scroll 0.20–0.25)
function Card0({ prog, card }: { prog: MotionValue<number>; card: typeof cards[0] }) {
  const y  = useTransform(prog, [0.18, 0.25], [0, -32]);
  const sc = useTransform(prog, [0.18, 0.25], [1, 0.92]);
  const op = useTransform(prog, [0.18, 0.25], [1, 0.4]);
  return <CardShell y={y} sc={sc} op={op} zIndex={10} card={card} />;
}

// Card 1 — enters from below (~0.15–0.25), exits when card 2 arrives (~0.45–0.50)
function Card1({ prog, card }: { prog: MotionValue<number>; card: typeof cards[0] }) {
  const y  = useTransform(prog, [0.15, 0.25, 0.45, 0.50], [800, 0, 0, -32]);
  const sc = useTransform(prog, [0.15, 0.25, 0.45, 0.50], [1,   1, 1, 0.92]);
  const op = useTransform(prog, [0.15, 0.25, 0.45, 0.50], [1,   1, 1, 0.4]);
  return <CardShell y={y} sc={sc} op={op} zIndex={11} card={card} />;
}

// Card 2 — enters from below (~0.40–0.50), exits when card 3 arrives (~0.70–0.75)
function Card2({ prog, card }: { prog: MotionValue<number>; card: typeof cards[0] }) {
  const y  = useTransform(prog, [0.40, 0.50, 0.70, 0.75], [800, 0, 0, -32]);
  const sc = useTransform(prog, [0.40, 0.50, 0.70, 0.75], [1,   1, 1, 0.92]);
  const op = useTransform(prog, [0.40, 0.50, 0.70, 0.75], [1,   1, 1, 0.4]);
  return <CardShell y={y} sc={sc} op={op} zIndex={12} card={card} />;
}

// Card 3 — enters from below (~0.65–0.75), stays forever
function Card3({ prog, card }: { prog: MotionValue<number>; card: typeof cards[0] }) {
  const y  = useTransform(prog, [0.65, 0.75], [800, 0]);
  const sc = useTransform(prog, [0.65, 0.75], [1,   1]);
  const op = useTransform(prog, [0.65, 0.75], [1,   1]);
  return <CardShell y={y} sc={sc} op={op} zIndex={13} card={card} />;
}

// ── Shared card shell (no hooks here — just rendering)
function CardShell({ y, sc, op, zIndex, card }: {
  y: MotionValue<number>;
  sc: MotionValue<number>;
  op: MotionValue<number>;
  zIndex: number;
  card: typeof cards[0];
}) {
  return (
    <motion.div
      style={{ y, scale: sc, opacity: op, zIndex }}
      className={`absolute inset-0 flex flex-col justify-start p-10 rounded-[3rem] shadow-2xl ${card.bgColor} backdrop-blur-3xl border border-white/10`}
    >
      {/* 2×2 dot grid */}
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

      <div
        className="absolute inset-0 rounded-[3rem] opacity-[0.03] pointer-events-none mix-blend-overlay"
        style={{ backgroundImage: 'url("https://grainy-gradients.vercel.app/noise.svg")' }}
      />
    </motion.div>
  );
}

// ── Main section ──────────────────────────────────────────────────────────────
const ScrollingCards = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // One shared spring — no springs inside loops
  const prog = useSpring(scrollYProgress, { stiffness: 200, damping: 52, mass: 0.25 });

  return (
    <section ref={containerRef} className="relative h-[500vh] bg-primary/30 py-24 px-6 lg:px-12">
      <div className="sticky top-0 min-h-screen lg:h-screen flex flex-col lg:flex-row items-center justify-between max-w-7xl mx-auto py-12 overflow-visible lg:overflow-hidden">

        {/* Left */}
        <div className="w-full lg:w-1/2 mb-12 lg:mb-0 pr-0 lg:pr-24">
          <p className="text-slate-500 text-sm font-semibold mb-8 uppercase tracking-widest">
            The Architecture of Autonomous CX
          </p>
          <h2 className="text-5xl lg:text-[72px] font-bold text-white mb-10 leading-[1.1] tracking-tight">
            Built for What's Next.<br />Already.
          </h2>
          <p className="text-slate-400 text-xl max-w-lg leading-relaxed font-medium">
            Purpose-built intelligence for CX teams who need clarity, not just dashboards.
          </p>
        </div>

        {/* Right — card stack */}
        <div className="w-full lg:w-2/5 h-[440px] lg:h-[540px] min-h-[400px] relative mt-12 lg:mt-0">
          {/* Each card is a proper component — hooks are at each component's top level */}
          <Card0 prog={prog} card={cards[0]} />
          <Card1 prog={prog} card={cards[1]} />
          <Card2 prog={prog} card={cards[2]} />
          <Card3 prog={prog} card={cards[3]} />
        </div>

      </div>
    </section>
  );
};

export default ScrollingCards;
