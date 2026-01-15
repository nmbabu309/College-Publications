import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { LogIn, LogOut, Upload, Menu, X, User, Building2 } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import LoginModal from '../auth/LoginModal';
import { AnimatePresence, motion } from 'framer-motion';

const Header = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMobileMenuOpen(false);
  };

  // ✅ Scroll to top when clicking logo/title
  const handleHomeClick = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full glass bg-white/80 border-b border-slate-200">
        <div className="container mx-auto px-4 h-16 md:h-20 flex items-center justify-between">
          <div className="flex items-center gap-4">
            {/* College Logo */}
            <div className="w-12 h-12 md:w-16 md:h-16 bg-slate-100 rounded-lg flex items-center justify-center border border-slate-200 overflow-hidden shrink-0 text-slate-400">
              <img src="/NRI-logo.png" alt="NRI college logo" />
            </div>

            <div className="h-8 w-px bg-slate-200 mx-2 hidden sm:block"></div>

            {/* ✅ Logo / Title */}
            <Link
              to="/"
              onClick={handleHomeClick}
              className="flex items-center gap-3 group"
            >
              <div className="flex flex-col">
                <span className="font-heading font-bold text-xs sm:text-sm md:text-lg leading-tight text-slate-900 line-clamp-1">
                  NRI Institute of Technology
                </span>
                <span className="text-[10px] md:text-xs text-slate-500 font-medium hidden sm:block">
                  Publishing Portal
                </span>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-100 mr-2">
                  <User size={14} className="text-slate-400" />
                  <span className="text-xs font-medium text-slate-600 truncate max-w-[150px]">
                    {user?.userEmail}
                  </span>
                </div>

                {isAdmin && (
                  <Link
                    to="/admin-dashboard"
                    className="btn btn-outline border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                  >
                    <Building2 size={18} />
                    Admin Dashboard
                  </Link>
                )}

                <Link to="/upload" className="btn btn-primary">
                  <Upload size={18} />
                  Upload Publication
                </Link>

                <button onClick={handleLogout} className="btn btn-outline">
                  <LogOut size={18} />
                  Logout
                </button>
              </>
            ) : (
              <button
                onClick={() => setIsLoginOpen(true)}
                className="btn btn-primary"
              >
                <LogIn size={18} />
                Faculty Login
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-slate-600 hover:bg-slate-100 rounded-lg"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="md:hidden border-b border-slate-200 overflow-hidden bg-white"
            >
              <div className="p-4 space-y-3">
                {isAuthenticated ? (
                  <>
                    <div className="flex items-center gap-3 w-full p-3 bg-slate-50 rounded-lg border border-slate-100 mb-2">
                      <User size={20} className="text-slate-400" />
                      <div className="flex flex-col">
                        <span className="text-xs text-slate-400 uppercase tracking-wider font-semibold">
                          Logged in as
                        </span>
                        <span className="text-sm font-medium text-slate-700 truncate">
                          {user?.userEmail}
                        </span>
                      </div>
                    </div>

                    <Link
                      to="/upload"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 w-full p-3 bg-indigo-50 text-primary rounded-lg font-medium"
                    >
                      <Upload size={20} />
                      Upload Publication
                    </Link>

                    <button
                      onClick={handleLogout}
                      className="flex items-center gap-3 w-full p-3 text-slate-600 hover:bg-slate-50 rounded-lg font-medium"
                    >
                      <LogOut size={20} />
                      Logout
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsLoginOpen(true);
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-3 w-full p-3 bg-indigo-50 text-primary rounded-lg font-medium"
                  >
                    <LogIn size={20} />
                    Faculty Login
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </header>

      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
      />
    </>
  );
};

export default Header;
