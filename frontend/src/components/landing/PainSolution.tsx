import { motion } from 'framer-motion';
import { XCircle, CheckCircle2, Lock, Shield, Zap, TrendingUp } from 'lucide-react';

const PainSolution = () => {
  return (
    <section className="py-32 px-6 bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Pain Points */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-10 rounded-[2.5rem] bg-secondary/30 border border-white/5 relative group overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <XCircle className="w-32 h-32 text-red-500" />
            </div>
            
            <h3 className="text-3xl font-black text-white mb-10 flex items-center gap-4">
               The Old Way <span className="text-red-500/50">/</span>
            </h3>
            
            <div className="space-y-8">
               {[
                 "Scope creep & endless revisions",
                 "Chasing unpaid invoices for weeks",
                 "High platform fees (up to 20%)",
                 "Zero legal or payment guarantees"
               ].map((text, i) => (
                 <div key={i} className="flex gap-4 items-start">
                    <div className="mt-1.5 w-4 h-4 rounded-full border border-red-500/30 flex items-center justify-center flex-shrink-0">
                       <div className="w-1 h-1 bg-red-500 rounded-full" />
                    </div>
                    <p className="text-slate-400 font-medium leading-tight">{text}</p>
                 </div>
               ))}
            </div>
          </motion.div>

          {/* Defellix Solution */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="p-12 rounded-[2.5rem] bg-accent/5 border border-accent/20 relative group shadow-[0_0_50px_rgba(34,197,94,0.05)]"
          >
            <div className="absolute -inset-1 bg-accent/20 blur-2xl opacity-0 group-hover:opacity-100 transition-opacity -z-10" />
            
            <h3 className="text-4xl font-black text-accent mb-12 flex items-center gap-4">
              Defellix Way <CheckCircle2 className="w-8 h-8" />
            </h3>
            
            <div className="grid sm:grid-cols-2 gap-8">
               {[
                 { title: "Escrow Protected", desc: "Funds locked before you start.", icon: Lock },
                 { title: "Instant Payouts", desc: "No more waiting for checks.", icon: Zap },
                 { title: "Immutable Contracts", desc: "Tamper-proof agreements.", icon: Shield },
                 { title: "Retain 100%", desc: "We take 0-3%, not 20%.", icon: TrendingUp }
               ].map((item, i) => (
                 <div key={i} className="space-y-3">
                    <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent">
                       <item.icon className="w-6 h-6" />
                    </div>
                    <h4 className="text-white font-bold">{item.title}</h4>
                    <p className="text-sm text-slate-500 leading-snug">{item.desc}</p>
                 </div>
               ))}
            </div>
            
            <div className="mt-12 p-5 rounded-2xl bg-primary/80 border border-white/5 text-sm text-slate-400">
               <span className="text-accent font-black mr-2">RESULT:</span> 
               Complete financial peace of mind so you can focus on building.
            </div>
          </motion.div>
          
        </div>
      </div>
    </section>
  );
};

export default PainSolution;
