import { useState, useEffect } from "react";
import { useContractsStore } from "@/store/useContractsStore";

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
    status: "Active" | "In Review" | "Delayed";
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
const metrics: MetricCard[] = [
    { label: "Contract Completion", value: "92", unit: "%", impact: "High Impact", impactDots: 3, icon: "✅", iconBg: "bg-green-900" },
    { label: "Client Reviews", value: "100", unit: "%", impact: "High Impact", impactDots: 3, icon: "⭐", iconBg: "bg-yellow-900" },
    { label: "Response Rate", value: "85", unit: "%", impact: "High Impact", impactDots: 3, icon: "💬", iconBg: "bg-blue-900" },
    { label: "On-Time Delivery", value: "4 years", unit: " avg", impact: "Medium Impact", impactDots: 2, icon: "⏱️", iconBg: "bg-gray-800" },
    { label: "Active Contracts", value: "12", unit: "", impact: "Low Impact", impactDots: 1, icon: "📁", iconBg: "bg-yellow-900" },
    { label: "Disputes", value: "0", unit: "%", impact: "Low Impact", impactDots: 1, icon: "🛡️", iconBg: "bg-gray-800" },
];

const contracts: Contract[] = [
    { id: 1, name: "E-Commerce React Frontend", client: "Sarah Miller", updatedAgo: "2h ago", status: "Active", milestone: "2/4", completion: 60, color: "#00e676", initials: "SM", avatarBg: "bg-green-700" },
    { id: 2, name: "Mobile Banking App UI", client: "James Anderson", updatedAgo: "5h ago", status: "In Review", milestone: "5/5", completion: 90, color: "#fbc02d", initials: "JA", avatarBg: "bg-yellow-600" },
    { id: 3, name: "SaaS Dashboard Design", client: "Priya Sharma", updatedAgo: "1d ago", status: "Delayed", milestone: "1/3", completion: 25, color: "#ef5350", initials: "PS", avatarBg: "bg-red-700" },
];

// const activities: Activity[] = [
// { id: 1, text: "Sarah Miller approved milestone #2", highlight: "Sarah Miller", time: "2h ago", dotColor: "bg-[#00e676]" },
// { id: 2, text: "New message from James Anderson", highlight: "James Anderson", time: "4h ago", dotColor: "bg-blue-400" },
// { id: 3, text: "Deadline extended: SaaS Dashboard", highlight: "SaaS Dashboard", time: "1d ago", dotColor: "bg-red-400" },
// { id: 4, text: "Invoice #004 marked as paid", highlight: "Invoice #004", time: "2d ago", dotColor: "bg-[#00e676]" },
// ];

