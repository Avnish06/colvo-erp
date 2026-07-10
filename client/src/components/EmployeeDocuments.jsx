import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import {
  FileText,
  Upload,
  CheckCircle,
  Clock,
  AlertCircle,
  Eye,
  X,
  ShieldCheck
} from 'lucide-react';

const EmployeeDocuments = () => {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(null); // stores doc_type being uploaded
  const [previewUrl, setPreviewUrl] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));

  const docTypes = [
    { type: 'Aadhar Card', description: '12-Digit Identity Card' },
    { type: 'PAN Card', description: 'Permanent Account Number' },
    { type: '10th Marksheet', description: 'Class X Educational Certificate' },
    { type: '12th Marksheet', description: 'Class XII Educational Certificate' },
    { type: 'Bachelor Degree', description: 'Undergraduate Certificate' },
    { type: 'Masters Degree', description: 'Postgraduate Certificate' },
    { type: 'Bank Passbook', description: 'Bank Account Details' },
    { type: 'Passport Size Photo', description: 'Recent Passport Photograph' },
    { type: 'Father Aadhar Card', description: 'Guardian Identity Card' },
    { type: 'Family Photos', description: 'required for the family verification purpose' }
  ];

  const fetchDocuments = async () => {
    try {
      const res = await axios.get(`/api/employees/${user.id}/documents`);
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching documents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const handleFileUpload = async (e, docType) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Maximum limit is 5MB.');
      return;
    }

    setUploading(docType);

    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        const res = await axios.post(`/api/employees/${user.id}/documents`, {
          doc_type: docType,
          doc_url: reader.result
        });

        if (res.data.success) {
          await fetchDocuments();
        }
      } catch (err) {
        console.error('Upload failed:', err);
        alert('Failed to upload document. Please try again.');
      } finally {
        setUploading(null);
      }
    };
    reader.readAsDataURL(file);
  };

  const getDocStatus = (type) => {
    return documents.find(doc => doc.doc_type === type);
  };

  const approvedCount = docTypes.filter(d => getDocStatus(d.type)?.status === 'Approved').length;

  const StatusBadge = ({ status }) => {
    const styles = {
      Pending: 'bg-amber-100 text-amber-600 border-amber-200',
      Approved: 'bg-emerald-100 text-emerald-600 border-emerald-200',
      Rejected: 'bg-red-100 text-red-600 border-red-200'
    };

    const icons = {
      Pending: <Clock size={12} />,
      Approved: <CheckCircle size={12} />,
      Rejected: <AlertCircle size={12} />
    };

    return (
      <span className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold border uppercase tracking-wider ${styles[status]}`}>
        {icons[status]}
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-gray-100 mb-8">
        
        {/* Compliance Progress Banner */}
        <div className="bg-[#2B4CBA] rounded-[24px] p-6 mb-10 text-white flex flex-col md:flex-row items-start md:items-center justify-between shadow-lg shadow-blue-900/10">
          <div>
            <div className="inline-block px-3 py-1 bg-white/20 rounded-full text-[10px] font-bold tracking-widest text-white mb-4 uppercase border border-white/20 backdrop-blur-md">
              Compliance Progress
            </div>
            <h2 className="text-2xl font-black mb-1 tracking-tight">Document Compliance Status</h2>
            <p className="text-blue-200/80 text-sm font-medium">Please upload all {docTypes.length} requested documents for administrator approval.</p>
          </div>
          <div className="mt-6 md:mt-0 text-right w-full md:w-auto">
            <div className="text-4xl font-black mb-1 leading-none">{approvedCount} <span className="text-2xl text-blue-300/50">/ {docTypes.length}</span></div>
            <div className="text-[10px] font-bold text-blue-300/80 uppercase tracking-widest pb-2 border-b border-white/10 text-right inline-block min-w-[150px]">Approved Documents</div>
          </div>
        </div>

        {/* Documents Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {docTypes.map((doc) => {
            const docInfo = getDocStatus(doc.type);
            const isUploading = uploading === doc.type;

            return (
              <div
                key={doc.type}
                className="group relative bg-white rounded-2xl p-5 border-2 border-gray-100/80 hover:border-blue-100 hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex gap-3">
                    <div className="w-10 h-10 bg-blue-50/50 rounded-xl flex items-center justify-center text-blue-500 border border-blue-100/50">
                      <FileText size={18} strokeWidth={2.5} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 text-sm mb-0.5">{doc.type}</h3>
                      <p className="text-[11px] text-gray-400 font-medium">{doc.description}</p>
                    </div>
                  </div>
                  
                  {docInfo ? (
                    <StatusBadge status={docInfo.status} />
                  ) : (
                    <span className="bg-red-50/80 text-red-500 border border-red-100/80 px-2 py-0.5 rounded-full text-[9px] font-extrabold tracking-widest uppercase">
                      Not Uploaded
                    </span>
                  )}
                </div>

                <div className="mt-6 flex flex-wrap items-stretch gap-2">
                  {/* Custom File Input Container */}
                  <label className={`flex-1 relative flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer border-2 border-dashed
                    ${isUploading
                      ? 'bg-gray-50 border-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-50/50 border-gray-200 hover:bg-blue-50/50 hover:border-blue-200 text-gray-500 hover:text-blue-600'
                    }`}>
                    
                    {isUploading ? (
                      <div className="w-4 h-4 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <Upload size={14} className="opacity-70" />
                        <span>Choose file</span>
                      </>
                    )}
                    <input
                      type="file"
                      className="hidden"
                      accept="image/*,.pdf"
                      onChange={(e) => handleFileUpload(e, doc.type)}
                      disabled={isUploading}
                    />
                  </label>

                  {/* Submit Button (acts as trigger) */}
                  <div className="flex gap-2">
                    {docInfo && (
                      <button
                        onClick={() => setPreviewUrl(docInfo.doc_url)}
                        className="w-[42px] bg-white border border-gray-200 text-gray-400 hover:text-blue-600 hover:border-blue-200 rounded-xl flex items-center justify-center transition-all shadow-sm"
                        title="Preview Document"
                      >
                        <Eye size={18} />
                      </button>
                    )}
                    <label className={`w-auto px-4 bg-blue-600 text-white rounded-xl flex items-center justify-center text-xs font-bold transition-all shadow-sm cursor-pointer hover:bg-blue-700 hover:shadow-md hover:shadow-blue-600/20 ${(isUploading || (docInfo && docInfo.status === 'Approved')) ? 'opacity-50 cursor-not-allowed pointer-events-none' : ''}`}>
                      Upload
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*,.pdf"
                        onChange={(e) => handleFileUpload(e, doc.type)}
                        disabled={isUploading || (docInfo && docInfo.status === 'Approved')}
                      />
                    </label>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="bg-amber-50 border border-amber-100 rounded-2xl p-6 flex flex-wrap items-start gap-4">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-amber-600 shadow-sm border border-amber-50">
          <AlertCircle size={20} />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-amber-900 mb-1">Verification Guidelines</h4>
          <ul className="text-xs text-amber-700/80 space-y-1.5 list-disc list-inside font-medium">
            <li>Ensure the uploaded documents are clearly visible and legible.</li>
            <li>Supported formats: JPG, PNG, PDF (Max size: 5MB).</li>
            <li>Verification usually takes 2-3 business days.</li>
            <li>Updating a document will reset its status to 'Pending' for re-verification.</li>
          </ul>
        </div>
      </div>

      {/* Preview Modal */}
      {previewUrl && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 md:p-12 animate-in fade-in duration-300">
          <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm" onClick={() => setPreviewUrl(null)} />
          <div className="relative bg-white rounded-[2rem] w-full max-w-4xl max-h-full overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-white z-10">
              <h3 className="font-bold text-gray-900 px-4">Document Preview</h3>
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

export default EmployeeDocuments;
