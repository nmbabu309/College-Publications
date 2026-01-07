import { useState } from 'react';
import { motion } from 'framer-motion';
import { Download } from 'lucide-react';
import Header from '../components/common/Header';
import Footer from '../components/common/Footer';
import PublicationsTable from '../components/data/PublicationsTable';
import LoginModal from '../components/auth/LoginModal';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col bg-[--background]">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 space-y-8">
        {/* Hero Section */}
        <section className="relative text-center py-20 px-4 overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-sm mb-12">

          {/* Background Decorative Elements */}
          <div className="absolute inset-0 z-0">
            <img
              src="/NRI.jpeg"
              alt="Background"
              className="w-full h-full object-cover opacity-100"
            />
            {/* CHANGED: Reduced opacity values to decrease darkness (from 90/70 to 75/50) */}
            <div className="absolute inset-0 bg-gradient-to-b from-slate-900/75 via-slate-900/50 to-slate-900/75" />

            {/* Glow effect */}
            <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-indigo-500/20 rounded-full blur-[80px] opacity-30 pointer-events-none mix-blend-screen" />
          </div>

          <div className="relative z-10 max-w-4xl mx-auto space-y-8">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-800/60 backdrop-blur-md border border-slate-700 text-indigo-300 text-sm font-semibold shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
              </span>
              NRI Institute of Technology
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.1, duration: 0.5 }}
              className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-white leading-[1.1] drop-shadow-sm"
            >
              Faculty <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">Publications</span> Portal
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="max-w-2xl mx-auto text-lg md:text-xl text-slate-200 leading-relaxed drop-shadow-sm"
            >
              A centralized repository for accessing and managing research publications, journals, and academic contributions by our esteemed faculty.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="flex flex-wrap items-center justify-center gap-4 pt-4"
            >
              <a
                href="#publications"
                className="btn bg-indigo-600 hover:bg-indigo-500 text-white px-8 py-3.5 rounded-full shadow-lg shadow-indigo-900/50 hover:shadow-indigo-900/60 transition-all transform hover:-translate-y-0.5 text-base font-medium"
              >
                View Publications
              </a>
              <button
                onClick={() => {
                  if (isAuthenticated) {
                    navigate('/upload');
                  } else {
                    setIsLoginOpen(true);
                  }
                }}
                className="btn bg-white/10 hover:bg-white/20 text-white border border-white/20 px-8 py-3.5 rounded-full backdrop-blur-sm transition-all transform hover:-translate-y-0.5 text-base font-medium"
              >
                Manage Entries
              </button>
            </motion.div>
          </div>
        </section>

        {/* Data Table Section */}
        <section id="publications" className="space-y-4">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <a
                href="/form/downloadExcel"
                target="_blank"
                download
                className="btn bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 text-sm py-2"
              >
                <Download size={16} /> Download Excel
              </a>
            </div>
          </div>
          <PublicationsTable />
        </section>
      </main>

      <Footer />
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
};

export default Home;