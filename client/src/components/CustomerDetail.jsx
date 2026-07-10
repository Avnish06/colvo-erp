import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  User, Mail, Phone, Building2, Calendar,
  MessageSquare, FileText, Send, Plus,
  ArrowLeft, Upload, Download, Trash2,
  ExternalLink, Clock, Activity, ShieldCheck
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';

const CustomerDetail = ({ customerId, onNavigate }) => {
  const [data, setData] = useState({ customer: null, interactions: [], documents: [] });
  const [loading, setLoading] = useState(true);
  const [newInteraction, setNewInteraction] = useState({ type: 'Call', content: '' });
  const [isDocModalOpen, setIsDocModalOpen] = useState(false);
  const [docFile, setDocFile] = useState(null);
  const [docType, setDocType] = useState('Quote');
  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDocId, setPendingDocId] = useState(null);
  
  

  useEffect(() => {
    if (customerId) fetchDetails();
  }, [customerId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/customers/${customerId}`);
      if (res.data.success) {
        setData(res.data);
      }
    } catch (err) {
      toast.error('Error fetching customer details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInteraction = async (e) => {
    e.preventDefault();
    if (!newInteraction.content.trim()) return;
    try {
      await axios.post(`/api/customers/${customerId}/interactions`, newInteraction);
      setNewInteraction({ type: 'Call', content: '' });
      fetchDetails();
      toast.success('Interaction logged');
    } catch (err) {
      toast.error('Error logging interaction');
    }
  };

  const handleUploadDoc = async (e) => {
    e.preventDefault();
    if (!docFile) return;

    const formData = new FormData();
    formData.append('document', docFile);
    formData.append('type', docType);

    try {
      await axios.post(`/api/customers/${customerId}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setIsDocModalOpen(false);
      setDocFile(null);
      fetchDetails();
      toast.success('Document uploaded successfully');
    } catch (err) {
      toast.error('Error uploading document');
    }
  };

  const handleDeleteDoc = (docId) => {
    setPendingDocId(docId);
    setShowConfirm(true);
  };

  const confirmDeleteDoc = async () => {
    if (!pendingDocId) return;
    try {
      await axios.delete(`/api/customers/${customerId}/documents/${pendingDocId}`);
      toast.success('Document deleted');
      fetchDetails();
    } catch (err) {
      toast.error('Error deleting document');
    } finally {
      setPendingDocId(null);
      setShowConfirm(false);
    }
  };

  const cancelDeleteDoc = () => {
    setPendingDocId(null);
    setShowConfirm(false);
  };

  if (loading) return <div className="p-20 text-center text-indigo-600 font-bold bg-white rounded-3xl shadow-sm border border-gray-100 animate-pulse text-xl">Retrieving secure profile...</div>;
  if (!data.customer) return <div className="p-20 text-center text-red-500 font-bold bg-white rounded-3xl shadow-sm border border-gray-100">Customer not found.</div>;

  const { customer, interactions, documents } = data;

  return (
    <div className="space-y-6">
      <button
        onClick={() => onNavigate('CustomerDirectory')}
        className="flex items-center gap-2 text-gray-500 font-black uppercase tracking-widest text-[10px] hover:text-indigo-600 transition-colors bg-white px-4 py-2 rounded-full shadow-sm border border-gray-50"
      >
        <ArrowLeft size={14} /> Back to Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Profile Card */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50/50 rounded-bl-full -z-0"></div>
            <div className="relative z-10">
              <div className="flex flex-col items-center text-center mb-8">
                <div className="w-24 h-24 rounded-3xl bg-indigo-600 text-white flex items-center justify-center font-black text-4xl mb-4 shadow-2xl shadow-indigo-200">
                  {customer.name.charAt(0)}
                </div>
                <h2 className="text-3xl font-black text-gray-900 leading-tight">{customer.name}</h2>
                <p className="text-gray-500 font-bold text-sm mt-1">{customer.company_name || 'Individual Customer'}</p>
                <div className="flex flex-wrap items-center gap-2 mt-4">
                  <span className="px-3 py-1 bg-gray-100 rounded-full text-[10px] font-black uppercase text-gray-600 tracking-widest">{customer.stage}</span>
                  <span className="px-3 py-1 bg-indigo-50 rounded-full text-[10px] font-black uppercase text-indigo-600 tracking-widest">{customer.segmentation}</span>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-gray-50">
                <div className="flex flex-wrap items-center gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <Mail size={18} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Email</label>
                    <p className="font-bold text-gray-700 break-all">{customer.email || 'None provided'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <Phone size={18} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Phone</label>
                    <p className="font-bold text-gray-700">{customer.phone || 'None provided'}</p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-4 group">
                  <div className="w-10 h-10 rounded-2xl bg-gray-50 flex items-center justify-center text-gray-400 group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-all">
                    <Calendar size={18} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Onboarded</label>
                    <p className="font-bold text-gray-700">{new Date(customer.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 p-6 bg-gray-50 rounded-3xl border border-gray-100">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">Key Requirements</label>
                <p className="text-sm text-gray-600 font-medium leading-relaxed italic">
                  "{customer.requirements || 'No requirements documented.'}"
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
              <h3 className="font-black text-lg text-gray-900 tracking-tight flex items-center gap-2">
                <FileText className="text-indigo-600" size={20} /> Documents
              </h3>
              <button
                onClick={() => setIsDocModalOpen(true)}
                className="p-2 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-600 hover:text-white transition-all shadow-sm shadow-indigo-50"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="space-y-3">
              {documents.length === 0 ? (
                <p className="text-gray-400 text-center text-xs italic py-4">No documents attached.</p>
              ) : documents.map(doc => (
                <div key={doc.id} className="flex flex-col gap-2 p-4 bg-gray-50 rounded-2xl border border-gray-100 hover:border-indigo-200 transition-all group">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-indigo-500 shadow-sm">
                        <FileText size={16} />
                      </div>
                      <div className="max-w-[150px]">
                        <p className="text-xs font-bold text-gray-800 truncate" title={doc.file_name}>{doc.file_name}</p>
                        <p className="text-[9px] uppercase font-black text-gray-400 tracking-tighter">{doc.type}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-1">
                      <a
                        href={`${API_BASE}/${doc.file_path}`}
                        target="_blank"
                        rel="noreferrer"
                        className="p-1.5 text-gray-400 hover:text-indigo-600 transition-all"
                        title="View"
                      >
                        <ExternalLink size={14} />
                      </a>
                      <a
                        href={`/${doc.file_path}`}
                        download={doc.file_name}
                        className="p-1.5 text-gray-400 hover:text-indigo-600 transition-all"
                        title="Download"
                      >
                        <Download size={14} />
                      </a>
                      <button
                        onClick={() => handleDeleteDoc(doc.id)}
                        className="p-1.5 text-gray-400 hover:text-red-500 transition-all"
                        title="Delete"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Interaction History */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100 min-h-[600px] flex flex-col">
            <h3 className="text-2xl font-black text-gray-900 mb-8 flex items-center gap-3 tracking-tight">
              <Activity className="text-indigo-600" size={28} /> Interaction History
            </h3>

            <div className="flex-1 relative mb-8">
              <div className="absolute left-6 h-full border-l-2 border-dashed border-gray-100 z-0"></div>
              <div className="space-y-10 relative z-10 px-2 max-h-[500px] overflow-y-auto pr-4 scrollbar-hide">
                {interactions.length === 0 ? (
                  <div className="text-center py-20 flex flex-col items-center gap-4">
                    <MessageSquare size={48} className="text-gray-100" />
                    <p className="text-gray-400 font-bold italic">No interactions logged for this customer.</p>
                  </div>
                ) : interactions.map(act => (
                  <div key={act.id} className="flex gap-6 group">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 z-10 transition-transform group-hover:scale-110 ${act.type === 'Customer Created' ? 'bg-indigo-600 text-white shadow-xl shadow-indigo-100' :
                      act.type === 'Call' ? 'bg-amber-100 text-amber-600 shadow-xl shadow-amber-50' :
                        act.type === 'Meeting' ? 'bg-emerald-100 text-emerald-600 shadow-xl shadow-emerald-50' :
                          'bg-white text-gray-500 border border-gray-100 shadow-sm'
                      }`}>
                      {act.type === 'Call' ? <Phone size={20} /> :
                        act.type === 'Meeting' ? <Users size={20} /> : <MessageSquare size={20} />}
                    </div>
                    <div className="flex-1 bg-white p-6 rounded-3xl border border-gray-100 group-hover:border-indigo-100 group-hover:shadow-lg transition-all">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[10px] font-black uppercase bg-gray-900 text-white px-2 py-0.5 rounded tracking-widest">{act.type}</span>
                          <span className="text-xs font-bold text-gray-400 flex items-center gap-1"><User size={12} /> {act.user_name}</span>
                        </div>
                        <span className="text-[10px] font-black text-gray-400 flex items-center gap-1 uppercase tracking-widest"><Clock size={12} /> {new Date(act.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed font-bold italic opacity-90">"{act.content}"</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddInteraction} className="bg-gray-50 p-6 rounded-[2rem] border border-gray-100 space-y-4">
              <div className="flex flex-col sm:flex-row gap-4">
                <select
                  className="bg-white px-5 py-3 rounded-2xl border border-gray-100 outline-none text-xs font-black uppercase tracking-widest text-gray-500 focus:border-indigo-500"
                  value={newInteraction.type}
                  onChange={(e) => setNewInteraction({ ...newInteraction, type: e.target.value })}
                >
                  <option value="Call">📞 Call Log</option>
                  <option value="Email">📧 Email Interaction</option>
                  <option value="Meeting">🤝 Meeting Note</option>
                  <option value="Note">📝 Internal Note</option>
                </select>
                <div className="flex-1 relative flex items-center">
                  <input
                    type="text"
                    className="w-full bg-white px-6 py-4 rounded-2xl border border-gray-100 outline-none pr-14 text-sm font-bold text-gray-700 placeholder:font-normal placeholder:italic"
                    placeholder="Briefly describe the interaction..."
                    value={newInteraction.content}
                    onChange={(e) => setNewInteraction({ ...newInteraction, content: e.target.value })}
                  />
                  <button
                    type="submit"
                    disabled={!newInteraction.content}
                    className="absolute right-2 p-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all disabled:opacity-50"
                  >
                    <Send size={18} />
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>

      {isDocModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
            <div className="p-8 pb-4 flex flex-wrap items-center justify-between gap-4">
              <h3 className="text-2xl font-black text-gray-900 tracking-tight">Attach Document</h3>
              <button onClick={() => setIsDocModalOpen(false)} className="text-gray-400 hover:text-gray-900"><Plus size={32} className="rotate-45" /></button>
            </div>

            <form onSubmit={handleUploadDoc} className="p-8 pt-4 space-y-6">
              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Document Type</label>
                <select
                  className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700"
                  value={docType}
                  onChange={(e) => setDocType(e.target.value)}
                >
                  <option value="Quote">📑 Price Quote</option>
                  <option value="Agreement">📜 Agreement / Contract</option>
                  <option value="Invoice">💳 Invoice Reference</option>
                  <option value="Other">🖇️ Other Resource</option>
                </select>
              </div>

              <div className="space-y-4">
                <label className="block text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Choose File</label>
                <div className="relative group cursor-pointer">
                  <input
                    type="file"
                    required
                    onChange={(e) => setDocFile(e.target.files[0])}
                    className="absolute inset-0 w-full h-full opacity-0 z-10 cursor-pointer"
                  />
                  <div className="w-full h-32 border-2 border-dashed border-gray-200 rounded-3xl flex flex-col items-center justify-center gap-2 group-hover:border-indigo-400 group-hover:bg-indigo-50/50 transition-all">
                    <Upload size={32} className="text-gray-300 group-hover:text-indigo-400" />
                    <p className="text-sm font-bold text-gray-500 group-hover:text-indigo-600">{docFile ? docFile.name : 'Drag & Drop or Click'}</p>
                    <p className="text-[10px] text-gray-400">PDF, JPG, PNG (Max 5MB)</p>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!docFile}
                className="w-full py-4 bg-indigo-600 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 transition-all disabled:opacity-50"
              >
                Upload & Attach
              </button>
            </form>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Document"
        message="Are you sure you want to delete this document? This cannot be undone."
        onConfirm={confirmDeleteDoc}
        onCancel={cancelDeleteDoc}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default CustomerDetail;
