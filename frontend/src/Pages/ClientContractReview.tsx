import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, FileText, MessageSquare, ShieldCheck,
  Send, DollarSign, Calendar, User, Building2,
  CreditCard, Clock, AlertCircle,
  FileCheck, ArrowRight, Loader2, X
} from 'lucide-react';
import logo from '@/assets/logo.svg';
import { useNavigate } from 'react-router-dom';

import { API_BASE } from '@/api/client';
import {
  downloadContractPdf,
  mapPublicContractToDocumentInput,
} from '@/utils/contractDocument';

const CONTRACT_API_BASE = `${API_BASE}/api/v1/public/contracts`;

interface Milestone {
  id: number;
  order_index: number;
  title: string;
  description?: string;
  amount: number;
  due_date?: string;
  status: string;
  submission_criteria?: string;
}

interface Contract {
  id: number;
  freelancer_name?: string;
  project_name: string;
  project_category: string;
  description: string;
  due_date?: string;
  start_date?: string;
  total_amount: number;
  currency: string;
  prd_file_url?: string;
  client_name: string;
  client_company_name?: string;
  client_email: string;
  client_phone?: string;
  client_country?: string;
  terms_and_conditions?: string;
  submission_criteria?: string;
  revision_policy?: string;
  out_of_scope_work?: string;
  intellectual_property?: string;
  estimated_duration?: string;
  payment_method?: string;
  advance_payment_required: boolean;
  advance_payment_amount?: number;
  status: string;
  client_view_token?: string;
  is_revised: boolean;
  milestones: Milestone[];
}

