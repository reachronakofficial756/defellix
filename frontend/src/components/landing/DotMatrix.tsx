import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FeatureCircles from './FeatureCircles';

gsap.registerPlugin(ScrollTrigger);

const DotMatrix = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Configuration for the grid precisely matching 21 columns layout
  // 31 rows ensures it bleeds completely off the top and bottom of a standard 1080p display
  const rows = 15;
  const cols = 39;

  // Center point
  const centerRow = Math.floor(rows / 2);
  const centerCol = Math.floor(cols / 2);

  useGSAP(() => {
    // 1. Get all dots
    const dots = gsap.utils.toArray<HTMLElement>('.matrix-dot');
    // 2. Clear any old inline styles during Hot Module Replacement
    gsap.set(dots, { clearProps: 'all' });

    // ALL dots must start exactly the same color so the initial state is a completely dim grid
    gsap.set(dots, { backgroundColor: '#333333', scale: 1 });

    // 3. Define discrete steps for the inverted triangle (Diamond) expansion seen in photos
    dots.forEach((dot) => {
      const r = parseInt(dot.dataset.row || '0', 10);
      const c = parseInt(dot.dataset.col || '0', 10);

      const rowDist = Math.abs(r - centerRow);
      const colDist = Math.abs(c - centerCol);

      // Criteria: rowDist > 0 (skip text row). Limit to 5 lines of vertical triangle.
      if (rowDist > 0 && rowDist <= 5) {
        dot.dataset.step = (rowDist + colDist).toString();
      } else {
        dot.dataset.step = "99"; // Background dots
      }

      // Red line logic: upper triangle center descending down to text
      if (colDist === 0 && r < centerRow && rowDist <= 5) {
        // Red line drops from rowDist=5 (top tip) down to rowDist=1 (bottom)
        dot.dataset.redStep = (6 - rowDist).toString();
      }
    });

    const maxHexagonSteps = 8; // Step 8 reaches colDist=7 on row 1, matching 15-dot wide base
    const maxRedSteps = 5;
    const activeSteps = maxHexagonSteps + maxRedSteps; // 13 total discrete steps

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=600%', // Scale scroll length for 13 distinct phases
        scrub: 1,
        pin: true,
        snap: 1 / activeSteps, // Snap cleanly to each phase
      }
    });

    // Step-by-step Hexagon expansion logic
    for (let i = 1; i <= maxHexagonSteps; i++) {
        const stepDots = dots.filter(d => parseInt(d.dataset.step || '0', 10) === i);
        if (stepDots.length > 0) {
            tl.to(stepDots, {
                backgroundColor: '#E2E8F0', // White/Light
                scale: 1.15,
                duration: 0.5,
                ease: 'power3.out'
            })
            // Extra "pause" in timeline to require more scroll to next step
            .to({}, { duration: 1.0 }); 
        }
    }

    // Step-by-step Red Line drop logic
    for (let j = 1; j <= maxRedSteps; j++) {
        const redDots = dots.filter(d => parseInt(d.dataset.redStep || '0', 10) === j);
        if (redDots.length > 0) {
            tl.to(redDots, {
                backgroundColor: '#E06A57', // Defellix Red
                scale: 1.25, // Pop the red slightly more
                duration: 0.5,
                ease: 'back.out(2)' // Nice little bounce effect
            })
            .to({}, { duration: 1.0 }); 
        }
    }

    // Final Action: Wipe crossfade into FeatureCircles
    const centerRedDot = document.querySelector('.red-center-dot');
    const textSpans = gsap.utils.toArray('.center-text-group span');
    const featureContainer = document.querySelector('.feature-container');
    
    // 1. Red circle begins slow expansion + background blur
    tl.to(centerRedDot, {
        scale: 15, // Grows large enough to engulf text slowly
        duration: 2.5, // Slow
        ease: 'power2.inOut'
    }, 'expand_slow')
    .to(gridRef.current, {
        filter: 'blur(30px)', // Drastically blur the background grid
        duration: 2.5,
        ease: 'power2.inOut' // Slow blur
    }, 'expand_slow')
    .to(textSpans, {
        opacity: 0,
        duration: 1.0
    }, 'expand_slow');
    
    // 2. Red circle fully expands SLOWER (as per request)
    tl.to(centerRedDot, {
        scale: 250, // Massive scale to cover the screen entirely
        duration: 2.5, // Slower
        ease: 'power3.inOut'
    }, 'expand_full')
    .to(gridRef.current, {
        filter: 'blur(100px)', // Total background obscurity
        duration: 2.5,
        ease: 'power3.inOut'
    }, 'expand_full')
    .to([dots, gridRef.current], {
        opacity: 0, // Clean up dots below instantly
        duration: 0.1
    }, 'expand_full+=2.0'); // Wipe late in the expansion
    
    // 3. Immediately show the feature container (has a black bg)
    tl.set(featureContainer, { 
        opacity: 1, 
        pointerEvents: 'auto' 
    }, 'expand_full+=2.5'); // Directly after expansion finishes
    
    // 4. Red circle (now a full red screen) fades out to reveal FeatureCircles
    tl.to(centerRedDot, {
        opacity: 0,
        duration: 1.0,
        ease: 'power2.out'
    }, 'reveal_features')
    
    // 5. Animate individual FeatureCircles items entering
    .from('.feature-circle', {
        scale: 0,
        opacity: 0,
        duration: 1,
        stagger: 0.2,
        ease: 'back.out(1.5)'
    }, 'reveal_features+=0.2')
    .from('.feature-text', {
        y: 50,
        opacity: 0,
        duration: 1,
        ease: 'power3.out'
    }, 'reveal_features+=0.5')
    
    // Give user buffer before unpinning section completely
    .to({}, { duration: 1.5 });

  }, { scope: containerRef });

  // Generate the HTML for the grid so we don't have thousands of elements manually
  const gridCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      // Clear only the middle horizontal row precisely where the text center line sits
      const inTextRow = Math.abs(r - centerRow) === 0;

      if (inTextRow) {
        // Empty wrapper to preserve grid layout
        gridCells.push(<div key={`${r}-${c}`} className="w-8 h-8" />);
        continue;
      }

      gridCells.push(
        <div key={`${r}-${c}`} className="flex items-center justify-center">
          <div
            data-row={r}
            data-col={c}
            className="matrix-dot w-8 h-8 rounded-full bg-[#333333] transition-colors duration-150 will-change-transform"
          />
        </div>
      );
    }
  }

  return (
    <section
      ref={containerRef}
      className="relative w-full h-screen bg-[#111111] overflow-hidden"
    >
      <div className="absolute inset-0 flex items-center justify-center">

        {/* CSS Grid for perfect dot alignment */}
        <div
          ref={gridRef}
          className="relative z-0 w-full max-w-full px-0 overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: '1.5rem 1rem', // Vertical / Horizontal gap 
            padding: '2rem 4rem',
            alignItems: 'center',
            justifyItems: 'center'
          }}
        >
          {gridCells}
        </div>

        {/* The Text Layer (Absolutely positioned dead center over the gap) */}
        <div className="center-text-group absolute left-133 z-10 flex items-center justify-center pointer-events-none">
          <div className="flex items-center gap-4 sm:gap-6">
            <span className="text-white font-medium text-3xl md:text-6xl tracking-tight leading-none" style={{ textShadow: '0 0 30px rgba(0,0,0,0.8)' }}>Beyond Insight.</span>
            <div className="red-center-dot w-15 h-15 md:w-8 md:h-8 rounded-full bg-[#E06A57] shrink-0" />
            <span className="text-white font-medium text-3xl md:text-6xl tracking-tight leading-none" style={{ textShadow: '0 0 30px rgba(0,0,0,0.8)' }}>Into Impact.</span>
          </div>
        </div>

        {/* FeatureCircles rendered absolutely over the dots, hidden at start */}
        <div className="feature-container absolute inset-0 z-50 opacity-0 pointer-events-none">
           <FeatureCircles />
        </div>

      </div>
    </section>
  );
};

export default DotMatrix;
