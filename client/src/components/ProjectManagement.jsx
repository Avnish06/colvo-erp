import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import {
  Plus, Edit, Trash2, Clock, CheckCircle2, AlertCircle, X, Save,
  Briefcase, ListTodo, Users, Search, Send, Image, FileText, Eye,
  ArrowLeftRight, UserCheck
} from 'lucide-react';

const STATUS_COLORS = {
  'Pending': 'bg-amber-100 text-amber-700',
  'Todo': 'bg-amber-100 text-amber-700',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Done': 'bg-green-100 text-green-700',
  'Completed': 'bg-green-100 text-green-700',
  'On Hold': 'bg-gray-100 text-gray-600',
};

// ── Report Submission Modal ────────────────────────────────────────────────────
const ReportModal = ({ isOpen, onClose, task }) => {
  const [content, setContent] = useState('');
  const [screenshots, setScreenshots] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isOpen) { setContent(''); setScreenshots([]); setPreviews([]); }
  }, [isOpen]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setScreenshots(prev => [...prev, ...files]);
    const newPreviews = files.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...newPreviews]);
  };

  const removeScreenshot = (idx) => {
    setScreenshots(prev => prev.filter((_, i) => i !== idx));
    setPreviews(prev => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!content.trim()) return toast.error('Please write your report content');
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('task_id', task.source_id);
      formData.append('content', content);
      screenshots.forEach(file => formData.append('screenshots', file));

      await axios.post('/api/task-reports', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      toast.success('Report submitted successfully!');
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error submitting report');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen || !task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Send size={20} className="text-blue-600" /> Submit Work Report
            </h3>
            <p className="text-sm text-gray-500 mt-0.5">Task: <span className="font-semibold text-indigo-600">{task.title}</span></p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 p-1"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <FileText size={14} className="text-blue-500" /> Work Day Report
            </label>
            <textarea
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              required
              placeholder="Describe your work progress for today, what you accomplished, any blockers, and next steps..."
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <Image size={14} className="text-blue-500" /> Screenshots <span className="text-gray-400 font-normal">(optional)</span>
            </label>
            <label className="flex items-center gap-2 px-4 py-3 bg-blue-50 border-2 border-dashed border-blue-200 rounded-xl cursor-pointer hover:bg-blue-100 transition-colors">
              <Image size={16} className="text-blue-500" />
              <span className="text-sm font-medium text-blue-600">Click to attach screenshots</span>
              <input type="file" accept="image/*" multiple className="hidden" onChange={handleFileChange} />
            </label>
            {previews.length > 0 && (
              <div className="grid grid-cols-3 gap-3 mt-2">
                {previews.map((src, i) => (
                  <div key={i} className="relative group">
                    <img src={src} alt={`screenshot-${i}`} className="w-full h-24 object-cover rounded-lg border border-gray-200" />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(i)}
                      className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-6 py-2.5 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
            <button
              type="submit"
              disabled={submitting}
              className="px-6 py-2.5 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2 disabled:opacity-60"
            >
              <Send size={16} /> {submitting ? 'Submitting...' : 'Send Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Admin Reports Viewer Modal ────────────────────────────────────────────────
const ReportsViewerModal = ({ isOpen, onClose }) => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedReport, setSelectedReport] = useState(null);

  useEffect(() => {
    if (!isOpen) return;
    const fetchReports = async () => {
      setLoading(true);
      try {
        const res = await axios.get('/api/task-reports');
        if (res.data.success) setReports(res.data.data);
      } catch (err) {
        toast.error('Error fetching reports');
      } finally {
        setLoading(false);
      }
    };
    fetchReports();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <FileText size={20} className="text-blue-600" /> Employee Task Reports
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <div className="overflow-y-auto flex-1 p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-400">Loading reports...</div>
          ) : reports.length === 0 ? (
            <div className="text-center py-12 text-gray-400">No reports submitted yet.</div>
          ) : (
            <div className="space-y-4">
              {reports.map(report => (
                <div key={report.id} className="bg-gray-50 rounded-2xl p-5 border border-gray-100">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-gray-900">{report.employee_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        Task: <span className="text-indigo-600 font-semibold">{report.task_title || '—'}</span>
                        {report.project_name && <> · Project: <span className="text-purple-600 font-semibold">{report.project_name}</span></>}
                      </p>
                    </div>
                    <span className="text-xs text-gray-400">{new Date(report.created_at).toLocaleString()}</span>
                  </div>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap bg-white rounded-xl p-4 border border-gray-100">{report.content}</p>
                  {report.screenshots && (() => {
                    try {
                      const imgs = JSON.parse(report.screenshots);
                      if (imgs.length > 0) return (
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {imgs.map((src, i) => (
                            <a key={i} href={`${axios.defaults.baseURL}${src}`} target="_blank" rel="noreferrer">
                              <img src={`${axios.defaults.baseURL}${src}`} alt={`ss-${i}`} className="w-full h-20 object-cover rounded-lg border border-gray-200 hover:opacity-80 transition-opacity" />
                            </a>
                          ))}
                        </div>
                      );
                    } catch { return null; }
                  })()}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

// ── Unified Add/Edit Modal ────────────────────────────────────────────────────
const ItemModal = ({ isOpen, onClose, onSave, item, projects, employees, defaultType = 'task', assignMode = false }) => {
  const [type, setType] = useState(defaultType);
  const [form, setForm] = useState({
    title: '', description: '', deadline: '', status: 'Pending',
    project_id: '', assigned_to: ''
  });

  useEffect(() => {
    if (!isOpen) return;
    if (item) {
      setType(item.type);
      setForm({
        title: item.title || '',
        description: item.description || '',
        deadline: item.deadline ? item.deadline.split('T')[0] : '',
        status: item.status || 'Pending',
        project_id: item.project_id || '',
        assigned_to: item.assigned_to || '',
      });
    } else {
      setType(defaultType);
      setForm({ title: '', description: '', deadline: '', status: 'Pending', project_id: '', assigned_to: '' });
    }
  }, [isOpen, item, defaultType]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    try {
      if (item) {
        if (item.type === 'project') {
          await axios.put(`/api/projects/${item.source_id}`, {
            name: form.title, description: form.description, deadline: form.deadline, status: form.status, assigned_to: form.assigned_to
          });
        } else {
          await axios.put(`/api/projects/tasks/${item.source_id}`, {
            title: form.title, description: form.description, deadline: form.deadline,
            status: form.status, assigned_to: form.assigned_to
          });
        }
        toast.success('Updated successfully');
      } else {
        if (type === 'project') {
          await axios.post('/api/projects', {
            name: form.title, description: form.description, deadline: form.deadline, assigned_to: form.assigned_to
          });
        } else {
          await axios.post('/api/projects/tasks', {
            title: form.title, description: form.description, deadline: form.deadline,
            project_id: form.project_id, assigned_to: form.assigned_to
          });
        }
        toast.success('Created successfully');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving');
    }
  };

  if (!isOpen) return null;
  const isProject = item ? item.type === 'project' : type === 'project';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            {isProject ? <Briefcase className="text-purple-600" size={20} /> : <ListTodo className="text-indigo-600" size={20} />}
            {item ? `Edit ${item.type === 'project' ? 'Project' : 'Task'}` : 'Add New Item'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={24} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {!item && !assignMode && (
            <div className="flex flex-wrap gap-3">
              <button type="button" onClick={() => setType('task')}
                className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${type === 'task' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                <ListTodo size={14} className="inline mr-1" /> Task
              </button>
              <button type="button" onClick={() => setType('project')}
                className={`flex-1 py-2 rounded-xl font-bold text-sm transition-all ${type === 'project' ? 'bg-purple-600 text-white shadow-lg shadow-purple-200' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                <Briefcase size={14} className="inline mr-1" /> Project
              </button>
            </div>
          )}
          {!item && assignMode && (
            <div className="flex flex-wrap items-center gap-2 p-3 bg-indigo-50 rounded-xl border border-indigo-100">
              <ListTodo size={16} className="text-indigo-600" />
              <span className="text-sm font-bold text-indigo-700">Assigning Task to Employee</span>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">{isProject ? 'Project Name' : 'Task Title'}</label>
            <input type="text" name="title" value={form.title} onChange={handleChange} required
              placeholder={isProject ? 'e.g. Website Redesign' : 'e.g. Design Homepage'}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="space-y-1">
            <label className="text-sm font-bold text-gray-700">Description</label>
            <textarea name="description" value={form.description} onChange={handleChange} rows="2"
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Deadline</label>
              <input type="date" name="deadline" value={form.deadline} onChange={handleChange} required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-bold text-gray-700">Status</label>
              <select name="status" value={form.status} onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Pending</option>
                <option>In Progress</option>
                <option>Done</option>
                {isProject && <option>Completed</option>}
                {isProject && <option>On Hold</option>}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {!isProject && (
              <div className="space-y-1">
                <label className="text-sm font-bold text-gray-700">Project</label>
                <select name="project_id" value={form.project_id} onChange={handleChange} required={!item} disabled={!!item}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Project</option>
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
            )}
            <div className={`space-y-1 ${isProject ? 'col-span-2' : ''}`}>
              <label className="text-sm font-bold text-gray-700">Assign To</label>
              <select name="assigned_to" value={form.assigned_to} onChange={handleChange} required
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Employee</option>
                {employees.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
              </select>
            </div>
          </div>

          <div className="flex flex-wrap justify-end gap-3 pt-2 border-t border-gray-100">
            <button type="button" onClick={onClose} className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors">Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2">
              <Save size={16} /> {item ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ── Main Component ────────────────────────────────────────────────────────────
const ProjectManagement = ({ initialTab = 'overview' }) => {
  const [items, setItems] = useState([]);
  const [projects, setProjects] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalType, setModalType] = useState('task');
  const [isAssignMode, setIsAssignMode] = useState(false);
  const [selected, setSelected] = useState(null);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterMonth, setFilterMonth] = useState('all');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportTask, setReportTask] = useState(null);
  const [reportsViewerOpen, setReportsViewerOpen] = useState(false);

  // Switch Employee State
  const [switchModalOpen, setSwitchModalOpen] = useState(false);
  const [switchItem, setSwitchItem] = useState(null);
  const [switchForm, setSwitchForm] = useState({ new_assignee: '', reason: '' });
  const [switching, setSwitching] = useState(false);

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user.role === 'Admin' || user.role === 'Super Admin' || user.role === 'Developer';

  useEffect(() => {
    fetchAll();
    if (initialTab === 'create') { setModalType('project'); setIsAssignMode(false); setSelected(null); setModalOpen(true); }
    if (initialTab === 'assign') { setModalType('task'); setIsAssignMode(true); setSelected(null); setModalOpen(true); }
  }, [initialTab]);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [allRes, projRes] = await Promise.all([
        axios.get('/api/projects/all'),
        axios.get('/api/projects'),
      ]);
      if (allRes.data.success) {
        let data = allRes.data.data;
        if (!isAdmin) {
          // Get tasks assigned to this employee
          const myTasks = data.filter(item => item.type === 'task' && item.assigned_to === user.id);
          // Get project names that contain those tasks
          const myProjectNames = new Set(myTasks.map(t => t.project_name).filter(Boolean));
          // Include assigned tasks + projects that have tasks assigned to them
          data = data.filter(item =>
            (item.type === 'task' && item.assigned_to === user.id) ||
            (item.type === 'project' && myProjectNames.has(item.title))
          );
        }
        setItems(data);
      }
      if (projRes.data.success) setProjects(projRes.data.data);
    } catch (err) {
      toast.error('Error loading data');
    }
    // Fetch employee list separately (only needed for admin modal, non-blocking)
    if (isAdmin) {
      try {
        const empRes = await axios.get('/api/employees/list');
        if (empRes.data.success) setEmployees(empRes.data.data);
      } catch (err) {
        console.warn('Could not fetch employee list:', err.message);
      }
    }
    setLoading(false);
  };

  const handleDelete = async (item) => {
    const label = item.type === 'project' ? 'project (and all its tasks)' : 'task';
    if (!window.confirm(`Delete this ${label}?`)) return;
    try {
      if (item.type === 'project') await axios.delete(`/api/projects/${item.source_id}`);
      else await axios.delete(`/api/projects/tasks/${item.source_id}`);
      toast.success('Deleted successfully');
      fetchAll();
    } catch (err) {
      toast.error('Error deleting');
    }
  };

  const openSwitchModal = (item) => {
    setSwitchItem(item);
    setSwitchForm({ new_assignee: '', reason: '' });
    setSwitchModalOpen(true);
  };

  const handleSwitchEmployee = async (e) => {
    e.preventDefault();
    if (!switchForm.new_assignee) return toast.error('Please select a new employee');
    if (!switchForm.reason.trim()) return toast.error('Please provide a reason for the switch');
    setSwitching(true);
    try {
      const newEmp = employees.find(emp => String(emp.id) === String(switchForm.new_assignee));
      const auditNote = `\n\n[Reassigned from ${switchItem.assigned_name || 'previous assignee'} to ${newEmp?.name || 'new assignee'} — Reason: ${switchForm.reason}]`;
      if (switchItem.type === 'task') {
        await axios.put(`/api/projects/tasks/${switchItem.source_id}`, {
          title: switchItem.title,
          description: (switchItem.description || '') + auditNote,
          deadline: switchItem.deadline,
          status: switchItem.status,
          assigned_to: switchForm.new_assignee,
        });
      } else {
        await axios.put(`/api/projects/${switchItem.source_id}`, {
          name: switchItem.title,
          description: (switchItem.description || '') + auditNote,
          deadline: switchItem.deadline,
          status: switchItem.status,
          assigned_to: switchForm.new_assignee,
        });
      }
      toast.success(`Switched to ${newEmp?.name || 'new employee'} successfully!`);
      setSwitchModalOpen(false);
      fetchAll();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to switch employee');
    } finally {
      setSwitching(false);
    }
  };

  const handleStatusChange = async (item, newStatus) => {
    try {
      if (item.type === 'project') {
        await axios.put(`/api/projects/${item.source_id}`, {
          name: item.title, description: item.description, deadline: item.deadline, status: newStatus, assigned_to: item.assigned_to
        });
      } else {
        await axios.put(`/api/projects/tasks/${item.source_id}`, {
          title: item.title, description: item.description, deadline: item.deadline,
          status: newStatus, assigned_to: item.assigned_to
        });
      }
      fetchAll();
    } catch (err) {
      toast.error('Error updating status');
    }
  };

  const filtered = items.filter(item => {
    const matchSearch = item.title?.toLowerCase().includes(search.toLowerCase()) ||
      item.description?.toLowerCase().includes(search.toLowerCase()) ||
      item.assigned_name?.toLowerCase().includes(search.toLowerCase()) ||
      item.project_name?.toLowerCase().includes(search.toLowerCase());
    const matchType = filterType === 'all' || item.type === filterType;

    let matchMonth = true;
    if (filterMonth !== 'all' && item.created_at) {
      const date = new Date(item.created_at);
      const monthName = date.toLocaleString('default', { month: 'long' });
      matchMonth = monthName === filterMonth;
    }

    return matchSearch && matchType && matchMonth;
  });

  const pendingTasksCount = items.filter(i => i.type === 'task' && i.status !== 'Done' && i.status !== 'Completed').length;
  const pendingProjectsCount = new Set(
    items.filter(i => i.type === 'task' && i.status !== 'Done' && i.status !== 'Completed')
      .map(t => t.project_name)
      .filter(Boolean)
  ).size;
  const doneTasks = items.filter(i => i.status === 'Done' || i.status === 'Completed').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">Project Management</h3>
          <p className="text-gray-500 text-sm mt-1">All projects and tasks in one place</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          {isAdmin && (
            <button
              onClick={() => setReportsViewerOpen(true)}
              className="bg-indigo-50 text-indigo-600 px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-indigo-100 transition-all border border-indigo-100"
            >
              <Eye size={16} /> View Reports
            </button>
          )}
          {isAdmin && (
            <button onClick={() => { setSelected(null); setIsAssignMode(false); setModalOpen(true); }}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200">
              <Plus size={18} /> Add New
            </button>
          )}
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Ongoing Projects', value: pendingProjectsCount, color: 'text-purple-600', bg: 'bg-purple-50', icon: <Briefcase size={18} /> },
          { label: 'Pending Tasks', value: pendingTasksCount, color: 'text-indigo-600', bg: 'bg-indigo-50', icon: <ListTodo size={18} /> },
          { label: 'Completed', value: doneTasks, color: 'text-green-600', bg: 'bg-green-50', icon: <CheckCircle2 size={18} /> },
        ].map(s => (
          <div key={s.label} className={`${s.bg} rounded-2xl p-4 flex items-center gap-3`}>
            <span className={s.color}>{s.icon}</span>
            <div>
              <p className="text-2xl font-bold text-gray-900">{s.value}</p>
              <p className="text-xs font-semibold text-gray-500">{s.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text" placeholder="Search title, description, assignee..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select value={filterType} onChange={e => setFilterType(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Types</option>
          <option value="project">Projects</option>
          <option value="task">Tasks</option>
        </select>
        <select value={filterMonth} onChange={e => setFilterMonth(e.target.value)}
          className="px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500">
          <option value="all">All Months</option>
          {["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"].map(m => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
      </div>

      {/* Unified Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-100">
            <tr>
              {/* DATE column replaces TYPE */}
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Date</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Title / Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Project</th>
              {/* ASSIGNED TO column only for admins */}
              {isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Assigned To</th>}
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Deadline</th>
              {/* STATUS column only for admins */}
              {isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>}
              {/* REPORT column only for employees */}
              {!isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Report</th>}
              {isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {loading ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">Loading...</td></tr>
            ) : filtered.length === 0 ? (
              <tr><td colSpan={8} className="px-6 py-12 text-center text-gray-400">No items found.</td></tr>
            ) : filtered.map(item => {
              const isOverdue = item.deadline && new Date(item.deadline) < new Date() &&
                item.status !== 'Done' && item.status !== 'Completed';
              return (
                <tr key={item.uid} className="hover:bg-gray-50 transition-colors group">
                  {/* Date assigned (created_at) */}
                  <td className="px-6 py-4">
                    <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-lg">
                      {item.created_at ? new Date(item.created_at).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  {/* Title */}
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-gray-900">{item.title}</p>
                    {item.description && <p className="text-xs text-gray-400 truncate max-w-[180px]">{item.description}</p>}
                  </td>
                  {/* Project */}
                  <td className="px-6 py-4">
                    {item.project_name
                      ? <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-lg">{item.project_name}</span>
                      : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  {/* Assigned To (admin only) */}
                  {isAdmin && (
                    <td className="px-6 py-4">
                      {item.assigned_name ? (
                        <div className="flex flex-wrap items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold">
                            {item.assigned_name.split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm text-gray-600 font-medium">{item.assigned_name}</span>
                        </div>
                      ) : <span className="text-gray-300 text-xs">—</span>}
                    </td>
                  )}
                  {/* Deadline */}
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold flex items-center gap-1 ${isOverdue ? 'text-red-500' : 'text-gray-600'}`}>
                      {isOverdue && <AlertCircle size={12} />}
                      <Clock size={12} className="text-gray-300" />
                      {item.deadline ? new Date(item.deadline).toLocaleDateString() : '—'}
                    </span>
                  </td>
                  {/* Status (admin only) */}
                  {isAdmin && (
                    <td className="px-6 py-4">
                      {isAdmin || (item.type === 'task' && item.assigned_to === user.id) ? (
                        <select
                          value={item.status}
                          onChange={e => handleStatusChange(item, e.target.value)}
                          className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full border border-transparent outline-none cursor-pointer hover:border-gray-300 transition-colors ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}
                        >
                          <option value="Pending">Pending</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Done">Done</option>
                          {item.type === 'project' && (
                            <>
                              <option value="Completed">Completed</option>
                              <option value="On Hold">On Hold</option>
                            </>
                          )}
                        </select>
                      ) : (
                        <span className={`text-[10px] font-bold uppercase px-2 py-1 rounded-full ${STATUS_COLORS[item.status] || 'bg-gray-100 text-gray-600'}`}>
                          {item.status}
                        </span>
                      )}
                    </td>
                  )}
                  {/* Report button (employee only) */}
                  {!isAdmin && (
                    <td className="px-6 py-4">
                      <button
                        onClick={() => { setReportTask(item); setReportModalOpen(true); }}
                        className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-all shadow-sm shadow-blue-200"
                      >
                        <Send size={12} /> Send
                      </button>
                    </td>
                  )}
                  {/* Admin Actions */}
                  {isAdmin && (
                    <td className="px-6 py-4 text-right">
                      <div className="flex flex-wrap justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.type === 'task' && (
                          <button
                            onClick={() => openSwitchModal(item)}
                            title="Switch Assigned Employee"
                            className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-bold bg-orange-50 text-orange-600 hover:bg-orange-500 hover:text-white rounded-lg transition-all shadow-sm"
                          >
                            <ArrowLeftRight size={12} /> Switch
                          </button>
                        )}
                        <button onClick={() => { setSelected(item); setIsAssignMode(false); setModalOpen(true); }}
                          className="text-gray-400 hover:text-blue-600 transition-colors"><Edit size={16} /></button>
                        <button onClick={() => handleDelete(item)}
                          className="text-gray-400 hover:text-red-600 transition-colors"><Trash2 size={16} /></button>
                      </div>
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <ItemModal
        isOpen={modalOpen}
        onClose={() => { setModalOpen(false); setSelected(null); }}
        onSave={fetchAll}
        item={selected}
        projects={projects}
        employees={employees}
        defaultType={modalType}
        assignMode={isAssignMode}
      />

      <ReportModal
        isOpen={reportModalOpen}
        onClose={() => { setReportModalOpen(false); setReportTask(null); }}
        task={reportTask}
      />

      <ReportsViewerModal
        isOpen={reportsViewerOpen}
        onClose={() => setReportsViewerOpen(false)}
      />

      {/* Switch Employee Modal */}
      {switchModalOpen && switchItem && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-300">
            {/* Header */}
            <div className="px-7 py-6 border-b border-gray-100 bg-gradient-to-r from-orange-50 to-amber-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-500 rounded-xl flex items-center justify-center shadow-md">
                  <ArrowLeftRight size={18} className="text-white" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900">Switch Employee</h3>
                  <p className="text-xs text-gray-500 truncate max-w-[200px]">{switchItem.title}</p>
                </div>
              </div>
              <button onClick={() => setSwitchModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X size={22} />
              </button>
            </div>

            <form onSubmit={handleSwitchEmployee} className="p-7 space-y-5">
              {/* Current Assignee */}
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                <div className="w-9 h-9 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-sm font-bold">
                  {(switchItem.assigned_name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2)}
                </div>
                <div>
                  <p className="text-xs text-gray-400 font-medium">Currently Assigned To</p>
                  <p className="text-sm font-bold text-gray-800">{switchItem.assigned_name || 'Unassigned'}</p>
                </div>
                <ArrowLeftRight size={16} className="ml-auto text-orange-400" />
              </div>

              {/* New Assignee */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <UserCheck size={12} className="text-orange-500" /> New Employee
                </label>
                <select
                  required
                  value={switchForm.new_assignee}
                  onChange={e => setSwitchForm({ ...switchForm, new_assignee: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 font-semibold text-gray-700 text-sm transition-all"
                >
                  <option value="">Select new employee...</option>
                  {employees
                    .filter(emp => String(emp.id) !== String(switchItem.assigned_to))
                    .map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} — {emp.role || emp.designation || 'Staff'}</option>
                    ))
                  }
                </select>
              </div>

              {/* Reason */}
              <div className="space-y-1.5">
                <label className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <FileText size={12} className="text-orange-500" /> Reason for Switch <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="e.g. Employee is on leave / Workload rebalancing / Skill mismatch..."
                  value={switchForm.reason}
                  onChange={e => setSwitchForm({ ...switchForm, reason: e.target.value })}
                  className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 text-sm text-gray-700 resize-none transition-all"
                />
                <p className="text-xs text-gray-400">This reason will be saved as an audit note on the task.</p>
              </div>

              {/* Actions */}
              <div className="flex flex-wrap justify-end gap-3 pt-1 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSwitchModalOpen(false)}
                  className="px-5 py-2.5 text-gray-500 font-bold text-sm hover:bg-gray-100 rounded-xl transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={switching}
                  className="px-7 py-2.5 bg-orange-500 text-white font-bold text-sm rounded-xl shadow-lg shadow-orange-100 hover:bg-orange-600 hover:scale-[1.02] transition-all active:scale-95 disabled:opacity-60 flex items-center gap-2"
                >
                  {switching ? (
                    <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Switching...</>
                  ) : (
                    <><ArrowLeftRight size={15} />Confirm Switch</>
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

export default ProjectManagement;
