import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  ShieldCheck, Zap, Settings, Database, Lock, Building2,
  UserCircle, Plus, Edit, Trash2, Mail, Smartphone,
  Activity, Clock, Save, Server, Key, Share2,
  Users, Briefcase, TrendingUp, Target
} from 'lucide-react';
import {
  BarChart as ReBarChart, Bar as ReBar, XAxis as ReXAxis, YAxis as ReYAxis,
  CartesianGrid as ReCartesianGrid, Tooltip as ReTooltip, Legend as ReLegend,
  ResponsiveContainer as ReResponsiveContainer,
  PieChart as RePieChart, Pie as RePie, Cell as ReCell,
  AreaChart as ReAreaChart, Area as ReArea,
  LineChart as ReLineChart, Line as ReLine
} from 'recharts';


const CRMMasterControl = ({ initialTab, targetReport }) => {
  const [activeTab, setActiveTab] = useState(initialTab || 'DataControl');
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ leads: 0, customers: 0, deals: 0, dealsValue: 0, recentLogs: [] });
  const [roles, setRoles] = useState([]);
  const [settings, setSettings] = useState({});
  const [pipelineStages, setPipelineStages] = useState([]);
  const [newStage, setNewStage] = useState('');
  const [showRolesModal, setShowRolesModal] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const [availablePermissions, setAvailablePermissions] = useState([]);
  const [activePermissions, setActivePermissions] = useState([]);

  // Extract user info from token
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        setUser(payload);
        if (payload.role !== 'Super Admin' && (initialTab === 'Automation' || initialTab === 'Security')) {
          setActiveTab('DataControl');
        }
        if (payload.role !== 'Developer' && initialTab === 'Roles') {
          setActiveTab('DataControl');
        }
      } catch (e) {
        console.error('Error decoding token');
      }
    }
  }, []);

  // Tabs Configuration
  const allTabs = [
    { id: 'Roles', label: 'Role & Permission', icon: <ShieldCheck size={18} />, roles: ['Developer'] },
    { id: 'Automation', label: 'Automation Hub', icon: <Zap size={18} />, roles: ['Super Admin'] },
    { id: 'Settings', label: 'System Settings', icon: <Settings size={18} />, roles: ['Super Admin', 'Admin'] },
    { id: 'DataControl', label: 'Data Access', icon: <Database size={18} />, roles: ['Super Admin', 'Admin'] },
    { id: 'Reports', label: 'Reports & Analytics', icon: <TrendingUp size={18} />, roles: ['Super Admin'] },
    { id: 'Security', label: 'Backup & Audit', icon: <Lock size={18} />, roles: ['Super Admin'] },
    { id: 'Company', label: 'Company & Pipeline', icon: <Building2 size={18} />, roles: ['Super Admin', 'Admin'] }
  ];

  const tabs = allTabs.filter(tab => !tab.roles || (user && tab.roles.includes(user.role)));

  useEffect(() => {
    if (initialTab) setActiveTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const fetchData = async () => {
    setLoading(true);
    try {

      if (activeTab === 'Roles') {
        const res = await axios.get('/api/roles');
        if (res.data.success) setRoles(res.data.data);
      } else if (activeTab === 'DataControl' || activeTab === 'Security' || activeTab === 'Automation') {
        const res = await axios.get('/api/crm-dashboard/stats/summary');
        if (res.data.success) setStats(res.data.data);
      } else if (activeTab === 'Settings' || activeTab === 'Company') {
        const res = await axios.get('/api/settings');
        if (res.data.success) {
          setSettings(res.data.data);
          if (res.data.data.crm_pipeline_stages) {
            setPipelineStages(JSON.parse(res.data.data.crm_pipeline_stages));
          } else {
            setPipelineStages(['New Lead', 'Proposal', 'Negotiation', 'Won', 'Lost']);
          }
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
      toast.error('Failed to load real-time data');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllPermissions = async () => {
    try {
      const res = await axios.get('/api/roles/permissions');
      if (res.data.success) setAvailablePermissions(res.data.data);
    } catch (err) {
      toast.error('Error fetching permissions list');
    }
  };

  const handleManagePermissions = async (role) => {
    setSelectedRole(role);
    setLoading(true);
    try {
      if (availablePermissions.length === 0) await fetchAllPermissions();
      const res = await axios.get(`/api/roles/${role.id}/permissions`);
      if (res.data.success) {
        setActivePermissions(res.data.data);
        setShowRolesModal(true);
      }
    } catch (err) {
      toast.error('Error loading role permissions');
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (id) => {
    setActivePermissions(prev =>
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    );
  };

  const handleSavePermissions = async () => {
    setLoading(true);
    try {
      const res = await axios.put(`/api/roles/${selectedRole.id}`, {
        name: selectedRole.name,
        permissions: activePermissions
      });
      if (res.data.success) {
        toast.success('Permissions updated successfully');
        setShowRolesModal(false);
        fetchData(); // Refresh role list counts
      }
    } catch (err) {
      toast.error('Failed to update permissions');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSettings = async (updates) => {
    try {
      const res = await axios.post('/api/settings', updates);
      if (res.data.success) {
        toast.success('Settings updated');
        setSettings(prev => ({ ...prev, ...updates }));
      }
    } catch (err) {
      toast.error('Failed to update settings');
    }
  };

  const savePipeline = async (stages) => {
    await handleUpdateSettings({ crm_pipeline_stages: JSON.stringify(stages) });
    setPipelineStages(stages);
  };

  const addStage = () => {
    if (!newStage) return;
    savePipeline([...pipelineStages, newStage]);
    setNewStage('');
  };

  const removeStage = (index) => {
    const updated = pipelineStages.filter((_, i) => i !== index);
    savePipeline(updated);
  };

  const runBackup = async () => {
    try {
      const res = await axios.post('/api/backup', {});
      if (res.data.success) toast.success('Manual backup triggered successfully');
    } catch (err) {
      toast.error('Backup failed');
    }
  };

  return (
    <div className="space-y-8">
      {/* Dynamic Tab Navigation */}
      <div className="flex flex-wrap gap-3 bg-white p-2 rounded-2xl shadow-sm border border-gray-100 w-fit">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${activeTab === tab.id
              ? 'bg-gray-900 text-white shadow-lg scale-[1.02]'
              : 'text-gray-400 hover:text-gray-900 hover:bg-gray-50'
              }`}
          >
            {tab.icon} {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 min-h-[600px] relative">
        {loading && (
          <div className="absolute inset-0 bg-white/50 backdrop-blur-sm z-10 flex items-center justify-center rounded-[2.5rem]">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {/* 1. Role & Permission Management */}
        {activeTab === 'Roles' && (
          <div className="space-y-10">
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-3xl font-black text-gray-900 font-outfit">Role Management</h3>
                <p className="text-gray-400 font-medium">Configure specialized CRM team roles and permissions.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {roles.map(role => (
                <div key={role.id} className="p-8 bg-gray-50 rounded-[2rem] border border-gray-100 hover:border-indigo-200 transition-all group">
                  <div className={`w-12 h-12 rounded-2xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-6`}>
                    <ShieldCheck size={24} />
                  </div>
                  <h4 className="text-xl font-black text-gray-900 mb-2">{role.name}</h4>
                  <div className="space-y-2 mb-6">
                    <p className="text-xs text-gray-400 font-bold uppercase tracking-wider flex justify-between">Permissions <span>{role.permission_count} active</span></p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => handleManagePermissions(role)}
                      className="flex-1 py-3 bg-white border border-gray-100 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-gray-900 hover:text-white transition-all shadow-sm"
                    >
                      Manage permissions
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2. Automation Management */}
        {activeTab === 'Automation' && (
          <div className="space-y-10">
            <h3 className="text-3xl font-black text-gray-900 font-outfit border-l-8 border-indigo-600 pl-6">Automation Hub</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div className="p-8 bg-indigo-50 rounded-[2rem] space-y-4">
                  <div className="flex flex-wrap items-center gap-4 mb-2">
                    <Share2 size={24} className="text-indigo-600" />
                    <h4 className="text-lg font-black text-indigo-900">Lead Assignment Rules</h4>
                  </div>
                  <p className="text-sm text-indigo-700/70 italic">Automatically route incoming leads to Sales Executives using round-robin logic.</p>
                  <button className="w-full py-4 bg-white text-indigo-600 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm">Configure Routing</button>
                </div>
                <div className="p-8 bg-emerald-50 rounded-[2rem] space-y-4">
                  <div className="flex flex-wrap items-center gap-4 mb-2">
                    <Mail size={24} className="text-emerald-600" />
                    <h4 className="text-lg font-black text-emerald-900">Auto Email Rules</h4>
                  </div>
                  <p className="text-sm text-emerald-700/70 italic">Trigger welcome sequences when leads are captured or deals move stages.</p>
                  <button className="w-full py-4 bg-white text-emerald-600 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-sm">Manage Workflows</button>
                </div>
              </div>
              <div className="bg-gray-50 rounded-[2.5rem] p-8 border border-gray-100">
                <h4 className="font-black text-gray-900 mb-6 uppercase tracking-widest text-xs">Recent CRM Activity</h4>
                <div className="space-y-4">
                  {(stats.recentLogs || []).map((log, i) => (
                    <div key={i} className="flex items-center justify-between p-4 bg-white rounded-2xl shadow-sm">
                      <div className="flex flex-wrap gap-3 items-center">
                        <div className="w-8 h-8 bg-gray-100 rounded-lg flex items-center justify-center text-gray-400"><Clock size={14} /></div>
                        <p className="text-xs font-bold text-gray-600">{log.action}</p>
                      </div>
                      <span className="text-[10px] text-gray-400 font-medium">{new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                  ))}
                  {(!stats.recentLogs || stats.recentLogs.length === 0) && (
                    <p className="text-center text-gray-400 text-xs py-10 italic">No recent CRM logs found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 3. System Settings */}
        {activeTab === 'Settings' && (
          <div className="space-y-10">
            <h3 className="text-3xl font-black text-gray-900 font-outfit">System Infrastructure</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
              <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm space-y-6">
                <div className="flex flex-wrap items-center gap-4 border-b border-gray-50 pb-4">
                  <Mail size={20} className="text-indigo-600" />
                  <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm">SMTP Configuration</h4>
                </div>
                <div className="space-y-4">
                  <input
                    type="text"
                    placeholder="SMTP Host"
                    className="w-full px-5 py-3 bg-gray-50 rounded-xl border-none font-bold text-xs"
                    value={settings.crm_smtp_host || ''}
                    onChange={(e) => setSettings({ ...settings, crm_smtp_host: e.target.value })}
                  />
                  <input
                    type="text"
                    placeholder="Port"
                    className="w-full px-5 py-3 bg-gray-50 rounded-xl border-none font-bold text-xs"
                    value={settings.crm_smtp_port || ''}
                    onChange={(e) => setSettings({ ...settings, crm_smtp_port: e.target.value })}
                  />
                  <button
                    onClick={() => handleUpdateSettings({ crm_smtp_host: settings.crm_smtp_host, crm_smtp_port: settings.crm_smtp_port })}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all font-outfit"
                  >
                    Update SMTP
                  </button>
                </div>
              </div>
              <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm space-y-6">
                <div className="flex flex-wrap items-center gap-4 border-b border-gray-50 pb-4">
                  <Smartphone size={20} className="text-emerald-600" />
                  <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm">WhatsApp & SMS Integration</h4>
                </div>
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-gray-50 rounded-2xl">
                    <span className="text-xs font-bold text-gray-600">WhatsApp Business API</span>
                    <span className={`px-3 py-1 ${settings.crm_whatsapp_active === 'true' ? 'bg-emerald-100 text-emerald-600' : 'bg-gray-200 text-gray-500'} rounded-full text-[10px] font-black`}>
                      {settings.crm_whatsapp_active === 'true' ? 'ACTIVE' : 'INACTIVE'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleUpdateSettings({ crm_whatsapp_active: settings.crm_whatsapp_active === 'true' ? 'false' : 'true' })}
                    className="w-full py-3 bg-gray-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest font-outfit"
                  >
                    Toggle WhatsApp API
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 4. Data Control */}
        {activeTab === 'DataControl' && (
          <div className="space-y-10">
            <h3 className="text-3xl font-black text-gray-900 font-outfit border-l-8 border-gray-900 pl-6">Master Data Control</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              {[
                { label: 'Leads Database', icon: <Target className="text-indigo-600" />, count: stats.leads || 0 },
                { label: 'Customer Archive', icon: <Users className="text-emerald-600" />, count: stats.customers || 0 },
                { label: 'Deals Registry (₹)', icon: <Briefcase className="text-amber-600" />, count: (stats.dealsValue || 0).toLocaleString() }
              ].map(stat => (
                <div key={stat.label} className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm hover:shadow-xl transition-all">
                  <div className="flex justify-between items-start mb-6">
                    <div className="p-3 bg-gray-50 rounded-xl">{stat.icon}</div>
                  </div>
                  <h4 className="text-gray-400 font-bold uppercase tracking-widest text-[10px] mb-1">{stat.label}</h4>
                  <p className="text-3xl font-black text-gray-900 mb-6">{stat.count}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. Backup & Security */}
        {activeTab === 'Security' && (
          <div className="space-y-10">
            <h3 className="text-3xl font-black text-gray-900 font-outfit">Security & Persistence</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="p-8 bg-gray-900 text-white rounded-[2.5rem] space-y-8">
                <div className="flex flex-wrap items-center gap-4">
                  <Database size={32} className="text-indigo-400" />
                  <h4 className="text-2xl font-black">Database Snapshots</h4>
                </div>
                <p className="text-indigo-200/60 italic text-sm">Trigger a manual backup of the entire CRM system including leads, deals, and interactions.</p>
                <div className="space-y-3">
                  <button
                    onClick={runBackup}
                    className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-indigo-700 transition-all font-outfit shadow-lg shadow-indigo-600/30"
                  >
                    Run Manual Backup
                  </button>
                </div>
              </div>
              <div className="p-8 bg-white border border-gray-100 rounded-[2.5rem] space-y-6">
                <div className="flex flex-wrap items-center gap-4 mb-4">
                  <Activity size={24} className="text-red-600" />
                  <h4 className="font-black text-gray-900 uppercase tracking-widest text-sm">System Audit Logs</h4>
                </div>
                <div className="space-y-4">
                  {(stats.recentLogs || []).slice(0, 5).map((log, i) => (
                    <div key={i} className="flex gap-4 p-4 hover:bg-gray-50 rounded-2xl transition-all">
                      <div className="w-2 h-2 bg-red-400 rounded-full mt-2 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-black text-gray-900">{log.action}</p>
                        <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">
                          By User {log.user_id} · {new Date(log.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  {(!stats.recentLogs || stats.recentLogs.length === 0) && (
                    <p className="text-center text-gray-400 text-xs py-10 italic">No audit records found</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 6. Company Settings */}
        {activeTab === 'Company' && (
          <div className="space-y-10">
            <h3 className="text-3xl font-black text-gray-900 font-outfit">Company & Pipeline Configuration</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-8">
                <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm space-y-6">
                  <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs border-b pb-4">Sales Pipeline Stages</h4>
                  <div className="space-y-3">
                    {pipelineStages.map((v, idx) => (
                      <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-xl border border-gray-100 font-outfit">
                        <span className="text-xs font-bold text-gray-700">{idx + 1}. {v}</span>
                        <div className="flex flex-wrap gap-2">
                          <button onClick={() => removeStage(idx)} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                        </div>
                      </div>
                    ))}
                    <div className="flex flex-wrap gap-2 mt-4 pt-4 border-t border-gray-50">
                      <input
                        type="text"
                        placeholder="New Stage Name..."
                        className="flex-1 px-4 py-2 bg-gray-50 rounded-xl text-xs font-bold border-none"
                        value={newStage}
                        onChange={(e) => setNewStage(e.target.value)}
                      />
                      <button
                        onClick={addStage}
                        className="px-4 py-2 bg-gray-900 text-white rounded-xl text-[10px] font-black uppercase tracking-widest"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm space-y-6">
                <h4 className="font-black text-gray-900 uppercase tracking-widest text-xs border-b pb-4">Standard Configurations</h4>
                <div className="space-y-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Default Currency</label>
                    <select
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-sm font-outfit"
                      value={settings.crm_currency || 'INR'}
                      onChange={(e) => handleUpdateSettings({ crm_currency: e.target.value })}
                    >
                      <option value="INR">₹ INR - Indian Rupee</option>
                      <option value="USD">$ USD - US Dollar</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">CRM Timezone</label>
                    <select className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl font-bold text-sm font-outfit">
                      <option>(GMT+05:30) Chennai, Kolkata, Mumbai</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 7. Reports & Analytics */}
        {activeTab === 'Reports' && <CRMReportsContent targetReport={targetReport} />}

      </div>

      {/* Roles & Permissions Modal */}
      {showRolesModal && (
        <div className="fixed inset-0 bg-gray-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-6 animate-in fade-in duration-300">
          <div className="bg-white rounded-[3rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col border border-white/20">
            <div className="p-10 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
              <div>
                <h3 className="text-3xl font-black text-gray-900 font-outfit">Manage {selectedRole?.name}</h3>
                <p className="text-gray-400 font-medium">Assign specific modules and action rights to this role.</p>
              </div>
              <button
                onClick={() => setShowRolesModal(false)}
                className="p-4 bg-white rounded-2xl text-gray-400 hover:text-gray-900 hover:rotate-90 transition-all duration-300 shadow-sm border border-gray-100"
              >
                ✕
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-10 custom-scrollbar">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Grouping permissions by category (prefix) */}
                {['view', 'manage', 'delete', 'system', 'other'].map(category => {
                  const filtered = availablePermissions.filter(p => {
                    const slug = p.slug.toLowerCase();
                    if (category === 'other') return !['view', 'manage', 'delete', 'system'].some(c => slug.startsWith(c));
                    return slug.startsWith(category);
                  });

                  if (filtered.length === 0) return null;

                  return (
                    <div key={category} className="space-y-4">
                      <h4 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.2em] mb-4 border-l-4 border-indigo-600 pl-3">
                        {category} Permissions
                      </h4>
                      <div className="space-y-3">
                        {filtered.map(p => (
                          <label key={p.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl cursor-pointer hover:bg-white hover:shadow-md border border-transparent hover:border-indigo-100 transition-all group">
                            <div className="relative flex items-center">
                              <input
                                type="checkbox"
                                className="peer h-6 w-6 cursor-pointer appearance-none rounded-lg border-2 border-gray-200 bg-white transition-all checked:border-indigo-600 checked:bg-indigo-600"
                                checked={activePermissions.includes(p.id)}
                                onChange={() => togglePermission(p.id)}
                              />
                              <ShieldCheck className="absolute h-4 w-4 text-white opacity-0 peer-checked:opacity-100 left-1 pointer-events-none transition-opacity" />
                            </div>
                            <div className="flex-1">
                              <p className="text-sm font-black text-gray-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{p.name || p.slug.replace(/_/g, ' ')}</p>
                              <p className="text-[10px] text-gray-400 font-medium">{p.description || `Grants access to ${p.slug} functionality.`}</p>
                            </div>
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-10 border-t border-gray-100 bg-gray-50/50 flex flex-wrap gap-4">
              <button
                onClick={() => setShowRolesModal(false)}
                className="flex-1 py-4 border border-gray-200 text-gray-600 font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-gray-100 transition-all font-outfit"
              >
                Cancel
              </button>
              <button
                onClick={handleSavePermissions}
                disabled={loading}
                className="flex-[2] py-4 bg-gray-900 text-white font-black rounded-2xl text-xs uppercase tracking-widest hover:bg-indigo-600 shadow-xl shadow-indigo-200 transition-all font-outfit flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <Save size={18} />
                {loading ? 'SYNCING...' : 'SAVE PERMISSIONS'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const CRMReportsContent = ({ targetReport }) => {
  const [data, setData] = useState({
    leadSources: [],
    conversion: [],
    pipeline: [],
    performance: [],
    forecast: [],
    lostAnalysis: [],
    retention: []
  });
  const [loading, setLoading] = useState(true);

  const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

  useEffect(() => {
    fetchAllReports();
  }, []);

  useEffect(() => {
    if (targetReport && !loading) {
      const sectionId = targetReport.replace('CRM_Report_', '').toLowerCase() + '-report';
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        element.classList.add('ring-4', 'ring-indigo-100', 'ring-opacity-50');
        setTimeout(() => element.classList.remove('ring-4', 'ring-indigo-100', 'ring-opacity-50'), 3000);
      }
    }
  }, [targetReport, loading]);

  const fetchAllReports = async () => {
    setLoading(true);
    try {

      const [sources, conv, pipe, perf, fore, lost, ret] = await Promise.all([
        axios.get('/api/crm-reports/lead-sources'),
        axios.get('/api/crm-reports/conversion'),
        axios.get('/api/crm-reports/pipeline'),
        axios.get('/api/crm-reports/performance'),
        axios.get('/api/crm-reports/forecast'),
        axios.get('/api/crm-reports/lost-analysis'),
        axios.get('/api/crm-reports/retention')
      ]);

      setData({
        leadSources: sources.data.data,
        conversion: conv.data.data,
        pipeline: pipe.data.data,
        performance: perf.data.data,
        forecast: fore.data.data,
        lostAnalysis: lost.data.data,
        retention: ret.data.data
      });
    } catch (err) {
      toast.error('Failed to load analytical reports');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="py-20 text-center text-gray-400 animate-pulse">Gathering deep intelligence...</div>;

  return (
    <div className="space-y-12 pb-20">
      <div className="flex justify-between items-end border-b border-gray-100 pb-8">
        <div>
          <h3 className="text-4xl font-black text-gray-900 font-outfit mb-2">Deep Analytics</h3>
          <p className="text-gray-400 font-medium">Real-time performance metrics and business intelligence.</p>
        </div>
        <button onClick={fetchAllReports} className="flex items-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-600 transition-all">
          Refesh Data
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
        {/* 1. Lead Sources */}
        <div id="leadsource-report" className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 transition-all duration-500">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Lead Source Distribution</h4>
          <div className="h-[300px] w-full">
            <ReResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <RePie data={data.leadSources} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label>
                  {data.leadSources.map((entry, index) => <ReCell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />)}
                </RePie>
                <ReTooltip />
                <ReLegend />
              </RePieChart>
            </ReResponsiveContainer>
          </div>
        </div>

        {/* 2. Pipeline Analysis */}
        <div id="pipeline-report" className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 transition-all duration-500">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Sales Pipeline Funnel</h4>
          <div className="h-[300px] w-full">
            <ReResponsiveContainer width="100%" height="100%">
              <ReBarChart data={data.pipeline}>
                <ReCartesianGrid strokeDasharray="3 3" vertical={false} />
                <ReXAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <ReYAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <ReTooltip cursor={{ fill: '#f8fafc' }} />
                <ReBar dataKey="count" fill="#10b981" radius={[8, 8, 0, 0]} barSize={40} />
              </ReBarChart>
            </ReResponsiveContainer>
          </div>
        </div>

        {/* 3. Revenue Forecast */}
        <div id="forecast-report" className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 lg:col-span-2 transition-all duration-500">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Revenue Forecast (Expected Value)</h4>
          <div className="h-[350px] w-full">
            <ReResponsiveContainer width="100%" height="100%">
              <ReAreaChart data={data.forecast}>
                <defs>
                  <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <ReCartesianGrid strokeDasharray="3 3" vertical={false} />
                <ReXAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <ReYAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} />
                <ReTooltip />
                <ReArea type="monotone" dataKey="forecast" stroke="#6366f1" fillOpacity={1} fill="url(#colorForecast)" strokeWidth={4} />
              </ReAreaChart>
            </ReResponsiveContainer>
          </div>
        </div>

        {/* 4. Salesperson Performance */}
        <div id="performance-report" className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 transition-all duration-500">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Top Sales Performers (Won Deals)</h4>
          <div className="space-y-4">
            {data.performance.map((p, i) => (
              <div key={i} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex flex-wrap items-center gap-3">
                  <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-xl flex items-center justify-center font-black">{p.name ? p.name[0] : '?'}</div>
                  <div>
                    <h5 className="font-bold text-gray-900">{p.name || 'Unknown'}</h5>
                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">{p.won_deals} Deals Won</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-black text-emerald-600">₹{parseFloat(p.total_value || 0).toLocaleString()}</p>
                </div>
              </div>
            ))}
            {data.performance.length === 0 && <p className="text-center py-10 text-gray-400 italic text-xs">No sales performance data yet</p>}
          </div>
        </div>

        {/* 5. Lost Analysis */}
        <div id="lost-report" className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 transition-all duration-500">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Lost Deal Analysis (Reasons)</h4>
          <div className="h-[300px] w-full">
            <ReResponsiveContainer width="100%" height="100%">
              <ReBarChart data={data.lostAnalysis} layout="vertical">
                <ReCartesianGrid strokeDasharray="3 3" horizontal={false} />
                <ReXAxis type="number" hide />
                <ReYAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 'bold' }} width={100} />
                <ReTooltip cursor={{ fill: '#f8fafc' }} />
                <ReBar dataKey="value" fill="#ef4444" radius={[0, 8, 8, 0]} barSize={20} />
              </ReBarChart>
            </ReResponsiveContainer>
          </div>
        </div>

        {/* 6. Customer Segmentation */}
        <div id="retention-report" className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm space-y-6 transition-all duration-500">
          <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest">Customer Segmentation Retention</h4>
          <div className="h-[300px] w-full">
            <ReResponsiveContainer width="100%" height="100%">
              <RePieChart>
                <RePie data={data.retention} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={60} outerRadius={80} paddingAngle={5}>
                  {data.retention.map((entry, index) => <ReCell key={`cell-${index}`} fill={COLORS[(index + 3) % COLORS.length]} />)}
                </RePie>
                <ReTooltip />
                <ReLegend />
              </RePieChart>
            </ReResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CRMMasterControl;
