import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useContractsStore } from "@/store/useContractsStore";
import contract_completition from "@/assets/contract_completition.png";
import client_reviews from "@/assets/client_reviews.png";
import response_rate from "@/assets/response_rate.png";
import on_time_delivery from "@/assets/on_time_delivery.png";
import active_contracts from "@/assets/active_contracts.png";
import disputes from "@/assets/disputes.png";

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
    { label: "Contract Completion", value: "92", unit: "%", impact: "High Impact", impactDots: 3, icon: contract_completition, iconBg: "bg-[#d4edda]" },
    { label: "Client Reviews", value: "100", unit: "%", impact: "High Impact", impactDots: 3, icon: client_reviews, iconBg: "bg-[#d4edda]" },
    { label: "Response Rate", value: "85", unit: "%", impact: "High Impact", impactDots: 3, icon: response_rate, iconBg: "bg-[#d4edda]" },
    { label: "On-Time Delivery", value: "98", unit: "%", impact: "Medium Impact", impactDots: 2, icon: on_time_delivery, iconBg: "bg-[#d4edda]" },
    { label: "Active Contracts", value: "12", unit: "", impact: "Low Impact", impactDots: 1, icon: active_contracts, iconBg: "bg-[#d4edda]" },
    { label: "Disputes", value: "0", unit: "%", impact: "Low Impact", impactDots: 1, icon: disputes, iconBg: "bg-[#d4edda]" },
];

const contracts: Contract[] = [
    { id: 1, name: "E-Commerce React Frontend", client: "Sarah Miller", updatedAgo: "2h ago", status: "Active", milestone: "2/4", completion: 60, color: "#00e676", initials: "SM", avatarBg: "bg-green-700" },
    { id: 2, name: "Mobile Banking App UI", client: "James Anderson", updatedAgo: "5h ago", status: "In Review", milestone: "5/5", completion: 90, color: "#fbc02d", initials: "JA", avatarBg: "bg-yellow-600" },
    { id: 3, name: "SaaS Dashboard Design", client: "Priya Sharma", updatedAgo: "1d ago", status: "Delayed", milestone: "1/3", completion: 25, color: "#ef5350", initials: "PS", avatarBg: "bg-red-700" },
    { id: 4, name: "E-Commerce React Frontend", client: "Sarah Miller", updatedAgo: "2h ago", status: "Active", milestone: "2/4", completion: 60, color: "#00e676", initials: "SM", avatarBg: "bg-green-700" },
    { id: 5, name: "Mobile Banking App UI", client: "James Anderson", updatedAgo: "5h ago", status: "In Review", milestone: "5/5", completion: 90, color: "#fbc02d", initials: "JA", avatarBg: "bg-yellow-600" },
    { id: 6, name: "SaaS Dashboard Design", client: "Priya Sharma", updatedAgo: "1d ago", status: "Delayed", milestone: "1/3", completion: 25, color: "#ef5350", initials: "PS", avatarBg: "bg-red-700" },
    { id: 7, name: "E-Commerce React Frontend", client: "Sarah Miller", updatedAgo: "2h ago", status: "Active", milestone: "2/4", completion: 60, color: "#00e676", initials: "SM", avatarBg: "bg-green-700" },
    { id: 8, name: "Mobile Banking App UI", client: "James Anderson", updatedAgo: "5h ago", status: "In Review", milestone: "5/5", completion: 90, color: "#fbc02d", initials: "JA", avatarBg: "bg-yellow-600" },
    { id: 9, name: "SaaS Dashboard Design", client: "Priya Sharma", updatedAgo: "1d ago", status: "Delayed", milestone: "1/3", completion: 25, color: "#ef5350", initials: "PS", avatarBg: "bg-red-700" },
];

// const activities: Activity[] = [
// { id: 1, text: "Sarah Miller approved milestone #2", highlight: "Sarah Miller", time: "2h ago", dotColor: "bg-[#00e676]" },
// { id: 2, text: "New message from James Anderson", highlight: "James Anderson", time: "4h ago", dotColor: "bg-blue-400" },
// { id: 3, text: "Deadline extended: SaaS Dashboard", highlight: "SaaS Dashboard", time: "1d ago", dotColor: "bg-red-400" },
// { id: 4, text: "Invoice #004 marked as paid", highlight: "Invoice #004", time: "2d ago", dotColor: "bg-[#00e676]" },
// ];

