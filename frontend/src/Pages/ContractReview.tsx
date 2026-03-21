import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Star, CheckCircle2, AlertCircle, Loader2,
  DollarSign, Calendar, Award, Send, MessageSquare
} from 'lucide-react';
import { apiClient, API_BASE } from '../api/client';
import logo from '@/assets/logo.svg';

const CONTRACT_API_BASE = `${API_BASE}/api/v1/public/contracts`;

interface ReviewContract {
  id: number;
  project_name: string;
  project_category?: string;
  client_name: string;
  client_email?: string;
  freelancer_name?: string;
  currency: string;
  total_amount: number;
  milestones?: any[];
}


// Reusable star rating component
function StarRating({ value, onChange, disabled = false, size = 40 }: { value: number; onChange: (v: number) => void; disabled?: boolean; size?: number }) {
  const [hover, setHover] = useState(0);
  return (
    <div className="flex gap-1.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          onClick={() => !disabled && onChange(star)}
          onMouseEnter={() => !disabled && setHover(star)}
          onMouseLeave={() => !disabled && setHover(0)}
          disabled={disabled}
          className={`transition-all ${disabled ? 'cursor-default' : 'cursor-pointer hover:scale-110 active:scale-95'}`}
        >
          <Star
            size={size}
            className={`transition-colors ${star <= (hover || value)
              ? 'text-[#fbc02d] fill-[#fbc02d]'
              : 'text-gray-700'
              }`}
          />
        </button>
      ))}
    </div>
  );
}

