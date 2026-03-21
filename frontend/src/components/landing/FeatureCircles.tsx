

const FeatureCircles = () => {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center p-8">
      {/* Title matching the DotMatrix component for transition continuity */}
      <h2 className="text-white font-medium text-4xl md:text-7xl tracking-tight mb-20 text-center">
        Beyond Promise. Into Evidence.
      </h2>

      {/* Intersecting Circles Component */}
      <div className="relative flex justify-center items-center mb-24 max-w-4xl w-full">
        {/* Circle 1: Contracts */}
        <div className="feature-circle relative z-10 w-48 h-48 md:w-64 md:h-64 rounded-full border border-[#3cb44f] flex items-center justify-center -mr-12 md:-mr-16 bg-[#000]/80 backdrop-blur-sm shadow-[0_0_30px_rgba(60,180,79,0.15)]">
          <span className="text-[#3cb44f] font-medium text-xl md:text-3xl">Contracts</span>
        </div>

        {/* Circle 2: Trust */}
        <div className="feature-circle relative z-20 w-48 h-48 md:w-64 md:h-64 rounded-full border border-[#3cb44f] flex items-center justify-center bg-[#000]/80 backdrop-blur-sm shadow-[0_0_50px_rgba(60,180,79,0.2)]">
          <span className="text-[#3cb44f] font-medium text-xl md:text-3xl font-bold">Trust</span>
        </div>

        {/* Circle 3: Legacy */}
        <div className="feature-circle relative z-10 w-48 h-48 md:w-64 md:h-64 rounded-full border border-[#3cb44f] flex items-center justify-center -ml-12 md:-ml-16 bg-[#000]/80 backdrop-blur-sm shadow-[0_0_30px_rgba(60,180,79,0.15)]">
          <span className="text-[#3cb44f] font-medium text-xl md:text-3xl">Legacy</span>
        </div>
      </div>

      {/* Description Text */}
      <div className="feature-text max-w-4xl mx-auto text-center px-4">
        <p className="text-gray-300 text-lg md:text-2xl leading-relaxed font-light tracking-wide">
          A decentralized protocol that eliminates payment risk through
          <span className="text-white font-medium"> milestone-locked escrow </span>
          and automated enforcement, while distilling every successful delivery into a
          <span className="text-white font-medium"> permanent, verifiable reputation.</span>
        </p>
      </div>
    </div>
  );
};

export default FeatureCircles;
