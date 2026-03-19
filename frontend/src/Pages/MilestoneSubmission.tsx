import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2, ArrowLeft, CheckCircle2, Lock, Image, Video, FileCheck, Link2, AlertCircle, Copy, Check, Upload, Save, Calendar, FileText, X, Plus, Send } from 'lucide-react';
import { apiClient } from '@/api/client';
import { calculateContractProgress } from '@/utils/contractProgress';
import Navbar from '@/components/Navbar';

// ─── Types ───────────────────────────────────────────────────────────────────
interface Milestone {
  id: number;
  order_index: number;
  title: string;
  description?: string;
  amount: number;
  due_date?: string;
  status: string;
  submission_criteria?: string; // "Photos" | "Link" | "Video" | "Docs"
}

interface Contract {
  id: number;
  project_name: string;
  project_category?: string;
  client_name: string;
  client_email?: string;
  currency: string;
  total_amount: number;
  milestones: Milestone[];
  client_view_token?: string;
  shareable_link?: string;
}

interface DraftSubmission {
  id: number;
  milestone_id: number;
  status: string;
  description?: string;
  submitted_data?: string;
  revision_history?: string;
}

interface PhotoFile { name: string; url: string; uploading?: boolean; error?: boolean; }
interface DocFile { name: string; url: string; uploading?: boolean; error?: boolean; }

