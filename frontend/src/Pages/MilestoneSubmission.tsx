import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, AlertCircle, Loader2, Send, Calendar,
  Link2, X, Plus, Lock
} from 'lucide-react';
import { apiClient } from '../api/client';
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
  submission_criteria?: string;
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

type SubmitStatus = 'draft' | 'submitted';

interface DataEntry {
  key: string;
  value: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

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

// The active milestone is the FIRST pending one (earlier milestones must be done first)
function getActiveMilestone(milestones: Milestone[]): Milestone | null {
  return milestones.find(m => m.status === 'pending' || m.status === 'rejected') ?? null;
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MilestoneSubmission() {
  const { contractId } = useParams<{ contractId: string }>();
  const navigate = useNavigate();

  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState('');

  // Form state
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus>('submitted');
  const [description, setDescription] = useState('');
  const [dataEntries, setDataEntries] = useState<DataEntry[]>([{ key: '', value: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // ── Fetch contract ──────────────────────────────────
  useEffect(() => {
    if (!contractId) return;
    (async () => {
      try {
        const res = await apiClient.get(`/contracts/${contractId}`);
        const data = res.data?.data ?? res.data;
        // Sort milestones by order_index so sequential check is reliable
        if (data.milestones) {
          data.milestones = [...data.milestones].sort(
            (a: Milestone, b: Milestone) => a.order_index - b.order_index
          );
        }
        setContract(data);
      } catch (e: any) {
        setFetchError(e?.response?.data?.message || e.message || 'Failed to load contract');
      } finally {
        setLoading(false);
      }
    })();
  }, [contractId]);

  // ── Data entry helpers ──────────────────────────────
  const addEntry = () => setDataEntries(prev => [...prev, { key: '', value: '' }]);
  const removeEntry = (i: number) => setDataEntries(prev => prev.filter((_, idx) => idx !== i));
  const updateEntry = (i: number, field: 'key' | 'value', val: string) =>
    setDataEntries(prev => prev.map((e, idx) => idx === i ? { ...e, [field]: val } : e));

  const buildSubmittedData = (): Record<string, string> => {
    const obj: Record<string, string> = {};
    dataEntries.forEach(({ key, value }) => { if (key.trim()) obj[key.trim()] = value; });
    return obj;
  };

  // ── Submit ──────────────────────────────────────────
  const handleSubmit = async () => {
    const active = contract ? getActiveMilestone(contract.milestones) : null;
    if (!active) return;
    if (!description.trim()) { setSubmitError('Please add a description of what you delivered.'); return; }
    setSubmitting(true);
    setSubmitError('');
    try {
      await apiClient.post(`/milestones/${active.id}/submit`, {
        status: submitStatus,
        milestone_id: active.id,
        submitted_data: buildSubmittedData(),
        description: description.trim(),
      });
      setSubmitSuccess(true);
    } catch (e: any) {
      setSubmitError(e?.response?.data?.message || e.message || 'Submission failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Loading ─────────────────────────────────────────
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
        <button onClick={() => navigate(-1)} className="mt-4 px-6 py-3 rounded-xl bg-white/5 text-white text-sm font-bold hover:bg-white/10 transition-all cursor-pointer">Go Back</button>
      </div>
    </div>
  );

  const activeMilestone = getActiveMilestone(contract.milestones);
  const allDone = !activeMilestone;

  // ── Success State ───────────────────────────────────
  if (submitSuccess && activeMilestone) return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#000] flex items-center justify-center p-6 pt-24">
        <motion.div
          initial={{ opacity: 0, scale: 0.92 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md w-full text-center space-y-8"
        >
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.15 }}>
            <div className="w-24 h-24 rounded-full bg-[#3cb44f]/15 border border-[#3cb44f]/30 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-12 h-12 text-[#3cb44f]" />
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
                ? `"${activeMilestone.title}" saved as draft. Submit for client review when ready.`
                : `"${activeMilestone.title}" sent to your client for review. You'll be notified once approved.`}
            </p>
          </div>
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
    <div className="min-h-screen bg-[#000] text-white font-sans selection:bg-[#3cb44f]/30">
      <Navbar />

      <div className="w-[100%] min-h-screen pt-16 flex flex-col">

        {/* ── TOP — Milestones Timeline ─────────────────── */}
        <div className="w-full p-8 lg:p-12 pt-12">

          {/* Sequential milestone list — view only */}
          <div className="relative">
            {/* Vertical connector line */}
            <div className="absolute left-[15px] top-4 bottom-4 w-px bg-white/8" />

            <div className="space-y-3">
              {contract.milestones.map((ms, i) => {
                const isActive = ms.id === activeMilestone?.id;
                const isDone = ms.status === 'approved' || ms.status === 'paid';
                const isLocked = !isDone && !isActive; // earlier not done OR later ones

                return (
                  <div key={ms.id} className="flex items-start gap-4">
                    {/* Circle node */}
                    <div className={`relative z-10 shrink-0 w-8 h-8 rounded-full border flex items-center justify-center mt-1 transition-all bg-[#000000] ${
                      isDone
                        ? 'border-[#3cb44f] text-[#3cb44f]'
                        : isActive
                          ? 'border-[#3cb44f] shadow-[0_0_15px_rgba(60,180,79,0.3)]'
                          : 'border-white/10'
                    }`}>
                      {isDone ? (
                        <CheckCircle2 size={14} className="text-[#3cb44f]" />
                      ) : isLocked ? (
                        <Lock size={12} className="text-gray-600" />
                      ) : (
                        <span className="text-[#3cb44f] text-xs font-bold">{i + 1}</span>
                      )}
                    </div>

                    {/* Milestone info */}
                    <div className={`flex-1 p-5 rounded-2xl border transition-all ${
                      isActive
                        ? 'border-[#3cb44f] bg-[#020502]'
                        : isDone
                          ? 'border-white/10 bg-[#000000]'
                          : 'border-white/5 bg-[#000000]'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className={`font-bold text-base ${isActive ? 'text-white' : 'text-gray-500'}`}>
                            {ms.title}
                          </p>
                          <div className="flex items-center gap-3 mt-1 flex-wrap">
                            <span className={`text-xs font-bold ${isActive ? 'text-[#3cb44f]' : 'text-gray-600'}`}>
                              {contract.currency} {ms.amount.toLocaleString()}
                            </span>
                            {ms.due_date && (
                              <span className="flex items-center gap-1 text-gray-600 text-[11px]">
                                <Calendar size={10} /> {fmt(ms.due_date)}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold shrink-0 ${statusBadge(ms.status)}`}>
                          {ms.status}
                        </span>
                      </div>
                      {isLocked && !isDone && (
                        <p className="text-gray-700 text-[10px] mt-2 flex items-center gap-1">
                          <Lock size={9} /> Complete previous milestone first
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* ── BOTTOM — Submission Form ───────────────────── */}
        <div className="w-full p-8 lg:p-12">
          <AnimatePresence mode="wait">

            {/* All milestones done */}
            {allDone && (
              <motion.div
                key="all-done"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-24"
              >
                <CheckCircle2 size={56} className="text-[#3cb44f] mb-4" />
                <h2 className="text-white font-black text-2xl mb-2">All Milestones Complete!</h2>
                <p className="text-gray-500 text-sm">All milestones for this contract have been submitted and approved.</p>
                <button
                  onClick={() => navigate('/dashboard')}
                  className="mt-8 px-8 py-4 rounded-2xl bg-[#3cb44f] text-black font-black text-xs uppercase tracking-widest hover:bg-[#4dd464] transition-all cursor-pointer"
                >
                  Back to Dashboard
                </button>
              </motion.div>
            )}

            {/* Active milestone form */}
            {activeMilestone && (
              <motion.div
                key={activeMilestone.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -12 }}
                transition={{ duration: 0.22 }}
                className="w-full"
              >
                {/* Milestone header */}
                <div className="mb-10">
                  <p className="text-[#3cb44f] text-[10px] font-bold uppercase tracking-widest mb-2">
                    Current Milestone
                  </p>
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

                  {activeMilestone.submission_criteria && (
                    <div className="mt-5 p-4 rounded-xl bg-white/3 border border-white/8">
                      <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mb-1">Submission Criteria</p>
                      <p className="text-gray-300 text-sm leading-relaxed">{activeMilestone.submission_criteria}</p>
                    </div>
                  )}
                </div>

                {/* Submission type */}
                <div className="mb-7">
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-3">
                    Submission Type
                  </label>
                  <div className="flex gap-2">
                    {(['submitted', 'draft'] as SubmitStatus[]).map((s) => (
                      <button
                        key={s}
                        onClick={() => setSubmitStatus(s)}
                        className={`flex-1 py-4 flex items-center justify-center gap-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all cursor-pointer border ${
                          submitStatus === s
                            ? s === 'submitted'
                              ? 'bg-[#5fcf65] text-black border-[#5fcf65]'
                              : 'bg-white/10 text-white border-white/20'
                            : 'bg-transparent text-gray-400 border-white/10 hover:border-white/20'
                        }`}
                      >
                        {s === 'submitted' ? <><Send size={14} className="-rotate-45" /> SUBMIT FOR REVIEW</> : <>📝 SAVE AS DRAFT</>}
                      </button>
                    ))}
                  </div>
                  <p className="text-gray-600 text-xs mt-2">
                    {submitStatus === 'submitted'
                      ? 'Client will be notified and can approve this milestone.'
                      : "Saved privately — client won't be notified until you submit for review."}
                  </p>
                </div>

                {/* Description */}
                <div className="mb-7">
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">
                    Delivery Description <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    rows={5}
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Describe what you've delivered — what was built, key decisions made, and how it meets the acceptance criteria."
                    className="w-full bg-[#080b09] border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#3cb44f]/60 transition-all resize-none placeholder:text-gray-600"
                  />
                </div>

                {/* Deliverable links */}
                <div className="mb-10">
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-gray-400 text-xs font-bold uppercase tracking-wider">
                      Deliverable Links / References
                    </label>
                    <button
                      onClick={addEntry}
                      className="flex items-center gap-1.5 text-[#3cb44f] text-xs font-bold hover:text-white transition-colors cursor-pointer"
                    >
                      <Plus size={14} /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {dataEntries.map((entry, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <Link2 size={14} className="text-gray-600 shrink-0" />
                        <input
                          type="text"
                          value={entry.key}
                          onChange={e => updateEntry(i, 'key', e.target.value)}
                          placeholder="Label (e.g. GitHub, Figma, Demo)"
                          className="w-[36%] bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#3cb44f]/50 transition-all"
                        />
                        <input
                          type="text"
                          value={entry.value}
                          onChange={e => updateEntry(i, 'value', e.target.value)}
                          placeholder="URL or value"
                          className="flex-1 bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white text-sm focus:outline-none focus:border-[#3cb44f]/50 transition-all"
                        />
                        {dataEntries.length > 1 && (
                          <button
                            onClick={() => removeEntry(i)}
                            className="p-2 rounded-lg bg-white/5 hover:bg-red-500/20 hover:text-red-400 text-gray-500 transition-all cursor-pointer"
                          >
                            <X size={14} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Error */}
                {submitError && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-5 p-4 rounded-xl bg-red-500/10 border border-red-500/20 flex items-start gap-3"
                  >
                    <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
                    <p className="text-red-400 text-sm">{submitError}</p>
                  </motion.div>
                )}

                {/* CTA */}
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !description.trim()}
                  className="w-full py-5 rounded-xl bg-[#1c3c20] text-black font-black text-sm uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-[#204525] transition-all cursor-pointer shadow-lg shadow-[#3cb44f]/10 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 size={16} className="animate-spin text-[#3cb44f]" /> : <Send size={16} strokeWidth={2.5} className="text-[#3cb44f]" />}
                  <span className="text-[#3cb44f]">{submitting ? 'Submitting…' : submitStatus === 'draft' ? 'Save Draft' : 'Submit Milestone'}</span>
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
