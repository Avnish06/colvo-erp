import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  TrendingUp, Search, Plus, Building2, User,
  DollarSign, Calendar, AlertCircle, X,
  UserPlus, CheckCircle, Clock, Trash2,
  ChevronRight, Layers, Target, Info
} from 'lucide-react';
import ConfirmModal from './ConfirmModal';


const SalesPipeline = ({ onNavigate }) => {
  const [user, setUser] = useState(null);
  const [deals, setDeals] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDeal, setSelectedDeal] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [formData, setFormData] = useState({
    customer_id: '',
    name: '',
    value: '',
    probability: 20,
    stage: 'Lead',
    expected_close_date: '',
    lost_reason: '',
    team_members: []
  });

  const stages = ['Lead', 'Proposal', 'Negotiation', 'Won', 'Lost'];

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
      } catch (e) {
        console.error('Error decoding token');
      }
    }
    fetchDeals();
    fetchCustomers();
    fetchEmployees();
  }, []);

  const fetchDeals = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/deals');
      if (res.data.success) setDeals(res.data.data);
    } catch (err) {
      toast.error('Error fetching deals');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await axios.get('/api/customers');
      if (res.data.success) setCustomers(res.data.data);
    } catch (err) {
      console.error('Error fetching customers');
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees/list');
      if (res.data.success) {
        // Only show CRM Employees in the assignment list
        const crmEmployees = res.data.data.filter(emp => emp.role === 'Employee CRM');
        setEmployees(crmEmployees);
      }
    } catch (err) {
      console.error('Error fetching employees');
    }
  };

  const [showConfirm, setShowConfirm] = useState(false);

  const handleDelete = () => {
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!selectedDeal) return;
    try {
      await axios.delete(`/api/deals/${selectedDeal.id}`);
      toast.success('Deal deleted');
      setIsModalOpen(false);
      fetchDeals();
    } catch (err) {
      toast.error('Error deleting deal');
    } finally {
      setShowConfirm(false);
    }
  };

  const cancelDelete = () => setShowConfirm(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (selectedDeal) {
        await axios.put(`/api/deals/${selectedDeal.id}`, formData);
        toast.success('Deal updated');
      } else {
        await axios.post('/api/deals', formData);
        toast.success('Deal created successfully');
      }
      setIsModalOpen(false);
      resetForm();
      fetchDeals();
    } catch (err) {
      toast.error('Error saving deal');
    }
  };

  const resetForm = () => {
    setFormData({
      customer_id: '', name: '', value: '', probability: 20,
      stage: 'Lead', expected_close_date: '', lost_reason: '',
      team_members: []
    });
    setSelectedDeal(null);
  };

  const handleEdit = async (deal) => {
    setSelectedDeal(deal);
    // Fetch team members for this deal
    try {
      const teamRes = await axios.get(`/api/deals/${deal.id}/team`);
      setFormData({
        customer_id: deal.customer_id,
        name: deal.name,
        value: deal.value,
        probability: deal.probability,
        stage: deal.stage,
        expected_close_date: deal.expected_close_date ? deal.expected_close_date.split('T')[0] : '',
        lost_reason: deal.lost_reason || '',
        team_members: teamRes.data.success ? teamRes.data.data.map(u => u.id) : []
      });
      setIsModalOpen(true);
    } catch (err) {
      toast.error('Error fetching deal details');
    }
  };



  const toggleTeamMember = (id) => {
    setFormData(prev => ({
      ...prev,
      team_members: prev.team_members.includes(id)
        ? prev.team_members.filter(m => m !== id)
        : [...prev.team_members, id]
    }));
  };

  const filteredDeals = deals.filter(d =>
    (d.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()) ||
    (d.customer_name || '').toLowerCase().includes((searchTerm || '').toLowerCase())
  );

  const getStageDeals = (stage) => filteredDeals.filter(d => d.stage === stage);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl shadow-sm border border-gray-100">
        <div className="space-y-1">
          {showConfirm && (
            <ConfirmModal
              isOpen={showConfirm}
              title="Delete Deal"
              message="Are you sure you want to delete this deal?"
              onConfirm={confirmDelete}
              onCancel={cancelDelete}
              confirmText="Delete"
              cancelText="Cancel"
            />
          )}
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
            <TrendingUp className="text-emerald-600" size={28} /> Sales Pipeline
          </h2>
          <p className="text-xs sm:text-sm text-gray-500">Track and manage your sales opportunities.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search deals..."
              className="pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 outline-none w-full sm:w-64 text-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={() => { resetForm(); setIsModalOpen(true); }}
            className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-100 text-sm sm:text-base"
          >
            <Plus size={20} /> Create Deal
          </button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex flex-wrap flex flex-wrap-row gap-4 sm:gap-10 overflow-x-auto pb-8 min-h-[600px] snap-x custom-scrollbar">
        {stages.map(stage => (
          <div key={stage} className="flex flex-col gap-6 min-w-[280px] sm:min-w-[300px] flex-1 snap-start px-1 sm:px-0">
            <div className={`p-4 rounded-xl border-b-4 flex items-center justify-between ${stage === 'Lead' ? 'bg-blue-50 border-blue-500 text-blue-700' :
              stage === 'Proposal' ? 'bg-indigo-50 border-indigo-500 text-indigo-700' :
                stage === 'Negotiation' ? 'bg-amber-50 border-amber-500 text-amber-700' :
                  stage === 'Won' ? 'bg-emerald-50 border-emerald-500 text-emerald-700' :
                    'bg-red-50 border-red-500 text-red-700'
              }`}>
              <h3 className="font-black uppercase tracking-widest text-[10px]">{stage}</h3>
              <span className="text-xs font-bold bg-white/50 px-2 py-0.5 rounded-full">
                {getStageDeals(stage).length}
              </span>
            </div>

            <div className="flex flex-col gap-4">
              {getStageDeals(stage).map(deal => (
                <div
                  key={deal.id}
                  onClick={() => handleEdit(deal)}
                  className="bg-white p-5 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all cursor-pointer group"
                >
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-gray-900 group-hover:text-emerald-600 transition-colors">{deal.name}</h4>
                    <ChevronRight size={16} className="text-gray-300 group-hover:text-emerald-500" />
                  </div>

                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 font-medium tracking-tight">
                      <Building2 size={12} className="text-gray-400" /> {deal.customer_name}
                    </div>

                    <div className="flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-gray-50">
                      <span className="text-sm font-black text-gray-900">₹{parseFloat(deal.value).toLocaleString()}</span>
                      <div className="flex flex-wrap items-center gap-1 text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">
                        <Target size={10} /> {deal.probability}%
                      </div>
                    </div>

                    {deal.expected_close_date && (
                      <div className="flex flex-wrap items-center gap-1.5 text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                        <Clock size={10} /> Closes: {new Date(deal.expected_close_date).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {getStageDeals(stage).length === 0 && (
                <div className="py-10 border-2 border-dashed border-gray-100 rounded-3xl flex items-center justify-center text-gray-300 italic text-xs">
                  No deals
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Create/Edit Deal Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-[2.5rem] shadow-2xl w-full max-w-3xl overflow-hidden transform transition-all">
            <div className="p-4 sm:p-8 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-gray-50/50">
              <div className="flex flex-wrap items-center gap-3">
                <div className="p-2 sm:p-3 bg-white rounded-2xl shadow-sm text-emerald-600">
                  <Layers size={20} className="sm:w-6 sm:h-6" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedDeal ? 'Update Deal' : 'New Opportunity'}</h3>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600"><X size={24} className="sm:w-7 sm:h-7" /></button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 sm:p-10 space-y-6 sm:space-y-8 max-h-[80vh] overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Customer / Account</label>
                  <select
                    required
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700"
                    value={formData.customer_id}
                    onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  >
                    <option value="">Select a customer</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>{c.name} ({c.company_name || 'Individual'})</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Deal Title</label>
                  <input
                    required
                    type="text"
                    placeholder="e.g. Q1 Software Expansion"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Deal Value (₹)</label>
                  <input
                    required
                    type="number"
                    placeholder="0.00"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700"
                    value={formData.value}
                    onChange={(e) => setFormData({ ...formData, value: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Probability (%)</label>
                  <input
                    required
                    type="number"
                    min="0" max="100"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700"
                    value={formData.probability}
                    onChange={(e) => setFormData({ ...formData, probability: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Stage</label>
                  <select
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700"
                    value={formData.stage}
                    onChange={(e) => setFormData({ ...formData, stage: e.target.value })}
                  >
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1">Expected Close Date</label>
                  <input
                    type="date"
                    className="w-full px-5 py-4 bg-gray-50 border border-gray-100 rounded-2xl outline-none font-bold text-gray-700"
                    value={formData.expected_close_date}
                    onChange={(e) => setFormData({ ...formData, expected_close_date: e.target.value })}
                  />
                </div>
                {formData.stage === 'Lost' && (
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-red-400 uppercase tracking-widest px-1">Reason for Loss</label>
                    <input
                      required
                      type="text"
                      placeholder="e.g. Budget constraints, Competitor"
                      className="w-full px-5 py-4 bg-red-50 border border-red-100 rounded-2xl outline-none font-bold text-red-700"
                      value={formData.lost_reason}
                      onChange={(e) => setFormData({ ...formData, lost_reason: e.target.value })}
                    />
                  </div>
                )}
              </div>

              <div className="space-y-4">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest px-1 flex items-center gap-2">
                  <UserPlus size={14} /> Deal Team Assignment
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto p-3 sm:p-4 bg-gray-50 rounded-2xl sm:rounded-3xl border border-gray-100">
                  {employees.map(emp => (
                    <button
                      key={emp.id}
                      type="button"
                      onClick={() => toggleTeamMember(emp.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border ${formData.team_members.includes(emp.id)
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md'
                        : 'bg-white text-gray-500 border-gray-200 hover:border-emerald-300'
                        }`}
                    >
                      {emp.name}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-col sm:flex-row justify-end items-center gap-3 sm:gap-4 pt-4 sm:pt-6">
                {selectedDeal && (user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Developer') && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    className="w-full sm:w-auto sm:mr-auto px-6 py-3 sm:py-4 bg-red-50 text-red-600 font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-2xl hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                  >
                    <Trash2 size={14} /> Delete Deal
                  </button>
                )}
                <div className="flex flex-wrap gap-3 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="flex-1 sm:flex-none px-6 sm:px-8 py-3 sm:py-4 text-gray-400 font-black uppercase tracking-widest text-[9px] sm:text-[10px] hover:bg-gray-50 rounded-2xl text-center"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 sm:flex-none px-6 sm:px-10 py-3 sm:py-4 bg-emerald-600 text-white font-black uppercase tracking-widest text-[9px] sm:text-[10px] rounded-2xl shadow-xl shadow-emerald-100 hover:bg-emerald-700 transition-all hover:scale-[1.02] text-center"
                  >
                    {selectedDeal ? 'Update Portfolio' : 'Launch Deal'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SalesPipeline;
