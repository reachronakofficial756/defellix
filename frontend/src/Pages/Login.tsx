import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "motion/react";
import { apiClient, setSessionToken, API_BASE } from "@/api/client";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { FaLinkedin, FaGoogle } from "react-icons/fa6";
import { Eye, EyeOff, AlertCircle } from "lucide-react";
import logo from "../assets/logo.svg";

export default function LoginFormDemo() {
  const navigate = useNavigate();
  const { setAuthenticated, refetch } = useAuth();
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);

  const handleOAuth = (provider: "google" | "linkedin") => {
    const url = `${API_BASE}/api/v1/auth/oauth/${provider}?role=freelancer`;
    window.location.href = url;
  };

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const toast = params.get("toast");
    if (toast) {
      setToastMessage(toast);
      window.setTimeout(() => setToastMessage(null), 4500);
    }
    const token =
      params.get("access_token") ||
      params.get("token") ||
      params.get("jwt");
    if (!token) return;

    setSessionToken(token);
    if (typeof window !== "undefined") {
      window.localStorage.setItem("access_token", token);
    }

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
          // Fully onboarded → re-fetch context then go to dashboard
          await refetch();
          navigate("/dashboard", { replace: true });
        } else {
          // Auth user exists but has no completed profile → send to step 2 to finish onboarding
          const emailParam = params.get("email") || apiData?.email;
          let redirectUrl = `/signup?step=2&access_token=${token}`;
          if (emailParam) redirectUrl += `&email=${encodeURIComponent(emailParam)}`;
          navigate(redirectUrl, { replace: true });
        }
      } catch {
        // OAuth user but auth record does not exist at all → redirect to step 2
        const emailParam = params.get("email");
        let redirectUrl = `/signup?step=2&access_token=${token}`;
        if (emailParam) redirectUrl += `&email=${encodeURIComponent(emailParam)}`;
        navigate(redirectUrl, { replace: true });
      }
    })();
  }, [navigate, setAuthenticated, refetch]);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setToastMessage("User doesn't exist. Please create your account first!");
    window.setTimeout(() => setToastMessage(null), 4500);
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
            <span className="text-sm font-bold text-white tracking-tight">Access Denied</span>
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
        {/* Left gradient panel (mirrors signup without steps) */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="relative flex-1 px-8 sm:px-10 py-10 sm:py-12 md:py-16 rounded-3xl bg-[radial-gradient(circle_at_top,_#3cb44f_0,_#05030d_55%,_#000000_100%)]"
        >
          <motion.div
            className="pointer-events-none absolute -top-20 -left-10 h-80 w-80 rounded-full bg-[#49d8d7] blur-3xl"
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          />
          <div className="relative z-10 flex h-full flex-col justify-center text-center">
            <div>
              <div className="inline-flex items-center">
                <img src={logo} alt="Defellix" className="w-80 h-auto" />
              </div>

              <h1 className="-mt-12 text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight">
                Welcome Back
              </h1>
              <p className="mt-3 max-w-sm text-sm sm:text-base text-white/70 leading-relaxed text-center mx-auto">
                Log in to continue managing every freelance contract with
                precision, trust, and a premium experience.
              </p>
            </div>
          </div>
        </motion.div>

        {/* Right login form */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: "easeOut", delay: 0.1 }}
          className="relative flex-1 sm:px-9 md:pl-16 py-auto flex flex-col min-h-[94dvh] justify-center overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          <div className="flex items-center justify-center text-center">
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold tracking-tight">
                Login to Account
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-white/60">
                Enter your credentials to access your account.
              </p>
            </div>
          </div>

          <div className="mt-6 flex gap-3 mt-20">
            <button
              type="button"
              onClick={() => handleOAuth("google")}
              className="group relative cursor-pointer flex-1 h-10 sm:h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs sm:text-sm font-medium text-white/80 backdrop-blur hover:bg-white/10 transition-all"
            >
              <span className="flex items-center justify-center gap-2">
                <FaGoogle className="h-4 w-4" />
                Google
              </span>
              <BottomGradient />
            </button>
            <button
              type="button"
              onClick={() => handleOAuth("linkedin")}
              className="group relative cursor-pointer flex-1 h-10 sm:h-11 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-xs sm:text-sm font-medium text-white/80 backdrop-blur hover:bg-white/10 transition-all"
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

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
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
                  placeholder="eg. john@company.com"
                  type="email"
                  className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                />
              </div>
            </LabelInputContainer>

            <LabelInputContainer>
              <label
                htmlFor="password"
                className="text-xs sm:text-sm text-white/70"
              >
                Password
              </label>
              <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                <input
                  id="password"
                  placeholder="Enter your password"
                  type={showPassword ? "text" : "password"}
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
            </LabelInputContainer>

            <div className="flex items-center justify-between text-[11px] sm:text-xs text-white/60">
              <label className="inline-flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 rounded bg-[#5cb870] text-[#5cb870]"
                />
                <span>Remember me</span>
              </label>
              <button
                type="button"
                className="text-white/70 hover:text-[#5cb870] underline-offset-4 hover:underline"
              >
                Forgot password?
              </button>
            </div>

            <button
              type="submit"
              className="group relative mt-10 py-8 flex h-10 sm:h-11 md:h-12 w-full items-center justify-center rounded-2xl bg-white text-[18px] sm:text-sm font-semibold text-black shadow-[0_18px_60px_rgba(0,0,0,0.8)] transition-transform duration-150 ease-out active:scale-95"
            >
              Login &rarr;
              <BottomGradient />
            </button>

            <p className="mt-4 text-center text-[11px] sm:text-xs text-white/60">
              New here?{" "}
              <Link
                to="/signup"
                className="font-medium text-white hover:text-[#5cb870] underline-offset-4 hover:underline"
              >
                Create account
              </Link>
            </p>
          </form>
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