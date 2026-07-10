import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  User, Mail, Phone, Calendar, Clock,
  Activity, MessageSquare, Send, CheckCircle,
  MoreHorizontal, AlertCircle, Plus, ArrowLeft
} from 'lucide-react';

const LeadDetails = ({ leadId, onNavigate }) => {
  const [lead, setLead] = useState(null);
  const [activities, setActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [note, setNote] = useState('');
  const [isReminderModalOpen, setIsReminderModalOpen] = useState(false);
  const [reminderData, setReminderData] = useState({
    reminder_date: '',
    message: ''
  });

  useEffect(() => {
    if (leadId) fetchDetails();
  }, [leadId]);

  const fetchDetails = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`/api/leads/${leadId}`);
      if (res.data.success) {
        setLead(res.data.lead);
        setActivities(res.data.activities);
      }
    } catch (err) {
      toast.error('Error fetching lead details');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    if (!note.trim()) return;
    try {
      await axios.post(`/api/leads/${leadId}/activity`, {
        type: 'Note',
        content: note
      });
      setNote('');
      fetchDetails();
      toast.success('Note added');
    } catch (err) {
      toast.error('Error adding note');
    }
  };

  const handleSetReminder = async (e) => {
    e.preventDefault();
    try {
      await axios.post('/api/leads/data/reminders', {
        lead_id: leadId,
        ...reminderData
      });
      setIsReminderModalOpen(false);
      setReminderData({ reminder_date: '', message: '' });
      toast.success('Reminder set');
    } catch (err) {
      toast.error('Error setting reminder');
    }
  };

  if (loading) return <div className="p-20 text-center text-gray-500 font-bold bg-white rounded-2xl shadow-sm border border-gray-100">Analyzing lead data...</div>;
  if (!lead) return <div className="p-20 text-center text-red-500 font-bold bg-white rounded-2xl shadow-sm border border-gray-100">Lead not found.</div>;

  return (
    <div className="space-y-6">
      <button
        onClick={() => onNavigate('CaptureLeads')}
        className="flex items-center gap-2 text-indigo-600 font-bold hover:text-indigo-800 transition-colors"
      >
        <ArrowLeft size={20} /> Back to Directory
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sidebar: Lead Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 sticky top-6">
            <div className="flex flex-col items-center text-center mb-6">
              <div className="w-24 h-24 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center font-black text-3xl mb-4 border-4 border-white shadow-lg">
                {lead.name.charAt(0)}
              </div>
              <h2 className="text-2xl font-bold text-gray-900">{lead.name}</h2>
              <p className="text-sm text-gray-500">{lead.source}</p>
              <div className={`mt-3 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest ${lead.status === 'Converted' ? 'bg-green-100 text-green-700' : 'bg-indigo-100 text-indigo-700'
                }`}>
                {lead.status}
              </div>
            </div>

            <div className="space-y-4 border-t border-gray-50 pt-6">
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                  <Mail size={16} />
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase font-bold">Email</p>
                  <p className="font-bold text-gray-700 break-all">{lead.email || 'N/A'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                  <Phone size={16} />
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase font-bold">Phone</p>
                  <p className="font-bold text-gray-700">{lead.phone || 'N/A'}</p>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-sm">
                <div className="w-8 h-8 rounded-lg bg-gray-50 flex items-center justify-center text-gray-400">
                  <Calendar size={16} />
                </div>
                <div>
                  <p className="text-gray-400 text-[10px] uppercase font-bold">Created</p>
                  <p className="font-bold text-gray-700">{new Date(lead.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            <button
              onClick={() => setIsReminderModalOpen(true)}
              className="w-full mt-8 bg-white border-2 border-indigo-600 text-indigo-600 font-bold py-3 rounded-2xl flex items-center justify-center gap-2 hover:bg-indigo-50 transition-all"
            >
              <Clock size={18} /> Schedule Follow-up
            </button>
          </div>
        </div>

        {/* Main: Activity Timeline */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <h3 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-2">
              <Activity size={24} className="text-indigo-600" /> Activity Timeline
            </h3>

            <div className="relative mb-8">
              <div className="absolute left-6 h-full border-l-2 border-gray-100 z-0"></div>
              <div className="space-y-8 relative z-10">
                {activities.length === 0 ? (
                  <p className="text-gray-400 text-center py-10 italic">No activity recorded yet.</p>
                ) : activities.map((act, idx) => (
                  <div key={act.id} className="flex gap-4 group">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 shadow-sm border ${act.type === 'Lead Captured' ? 'bg-indigo-600 text-white border-indigo-600' :
                      act.type === 'Note' ? 'bg-white text-emerald-600 border-emerald-100' :
                        'bg-white text-amber-600 border-amber-100'
                      }`}>
                      {act.type === 'Lead Captured' ? <CheckCircle size={20} /> :
                        act.type === 'Note' ? <MessageSquare size={20} /> : <AlertCircle size={20} />}
                    </div>
                    <div className="flex-1 bg-gray-50/50 p-4 rounded-2xl border border-gray-100 group-hover:bg-white group-hover:shadow-md transition-all">
                      <div className="flex flex-wrap items-center justify-between gap-4 mb-2 text-xs">
                        <span className="font-bold text-gray-900">{act.type} by {act.user_name}</span>
                        <span className="text-gray-400 italic">{new Date(act.created_at).toLocaleString()}</span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed font-medium">{act.content}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <form onSubmit={handleAddNote} className="relative mt-12 bg-gray-50 p-4 rounded-3xl border border-gray-100">
              <textarea
                placeholder="Type a note or activity update..."
                className="w-full bg-transparent p-4 outline-none text-gray-700 min-h-[120px] resize-none"
                value={note}
                onChange={(e) => setNote(e.target.value)}
              />
              <div className="flex justify-end p-2 border-t border-gray-100/50 mt-2">
                <button
                  type="submit"
                  disabled={!note.trim()}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-100 disabled:opacity-50 disabled:shadow-none"
                >
                  Post Update <Send size={16} />
                </button>
              </div>
            </form>
          </div>
        </div>

        {isReminderModalOpen && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all animate-in fade-in zoom-in duration-200">
              <div className="p-6 border-b border-gray-100 flex flex-wrap items-center justify-between gap-4 bg-amber-50">
                <h3 className="text-xl font-bold text-amber-900">Set Reminder</h3>
                <button
                  onClick={() => setIsReminderModalOpen(false)}
                  className="text-amber-400 hover:text-amber-600"
                >
                  <AlertCircle size={24} />
                </button>
              </div>

              <form onSubmit={handleSetReminder} className="p-8 space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Follow-up Date & Time</label>
                  <input
                    required
                    type="datetime-local"
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 outline-none transition-all"
                    value={reminderData.reminder_date}
                    onChange={(e) => setReminderData({ ...reminderData, reminder_date: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-700">Reminder Note</label>
                  <textarea
                    required
                    className="w-full px-4 py-3 bg-gray-50 border border-gray-100 rounded-2xl outline-none min-h-[100px]"
                    placeholder="What is this reminder for?"
                    value={reminderData.message}
                    onChange={(e) => setReminderData({ ...reminderData, message: e.target.value })}
                  />
                </div>
                <div className="flex flex-wrap justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setIsReminderModalOpen(false)}
                    className="px-6 py-3 text-gray-500 font-bold hover:bg-gray-100 rounded-xl"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-8 py-3 bg-amber-500 text-white font-bold rounded-xl shadow-lg shadow-amber-100 hover:bg-amber-600"
                  >
                    Set Reminder
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default LeadDetails;
