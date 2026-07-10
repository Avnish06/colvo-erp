import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  Users, Search, Filter, Plus, Briefcase,
  Layers, TrendingUp, Building2, Mail,
  Phone, ChevronRight, MoreVertical, Edit, Eye, Send, X, FileText, Sparkles
} from 'lucide-react';

const CustomerManagement = ({ onNavigate }) => {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [employees, setEmployees] = useState([]);

  // Proposal Mail State
  const [proposalModalOpen, setProposalModalOpen] = useState(false);
  const [proposalCustomer, setProposalCustomer] = useState(null);
  const [sendingProposal, setSendingProposal] = useState(false);
  const [proposalForm, setProposalForm] = useState({
    subject: '',
    services: '',
    body: '',
    senderName: JSON.parse(localStorage.getItem('user'))?.name || 'Sales Team',
  });

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    company_name: '',
    requirements: '',
    stage: 'Prospect',
    segmentation: 'SME',
    assigned_to: JSON.parse(localStorage.getItem('user'))?.id
  });

  useEffect(() => {
    fetchCustomers();
    fetchEmployees();
  }, [stageFilter]);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/customers', {
        params: { stage: stageFilter }
      });
      if (res.data.success) {
        setCustomers(res.data.data);
      }
    } catch (err) {
      toast.error('Error fetching customers');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees/list');
      if (res.data.success) {
        setEmployees(res.data.data.filter(emp => emp.role === 'Employee CRM'));
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.company_name || !formData.email || !formData.phone) {
      return toast.error('Name, Company, Email, and Phone are required');
    }
    try {
      if (selectedCustomer) {
        await axios.put(`/api/customers/${selectedCustomer.id}`, formData);
        toast.success('Customer updated');
      } else {
        await axios.post('/api/customers', formData);
        toast.success('Customer added successfully');
      }
      setIsModalOpen(false);
      setSelectedCustomer(null);
      resetForm();
      fetchCustomers();
    } catch (err) {
      toast.error('Error saving customer');
    }
  };

  const resetForm = () => {
    setFormData({
      name: '', email: '', phone: '', company_name: '',
      requirements: '', stage: 'Prospect', segmentation: 'SME',
      assigned_to: JSON.parse(localStorage.getItem('user'))?.id
    });
  };

  const openProposalModal = (customer) => {
    setProposalCustomer(customer);
    setProposalForm({
      subject: `Business Proposal for ${customer.company_name || customer.name}`,
      services: '',
      body: `Dear ${customer.name},\n\nThank you for your interest in our services. We are pleased to present our proposal tailored specifically for ${customer.company_name || 'your organization'}.\n\nBased on your requirements, we would like to offer the following:\n\n[Services will be listed here]\n\nWe believe our solution will help you achieve your business goals efficiently.\n\nWe look forward to the opportunity to work with you.\n\nBest regards,\n${JSON.parse(localStorage.getItem('user'))?.name || 'Sales Team'}`,
      senderName: JSON.parse(localStorage.getItem('user'))?.name || 'Sales Team',
    });
    setProposalModalOpen(true);
  };

  const handleSendProposal = async (e) => {
    e.preventDefault();
    if (!proposalCustomer?.email) return toast.error('Customer email is missing');
    if (!proposalForm.subject.trim() || !proposalForm.body.trim()) return toast.error('Subject and body are required');
    setSendingProposal(true);
    try {
      // Build the final body with services inserted
      let finalBody = proposalForm.body;
      if (proposalForm.services.trim()) {
        finalBody = finalBody.replace('[Services will be listed here]', proposalForm.services);
      }
      await axios.post('/api/communication/send-email', {
        to: proposalCustomer.email,
        subject: proposalForm.subject,
        body: finalBody,
      });
      toast.success(`Proposal sent to ${proposalCustomer.email}!`);
      setProposalModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to send proposal email');
    } finally {
      setSendingProposal(false);
    }
  };

  const handleEdit = (customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone,
      company_name: customer.company_name,
      requirements: customer.requirements,
      stage: customer.stage,
      segmentation: customer.segmentation,
      assigned_to: customer.assigned_to
    });
    setIsModalOpen(true);
  };

  const filteredCustomers = customers.filter(c =>
    (c.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (c.company_name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const getStageColor = (stage) => {
    switch (stage) {
      case 'Prospect': return 'bg-blue-100 text-blue-700';
      case 'Active': return 'bg-emerald-100 text-emerald-700';
      case 'Loyal': return 'bg-purple-100 text-purple-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Building2 className="text-indigo-600" size={28} /> Customer Directory
          </h2>
          <p className="text-sm text-gray-500">Manage your valuable customer relationships.</p>
        </div>
        <button
          onClick={() => { setSelectedCustomer(null); resetForm(); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} /> Add New Customer
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative col-span-1 md:col-span-3">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search by customer name or company..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          value={stageFilter}
          onChange={(e) => setStageFilter(e.target.value)}
        >
          <option value="">All Stages</option>
          <option value="Prospect">Prospect</option>
          <option value="Active">Active</option>
          <option value="Loyal">Loyal</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 font-bold text-xs text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Customer / Company</th>
                <th className="px-6 py-4">Contact Info</th>
                <th className="px-6 py-4">Stage</th>
                <th className="px-6 py-4">Segmentation</th>
                <th className="px-6 py-4">Account Manager</th>
                <th className="px-6 py-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="6" className="p-12 text-center text-gray-500 font-bold italic">Loading directory...</td></tr>
              ) : filteredCustomers.length === 0 ? (
                <tr><td colSpan="6" className="p-20 text-center text-gray-500 font-bold italic">No customers found.</td></tr>
              ) : filteredCustomers.map(customer => (
                <tr key={customer.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{customer.name}</p>
                        <p className="text-xs text-gray-500 flex items-center gap-1 font-medium italic">
                          <Building2 size={12} /> {customer.company_name || 'Individual'}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-xs space-y-1">
                      <p className="flex items-center gap-1 text-gray-600"><Mail size={12} className="text-gray-400" /> {customer.email}</p>
                      <p className="flex items-center gap-1 text-gray-600"><Phone size={12} className="text-gray-400" /> {customer.phone}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStageColor(customer.stage)}`}>
                      {customer.stage}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs bg-gray-50 border border-gray-100 px-2 py-1 rounded text-gray-600 font-bold">
                      {customer.segmentation}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{customer.assigned_to_name || 'Unassigned'}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => openProposalModal(customer)}
                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-emerald-50 text-emerald-700 hover:bg-emerald-600 hover:text-white rounded-lg transition-all shadow-sm"
                        title="Send Proposal Email"
                      >
                        <Send size={13} /> Proposal
                      </button>
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-white rounded-lg transition-all shadow-sm"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => onNavigate(`CustomerDetail_${customer.id}`)}
                        className="p-2 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-lg transition-all shadow-sm"
                        title="View Full Profile"
                      >
                        <Eye size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-300">
            <div className="p-8 border-b border-gray-50 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
              <h3 className="text-2xl font-bold text-gray-900">{selectedCustomer ? 'Update Customer Profile' : 'Add New Customer'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <Plus size={32} className="rotate-45" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-10 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Customer Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. John Doe"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-700 placeholder:font-normal"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Company Name</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Acme Corp"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-700 placeholder:font-normal"
                    value={formData.company_name}
                    onChange={(e) => setFormData({ ...formData, company_name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Email Address</label>
                  <input
                    required
                    type="email"
                    placeholder="john@example.com"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-700"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Phone Number</label>
                  <input
                    required
                    type="text"
                    placeholder="+1 234 567 890"
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all font-bold text-gray-700"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Initial Requirements / Notes</label>
                <textarea
                  className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-medium text-gray-600 min-h-[100px] resize-none"
                  value={formData.requirements}
                  onChange={(e) => setFormData({ ...formData, requirements: e.target.value })}
                  placeholder="Describe customer needs..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Customer Stage</label>
                  <select
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  >
                    <option value="Prospect">Prospect</option>
                    <option value="Active">Active</option>
                    <option value="Loyal">Loyal</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Segmentation</label>
                  <select
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700"
                    value={formData.segmentation}
                    onChange={(e) => setFormData({ ...formData, segmentation: e.target.value })}
                  >
                    <option value="SME">SME</option>
                    <option value="Enterprise">Enterprise</option>
                    <option value="Public Sector">Public Sector</option>
                    <option value="NGO">NGO</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black text-gray-400 uppercase tracking-widest px-1">Assigned To</label>
                  <select
                    className="w-full px-5 py-3.5 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700 text-sm"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-4 pt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-8 py-4 text-gray-500 font-black uppercase tracking-widest text-xs hover:bg-gray-50 rounded-2xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-10 py-4 bg-indigo-600 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] transition-all active:scale-95"
                >
                  {selectedCustomer ? 'Update Profile' : 'Save Customer'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Proposal Mail Modal */}
      {proposalModalOpen && proposalCustomer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Modal Header */}
            <div className="px-8 py-6 border-b border-gray-100 bg-gradient-to-r from-emerald-50 to-teal-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Send size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-gray-900">Send Proposal Email</h3>
                  <p className="text-sm text-gray-500">
                    To: <span className="font-semibold text-emerald-700">{proposalCustomer.name}</span>
                    {' '}·{' '}
                    <span className="text-gray-600">{proposalCustomer.email}</span>
                  </p>
                </div>
              </div>
              <button onClick={() => setProposalModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSendProposal} className="p-8 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Client Info Strip */}
              <div className="flex flex-wrap gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="flex items-center gap-2 text-sm">
                  <Building2 size={14} className="text-gray-400" />
                  <span className="text-gray-600 font-medium">{proposalCustomer.company_name || 'Individual'}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Mail size={14} className="text-gray-400" />
                  <span className="text-gray-600">{proposalCustomer.email}</span>
                </div>
                <div className="flex items-center gap-2 text-sm">
                  <Phone size={14} className="text-gray-400" />
                  <span className="text-gray-600">{proposalCustomer.phone}</span>
                </div>
              </div>

              {/* Subject */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest">Email Subject</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Business Proposal for Acme Corp"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none font-medium text-gray-800 transition-all"
                  value={proposalForm.subject}
                  onChange={e => setProposalForm({ ...proposalForm, subject: e.target.value })}
                />
              </div>

              {/* Services Offered */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Sparkles size={12} className="text-emerald-500" /> Services / Offerings
                </label>
                <textarea
                  rows={3}
                  placeholder="List your services, pricing tiers, or packages here (e.g. ✅ Web Development — ₹50,000 ✅ 3 months support...)"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm text-gray-700 resize-none transition-all"
                  value={proposalForm.services}
                  onChange={e => setProposalForm({ ...proposalForm, services: e.target.value })}
                />
                <p className="text-xs text-gray-400">This will be inserted into the email body automatically.</p>
              </div>

              {/* Email Body */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText size={12} className="text-emerald-500" /> Email Body
                </label>
                <textarea
                  rows={8}
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none text-sm text-gray-700 resize-none font-mono transition-all"
                  value={proposalForm.body}
                  onChange={e => setProposalForm({ ...proposalForm, body: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setProposalModalOpen(false)}
                  className="px-6 py-3 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={sendingProposal}
                  className="px-8 py-3 bg-emerald-600 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-100 hover:bg-emerald-700 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
                >
                  {sendingProposal ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending...</>
                  ) : (
                    <><Send size={16} />Send Proposal</>  
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CustomerManagement;
