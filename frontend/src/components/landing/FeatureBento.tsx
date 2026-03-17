import { motion } from 'framer-motion';
import { Shield, Award, Calendar, Bell, Scale, Zap } from 'lucide-react';

const FeatureBento = () => {
  return (
    <section className="py-32 px-6 bg-primary">
      <div className="max-w-7xl mx-auto">
        <div className="mb-16">
          <h2 className="text-4xl md:text-6xl font-black text-white tracking-tighter mb-4">
            Built for the modern <br /> freelance economy.
          </h2>
          <p className="text-xl text-slate-500 max-w-2xl font-medium">
            Everything you need to run a secure, professional business without the overhead of traditional platforms.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 h-[800px] md:h-[650px]">
          
          {/* Card 1: Smart Contracts (Large) */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-8 md:row-span-1 p-10 rounded-[2.5rem] bg-secondary/50 border border-white/5 relative overflow-hidden group"
          >
            <div className="relative z-10 flex flex-col h-full justify-between">
              <div className="max-w-md">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 border border-accent/20 flex items-center justify-center text-accent mb-6">
                  <Shield className="w-6 h-6" />
                </div>
                <h3 className="text-3xl font-black text-white mb-4 italic">Smart Contracts & Escrow</h3>
                <p className="text-slate-400 font-medium leading-relaxed">
                  Funds are secured in a decentralized escrow the moment a contract is funded. Automatic release ensures you get paid for every milestone delivered.
                </p>
              </div>
              
              <div className="mt-12 relative flex items-center gap-12 self-end">
                 <div className="flex flex-col items-center gap-2">
                    <div className="w-16 h-16 rounded-3xl bg-primary border-2 border-accent/30 flex items-center justify-center animate-pulse">
                       <Zap className="w-8 h-8 text-accent fill-accent" />
                    </div>
                    <span className="text-[10px] text-accent font-black uppercase tracking-widest">Locked</span>
                 </div>
                 <div className="w-24 h-0.5 bg-gradient-to-r from-accent to-transparent relative">
                    <motion.div 
                      animate={{ x: [0, 96] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                      className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-accent blur-sm rounded-full"
                    />
                 </div>
                 <div className="w-16 h-16 rounded-3xl bg-secondary border border-white/10 flex items-center justify-center opacity-50">
                    <p className="text-white font-black">$$</p>
                 </div>
              </div>
            </div>
            {/* Visual Background Decoration */}
            <div className="absolute top-0 right-0 w-1/2 h-full bg-gradient-to-l from-accent/5 to-transparent -z-0" />
          </motion.div>

          {/* Card 2: Credibility Score (Medium) */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-4 p-8 rounded-[2rem] bg-accent/5 border border-accent/20 flex flex-col justify-between overflow-hidden relative group"
          >
            <div>
              <Award className="w-8 h-8 text-accent mb-6" />
              <h3 className="text-2xl font-black text-white mb-3">The Credibility Score</h3>
              <p className="text-sm text-slate-500 leading-relaxed">
                Objective, portable reputation based on verified transaction data.
              </p>
            </div>
            
            <div className="mt-8 flex items-baseline justify-between py-4 border-t border-accent/10">
               <span className="text-5xl font-black text-white italic">92</span>
               <div className="flex flex-col items-end">
                  <span className="text-[10px] text-accent font-black tracking-widest">RANKED TOP 5%</span>
                  <div className="flex gap-0.5 mt-1">
                     {[1,2,3,4,5].map(i => <div key={i} className={`w-3 h-1 rounded-full ${i < 5 ? 'bg-accent' : 'bg-white/10'}`} />)}
                  </div>
               </div>
            </div>
          </motion.div>

          {/* Card 3: Milestone Tracking (Medium) */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-6 p-8 rounded-[2rem] bg-secondary/50 border border-white/5 flex flex-col justify-between overflow-hidden group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 rounded-xl bg-primary text-slate-400">
                <Calendar className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-white">Milestone Tracking</h3>
            </div>
            <div className="space-y-4">
               {[
                 { label: "Design Phase", status: "Completed", color: "bg-accent" },
                 { label: "Frontend Build", status: "Active", color: "bg-blue-400" },
                 { label: "Beta Testing", status: "Pending", color: "bg-white/10" }
               ].map((m, i) => (
                 <div key={i} className="p-3 rounded-xl bg-primary/50 border border-white/5">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-xs font-bold text-slate-300">{m.label}</span>
                       <span className={`text-[10px] font-black uppercase ${m.color.replace('bg-', 'text-')}`}>{m.status}</span>
                    </div>
                    <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                       <motion.div 
                         initial={{ width: 0 }}
                         whileInView={{ width: i === 0 ? "100%" : i === 1 ? "45%" : "0%" }}
                         className={`h-full ${m.color}`}
                       />
                    </div>
                 </div>
               ))}
            </div>
          </motion.div>

          {/* Card 4: Small Features */}
          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-3 p-8 rounded-[2rem] bg-secondary/30 border border-white/5 flex flex-col items-center justify-center text-center gap-4 group"
          >
            <Bell className="w-10 h-10 text-white group-hover:text-accent transition-colors" />
            <h3 className="text-lg font-bold text-white leading-tight">Instant Notifications</h3>
          </motion.div>

          <motion.div 
            whileHover={{ y: -5 }}
            className="md:col-span-3 p-8 rounded-[2rem] bg-accent border border-accent flex flex-col items-center justify-center text-center gap-4 group shadow-[0_20px_40px_rgba(34,197,94,0.2)]"
          >
            <Scale className="w-10 h-10 text-primary" />
            <h3 className="text-lg font-black text-primary leading-tight">Dispute Resolution</h3>
          </motion.div>

        </div>
      </div>
    </section>
  );
};

export default FeatureBento;
