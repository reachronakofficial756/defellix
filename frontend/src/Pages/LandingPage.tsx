import { NavLink } from 'react-router-dom';
import Hero from '../components/landing/Hero';
import TrustBanner from '../components/landing/TrustBanner';
import PainSolution from '../components/landing/PainSolution';
import FeatureBento from '../components/landing/FeatureBento';
import HowItWorks from '../components/landing/HowItWorks';
import ScrollingCards from '../components/landing/ScrollingCards';
import MarketplaceTabs from '../components/landing/MarketplaceTabs';
import Testimonials from '../components/landing/Testimonials';
import Footer from '../components/landing/Footer';

const LandingPage = () => {
  return (
    <div className="min-h-screen bg-primary scroll-smooth selection:bg-accent selection:text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 h-24 z-[100] px-6 lg:px-12 pointer-events-none">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-accent flex items-center justify-center shadow-[0_0_20px_rgba(34,197,94,0.3)]">
               <div className="w-4 h-4 rounded-sm bg-primary transform rotate-45" />
            </div>
            <span className="text-2xl font-black tracking-tighter text-white">DEFELLIX</span>
          </div>

          <div className="hidden md:flex items-center gap-10">
             <a href="#features" className="text-[11px] font-black uppercase tracking-[.25em] text-slate-400 hover:text-accent transition-colors">Features</a>
             <a href="#how" className="text-[11px] font-black uppercase tracking-[.25em] text-slate-400 hover:text-accent transition-colors">How it works</a>
             <a href="#reviews" className="text-[11px] font-black uppercase tracking-[.25em] text-slate-400 hover:text-accent transition-colors">Verification</a>
             <NavLink to="/login" className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-[.25em] text-white hover:bg-white/10 transition-colors">Sign In</NavLink>
          </div>

          <div className="md:hidden">
             <div className="w-8 h-8 rounded-lg bg-secondary border border-white/10 flex items-center justify-center">
                <div className="w-4 h-0.5 bg-white" />
             </div>
          </div>
        </div>
      </nav>

      <main>
        <Hero />
        
        <div id="how">
           <HowItWorks />
        </div>

        <ScrollingCards />
        
        <MarketplaceTabs />
        
        <div id="reviews">
           <Testimonials />
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
