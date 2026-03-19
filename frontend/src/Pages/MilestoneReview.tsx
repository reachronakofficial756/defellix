import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  CheckCircle2, AlertCircle, Loader2, Calendar, DollarSign,
  Link2, ArrowRight, MessageSquare, ExternalLink,
  ShieldCheck, FileText, Send, Clock, Copy, Check,
  Paperclip
} from 'lucide-react';
import { apiClient, API_BASE } from '../api/client';
import { calculateContractProgress } from '@/utils/contractProgress';
import logo from '@/assets/logo.svg';

const CONTRACT_API_BASE = `${API_BASE}/api/v1/public/contracts`;

interface Milestone {
  id: number;
  order_index: number;
  title: string;
  description?: string;
  amount: number;
  due_date?: string;
  status: string;
  submission_criteria?: string;
  submitted_data?: any;
  submitted_description?: string;
  latest_submission?: any;
}

interface Submission {
  id: number;
  milestone_id: number;
  status: string;
  submitted_data?: string | any;
  description?: string;
  revision_history?: string;
  created_at?: string;
  updated_at?: string;
}

interface Contract {
  id: number;
  project_name: string;
  project_category?: string;
  client_name: string;
  client_email?: string;
  client_company_name?: string;
  currency: string;
  total_amount: number;
  description?: string;
  start_date?: string;
  due_date?: string;
  estimated_duration?: string;
  milestones: Milestone[];
  client_view_token?: string;
  freelancer_name?: string;
  revision_policy?: string;
  terms_and_conditions?: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(dt?: string | null): string {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    submitted: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    approved: 'bg-[#3cb44f]/15 text-[#3cb44f] border-[#3cb44f]/30',
    paid: 'bg-[#3cb44f]/20 text-[#3cb44f] border-[#3cb44f]/40',
    revision: 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return map[status] ?? 'bg-white/10 text-white border-white/20';
}

function getActiveMilestone(milestones: Milestone[]): Milestone | null {
  return milestones.find(m => m.status === 'submitted') ?? null;
}

// ─── Info card (same as ClientContractReview) ────────────────────────────────
function InfoCard({ icon: Icon, label, value, color = '#3cb44f' }: { icon: any; label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex flex-col gap-2">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon size={17} style={{ color }} />
      </div>
      <p className="text-gray-500 text-xs font-medium">{label}</p>
      <p className="text-white font-bold text-lg truncate">{value}</p>
    </div>
  );
}

// ─── Milestone status pill ────────────────────────────────────────────────────
function MsStatusPill({ status }: { status: string }) {
  const cfg: Record<string, { cls: string; label: string }> = {
    pending: { cls: 'bg-white/10 text-gray-400 border-white/15', label: 'Pending' },
    submitted: { cls: 'bg-blue-500/15 text-blue-300 border-blue-500/30', label: 'In Review' },
    revision: { cls: 'bg-orange-500/15 text-orange-300 border-orange-500/30', label: 'Revision' },
    approved: { cls: 'bg-[#3cb44f]/15 text-[#3cb44f] border-[#3cb44f]/30', label: 'Approved' },
    paid: { cls: 'bg-[#3cb44f]/20 text-[#3cb44f] border-[#3cb44f]/50', label: 'Paid' },
  };
  const c = cfg[status] ?? cfg.pending;
  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${c.cls}`}>{c.label}</span>
  );
}

// ─────────────────────────────── Component ───────────────────────────────────

type SidebarState = 'review' | 'reiterate' | 'otp' | 'success';

export default function MilestoneReview() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Sidebar state machine
  const [sideState, setSideState] = useState<SidebarState>('review');
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [reiterateText, setReiterateText] = useState('');
  const [reiterateSuccess, setReiterateSuccess] = useState(false);
  const [newDueDate, setNewDueDate] = useState<string>('');

  // OTP
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [otpError, setOtpError] = useState('');
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  // Submission review
  const [copied, setCopied] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!contractId) return;
    let cIdNumeric = 0;
    (async () => {
      try {
        let contractData: Contract | null = null;
        try {
          const res = await apiClient.get(`/contracts/${contractId}`);
          const raw = res.data?.data ?? res.data;
          if (raw && typeof raw.id === 'number') { contractData = raw; cIdNumeric = raw.id; }
          else throw new Error('Invalid');
        } catch {
          const res = await apiClient.get(`/public/contracts/${contractId}`);
          const raw = res.data?.data ?? res.data;
          if (!raw || typeof raw.id !== 'number') throw new Error('Contract not found');
          contractData = raw; cIdNumeric = raw.id;
        }

        if (contractData?.milestones) {
          contractData.milestones = [...contractData.milestones].sort(
            (a: Milestone, b: Milestone) => a.order_index - b.order_index
          );
        }
        if (contractData?.client_view_token && contractId === String(contractData.id)) {
          navigate(`/review-milestone/${contractData.client_view_token}`, { replace: true });
          return;
        }
        setContract(contractData);

        try {
          const subRes = await apiClient.get(`/contracts/${cIdNumeric}/submissions`);
          const subData = subRes.data?.data ?? subRes.data;
          if (Array.isArray(subData)) setSubmissions(subData);
        } catch {
          const embedded = contractData?.milestones?.map((m: any) => m.latest_submission).filter(Boolean) ?? [];
          if (embedded.length) setSubmissions(embedded as Submission[]);
        }
      } catch (e: any) {
        setFetchError(e?.response?.data?.message || e.message || 'Failed to load contract');
      } finally {
        setLoading(false);
      }
    })();
  }, [contractId]);

  // ── Active submission helper ───────────────────────────────────────────────
  const getActiveSubmission = (): Submission | null =>
    submissions.find(s => s.status === 'pending_review' || s.status === 'submitted') ?? null;

  // ── OTP handlers ──────────────────────────────────────────────────────────
  const handleOtpInput = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const n = [...otpCode]; n[index] = value; setOtpCode(n);
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const startOtpFlow = async (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setOtpError('');
    setIsSendingOtp(true);
    console.log('[OTP Debug] contract state:', { client_view_token: contract?.client_view_token, client_email: contract?.client_email, contractId });
    // Use contractId from URL directly — it IS the client_view_token when the URL is /review-milestone/:token
    const token = contract?.client_view_token || contractId;
    const email = contract?.client_email;
    try {
      if (token && email) {
        await apiClient.post(`${CONTRACT_API_BASE}/${token}/send-otp`, { email });
      } else {
        throw new Error(`Missing client details: token=${token}, email=${email}`);
      }
      setSideState('otp');
    } catch (err: any) {
      console.error('OTP Send Error:', err.response?.data || err);
      setOtpError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
    } finally {
      setIsSendingOtp(false);
    }
  };

  const verifyAndSubmit = async () => {
    const code = otpCode.join('');
    if (code.length < 6) { setOtpError('Enter complete 6-digit code'); return; }

    setIsVerifying(true);
    setOtpError('');
    try {
      const activeSub = getActiveSubmission();
      if (!activeSub || !contract?.client_view_token) throw new Error('Missing data');

      await apiClient.post(`${CONTRACT_API_BASE}/${contract.client_view_token}/submissions/${activeSub.id}/review`, {
        otp: code,
        action: reviewAction === 'approve' ? 'accept' : 'revision',
        comment: reviewAction === 'reject' ? reiterateText : '',
        new_due_date: reviewAction === 'reject' && newDueDate ? new Date(newDueDate).toISOString() : undefined
      });

      setSideState('success');
    } catch (err: any) {
      setOtpError(err.response?.data?.message || 'Verification failed. Incorrect OTP?');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleReiteration = async () => {
    if (!reiterateText.trim()) return;
    setReviewAction('reject');
    setReiterateSuccess(false);
    await startOtpFlow('reject');
  };

  // ── Render Utils ──────────────────────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#000] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#3cb44f] animate-spin" />
        <p className="text-white/50 text-sm font-semibold tracking-widest uppercase">Loading Contract…</p>
      </div>
    </div>
  );

  if (fetchError || !contract) return (
    <div className="min-h-screen bg-[#000] flex items-center justify-center">
      <div className="text-center space-y-4 px-6">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
        <h2 className="text-white text-2xl font-bold">Contract Not Found</h2>
        <p className="text-gray-500">{fetchError || 'Unable to load contract details'}</p>
        <button onClick={() => navigate('/dashboard')} className="mt-4 px-6 py-3 rounded-2xl bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-all cursor-pointer">Go to Dashboard</button>
      </div>
    </div>
  );

  const activeMilestone = getActiveMilestone(contract.milestones);
  const allApproved = contract.milestones.every(m => m.status === 'approved' || m.status === 'paid');
  const allSubmittedOrDone = contract.milestones.every(m => m.status === 'submitted' || m.status === 'approved' || m.status === 'paid');
  const progressPct = calculateContractProgress(contract.milestones, contract.total_amount);
  const activeSubmission = getActiveSubmission();

  return (
    <div className="min-h-screen bg-[#000] text-white font-sans selection:bg-[#3cb44f]/30 overflow-x-hidden">
      <nav
        className={
          `h-16 fixed top-0 w-full px-6 py-10 flex items-center justify-center z-50 bg-[#111f14]/10 backdrop-blur-md`
        }
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          onKeyPress={e => {
            if (e.key === "Enter" || e.key === " ") navigate('/');
          }}
        >
          <img src={logo} alt="Defellix" className="w-52 h-auto" />
        </div>
      </nav>

      <main className="max-w-[1600px] mx-auto flex flex-col lg:flex-row relative min-h-screen pt-20">

        {/* ── LEFT — Content Pane (68%) ─── */}
        <div className="lg:w-[68%] p-8 lg:p-14 pb-32">

          <div className="mb-10 flex flex-col gap-1">
            <span className="text-[#3cb44f] text-xs font-black uppercase tracking-widest">{contract.project_category || 'Contract Review'}</span>
            <h1 className="text-4xl md:text-5xl font-black text-white leading-[1.1] mb-2">{contract.project_name}</h1>
            <p className="text-gray-500 font-medium">Agreement between {contract.freelancer_name || 'Freelancer'} & {contract.client_name}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
            <InfoCard icon={DollarSign} label="Total Value" value={`${contract.currency} ${contract.total_amount.toLocaleString()}`} />
            <InfoCard icon={Calendar} label="Target End" value={fmt(contract.due_date)} color="#60a5fa" />
            <InfoCard icon={ShieldCheck} label="Status" value={allApproved ? 'Completed' : 'Active'} color="#fbc02d" />
          </div>

          {/* Submissions Section */}
          <div className="mb-16">
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <FileText className="text-[#3cb44f]" size={24} />
                Submitted Deliverables
              </h2>
            </div>

            {activeSubmission ? (
              <div className="bg-white/2 border border-white/8 rounded-[32px] overflow-hidden">
                <div className="p-8 border-b border-white/5">
                  <div className="flex items-center justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-[#3cb44f]/10 flex items-center justify-center">
                        <Paperclip className="text-[#3cb44f]" size={22} />
                      </div>
                      <div>
                        <h3 className="font-black text-lg text-white">Milestone #{activeMilestone?.order_index !== undefined ? activeMilestone.order_index + 1 : 'Review'}</h3>
                        <p className="text-gray-400 text-sm font-medium">{activeMilestone?.title}</p>
                      </div>
                    </div>
                    <span className="px-4 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-widest">
                      Pending Review
                    </span>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-2">Description</p>
                      <p className="text-gray-300 leading-relaxed text-sm bg-white/3 p-4 rounded-2xl border border-white/5 whitespace-pre-wrap italic">
                        "{activeSubmission.description || 'No description provided.'}"
                      </p>
                    </div>

                    {/* Shared Data Display */}
                    {activeSubmission.submitted_data && (
                      <div>
                        <p className="text-gray-500 text-[10px] font-black uppercase tracking-widest mb-3">Deliverable Attachments</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          {(() => {
                            let data: any = activeSubmission.submitted_data;
                            if (typeof data === 'string') {
                              try { data = JSON.parse(data); } catch { data = { Link: data }; }
                            }

                            return Object.entries(data).map(([key, val]: [string, any]) => {
                              if (!val || (Array.isArray(val) && val.length === 0)) return null;

                              if (key === 'Photos' || key.toLowerCase() === 'photos') {
                                return (val as any[]).map((img, idx) => (
                                  <a key={`img-${idx}`} href={img.url || img.data} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all group">
                                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-black flex-shrink-0">
                                      <img src={img.url || img.data} alt={img.name} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-white text-xs font-bold truncate">{img.name}</p>
                                      <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Image</p>
                                    </div>
                                    <ExternalLink size={14} className="text-gray-600 group-hover:text-white" />
                                  </a>
                                ));
                              }

                              if (key === 'Docs' || key.toLowerCase() === 'docs') {
                                return (val as any[]).map((doc, idx) => (
                                  <a key={`doc-${idx}`} href={doc.url || doc.data} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all group">
                                    <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                                      <FileText size={18} className="text-[#3cb44f]" />
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <p className="text-white text-xs font-bold truncate">{doc.name}</p>
                                      <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">Document</p>
                                    </div>
                                    <ExternalLink size={14} className="text-gray-600 group-hover:text-white" />
                                  </a>
                                ));
                              }

                              return (
                                <a key={key} href={String(val)} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/8 transition-all group">
                                  <div className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center flex-shrink-0">
                                    <Link2 size={18} className="text-[#3cb44f]" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="text-white text-xs font-bold truncate">{String(val).replace(/^https?:\/\//, '')}</p>
                                    <p className="text-gray-500 text-[10px] uppercase font-bold tracking-widest">{key}</p>
                                  </div>
                                  <ExternalLink size={14} className="text-gray-600 group-hover:text-white" />
                                </a>
                              );
                            });
                          })()}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="bg-white/2 p-6 flex items-center gap-4">
                  <Clock size={16} className="text-gray-600" />
                  <p className="text-gray-500 text-[11px] font-bold uppercase tracking-widest">Submitted on {fmt(activeSubmission.created_at || activeSubmission.updated_at)}</p>
                </div>
              </div>
            ) : (
              <div className="bg-white/2 border border-white/8 border-dashed rounded-[32px] p-20 text-center">
                <div className="w-16 h-16 rounded-3xl bg-white/5 flex items-center justify-center mx-auto mb-6">
                  <Clock className="text-gray-700" size={32} />
                </div>
                <h3 className="text-white font-black text-xl mb-2">No Active Submissions</h3>
                <p className="text-gray-500 max-w-sm mx-auto text-sm leading-relaxed">
                  When the freelancer submits a milestone for review, it will appear here for your approval.
                </p>
              </div>
            )}
          </div>

          {/* Timeline Section */}
          <div>
            <div className="flex items-center justify-between mb-8 border-b border-white/5 pb-4">
              <h2 className="text-2xl font-black flex items-center gap-3">
                <Send className="text-[#3cb44f]" size={24} />
                Project Roadmap
              </h2>
            </div>

            <div className="space-y-4">
              {contract.milestones.map((ms, i) => (
                <div key={ms.id} className="group relative flex items-start gap-6 p-6 rounded-[28px] bg-white/3 border border-white/5 hover:border-white/15 hover:bg-white/5 transition-all">
                  <div className="w-12 h-12 rounded-2xl bg-black border border-white/10 flex items-center justify-center shrink-0 font-black text-[#3cb44f]">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <h4 className="font-bold text-white pr-2">{ms.title}</h4>
                      <MsStatusPill status={ms.status} />
                    </div>
                    <p className="text-gray-500 text-sm line-clamp-1">{ms.description || 'No additional details.'}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-white font-black">{contract.currency} {ms.amount.toLocaleString()}</p>
                    <p className="text-gray-600 font-bold text-[10px] uppercase tracking-tighter mt-1">{fmt(ms.due_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── RIGHT — Action Sidebar (32% Fixed) ─── */}
        <div className="lg:w-[32%] lg:fixed lg:right-0 lg:top-20 lg:bottom-0 p-8 lg:p-14 border-l border-white/5 bg-[#000] backdrop-blur-xl overflow-y-auto z-10">

          {/* Progress bar */}
          <div className="mb-8 bg-white/3 border border-white/8 rounded-2xl p-5 shadow-[0_4px_24px_rgba(0,0,0,0.4)]">
            <div className="flex justify-between items-center mb-2">
              <p className="text-gray-400 text-xs font-black uppercase tracking-widest">Overall Progress</p>
              <p className="font-black text-sm text-[#3cb44f]">{progressPct}%</p>
            </div>
            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-[#3cb44f] rounded-full transition-all duration-1000" style={{ width: `${progressPct}%`, boxShadow: '0 0 10px #3cb44f66' }} />
            </div>
          </div>

          <div key={sideState} className="will-change-transform">

            {sideState === 'review' && (
              <div className="space-y-8">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Review Submission</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Carefully review the deliverables before taking an action. Milestones cannot be un-approved.</p>
                </div>

                {activeSubmission ? (
                  <div className="space-y-4">
                    {otpError && (
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">
                        {otpError}
                      </div>
                    )}
                    <button
                      onClick={() => startOtpFlow('approve')}
                      className="w-full py-5 rounded-2xl bg-[#3cb44f] text-black font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_8px_24px_rgba(60,180,79,0.25)] flex items-center justify-center gap-2 cursor-pointer group"
                    >
                      Approve & Release Funds
                      <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                    </button>

                    <button
                      onClick={() => setSideState('reiterate')}
                      className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-sm uppercase tracking-widest hover:bg-white/10 transition-all flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <MessageSquare size={16} /> Request Re-iteration
                    </button>

                    <button
                      onClick={() => startOtpFlow('reject')}
                      className="w-full py-3 text-red-500/50 hover:text-red-400 text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer"
                    >
                      Decline Submission
                    </button>
                  </div>
                ) : (
                  <div className="bg-orange-500/5 border border-orange-500/10 p-6 rounded-2xl">
                    <p className="text-orange-300 text-sm font-medium leading-relaxed italic">
                      {allApproved
                        ? "This project is fully completed and all funds have been released."
                        : "Nothing to review right now. We'll notify you once the freelancer submits a milestone."
                      }
                    </p>
                  </div>
                )}

                <div className="pt-8 border-t border-white/5">
                  <p className="text-gray-700 text-[10px] uppercase font-black tracking-widest mb-4">Sharing</p>
                  <button
                    onClick={() => {
                      const url = contract.client_view_token ? `${window.location.origin}/review-milestone/${contract.client_view_token}` : window.location.href;
                      navigator.clipboard.writeText(url);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="w-full p-4 rounded-xl bg-white/2 border border-white/5 flex items-center justify-between group hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <p className="text-gray-400 text-xs font-bold truncate pr-3">{contract.client_view_token ? `.../${contract.client_view_token}` : 'Copy Review Link'}</p>
                    {copied ? <Check size={14} className="text-[#3cb44f]" /> : <Copy size={14} className="text-gray-500 group-hover:text-white" />}
                  </button>
                </div>
              </div>
            )}

            {sideState === 'reiterate' && (
              <div className="space-y-8">
                <div>
                  <button onClick={() => setSideState('review')} className="text-gray-500 hover:text-white mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer">
                    <ArrowRight size={14} className="rotate-180" /> Back
                  </button>
                  <h3 className="text-2xl font-black text-white mb-2">Re-iteration</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">Provide detailed feedback to the freelancer on what needs to be changed or improved.</p>
                </div>

                <div className="space-y-6">
                  {otpError && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-bold text-center">
                      {otpError}
                    </div>
                  )}
                  <textarea
                    value={reiterateText}
                    onChange={(e) => setReiterateText(e.target.value)}
                    placeholder="e.g. Please update the hero section colors to match our brand guidelines..."
                    className="w-full h-48 bg-white/3 border border-white/10 rounded-2xl p-5 text-white text-sm focus:outline-none focus:border-[#3cb44f]/40 transition-all placeholder:text-gray-700"
                  />

                  <div>
                    <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Extend Due Date (Optional)</label>
                    <input
                      type="date"
                      value={newDueDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setNewDueDate(e.target.value)}
                      className="w-full bg-white/3 border border-white/10 rounded-xl p-3 text-white text-sm focus:outline-none focus:border-[#3cb44f]/40 transition-all [color-scheme:dark]"
                    />
                  </div>

                  <button
                    disabled={!reiterateText.trim() || isSendingOtp}
                    onClick={handleReiteration}
                    className="w-full py-5 rounded-2xl bg-white text-black font-black text-sm uppercase tracking-widest hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSendingOtp ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                    Submit Feedback
                  </button>
                </div>
              </div>
            )}

            {sideState === 'otp' && (
              <div className="space-y-10">
                <div>
                  <button onClick={() => setSideState('review')} className="text-gray-500 hover:text-white mb-6 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest cursor-pointer">
                    <ArrowRight size={14} className="rotate-180" /> Cancel
                  </button>
                  <h3 className="text-2xl font-black text-white mb-2">Secure Confirm</h3>
                  <p className="text-gray-500 text-sm leading-relaxed">For security, enter the 6-digit OTP sent to your registered email to {reviewAction} this milestone.</p>
                </div>

                <div className="space-y-8">
                  <div className="flex justify-between gap-2">
                    {otpCode.map((digit, i) => (
                      <input
                        key={i}
                        ref={el => otpInputRefs.current[i] = el}
                        type="text"
                        maxLength={1}
                        value={digit}
                        onChange={e => handleOtpInput(i, e.target.value)}
                        onKeyDown={e => handleKeyDown(i, e)}
                        className="w-full h-14 bg-white/3 border border-white/10 rounded-xl text-center text-xl font-black text-[#3cb44f] focus:outline-none focus:border-[#3cb44f] transition-all"
                      />
                    ))}
                  </div>

                  <button
                    onClick={verifyAndSubmit}
                    disabled={isVerifying || otpCode.some(d => !d)}
                    className="w-full py-5 rounded-2xl bg-[#3cb44f] text-black font-black text-sm uppercase tracking-widest hover:scale-[1.02] shadow-[0_8px_24px_rgba(60,180,79,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {isVerifying ? <Loader2 size={20} className="animate-spin" /> : <ShieldCheck size={20} />}
                    Verify & Release
                  </button>

                  <div className="text-center">
                    <button
                      onClick={() => startOtpFlow(reviewAction!)}
                      className="text-gray-500 hover:text-white text-[10px] font-black uppercase tracking-widest cursor-pointer"
                    >
                      Resend OTP
                    </button>
                  </div>

                  {otpError && <p className="text-red-400 text-xs text-center font-bold">{otpError}</p>}
                </div>
              </div>
            )}

            {sideState === 'success' && (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-24 h-24 rounded-full bg-[#3cb44f]/10 border border-[#3cb44f]/30 flex items-center justify-center mb-8">
                  <CheckCircle2 size={48} className="text-[#3cb44f]" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4">Action Confirmed</h3>
                <p className="text-gray-400 text-sm mb-10 leading-relaxed">
                  {reiterateSuccess
                    ? "Feedback has been sent to the freelancer. They will be notified to start the re-iteration."
                    : `The milestone has been successfully ${reviewAction === 'approve' ? 'approved and funds released' : 'rejected'}.`
                  }
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="px-10 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-black text-xs uppercase tracking-[0.2em] hover:bg-white/10 transition-all cursor-pointer"
                >
                  Done
                </button>
              </div>
            )}

          </div>
        </div>
      </main>
    </div>
  );
}