type SubmitStatus = 'draft' | 'pending_review';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function fmt(dt?: string | null): string {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function statusBadge(status: string) {
  const map: Record<string, string> = {
    pending: 'bg-yellow-500/15 text-yellow-400 border-yellow-500/30',
    submitted: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    pending_review: 'bg-blue-500/15 text-blue-400 border-blue-500/30',
    approved: 'bg-[#3cb44f]/15 text-[#3cb44f] border-[#3cb44f]/30',
    paid: 'bg-[#3cb44f]/20 text-[#3cb44f] border-[#3cb44f]/40',
    rejected: 'bg-red-500/15 text-red-400 border-red-500/30',
  };
  return map[status] ?? 'bg-white/10 text-white border-white/20';
}

function getActiveMilestone(milestones: Milestone[], targetId?: string | null): Milestone | null {
  if (targetId) {
    const found = milestones.find(m => m.id === Number(targetId));
    if (found) return found;
  }
  return milestones.find(m => m.status === 'pending' || m.status === 'rejected' || m.status === 'revision') ?? null;
}

// ─── Input class matching SignUp.tsx style ────────────────────────────────────
const INPUT = 'w-full bg-[#141414] rounded-2xl px-4 py-4 text-sm text-white border-none placeholder:text-white/40 focus:outline-none focus:ring-0';

// ─── Criteria icon helper ─────────────────────────────────────────────────────
function criteriaIcon(criteria?: string) {
  switch ((criteria || '').toString().toLowerCase().replace(/['"]/g, '')) {
    case 'photos': return <Image size={14} />;
    case 'video': return <Video size={14} />;
    case 'docs': return <FileCheck size={14} />;
    default: return <Link2 size={14} />;
  }
}

// ─── Cloudinary Upload ────────────────────────────────────────────────────────
async function uploadToCloudinary(file: File, resourceType: 'image' | 'auto'): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/${resourceType}/upload`,
    { method: 'POST', body: formData }
  );

  const data = await response.json();
  if (!response.ok) throw new Error(data.error?.message || 'Upload failed');
  return data.secure_url;
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function MilestoneSubmission() {
  const { contractId } = useParams<{ contractId: string }>();
  const [searchParams] = useSearchParams();
  const draftId = searchParams.get('draftId');
  const targetMilestoneId = searchParams.get('milestoneId');
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Form state
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('pending_review');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [reviewLink, setReviewLink] = useState('');
  const [copied, setCopied] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [activeDraftId, setActiveDraftId] = useState<number | null>(null);
  const [feedbackComment, setFeedbackComment] = useState<string | null>(null);

  // Criteria-based submission fields
  const [linkValue, setLinkValue] = useState('');
  const [driveUrl, setDriveUrl] = useState('');
  const [photoFiles, setPhotoFiles] = useState<PhotoFile[]>([]);
  const [docFiles, setDocFiles] = useState<DocFile[]>([]);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const docInputRef = useRef<HTMLInputElement>(null);

  // ── Fetch contract ──────────────────────────────────
  useEffect(() => {
    if (!contractId) return;
    (async () => {
      try {
        const res = await apiClient.get(`/contracts/${contractId}`);
        const data = res.data?.data ?? res.data;
        if (data.milestones) {
          data.milestones = [...data.milestones].sort(
            (a: Milestone, b: Milestone) => a.order_index - b.order_index
          );
        }
        setContract(data);

        // Fetch submissions to check for drafts OR locked states (pending_review)
        try {
          const subRes = await apiClient.get(`/contracts/${contractId}/submissions`);
          const subs: DraftSubmission[] = subRes.data?.data ?? subRes.data ?? [];

          const activeMs = getActiveMilestone(data.milestones, targetMilestoneId);
          if (activeMs) {
            const pendingSub = subs.find(s => s.milestone_id === activeMs.id && s.status === 'pending_review');
            if (pendingSub) setIsLocked(true);

            if (activeMs.status === 'revision' || activeMs.status === 'rejected') {
              const revSub = subs.find(s => s.milestone_id === activeMs.id && (s.status === 'revision_requested' || s.status === 'rejected'));
              if (revSub && revSub.revision_history) {
                try {
                  const hist = JSON.parse(revSub.revision_history);
                  if (Array.isArray(hist) && hist.length > 0) {
                    setFeedbackComment(hist[0].comment);
                    // Also populate the form to start modifying previous payload
                    if (revSub.description) setDescription(revSub.description);
                    if (revSub.submitted_data) {
                      const parsed = typeof revSub.submitted_data === 'string' ? JSON.parse(revSub.submitted_data) : revSub.submitted_data;
                      if (parsed.link) setLinkValue(parsed.link);
                      if (parsed.drive_url) setDriveUrl(parsed.drive_url);
                      if (parsed.photos) setPhotoFiles(parsed.photos);
                      if (parsed.docs) setDocFiles(parsed.docs);
                    }
                  }
                } catch { /* ignore parse error */ }
              }
            }

            // Auto-detect draft for active milestone if no draftId in URL
            if (!draftId) {
              const existingDraft = subs.find(s => s.milestone_id === activeMs.id && s.status === 'draft');
              if (existingDraft) setActiveDraftId(existingDraft.id);
            }
          }

          // If coming from a specific draft, prefill the form
          if (draftId) {
            const draft = subs.find(s => s.id === Number(draftId) && s.status === 'draft');
            if (draft) {
              setActiveDraftId(draft.id);
              if (draft.description) setDescription(draft.description);
              if (draft.submitted_data) {
                try {
                  const parsed = typeof draft.submitted_data === 'string'
                    ? JSON.parse(draft.submitted_data) : draft.submitted_data;
                  if (parsed.link) setLinkValue(parsed.link);
                  if (parsed.drive_url) setDriveUrl(parsed.drive_url);
                  if (parsed.photos) setPhotoFiles(parsed.photos);
                  if (parsed.docs) setDocFiles(parsed.docs);
                } catch { /* ignore parse errors */ }
              }
            }
          }
        } catch (e) { console.error("Failed to fetch submissions", e); }
      } catch (e: any) {
        setFetchError(e?.response?.data?.message || e.message || 'Failed to load contract');
      } finally {
        setLoading(false);
      }
    })();
  }, [contractId, draftId]);

  // ── Build submitted_data based on criteria ──────────────────────────────────
  const buildSubmittedData = (criteria?: string): Record<string, any> => {
    const c = (criteria || '').toString().toLowerCase().replace(/['"]/g, '');
    if (c === 'link') return { link: linkValue };
    if (c === 'video') return { drive_url: driveUrl };
    if (c === 'photos') {
      return { photos: photoFiles.filter(f => !f.error && !f.uploading) };
    }
    if (c === 'docs') {
      return { docs: docFiles.filter(f => !f.error && !f.uploading) };
    }
    return { link: linkValue };
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems = files.map(f => ({ name: f.name, url: '', uploading: true }));
    setPhotoFiles(prev => [...prev, ...newItems]);

    for (const file of files) {
      try {
        const url = await uploadToCloudinary(file, 'image');
        setPhotoFiles(prev => prev.map(p => p.name === file.name && p.uploading ? { ...p, url, uploading: false } : p));
      } catch (err) {
        setPhotoFiles(prev => prev.map(p => p.name === file.name && p.uploading ? { ...p, error: true, uploading: false } : p));
      }
    }
    if (photoInputRef.current) photoInputRef.current.value = '';
  };

  const handleDocUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;

    const newItems = files.map(f => ({ name: f.name, url: '', uploading: true }));
    setDocFiles(prev => [...prev, ...newItems]);

    for (const file of files) {
      try {
        const url = await uploadToCloudinary(file, 'auto');
        setDocFiles(prev => prev.map(p => p.name === file.name && p.uploading ? { ...p, url, uploading: false } : p));
      } catch (err) {
        setDocFiles(prev => prev.map(p => p.name === file.name && p.uploading ? { ...p, error: true, uploading: false } : p));
      }
    }
    if (docInputRef.current) docInputRef.current.value = '';
  };

  // ── Submit ──────────────────────────────────────────
  const handleAction = async (status: SubmitStatus) => {
    const active = contract ? getActiveMilestone(contract.milestones, targetMilestoneId) : null;
    if (!active) return;
    if (!description.trim()) { setSubmitError('Please add a description of what you delivered.'); return; }
    if (photoFiles.some(f => f.uploading) || docFiles.some(f => f.uploading)) { setSubmitError('Please wait for files to finish uploading.'); return; }

    setSubmitStatus(status);
    setSubmitting(true);
    setSubmitError('');

    try {
      if (activeDraftId) {
        await apiClient.put(`/contracts/${contractId}/submissions/${activeDraftId}`, {
          status,
          submitted_data: buildSubmittedData(active.submission_criteria),
          description: description.trim(),
        });
      } else {
        const res = await apiClient.post(`/contracts/${contractId}/submissions`, {
          status,
          milestone_id: active.id,
          submitted_data: buildSubmittedData(active.submission_criteria),
          description: description.trim(),
        });
        const newId = res.data?.data?.id ?? res.data?.id;
        if (newId) setActiveDraftId(newId);
      }

      // Build review link
      if (status === 'pending_review') {
        const token = contract?.client_view_token;
        if (token) {
          setReviewLink(`${window.location.origin}/review-milestone/${token}`);
        } else {
          // If token is missing, we shouldn't show a broken numeric link
          console.error("Missing client_view_token for public review link");
        }
      }
      setSubmitSuccess(true);
    } catch (e: any) {
      setSubmitError(e?.response?.data?.message || e.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(reviewLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // ── Loading ─────────────────────────────────────────
  if (loading) return (
    <div className="min-h-screen bg-[#000] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#3cb44f] animate-spin" />
        <p className="text-white/50 text-sm font-semibold tracking-widest uppercase">Loading…</p>
      </div>
    </div>
  );

  if (fetchError || !contract) return (
    <div className="min-h-screen bg-[#000] flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
        <h2 className="text-white text-2xl font-bold">Contract Not Found</h2>
        <p className="text-gray-500">{fetchError || 'Contract not found'}</p>
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-3 rounded-2xl bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-all cursor-pointer">Go Back</button>
      </div>
    </div>
  );

  const activeMilestone = getActiveMilestone(contract.milestones, targetMilestoneId);
  // allDone = no more milestones for ME (freelancer) to SUBMIT (pending/rejected/revision)
  const allDone = !activeMilestone;
  // Specifically distinguish: all approved/paid vs all submitted (still awaiting client review)  
  const allApprovedOrPaid = contract.milestones.every(m => m.status === 'approved' || m.status === 'paid');
  const hasSubmittedAwaitingReview = contract.milestones.some(m => m.status === 'submitted');
  const rawCriteria = (activeMilestone?.submission_criteria || 'Link').toString().replace(/['"]/g, '');
  const criteria = rawCriteria.toLowerCase();

  // ── Success State ───────────────────────────────────
  if (submitSuccess && activeMilestone) return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#000] flex items-center justify-center p-6 pt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-lg w-full text-center space-y-8"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15 }}>
            <div className="w-24 h-24 rounded-full bg-[#3cb44f]/15 border border-[#3cb44f]/30 flex items-center justify-center mx-auto shadow-[0_0_40px_rgba(60,180,79,0.15)]">
              {submitStatus === 'draft' ? <Save className="w-12 h-12 text-[#3cb44f]" /> : <CheckCircle2 className="w-12 h-12 text-[#3cb44f]" />}
            </div>
          </motion.div>

          <div>
            <p className="text-[#3cb44f] text-xs font-black uppercase tracking-widest mb-3">
              {submitStatus === 'draft' ? 'Saved as Draft' : 'Submitted for Review'}
            </p>
            <h1 className="text-4xl font-black text-white mb-3">
              {submitStatus === 'draft' ? 'Draft Saved!' : 'Milestone Submitted!'}
            </h1>
            <p className="text-gray-400 text-sm leading-relaxed">
              {submitStatus === 'draft'
                ? `"${activeMilestone.title}" saved as draft. Come back to submit for client review when ready.`
                : `"${activeMilestone.title}" sent to your client for review. You'll be notified once approved.`}
            </p>
          </div>

          {/* Review link — shown only on submit */}
          {submitStatus === 'pending_review' && reviewLink && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="p-5 rounded-2xl bg-white/3 border border-[#3cb44f]/20 text-left"
            >
              <p className="text-[#3cb44f] text-xs font-black uppercase tracking-widest mb-3">Client Review Link</p>
              <p className="text-gray-400 text-xs mb-3">Share this link with your client or they'll receive it via email:</p>
              <div className="flex items-center gap-3 bg-[#141414] rounded-xl px-4 py-3">
                <p className="text-white text-xs font-mono flex-1 truncate">{reviewLink}</p>
                <button
                  onClick={handleCopy}
                  className="shrink-0 p-1.5 rounded-lg bg-white/5 hover:bg-[#3cb44f]/20 transition-all cursor-pointer"
                >
                  {copied ? <Check size={14} className="text-[#3cb44f]" /> : <Copy size={14} className="text-gray-400" />}
                </button>
              </div>
            </motion.div>
          )}

          <button
            onClick={() => navigate('/dashboard')}
            className="w-full py-4 rounded-2xl bg-[#3cb44f] text-black font-black text-xs uppercase tracking-widest hover:bg-[#4dd464] transition-all cursor-pointer"
          >
            Go to Dashboard
          </button>
        </motion.div>
      </div>
    </>
  );

  // ── Main Layout ─────────────────────────────────────
  return (
    <div className="overflow-auto h-screen bg-[#000] text-white font-sans selection:bg-[#3cb44f]/30">
      <Navbar />

      <div className="max-w-7xl mx-auto min-h-screen pt-16 flex flex-col lg:flex-row">

        {/* ── LEFT — Milestones Timeline (sticky sidebar) ─── */}
        <div className="lg:w-[360px] shrink-0 p-8 lg:p-10 pt-20 my-auto lg:fixed lg:top-40 lg:h-screen lg:border-r border-white/5 overflow-y-auto">
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-xs font-bold mb-8 cursor-pointer"
          >
            <ArrowLeft size={14} /> Dashboard
          </button>

          {/* Contract info */}
          <p className="text-[#3cb44f] text-[10px] font-black uppercase tracking-widest mb-1">{contract.project_category || 'Contract'}</p>
          <h1 className="text-lg font-black text-white leading-tight mb-1">{contract.project_name}</h1>
          <p className="text-gray-500 text-xs mb-6">Client: {contract.client_name}</p>

          {/* Progress bar */}
          {(() => {
            const progressPct = calculateContractProgress(contract.milestones, contract.total_amount);
            return (
              <div className="mb-7">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-gray-600 text-[10px] font-bold uppercase tracking-wider">Overall Progress</p>
                  <p className="text-[#3cb44f] text-[10px] font-black">{progressPct}%</p>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-[#3cb44f] rounded-full transition-all duration-1000"
                    style={{ width: `${progressPct}%`, boxShadow: '0 0 8px #3cb44f44' }}
                  />
                </div>
              </div>
            );
          })()}


          {/* Timeline */}
          <div className="relative">
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-white/5" />
            <div className="space-y-3">
              {contract.milestones.map((ms, i) => {
                const isActiveMil = ms.id === activeMilestone?.id;
                const isDone = ms.status === 'approved' || ms.status === 'paid';
                const isLocked = !isDone && !isActiveMil;
                return (
                  <div key={ms.id} className="flex items-start gap-4">
                    <div className={`relative z-10 shrink-0 w-8 h-8 rounded-full border flex items-center justify-center mt-1 bg-[#000] transition-all ${isDone ? 'border-[#3cb44f] bg-[#3cb44f]/10' : isActiveMil ? 'border-[#3cb44f] shadow-[0_0_12px_rgba(60,180,79,0.25)]' : 'border-white/10'
                      }`}>
                      {isDone ? <CheckCircle2 size={14} className="text-[#3cb44f]" /> : isLocked ? <Lock size={12} className="text-gray-700" /> : <span className="text-[#3cb44f] text-xs font-bold">{i + 1}</span>}
                    </div>
                    <div className={`flex-1 p-4 rounded-2xl border transition-all ${isActiveMil ? 'border-[#3cb44f]/40 bg-[#3cb44f]/5' : isDone ? 'border-white/8 bg-white/2' : 'border-white/5'
                      }`}>
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <p className={`font-bold text-sm ${isActiveMil ? 'text-white' : isDone ? 'text-gray-500' : 'text-gray-600'}`}>{ms.title}</p>
                        <span className={`px-2 py-0.5 rounded-full border text-[9px] font-bold shrink-0 ${statusBadge(ms.status)}`}>{ms.status}</span>
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span className={`text-xs font-bold ${isActiveMil ? 'text-[#3cb44f]' : 'text-gray-700'}`}>{contract.currency} {ms.amount.toLocaleString()}</span>
                        {ms.due_date && <span className="flex items-center gap-1 text-gray-700 text-[10px]"><Calendar size={9} /> {fmt(ms.due_date)}</span>}
                        {ms.submission_criteria && (
                          <span className="flex items-center gap-1 text-gray-600 text-[10px]">
                            {criteriaIcon(ms.submission_criteria)} {ms.submission_criteria.toString().replace(/['"]/g, '')}
                          </span>
                        )}
                      </div>
                      {isLocked && !isDone && <p className="text-gray-700 text-[10px] mt-1.5 flex items-center gap-1"><Lock size={8} /> Complete previous first</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── RIGHT — Submission Form ─────────────────── */}
        <div className="flex-1 p-8 lg:p-12 ml-96 my-auto">
          <AnimatePresence mode="wait">

            {/* All done — either submitted and awaiting review, or approved */}
            {allDone && (
              <motion.div key="all-done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-center py-32">
                <div className={`w-20 h-20 rounded-full border flex items-center justify-center mb-6 ${allApprovedOrPaid ? 'bg-[#3cb44f]/10 border-[#3cb44f]/30' : 'bg-blue-500/10 border-blue-500/30'}`}>
                  <CheckCircle2 size={36} className={allApprovedOrPaid ? 'text-[#3cb44f]' : 'text-blue-400'} />
                </div>
                <h2 className="text-white font-black text-2xl mb-2">
                  {allApprovedOrPaid ? 'All Milestones Complete!' : hasSubmittedAwaitingReview ? 'Submitted — Awaiting Review' : 'All Milestones Submitted!'}
                </h2>
                <p className="text-gray-500 text-sm mb-8">
                  {allApprovedOrPaid
                    ? 'All milestones have been approved by the client.'
                    : hasSubmittedAwaitingReview
                    ? 'Your submission is pending client approval. You\'ll be notified once reviewed.'
                    : 'All milestones have been submitted. Awaiting client approval.'}
                </p>
                <button onClick={() => navigate('/dashboard')} className="px-8 py-4 rounded-2xl bg-[#3cb44f] text-black font-black text-xs uppercase tracking-widest hover:bg-[#4dd464] transition-all cursor-pointer">Back to Dashboard</button>
              </motion.div>
            )}

            {/* Active form */}
            {activeMilestone && (
              <motion.div key={activeMilestone.id} initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -12 }} transition={{ duration: 0.22 }} className="w-full max-w-2xl">

                {feedbackComment && (
                  <div className="mb-6 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                    <h4 className="flex items-center gap-2 text-orange-400 font-bold mb-2">
                       <AlertCircle size={16} /> Client Feedback
                    </h4>
                    <p className="text-orange-200 text-sm leading-relaxed">{feedbackComment}</p>
                    <p className="text-orange-400/60 mt-2 text-[10px] uppercase font-bold tracking-wider">Please adapt your submission and re-submit.</p>
                  </div>
                )}

                {/* Active Milestone Title */}
                <div className="mb-8">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-[#3cb44f]/10 flex items-center justify-center border border-[#3cb44f]/20">
                      <FileText className="text-[#3cb44f]" size={20} />
                    </div>
                    <div>
                      <h2 className="text-2xl font-black text-white">{activeMilestone.title}</h2>
                      <p className="text-white/40 text-xs mt-0.5">Active Milestone delivery</p>
                    </div>
                  </div>
                </div>

                {/* Submission Lock Banner */}
                {isLocked && !submitSuccess && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8 p-6 rounded-[32px] bg-blue-500/10 border border-blue-500/20 flex items-start gap-4"
                  >
                    <div className="w-12 h-12 rounded-2xl bg-blue-500/20 flex items-center justify-center shrink-0">
                      <Lock className="text-blue-400" size={24} />
                    </div>
                    <div>
                      <h3 className="text-white font-bold text-lg">Under Review</h3>
                      <p className="text-blue-200/60 text-sm leading-relaxed mt-1">
                        You've already submitted work for this milestone. Please wait for the client to review or approve it before submitting again.
                      </p>
                      <button
                        onClick={() => navigate(`/dashboard`)}
                        className="mt-4 px-5 py-2.5 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Back to Dashboard
                      </button>
                    </div>
                  </motion.div>
                )}

                {/* Milestone header */}
                <div className="mb-10">
                  <p className="text-[#3cb44f] text-[10px] font-black uppercase tracking-widest mb-3 flex items-center gap-2">
                    <span className="w-4 h-px bg-[#3cb44f]" /> Current Milestone
                  </p>
                  <h2 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-4">{activeMilestone.title}</h2>
                  <div className="flex items-center gap-4 flex-wrap">
                    <span className="text-[#3cb44f] font-black text-xl">{contract.currency} {activeMilestone.amount.toLocaleString()}</span>
                    {activeMilestone.due_date && (
                      <span className="flex items-center gap-1.5 text-gray-500 text-sm border border-white/10 px-3 py-1 rounded-full">
                        <Calendar size={12} /> Due {fmt(activeMilestone.due_date)}
                      </span>
                    )}
                    <span className={`px-3 py-1 rounded-full border text-xs font-bold ${statusBadge(activeMilestone.status)}`}>{activeMilestone.status}</span>
                    {activeMilestone.submission_criteria && (
                      <span className="flex items-center gap-1.5 text-gray-400 text-xs border border-white/10 px-3 py-1 rounded-full">
                        {criteriaIcon(activeMilestone.submission_criteria)} {rawCriteria} Required
                      </span>
                    )}
                  </div>

                  {activeMilestone.description && (
                    <div className="mt-6 p-5 rounded-2xl bg-white/2 border border-white/8">
                      <p className="text-xs text-[#3cb44f] font-black uppercase tracking-wider mb-2 flex items-center gap-2"><FileText size={12} /> Submission Criteria</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{activeMilestone.description}</p>
                    </div>
                  )}
                </div>

                {/* Description */}
                <div className="mb-7">
                  <label className="text-white text-xs font-black uppercase tracking-wider block mb-3">Delivery Description <span className="text-red-400">*</span></label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what you've delivered — what was built, key decisions made, and how it meets the acceptance criteria."
                    className={`${INPUT} resize-none`}
                    disabled={isLocked}
                  />
                </div>

                {/* ── Type-aware submission widget ─── */}
                <div className="mb-10">
                  <label className="text-white text-xs font-black uppercase tracking-wider block mb-4 flex items-center gap-2">
                    {criteriaIcon(activeMilestone.submission_criteria)}
                    {rawCriteria} Submission
                  </label>

                  {/* LINK */}
                  {(criteria === 'link' || !activeMilestone.submission_criteria) && (
                    <div className="space-y-3">
                      <div className="relative">
                        <input
                          type="url"
                          value={linkValue}
                          onChange={e => setLinkValue(e.target.value)}
                          placeholder="https://github.com/your-repo  or  https://figma.com/..."
                          className={INPUT}
                          disabled={isLocked}
                        />
                      </div>
                      <p className="text-gray-600 text-xs">Paste any relevant URL — GitHub repo, Figma file, hosted demo, etc.</p>
                    </div>
                  )}

                  {/* VIDEO (Google Drive) */}
                  {criteria === 'video' && (
                    <div className="space-y-3">
                      <div className="relative">
                        <Video size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" />
                        <input
                          type="url"
                          value={driveUrl}
                          onChange={e => setDriveUrl(e.target.value)}
                          placeholder="https://drive.google.com/file/d/..."
                          className={`${INPUT} pl-10`}
                          disabled={isLocked}
                        />
                      </div>
                      <p className="text-gray-600 text-xs">Upload your video to Google Drive, set sharing to "Anyone with link", then paste the URL.</p>
                    </div>
                  )}

                  {/* PHOTOS */}
                  {criteria === 'photos' && (
                    <div className="space-y-4">
                      <input ref={photoInputRef} type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} disabled={isLocked} />
                      <button
                        onClick={() => photoInputRef.current?.click()}
                        className="w-full py-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#3cb44f]/40 bg-white/2 hover:bg-[#3cb44f]/3 text-center transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:bg-white/2"
                        disabled={isLocked}
                      >
                        <Upload size={24} className="mx-auto mb-2 text-gray-600 group-hover:text-[#3cb44f] transition-colors" />
                        <p className="text-gray-500 text-sm font-semibold group-hover:text-white transition-colors">Click to upload photos</p>
                        <p className="text-gray-700 text-xs mt-1">PNG, JPG, GIF, WebP supported</p>
                      </button>
                      {photoFiles.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                          {photoFiles.map((f, i) => (
                            <div key={i} className="relative group rounded-xl overflow-hidden border border-white/10 aspect-square bg-[#141414]">
                              {f.uploading ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/60 z-10">
                                  <Loader2 size={24} className="text-[#3cb44f] animate-spin mb-2" />
                                  <span className="text-[10px] text-[#3cb44f] font-bold">Uploading...</span>
                                </div>
                              ) : f.error ? (
                                <div className="absolute inset-0 flex flex-col items-center justify-center bg-red-500/10 z-10">
                                  <AlertCircle size={24} className="text-red-400 mb-2" />
                                  <span className="text-[10px] text-red-400 font-bold">Failed</span>
                                </div>
                              ) : (
                                <img src={f.url} alt={f.name} className="w-full h-full object-cover" />
                              )}
                              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center z-20">
                                <button onClick={() => setPhotoFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-2 rounded-full bg-red-500/80 cursor-pointer" disabled={isLocked}>
                                  <X size={12} />
                                </button>
                              </div>
                              <p className="absolute bottom-0 left-0 right-0 bg-black/70 text-[9px] text-white px-2 py-1 truncate z-30">{f.name}</p>
                            </div>
                          ))}
                          <button onClick={() => photoInputRef.current?.click()} className="flex flex-col items-center justify-center rounded-xl border border-dashed border-white/10 aspect-square bg-white/2 hover:bg-white/5 transition-all cursor-pointer gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white/2" disabled={isLocked}>
                            <Plus size={20} className="text-gray-600" />
                            <p className="text-gray-600 text-[10px]">Add more</p>
                          </button>
                        </div>
                      )}
                    </div>
                  )}

                  {/* DOCS */}
                  {criteria === 'docs' && (
                    <div className="space-y-4">
                      <input ref={docInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.xlsx,.csv" multiple className="hidden" onChange={handleDocUpload} disabled={isLocked} />
                      <button
                        onClick={() => docInputRef.current?.click()}
                        className="w-full py-6 rounded-2xl border-2 border-dashed border-white/10 hover:border-[#3cb44f]/40 bg-white/2 hover:bg-[#3cb44f]/3 text-center transition-all cursor-pointer group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:border-white/10 disabled:hover:bg-white/2"
                        disabled={isLocked}
                      >
                        <Upload size={24} className="mx-auto mb-2 text-gray-600 group-hover:text-[#3cb44f] transition-colors" />
                        <p className="text-gray-500 text-sm font-semibold group-hover:text-white transition-colors">Click to upload documents</p>
                        <p className="text-gray-700 text-xs mt-1">PDF, DOC, DOCX, XLSX, CSV supported</p>
                      </button>
                      {docFiles.length > 0 && (
                        <div className="space-y-2">
                          {docFiles.map((f, i) => (
                            <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-[#141414] border border-white/8">
                              {f.uploading ? (
                                <Loader2 size={16} className="text-[#3cb44f] animate-spin shrink-0" />
                              ) : f.error ? (
                                <AlertCircle size={16} className="text-red-400 shrink-0" />
                              ) : (
                                <FileCheck size={16} className="text-[#3cb44f] shrink-0" />
                              )}
                              <p className={`text-sm flex-1 truncate ${f.error ? 'text-red-400/80 line-through' : 'text-white'}`}>{f.name}</p>
                              <button onClick={() => setDocFiles(prev => prev.filter((_, idx) => idx !== i))} className="p-1.5 rounded-lg bg-white/5 hover:bg-red-500/20 text-gray-500 hover:text-red-400 transition-all cursor-pointer" disabled={isLocked}>
                                <X size={12} />
                              </button>
                            </div>
                          ))}
                          <button onClick={() => docInputRef.current?.click()} className="w-full py-3 rounded-xl border border-dashed border-white/8 text-gray-600 hover:text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-600" disabled={isLocked}>
                            <Plus size={14} /> Add more files
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Error */}
                {submitError && (
                  <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="mb-6 p-4 rounded-2xl bg-red-500/8 border border-red-500/20 flex items-start gap-3">
                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{submitError}</p>
                  </motion.div>
                )}

                {/* ── Action Buttons ─── */}
                <div className="border-t border-white/8 pt-8">
                  {isLocked ? (
                    <div className="flex flex-col items-center justify-center py-6 bg-white/3 rounded-[32px] border border-white/8">
                      <Lock className="text-gray-600 mb-2" size={20} />
                      <p className="text-gray-500 text-sm font-medium">Submission Locked</p>
                      <p className="text-gray-700 text-[10px] mt-1 italic">Under client review</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex flex-col sm:flex-row gap-3">
                        <button
                          onClick={() => handleAction('draft')}
                          disabled={submitting || !description.trim()}
                          className="flex-1 group py-4 rounded-2xl border border-white/10 bg-[#141414] hover:bg-white/8 hover:border-white/20 text-white font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                        >
                          {submitting && submitStatus === 'draft' ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                          Save as Draft
                        </button>
                        <button
                          onClick={() => handleAction('pending_review')}
                          disabled={submitting || !description.trim()}
                          className="flex-[2] group py-4 rounded-2xl bg-[#3cb44f] hover:bg-[#4dd464] text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-[#3cb44f]/20"
                        >
                          {submitting && submitStatus === 'pending_review' ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} className="-rotate-45" />}
                          Submit for Review
                        </button>
                      </div>
                      <p className="text-gray-700 text-xs mt-3 text-center">
                        "Submit for Review" notifies the client immediately. "Save as Draft" is private.
                      </p>
                    </>
                  )}
                </div>

              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
