import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { X, Save, DollarSign, Calculator } from 'lucide-react';
import { toast } from 'react-toastify';

const PayrollModal = ({ isOpen, onClose, onSave, payroll = null }) => {
  const [employees, setEmployees] = useState([]);
  const [formData, setFormData] = useState({
    user_id: '',
    month_year: new Date().toISOString().slice(0, 7), // YYYY-MM
    basic_salary: 0,
    hra: 0,
    da: 0,
    bonus: 0,
    deductions: 0
  });
  const [netSalary, setNetSalary] = useState(0);

  useEffect(() => {
    const fetchStructure = async (uid) => {
      try {
        const res = await axios.get(`/api/payroll/structure/${uid}`);
        if (res.data.success && res.data.data) {
          const s = res.data.data;
          setFormData(prev => ({
            ...prev,
            user_id: uid,
            basic_salary: s.basic_salary || 0,
            hra: s.hra || 0,
            da: s.da || 0,
            bonus: s.bonus || 0,
            deductions: s.deductions || 0
          }));
        }
      } catch (err) {
        console.error('Error fetching structure');
      }
    };

    if (isOpen) {
      fetchEmployees();
      if (payroll) {
        setFormData({
          user_id: payroll.user_id || '',
          month_year: payroll.month_year || new Date().toISOString().slice(0, 7),
          basic_salary: payroll.basic_salary ?? '',
          hra: payroll.hra ?? '',
          da: payroll.da ?? '',
          bonus: payroll.bonus ?? '',
          deductions: payroll.deductions ?? ''
        });
      } else {
        // Reset form for new entry
        setFormData({
          user_id: '',
          month_year: new Date().toISOString().slice(0, 7),
          basic_salary: '',
          hra: '',
          da: '',
          bonus: '',
          deductions: ''
        });
      }
    }
  }, [isOpen, payroll]);

  // Fetch structure when user selection changes (only if it's a new entry)
  useEffect(() => {
    if (isOpen && !payroll && formData.user_id) {
      const fetchStructure = async () => {
        try {
          const res = await axios.get(`/api/payroll/structure/${formData.user_id}`);
          if (res.data.success && res.data.data) {
            const s = res.data.data;
            setFormData(prev => ({
              ...prev,
              basic_salary: s.basic_salary || 0,
              hra: s.hra || 0,
              da: s.da || 0,
              bonus: s.bonus || 0,
              deductions: s.deductions || 0
            }));
          }
        } catch (err) {
          console.error('Error fetching structure');
        }
      };
      fetchStructure();
    }
  }, [formData.user_id]);

  useEffect(() => {
    calculateNetSalary();
  }, [formData]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      if (res.data.success) setEmployees(res.data.data);
    } catch (err) {
      console.error('Error fetching employees');
    }
  };

  const calculateNetSalary = () => {
    const { basic_salary, hra, da, bonus, deductions } = formData;
    const total = parseFloat(basic_salary || 0) + parseFloat(hra || 0) + parseFloat(da || 0) + parseFloat(bonus || 0) - parseFloat(deductions || 0);
    setNetSalary(total.toFixed(2));
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.user_id || formData.user_id === '' || !formData.month_year ||
      formData.basic_salary === '' || formData.hra === '' ||
      formData.da === '' || formData.bonus === '' ||
      formData.deductions === '') {
      return toast.error('Selection Error: Please select an Employee from the dropdown and fill all salary fields');
    }
    try {
      // 1. Save or Update Salary Structure
      await axios.post('/api/payroll/structure', formData);

      // 2. Generate or Update Payroll Entry
      if (payroll && payroll.id) {
        await axios.put(`/api/payroll/${payroll.id}`, formData);
        toast.success('Payroll and structure updated successfully');
      } else {
        await axios.post('/api/payroll/generate', formData);
        toast.success('Payroll generated and structure saved successfully');
      }
      onSave();
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Error saving payroll');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <DollarSign className="text-blue-600" /> {payroll ? 'Edit Payroll' : 'Generate Payroll'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-gray-700">Employee</label>
              <select
                name="user_id"
                value={formData.user_id}
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
              <label className="text-sm font-bold text-gray-700">Month / Year</label>
              <input
                type="month"
                name="month_year"
                value={formData.month_year}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Basic Salary</label>
              <input
                required
                type="number"
                name="basic_salary"
                value={formData.basic_salary}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">HRA</label>
              <input
                required
                type="number"
                name="hra"
                value={formData.hra}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">DA</label>
              <input
                required
                type="number"
                name="da"
                value={formData.da}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                min="0"
              />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-500 uppercase">Bonus</label>
              <input
                required
                type="number"
                name="bonus"
                value={formData.bonus}
                onChange={handleChange}
                className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg"
                min="0"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-sm font-bold text-red-600">Deductions</label>
              <input
                required
                type="number"
                name="deductions"
                value={formData.deductions}
                onChange={handleChange}
                className="w-full px-4 py-3 bg-red-50 border border-red-100 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500"
                min="0"
              />
            </div>

            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm text-blue-800 font-bold">Net Salary</p>
                <p className="text-xs text-blue-600">Calculated automatically</p>
              </div>
              <p className="text-2xl font-extrabold text-blue-700">₹{netSalary}</p>
            </div>
          </div>

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
              <Save size={18} /> {payroll ? 'Update' : 'Generate'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default PayrollModal;
