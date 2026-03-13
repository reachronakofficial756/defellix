import { useState, useEffect } from "react";

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
                className={`${className} flex items-center justify-between text-left ${open ? 'border-[#00e676] ring-1 ring-[#00e676]' : ''}`}
            >
                <span className="truncate">{value || options[0]}</span>
                <svg className={`shrink-0 w-4 h-4 ml-2 transition-transform duration-200 ${open ? 'rotate-180 text-[#00e676]' : 'text-[#4a4a4a]'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
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
                                    className="w-full bg-[#0d1117] border border-[#1e1e1e] rounded-lg px-3 py-2 text-sm text-white placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#00e676] transition-all"
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
                                    className={`px-5 py-3 cursor-pointer text-sm transition-colors ${value === opt ? 'bg-[#00e676] text-black font-semibold' : 'text-white hover:bg-[#00e67620]'}`}
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

const CreateContractForm = ({ onClose }: { onClose: () => void }) => {
    const [step, setStep] = useState(1);

    const [projectTitle, setProjectTitle] = useState("");
    const [projectDesc, setProjectDesc] = useState("");
    const [projectType, setProjectType] = useState("Web Development");
    const [otherProjectType, setOtherProjectType] = useState("");
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
    const [contractCurrency, setContractCurrency] = useState("USD");
    const [contractAmount, setContractAmount] = useState("");
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



    const [milestones, setMilestones] = useState([{
        title: "",
        description: "",
        amount: 0,
        due_date: "",
        is_initial_payment: false,
        submission_criteria: "",
        completion_criteria_tc: ""
    }]);
    const [paymentMethod, setPaymentMethod] = useState<string>("Bank Transfer");
    const [otherPaymentMethod, setOtherPaymentMethod] = useState("");

    const [isAdvancePayment, setIsAdvancePayment] = useState(false);
    const [advanceAmount, setAdvanceAmount] = useState("");

    useEffect(() => {
        if (step !== 5) {
            setContractText(""); // Clear contract text if user goes back to edit
        }
    }, [step]);

    useEffect(() => {
        if (step === 5 && !contractText) {
            setIsGenerating(true);
            const timer = setTimeout(() => {
                const totalAmount = milestones.reduce((sum, ms) => sum + (ms.amount || 0), 0) + (parseFloat(contractAmount) || 0);
                const displayProjectType = projectType === "Other" ? otherProjectType : projectType;
                const text = `
# CONTRACT AGREEMENT: ${projectTitle.toUpperCase() || "PROJECT TITLE"}

## 1. Parties Involved
This Freelance Services Agreement ("Agreement") is entered into as of ${new Date().toLocaleDateString()}, by and between:
- **Service Provider**: Defellix Professional Services
- **Client**: ${clientName || "[CLIENT NAME]"} representing ${clientCompany || "[CLIENT COMPANY]"}
- **Client Contact**: ${clientEmail || "[CLIENT EMAIL]"} | ${clientPhone || "[CLIENT PHONE]"}

## 2. Project Scope & Deliverables
The project involves ${displayProjectType} services as described below:
${projectDesc || "No specific description provided."}

### Core Deliverables:
${coreDeliverable || "Standard project deliverables as per specifications."}

### Out of Scope:
${outOfScope || "Anything not explicitly mentioned in the scope is considered out of scope."}

## 3. Timeline & Deadlines
- **Commencement Date**: ${startDate || "TBD"}
- **Estimated Completion**: ${deadline || "TBD"}
- **Total Duration**: ${duration || "Calculated based on milestones"}

## 4. Milestones & Payment Schedule
The total value of this contract is **${contractCurrency} ${totalAmount.toLocaleString()}**.

${milestones.map((ms, i) => `
**Milestone #${i + 1}: ${ms.title || "Untitled"}**
- Deliverables: ${ms.description || "N/A"}
- Due Date: ${ms.due_date || "N/A"}
- Amount: ${contractCurrency} ${(ms.amount || 0).toLocaleString()} ${ms.is_initial_payment ? "(Initial Payment/Deposit)" : ""}
- Submission Method: ${ms.submission_criteria || "Electronic delivery"}
`).join('\n')}

## 5. Payment Terms
- Payments shall be made via **${paymentMethod === 'Other' ? otherPaymentMethod : paymentMethod}**.
${isAdvancePayment ? `- An upfront advance of ${contractCurrency} ${advanceAmount} is required before commencement.` : ''}
- Final balance is due upon project completion and delivery of core deliverables.

## 6. Revision Policy
- ${revisionPolicy} are included in this agreement. Additional revisions will be billed at a standard hourly rate.

## 7. Intellectual Property
- **Ownership**: ${intellectualProperty}.
- **License**: Service provider maintains the right to showcase the work in their professional portfolio.

## 8. Terms & Conditions
${customTerms || "Standard professional conduct and confidentiality terms apply."}

## 9. Execution
By signing below, both parties agree to the terms outlined in this agreement.

| Party | Signature | Date |
| :--- | :--- | :--- |
| **Service Provider** | *Digitalized by Defellix Systems* | ${new Date().toLocaleDateString()} |
| **Client** | __________________________ | _________ |
                `;
                setContractText(text);
                setIsGenerating(false);
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [step, projectTitle, clientName, clientCompany, projectType, otherProjectType, projectDesc, coreDeliverable, outOfScope, startDate, deadline, duration, milestones, contractCurrency, contractAmount, paymentMethod, otherPaymentMethod, isAdvancePayment, advanceAmount, revisionPolicy, intellectualProperty, customTerms, contractText]);

    const [isSent, setIsSent] = useState(false);
    const handleSend = () => {
        setIsSent(true);
        setTimeout(() => {
            setIsSent(false);
            onClose();
        }, 2000);
    };

    const nextStep = () => {
        if (step === 1 && projectType === "Other" && !otherProjectType.trim()) {
            alert("Please specify your project type.");
            return;
        }
        setStep((s) => Math.min(s + 1, 5));
    };
    const prevStep = () => setStep((s) => Math.max(s - 1, 1));

    const addMilestone = () => setMilestones([...milestones, {
        title: "",
        description: "",
        amount: 0,
        due_date: "",
        is_initial_payment: false,
        submission_criteria: "",
        completion_criteria_tc: ""
    }]);

    const updateMilestone = (index: number, field: string, value: any) => {
        const newMilestones = [...milestones];
        (newMilestones[index] as any)[field] = value;
        setMilestones(newMilestones);
    };

    const inputClass = "w-full bg-[#0a0a0a] border border-[#1e1e1e] rounded-xl px-5 py-4 text-white placeholder:text-[#4a4a4a] focus:outline-none focus:border-[#00e676] focus:ring-1 focus:ring-[#00e676] text-sm transition-all";
    const labelClass = "text-sm text-white font-medium mb-2 block";

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                            <div>
                                <label className={labelClass}>Project Type</label>
                                <CustomDropdown
                                    options={PROJECT_TYPES}
                                    value={projectType}
                                    onChange={setProjectType}
                                    searchable={true}
                                    searchPlaceholder="Search project type..."
                                    className={inputClass}
                                />
                                {projectType === "Other" && (
                                    <div className="mt-4 animate-in fade-in slide-in-from-top-2 duration-300">
                                        <label className={labelClass}>Please specify your project type</label>
                                        <input
                                            type="text"
                                            placeholder="e.g. NFT Marketplace, SaaS Tool..."
                                            value={otherProjectType}
                                            onChange={(e) => setOtherProjectType(e.target.value)}
                                            className={inputClass}
                                            autoFocus
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        <div>
                            <label className={`flex justify-between ${labelClass}`}>
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

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
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

                        <div>
                            <label className={labelClass}>Terms & Conditions</label>
                            <textarea
                                value={customTerms}
                                onChange={(e) => setCustomTerms(e.target.value)}
                                placeholder="Enter any specific terms, clauses, or conditions for this contract..."
                                rows={4}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <div className="mt-4">
                            <label className={labelClass}>Upload PRD (PDF, DOCX)</label>
                            <div className="w-full border border-dashed border-[#1e1e1e] rounded-xl bg-[#0a0a0a] flex flex-col items-center justify-center py-12 hover:border-[#00e676]/60 transition-colors cursor-pointer group">
                                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="text-[#4a4a4a] group-hover:text-[#00e676] mb-3 group-hover:-translate-y-1 transition-all">
                                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                    <polyline points="17 8 12 3 7 8" />
                                    <line x1="12" y1="3" x2="12" y2="15" />
                                </svg>
                                <p className="text-white font-medium text-base">Drag & drop PRD here</p>
                                <p className="text-[#4a4a4a] text-sm mt-1">Accepts PDF and DOCX only</p>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
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
                                    placeholder="+1 (555) 000-0000"
                                    className={inputClass}
                                    value={clientPhone}
                                    onChange={(e) => setClientPhone(e.target.value)}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>Client Country</label>
                                <CustomDropdown
                                    options={["United States", "United Kingdom", "India", "Canada", "Australia"]}
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
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">Milestones</h3>
                                <button onClick={addMilestone} className="text-[#00e676] border border-[#00e676]/40 hover:bg-[#00e676]/10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all">
                                    + Add Milestone
                                </button>
                            </div>

                            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrBar">
                                {milestones.map((ms, i) => (
                                    <div key={i} className="bg-[#0a0a0a] border border-[#1e1e1e] p-8 rounded-2xl space-y-6 relative group">
                                        <div className="absolute top-8 right-8 text-[#4a4a4a] font-bold text-lg">#{i + 1}</div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelClass}>Milestone Title</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Wireframes"
                                                    className={inputClass}
                                                    value={ms.title}
                                                    onChange={(e) => updateMilestone(i, "title", e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Due Date</label>
                                                <input
                                                    type="date"
                                                    className={`${inputClass} [color-scheme:dark]`}
                                                    value={ms.due_date}
                                                    onChange={(e) => updateMilestone(i, "due_date", e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelClass}>Amount</label>
                                                <input
                                                    type="number"
                                                    placeholder="0"
                                                    className={inputClass}
                                                    value={ms.amount}
                                                    onChange={(e) => updateMilestone(i, "amount", parseFloat(e.target.value) || 0)}
                                                />
                                            </div>
                                            <div className="flex items-end pb-4">
                                                <label className="flex items-center gap-3 cursor-pointer group select-none">
                                                    <div
                                                        onClick={() => updateMilestone(i, "is_initial_payment", !ms.is_initial_payment)}
                                                        className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${ms.is_initial_payment ? 'border-[#00e676] bg-[#00e676]' : 'border-[#1e1e1e] bg-[#0a0a0a]'}`}
                                                    >
                                                        {ms.is_initial_payment && (
                                                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                                                <polyline points="20 6 9 17 4 12" />
                                                            </svg>
                                                        )}
                                                    </div>
                                                    <span className="text-sm text-gray-400 group-hover:text-white transition-colors">Initial Payment</span>
                                                </label>
                                            </div>
                                        </div>

                                        <div>
                                            <label className={labelClass}>Milestone Description</label>
                                            <input
                                                type="text"
                                                placeholder="Description of deliverables..."
                                                className={inputClass}
                                                value={ms.description}
                                                onChange={(e) => updateMilestone(i, "description", e.target.value)}
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            <div>
                                                <label className={labelClass}>Submission Criteria</label>
                                                <input
                                                    type="text"
                                                    placeholder="e.g. Video URL, GitHub Repo..."
                                                    className={inputClass}
                                                    value={ms.submission_criteria}
                                                    onChange={(e) => updateMilestone(i, "submission_criteria", e.target.value)}
                                                />
                                            </div>
                                            <div>
                                                <label className={labelClass}>Completion Criteria T&C</label>
                                                <input
                                                    type="text"
                                                    placeholder="Terms for completion..."
                                                    className={inputClass}
                                                    value={ms.completion_criteria_tc}
                                                    onChange={(e) => updateMilestone(i, "completion_criteria_tc", e.target.value)}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <hr className="border-[#1e1e1e]" />

                        <div>
                            <label className={labelClass}>Revision Policy</label>
                            <CustomDropdown
                                options={["No Revisions", "1 Round", "2 Rounds", "3 Rounds", "Unlimited"]}
                                value={revisionPolicy}
                                onChange={setRevisionPolicy}
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Out of Scope</label>
                            <textarea
                                value={outOfScope}
                                onChange={(e) => setOutOfScope(e.target.value)}
                                placeholder="List what is explicitly NOT included..."
                                rows={3}
                                className={`${inputClass} resize-none`}
                            />
                        </div>

                        <div>
                            <label className={labelClass}>Core Deliverable</label>
                            <input
                                type="text"
                                value={coreDeliverable}
                                onChange={(e) => setCoreDeliverable(e.target.value)}
                                placeholder="Example : live link/video drive link /figma link"
                                className={inputClass}
                            />
                        </div>

                        <div>
                            <label className={`${labelClass} mb-6`}>Intellectual Property</label>
                            <div className="flex flex-col gap-5">
                                {["Client owns all upon payment", "Shared ownership", "Freelancer retains all rights"].map((opt) => (
                                    <label key={opt} className="flex items-center gap-4 cursor-pointer group">
                                        <div
                                            onClick={() => setIntellectualProperty(opt)}
                                            className="w-6 h-6 rounded-full border border-[#1e1e1e] flex items-center justify-center group-hover:border-[#00e676] transition-colors bg-[#0a0a0a]"
                                        >
                                            {intellectualProperty === opt && <div className="w-3 h-3 bg-[#00e676] rounded-full shadow-[0_0_8px_#00e676]"></div>}
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
                        <div className="max-w-md">
                            <label className={labelClass}>Amount (Base Project Fee)</label>
                            <div className="flex items-center gap-2 w-full">
                                <div className="w-28 shrink-0">
                                    <CustomDropdown
                                        options={["USD", "EUR", "GBP", "INR"]}
                                        value={contractCurrency}
                                        onChange={setContractCurrency}
                                        className={`${inputClass} !h-14 flex items-center`}
                                    />
                                </div>
                                <input
                                    type="number"
                                    placeholder="0.00"
                                    value={contractAmount}
                                    onChange={(e) => setContractAmount(e.target.value)}
                                    className={`${inputClass} h-14 !text-xl font-bold flex-1`}
                                />
                            </div>
                            <p className="mt-2 text-[#4a4a4a] text-xs">This is the base fee. Milestones may add to this total.</p>
                        </div>

                        <div className="bg-[#0a0a0a] border border-[#1e1e1e] rounded-2xl p-8 space-y-5 shadow-2xl shadow-black/40">
                            <p className="text-base font-bold text-white mb-2">Milestone Payment Schedule</p>
                            {milestones.length > 0 ? (
                                milestones.map((ms, idx) => (
                                    <div key={idx} className={`flex justify-between items-center text-sm ${idx > 0 ? 'border-t border-[#1e1e1e] pt-4' : ''}`}>
                                        <span className="text-gray-400">{idx + 1}. {ms.title || "Untitled Milestone"}</span>
                                        <span className="text-white font-bold text-lg">{contractCurrency} {ms.amount ? ms.amount.toLocaleString() : "0.00"}</span>
                                    </div>
                                ))
                            ) : (
                                <p className="text-gray-500 text-sm">No milestones added yet.</p>
                            )}
                        </div>

                        <div className="space-y-4">
                            <label className="flex items-center gap-3 cursor-pointer group select-none">
                                <div
                                    onClick={() => setIsAdvancePayment(!isAdvancePayment)}
                                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isAdvancePayment ? 'border-[#00e676] bg-[#00e676]' : 'border-[#1e1e1e] bg-[#0a0a0a]'}`}
                                >
                                    {isAdvancePayment && (
                                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
                                            <polyline points="20 6 9 17 4 12" />
                                        </svg>
                                    )}
                                </div>
                                <span className="text-base text-white font-bold">Are you taking advance payment?</span>
                            </label>

                            {isAdvancePayment && (
                                <div className="max-w-xs animate-in fade-in slide-in-from-top-2 duration-300 ml-9">
                                    <label className={labelClass}>Advance Amount</label>
                                    <div className="relative">
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#4a4a4a] font-bold">{contractCurrency === "USD" ? "$" : contractCurrency}</span>
                                        <input
                                            type="number"
                                            placeholder="0.00"
                                            value={advanceAmount}
                                            onChange={(e) => setAdvanceAmount(e.target.value)}
                                            className={`${inputClass} pl-10`}
                                        />
                                    </div>
                                </div>
                            )}
                        </div>



                        <div>
                            <label className={labelClass}>Payment Method</label>
                            <div className="flex flex-wrap gap-4">
                                {["Bank Transfer", "PayPal", "Crypto", "Stripe", "Other"].map((m) => (
                                    <button
                                        key={m}
                                        onClick={() => setPaymentMethod(m)}
                                        className={`px-6 py-4 rounded-2xl text-base font-bold transition-all border flex items-center gap-4 ${paymentMethod === m
                                            ? "bg-[#00e676]/10 border-[#00e676] text-[#00e676] shadow-[0_4px_20px_rgba(0,230,118,0.1)]"
                                            : "bg-[#0a0a0a] border-[#1e1e1e] text-[#4a4a4a] hover:border-[#30363d] hover:text-white shadow-sm"
                                            }`}
                                    >
                                        <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all ${paymentMethod === m ? "border-[#00e676] bg-[#00e676]" : "border-[#1e1e1e]"}`}>
                                            {paymentMethod === m && (
                                                <div className="w-2 h-2 bg-black rounded-full"></div>
                                            )}
                                        </div>
                                        {m}
                                    </button>
                                ))}
                            </div>

                            {paymentMethod === "Other" && (
                                <div className="mt-5 animate-in fade-in slide-in-from-top-2 duration-300">
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
                    </div>
                );
            case 5:


                return (
                    <div className="flex flex-col lg:flex-row gap-8 h-[85vh] overflow-hidden animate-in fade-in slide-in-from-bottom-6 duration-700">
                        {/* LEFT: PDF PREVIEW (70%) */}
                        <div className="lg:w-[70%] h-full flex flex-col relative">
                            <div className="absolute -inset-0.5 bg-gradient-to-r from-[#00e676]/10 to-transparent rounded-2xl blur-sm opacity-20"></div>

                            <div className="relative bg-white h-full w-full rounded-xl shadow-2xl overflow-hidden border border-black/5 flex flex-col">
                                {/* Fixed Header for PDF */}
                                <div className="absolute top-6 right-6 z-20">
                                    <div className="bg-[#00e676] text-black text-[10px] font-black px-4 py-1.5 rounded-full shadow-lg border border-black/10 uppercase tracking-widest flex items-center gap-2">
                                        <div className="w-1.5 h-1.5 bg-black rounded-full animate-pulse"></div>
                                        DRAFT
                                    </div>
                                </div>

                                {/* Scrollable PDF Content */}
                                <div className="flex-1 overflow-y-auto px-12 py-16 md:px-24 md:py-24 text-black scroll-smooth custom-scrollbar-light">
                                    {isGenerating ? (
                                        <div className="h-full flex flex-col items-center justify-center space-y-8 py-20">
                                            <div className="relative">
                                                <div className="w-16 h-16 border-4 border-[#00e676]/20 border-t-[#00e676] rounded-full animate-spin"></div>
                                                <div className="absolute inset-0 flex items-center justify-center">
                                                    <div className="w-2 h-2 bg-[#00e676] rounded-full animate-ping"></div>
                                                </div>
                                            </div>
                                            <div className="space-y-4 w-full max-w-xs text-center">
                                                <div className="h-2.5 bg-gray-100 rounded-full animate-pulse"></div>
                                                <div className="h-2.5 bg-gray-100 rounded-full animate-pulse w-5/6 mx-auto"></div>
                                                <p className="text-gray-400 font-medium tracking-wide animate-pulse mt-4">Generating legal contract...</p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="animate-in fade-in zoom-in-95 duration-1000 prose-sm md:prose-base max-w-none font-serif">
                                            <MarkdownRenderer content={contractText} />
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
                                    disabled={isSent || isGenerating}
                                    className={`w-full ${isSent ? 'bg-gray-800 text-gray-400' : 'bg-[#00e676] text-black'} font-bold py-4 rounded-xl text-sm transition-all active:scale-[0.98] flex items-center justify-center gap-2 group`}
                                >
                                    {isSent ? (
                                        <>
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                                            Contract Sent!
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

                                <button className="w-full bg-transparent border border-[#00e676] text-[#00e676] py-4 rounded-xl text-sm font-semibold hover:bg-[#00e676]/10 transition-all flex items-center justify-center gap-2 group">
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="group-hover:translate-y-0.5 transition-transform">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                                        <polyline points="7 10 12 15 17 10" />
                                        <line x1="12" y1="15" x2="12" y2="3" />
                                    </svg>
                                    Download as PDF
                                </button>

                                <button
                                    onClick={() => setContractText("")}
                                    className="w-fit mx-auto mt-4 text-[#4a4a4a] hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest flex items-center gap-2 group"
                                >
                                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className="group-hover:rotate-180 transition-transform duration-500">
                                        <path d="M23 4v6h-6"></path>
                                        <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                    </svg>
                                    Regenerate Draft
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
        <div className="flex flex-col md:flex-row w-full min-h-screen bg-[#0a0a0f] text-white gap-0">
            {/* Left Column - Steps Panel */}
            <div className="w-full md:w-[22%] md:fixed left-0 top-0 md:h-screen bg-[#0a0a0f] pl-12 pr-4 py-12 flex flex-col z-20">


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
                                        ? "w-10 h-10 bg-[#00e676] text-black shadow-[0_0_25px_rgba(0,230,118,0.25)] scale-110"
                                        : isCompleted
                                            ? "w-8 h-8 bg-[#00e676]/20 text-[#00e676]"
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
                                            ? "text-sm text-[#00e676]/60 font-medium"
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
            <div className={`w-full md:w-[78%] md:ml-[22%] ${step === 5 ? 'h-screen overflow-hidden' : 'min-h-screen'} bg-[#0a0a0f] py-8 md:py-12 flex flex-col`}>
                <div className="w-full pl-8 pr-12 md:pl-16 md:pr-24 flex-1 flex flex-col justify-center overflow-hidden">
                    <div className={step < 5 ? "" : "flex-1 overflow-hidden flex flex-col justify-center"}>
                        {renderStep()}

                        {/* Navigation Buttons - Hidden on Step 5 */}
                        {step < 5 && (
                            <div className="mt-20 flex items-center justify-between pt-10 border-t border-[#1e1e1e]">
                                <button
                                    onClick={prevStep}
                                    className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-[#1e1e1e] text-[#4a4a4a] hover:text-white hover:bg-[#1e1e1e]/50 transition-all active:scale-95 ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="bg-[#00e676] text-black font-black text-xs uppercase tracking-widest rounded-2xl px-12 py-4 shadow-[0_10px_30px_rgba(0,230,118,0.2)] hover:bg-[#00ff88] hover:shadow-[0_15px_40px_rgba(0,230,118,0.3)] hover:-translate-y-1 transition-all active:scale-95"
                                >
                                    Continue
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CreateContractForm;
