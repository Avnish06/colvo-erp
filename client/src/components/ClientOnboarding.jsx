import React, { useState } from 'react';
import axios from '../axiosConfig';
import { toast } from 'react-toastify';
import { UserPlus, Building2, Mail, Phone, FileText, CheckCircle } from 'lucide-react';

const ClientOnboarding = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    company_name: '',
    contact_person: '',
    email: '',
    phone: '',
    requirements: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      setLoading(true);
      const res = await axios.post('/api/client-management/onboard', formData);
      if (res.data.success) {
        toast.success('Client onboarded successfully!');
        setStep(3); // Success step
      }
    } catch (err) {
      toast.error('Failed to onboard client');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold flex items-center gap-2"><UserPlus /> Client Onboarding Wizard</h2>
      </div>

      <div className="max-w-2xl mx-auto bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        {/* Progress Bar */}
        <div className="flex bg-slate-50 border-b border-slate-200">
          <div className={`flex-1 text-center py-3 text-sm font-bold ${step >= 1 ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400'}`}>1. Basic Info</div>
          <div className={`flex-1 text-center py-3 text-sm font-bold ${step >= 2 ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-400'}`}>2. Requirements</div>
          <div className={`flex-1 text-center py-3 text-sm font-bold ${step >= 3 ? 'text-emerald-600 border-b-2 border-emerald-600 bg-emerald-50/50' : 'text-slate-400'}`}>3. Confirmation</div>
        </div>

        <div className="p-8">
          {step === 1 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Client Information</h3>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Company Name</label>
                <div className="relative">
                  <Building2 size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input type="text" name="company_name" value={formData.company_name} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Acme Corp" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Primary Contact Person</label>
                <div className="relative">
                  <UserPlus size={16} className="absolute left-3 top-3 text-slate-400" />
                  <input type="text" name="contact_person" value={formData.contact_person} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="John Doe" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Email</label>
                  <div className="relative">
                    <Mail size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input type="email" name="email" value={formData.email} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="john@acme.com" />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-1">Phone</label>
                  <div className="relative">
                    <Phone size={16} className="absolute left-3 top-3 text-slate-400" />
                    <input type="text" name="phone" value={formData.phone} onChange={handleChange} className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="+1 555-0192" />
                  </div>
                </div>
              </div>
              <div className="flex justify-end mt-6">
                <button onClick={() => setStep(2)} disabled={!formData.company_name || !formData.email} className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold disabled:opacity-50 hover:bg-indigo-700 transition-colors">Next Step</button>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
              <h3 className="text-lg font-bold text-slate-800 mb-4">Project & Requirements</h3>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Initial Project Scope / Requirements</label>
                <div className="relative">
                  <FileText size={16} className="absolute left-3 top-3 text-slate-400" />
                  <textarea name="requirements" value={formData.requirements} onChange={handleChange} rows="4" className="w-full pl-10 pr-3 py-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500" placeholder="Client requires a full CRM implementation..."></textarea>
                </div>
              </div>
              <div className="flex justify-between mt-6">
                <button onClick={() => setStep(1)} className="text-slate-500 hover:text-slate-800 font-bold px-4 py-2">Back</button>
                <button onClick={handleSubmit} disabled={loading} className="bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-emerald-700 transition-colors flex items-center gap-2">
                  {loading ? 'Processing...' : 'Complete Onboarding'}
                  {!loading && <CheckCircle size={16} />}
                </button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center py-8 animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={40} className="text-emerald-600" />
              </div>
              <h3 className="text-2xl font-black text-slate-800 mb-2">Onboarding Complete!</h3>
              <p className="text-slate-500 mb-6">Client has been successfully added to the system and the portal access email has been queued.</p>
              <div className="flex justify-center gap-4">
                <button onClick={() => { setStep(1); setFormData({company_name:'', contact_person:'', email:'', phone:'', requirements:''}); }} className="bg-indigo-50 text-indigo-700 px-6 py-2 rounded-lg font-bold hover:bg-indigo-100 transition-colors">Onboard Another</button>
                <button className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold hover:bg-indigo-700 transition-colors">Generate Proposal</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ClientOnboarding;
