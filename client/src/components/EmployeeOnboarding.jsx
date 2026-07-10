import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, Lock, UploadCloud, Check, UserCircle } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EmployeeOnboarding() {
  const [user] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) || {}; } catch(e) { return {}; }
  });
  const [onboardingData, setOnboardingData] = useState(null);
  const [loading, setLoading] = useState(true);

  const getDocsStatus = (docsString) => {
    try {
      const parsed = JSON.parse(docsString) || {};
      return {
        aadhar: false, photo: false, parents: false,
        pan: false, education: false, experience: false,
        bank: false, signedOffer: false, medical: false,
        ...parsed
      };
    } catch {
      return {
        aadhar: false, photo: false, parents: false,
        pan: false, education: false, experience: false,
        bank: false, signedOffer: false, medical: false
      };
    }
  };

  useEffect(() => {
    fetchOnboardingStatus();
  }, [user]);

  const fetchOnboardingStatus = async () => {
    if (!user || !user.id) return;
    try {
      const res = await axios.get(`/api/onboarding/${user.id}`);
      setOnboardingData(res.data.data);
    } catch (err) {
      console.error('Error fetching onboarding status:', err);
      toast.error('Failed to load onboarding status');
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentUpload = async (docType) => {
    if (!onboardingData) return;
    
    const currentDocs = getDocsStatus(onboardingData.step_1_docs);
    currentDocs[docType] = true;
    
    try {
      const res = await axios.put(`/api/onboarding/${user.id}`, {
        ...onboardingData,
        step_1_docs: currentDocs
      });
      setOnboardingData(res.data.data);
      toast.success(`Document uploaded successfully`);
    } catch (err) {
      toast.error('Upload failed');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading onboarding track...</div>;
  if (!onboardingData) return null;

  const docsStatus = getDocsStatus(onboardingData.step_1_docs);
  const isStep1Done = Object.values(docsStatus).every(status => status === true);

  const steps = [
    { 
      id: 1, 
      title: 'Document Submission', 
      desc: 'Upload all 9 required onboarding documents',
      done: isStep1Done,
      isActive: true 
    },
    { 
      id: 2, 
      title: 'Background Verification', 
      desc: 'Admin approval required for background check',
      done: !!onboardingData.step_2_bg,
      isActive: isStep1Done 
    },
    { 
      id: 3, 
      title: 'Offer Letter Generation', 
      desc: 'Generate and send the offer letter',
      done: !!onboardingData.step_3_offer,
      isActive: !!onboardingData.step_2_bg
    },
    { 
      id: 4, 
      title: 'HR Orientation', 
      desc: 'Conduct initial HR orientation and policy sign-off',
      done: !!onboardingData.step_4_orientation,
      isActive: !!onboardingData.step_3_offer
    },
    { 
      id: 5, 
      title: 'Final Assignment', 
      desc: 'Assign first project and allocate workstation',
      done: !!onboardingData.step_5_assignment,
      isActive: !!onboardingData.step_4_orientation
    }
  ];

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex justify-between items-start border-b border-gray-50 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
            <UserCircle size={24} className="text-blue-500" />
            My Onboarding Track
          </h2>
          <p className="text-sm text-gray-500">Complete your documents and track your onboarding progress.</p>
        </div>
        <button 
          onClick={fetchOnboardingStatus}
          className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-semibold rounded-lg transition-colors"
        >
          Refresh Progress
        </button>
      </div>

      <div className="max-w-2xl mx-auto space-y-4">
        {steps.map((step, index) => {
          const isLocked = !step.isActive;
          
          if (isLocked) return null;
          
          return (
            <div key={step.id} className={`w-full rounded-xl border text-left transition-all ${step.done ? 'bg-emerald-50/50 border-emerald-100' : 'bg-white border-blue-100 shadow-sm border-2'}`}>
              <div className="w-full flex items-center gap-4 p-4">
                <CheckCircle2 size={24} className={step.done ? 'text-emerald-500 fill-emerald-50' : 'text-blue-400'} />
                <div className="flex-1 text-left">
                  <p className={`text-base font-bold ${step.done ? 'text-emerald-800/80' : 'text-blue-900'}`}>{step.title}</p>
                  <p className={`text-xs mt-0.5 ${step.done ? 'text-emerald-600/80' : 'text-gray-500'}`}>{step.desc}</p>
                </div>
                {!step.done && index > 0 && (
                  <span className="text-xs font-bold text-orange-600 bg-orange-50 px-3 py-1.5 rounded-full border border-orange-100 animate-pulse">Pending Admin Action</span>
                )}
              </div>
              
              {index === 0 && !step.done && (
                <div className="px-12 pb-5 pt-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {[
                    { id: 'aadhar', label: 'Aadhar Card' },
                    { id: 'photo', label: 'Profile Photo' },
                    { id: 'parents', label: 'Parents Details' },
                    { id: 'pan', label: 'PAN Card' },
                    { id: 'education', label: 'Certificates' },
                    { id: 'experience', label: 'Experience Ltr' },
                    { id: 'bank', label: 'Bank Details' },
                    { id: 'signedOffer', label: 'Signed Offer' },
                    { id: 'medical', label: 'Medical Cert' }
                  ].map((doc) => {
                    const isUploaded = docsStatus[doc.id];
                    return (
                      <button 
                        key={doc.id}
                        onClick={() => handleDocumentUpload(doc.id)}
                        disabled={isUploaded}
                        className={`flex justify-center items-center gap-1.5 px-3 py-3 text-xs font-bold rounded-xl border transition-all ${isUploaded ? 'bg-emerald-50 text-emerald-700 border-emerald-200 cursor-not-allowed shadow-inner' : 'bg-white text-blue-600 border-blue-200 hover:bg-blue-50 hover:border-blue-300 cursor-pointer shadow-sm hover:shadow'}`}
                      >
                        {isUploaded ? <Check size={16} /> : <UploadCloud size={16} />}
                        {isUploaded ? `Uploaded ${doc.label}` : `Upload ${doc.label}`}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
