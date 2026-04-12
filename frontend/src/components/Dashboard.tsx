import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { useContractsStore } from "@/store/useContractsStore";
import { apiClient } from "@/api/client";
import { calculateContractProgress } from "@/utils/contractProgress";
import contract_completition from "@/assets/contract_completition.png";
import client_reviews from "@/assets/client_reviews.png";
import response_rate from "@/assets/response_rate.png";
import on_time_delivery from "@/assets/on_time_delivery.png";
import active_contracts from "@/assets/active_contracts.png";
import disputes from "@/assets/disputes.png";
import { Score } from "@/components/Score";
import { ReputationGauge } from "@/components/ReputationGauge";
import { useAuth } from "@/contexts/AuthContext";
import NotificationPanel from "@/components/NotificationPanel";
import {
    HouseIcon,
    FolderOpenIcon,
    BellRingIcon,
    ListChevronsUpDownIcon,
    UserRoundIcon,
    LogoutIcon,
    PlusIcon,
} from "@/components/MobileDockIcons";

// --- Types ---
interface MetricCard {
    label: string;
    value: string;
    unit: string;
    impact: string;
    impactDots: number;
    icon: string;
    iconBg: string;
}

interface Contract {
    id: number;
    name: string;
    client: string;
    updatedAgo: string;
    status: "Active" | "In Review" | "Delayed" | "Sent";
    milestone: string;
    completion: number;
    color: string;
    initials: string;
    avatarBg: string;
}

// interface Activity {
//     id: number;
//     text: string;
//     highlight: string;
//     time: string;
//     dotColor: string;
// }

// --- Data ---
// Metrics are now computed dynamically from contracts data — see computeMetrics() below



// const activities: Activity[] = [
// { id: 1, text: "Sarah Miller approved milestone #2", highlight: "Sarah Miller", time: "2h ago", dotColor: "bg-[#00e676]" },
// { id: 2, text: "New message from James Anderson", highlight: "James Anderson", time: "4h ago", dotColor: "bg-blue-400" },
// { id: 3, text: "Deadline extended: SaaS Dashboard", highlight: "SaaS Dashboard", time: "1d ago", dotColor: "bg-red-400" },
// { id: 4, text: "Invoice #004 marked as paid", highlight: "Invoice #004", time: "2d ago", dotColor: "bg-[#00e676]" },
// ];

// --- Status badge ---
const StatusBadge = ({ status }: { status: Contract["status"] }) => {
    const map = {
        Active: "bg-green-900 text-green-400 border border-green-700",
        "In Review": "bg-yellow-900 text-yellow-400 border border-yellow-700",
        Delayed: "bg-red-900 text-red-400 border border-red-700",
        Sent: "bg-blue-900 text-blue-400 border border-blue-700",
    };
    return (
        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${map[status]}`}>
            {status}
        </span>
    );
};

// --- Impact dots ---
const ImpactDots = ({ count, max = 3 }: { count: number; max?: number }) => (
    <span className="flex items-center gap-0.5">
        {Array.from({ length: max }).map((_, i) => (
            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < count ? "bg-[#00e676]" : "bg-transparent border border-gray-700"}`} />
        ))}
    </span>
);