function fmt(dt?: string | null): string {
  if (!dt) return '—';
  return new Date(dt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function InfoCard({ icon: Icon, label, value, color = '#3cb44f' }: { icon: any; label: string; value: string | number; color?: string }) {
  return (
    <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex flex-col gap-2">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
        <Icon size={17} style={{ color }} />
      </div>
      <p className="text-gray-500 text-xs font-medium">{label}</p>
      <p className="text-white font-bold text-lg truncate">{value}</p>
    </div>
  );
}

export default function ClientContractReview() {
  const { contractId } = useParams<{ contractId: string }>();
  const [contract, setContract] = useState<Contract | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Sidebar flow state
  const [viewState, setViewState] = useState<'review' | 'negotiate' | 'otp' | 'success' | 'already_signed'>('review');
  const [negotiationText, setNegotiationText] = useState('');
  const [negotiating, setNegotiating] = useState(false);
  const [negotiateSuccess, setNegotiateSuccess] = useState(false);
  const [companyAddress, setCompanyAddress] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isSigning, setIsSigning] = useState(false);
  const [otpError, setOtpError] = useState('');
  const navigate = useNavigate();
  const otpInputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (!contractId) return;
    const fetchContract = async () => {
      try {
        const res = await fetch(`${CONTRACT_API_BASE}/${contractId}`);
        const json = await res.json();
        if (!res.ok) throw new Error(json.message || 'Not found');
        const data: Contract = json.data ?? json;

        // If we have a token but URL uses ID, redirect
        if (data.client_view_token && contractId === String(data.id)) {
          navigate(`/review-contract/${data.client_view_token}`, { replace: true });
          return;
        }

        setContract(data);
        if (data.status === 'active' || data.status === 'signed') {
          setViewState('already_signed');
        }
      } catch (e: any) {
        setError(e.message || 'Failed to load contract');
      } finally {
        setLoading(false);
      }
    };
    fetchContract();
  }, [contractId]);

  const handleOtpInput = (index: number, value: string) => {
    if (!/^[0-9]?$/.test(value)) return;
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);
    if (value && index < 5) otpInputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      otpInputRefs.current[index - 1]?.focus();
    }
  };

  const handleRequestOTP = async () => {
    if (!contract || !companyAddress.trim()) return;
    setIsSendingOtp(true);
    setOtpError('');
    try {
      const res = await fetch(`${CONTRACT_API_BASE}/${contractId}/send-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: contract.client_email }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.message || 'Failed to send OTP');
      }
      setViewState('otp');
    } catch (e: any) {
      setOtpError(e.message);
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleSign = async () => {
    const otp = otpCode.join('');
    if (otp.length < 6 || !companyAddress.trim()) return;
    setIsSigning(true);
    setOtpError('');
    try {
      const res = await fetch(`${CONTRACT_API_BASE}/${contractId}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp, company_address: companyAddress, email: contract?.client_email }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.message || 'Invalid OTP. Please try again.');
      }
      setViewState('success');
    } catch (e: any) {
      setOtpError(e.message);
    } finally {
      setIsSigning(false);
    }
  };

  const handleNegotiate = async () => {
    if (!negotiationText.trim()) return;
    setNegotiating(true);
    try {
      const res = await fetch(`${CONTRACT_API_BASE}/${contractId}/send-for-review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ comment: negotiationText }),
      });
      if (!res.ok) {
        const j = await res.json();
        throw new Error(j.message || 'Failed to send request');
      }
      setNegotiateSuccess(true);
      setTimeout(() => setViewState('review'), 2500);
    } catch (e: any) {
      setOtpError(e.message);
    } finally {
      setNegotiating(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#0d1a10] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#3cb44f] animate-spin" />
        <p className="text-white/50 text-sm font-semibold tracking-widest uppercase">Loading Contract…</p>
      </div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen bg-[#0d1a10] flex items-center justify-center">
      <div className="text-center space-y-4">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
        <h2 className="text-white text-2xl font-bold">Contract Not Found</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  if (!contract) return null;

  const handleDownloadAgreementPdf = () => {
    try {
      downloadContractPdf(
        mapPublicContractToDocumentInput(contract),
        contract.project_name
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Could not generate PDF';
      alert(msg);
    }
  };

  return (
    <div className="min-h-screen bg-[#000] text-white font-sans selection:bg-[#3cb44f]/30 overflow-x-hidden">
      {/* TOP HEADER */}
      <nav
        className={
          `h-16 fixed top-0 w-full px-6 py-10 flex items-center justify-center z-50 bg-[#111f14]/10 backdrop-blur-md`
        }
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer"
          onClick={() => navigate('/')}
          role="button"
          tabIndex={0}
          onKeyPress={e => {
            if (e.key === "Enter" || e.key === " ") navigate('/');
          }}
        >
          <img src={logo} alt="Defellix" className="w-52 h-auto" />
        </div>
      </nav>

      <div className="flex flex-col lg:flex-row pt-16 min-h-screen">
        {/* LEFT - Contract Details */}
        <div className="flex-1 lg:max-w-[68%] p-6 lg:p-10 overflow-y-auto">
          {/* Hero */}
          <div className="mb-8 pt-4">
            <p className="text-[#3cb44f] text-xs font-bold uppercase tracking-widest mb-2">{contract.project_category}</p>
            <h1 className="text-3xl lg:text-4xl font-black text-white leading-tight mb-2">{contract.project_name}</h1>
            <p className="text-gray-400 text-sm">Client: {contract.client_name}{contract.client_company_name ? ` · ${contract.client_company_name}` : ''}</p>
          </div>

          {/* Stats Strip */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            <InfoCard icon={DollarSign} label="Contract Value" value={`${contract.currency} ${contract.total_amount.toLocaleString()}`} color="#3cb44f" />
            <InfoCard icon={Calendar} label="Deadline" value={fmt(contract.due_date)} color="#60a5fa" />
            <InfoCard icon={FileText} label="Milestones" value={contract.milestones.length} color="#a78bfa" />
            <InfoCard icon={Clock} label="Duration" value={contract.estimated_duration || '—'} color="#ffd166" />
          </div>

          {/* Description */}
          {contract.description && (
            <div className="bg-white/3 border border-white/8 rounded-3xl p-6 mb-4">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><FileText size={16} className="text-[#60a5fa]" /> Project Overview</h3>
              <p className="text-gray-300 text-sm leading-relaxed">{contract.description}</p>
            </div>
          )}

          {/* Two-column layout */}
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
            <div className="lg:col-span-3 space-y-4">
              {/* Freelancer / Service Provider */}
              <div className="bg-white/3 border border-white/8 rounded-3xl p-6">
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><User size={16} className="text-[#f9a8d4]" /> Service Provider</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="col-span-2"><p className="text-gray-500 text-xs mb-0.5">Freelancer Name</p><p className="text-white font-bold text-base">{contract.freelancer_name || 'Defellix Verified Freelancer'}</p></div>
                  <div className="col-span-2">
                    <div className="mt-2 flex items-center gap-2 px-3 py-2 rounded-xl bg-[#3cb44f]/5 border border-[#3cb44f]/15">
                      <ShieldCheck size={13} className="text-[#3cb44f] shrink-0" />
                      <span className="text-[#3cb44f] text-[10px] font-bold uppercase tracking-wider">Verified via Defellix Protocol</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Terms */}
              <div className="bg-white/3 border border-white/8 rounded-3xl p-6">
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><CreditCard size={16} className="text-[#3cb44f]" /> Payment Terms</h3>
                <div className="grid grid-cols-2 gap-3 text-sm mb-4">
                  <div><p className="text-gray-500 text-xs mb-0.5">Total Amount</p><p className="text-white font-bold text-base">{contract.currency} {contract.total_amount.toLocaleString()}</p></div>
                  <div><p className="text-gray-500 text-xs mb-0.5">Payment Method</p><p className="text-white font-medium">{contract.payment_method || '—'}</p></div>
                  {contract.advance_payment_required && <div className="col-span-2"><p className="text-gray-500 text-xs mb-0.5">Advance Payment</p><p className="text-[#ffd166] font-bold">{contract.currency} {contract.advance_payment_amount?.toLocaleString() || '0'}</p></div>}
                </div>
                {/* Milestone Schedule */}
                {contract.milestones.length > 0 && (
                  <div className="border-t border-white/6 pt-4">
                    <p className="text-gray-400 text-xs font-semibold mb-3 uppercase tracking-wider">Milestone Payment Schedule</p>
                    <div className="space-y-2">
                      {contract.milestones.map((ms, i) => (
                        <div key={ms.id} className="flex items-center justify-between text-sm py-2 border-b border-white/5 last:border-0">
                          <div>
                            <p className="text-white font-medium">{i + 1}. {ms.title}</p>
                            {ms.due_date && <p className="text-gray-500 text-xs">Due: {fmt(ms.due_date)}</p>}
                          </div>
                          <span className="text-[#3cb44f] font-bold">{contract.currency} {ms.amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Timeline */}
              <div className="bg-white/3 border border-white/8 rounded-3xl p-6">
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><Calendar size={16} className="text-[#60a5fa]" /> Timeline</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div><p className="text-gray-500 text-xs mb-0.5">Start Date</p><p className="text-white font-medium">{fmt(contract.start_date)}</p></div>
                  <div><p className="text-gray-500 text-xs mb-0.5">Deadline</p><p className="text-white font-medium">{fmt(contract.due_date)}</p></div>
                  <div><p className="text-gray-500 text-xs mb-0.5">Duration</p><p className="text-white font-medium">{contract.estimated_duration || '—'}</p></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-4">
              {/* Scope */}
              <div className="bg-white/3 border border-white/8 rounded-3xl p-6">
                <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><FileCheck size={16} className="text-[#a78bfa]" /> Scope & Deliverables</h3>
                <div className="space-y-3 text-sm">
                  {contract.revision_policy && <div><p className="text-gray-500 text-xs mb-0.5">Revision Policy</p><p className="text-white font-medium">{contract.revision_policy}</p></div>}
                  {contract.intellectual_property && <div><p className="text-gray-500 text-xs mb-0.5">Intellectual Property</p><p className="text-white font-medium">{contract.intellectual_property}</p></div>}
                  {contract.out_of_scope_work && <div><p className="text-gray-500 text-xs mb-0.5">Out of Scope</p><p className="text-gray-300 leading-relaxed text-xs">{contract.out_of_scope_work}</p></div>}
                </div>
              </div>

              {/* Milestones Detail */}
              {contract.milestones.length > 0 && (
                <div className="bg-white/3 border border-white/8 rounded-3xl p-6">
                  <h3 className="text-white font-semibold text-sm mb-4 flex items-center gap-2"><Building2 size={16} className="text-[#ffd166]" /> Milestones</h3>
                  <div className="space-y-3">
                    {contract.milestones.map((ms, i) => (
                      <div key={ms.id} className={`p-4 rounded-xl border ${ms.status === 'approved' || ms.status === 'paid' ? 'border-[#3cb44f]/25 bg-[#3cb44f]/5' : 'border-white/6 bg-white/2'}`}>
                        <div className="flex justify-between items-start mb-1">
                          <p className="text-white font-semibold text-xs">#{i + 1} {ms.title}</p>
                          <span className="text-[#3cb44f] font-bold text-xs">{contract.currency} {ms.amount.toLocaleString()}</span>
                        </div>
                        {ms.description && <p className="text-gray-500 text-xs leading-relaxed">{ms.description}</p>}
                        {ms.due_date && <p className="text-gray-600 text-[10px] mt-1">Due: {fmt(ms.due_date)}</p>}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Terms */}
              {contract.terms_and_conditions && (
                <div className="bg-white/3 border border-white/8 rounded-3xl p-6">
                  <h3 className="text-white font-semibold text-sm mb-3">Terms & Conditions</h3>
                  <p className="text-gray-400 text-xs leading-relaxed">{contract.terms_and_conditions}</p>
                </div>
              )}
            </div>
          </div>

          {/* PRD viewer */}
          {contract.prd_file_url && (
            <div className="bg-white/3 border border-white/8 rounded-3xl p-6 mb-4">
              <h3 className="text-white font-semibold text-sm mb-3 flex items-center gap-2"><FileText size={16} className="text-[#60a5fa]" /> Project Requirements Document</h3>
              <iframe src={contract.prd_file_url} className="w-full h-[600px] rounded-xl border border-white/8" title="PRD" />
            </div>
          )}
        </div>

        {/* RIGHT - Action Sidebar */}
        <div className="lg:w-[32%] justify-center overflow-y-hidden items-center fixed top-1/2 right-0 transform -translate-y-1/2 mx-auto p-6 bg-[#000] border-l border-white/5">
          <AnimatePresence mode="wait">

            {/* REVIEW STATE */}
            {viewState === 'review' && (
              <motion.div key="review" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
                <div>
                  <p className="text-[#3cb44f] text-[10px] font-black uppercase tracking-widest mb-2">Escrow Protected</p>
                  <h2 className="text-2xl font-bold mb-1">Review & Sign</h2>
                  <p className="text-gray-500 text-sm">Review all terms carefully. When ready, provide your company address and sign digitally with OTP verification.</p>
                </div>

                <div>
                  <label className="text-gray-400 text-xs font-bold uppercase tracking-wider block mb-2">Your Company / Address *</label>
                  <textarea
                    rows={3}
                    value={companyAddress}
                    onChange={e => setCompanyAddress(e.target.value)}
                    placeholder="e.g. Remote / 42, MG Road, Bengaluru / maps.google.com/..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#3cb44f]/60 transition-all resize-none"
                  />
                </div>

                {otpError && <p className="text-red-400 text-xs font-medium">{otpError}</p>}

                <div className="space-y-3">
                  <button
                    onClick={handleRequestOTP}
                    disabled={isSendingOtp || !companyAddress.trim()}
                    className="w-full py-4 rounded-2xl bg-[#3cb44f] text-black font-black uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-[#4dd464] transition-all cursor-pointer shadow-lg shadow-[#3cb44f]/20 disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {isSendingOtp ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} strokeWidth={3} />}
                    {isSendingOtp ? 'Sending OTP…' : 'Accept & Generate OTP'}
                  </button>

                  <button type="button" onClick={handleDownloadAgreementPdf} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all cursor-pointer">
                    <FileText size={16} className="text-[#3cb44f]" /> Download PDF
                  </button>
                </div>

                <hr className="border-white/5" />

                <button onClick={() => { setViewState('negotiate'); setOtpError(''); }} className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-widest group cursor-pointer py-3">
                  <MessageSquare size={15} className="group-hover:scale-110 transition-transform" />
                  Request Re-iteration
                </button>

                <div className="bg-[#3cb44f]/5 border border-[#3cb44f]/15 rounded-2xl p-5">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={15} className="text-[#3cb44f]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#3cb44f]">Secure Verified</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed">Signed via Defellix — cryptographically secured and legally binding upon OTP confirmation.</p>
                </div>
              </motion.div>
            )}

            {/* NEGOTIATE STATE */}
            {viewState === 'negotiate' && (
              <motion.div key="negotiate" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6">
                <div className="flex items-center gap-3">
                  <button onClick={() => setViewState('review')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"><X size={16} /></button>
                  <h2 className="text-xl font-bold">Request Changes</h2>
                </div>
                {negotiateSuccess ? (
                  <div className="text-center py-8 space-y-4">
                    <CheckCircle2 size={60} className="text-[#3cb44f] mx-auto" />
                    <p className="text-white font-bold">Revision request sent!</p>
                    <p className="text-gray-500 text-sm">The freelancer will review your feedback and reach back out.</p>
                  </div>
                ) : (
                  <>
                    <p className="text-gray-400 text-sm">List specific points you'd like the freelancer to revisit before you sign.</p>
                    <textarea
                      rows={7}
                      value={negotiationText}
                      onChange={e => setNegotiationText(e.target.value)}
                      placeholder="e.g. Can we adjust the milestone 2 delivery date? I'd also like to revise the payment term..."
                      className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:border-[#3cb44f]/60 transition-all resize-none"
                    />
                    {otpError && <p className="text-red-400 text-xs">{otpError}</p>}
                    <div className="flex gap-3">
                      <button onClick={() => setViewState('review')} className="flex-1 py-4 rounded-2xl bg-white/5 text-white font-bold text-xs uppercase tracking-widest hover:bg-white/10 transition-all cursor-pointer">Cancel</button>
                      <button
                        onClick={handleNegotiate}
                        disabled={!negotiationText.trim() || negotiating}
                        className="flex-[2] py-4 rounded-2xl bg-[#3cb44f] text-black font-black text-xs uppercase tracking-widest disabled:opacity-30 cursor-pointer flex items-center justify-center gap-2"
                      >
                        {negotiating ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                        {negotiating ? 'Sending…' : 'Send for Review'}
                      </button>
                    </div>
                  </>
                )}
              </motion.div>
            )}

            {/* OTP STATE */}
            {viewState === 'otp' && (
              <motion.div key="otp" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-6 justify-center items-center flex flex-col">
                <div className="flex items-center gap-3">
                  <button onClick={() => setViewState('review')} className="p-2 rounded-xl bg-white/5 hover:bg-white/10 transition-all cursor-pointer"><X size={16} /></button>
                  <h2 className="text-xl font-bold">Verify Identity</h2>
                </div>
                <div className="w-16 h-16 bg-[#3cb44f]/10 border border-[#3cb44f]/30 rounded-2xl flex items-center justify-center">
                  <ShieldCheck size={32} className="text-[#3cb44f]" />
                </div>
                <p className="text-gray-400 text-sm leading-relaxed text-center">
                  A 6-digit verification code was sent to <br />
                  <span className="text-[#3cb44f] font-bold">{contract.client_email}</span>
                </p>
                <div className="flex justify-center gap-2">
                  {otpCode.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => { otpInputRefs.current[i] = el; }}
                      id={`otp-${i}`}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={e => handleOtpInput(i, e.target.value)}
                      onKeyDown={e => handleKeyDown(i, e)}
                      className="w-11 h-14 bg-white/5 border border-white/10 rounded-xl text-center text-2xl font-black text-[#3cb44f] outline-none focus:border-[#3cb44f] transition-all"
                    />
                  ))}
                </div>
                {otpError && <p className="text-red-400 text-xs font-medium text-center">{otpError}</p>}
                <button
                  onClick={handleSign}
                  disabled={otpCode.join('').length < 6 || isSigning}
                  className="w-full py-4 rounded-2xl bg-[#3cb44f] text-black font-black text-sm uppercase tracking-widest cursor-pointer flex items-center justify-center gap-3 shadow-lg shadow-[#3cb44f]/20 disabled:opacity-30 hover:bg-[#4dd464] transition-all"
                >
                  {isSigning ? <Loader2 size={18} className="animate-spin" /> : <ShieldCheck size={18} />}
                  {isSigning ? 'Signing…' : 'Sign Agreement'}
                </button>
                <button
                  onClick={() => { setOtpCode(['', '', '', '', '', '']); setViewState('review'); }}
                  className="w-full py-3 text-gray-500 hover:text-white text-xs uppercase tracking-widest font-bold transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </motion.div>
            )}

            {/* SUCCESS */}
            {viewState === 'success' && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-6 py-6">
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', delay: 0.2 }}>
                  <CheckCircle2 size={80} className="text-[#3cb44f] mx-auto" />
                </motion.div>
                <div>
                  <h2 className="text-4xl font-black mb-2">Signed!</h2>
                  <p className="text-gray-400 text-sm">The agreement is now legally binding and cryptographically secured on Defellix.</p>
                </div>
                <div className="bg-white/3 border border-white/8 rounded-2xl p-5 text-left space-y-3">
                  <div className="flex justify-between text-xs"><span className="text-gray-500 uppercase tracking-wider">Contract</span><span className="text-white font-bold">#{contract.id}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500 uppercase tracking-wider">Signed By</span><span className="text-white font-bold truncate ml-4">{contract.client_email}</span></div>
                  <div className="flex justify-between text-xs"><span className="text-gray-500 uppercase tracking-wider">Timestamp</span><span className="text-white font-bold">{new Date().toLocaleString('en-IN')}</span></div>
                </div>
                <button type="button" onClick={handleDownloadAgreementPdf} className="w-full py-4 rounded-2xl bg-[#3cb44f] text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-3 cursor-pointer hover:bg-[#4dd464] transition-all">
                  <FileText size={16} /> Download agreement (PDF)
                </button>
              </motion.div>
            )}

            {/* ALREADY SIGNED */}
            {viewState === 'already_signed' && (
              <motion.div key="signed" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-center space-y-5 py-8">
                <CheckCircle2 size={64} className="text-[#3cb44f] mx-auto" />
                <h2 className="text-2xl font-black">Already Signed</h2>
                <p className="text-gray-400 text-sm">This contract has already been signed and is active. No further action is required.</p>
                <div className="bg-[#3cb44f]/5 border border-[#3cb44f]/20 rounded-2xl p-4">
                  <p className="text-[#3cb44f] text-xs font-bold">🔒 Defellix Protocol Secured</p>
                </div>
                <button type="button" onClick={handleDownloadAgreementPdf} className="w-full py-4 rounded-2xl bg-white/5 border border-white/10 text-white font-bold uppercase text-xs tracking-widest flex items-center justify-center gap-3 hover:bg-white/10 transition-all cursor-pointer">
                  <FileText size={16} className="text-[#3cb44f]" /> Download agreement (PDF)
                </button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
