import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import { apiClient, setSessionToken, API_BASE } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { IconBrandGoogle } from "@tabler/icons-react";
import { FaLinkedin } from "react-icons/fa6";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import logo from "../assets/logo.svg";
import { FREELANCER_JOB_TITLES } from "@/constants/jobTitles";

/** Same list as contract form "Other" project type picker */
const JOB_TITLES: string[] = FREELANCER_JOB_TITLES;

const SIGNUP_STEPS = ["Create an account", "Set up your profile", "Create your first contract"];

const EXPERIENCE_OPTIONS = [
    "0-1 years",
    "1-3 years",
    "3-5 years",
    "5-7 years",
    "7-10 years",
    "10+ years",
    "Student / Early learner",
    "Freelancer · 0-2 years",
    "Freelancer · 2-5 years",
    "Freelancer · 5+ years"
];


const SKILLS_SUGGESTIONS = [
    // Frontend Core
    "React", "Next.js", "Vue.js", "Nuxt.js", "Angular", "Svelte",
    "JavaScript", "TypeScript", "HTML", "CSS", "Sass", "Less",
    "Tailwind CSS", "Bootstrap", "Material UI", "Chakra UI", "ShadCN UI",

    // Advanced Frontend
    "Three.js", "WebGL", "GSAP", "Framer Motion",
    "Micro Frontends", "Progressive Web Apps (PWA)",
    "Accessibility (a11y)", "Cross-browser Compatibility",

    // State & Data Fetching
    "Redux", "Zustand", "Recoil", "MobX",
    "React Query", "TanStack Query", "SWR",
    "Apollo Client", "GraphQL",

    // Backend Frameworks
    "Node.js", "Express.js", "NestJS",
    "Django", "Flask", "FastAPI",
    "Ruby on Rails", "Spring Boot", "ASP.NET Core",

    // APIs & Architecture
    "REST APIs", "GraphQL APIs", "gRPC",
    "Microservices Architecture", "Serverless Architecture",
    "Event-driven Architecture", "API Design",

    // Programming Languages
    "Python", "Go", "Rust", "Java", "C#", "C++",
    "PHP", "Kotlin", "Swift", "Dart", "Elixir",

    // Databases
    "PostgreSQL", "MySQL", "MongoDB", "Redis",
    "SQLite", "MariaDB", "Firebase", "Supabase",
    "DynamoDB", "Cassandra", "Neo4j",

    // DevOps & Infra
    "Docker", "Kubernetes", "Helm",
    "CI/CD", "GitHub Actions", "GitLab CI",
    "Jenkins", "CircleCI",
    "AWS", "Azure", "Google Cloud Platform",
    "Vercel", "Netlify", "Cloudflare",
    "Terraform", "Pulumi", "Ansible",

    // Observability & Performance
    "Prometheus", "Grafana", "ELK Stack",
    "Datadog", "New Relic",
    "Performance Optimization", "Load Testing",

    // Web3 / Blockchain
    "Solidity", "Ether.js", "Web3.js",
    "Hardhat", "Foundry", "OpenZeppelin",
    "IPFS", "The Graph", "Chainlink",
    "Smart Contract Security",

    // Mobile Development
    "React Native", "Flutter", "SwiftUI",
    "Kotlin Multiplatform", "Ionic",

    // AI / ML / Data
    "Machine Learning", "Deep Learning",
    "Natural Language Processing (NLP)",
    "Computer Vision",
    "TensorFlow", "PyTorch", "Keras",
    "Scikit-learn", "Pandas", "NumPy",
    "Data Visualization", "Feature Engineering",
    "Model Deployment", "MLOps",
    "Power BI", "Tableau",
    "BigQuery", "Snowflake", "Redshift",
    "Apache Spark", "Hadoop",
    "LLMs", "Prompt Engineering",
    "LangChain", "LlamaIndex",
    "Vector Databases", "RAG (Retrieval-Augmented Generation)",

    // Design Tools
    "Figma", "Adobe XD", "Sketch",
    "Adobe Photoshop", "Adobe Illustrator",
    "Canva", "Framer", "Webflow",
    "UI Prototyping", "Wireframing",
    "Design Systems", "User Research",

    // 3D / Motion / Video
    "Adobe Premiere Pro", "After Effects",
    "DaVinci Resolve", "Final Cut Pro",
    "CapCut", "Blender", "Cinema 4D",
    "3D Modeling", "Motion Graphics",
    "Color Grading", "Video Storytelling",

    // Writing & Content
    "Copywriting", "SEO Writing",
    "Technical Writing", "Blog Writing",
    "Editing", "Proofreading",
    "Storytelling", "Scriptwriting",
    "Content Repurposing",

    // Marketing
    "SEO", "Technical SEO",
    "On-page SEO", "Off-page SEO",
    "Keyword Research", "Link Building",
    "Google Ads", "Meta Ads", "TikTok Ads",
    "Email Marketing", "Cold Emailing",
    "Marketing Automation",
    "Content Strategy",
    "Social Media Marketing",
    "Influencer Marketing",
    "Analytics", "Conversion Rate Optimization",
    "Funnel Building", "Landing Page Optimization",

    // Business & Product
    "Product Management", "Agile", "Scrum",
    "Kanban", "JIRA", "Notion",
    "Market Research", "User Interviews",
    "Business Analysis", "Financial Modeling",
    "A/B Testing", "Roadmapping",

    // Sales & CRM
    "Lead Generation", "Sales Funnels",
    "CRM Tools", "HubSpot", "Salesforce",
    "Client Outreach", "Negotiation",

    // No-code / Automation
    "Zapier", "Make (Integromat)",
    "Airtable", "Notion APIs",
    "Bubble", "Glide", "Retool",
    "n8n", "Automation Workflows",

    // Cybersecurity
    "Penetration Testing", "Ethical Hacking",
    "Network Security", "OWASP",
    "Vulnerability Assessment",
    "Security Auditing",

    // Testing & QA
    "Unit Testing", "Integration Testing",
    "End-to-End Testing", "Cypress",
    "Playwright", "Selenium",
    "Test Automation",

    // Version Control & Systems
    "Git", "GitHub", "GitLab", "Bitbucket",
    "Linux", "Bash Scripting",
    "Shell Scripting",

    // Localization & Language
    "Translation", "Localization",
    "Subtitling", "Transcription",

    // Creator Economy
    "YouTube SEO", "Thumbnail Design",
    "Short-form Content Strategy",
    "Podcast Editing",
    "Personal Branding",

    // E-commerce
    "Shopify", "WooCommerce",
    "Product Listing Optimization",
    "Amazon SEO", "Dropshipping",
    "Conversion Optimization",

    // Freelancing-specific
    "Proposal Writing", "Upwork Bidding",
    "Client Communication",
    "Time Tracking", "Scope Management",

    // Soft Skills
    "Communication", "Time Management",
    "Client Management", "Problem Solving",
    "Critical Thinking", "Adaptability",
    "Presentation Skills", "Negotiation",
    "Leadership", "Collaboration"
];

