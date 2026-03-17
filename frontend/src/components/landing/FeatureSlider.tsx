import { motion, useScroll, useTransform, useSpring, MotionValue } from 'motion/react';
import { useRef } from 'react';

// ── Slide Data ─────────────────────────────────────────────────────────────────
const slides = [
  {
    bg: '#567573',
    title: 'Performance,\nperfected',
    description:
      'Turn every call into a growth opportunity. Automated reviews, objective and contextual perspective, personalized guidance and coaching that helps every agent constantly improve.'
  },
  {
    bg: '#D4574B',
    title: 'Compliance & QA\nthat keeps up',
    description:
      'Zero blind spots. 100% interaction coverage. Real-time detection and alerts that protect performance and reputation.'
  },
  {
    bg: '#C38DC9',
    title: 'All Signals.\nOne System.',
    description:
      'One platform. Every signal connected. From staffing to strategy, Hear brings data, people, and action together, effortlessly.'
  }
];

// Hold zones: 0–28% slide0 | 28–40% glide | 40–60% slide1 | 60–72% glide | 72–100% slide2
const OP0 = { i: [0, 0,    0.28, 0.40, 1],             o: [1, 1, 1, 0,    0] };
const OP1 = { i: [0, 0.28, 0.40, 0.60, 0.72, 1],       o: [0, 0, 1, 1,    0, 0] };
const OP2 = { i: [0, 0.60, 0.72, 1,   1],              o: [0, 0, 1, 1,    1] };
const BG_I = [0,    0.28, 0.40,       0.60,       0.72,       1];
const BG_O = [slides[0].bg, slides[0].bg, slides[1].bg, slides[1].bg, slides[2].bg, slides[2].bg];

