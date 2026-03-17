import { motion } from 'framer-motion';
import { Star, ShieldCheck, Twitter } from 'lucide-react';

const Testimonials = () => {
  const reviews = [
    {
      name: "Saurav Sharma",
      role: "Fullstack Developer",
      score: "99",
      text: "Defellix solved my biggest headache: chasing late payments. The escrow system is brilliant. Client funds it, I build it, funds are released instantly. No more manual billing.",
      avatar: "SS"
    },
    {
      name: "Modern Design Co.",
      role: "Verified Client / Agency",
      score: "94",
      text: "We hire dozens of freelancers. Before Defellix, tracking deliverables was a mess. Now, every milestone is linked to a smart contract. Pure clarity.",
      avatar: "MD",
      verified: true
    },
    {
      name: "Rohan Mehta",
      role: "SEO Specialist",
      score: "97",
      text: "My credibility score on Defellix helped me close a 500k INR project in days. Clients can see my real track record, not just a CV.",
      avatar: "RM"
    }
  ];

  return (
    <section className="py-32 px-6 bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-24">
           <h2 className="text-[11px] font-black text-accent uppercase tracking-[1em] mb-4">Verification</h2>
           <h3 className="text-4xl md:text-6xl font-black text-white italic underline decoration-accent/30 underline-offset-8">On-Chain Proof.</h3>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {reviews.map((review, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 rounded-[2.5rem] bg-secondary/50 border border-white/5 relative group"
            >
              <div className="flex justify-between items-start mb-8">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-accent flex items-center justify-center font-black text-primary text-xl shadow-[0_0_20px_rgba(34,197,94,0.3)]">
                     {review.avatar}
                  </div>
                  <div>
                    <h4 className="text-white font-black italic">{review.name}</h4>
                    <p className="text-xs text-slate-500 font-bold uppercase tracking-widest">{review.role}</p>
                  </div>
                </div>
                {review.verified && (
                  <div className="p-2 rounded-xl bg-accent/10 border border-accent/30 text-accent">
                     <ShieldCheck className="w-5 h-5" />
                  </div>
                )}
              </div>

              <div className="flex gap-1 mb-6">
                {[1,2,3,4,5].map(s => <Star key={s} className="w-4 h-4 text-accent fill-accent" />)}
              </div>

              <p className="text-lg text-slate-300 font-medium leading-[1.6] mb-12">
                "{review.text}"
              </p>

              <div className="pt-8 border-t border-white/5 flex items-end justify-between">
                 <div>
                    <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest mb-1">CREDIBILITY SCORE</p>
                    <p className="text-4xl font-black text-white leading-none tracking-tighter italic">{review.score}</p>
                 </div>
                 <div className="w-12 h-12 rounded-full border border-white/10 flex items-center justify-center group-hover:border-accent transition-colors">
                    <Twitter className="w-5 h-5 text-white/20 group-hover:text-accent" />
                 </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
