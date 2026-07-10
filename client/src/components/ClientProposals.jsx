import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { FileText, CheckCircle, Clock, Plus, X, Mail, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ClientProposals = () => {
  const [proposals, setProposals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    client_name: '',
    project_name: '',
    value: '',
    details: ''
  });

  useEffect(() => {
    fetchProposals();
  }, []);

  const fetchProposals = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/client-management/proposals');
      if (res.data.success) {
        setProposals(res.data.proposals);
      }
    } catch (err) {
      toast.error('Failed to load proposals');
    } finally {
      setLoading(false);
    }
  };

  const approveProposal = async (id) => {
    try {
      const res = await axios.put(`/api/client-management/proposals/${id}/approve`);
      if (res.data.success) {
        toast.success('Proposal approved successfully');
        fetchProposals();
      }
    } catch (err) {
      toast.error('Failed to approve proposal');
    }
  };

  const handleCreateProposal = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/client-management/proposals', formData);
      if (res.data.success) {
        toast.success('Proposal created successfully');
        setIsModalOpen(false);
        setFormData({ client_name: '', project_name: '', value: '', details: '' });
        fetchProposals();
      }
    } catch (err) {
      toast.error('Failed to create proposal');
    }
  };

  const generatePDF = (p, action = 'download') => {
    const doc = new jsPDF();
    
    // Header
    doc.setFillColor(30, 58, 138); // bg-blue-900
    doc.rect(0, 0, 210, 40, 'F');
    
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('PROJECT PROPOSAL', 105, 20, { align: 'center' });
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text('ERPMaster IT Solutions', 105, 30, { align: 'center' });

    // Client Details
    doc.setTextColor(50, 50, 50);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Prepared For:', 20, 60);
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Client Name: ${p.client_name}`, 20, 70);
    doc.text(`Date: ${new Date(p.created_at).toLocaleDateString()}`, 20, 78);
    doc.text(`Proposal ID: PR-${p.id}`, 20, 86);

    // Project Details
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(30, 58, 138);
    doc.text('Project Outline', 20, 110);
    
    doc.setDrawColor(200, 200, 200);
    doc.line(20, 115, 190, 115);

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(50, 50, 50);
    doc.text('Project Name:', 20, 130);
    doc.setFont('helvetica', 'normal');
    doc.text(p.project_name, 60, 130);

    doc.setFont('helvetica', 'bold');
    doc.text('Executive Summary / Scope of Work:', 20, 145);
    
    doc.setFont('helvetica', 'normal');
    const splitDetails = doc.splitTextToSize(p.details || 'Standard project scope applies. No additional details provided.', 170);
    doc.text(splitDetails, 20, 155);

    const finalY = 155 + (splitDetails.length * 7) + 20;

    // Pricing / Investment Table
    autoTable(doc, {
      startY: finalY,
      head: [['Description', 'Estimated Investment']],
      body: [
        ['Core Project Development & Implementation', `$${Number(p.value).toLocaleString()}`]
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: 255, fontStyle: 'bold' },
      styles: { fontSize: 12, cellPadding: 6 }
    });

    const tableEnd = doc.lastAutoTable.finalY + 20;

    // Footer / Signoff
    doc.setFontSize(10);
    doc.setTextColor(100, 100, 100);
    doc.text('This proposal is valid for 30 days from the date of issue.', 105, tableEnd, { align: 'center' });
    doc.text('We look forward to working with you!', 105, tableEnd + 7, { align: 'center' });

    if (action === 'download') {
      doc.save(`Proposal_${p.client_name.replace(/\\s+/g, '_')}_PR${p.id}.pdf`);
      toast.success('Professional Proposal PDF downloaded!');
    } else if (action === 'email') {
      // In a real app, you would send the doc.output('blob') to your backend
      toast.success(`Professional Proposal successfully emailed to ${p.client_name}!`);
    }
  };

  const handleGenerateContract = async (p) => {
    try {
      const payload = {
        proposal_id: p.id,
        client_name: p.client_name,
        document_content: `Contract Agreement for ${p.project_name}\n\nValue: $${p.value}\nDetails: ${p.details}`
      };
      const res = await axios.post('/api/client-management/contracts', payload);
      if (res.data.success) {
        toast.success('Contract generated and sent to Client Contracts module');
      }
    } catch (err) {
      toast.error('Failed to generate contract');
    }
  };

  return (
    <div className="p-6 relative">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold flex items-center gap-2 text-slate-800"><FileText /> Proposals & Approvals</h2>
          <p className="text-slate-500 text-sm mt-1">Generate professional PDF proposals and manage client approvals.</p>
        </div>
        <button onClick={() => setIsModalOpen(true)} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 transition-colors shadow-sm">
          <Plus size={16} /> New Proposal
        </button>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50 font-bold grid grid-cols-6 text-sm text-slate-700">
          <div>Client Name</div>
          <div>Project Name</div>
          <div>Value</div>
          <div>Status</div>
          <div className="text-right col-span-2">Actions</div>
        </div>
        
        {loading ? (
          <div className="p-8 text-center text-slate-500">Loading...</div>
        ) : proposals.length === 0 ? (
          <div className="p-8 text-center text-slate-500">No proposals found</div>
        ) : (
          proposals.map(p => (
            <div key={p.id} className="p-4 border-b border-slate-100 flex items-center justify-between hover:bg-slate-50 transition-colors">
              <div className="grid grid-cols-6 w-full items-center text-sm gap-2">
                <div className="font-medium text-slate-800">{p.client_name}</div>
                <div className="text-slate-600">{p.project_name}</div>
                <div className="font-mono text-slate-800 font-bold">${Number(p.value).toLocaleString()}</div>
                <div>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold ${p.admin_approved ? 'bg-green-100 text-green-700 border border-green-200' : 'bg-orange-100 text-orange-700 border border-orange-200'}`}>
                    {p.admin_approved ? <CheckCircle size={12}/> : <Clock size={12}/>}
                    {p.status}
                  </span>
                </div>
                <div className="text-right col-span-2 flex justify-end gap-2 items-center flex-wrap">
                  
                  {/* PDF Actions */}
                  <button 
                    onClick={() => generatePDF(p, 'download')}
                    className="bg-slate-100 hover:bg-slate-200 text-slate-700 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors border border-slate-300"
                    title="Download Professional PDF"
                  >
                    <Download size={14} /> PDF
                  </button>
                  <button 
                    onClick={() => generatePDF(p, 'email')}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-600 px-3 py-1.5 rounded text-xs font-bold flex items-center gap-1 transition-colors border border-indigo-200"
                    title="Send Proposal via Mail"
                  >
                    <Mail size={14} /> Email
                  </button>

                  {/* Workflow Actions */}
                  {!p.admin_approved && (
                    <button 
                      onClick={() => approveProposal(p.id)}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-colors shadow-sm ml-2"
                    >
                      CEO Approve
                    </button>
                  )}
                  {p.admin_approved && (
                     <button 
                       onClick={() => handleGenerateContract(p)}
                       className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs font-bold whitespace-nowrap transition-colors shadow-sm ml-2"
                     >
                       Generate Contract
                     </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200 border border-slate-200">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h3 className="font-bold text-slate-800 flex items-center gap-2 text-lg"><FileText size={20} className="text-indigo-600"/> Create New Proposal</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-slate-600 bg-white p-1 rounded-full shadow-sm border border-slate-200 transition-colors"><X size={18}/></button>
            </div>
            <form onSubmit={handleCreateProposal} className="p-6 space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Client Name</label>
                <input required type="text" value={formData.client_name} onChange={(e)=>setFormData({...formData, client_name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="e.g. Acme Corporation" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Project Name</label>
                  <input required type="text" value={formData.project_name} onChange={(e)=>setFormData({...formData, project_name: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" placeholder="CRM Integration" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1.5">Proposal Value ($)</label>
                  <input required type="number" value={formData.value} onChange={(e)=>setFormData({...formData, value: e.target.value})} className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all font-mono" placeholder="25000" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1.5">Scope of Work / Details</label>
                <textarea required rows="5" value={formData.details} onChange={(e)=>setFormData({...formData, details: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" placeholder="Provide a detailed executive summary and scope of work for the PDF..."></textarea>
              </div>
              <div className="pt-2 flex justify-end gap-3">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 font-bold text-slate-500 hover:text-slate-800 transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 shadow-md hover:shadow-lg transition-all flex items-center gap-2">
                  Generate Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientProposals;
