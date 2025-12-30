import { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../../api/axios';

const BulkImport = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
  const [errors, setErrors] = useState([]);
  const fileInputRef = useRef(null);

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setLoading(true);
    setStats({ total: 0, success: 0, failed: 0 });
    setErrors([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        // range: 1 skips the first row (Title row) so headers are read from the second row
        const data = XLSX.utils.sheet_to_json(ws, { range: 1 });
        
        console.log('Parsed Data:', data);
        
        if (data.length === 0) {
            throw new Error('Sheet is empty');
        }

        setStats(prev => ({ ...prev, total: data.length }));
        
        let successCount = 0;
        let failCount = 0;
        const newErrors = [];

        for (let i = 0; i < data.length; i++) {
            const row = data[i];
            try {
                // Determine email with fallback and trim whitespace
                const rawEmail = row['Email'] || row['email'] || '';
                const email = String(rawEmail).trim();

                // Minimal normalization
                const payload = {
                    mainAuthor: row['Main Author'] || row['mainAuthor'] || '',
                    title: row['Title'] || row['title'] || '',
                    email: email,
                    phone: row['Phone'] || row['phone'] || '',
                    dept: row['Dept'] || row['dept'] || '',
                    coauthors: row['Co-Authors'] || row['Coauthors'] || row['coauthors'] || '',
                    journal: row['Journal'] || row['journal'] || '',
                    publisher: row['Publisher'] || row['publisher'] || '',
                    year: row['Year'] || row['year'] || '',
                    vol: row['Volume'] || row['vol'] || '',
                    issueNo: row['Issue No'] || row['issueNo'] || '',
                    pages: row['Pages'] || row['pages'] || '',
                    indexation: row['Indexation'] || row['indexation'] || '',
                    issnNo: row['ISSN No'] || row['issnNo'] || '',
                    journalLink: row['Journal Link'] || row['journalLink'] || '',
                    ugcApproved: row['UGC Approved'] || row['ugcApproved'] || '',
                    impactFactor: row['Impact Factor'] || row['impactFactor'] || '',
                    pdfUrl: row['PDF URL'] || row['pdfUrl'] || ''
                };

                if (!payload.email || !payload.email.toLowerCase().endsWith('@nriit.edu.in')) {
                    console.error(`Email validation failed for: ${payload.email}`);
                    throw new Error(`Invalid email domain: ${payload.email}. Only @nriit.edu.in is allowed.`);
                }

                await api.post('/form/formEntry', payload);
                successCount++;
            } catch (err) {
                console.error(`Row ${i + 1} failed`, err);
                failCount++;
                newErrors.push(`Row ${i + 2}: ${err.response?.data?.message || err.message || 'Upload failed'}`);
            }
            
            setStats({ total: data.length, success: successCount, failed: failCount });
        }
        
        if (newErrors.length > 0) {
            setErrors(newErrors.slice(0, 5)); // Show top 5 errors
        }

        if (successCount > 0 && onSuccess) {
             onSuccess();
        }

      } catch (err) {
        console.error('File parsing error', err);
        setErrors(['Failed to parse Excel file. Ensure standard format.']);
      } finally {
        setLoading(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    
    reader.readAsBinaryString(file);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />
          
          <motion.div
            initial={{ scale: 0.95, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 20 }}
            className="relative w-full max-w-lg bg-white border border-white/20 shadow-premium rounded-2xl overflow-hidden z-10"
          >
             {/* Header */}
             <div className="bg-gradient-to-r from-indigo-50 to-white px-6 py-4 border-b border-indigo-100 flex justify-between items-center">
                 <h3 className="font-semibold text-slate-900 flex items-center gap-2">
                    <div className="p-2 bg-green-50 rounded-lg text-green-600">
                      <FileSpreadsheet size={20} />
                    </div>
                    Bulk Import Publications
                 </h3>
                 <button 
                    onClick={onClose}
                    className="p-1 hover:bg-slate-100 rounded-full transition-colors text-slate-500"
                  >
                    <X size={20} />
                  </button>
             </div>

             <div className="p-6 space-y-6">
                <div className="text-center space-y-4">
                    <p className="text-sm text-slate-500">
                        Upload an Excel file (.xlsx) containing multiple publication records. Ensure column names match the standard format.
                    </p>

                    <input 
                      type="file" 
                      accept=".xlsx, .xls"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      className="hidden" 
                      id="bulk-import-modal-input"
                      disabled={loading}
                    />
                    <label 
                      htmlFor="bulk-import-modal-input"
                      className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/50 text-indigo-600 font-medium hover:bg-indigo-50 hover:border-indigo-300 w-full cursor-pointer transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                    >
                      {!loading && <Upload size={20} />}
                      {loading ? 'Processing...' : 'Click to Upload Excel File'}
                    </label>
                </div>

                {/* Progress / Status Area */}
                {(stats.success > 0 || stats.failed > 0) && (
                    <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 text-sm">
                       <div className="flex justify-between items-center mb-3 text-xs font-semibold text-slate-400 uppercase tracking-wider">
                           <span>Import Status</span>
                           <span>Total: {stats.total}</span>
                       </div>
                       <div className="flex gap-4">
                           <div className="flex-1 flex items-center gap-2 bg-white p-2 rounded-lg border border-green-100 text-green-700 shadow-sm">
                               <CheckCircle size={16} />
                               <div className="flex flex-col leading-none">
                                   <span className="font-bold">{stats.success}</span>
                                   <span className="text-[10px] opacity-70">Success</span>
                               </div>
                           </div>
                           <div className="flex-1 flex items-center gap-2 bg-white p-2 rounded-lg border border-red-100 text-red-700 shadow-sm">
                               <AlertCircle size={16} />
                               <div className="flex flex-col leading-none">
                                   <span className="font-bold">{stats.failed}</span>
                                   <span className="text-[10px] opacity-70">Failed</span>
                               </div>
                           </div>
                       </div>
                       
                       {errors.length > 0 && (
                         <div className="mt-3 pt-3 border-t border-slate-200">
                            <p className="text-xs font-semibold text-red-500 mb-1">Errors:</p>
                            <ul className="text-xs text-red-400 space-y-1 max-h-24 overflow-y-auto">
                                {errors.map((e, i) => <li key={i}>{e}</li>)}
                            </ul>
                         </div>
                       )}
                    </div>
                )}
             </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default BulkImport;
