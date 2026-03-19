import { motion, useScroll, useTransform, useSpring, MotionValue } from 'motion/react';
import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

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
// To create the illusion of infinite "sides" we place 5 items on the circle.
// When 1 is top: Left is 3 (-65°), Right is 2 (+65°)
// When 2 is top: Left is 1 (-65° relative to 2), Right is 3 (+65° relative to 2)
// Array of objects describing what goes where on the static wheel:
const RING_ITEMS = [
  { angle: -65, id: 3, slideIndex: 2 },
  { angle: 0,   id: 1, slideIndex: 0 },
  { angle: 65,  id: 2, slideIndex: 1 },
  { angle: 130, id: 3, slideIndex: 2 },
  { angle: 195, id: 1, slideIndex: 0 },
];

const SNAP_ROTATIONS = [0, -65, -130]; 

function polar(deg: number, R: number) {
  const rad = ((deg - 90) * Math.PI) / 180;
  return { x: R * Math.cos(rad), y: R * Math.sin(rad) };
}

// ─── NumberBadge ──────────────────────────────────────────────────────────────
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
  const selfRotation = useTransform(arcRotation, (r: number) => -r);
  const { x, y } = polar(angleDeg, R);
  const cx = svgW / 2 + x;
  const cy = svgH + y; 

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

  useGSAP(() => {
    // We enforce native window snap behaviour over this large container
    // This perfectly partitions the scroll track into 3 distinct stops!
    ScrollTrigger.create({
      trigger: containerRef.current,
      start: 'top top',
      end: 'bottom bottom',
      snap: {
        snapTo: 1 / 2, // Stops strictly at 0.0, 0.5, and 1.0 bounds
        duration: { min: 0.2, max: 0.6 },
        ease: 'power2.out'
      }
    });
  }, { scope: containerRef });

  const [R, setR] = useState(680);
  useEffect(() => {
    const update = () => {
      const vh = window.innerHeight;
      const vw = window.innerWidth;
      const byH = vh * 0.72;
      const byW = vw * 0.78;
      setR(Math.round(Math.min(byH, byW, 900)));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ['start start', 'end end']
  });

  // Hold zones with brief rapid gliding between them so user sees numbers clearly snap.
  const rawRotation = useTransform(
    scrollYProgress,
    [0,   0.28,             0.38,             0.61,             0.71,              1],
    [0,   SNAP_ROTATIONS[0], SNAP_ROTATIONS[1], SNAP_ROTATIONS[1], SNAP_ROTATIONS[2], SNAP_ROTATIONS[2]]
  );

  const arcRotation = useSpring(rawRotation, { damping: 42, stiffness: 180, mass: 0.4 });

  // Map the line opacity strictly to the physical rotation of the arc!
  // This guarantees the line stays invisible during the entire spin, 
  // and ONLY fades in when the number gently settles into the direct top position.
  const lineOpacity = useTransform(
    arcRotation,
    [-140, -132, -128, -120, -73, -67, -63, -57, -8, -2, 2, 8],
    [0,    0,    1,    0,    0,   1,   1,   0,   0,  1, 1, 0]
  );

  const [activeIndex, setActiveIndex] = useState(0);
  useEffect(
    () =>
      scrollYProgress.on('change', (v) => {
        const idx = v < 0.33 ? 0 : v < 0.66 ? 1 : 2;
        setActiveIndex((p) => (p !== idx ? idx : p));
      }),
    [scrollYProgress]
  );

  const PAD   = 160;          
  const svgW  = R * 2 + PAD;  
  const svgH  = R;            

  // Line height heavily reduced to snug up against text
  const lineH = Math.round(R * 0.4);

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
        <div
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center z-10"
          style={{ top: `calc(100vh - ${R}px + 26px)` }}
        >
          {/* Gradient line mapping to lineOpacity */}
          <motion.div
            className="w-px relative"
            style={{
              height: lineH,
              opacity: lineOpacity,
              background: 'linear-gradient(to bottom, rgba(232,115,90,1) 0%, rgba(232,115,90,0.15) 100%)'
            }}
          >
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
          </motion.div>

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
          <svg
            width={svgW}
            height={svgH}
            overflow="visible"
            style={{ position: 'absolute', inset: 0 }}
          >
            <circle
              cx={svgW / 2}
              cy={svgH}
              r={R}
              fill="none"
              stroke="rgba(255,255,255,0.10)"
              strokeWidth={1.5}
            />
            <circle
              cx={svgW / 2}
              cy={svgH}
              r={R - 1}
              fill="none"
              stroke="rgba(255,255,255,0.03)"
              strokeWidth={6}
            />
          </svg>

          {/* Render our visually mapped infinite wheel numbers */}
          {RING_ITEMS.map((item, index) => (
            <NumberBadge
              key={index}
              id={item.id}
              angleDeg={item.angle}
              R={R}
              svgW={svgW}
              svgH={svgH}
              arcRotation={arcRotation}
              isActive={activeIndex === item.slideIndex}
            />
          ))}
        </motion.div>

      </div>
    </section>
  );
};

export default CircularSlider;
