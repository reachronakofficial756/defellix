import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { gsap } from 'gsap';
import { useContractsStore } from '../store/useContractsStore';
import { X, Clock, DollarSign, CheckCircle, AlertCircle, RotateCcw, FileText, User, Calendar } from 'lucide-react';

const CONTRACTS = [
  {
    id: 1,
    title: 'E-Commerce React Frontend',
    client: 'TechNova Solutions',
    status: 'Active' as const,
    date: 'Oct 2024 – Mar 2025',
    budget: '$12,500',
    completion: 60,
    milestone: '2 / 4',
    tags: ['React', 'Next.js', 'Stripe', 'Tailwind'],
    details: 'Building a fully responsive, high-performance storefront using Next.js, Framer Motion, and Tailwind CSS. The project involves complex state management, real-time cart updates, and integrating Stripe for payments. Phase 1 deliverables included wireframes and initial component architecture.',
    milestones: [
      { label: 'Design Wireframes', done: true },
      { label: 'Component Architecture', done: true },
      { label: 'API Integration', done: false },
      { label: 'Checkout & Deploy', done: false },
    ]
  },
  {
    id: 2,
    title: 'Mobile Banking App UI',
    client: 'FinVanguard',
    status: 'In Review' as const,
    date: 'Nov 2024 – Apr 2025',
    budget: '$18,000',
    completion: 90,
    milestone: '5 / 5',
    tags: ['Figma', 'React Native', 'Lottie'],
    details: 'Designing the user interface for a neobank targeting Gen-Z users. The scope includes dark mode by default, complex animations using Lottie, and a highly intuitive dashboard for tracking expenses. Development handoff expects detailed Figma specifications with functional prototypes.',
    milestones: [
      { label: 'UX Research & Flow', done: true },
      { label: 'High-Fi Mockups', done: true },
      { label: 'Prototype Animation', done: true },
      { label: 'Dev Handoff Specs', done: true },
      { label: 'Final Review', done: false },
    ]
  },
  {
    id: 3,
    title: 'SaaS Dashboard Design',
    client: 'CloudSync',
    status: 'Delayed' as const,
    date: 'Dec 2024 – May 2025',
    budget: '$8,200',
    completion: 25,
    milestone: '1 / 3',
    tags: ['D3.js', 'React', 'TypeScript'],
    details: 'A B2B dashboard for managing cloud infrastructure visually. Includes drag-and-drop server configuration screens, real-time analytics graphs utilizing D3.js, and complex data grids. The project is currently delayed pending finalization of backend API structures.',
    milestones: [
      { label: 'Information Architecture', done: true },
      { label: 'Dashboard Components', done: false },
      { label: 'Data Binding & Charts', done: false },
    ]
  },
  {
    id: 4,
    title: 'AI Video Generator',
    client: 'Visionary AI',
    status: 'Active' as const,
    date: 'Jan 2025 – Jun 2025',
    budget: '$25,000',
    completion: 40,
    milestone: '2 / 5',
    tags: ['Fabric.js', 'WebSockets', 'React'],
    details: 'Developing the frontend for a generative AI platform that converts text to professional video output. Core challenges include handling long-polling server responses, web socket integration for progress streaming, and a highly interactive video timeline editor built with Fabric.js.',
    milestones: [
      { label: 'Prompt Input & UI Shell', done: true },
      { label: 'WebSocket Streaming', done: true },
      { label: 'Video Timeline Editor', done: false },
      { label: 'Export & Rendering Flow', done: false },
      { label: 'QA & Launch', done: false },
    ]
  },
];

