import React, { useState } from 'react';
import { FileText, Plus, Edit, Trash2, Eye, Save, X, Download, Layout, CreditCard, Award, Briefcase } from 'lucide-react';

const TEMPLATES = [
  { id: 'offer_letter', name: 'Offer Letter', icon: '📄', desc: 'Formal job offer sent to candidates', color: 'blue' },
  { id: 'appointment', name: 'Appointment Letter', icon: '📋', desc: 'Official appointment/joining letter', color: 'green' },
  { id: 'payslip', name: 'Payslip Layout', icon: '💰', desc: 'Monthly salary slip template', color: 'purple' },
  { id: 'id_card', name: 'ID Card Template', icon: '🪪', desc: 'Employee identity card design', color: 'orange' },
  { id: 'experience', name: 'Experience Letter', icon: '📑', desc: 'Service/experience certificate', color: 'pink' },
  { id: 'relieving', name: 'Relieving Letter', icon: '📝', desc: 'Employee exit/relieving letter', color: 'red' },
];

const DEFAULT_CONTENT = {
  offer_letter: `Dear {{employee_name}},\n\nWe are pleased to offer you the position of {{designation}} at {{company_name}}.\n\nYour joining date will be {{joining_date}} and you will be reporting to {{reporting_manager}}.\n\nYour fixed annual CTC will be ₹{{annual_ctc}}.\n\nPlease confirm your acceptance by signing and returning this letter.\n\nWarm regards,\n{{hr_name}}\nHR Department\n{{company_name}}`,
  appointment: `Dear {{employee_name}},\n\nWith reference to your application and subsequent interview, we are pleased to appoint you as {{designation}} in our organization with effect from {{joining_date}}.\n\nYour terms of appointment are as follows:\n- Department: {{department}}\n- Salary: ₹{{salary}} per month\n- Probation Period: 6 months\n\nPlease sign and return the duplicate copy.\n\n{{hr_name}}\nAuthorised Signatory`,
  payslip: `SALARY SLIP — {{month}} {{year}}\n\nEmployee: {{employee_name}}\nEmp ID: {{employee_id}}\nDepartment: {{department}}\nDesignation: {{designation}}\n\n--- EARNINGS ---\nBasic Salary:     ₹{{basic}}\nHRA:              ₹{{hra}}\nAllowances:       ₹{{allowances}}\nGross Pay:        ₹{{gross}}\n\n--- DEDUCTIONS ---\nPF:               ₹{{pf}}\nTDS:              ₹{{tds}}\nOther Deductions: ₹{{other_deductions}}\nTotal Deductions: ₹{{total_deductions}}\n\nNET PAY: ₹{{net_pay}}`,
  id_card: `EMPLOYEE ID CARD\n\nCompany: {{company_name}}\nName: {{employee_name}}\nEmp ID: {{employee_id}}\nDesignation: {{designation}}\nDepartment: {{department}}\nBlood Group: {{blood_group}}\nContact: {{contact_number}}\n\nEmergency: {{emergency_contact}}`,
  experience: `To Whomsoever It May Concern,\n\nThis is to certify that {{employee_name}} (Emp ID: {{employee_id}}) was employed with {{company_name}} as {{designation}} from {{joining_date}} to {{leaving_date}}.\n\nDuring their tenure, they demonstrated excellent skills and was a valuable asset to the organization.\n\nWe wish them the best in their future endeavors.\n\n{{hr_name}}\nHR Department\n{{company_name}}`,
  relieving: `Dear {{employee_name}},\n\nWith reference to your resignation dated {{resignation_date}}, we acknowledge that you have been officially relieved from your duties as {{designation}} effective {{leaving_date}}.\n\nWe thank you for your contribution to {{company_name}} and wish you success in your future endeavors.\n\n{{hr_name}}\nHR Department\n{{company_name}}`,
};

const COLOR_MAP = {
  blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', badge: 'bg-blue-100 text-blue-800', btn: 'bg-blue-600 hover:bg-blue-700' },
  green: { bg: 'bg-green-50', border: 'border-green-200', text: 'text-green-700', badge: 'bg-green-100 text-green-800', btn: 'bg-green-600 hover:bg-green-700' },
  purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', badge: 'bg-purple-100 text-purple-800', btn: 'bg-purple-600 hover:bg-purple-700' },
  orange: { bg: 'bg-orange-50', border: 'border-orange-200', text: 'text-orange-700', badge: 'bg-orange-100 text-orange-800', btn: 'bg-orange-600 hover:bg-orange-700' },
  pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700', badge: 'bg-pink-100 text-pink-800', btn: 'bg-pink-600 hover:bg-pink-700' },
  red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', badge: 'bg-red-100 text-red-800', btn: 'bg-red-600 hover:bg-red-700' },
};

const VARIABLES = ['{{employee_name}}', '{{employee_id}}', '{{designation}}', '{{department}}', '{{company_name}}', '{{joining_date}}', '{{leaving_date}}', '{{month}}', '{{year}}', '{{salary}}', '{{annual_ctc}}', '{{gross}}', '{{net_pay}}', '{{hr_name}}', '{{reporting_manager}}', '{{blood_group}}', '{{contact_number}}', '{{emergency_contact}}'];

