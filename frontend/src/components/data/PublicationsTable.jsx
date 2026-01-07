import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Loader2,
  Trash2,
  AlertCircle,
  Edit,
  FileText,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import api from "../../api/axios";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";
import EditPublicationModal from "../forms/EditPublicationModal";

const PublicationsTable = ({ showActions = false }) => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({});
  const { user, isAuthenticated, isAdmin } = useAuth();
  const navigate = useNavigate();

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Deletion state
  const [deleteId, setDeleteId] = useState(null);

  // Edit state
  const [editItem, setEditItem] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  useEffect(() => {
    fetchData();
  }, [isAuthenticated, isAdmin]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const response = await api.get("/form/formGet");
      setData(response.data);
    } catch (err) {
      setError("Failed to load publications.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteClick = (row) => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    setDeleteId(row.id);
  };

  const handleEditClick = (row) => {
    if (!isAuthenticated) {
      navigate("/");
      return;
    }
    setEditItem(row);
    setIsEditOpen(true);
  };

  const confirmDelete = async () => {
    try {
      await api.delete(`/form/deleteEntry/${deleteId}`);
      // Remove from local state
      setData((prev) => prev.filter((item) => item.id !== deleteId));
      setDeleteId(null);
      console.log("Deleted successfully");
    } catch (err) {
      alert(err.response?.data?.message || "Failed to delete");
    }
  };

  const handleEditSuccess = () => {
    fetchData(); // Refresh data
    // Modal closes automatically via UploadForm onClose or we can force close here
    setIsEditOpen(false);
    setEditItem(null);
  };

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    setCurrentPage(1); // Reset to first page on sort change
  };

  const columns = [
    { key: "mainAuthor", label: "Main Author", minWidth: "180px" },
    { key: "publicationType", label: "Publication Type", minWidth: "180px" },
    { key: "title", label: "Title", minWidth: "250px" },
    { key: "email", label: "Email", minWidth: "150px" },
    { key: "dept", label: "Dept", minWidth: "100px" },
    { key: "coauthors", label: "Co-Authors", minWidth: "200px" },
    { key: "journal", label: "Journal", minWidth: "200px" },
    { key: "publisher", label: "Publisher", minWidth: "180px" },
    { key: "year", label: "Year", minWidth: "80px" },
    { key: "vol", label: "Vol", minWidth: "60px" },
    { key: "issueNo", label: "Issue", minWidth: "60px" },
    { key: "pages", label: "Pages", minWidth: "100px" },
    { key: "indexation", label: "Index", minWidth: "120px" },
    { key: "issnNo", label: "ISSN/ISBN", minWidth: "120px" },
    { key: "journalLink", label: "Journal Link", isLink: true, minWidth: "120px" },
    { key: "ugcApproved", label: "UGC", minWidth: "80px" },
    { key: "impactFactor", label: "Impact", minWidth: "80px" },
    { key: "pdfUrl", label: "DOI Link", isLink: true, minWidth: "100px" },
  ];

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
    setCurrentPage(1); // Reset to first page on filter change
  };

  const filteredData = useMemo(() => {
    return data.filter((item) => {
      return Object.entries(filters).every(([key, searchTerm]) => {
        if (!searchTerm) return true;
        const itemValue = item[key]?.toString().toLowerCase() || "";
        return itemValue.includes(searchTerm.toLowerCase());
      });
    });
  }, [data, filters]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        const valA = a[sortConfig.key] ? String(a[sortConfig.key]).toLowerCase() : '';
        const valB = b[sortConfig.key] ? String(b[sortConfig.key]).toLowerCase() : '';

        if (valA < valB) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (valA > valB) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  // Pagination Logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = sortedData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  const paginate = (pageNumber) => setCurrentPage(pageNumber);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Loader2 className="animate-spin text-primary mb-4" size={40} />
        <p className="text-slate-500">Loading publications...</p>
      </div>
    );
  }

  if (error) {
    return <div className="text-center py-20 text-red-500">{error}</div>;
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden flex flex-col h-full"
      >
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50/80 text-slate-800 font-bold uppercase tracking-wider text-xs border-b border-slate-200 sticky top-0 z-10 shadow-sm backdrop-blur-sm">
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    className="px-4 py-3 align-top bg-slate-50/50 hover:bg-slate-100 cursor-pointer transition-colors group select-none"
                    style={{ minWidth: col.minWidth }}
                    onClick={() => requestSort(col.key)}
                  >
                    <div className="flex items-center gap-1 mb-2">
                      {col.label}
                      <span className="text-slate-400">
                        {sortConfig.key === col.key ? (
                          sortConfig.direction === 'asc' ? <ArrowUp size={14} className="text-primary" /> : <ArrowDown size={14} className="text-primary" />
                        ) : (
                          <ArrowUpDown size={14} className="opacity-0 group-hover:opacity-50 transition-opacity" />
                        )}
                      </span>
                    </div>
                    <div className="relative" onClick={(e) => e.stopPropagation()}>
                      <Search
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
                        size={12}
                      />
                      <input
                        type="text"
                        placeholder={`Search...`}
                        className="w-full pl-8 pr-2 py-1.5 bg-white border border-slate-200 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-normal normal-case shadow-sm placeholder:text-slate-300"
                        value={filters[col.key] || ""}
                        onChange={(e) =>
                          handleFilterChange(col.key, e.target.value)
                        }
                      />
                    </div>

                  </th>
                ))}
                {/* Action Column */}
                {(showActions || isAuthenticated) && (
                  <th className="px-4 py-3 w-24 align-top bg-slate-50/80 sticky right-0 z-20 shadow-[-5px_0_10px_-5px_rgb(0,0,0,0.05)] backdrop-blur-sm">
                    <div className="mb-2 text-center">Actions</div>
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {currentItems.length > 0 ? (
                currentItems.map((row) => (
                  <tr
                    key={row.id}
                    className="hover:bg-slate-50 transition-colors group"
                  >
                    {columns.map((col) => (
                      <td
                        key={`${row.id}-${col.key}`}
                        className="px-4 py-3 text-slate-700"
                      >
                        {col.isLink ? (
                          row[col.key] ? (
                            <a
                              href={row[col.key]}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary hover:text-indigo-700 font-medium inline-flex items-center gap-1 px-2.5 py-1 bg-indigo-50 rounded-md hover:bg-indigo-100 transition-colors"
                            >
                              <FileText size={14} /> View
                            </a>
                          ) : (
                            <span className="text-slate-300 ml-2">-</span>
                          )
                        ) : (
                          <div
                            className="whitespace-normal break-words"
                            style={{ minWidth: col.minWidth, maxWidth: "300px" }}
                          >
                            {row[col.key] || (
                              <span className="text-slate-300">-</span>
                            )}
                          </div>
                        )}
                      </td>
                    ))}
                    {(showActions || isAuthenticated) && (
                      <td className="px-4 py-3 text-center sticky right-0 bg-white group-hover:bg-slate-50 shadow-[-5px_0_10px_-5px_rgb(0,0,0,0.05)] border-l border-transparent z-10">
                        <div className="flex items-center justify-center gap-1">
                          {/* Check permissions: Owner OR Admin */}
                          {isAuthenticated &&
                            (isAdmin || user?.userEmail === row.email) ? (
                            <>
                              <button
                                onClick={() => handleEditClick(row)}
                                className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50/80 rounded-lg transition-all hover:scale-105 active:scale-95"
                                title="Edit Entry"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(row)}
                                className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50/80 rounded-lg transition-all hover:scale-105 active:scale-95"
                                title="Delete Entry"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          ) : (
                            <span className="text-slate-200 text-xs px-2">
                              Read-only
                            </span>
                          )}
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={columns.length + 1}
                    className="p-8 text-center text-slate-500 italic"
                  >
                    No publications found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination & Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex flex-col sm:flex-row justify-between items-center gap-3 shrink-0">
          <div className="flex items-center gap-4 text-[10px] sm:text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <span>Rows per page:</span>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-white border border-slate-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-primary cursor-pointer"
              >
                {[10, 25, 50, 100].map(size => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
            </div>
            <span>
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredData.length)} of {filteredData.length} records
            </span>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => paginate(currentPage - 1)}
                disabled={currentPage === 1}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex gap-1">
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  // Logic to show pages around current page
                  let pageNum;
                  if (totalPages <= 5) {
                    pageNum = i + 1;
                  } else if (currentPage <= 3) {
                    pageNum = i + 1;
                  } else if (currentPage >= totalPages - 2) {
                    pageNum = totalPages - 4 + i;
                  } else {
                    pageNum = currentPage - 2 + i;
                  }

                  return (
                    <button
                      key={pageNum}
                      onClick={() => paginate(pageNum)}
                      className={`w-8 h-8 flex items-center justify-center text-xs font-medium rounded-lg border transition-all shadow-sm ${currentPage === pageNum
                        ? "bg-primary text-white border-primary shadow-primary/25 ring-2 ring-primary/20"
                        : "bg-white text-slate-600 border-slate-200 hover:bg-slate-50 hover:border-slate-300"
                        }`}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>

              <button
                onClick={() => paginate(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="w-8 h-8 flex items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 hover:text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
              >
                <svg width="16" height="16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/20 backdrop-blur-sm"
              onClick={() => setDeleteId(null)}
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative bg-white rounded-xl shadow-xl w-full max-w-sm p-6 border border-slate-100"
            >
              <div className="flex flex-col items-center text-center gap-4">
                <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-500">
                  <AlertCircle size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">
                    Delete Publication?
                  </h3>
                  <p className="text-sm text-slate-500 mt-1">
                    This action cannot be undone.
                  </p>
                </div>
                <div className="flex w-full gap-3 mt-2">
                  <button
                    onClick={() => setDeleteId(null)}
                    className="flex-1 btn bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="flex-1 btn bg-red-600 text-white hover:bg-red-700 shadow-md shadow-red-500/20"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Edit Modal */}
      <EditPublicationModal
        isOpen={isEditOpen}
        onClose={() => {
          setIsEditOpen(false);
          setEditItem(null);
        }}
        publication={editItem}
        onSuccess={handleEditSuccess}
      />
    </>
  );
};

export default PublicationsTable;
