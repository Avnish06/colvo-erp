import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import {
  Users,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Filter,
  Eye,
  FileText,
  X,
  FileSearch,
  Calendar,
  Download,
  ShieldCheck,
  FileBarChart
} from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const EmployeeDocumentManager = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null); // { userId, docType }

  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isAuthorized = user.role === 'Super Admin' || user.role === 'Developer';


  const fetchSummary = async () => {
    try {
      const res = await axios.get('/api/employees/docs/summary');
      if (res.data.success) {
        setSummary(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching document summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSummary();
  }, []);

  const formatDate = (dateString) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
      time: date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
    };
  };

  const filteredSummary = summary.filter(emp =>
    emp.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const exportStatusReport = () => {
    try {
      const doc = new jsPDF();
      const pageWidth = doc.internal.pageSize.getWidth();
      const timestamp = new Date().toLocaleString('en-IN');

      // --- Header Section ---
      doc.setFillColor(37, 99, 235); // Blue-600
      doc.rect(0, 0, pageWidth, 40, 'F');

      doc.setTextColor(255, 255, 255);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(22);
      doc.text('ERP-CRM Pro', 15, 18);

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      doc.text('Compliance & Documentation Audit Report', 15, 26);

      doc.setFontSize(8);
      doc.text(`Generated: ${timestamp}`, pageWidth - 15, 15, { align: 'right' });

      // --- Statistics Summary ---
      const total = filteredSummary.length;
      const fullyVerified = filteredSummary.filter(emp =>
        Object.values(emp.documents).every(d => d?.status === 'Approved')
      ).length;
      const pending = filteredSummary.filter(emp =>
        Object.values(emp.documents).some(d => d?.status === 'Pending')
      ).length;

      doc.setFillColor(248, 250, 252); // Slate-50
      doc.roundedRect(15, 45, pageWidth - 30, 25, 3, 3, 'F');

      doc.setTextColor(71, 85, 105); // Slate-600
      doc.setFontSize(9);
      doc.setFont('helvetica', 'bold');
      doc.text('AUDIT SUMMARY', 20, 52);

      doc.setFont('helvetica', 'normal');
      doc.setTextColor(15, 23, 42); // Slate-900
      doc.text(`Total Employees: ${total}`, 20, 60);
      doc.text(`Fully Verified: ${fullyVerified}`, 80, 60);
      doc.text(`Pending Actions: ${pending}`, 140, 60);

      // --- Table Content ---
      const tableColumn = ["Employee ID", "Full Name", "Aadhar", "PAN Card", "Driving Lic.", "Overall"];
      const tableRows = filteredSummary.map(emp => {
        const docs = Object.values(emp.documents);
        const approved = docs.filter(d => d?.status === 'Approved').length;

        return [
          emp.employee_id,
          emp.name,
          emp.documents['Aadhar Card']?.status || 'Missing',
          emp.documents['PAN Card']?.status || 'Missing',
          emp.documents['Driving License']?.status || 'Missing',
          `${approved}/3 OK`
        ];
      });

      autoTable(doc, {
        head: [tableColumn],
        body: tableRows,
        startY: 75,
        theme: 'striped',
        headStyles: {
          fillColor: [30, 41, 59], // Slate-800
          textColor: [255, 255, 255],
          fontSize: 10,
          fontStyle: 'bold',
          halign: 'center'
        },
        columnStyles: {
          0: { fontStyle: 'bold', textColor: [37, 99, 235] },
          5: { halign: 'center', fontStyle: 'bold' }
        },
        alternateRowStyles: {
          fillColor: [248, 250, 252]
        },
        didDrawCell: (data) => {
          if (data.section === 'body') {
            const text = data.cell.text[0];
            if (text === 'Approved') {
              doc.setTextColor(37, 99, 235); // Blue-600
            } else if (text === 'Pending') {
              doc.setTextColor(180, 83, 9); // Amber-700
            } else if (text === 'Rejected' || text === 'Missing') {
              doc.setTextColor(220, 38, 38); // Red-600
            }
          }
        }
      });

      // --- Footer ---
      const pageCount = doc.internal.getNumberOfPages();
      for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(148, 163, 184); // Slate-400
        doc.text(
          `Page ${i} of ${pageCount} | Confidential Document Compliance Report`,
          pageWidth / 2,
          doc.internal.pageSize.getHeight() - 10,
          { align: 'center' }
        );
      }

      doc.save(`Compliance_Audit_${new Date().toISOString().split('T')[0]}.pdf`);
    } catch (error) {
      console.error('PDF Export Error:', error);
      alert('Failed to generate PDF. Please check the console for details.');
    }
  };

  const fetchDocumentContent = async (userId, docType) => {
    try {
      const res = await axios.get(`/api/employees/${userId}/documents`);
      if (res.data.success) {
        const doc = res.data.data.find(d => d.doc_type === docType);
        if (doc) setPreviewUrl(doc.doc_url);
      }
    } catch (err) {
      console.error('Error fetching document content:', err);
    }
  };

  const handleStatusUpdate = async (userId, docType, status) => {
    setUpdatingStatus({ userId, docType });
    try {
      const res = await axios.put(`/api/employees/${userId}/documents/status`, {
        doc_type: docType,
        status: status
      });

      if (res.data.success) {
        await fetchSummary();
      }
    } catch (err) {
      console.error('Error updating status:', err);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const DocStatusCell = ({ doc, userId, docType }) => {
    if (!doc) {
      return (
        <div className="flex flex-col items-center justify-center py-2">
          <XCircle size={20} className="text-red-500 mb-1" />
          <span className="text-[10px] font-black text-red-600 uppercase tracking-[0.15em]">Missing</span>
        </div>
      );
    }

    const dt = formatDate(doc.uploaded_at);
    const isPending = doc.status === 'Pending';
    const isApproved = doc.status === 'Approved';
    const isRejected = doc.status === 'Rejected';
    const isBusy = updatingStatus?.userId === userId && updatingStatus?.docType === docType;

    return (
      <div className="flex flex-col items-center justify-center py-2 group">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          {isApproved && <CheckCircle2 size={20} className="text-blue-600" />}
          {isPending && <Clock size={20} className="text-amber-500" />}
          {isRejected && <XCircle size={20} className="text-red-500" />}

          <div className="flex flex-wrap items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
            <button
              onClick={() => fetchDocumentContent(userId, docType)}
              className="p-1 hover:bg-blue-50 text-blue-600 rounded-lg transition-all"
              title="Quick Preview"
            >
              <Eye size={14} />
            </button>

            {isAuthorized && isPending && !isBusy && (
              <>
                <button
                  onClick={() => handleStatusUpdate(userId, docType, 'Approved')}
                  className="p-1 hover:bg-emerald-50 text-emerald-600 rounded-lg transition-all"
                  title="Approve"
                >
                  <CheckCircle2 size={14} />
                </button>
                <button
                  onClick={() => handleStatusUpdate(userId, docType, 'Rejected')}
                  className="p-1 hover:bg-red-50 text-red-600 rounded-lg transition-all"
                  title="Reject"
                >
                  <XCircle size={14} />
                </button>
              </>
            )}
            {isBusy && <div className="w-3 h-3 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />}
          </div>
        </div>

        <div className="flex flex-col items-center text-[10px] font-black uppercase tracking-widest text-gray-400">
          <span className={isApproved ? 'text-blue-600' : isPending ? 'text-amber-500' : 'text-red-500'}>
            {doc.status}
          </span>
          <span className="text-[8px] font-bold text-gray-300 flex items-center gap-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-all">
            <Clock size={8} /> {dt.date}
          </span>
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-96">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4" />
        <p className="text-gray-400 font-bold animate-pulse uppercase tracking-widest text-xs">Syncing Documentation Data...</p>
      </div>
    );
  }

  return (
    <div className="max-w-[1400px] mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-gray-100 mb-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div className="flex flex-wrap items-center gap-5">
            <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-inner">
              <FileSearch size={32} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-gray-900 tracking-tight">Document Verification</h2>
              <p className="text-gray-400 text-sm font-medium">Compliance overview of all registered employees.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-6 py-3.5 bg-gray-50 border-none rounded-2xl text-sm font-bold w-full md:w-80 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-gray-400"
              />
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="overflow-x-auto rounded-3xl border border-gray-100 bg-gray-50/50">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead>
              <tr className="bg-white border-b border-gray-100">
                <th className="sticky left-0 bg-white z-10 px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] shadow-[1px_0_0_0_#f3f4f6]">Employee Details</th>
                <th className="px-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Aadhar</th>
                <th className="px-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">PAN</th>
                <th className="px-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">10th Mark</th>
                <th className="px-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">12th Mark</th>
                <th className="px-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Bachelor</th>
                <th className="px-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Master</th>
                <th className="px-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Passbook</th>
                <th className="px-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Photo</th>
                <th className="px-4 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Father Aadhar</th>
                <th className="px-6 py-5 text-[11px] font-black text-gray-400 uppercase tracking-[0.2em] text-center">Overall</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {filteredSummary.map((emp) => {
                const docs = Object.values(emp.documents);
                const uploadedCount = docs.filter(d => d).length;
                const approvedCount = docs.filter(d => d?.status === 'Approved').length;
                const isFullyApproved = approvedCount === 9;
                const isPartiallyPending = docs.some(d => d?.status === 'Pending');

                return (
                  <tr key={emp.id} className="bg-white hover:bg-blue-50/30 transition-colors group">
                    <td className="sticky left-0 bg-white group-hover:bg-blue-50/50 z-10 px-6 py-5 shadow-[1px_0_0_0_#f3f4f6]">
                      <div className="flex flex-wrap items-center gap-4">
                        <div className="w-10 h-10 bg-white border-2 border-blue-600/30 rounded-xl flex items-center justify-center text-blue-600 font-black text-xs shadow-sm uppercase">
                          {emp.name.charAt(0)}
                        </div>
                        <div>
                          <p className="font-black text-gray-900 text-sm truncate max-w-[150px]">{emp.name}</p>
                          <p className="text-[10px] font-bold text-gray-400 tracking-wider">ID: {emp.employee_id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3"><DocStatusCell doc={emp.documents['Aadhar Card']} userId={emp.id} docType="Aadhar Card" /></td>
                    <td className="px-4 py-3 border-l border-gray-50/50"><DocStatusCell doc={emp.documents['PAN Card']} userId={emp.id} docType="PAN Card" /></td>
                    <td className="px-4 py-3 border-l border-gray-50/50"><DocStatusCell doc={emp.documents['10th Marksheet']} userId={emp.id} docType="10th Marksheet" /></td>
                    <td className="px-4 py-3 border-l border-gray-50/50"><DocStatusCell doc={emp.documents['12th Marksheet']} userId={emp.id} docType="12th Marksheet" /></td>
                    <td className="px-4 py-3 border-l border-gray-50/50"><DocStatusCell doc={emp.documents['Bachelor Degree']} userId={emp.id} docType="Bachelor Degree" /></td>
                    <td className="px-4 py-3 border-l border-gray-50/50"><DocStatusCell doc={emp.documents['Masters Degree']} userId={emp.id} docType="Masters Degree" /></td>
                    <td className="px-4 py-3 border-l border-gray-50/50"><DocStatusCell doc={emp.documents['Bank Passbook']} userId={emp.id} docType="Bank Passbook" /></td>
                    <td className="px-4 py-3 border-l border-gray-50/50"><DocStatusCell doc={emp.documents['Passport Size Photo']} userId={emp.id} docType="Passport Size Photo" /></td>
                    <td className="px-4 py-3 border-l border-gray-50/50"><DocStatusCell doc={emp.documents['Father Aadhar Card']} userId={emp.id} docType="Father Aadhar Card" /></td>
                    
                    <td className="px-6 py-5 text-center border-l border-gray-50/50">
                      <div className={`inline-flex items-center justify-center px-3 h-10 rounded-xl font-black text-[10px] tracking-tighter ${isFullyApproved
                        ? 'bg-blue-600 text-white shadow-lg shadow-blue-200'
                        : isPartiallyPending
                          ? 'bg-amber-100 text-amber-600 border border-amber-200'
                          : 'bg-gray-100 text-gray-400 border border-gray-200'
                        }`}>
                        {approvedCount}/9 VERIFIED
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredSummary.length === 0 && (
                <tr>
                  <td colSpan="5" className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-200">
                        <Users size={32} />
                      </div>
                      <p className="text-gray-400 font-bold uppercase tracking-widest text-xs">No employees found matching your search</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="bg-blue-600 rounded-[2.5rem] p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl shadow-blue-500/20">
        <div className="flex flex-wrap items-center gap-5">
          <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center backdrop-blur-md">
            <Filter size={24} />
          </div>
          <div>
            <h4 className="font-black text-lg">Detailed Documentation Audit</h4>
            <p className="text-blue-100 text-sm font-medium">Click on the eye icon next to a green tick to instantly preview the uploaded document.</p>
          </div>
        </div>
        <button
          onClick={exportStatusReport}
          className="flex items-center gap-2 px-8 py-4 bg-white text-blue-600 font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-lg shadow-black/5"
        >
          <Download size={18} />
          Export Status Report
        </button>
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPreviewUrl(null)} />
          <div className="relative bg-white rounded-[2rem] w-full max-w-4xl max-h-full overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white z-10">
              <h3 className="font-bold text-gray-900 px-4">Document Verification</h3>
              <button
                onClick={() => setPreviewUrl(null)}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors mr-2"
              >
                <X size={24} className="text-gray-400" />
              </button>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-50 min-h-[400px]">
              {previewUrl.startsWith('data:application/pdf') ? (
                <iframe src={previewUrl} className="w-full h-full min-h-[600px] rounded-xl border border-gray-200" title="PDF Preview" />
              ) : (
                <img src={previewUrl} alt="Document Preview" className="max-w-full mx-auto rounded-xl shadow-lg" />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default EmployeeDocumentManager;