const ReputationGauge = ({ score, animated }: { score: number; animated: boolean }) => {
    const [normalized, setNormalized] = useState(0);

    const min = 300;
    const max = 900;

    useEffect(() => {
        if (animated) {
            const val = Math.max(0, Math.min(1, (score - min) / (max - min)));
            setNormalized(val);
        } else {
            setNormalized(0);
        }
    }, [animated, score, min, max]);

    const arcLength = 251.3; // Math.PI * 80
    const offset = arcLength - normalized * arcLength;
    const rotation = -90 + normalized * 180; // from -90 to +90

    return (
        <div className="relative w-[320px] max-w-full mx-auto mt-4">
            <svg viewBox="0 0 200 120" className="w-full overflow-visible">
                <defs>
                    <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#031b0e" />
                        <stop offset="100%" stopColor="#00e676" />
                    </linearGradient>
                    <filter id="hueGlow" x="-20%" y="-20%" width="140%" height="140%">
                        <feGaussianBlur stdDeviation="7" />
                    </filter>
                    <filter id="arrowShadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow dx="0" dy="2" stdDeviation="2" floodColor="#000000" floodOpacity="0.8" />
                    </filter>
                </defs>

                {/* Background arc ("remaining" empty part)  */}
                <path
                    d="M20 100 A80 80 0 0 1 180 100"
                    fill="none"
                    stroke="rgba(255, 255, 255, 0.08)"
                    strokeWidth="22"
                    strokeLinecap="butt"
                />

                {/* Glow layer following the exact gradient */}
                <path
                    d="M20 100 A80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="22"
                    strokeLinecap="butt"
                    filter="url(#hueGlow)"
                    opacity={0.8}
                    style={{
                        strokeDasharray: arcLength,
                        strokeDashoffset: offset,
                        transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                />

                {/* Core Progress arc top layer */}
                <path
                    d="M20 100 A80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="22"
                    strokeLinecap="butt"
                    style={{
                        strokeDasharray: arcLength,
                        strokeDashoffset: offset,
                        transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                />

                {/* Arrow Pointer Group */}
                <g style={{
                    transformOrigin: "100px 100px",
                    transform: `rotate(${rotation}deg)`,
                    transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                }}>
                    {/* The Arrow anchored exactly at center */}
                    <path
                        d="M 100 80 L 88 108 L 100 100 L 112 108 Z"
                        fill="#ffffff"
                        filter="url(#arrowShadow)"
                    />
                </g>
            </svg>
        </div>
    );
};

// --- Status badge ---
const StatusBadge = ({ status }: { status: Contract["status"] }) => {
    const map = {
        Active: "bg-green-900 text-green-400 border border-green-700",
        "In Review": "bg-yellow-900 text-yellow-400 border border-yellow-700",
        Delayed: "bg-red-900 text-red-400 border border-red-700",
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
            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < count ? "bg-[#00e676]" : "bg-gray-700"}`} />
        ))}
    </span>
);

// --- Main Dashboard ---
const Dashboard = () => {
    const openContracts = useContractsStore((state) => state.openContracts);
    const [animated, setAnimated] = useState(false);
    const [tab, setTab] = useState<"Overall" | "Monthly">("Overall");

    // Trigger animation on mount (and on every refresh via key state)
    useEffect(() => {
        const t = setTimeout(() => setAnimated(true), 300);
        return () => clearTimeout(t);
    }, []);

    const score = 832;

    return (
        <div className="flex-1 bg-[#0f1117] min-h-screen text-white scrBar overflow-y-auto">

            {/* Main Layout */}
            <div className="flex flex-col gap-6 p-8">

                {/* --- TOP SECTION --- */}
                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                    {/* LEFT: Reputation Score */}
                    <div className="xl:col-span-5 bg-[#161b27] rounded-[32px] p-8 border border-gray-800 flex flex-col justify-between shadow-sm">
                        {/* Title row */}
                        <div className="flex items-start justify-between mb-8">
                            <h2 className="text-3xl font-bold text-white leading-tight">Reputation<br />Score</h2>
                            <div className="flex gap-1 bg-[#0f1117] rounded-full p-1 border border-gray-800">
                                {(["Overall", "Monthly"] as const).map((t) => (
                                    <button
                                        key={t}
                                        onClick={() => setTab(t)}
                                        className={`text-xs px-4 py-1.5 rounded-full font-medium transition-all duration-200 cursor-pointer ${tab === t ? "bg-[#00e676] text-black" : "text-gray-400 hover:text-white"
                                            }`}
                                    >
                                        {t}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Middle: Score and Gauge */}
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                            <div>
                                <p className="text-sm font-medium text-[#00e676] mb-2">↗ 5 pts</p>
                                <h1 className="text-[80px] font-bold text-white tracking-tighter leading-none mb-3">{score}</h1>
                                <p className="text-gray-400 text-sm font-medium">Excellent · Checked Daily</p>
                            </div>
                            <div className="flex justify-center md:justify-end flex-1 origin-right scale-110 mr-4">
                                <ReputationGauge score={score} animated={animated} />
                            </div>
                        </div>

                        {/* Bottom: Two stat cards */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-[#0f1117] rounded-3xl p-6 border border-gray-800 flex flex-col justify-between min-h-[140px]">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-gray-400 font-medium text-sm">Rising Talent</p>
                                    <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-400">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                                    </div>
                                </div>
                                <p className="text-white font-bold text-3xl">Tier 2</p>
                            </div>
                            <div className="bg-[#0f1117] rounded-3xl p-6 border border-gray-800 flex flex-col justify-between min-h-[140px]">
                                <div className="flex justify-between items-start mb-4">
                                    <p className="text-gray-400 font-medium text-sm">Total Growth</p>
                                    <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-400">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                                    </div>
                                </div>
                                <p className="text-white font-bold text-3xl">$12<span className="text-xl text-gray-400 font-medium">.4k</span></p>
                            </div>
                        </div>
                    </div>

                    {/* RIGHT: Metrics grid */}
                    <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {metrics.map((m, i) => (
                            <div key={i} className="bg-[#161b27] rounded-[32px] p-6 border border-gray-800 flex flex-col justify-between hover:border-gray-600 transition-colors shadow-sm min-h-[180px]">
                                <div className="flex items-start justify-between mb-2">
                                    <div className={`w-12 h-12 rounded-full ${m.iconBg} flex items-center justify-center text-xl`}>
                                        {m.icon}
                                    </div>
                                    <button className="text-gray-500 hover:text-white px-1 pb-2 cursor-pointer transition-colors pt-2">
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                                    </button>
                                </div>

                                <div className="mt-auto">
                                    <h3 className="text-gray-400 text-sm font-medium tracking-tight mb-2 pr-2">{m.label}</h3>
                                    <div className="flex items-end justify-between">
                                        <div className="flex items-baseline gap-0.5">
                                            <span className="text-4xl font-bold text-white tracking-tight leading-none">{m.value}</span>
                                            {m.unit && <span className="text-gray-400 font-medium text-sm ml-1 mb-0.5">{m.unit}</span>}
                                        </div>
                                        <div className="flex flex-col items-end gap-1.5 mb-1 pb-1">
                                            <ImpactDots count={m.impactDots} />
                                            <span className="text-gray-500 text-[10px] font-semibold">{m.impact}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* --- BOTTOM SECTION --- */}

                {/* Active Contracts */}
                <div className="bg-[#161b27] rounded-[32px] border border-gray-800 p-8 shadow-sm">
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h2 className="text-2xl font-bold text-white">Active Contracts</h2>
                            <p className="text-gray-500 text-sm mt-1">Live updates on your ongoing work</p>
                        </div>
                        <button
                            onClick={openContracts}
                            className="cursor-pointer text-sm font-semibold text-[#00e676] border border-[#00e676]/30 hover:border-[#00e676] bg-[#0f1117] px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5"
                        >
                            View all <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7" /></svg>
                        </button>
                    </div>

                    <div className="flex flex-col gap-4">
                        {contracts.map((contract) => (
                            <div
                                key={contract.id}
                                className="bg-[#0f1117] rounded-2xl border border-gray-800 p-5 hover:border-gray-600 transition-all duration-200 cursor-pointer group"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-11 h-11 rounded-xl ${contract.avatarBg} flex items-center justify-center text-white text-sm font-bold shrink-0`}>
                                            {contract.initials}
                                        </div>
                                        <div>
                                            <h3 className="text-white font-semibold text-base group-hover:text-[#00e676] transition-colors">
                                                {contract.name}
                                            </h3>
                                            <p className="text-gray-500 text-sm mt-0.5">
                                                Client: <span className="text-gray-300">{contract.client}</span> · Updated {contract.updatedAgo}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex flex-col items-end gap-1.5">
                                        <StatusBadge status={contract.status} />
                                        <span className="text-gray-500 text-xs font-medium mt-1">Milestone {contract.milestone}</span>
                                    </div>
                                </div>
                                {/* Progress bar */}
                                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mt-1">
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
                                <p className="text-gray-500 text-xs font-semibold mt-2">{contract.completion}% complete</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

        </div>
    );
};

export default Dashboard;