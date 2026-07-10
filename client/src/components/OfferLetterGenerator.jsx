import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Edit, X, Save, FileText, CheckCircle2, ArrowRight } from 'lucide-react';
import { toast } from 'react-toastify';
import EmployeeOnboardingWizard from './EmployeeOnboardingWizard';

export default function OfferLetterGenerator({ onClose }) {
  const [isEditing, setIsEditing] = useState(true);
  const [hasDownloaded, setHasDownloaded] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [details, setDetails] = useState({
    companyName: localStorage.getItem('selected_company') || 'COMPANY NAME',
    companyAddress: 'A-Block, Sector-63, Noida, Uttar Pradesh - 201301',
    companyWebsite: 'www.example.com',
    candidateName: '',
    candidateAddress: '',
    candidateEmail: '',
    candidatePhone: '',
    jobTitle: 'Software Engineer',
    department: 'Engineering',
    joiningDate: new Date().toISOString().split('T')[0],
    salaryAmount: '5,00,000',
    reportingManager: 'Engineering Manager',
    probationPeriod: '3 Months',
    workLocation: 'Noida',
    issueDate: new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })
  });

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setDetails(prev => ({ ...prev, [name]: value }));
  };

  const handleDownload = async () => {
    const element = document.getElementById('offer-letter-content');
    if (!element) return;

    // Remove border/shadow for clean PDF rendering
    element.classList.remove('shadow-lg', 'border', 'rounded-2xl');

    try {
      const canvas = await html2canvas(element, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Offer_Letter_${details.candidateName.replace(/\s+/g, '_')}.pdf`);
      
      toast.success('Offer Letter downloaded successfully!');
      setHasDownloaded(true);
    } catch (err) {
      console.error('Error generating PDF:', err);
      toast.error('Failed to generate PDF.');
    } finally {
      // Restore classes
      element.classList.add('shadow-lg', 'border', 'rounded-2xl');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 md:p-8 backdrop-blur-sm">
      <div className="bg-gray-50 rounded-3xl w-full max-w-6xl h-full max-h-[90vh] flex flex-col overflow-hidden shadow-2xl">
        
        {/* Header */}
        <div className="bg-white px-6 py-4 flex justify-between items-center border-b">
          <div className="flex items-center gap-3">
            <div className="bg-blue-100 p-2 rounded-xl text-blue-600">
              <FileText size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Offer Letter Generator</h2>
              <p className="text-sm text-gray-500">Create, preview, and download custom offer letters.</p>
            </div>
          </div>
          <div className="flex gap-3">
            {hasDownloaded && (
              <button
                onClick={() => setShowWizard(true)}
                className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-colors font-medium text-sm shadow-md shadow-emerald-200 animate-pulse"
              >
                Launch Candidate Portal <ArrowRight size={16} />
              </button>
            )}
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors font-medium text-sm"
            >
              {isEditing ? <><Save size={16} /> Preview Letter</> : <><Edit size={16} /> Edit Details</>}
            </button>
            {!isEditing && (
              <button
                onClick={handleDownload}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium text-sm shadow-md shadow-blue-200"
              >
                <Download size={16} /> Download PDF
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-full transition-colors"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col md:flex-row gap-8">
          
          {/* Editable Form Panel */}
          {isEditing && (
            <div className="w-full md:w-1/3 bg-white p-6 rounded-2xl border shadow-sm space-y-6 h-fit shrink-0">
              <h3 className="font-bold text-gray-900 border-b pb-2">Candidate Details</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Full Name</label>
                  <input type="text" name="candidateName" value={details.candidateName} onChange={handleFieldChange} className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none" placeholder="John Doe" />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Address</label>
                  <input type="text" name="candidateAddress" value={details.candidateAddress} onChange={handleFieldChange} className="w-full p-2.5 text-sm border rounded-lg focus:ring-2 focus:ring-blue-100 focus:border-blue-500 transition-all outline-none" placeholder="123 Main St, City" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Email</label>
                    <input type="email" name="candidateEmail" value={details.candidateEmail} onChange={handleFieldChange} className="w-full p-2.5 text-sm border rounded-lg outline-none" placeholder="john@email.com" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Phone</label>
                    <input type="text" name="candidatePhone" value={details.candidatePhone} onChange={handleFieldChange} className="w-full p-2.5 text-sm border rounded-lg outline-none" placeholder="+91 9876543210" />
                  </div>
                </div>
              </div>

              <h3 className="font-bold text-gray-900 border-b pb-2 mt-6">Offer Details</h3>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Job Title</label>
                    <input type="text" name="jobTitle" value={details.jobTitle} onChange={handleFieldChange} className="w-full p-2.5 text-sm border rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Department</label>
                    <input type="text" name="department" value={details.department} onChange={handleFieldChange} className="w-full p-2.5 text-sm border rounded-lg outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">CTC (Annual Salary)</label>
                    <input type="text" name="salaryAmount" value={details.salaryAmount} onChange={handleFieldChange} className="w-full p-2.5 text-sm border rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Joining Date</label>
                    <input type="date" name="joiningDate" value={details.joiningDate} onChange={handleFieldChange} className="w-full p-2.5 text-sm border rounded-lg outline-none" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Reporting Manager</label>
                    <input type="text" name="reportingManager" value={details.reportingManager} onChange={handleFieldChange} className="w-full p-2.5 text-sm border rounded-lg outline-none" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-500 mb-1 block">Work Location</label>
                    <input type="text" name="workLocation" value={details.workLocation} onChange={handleFieldChange} className="w-full p-2.5 text-sm border rounded-lg outline-none" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 mb-1 block">Probation Period</label>
                  <input type="text" name="probationPeriod" value={details.probationPeriod} onChange={handleFieldChange} className="w-full p-2.5 text-sm border rounded-lg outline-none" />
                </div>
              </div>
            </div>
          )}

          {/* Letter Preview Panel */}
          <div className="flex-1 flex justify-center">
            <div 
              id="offer-letter-content" 
              className="bg-white p-12 shadow-lg border rounded-2xl text-gray-800 text-[15px] leading-relaxed max-w-[210mm] w-full shrink-0 h-fit"
            >
              {/* Letterhead Header */}
              <div className="border-b-2 border-blue-900 pb-6 mb-8 flex justify-between items-end">
                <div>
                  <h1 className="text-3xl font-black text-blue-900 uppercase tracking-tight">{details.companyName}</h1>
                  <p className="text-sm text-gray-500 mt-1">{details.companyAddress}</p>
                  <p className="text-sm text-blue-600">{details.companyWebsite}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-600">Date: {details.issueDate}</p>
                  <p className="text-sm text-gray-500">Ref: {details.companyName.substring(0,3).toUpperCase()}/OL/{new Date().getFullYear()}/{(Math.floor(Math.random() * 900) + 100)}</p>
                </div>
              </div>

              {/* Letter Body */}
              <div className="space-y-6">
                <div>
                  <p className="font-bold">To,</p>
                  <p className="font-bold text-lg">{details.candidateName || '[Candidate Name]'}</p>
                  <p className="text-gray-600 whitespace-pre-wrap">{details.candidateAddress || '[Candidate Address]'}</p>
                  <p className="text-gray-600">{details.candidateEmail}</p>
                  <p className="text-gray-600">{details.candidatePhone}</p>
                </div>

                <div>
                  <p className="font-bold text-lg underline underline-offset-4 decoration-gray-300">Subject: Offer of Employment</p>
                </div>

                <p>Dear <span className="font-bold">{details.candidateName ? details.candidateName.split(' ')[0] : '[Name]'}</span>,</p>

                <p>
                  Following our recent discussions, we are delighted to offer you the position of <span className="font-bold text-blue-900">{details.jobTitle}</span> at <span className="font-bold">{details.companyName}</span>. We were highly impressed with your background and skills, and we believe you will be a great addition to our <span className="font-bold">{details.department}</span> team.
                </p>

                <p>
                  As discussed, your starting date will be <span className="font-bold text-blue-900">{new Date(details.joiningDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}</span>, and your work location will be based out of our <span className="font-bold">{details.workLocation}</span> office. You will be reporting directly to the <span className="font-bold">{details.reportingManager}</span>.
                </p>

                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 my-4">
                  <h4 className="font-bold text-gray-900 mb-2">Key Terms of Employment:</h4>
                  <ul className="list-disc pl-5 space-y-2 text-sm text-gray-700">
                    <li><span className="font-semibold text-gray-900">Remuneration:</span> Your Annual Cost to Company (CTC) will be <span className="font-bold text-emerald-700">₹{details.salaryAmount}</span>, subject to standard statutory deductions.</li>
                    <li><span className="font-semibold text-gray-900">Probation:</span> You will be on a probation period of <span className="font-bold">{details.probationPeriod}</span> from your date of joining.</li>
                    <li><span className="font-semibold text-gray-900">Working Hours:</span> Standard company working hours apply, as outlined in the employee handbook.</li>
                  </ul>
                </div>

                <p>
                  This offer is contingent upon the successful completion of a background check and verification of your employment documents. Please sign and return a copy of this letter to indicate your formal acceptance of this offer.
                </p>

                <p>
                  We are excited to welcome you to the <span className="font-bold">{details.companyName}</span> family and look forward to achieving great things together!
                </p>

                {/* Signatures */}
                <div className="pt-12 pb-8 flex justify-between items-end">
                  <div>
                    <div className="w-40 border-b-2 border-gray-400 mb-2"></div>
                    <p className="font-bold text-gray-900">Authorized Signatory</p>
                    <p className="text-sm text-gray-500">Human Resources</p>
                    <p className="text-sm text-gray-500">{details.companyName}</p>
                  </div>
                  <div className="text-right">
                    <div className="w-48 border-b-2 border-gray-400 mb-2 ml-auto"></div>
                    <p className="font-bold text-gray-900">Candidate Acceptance</p>
                    <p className="text-sm text-gray-500">Signature & Date</p>
                  </div>
                </div>

              </div>
              
              {/* Footer */}
              <div className="border-t border-gray-200 mt-4 pt-4 text-center">
                <p className="text-xs text-gray-400">This is a system generated document. For inquiries, contact HR.</p>
              </div>

            </div>
          </div>
        </div>
      </div>

      {showWizard && (
        <EmployeeOnboardingWizard 
          details={details} 
          onClose={() => {
            setShowWizard(false);
            onClose(); // close the offer letter generator too
          }} 
        />
      )}
    </div>
  );
}