const ReputationGauge = ({ score, animated }: { score: number; animated: boolean }) => {
    const [normalized, setNormalized] = useState(0);

    const min = 0;
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
                    {/* Progress arc gradient */}
                    <linearGradient id="progressGradient" x1="0%" y1="100%" x2="100%" y2="0%">
                        {/* Dark base at the bottom-left arc start (20,100) */}
                        <stop offset="0%" stopColor="#0d140d" />
                        <stop offset="70%" stopColor="#3cb44f" />
                        <stop offset="100%" stopColor="#2d8a3e" />
                    </linearGradient>

                    {/* True bottom-up radial fade for the glow layer */}
                    {/* <radialGradient id="radialArcGlow" cx="20" cy="100" r="80" gradientUnits="userSpaceOnUse">
                        <stop offset="5%" stopColor="#00e676" stopOpacity="0.85" />
                        <stop offset="50%" stopColor="#00e676" stopOpacity="0.28" />
                        <stop offset="95%" stopColor="#0d140d" stopOpacity="0" />
                    </radialGradient> */}

                    {/* Subtle outer glow filter */}
                    <filter id="hueGlow" x="-10%" y="-10%" width="120%" height="120%">
                        <feGaussianBlur in="SourceGraphic" stdDeviation="2.2" result="blur" />
                        <feColorMatrix
                            in="blur"
                            type="matrix"
                            values="
                                1 0 0 0 0
                                0 1 0 0 0
                                0 0 1 0 0
                                0 0 0 0.28 0
                            "
                            result="softGlow"
                        />
                        <feMerge>
                            <feMergeNode in="softGlow" />
                        </feMerge>
                    </filter>

                    {/* Arrow shadow filter */}
                    <filter id="arrowShadow" x="-30%" y="-30%" width="160%" height="160%">
                        <feDropShadow
                            dx="0"
                            dy="1.5"
                            stdDeviation="1.6"
                            floodColor="#000000"
                            floodOpacity="0.4"
                        />
                    </filter>
                </defs>

                {/* BG fade from arc bottom start */}
                <path
                    d="M20 100 A80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#radialArcGlow)"
                    strokeWidth="26"
                    strokeLinecap="round"
                    opacity="0.7"
                />

                {/* Subtle glow layer over main arc using the same bottom-up concept */}
                <path
                    d="M20 100 A80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="22"
                    strokeLinecap="round"
                    filter="url(#hueGlow)"
                    opacity={0.45}
                    style={{
                        strokeDasharray: arcLength,
                        strokeDashoffset: offset,
                        transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                />

                {/* Core progress arc */}
                <path
                    d="M20 100 A80 80 0 0 1 180 100"
                    fill="none"
                    stroke="url(#progressGradient)"
                    strokeWidth="20"
                    strokeLinecap="round"
                    style={{
                        strokeDasharray: arcLength,
                        strokeDashoffset: offset,
                        transition: "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                />

                {/* Arrow Pointer Group */}
                <g
                    style={{
                        transformOrigin: "100px 100px",
                        transform: `rotate(${rotation}deg)`,
                        transition: "transform 0.8s cubic-bezier(0.4, 0, 0.2, 1)"
                    }}
                >
                    {/* Arrow */}
                    <path
                        d="M 100 80 L 88 108 L 100 100 L 112 108 Z"
                        fill="#ffffff"
                        opacity={0.9}
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
            <span key={i} className={`w-1.5 h-1.5 rounded-full ${i < count ? "bg-[#00e676]" : "bg-transparent border border-gray-700"}`} />
        ))}
    </span>
);

// --- Main Dashboard ---
const Dashboard = () => {
    const navigate = useNavigate();
    const openContracts = useContractsStore((state) => state.openContracts);
    const [animated, setAnimated] = useState(false);
    const [tab, setTab] = useState<"Overall" | "Last Project">("Overall");
    const [scrollY, setScrollY] = useState(0);

    // Trigger animation on mount (and on every refresh via key state)
    useEffect(() => {
        const t = setTimeout(() => setAnimated(true), 300);
        return () => clearTimeout(t);
    }, []);

    const score = 750;

    return (
        <div
            className="flex-1 bg-[#0d140d] min-h-screen text-white scrBar overflow-y-auto"
            onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}
        >
            {/* --- TOP SECTION (fixed hero) --- */}
            <div className="fixed inset-x-0 top-15 z-10 pointer-events-none">
                <div className="pointer-events-auto max-w-full mx-auto flex flex-col gap-6 p-8 pb-24">
                    <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">

                        {/* LEFT: Reputation Score */}
                        <div className="xl:col-span-5 rounded-[32px] pl-8 pt-8 flex flex-col justify-between shadow-sm">
                            {/* Title row */}
                            <div className="flex items-start justify-between mb-8">
                                <h2 className="text-6xl font-normal text-white leading-tight -mt-8 font-syne">Credebility<br />Score</h2>
                                <div className="flex gap-1 bg-[#172b1c] rounded-full p-1 border border-gray-800">
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
                                </div>
                            </div>

                            {/* Middle: Score and Gauge */}
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                                <div>
                                    <p className="text-sm font-medium text-[#00e676] mb-2">↗ 5 pts</p>
                                    <h1 className="text-[80px] font-bold text-white tracking-tighter leading-none">{score}</h1>
                                    <p className="text-gray-400 text-sm font-medium">Excellent</p>
                                </div>
                                <div className="flex justify-center md:justify-end flex-1 origin-right scale-110 mr-4">
                                    <ReputationGauge score={score} animated={animated} />
                                </div>
                            </div>

                            {/* Bottom: Two stat cards */}
                            <div className="grid grid-cols-2 gap-2">
                                <div className="bg-[#111f14] rounded-[40px] p-6 flex flex-col justify-between min-h-[140px]">
                                    <div className="flex justify-between items-start">
                                        <p className="text-gray-400 font-medium text-sm">Rising Talent</p>
                                        {/* <div className="w-10 h-10 rounded-full border border-gray-700 flex items-center justify-center text-gray-400">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                                    </div> */}
                                    </div>
                                    <p className="text-white font-bold text-5xl">Tier 2</p>
                                </div>
                                <div className="bg-[#111f14] rounded-[40px] p-6 flex flex-col justify-between min-h-[140px]">
                                    <div className="flex justify-between items-start">
                                        <p className="text-gray-400 font-medium text-sm">Total Growth</p>
                                        {/* <div className="w-8 h-8 rounded-full border border-gray-700 flex items-center justify-center text-gray-400">
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M7 17L17 7M17 7H7M17 7V17" /></svg>
                                    </div> */}
                                    </div>
                                    <p className="text-white font-bold text-5xl">$12<span className="text-xl text-gray-400 font-medium">.4k</span></p>
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: Metrics grid */}
                        <div className="xl:col-span-7 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                            {metrics.map((m, i) => (
                                <div key={i} className="bg-[#111f14] rounded-[40px] p-6 flex flex-col justify-between hover:border-gray-600 transition-colors shadow-sm min-h-[180px]">
                                    <div className="flex items-start justify-between mb-2">
                                        <div className={`w-16 h-16 rounded-full ${m.iconBg} flex items-center justify-center text-xl`}>
                                            <img src={m.icon} alt={m.label} className="w-10 h-10" />
                                        </div>
                                        <button className="text-gray-500 hover:text-white px-1 pb-2 h-12 w-12 mt-2 flex items-center justify-center rounded-full border border-gray-700 cursor-pointer transition-colors pt-2 rotate-90">
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1" /><circle cx="19" cy="12" r="1" /><circle cx="5" cy="12" r="1" /></svg>
                                        </button>
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
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* --- BOTTOM SECTION (curved, overlaps, parallax) --- */}
            <div className="relative min-h-screen pt-[750px]">
                <div
                    className="relative z-20 -mt-12 rounded-t-[100px] bg-[#0d1a10] p-8 shadow-[0_-30px_80px_rgba(0,0,0,0.8)]"
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
                            onClick={() => navigate("/contract")}
                            className="cursor-pointer text-sm font-semibold text-[#0d140d] border border-[#3cb44f]/30 hover:border-[#3cb44f] bg-[#3cb44f] px-4 py-2 rounded-xl transition-all duration-200 flex items-center gap-1.5"
                        >
                            <span className="text-2xl -mt-1 leading-none group-hover:scale-110 transition-transform duration-300">+</span>
                            Create Contract
                        </button>
                    </div>

                    <div
                        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-1.5"
                        style={{ transform: `translateY(${scrollY * -0.08}px)` }}
                    >
                        {contracts.map((contract) => (
                            <div
                                key={contract.id}
                                className="bg-[#172b1c] rounded-[30px] p-5 transition-all duration-200 cursor-pointer group"
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
                                                navigate(`/contracts/${contract.id}`);
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
                            </div>
                        ))}
                    </div>
                </div>
            </div>
            {/* Floating Action Button */}
            {/* <button
                onClick={() => navigate("/contract")}
                className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-10 py-3.5 rounded-[20px] bg-[#00e676] text-black font-bold text-lg shadow-[0_8px_30px_rgba(0,230,118,0.25)] hover:shadow-[0_12px_40px_rgba(0,230,118,0.4)] transition-all duration-300 hover:-translate-y-1 active:scale-95 flex items-center gap-2 group cursor-pointer"
            >
                <span className="text-2xl -mt-1 leading-none group-hover:scale-110 transition-transform duration-300">+</span>
                Create Project
            </button> */}
        </div>
    );
};

export default Dashboard;