import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  CheckCircle2, FileText,
  MessageSquare, ShieldCheck,
  ArrowLeft, Send
} from 'lucide-react';
import logo from '@/assets/logo.svg';

/* ─── Mock Contract Data ─── */
const MOCK_CONTRACT = {
  id: 'ctx-89234',
  projectTitle: 'E-Commerce Platform Redesign',
  projectType: 'Web Development',
  projectDesc: 'Redesigning the core customer journey and checkout flow to improve conversion rates by 25%. Includes a new design system and high-fidelity prototypes.',
  freelancerName: 'Alex Morgan',
  freelancerRole: 'Senior Product Designer',
  clientName: 'Sarah Jenkins',
  clientEmail: 'sarah.jenkins@aura-retail.com',
  clientCompany: 'Aura Retail Group',
  startDate: 'March 20, 2026',
  deadline: 'May 15, 2026',
  duration: '8 weeks',
  currency: 'USD',
  totalAmount: 12500,
  paymentMethod: 'Bank Transfer',
  revisionPolicy: '2 Rounds of Revisions',
  intellectualProperty: 'Client owns all upon payment',
  milestones: [
    { title: 'Research & Wireframes', amount: 3000, due: 'March 30', desc: 'User flows, persona mapping, and low-fidelity wireframes.' },
    { title: 'UI Design & Prototyping', amount: 5000, due: 'April 20', desc: 'High-fidelity UI components and interactive prototype.' },
    { title: 'Delivery & Documentation', amount: 4500, due: 'May 15', desc: 'Final assets, design system documentation, and handoff.' },
  ],
  terms: 'Standard professional conduct and confidentiality terms apply. All assets will be delivered via Figma and Google Drive.'
};

