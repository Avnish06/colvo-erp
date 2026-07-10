import React, { useState } from 'react';
import { 
  CheckCircle2, 
  UploadCloud, 
  FileText, 
  ShieldCheck, 
  ArrowRight, 
  X, 
  FileCheck,
  Lock
} from 'lucide-react';
import { toast } from 'react-toastify';

export default function EmployeeOnboardingWizard({ details, onClose }) {
  const [step, setStep] = useState(1);
  const [documents, setDocuments] = useState({
    aadhar: null,
    pan: null,
    education: null
  });
  const [agreements, setAgreements] = useState({
    nda: false,
    codeOfConduct: false,
    securityPolicy: false
  });

  const handleNext = () => {
    if (step === 2) {
      if (!documents.aadhar || !documents.pan) {
        toast.error('Please upload at least Aadhar and PAN to proceed.');
        return;
      }
    }
    if (step === 3) {
      if (!agreements.nda || !agreements.codeOfConduct || !agreements.securityPolicy) {
        toast.error('You must agree to all policies to complete onboarding.');
        return;
      }
      toast.success('Onboarding completed successfully! Welcome aboard.');
      setTimeout(onClose, 2000);
      return;
    }
    setStep(prev => prev + 1);
  };

  const handleFileUpload = (e, type) => {
    const file = e.target.files[0];
    if (file) {
      setDocuments(prev => ({ ...prev, [type]: file.name }));
      toast.success(`${type.toUpperCase()} uploaded successfully.`);
    }
  };

  const toggleAgreement = (key) => {
    setAgreements(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-gray-900/95 p-4 md:p-8 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden shadow-2xl relative">
        
        {/* Header */}
        <div className="px-8 py-6 flex justify-between items-center border-b">
          <div>
            <h2 className="text-2xl font-black text-gray-900">Candidate Onboarding Portal</h2>
            <p className="text-sm text-gray-500">Complete your onboarding steps to officially join the team.</p>
          </div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        {/* Stepper */}
        <div className="bg-gray-50 border-b px-8 py-4 flex gap-8">
          {[
            { num: 1, label: 'Offer & Welcome', icon: FileText },
            { num: 2, label: 'Document Submission', icon: UploadCloud },
            { num: 3, label: 'Compliance & IT Policy', icon: ShieldCheck }
          ].map((s) => (
            <div key={s.num} className={`flex items-center gap-3 ${step >= s.num ? 'text-blue-600' : 'text-gray-400'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step >= s.num ? 'bg-blue-600 text-white shadow-md' : 'bg-gray-200'}`}>
                {step > s.num ? <CheckCircle2 size={16} /> : s.num}
              </div>
              <span className={`text-sm font-bold ${step >= s.num ? 'text-gray-900' : 'text-gray-500'}`}>{s.label}</span>
            </div>
          ))}
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-8 bg-white">
          
          {/* STEP 1 */}
          {step === 1 && (
            <div className="max-w-2xl mx-auto text-center space-y-6 mt-8 animate-in slide-in-from-bottom-4">
              <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
                <FileCheck size={48} />
              </div>
              <h1 className="text-3xl font-black text-gray-900">Welcome to {details?.companyName || 'the Team'}!</h1>
              <p className="text-lg text-gray-600">
                Hi <span className="font-bold text-blue-600">{details?.candidateName || 'Candidate'}</span>, congratulations on your offer for the position of <span className="font-bold">{details?.jobTitle || 'Role'}</span>. 
              </p>
              <div className="bg-blue-50 p-6 rounded-2xl border border-blue-100 text-left mt-8">
                <h4 className="font-bold text-blue-900 mb-2">Your Offer Details:</h4>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li><strong>Joining Date:</strong> {details?.joiningDate || 'TBD'}</li>
                  <li><strong>Department:</strong> {details?.department || 'TBD'}</li>
                  <li><strong>Work Location:</strong> {details?.workLocation || 'TBD'}</li>
                  <li><strong>Annual CTC:</strong> ₹{details?.salaryAmount || 'TBD'}</li>
                </ul>
              </div>
              <p className="text-sm text-gray-500 italic mt-6">By proceeding, you digitally acknowledge the receipt and acceptance of your offer letter.</p>
            </div>
          )}

          {/* STEP 2 */}
          {step === 2 && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900">Upload Required Documents</h3>
                <p className="text-gray-500 text-sm">Please upload clear copies of your KYC and educational documents.</p>
              </div>

              <div className="space-y-4">
                {/* Document Rows */}
                {[
                  { id: 'aadhar', title: 'Aadhar Card (Front & Back)', req: true },
                  { id: 'pan', title: 'PAN Card', req: true },
                  { id: 'education', title: 'Highest Degree / Certificate', req: false }
                ].map((doc) => (
                  <div key={doc.id} className={`p-4 border-2 border-dashed rounded-2xl flex justify-between items-center transition-all ${documents[doc.id] ? 'border-emerald-500 bg-emerald-50' : 'border-gray-200 bg-gray-50'}`}>
                    <div>
                      <h4 className="font-bold text-gray-900">{doc.title} {doc.req && <span className="text-red-500">*</span>}</h4>
                      <p className="text-xs text-gray-500">{documents[doc.id] ? documents[doc.id] : 'PDF, JPG, PNG (Max 5MB)'}</p>
                    </div>
                    <div>
                      <input type="file" id={`upload-${doc.id}`} className="hidden" onChange={(e) => handleFileUpload(e, doc.id)} />
                      <label htmlFor={`upload-${doc.id}`} className={`px-4 py-2 rounded-xl text-sm font-bold cursor-pointer transition-colors ${documents[doc.id] ? 'bg-emerald-600 text-white' : 'bg-white border text-blue-600 hover:bg-blue-50'}`}>
                        {documents[doc.id] ? 'Re-upload' : 'Upload'}
                      </label>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* STEP 3 */}
          {step === 3 && (
            <div className="max-w-2xl mx-auto space-y-8 animate-in slide-in-from-right-8">
              <div>
                <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2"><Lock size={24} className="text-red-500"/> Compliance & IT Policy</h3>
                <p className="text-gray-500 text-sm">Please read and acknowledge our standard company policies to proceed.</p>
              </div>

              <div className="space-y-4">
                {/* Agreement Rows */}
                {[
                  { key: 'nda', title: 'Non-Disclosure Agreement (NDA)', desc: 'I agree to maintain strict confidentiality regarding company projects, client data, and proprietary software.' },
                  { key: 'codeOfConduct', title: 'Code of Conduct', desc: 'I have read and agree to adhere to the professional code of conduct and workplace ethics guidelines.' },
                  { key: 'securityPolicy', title: 'IT & Data Security Policy', desc: 'I agree to follow the IT security protocols, including password policies, secure network usage, and device management rules.' }
                ].map((item) => (
                  <div key={item.key} onClick={() => toggleAgreement(item.key)} className={`p-5 border rounded-2xl flex items-start gap-4 cursor-pointer transition-all ${agreements[item.key] ? 'border-blue-500 bg-blue-50' : 'border-gray-200 bg-white hover:border-blue-300'}`}>
                    <div className={`mt-0.5 w-6 h-6 rounded-md flex items-center justify-center border-2 ${agreements[item.key] ? 'bg-blue-600 border-blue-600 text-white' : 'border-gray-300 bg-white'}`}>
                      {agreements[item.key] && <CheckCircle2 size={16} />}
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900">{item.title}</h4>
                      <p className="text-xs text-gray-600 leading-relaxed mt-1">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-6 bg-gray-50 border-t flex justify-end">
          <button
            onClick={handleNext}
            className="flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-bold shadow-md shadow-blue-200"
          >
            {step === 3 ? 'Complete Onboarding' : 'Next Step'} <ArrowRight size={18} />
          </button>
        </div>

      </div>
    </div>
  );
}