export default function ContractReview() {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [contract, setContract] = useState<ReviewContract | null>(null);
  const [alreadyReviewed, setAlreadyReviewed] = useState(false);
  const [existingReview, setExistingReview] = useState<any>(null);
  const [success, setSuccess] = useState(false);

  // Rating states
  const [overallRating, setOverallRating] = useState(0);
  const [deliveryRating, setDeliveryRating] = useState(0);
  const [qualityRating, setQualityRating] = useState(0);
  const [communicationRating, setCommunicationRating] = useState(0);
  const [comment, setComment] = useState('');
  const [testimonial, setTestimonial] = useState('');
  const [allowPublic, setAllowPublic] = useState(true);

  useEffect(() => {
    if (!token) return;
    (async () => {
      try {
        const res = await apiClient.get(`${CONTRACT_API_BASE}/${token}/review-data`);
        const data = res.data?.data ?? res.data;
        setContract(data.contract);
        setAlreadyReviewed(!!data.already_reviewed);
        if (data.review) setExistingReview(data.review);
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Failed to load contract');
      } finally {
        setLoading(false);
      }
    })();
  }, [token]);

  const handleSubmit = async () => {
    if (overallRating === 0 || deliveryRating === 0 || qualityRating === 0 || communicationRating === 0) {
      setError('Please provide all ratings');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      await apiClient.post(`${CONTRACT_API_BASE}/${token}/review`, {
        overall_rating: overallRating,
        delivery_rating: deliveryRating,
        quality_rating: qualityRating,
        communication_rating: communicationRating,
        comment,
        testimonial,
        allow_testimonial_public: allowPublic,
      });
      setSuccess(true);
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to submit review');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#000] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="w-10 h-10 text-[#3cb44f] animate-spin" />
        <p className="text-white/50 text-sm font-semibold tracking-widest uppercase">Loading…</p>
      </div>
    </div>
  );

  if (error && !contract) return (
    <div className="min-h-screen bg-[#000] flex items-center justify-center">
      <div className="text-center space-y-4 px-6">
        <AlertCircle className="w-16 h-16 text-red-400 mx-auto" />
        <h2 className="text-white text-2xl font-bold">Unable to Load</h2>
        <p className="text-gray-500">{error}</p>
      </div>
    </div>
  );

  if (success) return (
    <div className="min-h-screen bg-[#000] flex items-center justify-center">
      <div className="text-center space-y-6 px-6 max-w-md">
        <div className="w-24 h-24 rounded-full bg-[#3cb44f]/10 border border-[#3cb44f]/30 flex items-center justify-center mx-auto">
          <CheckCircle2 size={48} className="text-[#3cb44f]" />
        </div>
        <h2 className="text-white text-3xl font-black">Thank You!</h2>
        <p className="text-gray-400 text-sm leading-relaxed">
          Your review and testimonial have been submitted. The freelancer will be notified and your feedback will contribute to their credibility score on Defellix.
        </p>
        <button
          onClick={() => navigate('/')}
          className="px-8 py-3 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-all cursor-pointer"
        >
          Back to Defellix
        </button>
      </div>
    </div>
  );

  if (!contract) return null;

  return (
    <div className="min-h-screen bg-[#000] text-white font-sans selection:bg-[#3cb44f]/30">
      {/* Nav */}
      <nav className="h-16 fixed top-0 w-full px-6 py-10 flex items-center justify-center z-50 bg-[#111f14]/10 backdrop-blur-md">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <img src={logo} alt="Defellix" className="w-52 h-auto" />
        </div>
      </nav>

      <main className="max-w-3xl mx-auto pt-28 pb-20 px-6">
        {/* Header */}
        <div className="text-center mb-12">
          <span className="text-[#3cb44f] text-xs font-black uppercase tracking-widest">Contract Review</span>
          <h1 className="text-4xl md:text-5xl font-black text-white leading-tight mt-2 mb-3">{contract.project_name}</h1>
          <p className="text-gray-500 font-medium">
            Thank you for completing this project with {contract.freelancer_name || 'the freelancer'} on Defellix
          </p>
        </div>

        {/* Contract Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-14">
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex flex-col gap-2">
            <DollarSign size={17} className="text-[#3cb44f]" />
            <p className="text-gray-500 text-xs font-medium">Total Value</p>
            <p className="text-white font-bold text-lg">{contract.currency} {contract.total_amount.toLocaleString()}</p>
          </div>
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex flex-col gap-2">
            <Calendar size={17} className="text-blue-400" />
            <p className="text-gray-500 text-xs font-medium">Milestones</p>
            <p className="text-white font-bold text-lg">{contract.milestones?.length || 0} completed</p>
          </div>
          <div className="bg-white/4 border border-white/8 rounded-2xl p-5 flex flex-col gap-2">
            <Award size={17} className="text-[#fbc02d]" />
            <p className="text-gray-500 text-xs font-medium">Status</p>
            <p className="text-[#3cb44f] font-bold text-lg">Completed ✓</p>
          </div>
        </div>

        {alreadyReviewed && existingReview ? (
          <div className="bg-white/3 border border-white/10 rounded-[32px] p-10 text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-[#3cb44f]/10 flex items-center justify-center mx-auto">
              <CheckCircle2 size={40} className="text-[#3cb44f]" />
            </div>
            <h2 className="text-2xl font-black">Review Already Submitted</h2>
            <p className="text-gray-400">You've already reviewed this contract. Thank you for your feedback!</p>
            <div className="flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map(s => (
                <Star key={s} size={24} className={s <= existingReview.overall_rating ? 'text-[#fbc02d] fill-[#fbc02d]' : 'text-gray-700'} />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Rating Cards */}
            <div className="bg-white/3 border border-white/8 rounded-[32px] p-8 space-y-8">
              <div>
                <h2 className="text-2xl font-black mb-1">Rate Your Experience</h2>
                <p className="text-gray-500 text-sm">Your ratings help build trust in the Defellix ecosystem</p>
              </div>

              {/* Overall */}
              <div className="space-y-3">
                <label className="text-gray-300 text-sm font-bold">Overall Experience *</label>
                <StarRating value={overallRating} onChange={setOverallRating} />
              </div>

              {/* Delivery */}
              <div className="space-y-3">
                <label className="text-gray-300 text-sm font-bold">Delivery & Timeliness *</label>
                <p className="text-gray-600 text-xs">Were milestones delivered on schedule?</p>
                <StarRating value={deliveryRating} onChange={setDeliveryRating} size={32} />
              </div>

              {/* Quality */}
              <div className="space-y-3">
                <label className="text-gray-300 text-sm font-bold">Quality of Work *</label>
                <p className="text-gray-600 text-xs">Did the deliverables meet your expectations?</p>
                <StarRating value={qualityRating} onChange={setQualityRating} size={32} />
              </div>

              {/* Communication */}
              <div className="space-y-3">
                <label className="text-gray-300 text-sm font-bold">Communication & Professionalism *</label>
                <p className="text-gray-600 text-xs">Was the freelancer responsive and professional?</p>
                <StarRating value={communicationRating} onChange={setCommunicationRating} size={32} />
              </div>
            </div>

            {/* Written Review */}
            <div className="bg-white/3 border border-white/8 rounded-[32px] p-8 space-y-6">
              <div className="flex items-center gap-3">
                <MessageSquare size={20} className="text-[#3cb44f]" />
                <h2 className="text-xl font-black">Written Review</h2>
              </div>
              <div>
                <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Your Review</label>
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Share your experience working with this freelancer..."
                  className="w-full h-32 bg-white/3 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-[#3cb44f]/40 transition-all placeholder:text-gray-700 resize-none"
                />
              </div>
            </div>

            {/* Testimonial */}
            <div className="bg-white/3 border border-white/8 rounded-[32px] p-8 space-y-6">
              <div className="flex items-center gap-3">
                <Award size={20} className="text-[#fbc02d]" />
                <h2 className="text-xl font-black">Testimonial</h2>
              </div>
              <p className="text-gray-500 text-sm">This testimonial can be displayed on the freelancer's public profile to help them attract future clients.</p>
              <div>
                <label className="block text-gray-400 text-[10px] font-black uppercase tracking-widest mb-2">Your Testimonial</label>
                <textarea
                  value={testimonial}
                  onChange={(e) => setTestimonial(e.target.value)}
                  placeholder="e.g. Working with this freelancer was an exceptional experience. They delivered high-quality work ahead of schedule..."
                  className="w-full h-32 bg-white/3 border border-white/10 rounded-2xl p-4 text-white text-sm focus:outline-none focus:border-[#3cb44f]/40 transition-all placeholder:text-gray-700 resize-none"
                />
              </div>
              <label className="flex items-center gap-3 cursor-pointer group">
                <div className={`w-11 h-6 rounded-full relative transition-colors ${allowPublic ? 'bg-[#3cb44f]' : 'bg-white/10'}`}
                  onClick={() => setAllowPublic(!allowPublic)}
                >
                  <div className={`w-5 h-5 rounded-full bg-white absolute top-0.5 transition-all ${allowPublic ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
                <span className="text-gray-300 text-sm font-medium">Allow freelancer to display this testimonial publicly</span>
              </label>
            </div>

            {/* Error */}
            {error && (
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-bold text-center">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              onClick={handleSubmit}
              disabled={submitting || overallRating === 0 || deliveryRating === 0 || qualityRating === 0 || communicationRating === 0}
              className="w-full py-5 rounded-2xl bg-[#3cb44f] text-black font-black text-sm uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-[0_8px_24px_rgba(60,180,79,0.25)] flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              Submit Review & Testimonial
            </button>

            <p className="text-gray-600 text-[10px] text-center uppercase tracking-widest font-bold">
              Your feedback is anonymous and helps build trust on Defellix
            </p>
          </div>
        )}
      </main>
    </div>
  );
}
