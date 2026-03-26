import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { apiClient } from '@/api/client';
import { motion } from 'motion/react';
import {
  MapPin, Briefcase, Github, Linkedin, Instagram, Globe, User, ShieldCheck, Activity, Star, Calendar, DollarSign, Clock, ArrowRight, ChevronDown, ChevronUp, FileText, CheckCircle
} from 'lucide-react';

interface PublicProfileData {
  user_name: string;
  full_name?: string;
  what_do_you_do?: string;
  photo?: string;
  short_headline?: string;
  role?: string;
  bio?: string;
  location?: string;
  experience?: string;
  github_link?: string;
  linkedin_link?: string;
  portfolio_link?: string;
  instagram_link?: string;
  skills?: string[];
  aggregate_reputation_score?: number;
  credibility_score?: number;
  score_tier?: string;
  projects?: any[];
  contracts?: ContractSummary[];
}

interface ContractSubmissionSummary {
  status: string;
  submitted_data?: any;
  description?: string;
}

interface ContractMilestoneSummary {
  title: string;
  amount: number;
  status: string;
  latest_submission?: ContractSubmissionSummary;
}

interface ContractSummary {
  id: number;
  project_name: string;
  project_category: string;
  client_name: string;
  client_company?: string;
  completed_date?: string;
  deadline?: string;
  total_amount: number;
  currency: string;
  reputation_score: number;
  rating: number;
  status: string;
  prd_file_url?: string;
  milestones?: ContractMilestoneSummary[];
}

function Section({ title, icon: Icon, children }: any) {
  return (
    <motion.section
      className="bg-[#111f14] rounded-[32px] border border-white/5 overflow-hidden shadow-2xl"
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
    >
      <div className="px-8 py-6 border-b border-white/[0.06] bg-[#0d1a10]/50 flex items-center justify-between">
        <h3 className="text-lg font-bold text-white flex items-center gap-3">
          <Icon className="text-[#3cb44f]" size={20} />
          {title}
        </h3>
      </div>
      <div className="p-8">
        {children}
      </div>
    </motion.section>
  );
}

