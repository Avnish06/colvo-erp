import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { Users, Mail, Phone, Briefcase, Activity, Calendar } from 'lucide-react';

const Customer360 = () => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHealthScores();
  }, []);

  const fetchHealthScores = async () => {
    try {
      const res = await axios.get('/api/client-management/health');
      if (res.data.success) {
        setClients(res.data.clients);
      }
    } catch (err) {
      toast.error('Failed to load client health scores');
    } finally {
      setLoading(false);
    }
  };

  const getHealthColor = (score) => {
    if (score >= 90) return 'text-emerald-700 bg-emerald-100 border-emerald-200';
    if (score >= 70) return 'text-amber-700 bg-amber-100 border-amber-200';
    return 'text-red-700 bg-red-100 border-red-200';
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><Users /> Customer 360° Health Score</h2>
      </div>

      {loading ? (
        <div className="text-center p-8 text-slate-500">Loading client health data...</div>
      ) : clients.length === 0 ? (
        <div className="text-center p-8 text-slate-500 bg-white rounded-xl shadow-sm border border-slate-200">No active clients found. Onboard a client first!</div>
      ) : (
        <div className="space-y-6">
          {clients.map(c => (
            <div key={c.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-8 hover:shadow-md transition-shadow duration-200">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-full md:w-1/3 text-center border-b md:border-b-0 md:border-r border-slate-200 pb-8 md:pb-0 md:pr-8 flex flex-col items-center justify-center">
                  <div className="relative mb-4">
                    <svg className="w-32 h-32 transform -rotate-90">
                      <circle cx="64" cy="64" r="56" fill="transparent" stroke="#f1f5f9" strokeWidth="12" />
                      <circle 
                        cx="64" cy="64" r="56" fill="transparent" 
                        stroke={c.health_score >= 90 ? '#10b981' : c.health_score >= 70 ? '#f59e0b' : '#ef4444'} 
                        strokeWidth="12" 
                        strokeDasharray={2 * Math.PI * 56} 
                        strokeDashoffset={2 * Math.PI * 56 * (1 - c.health_score / 100)} 
                        strokeLinecap="round"
                        className="transition-all duration-1000 ease-out"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                      <span className="text-3xl font-black text-slate-700">{c.health_score}</span>
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Score</span>
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-800">{c.name}</h3>
                  <p className="text-slate-500 text-sm">{c.company}</p>
                  <div className={`mt-4 inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${getHealthColor(c.health_score)}`}>
                    {c.health_score >= 90 ? 'Excellent' : c.health_score >= 70 ? 'Needs Attention' : 'At Risk'}
                  </div>
                </div>
                
                <div className="w-full md:w-2/3 grid grid-cols-2 gap-4">
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2"><Briefcase size={14}/> Active Projects</h4>
                    <p className="text-2xl font-black text-slate-700">{Math.floor(Math.random() * 5) + 1}</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2"><Activity size={14}/> Recent Interactions</h4>
                    <p className="text-sm font-medium text-slate-700">Proposal Reviewed</p>
                    <p className="text-xs text-slate-400 mt-1">2 hours ago</p>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2"><Calendar size={14}/> Renewal & Retention</h4>
                    <p className="text-sm font-medium text-slate-700">Contract renews in: 45 Days</p>
                    <button className="mt-2 text-xs font-bold text-indigo-600 hover:text-indigo-800 underline">Send Renewal Reminder</button>
                  </div>
                  <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <h4 className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400 mb-2"><Phone size={14}/> Communication Logs</h4>
                    <p className="text-sm font-medium text-slate-700">Total calls: {Math.floor(Math.random() * 20)}</p>
                    <p className="text-xs text-slate-400 mt-1">Total meetings: {Math.floor(Math.random() * 10)}</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Customer360;
