import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import {
  ArrowLeft, Plus, X, Camera, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Label Input Container (matching SignUp) ─────────────────────────── */
const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex w-full flex-col space-y-2", className)}>
      {children}
    </div>
  );
};

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function ProfileEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ── Avatar upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [photoUploading, setPhotoUploading] = useState(false);

  // ── Personal Info
  const [fullName, setFullName] = useState('');
  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatDoYouDo, setWhatDoYouDo] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');
  const [companyName, setCompanyName] = useState('');

  // ── Links & Skills
  const [linkedinLink, setLinkedinLink] = useState('');
  const [instagramLink, setInstagramLink] = useState('');
  const [githubLink, setGithubLink] = useState('');
  const [portfolioLink, setPortfolioLink] = useState('');
  const [skills, setSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');

  // ── Fetch Profile
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await apiClient.get('/users/me');
        const apiData = res.data?.data;

        // Handle inconsistent backend response structure
        const profile = apiData?.profile !== undefined ? apiData.profile : apiData;

        if (profile) {
          setFullName(profile.full_name || '');
          setUserName(profile.user_name || '');
          setPhone(profile.phone || '');
          setWhatDoYouDo(profile.what_do_you_do || '');
          setHeadline(profile.short_headline || '');
          setBio(profile.bio || '');
          setLocation(profile.location || '');
          setExperience(profile.experience || '');
          setCompanyName(profile.company_name || '');
          setGithubLink(profile.github_link || '');
          setLinkedinLink(profile.linkedin_link || '');
          setPortfolioLink(profile.portfolio_link || '');
          setInstagramLink(profile.instagram_link || '');
          setSkills(profile.skills || []);
          if (profile.photo) setAvatarPreview(profile.photo);
        }
      } catch (err) {
        console.error('Failed to fetch profile', err);
        setError('Failed to load profile. Please refresh the page.');
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();
  }, []);

  // ── Cleanup Blob URLs
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const addSkill = () => {
    const trimmed = skillInput.trim();
    if (trimmed && !skills.includes(trimmed)) {
      setSkills(prev => [...prev, trimmed]);
    }
    setSkillInput('');
  };

  const removeSkill = (skillToRemove: string) => {
    setSkills(prev => prev.filter(s => s !== skillToRemove));
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Upload to Cloudinary
    uploadProfilePhoto(file);
  };

  const uploadProfilePhoto = async (file: File) => {
    try {
      setPhotoUploading(true);

      // Create preview
      if (avatarPreview && avatarPreview.startsWith('blob:')) {
        URL.revokeObjectURL(avatarPreview);
      }
      const previewUrl = URL.createObjectURL(file);
      setAvatarPreview(previewUrl);

      // Upload to Cloudinary
      const formData = new FormData();
      formData.append('file', file);
      formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload`,
        { method: 'POST', body: formData }
      );

      const data = await response.json();
      
      if (!response.ok) {
        console.error('Cloudinary upload failed:', data);
        throw new Error(data.error?.message || 'Upload failed');
      }
      
      setAvatarPreview(data.secure_url);
    } catch (err) {
      console.error('Photo upload failed:', err);
      setError('Failed to upload photo. Please try again.');
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      setSuccess(false);

      const payload: any = {
        full_name: fullName,
        user_name: userName,
        phone,
        what_do_you_do: whatDoYouDo,
        short_headline: headline,
        bio,
        location,
        experience,
        company_name: companyName,
        github_link: githubLink,
        linkedin_link: linkedinLink,
        portfolio_link: portfolioLink,
        instagram_link: instagramLink,
        skills,
        show_profile: true,
        show_projects: true,
        show_contracts: true,
      };

      // Add photo if available
      if (avatarPreview && !avatarPreview.startsWith('blob:')) {
        payload.photo = avatarPreview;
      }

      await apiClient.put('/users/me', payload);
      setSuccess(true);

      // Redirect after 2 seconds
      setTimeout(() => navigate('/profile'), 2000);
    } catch (err: any) {
      const message = err?.response?.data?.message || err?.message || 'Failed to save profile. Please try again.';
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen w-full bg-black flex items-center justify-center">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-[#3cb44f] font-semibold text-sm flex items-center gap-3"
        >
          <div className="w-5 h-5 border-2 border-[#3cb44f] border-t-transparent rounded-full animate-spin" />
          Loading profile...
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full pt-20 bg-black text-white flex items-center justify-center px-4 sm:px-6 lg:px-10 scrBar">
      {/* Success Toast */}
      {success && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed top-8 right-8 z-[9999] w-[min(480px,calc(100vw-4rem))] rounded-2xl  bg-[#3cb44f]/10 px-5 py-4 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(60,180,79,0.3)] flex items-start gap-4"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[#3cb44f]" />
          <div className="w-8 h-8 rounded-full bg-[#3cb44f]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <CheckCircle2 className="w-4 h-4 text-[#3cb44f]" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-white tracking-tight">Success</span>
            <span className="text-[13px] text-white/80 leading-relaxed font-medium">
              Profile updated successfully! Redirecting...
            </span>
          </div>
        </motion.div>
      )}

      {/* Error Toast */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="fixed top-8 right-8 z-[9999] w-[min(480px,calc(100vw-4rem))] rounded-2xl bg-[#ef5350]/10 px-5 py-4 backdrop-blur-xl shadow-[0_20px_60px_-15px_rgba(239,83,80,0.3)] flex items-start gap-4"
        >
          <div className="absolute top-0 left-0 w-1 h-full bg-[#ef5350]" />
          <div className="w-8 h-8 rounded-full bg-[#ef5350]/20 flex items-center justify-center flex-shrink-0 mt-0.5">
            <AlertCircle className="w-4 h-4 text-[#ef5350]" />
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-sm font-bold text-white tracking-tight">Error</span>
            <span className="text-[13px] text-white/80 leading-relaxed font-medium">
              {error}
            </span>
          </div>
          <button
            onClick={() => setError(null)}
            className="ml-auto text-white/60 hover:text-white transition-colors"
          >
            <X size={16} />
          </button>
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 40 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7, ease: "easeOut" }}
        className="relative w-full max-w-full rounded-3xl overflow-hidden"
      >
        {/* Back button */}
        <button
          onClick={() => navigate('/profile')}
          className="absolute top-6 left-6 z-20 flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
        >
          <ArrowLeft size={16} />
          Back to Profile
        </button>

        {/* Main content */}
        <div className="relative px-8 py-12 sm:py-16 rounded-3xl">
          {/* <motion.div
            className="pointer-events-none absolute -top-20 -right-10 h-80 w-80 rounded-full bg-[#49d8d7] blur-3xl"
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          /> */}

          <div className="relative z-10 max-w-full mx-auto">
            {/* Header */}
            <div className="text-center mb-10">
              <h1 className="text-3xl sm:text-4xl font-bold tracking-tight">
                Edit Your Profile
              </h1>
              <p className="mt-3 text-sm sm:text-base text-white/70 leading-relaxed">
                Keep your profile updated so clients know who they're working with.
              </p>
            </div>

            {/* Form */}
            <div className="space-y-6">
              {/* Avatar Upload */}
              <div className="flex items-center gap-6">
                <div
                  onClick={() => fileRef.current?.click()}
                  className="relative w-28 h-28 rounded-2xl bg-[#141414] border-2 border-dashed border-white/20 hover:border-[#3cb44f]/50 flex items-center justify-center cursor-pointer overflow-hidden group transition-all"
                >
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <Camera size={28} className="text-white/30 group-hover:text-[#3cb44f] transition-colors" />
                  )}
                  {photoUploading && (
                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                      <div className="w-6 h-6 border-2 border-[#3cb44f] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  {!photoUploading && avatarPreview && (
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <Camera size={24} className="text-white" />
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                <div className="flex-1">
                  <p className="text-white text-base font-semibold">Profile Photo</p>
                  <p className="text-white/50 text-xs mt-1">Click to upload · JPG, PNG or WebP · Max 5MB</p>
                  {avatarPreview && !photoUploading && (
                    <button
                      onClick={(e) => { e.stopPropagation(); setAvatarPreview(''); }}
                      className="text-[#3cb44f] text-xs mt-2 hover:underline"
                    >
                      Remove photo
                    </button>
                  )}
                </div>
              </div>

              {/* Personal Info - Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <LabelInputContainer>
                  <label htmlFor="fullname" className="text-xs sm:text-sm text-white/70">
                    Full Name
                  </label>
                  <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                    <input
                      id="fullname"
                      placeholder="eg. Rakesh Kumar"
                      type="text"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                    />
                  </div>
                </LabelInputContainer>

                <LabelInputContainer>
                  <label htmlFor="username" className="text-xs sm:text-sm text-white/70">
                    Username
                  </label>
                  <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                    <input
                      id="username"
                      placeholder="eg. rakesh_dev"
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                    />
                  </div>
                </LabelInputContainer>

                {/* <LabelInputContainer>
                  <label htmlFor="phone" className="text-xs sm:text-sm text-white/70">
                    Phone
                  </label>
                  <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                    <input
                      id="phone"
                      placeholder="eg. +91 98765 43210"
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                    />
                  </div>
                </LabelInputContainer> */}

                <LabelInputContainer>
                  <label htmlFor="location" className="text-xs sm:text-sm text-white/70">
                    Location
                  </label>
                  <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                    <input
                      id="location"
                      placeholder="eg. Mumbai, India"
                      type="text"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                    />
                  </div>
                </LabelInputContainer>

                <LabelInputContainer>
                  <label htmlFor="experience" className="text-xs sm:text-sm text-white/70">
                    Experience
                  </label>
                  <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                    <input
                      id="experience"
                      placeholder="eg. 5+ years"
                      type="text"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                    />
                  </div>
                </LabelInputContainer>

                <LabelInputContainer>
                  <label htmlFor="companyName" className="text-xs sm:text-sm text-white/70">
                    Company Name (Optional)
                  </label>
                  <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                    <input
                      id="companyName"
                      placeholder="eg. Acme Inc."
                      type="text"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.target.value)}
                      className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                    />
                  </div>
                </LabelInputContainer>
              </div>

              {/* Full width fields */}
              <LabelInputContainer>
                <label htmlFor="whatDoYouDo" className="text-xs sm:text-sm text-white/70">
                  What do you do
                </label>
                <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                  <input
                    id="whatDoYouDo"
                    placeholder="eg. Backend Developer, Video Editor, UI/UX Designer"
                    type="text"
                    value={whatDoYouDo}
                    onChange={(e) => setWhatDoYouDo(e.target.value)}
                    className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                  />
                </div>
              </LabelInputContainer>

              <LabelInputContainer>
                <label htmlFor="headline" className="text-xs sm:text-sm text-white/70">
                  Short Headline
                </label>
                <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                  <input
                    id="headline"
                    placeholder="eg. Senior blockchain engineer specialising in L2 payment rails"
                    type="text"
                    value={headline}
                    onChange={(e) => setHeadline(e.target.value)}
                    className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                  />
                </div>
              </LabelInputContainer>

              <LabelInputContainer>
                <label htmlFor="bio" className="text-xs sm:text-sm text-white/70">
                  Bio
                </label>
                <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                  <textarea
                    id="bio"
                    placeholder="Tell us about yourself, your expertise, and what makes you unique..."
                    value={bio}
                    onChange={(e) => setBio(e.target.value)}
                    rows={4}
                    className="relative w-full z-10 py-3 px-4 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none resize-none"
                  />
                </div>
              </LabelInputContainer>

              <LabelInputContainer>
                <label htmlFor="companyName" className="text-xs sm:text-sm text-white/70">
                  Company Name (Optional)
                </label>
                <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                  <input
                    id="companyName"
                    placeholder="eg. Acme Inc."
                    type="text"
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                  />
                </div>
              </LabelInputContainer>

              {/* Social Links Section */}
              <div className="pt-6">
                <h3 className="text-white text-base font-semibold mb-4">
                  Social & Professional Links
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <LabelInputContainer>
                    <label htmlFor="linkedin" className="text-xs sm:text-sm text-white/70">
                      LinkedIn
                    </label>
                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                      <input
                        id="linkedin"
                        placeholder="https://linkedin.com/in/username"
                        type="url"
                        value={linkedinLink}
                        onChange={(e) => setLinkedinLink(e.target.value)}
                        className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </LabelInputContainer>

                  <LabelInputContainer>
                    <label htmlFor="github" className="text-xs sm:text-sm text-white/70">
                      GitHub
                    </label>
                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                      <input
                        id="github"
                        placeholder="https://github.com/username"
                        type="url"
                        value={githubLink}
                        onChange={(e) => setGithubLink(e.target.value)}
                        className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </LabelInputContainer>

                  <LabelInputContainer>
                    <label htmlFor="portfolio" className="text-xs sm:text-sm text-white/70">
                      Portfolio
                    </label>
                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                      <input
                        id="portfolio"
                        placeholder="https://yourportfolio.com"
                        type="url"
                        value={portfolioLink}
                        onChange={(e) => setPortfolioLink(e.target.value)}
                        className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </LabelInputContainer>

                  <LabelInputContainer>
                    <label htmlFor="instagram" className="text-xs sm:text-sm text-white/70">
                      Instagram
                    </label>
                    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none">
                      <input
                        id="instagram"
                        placeholder="https://instagram.com/username"
                        type="url"
                        value={instagramLink}
                        onChange={(e) => setInstagramLink(e.target.value)}
                        className="relative w-full z-10 py-7 px-4 h-9 sm:h-10 md:h-11 bg-[#141414] text-xs rounded-2xl border-none sm:text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </LabelInputContainer>
                </div>
              </div>

              {/* Skills Section */}
              <div className="pt-6">
                <h3 className="text-white text-base font-semibold mb-4">
                  Skills & Expertise
                </h3>
                <div className="flex gap-3">
                  <input
                    placeholder="eg. React, Solidity, Figma (Press Enter)"
                    value={skillInput}
                    onChange={(e) => setSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addSkill();
                      }
                    }}
                    className="flex-1 bg-[#141414] rounded-2xl border-none px-4 h-11 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-0"
                  />
                  <button
                    type="button"
                    onClick={addSkill}
                    className="px-6 h-11 bg-[#3cb44f]/10 border border-[#3cb44f]/30 text-[#3cb44f] rounded-2xl text-sm font-semibold hover:bg-[#3cb44f]/20 transition-all flex items-center gap-2"
                  >
                    <Plus size={16} />
                    Add
                  </button>
                </div>

                {skills.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {skills.map((skill) => (
                      <motion.span
                        key={skill}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3cb44f]/10 border border-[#3cb44f]/25 text-[#3cb44f] text-xs font-semibold rounded-xl"
                      >
                        {skill}
                        <button
                          type="button"
                          onClick={() => removeSkill(skill)}
                          className="hover:text-white transition-colors"
                        >
                          <X size={12} strokeWidth={3} />
                        </button>
                      </motion.span>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-8 flex items-center justify-end gap-4">
                <button
                  type="button"
                  onClick={() => navigate('/profile')}
                  className="px-6 py-3 rounded-xl bg-white/5 border border-white/10 text-white/70 hover:text-white hover:bg-white/10 transition-all text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={loading || success || photoUploading}
                  className="relative px-8 py-3 rounded-xl text-black font-bold text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{
                    background: loading || success || photoUploading ? '#3cb44f80' : 'linear-gradient(135deg, #3cb44f, #2d8a3e)',
                    boxShadow: '0 0 20px rgba(60,180,79,0.2)'
                  }}
                >
                  {loading ? 'Saving...' : success ? 'Saved ✓' : 'Save Changes'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
