import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { motion } from 'motion/react';
import {
  MapPin, Building, Briefcase,
  Github, Linkedin, Instagram, Globe, Edit2, User, Link2, Eye, Sparkles
} from 'lucide-react';

interface UserProfile {
  photo?: string;
  full_name?: string;
  user_name?: string;
  email?: string;
  phone?: string;
  what_do_you_do?: string;
  short_headline?: string;
  bio?: string;
  location?: string;
  experience?: string;
  company_name?: string;
  github_link?: string;
  linkedin_link?: string;
  portfolio_link?: string;
  instagram_link?: string;
  show_profile?: boolean;
  show_projects?: boolean;
  show_contracts?: boolean;
  skills?: string[];
}

function InfoField({ label, value }: { label: string, value?: string }) {
  return (
    <div className="group">
      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.12em] mb-1.5">{label}</div>
      <div className="text-sm font-medium text-white group-hover:text-[#3cb44f]/90 transition-colors">{value || '-'}</div>
    </div>
  );
}

function LinkRow({ icon: Icon, title, subtitle, verified }: any) {
  if (!subtitle) return null;
  return (
    <motion.div
      className="flex items-center justify-between p-4 rounded-2xl mx-2 border border-transparent hover:border-[#3cb44f]/20 hover:bg-[#172b1c]/50 transition-all duration-200 cursor-default"
      whileHover={{ x: 4 }}
      transition={{ type: 'tween', duration: 0.2 }}
    >
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="w-11 h-11 rounded-2xl bg-[#0d1a10] border border-[#3cb44f]/20 flex items-center justify-center text-[#3cb44f] shrink-0 shadow-[0_0_20px_rgba(60,180,79,0.08)]">
          <Icon size={20} strokeWidth={2} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{title}</div>
          <div className="text-xs text-gray-400 truncate mt-0.5">{subtitle}</div>
        </div>
      </div>
      {verified && (
        <span className="px-2.5 py-1 rounded-lg bg-[#3cb44f]/10 text-[#3cb44f] text-[10px] font-bold border border-[#3cb44f]/25 ml-2 shrink-0">Verified</span>
      )}
    </motion.div>
  );
}

function ToggleRow({ title, desc, checked }: any) {
  return (
    <div className="flex items-start justify-between gap-4 py-1">
      <div>
        <div className="text-sm font-bold text-white mb-1.5">{title}</div>
        <div className="text-xs text-gray-400 leading-relaxed pr-4">{desc}</div>
      </div>
      <div className={`w-11 h-6 shrink-0 rounded-full flex items-center p-0.5 transition-all duration-300 border ${checked ? 'bg-[#3cb44f] border-[#3cb44f] shadow-[0_0_12px_rgba(60,180,79,0.35)]' : 'bg-[#172b1c] border-white/10'}`}>
        <motion.div
          className="w-5 h-5 bg-white rounded-full shadow-md"
          animate={{ x: checked ? 18 : 2 }}
          transition={{ type: 'spring', stiffness: 400, damping: 30 }}
        />
      </div>
    </div>
  );
}