export default function SignUp() {
    const navigate = useNavigate();
    const { setAuthenticated, setProfileComplete, refetch } = useAuth();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isOtpStage, setIsOtpStage] = useState(false);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [otp, setOtp] = useState("");

    const [profileHeadline, setProfileHeadline] = useState("");
    const [whatDoYouDo, setWhatDoYouDo] = useState("");
    const [phone, setPhone] = useState("");
    const [userName, setUserName] = useState("");
    const [photo] = useState("");
    const [location, setLocation] = useState("");
    const [experience, setExperience] = useState("");
    const [companyName, setCompanyName] = useState("");
    const [githubLink] = useState("");
    const [linkedinLink, setLinkedinLink] = useState("");
    const [portfolioLink] = useState("");
    const [instagramLink, setInstagramLink] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState("");
    const [skillSuggestion, setSkillSuggestion] = useState("");

    const [whatDoYouDoSuggestions, setWhatDoYouDoSuggestions] = useState<string[]>([]);
    const [showJobSuggestions, setShowJobSuggestions] = useState(false);

    const [isUserNameAvailable, setIsUserNameAvailable] = useState<boolean | null>(null);
    const [isCheckingUserName, setIsCheckingUserName] = useState(false);

    const [authToken, setAuthToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

    const [experienceSuggestions, setExperienceSuggestions] = useState<string[]>([]);
    const [showExperienceSuggestions, setShowExperienceSuggestions] = useState(false);


    // Filter job titles based on input
    useEffect(() => {
        if (!whatDoYouDo.trim()) {
            setWhatDoYouDoSuggestions([]);
            return;
        }
        const filtered = JOB_TITLES.filter(job =>
            job.toLowerCase().includes(whatDoYouDo.toLowerCase())
        );
        setWhatDoYouDoSuggestions(filtered);
    }, [whatDoYouDo]);

    // Handle skill suggestion ghost text
    useEffect(() => {
        if (!skillInput.trim()) {
            setSkillSuggestion("");
            return;
        }
        const match = SKILLS_SUGGESTIONS.find(s =>
            s.toLowerCase().startsWith(skillInput.toLowerCase())
        );
        if (match && match.toLowerCase() !== skillInput.toLowerCase()) {
            setSkillSuggestion(match);
        } else {
            setSkillSuggestion("");
        }
    }, [skillInput]);

    useEffect(() => {
        if (!experience.trim()) {
            setExperienceSuggestions([]);
            return;
        }

        const filtered = EXPERIENCE_OPTIONS.filter(opt =>
            opt.toLowerCase().includes(experience.toLowerCase())
        );
        setExperienceSuggestions(filtered);
    }, [experience]);



    // Handle username availability check with debounce
    useEffect(() => {
        if (!userName || userName.trim().length < 3) {
            setIsUserNameAvailable(null);
            setIsCheckingUserName(false);
            return;
        }

        const timer = setTimeout(async () => {
            try {
                setIsCheckingUserName(true);
                // We use the existing public profile endpoint as a workaround for production.
                // 200 OK means the profile exists (taken), 404 means it's available.
                await apiClient.get(`/public/profile/${userName}`);
                setIsUserNameAvailable(false); // Found a profile, so it's taken
            } catch (err: any) {
                if (err.response?.status === 404) {
                    setIsUserNameAvailable(true); // Profile not found, so it's available
                } else {
                    // Fallback for production server issues (502, CORS, etc.)
                    // We don't want to block the user if the check service is down.
                    console.warn("Username check failed (server error or CORS), allowing progress as fallback", err);
                    setIsUserNameAvailable(true);
                }
            } finally {
                setIsCheckingUserName(false);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [userName]);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const toast = params.get("toast");
        if (toast) {
            setToastMessage(toast);
            window.setTimeout(() => setToastMessage(null), 6500);
        }
        const oauthToken =
            params.get("access_token") ||
            params.get("token") ||
            params.get("jwt");
        const oauthEmail = params.get("email");

        if (!oauthToken) return;

        // Store token in session + localStorage for this tab
        setAuthToken(oauthToken);
        setSessionToken(oauthToken);
        if (typeof window !== "undefined") {
            window.localStorage.setItem("access_token", oauthToken);
        }
        if (oauthEmail && !email) {
            setEmail(oauthEmail);
        }

        // Check profile completion FIRST before setting step from URL
        // If user already exists AND has a completed profile, skip signup and go to dashboard.
        // If /users/me fails OR profile is incomplete, stay on signup step 2.
        (async () => {
            try {
                const res = await apiClient.get("/users/me");
                const apiData = res.data?.data || res.data;

                // Backend response structure:
                // - Profile exists: apiData IS the User object directly
                // - Profile doesn't exist: apiData = {profile: null, user_id: X}
                const profile = apiData?.profile !== undefined ? apiData.profile : apiData;

                // Profile is complete ONLY if user_name exists (required field)
                const isProfileComplete = profile && profile !== null && profile.user_name;

                if (isProfileComplete) {
                    setAuthenticated(true);
                    setProfileComplete(true);
                    // Fully onboarded already → re-fetch auth state then go to dashboard
                    await refetch();

                    setTimeout(() => {
                        navigate("/dashboard", { replace: true });
                    }, 50);
                } else {
                    // Auth user but no completed profile → stay on step 2
                    setIsOtpStage(false);
                    setStep(2);
                }
            } catch {
                setIsOtpStage(false);
                setStep(2);
            }
        })();
    }, [email, navigate, setAuthenticated, setProfileComplete, refetch]);

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        if (step === 1) {
            if (!isOtpStage) {
                void handleRegister();
            } else {
                void handleVerifyOtp();
            }
            return;
        }

        if (step === 2) {
            void handleProfileSetup();
        }
    };

    const handleOAuth = (provider: "google" | "linkedin") => {
        const url = `${API_BASE}/api/v1/auth/oauth/${provider}?role=freelancer`;
        window.location.href = url;
    };

    const handleRegister = async () => {
        try {
            setLoading(true);
            setError(null);
            await apiClient.post("/auth/register", {
                email,
                password,
                full_name: fullName,
            });
            setIsOtpStage(true);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Unable to start registration. Please try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleVerifyOtp = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await apiClient.post("/auth/verify-email", {
                email,
                otp,
            });

            const token =
                res?.data?.data?.access_token ||
                res?.data?.token ||
                res?.data?.access_token ||
                res?.data?.accessToken ||
                null;

            if (!token) {
                setError("Verification succeeded but no token was returned.");
                return;
            }

            setAuthToken(token);
            setSessionToken(token);
            if (typeof window !== "undefined") {
                window.localStorage.setItem("access_token", token);
            }
            setStep(2);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Invalid or expired OTP. Please try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    const handleProfileSetup = async () => {
        try {
            setLoading(true);
            setError(null);

            if (!authToken) {
                setError("Missing authentication token. Please complete email verification again.");
                setStep(1);
                setIsOtpStage(true);
                return;
            }

            // Username is required - cannot proceed without it
            if (!userName || userName.trim() === "") {
                setError("Username is required. Please enter a username to continue.");
                setLoading(false);
                return;
            }

            const profileRes = await apiClient.post("/users/me/profile", {
                phone,
                user_name: userName,
                what_do_you_do: whatDoYouDo,
                short_headline: profileHeadline,
                photo,
                location,
                experience,
                company_name: companyName,
                github_link: githubLink,
                linkedin_link: linkedinLink ? `https://linkedin.com/in/${linkedinLink}` : "",
                portfolio_link: portfolioLink,
                instagram_link: instagramLink ? `https://instagram.com/${instagramLink}` : "",
                skills,
            });

            // For OAuth users the backend returns a new access_token alongside the profile.
            // Response shape: { data: { profile: {...}, access_token: "..." } }
            // We must store it immediately so that the subsequent refetch() and all future
            // API calls use the real JWT (user_id != 0) instead of the temporary one.
            const newToken: string | undefined =
                profileRes.data?.data?.access_token ?? profileRes.data?.access_token;
            if (newToken) {
                setSessionToken(newToken);
                window.localStorage.setItem("access_token", newToken);
            }

            // Refresh auth context so isProfileComplete becomes true with the correct user
            await refetch();
            setStep(3);
        } catch (err: any) {
            const message =
                err?.response?.data?.message ||
                err?.message ||
                "Unable to save profile. Please try again.";
            setError(message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen w-full bg-black text-white flex items-center justify-center px-4 sm:px-6 lg:px-10 scrBar">
            {toastMessage && (
                <motion.div
                    initial={{ opacity: 0, y: -20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    className="fixed top-8 right-8 z-[9999] w-[min(480px,calc(100vw-4rem))] rounded-2xl border border-[#ef5350]/30 bg-[#ef5350]/10 px-5 py-4 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(239,83,80,0.3)] flex items-start gap-4 overflow-hidden"
                >
                    <div className="absolute top-0 left-0 w-1 h-full bg-[#ef5350]" />
                    <div className="w-8 h-8 rounded-full bg-[#ef5350]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <AlertCircle className="w-4 h-4 text-[#ef5350]" />
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-sm font-bold text-white tracking-tight">Notice</span>
                        <span className="text-[13px] text-white/80 leading-relaxed font-medium">
                            {toastMessage}
                        </span>
                    </div>
                </motion.div>
            )}
            <motion.div
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.7, ease: "easeOut" }}
                className="relative w-[96dvw] rounded-3xl h-[94dvh] overflow-hidden flex flex-col md:flex-row"
            >
                {/* Left gradient / steps panel */}
                <motion.div
                    initial={{ opacity: 0, x: -40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="relative flex-1 px-8 sm:px-10 py-10 sm:py-12 md:py-16 rounded-3xl bg-[radial-gradient(circle_at_top,_#3cb44f_0,_#05030d_55%,_#000000_100%)] "
                >
                    <motion.div
                        className="pointer-events-none absolute -top-20 -left-10 h-80 w-80  rounded-full bg-[#49d8d7] blur-3xl"
                        animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
                        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                    />

                    <div className="relative z-10 flex h-full flex-col justify-center text-center  mt-28">
                        <div>
                            <div className="inline-flex items-center"> {/* Defellix SVG Logo */}
                                <img src={logo} alt="Defellix" className="w-96 h-auto" />
                            </div>

                            <h1 className="-mt-20 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
                                Get Started with Us
                            </h1>
                            <p className="mt-3 max-w-sm text-sm sm:text-base text-white/70 leading-relaxed text-center justify-center mx-auto">
                                Complete these simple steps to register your account and unlock
                                a trusted way to manage every freelance contract.
                            </p>
                        </div>

                        <div className="mt-10 space-y-3 sm:space-y-4 px-20">
                            {SIGNUP_STEPS.map((label, index) => {
                                const isActive = index === step - 1;
                                return (
                                    <motion.div
                                        key={label}
                                        initial={{ opacity: 0, y: 16 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{
                                            duration: 0.5,
                                            delay: 0.3 + index * 0.12,
                                            ease: "easeOut",
                                        }}
                                        className={cn(
                                            "flex items-center gap-3 rounded-2xl px-4 py-3 sm:px-5 sm:py-3.5 text-sm sm:text-base backdrop-blur",
                                            isActive
                                                ? "border-white bg-white text-black shadow-[0_18px_60px_rgba(0,0,0,0.7)]"
                                                : "border-white/10 bg-white/5 text-white/70"
                                        )}
                                    >
                                        <div
                                            className={cn(
                                                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-semibold",
                                                isActive
                                                    ? "bg-black text-white"
                                                    : "bg-white/10 text-white/80"
                                            )}
                                        >
                                            {index + 1}
                                        </div>
                                        <span className={isActive ? "font-semibold" : ""}>{label}</span>
                                    </motion.div>
                                );
                            })}
                        </div>
                    </div>
                </motion.div>

                {/* Right form panel */}
                <motion.div
                    initial={{ opacity: 0, x: 40 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
                    className="relative flex-1 sm:px-9 md:pl-16 py-auto flex flex-col min-h-[94dvh] justify-center overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                >
                    <div className={`flex items-center justify-center text-center`}>
                        <div>
                            <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                                {step === 1 && (!isOtpStage ? "Sign Up Account" : "Verify your email")}
                                {step === 2 && "Set up your profile"}
                                {step === 3 && "You're ready to go"}
                            </h2>
                            <p className="mt-1 text-xs sm:text-sm text-white/60">
                                {step === 1 &&
                                    (!isOtpStage
                                        ? "Enter your personal details to create your account."
                                        : "We’ve sent an OTP to your email. Enter it below to create your account.")}
                                {step === 2 &&
                                    "Tell us a bit more about you so clients see who they’re working with."}
                                {step === 3 &&
                                    "Create your first contract or skip and explore your dashboard."}
                            </p>
                        </div>
                    </div>

                    {step === 1 && (
                        <>
                            <div className="mt-6 flex gap-3 mt-20">
                                <button
                                    type="button"
                                    onClick={() => handleOAuth("google")}
                                    className="group cursor-pointer relative flex-1 sm:h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs sm:text-sm font-medium text-white/80 backdrop-blur hover:bg-white/10 transition-all"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <IconBrandGoogle className="h-4 w-4" />
                                        Google
                                    </span>
                                    <BottomGradient />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleOAuth("linkedin")}
                                    className="group cursor-pointer relative flex-1 h-10 sm:h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs sm:text-sm font-medium text-white/80 backdrop-blur hover:bg-white/10 transition-all"
                                >
                                    <span className="flex items-center justify-center gap-2">
                                        <FaLinkedin className="h-4 w-4" />
                                        LinkedIn
                                    </span>
                                    <BottomGradient />
                                </button>
                            </div>

                            <div className="mt-6 flex items-center gap-3 text-[11px] sm:text-xs text-white/50">
                                <span className="h-px flex-1 bg-white/10" />
                                <span>Or</span>
                                <span className="h-px flex-1 bg-white/10" />
                            </div>
                        </>
                    )}

                    {error && (
                        <p className="mt-4 text-center text-[11px] sm:text-xs text-red-400">
                            {error}
                        </p>
                    )}

                    {step === 1 && (
                        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
                            {!isOtpStage && (
                                <motion.div
                                    key="details"
                                    initial={{ opacity: 0, y: 16, scale: 0.98 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.45, ease: "easeOut" }}
                                >
                                    <LabelInputContainer>
                                        <label
                                            htmlFor="fullname"
                                            className="text-xs sm:text-sm text-white/70"
                                        >
                                            Full name
                                        </label>
                                        <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                            <input
                                                id="fullname"
                                                placeholder="eg. Rakesh Kumar"
                                                type="text"
                                                value={fullName}
                                                onChange={(e: any) => setFullName(e.target.value)}
                                                className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                            />
                                        </div>
                                    </LabelInputContainer>

                                    <LabelInputContainer>
                                        <label
                                            htmlFor="email"
                                            className="text-xs sm:text-sm mt-4 text-white/70"
                                        >
                                            Email
                                        </label>
                                        <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                            <input
                                                id="email"
                                                placeholder="eg. john@company.com"
                                                type="email"
                                                value={email}
                                                onChange={(e: any) => setEmail(e.target.value)}
                                                className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                            />
                                        </div>
                                    </LabelInputContainer>

                                    <LabelInputContainer>
                                        <label
                                            htmlFor="password"
                                            className="text-xs sm:text-sm mt-4 text-white/70"
                                        >
                                            Password
                                        </label>
                                        <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                            <input
                                                id="password"
                                                placeholder="Enter your password"
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={(e: any) => setPassword(e.target.value)}
                                                className="relative w-full z-10 py-7 px-4 pr-12 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword((prev) => !prev)}
                                                className="absolute right-4 top-1/2 -translate-y-1/2 z-20 text-white/40 hover:text-white/70 transition-colors"
                                            >
                                                {showPassword ? (
                                                    <EyeOff className="h-5 w-5" />
                                                ) : (
                                                    <Eye className="h-5 w-5" />
                                                )}
                                            </button>
                                        </div>
                                        <p className="mt-1 ml-2 text-[10px] sm:text-xs text-white/40">
                                            Must be at least 8 characters.
                                        </p>
                                    </LabelInputContainer>
                                </motion.div>
                            )}

                            {isOtpStage && (
                                <motion.div
                                    key="otp"
                                    initial={{ opacity: 0, y: 16, scale: 1.03 }}
                                    animate={{ opacity: 1, y: 0, scale: 1 }}
                                    transition={{ duration: 0.45, ease: "easeOut" }}
                                >
                                    <LabelInputContainer>
                                        <label
                                            htmlFor="email"
                                            className="text-xs sm:text-sm text-white/70"
                                        >
                                            Email
                                        </label>
                                        <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                            <input
                                                id="email"
                                                type="email"
                                                value={email}
                                                disabled
                                                className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border border-white/10 sm:text-sm text-white/70 placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                            />
                                        </div>
                                    </LabelInputContainer>

                                    <LabelInputContainer>
                                        <label
                                            htmlFor="otp"
                                            className="text-xs sm:text-sm text-white/70 mt-4"
                                        >
                                            One-time password
                                        </label>
                                        <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                            <input
                                                id="otp"
                                                placeholder="Enter the 6-digit code"
                                                type="text"
                                                inputMode="numeric"
                                                pattern="\d{6}"
                                                maxLength={6}
                                                value={otp}
                                                onChange={(e: any) => {
                                                    const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 6);
                                                    setOtp(onlyDigits);
                                                }}
                                                className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs tracking-[0.4em] text-center rounded-xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                            />
                                        </div>
                                    </LabelInputContainer>
                                </motion.div>
                            )}

                            <button
                                type="submit"
                                disabled={loading}
                                className="group relative mt-10 py-8 flex h-10 sm:h-11 md:h-12 w-full items-center justify-center rounded-2xl bg-white text-[18px] sm:text-sm cursor-pointer font-semibold text-black shadow-[0_18px_60px_rgba(0,0,0,0.8)] transition-transform duration-150 ease-out active:scale-95 disabled:opacity-70"
                            >
                                {loading
                                    ? "Please wait..."
                                    : !isOtpStage
                                        ? "Get Started →"
                                        : "Create account →"}
                                <BottomGradient />
                            </button>

                            <p className="mt-4 text-center text-[11px] sm:text-xs text-white/60">
                                Already have an account?{" "}
                                <Link
                                    to="/login"
                                    className="font-medium text-white hover:text-[#5cb870] underline-offset-4 hover:underline"
                                >
                                    Log in
                                </Link>
                            </p>
                        </form>
                    )}

                    {step === 2 && (
                        <form className="mt-10 space-y-5" onSubmit={handleSubmit}>

                            {/* <LabelInputContainer>
                                <label
                                    htmlFor="photo"
                                    className="text-xs sm:text-sm text-white/70"
                                >
                                    Profile photo
                                </label>
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full border border-white/15 bg-[#141414] overflow-hidden flex items-center justify-center text-[10px] text-white/50">
                                        {photo ? (
                                            <img
                                                src={photo}
                                                alt="Profile preview"
                                                className="h-full w-full object-cover"
                                            />
                                        ) : (
                                            <span>Preview</span>
                                        )}
                                    </div>
                                    <div className="flex-1 space-y-2">
                                        <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                            <input
                                                id="photo"
                                                placeholder="Image URL (optional)"
                                                type="url"
                                                value={photo}
                                                onChange={(e: any) => setPhoto(e.target.value)}
                                                className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                            />
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <label className="inline-flex items-center">
                                                <input
                                                    type="file"
                                                    accept="image/*"
                                                    className="hidden"
                                                    onChange={(e: any) => {
                                                        const file = e.target.files?.[0];
                                                        if (!file) return;
                                                        void uploadProfilePhoto(file);
                                                    }}
                                                />
                                                <span className="cursor-pointer rounded-xl bg-white text-[11px] sm:text-xs font-semibold text-black px-4 py-2 hover:bg-[#3cb44f] hover:text-black transition-colors">
                                                    {photoUploading ? "Uploading..." : "Upload photo"}
                                                </span>
                                            </label>
                                            {photo && !photoUploading && (
                                                <span className="text-[10px] sm:text-xs text-white/40">
                                                    Stored securely via Cloudinary
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </LabelInputContainer> */}

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* <LabelInputContainer>
                                    <label
                                        htmlFor="profile-fullname"
                                        className="text-xs sm:text-sm text-white/70"
                                    >
                                        Full name
                                    </label>
                                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                        <input
                                            id="profile-fullname"
                                            placeholder="eg. Rakesh Kumar"
                                            type="text"
                                            value={fullName}
                                            onChange={(e: any) => setFullName(e.target.value)}
                                            className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                        />
                                    </div>
                                </LabelInputContainer> */}

                                <LabelInputContainer>
                                    <label
                                        htmlFor="user-name"
                                        className="text-xs sm:text-sm text-white/70"
                                    >
                                        Username <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                        <input
                                            id="user-name"
                                            placeholder="eg. official_defellix"
                                            type="text"
                                            value={userName}
                                            onChange={(e: any) => setUserName(e.target.value)}
                                            required
                                            className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                        />
                                        {isCheckingUserName && (
                                            <div className="absolute right-4 top-1/2 -translate-y-1/2 z-20">
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#3cb44f] border-t-transparent" />
                                            </div>
                                        )}
                                    </div>
                                    {userName.length >= 3 && isUserNameAvailable !== null && !isCheckingUserName && (
                                        <motion.p
                                            initial={{ opacity: 0, y: -10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            className={cn(
                                                "mt-1.5 text-[11px] font-medium px-1",
                                                isUserNameAvailable ? "text-[#3cb44f]" : "text-red-400"
                                            )}
                                        >
                                            {isUserNameAvailable ? "✓ Username available" : "✕ Username not available"}
                                        </motion.p>
                                    )}
                                </LabelInputContainer>
                                <LabelInputContainer>
                                    <label
                                        htmlFor="phone"
                                        className="text-xs sm:text-sm text-white/70"
                                    >
                                        Phone <span className="text-red-400">*</span>
                                    </label>
                                    <div className="relative group overflow-hidden rounded-2xl border-none flex items-center bg-[#141414] h-9 sm:h-10 md:h-14">
                                        <span className="pl-4 text-[14px] sm:text-md text-white/90 select-none whitespace-nowrap">
                                            +91
                                        </span>
                                        <input
                                            id="phone"
                                            placeholder="98765 43210"
                                            type="tel"
                                            value={phone}
                                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                                const onlyDigits = e.target.value.replace(/\D/g, "").slice(0, 10);
                                                setPhone(onlyDigits);
                                            }}

                                            className="relative w-full z-10 py-7 px-2 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none"
                                        />

                                    </div>
                                </LabelInputContainer>
                            </div>

                            <LabelInputContainer>
                                <label
                                    htmlFor="headline"
                                    className="text-xs sm:text-sm text-white/70"
                                >
                                    Short headline
                                </label>
                                <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                    <input
                                        id="headline"
                                        placeholder="eg. Senior blockchain engineer specialising in L2 payment rails"
                                        type="text"
                                        value={profileHeadline}
                                        onChange={(e: any) => setProfileHeadline(e.target.value)}
                                        className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                    />
                                </div>
                            </LabelInputContainer>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <LabelInputContainer>
                                    <label
                                        htmlFor="companyName"
                                        className="text-xs sm:text-sm text-white/70"
                                    >
                                        Company Name (Optional)
                                    </label>
                                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                        <input
                                            id="companyName"
                                            placeholder="eg. Acme Inc."
                                            type="text"
                                            value={companyName}
                                            onChange={(e: any) => setCompanyName(e.target.value)}
                                            className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                        />
                                    </div>
                                </LabelInputContainer>
                                <LabelInputContainer className="relative">
                                    <label
                                        htmlFor="whatDoYouDo"
                                        className="text-xs sm:text-sm text-white/70"
                                    >
                                        What do you do
                                    </label>
                                    <div className="relative group rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                        <input
                                            id="whatDoYouDo"
                                            placeholder="eg. Backend Developer, Video Editor, etc."
                                            type="text"
                                            value={whatDoYouDo}
                                            onChange={(e: any) => setWhatDoYouDo(e.target.value)}
                                            onFocus={() => setShowJobSuggestions(true)}
                                            onBlur={() => {
                                                // close only after click on an option can fire
                                                setTimeout(() => setShowJobSuggestions(false), 150);
                                            }}
                                            autoComplete="off"
                                            className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                        />

                                        {showJobSuggestions && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-[#141414]/95 backdrop-blur-xl p-2 shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                            >
                                                {whatDoYouDoSuggestions.length > 0 ? (
                                                    whatDoYouDoSuggestions.map((job) => (
                                                        <button
                                                            key={job}
                                                            type="button"
                                                            onClick={() => {
                                                                setWhatDoYouDo(job);
                                                                setShowJobSuggestions(false);
                                                            }}
                                                            className="w-full cursor-pointer rounded-xl px-4 py-3 text-left text-xs sm:text-sm text-white/70 hover:bg-white/5 hover:text-[#3cb44f] transition-all"
                                                        >
                                                            {job}
                                                        </button>
                                                    ))
                                                ) : (
                                                    // optional: show all jobs when nothing typed yet
                                                    JOB_TITLES.slice(0, 20).map((job) => (
                                                        <button
                                                            key={job}
                                                            type="button"
                                                            onClick={() => {
                                                                setWhatDoYouDo(job);
                                                                setShowJobSuggestions(false);
                                                            }}
                                                            className="w-full cursor-pointer rounded-xl px-4 py-3 text-left text-xs sm:text-sm text-white/70 hover:bg-white/5 hover:text-[#3cb44f] transition-all"
                                                        >
                                                            {job}
                                                        </button>
                                                    ))
                                                )}
                                            </motion.div>
                                        )}
                                    </div>
                                </LabelInputContainer>

                                <LabelInputContainer>
                                    <label
                                        htmlFor="location"
                                        className="text-xs sm:text-sm text-white/70"
                                    >
                                        Location
                                    </label>
                                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                        <input
                                            id="location"
                                            placeholder="eg. Remote · IST"
                                            type="text"
                                            value={location}
                                            onChange={(e: any) => setLocation(e.target.value)}
                                            className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                        />
                                    </div>
                                </LabelInputContainer>

                                <LabelInputContainer>
                                    <label
                                        htmlFor="experience"
                                        className="text-xs sm:text-sm text-white/70"
                                    >
                                        Experience
                                    </label>
                                    <div className="relative group rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                        <input
                                            id="experience"
                                            placeholder="eg. 3-5 years"
                                            type="text"
                                            value={experience}
                                            onChange={(e: any) => setExperience(e.target.value)}
                                            onFocus={() => setShowExperienceSuggestions(true)}
                                            onBlur={() => {
                                                setTimeout(() => setShowExperienceSuggestions(false), 150);
                                            }}
                                            autoComplete="off"
                                            className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                        />

                                        {showExperienceSuggestions && (
                                            <motion.div
                                                initial={{ opacity: 0, y: -10 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, y: -10 }}
                                                className="absolute left-0 right-0 top-[calc(100%+8px)] z-[100] max-h-60 overflow-y-auto rounded-2xl border border-white/10 bg-[#141414]/95 backdrop-blur-xl p-2 shadow-2xl [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                                            >
                                                {experienceSuggestions.length > 0 ? (
                                                    experienceSuggestions.map((opt) => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => {
                                                                setExperience(opt);
                                                                setShowExperienceSuggestions(false);
                                                            }}
                                                            className="w-full cursor-pointer rounded-xl px-4 py-3 text-left text-xs sm:text-sm text-white/70 hover:bg-white/5 hover:text-[#3cb44f] transition-all"
                                                        >
                                                            {opt}
                                                        </button>
                                                    ))
                                                ) : (
                                                    // optional: show default experience options initially
                                                    EXPERIENCE_OPTIONS.map((opt) => (
                                                        <button
                                                            key={opt}
                                                            type="button"
                                                            onClick={() => {
                                                                setExperience(opt);
                                                                setShowExperienceSuggestions(false);
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
                                </LabelInputContainer>


                            </div>


                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {/* <LabelInputContainer>
                                    <label
                                        htmlFor="github"
                                        className="text-xs sm:text-sm text-white/70"
                                    >
                                        GitHub
                                    </label>
                                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                        <input
                                            id="github"
                                            placeholder="https://github.com/username"
                                            type="url"
                                            value={githubLink}
                                            onChange={(e: any) => setGithubLink(e.target.value)}
                                            className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                        />
                                    </div>
                                </LabelInputContainer> */}

                                <LabelInputContainer>
                                    <label
                                        htmlFor="linkedin"
                                        className="text-xs sm:text-sm text-white/70"
                                    >
                                        LinkedIn
                                    </label>
                                    <div className="relative group overflow-hidden rounded-2xl border-none flex items-center bg-[#141414] h-9 sm:h-10 md:h-14">
                                        <span className="pl-4 text-[14px] sm:text-md text-white/90 select-none whitespace-nowrap">
                                            https://linkedin.com/in/
                                        </span>
                                        <input
                                            id="linkedin"
                                            placeholder="username"
                                            type="text"
                                            value={linkedinLink}
                                            onChange={(e: any) => {
                                                let val = e.target.value;
                                                // Handle full URLs and remove varied prefixes (https, www, etc.)
                                                val = val.replace(/^(https?:\/\/)?(www\.)?linkedin\.com\/in\//i, "");
                                                // Keep only the first segment as the username
                                                val = val.split('/')[0];
                                                setLinkedinLink(val);
                                            }}
                                            className="w-full h-full bg-transparent text-xs sm:text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none px-1"
                                        />
                                    </div>
                                </LabelInputContainer>
                                {/* <LabelInputContainer>
                                    <label
                                        htmlFor="portfolio"
                                        className="text-xs sm:text-sm text-white/70"
                                    >
                                        Portfolio
                                    </label>
                                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                        <input
                                            id="portfolio"
                                            placeholder="https://portfolio.xyz"
                                            type="url"
                                            value={portfolioLink}
                                            onChange={(e: any) => setPortfolioLink(e.target.value)}
                                            className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                        />
                                    </div>
                                </LabelInputContainer> */}
                                <LabelInputContainer>
                                    <label
                                        htmlFor="instagram"
                                        className="text-xs sm:text-sm text-white/70"
                                    >
                                        Instagram
                                    </label>
                                    <div className="relative group overflow-hidden rounded-2xl border-none flex items-center bg-[#141414] h-9 sm:h-10 md:h-14">
                                        <span className="pl-4 text-[14px] sm:text-md text-white/90 select-none whitespace-nowrap">
                                            https://instagram.com/
                                        </span>
                                        <input
                                            id="instagram"
                                            placeholder="username"
                                            type="text"
                                            value={instagramLink}
                                            onChange={(e: any) => {
                                                let val = e.target.value;
                                                // Handle full URLs and remove varied prefixes (https, www, etc.)
                                                val = val.replace(/^(https?:\/\/)?(www\.)?instagram\.com\//i, "");
                                                // Keep only the first segment as the username
                                                val = val.split('/')[0];
                                                setInstagramLink(val);
                                            }}
                                            className="w-full h-full bg-transparent text-xs sm:text-sm text-white placeholder:text-white/20 focus:ring-0 focus:outline-none px-1"
                                        />
                                    </div>
                                </LabelInputContainer>
                            </div>

                            {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                

                                <LabelInputContainer>
                                    <label
                                        htmlFor="instagram"
                                        className="text-xs sm:text-sm text-white/70"
                                    >
                                        Instagram
                                    </label>
                                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                        <input
                                            id="instagram"
                                            placeholder="https://instagram.com/username"
                                            type="url"
                                            value={instagramLink}
                                            onChange={(e: any) => setInstagramLink(e.target.value)}
                                            className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                        />
                                    </div>
                                </LabelInputContainer>
                            </div> */}

                            <LabelInputContainer>
                                <label
                                    htmlFor="skills"
                                    className="text-xs sm:text-sm text-white/70"
                                >
                                    Skills
                                </label>
                                <div className="relative group rounded-2xl border-none focus-within:ring-0 focus-within:outline-none flex items-center bg-[#141414]">
                                    {/* Ghost Suggestion Text */}
                                    {skillSuggestion && (
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 z-0 pointer-events-none text-white/20 text-xs sm:text-sm flex items-center truncate">
                                            {skillSuggestion}
                                            <span className="ml-2 text-[10px] text-[#3cb44f]/60 font-medium whitespace-nowrap opacity-0 group-focus-within:opacity-100 transition-opacity">
                                                (Press Tab to autocomplete)
                                            </span>
                                        </div>
                                    )}

                                    <input
                                        id="skills"
                                        placeholder="eg. Solidity, React, Rust"
                                        type="text"
                                        value={skillInput}
                                        onChange={(e: any) => setSkillInput(e.target.value)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Tab' && skillSuggestion) {
                                                e.preventDefault();
                                                setSkillInput(skillSuggestion);
                                                setSkillSuggestion("");
                                            } else if (e.key === 'Enter') {
                                                e.preventDefault();
                                                const value = skillInput.trim();
                                                if (value && !skills.includes(value)) {
                                                    setSkills([...skills, value]);
                                                    setSkillInput("");
                                                }
                                            }
                                        }}
                                        className="relative w-full z-10 py-7 pl-4 pr-32 h-9 sm:h-10 md:h-11 bg-transparent text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                        autoComplete="off"
                                    />

                                    {skillInput.trim().length > 0 && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const value = skillInput.trim();
                                                if (!value) return;
                                                if (skills.includes(value)) return;
                                                setSkills([...skills, value]);
                                                setSkillInput("");
                                            }}
                                            className="absolute bottom-1.5 z-20 right-1.5 px-4 py-3.5 rounded-xl bg-white text-[11px] sm:text-xs font-semibold text-black hover:bg-[#3cb44f] hover:text-black transition-all duration-150 cursor-pointer"
                                        >
                                            + Add
                                        </button>
                                    )}
                                </div>
                                {skills.length > 0 && (
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {skills.map((s) => (
                                            <span
                                                key={s}
                                                className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 pl-3 pr-2 py-2 text-[11px] sm:text-xs text-white/80"
                                            >
                                                <span>{s}</span>
                                                <button
                                                    type="button"
                                                    onClick={() =>
                                                        setSkills((prev) => prev.filter((skill) => skill !== s))
                                                    }
                                                    className="ml-0.5 flex h-4 w-4 items-center cursor-pointer justify-center rounded-full bg-white/10 text-[9px] hover:bg-white/30"
                                                >
                                                    ✕
                                                </button>
                                            </span>
                                        ))}
                                    </div>
                                )}
                            </LabelInputContainer>

                            <button
                                type="submit"
                                disabled={loading || !userName || userName.trim() === "" || isCheckingUserName || isUserNameAvailable === false}
                                className="group relative mt-6 py-8 flex h-10 sm:h-11 md:h-12 w-full items-center justify-center rounded-2xl bg-white text-[18px] sm:text-sm cursor-pointer font-semibold text-black shadow-[0_18px_60px_rgba(0,0,0,0.8)] transition-transform duration-150 ease-out active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                            >
                                {loading ? "Saving..." : "Continue →"}
                                <BottomGradient />
                            </button>
                        </form>
                    )}

                    {step === 3 && (
                        <div className="mt-24 flex flex-col items-center gap-6">
                            <button
                                type="button"
                                onClick={async () => {
                                    // Ensure auth context is fully updated before navigation
                                    await refetch();
                                    navigate("/contract");
                                }}
                                className="group relative flex h-40 w-40 items-center justify-center rounded-3xl border-2 border-dashed border-white/40 bg-white/5 text-sm font-medium text-white/80 hover:border-white hover:bg-white/10 transition-all"
                            >
                                <span>Create first contract</span>
                            </button>
                            <button
                                type="button"
                                onClick={async () => {
                                    // Ensure auth context is fully updated before navigation
                                    await refetch();
                                    navigate("/dashboard");
                                }}
                                className="text-xs sm:text-sm text-white/60 hover:text-white underline-offset-4 hover:underline"
                            >
                                Skip and continue to dashboard
                            </button>
                        </div>
                    )}
                </motion.div>
            </motion.div>
        </div>
    );
}

const BottomGradient = () => {
    return (
        <>
            <span className="absolute inset-x-0 -bottom-px block h-px w-full bg-linear-to-r from-transparent via-[#3cb44f] to-transparent opacity-0 transition duration-500 group-hover:opacity-100" />
            <span className="absolute inset-x-10 -bottom-px mx-auto block h-px w-1/2 bg-linear-to-r from-transparent via-[#3cb44f] to-transparent opacity-0 blur-sm transition duration-500 group-hover:opacity-100" />
        </>
    );
};

const LabelInputContainer = ({
    children,
    className,
}: {
    children: React.ReactNode;
    className?: string;
}) => {
    return (
        <div className={cn("flex w-full flex-col space-y-1.5", className)}>
            {children}
        </div>
    );
};