export default function PublicProfile() {
  const { userName } = useParams();
  const [profile, setProfile] = useState<PublicProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedContracts, setExpandedContracts] = useState<Set<number>>(new Set());

  const toggleContractExpand = (id: number) => {
    setExpandedContracts(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) newSet.delete(id);
      else newSet.add(id);
      return newSet;
    });
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get(`/public/profile/${userName}`);
        setProfile(res.data?.data || res.data);
      } catch (err: any) {
        console.error('Failed to fetch public profile:', err);
        setError(err.response?.data?.message || 'Profile not found or is private.');
      } finally {
        setLoading(false);
      }
    };
    if (userName) fetchProfile();
  }, [userName]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-full border-2 border-[#3cb44f]/20 border-t-[#3cb44f] animate-spin mb-4" />
        <p className="text-[#3cb44f] font-medium animate-pulse uppercase tracking-widest text-xs">Authenticating Trust Graph...</p>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center p-4 text-center">
        <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center text-red-500 mb-6 border border-red-500/20">
          <ShieldCheck size={40} />
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">Profile Unavailable</h1>
        <p className="text-gray-400 max-w-md mb-8">{error || "This profile doesn't exist or the user has chosen to keep it private."}</p>
        <Link to="/" className="px-6 py-3 bg-[#3cb44f] text-white rounded-2xl font-bold hover:bg-[#34a045] transition-all flex items-center gap-2">
          Return Home <ArrowRight size={18} />
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#000] text-white font-sans selection:bg-[#3cb44f]/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-[#3cb44f]/10 blur-[100px] rounded-full animate-pulse" />
        <div className="absolute top-1/2 -right-40 w-96 h-96 bg-[#3cb44f]/5 blur-[100px] rounded-full" />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-20">

        {/* Header Section */}
        <motion.div
          className="bg-[radial-gradient(circle_at_top_right,_#3cb44f_0%,_#05030d_60%,_#000000_100%)] rounded-[48px] p-8 md:p-12 border border-white/5 shadow-2xl relative overflow-hidden mb-12"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <div className="flex flex-col md:flex-row items-center md:items-start gap-10">
            <div className="relative">
              <div className="w-32 h-32 md:w-40 md:h-40 rounded-[32px] bg-[#172b1c] border-2 border-[#3cb44f]/30 overflow-hidden shadow-[0_0_50px_rgba(60,180,79,0.15)] ring-4 ring-[#3cb44f]/5">
                {profile.photo ? (
                  <img src={profile.photo} alt={profile.full_name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-[#3cb44f]/40">
                    <User size={64} />
                  </div>
                )}
              </div>
              <div className="absolute -bottom-3 -right-3 w-10 h-10 bg-[#3cb44f] rounded-2xl border-4 border-[#000] flex items-center justify-center text-white shadow-lg">
                <ShieldCheck size={20} />
              </div>
            </div>

            <div className="flex-1 text-center md:text-left">
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mb-4">
                <span className="px-4 py-1.5 rounded-full bg-[#3cb44f]/10 text-[#3cb44f] text-[10px] font-black uppercase tracking-[0.2em] border border-[#3cb44f]/20">Verified Trust Profile</span>
                <span className="px-4 py-1.5 rounded-full bg-white/5 text-gray-400 text-[10px] font-bold uppercase tracking-[0.2em] border border-white/10 flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#3cb44f] animate-pulse" /> Available
                </span>
              </div>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-4 tracking-tight leading-tight">{profile.full_name}</h1>
              <p className="text-lg md:text-xl text-gray-300 font-medium max-w-2xl balance">{profile.short_headline}</p>

              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 mt-8">
                {profile.location && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 font-medium bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                    <MapPin size={16} className="text-[#3cb44f]/70" /> {profile.location}
                  </div>
                )}
                {profile.experience && (
                  <div className="flex items-center gap-2 text-sm text-gray-400 font-medium bg-white/5 px-4 py-2 rounded-2xl border border-white/5">
                    <Briefcase size={16} className="text-[#3cb44f]/70" /> {profile.experience}
                  </div>
                )}
                <div className="flex items-center gap-2 text-sm text-white font-bold bg-[#3cb44f]/10 px-4 py-2 rounded-2xl border border-[#3cb44f]/20">
                  <Activity size={16} className="text-[#3cb44f]" /> {profile.credibility_score || 0} Credibility
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
          {/* Left Column: Details & Projects */}
          <div className="lg:col-span-8 space-y-12">

            {profile.bio && (
              <Section title="About" icon={User}>
                <p className="text-gray-300 leading-relaxed text-lg whitespace-pre-wrap">{profile.bio}</p>
              </Section>
            )}

            {/* Verified Contracts (Verified Proof of Work) */}
            <Section title="Verified Project History" icon={ShieldCheck}>
              {profile.contracts && profile.contracts.length > 0 ? (
                <div className="grid grid-cols-1 gap-6">
                  {profile.contracts.map((contract) => (
                    <motion.div 
                      key={contract.id}
                      className="group bg-[#0d1a10] border border-white/5 p-6 rounded-[28px] hover:border-[#3cb44f]/30 hover:bg-[#172b1c]/40 transition-all duration-300"
                      whileHover={{ y: -4 }}
                    >
                      <div className="flex flex-col sm:flex-row justify-between items-start gap-4 mb-6">
                        <div>
                          <p className="text-[10px] font-black text-[#3cb44f] uppercase tracking-widest mb-2">{contract.project_category}</p>
                          <h4 className="text-xl font-bold text-white group-hover:text-[#3cb44f] transition-colors">{contract.project_name}</h4>
                          <p className="text-sm text-gray-400 flex items-center gap-2 mt-1">
                            For <span className="text-white font-semibold">{contract.client_name}</span> 
                            {contract.client_company && <span className="opacity-50">at {contract.client_company}</span>}
                          </p>
                        </div>
                        {contract.status === 'completed' && (
                          <div className="flex items-center gap-2 px-4 py-1.5 bg-[#3cb44f]/10 rounded-2xl border border-[#3cb44f]/20">
                            <Activity size={14} className="text-[#3cb44f]" />
                            <span className="text-xs font-black text-[#3cb44f]">
                              {contract.reputation_score ? (contract.reputation_score > 0 ? `+${contract.reputation_score}` : contract.reputation_score) : '0'} RP
                            </span>
                          </div>
                        )}
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-6 border-t border-white/5">
                        {contract.status === 'completed' ? (
                          <>
                            <div className="space-y-1">
                              <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Star size={10} /> Rating
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="text-sm font-bold text-white">{contract.rating}</span>
                                <div className="flex text-[#3cb44f]">
                                  {[...Array(5)].map((_, i) => (
                                    <Star key={i} size={10} fill={i < Math.round(contract.rating) ? "currentColor" : "none"} strokeWidth={2} />
                                  ))}
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1">
                              <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Calendar size={10} /> Delivered
                              </div>
                              <span className="text-sm font-bold text-white">{contract.completed_date || 'Ongoing'}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="space-y-1 text-gray-500">
                              <div className="text-[9px] font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Activity size={10} /> Status
                              </div>
                              <span className="text-sm font-bold text-white capitalize">{contract.status ? contract.status.replace(/_/g, ' ') : 'Ongoing'}</span>
                            </div>
                            <div className="space-y-1 opacity-50">
                              <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                                <Star size={10} /> Rating
                              </div>
                              <span className="text-sm font-bold text-white">Pending</span>
                            </div>
                          </>
                        )}
                        <div className="space-y-1">
                          <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                            <Clock size={10} /> Deadline
                          </div>
                          <span className="text-sm font-bold text-white">{contract.deadline || '-'}</span>
                        </div>
                        <div className="space-y-1">
                          <div className="text-[9px] text-gray-500 font-black uppercase tracking-widest flex items-center gap-1.5">
                            <DollarSign size={10} /> Value
                          </div>
                          <span className="text-sm font-bold text-[#3cb44f]">{contract.total_amount} {contract.currency}</span>
                        </div>
                      </div>

                      {/* Expand Toggle */}
                      <button 
                        onClick={() => toggleContractExpand(contract.id)} 
                        className="w-full mt-6 py-2 flex items-center justify-center gap-2 text-xs font-bold text-gray-400 hover:text-white border-t border-white/5 transition-colors"
                      >
                        {expandedContracts.has(contract.id) ? (
                          <>Hide Details <ChevronUp size={14} /></>
                        ) : (
                          <>View Deliverables <ChevronDown size={14} /></>
                        )}
                      </button>

                      {/* Expanded Content */}
                      {expandedContracts.has(contract.id) && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          className="pt-4 border-t border-white/5 mt-4"
                        >
                          {contract.prd_file_url && (
                             <div className="mb-4">
                               <a href={contract.prd_file_url} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-white bg-white/5 px-4 py-2 rounded-xl hover:bg-white/10 transition-colors border border-white/10">
                                 <FileText size={14} className="text-[#3cb44f]" /> View Original PRD
                               </a>
                             </div>
                          )}
                          
                          {contract.milestones && contract.milestones.length > 0 && (
                             <div className="space-y-3">
                               <h5 className="text-[10px] uppercase tracking-widest text-gray-500 font-black mb-3">Milestone Deliverables</h5>
                               {contract.milestones.map((m, idx) => (
                                 <div key={idx} className="bg-black/40 rounded-2xl p-4 border border-white/5">
                                    <div className="flex items-center justify-between mb-3">
                                      <div className="flex items-center gap-2 text-sm font-bold text-white">
                                        <CheckCircle size={14} className={m.status === 'paid' || m.status === 'approved' ? "text-[#3cb44f]" : "text-gray-600"} />
                                        {m.title}
                                      </div>
                                      <div className="text-xs font-bold text-[#3cb44f]">{m.amount} {contract.currency}</div>
                                    </div>
                                    
                                    {m.latest_submission ? (
                                      <div className="pl-6 space-y-2">
                                        <p className="text-xs text-gray-400">{m.latest_submission.description}</p>
                                        {m.latest_submission.submitted_data && Object.keys(m.latest_submission.submitted_data).length > 0 && (
                                          <div className="flex flex-wrap gap-2 mt-2">
                                            {Object.entries(m.latest_submission.submitted_data).map(([key, value]) => {
                                              if (typeof value === 'string' && value.startsWith('http')) {
                                                return (
                                                  <a key={key} href={value} target="_blank" rel="noreferrer" className="px-3 py-1.5 bg-[#3cb44f]/10 text-[#3cb44f] text-[10px] font-bold rounded-lg border border-[#3cb44f]/20 hover:bg-[#3cb44f]/20 transition-colors truncate max-w-[200px]">
                                                    {key}: Link
                                                  </a>
                                                );
                                              }
                                              return (
                                                <span key={key} className="px-3 py-1.5 bg-white/5 text-gray-300 text-[10px] font-bold rounded-lg border border-white/5">
                                                  {key}: {String(value)}
                                                </span>
                                              );
                                            })}
                                          </div>
                                        )}
                                      </div>
                                    ) : (
                                      <div className="pl-6 text-xs text-gray-600 italic">No submissions yet</div>
                                    )}
                                 </div>
                               ))}
                             </div>
                          )}
                        </motion.div>
                      )}
                    </motion.div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 px-4 bg-white/5 rounded-[32px] border border-dashed border-white/10">
                  <Activity size={40} className="mx-auto text-gray-600 mb-4" />
                  <p className="text-gray-400 font-medium">No verified project history yet.</p>
                </div>
              )}
            </Section>

            {profile.projects && profile.projects.length > 0 && (
              <Section title="Self-Hosted Portfolio" icon={Globe}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {profile.projects.map((proj: any) => (
                    <div key={proj.id} className="group bg-white/5 rounded-[28px] overflow-hidden border border-white/5 hover:border-[#3cb44f]/20 transition-all">
                      <div className="p-6">
                        <h4 className="text-lg font-bold text-white mb-2 group-hover:text-[#3cb44f] transition-colors">{proj.project_name}</h4>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-6">{proj.description}</p>
                        <div className="flex flex-wrap gap-2 mb-6">
                          {proj.technologies?.map((tech: string) => (
                            <span key={tech} className="px-3 py-1 bg-[#172b1c] rounded-lg text-[10px] font-bold text-[#3cb44f] border border-[#3cb44f]/10">
                              {tech}
                            </span>
                          ))}
                        </div>
                        {proj.live_link && (
                          <a href={proj.live_link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 text-xs font-bold text-white bg-[#3cb44f]/20 px-4 py-2 rounded-xl hover:bg-[#3cb44f] transition-all">
                            View Live <Globe size={14} />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </Section>
            )}
          </div>

          {/* Right Column: Skills & Presence */}
          <div className="lg:col-span-4 space-y-8">

            <Section title="Expertise" icon={Globe}>
              <div className="flex flex-wrap gap-3">
                {profile.skills?.map((skill) => (
                  <span key={skill} className="px-5 py-2.5 bg-[#172b1c] rounded-2xl text-xs font-bold text-gray-200 border border-[#3cb44f]/10 hover:border-[#3cb44f]/40 hover:text-[#3cb44f] transition-all cursor-default">
                    {skill}
                  </span>
                ))}
              </div>
            </Section>

            <Section title="Digital Presence" icon={Link2}>
              <div className="space-y-3">
                {[
                  { icon: Github, label: 'GitHub', link: profile.github_link },
                  { icon: Linkedin, label: 'LinkedIn', link: profile.linkedin_link },
                  { icon: Globe, label: 'Portfolio', link: profile.portfolio_link },
                  { icon: Instagram, label: 'Instagram', link: profile.instagram_link },
                ].filter(p => p.link).map((platform) => (
                  <a
                    key={platform.label}
                    href={platform.link}
                    target="_blank" rel="noreferrer"
                    className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:bg-[#172b1c] hover:border-[#3cb44f]/30 transition-all group"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-[#000] flex items-center justify-center text-[#3cb44f] group-hover:shadow-[0_0_15px_rgba(60,180,79,0.2)]">
                        <platform.icon size={20} />
                      </div>
                      <span className="text-sm font-bold text-gray-300 group-hover:text-white">{platform.label}</span>
                    </div>
                    <ArrowRight size={16} className="text-gray-600 group-hover:text-[#3cb44f] group-hover:translate-x-1 transition-all" />
                  </a>
                ))}
              </div>
            </Section>

            {/* Platform CTA */}
            <div className="bg-[#172b1c] rounded-[40px] p-8 border border-[#3cb44f]/20 shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#3cb44f]/10 blur-3xl" />
              <h3 className="text-xl font-black text-white mb-4 relative z-10 leading-tight">Build your own Trust Network</h3>
              <p className="text-gray-400 text-sm mb-8 relative z-10 leading-relaxed">Defellix is the world's first decentralized platform for freelancer reputation. Own your trust graph today.</p>
              <Link to="/signup" className="block text-center px-6 py-4 bg-[#3cb44f] text-white rounded-2xl font-black text-sm hover:bg-[#34a045] transition-all relative z-10 shadow-lg shadow-[#3cb44f]/20 hover:scale-[1.02] active:scale-[0.98]">
                Join Defellix Now
              </Link>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function Link2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  );
}