function ReputationGauge({ score, animated }: { score: number; animated: boolean }) {
  const [normalized, setNormalized] = useState(0);
  const min = 0;
  const max = 100;

  useEffect(() => {
    if (animated) {
      const val = Math.max(0, Math.min(1, (score - min) / (max - min)));
      setNormalized(val);
    } else {
      setNormalized(0);
    }
  }, [animated, score, min, max]);

  const arcLength = 251.3;
  const offset = arcLength - normalized * arcLength;
  const rotation = -90 + normalized * 180;

  return (
    <div className="relative w-[320px] max-w-[100%] mx-auto my-4 mt-2">
      <div className="absolute inset-0 flex flex-col items-center justify-center pt-8 pointer-events-none z-0">
        <span className="text-white text-5xl mb-8 font-bold tracking-tight">{score}</span>
      </div>

      <svg viewBox="0 0 200 120" className="w-full overflow-visible">
                <defs>
                    {/* Progress arc gradient */}
                    <linearGradient id="progressGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        {/* Dark base at the bottom-left arc start (20,100) */}
                        <stop offset="0%" stopColor="#111f14" />
                        <stop offset="70%" stopColor="#3cb44f" />
                        <stop offset="100%" stopColor="#2d8a3e" />
                    </linearGradient>

                    {/* True bottom-up radial fade for the glow layer */}
                    {/* <radialGradient id="radialArcGlow" cx="20" cy="100" r="80" gradientUnits="userSpaceOnUse">
                        <stop offset="5%" stopColor="#00e676" stopOpacity="0.85" />
                        <stop offset="50%" stopColor="#00e676" stopOpacity="0.28" />
                        <stop offset="95%" stopColor="#0d140d" stopOpacity="0" />
                    </radialGradient> */}

                    {/* Subtle outer glow filter */}
                    <filter id="hueGlow" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
                        <feColorMatrix
                            in="blur"
                            type="matrix"
                            values="
                                1 0 0 0 0
                                0 1 0 0 0
                                0 0 1 0 0
                                0 0 0 0.28 0
                            "
                            result="softGlow"
                        />
                        <feMerge>
                            <feMergeNode in="softGlow" />
                        </feMerge>
                    </filter>

                    {/* Arrow shadow filter */}
                    <filter id="arrowShadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow
                            dx="0"
                            dy="1.5"
                            stdDeviation="1.6"
                            floodColor="#000000"
                            floodOpacity="0.4"
                        />
                    </filter>
                </defs>

                {/* BG fade from arc bottom start */}
                <path
                    d="M20 100 A80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#radialArcGlow)"
                    strokeWidth="26"
                    strokeLinecap="round"
                    opacity="0.7"
                />

                {/* Subtle glow layer over main arc using the same bottom-up concept */}
                <path
                    d="M20 100 A80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="22"
                    strokeLinecap="round"
                    filter="url(#hueGlow)"
                    opacity={0.45}
                    style={{
                        strokeDasharray: arcLength,
                        strokeDashoffset: offset,
                        transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                />

                {/* Core progress arc */}
                <path
                    d="M20 100 A80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    style={{
                        strokeDasharray: arcLength,
                        strokeDashoffset: offset,
                        transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                />

                {/* Arrow Pointer Group */}
                <g
                    style={{
                        transformOrigin: "100px 100px",
                        transform: `rotate(${rotation}deg)`,
                        transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                >
                    {/* Arrow */}
                    <path
                        d="M 100 80 L 88 108 L 100 100 L 112 108 Z"
                        fill="#ffffff"
                        opacity={0.9}
                        filter="url(#arrowShadow)"
                    />
                </g>
            </svg>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [animated, setAnimated] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setAnimated(true), 300);
    return () => clearTimeout(t);
  }, []);


  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/users/me');
        const apiData = res.data?.data || res.data;
        const nested = apiData.profile || {};
        setProfile({ ...apiData, ...nested } as UserProfile);
      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center flex-col gap-5 items-center min-h-[60vh] bg-[#000] text-[#3cb44f] font-semibold text-sm">
        <div className="w-10 h-10 rounded-full border-2 border-[#3cb44f]/30 border-t-[#3cb44f] animate-spin" />
        <span className="text-gray-400 font-medium">Loading profile...</span>
      </div>
    );
  }

  const data = profile || {};

  return (
    <motion.div
      className="h-full w-full pt-20 bg-[#000] overflow-y-auto scrBar text-white font-sans"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <div className="w-full max-w-full mx-auto px-4 md:px-8 space-y-8">

        {/* HERO CARD */}
        <motion.div
          className="bg-[radial-gradient(circle_at_top,_#3cb44f_0,_#05030d_55%,_#000000_100%)] rounded-[40px] p-8 sm:p-10 border border-white/[0.06]  relative overflow-hidden "
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        >
           <motion.div
            className="pointer-events-none absolute -top-40 -left-10 h-96 w-96 rounded-full bg-[#3cb44f] blur-3xl"
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -top-40 left-40 h-96 w-96 rounded-full bg-[#3cb44f] blur-3xl"
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -top-40 right-50 h-96 w-96 rounded-full bg-[#3cb44f] blur-3xl"
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -top-50 -right-0 h-96 w-96 rounded-full bg-[#3cb44f] blur-3xl"
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <motion.div
            className="pointer-events-none absolute -top-50 right-1/2 h-96 w-96 rounded-full bg-[#3cb44f] blur-3xl"
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          {/* Subtle top gradient band */}
          <div
            className="absolute top-0 left-0 right-0 h-32 pointer-events-none opacity-40"
            style={{
              background: 'linear-gradient(180deg, rgba(60,180,79,0.12) 0%, transparent 100%)',
              maskImage: 'linear-gradient(to bottom, black, transparent)',
              WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)',
            }}
          />
          <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[#3cb44f]/5 blur-3xl pointer-events-none" />

          {/* HEADER */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 relative z-10">
            {/* <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <span className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-[#3cb44f]/10 text-[#3cb44f] text-xs font-semibold border border-[#3cb44f]/25 shadow-[0_0_20px_rgba(60,180,79,0.08)]">
                <ShieldCheck size={14} strokeWidth={2.5} /> Public profile verified
              </span>
              <span className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white/5 text-gray-300 text-xs font-medium border border-white/10">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" /> Open for collaborations
              </span>
            </div> */}
            <button
              onClick={() => navigate('/profile/edit')}
              className="absolute right-0 top-0 items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-[#3cb44f]/15 text-white text-sm font-semibold transition-all border border-white/10 hover:border-[#3cb44f]/30 cursor-pointer shadow-sm"
            >
              <span className="text-white text-sm font-semibold flex items-center gap-2">
              <Edit2 size={16} strokeWidth={2} /> Edit Profile
              </span>
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">

            {/* LEFT: Profile overview */}
            <motion.div
              className="lg:col-span-8 flex flex-col justify-between"
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
            >
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8 -mt-10">
                <div className="w-32 h-32 rounded-3xl bg-[#172b1c] border-2 border-[#3cb44f]/25 overflow-hidden shrink-0 shadow-[0_0_40px_rgba(60,180,79,0.12)] ring-2 ring-[#3cb44f]/10">
                  {data.photo ? <img src={data.photo} alt="" className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[#3cb44f]/50"><User size={48} /></div>}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-[#3cb44f] text-[10px] font-bold uppercase tracking-[0.2em] mb-2">{data.what_do_you_do}</p>
                  <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight leading-tight">{data.full_name}</h1>
                  <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">{data.short_headline}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-8 pt-6 border-t border-white/[0.06]">
                {[
                  { Icon: Building, text: data.company_name || '-' },
                  { Icon: MapPin, text: data.location || '-' },
                  { Icon: Briefcase, text: data.experience || '-' },
                ].map(({ Icon, text }, i) => (
                  <span key={i} className="flex items-center gap-2 px-4 py-2 bg-[#0d1a10]/80 rounded-2xl border border-white/5 text-xs text-gray-300 font-medium">
                    <Icon size={14} className="text-[#3cb44f]/80 shrink-0" /> {text}
                  </span>
                ))}
              </div>
            </motion.div>

            {/* RIGHT: Reputation card */}
          

          </div>
        </motion.div>

        {/* MAIN 2-COL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 pb-4 -mt-6">

          {/* LEFT: Personal Details & Verified Links */}
          <div className="lg:col-span-8 space-y-2">
            <motion.div
              className="bg-[#111f14] rounded-[40px]   overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between p-6 sm:px-8 border-b border-white/[0.06] bg-[#0d1a10]/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><User size={20} className="text-[#3cb44f]" /> Personal details</h3>
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Public identity</span>
              </div>
              <div className="p-6 sm:p-8 space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                  <InfoField label="Username" value={data.user_name} />
                  <InfoField label="What do you do" value={data.what_do_you_do} />
                  <InfoField label="Short headline" value={data.short_headline} />
                  <InfoField label="Location" value={data.location} />
                  <InfoField label="Experience" value={data.experience} />
                  <InfoField label="Company Name" value={data.company_name} />
                  <InfoField label="Phone" value={data.phone as string | undefined} />
                </div>

                {/* {data.bio && (
                  <div className="pt-2 border-t border-white/[0.06]">
                    <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.12em] mb-1.5">
                      Bio
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed">
                      {data.bio}
                    </p>
                  </div>
                )} */}
              </div>
            </motion.div>

            <motion.div
              className="bg-[#111f14] rounded-[40px]   overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.28, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06] bg-[#0d1a10]/50 mb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Link2 size={20} className="text-[#3cb44f]" /> Verified links</h3>
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Identity & presence</span>
              </div>
              <div className="space-y-1 p-4">
                <LinkRow icon={Github} title="GitHub" subtitle={data.github_link} />
                <LinkRow icon={Linkedin} title="LinkedIn" subtitle={data.linkedin_link} />
                <LinkRow icon={Globe} title="Portfolio" subtitle={data.portfolio_link} />
                <LinkRow icon={Instagram} title="Instagram" subtitle={data.instagram_link} />
              </div>
            </motion.div>
          </div>

          {/* RIGHT: Skills & Visibility */}
          <div className="lg:col-span-4 space-y-2">
          <motion.div
              className="lg:col-span-4 bg-[#111f14] rounded-[32px] p-8   flex flex-col justify-between backdrop-blur-sm"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Reputation Score</h3>
              </div>
              <div>
                <div className="flex flex-col items-center justify-center relative my-4">
                  <ReputationGauge score={82} animated={animated} />
                </div>
                <p className="text-xs text-center text-gray-400 leading-relaxed mb-6 mt-2">Your score grows as profile details stay complete, links remain verified, and projects stay visible.</p>
              </div>
              {/* <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-[11px] text-gray-300 font-semibold">
                <div className="flex items-center gap-2"><Check size={16} className="text-[#3cb44f] shrink-0" /> Photo uploaded</div>
                <div className="flex items-center gap-2"><Check size={16} className="text-[#3cb44f] shrink-0" /> Bio added</div>
                <div className="flex items-center gap-2"><Check size={16} className="text-[#3cb44f] shrink-0" /> Projects public</div>
              </div> */}
            </motion.div>
            

            <motion.div
              className="bg-[#111f14] rounded-[40px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.32, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06] bg-[#0d1a10]/50 mb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Eye size={20} className="text-[#3cb44f]" /> Visibility settings</h3>
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">What others see</span>
              </div>
              <div className="px-6 pb-6 pt-4 space-y-5">
                <ToggleRow title="Show profile" desc="Your public profile is visible and included in search." checked={data.show_profile !== false} />
                <div className="w-full h-px bg-white/[0.06]" />
                <ToggleRow title="Show projects" desc="Published projects are visible and boost reputation." checked={data.show_projects !== false} />
                <div className="w-full h-px bg-white/[0.06]" />
                <ToggleRow title="Show contracts" desc="Contract history appears in your trust summary." checked={data.show_contracts !== false} />
              </div>
            </motion.div>
            <motion.div
              className="bg-[#111f14] rounded-[40px] overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.24, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-between p-6 border-b border-white/[0.06] bg-[#0d1a10]/50 mb-2">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Sparkles size={20} className="text-[#3cb44f]" /> Skills</h3>
                <span className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider">Specialties</span>
              </div>
              <div className="flex flex-wrap gap-2.5 px-6 pb-6 pt-4">
                {data.skills && data.skills.length > 0 ? data.skills.map((skill: string) => (
                  <span key={skill} className="px-4 py-2 bg-[#172b1c] text-gray-200 border border-white/5 text-xs font-semibold rounded-xl hover:border-[#3cb44f]/30 hover:text-[#3cb44f]/90 transition-all cursor-default">
                    {skill}
                  </span>
                )) : <span className="text-sm text-gray-500">No skills added.</span>}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

