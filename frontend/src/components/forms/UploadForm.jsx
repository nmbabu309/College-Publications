import { useState, useEffect } from 'react';
import { Save, Edit, User, Mail, BookOpen, Building2, Users, FileText, Calendar, Hash, Link, Award, TrendingUp, Globe, CheckCircle2, Sparkles, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isValidEmailDomain, getEmailDomainError, ALLOWED_EMAIL_DOMAINS } from '../../config/constants';
import api from '../../api/axios';

const UploadForm = ({ onSuccess, initialData = null, onClose }) => {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState({ type: '', text: '' });

  const initialForm = {
    mainAuthor: '',
    title: '',
    email: '',
    phone: '',
    dept: '',
    coauthors: '',
    journal: '',
    publisher: '',
    year: '2005',
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
      return `Year cannot be greater than ${currentYear}`;
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
  }, [initialData]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      // Show fixed success popup
      setShowSuccessPopup(true);
      setTimeout(() => setShowSuccessPopup(false), 4000);


      if (onSuccess) onSuccess();
      if (onClose) setTimeout(onClose, 1000);

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
    <form onSubmit={handleSubmit} className="space-y-6">
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
                className={`${inputClass} ${validationErrors.email ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`}
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
                <option value="DS">DS</option>
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
                className={`${inputClass} ${validationErrors.phone ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`}
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
                className={`${inputClass} ${validationErrors.year ? 'border-red-500 focus:ring-red-500/20 focus:border-red-500' : ''}`}
                placeholder="2024"
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
                ISSN No
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
              Link to Article (DOI)
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

      {/* Fixed Success Notification Popup */}
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
                  <h4 className="font-bold text-lg mb-1">Success!</h4>
                  <p className="text-white/90 text-sm">
                    {initialData ? 'Publication updated successfully!' : 'Publication added successfully!'}
                  </p>
                </div>
                <button
                  onClick={() => setShowSuccessPopup(false)}
                  className="text-white/80 hover:text-white transition-colors"
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
        type="submit"
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
