import React, { useEffect, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "motion/react";
import axios from "axios";
import { cn } from "@/lib/utils";
import { IconBrandGoogle } from "@tabler/icons-react";
import { FaLinkedin } from "react-icons/fa6";
import logo from "../assets/logo.svg";

const SIGNUP_STEPS = ["Create an account", "Set up your profile", "Create your first contract"];

export default function SignUp() {
    const navigate = useNavigate();

    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [isOtpStage, setIsOtpStage] = useState(false);

    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [otp, setOtp] = useState("");

    const [profileHeadline, setProfileHeadline] = useState("");
    const [whatDoYouDo, setWhatDoYouDo] = useState("");
    const [phone, setPhone] = useState("");
    const [userName, setUserName] = useState("");
    const [photo] = useState("");
    const [location, setLocation] = useState("");
    const [experience, setExperience] = useState("");
    const [githubLink] = useState("");
    const [linkedinLink, setLinkedinLink] = useState("");
    const [portfolioLink] = useState("");
    const [instagramLink, setInstagramLink] = useState("");
    const [skills, setSkills] = useState<string[]>([]);
    const [skillInput, setSkillInput] = useState("");

    const [authToken, setAuthToken] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [toastMessage, setToastMessage] = useState<string | null>(null);

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

        if (oauthToken) {
            setAuthToken(oauthToken);
            axios.defaults.headers.common.Authorization = `Bearer ${oauthToken}`;
            if (oauthEmail && !email) {
                setEmail(oauthEmail);
            }
            setIsOtpStage(false);
            setStep(2);
        }
    }, []);

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
        const base = "https://api.defellix.com";
        const url = `${base}/api/v1/auth/oauth/${provider}?role=freelancer`;
        window.location.href = url;
    };

    const handleRegister = async () => {
        try {
            setLoading(true);
            setError(null);
            await axios.post("https://api.defellix.com/api/v1/auth/register", {
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
            const res = await axios.post("https://api.defellix.com/api/v1/auth/verify-email", {
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
            axios.defaults.headers.common.Authorization = `Bearer ${token}`;
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

            await axios.post(
                "https://api.defellix.com/api/v1/users/me/profile",
                {
                    phone,
                    user_name: userName || fullName,
                    what_do_you_do: whatDoYouDo,
                    short_headline: profileHeadline,
                    photo,
                    location,
                    experience,
                    github_link: githubLink,
                    linkedin_link: linkedinLink,
                    portfolio_link: portfolioLink,
                    instagram_link: instagramLink,
                    skills,
                },
                {
                    headers: {
                        Authorization: `Bearer ${authToken}`,
                    },
                },
            );

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
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="fixed top-6 right-6 z-[9999] w-[min(520px,calc(100vw-3rem))] rounded-2xl border border-white/10 bg-black/70 px-4 py-3 text-xs text-white/90 backdrop-blur-md shadow-[0_18px_60px_rgba(0,0,0,0.55)]"
                >
                    {toastMessage}
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
                            <div className="inline-flex items-center">
                                {/* Defellix SVG Logo */}
                                <img src={logo} alt="Defellix" className="w-80 h-auto" />
                            </div>

                            <h1 className="-mt-12 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
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
                                                type="password"
                                                value={password}
                                                onChange={(e: any) => setPassword(e.target.value)}
                                                className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                            />
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
                                        Username
                                    </label>
                                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                        <input
                                            id="user-name"
                                            placeholder="eg. rakesh_dev"
                                            type="text"
                                            value={userName}
                                            onChange={(e: any) => setUserName(e.target.value)}
                                            className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                        />
                                    </div>
                                </LabelInputContainer>
                                <LabelInputContainer>
                                    <label
                                        htmlFor="phone"
                                        className="text-xs sm:text-sm text-white/70"
                                    >
                                        Phone
                                    </label>
                                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                        <input
                                            id="phone"
                                            placeholder="eg. 98765 43210"
                                            type="tel"
                                            value={phone}
                                            onChange={(e: any) => setPhone(e.target.value)}
                                            className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                        />
                                    </div>
                                </LabelInputContainer>
                            </div>

                            <LabelInputContainer>
                                <label
                                    htmlFor="whatDoYouDo"
                                    className="text-xs sm:text-sm text-white/70"
                                >
                                    What do you do
                                </label>
                                <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                    <input
                                        id="whatDoYouDo"
                                        placeholder="eg. Backend Developer, Video Editor, etc."
                                        type="text"
                                        value={whatDoYouDo}
                                        onChange={(e: any) => setWhatDoYouDo(e.target.value)}
                                        className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                    />
                                </div>
                            </LabelInputContainer>

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
                                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                        <input
                                            id="experience"
                                            placeholder="eg. 5+ years"
                                            type="text"
                                            value={experience}
                                            onChange={(e: any) => setExperience(e.target.value)}
                                            className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                                        />
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
                                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                                        <input
                                            id="linkedin"
                                            placeholder="https://linkedin.com/in/username"
                                            type="url"
                                            value={linkedinLink}
                                            onChange={(e: any) => setLinkedinLink(e.target.value)}
                                            className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
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
                                <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none flex items-center">
                                    <input
                                        id="skills"
                                        placeholder="eg. Solidity, React, Rust"
                                        type="text"
                                        value={skillInput}
                                        onChange={(e: any) => setSkillInput(e.target.value)}
                                        className="relative w-full z-10 py-7 pl-4 pr-20 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
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
                                            className="absolute bottom-0 z-10 right-1.5 bottom-1.5 px-4 py-3.5 rounded-xl bg-white text-[11px] sm:text-xs font-semibold text-black hover:bg-[#3cb44f] hover:text-black transition-all duration-150 cursor-pointer"
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
                                disabled={loading}
                                className="group relative mt-6 py-8 flex h-10 sm:h-11 md:h-12 w-full items-center justify-center rounded-2xl bg-white text-[18px] sm:text-sm cursor-pointer font-semibold text-black shadow-[0_18px_60px_rgba(0,0,0,0.8)] transition-transform duration-150 ease-out active:scale-95 disabled:opacity-70"
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
                                onClick={() => navigate("/")}
                                className="group relative flex h-40 w-40 items-center justify-center rounded-3xl border-2 border-dashed border-white/40 bg-white/5 text-sm font-medium text-white/80 hover:border-white hover:bg-white/10 transition-all"
                            >
                                <span>Create first contract</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => navigate("/")}
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