// ── SVGs ───────────────────────────────────────────────────────────────────────
function SVG0() {
  return (
    <svg viewBox="0 0 300 310" width="260" height="260" fill="none">
      <defs>
        <filter id="gP"><feTurbulence type="fractalNoise" baseFrequency="0.72" numOctaves="4" stitchTiles="stitch" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.55 0" result="m"/><feComposite in="m" in2="SourceGraphic" operator="in"/></filter>
        <clipPath id="cc"><polygon points="150,18 242,295 58,295"/></clipPath>
      </defs>
      <polygon points="150,18 242,295 58,295" fill="rgba(0,0,0,0.28)"/>
      <rect x="0" y="0" width="300" height="310" fill="rgba(255,255,255,0.18)" filter="url(#gP)" clipPath="url(#cc)"/>
      <motion.ellipse cx="150" cy="128" rx="76" ry="17" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" animate={{rx:[74,80,74]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut'}}/>
      <motion.ellipse cx="150" cy="192" rx="96" ry="21" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" animate={{rx:[93,100,93]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut',delay:0.4}}/>
      <motion.ellipse cx="150" cy="252" rx="108" ry="24" stroke="rgba(255,255,255,0.85)" strokeWidth="1.2" animate={{rx:[105,113,105]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut',delay:0.8}}/>
    </svg>
  );
}
function SVG1() {
  return (
    <svg viewBox="0 0 300 300" width="250" height="250" fill="none">
      {[0,36,72,108,144].map(a=><ellipse key={a} cx="150" cy="150" rx="52" ry="118" stroke="rgba(255,255,255,0.65)" strokeWidth="1" transform={`rotate(${a},150,150)`}/>)}
      <motion.circle r="5.5" fill="#5B9CF6" animate={{cx:[100,150,200,150,100],cy:[150,32,150,268,150]}} transition={{duration:3.5,repeat:Infinity,ease:'easeInOut'}}/>
      <motion.circle r="4.5" fill="#4FD1A0" animate={{cx:[200,150,100,150,200],cy:[150,268,150,32,150]}} transition={{duration:3.5,repeat:Infinity,ease:'easeInOut',delay:1.75}}/>
    </svg>
  );
}
function SVG2() {
  return (
    <svg viewBox="0 0 300 300" width="250" height="250" fill="none">
      <motion.circle cx="118" cy="150" r="88" stroke="rgba(255,255,255,0.80)" strokeWidth="1.3" animate={{r:[86,92,86]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut'}}/>
      <motion.circle cx="175" cy="148" r="88" stroke="rgba(255,255,255,0.80)" strokeWidth="1.3" animate={{r:[86,92,86]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut',delay:0.5}}/>
      <motion.circle cx="146" cy="116" r="72" stroke="rgba(255,255,255,0.55)" strokeWidth="1" animate={{r:[70,76,70]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut',delay:1}}/>
      <motion.circle cx="146" cy="182" r="58" stroke="rgba(255,255,255,0.40)" strokeWidth="1" animate={{r:[56,62,56]}} transition={{duration:4,repeat:Infinity,ease:'easeInOut',delay:1.5}}/>
    </svg>
  );
}

// ── Per-slide components — hooks called at top level, never in loops ───────────
function SvgLayer({ op, prog, children }: { op: typeof OP0; prog: MotionValue<number>; children: React.ReactNode }) {
  const opacity = useTransform(prog, op.i, op.o);
  return (
    <motion.div style={{
      opacity,
      position: 'absolute',
      top: 0, right: 0, bottom: 0, left: 0,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      {children}
    </motion.div>
  );
}

// Text layer
function TextLayer({ op, prog, title, description }: { op: typeof OP0; prog: MotionValue<number>; title: string; description: string }) {
  const opacity = useTransform(prog, op.i, op.o);
  const y       = useTransform(prog, op.i, op.o.map(v => (v === 0 ? 20 : 0)));
  return (
    <motion.div style={{ opacity, y, position: 'absolute', top: 0, left: 0, right: 0 }}>
      <h2 className="text-4xl lg:text-5xl font-bold text-slate-800 mb-7 leading-tight tracking-tight" style={{ whiteSpace: 'pre-line' }}>
        {title}
      </h2>
      <p className="text-slate-700 text-base leading-relaxed">{description}</p>
    </motion.div>
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
const FeatureSlider = () => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ['start start', 'end end'] });

  // ONE spring at the top — drives all children via prop, no hooks in loops
  const prog = useSpring(scrollYProgress, { stiffness: 220, damping: 58, mass: 0.25 });

  // Background — computed here (top level), not in a loop
  const bg = useTransform(prog, BG_I, BG_O);

  return (
    <section ref={ref} className="relative h-[450vh]">
      <div className="sticky top-0 h-screen w-full flex overflow-hidden">

        {/* LEFT — coloured bg + SVG layers, overflow:hidden clips layers cleanly */}
        <motion.div style={{ backgroundColor: bg }} className="w-1/2 h-full relative overflow-hidden">
          <SvgLayer op={OP0} prog={prog}><SVG0 /></SvgLayer>
          <SvgLayer op={OP1} prog={prog}><SVG1 /></SvgLayer>
          <SvgLayer op={OP2} prog={prog}><SVG2 /></SvgLayer>
        </motion.div>

        {/* RIGHT — grey bg + text layers */}
        <div className="w-1/2 h-full relative" style={{ backgroundColor: '#8B9E99' }}>
          <div className="absolute inset-0 flex items-center px-12 lg:px-20">
            {/* Fixed height + overflow:hidden ensures all 3 absolute text layers are clipped to the same box */}
            <div className="relative w-full max-w-md" style={{ height: 320, overflow: 'hidden' }}>
              <TextLayer op={OP0} prog={prog} title={slides[0].title} description={slides[0].description} />
              <TextLayer op={OP1} prog={prog} title={slides[1].title} description={slides[1].description} />
              <TextLayer op={OP2} prog={prog} title={slides[2].title} description={slides[2].description} />
            </div>
          </div>
        </div>

      </div>
    </section>
  );
};

export default FeatureSlider;
