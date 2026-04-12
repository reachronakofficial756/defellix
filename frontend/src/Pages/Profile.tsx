import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { motion } from 'motion/react';
import {
  Briefcase,
  Github, Linkedin, Instagram, Globe, Edit2, User, Link2, Activity, X,
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
  credibility_score?: number;
  score_tier?: string;
  dimension_scores?: any;
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
      className="flex items-center justify-between p-3 rounded-2xl border border-transparent hover:border-[#3cb44f]/20 hover:bg-[#172b1c]/50 transition-all duration-200 cursor-default"
      whileHover={{ x: 4 }}
      transition={{ type: 'tween', duration: 0.2 }}
    >
      <div className="flex items-center gap-4 overflow-hidden">
      <div className="w-10 h-10 rounded-2xl bg-[#0d1a10] border border-[#3cb44f]/20 flex items-center justify-center text-[#3cb44f] shrink-0 shadow-[0_0_20px_rgba(60,180,79,0.08)]">
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

export default function Profile() {
  const navigate = useNavigate();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [showProjectModal, setShowProjectModal] = useState(false);
  const [allContracts, setAllContracts] = useState<any[]>([]);
  const [fetchingContracts, setFetchingContracts] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiClient.get('/users/me');
        const apiData = res.data?.data || res.data;
        const nested = apiData.profile || {};
        const profileObj = { ...apiData, ...nested };
        setProfile(profileObj as UserProfile);
      } catch (err) {
        console.error('Failed to fetch profile data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const fetchContracts = async () => {
    setFetchingContracts(true);
    try {
      // Fetch all contracts and filter on frontend for maximum resilience
      const res = await apiClient.get('/contracts?limit=100');
      const rawData = res.data?.data?.contracts || res.data?.contracts || res.data?.data || [];
      const data = Array.isArray(rawData) ? rawData : [];
      
      // Only include contracts that are signed, active, or completed
      const showable = data.filter((c: any) => 
        ['signed', 'active', 'completed'].includes(c.status?.toLowerCase())
      );
      
      setAllContracts(showable);
    } catch (err) {
      console.error('Failed to fetch contracts', err);
      setAllContracts([]);
    } finally {
      setFetchingContracts(false);
    }
  };

  const toggleContractVisibility = async (contractId: number, isPublic: boolean) => {
    try {
      await apiClient.patch(`/contracts/${contractId}/visibility`, { is_public: isPublic });
      setAllContracts(prev => prev.map(c => c.id === contractId ? { ...c, is_public: isPublic } : c));
    } catch (err) {
      console.error('Failed to toggle visibility', err);
    }
  };

  const openShowcaseModal = () => {
    setShowProjectModal(true);
    void fetchContracts();
  };

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
            <div className="absolute right-0 top-0 flex flex-wrap items-center justify-end gap-2">
              <button
                type="button"
                onClick={openShowcaseModal}
                className="items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-[#3cb44f]/15 text-white text-sm font-semibold transition-all border border-white/10 hover:border-[#3cb44f]/30 cursor-pointer shadow-sm"
              >
                <span className="text-white text-sm font-semibold flex items-center gap-2">
                  <Briefcase size={16} strokeWidth={2} /> Showcase contracts
                </span>
              </button>
              <button
                type="button"
                onClick={() => navigate('/dashboard/profile/edit')}
                className="items-center gap-2 px-5 py-2.5 rounded-2xl bg-white/5 hover:bg-[#3cb44f]/15 text-white text-sm font-semibold transition-all border border-white/10 hover:border-[#3cb44f]/30 cursor-pointer shadow-sm"
              >
                <span className="text-white text-sm font-semibold flex items-center gap-2">
                  <Edit2 size={16} strokeWidth={2} /> Edit Profile
                </span>
              </button>
            </div>
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

              {/* <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3 mt-8 pt-6 border-t border-white/[0.06]">
                {[
                  { Icon: Building, text: data.company_name || '-' },
                  { Icon: MapPin, text: data.location || '-' },
                  { Icon: Briefcase, text: data.experience || '-' },
                ].map(({ Icon, text }, i) => (
                  <span key={i} className="flex items-center gap-2 px-4 py-2 bg-[#0d1a10]/80 rounded-2xl border border-white/5 text-xs text-gray-300 font-medium">
                    <Icon size={14} className="text-[#3cb44f]/80 shrink-0" /> {text}
                  </span>
                ))}
              </div> */}
            </motion.div>

            {/* RIGHT: Skills pills */}
            <motion.div
              className="lg:col-span-4 flex justify-center lg:justify-end"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.15, ease: 'easeOut' }}
            >
              <div className="w-full max-w-md lg:max-w-none mt-10">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 text-[10px] text-gray-400 font-bold uppercase tracking-[0.2em]">
                    {/* <Sparkles size={14} className="text-[#3cb44f]" /> Skills */}
                  </div>
                  <span className="text-[10px] text-gray-100 font-semibold uppercase tracking-wider">Specialties</span>
                </div>
                <div className="flex flex-wrap justify-center lg:justify-end gap-2.5">
                  {data.skills && data.skills.length > 0 ? (
                    data.skills.map((skill: string) => (
                      <span
                        key={skill}
                        className="px-4 py-2 bg-[#0d1a10]/80 text-gray-200 border border-white/5 text-xs font-semibold rounded-xl hover:border-[#3cb44f]/30 hover:text-[#3cb44f]/90 transition-all cursor-default"
                      >
                        {skill}
                      </span>
                    ))
                  ) : (
                    <span className="text-sm text-gray-500">No skills added.</span>
                  )}
                </div>
              </div>
            </motion.div>

          </div>
        </motion.div>

        {/* MAIN GRID (full width) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-2 pb-4 -mt-6">

          {/* LEFT: Personal Details & Verified Links */}
          <div className="lg:col-span-12 space-y-2">
            <motion.div
              className="bg-[#111f14] rounded-[40px]   overflow-hidden shadow-[0_8px_32px_rgba(0,0,0,0.3)]"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2, ease: 'easeOut' }}
            >
              <div className="flex items-center justify-center p-6 sm:px-8 border-b border-white/[0.06] bg-[#0d1a10]/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><User size={20} className="text-[#3cb44f]" /> Personal details</h3>
              </div>
              <div className="p-5 sm:p-6 space-y-4">
                <div className="flex justify-center">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-6 text-center w-full">
                    <InfoField label="Username" value={data.user_name} />
                    <InfoField label="What do you do" value={data.what_do_you_do} />
                    <InfoField label="Short headline" value={data.short_headline} />
                    <InfoField label="Location" value={data.location} />
                    <InfoField label="Experience" value={data.experience} />
                    <InfoField label="Company Name" value={data.company_name} />
                    <div />
                    <InfoField label="Phone" value={data.phone as string | undefined} />
                  </div>
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
              <div className="flex items-center justify-center p-6 border-b border-white/[0.06] bg-[#0d1a10]/50">
                <h3 className="text-lg font-bold text-white flex items-center gap-2"><Link2 size={20} className="text-[#3cb44f]" /> Verified links</h3>
              </div>
              <div className="flex justify-center">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4 w-full">
                <LinkRow icon={Github} title="GitHub" subtitle={data.github_link} />
                <LinkRow icon={Linkedin} title="LinkedIn" subtitle={data.linkedin_link} />
                <LinkRow icon={Globe} title="Portfolio" subtitle={data.portfolio_link} />
                <LinkRow icon={Instagram} title="Instagram" subtitle={data.instagram_link} />
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* PROJECT SELECTION MODAL */}
      {showProjectModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 backdrop-blur-xl bg-black/80">
          <motion.div 
            className="w-full max-w-2xl bg-[#0f1117] border border-white/10 rounded-[40px] shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
          >
            <div className="px-8 py-6 border-b border-white/5 bg-[#172b1c]/30 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white flex items-center gap-3">
                  <Briefcase size={22} className="text-[#3cb44f]" /> 
                  Showcase Your Legacy
                </h3>
                <p className="text-xs text-gray-400 mt-1">Select completed or signed contracts to display on your trust profile.</p>
              </div>
              <button 
                onClick={() => setShowProjectModal(false)}
                className="p-2 hover:bg-white/5 rounded-full text-gray-400 hover:text-white transition-colors cursor-pointer"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-8 space-y-4 scrBar">
              {fetchingContracts ? (
                <div className="py-20 flex flex-col items-center justify-center gap-4">
                  <div className="w-8 h-8 rounded-full border-2 border-[#3cb44f]/20 border-t-[#3cb44f] animate-spin" />
                  <span className="text-xs text-gray-500 font-medium">Scanning trust graph...</span>
                </div>
              ) : allContracts.length === 0 ? (
                <div className="py-20 text-center space-y-4">
                  <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto text-gray-600">
                    <Activity size={32} />
                  </div>
                  <p className="text-gray-400 font-medium">No verified contracts found yet.</p>
                  <p className="text-[10px] text-gray-600 max-w-[200px] mx-auto">Only contracts that are signed or completed can be showcased.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {allContracts.map((c) => (
                    <div 
                      key={c.id}
                      className={`p-4 rounded-2xl border transition-all duration-300 flex items-center justify-between gap-4 ${c.is_public ? 'bg-[#172b1c]/40 border-[#3cb44f]/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9px] font-black text-[#3cb44f] uppercase tracking-widest">{c.project_category || 'General'}</span>
                          <span className={`px-2 py-0.5 rounded-md text-[8px] font-bold uppercase ${c.status === 'completed' ? 'bg-[#3cb44f]/20 text-[#3cb44f]' : 'bg-blue-500/10 text-blue-400'}`}>
                            {c.status}
                          </span>
                        </div>
                        <h4 className="text-sm font-bold text-white truncate">{c.project_name}</h4>
                        <p className="text-[10px] text-gray-500 truncate mt-0.5">With {c.client_name}</p>
                      </div>
                      <button 
                        onClick={() => toggleContractVisibility(c.id, !c.is_public)}
                        className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all cursor-pointer ${c.is_public ? 'bg-[#3cb44f] text-white shadow-[0_0_15px_rgba(60,180,79,0.3)]' : 'bg-white/5 text-gray-400 border border-white/10 hover:bg-white/10'}`}
                      >
                        {c.is_public ? 'Public' : 'Private'}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="p-8 border-t border-white/5 bg-[#0a0a0a]/50 flex justify-end">
              <button 
                onClick={() => setShowProjectModal(false)}
                className="px-8 py-3 bg-[#3cb44f] text-white rounded-2xl font-black text-xs hover:bg-[#34a045] transition-all shadow-lg shadow-[#3cb44f]/20 cursor-pointer"
              >
                Close & Save Changes
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

