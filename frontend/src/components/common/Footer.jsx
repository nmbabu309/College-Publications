import { useState } from 'react';
import { Mail, MapPin, Code } from 'lucide-react'; // Removed unused Phone
import DeveloperModal from './DeveloperModal';

const Footer = () => {
  const [isDevOpen, setIsDevOpen] = useState(false);

  return (
    <>
      <footer className="bg-indigo-50 border-t border-indigo-100 mt-auto text-slate-600">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 text-center md:text-center">
            
            {/* Brand & Copyright */}
            <div className="space-y-2">
              <h3 className="text-lg font-bold text-indigo-950 tracking-wide">NRI INSTITUTE OF TECHNOLOGY</h3>
              <p className="text-xs text-indigo-900/60">
                &copy; {new Date().getFullYear()} All rights reserved.
              </p>
            </div>

            {/* Contact Info (Simplified) */}
            <div className="flex flex-wrap justify-center gap-4 md:gap-8">
               {/* TIP: Wrapped in <a> for better UX */}
               <a href="https://maps.app.goo.gl/" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-700 transition-colors group">
                   <div className="p-1.5 rounded bg-white text-indigo-500 shadow-sm border border-indigo-100 group-hover:scale-110 transition-all">
                      <MapPin size={14} />
                   </div>
                   <span>Eluru Dist, AP</span>
               </a>
               <a href="mailto:contact@nriit.edu.in" className="flex items-center gap-2 text-xs text-slate-600 hover:text-indigo-700 transition-colors group">
                   <div className="p-1.5 rounded bg-white text-indigo-500 shadow-sm border border-indigo-100 group-hover:scale-110 transition-all">
                      <Mail size={14} />
                   </div>
                   <span>contact@nriit.edu.in</span>
               </a>
            </div>

            {/* Developer Button */}
            <div>
              <button 
                onClick={() => setIsDevOpen(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white hover:bg-indigo-100 text-indigo-700 rounded-full text-xs font-medium transition-all border border-indigo-200 shadow-sm hover:shadow-md"
              >
                <Code size={14} />
                Contact Developer
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