import { useState } from 'react';
import { Mail, MapPin, Code } from 'lucide-react'; // Removed unused Phone
import DeveloperModal from './DeveloperModal';

const Footer = () => {
  const [isDevOpen, setIsDevOpen] = useState(false);

  return (
    <>
      <footer className="bg-slate-900 border-t border-slate-800 mt-auto text-slate-400">
        <div className="container mx-auto px-4 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-8 md:gap-12">

            {/* Brand & Copyright */}
            <div className="space-y-3 text-center md:text-left">
              <div className="flex items-center justify-center md:justify-start gap-2">
                <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                  <span className="font-bold text-indigo-500">N</span>
                </div>
                <h3 className="text-lg font-bold text-white tracking-wide">NRI INSTITUTE OF TECHNOLOGY</h3>
              </div>
              <p className="text-sm text-slate-500">
                &copy; {new Date().getFullYear()} All rights reserved.
              </p>
            </div>

            {/* Contact Info */}
            <div className="flex flex-wrap justify-center gap-6">
              <a href="https://maps.app.goo.gl/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 text-sm text-slate-400 hover:text-indigo-400 transition-colors group">
                <div className="p-2 rounded-full bg-slate-800 text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all">
                  <MapPin size={16} />
                </div>
                <span>Eluru Dist, AP</span>
              </a>
              <a href="mailto:contact@nriit.edu.in" className="flex items-center gap-3 text-sm text-slate-400 hover:text-indigo-400 transition-colors group">
                <div className="p-2 rounded-full bg-slate-800 text-slate-400 group-hover:bg-indigo-500/10 group-hover:text-indigo-400 transition-all">
                  <Mail size={16} />
                </div>
                <span>contact@nriit.edu.in</span>
              </a>
            </div>

            {/* Developer Button */}
            <div>
              <button
                onClick={() => setIsDevOpen(true)}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white rounded-full text-xs font-semibold transition-all border border-slate-700 shadow-lg shadow-black/20"
              >
                <Code size={14} />
                <span>Contact Developer</span>
              </button>
            </div>

          </div>
        </div>
      </footer>

      <DeveloperModal
        isOpen={isDevOpen}
        onClose={() => setIsDevOpen(false)}
      />
    </>
  );
};

export default Footer;