import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { Calendar as CalendarIcon, Save, History, FileText, CheckCircle, AlertTriangle, ListTodo, Smile, Meh, Frown, Coffee } from 'lucide-react';
import { toast } from 'react-toastify';

const MyDayReport = () => {
  const [activeTab, setActiveTab] = useState('today');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [history, setHistory] = useState([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(false);
  
  const [formData, setFormData] = useState({
    workSummary: '',
    tasksCompleted: '',
    challenges: '',
    planTomorrow: '',
    mood: ''
  });

  const todayStr = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  const wordCount = formData.workSummary.trim() ? formData.workSummary.trim().split(/\s+/).length : 0;

  useEffect(() => {
    if (activeTab === 'history') {
      fetchHistory();
    }
  }, [activeTab]);

  const fetchHistory = async () => {
    setIsLoadingHistory(true);
    try {
      const res = await axios.get('/api/daily-reports');
      if (res.data.success) {
        setHistory(res.data.reports);
      }
    } catch (error) {
      toast.error('Failed to load report history');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const setMood = (mood) => {
    setFormData({ ...formData, mood });
  };

  const handleSubmit = async () => {
    if (wordCount < 10) {
      toast.error('Work summary must be at least 10 words.');
      return;
    }

    try {
      setIsSubmitting(true);
      const res = await axios.post('/api/daily-reports', formData);
      if (res.data.success) {
        toast.success('Daily report saved successfully!');
        setFormData({
          workSummary: '',
          tasksCompleted: '',
          challenges: '',
          planTomorrow: '',
          mood: ''
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to save daily report');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      
      {/* Header Banner */}
      <div className="bg-[#1a1625] rounded-3xl p-8 shadow-xl mb-6 relative overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute top-0 right-0 -mt-16 -mr-16 w-64 h-64 bg-fuchsia-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 -mb-16 -ml-16 w-64 h-64 bg-indigo-500 rounded-full opacity-10 blur-3xl"></div>
        
        <div className="relative z-10 flex flex-col gap-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-bold text-pink-300 w-max shadow-sm backdrop-blur-sm">
            <CalendarIcon size={12} />
            {new Date().toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
          <div>
            <h1 className="text-3xl font-black text-white tracking-tight flex items-center gap-3">
              <FileText className="text-white" />
              My Day Report
            </h1>
            <p className="text-slate-400 mt-2 text-sm font-medium">Log what you accomplished today — your daily work history, all in one place.</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-6">
        <button 
          onClick={() => setActiveTab('today')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${activeTab === 'today' ? 'bg-pink-500 text-white shadow-pink-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          <FileText size={16} />
          Today's Report
        </button>
        <button 
          onClick={() => setActiveTab('history')}
          className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-bold transition-all shadow-sm ${activeTab === 'history' ? 'bg-pink-500 text-white shadow-pink-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}
        >
          <History size={16} />
          My History
        </button>
      </div>

      {/* Main Content Area */}
      {activeTab === 'today' ? (
        <div className="space-y-6">
          {/* Today Date Pill */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-pink-50 border border-pink-100 text-xs font-bold text-pink-600 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-pink-500"></span>
            Today — {todayStr}
          </div>

          {/* Form */}
          <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100 space-y-6">
            
            {/* Work Summary */}
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                <FileText size={14} /> WORK SUMMARY <span className="text-red-500">*</span>
              </label>
              <textarea 
                name="workSummary"
                value={formData.workSummary}
                onChange={handleInputChange}
                placeholder="Describe what you worked on today in detail... (minimum 10 words)"
                className="w-full h-32 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium p-4 rounded-2xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none resize-none"
              ></textarea>
              <div className="flex justify-between items-center mt-2 px-2">
                <span className="text-[10px] font-bold text-slate-400">Minimum 10 words required</span>
                <span className={`text-[10px] font-black ${wordCount >= 10 ? 'text-emerald-500' : 'text-slate-400'}`}>{wordCount} words</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Tasks Completed */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  <CheckCircle size={14} /> TASKS COMPLETED
                </label>
                <textarea 
                  name="tasksCompleted"
                  value={formData.tasksCompleted}
                  onChange={handleInputChange}
                  placeholder="List tasks you completed (one per line)..."
                  className="w-full h-28 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium p-4 rounded-2xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none resize-none"
                ></textarea>
              </div>

              {/* Challenges / Blockers */}
              <div>
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                  <AlertTriangle size={14} /> CHALLENGES / BLOCKERS
                </label>
                <textarea 
                  name="challenges"
                  value={formData.challenges}
                  onChange={handleInputChange}
                  placeholder="Any blockers or challenges faced today..."
                  className="w-full h-28 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium p-4 rounded-2xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none resize-none"
                ></textarea>
              </div>
            </div>

            {/* Plan for Tomorrow */}
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">
                <ListTodo size={14} /> PLAN FOR TOMORROW
              </label>
              <textarea 
                name="planTomorrow"
                value={formData.planTomorrow}
                onChange={handleInputChange}
                placeholder="What do you plan to accomplish tomorrow?"
                className="w-full h-24 bg-slate-50 border border-slate-200 text-slate-900 text-sm font-medium p-4 rounded-2xl focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500 transition-all outline-none resize-none"
              ></textarea>
            </div>

            {/* Mood / How was your day */}
            <div>
              <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">
                <Smile size={14} /> HOW WAS YOUR DAY?
              </label>
              <div className="flex flex-wrap gap-3">
                <button onClick={() => setMood('Great')} className={`px-5 py-2 rounded-full border text-sm font-bold transition-all flex items-center gap-2 ${formData.mood === 'Great' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  😍 Great
                </button>
                <button onClick={() => setMood('Good')} className={`px-5 py-2 rounded-full border text-sm font-bold transition-all flex items-center gap-2 ${formData.mood === 'Good' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  🙂 Good
                </button>
                <button onClick={() => setMood('Neutral')} className={`px-5 py-2 rounded-full border text-sm font-bold transition-all flex items-center gap-2 ${formData.mood === 'Neutral' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  😐 Neutral
                </button>
                <button onClick={() => setMood('Tough')} className={`px-5 py-2 rounded-full border text-sm font-bold transition-all flex items-center gap-2 ${formData.mood === 'Tough' ? 'bg-blue-50 border-blue-200 text-blue-700 ring-2 ring-blue-500/20' : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'}`}>
                  😫 Tough
                </button>
              </div>
            </div>
            
          </div>
          
          {/* Submit Button */}
          <div className="pt-2">
            <button 
              onClick={handleSubmit}
              disabled={isSubmitting || wordCount < 10}
              className="flex items-center gap-2 bg-pink-600 hover:bg-pink-700 disabled:opacity-50 text-white font-black py-3.5 px-8 rounded-xl transition-all shadow-lg shadow-pink-200"
            >
              <Save size={18} strokeWidth={2.5} />
              {isSubmitting ? 'Saving...' : 'Save Report'}
            </button>
          </div>

        </div>
      ) : (
        <div className="bg-white rounded-3xl p-6 md:p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-black text-slate-900 tracking-tight mb-6 flex items-center gap-2">
            <History className="text-indigo-500" /> Report History
          </h2>
          
          {isLoadingHistory ? (
            <div className="text-center py-10 text-slate-500 font-medium">Loading history...</div>
          ) : history.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto shadow-sm border border-slate-100 mb-4">
                <FileText className="text-slate-300" size={24} />
              </div>
              <h3 className="text-lg font-bold text-slate-700 mb-1">No reports yet</h3>
              <p className="text-sm text-slate-500">You haven't submitted any daily reports. Start logging your work today!</p>
            </div>
          ) : (
            <div className="space-y-6">
              {history.map(report => (
                <div key={report.id} className="bg-slate-50 border border-slate-100 rounded-2xl p-6 hover:shadow-md transition-shadow">
                  <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-200">
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-xs font-bold text-slate-700 shadow-sm">
                      <CalendarIcon size={12} className="text-indigo-500" />
                      {new Date(report.created_at).toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                    </div>
                    {report.mood && (
                      <span className="text-xs font-bold text-slate-500 flex items-center gap-1 bg-white px-3 py-1 rounded-full border border-slate-200 shadow-sm">
                        Mood: <span className="text-indigo-600">{report.mood}</span>
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-4">
                    <div>
                      <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Work Summary</h4>
                      <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{report.work_summary}</p>
                    </div>
                    
                    {report.tasks_completed && (
                      <div>
                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Tasks Completed</h4>
                        <p className="text-sm text-slate-600 whitespace-pre-wrap">{report.tasks_completed}</p>
                      </div>
                    )}
                    
                    {(report.challenges || report.plan_tomorrow) && (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4 mt-4 border-t border-slate-200/50">
                        {report.challenges && (
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Challenges</h4>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{report.challenges}</p>
                          </div>
                        )}
                        {report.plan_tomorrow && (
                          <div>
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Plan for Tomorrow</h4>
                            <p className="text-sm text-slate-600 whitespace-pre-wrap">{report.plan_tomorrow}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default MyDayReport;
