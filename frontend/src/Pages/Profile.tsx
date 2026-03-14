import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import {
  MapPin, Clock, Building, Briefcase,
  ShieldCheck, Check, Github, Linkedin, Instagram, Globe, Edit2
} from 'lucide-react';

interface UserProfile {
  photo?: string;
  user_name?: string;
  what_do_you_do?: string;
  short_headline?: string;
  bio?: string;
  location?: string;
  experience?: string;
  timezone?: string;
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
    <div>
      <div className="text-[10px] text-gray-500 font-bold uppercase tracking-[0.15em] mb-1.5">{label}</div>
      <div className="text-sm font-medium text-white">{value || '—'}</div>
    </div>
  );
}

function LinkRow({ icon: Icon, title, subtitle, verified }: any) {
  if (!subtitle) return null;
  return (
    <div className="flex items-center justify-between p-4 hover:bg-white/[0.02] transition-colors rounded-xl mx-2 border border-transparent hover:border-white/5">
      <div className="flex items-center gap-4 overflow-hidden">
        <div className="w-10 h-10 rounded-xl bg-[#172b1c] border border-white/5 flex items-center justify-center text-[#3cb44f]/70 shrink-0">
          <Icon size={18} />
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white truncate">{title}</div>
          <div className="text-xs text-gray-500 truncate mt-0.5">{subtitle}</div>
        </div>
      </div>
      {verified && (
        <div className="px-2 py-1 rounded bg-[#3cb44f]/10 text-[#3cb44f] text-[10px] font-bold border border-[#3cb44f]/20 ml-2 shrink-0">Verified</div>
      )}
    </div>
  );
}

