import { useState } from "react";
import { Download, Upload as UploadIcon, FileSpreadsheet, ChevronLeft } from "lucide-react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import UploadForm from "../components/forms/UploadForm";
import BulkImport from "../components/forms/BulkImport";
import PublicationsTable from "../components/data/PublicationsTable";
import api from "../api/axios";

const Upload = () => {
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);

  const handleSuccess = () => {
    // Trigger table refresh
    setRefreshTrigger((prev) => prev + 1);
  };

  const handleDownloadTemplate = async () => {
    try {
      const response = await api.get("/form/downloadTemplate", {
        responseType: "arraybuffer",
      });
      //                                                    ^^^^^^^^^^^^^^^^^^^^^^^^
      // Use 'arraybuffer' instead of 'blob'. This forces the response into a raw binary buffer.

      // Use the ArrayBuffer directly to create the Blob
      const excelMimeType =
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      const blob = new Blob([response.data], { type: excelMimeType });

      // The rest of the download logic remains the same...
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", "publications_template.xlsx");
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed", err);
      alert("Failed to download template");
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[--background]">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-6 md:py-8 space-y-8">
        {/* Back to Home Button */}
        <div>
          <button
            onClick={() => window.location.href = '/'}
            className="flex items-center gap-2 px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 rounded-lg font-medium transition-colors border border-slate-200 shadow-sm"
          >
            <ChevronLeft size={18} />
            Back to Home
          </button>
        </div>

        {/* Top Section: Form and Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Left: Upload Form */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-200">
              <h2 className="text-xl font-bold font-heading mb-6 text-primary flex items-center gap-2">
                <UploadIcon size={24} />
                Add New Publication
              </h2>
              <UploadForm onSuccess={handleSuccess} />
            </div>
          </div>

          {/* Right: Quick Actions */}
          <div className="flex flex-col gap-4">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <h3 className="font-semibold text-slate-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  onClick={() => setIsBulkImportOpen(true)}
                  className="w-full btn bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200 justify-start h-auto py-4"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm text-indigo-600">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="text-left">
                    <span className="block font-semibold">Bulk Import</span>
                    <span className="text-xs opacity-75 font-normal">
                      Upload Excel sheet
                    </span>
                  </div>
                </button>

                <button
                  onClick={handleDownloadTemplate}
                  className="w-full btn bg-slate-50 text-slate-600 hover:bg-slate-100 border border-slate-200 justify-start h-auto py-4"
                >
                  <div className="p-2 bg-white rounded-lg shadow-sm text-slate-600">
                    <FileSpreadsheet size={20} />
                  </div>
                  <div className="text-left">
                    <span className="block font-semibold">
                      Download Template
                    </span>
                    <span className="text-xs opacity-75 font-normal">
                      Get the Excel format
                    </span>
                  </div>
                </button>

                <div className="pt-2 border-t border-slate-100">
                  <a
                    href="/form/downloadExcel"
                    target="_blank"
                    download
                    className="w-full btn bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 justify-start h-auto py-3"
                  >
                    <div className="p-2 bg-white rounded-lg shadow-sm text-green-600">
                      <Download size={20} />
                    </div>
                    <div className="text-left">
                      <span className="block font-semibold">Export to Excel</span>
                      <span className="text-[10px] opacity-75 font-normal">Download full database</span>
                    </div>
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Database Preview */}
        <div className="flex flex-col bg-white rounded-2xl shadow-lg border border-slate-200 min-h-[500px]">
          <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
            <h3 className="font-semibold text-sm uppercase tracking-wide text-slate-500 flex items-center gap-2">
              Database Preview
            </h3>
          </div>
          <div className="flex-grow p-0 overflow-hidden">
            <PublicationsTable key={refreshTrigger} showActions={true} />
          </div>
        </div>
      </main>

      <Footer />

      <BulkImport
        isOpen={isBulkImportOpen}
        onClose={() => setIsBulkImportOpen(false)}
        onSuccess={handleSuccess}
      />
    </div>
  );
};

export default Upload;
