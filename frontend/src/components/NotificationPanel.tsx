import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, FileText, AlertTriangle, CheckCircle2, Clock, DollarSign, Bell } from 'lucide-react';
import { useContractsStore } from '@/store/useContractsStore';

type NotificationType = 'milestone' | 'payment' | 'review' | 'alert' | 'update';

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  contract: string;
  contractId: number;
  time: string;
  unread: boolean;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: 'n1',
    type: 'review',
    title: 'Contract Awaiting Review',
    message: 'Mobile Banking App UI is at 90% completion. Final review milestone pending client sign-off.',
    contract: 'Mobile Banking App UI',
    contractId: 2,
    time: '2m ago',
    unread: true,
  },
  {
    id: 'n2',
    type: 'payment',
    title: 'Payment Released',
    message: 'TechNova Solutions released $3,500 for the Component Architecture milestone.',
    contract: 'E-Commerce React Frontend',
    contractId: 1,
    time: '1h ago',
    unread: true,
  },
  {
    id: 'n3',
    type: 'alert',
    title: 'Contract Delayed',
    message: 'SaaS Dashboard Design is behind schedule. Dashboard Components milestone is overdue.',
    contract: 'SaaS Dashboard Design',
    contractId: 3,
    time: '3h ago',
    unread: true,
  },
  {
    id: 'n4',
    type: 'milestone',
    title: 'Milestone Completed',
    message: 'Prompt Input & UI Shell milestone for AI Video Generator has been marked complete.',
    contract: 'AI Video Generator',
    contractId: 4,
    time: 'Yesterday',
    unread: false,
  },
  {
    id: 'n5',
    type: 'update',
    title: 'Contract Updated',
    message: 'Visionary AI updated the project description and added new revision notes to the contract.',
    contract: 'AI Video Generator',
    contractId: 4,
    time: '2d ago',
    unread: false,
  },
  {
    id: 'n6',
    type: 'milestone',
    title: 'Milestone Due Soon',
    message: 'API Integration milestone for E-Commerce React Frontend is due in 5 days.',
    contract: 'E-Commerce React Frontend',
    contractId: 1,
    time: '2d ago',
    unread: false,
  },
];

const typeConfig: Record<NotificationType, {
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  accent: string;
}> = {
  milestone: {
    icon: CheckCircle2,
    iconBg: 'bg-[#3cb44f]/15',
    iconColor: 'text-[#3cb44f]',
    accent: 'border-l-[#3cb44f]',
  },
  payment: {
    icon: DollarSign,
    iconBg: 'bg-emerald-400/15',
    iconColor: 'text-emerald-400',
    accent: 'border-l-emerald-400',
  },
  review: {
    icon: Clock,
    iconBg: 'bg-amber-400/15',
    iconColor: 'text-amber-400',
    accent: 'border-l-amber-400',
  },
  alert: {
    icon: AlertTriangle,
    iconBg: 'bg-red-400/15',
    iconColor: 'text-red-400',
    accent: 'border-l-red-400',
  },
  update: {
    icon: FileText,
    iconBg: 'bg-violet-400/15',
    iconColor: 'text-violet-400',
    accent: 'border-l-violet-400',
  },
};

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

