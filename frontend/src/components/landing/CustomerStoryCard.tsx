import { useRef } from 'react';
import { ArrowUpRight, ArrowRight } from 'lucide-react';
import dashboard from "../../assets/dashboard.png"

const CustomerStoryCard = () => {
  const containerRef = useRef<HTMLElement>(null);

  return (
    <section ref={containerRef} className="relative h-[300vh] bg-[#0D0D0D]">
      {/* ── Sticky Background Image ── 
          Stays fixed to the viewport while the section scrolls */}
      <div className="sticky top-0 h-screen w-full overflow-hidden z-0">
        <img
          src={dashboard}
          alt="Defellix Impact"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-black/10" /> {/* Subtle darkening to ensure text/image pop */}
      </div>

      {/* ── Foreground Parallax Card ── 
          Sits at the very bottom of the 200vh container. 
          As you scroll, it scrolls naturally up into the viewport, sliding OVER the sticky image. */}
      <div className="absolute bottom-0 left-0 w-full z-10 pt-10">
        <div className="w-full bg-[#97A8A3] p-8 pb-16 md:p-14 lg:p-16 flex flex-col relative shadow-[0_-20px_50px_rgba(0,0,0,0.25)] min-h-[70vh]">

          {/* Top Header Row */}
          <div className="flex justify-between items-start mb-12 w-full max-w-[1400px] mx-auto">
            <p className="text-[#4E5C58] font-medium text-xl md:text-2xl tracking-normal">
              Customer stories
            </p>
            <button className="flex items-center gap-1 sm:gap-3 md:gap-4 text-[#1C2422] font-medium text-base sm:text-lg hover:opacity-80 transition-opacity group">
              <span className="hidden sm:inline">Full success story</span>
              <span className="sm:hidden">Full story</span>
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-[#FA6955] flex items-center justify-center text-white transition-transform group-hover:translate-x-1 shrink-0">
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </div>
            </button>
          </div>

          {/* Mid Row: Text and Image */}
          <div className="flex flex-col lg:flex-row justify-between mb-16 gap-12 lg:gap-20 items-stretch max-w-[1400px] mx-auto w-full">
            {/* Left: Text content */}
            <div className="lg:w-1/2 flex flex-col pt-2 md:pt-4 pr-0 lg:pr-12">
              <h2 className="text-3xl sm:text-4xl md:text-[52px] xl:text-[56px] leading-[1.1] font-medium text-[#131A18] mb-4 sm:mb-6 tracking-tight">
                From buried transcripts to frontline impact
              </h2>
              <p className="text-[#4E5C58] text-lg sm:text-xl md:text-[22px] font-medium leading-relaxed mb-8 sm:mb-12 max-w-[500px]">
                Crocus & Primrose unlocked 100% coverage, faster QA, and instant insights, turning conversations into performance at scale.
              </p>

              {/* Logos */}
              <div className="flex items-center gap-10 text-[#131A18] opacity-90 mt-auto pb-4">
                <span className="font-serif text-4xl font-normal lowercase tracking-tight italic" style={{ fontFamily: 'Georgia, serif' }}>
                  crocus
                </span>
                <div className="flex items-center gap-3">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2v20 M17 5l-10 14 M22 12H2 M19 17L5 7" />
                    <circle cx="12" cy="12" r="3" fill="currentColor" />
                  </svg>
                  <span className="font-sans text-3xl font-bold tracking-tight lowercase">primrose</span>
                </div>
              </div>
            </div>

            {/* Right: Inner Image */}
            <div
              className="lg:w-1/2 relative h-[300px] md:h-[400px] xl:h-[460px] w-full overflow-hidden shadow-md"
              style={{ borderRadius: 'clamp(100px, 15vw, 260px) 1.5rem 1.5rem 1.5rem' }}
            >
              <img
                src="https://images.unsplash.com/photo-1466692476877-380d19e99fbd"
                alt="Potted Plants Customer Integration"
                className="absolute inset-0 w-full h-full object-cover object-center scale-[1.03]"
              />
            </div>
          </div>

          {/* Bottom Cards row */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[1400px] mx-auto w-full mt-2">
            {/* Card 1 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 flex flex-col justify-center border border-white/5 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-[10px] bg-[#97A8A3]/80 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-[#298E5D]" strokeWidth={2.5} />
                </div>
                <span className="text-4xl md:text-5xl font-medium text-[#131A18] tracking-tight">100%</span>
              </div>
              <p className="text-[#2C3834] font-medium text-lg">Call coverage.</p>
            </div>

            {/* Card 2 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 flex flex-col justify-center border border-white/5 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-[10px] bg-[#97A8A3]/80 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-[#298E5D]" strokeWidth={2.5} />
                </div>
                <span className="text-4xl md:text-5xl font-medium text-[#131A18] tracking-tight">94%</span>
              </div>
              <p className="text-[#2C3834] font-medium text-lg">QA time reduction</p>
            </div>

            {/* Card 3 */}
            <div className="bg-white/10 backdrop-blur-sm rounded-3xl p-8 flex flex-col justify-center border border-white/5 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-[10px] bg-[#97A8A3]/80 flex items-center justify-center">
                  <ArrowUpRight className="w-6 h-6 text-[#298E5D]" strokeWidth={2.5} />
                </div>
                <span className="text-4xl md:text-5xl font-medium text-[#131A18] tracking-tight">x8</span>
              </div>
              <p className="text-[#2C3834] font-medium text-lg">Agent coaching efficiency</p>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
};

export default CustomerStoryCard;
