import { useRef } from 'react';
import gsap from 'gsap';
import { useGSAP } from '@gsap/react';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const TransitionArcs = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const shellContainerRef = useRef<HTMLDivElement>(null);
  const centralDotRef = useRef<HTMLSpanElement>(null);
  const shellsRef = useRef<(HTMLDivElement | null)[]>([]);

  // Calculate shell properties based on the provided pattern
  const SHELL_COUNT = 18;
  const shellData = Array.from({ length: SHELL_COUNT }).map((_, i) => ({
    width: 456 - i * 15,
    height: 380 - i * 10,
    top: i * 10,
    left: i * 7.5,
  }));

  useGSAP(() => {
    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: containerRef.current,
        start: 'top top',
        end: '+=150%',
        scrub: 1,
        pin: true,
        // Markers for debugging
        // markers: true, 
      }
    });

    // 1. Initial appearance of shells - they "expand" or fade in
    tl.from(shellsRef.current, {
      scale: 0.8,
      opacity: 0,
      stagger: {
        each: 0.05,
        from: "end"
      },
      duration: 1,
      ease: 'power2.out'
    }, 0);

    // 2. The whole assembly grows larger as we scroll deeper
    tl.to(shellContainerRef.current, {
      scale: 1.5,
      y: -50,
      duration: 1.5,
      ease: 'power1.inOut'
    }, 0.5);

    // 3. The central coral dot expands to engulf the screen
    // This creates the transition "portal" to the next section
    tl.to(centralDotRef.current, {
      width: '350vw',
      height: '350vw',
      duration: 2,
      ease: 'power4.in',
      // The box shadow provides the "blur sides" effect
      boxShadow: '0 0 150px 100px #FF7056',
    }, 1.5);

  }, { scope: containerRef });

  return (
    <section 
      ref={containerRef} 
      className="relative h-screen w-full bg-[#0D0D0D] overflow-hidden flex items-end justify-center"
    >
      <div 
        ref={shellContainerRef}
        className="relative origin-bottom mb-[15vh] z-10" 
        style={{ width: '456px', height: '380px' }}
      >
        {shellData.map((data, i) => (
          <div
            key={i}
            ref={(el) => { shellsRef.current[i] = el; }}
            className="overflow-x-hidden absolute rounded-t-full border border-white/40 border-b-0"
            style={{
              top: `${data.top}px`,
              left: `${data.left}px`,
              width: `${data.width}px`,
              height: `${data.height}px`,
              opacity: 1 - i * 0.04, // Subtle fade for outer shells
            }}
          />
        ))}
        
        {/* The expanding central dot */}
        <span
          ref={centralDotRef}
          className="absolute aspect-square bottom-0 left-1/2 -translate-x-1/2 rounded-full bg-[#FF7056] z-50 pointer-events-none"
          style={{ 
            width: '0px', 
            height: '0px',
            boxShadow: '0 4px 16px 24px rgba(255, 112, 86, 0.8)'
          }}
        />
      </div>

      {/* Subtle background text or hint that we are transitioning */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white/5 text-[20vw] font-black pointer-events-none uppercase select-none">
        Ready
      </div>
    </section>
  );
};

export default TransitionArcs;
