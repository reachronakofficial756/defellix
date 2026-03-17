import { motion } from 'framer-motion';
import { ArrowRight, Globe, Github, Linkedin, Twitter } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-primary pt-32 pb-12 px-6">
      <div className="max-w-7xl mx-auto">
        
        {/* Final CTA Card */}
        <motion.div
           initial={{ opacity: 0, y: 50 }}
           whileInView={{ opacity: 1, y: 0 }}
           viewport={{ once: true }}
           className="relative rounded-[4rem] bg-accent p-12 md:p-24 text-center overflow-hidden mb-32 group"
        >
           <div className="absolute inset-x-0 bottom-0 h-1/2 bg-black/20 translate-y-full group-hover:translate-y-0 transition-transform duration-700" />
           <div className="relative z-10">
              <h2 className="text-4xl md:text-7xl font-black text-primary mb-8 tracking-tighter">
                 Ready to secure <br /> your next project?
              </h2>
              <p className="text-primary/70 text-lg md:text-2xl font-black max-w-2xl mx-auto mb-12 lowercase italic">
                 Join 500+ freelancers building their credibility on the blockchain.
              </p>
              <button className="px-12 py-6 bg-primary text-white font-black italic rounded-[2rem] hover:scale-105 transition-transform flex items-center gap-4 mx-auto uppercase tracking-widest">
                 Create Your First Contract <ArrowRight className="w-6 h-6" />
              </button>
           </div>
           
           {/* Decorative Elements */}
           <div className="absolute top-0 right-0 p-12 opacity-10">
              <Globe className="w-64 h-64 text-primary" />
           </div>
        </motion.div>

        {/* Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-12 mb-20">
           <div className="col-span-2 lg:col-span-2">
              <div className="flex items-center gap-3 mb-8">
                <div className="w-8 h-8 rounded-lg bg-accent" />
                <span className="text-2xl font-black tracking-tighter text-white">DEFELLIX</span>
              </div>
              <p className="text-slate-500 font-medium leading-relaxed max-w-xs mb-8">
                 The decentralized trust layer for the premium freelance economy. Secure payments, verifiable reputation.
              </p>
              <div className="flex gap-4">
                 {[Twitter, Github, Linkedin].map((Icon, i) => (
                   <a key={i} href="#" className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-slate-500 hover:text-accent hover:border-accent transition-all">
                      <Icon className="w-5 h-5" />
                   </a>
                 ))}
              </div>
           </div>

           <div>
              <h5 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8">Platform</h5>
              <ul className="space-y-4 text-slate-500 font-bold text-sm">
                 <li className="hover:text-white cursor-pointer transition-colors">Smart Contracts</li>
                 <li className="hover:text-white cursor-pointer transition-colors">Escrow Engine</li>
                 <li className="hover:text-white cursor-pointer transition-colors">Reputation Index</li>
                 <li className="hover:text-white cursor-pointer transition-colors">Dispute Resolution</li>
              </ul>
           </div>

           <div>
              <h5 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8">Resources</h5>
              <ul className="space-y-4 text-slate-500 font-bold text-sm">
                 <li className="hover:text-white cursor-pointer transition-colors">Documentation</li>
                 <li className="hover:text-white cursor-pointer transition-colors">Case Studies</li>
                 <li className="hover:text-white cursor-pointer transition-colors">Help Center</li>
                 <li className="hover:text-white cursor-pointer transition-colors">Legal Framework</li>
              </ul>
           </div>

           <div>
              <h5 className="text-[10px] font-black text-white uppercase tracking-[0.2em] mb-8">Company</h5>
              <ul className="space-y-4 text-slate-500 font-bold text-sm">
                 <li className="hover:text-white cursor-pointer transition-colors">About Defellix</li>
                 <li className="hover:text-white cursor-pointer transition-colors">Careers</li>
                 <li className="hover:text-white cursor-pointer transition-colors">Privacy Policy</li>
                 <li className="hover:text-white cursor-pointer transition-colors">Terms of Service</li>
              </ul>
           </div>
        </div>

        <div className="pt-12 border-t border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
           <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
              © 2026 DEFELLIX LABS INC. ALL RIGHTS RESERVED.
           </p>
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="text-slate-500 text-[10px] font-black uppercase tracking-widest">Systems Online: Global v2.1</span>
           </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
