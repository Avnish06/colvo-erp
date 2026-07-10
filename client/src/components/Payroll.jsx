import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { CreditCard, Download, DollarSign, Plus, FileText, Edit, Trash2 } from 'lucide-react';
import PayrollModal from './PayrollModal';
import ConfirmModal from './ConfirmModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import SalarySlipGenerator from './SalarySlipGenerator';

const Payroll = ({ initialTab = 'list' }) => {
  const [payrollData, setPayrollData] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [view, setView] = useState(initialTab === 'setup' ? 'setup' : 'history');
  const [searchTerm, setSearchTerm] = useState('');
  
  // Interactive slip state
  const [isSlipGenOpen, setIsSlipGenOpen] = useState(false);
  const [slipRecord, setSlipRecord] = useState(null);

  const user = JSON.parse(localStorage.getItem('user'));
  const isAdmin = user?.role === 'Admin' || user?.role === 'Super Admin' || user?.role === 'Developer';

  useEffect(() => {
    fetchPayroll();
    if (isAdmin) fetchEmployees();
    setView(initialTab === 'setup' ? 'setup' : 'history');
  }, [initialTab]);

  const fetchEmployees = async () => {
    try {
      const res = await axios.get('/api/employees');
      if (res.data.success) setEmployees(res.data.data);
    } catch (err) {
      console.error('Error fetching employees');
    }
  };

  const fetchPayroll = async () => {
    if (!user || (!user.id && !isAdmin)) {
      console.warn('Payroll: No user ID available for fetching data');
      setLoading(false);
      return;
    }

    const url = isAdmin ? '/api/payroll' : `/api/payroll/${user.id}`;
    
    console.log(`Payroll: Fetching from ${url}`, { isAdmin, userId: user?.id });

    try {
      const res = await axios.get(url);
      if (res.data.success) {
        console.log(`Payroll: Successfully fetched ${res.data.data.length} records`);
        setPayrollData(res.data.data);
      }
    } catch (err) {
      console.error('Payroll: Fetch error', err);
      toast.error('Error fetching payroll history');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = (record) => {
    const doc = new jsPDF();
    const companyName = "ERPMaster IT Solutions";

    // Add Header
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138); // Indigo-900
    doc.text(companyName, 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text('Monthly Salary Slip', 105, 30, { align: 'center' });

    // Employee Details Section
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setDrawColor(200);
    doc.line(20, 35, 190, 35);

    doc.setFont("helvetica", "bold");
    doc.text('Employee Name:', 20, 45);
    doc.setFont("helvetica", "normal");
    doc.text(record.employee_name || user.name, 60, 45);

    doc.setFont("helvetica", "bold");
    doc.text('Month / Year:', 20, 52);
    doc.setFont("helvetica", "normal");
    doc.text(record.month_year, 60, 52);

    doc.setFont("helvetica", "bold");
    doc.text('Payment Date:', 20, 59);
    doc.setFont("helvetica", "normal");
    doc.text(new Date(record.payment_date).toLocaleDateString(), 60, 59);

    // Earnings & Deductions Table
    autoTable(doc, {
      startY: 70, head: [['Description', 'Earnings', 'Deductions']],
      body: [
        ['Basic Salary', `₹${record.basic_salary}`, ''],
        ['HRA', `₹${record.hra}`, ''],
        ['DA', `₹${record.da}`, ''],
        ['Bonus', `₹${record.bonus}`, ''],
        ['Total Deductions', '', `₹${record.deductions}`],
      ],
      theme: 'striped',
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
      styles: { cellPadding: 5 }
    });

    // Net Salary Section
    const finalY = doc.lastAutoTable.finalY + 10;
    doc.setDrawColor(30, 58, 138);
    doc.setLineWidth(1);
    doc.rect(20, finalY, 170, 15);

    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text('NET SALARY:', 30, finalY + 10);
    doc.setTextColor(22, 163, 74); // Green-600
    doc.text(`₹${record.net_salary}`, 150, finalY + 10);

    // Footer
    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('This is a computer-generated salary slip and does not require a signature.', 105, 280, { align: 'center' });

    doc.save(`Salary_Slip_${record.month_year}.pdf`);
    toast.success('Salary slip downloaded');
  };

  const handleGenerateClick = () => {
    setSelectedPayroll(null);
    setIsModalOpen(true);
  };

  const handleEditClick = (payroll) => {
    setSelectedPayroll(payroll);
    setIsModalOpen(true);
  };

  const [showConfirm, setShowConfirm] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState(null);

  const handleDeleteClick = (id) => {
    setPendingDeleteId(id);
    setShowConfirm(true);
  };

  const confirmDeletePayroll = async () => {
    if (!pendingDeleteId) return;
    try {
      const res = await axios.delete(`/api/payroll/${pendingDeleteId}`);
      if (res.data.success) {
        toast.success('Payroll record deleted');
        fetchPayroll();
      }
    } catch (err) {
      toast.error('Error deleting payroll record');
    } finally {
      setPendingDeleteId(null);
      setShowConfirm(false);
    }
  };

  const cancelDeletePayroll = () => {
    setPendingDeleteId(null);
    setShowConfirm(false);
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h3 className="text-2xl font-bold text-gray-900">{isAdmin ? 'Payroll Management' : 'My Salary Slips'}</h3>
          <p className="text-gray-500 font-medium">{isAdmin ? 'Manage employee salaries and setup payroll structures' : 'View and download your monthly salary slips'}</p>
          <ConfirmModal
            isOpen={showConfirm}
            title="Delete Payroll Record"
            message="Are you sure you want to delete this payroll record?"
            onConfirm={confirmDeletePayroll}
            onCancel={cancelDeletePayroll}
            confirmText="Delete"
            cancelText="Cancel"
          />
        </div>
        {isAdmin && (
          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handleGenerateClick}
              className="bg-blue-600 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-100"
            >
              <Plus size={20} /> Generate Payroll
            </button>
            <div className="flex bg-gray-100 p-1 rounded-xl">
              <button
                onClick={() => setView('history')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'history' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Payment History
              </button>
              <button
                onClick={() => setView('setup')}
                className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${view === 'setup' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Salary Setup
              </button>
            </div>
          </div>
        )}
      </div>

      {isAdmin && view === 'setup' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-6 border-b border-gray-200 flex flex-wrap items-center justify-between gap-4">
            <h3 className="text-xl font-bold text-gray-900">Setup Employee Salary Structure</h3>
            <div className="relative">
              <input
                type="text"
                placeholder="Search employee..."
                className="pl-4 pr-10 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Department</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {employees
                  .filter(e => e.role === 'Employee' || e.role === 'Employee ERP' || e.role === 'Employee CRM')
                  .filter(e => (e.name || '').toLowerCase().includes((searchTerm || '').toLowerCase()))
                  .map(emp => (
                    <tr key={emp.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                            {(emp.name || '').split(' ').map(n => n[0]).join('')}
                          </div>
                          <span className="text-sm font-semibold text-gray-900">{emp.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{emp.department}</td>
                      <td className="px-6 py-4">
                        <span className="px-2 py-1 bg-green-50 text-green-600 rounded-md text-[10px] font-bold uppercase">Ready</span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button
                          onClick={() => {
                            setSelectedPayroll({ user_id: emp.id });
                            setIsModalOpen(true);
                          }}
                          className="bg-blue-50 text-blue-600 px-4 py-2 rounded-lg text-sm font-bold hover:bg-blue-100 transition-colors inline-flex items-center gap-2"
                        >
                          <Plus size={16} /> Setup Salary
                        </button>
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {view === 'history' && (
        <>
          {/* Quick Stats (Only for Employee) */}
          {!isAdmin && payrollData.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Last Net Salary</p>
                <p className="text-3xl font-extrabold text-gray-900">₹{payrollData[0].net_salary}</p>
              </div>
              <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Month</p>
                <p className="text-3xl font-extrabold text-blue-600">{payrollData[0].month_year}</p>
              </div>
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-xl font-bold text-gray-900">Payment History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    {isAdmin && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Employee</th>}
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Month/Year</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Net Salary</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Payment Date</th>
                    <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading ? (
                    <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-gray-500">Loading history...</td></tr>
                  ) : payrollData.length === 0 ? (
                    <tr><td colSpan={isAdmin ? 5 : 4} className="px-6 py-8 text-center text-gray-500">No records found.</td></tr>
                  ) : payrollData.map((salary) => (
                    <tr key={salary.id} className="hover:bg-gray-50 transition-colors">
                      {isAdmin && <td className="px-6 py-4 text-sm font-semibold text-gray-900">{salary.employee_name}</td>}
                      <td className="px-6 py-4 text-sm text-gray-600 font-medium">{salary.month_year}</td>
                      <td className="px-6 py-4 text-sm font-bold text-green-600">₹{salary.net_salary}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">{new Date(salary.payment_date).toLocaleDateString()}</td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <button
                            onClick={() => {
                              setSlipRecord(salary);
                              setIsSlipGenOpen(true);
                            }}
                            className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Interactive Slip"
                          >
                            <Download size={16} />
                          </button>
                          {isAdmin && (
                            <>
                              <button
                                onClick={() => handleEditClick(salary)}
                                className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <Edit size={16} />
                              </button>
                              <button
                                onClick={() => handleDeleteClick(salary.id)}
                                className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Delete"
                              >
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      <PayrollModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={fetchPayroll}
        payroll={selectedPayroll}
      />

      {isSlipGenOpen && slipRecord && (
        <SalarySlipGenerator 
          payroll={slipRecord}
          onClose={() => {
            setIsSlipGenOpen(false);
            setSlipRecord(null);
          }}
        />
      )}
    </div>
  );
};

export default Payroll;
