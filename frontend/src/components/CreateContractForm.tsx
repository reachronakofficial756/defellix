import { useState, useEffect } from "react";
import { AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from "framer-motion";
import { apiClient } from '@/api/client';
import { useParams, useLocation } from 'react-router-dom';
import {
    clearPrdExtractedText,
    getPrdExtractedText,
    setPrdExtractedText,
} from '@/utils/prdSessionCache';
import { FREELANCER_JOB_TITLES } from '@/constants/jobTitles';
import { buildContractMarkdown, downloadContractPdf } from '@/utils/contractDocument';

const STEPS = [
    "Project Details",
    "Client & Company",
    "Scope & Deliverables",
    "Payment Terms",
    "Review & Sign",
];

const PROJECT_TYPES = [
    "Web Development", "Mobile App (iOS/Android)", "UI/UX Design", "Branding & Identity",
    "Logo Design", "Graphic Design", "Motion Graphics", "Video Editing", "Video Production",
    "Animation (2D/3D)", "Podcast Editing", "Voice Over", "Copywriting", "Content Writing",
    "Blog Writing", "SEO & Marketing", "Social Media Management", "Email Marketing",
    "Ad Campaigns (Google/Meta)", "Data Entry", "Data Analysis", "Excel & Spreadsheets",
    "Virtual Assistant", "Customer Support", "Translation & Localization",
    "WordPress Development", "Shopify Development", "E-Commerce", "Game Development",
    "AR/VR Development", "Blockchain & Web3", "Smart Contracts", "AI & Machine Learning",
    "Cybersecurity", "DevOps & Cloud", "Database Management", "API Development",
    "Chrome Extension", "Automation & Scripting", "Consulting", "Research", "Other"
];

function dedupeStringsPreserveOrder(items: readonly string[]): string[] {
    const seen = new Set<string>();
    const out: string[] = [];
    for (const s of items) {
        const k = s.toLowerCase().trim();
        if (!k || seen.has(k)) continue;
        seen.add(k);
        out.push(s);
    }
    return out;
}

/** Preset categories + signup job titles — same idea as SignUp "What do you do" */
const ALL_PROJECT_TYPE_SUGGESTIONS = dedupeStringsPreserveOrder([
    ...PROJECT_TYPES.filter((t) => t !== "Other"),
    ...FREELANCER_JOB_TITLES,
]);

const CustomDropdown = ({
    options,
    value,
    onChange,
    className,
    searchable = false,
    searchPlaceholder = "Search..."
}: {
    options: string[],
    value?: string,
    onChange?: (val: string) => void,
    className?: string,
    searchable?: boolean,
    searchPlaceholder?: string
}) => {
    const [open, setOpen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");

    const filteredOptions = options.filter(opt =>
        opt.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="relative w-full text-white">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                onBlur={(e) => {
                    if (!e.currentTarget.parentElement?.contains(e.relatedTarget as Node)) {
                        setOpen(false);
                        setSearchQuery("");
                    }
                }}
                className={`${className} flex items-center justify-between text-left ${open ? 'border-[#3cb44f] ring-1 ring-[#3cb44f]' : ''}`}
            >
                <span className="truncate">{value || options[0]}</span>
                <svg className={`shrink-0 w-4 h-4 ml-2 transition-transform duration-200 ${open ? 'rotate-180 text-[#3cb44f]' : 'text-[#4a4a4a]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
            </button>
            {open && (
                <div className="absolute z-50 w-full mt-2 bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl shadow-2xl overflow-hidden py-2 animate-in fade-in zoom-in-95 duration-200">
                    {searchable && (
                        <div className="px-3 pb-2 pt-1 border-b border-[#1e1e1e] mb-2" onClick={(e) => e.stopPropagation()}>
                            <div className="relative">
                                <input
                                    type="text"
                                    autoFocus
                                    placeholder={searchPlaceholder}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onKeyDown={(e) => e.stopPropagation()}
                                    onClick={(e) => e.stopPropagation()}
                                    className="w-full bg-[#0d1117] border border-[#1e1e1e] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#3cb44f] transition-all"
                                />
                                {searchQuery && (
                                    <button
                                        onClick={() => setSearchQuery("")}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-[#4a4a4a] hover:text-white"
                                    >
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    )}
                    <div className="max-h-60 overflow-y-auto scrBar">
                        {filteredOptions.length > 0 ? (
                            filteredOptions.map((opt) => (
                                <div
                                    key={opt}
                                    onMouseDown={(e) => {
                                        e.preventDefault();
                                        onChange?.(opt);
                                        setOpen(false);
                                        setSearchQuery("");
                                    }}
                                    className={`px-5 py-3 cursor-pointer text-sm transition-colors ${value === opt ? 'bg-[#3cb44f] text-black font-semibold' : 'text-white hover:bg-[#3cb44f20]'}`}
                                >
                                    {opt}
                                </div>
                            ))
                        ) : (
                            <div className="px-5 py-8 text-center text-sm text-[#4a4a4a]">
                                <svg className="w-8 h-8 mx-auto mb-2 opacity-20" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
                                No results found
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

const MarkdownRenderer = ({ content }: { content: string }) => {
    const lines = content.split('\n');
    let inList = false;
    const elements: React.ReactNode[] = [];

    const parseBold = (text: string) => {
        const parts = text.split(/\*\*(.*?)\*\*/g);
        return parts.map((part, i) => i % 2 === 1 ? <strong key={i} className="font-bold">{part}</strong> : part);
    };

    lines.forEach((line, index) => {
        const trimmed = line.trim();

        if (trimmed.startsWith('- ')) {
            if (!inList) {
                inList = true;
            }
            elements.push(<li key={index} className="ml-6 list-disc mb-2">{parseBold(trimmed.substring(2))}</li>);
            return;
        }

        if (inList && !trimmed.startsWith('- ')) {
            inList = false;
        }

        if (trimmed.startsWith('# ')) {
            elements.push(<h1 key={index} className="text-3xl font-black mb-6 mt-8 uppercase tracking-tight border-b-2 border-black pb-2">{parseBold(trimmed.substring(2))}</h1>);
        } else if (trimmed.startsWith('## ')) {
            elements.push(<h2 key={index} className="text-xl font-bold mb-4 mt-6 border-l-4 border-black pl-3">{parseBold(trimmed.substring(2))}</h2>);
        } else if (trimmed.startsWith('### ')) {
            elements.push(<h3 key={index} className="text-lg font-bold mb-3 mt-5">{parseBold(trimmed.substring(4))}</h3>);
        } else if (trimmed === "" || trimmed === "---") {
            elements.push(<div key={index} className="h-4"></div>);
        } else if (trimmed.startsWith('|')) {
            // Basic table row detection - just render as text for now or simple custom grid
            elements.push(<div key={index} className="py-2 px-4 bg-gray-50 border border-gray-200 rounded my-1 text-xs font-mono">{line}</div>);
        } else {
            elements.push(<p key={index} className="mb-4 leading-relaxed text-gray-800">{parseBold(line)}</p>);
        }
    });

    return <div className="space-y-1">{elements}</div>;
};

type AISuggestedMilestone = {
    title: string;
    description?: string;
    amount: number;
    due_date?: string;
    submission_criteria?: string;
    completion_criteria_tc?: string;
};

const CreateContractForm = ({ onClose }: { onClose: () => void }) => {
    const { contractId: urlContractId } = useParams<{ contractId: string }>();
    const location = useLocation();
    const [step, setStep] = useState(1);

    const [projectTitle, setProjectTitle] = useState("");
    const [projectDesc, setProjectDesc] = useState("");
    /** Project category — free text or pick from suggestions (SignUp-style) */
    const [projectType, setProjectType] = useState("Web Development");
    const [showProjectTypeSuggestions, setShowProjectTypeSuggestions] = useState(false);
    const [projectTypeSuggestions, setProjectTypeSuggestions] = useState<string[]>([]);
    const [startDate, setStartDate] = useState("");
    const [deadline, setDeadline] = useState("");
    const [duration, setDuration] = useState("");
    const [customTerms, setCustomTerms] = useState("");
    const [clientName, setClientName] = useState("");
    const [clientEmail, setClientEmail] = useState("");
    const [clientPhone, setClientPhone] = useState("");
    const [clientCountry, setClientCountry] = useState("United States");
    const [clientCompany, setClientCompany] = useState("");
    const [outOfScope, setOutOfScope] = useState("");
    const [coreDeliverable, setCoreDeliverable] = useState("");
    const [revisionPolicy, setRevisionPolicy] = useState("2 Rounds");
    const [intellectualProperty, setIntellectualProperty] = useState("Client owns all upon payment");
    const [contractCurrency, setContractCurrency] = useState("INR");
    /** Total contract value — sum of all milestone amounts must match this */
    const [totalContractAmount, setTotalContractAmount] = useState("");
    const [isGenerating, setIsGenerating] = useState(false);
    const [contractText, setContractText] = useState("");

    useEffect(() => {
        if (startDate && deadline) {
            const start = new Date(startDate);
            const end = new Date(deadline);
            const diffTime = end.getTime() - start.getTime();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            if (diffDays > 0) {
                if (diffDays > 28) {
                    const months = Math.floor(diffDays / 30);
                    const remainingDaysAfterMonths = diffDays % 30;
                    const weeks = Math.floor(remainingDaysAfterMonths / 7);
                    const days = remainingDaysAfterMonths % 7;

                    let parts = [];
                    if (months > 0) parts.push(`${months} month${months > 1 ? 's' : ''}`);
                    if (weeks > 0) parts.push(`${weeks} week${weeks > 1 ? 's' : ''}`);
                    if (days > 0 && months === 0) parts.push(`${days} day${days > 1 ? 's' : ''}`);

                    setDuration(parts.join(", "));
                } else if (diffDays >= 7) {
                    const weeks = Math.floor(diffDays / 7);
                    const remainingDays = diffDays % 7;
                    if (remainingDays === 0) {
                        setDuration(`${weeks} week${weeks > 1 ? 's' : ''}`);
                    } else {
                        setDuration(`${weeks} week${weeks > 1 ? 's' : ''}, ${remainingDays} day${remainingDays > 1 ? 's' : ''}`);
                    }
                } else {
                    setDuration(`${diffDays} day${diffDays > 1 ? 's' : ''}`);
                }
            } else if (diffDays === 0) {
                setDuration("Same day");
            } else {
                setDuration("Invalid range");
            }
        } else {
            setDuration("");
        }
    }, [startDate, deadline]);



    const createEmptyMilestone = () => ({
        id: undefined as number | undefined,
        title: "",
        description: "",
        amount: 0,
        due_date: "",
        is_initial_payment: false,
        submission_criteria: "",
        completion_criteria_tc: "",
    });

    // Start with no milestones; user must add at least one explicitly
    const [milestones, setMilestones] = useState<ReturnType<typeof createEmptyMilestone>[]>([]);
    const [paymentMethod, setPaymentMethod] = useState<string>("Bank Transfer");
    const [otherPaymentMethod, setOtherPaymentMethod] = useState("");

    // Backend integration state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contractId, setContractId] = useState<number | null>(urlContractId ? Number(urlContractId) : null);
    const [clientReviewComment, setClientReviewComment] = useState("");
    const [isFetchingContract, setIsFetchingContract] = useState(!!urlContractId);

    // PRD upload and extraction state
    const [prdFile, setPrdFile] = useState<File | null>(null);
    const [isUploadingPrd, setIsUploadingPrd] = useState(false);

    const [showPrdWelcomeModal, setShowPrdWelcomeModal] = useState(() => !urlContractId);

    const dismissPrdWelcomeModal = (scrollToUpload?: boolean) => {
        setShowPrdWelcomeModal(false);
        if (scrollToUpload) {
            window.setTimeout(() => {
                document.getElementById("prd-upload-section")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                });
            }, 200);
        }
    };

    // Show PRD welcome every time user lands on new contract (not edit-by-id)
    useEffect(() => {
        if (urlContractId) {
            setShowPrdWelcomeModal(false);
            return;
        }
        const isNewContractPath =
            location.pathname === "/contract" || location.pathname === "/dashboard/contract";
        if (isNewContractPath) {
            setShowPrdWelcomeModal(true);
        }
    }, [location.pathname, urlContractId]);

    // Filter project type suggestions (SignUp "What do you do" pattern)
    useEffect(() => {
        if (!projectType.trim()) {
            setProjectTypeSuggestions([]);
            return;
        }
        setProjectTypeSuggestions(
            ALL_PROJECT_TYPE_SUGGESTIONS.filter((opt) =>
                opt.toLowerCase().includes(projectType.toLowerCase())
            )
        );
    }, [projectType]);

    /** AI milestone suggestion modal (opens from Payment Terms when milestones need setup) */
    const [milestoneAiOpen, setMilestoneAiOpen] = useState(false);
    const [milestoneAiPhase, setMilestoneAiPhase] = useState<"missing" | "loading" | "results" | "error">("missing");
    const [milestoneAiMissing, setMilestoneAiMissing] = useState<string[]>([]);
    const [milestoneAiError, setMilestoneAiError] = useState<string | null>(null);
    const [suggestedMilestones, setSuggestedMilestones] = useState<AISuggestedMilestone[]>([]);
    const [suggestedSelected, setSuggestedSelected] = useState<Record<number, boolean>>({});
    const [replaceMilestonesWithAI, setReplaceMilestonesWithAI] = useState(true);

    /** Step 3: AI scope (core deliverable + out of scope) — no requirement for those fields yet */
    const [scopeAiLoading, setScopeAiLoading] = useState(false);
    /** Step 4: AI terms & conditions */
    const [termsAiLoading, setTermsAiLoading] = useState(false);

    const getMissingForScopeAI = (): string[] => {
        const missing: string[] = [];
        if (!projectTitle.trim()) missing.push("Project title");
        if (!projectDesc.trim() || projectDesc.trim().length < 10) {
            missing.push("Project description (at least 10 characters)");
        }
        if (!projectType.trim()) {
            missing.push("Project type");
        }
        const total = parseFloat(totalContractAmount) || 0;
        if (total <= 0) missing.push("Total contract amount (Project Details)");
        if (!startDate) missing.push("Start date");
        if (!deadline) missing.push("Deadline");
        return missing;
    };

    const runScopeAISuggest = async () => {
        const missing = getMissingForScopeAI();
        if (missing.length > 0) {
            alert(`Complete these before generating scope with AI:\n\n• ${missing.join("\n• ")}`);
            return;
        }
        const displayProjectType = projectType.trim();
        const cachedPrd = getPrdExtractedText().trim();
        const payload = {
            project_name: projectTitle,
            project_category: displayProjectType,
            description: projectDesc,
            total_amount: parseFloat(totalContractAmount) || 0,
            currency: contractCurrency || "INR",
            start_date: startDate,
            deadline: deadline,
            estimated_duration: duration,
            revision_policy: revisionPolicy,
            intellectual_property: intellectualProperty,
            client_name: clientName,
            client_company: clientCompany,
            prd_uploaded: !!prdFile || !!cachedPrd,
            ...(cachedPrd ? { prd_extracted_text: cachedPrd } : {}),
        };
        setScopeAiLoading(true);
        try {
            const paths = ["/contracts/suggest/scope", "/contracts/suggest-scope"];
            let data: any;
            for (let i = 0; i < paths.length; i++) {
                try {
                    const res = await apiClient.post(paths[i], payload);
                    data = (res as any).data?.data ?? (res as any).data;
                    break;
                } catch (err: any) {
                    const st = err?.response?.status;
                    if (st === 404 && i < paths.length - 1) continue;
                    throw err;
                }
            }
            if (data?.core_deliverable) setCoreDeliverable(String(data.core_deliverable));
            if (data?.out_of_scope_work) setOutOfScope(String(data.out_of_scope_work));
        } catch (e: any) {
            const hint =
                e?.response?.status === 404
                    ? " API returned 404 — redeploy contract-service so POST /contracts/suggest/scope is registered."
                    : "";
            alert(
                (e?.response?.data?.message || e?.message || "Failed to generate scope with AI") + hint
            );
        } finally {
            setScopeAiLoading(false);
        }
    };

    const getMissingForTermsAI = (): string[] => {
        const missing = getMissingForMilestoneAI();
        if (milestones.length === 0) missing.push("At least one milestone");
        if (!clientName.trim()) missing.push("Client name (step 2)");
        if (!clientEmail.trim()) missing.push("Client email (step 2)");
        return missing;
    };

    const runTermsAISuggest = async () => {
        const missing = getMissingForTermsAI();
        if (missing.length > 0) {
            alert(`Complete these before generating terms with AI:\n\n• ${missing.join("\n• ")}`);
            return;
        }
        const displayProjectType = projectType.trim();
        const cachedPrd = getPrdExtractedText().trim();
        const pm =
            paymentMethod === "Other" ? otherPaymentMethod || "Other" : paymentMethod;
        const payload = {
            project_name: projectTitle,
            project_category: displayProjectType,
            description: projectDesc,
            total_amount: parseFloat(totalContractAmount) || 0,
            currency: contractCurrency || "INR",
            start_date: startDate,
            deadline: deadline,
            estimated_duration: duration,
            core_deliverable: coreDeliverable,
            out_of_scope_work: outOfScope,
            revision_policy: revisionPolicy,
            intellectual_property: intellectualProperty,
            client_name: clientName,
            client_company: clientCompany,
            client_email: clientEmail,
            client_phone: clientPhone,
            client_country: clientCountry,
            freelancer_name:
                (typeof window !== "undefined" &&
                    window.localStorage.getItem("profile_name")) ||
                "",
            payment_method: pm,
            milestones: milestones.map((m) => ({
                title: m.title || "Milestone",
                amount: m.amount || 0,
                due_date: m.due_date || "",
                description: m.description || "",
                submission_criteria: m.submission_criteria || "",
                completion_criteria_tc: m.completion_criteria_tc || "",
            })),
            prd_uploaded: !!prdFile || !!cachedPrd,
            ...(cachedPrd ? { prd_extracted_text: cachedPrd } : {}),
            ...(customTerms.trim() ? { existing_terms: customTerms.trim() } : {}),
        };
        setTermsAiLoading(true);
        try {
            const paths = ["/contracts/suggest/terms", "/contracts/suggest-terms"];
            let data: any;
            for (let i = 0; i < paths.length; i++) {
                try {
                    const res = await apiClient.post(paths[i], payload);
                    data = (res as any).data?.data ?? (res as any).data;
                    break;
                } catch (err: any) {
                    const st = err?.response?.status;
                    if (st === 404 && i < paths.length - 1) continue;
                    throw err;
                }
            }
            if (data?.terms_and_conditions) {
                setCustomTerms(String(data.terms_and_conditions));
            }
        } catch (e: any) {
            const hint =
                e?.response?.status === 404
                    ? " API returned 404 — redeploy contract-service so POST /contracts/suggest/terms is registered."
                    : "";
            alert(
                (e?.response?.data?.message ||
                    e?.message ||
                    "Failed to generate terms with AI") + hint
            );
        } finally {
            setTermsAiLoading(false);
        }
    };

    const getMissingForMilestoneAI = (): string[] => {
        const missing: string[] = [];
        if (!projectTitle.trim()) missing.push("Project title");
        if (!projectDesc.trim() || projectDesc.trim().length < 10) {
            missing.push("Project description (at least 10 characters)");
        }
        if (!projectType.trim()) {
            missing.push("Project type");
        }
        const total = parseFloat(totalContractAmount) || 0;
        if (total <= 0) missing.push("Total contract amount (Project Details)");
        if (!startDate) missing.push("Start date");
        if (!deadline) missing.push("Deadline");
        if (!coreDeliverable.trim() || coreDeliverable.trim().length < 2) {
            missing.push("Core deliverable");
        }
        if (!outOfScope.trim() || outOfScope.trim().length < 2) {
            missing.push("Out of scope");
        }
        return missing;
    };

    const runMilestoneAISuggest = async () => {
        const displayProjectType = projectType.trim();
        const cachedPrd = getPrdExtractedText().trim();
        try {
            const res = await apiClient.post("/contracts/suggest-milestones", {
                project_name: projectTitle,
                project_category: displayProjectType,
                description: projectDesc,
                total_amount: parseFloat(totalContractAmount) || 0,
                currency: contractCurrency || "INR",
                start_date: startDate,
                deadline: deadline,
                estimated_duration: duration,
                core_deliverable: coreDeliverable,
                out_of_scope_work: outOfScope,
                revision_policy: revisionPolicy,
                intellectual_property: intellectualProperty,
                terms_and_conditions: customTerms,
                prd_uploaded: !!prdFile || !!cachedPrd,
                ...(cachedPrd ? { prd_extracted_text: cachedPrd } : {}),
                payment_method:
                    paymentMethod === "Other" ? otherPaymentMethod || "Other" : paymentMethod,
            });
            const data = (res as any).data?.data ?? (res as any).data;
            const list: AISuggestedMilestone[] = data?.milestones || [];
            setSuggestedMilestones(list);
            const sel: Record<number, boolean> = {};
            list.forEach((_, i) => {
                sel[i] = true;
            });
            setSuggestedSelected(sel);
            setMilestoneAiPhase("results");
        } catch (e: any) {
            setMilestoneAiError(
                e?.response?.data?.message || e?.message || "Failed to generate suggestions"
            );
            setMilestoneAiPhase("error");
        }
    };

    const openMilestoneAiModal = () => {
        setMilestoneAiOpen(true);
        setMilestoneAiError(null);
        const missing = getMissingForMilestoneAI();
        if (missing.length > 0) {
            setMilestoneAiPhase("missing");
            setMilestoneAiMissing(missing);
            return;
        }
        setMilestoneAiPhase("loading");
        void runMilestoneAISuggest();
    };

    const advanceToReviewIfValid = () => {
        const target = parseFloat(totalContractAmount) || 0;
        const sum = milestones.reduce((s, m) => s + (m.amount || 0), 0);
        if (milestones.length === 0) {
            alert("Add at least one milestone.");
            return false;
        }
        if (Math.abs(sum - target) > 0.02) {
            alert(
                `Milestone amounts must sum to ${contractCurrency} ${target.toLocaleString()}. Current sum: ${contractCurrency} ${sum.toLocaleString()}.`
            );
            return false;
        }
        setMilestoneAiOpen(false);
        setStep(5);
        return true;
    };

    const applySelectedSuggestedMilestones = (andContinue: boolean) => {
        const picked = suggestedMilestones.filter((_, i) => suggestedSelected[i]);
        if (picked.length === 0) {
            alert("Select at least one suggested milestone.");
            return;
        }
        const mapped = picked.map((s) => ({
            id: undefined as number | undefined,
            title: s.title,
            description: s.description || "",
            amount: s.amount,
            due_date: s.due_date ? String(s.due_date).split("T")[0] : "",
            is_initial_payment: false,
            submission_criteria: s.submission_criteria || "Link",
            completion_criteria_tc: s.completion_criteria_tc || "",
        }));
        const target = parseFloat(totalContractAmount) || 0;
        const sumMapped = mapped.reduce((s, m) => s + m.amount, 0);
        if (Math.abs(sumMapped - target) > 0.02) {
            alert(
                "Selected milestones do not add up to your total contract amount. Select all suggestions or adjust the total."
            );
            return;
        }
        if (replaceMilestonesWithAI || milestones.length === 0) {
            setMilestones(mapped);
        } else {
            setMilestones([...milestones, ...mapped]);
        }
        setMilestoneAiOpen(false);
        if (andContinue) {
            setStep(5);
        }
    };

    const toggleSelectAllSuggested = (on: boolean) => {
        const next: Record<number, boolean> = {};
        suggestedMilestones.forEach((_, i) => {
            next[i] = on;
        });
        setSuggestedSelected(next);
    };

    // Fetch draft/pending contract if edit mode
    useEffect(() => {
        if (!urlContractId) return;
        (async () => {
            try {
                const res = await apiClient.get(`/contracts/${urlContractId}`);
                const data = (res as any).data?.data ?? (res as any).data;
                if (!data) return;

                if (data.project_name) setProjectTitle(data.project_name);
                if (data.description) setProjectDesc(data.description);
                if (data.terms_and_conditions) setCustomTerms(data.terms_and_conditions);
                if (data.start_date) setStartDate(data.start_date.split('T')[0]);
                if (data.due_date) setDeadline(data.due_date.split('T')[0]);

                if (data.project_category) {
                    setProjectType(String(data.project_category));
                }

                if (data.client_name) setClientName(data.client_name);
                if (data.client_email) setClientEmail(data.client_email);
                if (data.client_phone) setClientPhone(data.client_phone);
                if (data.client_company_name) setClientCompany(data.client_company_name);
                if (data.client_country) setClientCountry(data.client_country);

                if (data.out_of_scope_work) setOutOfScope(data.out_of_scope_work);
                if (data.submission_criteria) setCoreDeliverable(data.submission_criteria);
                if (data.revision_policy) setRevisionPolicy(data.revision_policy);
                if (data.intellectual_property) setIntellectualProperty(data.intellectual_property);

                if (data.currency) setContractCurrency(data.currency);

                if (data.payment_method) {
                    if (["Bank Transfer", "Crypto", "Credit Card"].includes(data.payment_method)) {
                        setPaymentMethod(data.payment_method);
                    } else {
                        setPaymentMethod("Other");
                        setOtherPaymentMethod(data.payment_method);
                    }
                }

                // Set client review comment if pending/rejected
                if (data.client_review_comment) setClientReviewComment(data.client_review_comment);

                if (typeof data.total_amount === "number") {
                    setTotalContractAmount(String(data.total_amount));
                }

                if (data.milestones && data.milestones.length > 0) {
                    const msList = data.milestones.map((m: any) => ({
                        id: m.id,
                        title: m.title,
                        description: m.description,
                        amount: m.amount,
                        due_date: m.due_date ? m.due_date.split("T")[0] : "",
                        is_initial_payment: m.order_index === 0,
                        submission_criteria:
                            typeof m.submission_criteria === "string"
                                ? m.submission_criteria
                                : "Link",
                        completion_criteria_tc: m.completion_criteria_tc,
                    }));
                    setMilestones(msList);
                }

            } catch (err: any) {
                console.error("Failed to load contract", err);
            } finally {
                setIsFetchingContract(false);
            }
        })();
    }, [urlContractId]);

    useEffect(() => {
        if (step !== 5) {
            setContractText(""); // Clear contract text if user goes back to edit
        }
    }, [step]);

    useEffect(() => {
        if (step === 5 && !contractText) {
            setIsGenerating(true);
            const timer = setTimeout(() => {
                const totalAmount =
                    parseFloat(totalContractAmount) ||
                    milestones.reduce((sum, ms) => sum + (ms.amount || 0), 0);
                const text = buildContractMarkdown({
                    projectTitle,
                    projectCategory: projectType.trim(),
                    projectDesc,
                    coreDeliverable,
                    outOfScope,
                    startDate,
                    deadline,
                    duration,
                    contractCurrency,
                    totalAmount,
                    milestones: milestones.map((ms) => ({
                        title: ms.title,
                        description: ms.description,
                        amount: ms.amount || 0,
                        due_date: ms.due_date,
                        is_initial_payment: ms.is_initial_payment,
                        submission_criteria: ms.submission_criteria,
                    })),
                    paymentMethod:
                        paymentMethod === "Other"
                            ? otherPaymentMethod || "Other"
                            : paymentMethod,
                    revisionPolicy,
                    intellectualProperty,
                    customTerms,
                    clientName,
                    clientCompany,
                    clientEmail,
                    clientPhone,
                    clientCountry,
                    freelancerName:
                        typeof window !== "undefined"
                            ? window.localStorage.getItem("profile_name") || undefined
                            : undefined,
                    contractId,
                });
                setContractText(text);
                setIsGenerating(false);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [
        step,
        projectTitle,
        clientName,
        clientCompany,
        projectType,
        projectDesc,
        coreDeliverable,
        outOfScope,
        startDate,
        deadline,
        duration,
        milestones,
        contractCurrency,
        totalContractAmount,
        paymentMethod,
        otherPaymentMethod,
        revisionPolicy,
        intellectualProperty,
        customTerms,
        contractText,
        clientCountry,
        contractId,
    ]);

    const [isSent, setIsSent] = useState(false);
    const [generatedLink, setGeneratedLink] = useState("");

    const buildContractPayload = () => {
        const totalAmount = parseFloat(totalContractAmount) || 0;
        const milestonesTotal = milestones.reduce((sum, ms) => sum + (ms.amount || 0), 0);
        if (milestones.length === 0) {
            throw new Error("Add at least one milestone.");
        }
        if (Math.abs(milestonesTotal - totalAmount) > 0.02) {
            throw new Error(
                `Milestone amounts (${milestonesTotal.toLocaleString()}) must equal total contract amount (${totalAmount.toLocaleString()} ${contractCurrency}).`
            );
        }
        const displayProjectType = projectType.trim();

        const toISO = (value: string) => (value ? new Date(value + "T00:00:00").toISOString() : undefined);

        const finalMilestones = milestones.map((ms) => ({
            id: ms.id,
            title: ms.title,
            description: ms.description,
            amount: ms.amount || 0,
            due_date: ms.due_date ? new Date(ms.due_date + "T00:00:00").toISOString() : undefined,
            submission_criteria: ms.submission_criteria || "Video URL",
            completion_criteria_tc: ms.completion_criteria_tc || "",
        }));

        return {
            freelancer_name: (typeof window !== 'undefined' && window.localStorage.getItem('profile_name')) || '',
            project_category: displayProjectType,
            project_name: projectTitle,
            description: projectDesc,
            due_date: toISO(deadline),
            total_amount: totalAmount,
            currency: contractCurrency || "INR",
            prd_file_url: "", // PRD upload UI is wiring handled in handlePrdUpload
            submission_criteria: coreDeliverable || "",
            client_name: clientName,
            client_company_name: clientCompany,
            client_email: clientEmail,
            client_phone: clientPhone,
            client_country: clientCountry,
            terms_and_conditions: customTerms,
            start_date: toISO(startDate),
            revision_policy: revisionPolicy,
            out_of_scope_work: outOfScope,
            intellectual_property: intellectualProperty,
            estimated_duration: duration,
            payment_method: paymentMethod === "Other" ? otherPaymentMethod || "Other" : paymentMethod,
            advance_payment_required: false,
            advance_payment_amount: 0,
            milestones: finalMilestones,
        };
    };

    const createOrReuseDraft = async (): Promise<number> => {
        const payload = buildContractPayload();
        if (contractId) {
            await apiClient.put(`/contracts/${contractId}`, payload);
            return contractId;
        }
        const res = await apiClient.post("/contracts", payload);
        const data = (res as any).data?.data ?? (res as any).data;
        const id = data?.id;
        if (!id) throw new Error("Contract created but response had no id");
        setContractId(id);
        return id;
    };

    const handleSaveDraft = async () => {
        try {
            setIsSubmitting(true);
            await createOrReuseDraft();
            alert("Contract saved as draft!");
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to save draft. Please try again.";
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    /** Download as real A4 text PDF (not image-based snapshot) */
    const handleDownloadContractPdf = () => {
        if (!contractText.trim() || isGenerating) {
            alert("Wait for the agreement preview to finish loading.");
            return;
        }
        try {
            const totalAmount =
                parseFloat(totalContractAmount) ||
                milestones.reduce((sum, ms) => sum + (ms.amount || 0), 0);
            downloadContractPdf(
                {
                    projectTitle,
                    projectCategory: projectType.trim(),
                    projectDesc,
                    coreDeliverable,
                    outOfScope,
                    startDate,
                    deadline,
                    duration,
                    contractCurrency,
                    totalAmount,
                    milestones: milestones.map((ms) => ({
                        title: ms.title,
                        description: ms.description,
                        amount: ms.amount || 0,
                        due_date: ms.due_date,
                        is_initial_payment: ms.is_initial_payment,
                        submission_criteria: ms.submission_criteria,
                    })),
                    paymentMethod:
                        paymentMethod === "Other"
                            ? otherPaymentMethod || "Other"
                            : paymentMethod,
                    revisionPolicy,
                    intellectualProperty,
                    customTerms,
                    clientName,
                    clientCompany,
                    clientEmail,
                    clientPhone,
                    clientCountry,
                    freelancerName:
                        typeof window !== "undefined"
                            ? window.localStorage.getItem("profile_name") || undefined
                            : undefined,
                    contractId,
                },
                projectTitle
            );
        } catch (e: any) {
            alert(e?.message || "Could not generate PDF.");
        }
    };

    const handleSend = async () => {
        try {
            setIsSubmitting(true);
            const id = await createOrReuseDraft();
            const res = await apiClient.post(`/contracts/${id}/send`, {});
            const data = (res as any).data?.data ?? (res as any).data;
            const link =
                data?.shareable_link ||
                (typeof window !== "undefined"
                    ? `${window.location.origin}/review-contract/${id}`
                    : "");
            setGeneratedLink(link);
            setIsSent(true);
            clearPrdExtractedText();
        } catch (err: any) {
            const msg =
                err?.response?.data?.message ||
                err?.message ||
                "Failed to send contract. Please try again.";
            alert(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handlePrdUpload = async (file: File) => {
        try {
            setIsUploadingPrd(true);
            const formData = new FormData();
            formData.append("file", file);

            const res = await apiClient.post("/contracts/prd-upload", formData, {
                headers: { "Content-Type": "multipart/form-data" },
            });
            const data = (res as any).data?.data ?? (res as any).data;
            const url = data?.prd_file_url;
            if (!url) {
                throw new Error("PRD upload succeeded but no URL returned");
            }

            // The backend now returns the extracted contract synchronously, bypassing CDN fetch blocks
            if (data?.extracted_contract) {
                const extracted = data.extracted_contract;
                if (extracted.project_title) setProjectTitle(extracted.project_title);
                if (extracted.project_description) setProjectDesc(extracted.project_description);
                if (extracted.terms_and_conditions) setCustomTerms(extracted.terms_and_conditions);
                if (extracted.start_date) setStartDate(extracted.start_date);
                if (extracted.deadline) setDeadline(extracted.deadline);
                if (extracted.scope) setCoreDeliverable(extracted.scope);
                if (extracted.deliverables) setOutOfScope(extracted.deliverables);

                if (extracted.project_type) {
                    setProjectType(String(extracted.project_type));
                }

                if (extracted.client) {
                    if (extracted.client.name) setClientName(extracted.client.name);
                    if (extracted.client.email) setClientEmail(extracted.client.email);
                    if (extracted.client.phone) setClientPhone(extracted.client.phone);
                    if (extracted.client.company) setClientCompany(extracted.client.company);
                    if (extracted.client.country) setClientCountry(extracted.client.country);
                }

                alert("PRD data extracted and form auto-filled!");
            }
            if (typeof data?.prd_extracted_text === "string" && data.prd_extracted_text.trim()) {
                setPrdExtractedText(data.prd_extracted_text);
            }
        } catch (err: any) {
            alert(err?.response?.data?.message || err?.message || "Failed to upload PRD");
        } finally {
            setIsUploadingPrd(false);
        }
    };

    const nextStep = () => {
        if (step === 1) {
            if (!projectType.trim()) {
                alert("Please enter or choose a project type.");
                return;
            }
            const t = parseFloat(totalContractAmount) || 0;
            if (t <= 0) {
                alert("Enter the total contract amount (must be greater than zero). Milestone amounts must sum to this total.");
                return;
            }
        }
        if (step === 3) {
            if (!coreDeliverable.trim() || coreDeliverable.trim().length < 2) {
                alert("Please describe the core deliverable (what you will hand off).");
                return;
            }
            if (!outOfScope.trim() || outOfScope.trim().length < 2) {
                alert("Please list what is explicitly out of scope.");
                return;
            }
        }
        if (step === 4) {
            const target = parseFloat(totalContractAmount) || 0;
            const sum = milestones.reduce((s, m) => s + (m.amount || 0), 0);
            if (milestones.length > 0 && Math.abs(sum - target) <= 0.02) {
                setStep(5);
                return;
            }
            openMilestoneAiModal();
            return;
        }
        setStep((s) => Math.min(s + 1, 5));
    };
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const [isMilestoneModalOpen, setIsMilestoneModalOpen] = useState(false);
    const [editingMilestoneIndex, setEditingMilestoneIndex] = useState<number | null>(null);
    const [draftMilestone, setDraftMilestone] = useState(createEmptyMilestone());

    const openMilestoneModal = (index: number | null) => {
        if (index !== null) {
            setEditingMilestoneIndex(index);
            setDraftMilestone(milestones[index]);
        } else {
            setEditingMilestoneIndex(null);
            setDraftMilestone(createEmptyMilestone());
        }
        setIsMilestoneModalOpen(true);
    };

    const closeMilestoneModal = () => {
        setIsMilestoneModalOpen(false);
    };

    const saveMilestone = () => {
        if (editingMilestoneIndex === null) {
            setMilestones([...milestones, { ...draftMilestone }]);
        } else {
            const next = [...milestones];
            next[editingMilestoneIndex] = { ...draftMilestone };
            setMilestones(next);
        }
        setIsMilestoneModalOpen(false);
    };

    const deleteMilestone = (index: number) => {
        setMilestones(milestones.filter((_, i) => i !== index));
    };

    // Match SignUp page input styling (dark pill, no border, subtle text)
    const inputClass =
        "w-full bg-[#141414] rounded-2xl px-4 py-4 text-xs sm:text-sm text-white border-none placeholder:text-white/40 focus:outline-none focus:ring-0";
    const labelClass = "text-sm text-white font-medium mb-2 block";

    const renderStep = () => {
        if (isFetchingContract) {
            return (
                <div className="flex flex-col items-center justify-center py-20 animate-in fade-in">
                    <div className="w-10 h-10 rounded-full border-2 border-[#3cb44f]/30 border-t-[#3cb44f] animate-spin mb-4" />
                    <p className="text-[#3cb44f] text-sm uppercase tracking-widest font-bold">Loading Contract...</p>
                </div>
            );
        }

        const feedbackBanner = clientReviewComment ? (
            <div className="mb-8 p-4 rounded-xl bg-orange-500/10 border border-orange-500/20">
                <h4 className="flex items-center gap-2 text-orange-400 font-bold mb-2">
                    <AlertCircle size={16} /> Client Feedback
                </h4>
                <p className="text-orange-200 text-sm leading-relaxed">{clientReviewComment}</p>
                <p className="text-orange-400/60 mt-2 text-[10px] uppercase font-bold tracking-wider">Please adapt your contract terms and resend for signature.</p>
            </div>
        ) : null;

        switch (step) {
            case 1:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 justify-center items-center h-full overflow-y-hidden">
                        {feedbackBanner}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div>
                                <label className={labelClass}>Project Title</label>
                                <input
                                    type="text"
                                    placeholder="e.g. E-Commerce Redesign"
                                    className={inputClass}
                                    value={projectTitle}
                                    onChange={(e) => setProjectTitle(e.target.value)}
                                />
                            </div>
                            <div className="relative">
                                <label htmlFor="contract-project-type" className={labelClass}>
                                    Project Type
                                </label>
                                <div className="relative rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                    <input
                                        id="contract-project-type"
                                        type="text"
                                        placeholder="eg. Web Development, Backend Developer, Video Editor, etc."
                                        value={projectType}
                                        onChange={(e) => setProjectType(e.target.value)}
                                        onFocus={() => setShowProjectTypeSuggestions(true)}
                                        onBlur={() => {
                                            window.setTimeout(() => setShowProjectTypeSuggestions(false), 150);
                                        }}
                                        autoComplete="off"
                                        className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                    />
                                    {showProjectTypeSuggestions && (
                                        <motion.div
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -10 }}
                                            className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-[#141414]/95 backdrop-blur-xl p-2 shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                        >
                                            {projectTypeSuggestions.length > 0 ? (
                                                projectTypeSuggestions.map((opt) => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => {
                                                            setProjectType(opt);
                                                            setShowProjectTypeSuggestions(false);
                                                        }}
                                                        className="w-full cursor-pointer rounded-xl px-4 py-3 text-left text-xs sm:text-sm text-white/70 hover:bg-white/5 hover:text-[#3cb44f] transition-all"
                                                    >
                                                        {opt}
                                                    </button>
                                                ))
                                            ) : (
                                                ALL_PROJECT_TYPE_SUGGESTIONS.slice(0, 20).map((opt) => (
                                                    <button
                                                        key={opt}
                                                        type="button"
                                                        onMouseDown={(e) => e.preventDefault()}
                                                        onClick={() => {
                                                            setProjectType(opt);
                                                            setShowProjectTypeSuggestions(false);
                                                        }}
                                                        className="w-full cursor-pointer rounded-xl px-4 py-3 text-left text-xs sm:text-sm text-white/70 hover:bg-white/5 hover:text-[#3cb44f] transition-all"
                                                    >
                                                        {opt}
                                                    </button>
                                                ))
                                            )}
                                        </motion.div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="">
                            <div>
                                <label className={`flex justify-between ${labelClass} -mt-2`}>
                                    Project Description
                                    <span className="text-[#4a4a4a] text-xs font-normal">{projectDesc.length}/300</span>
                                </label>
                                <textarea
                                    value={projectDesc}
                                    onChange={(e) => setProjectDesc(e.target.value)}
                                    maxLength={300}
                                    placeholder="Describe the core objectives..."
                                    rows={4}
                                    className={`${inputClass} resize-none`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 -mt-4">
                            <div>
                                <label className={labelClass}>Start Date</label>
                                <input
                                    type="date"
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className={`${inputClass} [color-scheme:dark]`}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Deadline</label>
                                <input
                                    type="date"
                                    value={deadline}
                                    onChange={(e) => setDeadline(e.target.value)}
                                    className={`${inputClass} [color-scheme:dark]`}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Estimated Duration</label>
                                <input
                                    type="text"
                                    value={duration}
                                    readOnly
                                    placeholder="Select dates..."
                                    className={`${inputClass} bg-[#0a0a0a]/50 cursor-not-allowed`}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 -mt-2">
                            <div>
                                <label className={labelClass}>Contract currency</label>
                                <CustomDropdown
                                    options={["INR", "USD", "EUR", "GBP"]}
                                    value={contractCurrency}
                                    onChange={setContractCurrency}
                                    className={inputClass}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Total contract amount</label>
                                <div className="relative">
                                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[#4a4a4a] font-bold text-sm pointer-events-none">
                                        {contractCurrency === "INR" ? "₹" : contractCurrency}
                                    </span>
                                    <input
                                        type="number"
                                        min={0}
                                        step="0.01"
                                        placeholder="0.00"
                                        className={`${inputClass} pl-14`}
                                        value={totalContractAmount}
                                        onChange={(e) => setTotalContractAmount(e.target.value)}
                                    />
                                </div>
                                <p className="text-[#4a4a4a] text-xs mt-2">
                                    Sum of all milestone amounts must equal this total before you can send the contract.
                                </p>
                            </div>
                        </div>

                        <div className="mt-4 scroll-mt-24" id="prd-upload-section">
                            <label className={`${labelClass} flex flex-wrap items-center gap-2`}>
                                <span>Upload PRD (PDF, DOCX)</span>
                                <span className="text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-[#3cb44f]/20 text-[#3cb44f] border border-[#3cb44f]/30">
                                    Auto-fills project details
                                </span>
                            </label>
                            <input
                                type="file"
                                id="prd-file-input"
                                accept=".pdf,.docx,.doc"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        setPrdFile(file);
                                        void handlePrdUpload(file);
                                    }
                                }}
                            />
                            <div
                                onClick={() => document.getElementById("prd-file-input")?.click()}
                                className="w-full border border-dashed border-[#1e1e1e] rounded-xl bg-[#0a0a0a] flex flex-col items-center justify-center py-12 hover:border-[#3cb44f]/60 transition-colors cursor-pointer group"
                            >
                                {isUploadingPrd ? (
                                    <>
                                        <div className="w-10 h-10 rounded-full border-2 border-[#3cb44f]/30 border-t-[#3cb44f] animate-spin mb-3" />
                                        <p className="text-white font-medium text-base">
                                            Uploading & Extracting...
                                        </p>
                                    </>
                                ) : prdFile ? (
                                    <>
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#3cb44f] mb-3">
                                            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                                            <polyline points="22 4 12 14.01 9 11.01" />
                                        </svg>
                                        <p className="text-white font-medium text-base">{prdFile.name}</p>
                                        <p className="text-[#3cb44f] text-sm mt-1">Uploaded & extracted</p>
                                    </>
                                ) : (
                                    <>
                                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#4a4a4a] group-hover:text-[#3cb44f] mb-3 group-hover:-translate-y-1 transition-all">
                                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                            <polyline points="17 8 12 3 7 8" />
                                            <line x1="12" y1="3" x2="12" y2="15" />
                                        </svg>
                                        <p className="text-white font-medium text-base">Drag & drop PRD here</p>
                                        <p className="text-[#4a4a4a] text-sm mt-1">Accepts PDF and DOCX only</p>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {feedbackBanner}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-8">
                            <div>
                                <label className={labelClass}>Client Full Name</label>
                                <input
                                    type="text"
                                    placeholder="John Doe"
                                    className={inputClass}
                                    value={clientName}
                                    onChange={(e) => setClientName(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Client Email</label>
                                <input
                                    type="email"
                                    placeholder="client@example.com"
                                    className={inputClass}
                                    value={clientEmail}
                                    onChange={(e) => setClientEmail(e.target.value)}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Client Phone</label>
                                <input
                                    type="tel"
                                    placeholder="89000 89000"
                                    className={inputClass}
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Client Country</label>
                                <CustomDropdown
                                    options={["India", "United States", "United Kingdom", "Canada", "Australia"]}
                                    value={clientCountry}
                                    onChange={setClientCountry}
                                    className={inputClass}
                                />
                            </div>

                            <div>
                                <label className={labelClass}>Company Name</label>
                                <input
                                    type="text"
                                    placeholder="Acme Corp"
                                    className={inputClass}
                                    value={clientCompany}
                                    onChange={(e) => setClientCompany(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>
                );
            case 3:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {feedbackBanner}
                        <div className="rounded-2xl border border-[#3cb44f]/25 bg-[#3cb44f]/5 px-5 py-4">
                            <p className="text-xs font-black uppercase tracking-widest text-[#3cb44f] mb-1">
                                Next step
                            </p>
                            <p className="text-sm text-white/80">
                                You can use <span className="text-[#3cb44f] font-semibold">Generate with AI</span> below to draft{" "}
                                <span className="text-white font-medium">Out of scope</span> and{" "}
                                <span className="text-white font-medium">Core deliverable</span> from your project details, timeline,
                                contract total, and PRD (if you uploaded one). 
                            </p>
                        </div>

                        <div className="-mt-2">
                            <label className={labelClass}>Revision Policy</label>
                            <CustomDropdown
                                options={["No Revisions", "1 Round", "2 Rounds", "3 Rounds", "Unlimited"]}
                                value={revisionPolicy}
                                onChange={setRevisionPolicy}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-2">
                                <label className={`${labelClass} mb-0`}>Out of Scope</label>
                                <button
                                    type="button"
                                    disabled={scopeAiLoading}
                                    onClick={() => void runScopeAISuggest()}
                                    className="shrink-0 mt-4 rounded-xl border flex cursor-pointer items-center gap-2 border-[#3cb44f]/50 bg-[#3cb44f]/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#3cb44f] hover:bg-[#3cb44f]/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {scopeAiLoading ? "Generating…" : "Generate with AI"}
                                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0 0 30 30" fill="#3cb44f">
                                        <path d="M14.217,19.707l-1.112,2.547c-0.427,0.979-1.782,0.979-2.21,0l-1.112-2.547c-0.99-2.267-2.771-4.071-4.993-5.057	L1.73,13.292c-0.973-0.432-0.973-1.848,0-2.28l2.965-1.316C6.974,8.684,8.787,6.813,9.76,4.47l1.126-2.714	c0.418-1.007,1.81-1.007,2.228,0L14.24,4.47c0.973,2.344,2.786,4.215,5.065,5.226l2.965,1.316c0.973,0.432,0.973,1.848,0,2.28	l-3.061,1.359C16.988,15.637,15.206,17.441,14.217,19.707z"></path><path d="M24.481,27.796l-0.339,0.777c-0.248,0.569-1.036,0.569-1.284,0l-0.339-0.777c-0.604-1.385-1.693-2.488-3.051-3.092	l-1.044-0.464c-0.565-0.251-0.565-1.072,0-1.323l0.986-0.438c1.393-0.619,2.501-1.763,3.095-3.195l0.348-0.84	c0.243-0.585,1.052-0.585,1.294,0l0.348,0.84c0.594,1.432,1.702,2.576,3.095,3.195l0.986,0.438c0.565,0.251,0.565,1.072,0,1.323	l-1.044,0.464C26.174,25.308,25.085,26.411,24.481,27.796z"></path>
                                    </svg>
                                </button>
                            </div>
                            <p className="text-[12px] text-white/40 mb-2">
                                Fills <span className="text-white/60">both</span> Out of scope and Core deliverable from steps 1–2, dates,
                                amount, and cached PRD text (if any).
                            </p>
                            <textarea
                                value={outOfScope}
                                onChange={(e) => setOutOfScope(e.target.value)}
                                placeholder="List what is explicitly NOT included in this contract..."
                                rows={4}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-2">
                                <label className={`${labelClass} mb-0`}>Core Deliverable</label>
                            </div>
                            <textarea
                                value={coreDeliverable}
                                onChange={(e) => setCoreDeliverable(e.target.value)}
                                placeholder="What you will deliver (e.g. live URL, repo handover, Figma file, video deliverables)..."
                                rows={3}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <div>
                            <label className={`${labelClass} mb-6`}>Intellectual Property</label>
                            <div className="flex flex-col gap-5">
                                {["Client owns all upon payment", "Shared ownership", "Freelancer retains all rights"].map((opt) => (
                                    <label key={opt} className="flex items-center gap-4 cursor-pointer group">
                                        <div
                                            onClick={() => setIntellectualProperty(opt)}
                                            className="w-6 h-6 rounded-full border border-[#1e1e1e] flex items-center justify-center group-hover:border-[#3cb44f] transition-colors bg-[#0a0a0a]"
                                        >
                                            {intellectualProperty === opt && <div className="w-3 h-3 bg-[#3cb44f] rounded-full shadow-[0_0_8px_#3cb44f]"></div>}
                                        </div>
                                        <span className={`transition-colors text-base font-medium ${intellectualProperty === opt ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {feedbackBanner}
                        {(() => {
                            const targetAmt = parseFloat(totalContractAmount) || 0;
                            const sumMs = milestones.reduce((s, m) => s + (m.amount || 0), 0);
                            const aligned =
                                targetAmt > 0 && milestones.length > 0 && Math.abs(sumMs - targetAmt) <= 0.02;
                            return (
                                <div
                                    className={`rounded-2xl border px-5 py-4 ${aligned
                                        ? "border-[#3cb44f]/40 bg-[#3cb44f]/10"
                                        : "border-[#1e1e1e] bg-[#0a0a0a]"
                                        }`}
                                >
                                    <p className="text-xs font-black uppercase tracking-widest text-[#4a4a4a] mb-1">
                                        Payment split check
                                    </p>
                                    <p className="text-sm text-white">
                                        <span className="text-white/70">Milestones total: </span>
                                        <span className="font-bold text-[#3cb44f]">
                                            {contractCurrency} {sumMs.toLocaleString()}
                                        </span>
                                        <span className="text-white/50 mx-2">/</span>
                                        <span className="text-white/70">Contract total: </span>
                                        <span className="font-bold">{contractCurrency} {targetAmt.toLocaleString()}</span>
                                    </p>
                                    <p className="text-xs text-white/70 mt-2">
                                        Adding more milestones improves trust and ensures regular, reliable payments throughout the project.
                                    </p>
                                    {!aligned && targetAmt > 0 && (
                                        <p className="text-xs text-orange-300/90 mt-2">
                                            {milestones.length === 0
                                                ? "Add milestones below or use AI suggestions — amounts must add up to your contract total."
                                                : "Adjust milestone amounts so they sum exactly to your contract total."}
                                        </p>
                                    )}
                                </div>
                            );
                        })()}

                        <div className="space-y-6">
                            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                                <h3 className="text-xl font-bold text-white">Milestones</h3>
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        type="button"
                                        onClick={() => openMilestoneAiModal()}
                                        className="rounded-xl border border-[#3cb44f]/50 bg-[#3cb44f]/10 px-4 py-2.5 text-xs font-black uppercase tracking-wider text-[#3cb44f] hover:bg-[#3cb44f]/20 transition-all"
                                    >
                                        AI suggest milestones
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => openMilestoneModal(null)}
                                        className="rounded-xl border border-[#3cb44f]/40 px-4 py-2.5 text-xs font-semibold text-[#3cb44f] hover:bg-[#3cb44f]/10 transition-all"
                                    >
                                        + Add Milestone
                                    </button>
                                </div>
                            </div>

                            <div className="space-y-2 max-h-[min(52vh,560px)] overflow-y-auto pr-1 scrBar">
                                {milestones.length === 0 ? (
                                    <p className="text-sm text-[#4a4a4a] py-6 text-center border border-dashed border-[#3cb44f]/20 rounded-2xl bg-[#3cb44f]/[0.03]">
                                        No milestones yet. Use <span className="text-[#3cb44f] font-semibold">AI suggest milestones</span> or add manually.
                                    </p>
                                ) : (
                                    milestones.map((ms, i) => (
                                        <div
                                            key={i}
                                            className="group flex gap-0 rounded-xl border border-[#3cb44f]/20 bg-[#0a0a0a] shadow-[0_0_0_1px_rgba(60,180,79,0.06)_inset] transition-all hover:border-[#3cb44f]/35 hover:bg-[#3cb44f]/[0.04] overflow-hidden"
                                        >
                                            <div
                                                className="w-1 shrink-0 bg-gradient-to-b from-[#3cb44f] via-[#3cb44f]/70 to-[#3cb44f]/30"
                                                aria-hidden
                                            />
                                            <div className="min-w-0 flex-1 px-3 py-2.5 sm:px-4 sm:py-3">
                                                <div className="flex items-start justify-between gap-2 sm:gap-3">
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3cb44f]/80 mb-0.5">
                                                            Milestone {i + 1}
                                                        </p>
                                                        <p className="text-sm sm:text-base font-bold text-white leading-snug line-clamp-2">
                                                            {ms.title || "Untitled milestone"}
                                                        </p>
                                                    </div>
                                                    <div className="flex shrink-0 flex-col items-end gap-1.5">
                                                        <p className="text-sm font-black tabular-nums text-[#3cb44f] drop-shadow-[0_0_12px_rgba(60,180,79,0.25)]">
                                                            {contractCurrency}{" "}
                                                            {ms.amount ? ms.amount.toLocaleString() : "0"}
                                                        </p>
                                                        <div className="flex gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => openMilestoneModal(i)}
                                                                className="rounded-lg border border-[#3cb44f]/40 bg-[#3cb44f]/10 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-[#3cb44f] transition-colors hover:bg-[#3cb44f]/20"
                                                            >
                                                                Edit
                                                            </button>
                                                            <button
                                                                type="button"
                                                                title="Delete milestone"
                                                                onClick={() => deleteMilestone(i)}
                                                                className="rounded-lg border border-red-500/30 bg-red-500/5 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-red-400/90 transition-colors hover:bg-red-500/15"
                                                            >
                                                                Delete
                                                            </button>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="mt-2 flex flex-wrap items-center gap-1.5">
                                                    {ms.due_date ? (
                                                        <span className="inline-flex items-center rounded-md border border-white/10 bg-black/50 px-2 py-0.5 text-[10px] font-semibold text-white/75">
                                                            Due {ms.due_date}
                                                        </span>
                                                    ) : (
                                                        <span className="inline-flex items-center rounded-md border border-white/5 bg-white/[0.03] px-2 py-0.5 text-[10px] text-white/35">
                                                            No due date
                                                        </span>
                                                    )}
                                                    {ms.submission_criteria ? (
                                                        <span
                                                            className="inline-flex max-w-[140px] truncate rounded-md border border-[#3cb44f]/25 bg-[#3cb44f]/10 px-2 py-0.5 text-[10px] font-semibold text-[#3cb44f]"
                                                            title={ms.submission_criteria}
                                                        >
                                                            {ms.submission_criteria}
                                                        </span>
                                                    ) : null}
                                                    {ms.completion_criteria_tc ? (
                                                        <span
                                                            className="inline-flex max-w-[min(100%,220px)] truncate rounded-md border border-white/10 px-2 py-0.5 text-[10px] text-white/50"
                                                            title={ms.completion_criteria_tc}
                                                        >
                                                            {ms.completion_criteria_tc}
                                                        </span>
                                                    ) : null}
                                                </div>
                                                {ms.description ? (
                                                    <p className="mt-1.5 text-xs leading-relaxed text-white/45 line-clamp-2 border-t border-white/5 pt-1.5">
                                                        {ms.description}
                                                    </p>
                                                ) : null}
                                            </div>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>

                        <hr className="border-[#1e1e1e] w-full" />

                        <div>
                            <label className={labelClass}>Payment Method</label>

                            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    {
                                        value: "UPI",
                                        label: "UPI",
                                        subtitle: "GPay, PhonePe, Paytm, etc.",
                                        badge: "Recommended (India)",
                                    },
                                    {
                                        value: "Bank Transfer",
                                        label: "Bank Transfer",
                                        subtitle: "NEFT / RTGS / IMPS",
                                    },
                                    {
                                        value: "PayPal",
                                        label: "PayPal",
                                        subtitle: "International clients",
                                    },
                                    {
                                        value: "Crypto",
                                        label: "Crypto",
                                        subtitle: "USDT, ETH, BTC, etc.",
                                    },
                                    {
                                        value: "Stripe",
                                        label: "Stripe",
                                        subtitle: "Cards & subscriptions",
                                    },
                                    {
                                        value: "Other",
                                        label: "Other",
                                        subtitle: "Custom or niche methods",
                                    },
                                ].map((m) => (
                                    <button
                                        type="button"
                                        key={m.value}
                                        onClick={() => setPaymentMethod(m.value)}
                                        className={`group relative flex items-start gap-3 rounded-2xl border px-4 py-3 text-left transition-all
          ${paymentMethod === m.value
                                                ? "bg-transparent border-[#3cb44f] text-white shadow-[0_4px_24px_rgba(0,230,118,0.18)]"
                                                : "bg-transparent border-[#1e1e1e] text-[#9ca3af] hover:border-[#3cb44f]/60 hover:bg-transparent"
                                            }`}
                                    >
                                        <div
                                            className={`mt-1 flex h-5 w-5 items-center justify-center rounded-full border-2 transition-all
            ${paymentMethod === m.value
                                                    ? "border-[#3cb44f] bg-[#3cb44f]"
                                                    : "border-[#374151] group-hover:border-[#3cb44f]"
                                                }`}
                                        >
                                            {paymentMethod === m.value && (
                                                <div className="h-2 w-2 rounded-full bg-black" />
                                            )}
                                        </div>

                                        <div className="flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-white">
                                                    {m.label}
                                                </span>
                                                {m.badge && (
                                                    <span className="rounded-full bg-[#3cb44f]/10 px-2 py-0.5 text-[10px] font-medium text-[#3cb44f]">
                                                        {m.badge}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-xs text-[#6b7280]">{m.subtitle}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>

                            {paymentMethod === "Other" && (
                                <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                    <input
                                        type="text"
                                        placeholder="Please specify payment method (e.g. Payoneer, Wire...)"
                                        value={otherPaymentMethod}
                                        onChange={(e) => setOtherPaymentMethod(e.target.value)}
                                        className={inputClass}
                                        autoFocus
                                    />
                                </div>
                            )}
                        </div>

                        <div>
                            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between mb-2">
                                <label className={`${labelClass} mb-0`}>Terms & Conditions</label>
                                <button
                                    type="button"
                                    disabled={termsAiLoading}
                                    onClick={() => void runTermsAISuggest()}
                                    className="shrink-0 rounded-xl border flex cursor-pointer items-center gap-2 border-[#3cb44f]/50 bg-[#3cb44f]/10 px-4 py-2 text-xs font-black uppercase tracking-wider text-[#3cb44f] hover:bg-[#3cb44f]/20 transition-all disabled:opacity-50 disabled:pointer-events-none"
                                >
                                    {termsAiLoading ? "Generating…" : "Generate with AI"}
                                    <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="16" height="16" viewBox="0 0 30 30" fill="#3cb44f">
                                        <path d="M14.217,19.707l-1.112,2.547c-0.427,0.979-1.782,0.979-2.21,0l-1.112-2.547c-0.99-2.267-2.771-4.071-4.993-5.057	L1.73,13.292c-0.973-0.432-0.973-1.848,0-2.28l2.965-1.316C6.974,8.684,8.787,6.813,9.76,4.47l1.126-2.714	c0.418-1.007,1.81-1.007,2.228,0L14.24,4.47c0.973,2.344,2.786,4.215,5.065,5.226l2.965,1.316c0.973,0.432,0.973,1.848,0,2.28	l-3.061,1.359C16.988,15.637,15.206,17.441,14.217,19.707z"></path><path d="M24.481,27.796l-0.339,0.777c-0.248,0.569-1.036,0.569-1.284,0l-0.339-0.777c-0.604-1.385-1.693-2.488-3.051-3.092	l-1.044-0.464c-0.565-0.251-0.565-1.072,0-1.323l0.986-0.438c1.393-0.619,2.501-1.763,3.095-3.195l0.348-0.84	c0.243-0.585,1.052-0.585,1.294,0l0.348,0.84c0.594,1.432,1.702,2.576,3.095,3.195l0.986,0.438c0.565,0.251,0.565,1.072,0,1.323	l-1.044,0.464C26.174,25.308,25.085,26.411,24.481,27.796z"></path>
                                    </svg>
                                </button>
                            </div>
                            <p className="text-[12px] text-white/45 mb-2 leading-relaxed">
                                Drafts comprehensive clauses from your project, client, milestones, timeline, payment method, scope, and PRD uploaded
                                (if any), including <span className="text-white/70">communication / ghosting</span>,{" "}
                                <span className="text-white/70">good faith &amp; anti-fraud</span>, IP, payment, liability, and disputes
                                (India-oriented).<br /> <span className="text-amber-200/80">Not a substitute for a lawyer</span> ( review and edit
                                before signing. )
                            </p>
                            <textarea
                                value={customTerms}
                                onChange={(e) => setCustomTerms(e.target.value)}
                                placeholder="Enter any specific terms, clauses, or conditions for this contract..."
                                rows={8}
                                className={`${inputClass} resize-y min-h-[180px]`}
                            />
                        </div>
                    </div>
                );
            case 5:


                return (
                    <div className="flex flex-col lg:flex-row gap-8 h-[85vh] overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* LEFT: PDF PREVIEW (70%) */}
                        <div className="lg:w-[70%] h-full flex flex-col relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#3cb44f]/10 to-transparent rounded-2xl blur-sm opacity-20"></div>

                            <div className="relative bg-white h-full w-full rounded-xl shadow-2xl overflow-hidden border border-black/5 flex flex-col">
                                {/* Fixed Header for PDF */}
                                <div className="absolute top-6 right-6 z-20">
                                    <div className="bg-[#3cb44f] text-black text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border border-black/10 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
                                        DRAFT
                                    </div>
                                </div>

                                {/* Scrollable PDF Content */}
                                <div className="flex-1 overflow-y-auto text-black scroll-smooth">
                                    {isGenerating ? (
                                        <div className="h-full flex flex-col items-center justify-center space-y-8 py-20">
                                            <div className="relative">
                                                <div className="w-16 h-16 border-4 border-[#3cb44f]/20 border-t-[#3cb44f] rounded-full animate-spin"></div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-[#3cb44f] rounded-full animate-ping"></div>
                                                </div>
                                            </div>
                                            <div className="space-y-4 w-full max-w-xs text-center">
                                                <div className="h-2.5 bg-gray-100 rounded-full animate-pulse"></div>
                                                <div className="h-2.5 bg-gray-100 rounded-full animate-pulse w-5/6 mx-auto"></div>
                                                <p className="text-gray-400 font-medium tracking-wide animate-pulse mt-4">Generating legal contract...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div
                                            className="animate-in fade-in zoom-in-95 duration-1000 mx-auto max-w-full bg-[#fffdf5] px-6 py-8 md:px-10 md:py-12 text-neutral-900 shadow-[inset_0_0_80px_rgba(120,80,40,0.05)] font-serif text-[13px] md:text-[14px] leading-relaxed tracking-tight"
                                            style={{ minHeight: "297mm" }}
                                        >
                                            {/* <p className="text-[10px] uppercase tracking-[0.25em] text-neutral-500 border-b border-neutral-300 pb-2 mb-6 text-center font-sans">
                                                Draft for review · Indian format service agreement
                                            </p> */}
                                            <div className="prose-sm md:prose-base max-w-none prose-headings:font-bold prose-headings:text-neutral-900 prose-p:text-neutral-800">
                                                <MarkdownRenderer content={contractText} />
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* RIGHT: ACTIONS PANEL (30%) */}
                        <div className="lg:w-[30%] h-full flex flex-col justify-center gap-10 overflow-hidden">
                            {/* Action Buttons */}
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={handleSend}
                                    disabled={isSent || isGenerating || isSubmitting}
                                    className={`w-full ${isSent ? 'bg-gray-800 text-gray-400' : 'bg-[#3cb44f] text-black'} font-bold py-4 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 group`}
                                >
                                    {isSent ? (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            Sent Successfully!
                                        </>
                                    ) : isSubmitting ? (
                                        <>
                                            <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                            </svg>
                                            Sending...
                                        </>
                                    ) : (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform">
                                                <line x1="22" y1="2" x2="11" y2="13" />
                                                <polygon points="22 2 15 22 11 13 2 9 22 2" />
                                            </svg>
                                            Send to Client
                                        </>
                                    )}
                                </button>

                                {isSent && (
                                    <div className="mt-8 p-6 bg-[#3cb44f]/5 border border-[#3cb44f]/20 rounded-2xl animate-in zoom-in-95 duration-500">
                                        <p className="text-[#3cb44f] text-[10px] font-black uppercase tracking-widest mb-3">Copy Shareable Link</p>
                                        <div className="flex gap-2">
                                            <input
                                                readOnly
                                                value={generatedLink}
                                                className="flex-1 bg-black border border-white/10 rounded-xl px-4 py-3 text-xs text-white/60 focus:outline-none"
                                            />
                                            <button
                                                onClick={() => {
                                                    navigator.clipboard.writeText(generatedLink);
                                                    alert("Link copied!");
                                                }}
                                                className="bg-[#3cb44f] text-black px-4 py-3 rounded-xl text-xs font-bold hover:bg-[#2d8a3e] transition-all cursor-pointer"
                                            >
                                                Copy
                                            </button>
                                        </div>
                                        <button
                                            onClick={onClose}
                                            className="w-full mt-4 py-2 text-white/40 hover:text-white text-[10px] font-bold uppercase tracking-widest transition-colors cursor-pointer"
                                        >
                                            Close Form
                                        </button>
                                    </div>
                                )}

                                <button
                                    type="button"
                                    onClick={handleDownloadContractPdf}
                                    disabled={isGenerating || !contractText.trim()}
                                    className="w-full bg-transparent border border-[#3cb44f] text-[#3cb44f] py-4 rounded-xl text-sm font-semibold hover:bg-[#3cb44f]/10 transition-all flex items-center justify-center gap-2 group disabled:opacity-40 disabled:pointer-events-none"
                                >
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-0.5 transition-transform">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Download as PDF
                                </button>

                                <button
                                    onClick={handleSaveDraft}
                                    disabled={isSubmitting}
                                    className="w-fit mx-auto mt-4 cursor-pointer text-[#4a4a4a] hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="transition-transform duration-500">
                                        <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path>
                                        <polyline points="17 21 17 13 7 13 7 21"></polyline>
                                    </svg>
                                    Save as Draft
                                </button>
                            </div>

                            <div>
                                <p className="text-[11px] text-[#4a4a4a] leading-relaxed text-center font-medium px-4">
                                    Contract will be sent to the client's email for e-signature
                                </p>
                            </div>
                        </div>
                    </div>
                );
            default:
                return null;
        }
    };

    return (
        <>
            {/* PRD welcome — popup on first visit this session (new contract only) */}
            <AnimatePresence>
                {showPrdWelcomeModal && (
                    <motion.div
                        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="prd-welcome-title"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        onClick={() => dismissPrdWelcomeModal(false)}
                    >
                        <motion.div
                            className="relative w-full max-w-lg overflow-hidden rounded-2xl border border-[#3cb44f]/35 bg-gradient-to-br from-[#0a1a0d] via-[#050509] to-[#0a0a0a] p-6 md:p-8 shadow-[0_0_60px_-15px_rgba(60,180,79,0.45)]"
                            initial={{ opacity: 0, y: 24, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 16, scale: 0.96 }}
                            transition={{ duration: 0.3, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-[#3cb44f]/15 blur-3xl pointer-events-none" />
                            <button
                                type="button"
                                onClick={() => dismissPrdWelcomeModal(false)}
                                className="absolute right-4 top-4 text-white/40 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/5"
                                aria-label="Close"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>

                            <div className="relative flex flex-col gap-4">
                                {/* <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-[#3cb44f]/20 text-[#3cb44f] ring-1 ring-[#3cb44f]/35">
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                                        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                                        <polyline points="14 2 14 8 20 8" />
                                        <line x1="12" y1="18" x2="12" y2="12" />
                                        <line x1="9" y1="15" x2="15" y2="15" />
                                    </svg>
                                </div> */}
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3cb44f]">
                                    Recommended first step
                                </p>
                                <h2 id="prd-welcome-title" className="text-xl md:text-2xl font-bold text-white tracking-tight pr-8">
                                    Upload your PRD, we&apos;ll fetch the project details for you
                                </h2>
                                <p className="text-sm text-white/70 leading-relaxed">
                                    Add a <span className="text-white font-medium">PDF or DOCX</span> product requirements document. We automatically pull{" "}
                                    <span className="text-[#3cb44f]/90 font-medium">
                                        title, description, dates, client info, scope, and terms
                                    </span>{" "}
                                    into this form so you can review and send faster.
                                </p>
                                <p className="text-xs text-[#fff]/50 flex flex-wrap gap-x-4 gap-y-2">
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#3cb44f]" />
                                        AI-assisted extraction
                                    </span>
                                    <span className="inline-flex items-center gap-1.5">
                                        <span className="h-1.5 w-1.5 rounded-full bg-[#3cb44f]" />
                                        Edit anything after
                                    </span>
                                </p>
                                <div className="flex flex-col-reverse sm:flex-row gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={() => dismissPrdWelcomeModal(false)}
                                        className="flex-1 rounded-xl border border-white/15 py-3.5 text-xs font-bold uppercase tracking-widest text-white/80 hover:bg-white/5 transition-colors"
                                    >
                                        Got it
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => dismissPrdWelcomeModal(true)}
                                        className="flex-1 rounded-xl bg-[#3cb44f] py-3.5 text-xs font-black uppercase tracking-widest text-black hover:bg-[#45cc59] transition-colors shadow-[0_8px_24px_rgba(60,180,79,0.25)]"
                                    >
                                        Jump to PRD upload
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* AI milestone suggestions — opens from Payment Terms (Continue) or "AI suggest milestones" */}
            <AnimatePresence>
                {milestoneAiOpen && (
                    <motion.div
                        key="milestone-ai-overlay"
                        className="fixed inset-0 z-[200] flex items-center justify-center bg-black/85 backdrop-blur-sm p-4"
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="milestone-ai-title"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => setMilestoneAiOpen(false)}
                    >
                        <motion.div
                            className="relative w-full max-w-lg max-h-[88vh] overflow-y-auto rounded-2xl border border-[#1e1e1e] bg-[#050509] p-6 md:p-8 shadow-2xl scrBar"
                            initial={{ opacity: 0, y: 16, scale: 0.98 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.98 }}
                            transition={{ duration: 0.25, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                type="button"
                                onClick={() => setMilestoneAiOpen(false)}
                                className="absolute right-4 top-4 rounded-lg p-1 text-white/40 transition-colors hover:bg-white/5 hover:text-white"
                                aria-label="Close"
                            >
                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <line x1="18" y1="6" x2="6" y2="18" />
                                    <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                            </button>

                            <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-[#3cb44f]">
                                AI milestone planner
                            </p>
                            <h2 id="milestone-ai-title" className="mb-4 pr-8 text-xl font-bold text-white">
                                {milestoneAiPhase === "missing" && "Almost there — a few details missing"}
                                {milestoneAiPhase === "loading" && "Generating milestone suggestions…"}
                                {milestoneAiPhase === "error" && "Could not generate suggestions"}
                                {milestoneAiPhase === "results" && "Suggested milestones for your project"}
                            </h2>

                            {milestoneAiPhase === "missing" && (
                                <>
                                    <p className="mb-4 text-sm leading-relaxed text-white/70">
                                        Fill these fields so we can break your total into realistic, progressive payments
                                        (typical Indian freelancer / client milestone flows):
                                    </p>
                                    <ul className="mb-6 list-disc space-y-1.5 pl-5 text-sm text-orange-200/90">
                                        {milestoneAiMissing.map((m) => (
                                            <li key={m}>{m}</li>
                                        ))}
                                    </ul>
                                    <button
                                        type="button"
                                        onClick={() => setMilestoneAiOpen(false)}
                                        className="w-full rounded-xl bg-[#3cb44f] py-3.5 text-xs font-black uppercase tracking-widest text-black transition-colors hover:bg-[#45cc59]"
                                    >
                                        Back to edit
                                    </button>
                                </>
                            )}

                            {milestoneAiPhase === "loading" && (
                                <div className="flex flex-col items-center py-12">
                                    <div className="mb-4 h-12 w-12 animate-spin rounded-full border-2 border-[#3cb44f]/30 border-t-[#3cb44f]" />
                                    <p className="text-center text-sm text-[#4a4a4a]">
                                        Using your project details, PRD flag, scope, deliverables, and total amount…
                                    </p>
                                </div>
                            )}

                            {milestoneAiPhase === "error" && (
                                <div className="space-y-4">
                                    <p className="text-sm text-red-300">{milestoneAiError}</p>
                                    <div className="flex flex-col gap-2 sm:flex-row">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setMilestoneAiError(null);
                                                setMilestoneAiPhase("loading");
                                                void runMilestoneAISuggest();
                                            }}
                                            className="flex-1 rounded-xl bg-[#3cb44f] py-3 text-xs font-bold uppercase tracking-widest text-black hover:bg-[#45cc59]"
                                        >
                                            Try again
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setMilestoneAiOpen(false)}
                                            className="flex-1 rounded-xl border border-white/15 py-3 text-xs font-bold uppercase tracking-widest text-white/80 hover:bg-white/5"
                                        >
                                            Close
                                        </button>
                                    </div>
                                </div>
                            )}

                            {milestoneAiPhase === "results" && (
                                <div className="space-y-4">
                                    <p className="text-xs leading-relaxed text-white/55">
                                        Contract total{" "}
                                        <span className="font-bold text-white">
                                            {contractCurrency} {(parseFloat(totalContractAmount) || 0).toLocaleString()}
                                        </span>
                                        . Select milestones (all selected by default). Amounts sum to your total for
                                        time-to-time payouts.
                                    </p>
                                    <label className="flex cursor-pointer items-center gap-3 text-sm text-white/85">
                                        <input
                                            type="checkbox"
                                            className="h-4 w-4 accent-[#3cb44f]"
                                            checked={replaceMilestonesWithAI}
                                            onChange={(e) => setReplaceMilestonesWithAI(e.target.checked)}
                                        />
                                        Replace existing milestones instead of appending
                                    </label>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => toggleSelectAllSuggested(true)}
                                            className="rounded-lg border border-[#1e1e1e] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#3cb44f] hover:bg-[#3cb44f]/10"
                                        >
                                            Select all
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => toggleSelectAllSuggested(false)}
                                            className="rounded-lg border border-[#1e1e1e] px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-white/50 hover:bg-white/5"
                                        >
                                            Clear selection
                                        </button>
                                    </div>
                                    <div className="max-h-[40vh] space-y-2 overflow-y-auto pr-1">
                                        {suggestedMilestones.map((sm, i) => (
                                            <label
                                                key={`${sm.title}-${i}`}
                                                className="flex cursor-pointer gap-3 rounded-xl border border-[#1e1e1e] bg-[#0a0a0a] p-3 transition-colors hover:border-[#3cb44f]/30"
                                            >
                                                <input
                                                    type="checkbox"
                                                    className="mt-1 h-4 w-4 shrink-0 accent-[#3cb44f]"
                                                    checked={!!suggestedSelected[i]}
                                                    onChange={(e) =>
                                                        setSuggestedSelected({
                                                            ...suggestedSelected,
                                                            [i]: e.target.checked,
                                                        })
                                                    }
                                                />
                                                <div className="min-w-0 flex-1">
                                                    <p className="text-sm font-semibold text-white">{sm.title}</p>
                                                    {sm.description ? (
                                                        <p className="mt-0.5 text-xs text-[#4a4a4a]">{sm.description}</p>
                                                    ) : null}
                                                    <p className="mt-1 text-xs font-bold text-[#3cb44f]">
                                                        {contractCurrency} {sm.amount.toLocaleString()}
                                                        {sm.due_date ? (
                                                            <span className="ml-2 font-normal text-white/40">
                                                                · due {sm.due_date}
                                                            </span>
                                                        ) : null}
                                                    </p>
                                                </div>
                                            </label>
                                        ))}
                                    </div>
                                    <div className="flex flex-col gap-2 border-t border-[#1e1e1e] pt-4">
                                        <button
                                            type="button"
                                            onClick={() => applySelectedSuggestedMilestones(false)}
                                            className="w-full rounded-xl border border-[#3cb44f]/50 py-3.5 text-xs font-black uppercase tracking-widest text-[#3cb44f] hover:bg-[#3cb44f]/10"
                                        >
                                            Add selected milestones
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => applySelectedSuggestedMilestones(true)}
                                            className="w-full rounded-xl bg-[#3cb44f] py-3.5 text-xs font-black uppercase tracking-widest text-black hover:bg-[#45cc59]"
                                        >
                                            Add selected &amp; go to Review
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => advanceToReviewIfValid()}
                                            className="w-full rounded-xl border border-white/10 py-3 text-[10px] font-bold uppercase tracking-widest text-white/50 hover:bg-white/5 hover:text-white"
                                        >
                                            Skip AI — continue to Review
                                        </button>
                                    </div>
                                </div>
                            )}
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Add/Edit milestone — root portal so it always stacks above the form (not unmounted on step change) */}
            <AnimatePresence>
                {isMilestoneModalOpen && (
                    <motion.div
                        key="milestone-editor-overlay"
                        className="fixed inset-0 z-[199] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.25, ease: "easeOut" }}
                        onClick={closeMilestoneModal}
                    >
                        <motion.div
                            className="w-full max-w-xl bg-[#050509] border border-[#1e1e1e] rounded-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto scrBar"
                            initial={{ opacity: 0, y: 20, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: 12, scale: 0.96 }}
                            transition={{ duration: 0.28, ease: "easeOut" }}
                            onClick={(e) => e.stopPropagation()}
                        >
                            <div className="flex items-center justify-between">
                                <h4 className="text-lg font-semibold text-white">
                                    {editingMilestoneIndex === null ? "Add Milestone" : "Edit Milestone"}
                                </h4>
                                <button
                                    type="button"
                                    onClick={closeMilestoneModal}
                                    className="text-sm text-white/50 hover:text-white"
                                >
                                    ✕
                                </button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Milestone Title</label>
                                    <input
                                        type="text"
                                        placeholder="e.g. Wireframes"
                                        className={inputClass}
                                        value={draftMilestone.title}
                                        onChange={(e) =>
                                            setDraftMilestone({ ...draftMilestone, title: e.target.value })
                                        }
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>Due Date</label>
                                    <input
                                        type="date"
                                        className={`${inputClass} [color-scheme:dark]`}
                                        value={draftMilestone.due_date}
                                        onChange={(e) =>
                                            setDraftMilestone({ ...draftMilestone, due_date: e.target.value })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Amount</label>
                                    <input
                                        type="number"
                                        placeholder="0"
                                        className={inputClass}
                                        value={draftMilestone.amount}
                                        onChange={(e) =>
                                            setDraftMilestone({
                                                ...draftMilestone,
                                                amount: parseFloat(e.target.value) || 0,
                                            })
                                        }
                                    />
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className={labelClass}>Milestone Description</label>
                                    <input
                                        type="text"
                                        placeholder="Description of deliverables..."
                                        className={inputClass}
                                        value={draftMilestone.description}
                                        onChange={(e) =>
                                            setDraftMilestone({
                                                ...draftMilestone,
                                                description: e.target.value,
                                            })
                                        }
                                    />
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Submission Criteria</label>
                                        <CustomDropdown
                                            options={["Photos", "Link", "Video", "Docs"]}
                                            value={draftMilestone.submission_criteria || "Link"}
                                            onChange={(val) =>
                                                setDraftMilestone({
                                                    ...draftMilestone,
                                                    submission_criteria: val,
                                                })
                                            }
                                            className={`${inputClass} flex items-center justify-between`}
                                        />
                                    </div>
                                    <div>
                                        <label className={labelClass}>Completion Criteria T&C</label>
                                        <input
                                            type="text"
                                            placeholder="Terms for completion..."
                                            className={inputClass}
                                            value={draftMilestone.completion_criteria_tc}
                                            onChange={(e) =>
                                                setDraftMilestone({
                                                    ...draftMilestone,
                                                    completion_criteria_tc: e.target.value,
                                                })
                                            }
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={closeMilestoneModal}
                                    className="px-4 py-2 rounded-xl text-xs border border-white/10 text-gray-200 hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="button"
                                    onClick={saveMilestone}
                                    className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#3cb44f] text-black hover:bg-[#45cc59] transition-colors"
                                >
                                    Save milestone
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            <div className="flex flex-col md:flex-row w-full pt-20 bg-[#000] text-white gap-0">
                {/* Left Column - Steps Panel */}
                <div className="w-full md:w-[22%] md:fixed left-0 top-0 md:h-screen bg-[#000] pl-12 pr-4 py-12 flex flex-col z-20">


                    <div className="flex flex-col gap-10 md:gap-12 flex-1 justify-center">
                        {STEPS.map((stepName, idx) => {
                            const stepNum = idx + 1;
                            const isActive = stepNum === step;
                            const isCompleted = stepNum < step;

                            return (
                                <button
                                    key={idx}
                                    onClick={() => setStep(stepNum)}
                                    className="flex items-center gap-5 group cursor-pointer border-none bg-transparent p-0 w-full text-left outline-none"
                                >
                                    <div
                                        className={`shrink-0 transition-all duration-300 flex items-center justify-center font-bold relative z-10 rounded-full ${isActive
                                            ? "w-10 h-10 bg-[#3cb44f] text-black shadow-[0_0_25px_rgba(0,230,118,0.25)] scale-110"
                                            : isCompleted
                                                ? "w-8 h-8 bg-[#3cb44f]/20 text-[#3cb44f]"
                                                : "w-9 h-9 bg-transparent text-[#4a4a4a] border-2 border-[#1e1e1e]"
                                            }`}
                                    >
                                        {isCompleted ? (
                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                <polyline points="20 6 9 17 4 12" />
                                            </svg>
                                        ) : (
                                            <span className={isActive ? "text-base" : "text-xs"}>{stepNum}</span>
                                        )}
                                    </div>
                                    <span
                                        className={`transition-all duration-300 ${isActive
                                            ? "text-2xl font-bold text-white"
                                            : isCompleted
                                                ? "text-sm text-[#3cb44f]/60 font-medium"
                                                : "text-base text-[#4a4a4a] font-normal"
                                            }`}
                                    >
                                        {stepName}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Right Column - Form Content */}
                <div className={`w-full md:w-[78%] md:ml-[22%] ${step === 3 || step === 4 ? 'min-h-[92dvh] overflow-y-auto' : 'h-[92dvh] overflow-y-hidden'} bg-[#000] py-8 md:py-12 flex flex-col`}>
                    <div className="w-full pl-8 pr-12 md:pl-16 md:pr-24 flex-1 flex flex-col justify-center overflow-hidden">
                        <div className={step < 5 ? "" : "flex-1 overflow-y-hidden flex flex-col justify-center"}>
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={step}
                                    initial={{ opacity: 0, y: 20 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -16 }}
                                    transition={{ duration: 0.35, ease: "easeOut" }}
                                >
                                    {renderStep()}
                                </motion.div>
                            </AnimatePresence>

                            {/* Navigation Buttons - Hidden on Step 5 */}
                            {step < 5 && (
                                <div className="mt-4 flex items-center justify-between pt-4 border-t border-[#1e1e1e]">
                                    <button
                                        type="button"
                                        onClick={prevStep}
                                        className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-[#1e1e1e] text-[#4a4a4a] hover:text-white hover:bg-[#1e1e1e]/50 transition-all active:scale-95 ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                                    >
                                        Previous
                                    </button>
                                    <button
                                        type="button"
                                        onClick={nextStep}
                                        className="bg-[#3cb44f] cursor-pointer text-black font-black text-xs uppercase tracking-widest rounded-2xl px-12 py-4 shadow-[0_10px_30px_rgba(0,230,118,0.2)] active:scale-95"
                                    >
                                        {step === 4 ? "Continue to review" : "Continue"}
                                    </button>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default CreateContractForm;
