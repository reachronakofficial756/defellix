import { motion, useScroll, useTransform, useSpring, useMotionValue, MotionValue } from 'motion/react';
import { useRef, useState, useEffect } from 'react';

// ─── slide data ───────────────────────────────────────────────────────────────
const slides = [
  {
    id: 1,
    title: 'Protocol',
    description:
      'Deconstruct traditional agreements into immutable, milestone-based smart contracts. Every term is hard-coded, ensuring total alignment before a single hour is logged.'
  },
  {
    id: 2,
    title: 'Escrow',
    description:
      'Experience liquid security. Funds are locked in decentralized escrow, with settlement triggered instantly by milestone evidence—eliminating non-payment risk forever.'
  },
  {
    id: 3,
    title: 'Legacy',
    description:
      'Every successful settlement is distilled into your permanent, verifiable reputation. Turn your track record into a cryptographically signed asset that scales your value.'
  }
];

// ─── geometry ─────────────────────────────────────────────────────────────────
// To create the illusion of infinite "sides" we place 5 items on the circle.
// When 1 is top: Left is 3 (-65°), Right is 2 (+65°)
// When 2 is top: Left is 1 (-65° relative to 2), Right is 3 (+65° relative to 2)
// Array of objects describing what goes where on the static wheel:
const RING_ITEMS = [
  { angle: -65, id: 3, slideIndex: 2 },
  { angle: 0, id: 1, slideIndex: 0 },
  { angle: 65, id: 2, slideIndex: 1 },
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
  // Numbers sit at a RADIUS slightly LARGER than the arc to be "outside"
  const { x, y } = polar(angleDeg, R + 80);
  const cx = svgW / 2 + x;
  const cy = svgH + y;

  const size = Math.max(80, Math.min(60, R * 0.075));

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
          border: `2px solid ${isActive ? '#3cb44f' : 'rgba(255,255,255,0.22)'}`,
          background: isActive ? '#3cb44f' : 'rgba(255,255,255,0.04)',
          color: isActive ? '#000' : 'rgba(255,255,255,0.45)', // Black text on green background for contrast
          transition: 'background 0.6s ease, border-color 0.6s ease, color 0.6s ease, box-shadow 0.6s ease',
          boxShadow: isActive ? '0 0 32px rgba(60,180,79,0.55), 0 0 8px rgba(60,180,79,0.3)' : 'none',
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

  const [activeIndex, setActiveIndex] = useState(0);
  const [lineVisible, setLineVisible] = useState(true);

  // Motion value for the discrete rotation target
  const rotationTarget = useMotionValue(0);
  const arcRotation = useSpring(rotationTarget, { damping: 42, stiffness: 180, mass: 0.4 });

  useEffect(
    () =>
      scrollYProgress.on('change', (v) => {
        // Switch purely based on deeply expanded zones for stability
        // Slide 2 now occupies 50% of the entire section!
        const idx = v < 0.25 ? 0 : v < 0.75 ? 1 : 2;
        setActiveIndex((p) => (p !== idx ? idx : p));
      }),
    [scrollYProgress]
  );

  // When activeIndex changes, fire the rotation and hide the line!
  useEffect(() => {
    rotationTarget.set(SNAP_ROTATIONS[activeIndex]);
    setLineVisible(false);
    const timer = setTimeout(() => {
      setLineVisible(true); // Fade line back in after wheel clicks into place
    }, 600);
    return () => clearTimeout(timer);
  }, [activeIndex, rotationTarget]);

  const PAD = 160;
  const svgW = R * 2 + PAD;
  const svgH = R;

  // Line height heavily reduced to snug up against text
  const lineH = Math.round(R * 0.4);

  return (
    <section ref={containerRef} className="relative h-[400vh] bg-[#000]">
      <div className="sticky top-0 h-screen w-full overflow-hidden">

        {/* ── Heading ─────────────────────────────────────────────────────── */}
        <div className="absolute top-10 left-8 sm:top-14 sm:left-14 z-20 pointer-events-none">
          <h2 className="text-3xl sm:text-4xl lg:text-7xl font-bold text-white leading-[1.1] tracking-tighter">
            Think Different.<br />We Already Built It.
          </h2>
        </div>

        {/* ── Connector line + slide label ────────────────────────────────── */}
        <div
          className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center "
          style={{ top: `calc(100vh - ${R}px - 20px)` }} // Lifted slightly away from arc
        >
          {/* Gradient line that sequences in after wheel stops */}
          <motion.div
            className="w-1 relative"
            initial={false}
            animate={{ opacity: lineVisible ? 1 : 0 }}
            transition={{ duration: 0.4 }}
            style={{
              height: lineH,
              background: 'linear-gradient(to bottom, rgba(60,180,79,1) 0%, rgba(60,180,79,0.15) 100%)'
            }}
          >
            <div
              style={{
                position: 'absolute',
                left: '50%',
                bottom: 0,
                width: 20,
                height: 20,
                background: '#3cb44f',
                transform: 'translateX(-50%) translateY(50%) rotate(45deg)',
                boxShadow: '0 0 18px 4px rgba(60,180,79,0.75)'
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
            transformOrigin: `${svgW / 2}px ${svgH}px`,
            y: 80 // Shift ASSEMBLY lower
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
