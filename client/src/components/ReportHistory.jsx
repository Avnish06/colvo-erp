import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { FileText, Download, Search, Filter, Calendar, Plus, BarChart3 } from 'lucide-react';
import { toast } from 'react-toastify';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ReportHistory = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showGenModal, setShowGenModal] = useState(false);
  const [genData, setGenData] = useState({
    type: 'Monthly',
    month: new Date().toLocaleString('en-US', { month: 'long' }),
    year: new Date().getFullYear(),
  });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      const res = await axios.get('/api/reports');
      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error('Fetch Reports Error:', err);
      toast.error(`Error fetching reports: ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerate = async () => {
    try {
      const res = await axios.post('/api/reports/generate', genData);
      if (res.data.success) {
        toast.success('Report generated successfully');
        fetchReports();
        setShowGenModal(false);
      }
    } catch (err) {
      console.error('Generate Report Error:', err);
      toast.error(`Error generating report: ${err.response?.data?.message || err.message}`);
    }
  };

  const handleDownload = (report) => {
    const doc = new jsPDF();
    doc.setFontSize(22);
    doc.setTextColor(30, 58, 138);
    doc.text('ERPMaster IT Solutions', 105, 20, { align: 'center' });

    doc.setFontSize(16);
    doc.setTextColor(100);
    doc.text(report.title, 105, 30, { align: 'center' });

    doc.setFontSize(10);
    doc.setTextColor(0);
    doc.text(`Generated Date: ${new Date(report.created_at).toLocaleDateString()}`, 20, 45);
    doc.text(`Type: ${report.type}`, 20, 52);

    autoTable(doc, {
      startY: 65,
      head: [['Category', 'Details', 'Amount']],
      body: [
        ['Salary Expenditure', 'Total net salaries paid', `$${Number(report.total_salary).toFixed(2)}`],
        ['General Expenditures', 'Miscellaneous business costs', `$${Number(report.total_expenditure || 0).toFixed(2)}`],
        ['Client Revenue', 'Total billed to clients (from invoices)', `$${Number(report.total_invoices).toFixed(2)}`],
        ['Net Balance', 'Revenue - (Salary + Expenditures)', `$${(Number(report.total_invoices) - (Number(report.total_salary) + Number(report.total_expenditure || 0))).toFixed(2)}`],
      ],
      theme: 'grid',
      headStyles: { fillColor: [30, 58, 138], textColor: 255 },
    });

    doc.setFontSize(10);
    doc.setTextColor(150);
    doc.text('Confidential Financial Report - FOR INTERNAL USE ONLY', 105, 285, { align: 'center' });

    doc.save(`${report.title.replace(/\s+/g, '_')}.pdf`);
    toast.success('Report downloaded');
  };

  const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <div>
          <h3 className="text-xl font-bold text-gray-900">Financial Reports</h3>
          <p className="text-gray-500 text-sm">Access and download generated monthly/annual summaries</p>
        </div>
        <button
          onClick={() => setShowGenModal(true)}
          className="bg-blue-600 text-white px-6 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-blue-700 transition-all shadow-lg shadow-blue-200"
        >
          <Plus size={18} /> Generate New Report
        </button>
      </div>

      {showGenModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-8 space-y-6 transform animate-in fade-in zoom-in duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-black text-gray-900">Generate Report</h3>
              <button onClick={() => setShowGenModal(false)} className="text-gray-400 hover:text-gray-600">×</button>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Report Type</label>
                <div className="flex flex-wrap gap-2">
                  {['Monthly', 'Annual'].map(t => (
                    <button
                      key={t}
                      onClick={() => setGenData({ ...genData, type: t })}
                      className={`flex-1 py-2 rounded-lg text-sm font-bold border transition-all ${genData.type === t ? 'bg-blue-50 border-blue-600 text-blue-600' : 'bg-gray-50 border-gray-100 text-gray-400'}`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {genData.type === 'Monthly' && (
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Select Month</label>
                  <select
                    className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                    value={genData.month}
                    onChange={(e) => setGenData({ ...genData, month: e.target.value })}
                  >
                    {months.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Select Year</label>
                <select
                  className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl outline-none"
                  value={genData.year}
                  onChange={(e) => setGenData({ ...genData, year: e.target.value })}
                >
                  {[2024, 2025, 2026, 2027].map(y => <option key={y} value={y}>{y}</option>)}
                </select>
              </div>
            </div>

            <button
              onClick={handleGenerate}
              className="w-full bg-blue-600 text-white py-4 rounded-xl font-black hover:bg-blue-700 shadow-xl shadow-blue-100 transition-all flex items-center justify-center gap-2"
            >
              <BarChart3 size={20} /> Generate and Save
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-gray-50 border-b border-gray-100">
              <tr>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Report Title</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Type</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Generated Date</th>
                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {loading ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">Loading history...</td></tr>
              ) : reports.length === 0 ? (
                <tr><td colSpan="4" className="px-6 py-8 text-center text-gray-500">No reports generated yet.</td></tr>
              ) : reports.map((report) => (
                <tr key={report.id} className="hover:bg-blue-50/30 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-red-50 text-red-600 flex items-center justify-center">
                        <FileText size={20} />
                      </div>
                      <span className="font-semibold text-gray-800">{report.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${report.type === 'Annual' ? 'bg-purple-50 text-purple-600' : 'bg-blue-50 text-blue-600'
                      }`}>
                      {report.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-500 font-medium">{new Date(report.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4 text-right">
                    <button
                      onClick={() => handleDownload(report)}
                      className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                    >
                      <Download size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ReportHistory;
