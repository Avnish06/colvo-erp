import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { Megaphone, Plus, Clock, User, Trash2 } from 'lucide-react';

const Announcements = () => {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ title: '', content: '' });
  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'Developer';

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await axios.get('/api/notifications/announcements');
      if (res.data.success) {
        setAnnouncements(res.data.data);
      }
    } catch (err) {
      toast.error('Error fetching announcements');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('/api/notifications/announcements', formData);
      if (res.data.success) {
        toast.success('Announcement posted');
        setShowModal(false);
        setFormData({ title: '', content: '' });
        fetchAnnouncements();
      }
    } catch (err) {
      toast.error('Error posting announcement');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900 text-left">Company Announcements</h3>
          <p className="text-gray-500 font-medium">Stay updated with the latest news and broadcasts</p>
        </div>
        {isAdmin && (
          <button
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 w-full md:w-auto"
          >
            <Plus size={20} /> Create Announcement
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="p-8 text-center text-gray-500 bg-white rounded-2xl border border-gray-100 italic">Loading announcements...</div>
        ) : announcements.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-2xl border border-gray-100">
            <Megaphone size={48} className="mx-auto text-gray-200 mb-4" />
            <p className="text-gray-500">No announcements yet.</p>
          </div>
        ) : (
          announcements.map((ann) => (
            <div key={ann.id} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow relative group">
              <div className="flex items-start justify-between mb-4">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
                    <Megaphone size={20} />
                  </div>
                  <div>
                    <h4 className="text-lg font-bold text-gray-900 text-left">{ann.title}</h4>
                    <div className="flex flex-wrap items-center gap-4 mt-1 text-xs text-gray-400 font-bold uppercase tracking-wider">
                      <span className="flex items-center gap-1"><User size={12} /> {ann.created_by_name}</span>
                      <span className="flex items-center gap-1"><Clock size={12} /> {new Date(ann.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>
              </div>
              <p className="text-gray-600 text-left leading-relaxed whitespace-pre-wrap">{ann.content}</p>
            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-8">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">Create New Announcement</h3>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Announcement Title</label>
                <input
                  type="text"
                  required
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="e.g., Office Holiday Notice"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Content</label>
                <textarea
                  required
                  rows="5"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  placeholder="Write your announcement message here..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                ></textarea>
              </div>
              <div className="flex flex-wrap gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-6 py-3 border border-gray-200 text-gray-600 font-bold rounded-xl hover:bg-gray-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all"
                >
                  Post Announcement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Announcements;
