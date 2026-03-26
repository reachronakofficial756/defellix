import { NavLink, useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
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
import noiseImg from '../assets/noise.webp';

gsap.registerPlugin(ScrollTrigger);

const LandingPage = () => {
  const { isAuthenticated, isProfileComplete, isLoading } = useAuth();
  const navigate = useNavigate();
  const [showNav, setShowNav] = useState(true);

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
      lenis.destroy();
      gsap.ticker.remove((time) => {
        lenis.raf(time * 1000);
      });
      document.documentElement.classList.remove('lenis');
      window.removeEventListener('mousemove', handleMouseMove);
      clearTimeout(idleTimeout);
    };
  }, []);

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
            <img
              src="/logo.svg"
              alt="Defellix Logo"
              className="h-28 w-28 md:h-56 md:w-56 -ml-4 md:-ml-8"
            />
          </div>

          <div className="hidden md:flex items-center gap-10">
            {isAuthenticated && isProfileComplete ? (
              <NavLink
                to="/dashboard"
                className="px-8 cursor-pointer py-3 bg-accent border border-accent/40 rounded-full text-[11px] font-black uppercase tracking-[.25em] text-black hover:bg-accent/30 transition-colors"
              >
                Dashboard
              </NavLink>
            ) : (
              <NavLink
                to="/login"
                className="px-8 cursor-pointer py-3 bg-accent border border-white/10 rounded-full text-[11px] font-black uppercase tracking-[.25em] text-black hover:bg-black hover:text-accent hover:border-accent transition-colors duration-300"
              >
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