// --- Main Dashboard ---
const Dashboard = () => {
    const navigate = useNavigate();
    const { openContracts } = useContractsStore();
    const { logout } = useAuth();
    const [contracts, setContracts] = useState<Contract[]>([]);
    const [rawContracts, setRawContracts] = useState<any[]>([]); // raw API data for computing metrics
    const [loadingContracts, setLoadingContracts] = useState(true);
    const [animated, setAnimated] = useState(false);
    const [scrollY, setScrollY] = useState(0);
    const [score, setScore] = useState(0);
    const [scoreTier, setScoreTier] = useState('Starter');
    const [dimensionScores, setDimensionScores] = useState<any>(null);
    const [scoreHistory, setScoreHistory] = useState<any[]>([]);
    const [totalEarnings, setTotalEarnings] = useState(0);
    const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
    const [mobileNotifOpen, setMobileNotifOpen] = useState(false);

    useEffect(() => {
        const fetchContracts = async () => {
            try {
                const res = await apiClient.get("/contracts");
                const data = (res as any).data?.data?.contracts || [];

                const mapped: Contract[] = data.map((c: any) => {
                    let status: Contract["status"] = "Active";
                    let color = "#00e676";
                    let avatarBg = "bg-green-700";

                    if (c.status === "sent") {
                        status = "Sent";
                        color = "#60a5fa"; // blue
                        avatarBg = "bg-blue-600";
                    } else if (c.status === "pending" || c.status === "draft") {
                        status = "In Review";
                        color = "#fbc02d";
                        avatarBg = "bg-yellow-600";
                    } else if (c.status === "disputed" || c.status === "delayed") {
                        status = "Delayed";
                        color = "#ef5350";
                        avatarBg = "bg-red-700";
                    }

                    const totalMilestones = c.milestones?.length || 0;
                    const completedMilestones = c.milestones?.filter((m: any) => m.status === 'approved' || m.status === 'paid').length || 0;
                    const completion = calculateContractProgress(c.milestones, c.total_amount);

                    const date = new Date(c.updated_at || c.created_at || Date.now());
                    const now = new Date();
                    const diffMs = now.getTime() - date.getTime();
                    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
                    const diffDays = Math.floor(diffHrs / 24);
                    let updatedAgo = diffHrs < 24 ? `${diffHrs}h ago` : `${diffDays}d ago`;
                    if (diffHrs === 0) updatedAgo = "Just now";

                    const rawName = c.client_name || "CL";
                    const initials = rawName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

                    return {
                        id: c.id,
                        name: c.project_name || "Untitled Project",
                        client: c.client_name || "Unknown Client",
                        updatedAgo,
                        status,
                        milestone: `${completedMilestones}/${totalMilestones}`,
                        completion,
                        color,
                        initials,
                        avatarBg
                    };
                });

                setContracts(mapped);
                setRawContracts(data);
            } catch (err) {
                console.error("Failed to fetch contracts", err);
            } finally {
                setLoadingContracts(false);
            }
        };
        fetchContracts();
    }, []);

    // Fetch user profile for credibility score
    useEffect(() => {
        (async () => {
            try {
                const res = await apiClient.get('/users/me');
                const profile = (res as any).data?.data || (res as any).data;
                if (profile) {
                    setScore(profile.credibility_score || 0);
                    setScoreTier(profile.score_tier || 'Starter');
                    setDimensionScores(profile.dimension_scores || null);
                }

                try {
                    const histRes = await apiClient.get('/users/me/score-history');
                    setScoreHistory((histRes.data?.data || []).slice(0, 52));
                } catch (e) {
                    console.error('Failed to fetch score history', e);
                }
            } catch (err) {
                console.error('Failed to fetch profile', err);
            }
        })();
    }, []);

    // Trigger animation on mount (and on every refresh via key state)
    useEffect(() => {
        const t = setTimeout(() => setAnimated(true), 300);
        return () => clearTimeout(t);
    }, []);

    // Compute metrics from raw contract data
    const computeMetrics = (): MetricCard[] => {
        const total = rawContracts.length;
        const completed = rawContracts.filter((c: any) => c.status === 'completed').length;
        const active = rawContracts.filter((c: any) => c.status === 'active' || c.status === 'signed').length;
        const completionPct = total > 0 ? Math.round((completed / total) * 100) : 0;
        const hasReviews = completed > 0; // proxied from completed contracts
        const earnings = rawContracts
            .filter((c: any) => c.status === 'completed')
            .reduce((sum: number, c: any) => sum + (c.total_amount || 0), 0);

        // Store earnings for display
        if (earnings !== totalEarnings) setTotalEarnings(earnings);

        return [
            { label: 'Contract Completion', value: completionPct.toString(), unit: '%', impact: completionPct >= 80 ? 'High Impact' : 'Medium Impact', impactDots: completionPct >= 80 ? 3 : 2, icon: contract_completition, iconBg: 'bg-[#d4edda]' },
            { label: 'Client Reviews', value: hasReviews ? completed.toString() : '0', unit: '', impact: 'High Impact', impactDots: 3, icon: client_reviews, iconBg: 'bg-[#d4edda]' },
            { label: 'Response Rate', value: '100', unit: '%', impact: 'High Impact', impactDots: 3, icon: response_rate, iconBg: 'bg-[#d4edda]' },
            { label: 'On-Time Delivery', value: total > 0 ? Math.round(((completed) / Math.max(total, 1)) * 100).toString() : '0', unit: '%', impact: 'Medium Impact', impactDots: 2, icon: on_time_delivery, iconBg: 'bg-[#d4edda]' },
            { label: 'Active Contracts', value: active.toString(), unit: '', impact: 'Low Impact', impactDots: 1, icon: active_contracts, iconBg: 'bg-[#d4edda]' },
            { label: 'Disputes', value: '0', unit: '', impact: 'Low Impact', impactDots: 1, icon: disputes, iconBg: 'bg-[#d4edda]' },
        ];
    };

    const metrics = computeMetrics();
    const isEmpty = !loadingContracts && contracts.length === 0;
    const isOverall = true;

    let lastProjectScoreChange = 0;

    // Helper to calculate estimated base score from just profile creation (Verification + Expertise)
    const getBaseScore = () => {
        if (!dimensionScores) return 175;
        return Math.round(175 + (dimensionScores.expertise || 0) * 0.10 + (dimensionScores.verification || 0) * 0.08);
    };

    if (scoreHistory && scoreHistory.length > 0) {
        const currentHistScore = scoreHistory[0].overall_score;
        // Find the most recent historical score that is different from the current score
        const prevScoreObj = scoreHistory.find(s => s.overall_score !== currentHistScore);

        if (prevScoreObj) {
            lastProjectScoreChange = currentHistScore - prevScoreObj.overall_score;
        } else {
            // If all history snapshots are identical, they likely only have 1 project
            // Compute the jump from their base profile score to current
            const baseScore = getBaseScore();
            lastProjectScoreChange = currentHistScore > baseScore ? currentHistScore - baseScore : currentHistScore;
        }
    } else if (score > 0) {
        // Fallback if APIs haven't returned history but we have a score
        const baseScore = getBaseScore();
        lastProjectScoreChange = score > baseScore ? score - baseScore : score;
    }

    const displayScore = score;
    const gaugeMax = 1000;

    return (
        <motion.div
            className="flex-1 bg-[#000] min-h-screen text-white scrBar overflow-y-auto"
            onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
        >
            {/* --- MOBILE LAYOUT (stacked, app-like) --- */}
            <div className="md:hidden px-4 pt-8 pb-24 space-y-8">
                {/* Hero */}
                <div className="space-y-4">
                    {/* <div className="flex items-center justify-center">
                        <h2 className="text-3xl font-normal text-white leading-none font-syne">Credibility Score</h2>
                        <div className="flex gap-1 bg-[#172b1c] rounded-full p-1 border border-gray-800">
                            {(["Overall", "Last Project"] as const).map((t) => (
                                <button
                                    key={t}
                                    onClick={() => setTab(t)}
                                    className={`text-[10px] px-3 py-1 rounded-full font-medium transition-all duration-200 cursor-pointer ${tab === t ? "bg-[#3cb44f] text-black" : "text-gray-400 hover:text-white"
                                        }`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div> */}
                    <div className="flex flex-col items-center gap-1">
                        {isOverall && lastProjectScoreChange !== 0 && (
                            <p className="text-xs font-medium text-[#00e676]">
                                ↗ {lastProjectScoreChange > 0 ? `+${lastProjectScoreChange}` : lastProjectScoreChange} from last project
                            </p>
                        )}
                        <Score displayScore={displayScore} />
                        <p className="text-xs text-gray-400">{isOverall ? scoreTier : 'Last Project Impact'}</p>
                        <div className="mt-4 w-full flex justify-center">
                            <div className="scale-100">
                                <ReputationGauge score={displayScore} animated={animated} maxScale={gaugeMax} idPrefix="mobile-gauge" />
                            </div>
                        </div>
                    </div>
                </div>

                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                    {metrics.map((m, i) => (
                        <div
                            key={i}
                            className="bg-[#111f14] rounded-3xl p-4 flex flex-col justify-between min-h-[120px] border border-white/5"
                        >
                            <div className="flex items-center gap-3 mb-2">
                                <div className={`w-10 h-10 rounded-2xl ${m.iconBg} flex items-center justify-center`}>
                                    <img src={m.icon} alt={m.label} className="w-8 h-8" />
                                </div>
                                <span className="text-[11px] text-gray-400 font-medium">{m.label}</span>
                            </div>
                            <div className="flex items-end justify-between">
                                <span className="text-2xl font-bold text-white">{m.value}{m.unit && <span className="text-xs text-gray-400 ml-1">{m.unit}</span>}</span>
                                <ImpactDots count={m.impactDots} />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Active contracts list */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-bold text-white">Active Contracts</h3>
                            <p className="text-xs text-gray-500">Live updates on your work</p>
                        </div>
                        <button
                            onClick={() => navigate("/dashboard/contract")}
                            className="cursor-pointer text-xs font-semibold text-[#0d140d] border border-[#3cb44f]/30 hover:border-[#3cb44f] bg-[#3cb44f] px-3 py-1.5 rounded-xl transition-all duration-200 flex items-center gap-1.5"
                        >
                            <span className="text-lg -mt-0.5 leading-none">+</span>
                            Create
                        </button>
                    </div>

                    {loadingContracts ? (
                        <div className="space-y-2">
                            {Array.from({ length: 3 }).map((_, i) => (
                                <div key={i} className="bg-[#172b1c] rounded-2xl p-4 animate-pulse h-[96px]" />
                            ))}
                        </div>
                    ) : contracts.length === 0 ? (
                        <div className="bg-[#111f14] rounded-2xl p-5 text-center text-sm text-gray-400">
                            No active contracts. Create one to start building credibility.
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {contracts.map((contract) => (
                                <button
                                    key={contract.id}
                                    className="w-full text-left bg-[#172b1c] rounded-2xl p-4 border border-white/10 flex flex-col gap-3 active:scale-[0.99] transition shadow-sm"
                                    onClick={() => {
                                        openContracts(contract.id);
                                        navigate('/dashboard');
                                    }}
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="flex-1">
                                            <h4 className="text-sm font-semibold text-white">{contract.name}</h4>
                                            <p className="text-[11px] text-gray-400 mt-0.5 truncate">
                                                Client: <span className="text-gray-300">{contract.client}</span>
                                            </p>
                                        </div>
                                        <StatusBadge status={contract.status} />
                                    </div>
                                    <div className="space-y-1">
                                        <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden">
                                            <div
                                                className="h-full rounded-full transition-all duration-700"
                                                style={{
                                                    width: `${contract.completion}%`,
                                                    backgroundColor: contract.color,
                                                    boxShadow: `0 0 6px ${contract.color}55`,
                                                }}
                                            />
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <p className="text-[10px] text-gray-500">{contract.completion}% complete · Milestone {contract.milestone}</p>
                                            <p className="text-[10px] text-gray-500">Updated {contract.updatedAgo}</p>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Bottom dock */}
                <div className="fixed bottom-4 inset-x-0 flex justify-center md:hidden pointer-events-none">
                    <div className="pointer-events-auto w-[92%] max-w-md">
                        {/* Dock body */}
                        <div className="relative rounded-[26px] bg-[#050807]/90 border-b border-white/10 shadow-[0_18px_40px_rgba(0,0,0,0.9)] px-5 py-3 backdrop-blur-md">
                            {/* Center FAB (Create) */}
                            <div className="absolute left-1/2 -translate-x-1/2 -top-4 z-10 flex items-center justify-center">
                       
                                <div className="w-16 h-16 rounded-full bg-[#050807]/90 backdrop-blur-md flex items-center justify-center">
                                    <button
                                        onClick={() => navigate('/dashboard/contract')}
                                        className="w-14 h-14 rounded-full bg-[#3cb44f] text-black shadow-[0_8px_16px_rgba(60,180,79,0.18)] border border-[#b7f3c2]/40 flex items-center justify-center active:scale-95 transition cursor-pointer"
                                        title="Create Contract"
                                    >
                                        <PlusIcon size={26} className="text-black" />
                                    </button>
                                </div>
                            </div>
                       

                            <div className="grid grid-cols-5 gap-1 items-end">
                                {/* Home */}
                                <button
                                    className="flex flex-col items-center gap-1 text-[12px] font-medium text-[#3cb44f] min-w-0 px-1"
                                    onClick={() => navigate('/dashboard')}
                                >
                                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center text-[#3cb44f]">
                                        <HouseIcon size={22} />
                                    </div>
                                    Home
                                </button>

                                {/* Contracts */}
                                <button
                                    className="flex flex-col items-center gap-1 text-[12px] font-medium text-gray-400 min-w-0 px-1"
                                    onClick={() => openContracts()}
                                >
                                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center">
                                        <FolderOpenIcon size={22} />
                                    </div>
                                    Contracts
                                </button>

                                {/* Center spacing (for FAB) */}
                                <div className="w-full h-full" />

                                {/* Notifications */}
                                <button
                                    className="flex flex-col items-center gap-1 text-[12px] font-medium text-gray-400 min-w-0 px-1"
                                    onClick={() => setMobileNotifOpen(true)}
                                >
                                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center">
                                        <BellRingIcon size={22} />
                                    </div>
                                    Alerts
                                </button>

                                {/* Menu */}
                                <button
                                    className="flex flex-col items-center gap-1 text-[12px] font-medium text-gray-400 min-w-0 px-1"
                                    onClick={() => setMobileDrawerOpen(true)}
                                >
                                    <div className="w-9 h-9 rounded-2xl flex items-center justify-center">
                                        <ListChevronsUpDownIcon size={22} />
                                    </div>
                                    Menu
                                </button>
                            </div>
                       
                        </div>
                    </div>
                </div>
            </div>

            {/* Mobile: notifications panel (reuses existing component) */}
            <div className="md:hidden">
                <NotificationPanel isOpen={mobileNotifOpen} onClose={() => setMobileNotifOpen(false)} />
            </div>

            {/* Mobile: profile drawer */}
            {mobileDrawerOpen && (
                <div className="fixed inset-0 z-[9999] md:hidden">
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={() => setMobileDrawerOpen(false)}
                    />
                    <motion.div
                        initial={{ y: 30, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 30, opacity: 0 }}
                        transition={{ duration: 0.18, ease: 'easeOut' }}
                        className="absolute left-0 right-0 bottom-0 rounded-t-[28px] bg-[#050807] border-t border-white/10 shadow-[0_-20px_60px_rgba(0,0,0,0.8)] p-5"
                    >
                        <div className="flex items-center justify-between mb-3">
                            <div className="w-12 h-1 rounded-full bg-white/10 mx-auto" />
                            {/* <button
                                className="absolute right-4 top-4 w-10 h-10 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-gray-300"
                                onClick={() => setMobileDrawerOpen(false)}
                            >
                                <X size={18} />
                            </button> */}
                        </div>

                        <div className="space-y-2 pt-2">
                            <button
                                onClick={() => { setMobileDrawerOpen(false); navigate('/dashboard/profile'); }}
                                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-semibold"
                            >
                                <span className="flex items-center gap-3"><UserRoundIcon size={18} className="text-[#3cb44f]" /> Profile</span>
                                <span className="text-gray-500 text-xs">View</span>
                            </button>

                            <button
                                onClick={async () => { setMobileDrawerOpen(false); await logout(); navigate('/'); }}
                                className="w-full flex items-center justify-between px-4 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-300 font-bold"
                            >
                                <span className="flex items-center gap-3"><LogoutIcon size={18} /> Logout</span>
                                <span className="text-red-300/70 text-xs">Exit</span>
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}

            {/* --- DESKTOP LAYOUT (existing) --- */}
            <div className="hidden md:block">
                {/* TOP SECTION (fixed hero) */}
                <div className="fixed inset-x-0 top-15 z-10 pointer-events-none">
                    <motion.div
                        className="pointer-events-auto max-w-full mx-auto flex flex-col gap-6 p-8 pb-24"
                        initial={{ opacity: 0, y: -16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.55, ease: "easeOut", delay: 0.1 }}
                    >
                    {/* ── EMPTY STATE: just the gauge, centered ── */}
                    {isEmpty ? (
                        <div className="w-full flex flex-col items-center justify-center gap-6 pt-4 pb-4">
                            {/* Score label */}
                            <div className="text-center">
                                <h2 className="text-5xl font-normal text-white leading-tight font-syne">Credibility Score</h2>
                                <p className="text-gray-500 text-sm mt-2">Builds automatically as you complete contracts</p>
                            </div>

                            {/* Gauge */}
                            <div className="flex flex-col items-center gap-2">
                                <p className="text-sm font-medium text-[#3cb44f]">
                                    ↗ {lastProjectScoreChange > 0 ? `+${lastProjectScoreChange}` : lastProjectScoreChange} {isOverall ? 'from last project' : 'gained'}
                                </p>
                                <h1 className="text-[96px] font-bold text-white tracking-tighter leading-none">{displayScore}</h1>
                                <p className="text-gray-400 text-sm font-medium">{isOverall ? scoreTier : 'Last Project Impact'}</p>
                                <div className="scale-[1.25] origin-top mt-2">
                                    <ReputationGauge score={displayScore} animated={animated} maxScale={gaugeMax} />
                                </div>
                            </div>


                            {/* Tab selector (still functional) */}
                            {/* <div className="flex gap-1 bg-[#172b1c] rounded-full p-1 border border-gray-800 mt-8">
                                {(["Overall", "Last Project"] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTab(t)}
                                        className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all duration-200 cursor-pointer ${tab === t ? "bg-[#3cb44f] text-black" : "text-gray-400 hover:text-white"
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div> */}
                        </div>
                    ) : (
                        /* ── NORMAL STATE: full 12-col grid ── */
                        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                            {/* LEFT: Reputation Score */}
                            <motion.div
                                className="xl:col-span-5 rounded-[32px] pl-8 pt-8 flex flex-col justify-between shadow-sm"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: "easeOut", delay: 0.18 }}
                            >
                                {/* Title row */}
                                <div className="flex items-start justify-between mb-8">
                                    <h2 className="text-6xl font-normal text-white leading-tight -mt-8 font-syne">Credibility<br />Score</h2>
                                    {/* <div className="flex gap-1 bg-[#172b1c] rounded-full p-1 border border-gray-800">
                                        {(["Overall", "Last Project"] as const).map((t) => (
                                            <button
                                                key={t}
                                                onClick={() => setTab(t)}
                                                className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all duration-200 cursor-pointer ${tab === t ? "bg-[#3cb44f] text-black" : "text-gray-400 hover:text-white"
                                                    }`}
                                            >
                                                {t}
                                            </button>
                                        ))}
                                    </div> */}
                                </div>

                                {/* Middle: Score and Gauge */}
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10 mt-6">
                                    <div>
                                        {isOverall && lastProjectScoreChange !== 0 && (
                                            <p className="text-sm font-medium text-[#00e676] mb-2">
                                                ↗ {lastProjectScoreChange > 0 ? `+${lastProjectScoreChange}` : lastProjectScoreChange}{' '}
                                                from last project
                                            </p>
                                        )}

                                        <Score displayScore={displayScore} />
                                        {/* <p className="text-gray-400 text-sm font-medium">{isOverall ? scoreTier : 'Last Project Impact'}</p> */}
                                    </div>
                                    <div className="flex justify-center md:justify-end flex-1 origin-right scale-110 mr-4">
                                        <ReputationGauge score={displayScore} animated={animated} maxScale={gaugeMax} />
                                    </div>
                                </div>

                                {/* Bottom: Two stat cards */}
                                <div className="grid grid-cols-2 gap-2">
                                    <div className="bg-[#111f14] rounded-[40px] p-6 flex flex-col justify-between min-h-[140px]">
                                        <div className="flex justify-between items-start">
                                            <p className="text-gray-400 font-medium text-sm">Tier</p>
                                        </div>
                                        <p className="text-white font-bold text-3xl">{scoreTier}</p>
                                    </div>
                                    <div className="bg-[#111f14] rounded-[40px] p-6 flex flex-col justify-between min-h-[140px]">
                                        <div className="flex justify-between items-start">
                                            <p className="text-gray-400 font-medium text-sm">Total Earnings</p>
                                        </div>
                                        <p className="text-white font-bold text-5xl">{totalEarnings >= 1000 ? `₹${(totalEarnings / 1000).toFixed(1)}` : `₹${totalEarnings}`}<span className="text-xl text-gray-400 font-medium">{totalEarnings >= 1000 ? 'k' : ''}</span></p>
                                    </div>
                                </div>
                            </motion.div>

                            {/* RIGHT: Metrics grid */}
                            <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                {metrics.map((m, i) => (
                                    <motion.div
                                        key={i}
                                        className="bg-[#111f14] rounded-[40px] p-6 flex flex-col justify-between hover:border-gray-600 transition-colors shadow-sm min-h-[180px]"
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ duration: 0.45, ease: "easeOut", delay: 0.22 + i * 0.05 }}
                                        whileHover={{ y: -4, scale: 1.01 }}
                                    >
                                        <div className="flex items-start justify-between mb-2">
                                            <div className={`w-16 h-16 rounded-full ${m.iconBg} flex items-center justify-center text-xl`}>
                                                <img src={m.icon} alt={m.label} className="w-10 h-10" />
                                            </div>
                                            {/* <button className="text-gray-500 hover:text-white px-1 pb-2 h-12 w-12 mt-2 flex items-center justify-center rounded-full border border-gray-700 cursor-pointer transition-colors pt-2 rotate-90">
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                                            </button> */}
                                        </div>

                                        <div className="mt-auto">
                                            <h3 className="text-gray-400 text-sm font-medium tracking-tight mb-2 pr-2">{m.label}</h3>
                                            <div className="flex items-end justify-between">
                                                <div className="flex items-baseline gap-0.5">
                                                    <span className="text-6xl font-bold text-white tracking-tight leading-none">{m.value}</span>
                                                    {m.unit && <span className="text-gray-400 font-medium text-sm ml-1 mb-0.5">{m.unit}</span>}
                                                </div>
                                                <div className="flex flex-col items-end gap-1.5 mb-1 pb-1">
                                                    <ImpactDots count={m.impactDots} />
                                                    <span className="text-gray-500 text-[10px] font-semibold">{m.impact}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        </div>
                    )}
                    </motion.div>
                </div>

                {/* BOTTOM SECTION (curved, overlaps, parallax) */}
                <div className={`relative min-h-screen ${isEmpty ? 'pt-[700px]' : 'pt-[700px]'}`}>
                    <div
                        className="relative z-20 rounded-t-[100px] bg-[#0d1a10] p-8 shadow-[0_-30px_80px_rgba(0,0,0,0.8)]"
                    >
                    {/* Centered handle / notch */}
                    <div
                        className="absolute top-0 left-1/2 transform -translate-x-1/2 mb-4"
                        style={{
                            width: "96px", // w-24
                            height: "24px", // h-6
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            background: "#050605",
                            clipPath: "polygon(0% 0%, 100% 0%, 85% 100%, 15% 100%)"
                        }}
                    >
                        <div className="w-12 h-1 rounded-full mx-auto bg-[#d4edda] shadow-[0_0_10px_rgba(0,0,0,0.8)]" />
                    </div>

                    <div className="sticky top-0 z-30 mx-0 mb-8 px-8 pt-2 pb-4 flex items-center justify-between backdrop-blur-md">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Active Contracts</h2>
                            <p className="text-gray-500 text-sm mt-1">Live updates on your ongoing work</p>
                        </div>
                        <button
                            onClick={() => navigate("/dashboard/contract")}
                            className="cursor-pointer text-sm font-semibold text-[#0d140d] border border-[#3cb44f]/30 hover:border-[#3cb44f] bg-[#3cb44f] px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5"
                        >
                            <span className="text-2xl -mt-1 leading-none group-hover:scale-110 transition-transform duration-300">+</span>
                            Create Contract
                        </button>
                    </div>

                    <motion.div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5"
                        style={{ transform: `translateY(${scrollY * -0.08}px)` }}
                    >
                        {loadingContracts ? (
                            Array.from({ length: 6 }).map((_, i) => (
                                <div key={i} className="bg-[#172b1c] rounded-[30px] p-5 animate-pulse h-[140px]" />
                            ))
                        ) : contracts.length === 0 ? (
                            /* ── Premium empty-state CTA ── */
                            <motion.div
                                className="col-span-full"
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: 'easeOut', delay: 0.2 }}
                            >
                                <div
                                    className="mx-auto max-w-xl rounded-[40px] p-10 flex flex-col items-center -mt-5 text-center gap-6"
                                    style={{
                                        background: 'linear-gradient(135deg, #111f14 0%, #0d1a10 100%)',
                                        border: '1px solid rgba(60,180,79,0.15)',
                                        boxShadow: '0 0 60px rgba(60,180,79,0.06)',
                                    }}
                                >
                                    {/* Icon */}
                                    {/* <div
                                        className="w-20 h-20 rounded-3xl flex items-center justify-center text-4xl"
                                        style={{ background: 'rgba(60,180,79,0.1)', border: '1px solid rgba(60,180,79,0.2)' }}
                                    >
                                        📄
                                    </div> */}

                                    <div>
                                        <h3 className="text-white text-2xl font-bold mb-2">Send your first contract</h3>
                                        <p className="text-gray-500 text-sm leading-relaxed max-w-sm">
                                            Contracts are how you get paid, protect your work, and build your credibility score.
                                            Create one in under 2 minutes.
                                        </p>
                                    </div>

                                    {/* Steps */}
                                    <div className="w-full grid grid-cols-3 gap-3">
                                        {[
                                            { n: '1', label: 'Define scope & milestones' },
                                            { n: '2', label: 'Send link to your client' },
                                            { n: '3', label: 'Get paid on completion' },
                                        ].map((s) => (
                                            <div
                                                key={s.n}
                                                className="rounded-2xl p-4 flex flex-col items-center gap-2"
                                                style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                                            >
                                                <span
                                                    className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-black"
                                                    style={{ background: '#3cb44f' }}
                                                >
                                                    {s.n}
                                                </span>
                                                <p className="text-gray-400 text-xs leading-snug">{s.label}</p>
                                            </div>
                                        ))}
                                    </div>

                                    {/* CTA */}
                                    <button
                                        onClick={() => navigate('/contract')}
                                        className="cursor-pointer mt-2 px-8 py-3.5 rounded-2xl font-bold text-sm text-black transition-all duration-200 hover:scale-[1.03] active:scale-95"
                                        style={{
                                            background: '#3cb44f',
                                            boxShadow: '0 8px 24px rgba(60,180,79,0.3)',
                                        }}
                                    >
                                        + Create your first contract
                                    </button>
                                </div>
                            </motion.div>
                        ) : contracts.map((contract, idx) => (
                            <motion.div
                                key={contract.id}
                                className="bg-[#172b1c] rounded-[30px] p-5 transition-all duration-200 cursor-pointer group"
                                onClick={() => {
                                    openContracts(contract.id);
                                    navigate('/dashboard');
                                }}
                                initial={{ opacity: 0, y: 18 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 + idx * 0.04 }}
                                whileHover={{ y: -4, scale: 1.01 }}
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        {/* <div className={`w-11 h-11 rounded-xl ${contract.avatarBg} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                                            {contract.initials}
                                        </div> */}
                                        <div>
                                            <h3 className="text-white font-semibold text-base group-hover:text-[#00e676] transition-colors">
                                                {contract.name}
                                            </h3>
                                            <p className="text-gray-500 text-sm mt-0.5">
                                                Client: <span className="text-gray-300">{contract.client}</span><br /> Updated {contract.updatedAgo}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <StatusBadge status={contract.status} />
                                        <button
                                            type="button"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                openContracts(contract.id);
                                                navigate('/dashboard');
                                            }}
                                            className="mt-1 text-[11px] font-semibold text-[#3cb44f] hover:text-white transition-colors"
                                        >
                                            Open contract &rarr;
                                        </button>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full h-2 border border-gray-700 rounded-full overflow-hidden mt-1">
                                    <div
                                        className="h-full rounded-full transition-all duration-1000"
                                        style={{
                                            width: animated ? `${contract.completion}%` : "0%",
                                            backgroundColor: contract.color,
                                            transitionDelay: "500ms",
                                            boxShadow: `0 0 8px ${contract.color}55`,
                                        }}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <p className="text-gray-500 text-xs font-semibold mt-2">{contract.completion}% complete</p>
                                    <span className="text-gray-500 text-xs font-medium mt-1">Milestone {contract.milestone}</span>
                                </div>
                            </motion.div>
                        ))}
                    </motion.div>
                    </div>
                </div>
            </div>
            {/* Floating Action Button (desktop, currently disabled) */}
            {/* <button
                onClick={() => navigate("/contract")}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-10 py-3.5 rounded-[20px] bg-[#00e676] text-black font-bold text-lg shadow-[0_8px_30px_rgba(0,230,118,0.25)] hover:shadow-[0_12px_40px_rgba(0,230,118,0.4)] transition-all duration-300 hover:-translate-y-1 active:scale-95 flex items-center gap-2 group cursor-pointer"
            >
                <span className="text-2xl -mt-1 leading-none group-hover:scale-110 transition-transform duration-300">+</span>
                Create Project
            </button> */}
        </motion.div>
    );
};

export default Dashboard;