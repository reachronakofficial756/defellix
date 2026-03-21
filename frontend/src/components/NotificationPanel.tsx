import { useEffect, useRef, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  X, Bell, Send, MessageSquareMore, PenLine,
  Flag, AlertTriangle, Loader2, RotateCcw,
  CalendarClock, FilePen, CheckCircle2, Star, TrendingUp
} from 'lucide-react';
import { apiClient } from '@/api/client';
import { useContractsStore } from '@/store/useContractsStore';

/* ─────────────────────────── Types ──────────────────────────────── */
type NType = 'sent' | 'review' | 'signed' | 'overdue' | 'due_soon' | 'completed' | 'draft' | 'milestone_rated' | 'review_received' | 'score_updated';

interface Notification {
  id: string;
  type: NType;
  title: string;
  message: string;
  contractName: string;
  contractId: number;
  timestamp: string;
  isNew: boolean;
  /** Optional inline CTA shown on the card */
  action?: { label: string };
}

/* ─────────────────── Config per type ──────────────────────────────── */
const TYPE_CFG: Record<NType, {
  Icon: React.ComponentType<{ size: number; className?: string }>;
  dot: string;       // dot / ring color (hex)
  pill: string;      // pill background + text classes
  ring: string;      // icon bg ring
}> = {
  sent:      { Icon: Send,             dot: '#60a5fa', ring: 'bg-blue-500/10',   pill: 'bg-blue-500/10 text-blue-300' },
  review:    { Icon: MessageSquareMore,dot: '#fbbf24', ring: 'bg-amber-500/10',  pill: 'bg-amber-500/10 text-amber-300' },
  signed:    { Icon: PenLine,          dot: '#4ade80', ring: 'bg-green-500/10',  pill: 'bg-green-500/10 text-green-300' },
  overdue:   { Icon: AlertTriangle,    dot: '#f87171', ring: 'bg-red-500/10',    pill: 'bg-red-500/10 text-red-300' },
  due_soon:  { Icon: CalendarClock,    dot: '#fb923c', ring: 'bg-orange-500/10', pill: 'bg-orange-500/10 text-orange-300' },
  completed: { Icon: Flag,             dot: '#c084fc', ring: 'bg-violet-500/10', pill: 'bg-violet-500/10 text-violet-300' },
  draft:     { Icon: FilePen,          dot: '#6b7280', ring: 'bg-white/5',       pill: 'bg-white/6 text-gray-400' },
  milestone_rated: { Icon: Star,       dot: '#fbbf24', ring: 'bg-amber-500/10', pill: 'bg-amber-500/10 text-amber-300' },
  review_received: { Icon: Star,       dot: '#4ade80', ring: 'bg-green-500/10', pill: 'bg-green-500/10 text-green-300' },
  score_updated:   { Icon: TrendingUp, dot: '#c084fc', ring: 'bg-violet-500/10', pill: 'bg-violet-500/10 text-violet-300' },
};

