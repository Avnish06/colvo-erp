import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { CheckCircle2, UserPlus, LogOut, ArrowRight, ClipboardList, HelpCircle, FileText, UploadCloud, Lock, Check, UserCircle, Users } from 'lucide-react';
import OfferLetterGenerator from './OfferLetterGenerator';
import toast from 'react-hot-toast';

export default function OnboardingOffboarding() {
  const [activeSubTab, setActiveSubTab] = useState('onboard');
  const [showOfferLetter, setShowOfferLetter] = useState(false);
  
  // Admin Data
  const [pendingEmployees, setPendingEmployees] = useState([]);
  const [pendingOffboarding, setPendingOffboarding] = useState([]);
  
  const [selectedEmployeeId, setSelectedEmployeeId] = useState(null);
  const [selectedOffboardingId, setSelectedOffboardingId] = useState(null);
  
  const [onboardingData, setOnboardingData] = useState(null);
  const [offboardingData, setOffboardingData] = useState(null);
  
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [activeSubTab]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeSubTab === 'onboard') {
        const res = await axios.get('/api/onboarding');
        setPendingEmployees(res.data.data);
        if (res.data.data.length > 0 && !selectedEmployeeId) {
          handleSelectEmployee(res.data.data[0].user_id, 'onboard');
        }
      } else {
        const res = await axios.get('/api/offboarding');
        setPendingOffboarding(res.data.data);
        if (res.data.data.length > 0 && !selectedOffboardingId) {
          handleSelectEmployee(res.data.data[0].user_id, 'offboard');
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectEmployee = async (userId, type) => {
    try {
      if (type === 'onboard') {
        setSelectedEmployeeId(userId);
        const res = await axios.get(`/api/onboarding/${userId}`);
        setOnboardingData(res.data.data);
      } else {
        setSelectedOffboardingId(userId);
        const res = await axios.get(`/api/offboarding/${userId}`);
        setOffboardingData(res.data.data);
      }
    } catch (err) {
      toast.error('Failed to load employee data');
    }
  };

  const getDocsStatus = (docsString) => {
    try { return JSON.parse(docsString) || { aadhar: false, photo: false, parents: false }; } 
    catch { return { aadhar: false, photo: false, parents: false }; }
  };

  const toggleOnboard = async (stepKey, stepIndex) => {
    if (!onboardingData) return;
    if (stepIndex === 0) return;

    const stepsArr = [
      { key: 'step_1_docs', done: getDocsStatus(onboardingData.step_1_docs).aadhar && getDocsStatus(onboardingData.step_1_docs).photo && getDocsStatus(onboardingData.step_1_docs).parents },
      { key: 'step_2_bg', done: onboardingData.step_2_bg },
      { key: 'step_3_offer', done: onboardingData.step_3_offer },
      { key: 'step_4_orientation', done: onboardingData.step_4_orientation },
      { key: 'step_5_assignment', done: onboardingData.step_5_assignment }
    ];

    if (stepIndex > 0 && !stepsArr[stepIndex - 1].done) {
      toast.error("Previous step must be completed first.");
      return;
    }

    const currentVal = onboardingData[stepKey];
    const newData = { ...onboardingData, [stepKey]: !currentVal };
    
    if (currentVal) {
      if (stepIndex <= 1) newData.step_2_bg = false;
      if (stepIndex <= 2) newData.step_3_offer = false;
      if (stepIndex <= 3) newData.step_4_orientation = false;
      if (stepIndex <= 4) newData.step_5_assignment = false;
    }

    if (stepKey === 'step_3_offer' && !currentVal) {
      setShowOfferLetter(true);
    }

    try {
      const res = await axios.put(`/api/onboarding/${selectedEmployeeId}`, newData);
      setOnboardingData(res.data.data);
      toast.success('Step updated');
    } catch (err) {
      toast.error('Failed to update step');
    }
  };

  const toggleOffboard = async (stepKey, stepIndex) => {
    if (!offboardingData) return;

    const stepsArr = [
      { key: 'step_1_resignation', done: offboardingData.step_1_resignation },
      { key: 'step_2_assets', done: offboardingData.step_2_assets },
      { key: 'step_3_revoke', done: offboardingData.step_3_revoke },
      { key: 'step_4_settlement', done: offboardingData.step_4_settlement },
      { key: 'step_5_certificates', done: offboardingData.step_5_certificates }
    ];

    if (stepIndex > 0 && !stepsArr[stepIndex - 1].done) {
      toast.error("Previous step must be completed first.");
      return;
    }

    const currentVal = offboardingData[stepKey];
    const newData = { ...offboardingData, [stepKey]: !currentVal };

    if (currentVal) {
      if (stepIndex <= 0) newData.step_1_resignation = false;
      if (stepIndex <= 1) newData.step_2_assets = false;
      if (stepIndex <= 2) newData.step_3_revoke = false;
      if (stepIndex <= 3) newData.step_4_settlement = false;
      if (stepIndex <= 4) newData.step_5_certificates = false;
    }

    try {
      const res = await axios.put(`/api/offboarding/${selectedOffboardingId}`, newData);
      setOffboardingData(res.data.data);
      toast.success('Offboarding step updated');
    } catch (err) {
      toast.error('Failed to update step');
    }
  };

  if (loading) return <div className="p-8 text-center text-gray-500">Loading tracking system...</div>;

  return (
    <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
      <div className="flex justify-between items-center border-b border-gray-50 pb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">Onboarding & Exit Management</h2>
          <p className="text-sm text-gray-500">Track task list workflows for new hire onboarding and employee offboarding</p>
        </div>
        <div className="flex gap-2 bg-gray-100 p-1 rounded-xl">
          <button
            onClick={() => setActiveSubTab('onboard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'onboard' ? 'bg-white text-blue-600 shadow-sm' : 'text-gray-500'}`}
          >
            <UserPlus size={14} className="inline mr-1" /> Onboarding
          </button>
          <button
            onClick={() => setActiveSubTab('offboard')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeSubTab === 'offboard' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-500'}`}
          >
            <LogOut size={14} className="inline mr-1" /> Exit Process
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
        <div className="md:col-span-1 border-r border-gray-100 pr-4 space-y-4">
          <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
            <Users size={16} className="text-gray-400" />
            Pending {activeSubTab === 'onboard' ? 'Onboarding' : 'Offboarding'}
          </h3>
          {activeSubTab === 'onboard' ? (
            pendingEmployees.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No employees pending onboarding.</p>
            ) : (
              <div className="space-y-2">
                {pendingEmployees.map(emp => (
                  <button 
                    key={emp.user_id}
                    onClick={() => handleSelectEmployee(emp.user_id, 'onboard')}
                    className={`w-full text-left p-3 rounded-xl border text-sm font-semibold transition-all ${selectedEmployeeId === emp.user_id ? 'bg-blue-50 border-blue-200 text-blue-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {emp.name}
                    <div className="text-xs text-gray-400 mt-0.5">{emp.email}</div>
                  </button>
                ))}
              </div>
            )
          ) : (
            pendingOffboarding.length === 0 ? (
              <p className="text-xs text-gray-500 italic">No employees pending offboarding.</p>
            ) : (
              <div className="space-y-2">
                {pendingOffboarding.map(emp => (
                  <button 
                    key={emp.user_id}
                    onClick={() => handleSelectEmployee(emp.user_id, 'offboard')}
                    className={`w-full text-left p-3 rounded-xl border text-sm font-semibold transition-all ${selectedOffboardingId === emp.user_id ? 'bg-red-50 border-red-200 text-red-700' : 'bg-white border-gray-200 text-gray-600 hover:bg-gray-50'}`}
                  >
                    {emp.name}
                    <div className="text-xs text-gray-400 mt-0.5">{emp.email}</div>
                  </button>
                ))}
              </div>
            )
          )}
        </div>

        <div className="md:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-bold text-gray-700 flex items-center gap-1.5">
              <ClipboardList size={16} className="text-gray-400" />
              {activeSubTab === 'onboard' ? 'Review Checklist' : 'Employee Exit Checklist'}
            </h3>
          </div>

          {activeSubTab === 'onboard' ? (
            onboardingData ? (() => {
              const docsStatus = getDocsStatus(onboardingData.step_1_docs);
              const isStep1Done = docsStatus.aadhar && docsStatus.photo && docsStatus.parents;

              const steps = [
                { id: 1, key: 'step_1_docs', title: 'Document Submission', desc: 'Employee must upload Aadhar, Photo, and Parents credentials', done: isStep1Done, isActive: true },
                { id: 2, key: 'step_2_bg', title: 'Background Verification', desc: 'Verify employee background (Admin action)', done: !!onboardingData.step_2_bg, isActive: isStep1Done },
                { id: 3, key: 'step_3_offer', title: 'Offer Letter Generation', desc: 'Generate and send the offer letter', done: !!onboardingData.step_3_offer, isActive: !!onboardingData.step_2_bg },
                { id: 4, key: 'step_4_orientation', title: 'HR Orientation', desc: 'Conduct initial HR orientation and policy sign-off', done: !!onboardingData.step_4_orientation, isActive: !!onboardingData.step_3_offer },
                { id: 5, key: 'step_5_assignment', title: 'Final Assignment', desc: 'Assign first project and allocate workstation', done: !!onboardingData.step_5_assignment, isActive: !!onboardingData.step_4_orientation }
              ];

              return steps.map((item, index) => {
                const isLocked = !item.isActive;
                return (
                  <div key={item.id} className={`w-full rounded-xl border text-left transition-all ${item.done ? 'bg-emerald-50/50 border-emerald-100' : isLocked ? 'bg-gray-50 border-gray-100 opacity-60' : 'bg-white border-blue-100 shadow-sm'}`}>
                    <button
                      onClick={() => toggleOnboard(item.key, index)}
                      className={`w-full flex items-center gap-4 p-4 ${isLocked || index === 0 ? 'cursor-not-allowed' : 'hover:bg-black/5 rounded-xl'}`}
                      disabled={isLocked || index === 0}
                    >
                      {isLocked ? (
                        <Lock size={20} className="text-gray-400" />
                      ) : (
                        <CheckCircle2 size={20} className={item.done ? 'text-emerald-500 fill-emerald-50' : 'text-gray-300'} />
                      )}
                      <div className="flex-1 text-left">
                        <p className={`text-sm font-bold ${item.done ? 'text-emerald-800/80' : isLocked ? 'text-gray-500' : 'text-gray-900'}`}>{item.title}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                      </div>
                      {index === 0 && !item.done && (
                         <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full">Waiting on Employee</span>
                      )}
                    </button>
                    
                    {index === 0 && (
                      <div className="px-12 pb-4 pt-2 flex flex-wrap gap-2">
                        {['aadhar', 'photo', 'parents'].map((docType) => {
                          const labels = { aadhar: 'Aadhar Card', photo: 'Profile Photo', parents: 'Parents Credentials' };
                          const isUploaded = docsStatus[docType];
                          return (
                            <div key={docType} className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-all ${isUploaded ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-400 border-gray-200'}`}>
                              {isUploaded ? <Check size={14} /> : <UploadCloud size={14} />}
                              {labels[docType]} {isUploaded ? '(Received)' : '(Pending)'}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              });
            })() : (
              <p className="text-sm text-gray-500 italic">Select an employee from the list to review their onboarding checklist.</p>
            )
          ) : (
            offboardingData ? (() => {
              const steps = [
                { id: 1, key: 'step_1_resignation', title: 'Resignation Letter', desc: 'Acknowledge formal resignation letter', done: !!offboardingData.step_1_resignation, isActive: true },
                { id: 2, key: 'step_2_assets', title: 'Asset Recovery', desc: 'IT Asset recovery (Laptop, Access Card, ID)', done: !!offboardingData.step_2_assets, isActive: !!offboardingData.step_1_resignation },
                { id: 3, key: 'step_3_revoke', title: 'Revoke Access', desc: 'Revoke cloud account accesses (Email, Slack, ERP)', done: !!offboardingData.step_3_revoke, isActive: !!offboardingData.step_2_assets },
                { id: 4, key: 'step_4_settlement', title: 'Final Settlement', desc: 'Execute final settlement and dues check', done: !!offboardingData.step_4_settlement, isActive: !!offboardingData.step_3_revoke },
                { id: 5, key: 'step_5_certificates', title: 'Issue Certificates', desc: 'Issue Relieving & Experience certificates', done: !!offboardingData.step_5_certificates, isActive: !!offboardingData.step_4_settlement }
              ];

              return steps.map((item, index) => {
                const isLocked = !item.isActive;
                return (
                  <button
                    key={item.id}
                    onClick={() => toggleOffboard(item.key, index)}
                    className={`w-full flex items-center gap-4 p-4 rounded-xl border text-left transition-all ${item.done ? 'bg-red-50 border-red-200' : isLocked ? 'bg-gray-50 border-gray-100 opacity-60 cursor-not-allowed' : 'bg-white border-red-100 shadow-sm hover:bg-red-50'}`}
                    disabled={isLocked}
                  >
                    {isLocked ? (
                      <Lock size={20} className="text-gray-400" />
                    ) : (
                      <CheckCircle2 size={20} className={item.done ? 'text-red-500 fill-red-50' : 'text-gray-300'} />
                    )}
                    <div className="flex-1 text-left">
                      <p className={`text-sm font-bold ${item.done ? 'text-red-800/80 line-through' : isLocked ? 'text-gray-500' : 'text-gray-900'}`}>{item.title}</p>
                      <p className="text-xs text-gray-500 mt-0.5">{item.desc}</p>
                    </div>
                  </button>
                );
              });
            })() : (
              <p className="text-sm text-gray-500 italic">Select an employee from the list to review their offboarding checklist.</p>
            )
          )}
        </div>
      </div>
      {showOfferLetter && <OfferLetterGenerator onClose={() => setShowOfferLetter(false)} />}
    </div>
  );
}
