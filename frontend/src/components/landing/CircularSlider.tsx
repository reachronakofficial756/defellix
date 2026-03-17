import { motion, useScroll, useTransform, useSpring, MotionValue } from 'motion/react';
import { useRef, useState, useEffect } from 'react';

// ─── slide data ───────────────────────────────────────────────────────────────
const slides = [
  {
    id: 1,
    title: 'Learn',
    description:
      'Every call, chat, and ticket captured, revealing not just what happened, but why. Your conversations become a living, ever-growing source of truth.'
  },
  {
    id: 2,
    title: 'Evolve',
    description:
      'Go beyond insights. Our AI automates QA, compliance, and performance, continuously testing and refining what makes your team better, in real time.'
  },
  {
    id: 3,
    title: 'Scale',
    description:
      'Transform your operations with intelligence that grows with you. Automate complex workflows and deliver exceptional customer experiences at any scale.'
  }
];

// ─── geometry ─────────────────────────────────────────────────────────────────
// Clockwise order: 1 at 0° (top), 2 at 55° (right), 3 at 110° (hidden below on start)
// When ring rotates -55°: 2 rises to top, 3 appears right
// When ring rotates -110°: 3 rises to top, 2 moves left
const ANGLES = [0, 55, 110];
const SNAP_ROTATIONS = ANGLES.map((a) => -a); // [0, -55, -110]

// Convert angle (0°=12-o'clock, clockwise) → Cartesian offset from circle centre
function polar(deg: number, R: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: R * Math.cos(rad), y: R * Math.sin(rad) };
}

// ─── NumberBadge ──────────────────────────────────────────────────────────────
// Extracted so that useTransform is called at component top-level
interface BadgeProps {
  id: number;
  angleDeg: number;
  R: number;
  svgW: number;
  svgH: number;
  arcRotation: MotionValue<number>;
  isActive: boolean;
}

function NumberBadge({ id, angleDeg, R, svgW, svgH, arcRotation, isActive }: BadgeProps) {
  // Counter-rotate so the number stays upright as the ring spins
  const selfRotation = useTransform(arcRotation, (r: number) => -r);
  const { x, y } = polar(angleDeg, R);
  const cx = svgW / 2 + x;
  const cy = svgH + y; // svgH is the y of circle centre inside the div

  const size = Math.max(44, Math.min(60, R * 0.075));

  return (
    <motion.div
      style={{
        position: 'absolute',
        left: cx,
        top: cy,
        x: '-50%',
        y: '-50%',
        rotate: selfRotation
      }}
    >
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: Math.max(14, size * 0.36),
          fontWeight: 700,
          border: `2px solid ${isActive ? '#E8735A' : 'rgba(255,255,255,0.22)'}`,
          background: isActive ? '#E8735A' : 'rgba(255,255,255,0.04)',
          color: isActive ? '#fff' : 'rgba(255,255,255,0.45)',
          transition: 'background 0.6s ease, border-color 0.6s ease, color 0.6s ease, box-shadow 0.6s ease',
          boxShadow: isActive ? '0 0 32px rgba(232,115,90,0.55), 0 0 8px rgba(232,115,90,0.3)' : 'none',
          backdropFilter: 'blur(4px)'
        }}
      >
        {id}
      </div>
    </motion.div>
  );
}