/* ──────────────────────── Data helpers ─────────────────────────── */
function deriveNotifications(contracts: any[]): Notification[] {
  const out: Notification[] = [];
  const now = new Date();
  const milestoneStatuses = new Set(['signed', 'active', 'completed']);

  contracts.forEach((c) => {
    const id = c.id as number;
    const name = c.project_name || 'Unnamed Contract';

    // ── Sent to client (always, if ever sent) ──────────────────────
    if (c.sent_at) {
      const ts = new Date(c.sent_at).getTime();
      out.push({
        id: `sent-${id}-${ts}`, type: 'sent',
        title: 'Contract sent to client',
        message: `Shared with ${c.client_name || c.client_email || 'client'} for review and signature · ${name}`,
        contractName: name, contractId: id,
        timestamp: c.sent_at, isNew: c.status === 'sent',
      });
    }

    // ── Revision / iteration requested (pending) ───────────────────
    if (c.status === 'pending') {
      const ts = new Date(c.updated_at || c.sent_at || c.created_at).getTime();
      const comment = c.client_review_comment;
      out.push({
        id: `review-${id}-${ts}`, type: 'review',
        title: 'Revision requested by client',
        message: comment
          ? `"${comment.slice(0, 80)}${comment.length > 80 ? '…' : ''}" · ${name}`
          : `${c.client_name || 'Your client'} requested changes before signing · ${name}`,
        contractName: name, contractId: id,
        timestamp: c.updated_at || c.sent_at || c.created_at, isNew: true,
        action: { label: 'View review & edit contract' },
      });
    }

    // ── Signed / active ────────────────────────────────────────────
    if (c.status === 'signed' || c.status === 'active') {
      const ts = new Date(c.client_signed_at || c.updated_at || c.created_at).getTime();
      out.push({
        id: `signed-${id}-${ts}`, type: 'signed',
        title: 'Client signed the contract',
        message: `${c.client_name || 'Your client'} digitally signed — the project is now active · ${name}`,
        contractName: name, contractId: id,
        timestamp: c.client_signed_at || c.updated_at || c.created_at, isNew: c.status === 'signed',
      });
    }

    // ── Milestone warnings / Submissions / Drafts ──────────────────
    (c.milestones || []).forEach((ms: any) => {
      // Handle Submitted status specifically
      if (ms.status === 'submitted') {
        out.push({
          id: `submitted-${id}-${ms.id}`, type: 'review',
          title: 'Milestone submitted for review',
          message: `You submitted work for "${ms.title}". Awaiting client approval · ${name}`,
          contractName: name, contractId: id,
          timestamp: ms.latest_submission?.submitted_at || ms.updated_at || c.updated_at || c.created_at, isNew: true,
          action: { label: 'View submission' },
        });
      }

      // Handle Revision/Feedback (Milestones)
      if (ms.status === 'revision') {
        const ts = new Date(ms.latest_submission?.reviewed_at || ms.updated_at || c.updated_at).getTime();
        out.push({
          id: `revision-${id}-${ms.id}-${ts}`, type: 'review',
          title: 'Feedback received',
          message: `The client requested changes on "${ms.title}" · ${name}`,
          contractName: name, contractId: id,
          timestamp: ms.latest_submission?.reviewed_at || ms.updated_at || c.updated_at, isNew: true,
          action: { label: 'View feedback' },
        });
      }

      // Handle Approved — with rating info if available
      if (ms.status === 'approved' || ms.status === 'paid') {
        const sub = ms.latest_submission;
        const hasRating = sub && sub.client_rating && sub.client_rating > 0;
        
        out.push({
          id: `approved-${id}-${ms.id}`, type: 'completed',
          title: 'Milestone approved!',
          message: `The client approved "${ms.title}". Funds will be released soon · ${name}`,
          contractName: name, contractId: id,
          timestamp: sub?.reviewed_at || ms.updated_at || c.updated_at, isNew: ms.status === 'approved',
        });

        // Separate notification for the rating
        if (hasRating) {
          const stars = '★'.repeat(sub.client_rating) + '☆'.repeat(5 - sub.client_rating);
          out.push({
            id: `rated-${id}-${ms.id}`, type: 'milestone_rated',
            title: `Client rated milestone ${stars}`,
            message: sub.client_comment
              ? `"${sub.client_comment.slice(0, 80)}${sub.client_comment.length > 80 ? '…' : ''}" · ${ms.title} · ${name}`
              : `${c.client_name || 'Client'} gave ${sub.client_rating}/5 stars for "${ms.title}" · ${name}`,
            contractName: name, contractId: id,
            timestamp: sub.reviewed_at || ms.updated_at || c.updated_at, isNew: ms.status === 'approved',
          });
        }
      }

      // Handle Drafts
      if (ms.last_draft_at) {
        out.push({
          id: `draft-${id}-${ms.id}`, type: 'draft',
          title: 'Draft submission saved',
          message: `You have a saved draft for "${ms.title}". You can continue editing before sending · ${name}`,
          contractName: name, contractId: id,
          timestamp: ms.last_draft_at, isNew: true,
          action: { label: 'Continue draft' },
        });
      }

      if (milestoneStatuses.has(c.status)) {
        if (ms.status === 'approved' || ms.status === 'paid' || !ms.due_date) return;
        const due = new Date(ms.due_date);
        const diff = Math.ceil((due.getTime() - now.getTime()) / 86400000);
        if (diff < 0) {
          out.push({
            id: `overdue-${id}-${ms.id}`, type: 'overdue',
            title: 'Milestone overdue',
            message: `"${ms.title}" was due ${Math.abs(diff)} day${Math.abs(diff) !== 1 ? 's' : ''} ago · ${name}`,
            contractName: name, contractId: id,
            timestamp: ms.due_date, isNew: true,
          });
        } else if (diff <= 5) {
          out.push({
            id: `soon-${id}-${ms.id}`, type: 'due_soon',
            title: `Milestone due in ${diff} day${diff !== 1 ? 's' : ''}`,
            message: `"${ms.title}" is due ${due.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${name}`,
            contractName: name, contractId: id,
            timestamp: ms.due_date, isNew: diff <= 2,
          });
        }
      }
    });

    // ── Completed ──────────────────────────────────────────────────
    if (c.status === 'completed') {
      out.push({
        id: `done-${id}`, type: 'completed',
        title: 'Contract completed',
        message: `All milestones delivered with ${c.client_name || 'client'} · ${name}`,
        contractName: name, contractId: id,
        timestamp: c.updated_at || c.created_at, isNew: false,
      });
    }

    // ── Contract review received ─────────────────────────────────
    if (c.contract_review) {
      const rev = c.contract_review;
      const stars = '★'.repeat(rev.overall_rating || 0) + '☆'.repeat(5 - (rev.overall_rating || 0));
      out.push({
        id: `review-recv-${id}`, type: 'review_received',
        title: `New contract review ${stars}`,
        message: rev.comment
          ? `"${rev.comment.slice(0, 80)}${rev.comment.length > 80 ? '…' : ''}" · ${name}`
          : `${c.client_name || 'Client'} left a ${rev.overall_rating}/5 review · ${name}`,
        contractName: name, contractId: id,
        timestamp: rev.reviewed_at || rev.created_at || c.updated_at, isNew: true,
        action: { label: 'View review' },
      });

      // Testimonial notification
      if (rev.testimonial) {
        out.push({
          id: `testimonial-${id}`, type: 'review_received',
          title: 'New testimonial received!',
          message: `"${rev.testimonial.slice(0, 80)}${rev.testimonial.length > 80 ? '…' : ''}" · ${name}`,
          contractName: name, contractId: id,
          timestamp: rev.reviewed_at || rev.created_at || c.updated_at, isNew: true,
        });
      }
    }
  });

  // Sort purely by timestamp descending (newest first) — industry standard
  return out.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const s = ms / 1000;
  if (s < 60) return 'just now';
  if (s < 3600) return `${Math.floor(s / 60)}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  const d = Math.floor(s / 86400);
  if (d < 7) return `${d}d ago`;
  return new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

/* ─────────────────────────── Props ─────────────────────────────── */
interface Props { isOpen: boolean; onClose: () => void; }

/* ═══════════════════════ Component ═════════════════════════════════ */
export default function NotificationPanel({ isOpen, onClose }: Props) {
  const panelRef = useRef<HTMLDivElement>(null);
  const { openContracts } = useContractsStore();
  const navigate = useNavigate();

  const [all, setAll] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  // Auto-load saved read/dismissed IDs from sessionStorage
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem('notif_read');
      if (saved) setReadIds(new Set(JSON.parse(saved)));
    } catch {}
  }, []);

  const persistRead = useCallback((ids: Set<string>) => {
    setReadIds(ids);
    try { sessionStorage.setItem('notif_read', JSON.stringify([...ids])); } catch {}
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch contract-derived notifications
      const res = await apiClient.get('/contracts');
      const contracts: any[] = (res as any).data?.data?.contracts || [];
      const derived = deriveNotifications(contracts);

      // E8: Fetch server-side score notifications
      try {
        const notifRes = await apiClient.get('/users/me/notifications');
        const serverNotifs: any[] = (notifRes as any).data?.data || [];
        for (const sn of serverNotifs) {
          derived.push({
            id: `score-notif-${sn.id}`,
            type: 'score_updated' as NType,
            title: sn.title || 'Credibility score updated',
            message: sn.message || `Score changed: ${sn.old_score} → ${sn.new_score}`,
            contractName: '',
            contractId: 0,
            timestamp: sn.created_at,
            isNew: !sn.is_read,
          });
        }
      } catch {
        // Server notifications are optional, don't fail the whole panel
      }

      // Re-sort by timestamp
      derived.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      setAll(derived);
    } catch { setAll([]); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { if (isOpen) load(); }, [isOpen, load]);

  // Auto-mark-as-read after 3s of the panel being open (industry standard)
  useEffect(() => {
    if (!isOpen) return;
    const t = setTimeout(() => {
      setAll(prev => {
        const newRead = new Set(readIds);
        prev.filter(n => n.isNew).forEach(n => newRead.add(n.id));
        persistRead(newRead);
        return prev;
      });
    }, 3000);
    return () => clearTimeout(t);
  }, [isOpen]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!isOpen) return;
    const fn = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) onClose();
    };
    setTimeout(() => document.addEventListener('mousedown', fn), 10);
    return () => document.removeEventListener('mousedown', fn);
  }, [isOpen, onClose]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', fn);
    return () => document.removeEventListener('keydown', fn);
  }, [onClose]);

  // go — navigate to the right page based on notification type
  const go = async (n: Notification) => {
    const newRead = new Set([...readIds, n.id]);
    persistRead(newRead);

    // E8: Mark as read in backend if it's a server-side score notification
    if (n.type === 'score_updated' && n.id.startsWith('score-notif-')) {
      try {
        const dbId = n.id.replace('score-notif-', '');
        await apiClient.put(`/users/me/notifications/${dbId}/read`);
      } catch (err) {
        console.error('Failed to mark notification as read in backend:', err);
      }
    }

    if (n.type === 'review' && n.id.startsWith('submitted-')) {
      // Navigate to the milestone submission page so freelancer can view their submission
      navigate(`/submit-milestone/${n.contractId}`);
      onClose();
    } else if (n.type === 'review' && !n.id.startsWith('submitted-')) {
      // Revision requested — open the contract overlay
      openContracts(n.contractId);
      onClose();
    } else if (n.type === 'draft') {
      navigate(`/submit-milestone/${n.contractId}`);
      onClose();
    } else if (n.type === 'review_received' || n.type === 'milestone_rated') {
      // Open contract to see the review/rating
      openContracts(n.contractId);
      onClose();
    } else if (n.type === 'score_updated') {
      // Navigate to profile to see score
      navigate('/dashboard/profile');
      onClose();
    } else {
      openContracts(n.contractId);
      onClose();
    }
  };

  const dismiss = (id: string) => setDismissed(p => new Set([...p, id]));
  const markAllRead = () => persistRead(new Set(all.map(n => n.id)));

  const visible = all.filter(n => !dismissed.has(n.id));
  // New = unread AND isNew (isNew comes from data, readIds tracks user-read state)
  const fresh = visible.filter(n => n.isNew && !readIds.has(n.id));
  const earlier = visible.filter(n => !n.isNew || readIds.has(n.id));
  const unread = fresh.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ backdropFilter: 'blur(2px)', background: 'rgba(0,0,0,0.45)' }}
          />

          {/* Panel */}
          <motion.div
            ref={panelRef}
            className="fixed z-50"
            style={{ top: 76, right: 20, width: 400 }}
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34, mass: 0.7 }}
          >
            <div
              className="flex flex-col overflow-hidden"
              style={{
                borderRadius: 20,
                background: '#0c110d',
                border: '1px solid rgba(255,255,255,0.07)',
                boxShadow: '0 0 0 1px rgba(60,180,79,0.08), 0 40px 100px rgba(0,0,0,0.8)',
                maxHeight: 'calc(100vh - 100px)',
              }}
            >
              {/* ── Header ── */}
              <div className="flex items-center justify-between px-5 pt-5 pb-4">
                <div className="flex items-center gap-2.5">
                  <div
                    className="w-8 h-8 rounded-[10px] flex items-center justify-center"
                    style={{ background: 'rgba(60,180,79,0.12)', border: '1px solid rgba(60,180,79,0.2)' }}
                  >
                    <Bell size={14} className="text-[#3cb44f]" />
                  </div>
                  <div>
                    <span className="text-white text-[13px] font-bold tracking-tight">Notifications</span>
                    {unread > 0 && (
                      <span className="ml-2 text-[10px] font-black px-1.5 py-0.5 rounded-full bg-[#3cb44f] text-black">
                        {unread} new
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={load}
                    disabled={loading}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <RotateCcw size={13} className={loading ? 'animate-spin' : ''} />
                  </button>
                  {unread > 0 && (
                    <button
                      onClick={markAllRead}
                      className="h-7 px-2.5 rounded-lg text-[11px] font-semibold text-gray-500 hover:text-[#3cb44f] hover:bg-[#3cb44f]/6 transition-all cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                  <button
                    onClick={onClose}
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-gray-600 hover:text-gray-300 hover:bg-white/5 transition-all cursor-pointer"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>

              {/* ── Divider ── */}
              <div className="mx-5 h-px bg-white/5" />

              {/* ── Body ── */}
              <div
                className="flex-1 overflow-y-auto px-3 pb-3 pt-3"
                style={{ scrollbarWidth: 'none' }}
              >
                {/* Loading */}
                {loading && (
                  <div className="flex items-center justify-center py-16 gap-2.5">
                    <Loader2 size={18} className="text-[#3cb44f] animate-spin" />
                    <span className="text-gray-600 text-xs">Loading…</span>
                  </div>
                )}

                {/* Empty */}
                {!loading && visible.length === 0 && (
                  <div className="flex flex-col items-center justify-center py-14 gap-3">
                    <div
                      className="w-12 h-12 rounded-2xl flex items-center justify-center"
                      style={{ background: 'rgba(60,180,79,0.07)', border: '1px solid rgba(60,180,79,0.12)' }}
                    >
                      <CheckCircle2 size={20} className="text-[#3cb44f]/50" />
                    </div>
                    <p className="text-[13px] text-gray-500 font-medium">You're all caught up</p>
                  </div>
                )}

                {/* NEW */}
                {!loading && fresh.length > 0 && (
                  <>
                    <GroupLabel label="New" />
                    <AnimatePresence initial={false}>
                      {fresh.map((n, i) => (
                        <Card key={n.id} n={n} i={i} onGo={() => go(n)} onDismiss={() => dismiss(n.id)} />
                      ))}
                    </AnimatePresence>
                  </>
                )}

                {/* EARLIER */}
                {!loading && earlier.length > 0 && (
                  <>
                    <GroupLabel label={fresh.length ? 'Earlier' : 'Activity'} />
                    <AnimatePresence initial={false}>
                      {earlier.map((n, i) => (
                        <Card key={n.id} n={n} i={i + fresh.length} onGo={() => go(n)} onDismiss={() => dismiss(n.id)} />
                      ))}
                    </AnimatePresence>
                  </>
                )}
              </div>

              {/* ── Footer ── */}
              {!loading && visible.length > 0 && (
                <>
                  <div className="mx-5 h-px bg-white/5" />
                  <div className="flex items-center justify-between px-5 py-3">
                    <span className="text-[11px] text-gray-700">
                      {visible.length} notification{visible.length !== 1 ? 's' : ''}
                    </span>
                    <button
                      onClick={() => setDismissed(new Set(all.map(n => n.id)))}
                      className="text-[11px] font-medium text-gray-700 hover:text-red-400 transition-colors cursor-pointer"
                    >
                      Clear all
                    </button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ──────────────── Group label ──────────────────────────────── */
function GroupLabel({ label }: { label: string }) {
  return (
    <div className="px-2 pt-1 pb-2">
      <span className="text-[10px] font-black uppercase tracking-[0.12em] text-gray-700">{label}</span>
    </div>
  );
}

/* ──────────────── Card ─────────────────────────────────────── */
function Card({
  n, i,
  onGo, onDismiss,
}: { n: Notification; i: number; onGo: () => void; onDismiss: () => void }) {
  const c = TYPE_CFG[n.type];
  const Icon = c.Icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{
        layout: { duration: 0.2 },
        opacity: { delay: i * 0.025, duration: 0.18 },
        y: { delay: i * 0.025, duration: 0.22 },
        height: { duration: 0.2 },
      }}
      className="mb-1 overflow-hidden"
    >
      <motion.div
        onClick={onGo}
        className="group relative flex gap-3 px-3 py-3 rounded-xl cursor-pointer"
        style={{
          background: n.isNew ? 'rgba(255,255,255,0.035)' : 'transparent',
        }}
        whileHover={{ background: 'rgba(255,255,255,0.05)' }}
        transition={{ duration: 0.12 }}
      >
        {/* Unread indicator bar */}
        {n.isNew && (
          <div
            className="absolute left-0 top-3 bottom-3 w-[2px] rounded-full"
            style={{ background: c.dot }}
          />
        )}

        {/* Dismiss — appears on hover */}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          className="absolute top-2 right-2 w-5 h-5 rounded-md flex items-center justify-center
                     text-gray-700 hover:text-gray-300 hover:bg-white/8
                     opacity-0 group-hover:opacity-100 transition-all cursor-pointer"
        >
          <X size={11} />
        </button>

        {/* Icon */}
        <div
          className={`flex-shrink-0 w-8 h-8 rounded-[10px] flex items-center justify-center ${c.ring}`}
          style={{ border: `1px solid ${c.dot}20`, color: c.dot }}
        >
          <Icon size={15} />
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0 pr-4">
          <div className="flex items-start justify-between gap-2 mb-0.5">
            <p className={`text-[12.5px] font-semibold leading-snug ${n.isNew ? 'text-white' : 'text-gray-300'}`}>
              {n.title}
            </p>
          </div>
          <p className="text-[11.5px] text-gray-500 leading-relaxed line-clamp-2 mb-2">
            {n.message}
          </p>

          {/* Action button (e.g. review notification CTA) */}
          {n.action && (
            <button
              onClick={(e) => { e.stopPropagation(); onGo(); }}
              className="mb-2.5 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-bold
                         transition-all cursor-pointer"
              style={{
                background: 'rgba(251,191,36,0.1)',
                border: '1px solid rgba(251,191,36,0.25)',
                color: '#fbbf24',
              }}
            >
              <MessageSquareMore size={11} />
              {n.action.label}
            </button>
          )}

          <div className="flex items-center gap-2 mt-1">
            <span className="text-[10px] text-gray-600">{timeAgo(n.timestamp)}</span>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
