import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  Plus, Search, Filter, TrendingUp, AlertCircle, X,
  User, Mail, Phone, Calendar, ArrowRight,
  MoreVertical, Edit, Trash2, Eye, CheckCircle, Clock
} from 'lucide-react';

const CaptureLeads = ({ onNavigate }) => {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [scoreFilter, setScoreFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    source: 'Manual Entry',
    status: 'New',
    score: 'Warm',
    assigned_to: JSON.parse(localStorage.getItem('user'))?.id,
    reminder_date: '',
    reminder_message: ''
  });

  const [employees, setEmployees] = useState([]);

  useEffect(() => {
    fetchLeads();
    fetchEmployees();
  }, [statusFilter, scoreFilter]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/leads', {
        params: { status: statusFilter, score: scoreFilter }
      });
      if (res.data.success) {
        setLeads(res.data.data);
      }
    } catch (err) {
      toast.error('Error fetching leads');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees/list');
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching employees:', err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.phone) {
      return toast.error('Name, Email, and Phone are required');
    }
    try {
      if (selectedLead) {
        await axios.put(`/api/leads/${selectedLead.id}`, formData);
        toast.success('Lead updated successfully');
      } else {
        await axios.post('/api/leads', formData);
        toast.success('Lead captured successfully');
      }
      setIsModalOpen(false);
      setSelectedLead(null);
      setFormData({
        name: '', email: '', phone: '', source: 'Manual Entry',
        status: 'New', score: 'Warm', assigned_to: JSON.parse(localStorage.getItem('user'))?.id,
        reminder_date: '', reminder_message: ''
      });
      fetchLeads();
    } catch (err) {
      toast.error('Error saving lead');
    }
  };

  const handleEdit = (lead) => {
    setSelectedLead(lead);
    setFormData({
      name: lead.name,
      email: lead.email,
      phone: lead.phone,
      source: lead.source,
      status: lead.status,
      score: lead.score,
      assigned_to: lead.assigned_to,
      reminder_date: lead.next_followup ? new Date(lead.next_followup).toISOString().slice(0, 16) : '',
      reminder_message: ''
    });
    setIsModalOpen(true);
  };

  const filteredLeads = leads.filter(l =>
    (l.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (l.email || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const getScoreColor = (score) => {
    switch (score) {
      case 'Hot': return 'bg-red-100 text-red-700 border-red-200';
      case 'Warm': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'Cold': return 'bg-blue-100 text-blue-700 border-blue-200';
      default: return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'New': return 'bg-indigo-100 text-indigo-700';
      case 'Contacted': return 'bg-amber-100 text-amber-700';
      case 'Qualified': return 'bg-emerald-100 text-emerald-700';
      case 'Converted': return 'bg-green-600 text-white';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Lead Directory</h2>
          <p className="text-sm text-gray-500">Manage and track your sales pipeline.</p>
        </div>
        <button
          onClick={() => { setSelectedLead(null); setIsModalOpen(true); }}
          className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100"
        >
          <Plus size={20} /> Capture New Lead
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className="relative col-span-1 md:col-span-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input
            type="text"
            placeholder="Search leads by name or email..."
            className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <select
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="New">New</option>
          <option value="Contacted">Contacted</option>
          <option value="Qualified">Qualified</option>
          <option value="Converted">Converted</option>
        </select>
        <select
          className="px-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
          value={scoreFilter}
          onChange={(e) => setScoreFilter(e.target.value)}
        >
          <option value="">All Scores</option>
          <option value="Hot">🔥 Hot</option>
          <option value="Warm">☀️ Warm</option>
          <option value="Cold">❄️ Cold</option>
        </select>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100 font-bold text-xs text-gray-400 uppercase tracking-widest">
                <th className="px-6 py-4">Lead Details</th>
                <th className="px-6 py-4">Status</th>
                <th className="px-6 py-4">Lead Score</th>
                <th className="px-6 py-4">Source</th>
                <th className="px-6 py-4">Assigned To</th>
                <th className="px-6 py-4">Next Follow-up</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="6" className="p-12 text-center text-gray-500">Loading leads...</td></tr>
              ) : filteredLeads.length === 0 ? (
                <tr><td colSpan="6" className="p-20 text-center text-gray-500">No leads found.</td></tr>
              ) : filteredLeads.map(lead => (
                <tr key={lead.id} className="hover:bg-gray-50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                        {lead.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-bold text-gray-900">{lead.name}</p>
                        <p className="text-xs text-gray-500">{lead.email || 'No email'}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(lead.status)}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-lg border text-xs font-bold flex items-center gap-1 w-fit ${getScoreColor(lead.score)}`}>
                      {lead.score === 'Hot' ? '🔥' : lead.score === 'Warm' ? '☀️' : '❄️'} {lead.score}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500">{lead.source}</td>
                  <td className="px-6 py-4 text-sm font-medium text-gray-700">{lead.assigned_to_name || 'Unassigned'}</td>
                  <td className="px-6 py-4">
                    {lead.next_followup ? (
                      <div className="flex flex-wrap items-center gap-2 text-amber-600 font-bold text-xs bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100 w-fit">
                        <Clock size={14} /> {new Date(lead.next_followup).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                      </div>
                    ) : (
                      <span className="text-gray-300 text-xs italic">No follow-up set</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex flex-wrap items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(lead)}
                        className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
                      >
                        <Edit size={18} />
                      </button>
                      <button
                        onClick={() => onNavigate(`LeadDetail_${lead.id}`)}
                        className="p-2 text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg transition-colors"
                        title="View History"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-xl overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-indigo-50">
              <h3 className="text-xl font-bold text-indigo-900">{selectedLead ? 'Edit Lead' : 'Capture New Lead'}</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-indigo-400 hover:text-indigo-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <User size={16} className="text-indigo-500" /> Full Name
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Mail size={16} className="text-indigo-500" /> Email Address
                  </label>
                  <input
                    required
                    type="email"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Phone size={16} className="text-indigo-500" /> Phone Number
                  </label>
                  <input
                    required
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <TrendingUp size={16} className="text-indigo-500" /> Lead Source
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                    placeholder="e.g. Website, LinkedIn, Manual"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Status</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    <option value="New">New</option>
                    <option value="Contacted">Contacted</option>
                    <option value="Qualified">Qualified</option>
                    <option value="Converted">Converted</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Score</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none"
                    value={formData.score}
                    onChange={(e) => setFormData({ ...formData, score: e.target.value })}
                  >
                    <option value="Hot">🔥 Hot</option>
                    <option value="Warm">☀️ Warm</option>
                    <option value="Cold">❄️ Cold</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Assign To</label>
                  <select
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none text-sm"
                    value={formData.assigned_to}
                    onChange={(e) => setFormData({ ...formData, assigned_to: e.target.value })}
                  >
                    <option value="">Unassigned</option>
                    {employees
                      .filter(emp => emp.role === 'Employee CRM')
                      .map(emp => (
                        <option key={emp.id} value={emp.id}>{emp.name}</option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="bg-indigo-50/50 p-6 rounded-2xl border border-indigo-100/50 space-y-4">
                <h4 className="text-sm font-black text-indigo-900 uppercase tracking-widest flex items-center gap-2">
                  <Clock size={16} /> Schedule Follow-up
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-indigo-700">Follow-up Date</label>
                    <input
                      type="datetime-local"
                      className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm"
                      value={formData.reminder_date}
                      onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-indigo-700">Follow-up Note</label>
                    <textarea
                      placeholder="e.g. Call to discuss proposal"
                      className="w-full px-4 py-2 bg-white border border-indigo-100 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-sm resize-none"
                      rows="1"
                      value={formData.reminder_message}
                      onChange={(e) => setFormData({ ...formData, reminder_message: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-50">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-2xl transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-8 py-3 bg-indigo-600 text-white font-bold rounded-2xl shadow-lg shadow-indigo-100 hover:bg-indigo-700 hover:scale-[1.02] transition-all active:scale-95"
                >
                  {selectedLead ? 'Update Lead' : 'Capture Lead'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default CaptureLeads;
