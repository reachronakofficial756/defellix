import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import Lenis from 'lenis';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { motion } from 'framer-motion';

import Hero from '../components/landing/Hero';
import DotMatrix from '../components/landing/DotMatrix';
import HowItWorks from '../components/landing/HowItWorks';
import ScrollingCards from '../components/landing/ScrollingCards';
import CircularSlider from '../components/landing/CircularSlider';
import FeatureSlider from '../components/landing/FeatureSlider';
import CallToAction from '../components/landing/CallToAction';
import Footer from '../components/landing/Footer';
import BetaLaunchLink from '../components/landing/BetaLaunchLink';
import noiseImg from '../assets/noise.webp';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const { isAuthenticated, isProfileComplete, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showNav, setShowNav] = useState(true);
  const lenisRef = useRef<Lenis | null>(null);

  // If the user is already fully logged-in, skip the landing page
  useEffect(() => {
    if (!isLoading && isAuthenticated && isProfileComplete) {
      navigate('/dashboard', { replace: true });
    }
  }, [isLoading, isAuthenticated, isProfileComplete, navigate]);

  // Lenis smooth scroll + navbar hide/show logic
  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      infinite: false,
    });
    lenisRef.current = lenis;

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    let idleTimeout: ReturnType<typeof setTimeout>;

    lenis.on('scroll', (e: any) => {
      ScrollTrigger.update();

      const isScrollingDown = e.velocity > 0;
      const isScrollingUp = e.velocity < 0;
      const threshold = 80; // px after which nav is allowed to hide

      if (e.scroll <= threshold) {
        setShowNav(true);
        clearTimeout(idleTimeout);
        return;
      }

      if (isScrollingDown && e.scroll > threshold) {
        // hide when actively scrolling down past threshold
        setShowNav(false);
        clearTimeout(idleTimeout);
      } else if (isScrollingUp) {
        // show only while actively scrolling up, then hide on inactivity
        setShowNav(true);
        clearTimeout(idleTimeout);
        idleTimeout = setTimeout(() => {
          setShowNav(false);
        }, 2000);
      }
    });

    const handleMouseMove = (e: MouseEvent) => {
      if (e.clientY < 90) {
        setShowNav(true);
        clearTimeout(idleTimeout);
        if (window.scrollY > 80) {
          idleTimeout = setTimeout(() => setShowNav(false), 2500);
        }
      }
    };
    window.addEventListener('mousemove', handleMouseMove);

    gsap.ticker.add((time) => {
      lenis.raf(time * 1000);
    });

    gsap.ticker.lagSmoothing(0);

    document.documentElement.classList.add('lenis');

    return () => {
      lenisRef.current = null;
      lenis.destroy();
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000);
      });
      document.documentElement.classList.remove('lenis');
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(idleTimeout);
    };
  }, []);

  const scrollToTop = () => {
    lenisRef.current?.scrollTo(0, { duration: 1.15 });
  };

  return (
    <div className="min-h-screen bg-black selection:bg-accent selection:text-primary">
      {/* Global Noise Overlay */}
      <div
        className="fixed top-0 left-0 w-[150vw] h-[150vw] pointer-events-none z-[9999] opacity-[0.14] mix-blend-overlay"
        style={{
          backgroundImage: `url(${noiseImg})`,
          backgroundRepeat: 'repeat',
          backgroundSize: '144px',
          filter: 'brightness(60%)',
          transform: 'translate3d(0, 0, 0)',
        }}
      />

      {/* Navigation */}
      <motion.nav
        initial={{ y: 0, opacity: 1 }}
        animate={{ y: showNav ? 0 : -80, opacity: showNav ? 1 : 0 }}
        transition={{ duration: 0.5, ease: [0.25, 0.1, 0.25, 1] }}
        className="fixed top-0 inset-x-0 h-20 z-[100] px-6 bg-black/10 backdrop-blur-md pointer-events-none"
      >
        <div className="max-w-8xl mx-20 h-full flex items-center justify-between pointer-events-auto">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={scrollToTop}
              className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/80"
              aria-label="Scroll to top"
            >
              <img
                src="/logo.svg"
                alt="Defellix"
                className="h-28 w-28 md:h-56 md:w-56 -ml-4 md:-ml-8"
              />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            {isAuthenticated && isProfileComplete ? (
              <NavLink
                to="/dashboard"
                className="px-8 cursor-pointer py-3 bg-accent border border-accent/40 rounded-full text-[11px] font-black uppercase tracking-[.25em] text-black hover:bg-accent/30 transition-colors"
              >
                Dashboard
              </NavLink>
            ) : (
              <>
                <BetaLaunchLink variant="nav" />
                {/* <NavLink
                  to="/login"
                  className="text-[11px] font-bold uppercase tracking-[.2em] text-white/60 hover:text-white transition-colors px-2"
                >
                  Sign in
                </NavLink> */}
              </>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2 shrink-0">
            {isAuthenticated && isProfileComplete ? (
              <NavLink
                to="/dashboard"
                className="px-4 py-2 bg-accent border border-accent/40 rounded-full text-[10px] font-black uppercase tracking-[.2em] text-black"
              >
                Dashboard
              </NavLink>
            ) : (
              <>
                <BetaLaunchLink variant="nav" className="!px-4 !py-2.5 !text-[9px]" />
                <NavLink
                  to="/login"
                  className="text-[10px] font-bold uppercase tracking-[.15em] text-white/70 px-1"
                >
                  Sign in
                </NavLink>
              </>
            )}
          </div>
        </div>
      </motion.nav>

      <main>
        <Hero />
        {/* <TrustBanner /> */}
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
          {/* <ScrollTestimonials /> */}
        </div>

        {/* <CustomerStoryCard /> */}
        <CallToAction />
      </main>

      <Footer />
    </div>
  );
};

export default LandingPage;
