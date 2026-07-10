import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Search, Filter, MessageSquare, CheckCircle, Clock, AlertCircle, User } from 'lucide-react';

const Support = ({ initialTab, initialAction }) => {
  const [tickets, setTickets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTicket, setNewTicket] = useState({ title: '', description: '', priority: 'Medium', category: 'Issue', customCategory: '' });
  const [filter, setFilter] = useState('All');
  const [activeCategory, setActiveCategory] = useState('All');
  const user = JSON.parse(localStorage.getItem('user')) || {};
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Developer';

  useEffect(() => {
    fetchTickets();
    if (isAdmin) {
      fetchEmployees();
    }
  }, []);

  useEffect(() => {
    if (initialAction === 'raise') {
      setIsModalOpen(true);
      setFilter('All');
      setActiveCategory('All');
    } else if (initialAction === 'query') {
      setIsModalOpen(false);
      setFilter('All');
      setActiveCategory('Query');
    } else if (initialAction === 'track') {
      setIsModalOpen(false);
      setFilter('Open');
      setActiveCategory('All');
    } else if (initialTab === 'Support_Respond') {
      setFilter('Open');
      setActiveCategory('All');
    } else if (initialTab === 'Support_Queries') {
      setFilter('All');
      setActiveCategory('Query');
    }
  }, [initialTab, initialAction]);

  const fetchTickets = async () => {
    try {
      const res = await axios.get('/api/tickets', {
        params: { user_id: user.id, role: user.role }
      });
      if (res.data.success) {
        setTickets(res.data.data);
      }
    } catch (err) {
      toast.error('Error fetching tickets');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      console.error('Error fetching employees');
    }
  };

  const handleCreateTicket = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/tickets', {
        ...newTicket,
        category: newTicket.category === 'Others' ? newTicket.customCategory : newTicket.category,
        user_id: user.id
      });
      if (res.data.success) {
        toast.success('Ticket created successfully');
        setIsModalOpen(false);
        setNewTicket({ title: '', description: '', priority: 'Medium', category: 'Issue', customCategory: '' });
        fetchTickets();
      }
    } catch (err) {
      toast.error('Error creating ticket');
    }
  };

  const handleStatusUpdate = async (id, newStatus) => {
    try {
      const res = await axios.put(`/api/tickets/${id}`, { status: newStatus });
      if (res.data.success) {
        toast.success(`Ticket status updated to ${newStatus}`);
        fetchTickets();
      }
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  const handleAssign = async (id, employeeId) => {
    try {
      const res = await axios.put(`/api/tickets/${id}`, { assigned_to: employeeId });
      if (res.data.success) {
        toast.success('Ticket assigned successfully');
        fetchTickets();
      }
    } catch (err) {
      toast.error('Error assigning ticket');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Delete this ticket?')) {
      try {
        await axios.delete(`/api/tickets/${id}`);
        toast.success('Ticket deleted');
        fetchTickets();
      } catch (err) {
        toast.error('Error deleting ticket');
      }
    }
  };

  const filteredTickets = tickets.filter(ticket => {
    // Strict personal check: non-admins only see their own tickets (raised by them)
    if (!isAdmin) {
      const isOwner = Number(ticket.user_id) === Number(user.id);
      if (!isOwner) return false;
    }

    const matchesStatus = filter === 'All' || ticket.status === filter;
    const matchesCategory = activeCategory === 'All' || ticket.category === activeCategory;
    return matchesStatus && matchesCategory;
  });

  const getPriorityColor = (p) => {
    switch (p) {
      case 'High': return 'text-red-600 bg-red-50';
      case 'Medium': return 'text-amber-600 bg-amber-50';
      case 'Low': return 'text-green-600 bg-green-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusColor = (s) => {
    switch (s) {
      case 'Open': return 'text-blue-600 bg-blue-50';
      case 'In Progress': return 'text-purple-600 bg-purple-50';
      case 'Resolved': return 'text-green-600 bg-green-50';
      case 'Closed': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Support Tickets</h2>
          <p className="text-sm text-gray-500">Manage support requests and issues.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 text-white px-4 py-2 rounded-xl font-semibold flex items-center gap-2 hover:bg-indigo-700 transition-colors"
        >
          <Plus size={18} /> New Ticket
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-4 border-b border-gray-100 pb-4">
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-gray-400 uppercase mr-2">Status:</span>
          {['All', 'Open', 'In Progress', 'Resolved', 'Closed'].map(status => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${filter === status
                ? 'bg-indigo-100 text-indigo-700 border-indigo-200 border'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {status}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2 overflow-x-auto">
          <span className="text-xs font-bold text-gray-400 uppercase mr-2">Category:</span>
          {['All', 'Issue', 'Query', 'Request'].map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors ${activeCategory === cat
                ? 'bg-emerald-100 text-emerald-700 border-emerald-200 border'
                : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'
                }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Ticket List */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-gray-500">Loading tickets...</div>
        ) : filteredTickets.length === 0 ? (
          <div className="p-12 text-center flex flex-col items-center justify-center text-gray-500">
            <MessageSquare size={48} className="mb-4 text-gray-300" />
            <p className="text-lg font-medium">No tickets found</p>
            <p className="text-sm">Create a new ticket to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {filteredTickets.map(ticket => (
              <div key={ticket.id} className="p-6 hover:bg-gray-50 transition-colors group">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div className="space-y-2 flex-1">
                    <div className="flex items-start justify-between">
                      <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        {ticket.title}
                        <div className="flex flex-wrap gap-1">
                          <span className={`text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider ${getPriorityColor(ticket.priority)}`}>
                            {ticket.priority}
                          </span>
                          <span className="text-[10px] px-2 py-1 rounded-full uppercase font-bold tracking-wider bg-gray-100 text-gray-600">
                            {ticket.category || 'Issue'}
                          </span>
                        </div>
                      </h3>
                      <span className="text-xs text-gray-400 font-mono">#{ticket.id}</span>
                    </div>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap">{ticket.description}</p>
                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-2">
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> {new Date(ticket.created_at).toLocaleDateString()}
                      </span>
                      <span>•</span>
                      <span>By {ticket.creator_name || 'Unknown'}</span>
                      {ticket.assigned_to && (
                        <>
                          <span>•</span>
                          <span className="flex items-center gap-1 text-indigo-600 font-medium">
                            <User size={12} /> Assigned to: {employees.find(e => e.id === ticket.assigned_to)?.name || 'Unknown'}
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-row md:flex-col items-center md:items-end gap-3 min-w-[140px]">
                    <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1 ${getStatusColor(ticket.status)}`}>
                      {ticket.status === 'Resolved' && <CheckCircle size={12} />}
                      {ticket.status === 'Open' && <AlertCircle size={12} />}
                      {ticket.status}
                    </span>

                    {isAdmin && (
                      <div className="flex flex-col gap-2 w-full md:w-auto">
                        <select
                          value={ticket.status}
                          onChange={(e) => handleStatusUpdate(ticket.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-indigo-500 w-full"
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>

                        <select
                          value={ticket.assigned_to || ''}
                          onChange={(e) => handleAssign(ticket.id, e.target.value)}
                          className="text-xs border border-gray-200 rounded-lg px-2 py-1 bg-white focus:outline-none focus:border-indigo-500 w-full"
                        >
                          <option value="" disabled>Assign To...</option>
                          {employees.map(emp => (
                            <option key={emp.id} value={emp.id}>{emp.name}</option>
                          ))}
                        </select>
                      </div>
                    )}

                    {isAdmin && (
                      <button
                        onClick={() => handleDelete(ticket.id)}
                        className="text-gray-400 hover:text-red-500 transition-colors p-1"
                        title="Delete Ticket"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* New Ticket Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
            <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <h3 className="font-bold text-lg text-gray-900">Create New Ticket</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl leading-none"
              >
                &times;
              </button>
            </div>

            <form onSubmit={handleCreateTicket} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Subject</label>
                <input
                  type="text"
                  required
                  placeholder="Summarize the issue..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  value={newTicket.title}
                  onChange={(e) => setNewTicket({ ...newTicket, title: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Priority</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    value={newTicket.priority}
                    onChange={(e) => setNewTicket({ ...newTicket, priority: e.target.value })}
                  >
                    <option value="Low">Low</option>
                    <option value="Medium">Medium</option>
                    <option value="High">High</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Category</label>
                  <select
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none"
                    value={newTicket.category}
                    onChange={(e) => setNewTicket({ ...newTicket, category: e.target.value })}
                  >
                    <option value="Issue">Issue</option>
                    <option value="Query">Query</option>
                    <option value="Request">Request</option>
                    <option value="Others">Others</option>
                  </select>
                </div>
              </div>

              {newTicket.category === 'Others' && (
                <div className="space-y-2 animate-fade-in">
                  <label className="text-sm font-bold text-gray-700">Custom Category</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter ticket category..."
                    className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                    value={newTicket.customCategory}
                    onChange={(e) => setNewTicket({ ...newTicket, customCategory: e.target.value })}
                  />
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Description</label>
                <textarea
                  required
                  rows="4"
                  placeholder="Describe the issue in detail..."
                  className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all"
                  value={newTicket.description}
                  onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                />
              </div>

              <div className="pt-4 flex flex-wrap justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  Submit Ticket
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Support;
