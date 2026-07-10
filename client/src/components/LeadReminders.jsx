import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  Bell, Clock, CheckCircle, User, Plus, Edit2, X, Trash2
} from 'lucide-react';

const LeadReminders = () => {
  const [reminders, setReminders] = useState([]);
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState(null);
  const [formData, setFormData] = useState({
    lead_id: '',
    reminder_date: '',
    message: ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [remRes, leadsRes] = await Promise.all([
        axios.get('/api/leads/data/reminders'),
        axios.get('/api/leads')
      ]);

      if (remRes.data.success) setReminders(remRes.data.data);
      if (leadsRes.data.success) setLeads(leadsRes.data.data);
    } catch (err) {
      toast.error('Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const markCompleted = async (id) => {
    try {
      await axios.put(`/api/leads/data/reminders/${id}`, {});
      toast.success('Reminder completed');
      fetchData();
    } catch (err) {
      toast.error('Error completing reminder');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this reminder?')) return;
    try {
      await axios.delete(`/api/leads/data/reminders/${id}`);
      toast.success('Reminder deleted');
      fetchData();
    } catch (err) {
      toast.error('Error deleting reminder');
    }
  };

  const openModal = (reminder = null) => {
    if (reminder) {
      setEditingReminder(reminder);
      // Format datetime-local to YYYY-MM-DDThh:mm
      const rawDate = new Date(reminder.reminder_date);
      // Adjust for local timezone offset
      const localDate = new Date(rawDate.getTime() - (rawDate.getTimezoneOffset() * 60000)).toISOString().slice(0, 16);

      setFormData({
        lead_id: reminder.lead_id,
        reminder_date: localDate,
        message: reminder.message
      });
    } else {
      setEditingReminder(null);
      setFormData({
        lead_id: '',
        reminder_date: '',
        message: ''
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingReminder(null);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!formData.lead_id || !formData.reminder_date || !formData.message) {
      return toast.error('Please fill all fields');
    }

    try {
      if (editingReminder) {
        await axios.put(`/api/leads/data/reminders/${editingReminder.id}/edit`, formData);
        toast.success('Reminder updated successfully');
      } else {
        await axios.post('/api/leads/data/reminders', formData);
        toast.success('Reminder added successfully');
      }
      closeModal();
      fetchData();
    } catch (err) {
      toast.error('Error saving reminder');
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Bell className="text-amber-500" size={28} /> Follow-up Reminders
          </h2>
          <p className="text-sm text-gray-500">Don't let your leads turn cold. Stay on top of follow-ups.</p>
        </div>
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto mt-4 md:mt-0">
          <div className="bg-amber-50 px-6 py-3 sm:py-2 rounded-full border border-amber-100 font-bold text-amber-700 text-sm w-full sm:w-auto text-center whitespace-nowrap">
            {reminders.length} Pending Actions
          </div>
          <button
            onClick={() => openModal()}
            className="px-6 py-3 sm:py-2 bg-blue-600 text-white font-bold rounded-xl flex items-center justify-center gap-2 hover:bg-blue-700 transition w-full sm:w-auto whitespace-nowrap"
          >
            <Plus size={18} /> Add Reminder
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-12">
        {loading ? (
          <div className="col-span-full py-20 text-center text-gray-400 font-bold">Scanning for upcoming tasks...</div>
        ) : reminders.length === 0 ? (
          <div className="col-span-full py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 text-center flex flex-col items-center justify-center gap-4">
            <CheckCircle size={48} className="text-emerald-200" />
            <div className="text-gray-400 font-bold text-xl">All caught up! No pending reminders.</div>
          </div>
        ) : reminders.map(reminder => (
          <div key={reminder.id} className="relative bg-white p-6 rounded-3xl shadow-sm border border-gray-100 hover:shadow-lg transition-all animate-in fade-in slide-in-from-bottom-2 duration-300">

            <div className="absolute top-4 right-4 flex flex-wrap items-center gap-2">
              <button onClick={() => openModal(reminder)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition">
                <Edit2 size={16} />
              </button>
              <button onClick={() => handleDelete(reminder.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition">
                <Trash2 size={16} />
              </button>
            </div>

            <div className="flex items-start justify-between mb-4 mt-2">
              <div className="flex flex-wrap items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                  <Clock size={20} />
                </div>
                <div>
                  <p className="text-[10px] uppercase font-black text-amber-500 tracking-widest">Upcoming</p>
                  <p className="font-bold text-gray-900">{new Date(reminder.reminder_date).toLocaleString()}</p>
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex flex-wrap items-center gap-2 text-indigo-600 font-bold text-sm mb-2">
                <User size={14} /> {reminder.lead_name}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed bg-gray-50 p-4 rounded-2xl border border-gray-100 italic">
                "{reminder.message}"
              </p>
            </div>

            <button
              onClick={() => markCompleted(reminder.id)}
              className="w-full bg-emerald-600 text-white py-3 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-emerald-700 shadow-lg shadow-emerald-50 transition-all hover:scale-[1.02] active:scale-95"
            >
              Mark as Completed <CheckCircle size={18} />
            </button>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <h3 className="text-xl font-bold text-gray-900">
                {editingReminder ? 'Edit Reminder' : 'Add Follow-up Reminder'}
              </h3>
              <button onClick={closeModal} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition">
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSave} className="p-6 space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Select Lead</label>
                <select
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={formData.lead_id}
                  onChange={(e) => setFormData({ ...formData, lead_id: e.target.value })}
                >
                  <option value="">-- Choose a Lead --</option>
                  {leads.map(lead => (
                    <option key={lead.id} value={lead.id}>{lead.name} ({lead.status})</option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Date & Time</label>
                <input
                  type="datetime-local"
                  required
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition"
                  value={formData.reminder_date}
                  onChange={(e) => setFormData({ ...formData, reminder_date: e.target.value })}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-700">Message / Notes</label>
                <textarea
                  required
                  rows="3"
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none"
                  placeholder="e.g., Follow up regarding the recent proposal..."
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                ></textarea>
              </div>

              <div className="pt-4 flex flex-wrap gap-3">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition"
                >
                  {editingReminder ? 'Update' : 'Save'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadReminders;
