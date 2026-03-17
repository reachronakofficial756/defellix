import { motion, useScroll, useTransform, useSpring, MotionValue } from 'motion/react';
import { useRef, useState, useEffect } from 'react';

// ─── data ─────────────────────────────────────────────────────────────────────
const testimonials = [
  {
    id: 1,
    quote:
      '"What we love most about Hear is how easy it is to use. Everything we need is right there. We can instantly see what customers are calling about, how our team is performing, and where we can improve."',
    author: 'Andreea Soleriu',
    role: 'Call Center Director at MEDICALCOR',
    avatar: 'https://i.pravatar.cc/150?u=andreea'
  },
  {
    id: 2,
    quote:
      '"Hear has been a transformative partner for Shift, revolutionizing how we manage customer interactions. What was once a manual, time-consuming process is now automated, accurate, and insight-driven."',
    author: 'Yuval Danin',
    role: 'CEO at Shift',
    avatar: 'https://i.pravatar.cc/150?u=yuval'
  },
  {
    id: 3,
    quote:
      '"Hear has been a game-changer for our team and QA process. The support has been outstanding, and the platform truly met our exact requirements. We highly recommend Hear to anyone looking to enhance efficiency and insight in customer operations."',
    author: "Ben O'Donnell",
    role: 'Head of Customer Service at CROCUS',
    avatar: 'https://i.pravatar.cc/150?u=ben'
  }
];

// ─── layout constants ──────────────────────────────────────────────────────────
const SLOT      = 50;   // vh per testimonial
const INIT_TOP  = 25;   // vh — item-0 centre at INIT_TOP + SLOT/2 = 50vh

// Section is 500vh — each hold zone ≈ 125vh so user clearly feels the stop.
// Hold zones:  0–27% T1  |  27–42% glide  |  42–58% T2  |  58–73% glide  |  73–100% T3
const Y_IN  = [0,    0.27, 0.42,          0.58,          0.73,          1];
const Y_OUT = ['0vh','0vh',`-${SLOT}vh`,`-${SLOT}vh`,`-${SLOT*2}vh`,`-${SLOT*2}vh`];

// Midpoints of each hold zone (for button navigation)
const ANCHOR_PCTS = [0.135, 0.50, 0.865];

// Opacity per testimonial (aligned with hold zones)
const OP: Array<{ i: number[], o: number[] }> = [
  { i: [0, 0,    0.27, 0.42, 1],             o: [1, 1, 1, 0.12, 0.12] },
  { i: [0, 0.27, 0.42, 0.58, 0.73, 1],       o: [0.12, 0.12, 1, 1, 0.12, 0.12] },
  { i: [0, 0.58, 0.73, 1, 1],                o: [0.12, 0.12, 1, 1, 1] }
];