// ─── CircularSlider ───────────────────────────────────────────────────────────
const CircularSlider = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive radius: proportional to viewport height so the arc top is
  // always visible and the arc width fills the screen.
  const [R, setR] = useState(680);
  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      // R ≈ 72% of viewport height → arc top sits ~28% from top of screen
      // also cap by 78% of half-width so arc doesn't look too flat on wide screens
      const byH = vh * 0.72;
      const byW = vw * 0.78;
      setR(Math.round(Math.min(byH, byW, 900)));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  // Scroll setup
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Hold-at-each-number with smooth transitions between them.
  // Each third (~33%) is a HOLD zone. The 7% gap between thirds is the GLIDE zone.
  //   0%     → 30%  : hold at slide 1 (rotation = 0°)
  //   30%    → 37%  : smooth glide to -55°
  //   37%    → 63%  : hold at slide 2 (rotation = -55°)
  //   63%    → 70%  : smooth glide to -110°
  //   70%    → 100% : hold at slide 3 (rotation = -110°)
  const rawRotation = useTransform(
    scrollYProgress,
    [0,   0.30,             0.37,             0.63,             0.70,              1],
    [0,   SNAP_ROTATIONS[0], SNAP_ROTATIONS[1], SNAP_ROTATIONS[1], SNAP_ROTATIONS[2], SNAP_ROTATIONS[2]]
  );

  // Moderate spring: smooth glide + natural settle at each stop
  const arcRotation = useSpring(rawRotation, { damping: 42, stiffness: 180, mass: 0.4 });

  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(
    () =>
      scrollYProgress.on('change', (v) => {
        const idx = v < 0.33 ? 0 : v < 0.66 ? 1 : 2;
        setActiveIndex((p) => (p !== idx ? idx : p));
      }),
    [scrollYProgress]
  );

  // Ring div dimensions
  const PAD   = 160;           // horizontal padding so side badges don't clip
  const svgW  = R * 2 + PAD;  // total width of the rotating div
  const svgH  = R;             // height = R so circle centre sits at bottom of div

  // Vertical line height: from arc top (12-o'clock) down to the label text
  const lineH = Math.round(R * 0.18);

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-[#191919]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* ── Heading ─────────────────────────────────────────────────────── */}
        <div className="absolute top-10 left-8 sm:top-14 sm:left-14 z-20 pointer-events-none">
          <p className="text-white/40 text-[10px] sm:text-[11px] font-bold tracking-[0.28em] uppercase mb-3">
            The Architecture of Autonomous CX
          </p>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white leading-[1.15] tracking-tight">
            Think Different.<br />We Already Built It.
          </h2>
        </div>

        {/* ── Connector line + slide label ────────────────────────────────── */}
        {/*
          The 12-o'clock point of the ring = (50vw, 100vh - R).
          Circle centre is at 100vh (bottom edge of sticky viewport).
        */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
          style={{ top: `calc(100vh - ${R}px)` }}
        >
          {/* Gradient line */}
          <div
            className="w-px relative"
            style={{
              height: lineH,
              background: 'linear-gradient(to bottom, rgba(232,115,90,1) 0%, rgba(232,115,90,0.15) 100%)'
            }}
          >
            {/* Glowing diamond at bottom of line */}
            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 0,
                width: 9,
                height: 9,
                background: '#E8735A',
                transform: 'translateX(-50%) translateY(50%) rotate(45deg)',
                boxShadow: '0 0 18px 4px rgba(232,115,90,0.75)'
              }}
            />
          </div>

          {/* Animated slide content */}
          <div className="mt-8 sm:mt-10 text-center px-4">
            <motion.div
              key={activeIndex}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.55, ease: [0.23, 1, 0.32, 1] }}
              className="flex flex-col items-center"
            >
              <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight">
                {slides[activeIndex].title}
              </h3>
              <p className="text-white/50 text-sm sm:text-base leading-relaxed max-w-xs sm:max-w-sm text-center">
                {slides[activeIndex].description}
              </p>
            </motion.div>
          </div>
        </div>

        {/* ── Rotating arc ring ───────────────────────────────────────────── */}
        {/*
          Div sits at bottom:0, horizontally centred.
          Width = svgW, Height = R  (shows top half of the circle).
          transform-origin = (svgW/2, R) = circle centre = (50vw, 100vh).
        */}
        <motion.div
          style={{
            rotate: arcRotation,
            position: 'absolute',
            bottom: 0,
            left: '50%',
            width: svgW,
            height: svgH,
            marginLeft: -(svgW / 2),
            transformOrigin: `${svgW / 2}px ${svgH}px`
          }}
        >
          {/* SVG arc line */}
          <svg
            width={svgW}
            height={svgH}
            overflow="visible"
            style={{ position: 'absolute', inset: 0 }}
          >
            {/* Full circle – only the top portion is visible in viewport */}
            <circle
              cx={svgW / 2}
              cy={svgH}
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth={1.5}
            />
            {/* Subtle inner glow ring */}
            <circle
              cx={svgW / 2}
              cy={svgH}
              r={R - 1}
              fill="none"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth={6}
            />
          </svg>

          {/* Number badges */}
          {slides.map((slide, index) => (
            <NumberBadge
              key={slide.id}
              id={slide.id}
              angleDeg={ANGLES[index]}
              R={R}
              svgW={svgW}
              svgH={svgH}
              arcRotation={arcRotation}
              isActive={activeIndex === index}
            />
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default CircularSlider;