function ToggleRow({ title, desc, checked }: any) {
  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <div className="text-sm font-bold text-white mb-1.5">{title}</div>
        <div className="text-xs text-gray-500 leading-relaxed pr-4">{desc}</div>
      </div>
      <div className={`w-10 h-6 shrink-0 rounded-full flex items-center p-1 transition-colors ${checked ? 'bg-[#3cb44f]' : 'bg-[#172b1c]'}`}>
        <div className={`w-4 h-4 bg-white rounded-full transition-transform ${checked ? 'translate-x-4' : 'translate-x-0'}`} />
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

      <svg viewBox="0 0 200 120" className="w-full overflow-visible drop-shadow-2xl relative z-10">
        <defs>
          <linearGradient id="progressGradientProfile" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#111f14" />
            <stop offset="70%" stopColor="#3cb44f" />
            <stop offset="100%" stopColor="#2d8a3e" />
          </linearGradient>
          <filter id="hueGlowProfile" x="-10%" y="-10%" width="120%" height="120%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.28 0" result="softGlow" />
            <feMerge><feMergeNode in="softGlow" /></feMerge>
          </filter>
          <filter id="arrowShadowProfile" x="-30%" y="-20%" width="160%" height="160%">
            <feDropShadow dx="0" dy="1.5" stdDeviation="1.6" floodColor="#000000" floodOpacity="0.4" />
          </filter>
        </defs>

        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="#172b1c" strokeWidth="26" strokeLinecap="round" opacity="0.8" />
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#progressGradientProfile)" strokeWidth="22" strokeLinecap="round" filter="url(#hueGlowProfile)" opacity={0.45} style={{ strokeDasharray: arcLength, strokeDashoffset: offset, transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        <path d="M20 100 A80 80 0 0 1 180 100" fill="none" stroke="url(#progressGradientProfile)" strokeWidth="20" strokeLinecap="round" style={{ strokeDasharray: arcLength, strokeDashoffset: offset, transition: "stroke-dashoffset 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }} />
        <g style={{ transformOrigin: "100px 100px", transform: `rotate(${rotation}deg)`, transition: "transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)" }}>
          <path d="M 100 80 L 88 108 L 100 100 L 112 108 Z" fill="#ffffff" opacity={0.9} filter="url(#arrowShadowProfile)" />
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

  // Default values for showcase if API doesn't populate
  const defaultData: UserProfile = {
    user_name: 'Alex Morgan',
    what_do_you_do: 'Product Designer',
    short_headline: 'Building trusted digital experiences for SaaS teams, startups, and marketplaces that need clarity, confidence, and conversion.',
    bio: 'I help startups and product teams turn rough ideas into polished interfaces with strong usability foundations. My work spans UX strategy, design systems, high-fidelity product design, and developer collaboration. I care deeply about clarity, credibility, and creating profiles that make someone feel trustworthy before they ever send a message.',
    location: 'San Francisco, California',
    experience: '8 years',
    timezone: 'Pacific Time (UTC-8)',
    company_name: 'Pixel Foundry',
    github_link: 'https://github.com/alexmorgan',
    linkedin_link: 'https://linkedin.com/in/alexmorgan',
    portfolio_link: 'https://alexmorgan.design',
    instagram_link: 'https://instagram.com/alexmorgan.design',
    show_profile: true,
    show_projects: true,
    show_contracts: true,
    skills: ['Figma', 'React', 'TypeScript', 'Design Systems', 'UX Research', 'Product Strategy']
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const res = await axios.get('https://api.defellix.com/api/v1/users/me', {
            headers: { Authorization: `Bearer ${token}` }
          });
          const apiData = res.data?.data || res.data;
          setProfile(apiData.profile || apiData);
        }
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
      <div className="flex justify-center flex-col gap-4 items-center h-full bg-[#0f1117] text-[#3cb44f] font-semibold text-sm">
        <div className="w-8 h-8 rounded-full border-2 border-[#3cb44f] border-t-transparent animate-spin" />
        Loading Profile...
      </div>
    );
  }

  const data = { ...defaultData, ...profile };

  return (
    <div className="h-full w-full pt-12 bg-[#0f1117] overflow-y-auto scrBar text-white font-sans">
      <div className="w-full px-4 md:px-8 py-10 space-y-8">

        {/* UNIFIED TOP HERO CARD */}
        <div className="bg-gradient-to-br from-[#111f14] to-[#0d1a10] rounded-[32px] p-8 sm:p-10 border border-white/5 relative overflow-hidden">
          <div
            className="absolute top-0 left-0 w-full h-1/4 pointer-events-none bg-[#2d8a3e] bg-[linear-gradient(180deg,rgba(45,138,62,1)_15%,rgba(60,180,79,1)_54%,rgba(13,26,16,1)_95%)] opacity-30"
            style={{ maskImage: 'linear-gradient(to bottom, black, transparent)', WebkitMaskImage: 'linear-gradient(to bottom, black, transparent)' }}
          />

          {/* HEADER BADGES */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mb-10 relative z-10">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#3cb44f]/10 text-[#3cb44f] text-xs font-semibold border border-[#3cb44f]/20">
                <ShieldCheck size={14} /> Public profile verified
              </span>
              <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-500/10 text-blue-400 text-xs font-semibold border border-blue-500/20">
                <div className="w-1.5 h-1.5 rounded-full bg-blue-400" /> Open for collaborations
              </span>
            </div>
            <button
              onClick={() => navigate('/profile/profileEdit')}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white text-sm font-medium transition-colors border border-white/10 shadow-sm cursor-pointer hover:border-white/20"
            >
              <Edit2 size={16} /> Edit Profile
            </button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 relative z-10">

            {/* Profile Overview (Left) */}
            <div className="lg:col-span-8 flex flex-col justify-between">
              <div className="flex flex-col sm:flex-row items-center sm:items-start gap-8">
                <div className="w-28 h-28 rounded-full bg-[#172b1c] border-2 border-[#3cb44f]/30 overflow-hidden shrink-0 shadow-lg shadow-[#3cb44f]/10">
                  {data.photo ? <img src={data.photo} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="flex-1 text-center sm:text-left">
                  <p className="text-[#3cb44f] text-[10px] font-bold uppercase tracking-[0.15em] mb-2">{data.what_do_you_do} • {data.location}</p>
                  <h1 className="text-4xl sm:text-5xl font-bold text-white mb-4 tracking-tight">{data.user_name}</h1>
                  <p className="text-sm text-gray-300 leading-relaxed max-w-2xl">{data.short_headline}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-6 mt-8 pt-6 border-t border-white/5 text-xs text-gray-400 font-medium">
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5"><Building size={14} className="text-gray-300" /> {data.company_name || 'Individual'}</div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5"><MapPin size={14} className="text-gray-300" /> {data.location}</div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5"><Clock size={14} className="text-gray-300" /> {data.timezone}</div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white/5 rounded-lg border border-white/5"><Briefcase size={14} className="text-gray-300" /> Senior level • {data.experience} experience</div>
              </div>
            </div>

            {/* Reputation Score Card (Right) */}
            <div className="lg:col-span-4 bg-[#0d1a10]/50 rounded-[24px] p-8 border border-white/5 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-gray-400 text-[10px] font-bold uppercase tracking-widest">Reputation Score</h3>
                <span className="px-2.5 py-1 rounded-md bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/20">Top 10%</span>
              </div>
              <div>
                <div className="flex flex-col items-center justify-center relative my-4">
                  <ReputationGauge score={82} animated={animated} />
                </div>
                <p className="text-xs text-center text-gray-400 leading-relaxed mb-6 mt-2">Your score grows as profile details stay complete, links remain verified, and project case studies continue to be visible publicly.</p>
              </div>
              <div className="grid grid-cols-2 gap-y-4 gap-x-2 text-[11px] text-gray-300 font-semibold">
                <div className="flex items-center gap-2"><Check size={16} className="text-[#3cb44f]" /> Photo uploaded</div>
                <div className="flex items-center gap-2"><Check size={16} className="text-[#3cb44f]" /> Bio added</div>
                <div className="flex items-center gap-2"><Check size={16} className="text-[#3cb44f]" /> Projects public</div>
              </div>
            </div>

          </div>
        </div>

        {/* MAIN 2-COL GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-20">

          {/* LEFT COLUMN: Personal Details & Verified Links */}
          <div className="lg:col-span-8 space-y-8">

            {/* Personal Details */}
            <div className="bg-[#111f14] rounded-[32px] border border-white/5 overflow-hidden">
              <div className="flex items-center justify-between p-6 sm:px-8 border-b border-white/5">
                <h3 className="text-lg font-bold text-white">Personal details</h3>
                <span className="text-xs text-gray-500 font-medium">Public identity details</span>
              </div>
              <div className="p-6 sm:p-8 grid grid-cols-1 sm:grid-cols-2 gap-x-12 gap-y-10">
                <InfoField label="What do you do" value={data.what_do_you_do} />
                <InfoField label="Short headline" value={data.short_headline} />
                <InfoField label="Location" value={data.location} />
                <InfoField label="Experience" value={data.experience} />
                <InfoField label="Timezone" value={data.timezone} />
                <InfoField label="Company Name" value={data.company_name} />
              </div>
            </div>

            {/* Verified Links */}
            <div className="bg-[#111f14] rounded-[32px] border border-white/5 pb-2">
              <div className="flex items-center justify-between p-6 border-b border-white/5 mb-4">
                <h3 className="text-lg font-bold text-white">Verified links</h3>
                <span className="text-xs text-gray-500 font-medium">Identity & presence</span>
              </div>
              <div className="space-y-1 mx-2">
                <LinkRow icon={Github} title="GitHub" subtitle={data.github_link} verified />
                <LinkRow icon={Linkedin} title="LinkedIn" subtitle={data.linkedin_link} verified />
                <LinkRow icon={Globe} title="Portfolio" subtitle={data.portfolio_link} verified />
                <LinkRow icon={Instagram} title="Instagram" subtitle={data.instagram_link} verified />
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Skills & Visibility Settings */}
          <div className="lg:col-span-4 space-y-8">

            {/* Skills */}
            <div className="bg-[#111f14] rounded-[32px] border border-white/5 p-6 sm:p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-white">Skills</h3>
                <span className="text-xs text-gray-500 font-medium">Specialties</span>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {data.skills && data.skills.length > 0 ? data.skills.map((skill: string) => (
                  <span key={skill} className="px-3 py-1.5 bg-[#172b1c] text-gray-300 border border-white/5 text-xs font-semibold rounded-lg hover:border-[#3cb44f]/30 transition-colors cursor-default">
                    {skill}
                  </span>
                )) : <span className="text-sm text-gray-500">No skills added.</span>}
              </div>
            </div>

            {/* Visibility Settings */}
            <div className="bg-[#111f14] rounded-[32px] border border-white/5 pb-2">
              <div className="flex items-center justify-between p-6 border-b border-white/5 mb-6">
                <h3 className="text-lg font-bold text-white">Visibility settings</h3>
                <span className="text-xs text-gray-500 font-medium">What others can see</span>
              </div>
              <div className="px-6 pb-6 space-y-6">
                <ToggleRow title="Show profile" desc="Your public profile page is visible and included in search results." checked={data.show_profile !== false} />
                <div className="w-full h-px bg-white/5" />
                <ToggleRow title="Show projects" desc="Published projects are visible to visitors and contribute to your reputation." checked={data.show_projects !== false} />
                <div className="w-full h-px bg-white/5" />
                <ToggleRow title="Show contracts" desc="Contract history is displayed as part of your trust and and work history summary." checked={data.show_contracts !== false} />
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

