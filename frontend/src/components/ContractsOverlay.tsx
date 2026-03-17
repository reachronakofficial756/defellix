import { useEffect, useRef, useState, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { gsap } from 'gsap';
import { useContractsStore } from '../store/useContractsStore';
import { apiClient } from "@/api/client";
import { Clock, DollarSign, CheckCircle, AlertCircle, RotateCcw, FileText, User, Calendar, FileCheck, CreditCard, LayoutGrid, Copy, ExternalLink, FilePen, Send, MessageSquareMore, PenLine, Banknote, CheckCircle2, XCircle, Flag } from 'lucide-react';
import contractsBg3d from '@/assets/contracts_bg_3d.png';

/** Milestone row as in CreateContractForm (Scope & Deliverables / Payment) */
type MilestoneDetail = {
  title: string;
  description: string;
  amount: number;
  due_date: string;
  is_initial_payment: boolean;
  submission_criteria: string;
  completion_criteria_tc: string;
};

export interface ContractItem {
  id: number;
  title: string;
  client: string;
  milestoneDeadline: string;
  status: "Active" | "In Review" | "Delayed" | "Sent";
  date: string;
  budget: string;
  completion: number;
  milestone: string;
  tags: string[];
  details: string;
  milestones: { label: string; done: boolean }[];
  projectType?: string;
  projectDesc?: string;
  startDate?: string;
  deadline?: string;
  duration?: string;
  customTerms?: string;
  clientName?: string;
  clientEmail?: string;
  clientPhone?: string;
  clientCountry?: string;
  clientCompany?: string;
  outOfScope?: string;
  coreDeliverable?: string;
  revisionPolicy?: string;
  intellectualProperty?: string;
  contractCurrency?: string;
  contractAmount?: string | number;
  paymentMethod?: string;
  isAdvancePayment?: boolean;
  advanceAmount?: string | number;
  milestonesDetail?: MilestoneDetail[];
  clientViewToken?: string;
  shareableLink?: string;
  // Timeline data
  rawStatus?: string;
  sentAt?: string;
  createdAt?: string;
  clientReviewComment?: string;
}


const statusConfig = {
  Active: { color: '#00e676', bg: 'bg-[#00e676]/10', text: 'text-[#00e676]', border: 'border-[#00e676]/30', Icon: CheckCircle },
  'In Review': { color: '#fbc02d', bg: 'bg-yellow-500/10', text: 'text-yellow-400', border: 'border-yellow-500/30', Icon: RotateCcw },
  Delayed: { color: '#ef5350', bg: 'bg-red-500/10', text: 'text-red-400', border: 'border-red-500/30', Icon: AlertCircle },
  Sent: { color: '#60a5fa', bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', Icon: FileCheck },
};



const ContractTabCard = memo(function ContractTabCard({
  contract,
  index,
  isActive,
  isFirst,
  isLast,
  onSelect,
  setButtonRef,
}: {
  contract: ContractItem;
  index: number;
  isActive: boolean;
  isFirst: boolean;
  isLast: boolean;
  onSelect: (index: number) => void;
  setButtonRef: (index: number, el: HTMLButtonElement | null) => void;
}) {
  const s = statusConfig[contract.status];
  const roundClass = isFirst && isLast
    ? 'rounded-t-[40px]'
    : isFirst
      ? 'rounded-tl-[40px] rounded-tr-[40px]'
      : isLast
        ? 'rounded-tl-[40px] rounded-tr-[40px]'
        : 'rounded-t-[40px]';
  // Active tab: same bg as detail panel, rounded bottom so it merges into the panel
  const activeRoundClass = isActive ? `${roundClass} rounded-b-[0px]` : roundClass;
  return (
    <motion.button
      ref={(el) => setButtonRef(index, el)}
      onClick={() => onSelect(index)}
      whileHover={{ scale: isActive ? 1 : 1.02 }}
      whileTap={{ scale: 0.98 }}
      animate={{ marginTop: isActive ? 0 : 50 }}
      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
      className={`relative shrink-0 text-left px-5 py-4 border-none cursor-pointer ${isActive ? 'overflow-visible' : 'overflow-hidden'} ${activeRoundClass} ${isActive
        ? 'bg-[#0d1a10] shadow-none'
        : 'bg-[#d4edda]/50 backdrop-blur-sm'
        }`}
      style={{
        minWidth: '210px',
        width: '210px',
        marginBottom: isActive ? '0px' : '0px',
        zIndex: isActive ? 15 : 5,
      }}
    >
      {isActive && (
        <>
          <div className="rotate-180">
            <svg
              className="absolute left-47.5 bottom-15.5 h-14 w-14 pointer-events-none"
              viewBox="0 0 40 40"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <mask id="corner-notch-mask">
                  {/* Start fully opaque (white) */}
                  <rect x="0" y="0" width="40" height="40" fill="white" />
                  {/* Cut out the inward curve (black = transparent area) */}
                  <path
                    d="M40 0
             A40 40 0 0 0 0 40
             L40 40 Z"
                    fill="black"
                  />
                </mask>
              </defs>

              {/* Apply the mask to a filled rect */}
              <rect
                x="0"
                y="0"
                width="40"
                height="40"
                fill="#0d1a10"
                mask="url(#corner-notch-mask)"
              />
            </svg>
          </div>
          <div className="rotate-270">
            <svg
              className="absolute -left-8 -bottom-40 h-14 w-14 pointer-events-none"
              viewBox="0 0 40 40"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <mask id="corner-notch-mask">
                  {/* Start fully opaque (white) */}
                  <rect x="0" y="0" width="40" height="40" fill="white" />
                  {/* Cut out the inward curve (black = transparent area) */}
                  <path
                    d="M40 0
           A40 40 0 0 0 0 40
           L40 40 Z"
                    fill="black"
                  />
                </mask>
              </defs>

              {/* Apply the mask to a filled rect */}
              <rect
                x="0"
                y="0"
                width="40"
                height="40"
                fill="#0d1a10"
                mask="url(#corner-notch-mask)"
              />
            </svg>
          </div>
        </>
      )}
      <div className="flex items-center gap-2 mb-3">
        <div
          className="w-2 h-2 rounded-full"
          style={{ backgroundColor: s.color, boxShadow: isActive ? `0 0 6px ${s.color}` : 'none' }}
        />
        <span className={`text-xs font-semibold ${s.text}`}>{contract.status}</span>
      </div>
      <p className={`text-sm font-bold leading-snug mb-1 truncate ${isActive ? 'text-white' : 'text-gray-900'}`} title={contract.title}>
        {contract.title}
      </p>
      <p className="text-xs text-gray-500 truncate" title={contract.client}>{contract.client}</p>
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, height: 0, marginTop: 0 }}
            animate={{ opacity: 1, height: 'auto', marginTop: 12 }}
            exit={{ opacity: 0, height: 0, marginTop: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="overflow-hidden"
          >
            <div className="h-1 bg-white/10 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${contract.completion}%` }}
                transition={{ duration: 0.5, delay: 0.1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: s.color }}
              />
            </div>
            <p className={`mt-1 text-[10px] font-medium ${isActive ? 'text-gray-400' : 'text-gray-600'}`}>{contract.completion}% complete</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
});

export default function ContractsOverlay() {
  const { activeContractId } = useContractsStore();
  const [activeIndex, setActiveIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'details' | 'all'>('details');

  const pageRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const tabsRef = useRef<HTMLDivElement>(null);
  const detailsRef = useRef<HTMLDivElement>(null);
  const tabButtonsRef = useRef<(HTMLButtonElement | null)[]>([]);
  const hasInitializedVisibleStart = useRef(false);

  const [contracts, setContracts] = useState<ContractItem[]>([]);
  const [loadingContracts, setLoadingContracts] = useState(true);

  useEffect(() => {
    const fetchContracts = async () => {
      try {
        const res = await apiClient.get("/contracts");
        const data = (res as any).data?.data?.contracts || [];
        const mapped: ContractItem[] = data.map((c: any) => {
          const dummyChecklist = c.milestones?.map((m: any) => ({
            label: m.title,
            done: m.status === 'approved' || m.status === 'paid'
          })) || [];

          const mappedMilestonesDetail = c.milestones?.map((m: any) => ({
            title: m.title,
            description: m.description,
            amount: m.amount,
            due_date: m.due_date ? new Date(m.due_date).toLocaleDateString() : 'TBD',
            is_initial_payment: m.order_index === 0,
            submission_criteria: m.submission_criteria,
            completion_criteria_tc: m.completion_criteria_tc
          })) || [];

          let status: "Active" | "In Review" | "Delayed" | "Sent" = "Active";
          if (c.status === "sent") status = "Sent";
          else if (c.status === "pending" || c.status === "draft") status = "In Review";
          else if (c.status === "disputed" || c.status === "delayed") status = "Delayed";

          const totalMilestones = c.milestones?.length || 0;
          const completedMilestones = c.milestones?.filter((m: any) => m.status === 'approved' || m.status === 'paid').length || 0;

          const totalAmount = c.total_amount || 1;
          const completedAmount = c.milestones?.filter((m: any) => m.status === 'approved' || m.status === 'paid').reduce((sum: number, m: any) => sum + m.amount, 0) || 0;
          const completion = Math.round((completedAmount / totalAmount) * 100);

          return {
            id: c.id,
            title: c.project_name || "Untitled",
            client: c.client_name || "Unknown Client",
            milestoneDeadline: (() => {
              const currentMs = c.milestones?.find((m: any) => m.status !== 'approved' && m.status !== 'paid');
              return currentMs?.due_date
                ? new Date(currentMs.due_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' })
                : 'TBD';
            })(),
            status: status,
            date: c.start_date ? `${new Date(c.start_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })} - ${c.due_date ? new Date(c.due_date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) : 'TBD'}` : 'TBD',
            budget: `${c.currency || 'USD'} ${c.total_amount?.toLocaleString() || '0'}`,
            completion: completion,
            milestone: `${completedMilestones} / ${totalMilestones}`,
            tags: [c.project_category || 'Other'],
            details: c.description || '',
            milestones: dummyChecklist,
            projectType: c.project_category || 'Other',
            projectDesc: c.description || '',
            startDate: c.start_date ? new Date(c.start_date).toISOString().split('T')[0] : 'TBD',
            deadline: c.due_date ? new Date(c.due_date).toISOString().split('T')[0] : 'TBD',
            duration: c.estimated_duration || 'Unknown',
            customTerms: c.terms_and_conditions || 'None',
            clientName: c.client_name || '',
            clientEmail: c.client_email || '',
            clientPhone: c.client_phone || '',
            clientCountry: c.client_country || '',
            clientCompany: c.client_company_name || '',
            outOfScope: c.out_of_scope_work || '',
            coreDeliverable: c.submission_criteria || '',
            revisionPolicy: c.revision_policy || '',
            intellectualProperty: c.intellectual_property || '',
            contractCurrency: c.currency || 'USD',
            contractAmount: c.total_amount || 0,
            paymentMethod: c.payment_method || '',
            isAdvancePayment: c.advance_payment_required || false,
            advanceAmount: c.advance_payment_amount || 0,
            milestonesDetail: mappedMilestonesDetail,
            clientViewToken: c.client_view_token || '',
            shareableLink: c.shareable_link || '',
            rawStatus: c.status || '',
            sentAt: c.sent_at || '',
            createdAt: c.created_at || '',
            clientReviewComment: c.client_review_comment || '',
          };
        });
        setContracts(mapped);
      } catch (err) {
        console.error("Failed to load overlay contracts", err);
      } finally {
        setLoadingContracts(false);
      }
    };
    fetchContracts();
  }, []);

  // Auto-select contract from dashboard "Open contract" click
  useEffect(() => {
    if (activeContractId == null || contracts.length === 0) return;
    const idx = contracts.findIndex(c => c.id === activeContractId);
    if (idx !== -1) {
      setActiveIndex(idx);
      setViewMode('details');
    }
  }, [activeContractId, contracts]);

  const active = contracts[activeIndex] || contracts[0];
  const cfg = active ? statusConfig[active.status] : null;

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

  // ─── Keep active tab centered in the tabs row ────────────────────────────
  useEffect(() => {
    const btn = tabButtonsRef.current[activeIndex];
    if (!btn) return;
    btn.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeIndex]);

  // ─── Scroll detail panel to top when project changes (no layout jump) ─────
  useEffect(() => {
    if (detailsScrollRef.current) detailsScrollRef.current.scrollTop = 0;
  }, [activeIndex]);

  const handleSelectTab = useCallback((index: number) => setActiveIndex(index), []);
  const setTabButtonRef = useCallback((index: number, el: HTMLButtonElement | null) => {
    tabButtonsRef.current[index] = el;
  }, []);

  const detailsScrollRef = useRef<HTMLDivElement>(null);

  // ─── Fixed card width; show only as many as fit; if any hidden, show "View all projects" as rightmost ─────
  const CARD_WIDTH = 210;
  const CARD_GAP = 8;
  const TABS_HORIZONTAL_PADDING = 112; // px-10 (80) + pl-4 pr-4 (32)
  const [numThatFit, setNumThatFit] = useState<number>(contracts.length);
  const [visibleStart, setVisibleStart] = useState(0);

  useEffect(() => {
    const el = tabsRef.current;
    if (!el) return;
    const update = () => {
      const containerWidth = el.offsetWidth;
      const availableWidth = Math.max(0, containerWidth - TABS_HORIZONTAL_PADDING);
      const n = Math.floor(availableWidth / (CARD_WIDTH + CARD_GAP));
      setNumThatFit(Math.max(0, n));
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [contracts.length]);

  // On first layout, choose an initial window so the active tab sits at the visual center (only when we have a separate View All card).
  useEffect(() => {
    if (hasInitializedVisibleStart.current) return;
    if (numThatFit <= 0) return;
    const showViewAll = numThatFit > 0 && contracts.length > numThatFit;
    if (!showViewAll) {
      // All projects fit in the row: show from the first project, no windowing.
      setVisibleStart(0);
      hasInitializedVisibleStart.current = true;
      return;
    }
    const baseVisibleCount = Math.max(0, numThatFit - 1);
    if (baseVisibleCount <= 0) return;
    // Force an odd count so we have a true center slot
    const visibleCountForInit = baseVisibleCount % 2 === 0 ? Math.max(1, baseVisibleCount - 1) : baseVisibleCount;
    const halfWindow = Math.floor(visibleCountForInit / 2);
    const maxStart = Math.max(0, contracts.length - visibleCountForInit);
    const desiredStart = activeIndex - halfWindow;
    const start = Math.min(maxStart, Math.max(0, desiredStart));
    setVisibleStart(start);
    hasInitializedVisibleStart.current = true;
  }, [numThatFit, activeIndex]);

  // Visible slice: when we show the View All card, reserve one slot and keep an odd number of project tabs.
  const showViewAllCard = numThatFit > 0 && contracts.length > numThatFit;
  const baseVisibleCount = showViewAllCard ? Math.max(0, numThatFit - 1) : Math.min(contracts.length, numThatFit);
  const visibleCount = showViewAllCard
    ? (baseVisibleCount % 2 === 0 ? Math.max(1, baseVisibleCount - 1) : baseVisibleCount)
    : baseVisibleCount;
  const visibleContracts = contracts.slice(visibleStart, visibleStart + visibleCount);

  // Early return if loading or empty
  if (loadingContracts || contracts.length === 0) {
    return (
      <motion.div ref={pageRef} className="h-full bg-[#1e3824] flex items-center justify-center overflow-hidden">
        {loadingContracts ? (
          <div className="flex flex-col items-center gap-5">
            <svg className="animate-spin h-10 w-10 text-[#00e676]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p className="text-[#00e676] font-bold tracking-widest text-xs uppercase">Loading Contracts...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-5">
            <AlertCircle className="w-14 h-14 text-white/50" />
            <p className="text-white/50 font-bold tracking-widest text-xs uppercase">No Active Contracts</p>
          </div>
        )}
      </motion.div>
    );
  }

  if (!active || !cfg) return null;

  return (
    <motion.div
      ref={pageRef}
      className="h-full bg-[#1e3824] flex flex-col overflow-hidden pt-80"
    >
      <img src={contractsBg3d} alt="Contracts Overlay Background" className="w-96 h-96 object-cover absolute top-30 left-1/2 -translate-x-1/2" />
      <div className="absolute top-50 left-20 sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
        <div className="shrink-0">
          <h2 className="text-2xl md:text-4xl font-bold text-white leading-tight">
            {viewMode === 'all' ? 'All projects' : active.title}
          </h2>
          <p className="text-white text-sm md:text-base mt-1">
            {viewMode === 'all' ? `${contracts.length} contracts` : `Client: ${active.client}`}
          </p>
        </div>
      </div>

      <div className="absolute top-52 right-20 flex flex-row items-end gap-4 mb-4">
        <button
          className="cursor-pointer px-5 py-3 bg-green-600 text-white rounded-full font-medium shadow hover:bg-green-700 transition"
          onClick={() => { /* TODO: hook up submit work logic */ }}
        >
          Submit Work
        </button>
        <button
          className="flex -ml-2 items-center cursor-pointer justify-center w-12 h-12 rounded-full bg-[#d4edda] shadow hover:bg-[#d4edda]/50 transition border border-white/10"
          title="View Milestone Calendar"
          onClick={() => { /* TODO: hook up calendar logic */ }}
        >
          <Calendar size={24} className="text-black" />
        </button>
      </div>

      {/* ─── Tabs row: project cards, or (when view all) only centered "Go back to project details" ─────────────────── */}
      <div ref={tabsRef} className="relative z-0 shrink-0 px-10 pt-2 min-h-[11rem]">
        <div className="flex gap-2 overflow-visible pb-0 border-none justify-center pl-4 pr-4 items-end">
          <AnimatePresence mode="wait">
            {viewMode === 'all' ? (
              <motion.button
                key="go-back-tab"
                type="button"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="relative shrink-0 px-6 py-4 border-none cursor-pointer text-white overflow-visible rounded-t-[40px] bg-[#0f1117]/40 backdrop-blur-sm hover:bg-[#0d1a10]/70 transition-colors flex flex-col items-center justify-center gap-2 min-h-[0rem]"
                style={{ minWidth: CARD_WIDTH, width: CARD_WIDTH, marginTop: 42, marginBottom: 0, zIndex: 10 }}
                onClick={() => setViewMode('details')}
              >

                <LayoutGrid size={24} className="text-gray-200" />
                <span className="text-sm font-bold text-gray-300 text-center">Go back to project details</span>
              </motion.button>
            ) : (
              <motion.div
                key="tabs-details"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.26, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="flex gap-2 overflow-visible pb-0 border-none justify-center items-end w-full"
              >
                {visibleContracts.map((c, i) => {
                  const globalIndex = visibleStart + i;
                  return (
                    <ContractTabCard
                      key={`tab-${c.id}-${globalIndex}`}
                      contract={c}
                      index={globalIndex}
                      isActive={globalIndex === activeIndex}
                      isFirst={visibleStart === 0 && i === 0}
                      isLast={!showViewAllCard && globalIndex === contracts.length - 1}
                      onSelect={handleSelectTab}
                      setButtonRef={setTabButtonRef}
                    />
                  );
                })}
                {showViewAllCard && (
                  <button
                    type="button"
                    className="relative shrink-0 text-left px-5 py-4 border-none cursor-pointer overflow-hidden rounded-tl-[40px] rounded-tr-[40px] bg-[#d4edda]/30 backdrop-blur-sm hover:bg-[#d4edda]/50 transition-colors flex flex-col items-center justify-center gap-2"
                    style={{ minWidth: CARD_WIDTH, width: CARD_WIDTH, marginTop: 10, marginBottom: -10, zIndex: 5 }}
                    onClick={() => setViewMode('all')}
                  >
                    <LayoutGrid size={24} className="text-gray-600" />
                    <span className="text-sm font-bold text-gray-800 text-center">View all projects</span>
                    <span className="text-xs text-gray-500">+{contracts.length - visibleCount} more</span>
                  </button>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ─── Active Contract Detail Panel: fixed position, in front of tabs (no movement on project change) ───────────────────────────────── */}
      <motion.div
        ref={detailsRef}
        className="relative z-10 flex-1 mx-1 -mt-[22px] pt-6 overflow-hidden rounded-t-[40px] min-h-0 flex flex-col flex-shrink-0"
        style={{
          background: '#0d1a10',
        }}
      >
        {/* Scrollable details container — scroll to top when project changes */}
        <div ref={detailsScrollRef} className="h-full overflow-y-auto scrBar flex-1 min-h-0 ">
          <AnimatePresence mode="wait">
            {viewMode === 'all' ? (
              /* ─── All projects list (click project → details + that tab active) ─── */
              <motion.div
                key="all-projects"
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.32, ease: [0.25, 0.46, 0.45, 0.94] }}
                className="px-4 pb-6"
              >
                <motion.div
                  className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
                  initial="hidden"
                  animate="visible"
                  variants={{ visible: { transition: { staggerChildren: 0.04, delayChildren: 0.06 } }, hidden: {} }}
                >
                  {contracts.map((c, i) => {
                    const sc = statusConfig[c.status] ?? statusConfig.Active;
                    return (
                      <motion.button
                        key={c.id}
                        type="button"
                        variants={{ hidden: { opacity: 0, y: 12 }, visible: { opacity: 1, y: 0 } }}
                        transition={{ duration: 0.28, ease: [0.25, 0.46, 0.45, 0.94] }}
                        className="text-left rounded-3xl border border-white/10 p-5 bg-white/4 hover:bg-white/8 hover:border-white/20 transition-colors"
                        onClick={() => {
                          // Make this project active
                          setActiveIndex(i);

                          // If not all projects fit in the tabs row, slide the visible window
                          // so this project appears within (ideally at the center of) the row.
                          if (showViewAllCard && visibleCount > 0) {
                            const halfWindow = Math.floor(visibleCount / 2);
                            const maxStart = Math.max(0, contracts.length - visibleCount);
                            const desiredStart = i - halfWindow;
                            const nextStart = Math.min(maxStart, Math.max(0, desiredStart));
                            setVisibleStart(nextStart);
                          }

                          setViewMode('details');
                        }}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-white font-semibold truncate pr-2">{c.title}</span>
                          <span className="shrink-0 text-xs font-medium px-2.5 py-1 rounded-full" style={{ backgroundColor: `${sc.color}22`, color: sc.color }}>{c.status}</span>
                        </div>
                        <p className="text-gray-400 text-sm mb-1">Client: {c.client}</p>
                        <p className="text-gray-500 text-xs">{c.budget} · {c.date}</p>
                      </motion.button>
                    );
                  })}
                </motion.div>
              </motion.div>
            ) : (
              <motion.div
                key="project-details"
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
              >
                <>
                  {/* ─── HERO ROW ── large title + key stats ─── */}
                  <div className="px-4 pb-6">
                    {/* Stats strip */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                      {[
                        { icon: DollarSign, label: 'Revenue', value: active.budget, color: '#00e676' },
                        { icon: Calendar, label: 'Timeline', value: active.date, color: '#60a5fa' },
                        { icon: FileText, label: 'Milestones', value: active.milestone, color: '#a78bfa' },
                        { icon: Calendar, label: 'Current Milestone Deadline', value: (active as { milestoneDeadline?: string }).milestoneDeadline ?? '—', color: '#ffd166' },
                      ].map(({ icon: Icon, label, value, color }) => (
                        <div key={label} className="bg-white/4 rounded-3xl p-5 border border-white/6 flex flex-col gap-2">
                          <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                            <Icon size={17} style={{ color }} />
                          </div>
                          <div>
                            <p className="text-gray-500 text-sm font-medium mb-0.5">{label}</p>
                            <p className="text-white font-bold text-2xl truncate">{value}</p>
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

                    {/* ─── CreateContractForm-aligned sections ─── */}
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-2">
                      <div className="lg:col-span-3 space-y-2">
                        {/* 1. Project Details (Step 1) */}
                        <div className="rounded-3xl border border-white/8 p-6 bg-white/3 space-y-4">
                          <h3 className="text-white font-semibold text-base flex items-center gap-2">
                            <FileText size={18} className="text-[#60a5fa]" /> Project Details
                          </h3>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div><dt className="text-gray-500 mb-0.5">Project Title</dt><dd className="text-white font-medium">{(active as { title: string }).title}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Project Type</dt><dd className="text-white font-medium">{(active as { projectType?: string }).projectType ?? '—'}</dd></div>
                            <div className="sm:col-span-2"><dt className="text-gray-500 mb-0.5">Project Description</dt><dd className="text-gray-300 leading-relaxed">{(active as { projectDesc?: string }).projectDesc ?? active.details}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Start Date</dt><dd className="text-white font-medium">{(active as { startDate?: string }).startDate ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Deadline</dt><dd className="text-white font-medium">{(active as { deadline?: string }).deadline ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Duration</dt><dd className="text-white font-medium">{(active as { duration?: string }).duration ?? '—'}</dd></div>
                            <div className="sm:col-span-2"><dt className="text-gray-500 mb-0.5">Terms & Conditions</dt><dd className="text-gray-300 leading-relaxed">{(active as { customTerms?: string }).customTerms ?? '—'}</dd></div>
                          </dl>
                        </div>



                        {/* 2. Client & Company (Step 2) */}
                        <div className="rounded-3xl border border-white/8 p-6 bg-white/3 space-y-4">
                          <h3 className="text-white font-semibold text-base flex items-center gap-2">
                            <User size={18} className="text-[#f9a8d4]" /> Client & Company
                          </h3>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div><dt className="text-gray-500 mb-0.5">Client Name</dt><dd className="text-white font-medium">{(active as { clientName?: string }).clientName ?? active.client}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Client Email</dt><dd className="text-white font-medium">{(active as { clientEmail?: string }).clientEmail ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Client Phone</dt><dd className="text-white font-medium">{(active as { clientPhone?: string }).clientPhone ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Client Country</dt><dd className="text-white font-medium">{(active as { clientCountry?: string }).clientCountry ?? '—'}</dd></div>
                            <div className="sm:col-span-2"><dt className="text-gray-500 mb-0.5">Company Name</dt><dd className="text-white font-medium">{(active as { clientCompany?: string }).clientCompany ?? active.client}</dd></div>
                          </dl>
                        </div>
                        {/* 4. Payment Terms (Step 4) */}
                        <div className="rounded-3xl border border-white/8 p-6 bg-white/3 space-y-4">
                          <h3 className="text-white font-semibold text-base flex items-center gap-2">
                            <CreditCard size={18} className="text-[#00e676]" /> Payment Terms
                          </h3>
                          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                            <div><dt className="text-gray-500 mb-0.5">Contract Amount</dt><dd className="text-white font-bold">{(active as { contractCurrency?: string }).contractCurrency ?? 'USD'} {(active as { contractAmount?: string }).contractAmount ?? active.budget}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Payment Method</dt><dd className="text-white font-medium">{(active as { paymentMethod?: string }).paymentMethod ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Advance Payment</dt><dd className="text-white font-medium">{(active as { isAdvancePayment?: boolean }).isAdvancePayment ? `Yes — ${(active as { contractCurrency?: string }).contractCurrency ?? 'USD'} ${(active as { advanceAmount?: string }).advanceAmount ?? '—'}` : 'No'}</dd></div>
                          </dl>
                          {((active as { milestonesDetail?: MilestoneDetail[] }).milestonesDetail?.length ?? 0) > 0 && (
                            <div className="pt-4 border-t border-white/8">
                              <h4 className="text-white font-medium text-sm mb-3">Milestone Payment Schedule</h4>
                              <div className="space-y-2">
                                {(active as { milestonesDetail: MilestoneDetail[] }).milestonesDetail.map((ms, idx) => (
                                  <div key={idx} className="flex justify-between items-center text-sm py-2 border-b border-white/6 last:border-0">
                                    <span className="text-gray-400">{idx + 1}. {ms.title || 'Untitled'}</span>
                                    <span className="text-white font-bold">{(active as { contractCurrency?: string }).contractCurrency ?? 'USD'} {ms.amount?.toLocaleString() ?? '0'}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Sidebar */}
                      <div className="lg:col-span-2 space-y-2">


                        {/* 3. Scope & Deliverables (Step 3) */}
                        <div className="rounded-3xl border border-white/8 p-6 bg-white/3 space-y-2">
                          <h3 className="text-white font-semibold text-base flex items-center gap-2">
                            <FileCheck size={18} className="text-[#a78bfa]" /> Scope & Deliverables
                          </h3>
                          <dl className="space-y-3 text-sm">
                            <div><dt className="text-gray-500 mb-0.5">Revision Policy</dt><dd className="text-white font-medium">{(active as { revisionPolicy?: string }).revisionPolicy ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Out of Scope</dt><dd className="text-gray-300 leading-relaxed">{(active as { outOfScope?: string }).outOfScope ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Core Deliverable</dt><dd className="text-white font-medium">{(active as { coreDeliverable?: string }).coreDeliverable ?? '—'}</dd></div>
                            <div><dt className="text-gray-500 mb-0.5">Intellectual Property</dt><dd className="text-white font-medium">{(active as { intellectualProperty?: string }).intellectualProperty ?? '—'}</dd></div>
                          </dl>
                          {/* Milestones (form-style with title, description, amount, due_date, etc.) */}
                          {/* {((active as { milestonesDetail?: MilestoneDetail[] }).milestonesDetail?.length ?? 0) > 0 && (
                            <div className="pt-4 border-t border-white/8">
                              <h4 className="text-white font-medium text-sm mb-3">Milestones</h4>
                              <div className="space-y-3">
                                {(active as { milestonesDetail: MilestoneDetail[] }).milestonesDetail.map((ms, i) => (
                                  <div key={i} className="p-4 rounded-xl border border-white/6 bg-white/3 space-y-2">
                                    <div className="flex justify-between items-start">
                                      <span className="text-white font-semibold text-sm">#{i + 1} {ms.title}</span>
                                      <span className="text-[#00e676] font-bold text-sm">{(active as { contractCurrency?: string }).contractCurrency ?? 'USD'} {ms.amount?.toLocaleString() ?? '0'}</span>
                                    </div>
                                    {ms.description && <p className="text-gray-400 text-xs">{ms.description}</p>}
                                    <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
                                      <span>Due: {ms.due_date}</span>
                                      {ms.is_initial_payment && <span className="text-[#00e676]">Initial Payment</span>}
                                    </div>
                                    {ms.submission_criteria && <p className="text-gray-500 text-xs">Submission: {ms.submission_criteria}</p>}
                                    {ms.completion_criteria_tc && <p className="text-gray-500 text-xs">Completion: {ms.completion_criteria_tc}</p>}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )} */}
                          {/* Checklist milestones (label / done) */}
                          <div className="pt-4 border-t border-white/8">
                            <h4 className="text-white font-medium text-sm mb-3">Progress Checklist</h4>
                            <div className="space-y-3">
                              {active.milestones.length === 0 ? (
                                <p className="text-gray-500 text-sm">No milestones defined.</p>
                              ) : active.milestones.map((m, i) => {
                                const msDetail = (active as { milestonesDetail?: MilestoneDetail[] }).milestonesDetail?.[i];
                                return (
                                  <div key={i} className={`flex flex-col gap-1.5 p-3 rounded-xl border ${m.done ? 'border-[#00e676]/20 bg-[#00e676]/5' : 'border-white/6 bg-white/3'}`}>
                                    <div className="flex items-center gap-3">
                                      <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${m.done ? 'bg-[#00e676]/20' : 'bg-white/6 border border-white/10'}`}>
                                        {m.done ? <CheckCircle size={12} className="text-[#00e676]" /> : <span className="text-gray-600 text-[10px] font-bold">{i + 1}</span>}
                                      </div>
                                      <span className={`text-sm font-semibold flex-1 ${m.done ? 'text-white' : 'text-gray-300'}`}>{m.label}</span>
                                      {m.done && <span className="text-[10px] text-[#00e676] font-semibold bg-[#00e676]/10 px-2 py-0.5 rounded-full">Done</span>}
                                    </div>
                                    {msDetail && (
                                      <div className="ml-9 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-gray-500">
                                        {msDetail.amount > 0 && (
                                          <span className="text-[#a78bfa] font-medium">{(active as { contractCurrency?: string }).contractCurrency ?? 'USD'} {msDetail.amount.toLocaleString()}</span>
                                        )}
                                        {msDetail.due_date && <span>Due: {msDetail.due_date}</span>}
                                        {msDetail.submission_criteria && <span className="text-gray-600 truncate max-w-[180px]">Submit: {msDetail.submission_criteria}</span>}
                                      </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        {/* Activity — dynamic timeline */}
                        <div className="rounded-3xl border border-white/8 p-6 bg-white/3">
                          <h4 className="text-white font-semibold text-sm mb-5 flex items-center gap-2">
                            <Clock size={15} className="text-gray-400" /> Activity
                          </h4>
                          {(() => {
                            const a = active as {
                              rawStatus?: string; sentAt?: string; createdAt?: string;
                              clientReviewComment?: string; milestonesDetail?: MilestoneDetail[];
                              deadline?: string;
                            };
                            const fmtDate = (d?: string) => d ? new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : '';
                            type ActivityEvent = { label: string; sub?: string; date: string; color: string; icon: React.ReactNode };
                            const events: ActivityEvent[] = [];

                            // Contract created
                            if (a.createdAt) events.push({ label: 'Contract drafted', sub: 'Contract was created as a draft', date: fmtDate(a.createdAt), color: 'rgba(255,255,255,0.25)', icon: <FilePen size={11} /> });

                            // Contract sent
                            if (a.sentAt) events.push({ label: 'Contract sent to client', sub: `Shared with ${(active as { clientEmail?: string }).clientEmail || 'client'} for review`, date: fmtDate(a.sentAt), color: '#60a5fa', icon: <Send size={11} /> });

                            // Review / revision requested
                            if (a.rawStatus === 'pending') events.push({ label: 'Revision request received', sub: a.clientReviewComment ? `"${a.clientReviewComment.slice(0, 80)}${a.clientReviewComment.length > 80 ? '…' : ''}"` : 'Client requested changes before signing', date: 'Recently', color: '#fbbf24', icon: <MessageSquareMore size={11} /> });

                            // Client signed
                            if (a.rawStatus === 'signed' || a.rawStatus === 'active' || a.rawStatus === 'completed') {
                              events.push({ label: 'Client signed the contract', sub: 'Digitally signed and verified via OTP', date: fmtDate(a.sentAt), color: '#3cb44f', icon: <PenLine size={11} /> });
                            }

                            // Milestones paid/approved
                            a.milestonesDetail?.forEach((ms, i) => {
                              if (ms.amount > 0 && ms.due_date && (a.rawStatus === 'active' || a.rawStatus === 'completed')) {
                                events.push({ label: `Milestone ${i + 1} paid — ${ms.title}`, sub: `${(active as { contractCurrency?: string }).contractCurrency ?? 'INR'} ${ms.amount.toLocaleString()}`, date: fmtDate(ms.due_date), color: '#a78bfa', icon: <Banknote size={11} /> });
                              }
                            });

                            // Contract completed/cancelled
                            if (a.rawStatus === 'completed') events.push({ label: 'Contract completed', sub: 'All milestones delivered and accepted', date: fmtDate(a.deadline), color: '#3cb44f', icon: <Flag size={11} /> });
                            if (a.rawStatus === 'cancelled') events.push({ label: 'Contract cancelled', sub: 'Contract was cancelled', date: 'Recently', color: '#ef5350', icon: <XCircle size={11} /> });

                            if (events.length === 0) return <p className="text-gray-600 text-xs">No activity yet.</p>;

                            return (
                              <div className="space-y-0 relative">
                                {/* Vertical line */}
                                <div className="absolute left-[10px] top-3 bottom-3 w-px bg-white/8" />
                                {events.map((ev, i) => (
                                  <div key={i} className="flex items-start gap-4 pl-7 relative pb-5 last:pb-0">
                                    {/* Icon dot */}
                                    <div
                                      className="absolute left-0 top-1 w-5 h-5 rounded-full flex items-center justify-center bg-[#0d1a10] border-2"
                                      style={{ borderColor: ev.color, color: ev.color }}
                                    >
                                      {ev.icon}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-white text-xs font-semibold leading-snug">{ev.label}</p>
                                      {ev.sub && <p className="text-gray-500 text-[11px] mt-0.5 leading-relaxed">{ev.sub}</p>}
                                      {ev.date && <p className="text-gray-600 text-[10px] mt-1 font-medium">{ev.date}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            );
                          })()}
                        </div>

                        <div className="flex flex-col gap-2 mt-2">
                          {active.status === 'Sent' ? (
                            /* ── Sent contract: show client-facing shareable URL ── */
                            <div className="p-5 rounded-2xl border border-[#60a5fa]/25 bg-[#60a5fa]/5 space-y-3">
                              <div className="flex items-center gap-2 mb-1">
                                <ExternalLink size={15} className="text-[#60a5fa]" />
                                <p className="text-[#60a5fa] text-xs font-bold uppercase tracking-widest">Client Review Link</p>
                              </div>
                              <p className="text-gray-400 text-xs leading-relaxed">Share this link with your client so they can review, negotiate, and sign the contract.</p>
                              {(active as { shareableLink?: string }).shareableLink ? (
                                <>
                                  <div className="bg-black/30 border border-white/8 rounded-xl px-3 py-2 text-[10px] text-gray-400 font-mono break-all">
                                    {(active as { shareableLink?: string }).shareableLink}
                                  </div>
                                  <div className="flex gap-2">
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText((active as { shareableLink?: string }).shareableLink || '');
                                      }}
                                      className="flex-1 py-3 rounded-xl bg-[#60a5fa]/15 border border-[#60a5fa]/30 text-[#60a5fa] font-bold text-xs flex items-center justify-center gap-2 hover:bg-[#60a5fa]/25 transition-all cursor-pointer"
                                    >
                                      <Copy size={13} /> Copy Link
                                    </button>
                                    <a
                                      href={(active as { shareableLink?: string }).shareableLink}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="flex-1 py-3 rounded-xl bg-white/5 border border-white/10 text-white font-bold text-xs flex items-center justify-center gap-2 hover:bg-white/10 transition-all"
                                    >
                                      <ExternalLink size={13} /> Open
                                    </a>
                                  </div>
                                </>
                              ) : (
                                <p className="text-gray-600 text-xs italic">Link not available — resend contract to generate.</p>
                              )}
                            </div>
                          ) : (
                            <>
                              <button
                                className="w-full py-4 rounded-2xl font-bold text-md transition-all duration-200 cursor-pointer"
                                style={{
                                  background: `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}12)`,
                                  border: `1px solid ${cfg.color}40`,
                                  color: cfg.color,
                                }}
                                onMouseEnter={e => (e.currentTarget.style.background = `${cfg.color}22`)}
                                onMouseLeave={e => (e.currentTarget.style.background = `linear-gradient(135deg, ${cfg.color}22, ${cfg.color}12)`)}
                              >
                                Submit Work
                              </button>
                              <button
                                className="w-full py-4 rounded-2xl font-bold text-md transition-all duration-200 cursor-pointer"
                                style={{
                                  background: `#2d8a3e`,
                                  border: `1px solid #3cb44f40`,
                                  color: "#fff",
                                }}
                              >
                                Get Section 65b Certificate
                              </button>
                            </>
                          )}
                        </div>

                      </div>
                    </div>
                  </div>
                </>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
