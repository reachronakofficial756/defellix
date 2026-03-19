import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Hero from '../components/landing/Hero';
import TrustBanner from '../components/landing/TrustBanner';
import DotMatrix from '../components/landing/DotMatrix';
import HowItWorks from '../components/landing/HowItWorks';
import ScrollingCards from '../components/landing/ScrollingCards';
import CircularSlider from '../components/landing/CircularSlider';
import FeatureSlider from '../components/landing/FeatureSlider';
import ScrollTestimonials from '../components/landing/ScrollTestimonials';
import CustomerStoryCard from '../components/landing/CustomerStoryCard';
import CallToAction from '../components/landing/CallToAction';
import Footer from '../components/landing/Footer';

const LandingPage = () => {
  const { isAuthenticated, isProfileComplete, isLoading } = useAuth();
  const navigate = useNavigate();

  // If the user is already fully logged-in, skip the landing page
  useEffect(() => {
    if (!isLoading && isAuthenticated && isProfileComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, isProfileComplete, navigate]);

  return (
    <div className="min-h-screen bg-primary scroll-smooth selection:bg-accent selection:text-primary">
      {/* Navigation */}
      <nav className="fixed top-0 inset-x-0 h-24 z-[100] px-6 lg:px-12 pointer-events-none">
        <div className="max-w-7xl mx-auto h-full flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <img src="/logo.svg" alt="Defellix Logo" className="h-48 w-48" />
          </div>

          <div className="hidden md:flex items-center gap-10">
             <a href="#features" className="text-[11px] font-black uppercase tracking-[.25em] text-slate-400 hover:text-accent transition-colors">Features</a>
             <a href="#how" className="text-[11px] font-black uppercase tracking-[.25em] text-slate-400 hover:text-accent transition-colors">How it works</a>
             <a href="#reviews" className="text-[11px] font-black uppercase tracking-[.25em] text-slate-400 hover:text-accent transition-colors">Verification</a>
             {isAuthenticated && isProfileComplete ? (
               <NavLink to="/dashboard" className="px-8 py-3 bg-accent/20 border border-accent/40 rounded-xl text-[11px] font-black uppercase tracking-[.25em] text-accent hover:bg-accent/30 transition-colors">
                 Dashboard
               </NavLink>
             ) : (
               <NavLink to="/login" className="px-8 py-3 bg-white/5 border border-white/10 rounded-xl text-[11px] font-black uppercase tracking-[.25em] text-white hover:bg-white/10 transition-colors">
                 Sign In
               </NavLink>
             )}
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
        <TrustBanner />
        <DotMatrix />
        
        <div id="how">
           <HowItWorks />
        </div>

        <div id="features">
          <ScrollingCards />
          <CircularSlider />
          <FeatureSlider />
        </div>
        
        <div id="reviews">
           <ScrollTestimonials />
        </div>
        
        <CustomerStoryCard />
        <CallToAction />
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