export default function DocumentLayout() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [contents, setContents] = useState(() => {
    try {
      const saved = localStorage.getItem('doc_templates');
      return saved ? JSON.parse(saved) : { ...DEFAULT_CONTENT };
    } catch { return { ...DEFAULT_CONTENT }; }
  });
  const [editContent, setEditContent] = useState('');
  const [preview, setPreview] = useState(false);
  const [saved, setSaved] = useState(false);

  const handleEdit = (tpl) => {
    setSelectedTemplate(tpl);
    setEditContent(contents[tpl.id] || DEFAULT_CONTENT[tpl.id] || '');
    setEditMode(true);
    setPreview(false);
  };

  const handleSave = () => {
    const updated = { ...contents, [selectedTemplate.id]: editContent };
    setContents(updated);
    localStorage.setItem('doc_templates', JSON.stringify(updated));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const handleReset = () => {
    setEditContent(DEFAULT_CONTENT[selectedTemplate.id] || '');
  };

  const handleDownload = (tpl) => {
    const text = contents[tpl.id] || DEFAULT_CONTENT[tpl.id];
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${tpl.name.replace(/\s/g, '_')}_template.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const insertVariable = (v) => {
    setEditContent(prev => prev + v);
  };

  return (
    <div style={{ fontFamily: "'Inter', sans-serif" }} className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div style={{ background: 'linear-gradient(135deg, #6366f1, #8b5cf6)' }} className="p-3 rounded-2xl shadow-lg">
            <Layout size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Document Layout</h1>
            <p className="text-gray-500 text-sm">Manage document templates for letters, payslips, and ID cards</p>
          </div>
        </div>
      </div>

      {!editMode ? (
        /* Template Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {TEMPLATES.map(tpl => {
            const c = COLOR_MAP[tpl.color];
            const hasCustom = contents[tpl.id] && contents[tpl.id] !== DEFAULT_CONTENT[tpl.id];
            return (
              <div key={tpl.id} className={`bg-white rounded-2xl border ${c.border} shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden group`}>
                <div className={`${c.bg} px-6 pt-6 pb-4`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{tpl.icon}</span>
                      <div>
                        <h3 className={`font-bold text-gray-900`}>{tpl.name}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{tpl.desc}</p>
                      </div>
                    </div>
                    {hasCustom && (
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full ${c.badge}`}>Custom</span>
                    )}
                  </div>
                </div>
                <div className="px-6 py-4 flex gap-2">
                  <button
                    onClick={() => handleEdit(tpl)}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-white text-sm font-semibold ${c.btn} transition-colors`}
                  >
                    <Edit size={15} /> Edit Template
                  </button>
                  <button
                    onClick={() => handleDownload(tpl)}
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
                    title="Download"
                  >
                    <Download size={15} />
                  </button>
                  <button
                    onClick={() => { setSelectedTemplate(tpl); setPreview(true); setEditMode(true); setEditContent(contents[tpl.id] || DEFAULT_CONTENT[tpl.id]); }}
                    className="p-2.5 rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-500 transition-colors"
                    title="Preview"
                  >
                    <Eye size={15} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Editor Mode */
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Editor Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gradient-to-r from-indigo-50 to-purple-50">
            <div className="flex items-center gap-3">
              <button onClick={() => setEditMode(false)} className="p-2 rounded-xl hover:bg-white/80 text-gray-600 transition-colors">
                <X size={18} />
              </button>
              <span className="text-2xl">{selectedTemplate?.icon}</span>
              <div>
                <h2 className="font-bold text-gray-900">{selectedTemplate?.name}</h2>
                <p className="text-xs text-gray-500">Click variables below to insert them into the template</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPreview(!preview)} className={`px-4 py-2 rounded-xl text-sm font-semibold border transition-colors ${preview ? 'bg-indigo-600 text-white border-indigo-600' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                <Eye size={15} className="inline mr-1" /> Preview
              </button>
              <button onClick={handleReset} className="px-4 py-2 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50 transition-colors">
                Reset
              </button>
              <button onClick={handleSave} className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-all ${saved ? 'bg-green-500' : 'bg-indigo-600 hover:bg-indigo-700'}`}>
                <Save size={15} className="inline mr-1" /> {saved ? 'Saved!' : 'Save'}
              </button>
            </div>
          </div>

          {/* Variable Chips */}
          {!preview && (
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-100 flex flex-wrap gap-2">
              {VARIABLES.map(v => (
                <button key={v} onClick={() => insertVariable(v)} className="text-xs bg-indigo-100 text-indigo-700 font-mono px-2.5 py-1 rounded-lg hover:bg-indigo-200 transition-colors">
                  {v}
                </button>
              ))}
            </div>
          )}

          {/* Editor / Preview */}
          {preview ? (
            <div className="p-8">
              <div className="max-w-2xl mx-auto bg-white border border-gray-200 rounded-2xl p-8 shadow-lg">
                <div className="border-b border-gray-200 pb-4 mb-6 flex items-center justify-between">
                  <h3 className="text-lg font-bold text-gray-900">{selectedTemplate?.name}</h3>
                  <span className="text-xs text-gray-400 font-mono bg-gray-100 px-2 py-1 rounded">Preview Mode</span>
                </div>
                <pre className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">{editContent}</pre>
              </div>
            </div>
          ) : (
            <div className="p-6">
              <textarea
                className="w-full h-96 p-4 font-mono text-sm text-gray-800 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-300 resize-y transition-all"
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                placeholder="Enter your template content here..."
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
