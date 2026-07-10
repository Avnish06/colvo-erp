import React, { useState, useEffect } from 'react';
import { Users, Building2, ChevronDown, ChevronRight, Search, X, UserCircle, Briefcase, Phone, Mail } from 'lucide-react';
import axios from '../axiosConfig';

const DEPT_COLORS = [
  { bg: 'bg-blue-500', light: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
  { bg: 'bg-purple-500', light: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
  { bg: 'bg-emerald-500', light: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
  { bg: 'bg-orange-500', light: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700' },
  { bg: 'bg-pink-500', light: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  { bg: 'bg-indigo-500', light: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
  { bg: 'bg-teal-500', light: 'bg-teal-50', border: 'border-teal-200', text: 'text-teal-700' },
];

function EmployeeCard({ emp, color, onClick }) {
  const initials = (emp.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
  return (
    <button
      onClick={() => onClick(emp)}
      className={`group flex flex-col items-center p-4 rounded-2xl border ${color.border} ${color.light} hover:shadow-lg transition-all duration-200 text-center min-w-[120px]`}
    >
      <div className={`w-12 h-12 ${color.bg} rounded-full flex items-center justify-center text-white text-sm font-bold mb-2 shadow-md group-hover:scale-110 transition-transform`}>
        {initials}
      </div>
      <p className="text-xs font-semibold text-gray-800 leading-tight">{emp.name}</p>
      <p className={`text-xs mt-0.5 ${color.text} font-medium truncate max-w-[100px]`}>{emp.designation || emp.role || 'Staff'}</p>
    </button>
  );
}

function DepartmentNode({ dept, employees, color, onEmpClick, expanded, onToggle }) {
  const deptEmps = employees.filter(e => e.department_id === dept.id || e.department === dept.name);
  return (
    <div className={`rounded-2xl border ${color.border} overflow-hidden shadow-sm hover:shadow-md transition-shadow`}>
      <button
        onClick={onToggle}
        className={`w-full flex items-center gap-3 px-5 py-4 ${color.light} hover:brightness-95 transition-all`}
      >
        <div className={`p-2.5 ${color.bg} rounded-xl shadow-sm`}>
          <Building2 size={16} className="text-white" />
        </div>
        <div className="flex-1 text-left">
          <h3 className={`font-bold ${color.text}`}>{dept.name}</h3>
          <p className="text-xs text-gray-500">{deptEmps.length} member{deptEmps.length !== 1 ? 's' : ''}</p>
        </div>
        <div className={`${color.text} transition-transform duration-200 ${expanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={18} />
        </div>
      </button>
      {expanded && (
        <div className="p-4 bg-white">
          {deptEmps.length === 0 ? (
            <p className="text-center text-gray-400 text-sm py-4">No employees in this department</p>
          ) : (
            <div className="flex flex-wrap gap-3">
              {deptEmps.map(emp => (
                <EmployeeCard key={emp.id || emp.user_id} emp={emp} color={color} onClick={onEmpClick} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function OrgChart() {
  const [departments, setDepartments] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [expandedDepts, setExpandedDepts] = useState({});
  const [selectedEmp, setSelectedEmp] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [dRes, eRes] = await Promise.all([
          axios.get('/api/departments'),
          axios.get('/api/employees')
        ]);
        const depts = dRes.data.departments || dRes.data.data || dRes.data || [];
        const emps = eRes.data.employees || eRes.data.data || eRes.data || [];
        setDepartments(Array.isArray(depts) ? depts : []);
        setEmployees(Array.isArray(emps) ? emps : []);
        // Expand all by default
        const expanded = {};
        (Array.isArray(depts) ? depts : []).forEach(d => { expanded[d.id] = true; });
        setExpandedDepts(expanded);
      } catch (e) {
        console.error('OrgChart fetch error:', e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const toggleDept = (id) => {
    setExpandedDepts(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const filteredEmployees = search.trim()
    ? employees.filter(e =>
        (e.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.designation || '').toLowerCase().includes(search.toLowerCase()) ||
        (e.department || '').toLowerCase().includes(search.toLowerCase())
      )
    : employees;

  const filteredDepts = search.trim()
    ? departments.filter(d =>
        filteredEmployees.some(e => e.department_id === d.id || e.department === d.name) ||
        (d.name || '').toLowerCase().includes(search.toLowerCase())
      )
    : departments;

  // Stats
  const totalEmp = employees.length;
  const totalDepts = departments.length;

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-violet-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} className="p-3 rounded-2xl shadow-lg">
            <Users size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Dynamic Org Chart</h1>
            <p className="text-gray-500 text-sm">Visual hierarchy of your organization's departments and employees</p>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Employees', value: totalEmp, color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Departments', value: totalDepts, color: 'text-purple-600', bg: 'bg-purple-50' },
          { label: 'Avg per Dept', value: totalDepts > 0 ? Math.round(totalEmp / totalDepts) : 0, color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Unassigned', value: employees.filter(e => !e.department_id && !e.department).length, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map((s, i) => (
          <div key={i} className={`${s.bg} rounded-2xl p-4 border border-white shadow-sm`}>
            <p className="text-xs text-gray-500 font-medium">{s.label}</p>
            <p className={`text-2xl font-bold ${s.color} mt-1`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="mb-6 relative max-w-md">
        <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search employees, departments..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-3 rounded-2xl border border-gray-100 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-300 text-sm"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
            <X size={16} />
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-3" />
            <p className="text-gray-500 text-sm">Loading org chart...</p>
          </div>
        </div>
      ) : (
        <>
          {/* Org Chart */}
          <div className="space-y-4">
            {/* Company Root */}
            <div className="flex justify-center mb-2">
              <div style={{ background: 'linear-gradient(135deg, #1e1b4b, #312e81)' }} className="px-8 py-4 rounded-2xl text-white shadow-xl flex items-center gap-3">
                <Building2 size={22} />
                <div>
                  <p className="font-bold text-lg">Organization</p>
                  <p className="text-indigo-200 text-xs">{totalEmp} Employees · {totalDepts} Departments</p>
                </div>
              </div>
            </div>

            {/* Departments */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredDepts.map((dept, i) => (
                <DepartmentNode
                  key={dept.id}
                  dept={dept}
                  employees={filteredEmployees}
                  color={DEPT_COLORS[i % DEPT_COLORS.length]}
                  onEmpClick={setSelectedEmp}
                  expanded={!!expandedDepts[dept.id]}
                  onToggle={() => toggleDept(dept.id)}
                />
              ))}
            </div>

            {/* Unassigned employees */}
            {(() => {
              const unassigned = filteredEmployees.filter(e => !e.department_id && !e.department);
              if (unassigned.length === 0) return null;
              return (
                <div className="rounded-2xl border border-gray-200 overflow-hidden shadow-sm mt-4">
                  <div className="flex items-center gap-3 px-5 py-4 bg-gray-50">
                    <div className="p-2.5 bg-gray-400 rounded-xl"><Users size={16} className="text-white" /></div>
                    <div>
                      <h3 className="font-bold text-gray-700">Unassigned</h3>
                      <p className="text-xs text-gray-500">{unassigned.length} members without a department</p>
                    </div>
                  </div>
                  <div className="p-4 bg-white flex flex-wrap gap-3">
                    {unassigned.map(emp => (
                      <EmployeeCard key={emp.id || emp.user_id} emp={emp} color={DEPT_COLORS[6]} onClick={setSelectedEmp} />
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        </>
      )}

      {/* Employee Detail Modal */}
      {selectedEmp && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setSelectedEmp(null)}>
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-sm w-full" onClick={e => e.stopPropagation()}>
            <div className="flex items-start justify-between mb-6">
              <div className="flex items-center gap-4">
                <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} className="w-16 h-16 rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg">
                  {(selectedEmp.name || 'U').split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-bold text-gray-900 text-lg">{selectedEmp.name}</h3>
                  <p className="text-indigo-600 text-sm font-medium">{selectedEmp.designation || selectedEmp.role || 'Staff'}</p>
                </div>
              </div>
              <button onClick={() => setSelectedEmp(null)} className="p-2 hover:bg-gray-100 rounded-xl transition-colors">
                <X size={18} className="text-gray-500" />
              </button>
            </div>
            <div className="space-y-3">
              {selectedEmp.employee_id && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <UserCircle size={16} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Employee ID</p>
                    <p className="text-sm font-semibold text-gray-800">{selectedEmp.employee_id}</p>
                  </div>
                </div>
              )}
              {selectedEmp.department && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Building2 size={16} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Department</p>
                    <p className="text-sm font-semibold text-gray-800">{selectedEmp.department}</p>
                  </div>
                </div>
              )}
              {selectedEmp.email && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Mail size={16} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-semibold text-gray-800">{selectedEmp.email}</p>
                  </div>
                </div>
              )}
              {selectedEmp.status && (
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                  <Briefcase size={16} className="text-gray-400" />
                  <div>
                    <p className="text-xs text-gray-400">Status</p>
                    <span className={`text-xs font-bold px-2 py-1 rounded-full ${selectedEmp.status === 'Active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{selectedEmp.status}</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
