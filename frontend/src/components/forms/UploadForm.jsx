import { useState, useEffect, useRef, useCallback } from 'react'; // Added useCallback
import { Save, Edit, User, Mail, BookOpen, Building2, Users, FileText, Calendar, Hash, Link, Award, TrendingUp, Globe, CheckCircle2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isValidEmailDomain, getEmailDomainError, ALLOWED_EMAIL_DOMAINS } from '../../config/constants';
import api from '../../api/axios';

const UploadForm = ({ onSuccess, initialData = null, onClose, hideSuccessPopup = false }) => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  // 1. Create a reference to the form
  const formRef = useRef(null);

  const initialForm = {
    publicationType: '',
    mainAuthor: '',
    title: '',
    email: '',
    phone: '',
    dept: '',
    coauthors: '',
    journal: '',
    publisher: '',
    year: '',
    vol: '',
    issueNo: '',
    pages: '',
    indexation: '',
    issnNo: '',
    journalLink: '',
    ugcApproved: '',
    impactFactor: '',
    pdfUrl: ''
  };

  const [formData, setFormData] = useState(initialForm);
  const [showOtherIndexation, setShowOtherIndexation] = useState(false);
  const [validationErrors, setValidationErrors] = useState({ phone: '', year: '', email: '' });
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);

  // Simple phone validation - Indian mobile numbers only
  const validatePhone = (phone) => {
    if (!phone || phone.trim() === '') {
      return '';
    }

    const phoneStr = phone.toString().trim();

    if (phoneStr.length !== 10) {
      return 'Invalid phone number';
    }

    if (!/^\d+$/.test(phoneStr)) {
      return 'Invalid phone number';
    }

    if (phoneStr[0] !== '6' && phoneStr[0] !== '7' && phoneStr[0] !== '8' && phoneStr[0] !== '9') {
      return 'Invalid phone number';
    }

    return '';
  };

  const validateYear = (year) => {
    if (!year || year === '') return '';
    const yearNum = parseInt(year);
    const currentYear = new Date().getFullYear();

    if (isNaN(yearNum)) {
      return 'Year must be a valid number';
    }

    if (yearNum > currentYear) {
      return `Year cannot be greater than ${currentYear} `;
    }

    if (yearNum < 1900) {
      return 'Year must be 1900 or later';
    }

    return '';
  };

  const validateEmail = (email) => {
    if (!email || email.trim() === '') return '';

    if (!isValidEmailDomain(email)) {
      return getEmailDomainError();
    }

    return '';
  };

  useEffect(() => {
    if (initialData) {
      setFormData(initialData);
      const standardIndexations = ['SCI', 'SCOPUS', 'WOS', 'UGC', ''];
      if (!standardIndexations.includes(initialData.indexation)) {
        setShowOtherIndexation(true);
      }
    }
    // Fetch all publications for live search
    fetchPublications();
  }, [initialData]);

  const [allPublications, setAllPublications] = useState([]);
  const [matchingPublications, setMatchingPublications] = useState([]);

  const fetchPublications = async () => {
    try {
      const response = await api.get("/form/formGet");
      setAllPublications(response.data);
    } catch (err) {
      console.error("Failed to load publications for suggestion", err);
    }
  };

  useEffect(() => {
    // Normalizing inputs
    const sAuthor = formData.mainAuthor?.toLowerCase() || "";
    const sEmail = formData.email?.toLowerCase() || "";
    const sDept = formData.dept?.toLowerCase() || "";
    const sPhone = formData.phone?.toString() || "";
    const sTitle = formData.title?.toLowerCase() || "";
    const sJournal = formData.journal?.toLowerCase() || "";
    const sPublisher = formData.publisher?.toLowerCase() || "";
    const sYear = formData.year?.toString() || "";
    const sType = formData.publicationType?.toLowerCase() || "";

    // Thresholds: Only filter if user typed enough chars
    const hasAuthor = sAuthor.length > 2;
    const hasEmail = sEmail.length > 2;
    const hasDept = sDept.length > 1;
    const hasPhone = sPhone.length > 4;
    const hasTitle = sTitle.length > 2; // lowered threshold for Title
    const hasJournal = sJournal.length > 2;
    const hasPublisher = sPublisher.length > 2;
    const hasYear = sYear.length === 4;
    const hasType = sType.length > 2;

    const hasAnyInput = hasAuthor || hasEmail || hasDept || hasPhone || hasTitle || hasJournal || hasPublisher || hasYear || hasType;

    if (hasAnyInput) {
      const matches = allPublications.filter(pub => {
        // AND Logic: Start True, fail if any ACTIVE filter doesn't match
        let isMatch = true;

        if (hasAuthor) {
          const authorInMain = pub.mainAuthor?.toLowerCase().includes(sAuthor);
          const authorInCo = pub.coauthors?.toLowerCase().includes(sAuthor);
          if (!authorInMain && !authorInCo) isMatch = false;
        }
        if (isMatch && hasEmail) {
          if (!pub.email?.toLowerCase().includes(sEmail)) isMatch = false;
        }
        if (isMatch && hasDept) {
          if (pub.dept?.toLowerCase() !== sDept) isMatch = false;
        }
        if (isMatch && hasPhone) {
          if (!pub.phone?.toString().includes(sPhone)) isMatch = false;
        }
        if (isMatch && hasTitle) {
          if (!pub.title?.toLowerCase().includes(sTitle)) isMatch = false;
        }
        if (isMatch && hasJournal) {
          if (!pub.journal?.toLowerCase().includes(sJournal)) isMatch = false;
        }
        if (isMatch && hasPublisher) {
          if (!pub.publisher?.toLowerCase().includes(sPublisher)) isMatch = false;
        }
        if (isMatch && hasYear) {
          if (pub.year?.toString() !== sYear) isMatch = false;
        }
        if (isMatch && hasType) {
          if (pub.publicationType?.toLowerCase() !== sType) isMatch = false;
        }

        return isMatch;
      });
      setMatchingPublications(matches);
    } else {
      setMatchingPublications([]);
    }
  }, [formData, allPublications]);

  // Resizable Sidebar Logic
  const [sidebarWidth, setSidebarWidth] = useState(150);
  const [sidebarHeight, setSidebarHeight] = useState(150);
  const [resizeDir, setResizeDir] = useState(null); // 'x', 'y', 'xy'
  const sidebarRef = useRef(null);

  const startResizing = useCallback((direction, e) => {
    e.preventDefault();
    setResizeDir(direction);
  }, []);

  const stopResizing = useCallback(() => {
    setResizeDir(null);
  }, []);

  const resize = useCallback((e) => {
    if (!resizeDir) return;

    if (resizeDir === 'x' || resizeDir === 'xy') {
      const newWidth = window.innerWidth - e.clientX;
      if (newWidth > 150 && newWidth < window.innerWidth * 0.95) {
        setSidebarWidth(newWidth);
      }
    }

    if (resizeDir === 'y' || resizeDir === 'xy') {
      // Top position is top-24 which is 96px (24 * 4)
      const topOffset = 96;
      const newHeight = e.clientY - topOffset;
      // Lowered min-height to 150
      if (newHeight > 150 && newHeight < window.innerHeight - 20) {
        setSidebarHeight(newHeight);
      }
    }
  }, [resizeDir]);

  useEffect(() => {
    if (resizeDir) {
      window.addEventListener('mousemove', resize);
      window.addEventListener('mouseup', stopResizing);
    } else {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    }
    return () => {
      window.removeEventListener('mousemove', resize);
      window.removeEventListener('mouseup', stopResizing);
    };
  }, [resizeDir, resize, stopResizing]);

  // Re-calculate default width on window resize if not manually resized? 
  // keeping it simple: explicitly set default once.

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'indexation') {
      if (value === 'OTHER') {
        setShowOtherIndexation(true);
        setFormData(prev => ({ ...prev, indexation: '' }));
        return;
      } else {
        setShowOtherIndexation(false);
      }
    }

    if (name === 'phone') {
      const error = validatePhone(value);
      setValidationErrors(prev => ({ ...prev, phone: error }));
    }

    if (name === 'year') {
      const error = validateYear(value);
      setValidationErrors(prev => ({ ...prev, year: error }));
    }

    if (name === 'email') {
      const error = validateEmail(value);
      setValidationErrors(prev => ({ ...prev, email: error }));
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // NOTE: No "e" argument needed anymore, because we aren't using the form event
  const handleSubmit = async () => {

    // 2. Manual Browser Validation
    // This triggers the bubbles ("Please fill out this field")
    // If invalid, it stops here. No reload happens.
    if (formRef.current && !formRef.current.reportValidity()) {
      return;
    }

    setLoading(true);
    setMsg({ type: '', text: '' });

    const phoneError = validatePhone(formData.phone);
    const yearError = validateYear(formData.year);
    const emailError = validateEmail(formData.email);

    if (phoneError || yearError || emailError) {
      setValidationErrors({ phone: phoneError, year: yearError, email: emailError });
      setMsg({ type: 'error', text: 'Please fix validation errors before submitting.' });
      setLoading(false);
      return;
    }

    try {
      if (initialData) {
        await api.put('/form/formEntryUpdate', formData);
        setMsg({ type: 'success', text: 'Publication updated successfully!' });
      } else {
        await api.post('/form/formEntry', formData);
        setMsg({ type: 'success', text: 'Publication added successfully!' });
        setFormData(initialForm);
      }

      // Show fixed success popup locally
      if (!hideSuccessPopup) {
        setShowSuccessPopup(true);
        setTimeout(() => setShowSuccessPopup(false), 4000);
      }

      // 3. Delay the parent action
      // We wait 1.5 seconds to ensure the user sees the popup
      setTimeout(() => {
        if (onSuccess) onSuccess();

        // Only close automatically if we are NOT editing
        // (If editing, user usually wants to see the success message then close manually)
        if (onClose && !initialData) {
          onClose();
        }
      }, 1500);

    } catch (err) {
      console.error(err);
      setMsg({ type: 'error', text: err.response?.data?.message || 'Failed to save publication. Please try again.' });
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm hover:border-slate-300";
  const labelClass = "flex items-center gap-2 text-sm font-semibold text-slate-700 mb-2";
  const sectionClass = "p-6 bg-gradient-to-br from-slate-50 to-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow";

  return (
    // 4. Attach Ref and prevent Default on the form tag itself (for Enter key safety)
    <form ref={formRef} onSubmit={(e) => e.preventDefault()} className="space-y-6">
      <AnimatePresence>
        {msg.text && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={`p-4 rounded-xl text-sm font-medium flex items-center gap-3 ${msg.type === 'success'
              ? 'bg-green-50 text-green-700 border-2 border-green-200'
              : 'bg-red-50 text-red-700 border-2 border-red-200'
              }`}
          >
            {msg.type === 'success' ? <CheckCircle2 size={20} /> : <Sparkles size={20} />}
            {msg.text}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Author Information Section */}
      <div className={sectionClass}>
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-indigo-100 rounded-lg">
            <User size={18} className="text-indigo-600" />
          </div>
          Author Information
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                <User size={16} className="text-indigo-500" />
                Main Author *
              </label>
              <input
                required
                name="mainAuthor"
                value={formData.mainAuthor || ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="Dr. John Doe"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Mail size={16} className="text-indigo-500" />
                Email *
              </label>
              <input
                required
                type="email"
                name="email"
                value={formData.email || ''}
                onChange={handleChange}
                className={`${inputClass} ${validationErrors.email ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''} `}
                placeholder={ALLOWED_EMAIL_DOMAINS.length > 0 ? `john@${ALLOWED_EMAIL_DOMAINS[0]}` : "john@example.com"}
              />
              {validationErrors.email && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <span className="font-semibold">⚠</span> {validationErrors.email}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                <Building2 size={16} className="text-indigo-500" />
                Department
              </label>
              <select name="dept" value={formData.dept || ''} onChange={handleChange} className={inputClass}>
                <option value="">Select Department</option>
                <option value="CSE">CSE</option>
                <option value="ECE">ECE</option>
                <option value="EEE">EEE</option>
                <option value="MECH">MECH</option>
                <option value="CIVIL">CIVIL</option>
                <option value="IT">IT</option>
                <option value="AIML">AIML</option>
                <option value="CSD">CSD</option>
                <option value="FED">FED</option>
                <option value="MBA">MBA</option>
              </select>
            </div>
            <div>
              <label className={labelClass}>
                <Hash size={16} className="text-indigo-500" />
                Phone
              </label>
              <p className="text-[10px] text-slate-500 mb-1 italic">Enter without country code (Indian numbers only)</p>
              <input
                type="tel"
                name="phone"
                value={formData.phone || ''}
                onChange={handleChange}
                className={`${inputClass} ${validationErrors.phone ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''} `}
                placeholder="9999988888"
              />
              {validationErrors.phone && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <span className="font-semibold">⚠</span> {validationErrors.phone}
                </p>
              )}
            </div>
          </div>

          <div>
            <label className={labelClass}>
              <Users size={16} className="text-indigo-500" />
              Co-Authors
            </label>
            <input
              name="coauthors"
              value={formData.coauthors || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="Jane Doe, Bob Smith..."
            />
          </div>
        </div>
      </div>

      {/* Live Matching Publications Popup (Right Side / Bottom Sheet) */}
      <AnimatePresence>
        {matchingPublications.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            // Dynamic width styles
            style={{
              width: window.innerWidth >= 768 ? sidebarWidth : '100%',
              maxWidth: window.innerWidth >= 768 ? '95vw' : '100%'
            }}
            className="fixed z-50 flex flex-col shadow-2xl border border-slate-200 bg-white overflow-hidden glass-card
              top-auto bottom-0 left-0 right-0 h-[80vh] rounded-t-2xl 
              md:top-24 md:bottom-auto md:left-auto md:right-0 md:rounded-l-2xl md:rounded-tr-none md:border-r-0"
          // Removed fixed widths, managed by style above
          >
            {/* Left Handle (Width) - IMPROVED HIT AREA */}
            <div
              onMouseDown={(e) => startResizing('x', e)}
              className="hidden md:flex absolute left-0 top-0 bottom-0 w-5 cursor-col-resize hover:bg-slate-500/5 items-center justify-center group z-[60] transition-colors"
            >
              {/* Visual Indicator of handle */}
              <div className="h-10 w-1 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors shadow-sm" />
            </div>

            {/* Bottom Handle (Height) - IMPROVED HIT AREA */}
            <div
              onMouseDown={(e) => startResizing('y', e)}
              className="hidden md:flex absolute bottom-0 left-0 right-0 h-5 cursor-row-resize hover:bg-slate-500/5 items-center justify-center group z-[60] transition-colors"
            >
              {/* Visual Indicator of handle */}
              <div className="w-10 h-1 rounded-full bg-slate-300 group-hover:bg-indigo-500 transition-colors shadow-sm" />
            </div>

            {/* Bottom-Left Corner Handle (Both) - IMPROVED HIT AREA */}
            <div
              onMouseDown={(e) => startResizing('xy', e)}
              className="hidden md:flex absolute bottom-0 left-0 w-8 h-8 cursor-sw-resize hover:bg-indigo-50 items-end justify-start z-[70] transition-colors rounded-tr-xl p-1.5"
            >
              {/* Visual Corner Indicator */}
              <div className="relative w-full h-full">
                <div className="absolute bottom-1 left-1 w-1.5 h-1.5 bg-slate-300 group-hover:bg-indigo-500 rounded-full" />
                <div className="absolute bottom-1 left-3.5 w-1.5 h-1.5 bg-slate-300 group-hover:bg-indigo-500 rounded-full" />
                <div className="absolute bottom-3.5 left-1 w-1.5 h-1.5 bg-slate-300 group-hover:bg-indigo-500 rounded-full" />
              </div>
            </div>

            <div className="p-4 pl-6 bg-slate-50/90 backdrop-blur-sm border-b border-slate-200 flex items-center justify-between sticky top-0 z-20 shrink-0">

              <h4 className="text-sm font-bold text-slate-700 flex items-center gap-2">
                <Sparkles size={16} className="text-indigo-500" />
                Found {matchingPublications.length} possible duplicates
              </h4>
              <button
                onClick={() => setMatchingPublications([])}
                className="p-1.5 hover:bg-slate-200 rounded-full text-slate-500 transition-colors"
                title="Close"
              >
                <X size={20} />
              </button>
            </div>

            <div className="overflow-auto flex-1 custom-scrollbar p-0 bg-white">
              {/* Added ALL fields from PublicationsTable */}
              <table className="w-full text-xs text-left min-w-[1600px]">
                <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200 sticky top-0 z-10">
                  <tr>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">S.No</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Type</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Title</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Main Author</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Co-Authors</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Dept</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Email</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Phone</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Journal</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Publisher</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Year</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Vol</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Issue</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Pages</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">ISSN/ISBN</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Indexation</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">UGC</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Impact Factor</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">Link (Journal)</th>
                    <th className="px-4 py-3 whitespace-nowrap bg-slate-50">DOI Link</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {matchingPublications.map((pub, index) => (
                    <tr key={pub.id} className="hover:bg-indigo-50/40 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-500">{index + 1}</td>
                      <td className="px-4 py-3">
                        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium border ${pub.publicationType === 'Journal Paper'
                          ? 'bg-indigo-50 text-indigo-700 border-indigo-100'
                          : 'bg-purple-50 text-purple-700 border-purple-100'
                          }`}>
                          {pub.publicationType}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-slate-800 min-w-[200px]" title={pub.title}>{pub.title}</td>
                      <td className="px-4 py-3 text-slate-700 font-medium whitespace-nowrap">{pub.mainAuthor}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap max-w-[150px] truncate" title={pub.coauthors}>{pub.coauthors || '-'}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{pub.dept}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{pub.email || '-'}</td>
                      <td className="px-4 py-3 text-slate-500 whitespace-nowrap">{pub.phone || '-'}</td>
                      <td className="px-4 py-3 text-slate-600 min-w-[120px]">{pub.journal || '-'}</td>
                      <td className="px-4 py-3 text-slate-600 min-w-[100px]">{pub.publisher || '-'}</td>
                      <td className="px-4 py-3 text-slate-600">{pub.year}</td>
                      <td className="px-4 py-3 text-slate-500">{pub.vol || '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{pub.issueNo || '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{pub.pages || '-'}</td>
                      <td className="px-4 py-3 text-slate-500">{pub.issnNo || '-'}</td>
                      <td className="px-4 py-3">
                        {pub.indexation ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100">
                            {pub.indexation}
                          </span>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {pub.ugcApproved === 'Yes' ? (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] bg-amber-50 text-amber-700 border border-amber-100">
                            Yes
                          </span>
                        ) : 'No'}
                      </td>
                      <td className="px-4 py-3 text-slate-500">{pub.impactFactor || '-'}</td>
                      <td className="px-4 py-3">
                        {pub.journalLink ? (
                          <a href={pub.journalLink} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline flex items-center gap-1">
                            <Globe size={12} /> Link
                          </a>
                        ) : '-'}
                      </td>
                      <td className="px-4 py-3">
                        {(pub.doi || pub.pdfUrl) ? (
                          <a href={pub.doi || pub.pdfUrl} target="_blank" rel="noopener noreferrer" className="text-indigo-600 hover:underline flex items-center gap-1">
                            <Link size={12} /> DOI
                          </a>
                        ) : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Publication Details Section */}
      <div className={sectionClass}>
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-green-100 rounded-lg">
            <BookOpen size={18} className="text-green-600" />
          </div>
          Publication Details
        </h3>

        <div className="space-y-4">
          <div>
            <label className={labelClass}>
              <FileText size={16} className="text-green-500" />
              Publication Type *
            </label>
            <select
              required
              name="publicationType"
              value={formData.publicationType || ''}
              onChange={handleChange}
              className={inputClass}
            >
              <option value="">Select Publication Type</option>
              <option value="Journal Paper">Journal Paper</option>
              <option value="Conference Proceedings">Conference Proceedings</option>
            </select>
          </div>

          <div>
            <label className={labelClass}>
              <FileText size={16} className="text-green-500" />
              Publication Title *
            </label>
            <textarea
              required
              rows="2"
              name="title"
              value={formData.title || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="Research on AI and Machine Learning Applications..."
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                <BookOpen size={16} className="text-green-500" />
                Journal Name
              </label>
              <input
                name="journal"
                value={formData.journal || ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="IEEE Journal"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Building2 size={16} className="text-green-500" />
                Publisher
              </label>
              <input
                name="publisher"
                value={formData.publisher || ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="Springer"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className={labelClass}>
                <Calendar size={16} className="text-green-500" />
                Year
              </label>
              <input
                type="number"
                name="year"
                value={formData.year || ''}
                onChange={handleChange}
                className={`${inputClass} ${validationErrors.year ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''} `}
                placeholder={new Date().getFullYear()}
              />
              {validationErrors.year && (
                <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                  <span className="font-semibold">⚠</span> {validationErrors.year}
                </p>
              )}
            </div>
            <div>
              <label className={labelClass}>
                <Hash size={16} className="text-green-500" />
                Volume
              </label>
              <input
                name="vol"
                value={formData.vol || ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="12"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Hash size={16} className="text-green-500" />
                Issue No
              </label>
              <input
                name="issueNo"
                value={formData.issueNo || ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="4"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                <FileText size={16} className="text-green-500" />
                Pages
              </label>
              <input
                name="pages"
                value={formData.pages || ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="100-112"
                pattern="[0-9\-]+"
                title="Only numbers and hyphens allowed (e.g., 100-112)"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Award size={16} className="text-green-500" />
                Indexation
              </label>
              <select
                name="indexation"
                value={showOtherIndexation ? 'OTHER' : (formData.indexation || '')}
                onChange={handleChange}
                className={inputClass}
              >
                <option value="">Select Indexation</option>
                <option value="SCI">SCI</option>
                <option value="SCOPUS">SCOPUS</option>
                <option value="WOS">Web of Science</option>
                <option value="UGC">UGC Care</option>
                <option value="OTHER">Other</option>
              </select>

              <AnimatePresence>
                {showOtherIndexation && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="mt-2"
                  >
                    <input
                      name="indexation"
                      value={formData.indexation || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, indexation: e.target.value }))}
                      className={inputClass}
                      placeholder="Enter Indexation (e.g. IEEE, Springer)"
                    />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Information Section */}
      <div className={sectionClass}>
        <h3 className="text-base font-bold text-slate-800 mb-4 flex items-center gap-2">
          <div className="p-1.5 bg-purple-100 rounded-lg">
            <TrendingUp size={18} className="text-purple-600" />
          </div>
          Additional Information
        </h3>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                <Hash size={16} className="text-purple-500" />
                ISSN/ISBN No
              </label>
              <input
                name="issnNo"
                value={formData.issnNo || ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="1234-5678"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Award size={16} className="text-purple-500" />
                UGC Approved
              </label>
              <select name="ugcApproved" value={formData.ugcApproved || ''} onChange={handleChange} className={inputClass}>
                <option value="">Select Status</option>
                <option value="Yes">Yes</option>
                <option value="No">No</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                <TrendingUp size={16} className="text-purple-500" />
                Impact Factor
              </label>
              <input
                name="impactFactor"
                value={formData.impactFactor || ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="5.2"
              />
            </div>
            <div>
              <label className={labelClass}>
                <Globe size={16} className="text-purple-500" />
                Journal Link
              </label>
              <input
                name="journalLink"
                value={formData.journalLink || ''}
                onChange={handleChange}
                className={inputClass}
                placeholder="https://journal.com/..."
              />
            </div>
          </div>

          <div>
            <label className={labelClass}>
              <Link size={16} className="text-purple-500" />
              DOI Link
            </label>
            <input
              type="url"
              name="pdfUrl"
              value={formData.pdfUrl || ''}
              onChange={handleChange}
              className={inputClass}
              placeholder="https://doi.org/10.1234/example"
            />
          </div>
        </div>
      </div>

      {/* Fixed Success Notification Popup - Local to Form */}
      <AnimatePresence>
        {showSuccessPopup && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            className="fixed top-6 right-6 z-50 max-w-md"
          >
            <div className="bg-gradient-to-r from-green-500 to-emerald-500 text-white p-6 rounded-2xl shadow-2xl border-2 border-white/20">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-white/20 rounded-full">
                  <CheckCircle2 size={28} className="text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-bold text-lg mb-1 text-white">Success!</h4>
                  <p className="text-white/90 text-sm">
                    {initialData ? 'Publication updated successfully!' : 'Publication added successfully!'}
                  </p>
                </div>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="text-white/80 hover:text-white transition-colors"
                  type="button" // CRITICAL: Prevent this button from submitting
                >
                  <X size={20} />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Submit Button */}
      <motion.button
        type="button" // 5. CHANGED TO 'button' TO PREVENT RELOAD
        onClick={handleSubmit} // 6. CALL HANDLER ON CLICK
        disabled={loading}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
        className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? (
          <>
            <div className="w-5 h-5 border-3 border-white border-t-transparent rounded-full animate-spin"></div>
            Processing...
          </>
        ) : (
          <>
            {initialData ? <Edit size={20} /> : <Save size={20} />}
            {initialData ? 'Update Publication' : 'Save Publication'}
          </>
        )}
      </motion.button>
    </form>
  );
};

export default UploadForm;