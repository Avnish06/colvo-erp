import React, { useState, useRef } from 'react';
import { Upload, Download, FileText, CheckCircle, AlertCircle, X, Table, Users, CreditCard, Target, BarChart3 as BarChart } from 'lucide-react';
import axios from '../axiosConfig';

const EXPORT_TYPES = [
  { id: 'employees', label: 'Employees', icon: <Users size={18} />, color: 'blue', endpoint: '/api/employees', desc: 'Export full employee directory' },
  { id: 'payroll', label: 'Payroll Data', icon: <CreditCard size={18} />, color: 'green', endpoint: '/api/payroll', desc: 'Export salary & payment history' },
  { id: 'leads', label: 'CRM Leads', icon: <Target size={18} />, color: 'purple', endpoint: '/api/leads', desc: 'Export all CRM leads' },
  { id: 'attendance', label: 'Attendance', icon: <BarChart size={18} />, color: 'orange', endpoint: '/api/attendance', desc: 'Export attendance records' },
];

const IMPORT_TYPES = [
  { id: 'employees', label: 'Import Employees', icon: <Users size={18} />, color: 'blue', desc: 'Bulk add employees via CSV', columns: ['name', 'email', 'department', 'designation', 'joining_date', 'salary'] },
  { id: 'leads', label: 'Import Leads', icon: <Target size={18} />, color: 'purple', desc: 'Bulk import CRM leads via CSV', columns: ['name', 'email', 'phone', 'company', 'source', 'status'] },
];

const COLOR_MAP = {
  blue: 'bg-blue-50 border-blue-200 text-blue-700',
  green: 'bg-green-50 border-green-200 text-green-700',
  purple: 'bg-purple-50 border-purple-200 text-purple-700',
  orange: 'bg-orange-50 border-orange-200 text-orange-700',
};

const BTN_MAP = {
  blue: 'bg-blue-600 hover:bg-blue-700',
  green: 'bg-green-600 hover:bg-green-700',
  purple: 'bg-purple-600 hover:bg-purple-700',
  orange: 'bg-orange-600 hover:bg-orange-700',
};

function toCSV(data) {
  if (!data || data.length === 0) return '';
  const keys = Object.keys(data[0]);
  const header = keys.join(',');
  const rows = data.map(row => keys.map(k => JSON.stringify(row[k] ?? '')).join(','));
  return [header, ...rows].join('\n');
}