// ─── testimonial card ──────────────────────────────────────────────────────────
function Card({ t, idx, prog }: { t: typeof testimonials[0]; idx: number; prog: MotionValue<number> }) {
  const opacity = useTransform(prog, OP[idx].i, OP[idx].o);
  return (
    <motion.div style={{ opacity, height: `${SLOT}vh`, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <p className="text-white text-[22px] md:text-[26px] leading-[1.55] font-normal tracking-tight mb-7">
        {t.quote}
      </p>
      <div className="flex items-center gap-4">
        <div className="w-10 h-10 rounded-full overflow-hidden grayscale shrink-0 border border-white/10">
          <img src={t.avatar} alt={t.author} className="w-full h-full object-cover" />
        </div>
        <div>
          <p className="text-white text-[15px] font-semibold leading-none">{t.author}</p>
          <p className="text-white/40 text-sm font-normal mt-1.5">{t.role}</p>
        </div>
      </div>
    </motion.div>
  );
}

// ─── main ──────────────────────────────────────────────────────────────────────
export default function ScrollTestimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);

  // Invisible anchor divs at exact hold-midpoint positions within the section.
  // scrollIntoView on these is the most reliable cross-browser scroll trigger.
  const anchors = [
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null),
    useRef<HTMLDivElement>(null)
  ];

  const scrollToIndex = (idx: number) => {
    anchors[idx].current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  // Track active index from scroll
  const { scrollYProgress } = useScroll({ target: sectionRef, offset: ['start start', 'end end'] });

  const [active, setActive] = useState(0);
  useEffect(() =>
    scrollYProgress.on('change', (v) => {
      const i = v < 0.30 ? 0 : v < 0.70 ? 1 : 2;
      setActive((p) => p !== i ? i : p);
    }),
    [scrollYProgress]
  );

  // Stack motion — tight spring for decisive snap
  const rawY   = useTransform(scrollYProgress, Y_IN, Y_OUT);
  const stackY = useSpring(rawY, { stiffness: 280, damping: 60, mass: 0.3 });
  const smooth = useSpring(scrollYProgress, { stiffness: 200, damping: 52, mass: 0.25 });

  return (
    <section ref={sectionRef} className="relative h-[500vh]" style={{ background: '#0D0D0D' }}>

      {/* ── Invisible scroll anchors positioned at each hold midpoint ── */}
      {ANCHOR_PCTS.map((pct, i) => (
        <div key={i} ref={anchors[i]} style={{ position: 'absolute', top: `${pct * 100}%`, left: 0 }} />
      ))}

      {/* ── Sticky viewport ── */}
      <div className="sticky top-0 h-screen flex">

        {/* LEFT: heading + nav buttons */}
        <div
          className="flex flex-col justify-between shrink-0 z-20"
          style={{ width: '36%', padding: '3.5rem 2rem 3.5rem clamp(1.5rem, 5vw, 5rem)' }}
        >
          <h2 className="text-[clamp(32px,3.8vw,54px)] font-bold text-white leading-[1.0] tracking-tight">
            Trusted by the<br />
            teams who lead<br />
            change
          </h2>

          {/* Overlapping circles */}
          <div className="relative flex items-center" style={{ width: 148, height: 84 }}>
            {/* ← prev */}
            <button
              onClick={() => scrollToIndex(Math.max(active - 1, 0))}
              disabled={active === 0}
              aria-label="Previous"
              style={{
                position: 'absolute',
                left: 0, top: 0,
                width: 84, height: 84,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.14)',
                background: '#0D0D0D',
                color: active === 0 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: active === 0 ? 'not-allowed' : 'pointer',
                transition: 'color 0.3s, border-color 0.3s',
                zIndex: 10
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M5 12L12 19M5 12L12 5"/>
              </svg>
            </button>

            {/* → next */}
            <button
              onClick={() => scrollToIndex(Math.min(active + 1, testimonials.length - 1))}
              disabled={active === testimonials.length - 1}
              aria-label="Next"
              style={{
                position: 'absolute',
                left: 64, top: 0,
                width: 84, height: 84,
                borderRadius: '50%',
                border: '1px solid rgba(255,255,255,0.14)',
                background: '#0D0D0D',
                color: active === testimonials.length - 1 ? 'rgba(255,255,255,0.18)' : 'rgba(255,255,255,0.6)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: active === testimonials.length - 1 ? 'not-allowed' : 'pointer',
                transition: 'color 0.3s, border-color 0.3s',
                zIndex: 9
              }}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12H19M19 12L12 5M19 12L12 19"/>
              </svg>
            </button>
          </div>
        </div>

        {/* RIGHT: carousel */}
        <div className="relative flex-1 overflow-hidden" style={{ padding: '0 clamp(1.5rem,5vw,5rem) 0 2rem' }}>

          {/* Moving stack */}
          <motion.div
            style={{ y: stackY, position: 'absolute', inset: 0, top: `${INIT_TOP}vh` }}
          >
            {testimonials.map((t, i) => <Card key={t.id} t={t} idx={i} prog={smooth} />)}
          </motion.div>

          {/* Fade mask at top and bottom edges */}
          <div
            className="absolute inset-0 pointer-events-none z-10"
            style={{ background: 'linear-gradient(to bottom, #0D0D0D 0%, transparent 22%, transparent 78%, #0D0D0D 100%)' }}
          />
        </div>

      </div>
    </section>
  );
}