const statusConfig = {
  Active: { color: '#00e676', bg: 'bg-[#00e676]/10', text: 'text-[#00e676]', border: 'border-[#00e676]/30', Icon: CheckCircle },
  'In Review': { color: '#fbc02d', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', Icon: RotateCcw },
  Delayed: { color: '#ef5350', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', Icon: AlertCircle },
};

export default function ContractsOverlay() {
  const { closeContracts } = useContractsStore();
  const [activeIndex, setActiveIndex] = useState(0);

  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);

  const active = CONTRACTS[activeIndex];
  const cfg = statusConfig[active.status];

  // ─── GSAP page entrance ───────────────────────────────────────────────────
  useEffect(() => {
    if (!pageRef.current) return;
    const tl = gsap.timeline();
    tl.fromTo(pageRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }
    );
    tl.fromTo(headerRef.current,
      { opacity: 0, y: -16 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.25'
    );
    tl.fromTo(tabsRef.current,
      { opacity: 0, y: 16 },
      { opacity: 1, y: 0, duration: 0.35, ease: 'power2.out' }, '-=0.2'
    );
    tl.fromTo(detailsRef.current,
      { opacity: 0, y: 24 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, '-=0.15'
    );
  }, []);

  // ─── Animate details panel in when activeIndex changes ────────────────────
  useEffect(() => {
    if (!detailsRef.current) return;
    gsap.fromTo(detailsRef.current,
      { opacity: 0, y: 18 },
      { opacity: 1, y: 0, duration: 0.4, ease: 'power2.out' }
    );
  }, [activeIndex]);

  // ─── Scroll-to shrink title on the details panel ─────────────────────────
  const detailsScrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ container: detailsScrollRef });
  const titleScale = useTransform(scrollYProgress, [0, 0.15], [1, 0.72]);
  const titleY = useTransform(scrollYProgress, [0, 0.15], [0, -12]);

  return (
    <motion.div
      ref={pageRef}
      className="h-full bg-[#0f1117] flex flex-col overflow-hidden"
    >
      {/* ─── Header ──────────────────────────────────────────────────────── */}
      <div ref={headerRef} className="relative z-10 flex items-center justify-between px-10 pt-7 pb-3 shrink-0">
        <div>
          <p className="text-[#00e676] text-xs font-semibold tracking-widest uppercase mb-1">Defellix</p>
          <h1 className="text-2xl font-bold text-white tracking-tight">Contracts</h1>
        </div>
        <span className="text-sm text-gray-500">{CONTRACTS.length} contracts</span>
      </div>

      {/* ─── Contract Tabs Row ───────────────────────────────────────────── */}
      <div ref={tabsRef} className="relative z-10 shrink-0 px-10 pt-2">
        {/* Tabs — horizontally centered */}
        <div className="flex gap-3 overflow-x-auto pb-0 no-scrollbar justify-center">
          {CONTRACTS.map((c, i) => {
            const s = statusConfig[c.status];
            const isActive = i === activeIndex;
            return (
              <motion.button
                key={c.id}
                onClick={() => setActiveIndex(i)}
                whileHover={{ scale: isActive ? 1 : 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`relative shrink-0 text-left px-5 py-4 border-l border-r border-t transition-all duration-300 cursor-pointer ${isActive
                  ? 'border-[#00e676]/40 bg-[#161b27] rounded-t-2xl'
                  : 'border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5 rounded-t-2xl'
                  }`}
                style={{
                  minWidth: '210px',
                  borderBottom: isActive ? 'none' : undefined,
                  marginBottom: isActive ? '-1px' : '0px',
                  zIndex: isActive ? 20 : 10,
                }}
              >
                {/* Active glow border (top + sides only) */}
                {isActive && (
                  <motion.div
                    layoutId="active-tab-border"
                    className="absolute inset-0 rounded-t-2xl border-l border-r border-t border-[#00e676]/50 pointer-events-none"
                    style={{ borderBottom: 'none', bottom: '-1px' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}

                {/* Status dot */}
                <div className="flex items-center gap-2 mb-3">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: s.color, boxShadow: isActive ? `0 0 6px ${s.color}` : 'none' }}
                  />
                  <span className={`text-xs font-semibold ${s.text}`}>{c.status}</span>
                </div>

                <p className={`text-sm font-bold leading-snug mb-1 ${isActive ? 'text-white' : 'text-gray-300'}`}>
                  {c.title}
                </p>
                <p className="text-xs text-gray-500">{c.client}</p>

                {/* Mini progress bar */}
                <div className="mt-3 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${c.completion}%`, backgroundColor: s.color }}
                  />
                </div>
                <p className="mt-1 text-[10px] text-gray-600 font-medium">{c.completion}% complete</p>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ─── Active Contract Detail Panel ───────────────────────────────── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeIndex}
          ref={detailsRef}
          className="relative z-10 flex-1 mx-10 mb-6 border overflow-hidden"
          style={{
            borderColor: 'rgba(0,230,118,0.18)',
            background: 'linear-gradient(135deg, rgba(22,27,39,0.95) 0%, rgba(15,17,23,0.98) 100%)',
            borderRadius: activeIndex === 0
              ? '0 24px 24px 24px'
              : activeIndex === CONTRACTS.length - 1
                ? '24px 0 24px 24px'
                : '24px 24px 24px 24px',
          }}
        >
          {/* Scrollable details container */}
          <div ref={detailsScrollRef} className="h-full overflow-y-auto scrBar">

            {/* Sticky top bar */}
            <div className="sticky top-0 z-20 flex items-center justify-between px-8 py-4 backdrop-blur-xl"
              style={{ background: 'linear-gradient(to bottom, rgba(15,17,23,0.97) 80%, transparent)' }}
            >
              <motion.h2
                ref={titleRef}
                style={{ scale: titleScale, transformOrigin: 'left center', y: titleY }}
                className="text-lg font-bold text-white"
              >
                {active.title}
              </motion.h2>

              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
                  {active.status}
                </span>
              </div>
            </div>

            {/* ─── HERO ROW ── large title + key stats ─── */}
            <div className="px-8 pb-6">
              <h2 className="text-4xl md:text-5xl font-bold text-white leading-tight mb-2">
                {active.title}
              </h2>
              <p className="text-gray-400 text-base mb-8">{active.client}</p>

              {/* Stats strip */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                {[
                  { icon: DollarSign, label: 'Value', value: active.budget, color: '#00e676' },
                  { icon: Calendar, label: 'Timeline', value: active.date, color: '#60a5fa' },
                  { icon: FileText, label: 'Milestones', value: active.milestone, color: '#a78bfa' },
                  { icon: User, label: 'Client', value: active.client, color: '#f9a8d4' },
                ].map(({ icon: Icon, label, value, color }) => (
                  <div key={label} className="bg-white/4 rounded-2xl p-5 border border-white/6 flex flex-col gap-3">
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                      <Icon size={17} style={{ color }} />
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs font-medium mb-0.5">{label}</p>
                      <p className="text-white font-bold text-sm truncate">{value}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Progress bar — full width */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-2">
                  <p className="text-gray-400 text-sm font-medium">Overall Progress</p>
                  <p className="font-bold text-sm" style={{ color: cfg.color }}>{active.completion}%</p>
                </div>
                <div className="h-2.5 bg-white/8 rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${active.completion}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut', delay: 0.2 }}
                    className="h-full rounded-full"
                    style={{ backgroundColor: cfg.color, boxShadow: `0 0 10px ${cfg.color}55` }}
                  />
                </div>
              </div>

              {/* ─── Two-column layout ─── */}
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">

                {/* Description */}
                <div className="lg:col-span-3 space-y-6">
                  <div>
                    <h3 className="text-white font-semibold text-base mb-3">Project Overview</h3>
                    <p className="text-gray-400 leading-relaxed text-sm">{active.details}</p>
                  </div>

                  {/* Tags */}
                  <div>
                    <h3 className="text-white font-semibold text-base mb-3">Tech Stack</h3>
                    <div className="flex flex-wrap gap-2">
                      {active.tags.map(tag => (
                        <span key={tag} className="px-3 py-1.5 rounded-xl bg-white/6 border border-white/8 text-gray-300 text-xs font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Milestones */}
                  <div>
                    <h3 className="text-white font-semibold text-base mb-4">Milestones</h3>
                    <div className="space-y-3">
                      {active.milestones.map((m, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -12 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: 0.05 * i + 0.3 }}
                          className="flex items-center gap-4 p-4 rounded-xl border border-white/6 bg-white/3"
                        >
                          <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${m.done ? 'bg-[#00e676]/15' : 'bg-white/6 border border-white/10'}`}>
                            {m.done
                              ? <CheckCircle size={14} className="text-[#00e676]" />
                              : <span className="text-gray-600 text-xs font-bold">{String(i + 1).padStart(2, '0')}</span>
                            }
                          </div>
                          <span className={`text-sm font-medium ${m.done ? 'text-white' : 'text-gray-500'}`}>{m.label}</span>
                          {m.done && <span className="ml-auto text-[10px] text-[#00e676] font-semibold uppercase tracking-wider">Done</span>}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Sidebar */}
                <div className="lg:col-span-2 space-y-4">
                  {/* Status card */}
                  <div className="rounded-2xl border border-white/8 p-6 bg-white/3 space-y-5">
                    <div className="flex items-center gap-3">
                      <cfg.Icon size={18} style={{ color: cfg.color }} />
                      <span className="text-white font-semibold text-sm">Contract Status</span>
                    </div>
                    <div className={`p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
                      <p className={`font-bold text-lg ${cfg.text}`}>{active.status}</p>
                      <p className="text-gray-500 text-xs mt-1">Last updated today</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Contract Value</p>
                      <p className="text-3xl font-bold text-white">{active.budget}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 text-xs mb-1">Timeline</p>
                      <p className="text-white text-sm font-medium">{active.date}</p>
                    </div>
                  </div>

                  {/* Timeline dots */}
                  <div className="rounded-2xl border border-white/8 p-6 bg-white/3">
                    <h4 className="text-white font-semibold text-sm mb-4 flex items-center gap-2">
                      <Clock size={15} className="text-gray-400" /> Activity
                    </h4>
                    <div className="space-y-4 relative before:content-[''] before:absolute before:left-[7px] before:top-0 before:bottom-0 before:w-px before:bg-white/8">
                      {['Contract signed', 'Kicked off phase 1', 'Milestone review', 'Ongoing work'].map((a, i) => (
                        <div key={i} className="flex items-start gap-4 pl-5 relative">
                          <div className="absolute left-0 top-1 w-3.5 h-3.5 rounded-full bg-[#161b27] border-2 shrink-0" style={{ borderColor: i === 0 ? cfg.color : 'rgba(255,255,255,0.12)' }} />
                          <div>
                            <p className="text-white text-xs font-medium">{a}</p>
                            <p className="text-gray-600 text-[10px] mt-0.5">{i === 0 ? 'Jan 2025' : i === 1 ? 'Feb 2025' : i === 2 ? 'Mar 2025' : 'Now'}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA */}
                  <button
                    className="w-full py-4 rounded-2xl font-bold text-sm transition-all duration-200 cursor-pointer"
                    style={{
                      background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}12)`,
                      border: `1px solid ${cfg.color}40`,
                      color: cfg.color,
                    }}
                    onMouseEnter={e => (e.currentTarget.style.background = `${cfg.color}22`)}
                    onMouseLeave={e => (e.currentTarget.style.background = `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}12)`)}
                  >
                    Manage Contract →
                  </button>

                  {/* Back to Dashboard */}
                  <button
                    onClick={closeContracts}
                    className="w-full py-3 rounded-2xl font-semibold text-sm text-gray-500 hover:text-white border border-white/8 hover:border-white/20 bg-white/3 hover:bg-white/6 transition-all duration-200 cursor-pointer"
                  >
                    ← Back to Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </motion.div>
  );
}