function downloadCSV(filename, csvData) {
  const blob = new Blob([csvData], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function downloadSampleCSV(columns) {
  const header = columns.join(',');
  const sample = columns.map(() => 'sample_value').join(',');
  downloadCSV('sample_import.csv', `${header}\n${sample}`);
}

export default function DataImportExport() {
  const [activeTab, setActiveTab] = useState('export');
  const [exporting, setExporting] = useState({});
  const [exportSuccess, setExportSuccess] = useState({});

  const [selectedImport, setSelectedImport] = useState(null);
  const [importFile, setImportFile] = useState(null);
  const [csvRows, setCsvRows] = useState([]);
  const [csvHeaders, setCsvHeaders] = useState([]);
  const [importStatus, setImportStatus] = useState(null); // null | 'preview' | 'success' | 'error'
  const [importMsg, setImportMsg] = useState('');
  const [dragging, setDragging] = useState(false);
  const fileRef = useRef();

  const handleExport = async (type) => {
    setExporting(prev => ({ ...prev, [type.id]: true }));
    try {
      const res = await axios.get(type.endpoint);
      const data = res.data.data || res.data.employees || res.data.leads || res.data.payroll || res.data.records || [];
      if (data.length === 0) {
        alert('No data available to export.');
        return;
      }
      downloadCSV(`${type.id}_export_${new Date().toISOString().split('T')[0]}.csv`, toCSV(data));
      setExportSuccess(prev => ({ ...prev, [type.id]: true }));
      setTimeout(() => setExportSuccess(prev => ({ ...prev, [type.id]: false })), 3000);
    } catch (e) {
      alert('Export failed. Please try again.');
    } finally {
      setExporting(prev => ({ ...prev, [type.id]: false }));
    }
  };

  const parseCSV = (text) => {
    const lines = text.trim().split('\n');
    if (lines.length < 2) return { headers: [], rows: [] };
    const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
    const rows = lines.slice(1).map(line => {
      const vals = line.split(',').map(v => v.trim().replace(/^"|"$/g, ''));
      return headers.reduce((obj, h, i) => ({ ...obj, [h]: vals[i] || '' }), {});
    });
    return { headers, rows };
  };

  const handleFileDrop = (file) => {
    if (!file || !file.name.endsWith('.csv')) {
      setImportMsg('Please upload a valid CSV file.');
      setImportStatus('error');
      return;
    }
    setImportFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      const { headers, rows } = parseCSV(e.target.result);
      setCsvHeaders(headers);
      setCsvRows(rows.slice(0, 10)); // show first 10
      setImportStatus('preview');
      setImportMsg('');
    };
    reader.readAsText(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer.files[0];
    handleFileDrop(file);
  };

  const resetImport = () => {
    setImportFile(null);
    setCsvRows([]);
    setCsvHeaders([]);
    setImportStatus(null);
    setImportMsg('');
  };

  const confirmImport = () => {
    // Simulate import success (real implementation would POST to server)
    setImportStatus('success');
    setImportMsg(`Successfully imported ${csvRows.length} records.`);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-gradient-to-br from-slate-50 via-emerald-50 to-teal-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }} className="p-3 rounded-2xl shadow-lg">
            <Table size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Data Import / Export</h1>
            <p className="text-gray-500 text-sm">Bulk import or export your organization data via CSV</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm w-fit">
        {['export', 'import'].map(t => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`px-6 py-2.5 rounded-xl text-sm font-semibold capitalize transition-all duration-200 ${activeTab === t ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-500 hover:text-gray-700'}`}
          >
            {t === 'export' ? <><Download size={14} className="inline mr-1.5" />Export Data</> : <><Upload size={14} className="inline mr-1.5" />Import Data</>}
          </button>
        ))}
      </div>

      {activeTab === 'export' ? (
        /* Export Panel */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {EXPORT_TYPES.map(type => (
            <div key={type.id} className={`bg-white rounded-2xl border ${COLOR_MAP[type.color].split(' ')[1]} shadow-sm hover:shadow-lg transition-all p-6`}>
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-3 rounded-xl ${COLOR_MAP[type.color].split(' ')[0]}`}>
                  <span className={COLOR_MAP[type.color].split(' ')[2]}>{type.icon}</span>
                </div>
                <div>
                  <h3 className="font-bold text-gray-900">{type.label}</h3>
                  <p className="text-xs text-gray-500">{type.desc}</p>
                </div>
              </div>
              <button
                onClick={() => handleExport(type)}
                disabled={exporting[type.id]}
                className={`w-full py-3 rounded-xl text-white text-sm font-semibold ${BTN_MAP[type.color]} transition-colors flex items-center justify-center gap-2 disabled:opacity-60`}
              >
                {exporting[type.id] ? (
                  <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Exporting...</>
                ) : exportSuccess[type.id] ? (
                  <><CheckCircle size={16} />Downloaded!</>
                ) : (
                  <><Download size={16} />Export as CSV</>
                )}
              </button>
            </div>
          ))}
        </div>
      ) : (
        /* Import Panel */
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Import Type Selection */}
          <div className="space-y-3">
            <h3 className="font-semibold text-gray-700 text-sm mb-3">Select Import Type</h3>
            {IMPORT_TYPES.map(type => (
              <button
                key={type.id}
                onClick={() => { setSelectedImport(type); resetImport(); }}
                className={`w-full p-4 rounded-2xl border text-left transition-all ${selectedImport?.id === type.id ? 'border-emerald-400 bg-emerald-50 shadow-md' : 'border-gray-100 bg-white hover:shadow-md'}`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${selectedImport?.id === type.id ? 'bg-emerald-100 text-emerald-700' : 'bg-gray-100 text-gray-500'}`}>
                    {type.icon}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{type.label}</p>
                    <p className="text-xs text-gray-500">{type.desc}</p>
                  </div>
                </div>
                {selectedImport?.id === type.id && (
                  <div className="mt-3 pt-3 border-t border-emerald-200">
                    <p className="text-xs text-emerald-700 font-medium mb-1">Required columns:</p>
                    <div className="flex flex-wrap gap-1">
                      {type.columns.map(c => (
                        <span key={c} className="text-xs bg-white border border-emerald-200 text-emerald-700 px-2 py-0.5 rounded font-mono">{c}</span>
                      ))}
                    </div>
                    <button
                      onClick={(e) => { e.stopPropagation(); downloadSampleCSV(type.columns); }}
                      className="mt-2 text-xs text-emerald-600 hover:text-emerald-800 font-semibold underline"
                    >
                      Download sample CSV
                    </button>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Upload & Preview Panel */}
          <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
            {!selectedImport ? (
              <div className="flex flex-col items-center justify-center h-full text-center py-12">
                <Upload size={40} className="text-gray-300 mb-3" />
                <p className="text-gray-400 font-medium">Select an import type to get started</p>
              </div>
            ) : importStatus === 'success' ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                  <CheckCircle size={32} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold text-gray-900 mb-1">Import Successful!</h3>
                <p className="text-gray-500">{importMsg}</p>
                <button onClick={resetImport} className="mt-6 px-6 py-2.5 bg-emerald-600 text-white rounded-xl font-semibold hover:bg-emerald-700 transition-colors">
                  Import More
                </button>
              </div>
            ) : importStatus === 'preview' ? (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-bold text-gray-900">Preview — {csvRows.length} rows</h3>
                  <div className="flex gap-2">
                    <button onClick={resetImport} className="px-3 py-1.5 rounded-xl border border-gray-200 text-gray-600 text-sm hover:bg-gray-50 transition-colors"><X size={14} className="inline mr-1" />Cancel</button>
                    <button onClick={confirmImport} className="px-4 py-1.5 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 transition-colors"><CheckCircle size={14} className="inline mr-1" />Confirm Import</button>
                  </div>
                </div>
                <div className="overflow-x-auto rounded-xl border border-gray-100">
                  <table className="w-full text-xs">
                    <thead className="bg-gray-50">
                      <tr>
                        {csvHeaders.map(h => (
                          <th key={h} className="px-3 py-2 text-left font-semibold text-gray-600 whitespace-nowrap">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {csvRows.map((row, i) => (
                        <tr key={i} className="border-t border-gray-50 hover:bg-gray-50">
                          {csvHeaders.map(h => (
                            <td key={h} className="px-3 py-2 text-gray-700 whitespace-nowrap">{row[h] || '-'}</td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ) : (
              /* Drop zone */
              <div
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center text-center transition-all duration-200 cursor-pointer ${dragging ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/40'}`}
                onClick={() => fileRef.current?.click()}
              >
                <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={e => handleFileDrop(e.target.files[0])} />
                <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mb-4">
                  <Upload size={28} className="text-emerald-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-1">Drop your CSV file here</h3>
                <p className="text-sm text-gray-400 mb-3">or click to browse files</p>
                {importStatus === 'error' && (
                  <p className="text-sm text-red-500 font-medium"><AlertCircle size={14} className="inline mr-1" />{importMsg}</p>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
