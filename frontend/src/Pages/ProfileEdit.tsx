import { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '@/api/client';
import {
  User, Phone, MapPin, Briefcase, FileText, Link2,
  ArrowLeft, Plus, X,
  Linkedin, Instagram, Github, Globe, Camera,
} from 'lucide-react';

/* ─── Reusable field components ─────────────────────────────────────────── */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-sm text-white/70">{label}</label>
      {children}
    </div>
  );
}

function Input({
  id, placeholder, type = 'text', value, onChange, icon: Icon, disabled,
}: {
  id: string; placeholder: string; type?: string;
  value: string; onChange: (v: string) => void;
  icon?: React.ElementType; disabled?: boolean;
}) {
  return (
    <div className="relative group overflow-hidden rounded-2xl border-none focus-within:ring-0 focus-within:outline-none bg-[#111f14]">
      {Icon && (
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 group-focus-within:text-[#3cb44f] transition-colors z-10 pointer-events-none">
          <Icon size={18} />
        </div>
      )}
      <input
        id={id}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        className={`relative w-full z-10 py-3 sm:py-4 h-11 sm:h-12 bg-transparent border-none text-sm text-white placeholder:text-white/40 focus:ring-0 focus:outline-none transition-all disabled:opacity-50 disabled:cursor-not-allowed ${Icon ? 'pl-11 pr-4' : 'px-4'}`}
      />
    </div>
  );
}

/* ─── Main component ─────────────────────────────────────────────────────── */
export default function ProfileEdit() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  // ── Avatar upload
  const fileRef = useRef<HTMLInputElement>(null);
  const [avatarPreview, setAvatarPreview] = useState<string>('');
  const [photoBase64, setPhotoBase64] = useState<string>('');
  const redirectTimeoutRef = useRef<any>(null);

  // ── Personal Info
  const [userName, setUserName] = useState('');
  const [phone, setPhone] = useState('');
  const [whatDoYouDo, setWhatDoYouDo] = useState('');
  const [headline, setHeadline] = useState('');
  const [location, setLocation] = useState('');
  const [experience, setExperience] = useState('');

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
        const data = res.data?.data || res.data;
        
        // Populate fields mapping response to state
        if (data.profile) {
            setUserName(data.profile.user_name || '');
            setPhone(data.profile.phone || '');
            setWhatDoYouDo(data.profile.what_do_you_do || '');
            setHeadline(data.profile.short_headline || '');
            setLocation(data.profile.location || '');
            setExperience(data.profile.experience || '');
            setGithubLink(data.profile.github_link || '');
            setLinkedinLink(data.profile.linkedin_link || '');
            setPortfolioLink(data.profile.portfolio_link || '');
            setInstagramLink(data.profile.instagram_link || '');
            setSkills(data.profile.skills || []);
            if (data.profile.photo) setAvatarPreview(data.profile.photo);
        } else {
            // fallback if profile data is flattened
            setUserName(data.user_name || data.full_name || '');
            setPhone(data.phone || '');
            setWhatDoYouDo(data.what_do_you_do || '');
            setHeadline(data.short_headline || '');
            setLocation(data.location || '');
            setExperience(data.experience || '');
            setGithubLink(data.github_link || '');
            setLinkedinLink(data.linkedin_link || '');
            setPortfolioLink(data.portfolio_link || '');
            setInstagramLink(data.instagram_link || '');
            setSkills(data.skills || []);
            if (data.photo) setAvatarPreview(data.photo);
        }

      } catch (err) {
        console.error('Failed to fetch profile', err);
      } finally {
        setFetching(false);
      }
    };
    fetchProfile();

    return () => {
      if (redirectTimeoutRef.current) {
        clearTimeout(redirectTimeoutRef.current);
        redirectTimeoutRef.current = null;
      }
    };
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

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Revoke previous blob if it exists
    if (avatarPreview && avatarPreview.startsWith('blob:')) {
      URL.revokeObjectURL(avatarPreview);
    }

    const url = URL.createObjectURL(file);
    setAvatarPreview(url);
    const reader = new FileReader();
    reader.onload = (event) => setPhotoBase64(event.target?.result as string);
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    try {
      setLoading(true);
      setError(null);
      const payload: any = {
        what_do_you_do: whatDoYouDo,
        short_headline: headline,
        bio: "",
        location,
        experience,
        timezone: "",
        github_link: githubLink,
        linkedin_link: linkedinLink,
        portfolio_link: portfolioLink,
        instagram_link: instagramLink,
        company_name: "",
        show_profile: true,
        show_projects: true,
        show_contracts: true,
        phone,
        user_name: userName,
        skills
      };

      if (photoBase64) {
          payload.photo = photoBase64;
      } else if (!avatarPreview) {
          payload.photo = "";
      }

      await apiClient.put('/users/me', payload);
      setSaved(true);
      redirectTimeoutRef.current = setTimeout(() => navigate('/'), 1800);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to save. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
      return (
          <div className="flex justify-center items-center h-full bg-[#0f1117] text-[#3cb44f] font-semibold text-sm">
              Loading profile details...
          </div>
      );
  }

  return (
    <div className="h-full bg-[#0f1117] mt-12 mx-9 overflow-y-auto scrBar">
      <div className="w-full mx-0 px-8 py-10">

        {/* Page title */}
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-white">Edit Profile</h1>
          <p className="text-gray-500 text-sm mt-1">Keep your profile updated so clients know who they're working with.</p>
        </div>

        {/* Entire form in a single layout */}
        <div className="space-y-10 w-full">
          
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
             
            {/* Avatar */}
            <div className="flex items-center gap-5">
              <div
                onClick={() => fileRef.current?.click()}
                className="relative w-24 h-24 rounded-2xl bg-[#111f14] border border-dashed border-white/20 hover:border-[#3cb44f]/50 flex items-center justify-center cursor-pointer overflow-hidden group transition-all"
              >
                {avatarPreview ? (
                  <img src={avatarPreview} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera size={24} className="text-gray-600 group-hover:text-[#3cb44f] transition-colors" />
                )}
                <div className="absolute inset-0 bg-[#0f1117]/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Camera size={20} className="text-white" />
                </div>
              </div>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
              <div>
                <p className="text-white text-base font-semibold">Profile Photo</p>
                <p className="text-gray-500 text-xs mt-0.5">Click to upload · JPG, PNG or WebP</p>
                {avatarPreview && (
                  <button
                    onClick={() => { setAvatarPreview(''); setPhotoBase64(''); }}
                    className="text-[#3cb44f] text-xs mt-2 hover:underline cursor-pointer"
                  >Remove photo</button>
                )}
              </div>
            </div>

            {/* Grid fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-4">
              <Field label="Username">
                <Input id="username" placeholder="e.g. rakesh_dev" value={userName} onChange={setUserName} icon={User} />
              </Field>
              <Field label="Phone">
                <Input id="phone" placeholder="e.g. +91 98765 43210" value={phone} onChange={setPhone} type="tel" icon={Phone} />
              </Field>
              <Field label="Location">
                <Input id="location" placeholder="e.g. Remote · IST" value={location} onChange={setLocation} icon={MapPin} />
              </Field>
              <Field label="Experience">
                <Input id="experience" placeholder="e.g. 5+ years" value={experience} onChange={setExperience} icon={Briefcase} />
              </Field>
            </div>

            <div className="grid grid-cols-1 gap-5">
                <Field label="What do you do">
                <Input id="whatDoYouDo" placeholder="e.g. Backend Developer, Video Editor, UI/UX Designer" value={whatDoYouDo} onChange={setWhatDoYouDo} icon={Briefcase} />
                </Field>

                <Field label="Short headline">
                <Input id="headline" placeholder="e.g. Senior blockchain engineer specialising in L2 payment rails" value={headline} onChange={setHeadline} icon={FileText} />
                </Field>
            </div>

            {/* Social links */}
            <div className="rounded-[24px] space-y-5 mt-8">
              <h3 className="text-white text-base font-semibold flex items-center gap-2 mb-2">
                <Link2 size={16} className="text-[#3cb44f]" />
                Social & Professional Links
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <Field label="LinkedIn">
                    <Input id="linkedin" placeholder="https://linkedin.com/in/username" value={linkedinLink} onChange={setLinkedinLink} icon={Linkedin} type="url" />
                  </Field>
                  <Field label="GitHub">
                    <Input id="github" placeholder="https://github.com/username" value={githubLink} onChange={setGithubLink} icon={Github} type="url" />
                  </Field>
                  <Field label="Portfolio">
                    <Input id="portfolio" placeholder="https://yourportfolio.com" value={portfolioLink} onChange={setPortfolioLink} icon={Globe} type="url" />
                  </Field>
                  <Field label="Instagram">
                    <Input id="instagram" placeholder="https://instagram.com/username" value={instagramLink} onChange={setInstagramLink} icon={Instagram} type="url" />
                  </Field>
              </div>
            </div>

            {/* Skills */}
            <div className="bg-transparent rounded-[24px] space-y-5">
              <h3 className="text-white text-base font-semibold mb-2 flex items-center gap-2">
                <Plus size={16} className="text-[#3cb44f]" />
                Skills
              </h3>
              <div className="flex gap-3 h-11 sm:h-12">
                <input
                  placeholder="e.g. React, Solidity, Figma (Press Enter)"
                  value={skillInput}
                  onChange={e => setSkillInput(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
                  className="flex-1 bg-[#111f14] rounded-2xl border-none px-4 text-sm text-white placeholder:text-white/40 focus:outline-none focus:ring-0 transition-all h-full"
                />
                <button
                  onClick={addSkill}
                  className="px-6 h-full bg-[#3cb44f]/10 border border-[#3cb44f]/30 text-[#3cb44f] rounded-2xl text-sm font-semibold hover:bg-[#3cb44f]/20 transition-all cursor-pointer flex items-center gap-2"
                >
                   Add Skill
                </button>
              </div>
              
              {skills.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-2">
                  {skills.map(skill => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-[#3cb44f]/10 border border-[#3cb44f]/25 text-[#3cb44f] text-xs font-semibold rounded-xl"
                    >
                      {skill}
                      <button
                        onClick={() => setSkills(prev => prev.filter(s => s !== skill))}
                        className="hover:text-white transition-colors cursor-pointer"
                      >
                        <X size={12} strokeWidth={3} />
                      </button>
                    </motion.span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-600 text-sm">No skills added yet. Press Enter or click Add Skill.</p>
              )}
            </div>

            {error && (
              <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/25 rounded-xl text-red-400 text-sm font-medium">
                <X size={16} /> {error}
              </div>
            )}

            {/* Submit Action */}
            <div className="pt-8 pb-10 flex items-center justify-end gap-4">
               <button
                  onClick={handleSave}
                  disabled={loading || saved}
                  className="flex items-center justify-center gap-2 px-8 py-3.5 text-black font-bold text-sm rounded-xl transition-all cursor-pointer disabled:opacity-60"
                  style={{ background: 'linear-gradient(135deg, #3cb44f, #2d8a3e)', boxShadow: '0 0 20px rgba(60,180,79,0.2)' }}
                >
                  {loading ? 'Saving…' : saved ? 'Saved Successfully ✓' : 'Save Profile Changes'}
                </button>
                {saved && (
                    <span className="text-[#3cb44f] font-medium text-sm">Redirecting...</span>
                )}
            </div>

          </motion.div>
        </div>

      </div>
    </div>
  );
}
