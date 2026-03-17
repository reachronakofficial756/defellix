import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertCircle, Loader2, Calendar, DollarSign,
  Link2, XCircle, ArrowRight, MessageSquare, ExternalLink
} from 'lucide-react';
import { apiClient } from '../api/client';
import Navbar from '@/components/Navbar';

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
}

interface Submission {
  id: number;
  milestone_id: number;
  status: string; // 'pending_review', 'accepted', etc.
  submitted_data?: string | any;
  description?: string;
  revision_history?: string;
}

interface Contract {
  id: number;
  project_name: string;
  project_category?: string;
  client_name: string;
  currency: string;
  total_amount: number;
  milestones: Milestone[];
}

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
    rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return map[status] ?? 'bg-white/10 text-white border-white/20';
}

function getActiveMilestone(milestones: Milestone[]): Milestone | null {
  // the client is reviewing the first 'submitted' milestone
  return milestones.find(m => m.status === 'submitted') ?? null;
}

export default function MilestoneReview() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Review State
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject' | null>(null);
  const [feedback, setFeedback] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!contractId) return;
    (async () => {
      try {
        // Fetch contract. Assume contractId from params is public token or ID
        // The endpoint the user asked me to use:
        // /api/v1/contracts/{id}/submissions and /api/v1/public/contracts/{token}/submissions/{sub_id}/review
        
        let contractData: Contract | null = null;
        let cIdNumeric = 0;
        
        // Let's attempt to use apiClient to fetch the contract first
        try {
            // First try authenticated dashboard endpoint if this is a numeric ID
            const res = await apiClient.get(`/contracts/${contractId}`);
            contractData = res.data?.data ?? res.data;
            cIdNumeric = contractData!.id;
        } catch (authErr) {
            // If it failed, maybe contractId is the public token, try public endpoint
            const res = await apiClient.get(`/public/contracts/${contractId}`);
            contractData = res.data?.data ?? res.data;
            cIdNumeric = contractData!.id;
        }

        if (contractData?.milestones) {
          contractData.milestones = [...contractData.milestones].sort(
            (a: Milestone, b: Milestone) => a.order_index - b.order_index
          );
        }
        setContract(contractData);

        // Fetch submissions
        try {
            const subRes = await apiClient.get(`/contracts/${cIdNumeric}/submissions`);
            const subData = subRes.data?.data ?? subRes.data;
            if (Array.isArray(subData)) {
                setSubmissions(subData);
            }
        } catch (subErr) {
            console.warn("Failed to fetch submissions, or none available:", subErr);
        }

      } catch (e: any) {
        setFetchError(e?.response?.data?.message || e.message || 'Failed to load contract');
      } finally {
        setLoading(false);
      }
    })();
  }, [contractId]);

  const getActiveSubmission = () => {
    // The active submission is the one pending review
    return submissions.find(s => s.status === 'pending_review' || s.status === 'submitted') || submissions[submissions.length - 1];
  };

  const handleReview = async (action: 'approve' | 'reject') => {
    const activeS = getActiveSubmission();
    if (!activeS) {
      setError('No active submission found to review.');
      return;
    }
    
    if (action === 'reject' && !feedback.trim()) {
      setError('Please provide feedback on what needs to be changed.');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const payload = {
        action: action === 'approve' ? 'accept' : 'revision',
        ...(action === 'reject' && { comment: feedback.trim() })
      };

      await apiClient.post(`/public/contracts/${contractId}/submissions/${activeS.id}/review`, payload);
      setSuccess(true);
      setReviewAction(action);
    } catch (e: any) {
      setError(e?.response?.data?.message || e.message || 'Review failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0d1a10] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#3cb44f] animate-spin" />
        <p className="text-white/50 text-sm font-semibold tracking-widest uppercase">Loading…</p>
      </div>
    </div>
  );

  if (fetchError || !contract) return (
    <div className="min-h-screen bg-[#0d1a10] flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
        <h2 className="text-white text-2xl font-bold">Contract Not Found</h2>
        <p className="text-gray-500">{fetchError || 'Contract not found'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-3 rounded-xl bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-all">Go Back</button>
      </div>
    </div>
  );

  const activeMilestone = getActiveMilestone(contract.milestones);
  const pendingOrRejected = contract.milestones.find(m => m.status === 'pending' || m.status === 'rejected');

  if (success && activeMilestone) return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#000] flex items-center justify-center p-6 pt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15 }}>
            <div className={`w-24 h-24 rounded-full flex items-center justify-center mx-auto border ${
              reviewAction === 'approve' ? 'bg-[#3cb44f]/15 border-[#3cb44f]/30' : 'bg-red-500/15 border-red-500/30'
            }`}>
              {reviewAction === 'approve' ? (
                <CheckCircle2 className="w-12 h-12 text-[#3cb44f]" />
              ) : (
                <MessageSquare className="w-12 h-12 text-red-500" />
              )}
            </div>
          </motion.div>
          <div>
            <p className={`text-xs font-black uppercase tracking-widest mb-3 ${
              reviewAction === 'approve' ? 'text-[#3cb44f]' : 'text-red-500'
            }`}>
              {reviewAction === 'approve' ? 'Milestone Approved' : 'Revisions Requested'}
            </p>
            <h1 className="text-4xl font-black text-white mb-3">
              {reviewAction === 'approve' ? 'Great Success!' : 'Feedback Sent!'}
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              {reviewAction === 'approve'
                ? `You have approved "${activeMilestone.title}". The funds can now be released to the freelancer.`
                : `Your revision notes for "${activeMilestone.title}" have been sent to the freelancer.`}
            </p>
          </div>
          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 rounded-2xl bg-[#3cb44f] text-black font-black text-xs uppercase tracking-widest hover:bg-[#4dd464] transition-all"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-[#000] text-white font-sans selection:bg-[#3cb44f]/30 pb-20">
      <Navbar />

      <div className="w-[100%] max-w-4xl mx-auto min-h-screen pt-24 flex flex-col">
        <div className="w-full px-8 lg:px-12 pt-8">
          <h1 className="text-2xl lg:text-3xl font-black text-white leading-tight mb-1">{contract.project_name}</h1>
          <div className="mt-3 flex items-center gap-5 text-xs">
            <span className="flex items-center gap-1.5 text-gray-500">
              <DollarSign size={13} className="text-[#3cb44f]" />
              <span className="text-white font-bold">{contract.currency} {contract.total_amount.toLocaleString()}</span>
            </span>
            <span className="text-gray-600">{contract.milestones.length} milestones</span>
          </div>
        </div>

        <div className="w-full p-8 lg:p-12">
          {!activeMilestone ? (
             <motion.div
               key="no-submitted"
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               className="flex flex-col items-center justify-center text-center py-24 bg-[#050505] border border-white/5 rounded-3xl"
             >
               {pendingOrRejected ? (
                 <>
                   <Loader2 size={48} className="text-gray-600 mb-4 animate-spin-slow" />
                   <h2 className="text-white font-black text-2xl mb-2">Awaiting Submission</h2>
                   <p className="text-gray-500 text-sm">The freelancer is currently working on the milestone.</p>
                 </>
               ) : (
                 <>
                   <CheckCircle2 size={56} className="text-[#3cb44f] mb-4" />
                   <h2 className="text-white font-black text-2xl mb-2">All Caught Up!</h2>
                   <p className="text-gray-500 text-sm">There are no pending submissions to review for this contract.</p>
                 </>
               )}
               <button
                 onClick={() => navigate('/dashboard')}
                 className="mt-8 px-8 py-4 rounded-xl border border-white/10 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/5 transition-all"
               >
                 Back to Dashboard
               </button>
             </motion.div>
          ) : (
            <motion.div
              key={activeMilestone.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="mb-10 p-6 rounded-3xl bg-[#050805] border border-[#3cb44f]/30">
                <p className="text-[#3cb44f] text-[10px] font-bold uppercase tracking-widest mb-2">
                  Review Milestone
                </p>
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-3xl lg:text-4xl font-bold text-white leading-tight mb-3">
                      {activeMilestone.title}
                    </h2>
                    <div className="flex items-center gap-5 flex-wrap">
                      <span className="text-[#3cb44f] font-bold text-lg">
                        {contract.currency} {activeMilestone.amount.toLocaleString()}
                      </span>
                      {activeMilestone.due_date && (
                        <span className="flex items-center gap-1.5 text-gray-500 text-sm">
                          <Calendar size={14} /> Due {fmt(activeMilestone.due_date)}
                        </span>
                      )}
                      <span className={`px-2.5 py-1 rounded-full border text-xs font-bold ${statusBadge(activeMilestone.status)}`}>
                        {activeMilestone.status}
                      </span>
                    </div>
                  </div>
                </div>

                {activeMilestone.submission_criteria && (
                  <div className="mt-5 p-4 rounded-xl bg-black border border-white/5">
                    <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Expected Criteria</p>
                    <p className="text-gray-400 text-sm leading-relaxed">{activeMilestone.submission_criteria}</p>
                  </div>
                )}
              </div>

              {/* Submitted Content */}
              <div className="mb-10 space-y-6">
                <div>
                  <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
                    Freelancer's Delivery Notes
                  </h3>
                  <div className="bg-[#080b09] border border-white/5 rounded-2xl p-5">
                    <p className="text-white whitespace-pre-wrap text-sm leading-relaxed">
                      {getActiveSubmission()?.description || "No notes provided."}
                    </p>
                  </div>
                </div>

                {getActiveSubmission()?.submitted_data && (
                  <div>
                     <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-4 border-b border-white/10 pb-2">
                      Submitted Deliverables & Links
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {Object.entries((typeof getActiveSubmission()?.submitted_data === 'string' ? JSON.parse(getActiveSubmission()?.submitted_data as string) : getActiveSubmission()?.submitted_data) || {}).map(([key, url]: [string, any], idx) => (
                        <a
                          key={idx}
                          href={url.startsWith('http') ? url : `https://${url}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:border-[#3cb44f]/50 hover:bg-[#3cb44f]/5 transition-all group"
                        >
                          <div className="flex items-center gap-3 overflow-hidden">
                            <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0 group-hover:bg-[#3cb44f]/20 transition-all">
                              <Link2 size={14} className="text-white group-hover:text-[#3cb44f]" />
                            </div>
                            <div className="truncate">
                              <p className="text-xs text-gray-400 font-semibold uppercase tracking-wider mb-0.5">{key}</p>
                              <p className="text-white text-sm truncate font-medium">{url}</p>
                            </div>
                          </div>
                          <ExternalLink size={16} className="text-gray-500 group-hover:text-[#3cb44f] shrink-0 ml-3" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action Area */}
              <div className="pt-6 border-t border-white/10">
                <h3 className="text-white text-xs font-bold uppercase tracking-wider mb-4">
                  Review Decision
                </h3>

                <div className="flex flex-col sm:flex-row gap-4 mb-6">
                  <button
                    onClick={() => setReviewAction('approve')}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                      reviewAction === 'approve'
                        ? 'bg-[#3cb44f] text-black border-[#3cb44f]'
                        : 'bg-transparent text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <CheckCircle2 size={16} /> Approve Milestone
                  </button>
                  <button
                    onClick={() => setReviewAction('reject')}
                    className={`flex-1 py-4 flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                      reviewAction === 'reject'
                        ? 'bg-red-500 text-white border-red-500'
                        : 'bg-transparent text-gray-400 border-white/10 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <XCircle size={16} /> Request Revisions
                  </button>
                </div>

                <AnimatePresence>
                  {reviewAction === 'reject' && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden mb-6"
                    >
                      <label className="text-white text-xs font-bold uppercase tracking-wider block mb-2">
                        Revision Notes <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        rows={4}
                        value={feedback}
                        onChange={e => setFeedback(e.target.value)}
                        placeholder="Explain what needs to be changed or fixed before you can approve this milestone..."
                        className="w-full bg-[#080b09] border border-red-500/30 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-red-500/80 transition-all resize-none placeholder:text-gray-600"
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                  >
                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{error}</p>
                  </motion.div>
                )}

                {reviewAction && (
                  <motion.button
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    onClick={() => handleReview(reviewAction)}
                    disabled={submitting || (reviewAction === 'reject' && !feedback.trim())}
                    className={`w-full py-5 rounded-xl text-black font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 transition-all shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                      reviewAction === 'approve'
                        ? 'bg-[#3cb44f] hover:bg-[#4dd464] shadow-[#3cb44f]/20'
                        : 'bg-red-500 hover:bg-red-400 shadow-red-500/20 text-white'
                    }`}
                  >
                    {submitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <ArrowRight size={16} strokeWidth={2.5} />
                    )}
                    {submitting 
                      ? 'Processing…' 
                      : reviewAction === 'approve' 
                        ? 'Confirm Approval' 
                        : 'Send Revision Request'}
                  </motion.button>
                )}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
