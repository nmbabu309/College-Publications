import { useState, useRef, useEffect } from 'react';
import * as XLSX from 'xlsx';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { Upload, FileSpreadsheet, CheckCircle, AlertCircle, X, Download } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { isValidEmailDomain, getEmailDomainError } from '../../config/constants';
import api from '../../api/axios';

const BulkImport = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ total: 0, success: 0, failed: 0 });
  const [errors, setErrors] = useState([]);
  const [resultData, setResultData] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  // Window-level drag detection for external file drags
  useEffect(() => {
    if (!isOpen) return;

    const handleWindowDragEnter = (e) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
        setIsDragging(true);
      }
    };

    const handleWindowDragOver = (e) => {
      if (e.dataTransfer?.types?.includes('Files')) {
        e.preventDefault();
      }
    };

    const handleWindowDragLeave = (e) => {
      // Only hide if leaving the window entirely
      if (e.clientX === 0 && e.clientY === 0) {
        setIsDragging(false);
      }
    };

    const handleWindowDrop = (e) => {
      e.preventDefault();
      setIsDragging(false);
    };

    window.addEventListener('dragenter', handleWindowDragEnter);
    window.addEventListener('dragover', handleWindowDragOver);
    window.addEventListener('dragleave', handleWindowDragLeave);
    window.addEventListener('drop', handleWindowDrop);

    return () => {
      window.removeEventListener('dragenter', handleWindowDragEnter);
      window.removeEventListener('dragover', handleWindowDragOver);
      window.removeEventListener('dragleave', handleWindowDragLeave);
      window.removeEventListener('drop', handleWindowDrop);
    };
  }, [isOpen]);

  const generateResultExcel = async () => {
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Import Results');

    // Define headers
    const headers = [
      'Row #', 'Status', 'Error Message', 'Main Author', 'Title', 'Email', 'Phone',
      'Dept', 'Co-Authors', 'Journal', 'Publisher', 'Year', 'Volume', 'Issue No',
      'Pages', 'Indexation', 'ISSN No', 'Journal Link', 'UGC Approved',
      'Impact Factor', 'PDF URL'
    ];

    // Add header row with styling
    const headerRow = worksheet.addRow(headers);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' }
    };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center' };

    // Add data rows
    resultData.forEach((result) => {
      const row = worksheet.addRow([
        result.rowNumber,
        result.status === 'success' ? '✅ SUCCESS' : '❌ FAILED',
        result.error || '',
        result.data['Main Author'] || result.data['mainAuthor'] || '',
        result.data['Title'] || result.data['title'] || '',
        result.data['Email'] || result.data['email'] || '',
        result.data['Phone'] || result.data['phone'] || '',
        result.data['Dept'] || result.data['dept'] || '',
        result.data['Co-Authors'] || result.data['Coauthors'] || result.data['coauthors'] || '',
        result.data['Journal'] || result.data['journal'] || '',
        result.data['Publisher'] || result.data['publisher'] || '',
        result.data['Year'] || result.data['year'] || '',
        result.data['Volume'] || result.data['vol'] || '',
        result.data['Issue No'] || result.data['issueNo'] || '',
        result.data['Pages'] || result.data['pages'] || '',
        result.data['Indexation'] || result.data['indexation'] || '',
        result.data['ISSN No'] || result.data['issnNo'] || '',
        result.data['Journal Link'] || result.data['journalLink'] || '',
        result.data['UGC Approved'] || result.data['ugcApproved'] || '',
        result.data['Impact Factor'] || result.data['impactFactor'] || '',
        result.data['PDF URL'] || result.data['pdfUrl'] || ''
      ]);

      // Color code the row
      if (result.status === 'success') {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFC6EFCE' } // Light green
        };
      } else {
        row.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFC7CE' } // Light red
        };
      }
    });

    // Auto-fit columns
    worksheet.columns.forEach(column => {
      column.width = 15;
    });
    worksheet.getColumn(2).width = 12; // Status
    worksheet.getColumn(3).width = 30; // Error Message

    // Generate and download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `import-results-${new Date().getTime()}.xlsx`);
  };

  const handleFileUpload = async (fileOrEvent) => {
    // Handle both File objects (from drag-drop) and events (from input)
    let file;
    if (fileOrEvent instanceof File) {
      file = fileOrEvent;
    } else {
      file = fileOrEvent.target?.files?.[0];
    }

    if (!file) return;

    setLoading(true);
    setStats({ total: 0, success: 0, failed: 0 });
    setErrors([]);
    setResultData([]);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const bstr = evt.target.result;
        const wb = XLSX.read(bstr, { type: 'binary' });
        const wsname = wb.SheetNames[0];
        const ws = wb.Sheets[wsname];
        const data = XLSX.utils.sheet_to_json(ws, { range: 1 });

        if (data.length === 0) {
          throw new Error('Sheet is empty');
        }

        setStats(prev => ({ ...prev, total: data.length }));

        let successCount = 0;
        let failCount = 0;
        const newErrors = [];
        const results = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowNumber = i + 2; // +2 because Excel is 1-indexed and we skip header

          try {
            const rawEmail = row['Email'] || row['email'] || '';
            const email = String(rawEmail).trim();
            const phone = String(row['Phone'] || row['phone'] || '').trim();
            const year = row['Year'] || row['year'] || '';

            // Simple phone validation - Indian mobile numbers only
            if (phone) {
              if (phone.length !== 10) {
                throw new Error('Invalid phone number');
              }

              if (!/^\d+$/.test(phone)) {
                throw new Error('Invalid phone number');
              }

              if (phone[0] !== '6' && phone[0] !== '7' && phone[0] !== '8' && phone[0] !== '9') {
                throw new Error('Invalid phone number');
              }
            }

            // Validate year
            if (year) {
              const yearNum = parseInt(year);
              const currentYear = new Date().getFullYear();

              if (isNaN(yearNum)) {
                throw new Error('Invalid year: must be a valid number');
              }
              if (yearNum > currentYear) {
                throw new Error(`Invalid year: cannot be greater than ${currentYear}`);
              }
              if (yearNum < 1900) {
                throw new Error('Invalid year: must be 1900 or later');
              }

              // Validate pages field (only numbers and hyphens)
              const pagesField = row['Pages'] || row['pages'] || '';
              if (pagesField && String(pagesField).trim() !== '') {
                const pagesStr = String(pagesField).trim();
                if (!/^[0-9\-]+$/.test(pagesStr)) {
                  throw new Error('Invalid pages format: only numbers and hyphens allowed (e.g., 100-112)');
                }
              }
            }

            const payload = {
              mainAuthor: row['Main Author'] || row['mainAuthor'] || '',
              title: row['Title'] || row['title'] || '',
              email: email,
              phone: phone,
              dept: row['Dept'] || row['dept'] || '',
              coauthors: row['Co-Authors'] || row['Coauthors'] || row['coauthors'] || '',
              journal: row['Journal'] || row['journal'] || '',
              publisher: row['Publisher'] || row['publisher'] || '',
              year: year,
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

            // Email domain validation
            if (!payload.email || !isValidEmailDomain(payload.email)) {
              throw new Error(getEmailDomainError());
            }

            await api.post('/form/formEntry', payload);
            successCount++;

            // Track success
            results.push({
              rowNumber,
              status: 'success',
              data: row,
              error: null
            });

          } catch (err) {
            failCount++;
            const errorMsg = err.response?.data?.message || err.message || 'Upload failed';
            newErrors.push(`Row ${rowNumber}: ${errorMsg}`);

            // Track failure
            results.push({
              rowNumber,
              status: 'failed',
              data: row,
              error: errorMsg
            });
          }

          setStats({ total: data.length, success: successCount, failed: failCount });
        }

        setResultData(results);

        if (newErrors.length > 0) {
          setErrors(newErrors.slice(0, 5));
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

  const handleModalDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls'))) {
      handleFileUpload(file);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onDrop={handleModalDrop}>
          {/* Full-Screen Drag Overlay */}
          <AnimatePresence>
            {isDragging && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0 }}
                className="absolute inset-0 z-50 bg-slate-900/90 flex flex-col items-center justify-center"
                style={{ willChange: 'opacity' }}
              >
                <div className="flex flex-col items-center gap-6">
                  <div className="p-6 bg-white/10 rounded-3xl border-4 border-dashed border-white/40">
                    <FileSpreadsheet size={80} className="text-white" strokeWidth={1.5} />
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-semibold text-white mb-2">
                      Drop files here to upload
                    </p>
                    <p className="text-sm text-white/70">
                      Excel files only (.xlsx, .xls)
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

            <div className="p-6 space-y-6 relative">


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
                  className={`inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl border-2 border-dashed bg-indigo-50/50 text-indigo-600 font-medium hover:bg-indigo-50 w-full cursor-pointer transition-all ${loading ? 'opacity-50 cursor-not-allowed' : 'border-indigo-200 hover:border-indigo-300'}`}
                >
                  {!loading && <Upload size={20} />}
                  {loading ? 'Processing...' : 'Click to Upload or Drag & Drop Excel File'}
                </label>
              </div>

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
                      <p className="text-xs font-semibold text-red-500 mb-1">Errors (showing first 5):</p>
                      <ul className="text-xs text-red-400 space-y-1 max-h-24 overflow-y-auto">
                        {errors.map((e, i) => <li key={i}>{e}</li>)}
                      </ul>
                    </div>
                  )}

                  {/* Download Result Button */}
                  {resultData.length > 0 && (
                    <div className="mt-4 pt-3 border-t border-slate-200">
                      <button
                        onClick={generateResultExcel}
                        className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all"
                      >
                        <Download size={18} />
                        Download Result Report
                      </button>
                      <p className="text-[10px] text-slate-500 mt-2 text-center italic">
                        Green rows = Success | Red rows = Failed
                      </p>
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
