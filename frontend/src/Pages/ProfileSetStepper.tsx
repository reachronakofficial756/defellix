import { useState, useRef } from 'react';
import { X, Upload, Plus, ChevronDown, Check, Globe, Linkedin, Twitter, Github, Calendar, MapPin, Link as LinkIcon } from 'lucide-react';
import Sidebar from '@/components/Sidebar';
import { Input } from '@/ui/input';
import { Label } from '@/ui/label';
import { useNavigate } from 'react-router-dom';
import Card from '@/ui/UploadCard';

interface SocialLink {
  id: number;
  type: 'portfolio' | 'linkedin' | 'twitter' | 'github' | 'website' | 'other';
  label: string;
  url: string;
  description?: string;
  visibility: 'public' | 'connections' | 'hidden';
}

function ProfileSetStepper() {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounterRef = useRef(0);

  // Step 1: Basic Profile
  const [profilePicture, setProfilePicture] = useState<string>('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('');
  const [experience, setExperience] = useState('');
  const [location, setLocation] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [date, setDate] = useState('');
  const [countryCode, setCountryCode] = useState('+1');
  const [shortBio, setShortBio] = useState('');

  // Step 2: Work & Links
  const [workEmail, setWorkEmail] = useState('');
  const [website, setWebsite] = useState('');
  const [linkedinUrl, setLinkedinUrl] = useState('');
  const [twitterUrl, setTwitterUrl] = useState('');
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>([
    { id: 1, type: 'portfolio', label: 'Portfolio', url: 'alexmorgen.design', description: 'Primary showcase of recent case studies.', visibility: 'public' },
  ]);

  // Step 3: Skills & Availability
  const [topSkills, setTopSkills] = useState<string[]>([]);
  const [skillInput, setSkillInput] = useState('');
  const [coreHours, setCoreHours] = useState('');

  // Step 4: Contracts
  interface Contract {
    id: number;
    name: string;
    role: string;
    liveLink: string;
    duration: string;
    teamSize: string;
    techStack: string[];
    summary: string;
    highlights: string[];
    images: string[];
    githubLink: string;
  }
  const [contracts, setContracts] = useState<Contract[]>([]);
  const [currentContractIndex, setCurrentContractIndex] = useState(0);
  const [techInput, setTechInput] = useState('');
  const availableTechStack = ['React', 'TypeScript', 'Node.js', 'Next.js', 'PostgreSQL', 'TailwindCSS', 'Figma', 'Storybook', 'Vue.js', 'Angular', 'Python', 'Django', 'MongoDB', 'AWS', 'Docker'];

  // Add Link Modal State
  const [isAddLinkModalOpen, setIsAddLinkModalOpen] = useState(false);
  const [newLink, setNewLink] = useState({
    type: 'other' as SocialLink['type'],
    label: '',
    url: '',
    description: '',
    visibility: 'public' as SocialLink['visibility']
  });

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    // Save all profile data to localStorage
    const profileData = {
      // Step 1
      profilePicture,
      fullName,
      role,
      date,
      location,
      experience,
      phoneNumber,
      countryCode,
      shortBio,
      // Step 2
      workEmail,
      website,
      linkedinUrl,
      twitterUrl,
      socialLinks,
      // Step 3
      topSkills,
      coreHours,
      // Step 4
      contracts
    };

    localStorage.setItem('userProfile', JSON.stringify(profileData));
    console.log('Profile saved to localStorage');
    navigate('/profile');
  };

  const handleImageUpload = (imageDataUrl: string) => {
    setProfilePicture(imageDataUrl);
  };

  // Helper function to process image files
  const processImageFiles = async (files: File[]): Promise<string[]> => {
    const newImages: string[] = [];
    for (const file of files) {
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        alert(`${file.name} must be 5MB or less`);
        continue;
      }
      const reader = new FileReader();
      await new Promise((resolve) => {
        reader.onload = () => {
          if (typeof reader.result === "string") {
            newImages.push(reader.result);
          }
          resolve(null);
        };
        reader.readAsDataURL(file);
      });
    }
    return newImages;
  };

  // Handle contract images upload (from file input or drag & drop)
  const handleContractImagesUpload = async (files: File[]) => {
    if (contracts[currentContractIndex].images.length + files.length > 5) {
      alert("Maximum 5 images allowed");
      return;
    }
    const newImages = await processImageFiles(files);
    if (newImages.length > 0) {
      const updated = [...contracts];
      updated[currentContractIndex].images = [
        ...updated[currentContractIndex].images,
        ...newImages,
      ].slice(0, 5);
      setContracts(updated);
    }
  };

  const addSkill = () => {
    if (skillInput.trim() && !topSkills.includes(skillInput.trim()) && topSkills.length < 6) {
      setTopSkills([...topSkills, skillInput.trim()]);
      setSkillInput('');
    }
  };

  const removeSkill = (skill: string) => {
    setTopSkills(topSkills.filter(s => s !== skill));
  };

  const openAddLinkModal = () => {
    setNewLink({
      type: 'other',
      label: '',
      url: '',
      description: '',
      visibility: 'public'
    });
    setIsAddLinkModalOpen(true);
  };

  const closeAddLinkModal = () => {
    setIsAddLinkModalOpen(false);
    setNewLink({
      type: 'other',
      label: '',
      url: '',
      description: '',
      visibility: 'public'
    });
  };

  const handleSaveLink = () => {
    if (newLink.url.trim() && newLink.label.trim()) {
      const linkToAdd: SocialLink = {
        id: Date.now(),
        type: newLink.type,
        label: newLink.label,
        url: newLink.url,
        description: newLink.description || undefined,
        visibility: newLink.visibility
      };
      setSocialLinks([...socialLinks, linkToAdd]);
      closeAddLinkModal();
    }
  };

  const getLinkTypeLabel = (type: SocialLink['type']) => {
    switch (type) {
      case 'portfolio':
        return 'Portfolio';
      case 'linkedin':
        return 'LinkedIn';
      case 'twitter':
        return 'Twitter / X';
      case 'github':
        return 'GitHub';
      case 'website':
        return 'Website';
      default:
        return 'Other';
    }
  };

  const removeSocialLink = (id: number) => {
    setSocialLinks(socialLinks.filter(link => link.id !== id));
  };

  const getLinkIcon = (type: SocialLink['type']) => {
    switch (type) {
      case 'portfolio':
      case 'website':
        return <Globe className="w-5 h-5" />;
      case 'linkedin':
        return <Linkedin className="w-5 h-5" />;
      case 'twitter':
        return <Twitter className="w-5 h-5" />;
      case 'github':
        return <Github className="w-5 h-5" />;
      default:
        return <LinkIcon className="w-5 h-5" />;
    }
  };

  return (
    <div className="flex h-screen w-full bg-[#fbf9f1]">
      <Sidebar />

      <div className="flex-1 overflow-y-auto scrBar">
        <div className="max-w-5xl mx-auto p-6 lg:p-8">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-6">
            <div className="flex items-center justify-between mb-2">
              <div className="w-full">
                <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 mb-2 sm:mb-4">Set up your profile</h1>
                <p className="text-xs sm:text-sm text-gray-600 mt-1">
                  {currentStep === 1 && "Share your role, work, skills and availability so teammates can collaborate with you."}
                  {currentStep === 2 && "Step 2 focuses on your day-to-day work, social links and featured contracts."}
                  {currentStep === 3 && "Step 3 is about how you like to work and when people can best collaborate with you."}
                  {currentStep === 4 && "Add your standout contracts so people can explore your work in depth."}
                </p>
              </div>
            </div>

            {/* Stepper Navigation - CoreUI Style */}
            <div className="mt-4 sm:mt-6 overflow-x-auto">
              <div className="relative min-w-[600px] sm:min-w-0">
                {/* Progress Line */}
                <div className="absolute top-6 left-8 sm:left-12 right-8 sm:right-12 h-0.5 bg-gray-200" style={{ margin: '0 8%' }}>
                  <div
                    className="h-full bg-teal-500 transition-all duration-300 ease-in-out"
                    style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                  />
                </div>

                {/* Steps */}
                <ol className="flex items-center justify-between relative px-2">
                  {[
                    { num: 1, label: 'Basic details' },
                    { num: 2, label: 'Work & links' },
                    { num: 3, label: 'Skills & availability' },
                    { num: 4, label: 'Contracts' }
                  ].map((step) => (
                    <li key={step.num} className="flex flex-col items-center flex-1 min-w-0">
                      <button
                        type="button"
                        onClick={() => setCurrentStep(step.num)}
                        className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center font-semibold text-base sm:text-lg transition-all duration-300 transform hover:scale-110 relative z-10 ${currentStep >= step.num
                          ? 'bg-teal-500 text-white shadow-lg'
                          : 'bg-white text-gray-400 border-2 border-gray-300'
                          }`}
                      >
                        {currentStep > step.num ? (
                          <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        ) : (
                          step.num
                        )}
                      </button>
                      <span className={`mt-1 sm:mt-2 text-xs sm:text-sm font-medium transition-colors text-center px-1 ${currentStep >= step.num ? 'text-teal-600' : 'text-gray-500'
                        }`}>
                        <span className="hidden sm:inline">{step.label}</span>
                        <span className="sm:hidden">{step.label.split(' ')[0]}</span>
                      </span>
                    </li>
                  ))}
                </ol>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
            {/* Step 1: Basic Profile */}
            {currentStep === 1 && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Basic profile</h2>
                  <p className="text-sm text-gray-600 mb-6">This information appears at the top of your public profile.</p>
                </div>

                {/* Profile Picture */}
                <div className="flex justify-center gap-4 sm:gap-6">
                  <div className="shrink-0">
                    <Card onImageUpload={handleImageUpload} />
                    <p className="text-xs text-gray-500 mt-5 text-center sm:text-left">PNG or JPG up to 5MB. Square images work best.</p>
                  </div>
                </div>


                <div>
                  <div className="flex-1 space-y-8">

                    <Label htmlFor="fullname" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Full name <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="fullname"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  <Label htmlFor="location" className="text-sm mt-2 font-medium text-gray-700 mb-1.5 block">
                    Location <span className="text-red-500">*</span>
                  </Label>
                  <div className="relative">
                    <Input
                      id="location"
                      value={location}
                      onChange={(e) => setLocation(e.target.value)}
                      className="w-full pr-10 text-gray-900 placeholder:text-gray-400"
                    />
                    <MapPin className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                  </div>


                </div>

                <div className="grid grid-cols-1 -mt-2.5 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="role" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Role <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full text-gray-900 placeholder:text-gray-400"
                    />
                  </div>

                  <div>
                    <Label htmlFor="experience" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Experience <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="experience"
                      value={experience}
                      onChange={(e) => setExperience(e.target.value)}
                      className="w-full text-gray-900 placeholder:text-gray-400"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 -mt-2.5 sm:grid-cols-2 gap-4">

                  <div>
                    <Label htmlFor="dateOfBirth" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Date of birth
                    </Label>
                    <div className="relative">
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        className="w-full pr-10 text-gray-900 placeholder:text-gray-400"
                      />
                      <Calendar className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                    </div>
                  </div>

                  <div>
                    <Label htmlFor="phone" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Phone Number <span className="text-red-500">*</span>
                    </Label>
                    <div className="flex">
                      <select
                        id="countryCode"
                        value={countryCode}
                        onChange={(e) => setCountryCode(e.target.value)}
                        className="border border-gray-300 rounded-l-md px-2 py-2 text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                        style={{ minWidth: '90px' }}
                      >
                        <option value="+1">🇺🇸 +1</option>
                        <option value="+91">🇮🇳 +91</option>
                        <option value="+44">🇬🇧 +44</option>
                        <option value="+61">🇦🇺 +61</option>
                        <option value="+81">🇯🇵 +81</option>
                        {/* Add more countries as needed */}
                      </select>
                      <Input
                        id="phone"
                        type="tel"
                        value={phoneNumber}
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        className="w-full rounded-l-none text-gray-900 placeholder:text-gray-400"
                        placeholder="1234567890"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <Label htmlFor="bio" className="text-sm -mt-2.5 font-medium text-gray-700 mb-1.5 block">
                    Short bio
                  </Label>
                  <textarea
                    id="bio"
                    value={shortBio}
                    onChange={(e) => setShortBio(e.target.value)}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                  />
                  <p className="text-xs text-gray-500 mt-1.5">A one-two sentence summary of what you do.</p>
                </div>
              </div>
            )}

            {/* Step 2: Work & Links */}
            {currentStep === 2 && (
              <div className="space-y-8">
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Featured work & social links</h2>
                  <p className="text-sm text-gray-600 mb-4">Highlight a few places where people can go deeper into your work.</p>
                </div>

                {/* Contact Information */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="workEmail" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Work email <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="workEmail"
                      type="email"
                      value={workEmail}
                      onChange={(e) => setWorkEmail(e.target.value)}
                      className="w-full text-gray-900 placeholder:text-gray-400"
                    />
                  </div>



                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="website" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Website
                      </Label>
                      <Input
                        id="website"
                        value={website}
                        onChange={(e) => setWebsite(e.target.value)}
                        className="w-full text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <Label htmlFor="linkedin" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        LinkedIn
                      </Label>
                      <Input
                        id="linkedin"
                        value={linkedinUrl}
                        onChange={(e) => setLinkedinUrl(e.target.value)}
                        className="w-full text-gray-900 placeholder:text-gray-400"
                      />
                    </div>

                    <div>
                      <Label htmlFor="twitter" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Twitter / X
                      </Label>
                      <Input
                        id="twitter"
                        value={twitterUrl}
                        onChange={(e) => setTwitterUrl(e.target.value)}
                        className="w-full text-gray-900 placeholder:text-gray-400"
                      />
                    </div>
                  </div>
                </div>

                {/* Social Links List */}
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold text-gray-900">Links</h3>
                    <button
                      onClick={openAddLinkModal}
                      className="flex items-center gap-2 px-3 py-1.5 text-teal-600 border border-teal-600 rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium"
                    >
                      <Plus className="w-4 h-4" />
                      Add link
                    </button>
                  </div>

                  <div className="space-y-3">
                    {socialLinks.map((link) => (
                      <div key={link.id} className="flex items-center gap-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                        <div className="shrink-0 text-gray-600">
                          {getLinkIcon(link.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900">{link.label}</span>
                            {link.url && <span className="text-sm text-gray-500">- {link.url}</span>}
                          </div>
                          {link.description && (
                            <p className="text-xs text-gray-500">{link.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="text-xs text-gray-500 capitalize">
                            {link.visibility === 'public' && 'Visible on profile'}
                            {link.visibility === 'connections' && 'Connections only'}
                            {link.visibility === 'hidden' && 'Hidden'}
                          </span>
                          <button
                            onClick={() => removeSocialLink(link.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3">Keep it focused: 3-5 links is usually enough.</p>
                </div>
              </div>
            )}

            {/* Step 3: Skills & Availability */}
            {currentStep === 3 && (
              <div className="space-y-8">
                {/* Top Skills */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Top skills & strengths</h2>
                  <p className="text-sm text-gray-600 mb-4">Choose a few areas where you add the most value.</p>

                  <div className="mb-4">
                    <Label htmlFor="skills" className="text-sm font-medium text-gray-700 mb-1.5 block">
                      Top skills
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="skills"
                        value={skillInput}
                        onChange={(e) => setSkillInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && addSkill()}
                        placeholder="Type to search skills or pick from suggestions"
                        className="flex-1 text-gray-900 placeholder:text-gray-400"
                      />
                      <button
                        onClick={addSkill}
                        disabled={topSkills.length >= 6}
                        className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                      >
                        Add
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-2 mt-3">
                      {topSkills.map((skill) => (
                        <span
                          key={skill}
                          className="px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm font-medium flex items-center gap-2 border border-teal-200"
                        >
                          {skill}
                          <button
                            onClick={() => removeSkill(skill)}
                            className="text-teal-700 hover:text-teal-900"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">You can add up to 6 skills. Keep the list focused so teammates know when to reach out.</p>
                  </div>
                </div>

                {/* Availability & Collaboration */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-1">Availability & collaboration</h2>
                  <p className="text-sm text-gray-600 mb-4">Set expectations about your time and preferred ways of working.</p>

                  <div className="space-y-4">

                    <div>
                      <Label htmlFor="coreHours" className="text-sm font-medium text-gray-700 mb-1.5 block">
                        Core hours
                      </Label>
                      <Input
                        id="coreHours"
                        value={coreHours}
                        onChange={(e) => setCoreHours(e.target.value)}
                        className="w-full text-gray-900 placeholder:text-gray-400"
                      />
                      <p className="text-xs text-gray-500 mt-1.5">When you're usually online and responsive.</p>
                    </div>


                  </div>
                </div>

                {/* Profile Preview */}

              </div>
            )}

            {/* Step 4: Contracts */}
            {currentStep === 4 && (
              <div className="space-y-6">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-900 mb-1">Contract details</h2>
                    <p className="text-sm text-gray-600">Add your standout contracts so people can explore your work in depth.</p>
                  </div>
                  <button
                    onClick={() => {
                      const newContract: Contract = {
                        id: Date.now(),
                        name: '',
                        role: '',
                        liveLink: '',
                        duration: '',
                        teamSize: '',
                        techStack: [],
                        summary: '',
                        highlights: [],
                        images: [],
                        githubLink: ''
                      };
                      setContracts([...contracts, newContract]);
                      setCurrentContractIndex(contracts.length);
                    }}
                    className="flex items-center gap-2 px-4 py-2 text-teal-600 border border-teal-600 rounded-lg hover:bg-teal-50 transition-colors text-sm font-medium"
                  >
                    <Plus className="w-4 h-4" />
                    Add another contract
                  </button>
                </div>

                {contracts.length > 0 && (
                  <div className="space-y-6">
                    {/* Contract Selection */}
                    {contracts.length > 1 && (
                      <div className="flex gap-2 flex-wrap">
                        {contracts.map((contract, index) => (
                          <button
                            key={contract.id}
                            onClick={() => setCurrentContractIndex(index)}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${currentContractIndex === index
                              ? 'bg-teal-600 text-white'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                              }`}
                          >
                            {contract.name || `Contract ${index + 1}`}
                          </button>
                        ))}
                      </div>
                    )}

                    {contracts[currentContractIndex] && (
                      <div className="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="contractName" className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Contract name <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="contractName"
                              value={contracts[currentContractIndex].name}
                              onChange={(e) => {
                                const updated = [...contracts];
                                updated[currentContractIndex].name = e.target.value;
                                setContracts(updated);
                              }}
                              placeholder="Onboarding redesign for NexGen App"
                              className="w-full text-gray-900 placeholder:text-gray-400"
                            />
                          </div>

                          <div>
                            <Label htmlFor="contractRole" className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Your role <span className="text-red-500">*</span>
                            </Label>
                            <Input
                              id="contractRole"
                              value={contracts[currentContractIndex].role}
                              onChange={(e) => {
                                const updated = [...contracts];
                                updated[currentContractIndex].role = e.target.value;
                                setContracts(updated);
                              }}
                              placeholder="Lead Designer"
                              className="w-full text-gray-900 placeholder:text-gray-400"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="liveLink" className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Live link
                            </Label>
                            <div className="relative">
                              <Input
                                id="liveLink"
                                value={contracts[currentContractIndex].liveLink}
                                onChange={(e) => {
                                  const updated = [...contracts];
                                  updated[currentContractIndex].liveLink = e.target.value;
                                  setContracts(updated);
                                }}
                                placeholder="https://nexgen.app/onboarding"
                                className="w-full pr-10 text-gray-900 placeholder:text-gray-400"
                              />
                              <Globe className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                          </div>

                          <div>
                            <Label htmlFor="githubLink" className="text-sm font-medium text-gray-700 mb-1.5 block">
                              GitHub link
                            </Label>
                            <div className="relative">
                              <Input
                                id="githubLink"
                                value={contracts[currentContractIndex].githubLink}
                                onChange={(e) => {
                                  const updated = [...contracts];
                                  updated[currentContractIndex].githubLink = e.target.value;
                                  setContracts(updated);
                                }}
                                placeholder="https://github.com/username/contract"
                                className="w-full pr-10 text-gray-900 placeholder:text-gray-400"
                              />
                              <Github className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                            </div>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <Label htmlFor="duration" className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Duration
                            </Label>
                            <Input
                              id="duration"
                              value={contracts[currentContractIndex].duration}
                              onChange={(e) => {
                                const updated = [...contracts];
                                updated[currentContractIndex].duration = e.target.value;
                                setContracts(updated);
                              }}
                              placeholder="3 months"
                              className="w-full text-gray-900 placeholder:text-gray-400"
                            />
                          </div>

                          <div>
                            <Label htmlFor="teamSize" className="text-sm font-medium text-gray-700 mb-1.5 block">
                              Team size
                            </Label>
                            <Input
                              id="teamSize"
                              value={contracts[currentContractIndex].teamSize}
                              onChange={(e) => {
                                const updated = [...contracts];
                                updated[currentContractIndex].teamSize = e.target.value;
                                setContracts(updated);
                              }}
                              placeholder="5 people"
                              className="w-full text-gray-900 placeholder:text-gray-400"
                            />
                          </div>
                        </div>

                        {/* Technologies/Tech Stack Used */}
                        <div>
                          <Label htmlFor="techStack" className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Technologies | Tech Stack used
                          </Label>
                          <div className="flex flex-wrap gap-2 mt-2 mb-3">
                            {contracts[currentContractIndex].techStack.map((tech) => (
                              <span
                                key={tech}
                                className="px-3 py-1.5 bg-teal-600 text-white rounded-full text-sm font-medium flex items-center gap-2"
                              >
                                {tech}
                                <button
                                  onClick={() => {
                                    const updated = [...contracts];
                                    updated[currentContractIndex].techStack = updated[currentContractIndex].techStack.filter(t => t !== tech);
                                    setContracts(updated);
                                  }}
                                  className="hover:text-gray-200"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </span>
                            ))}
                          </div>

                          {/* Custom Tech Input */}
                          <div className="flex gap-2 mb-3">
                            <Input
                              value={techInput}
                              onChange={(e) => setTechInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  if (techInput.trim() && !contracts[currentContractIndex].techStack.includes(techInput.trim())) {
                                    const updated = [...contracts];
                                    updated[currentContractIndex].techStack.push(techInput.trim());
                                    setContracts(updated);
                                    setTechInput('');
                                  }
                                }
                              }}
                              placeholder="Enter technology/tech used.."
                              className="flex-1 text-gray-900 placeholder:text-gray-400"
                            />
                            <button
                              onClick={() => {
                                if (techInput.trim() && !contracts[currentContractIndex].techStack.includes(techInput.trim())) {
                                  const updated = [...contracts];
                                  updated[currentContractIndex].techStack.push(techInput.trim());
                                  setContracts(updated);
                                  setTechInput('');
                                }
                              }}
                              className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center gap-2"
                            >
                              <Plus className="w-4 h-4" />
                              Add
                            </button>
                          </div>

                          {/* Available Tech Stack Options */}
                          <div className="flex flex-wrap gap-2">
                            {availableTechStack
                              .filter(tech => !contracts[currentContractIndex].techStack.includes(tech))
                              .map((tech) => (
                                <button
                                  key={tech}
                                  onClick={() => {
                                    const updated = [...contracts];
                                    if (!updated[currentContractIndex].techStack.includes(tech)) {
                                      updated[currentContractIndex].techStack.push(tech);
                                    }
                                    setContracts(updated);
                                  }}
                                  className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded-full text-sm font-medium hover:bg-gray-200 transition-colors"
                                >
                                  {tech}
                                </button>
                              ))}
                          </div>
                        </div>

                        {/* Contract Summary */}
                        <div>
                          <Label htmlFor="contractSummary" className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Contract summary
                          </Label>
                          <textarea
                            id="contractSummary"
                            value={contracts[currentContractIndex].summary}
                            onChange={(e) => {
                              const updated = [...contracts];
                              updated[currentContractIndex].summary = e.target.value;
                              setContracts(updated);
                            }}
                            rows={4}
                            placeholder="Redesigned the entire onboarding experience to improve user activation rates..."
                            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                          />
                        </div>

                        {/* Key Highlights */}
                        <div>
                          <Label htmlFor="highlights" className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Key highlights & outcomes
                          </Label>
                          <div className="space-y-2">
                            {contracts[currentContractIndex].highlights.map((highlight, index) => (
                              <div key={index} className="flex items-center gap-2">
                                <span className="text-gray-500">•</span>
                                <Input
                                  value={highlight}
                                  onChange={(e) => {
                                    const updated = [...contracts];
                                    updated[currentContractIndex].highlights[index] = e.target.value;
                                    setContracts(updated);
                                  }}
                                  placeholder="Increased activation rate by 24% within the first month."
                                  className="flex-1 text-gray-900 placeholder:text-gray-400"
                                />
                                <button
                                  onClick={() => {
                                    const updated = [...contracts];
                                    updated[currentContractIndex].highlights = updated[currentContractIndex].highlights.filter((_, i) => i !== index);
                                    setContracts(updated);
                                  }}
                                  className="text-red-500 hover:text-red-700"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            <button
                              onClick={() => {
                                const updated = [...contracts];
                                updated[currentContractIndex].highlights.push('');
                                setContracts(updated);
                              }}
                              className="flex items-center gap-2 text-teal-600 hover:text-teal-700 text-sm font-medium"
                            >
                              <Plus className="w-4 h-4" />
                              Add highlight
                            </button>
                          </div>
                        </div>

                        {/* Contract Images */}
                        <div>
                          <Label className="text-sm font-medium text-gray-700 mb-1.5 block">
                            Contract images ({contracts[currentContractIndex].images.length}/5)
                          </Label>
                          <p className="text-xs text-gray-500 mb-3">
                            {contracts[currentContractIndex].images.length > 0
                              ? "Images successfully uploaded. Drag to reorder."
                              : "No images uploaded yet."}
                          </p>
                          <div
                            className={`border-2 border-dashed rounded-lg p-6 sm:p-10 text-center cursor-pointer transition-all ${isDragging
                              ? 'border-teal-500 bg-teal-100'
                              : 'border-gray-300 hover:border-teal-400 hover:bg-teal-50'
                              }`}
                            onClick={() => imageInputRef.current?.click()}
                            onDragEnter={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              dragCounterRef.current++;
                              if (e.dataTransfer.types.includes('Files')) {
                                setIsDragging(true);
                              }
                            }}
                            onDragLeave={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              dragCounterRef.current--;
                              if (dragCounterRef.current === 0) {
                                setIsDragging(false);
                              }
                            }}
                            onDragOver={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                            }}
                            onDrop={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              dragCounterRef.current = 0;
                              setIsDragging(false);
                              const files = Array.from(e.dataTransfer.files);
                              handleContractImagesUpload(files);
                            }}
                          >
                            <Upload className="mx-auto text-gray-400 mb-3" size={40} />
                            <p className="text-sm font-medium text-gray-600">
                              {isDragging ? 'Drop images here' : 'Upload Contract Images'}
                            </p>
                            <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 5MB each. Max 5 images.</p>
                            <p className="text-xs text-gray-400 mt-2">or drag and drop images here</p>
                            <input
                              type="file"
                              accept="image/png, image/jpeg"
                              multiple
                              style={{ display: 'none' }}
                              ref={imageInputRef}
                              onChange={async (e) => {
                                const files = Array.from(e.target.files || []);
                                await handleContractImagesUpload(files);
                                // reset value so selecting same file works again
                                if (e.target) {
                                  e.target.value = "";
                                }
                              }}
                            />
                          </div>

                          {/* Show uploaded images as thumbnails with remove option */}
                          {contracts[currentContractIndex].images.length > 0 && (
                            <div className="flex flex-wrap gap-3 mt-4">
                              {contracts[currentContractIndex].images.map((img, idx) => (
                                <div key={idx} className="relative w-20 h-20 rounded overflow-hidden border border-gray-200 group">
                                  <img
                                    src={img}
                                    alt={`Contract image ${idx + 1}`}
                                    className="object-cover w-full h-full"
                                  />
                                  <button
                                    type="button"
                                    className="absolute top-1 right-1 bg-white/70 rounded-full p-0.5 text-gray-700 hover:bg-red-100 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"
                                    onClick={() => {
                                      const updated = [...contracts];
                                      updated[currentContractIndex].images = updated[
                                        currentContractIndex
                                      ].images.filter((_, i) => i !== idx);
                                      setContracts(updated);
                                    }}
                                    aria-label="Remove image"
                                  >
                                    <X className="w-4 h-4" />
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Remove Contract Button */}
                        {contracts.length > 1 && (
                          <button
                            onClick={() => {
                              const updated = contracts.filter((_, i) => i !== currentContractIndex);
                              setContracts(updated);
                              if (currentContractIndex >= updated.length) {
                                setCurrentContractIndex(updated.length - 1);
                              }
                            }}
                            className="text-red-600 hover:text-red-700 text-sm font-medium"
                          >
                            Remove this contract
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Footer Navigation */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-0 mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-gray-200">
              <button
                onClick={handlePrevious}
                disabled={currentStep === 1}
                className={`px-4 sm:px-6 py-2 sm:py-2.5 rounded-lg font-medium transition-all text-sm sm:text-base ${currentStep === 1
                  ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                  : 'bg-gray-300 text-gray-700 hover:bg-gray-400'
                  }`}
              >
                <span className="hidden sm:inline">{currentStep === 1 ? 'Back' : currentStep === 2 ? 'Back to basic details' : currentStep === 3 ? 'Back to links' : 'Back to skills'}</span>
                <span className="sm:hidden">Back</span>
              </button>

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 w-full sm:w-auto">
                <button
                  onClick={() => {
                    const profileData = {
                      profilePicture, fullName, role, location, phoneNumber, date, countryCode, shortBio,
                      workEmail, website, linkedinUrl, twitterUrl, socialLinks,
                      topSkills, coreHours, contracts
                    };
                    localStorage.setItem('userProfile', JSON.stringify(profileData));
                    console.log('Draft saved');
                  }}
                  className="px-4 sm:px-6 py-2 sm:py-2.5 text-teal-600 bg-white border border-teal-600 rounded-lg hover:bg-teal-50 transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
                >
                  Save draft
                </button>

                {currentStep < 4 ? (
                  <button
                    onClick={handleNext}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
                  >
                    <span className="hidden sm:inline">Continue to {currentStep === 1 ? 'work & links' : currentStep === 2 ? 'skills' : 'contracts'}</span>
                    <span className="sm:hidden">Continue</span>
                    <span>→</span>
                  </button>
                ) : (
                  <button
                    onClick={handleFinish}
                    className="px-4 sm:px-6 py-2 sm:py-2.5 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors font-medium flex items-center justify-center gap-2 text-sm sm:text-base w-full sm:w-auto"
                  >
                    <Check className="w-4 h-4" />
                    <span className="hidden sm:inline">Publish profile</span>
                    <span className="sm:hidden">Publish</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Link Modal */}
      {isAddLinkModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200">
              <h3 className="text-lg sm:text-xl font-semibold text-gray-900">Add Link</h3>
              <button
                onClick={closeAddLinkModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-4 sm:p-6 space-y-4">
              {/* Link Type */}
              <div>
                <Label htmlFor="linkType" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Link Type <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <select
                    id="linkType"
                    value={newLink.type}
                    onChange={(e) => {
                      const type = e.target.value as SocialLink['type'];
                      setNewLink({
                        ...newLink,
                        type,
                        label: getLinkTypeLabel(type)
                      });
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 appearance-none bg-white pr-10"
                  >
                    <option value="portfolio">Portfolio</option>
                    <option value="linkedin">LinkedIn</option>
                    <option value="twitter">Twitter / X</option>
                    <option value="github">GitHub</option>
                    <option value="website">Website</option>
                    <option value="other">Other</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>

              {/* Link Label */}
              <div>
                <Label htmlFor="linkLabel" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Label <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="linkLabel"
                  value={newLink.label}
                  onChange={(e) => setNewLink({ ...newLink, label: e.target.value })}
                  placeholder="e.g., Portfolio, Blog, etc."
                  className="w-full text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Link URL */}
              <div>
                <Label htmlFor="linkUrl" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  URL / Handle <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="linkUrl"
                  value={newLink.url}
                  onChange={(e) => setNewLink({ ...newLink, url: e.target.value })}
                  placeholder="e.g., /in/alex-morgan or alexmorgan.design"
                  className="w-full text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Link Description (Optional) */}
              <div>
                <Label htmlFor="linkDescription" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Description (Optional)
                </Label>
                <textarea
                  id="linkDescription"
                  value={newLink.description}
                  onChange={(e) => setNewLink({ ...newLink, description: e.target.value })}
                  placeholder="Brief description of this link"
                  rows={2}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none text-gray-900 placeholder:text-gray-400"
                />
              </div>

              {/* Visibility */}
              <div>
                <Label htmlFor="linkVisibility" className="text-sm font-medium text-gray-700 mb-1.5 block">
                  Visibility <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <select
                    id="linkVisibility"
                    value={newLink.visibility}
                    onChange={(e) => setNewLink({ ...newLink, visibility: e.target.value as SocialLink['visibility'] })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-gray-900 appearance-none bg-white pr-10"
                  >
                    <option value="public">Visible on profile</option>
                    <option value="connections">Connections only</option>
                    <option value="hidden">Hidden</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 sm:gap-3 p-4 sm:p-6 border-t border-gray-200">
              <button
                onClick={closeAddLinkModal}
                className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveLink}
                disabled={!newLink.url.trim() || !newLink.label.trim()}
                className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors font-medium text-sm sm:text-base w-full sm:w-auto"
              >
                Add Link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfileSetStepper;
