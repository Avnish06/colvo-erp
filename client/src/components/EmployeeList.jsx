import React, { useEffect, useState } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { Plus, Edit, Trash2, Search } from 'lucide-react';
import EmployeeModal from './EmployeeModal';
import ConfirmModal from './ConfirmModal';

const EmployeeList = ({ initialTab, roleFilter }) => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);

  useEffect(() => {
    fetchEmployees();
    if (initialTab === 'add') {
      handleAddClick();
    }
  }, [initialTab]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      if (res.data.success) {
        setEmployees(res.data.data);
      }
    } catch (err) {
      toast.error('Error fetching employees');
    } finally {
      setLoading(false);
    }
  };

  const handleAddClick = () => {
    setSelectedEmployee(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (emp) => {
    setSelectedEmployee(emp);
    setIsModalOpen(true);
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const showDeleteConfirm = (id) => {
    setPendingDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDelete = async () => {
    if (!pendingDeleteId) return;
    try {
      const res = await axios.delete(`/api/employees/${pendingDeleteId}`);
      if (res.data.success) {
        toast.success('Employee deleted');
        fetchEmployees();
      }
    } catch (err) {
      toast.error('Error deleting employee');
    } finally {
      setShowConfirm(false);
      setPendingDeleteId(null);
    }
  };

  const cancelDelete = () => {
    setShowConfirm(false);
    setPendingDeleteId(null);
  };

  const filteredEmployees = employees.filter(emp => {
    const name = (emp.name || '').toString();
    const email = (emp.email || '').toString();
    const term = (searchTerm || '').toLowerCase();
    const matchesSearch = name.toLowerCase().includes(term) || email.toLowerCase().includes(term);

    if (!roleFilter) return matchesSearch;

    if (Array.isArray(roleFilter)) {
      return matchesSearch && roleFilter.includes(emp.role);
    }
    return matchesSearch && emp.role === roleFilter;
  });

  const getTitle = () => {
    if (Array.isArray(roleFilter)) return 'Employee Directory';
    if (roleFilter === 'Admin') return 'Administrator Directory';
    if (roleFilter === 'Super Admin') return 'Super Admin Directory';
    return 'User Directory';
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="p-6 border-b border-gray-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h3 className="text-xl font-bold text-gray-900">{getTitle()}</h3>
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Search employees..."
              className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleAddClick}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-semibold flex items-center gap-2 hover:bg-blue-700 transition-colors"
          >
            <Plus size={18} /> Add Employee
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Name</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Department</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Role</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
              <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {loading ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">Loading employees...</td></tr>
            ) : filteredEmployees.length === 0 ? (
              <tr><td colSpan="5" className="px-6 py-8 text-center text-gray-500">No employees found.</td></tr>
            ) : filteredEmployees.map((emp) => (
              <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                <td className="px-6 py-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                      {((emp.name || emp.email) || '').toString().split(' ').map(n => n[0]).join('')}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{emp.name || 'Unknown'}</p>
                      <p className="text-xs text-gray-500">{emp.email || '—'}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 text-sm text-gray-600">{emp.department || 'N/A'}</td>
                <td className="px-6 py-4 text-sm text-gray-600">{emp.role}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${emp.status === 'Active' ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                    }`}>
                    {emp.status}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <div className="flex flex-wrap items-center justify-end gap-2">
                    <button
                      onClick={() => handleEditClick(emp)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      <Edit size={16} />
                    </button>
                    <button
                      onClick={() => showDeleteConfirm(emp.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <EmployeeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchEmployees}
        employee={selectedEmployee}
      />
      <ConfirmModal
        isOpen={showConfirm}
        title="Delete Employee"
        message="Are you sure you want to delete this employee?"
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
        confirmText="Delete"
        cancelText="Cancel"
      />
    </div>
  );
};

export default EmployeeList;
