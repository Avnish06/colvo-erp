import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { X, Save, ListTodo } from 'lucide-react';
import { toast } from 'react-toastify';

const TaskModal = ({ isOpen, onClose, onSave, task = null }) => {
  const [employees, setEmployees] = useState([]);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    project_id: '',
    assigned_to: '',
    title: '',
    description: '',
    deadline: '',
    status: 'Pending'
  });

  useEffect(() => {
    if (isOpen) {
      fetchDropdownData();
      if (task) {
        setFormData({
          project_id: task.project_id,
          assigned_to: task.assigned_to,
          title: task.title,
          description: task.description,
          deadline: task.deadline ? task.deadline.split('T')[0] : '',
          status: task.status
        });
      } else {
        setFormData({
          project_id: '',
          assigned_to: '',
          title: '',
          description: '',
          deadline: '',
          status: 'Pending'
        });
      }
    }
  }, [isOpen, task]);

  const fetchDropdownData = async () => {
    try {
      const [empRes, projRes] = await Promise.all([
        axios.get('/api/employees/list'),
        axios.get('/api/projects'),
      ]);
      if (empRes.data.success) setEmployees(empRes.data.data);
      if (projRes.data.success) setProjects(projRes.data.data);
    } catch (err) {
      console.error('Error fetching dropdown data:', err);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (task) {
        await axios.put(`/api/projects/tasks/${task.id}`, formData);
        toast.success('Task updated successfully');
      } else {
        await axios.post('/api/projects/tasks', formData);
        toast.success('Task assigned successfully');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving task');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <ListTodo className="text-indigo-600" /> {task ? 'Edit Task' : 'Assign New Task'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Project Dropdown — dynamic from existing projects */}
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Project</label>
            <select
              name="project_id"
              value={formData.project_id}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
              disabled={!!task}
            >
              <option value="">— Select an existing project —</option>
              {projects.map(proj => (
                <option key={proj.id} value={proj.id}>{proj.name}</option>
              ))}
            </select>
            {projects.length === 0 && (
              <p className="text-xs text-amber-600 mt-1">No projects found. Please create a project first.</p>
            )}
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Task Title</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Frontend Design"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700">Description</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows="2"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Assign To Dropdown — dynamic employees */}
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Assign To</label>
              <select
                name="assigned_to"
                value={formData.assigned_to}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Employee</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>{emp.name}</option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Deadline</label>
              <input
                type="date"
                name="deadline"
                value={formData.deadline}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          {task && (
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="Pending">Pending</option>
                <option value="In Progress">In Progress</option>
                <option value="Done">Done</option>
                <option value="Completed">Completed</option>
              </select>
            </div>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 font-bold hover:bg-gray-100 rounded-xl transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 shadow-lg shadow-blue-200 flex items-center gap-2"
            >
              <Save size={18} /> {task ? 'Update' : 'Assign'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