const NotificationPanel = ({ isOpen, onClose }: NotificationPanelProps) => {
  const panelRef = useRef<HTMLDivElement>(null);
  const { openContractsWithId } = useContractsStore();
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);

  const handleNavigate = (contractId: number) => {
    openContractsWithId(contractId);
    onClose();
  };

  const dismiss = (id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    // Delay to avoid triggering on the button click that opened the panel
    setTimeout(() => document.addEventListener('mousedown', handleClick), 10);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);


  const unread = notifications.filter((n) => n.unread);
  const earlier = notifications.filter((n) => !n.unread);
  const unreadCount = unread.length;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Light backdrop — clicking outside closes */}
          <motion.div
            className="fixed inset-0 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            style={{ background: 'rgba(0,0,0,0.25)' }}
          />

          {/* Floating notification card */}
          <motion.div
            ref={panelRef}
            className="fixed z-50 flex flex-col"
            style={{
              top: '72px',        /* just below the navbar */
              right: '20px',
              width: '400px',
              maxHeight: 'calc(100vh - 90px)',
              borderRadius: '20px',
              background: 'linear-gradient(160deg, #1a1e28 0%, #14181f 60%, #0f1117 100%)',
              border: '1px solid rgba(60,180,79,0.18)',
              boxShadow: '0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.04)',
            }}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.95 }}
            transition={{
              type: 'spring',
              stiffness: 380,
              damping: 30,
              mass: 0.8,
            }}
          >
            {/* inner wrapper — clips children to rounded corners */}
            <div className="flex flex-col overflow-hidden shadow-2xl" style={{ borderRadius: '20px', flex: 1 }}>
              {/* Header */}
              <div
                className="flex items-center justify-between px-6 py-5"
                style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-[#3cb44f]/15 flex items-center justify-center">
                    <Bell className="w-4 h-4 text-[#3cb44f]" />
                  </div>
                  <div>
                    <h2 className="text-white font-bold text-base leading-tight tracking-tight">
                      Notifications
                    </h2>
                    {unreadCount > 0 && (
                      <p className="text-[#3cb44f] text-xs font-medium mt-0.5">
                        {unreadCount} unread
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    className="text-xs text-gray-500 hover:text-[#3cb44f] font-medium transition-colors px-2 py-1 rounded-md hover:bg-[#3cb44f]/8 cursor-pointer"
                    onClick={() => setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))}
                  >
                    Mark all read
                  </button>
                  <button
                    onClick={onClose}
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-white/8 transition-all cursor-pointer"
                    aria-label="Close notifications"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Notification List — scrollbar hidden */}
              <div
                id="notif-scroll-list"
                className="flex-1 overflow-y-auto py-3 px-3 space-y-2"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* Webkit browsers: hide scrollbar */}
                <style>{`#notif-scroll-list::-webkit-scrollbar { display: none; }`}</style>

                {/* Empty state */}
                {notifications.length === 0 && (
                  <div className="flex flex-col items-center justify-center h-full py-20 gap-3">
                    <div className="w-12 h-12 rounded-2xl bg-[#1a1d24] flex items-center justify-center">
                      <Bell className="w-5 h-5 text-gray-600" />
                    </div>
                    <p className="text-gray-600 text-sm font-medium">You're all caught up!</p>
                  </div>
                )}

                {/* Unread section */}
                {unread.length > 0 && (
                  <div className="px-2 pb-1">
                    <span className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">New</span>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {unread.map((notif, idx) => (
                    <NotificationCard
                      key={notif.id}
                      notif={notif}
                      index={idx}
                      onNavigate={() => handleNavigate(notif.contractId)}
                      onDismiss={() => dismiss(notif.id)}
                    />
                  ))}
                </AnimatePresence>

                {/* Read section */}
                {earlier.length > 0 && (
                  <div className="px-2 pb-1 pt-3">
                    <span className="text-[10px] uppercase tracking-widest text-gray-600 font-semibold">Earlier</span>
                  </div>
                )}
                <AnimatePresence initial={false}>
                  {earlier.map((notif, idx) => (
                    <NotificationCard
                      key={notif.id}
                      notif={notif}
                      index={idx + 3}
                      onNavigate={() => handleNavigate(notif.contractId)}
                      onDismiss={() => dismiss(notif.id)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
          </>
        )}
      </AnimatePresence>
  );
};

interface NotificationCardProps {
  notif: Notification;
  index: number;
  onNavigate: () => void;
  onDismiss: () => void;
}

const NotificationCard = ({ notif, index, onNavigate, onDismiss }: NotificationCardProps) => {
  const cfg = typeConfig[notif.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 40, height: 0, marginBottom: 0 }}
      transition={{
        layout: { duration: 0.25, ease: 'easeInOut' },
        opacity: { delay: index * 0.04, duration: 0.2 },
        x: { delay: index * 0.04, type: 'spring', stiffness: 300, damping: 28 },
        height: { duration: 0.25 },
      }}
      className="overflow-hidden"
    >
      {/* Outer wrapper: clickable card — dismiss button sits on top via z-index */}
      <motion.div
        onClick={onNavigate}
        className={`group relative flex items-start gap-3 p-4 rounded-xl border-l-2 ${cfg.accent}
                    transition-colors duration-200 cursor-pointer`}
        style={{
          background: notif.unread
            ? 'rgba(255,255,255,0.04)'
            : 'rgba(255,255,255,0.02)',
        }}
        whileHover={{
          backgroundColor: 'rgba(60,180,79,0.06)',
          transition: { duration: 0.15 },
        }}
        whileTap={{ scale: 0.985 }}
      >
        {/* Unread dot */}
        {notif.unread && (
          <span className="absolute top-4 right-10 w-2 h-2 rounded-full bg-[#3cb44f] shadow-[0_0_6px_rgba(60,180,79,0.8)]" />
        )}

        {/* Dismiss button — z-10, stops propagation so card click doesn't fire */}
        <button
          onClick={(e) => { e.stopPropagation(); onDismiss(); }}
          style={{ zIndex: 10 }}
          className="absolute top-3 right-3 w-6 h-6 rounded-lg flex items-center justify-center
                     opacity-0 group-hover:opacity-100 transition-all duration-150
                     text-gray-500 hover:text-red-400 hover:bg-red-400/12 cursor-pointer flex-shrink-0"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>

        {/* Icon */}
        <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${cfg.iconBg} flex items-center justify-center mt-0.5`}>
          <Icon className={`w-5 h-5 ${cfg.iconColor}`} />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <p className={`text-[15px] font-semibold leading-snug ${notif.unread ? 'text-white' : 'text-gray-200'}`}>
            {notif.title}
          </p>
          <p className="text-[13px] text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
            {notif.message}
          </p>
          <div className="flex items-center gap-2 mt-2.5">
            <span
              className="text-[11px] font-medium px-2.5 py-0.5 rounded-full truncate max-w-[180px]"
              style={{ background: 'rgba(60,180,79,0.1)', color: '#3cb44f' }}
            >
              {notif.contract}
            </span>
            <span className="text-[11px] text-gray-500 flex-shrink-0">{notif.time}</span>
          </div>
        </div>

      </motion.div>
    </motion.div>
  );
};

export default NotificationPanel;
