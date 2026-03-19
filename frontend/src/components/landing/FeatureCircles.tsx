

const FeatureCircles = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      {/* Title matching the DotMatrix component for transition continuity */}
      <h2 className="text-white font-medium text-4xl md:text-6xl tracking-tight mb-20 text-center">
        Beyond Insight. Into Impact.
      </h2>

      {/* Intersecting Circles Component */}
      <div className="relative flex justify-center items-center mb-24 max-w-4xl w-full">
        {/* Circle 1: Intelligence */}
        <div className="feature-circle relative z-10 w-48 h-48 md:w-64 md:h-64 rounded-full border border-[#E06A57] flex items-center justify-center -mr-12 md:-mr-16 bg-[#111111]/80 backdrop-blur-sm">
           <span className="text-[#E06A57] font-medium text-xl md:text-2xl">Intelligence</span>
        </div>

        {/* Circle 2: Impact */}
        <div className="feature-circle relative z-20 w-48 h-48 md:w-64 md:h-64 rounded-full border border-[#E06A57] flex items-center justify-center bg-[#111111]/80 backdrop-blur-sm">
           <span className="text-[#E06A57] font-medium text-xl md:text-2xl">Impact</span>
        </div>

        {/* Circle 3: Growth */}
        <div className="feature-circle relative z-10 w-48 h-48 md:w-64 md:h-64 rounded-full border border-[#E06A57] flex items-center justify-center -ml-12 md:-ml-16 bg-[#111111]/80 backdrop-blur-sm">
           <span className="text-[#E06A57] font-medium text-xl md:text-2xl">Growth</span>
        </div>
      </div>

      {/* Description Text */}
      <div className="feature-text max-w-3xl mx-auto text-center px-4">
        <p className="text-gray-300 text-lg md:text-2xl leading-relaxed font-light">
          An AI control layer that understands every customer conversation,
          proactively surfaces what matters and drives decisions across operations,
          compliance, and revenue in real time.
        </p>
      </div>
    </div>
  );
};

export default FeatureCircles;
