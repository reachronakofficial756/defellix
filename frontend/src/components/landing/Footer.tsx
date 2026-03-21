import { Linkedin, Twitter, Facebook, Instagram, Youtube } from 'lucide-react';
import { Link } from 'react-router-dom';

const socialLinks = [
  { icon: Linkedin, label: 'LinkedIn' },
  { icon: Twitter, label: 'Twitter' },
  { icon: Facebook, label: 'Facebook' },
  { icon: Instagram, label: 'Instagram' },
  { icon: Youtube, label: 'YouTube' }
];
const Footer = () => {
  return (
    <footer className="bg-[#0D0D0D] text-white pt-24 pb-12 px-6 border-t border-white/5 font-sans">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12 mb-24">
          
          {/* Logo & Slogan Column */}
          <div className="md:col-span-4 lg:col-span-5 text-center md:text-left">
            <div className="flex items-center justify-center md:justify-start gap-3 mb-6">
              <img src="/logo.svg" alt="Defellix Logo" className="h-32 w-32 md:h-48 md:w-48 -ml-4 md:-ml-8" />
            </div>
            <p className="text-[#666666] text-lg font-medium leading-tight mb-10 max-w-xs">
              Autonomous AI-native clarity.<br />
              Just growth, delivered.
            </p>
            
            {/* Social Icons */}
            <div className="flex gap-4">
              {socialLinks.map(({ icon: Icon, label }) => (
                <button 
                  key={label}
                  type="button"
                  aria-label={label}
                  className="w-11 h-11 rounded-full border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:border-white/40 transition-all cursor-pointer"
                >
                  <Icon className="w-5 h-5" aria-hidden="true" />
                </button>
              ))}
            </div>
          </div>

          {/* Links Columns */}
          <div className="md:col-span-8 lg:col-span-7 grid grid-cols-2 md:grid-cols-3 gap-8">
            {/* By Roles */}
            <div>
              <h5 className="text-[#999999] font-medium text-xl mb-7">By Roles</h5>
              <ul className="space-y-4 text-[#CCCCCC] font-medium">
                <li><Link to="/roles/compliance" className="hover:text-white transition-colors">Compliance Managers</Link></li>
                <li><Link to="/roles/cx" className="hover:text-white transition-colors">Customer Experience</Link></li>
                <li><Link to="/roles/operations" className="hover:text-white transition-colors">Operation Leaders</Link></li>
                <li><Link to="/roles/sales" className="hover:text-white transition-colors">Sales and Marketing</Link></li>
              </ul>
            </div>

            {/* Knowledge */}
            <div>
              <h5 className="text-[#999999] font-medium text-xl mb-7">Knowledge</h5>
              <ul className="space-y-4 text-[#CCCCCC] font-medium">
                <li><Link to="/blog" className="hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="/trust" className="hover:text-white transition-colors">Trust Center</Link></li>
              </ul>
            </div>

            {/* Company */}
            <div>
              <h5 className="text-[#999999] font-medium text-xl mb-7">Company</h5>
              <ul className="space-y-4 text-[#CCCCCC] font-medium">
                <li><Link to="/about" className="hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="/careers" className="hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="/partners" className="hover:text-white transition-colors">Partners</Link></li>
                <li><Link to="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                <li><Link to="/terms" className="hover:text-white transition-colors">Terms & Conditions</Link></li>
              </ul>
            </div>
          </div>
        </div>

       

        {/* Footer Bottom */}
        <div className="text-center">
          <p className="text-[#666666] text-lg font-medium">
            &copy; {new Date().getFullYear()} Defellix. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
