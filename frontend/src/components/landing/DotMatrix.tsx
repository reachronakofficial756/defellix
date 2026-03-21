import { useRef, useState, useEffect } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import FeatureCircles from './FeatureCircles';

gsap.registerPlugin(ScrollTrigger);

const DotMatrix = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);

  // Configuration for dynamic grid layout based on screen width
  const [gridSize, setGridSize] = useState({ rows: 15, cols: 39 });

  useEffect(() => {
    const handleResize = () => {
      const width = window.innerWidth;
      // On mobile standard 15 columns, on tablet 25, on desktop 39
      if (width < 640) {
        setGridSize({ rows: 15, cols: 13 });
      } else if (width < 1024) {
        setGridSize({ rows: 15, cols: 25 });
      } else {
        setGridSize({ rows: 15, cols: 39 });
      }
    };
    
    // Set initial size immediately
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const { rows, cols } = gridSize;

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

    // 3. Define discrete steps for the inverted triangle (Diamond) expansion
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

    const maxHexagonSteps = 8; // Step 8 reaches colDist=7 on row 1
    const maxRedSteps = 5;
    const activeSteps = maxHexagonSteps + maxRedSteps; // 13 total discrete steps

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=600%', 
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
            .to({}, { duration: 1.0 }); 
        }
    }

    // Step-by-step Red Line drop logic
    for (let j = 1; j <= maxRedSteps; j++) {
        const redDots = dots.filter(d => parseInt(d.dataset.redStep || '0', 10) === j);
        if (redDots.length > 0) {
            tl.to(redDots, {
                backgroundColor: '#E06A57', // Defellix Red
                scale: 1.25, 
                duration: 0.5,
                ease: 'back.out(2)' 
            })
            .to({}, { duration: 1.0 }); 
        }
    }

    // Final Action: Wipe crossfade into FeatureCircles
    const centerRedDot = document.querySelector('.red-center-dot');
    const textSpans = gsap.utils.toArray('.center-text-group span');
    const featureContainer = document.querySelector('.feature-container');
    
    // Performance optimization: Generate/Find overlay container for blur
    const gridEl = gridRef.current;
    let overlayContainer = gridEl?.parentElement?.querySelector('.grid-overlay-container') as HTMLDivElement;
    
    if (!overlayContainer) {
      overlayContainer = document.createElement('div');
      overlayContainer.className = 'grid-overlay-container';
      Object.assign(overlayContainer.style, {
        position: 'absolute',
        inset: '0',
        pointerEvents: 'none',
        zIndex: '5',
        opacity: '0',
        filter: 'blur(0px)'
      });
      gridEl?.parentElement?.appendChild(overlayContainer);
    } else {
      // Clean up for HMR / Resizes
      overlayContainer.style.opacity = '0';
      overlayContainer.style.filter = 'blur(0px)';
      overlayContainer.innerHTML = '';
    }

    // 1. Red circle begins slow expansion + background blur on overlay
    tl.to(centerRedDot, {
        scale: 15,
        duration: 2.5,
        ease: 'power2.inOut'
    }, 'expand_slow')
    .add(() => {
        if (gridEl && overlayContainer.children.length === 0) {
            const clone = gridEl.cloneNode(true) as HTMLElement;
            clone.style.filter = 'none';
            overlayContainer.appendChild(clone);
        }
    }, 'expand_slow')
    .to(overlayContainer, {
        opacity: 1,
        filter: 'blur(30px)',
        duration: 2.5,
        ease: 'power2.inOut'
    }, 'expand_slow')
    .to(gridEl, {
        opacity: 0,
        duration: 1.0
    }, 'expand_slow')
    .to(textSpans, {
        opacity: 0,
        duration: 1.0
    }, 'expand_slow');
    
    // 2. Red circle fully expands SLOWER
    tl.to(centerRedDot, {
        scale: 250,
        duration: 2.5,
        ease: 'power3.inOut'
    }, 'expand_full')
    .to(overlayContainer, {
        filter: 'blur(100px)',
        duration: 2.5,
        ease: 'power3.inOut'
    }, 'expand_full')
    .to([dots, gridEl, overlayContainer], {
        opacity: 0,
        duration: 0.1
    }, 'expand_full+=2.0');
    
    // 3. Immediately show the feature container
    tl.set(featureContainer, { 
        opacity: 1, 
        pointerEvents: 'auto' 
    }, 'expand_full+=2.5'); 
    
    // 4. Red circle fades out to reveal FeatureCircles
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
    
    // Give user buffer before unpinning section
    .to({}, { duration: 1.5 });

  }, { scope: containerRef, dependencies: [rows, cols] }); // Rerun GSAP logic when rows/cols change

  const gridCells = [];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const inTextRow = Math.abs(r - centerRow) === 0;

      if (inTextRow) {
        gridCells.push(<div key={`${r}-${c}`} className="w-6 h-6 sm:w-8 sm:h-8" />);
        continue;
      }

      gridCells.push(
        <div key={`${r}-${c}`} className="flex items-center justify-center">
          <div
            data-row={r}
            data-col={c}
            className="matrix-dot w-6 h-6 sm:w-8 sm:h-8 rounded-full bg-[#333333] transition-colors duration-150 will-change-transform"
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

        <div
          ref={gridRef}
          className="relative z-0 w-full max-w-full px-0 overflow-hidden"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${cols}, minmax(0, 1fr))`,
            gap: '1rem 0.5rem', // Tighter gap for mobile flexibility
            padding: '2rem 1rem',
            alignItems: 'center',
            justifyItems: 'center'
          }}
        >
          {gridCells}
        </div>

        {/* The Text Layer (Absolutely positioned dead center) */}
        <div className="center-text-group absolute left-1/2 right-1/4 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full z-10 flex items-center justify-center pointer-events-none px-4">
          <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6 text-center">
            <span className="text-white font-medium text-3xl md:text-6xl tracking-tight leading-none" style={{ textShadow: '0 0 30px rgba(0,0,0,0.8)' }}>Beyond Insight.</span>
            <div className="red-center-dot hidden sm:block w-4 h-4 md:w-8 md:h-8 rounded-full bg-[#E06A57] shrink-0" />
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
