
import React, { useState, useRef, useEffect } from 'react';
import { X, Sparkles, Upload, Plus, Trash2, ChevronDown } from 'lucide-react';
import { Calendar } from 'lucide-react';

interface ContractModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ContractData {
  category: string;
  name: string;
  description: string;
  amount: string;
  deadline: Date | null;
  submissionCriteria: string;
  termsAndConditions: string;
}

interface ClientData {
  contactName: string;
  email: string;
  phone: string;
  companyName: string;
}

interface Milestone {
  id: number;
  name: string;
  percentage: string;
  description: string;
}

const ContractModal: React.FC<ContractModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState<number>(1);

  const [contractData, setContractData] = useState<ContractData>({
    category: '',
    name: '',
    description: '',
    amount: '',
    deadline: null,
    submissionCriteria: '',
    termsAndConditions: ''
  });
  const [clientData, setClientData] = useState<ClientData>({
    contactName: '',
    email: '',
    phone: '',
    companyName: ''
  });
  const [milestones, setMilestones] = useState<Milestone[]>([
    { id: 1, name: '', percentage: '', description: '' }
  ]);

  // Autocomplete states
  const [categoryInput, setCategoryInput] = useState<string>('');
  const [showCategoryDropdown, setShowCategoryDropdown] = useState<boolean>(false);
  const [filteredCategories, setFilteredCategories] = useState<string[]>([]);
  const categoryRef = useRef<HTMLDivElement>(null);

  const submissionOptions: string[] = [
    'GitHub Repository Link',
    'Live Website URL',
    'Deployed Application Link',
    'Google Drive Link',
    'Dropbox Link',
    'Figma/Design File Link',
    'Video Demo Link (YouTube/Vimeo)',
    'ZIP File Upload',
    'PDF Document',
    'Source Code Files',
    'APK/IPA File (Mobile Apps)',
    'WordPress Theme/Plugin Files',
    'Notion/Documentation Link',
    'Loom/Screen Recording',
    'Presentation Slides',
    'Other (Specify in Description)'
  ];

  const allCategories: string[] = [
    'Web Development',
    'Mobile App Development',
    'Desktop Software Development',
    'E-commerce Development',
    'WordPress Development',
    'Shopify Development',
    'Frontend Development',
    'Backend Development',
    'Full Stack Development',
    'UI/UX Design',
    'Graphic Design',
    'Logo Design',
    'Brand Identity Design',
    'Illustration',
    'Animation',
    '3D Modeling & Rendering',
    'Video Editing',
    'Motion Graphics',
    'Digital Marketing',
    'SEO Services',
    'Social Media Marketing',
    'Content Marketing',
    'Email Marketing',
    'PPC Advertising',
    'Content Writing',
    'Copywriting',
    'Technical Writing',
    'Blog Writing',
    'Proofreading & Editing',
    'Translation Services',
    'Virtual Assistant',
    'Data Entry',
    'Market Research',
    'Business Consulting',
    'Financial Consulting',
    'Legal Consulting',
    'Mobile Game Development',
    'Web Game Development',
    'Game Design',
    'Unity Development',
    'Unreal Engine Development',
    'Blockchain Development',
    'Smart Contract Development',
    'NFT Development',
    'AI & Machine Learning',
    'Data Science',
    'Data Analysis',
    'Database Administration',
    'DevOps & Cloud',
    'Cybersecurity',
    'QA & Testing',
    'Technical Support',
    'Voice Over',
    'Audio Production',
    'Music Production',
    'Podcast Editing',
    'Photography',
    'Photo Editing',
    'Architecture & Interior Design',
    'CAD Design',
    'Product Design',
    'Fashion Design',
    'Presentation Design',
    'Infographic Design',
    'Book Cover Design',
    'Packaging Design',
    'Print Design',
    'Other'
  ];

  const handleCategoryInputChange = (value: string) => {
    setCategoryInput(value);
    setShowCategoryDropdown(true);

    if (value.trim() === '') {
      setFilteredCategories(allCategories);
    } else {
      const filtered = allCategories.filter(cat =>
        cat.toLowerCase().includes(value.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  };

  const handleCategorySelect = (category: string) => {
    setCategoryInput(category);
    setContractData(prev => ({ ...prev, category: category }));
    setShowCategoryDropdown(false);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (categoryRef.current && !categoryRef.current.contains(event.target as Node)) {
        setShowCategoryDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    setFilteredCategories(allCategories);
  }, []);

  const handleContractChange = (field: keyof ContractData, value: string) => {
    setContractData(prev => ({ ...prev, [field]: value }));
  };

  const handleClientChange = (field: keyof ClientData, value: string) => {
    setClientData(prev => ({ ...prev, [field]: value }));
  };

  const addMilestone = () => {
    setMilestones(prev => [
      ...prev,
      { id: Date.now(), name: '', percentage: '', description: '' }
    ]);
  };

  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [viewMonth, setViewMonth] = useState(new Date().getMonth());
  const [viewYear, setViewYear] = useState(new Date().getFullYear());
  const calendarRef = useRef<HTMLDivElement>(null);

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const years = Array.from({ length: 100 }, (_, i) => new Date().getFullYear() - 50 + i);

  const getDaysInMonth = () => {
    const firstDay = new Date(viewYear, viewMonth, 1).getDay();
    const daysCount = new Date(viewYear, viewMonth + 1, 0).getDate();
    return { firstDay, daysCount };
  };

  const formatDate = (date: Date | null) => {
    if (!date) return '';
    return `${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getDate().toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  const handleDateClick = (day: number) => {
    const newDate = new Date(viewYear, viewMonth, day);
    setContractData(prev => ({ ...prev, deadline: newDate }));
    setIsCalendarOpen(false);
  };

  const isDateSelected = (day: number) => {
    if (!contractData.deadline) return false;
    return day === contractData.deadline.getDate() &&
      viewMonth === contractData.deadline.getMonth() &&
      viewYear === contractData.deadline.getFullYear();
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setIsCalendarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const removeMilestone = (id: number) => {
    if (milestones.length > 1) {
      setMilestones(prev => prev.filter(m => m.id !== id));
    }
  };

  const updateMilestone = (id: number, field: keyof Milestone, value: string) => {
    setMilestones(prev =>
      prev.map(m => (m.id === id ? { ...m, [field]: value } : m))
    );
  };

  const handleNext = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleFinish = () => {
    console.log('Contract Data:', contractData);
    console.log('Client Data:', clientData);
    console.log('Milestones:', milestones);

    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-[#fbf9f1] rounded-lg w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800">Create New Contract</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700 transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Stepper Navigation */}
        <div className="px-8 py-6">
          <div className="relative">
            <div className="absolute top-6 left-9 right-9 h-0.5 bg-gray-200" style={{ margin: '0 10%' }}>
              <div
                className="h-full bg-teal-500 transition-all duration-300 ease-in-out"
                style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
              />
            </div>

            <ol className="flex items-center justify-between relative">
              {[
                { num: 1, label: 'Contract Details' },
                { num: 2, label: 'Client Details' },
                { num: 3, label: 'Milestones' }
              ].map((step) => (
                <li key={step.num} className="flex flex-col items-center flex-1">
                  <button
                    type="button"
                    onClick={() => setCurrentStep(step.num)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center font-semibold text-lg transition-all duration-300 transform hover:scale-110 relative z-10 ${currentStep >= step.num
                      ? 'bg-teal-500 text-white shadow-lg'
                      : 'bg-white text-gray-400 border-2 border-gray-300'
                      }`}
                  >
                    {currentStep > step.num ? (
                      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      step.num
                    )}
                  </button>
                  <span className={`mt-2 text-sm font-medium transition-colors ${currentStep >= step.num ? 'text-teal-600' : 'text-gray-500'
                    }`}>
                    {step.label}
                  </span>
                </li>
              ))}
            </ol>
          </div>
        </div>

        {/* Scrollable Content Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-6">
          <div className="min-h-[400px]">
            {/* Step 1: Contract Details */}
            <div className={`transition-all duration-300 ${currentStep === 1 ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div className="relative" ref={categoryRef}>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contract Category <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={categoryInput}
                        onChange={(e) => handleCategoryInputChange(e.target.value)}
                        onFocus={() => setShowCategoryDropdown(true)}
                        placeholder="Type to search or select..."
                        className="w-full px-4 py-3 pr-10 border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white transition-all"
                      />
                      <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={20} />
                    </div>

                    {showCategoryDropdown && (
                      <div className="absolute z-20 w-full mt-1 text-gray-800 bg-white border border-gray-300 rounded-lg shadow-xl max-h-60 overflow-y-auto">
                        {filteredCategories.length > 0 ? (
                          filteredCategories.map((category, index) => (
                            <div
                              key={index}
                              onClick={() => handleCategorySelect(category)}
                              className="px-4 py-2.5 hover:bg-teal-50 cursor-pointer transition-colors border-b border-gray-100 last:border-0"
                            >
                              {category}
                            </div>
                          ))
                        ) : (
                          <div className="px-4 py-3 text-gray-500 text-center">No categories found</div>
                        )}
                      </div>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contract Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={contractData.name}
                      onChange={(e) => handleContractChange('name', e.target.value)}
                      placeholder="E-commerce Platform Redesign"
                      className="w-full px-4 py-3 border text-gray-800 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-5">
                  <div className="relative" ref={calendarRef}>
                    <p className="block text-sm font-semibold text-gray-700 mb-2">
                      Deadline<span className="text-red-500">*</span>
                    </p>

                    <div
                      onClick={() => setIsCalendarOpen(!isCalendarOpen)}
                      className="flex items-center justify-between px-4 py-3 border border-gray-300 rounded-lg cursor-pointer hover:border-teal-500 bg-white transition-all"
                    >
                      <span className={contractData.deadline ? 'text-gray-800' : 'text-gray-400'}>
                        {contractData.deadline ? formatDate(contractData.deadline) : 'Select a date'}
                      </span>
                      <Calendar className="w-5 h-5 text-gray-400" />
                    </div>

                    {isCalendarOpen && (
                      <div className="absolute z-30 mt-2 bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-80">
                        <div className="flex gap-2 mb-4">
                          <select
                            value={viewMonth}
                            onChange={(e) => setViewMonth(Number(e.target.value))}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-gray-800"
                          >
                            {months.map((month, i) => (
                              <option key={i} value={i}>{month}</option>
                            ))}
                          </select>

                          <select
                            value={viewYear}
                            onChange={(e) => setViewYear(Number(e.target.value))}
                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-gray-800"
                          >
                            {years.map(year => (
                              <option key={year} value={year}>{year}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-7 gap-1 mb-2">
                          {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                            <div key={day} className="text-center text-xs font-semibold text-gray-500 py-2">
                              {day}
                            </div>
                          ))}
                        </div>

                        <div className="grid grid-cols-7 gap-1">
                          {Array.from({ length: getDaysInMonth().firstDay }).map((_, i) => (
                            <div key={`empty-${i}`} />
                          ))}
                          {Array.from({ length: getDaysInMonth().daysCount }, (_, i) => i + 1).map(day => (
                            <button
                              key={day}
                              onClick={() => handleDateClick(day)}
                              className={`aspect-square flex items-center justify-center text-sm rounded hover:bg-teal-50 transition-colors ${isDateSelected(day) ? 'bg-teal-500 text-white hover:bg-teal-600' : 'text-gray-700'}`}
                            >
                              {day}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  <div>
                    <p className="block text-sm font-semibold text-gray-700 mb-2">
                      Amount<span className="text-red-500">*</span>
                    </p>
                    <input
                      type="text"
                      value={contractData.amount}
                      onChange={(e) => handleContractChange('amount', e.target.value)}
                      placeholder="Enter the Amount"
                      className="w-full px-4 py-3 border text-gray-800 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Submission Criteria <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    <select
                      value={contractData.submissionCriteria}
                      onChange={(e) => handleContractChange('submissionCriteria', e.target.value)}
                      className="w-full px-4 py-3 pr-10 border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 bg-white transition-all appearance-none cursor-pointer"
                    >
                      <option value="" disabled>Select how you will submit the contract</option>
                      {submissionOptions.map((option, index) => (
                        <option key={index} value={option} className="text-gray-800">
                          {option}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-3.5 text-gray-400 pointer-events-none" size={20} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Contract Description / Scope <span className="text-red-500">*</span>
                    </label>
                    <button className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors">
                      <Sparkles size={16} />
                      Generate BRD with AI
                    </button>
                  </div>
                  <textarea
                    value={contractData.description}
                    onChange={(e) => handleContractChange('description', e.target.value)}
                    placeholder="Build a scalable e-commerce platform with Next.js and Shopify integration. Requires custom checkout flow and user dashboard."
                    rows={5}
                    className="w-full px-4 py-3 border text-gray-800 border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none transition-all"
                  />
                </div>

                <div className="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:border-teal-400 hover:bg-teal-50 cursor-pointer transition-all">
                  <Upload className="mx-auto text-gray-400 mb-3" size={40} />
                  <p className="text-sm font-medium text-gray-600">Upload Brief or Specs</p>
                  <p className="text-xs text-gray-500 mt-1">PDF, DOC, DOCX up to 10MB</p>
                </div>
              </div>
            </div>

            {/* Step 2: Client Details */}
            <div className={`transition-all duration-300 ${currentStep === 2 ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
              <div className="space-y-5">
                <div className="grid grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Contact Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientData.contactName}
                      onChange={(e) => handleClientChange('contactName', e.target.value)}
                      placeholder="Alex Morgan"
                      className="w-full px-4 py-3 border text-gray-800 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Company Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={clientData.companyName}
                      onChange={(e) => handleClientChange('companyName', e.target.value)}
                      placeholder="Acme Corporation"
                      className="w-full px-4 py-3 border text-gray-800 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={clientData.email}
                      onChange={(e) => handleClientChange('email', e.target.value)}
                      placeholder="alex@acme.corp"
                      className="w-full px-4 py-3 border text-gray-800 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      value={clientData.phone}
                      onChange={(e) => handleClientChange('phone', e.target.value)}
                      placeholder="+1 (555) 012-3456"
                      className="w-full px-4 py-3 border text-gray-800 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 3: Milestones */}
            <div className={`transition-all duration-300 ${currentStep === 3 ? 'opacity-100 block' : 'opacity-0 hidden'}`}>
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold text-gray-800">Payment Milestones</h3>
                  <button
                    onClick={addMilestone}
                    className="flex items-center gap-2 px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 transition-all shadow-md hover:shadow-lg"
                  >
                    <Plus size={18} />
                    Add Milestone
                  </button>
                </div>

                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {milestones.map((milestone, index) => (
                    <div key={milestone.id} className="border-2 border-gray-200 rounded-lg p-4 bg-white hover:border-teal-300 transition-all">
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-semibold text-gray-700 text-sm">Milestone {index + 1}</span>
                        {milestones.length > 1 && (
                          <button
                            onClick={() => removeMilestone(milestone.id)}
                            className="text-red-500 hover:text-red-600 transition-colors p-1 hover:bg-red-50 rounded"
                          >
                            <Trash2 size={18} />
                          </button>
                        )}
                      </div>

                      <div className="grid grid-cols-2 gap-3 mb-3">
                        <input
                          type="text"
                          value={milestone.name}
                          onChange={(e) => updateMilestone(milestone.id, 'name', e.target.value)}
                          placeholder="e.g., Initial Payment"
                          className="px-3 py-2.5 border text-gray-800 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                        />
                        <div className="relative">
                          <input
                            type="number"
                            value={milestone.percentage}
                            onChange={(e) => updateMilestone(milestone.id, 'percentage', e.target.value)}
                            placeholder="20"
                            min="0"
                            max="100"
                            className="w-full px-3 py-2.5 pr-10 border text-gray-800 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 transition-all"
                          />
                          <span className="absolute right-3 top-3 text-gray-500 font-medium">%</span>
                        </div>
                      </div>

                      <textarea
                        value={milestone.description}
                        onChange={(e) => updateMilestone(milestone.id, 'description', e.target.value)}
                        placeholder="e.g., Payment will be done at contract start"
                        rows={2}
                        className="w-full px-3 py-2.5 border text-gray-800 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none transition-all"
                      />
                    </div>
                  ))}
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-gray-700">
                      Terms and Conditions <span className="text-red-500">*</span>
                    </label>
                    <button className="flex items-center gap-1.5 text-sm text-teal-600 hover:text-teal-700 font-medium transition-colors">
                      <Sparkles size={16} />
                      Generate with AI
                    </button>
                  </div>
                  <textarea
                    value={contractData.termsAndConditions}
                    onChange={(e) => handleContractChange('termsAndConditions', e.target.value)}
                    placeholder="Enter terms and conditions for this contract. For example: payment terms, revision policy, delivery timeline, confidentiality agreements, etc."
                    rows={6}
                    className="w-full px-4 py-3 border text-gray-800 bg-white border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 resize-none transition-all"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer Buttons */}
        <div className="flex items-center justify-between px-8 py-5 border-t border-gray-200 bg-gray-50">
          <button
            onClick={handlePrevious}
            disabled={currentStep === 1}
            className={`px-6 py-2.5 rounded-lg font-medium transition-all ${currentStep === 1
              ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
              : 'bg-gray-300 text-gray-700 hover:bg-gray-400 shadow-md hover:shadow-lg'
              }`}
          >
            Previous
          </button>

          {currentStep < 3 ? (
            <button
              onClick={handleNext}
              className="px-6 py-2.5 bg-teal-500 text-white rounded-lg font-medium hover:bg-teal-600 transition-all shadow-md hover:shadow-lg"
            >
              Next Step →
            </button>
          ) : (
            <div className='flex gap-2'>
              <button
                onClick={handleFinish}
                className="px-6 py-2.5 bg-gray-700 text-white rounded-lg font-medium hover:bg-green-600 transition-all shadow-md hover:shadow-lg"
              >
                Save as Draft
              </button>
              <button
                onClick={handleFinish}
                className="px-6 py-2.5 bg-green-500 text-white rounded-lg font-medium hover:bg-green-600 transition-all shadow-md hover:shadow-lg"
              >
                Send to Client
              </button>
            </div>
          )}
        </div>
      </div>
      </div>
    );
};

export default ContractModal;