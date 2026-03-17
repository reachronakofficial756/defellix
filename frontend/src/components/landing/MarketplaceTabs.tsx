import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Building, CheckCircle } from 'lucide-react';

const MarketplaceTabs = () => {
  const [activeTab, setActiveTab] = useState<'freelancer' | 'client'>('freelancer');

  const content = {
    freelancer: [
      "Guaranteed payments through escrow",
      "Portable on-chain credibility profile",
      "Look more professional with smart contracts",
      "Retain 100% of your earned reputation"
    ],
    client: [
      "Eliminate hiring risk with milestone escrow",
      "Pay only for approved deliverables",
      "Access verified talent with on-chain history",
      "Automated compliance and tax reporting"
    ]
  };

  return (
    <section className="py-32 px-6 bg-primary">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-16">
          <div className="inline-flex p-2 bg-secondary/50 rounded-3xl border border-white/5 mb-12">
             <button 
               onClick={() => setActiveTab('freelancer')}
               className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'freelancer' ? 'bg-accent text-primary shadow-2xl' : 'text-slate-500 hover:text-white'}`}
             >
                <User className="w-4 h-4" /> Freelancer
             </button>
             <button 
               onClick={() => setActiveTab('client')}
               className={`flex items-center gap-3 px-8 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all ${activeTab === 'client' ? 'bg-accent text-primary shadow-2xl' : 'text-slate-500 hover:text-white'}`}
             >
                <Building className="w-4 h-4" /> Client
             </button>
          </div>
          
          <h3 className="text-4xl md:text-6xl font-black text-white italic">
             {activeTab === 'freelancer' ? 'Get paid. Build trust.' : 'Hire safe. Scale fast.'}
          </h3>
        </div>

        <div className="relative min-h-[400px]">
           <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.5 }}
                className="grid md:grid-cols-2 gap-12 items-center"
              >
                 <div className="space-y-6">
                    {content[activeTab].map((text, i) => (
                      <div key={i} className="flex gap-4 p-5 rounded-2xl bg-secondary/30 border border-white/5 hover:border-accent/20 transition-colors">
                         <CheckCircle className="w-6 h-6 text-accent flex-shrink-0" />
                         <p className="text-lg text-slate-300 font-medium">{text}</p>
                      </div>
                    ))}
                    <button className="w-full mt-4 py-5 bg-white text-primary font-black italic rounded-2xl hover:bg-accent transition-colors uppercase tracking-[0.1em]">
                       {activeTab === 'freelancer' ? 'Find Contracts' : 'Post a Project'}
                    </button>
                 </div>

                 <div className="relative">
                    <div className="absolute inset-0 bg-accent/10 blur-[100px] rounded-full" />
                    <div className="relative p-8 rounded-[2.5rem] bg-secondary border border-white/10 aspect-square flex flex-col justify-center overflow-hidden">
                       <div className="w-full h-2 bg-accent/20 rounded-full mb-8 overflow-hidden">
                          <motion.div 
                            initial={{ x: "-100%" }}
                            animate={{ x: "0%" }}
                            transition={{ duration: 1 }}
                            className="w-full h-full bg-accent"
                          />
                       </div>
                       <div className="space-y-4">
                          <div className="h-4 w-3/4 bg-white/5 rounded-lg" />
                          <div className="h-4 w-1/2 bg-white/5 rounded-lg" />
                          <div className="h-4 w-full bg-white/5 rounded-lg" />
                       </div>
                       <div className="mt-12 self-end">
                          <div className="w-20 h-20 rounded-full border-4 border-accent/30 flex items-center justify-center">
                             <CheckCircle className="w-10 h-10 text-accent" />
                          </div>
                       </div>
                       <div className="absolute top-0 right-0 p-8">
                          <p className="text-[60px] font-black text-white/5 leading-none">TRUST</p>
                       </div>
                    </div>
                 </div>
              </motion.div>
           </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default MarketplaceTabs;
