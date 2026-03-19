import { useState, useEffect } from "react";
import { Plus, X, Upload, Check, AlertCircle } from 'lucide-react';
import { apiClient } from '@/api/client';
import { useParams } from 'react-router-dom';

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

const CreateContractForm = ({ onClose }: { onClose: () => void }) => {
    const { contractId: urlContractId } = useParams<{ contractId: string }>();
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
    const [contractCurrency] = useState("INR");
    const [contractAmount] = useState("");
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

    const [isAdvancePayment, setIsAdvancePayment] = useState(false);
    const [advanceAmount, setAdvanceAmount] = useState("");

    // Backend integration state
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [contractId, setContractId] = useState<number | null>(urlContractId ? Number(urlContractId) : null);
    const [clientReviewComment, setClientReviewComment] = useState("");
    const [isFetchingContract, setIsFetchingContract] = useState(!!urlContractId);
    
    // PRD upload and extraction state
    const [prdFile, setPrdFile] = useState<File | null>(null);
    const [isUploadingPrd, setIsUploadingPrd] = useState(false);

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
                    const matchedType = PROJECT_TYPES.find(t => t.toLowerCase() === data.project_category.toLowerCase());
                    if (matchedType) setProjectType(matchedType);
                    else {
                        setProjectType("Other");
                        setOtherProjectType(data.project_category);
                    }
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

                if (data.advance_payment_required) setIsAdvancePayment(data.advance_payment_required);
                if (data.advance_payment_amount) setAdvanceAmount(data.advance_payment_amount.toString());

                // Set client review comment if pending/rejected
                if (data.client_review_comment) setClientReviewComment(data.client_review_comment);

                if (data.milestones && data.milestones.length > 0) {
                    let coreTotal = data.total_amount;
                    let msList = data.milestones.map((m: any) => {
                        coreTotal -= m.amount;
                        return {
                            id: m.id,
                            title: m.title,
                            description: m.description,
                            amount: m.amount,
                            due_date: m.due_date ? m.due_date.split('T')[0] : "",
                            is_initial_payment: m.order_index === 0,
                            submission_criteria: m.submission_criteria,
                            completion_criteria_tc: m.completion_criteria_tc,
                        };
                    });
                    
                    // The core project total amount might have been pushed into the last milestone
                    const lastMs = msList[msList.length - 1];
                    if (lastMs && lastMs.title === "Core Project Deliverables (Final Payment)" && coreTotal <= 0) {
                        setContractAmount(lastMs.amount.toString());
                        msList.pop(); // remove auto-generated final milestone, it will be re-built on save
                    } else {
                        setContractAmount(Math.max(0, coreTotal).toString());
                    }
                    setMilestones(msList);
                } else if (data.total_amount) {
                    setContractAmount(data.total_amount.toString());
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
    const [generatedLink, setGeneratedLink] = useState("");

    const buildContractPayload = () => {
        const totalBase = parseFloat(contractAmount) || 0;
        const milestonesTotal = milestones.reduce((sum, ms) => sum + (ms.amount || 0), 0);
        const totalAmount = totalBase + milestonesTotal;
        const displayProjectType = projectType === "Other" ? (otherProjectType || projectType) : projectType;

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

        // The Go backend enforces that the sum of all milestones exactly equals the total_amount.
        // If the user specified a base fee, we automatically wrap it into a final milestone.
        if (totalBase > 0) {
            finalMilestones.push({
                title: "Core Project Deliverables (Final Payment)",
                description: "Final payment upon completion of the core project scope.",
                amount: totalBase,
                due_date: toISO(deadline),
                submission_criteria: coreDeliverable || "Standard delivery",
                completion_criteria_tc: "Subject to final review.",
            });
        }

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
            advance_payment_required: isAdvancePayment,
            advance_payment_amount: parseFloat(advanceAmount) || 0,
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
                    const matchedType = PROJECT_TYPES.find(
                        (t) => t.toLowerCase() === extracted.project_type.toLowerCase()
                    );
                    if (matchedType) {
                        setProjectType(matchedType);
                    } else {
                        setProjectType("Other");
                        setOtherProjectType(extracted.project_type);
                    }
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
        } catch (err: any) {
            alert(err?.response?.data?.message || err?.message || "Failed to upload PRD");
        } finally {
            setIsUploadingPrd(false);
        }
    };

    const nextStep = () => {
        if (step === 1 && projectType === "Other" && !otherProjectType.trim()) {
            alert("Please specify your project type.");
            return;
        }
        if (step === 3 && milestones.length === 0) {
            alert("Please add at least one milestone.");
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
                    <div className="space-y-8 animate-in overflow-y-hidden fade-in slide-in-from-bottom-4 duration-500">
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

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
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

                        <div className="mt-4">
                            <label className={labelClass}>Upload PRD (PDF, DOCX)</label>
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
                        {feedbackBanner}
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="text-xl font-bold text-white">Milestones</h3>
                                <button
                                    type="button"
                                    onClick={() => openMilestoneModal(null)}
                                    className="text-[#3cb44f] cursor-pointer border border-[#3cb44f]/40 hover:bg-[#3cb44f]/10 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all"
                                >
                                    + Add Milestone
                                </button>
                            </div>

                            <div className="space-y-6 max-h-[600px] overflow-y-auto pr-2 scrBar">
                                {milestones.map((ms, i) => (
                                    <div key={i} className="bg-[#0a0a0a] border border-[#1e1e1e] p-8 rounded-2xl space-y-4 relative group">
                                        {/* <div className="absolute top-6 right-6 text-[#4a4a4a] font-bold text-lg">#{i + 1}</div> */}
                                        <div className="flex items-center justify-between gap-4">
                                            <div>
                                                <p className="text-xs text-[#4a4a4a] mb-1">Milestone Title</p>
                                                <p className="text-sm font-semibold text-white">
                                                    {ms.title || "Untitled milestone"}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xs text-[#4a4a4a] mb-1">Amount</p>
                                                <p className="text-sm font-bold text-white">
                                                    {contractCurrency} {ms.amount ? ms.amount.toLocaleString() : "0"}
                                                </p>
                                            </div>
                                        </div>

                                            <div>
                                                <p className="text-[#4a4a4a] mb-1">Due Date</p>
                                                <p className="text-white/80">{ms.due_date || "Not set"}</p>
                                            </div>

                                        {ms.description && (
                                            <div>
                                                <p className="text-xs text-[#4a4a4a] mb-1">Description</p>
                                                <p className="text-sm text-gray-300">{ms.description}</p>
                                            </div>
                                        )}

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs text-gray-400">
                                            <div>
                                                <p className="text-[#4a4a4a] mb-1">Submission Criteria</p>
                                                <p className="text-gray-300">{ms.submission_criteria || "—"}</p>
                                            </div>
                                            <div>
                                                <p className="text-[#4a4a4a] mb-1">Completion Criteria T&C</p>
                                                <p className="text-gray-300">{ms.completion_criteria_tc || "—"}</p>
                                            </div>
                                        </div>

                                        <div className="flex justify-end gap-3 pt-3">
                                            <button
                                                type="button"
                                                onClick={() => openMilestoneModal(i)}
                                                className="px-4 py-2 text-xs rounded-xl border border-white/10 text-gray-200 hover:bg-white/5 transition-colors"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => deleteMilestone(i)}
                                                disabled={milestones.length <= 1}
                                                className={`px-4 py-2 text-xs rounded-xl border transition-colors ${
                                                    milestones.length <= 1
                                                        ? "border-[#3b3b3b] text-[#3b3b3b] cursor-not-allowed"
                                                        : "border-red-500/40 text-red-400 hover:bg-red-500/10"
                                                }`}
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <hr className="border-[#1e1e1e] w-[90%] mx-auto -mt-10" />

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
                                            className="w-6 h-6 rounded-full border border-[#1e1e1e] flex items-center justify-center group-hover:border-[#3cb44f] transition-colors bg-[#0a0a0a]"
                                        >
                                            {intellectualProperty === opt && <div className="w-3 h-3 bg-[#3cb44f] rounded-full shadow-[0_0_8px_#3cb44f]"></div>}
                                        </div>
                                        <span className={`transition-colors text-base font-medium ${intellectualProperty === opt ? 'text-white' : 'text-gray-400 group-hover:text-gray-200'}`}>{opt}</span>
                                    </label>
                                ))}
                            </div>
                        </div>

                        {/* Milestone modal */}
                        <AnimatePresence>
                            {isMilestoneModalOpen && (
                                <motion.div
                                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.25, ease: "easeOut" }}
                                >
                                    <motion.div
                                        className="w-full max-w-xl bg-[#050509] border border-[#1e1e1e] rounded-2xl p-6 md:p-8 space-y-6"
                                        initial={{ opacity: 0, y: 20, scale: 0.96 }}
                                        animate={{ opacity: 1, y: 0, scale: 1 }}
                                        exit={{ opacity: 0, y: 12, scale: 0.96 }}
                                        transition={{ duration: 0.28, ease: "easeOut" }}
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
                    </div>
                );
            case 4:
                return (
                    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                        {feedbackBanner}
                        {/* <div className="max-w-md">
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
                        </div> */}

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
                                    className={`w-6 h-6 rounded-md border-2 flex items-center justify-center transition-all ${isAdvancePayment ? 'border-[#3cb44f] bg-[#3cb44f]' : 'border-[#1e1e1e] bg-[#0a0a0a]'}`}
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
                                        <span className="absolute left-5 top-1/2 -translate-y-1/2 text-[#4a4a4a] font-bold">{contractCurrency === "INR" ? "₹" : contractCurrency}</span>
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
                                            ? "bg-[#3cb44f]/10 border-[#3cb44f] text-[#3cb44f] shadow-[0_4px_20px_rgba(0,230,118,0.1)]"
                                            : "bg-[#0a0a0a] border-[#1e1e1e] text-[#4a4a4a] hover:border-[#30363d] hover:text-white shadow-sm"
                                            }`}
                                    >
                                        <div className={`w-5 h-5 border-2 rounded-full flex items-center justify-center transition-all ${paymentMethod === m ? "border-[#3cb44f] bg-[#3cb44f]" : "border-[#1e1e1e]"}`}>
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
                                <div className="flex-1 overflow-y-auto px-12 py-16 md:px-24 md:py-24 text-black scroll-smooth custom-scrollbar-light">
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
                                    onClick={handleSaveDraft}
                                    disabled={isSubmitting}
                                    className="w-full bg-transparent border border-[#3cb44f] text-[#3cb44f] py-4 rounded-xl text-sm font-semibold hover:bg-[#3cb44f]/10 transition-all flex items-center justify-center gap-2 group"
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
            <div className={`w-full md:w-[78%] md:ml-[22%] ${step === 3 ? 'min-h-[92dvh] overflow-y-auto' : 'h-[92dvh] overflow-y-hidden'} bg-[#000] py-8 md:py-12 flex flex-col`}>
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
                                    onClick={prevStep}
                                    className={`px-10 py-4 rounded-2xl font-black text-xs uppercase tracking-widest border-2 border-[#1e1e1e] text-[#4a4a4a] hover:text-white hover:bg-[#1e1e1e]/50 transition-all active:scale-95 ${step === 1 ? 'opacity-0 pointer-events-none' : ''}`}
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={nextStep}
                                    className="bg-[#3cb44f] cursor-pointer text-black font-black text-xs uppercase tracking-widest rounded-2xl px-12 py-4 shadow-[0_10px_30px_rgba(0,230,118,0.2)] active:scale-95"
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