export default function ClientContractReview() {
  const { contractId } = useParams();
  const navigate = useNavigate();
  const [viewState, setViewState] = useState<'review' | 'negotiate' | 'otp' | 'success'>('review');
  const [negotiationText, setNegotiationText] = useState('');
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [isSendingOtp, setIsSendingOtp] = useState(false);

  // Focus management for OTP
  const handleOtpInput = (index: number, value: string) => {
    if (value.length > 1) return;
    const newOtp = [...otpCode];
    newOtp[index] = value;
    setOtpCode(newOtp);

    // Auto focus next
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !otpCode[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const startOtpFlow = () => {
    setIsSendingOtp(true);
    setTimeout(() => {
      setIsSendingOtp(false);
      setViewState('otp');
    }, 1500);
  };

  const verifyOtp = () => {
    setTimeout(() => {
      setViewState('success');
    }, 2000);
  };

  const renderContractPaper = () => (
    <div className=" h-auto bg-white text-black w-full shadow-2xl overflow-hidden flex flex-col font-sans relative">
      {/* Decorative Draft Badge */}
      <div className="absolute top-8 right-8">
        <div className="bg-[#3cb44f] text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2 shadow-lg shadow-[#3cb44f]/20">
          <div className="w-1.5 h-1.5 bg-white rounded-full animate-pulse" />
          Draft Contract
        </div>
      </div>

      <div className="p-12 sm:p-20 flex-1">
        {/* Title */}
        <div className="mb-16">
          <h1 className="text-4xl font-black tracking-tight uppercase border-b-2 border-black pb-4 mb-2 leading-none">
            Contract Agreement: {MOCK_CONTRACT.projectTitle}
          </h1>
        </div>

        <div className="space-y-12">
          {/* Section 1 */}
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-black block" /> 1. Parties Involved
            </h2>
            <p className="text-sm leading-relaxed mb-6">This Freelance Services Agreement ("Agreement") is entered into as of {new Date().toLocaleDateString()}, by and between:</p>
            <ul className="space-y-3 text-sm ml-4">
              <li className="flex items-start gap-2">
                <span className="font-bold">• Service Provider:</span> Defellix Professional Services
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">• Client:</span> {MOCK_CONTRACT.clientName} representing {MOCK_CONTRACT.clientCompany}
              </li>
              <li className="flex items-start gap-2">
                <span className="font-bold">• Client Contact:</span> {MOCK_CONTRACT.clientEmail} | +1 (555) 012-3456
              </li>
            </ul>
          </section>

          {/* Section 2 */}
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-black block" /> 2. Project Scope & Deliverables
            </h2>
            <p className="text-sm leading-relaxed mb-4">The project involves {MOCK_CONTRACT.projectType} services as described below:</p>
            <p className="text-sm text-gray-600 mb-8 italic">"{MOCK_CONTRACT.projectDesc}"</p>

            <div className="space-y-6">
              <div>
                <h4 className="font-bold text-sm mb-2 uppercase tracking-wide">Core Deliverables:</h4>
                <p className="text-sm leading-relaxed">Standard project deliverables as per specifications mentioned in the initial proposal. Includes all design assets and source files.</p>
              </div>
              <div>
                <h4 className="font-bold text-sm mb-2 uppercase tracking-wide">Out of Scope:</h4>
                <p className="text-sm leading-relaxed">Anything not explicitly mentioned in the scope is considered out of scope, including secondary domain hosting or premium plugin licenses.</p>
              </div>
            </div>
          </section>

          {/* Milestones */}
          <section>
            <h2 className="text-xl font-bold mb-6 flex items-center gap-3">
              <span className="w-1 h-6 bg-black block" /> 3. Payment Milestones
            </h2>
            <div className="border border-black/10 rounded-xl overflow-hidden">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 border-b border-black/10">
                  <tr>
                    <th className="px-6 py-4 font-bold">Milestone</th>
                    <th className="px-6 py-4 font-bold">Amount</th>
                    <th className="px-6 py-4 font-bold text-right">Due Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/5">
                  {MOCK_CONTRACT.milestones.map((ms, i) => (
                    <tr key={i}>
                      <td className="px-6 py-4">
                        <p className="font-bold">{ms.title}</p>
                        <p className="text-[10px] text-gray-500">{ms.desc}</p>
                      </td>
                      <td className="px-6 py-4 font-mono">{MOCK_CONTRACT.currency} {ms.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-right text-gray-500 font-medium">{ms.due}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        </div>
      </div>

      <div className="p-12 bg-gray-50 border-t border-black/5 text-[10px] text-gray-400 flex justify-between items-center">
        <span>Digital Signature Verification ID: {MOCK_CONTRACT.id.toUpperCase()}</span>
        <span className="font-bold uppercase tracking-widest">Defellix Protocol Secured</span>
      </div>
    </div>
  );
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-[#3cb44f]/30 overflow-x-hidden flex flex-col">
      

      {/* TOP HEADER */}
      <header className="fixed top-0 z-50 h-20 w-full bg-black  px-4 lg:px-8 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <img src={logo} alt="Defellix" className="w-52 h-20" />
        </div>

        <div className="flex mr-30 items-center gap-3">
          <h2 className="text-lg font-bold text-gray-400 hidden sm:block">Client Contract Review</h2>
        </div>
      </header>

      <div className="w-full flex-1 flex flex-col md:flex-row relative z-10 pt-20">
        {/* LEFT COLUMN (75% - Contract Paper) */}
        <div className="w-full md:w-[70%] lg:w-[75%] bg-black p-4 sm:p-8 lg:px-16 lg:pt-16 lg:pb-8 flex justify-center items-start overflow-y-auto scrBar h-[calc(100vh-80px)]">
          <div className="w-full max-w-[850px]">
            {renderContractPaper()}
          </div>
        </div>

        {/* RIGHT COLUMN (25% - Action Sidebar) */}
        <div className="w-full md:w-[30%] lg:w-[25%] p-8 lg:p-12 flex flex-col justify-center items-center md:items-start text-center md:text-left gap-10 md:sticky md:top-20 md:h-[calc(100vh-80px)] bg-black">
          <AnimatePresence mode="wait">
            {viewState === 'review' && (
              <motion.div
                key="review-actions"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="w-full max-w-sm space-y-8"
              >
                <div className="space-y-6">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3cb44f] mb-3">Escrow Protected</p>
                    <h3 className="text-2xl font-bold text-white mb-2">Final Step</h3>
                    <p className="text-gray-500 text-sm leading-relaxed">Review the terms on the left. Once confirmed, sign below.</p>
                  </div>

                  <div className="space-y-4">
                    <button
                      onClick={startOtpFlow}
                      disabled={isSendingOtp}
                      className="w-full py-5 rounded-2xl bg-[#3cb44f] text-black font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:translate-y-[-4px] transition-all hover:shadow-[0_15px_40px_rgba(60,180,79,0.3)] cursor-pointer active:scale-95 disabled:opacity-50"
                    >
                      {isSendingOtp ? (
                        <div className="w-5 h-5 border-3 border-black border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Send size={18} strokeWidth={3} />
                      )}
                      Accept & Generate OTP
                    </button>

                    <button
                      onClick={() => window.print()}
                      className="w-full py-5 rounded-2xl bg-white/5 border border-white/10 text-white font-black uppercase text-xs tracking-[0.2em] flex items-center justify-center gap-3 hover:bg-white/10 transition-all cursor-pointer group"
                    >
                      <FileText size={18} className="text-[#3cb44f] group-hover:scale-110 transition-transform" />
                      Get PDF Copy
                    </button>
                  </div>

                  <hr className="border-white/5" />

                  <button
                    onClick={() => setViewState('negotiate')}
                    className="w-full flex items-center justify-center gap-2 text-gray-500 hover:text-white transition-colors text-[11px] font-bold uppercase tracking-widest group cursor-pointer"
                  >
                    <MessageSquare size={16} className="group-hover:translate-y-[-2px] transition-transform" />
                    Request Re-iteration
                  </button>
                </div>

                <div className="bg-[#172b1c]/30 p-6 rounded-3xl border border-[#3cb44f]/10">
                  <div className="flex items-center gap-2 mb-2">
                    <ShieldCheck size={16} className="text-[#3cb44f]" />
                    <span className="text-[10px] font-black uppercase tracking-widest text-[#3cb44f]">Secure Verified</span>
                  </div>
                  <p className="text-[10px] text-gray-500 leading-relaxed font-medium">This contract is cryptographically signed and legally binding upon acceptance.</p>
                </div>
              </motion.div>
            )}

            {(viewState !== 'review') && (
              <motion.div
                key="back-action"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="w-full max-w-sm"
              >
                <div className="p-6 rounded-3xl border border-white/10 bg-white/5 space-y-6">
                   <p className="text-xs text-gray-500 font-medium leading-relaxed">Please complete the action in the central window to proceed.</p>
                   <button
                    onClick={() => setViewState('review')}
                    className="w-full flex items-center justify-center gap-3 text-gray-400 hover:text-white transition-all text-sm font-bold group cursor-pointer py-4 px-6 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10"
                  >
                    <ArrowLeft size={18} className="group-hover:-translate-x-2 transition-transform" />
                    Back to Review
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* MODAL OVERLAY */}
      <AnimatePresence>
        {viewState !== 'review' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-8"
          >
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setViewState('review')}
              className="absolute inset-0 bg-[#0f1117]/90 backdrop-blur-md" 
            />

            {/* Modal Content */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-2xl bg-[#0f1117] border border-white/10 rounded-[40px] shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              <div className="p-8 sm:p-12 overflow-y-auto max-h-[90vh]">
                {viewState === 'negotiate' && (
                  <div className="text-center space-y-8">
                    <div className="w-20 h-20 bg-[#3cb44f]/10 border border-[#3cb44f]/30 rounded-3xl flex items-center justify-center mx-auto text-[#3cb44f]">
                      <MessageSquare size={40} />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-white mb-2">Request Changes</h2>
                      <p className="text-gray-400 text-sm">List your specific points for re-iteration below.</p>
                    </div>
                    <textarea
                      rows={6}
                      value={negotiationText}
                      onChange={(e) => setNegotiationText(e.target.value)}
                      placeholder="e.g. Can we adjust the milestone delivery dates?"
                      className="w-full bg-black/50 border border-white/10 rounded-2xl p-6 text-white text-lg focus:outline-none focus:border-[#3cb44f]/50 transition-all font-sans"
                    />
                    <div className="flex flex-col sm:flex-row gap-4">
                      <button
                        onClick={() => setViewState('review')}
                        className="flex-1 py-5 rounded-2xl bg-white/5 text-white font-bold uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
                      >
                        Cancel
                      </button>
                      <button
                        disabled={!negotiationText.trim()}
                        className="flex-[2] py-5 rounded-2xl bg-[#3cb44f] text-black font-black uppercase text-xs tracking-widest shadow-xl disabled:opacity-20 cursor-pointer hover:shadow-[0_10px_30px_rgba(60,180,79,0.3)] transition-all"
                      >
                        Return for Revision
                      </button>
                    </div>
                  </div>
                )}

                {viewState === 'otp' && (
                  <div className="text-center space-y-10">
                    <div className="w-20 h-20 bg-[#3cb44f]/10 border border-[#3cb44f]/30 rounded-3xl flex items-center justify-center mx-auto text-[#3cb44f]">
                      <ShieldCheck size={40} />
                    </div>
                    <div>
                      <h2 className="text-4xl font-black text-white mb-2">Verify Identity</h2>
                      <p className="text-gray-400 text-sm leading-relaxed">
                        A secure 6-digit code has been sent to <br />
                        <span className="text-[#3cb44f] font-bold">{MOCK_CONTRACT.clientEmail}</span>
                      </p>
                    </div>

                    <div className="space-y-8">
                      <div className="flex justify-center gap-2 sm:gap-3">
                        {otpCode.map((digit, i) => (
                          <input 
                            key={i} 
                            id={`otp-${i}`} 
                            type="text" 
                            maxLength={1} 
                            value={digit} 
                            onChange={(e) => handleOtpInput(i, e.target.value)} 
                            onKeyDown={(e) => handleKeyDown(i, e)} 
                            className="w-10 h-14 sm:w-12 sm:h-16 bg-black/50 border border-white/10 rounded-xl text-center text-3xl font-black text-[#3cb44f] outline-none focus:border-[#3cb44f] transition-all" 
                          />
                        ))}
                      </div>
                      <div className="flex flex-col sm:flex-row gap-4">
                        <button
                          onClick={() => setViewState('review')}
                          className="flex-1 py-5 rounded-2xl bg-white/5 text-white font-bold uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
                        >
                          Cancel
                        </button>
                        <button 
                          onClick={verifyOtp} 
                          className="flex-[2] py-5 rounded-2xl bg-[#3cb44f] text-black font-black uppercase tracking-widest cursor-pointer shadow-lg shadow-[#3cb44f]/20 hover:scale-[1.02] transition-transform"
                        >
                          Sign Agreement
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {viewState === 'success' && (
                  <div className="text-center py-6">
                    <CheckCircle2 size={80} className="text-[#3cb44f] mx-auto mb-8 animate-bounce" />
                    <h2 className="text-5xl font-black mb-4">Signed!</h2>
                    <p className="text-gray-400 text-lg mb-8">The agreement is now legally binding and secured.</p>
                    
                    <div className="p-8 bg-black/50 rounded-3xl border border-white/5 text-left w-full space-y-4 mb-10">
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-gray-500">
                        <span>Authorized By</span>
                        <span className="text-white">{MOCK_CONTRACT.clientEmail}</span>
                      </div>
                      <div className="flex justify-between items-center text-[10px] uppercase tracking-widest font-bold text-gray-500">
                        <span>Timestamp</span>
                        <span className="text-white">{new Date().toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-4">
                      <button
                        onClick={() => window.print()}
                        className="w-full py-5 rounded-2xl bg-[#3cb44f] text-black font-black uppercase text-xs tracking-widest hover:shadow-[0_10px_30px_rgba(60,180,79,0.3)] transition-all flex items-center justify-center gap-3"
                      >
                        <FileText size={18} /> Download Signed Copy
                      </button>
                      <button
                        onClick={() => setViewState('review')}
                        className="w-full py-5 rounded-2xl bg-white/5 text-white font-bold uppercase text-xs tracking-widest hover:bg-white/10 transition-all"
                      >
                        Close Portal
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Secure Footer */}
              <div className="bg-black/50 p-6 border-t border-white/5 flex items-center justify-center gap-2">
                <ShieldCheck size={16} className="text-[#3cb44f]" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#3cb44f]">Defellix Secure Signature Portal</span>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
