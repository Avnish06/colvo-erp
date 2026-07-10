import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Edit, RefreshCw, Printer, Info, Save } from 'lucide-react';
import { toast } from 'react-toastify';

export default function SalarySlipGenerator({ payroll = null, onClose }) {
  const [slip, setSlip] = useState({
    companyName: 'HATBALIYA TECHNOLOGIES',
    tagline: 'Your Trusted Technology Partner',
    address: 'A-Block, Sector-63, Noida, Uttar Pradesh - 201301',
    phone: '+91 98765 43210',
    email: 'info@hatbaliyatechnologies.com',
    website: 'www.hatbaliyatechnologies.com',
    gstin: '09ABCDE1234F1Z5',
    monthYear: 'May 2024',
    employeeId: 'HT/EMP/2024/015',
    joiningDate: '01-Jan-2023',
    department: 'IT - Development',
    designation: 'Software Developer',
    payMode: 'Bank Transfer',
    workingDays: 26,
    paymentDate: '31-May-2024',
    employeeName: 'Aashu Sharma',
    fatherName: 'Rajesh Sharma',
    employeeCode: 'HT015',
    location: 'Noida',
    bankName: 'HDFC Bank',
    bankAcc: '50200012345678',
    ifscCode: 'HDFC0001234',
    panNo: 'ABCPS1234D',
    uanNo: '101234567894',
    
    // Earnings
    basicSalary: 35000,
    hra: 14000,
    conveyance: 2000,
    specialAllowance: 6000,
    medicalAllowance: 1250,
    lta: 1000,
    otherAllowance: 750,

    // Deductions
    pf: 4200,
    esi: 135,
    profTax: 200,
    tds: 5250,
    leaveDeduction: 0,
    otherDeduction: 215,
  });

  useEffect(() => {
    if (payroll) {
      setSlip(prev => ({
        ...prev,
        employeeName: payroll.employee_name || prev.employeeName,
        monthYear: payroll.month_year || prev.monthYear,
        basicSalary: Number(payroll.basic_salary) || prev.basicSalary,
        hra: Number(payroll.hra) || prev.hra,
        conveyance: Number(payroll.da) || prev.conveyance, // da mapped to conveyance
        specialAllowance: Number(payroll.bonus) || prev.specialAllowance, // bonus mapped to special
        otherDeduction: Number(payroll.deductions) || prev.otherDeduction,
      }));
    }
  }, [payroll]);

  const [isEditing, setIsEditing] = useState(false);

  const handleFieldChange = (e) => {
    const { name, value } = e.target;
    setSlip(prev => ({
      ...prev,
      [name]: ['basicSalary', 'hra', 'conveyance', 'specialAllowance', 'medicalAllowance', 'lta', 'otherAllowance', 'pf', 'esi', 'profTax', 'tds', 'leaveDeduction', 'otherDeduction', 'workingDays'].includes(name)
        ? Number(value) || 0
        : value
    }));
  };

  const totalEarnings = 
    slip.basicSalary + 
    slip.hra + 
    slip.conveyance + 
    slip.specialAllowance + 
    slip.medicalAllowance + 
    slip.lta + 
    slip.otherAllowance;

  const totalDeductions = 
    slip.pf + 
    slip.esi + 
    slip.profTax + 
    slip.tds + 
    slip.leaveDeduction + 
    slip.otherDeduction;

  const netPay = totalEarnings - totalDeductions;

  // Convert numbers to words (Rupees)
  const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    if ((num = num.toString()).length > 9) return 'overflow';
    let n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return ''; 
    let str = '';
    str += (Number(n[1]) !== 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (Number(n[2]) !== 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (Number(n[3]) !== 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (Number(n[4]) !== 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (Number(n[5]) !== 0) ? ((str !== '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str ? str + 'Rupees Only' : 'Zero Rupees';
  };

  const handleDownloadPDF = async () => {
    const element = document.getElementById('salary-slip-content');
    if (!element) return;
    toast.info('Generating PDF quality slip...');
    
    try {
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
      });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgWidth = 210; // A4 size width in mm
      const pageHeight = 295; // A4 size height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      
      pdf.addImage(imgData, 'PNG', 0, 0, imgWidth, imgHeight);
      pdf.save(`Salary_Slip_${slip.employeeName.replace(/\s+/g, '_')}_${slip.monthYear}.pdf`);
      toast.success('Salary Slip PDF Downloaded!');
    } catch (e) {
      toast.error('Failed to generate PDF download.');
    }
  };

  return (
    <div className="bg-slate-900/60 backdrop-blur-sm fixed inset-0 z-50 overflow-y-auto p-4 md:p-8 flex justify-center items-start">
      <div className="bg-white rounded-3xl w-full max-w-4xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-300">
        
        {/* Controls strip */}
        <div className="bg-slate-50 border-b border-gray-100 p-4 px-6 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span className="text-xl">🖨️</span>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">Interactive Salary Slip</h3>
              <p className="text-[11px] text-gray-500">Edit fields directly below to recalculate Net Pay instantly</p>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => setIsEditing(!isEditing)}
              className={`px-4 py-2 text-xs font-bold rounded-xl transition-all ${isEditing ? 'bg-indigo-600 text-white' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}
            >
              {isEditing ? <><Save size={13} className="inline mr-1" /> Save Changes</> : <><Edit size={13} className="inline mr-1" /> Edit Slip</>}
            </button>
            <button 
              onClick={handleDownloadPDF}
              className="px-4 py-2 text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl shadow-md transition-all flex items-center gap-1.5"
            >
              <Download size={13} /> Download PDF
            </button>
            <button onClick={onClose} className="px-4 py-2 text-xs font-bold bg-gray-200 text-gray-600 rounded-xl hover:bg-gray-300 transition-all">
              Close
            </button>
          </div>
        </div>

        {/* Print Content Area */}
        <div id="salary-slip-content" className="bg-white p-8 md:p-10 font-sans text-gray-800 text-[11px] leading-relaxed relative" style={{ width: '794px', minHeight: '1123px', margin: '0 auto' }}>
          
          {/* Top Banner Accent */}
          <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-r from-blue-700 to-indigo-900" />

          {/* Header */}
          <div className="flex justify-between items-start border-b border-gray-100 pb-6 mb-6">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="w-8 h-8 rounded-lg bg-indigo-900 text-white flex items-center justify-center font-black text-sm">H</span>
                <span className="text-xl font-black tracking-tight text-indigo-950">HATBALIYA <span className="text-blue-600 font-bold">TECHNOLOGIES</span></span>
              </div>
              <p className="text-[10px] text-gray-400 font-semibold italic -mt-1">{slip.tagline}</p>
              
              <div className="text-[10px] text-gray-500 space-y-0.5 pt-2">
                <p>📍 {slip.address}</p>
                <p>📞 {slip.phone} · ✉️ {slip.email}</p>
                <p>🌐 {slip.website} · <span className="font-bold">GSTIN:</span> {slip.gstin}</p>
              </div>
            </div>

            <div className="text-right space-y-2">
              <span className="inline-block bg-indigo-900 text-white px-5 py-2 font-black text-sm rounded-bl-2xl uppercase tracking-wider">Salary Slip</span>
              <div>
                <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">For the Month of</p>
                {isEditing ? (
                  <input type="text" name="monthYear" value={slip.monthYear} onChange={handleFieldChange} className="border px-2 py-0.5 rounded text-right w-28 mt-0.5" />
                ) : (
                  <p className="text-sm font-black text-blue-700">{slip.monthYear}</p>
                )}
              </div>
            </div>
          </div>

          {/* Metadata Tables */}
          <div className="grid grid-cols-2 gap-8 mb-6">
            
            {/* Employee info */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-100 grid grid-cols-3 gap-y-2">
              <span className="text-gray-400 font-semibold col-span-1">Employee Name</span>
              <span className="col-span-2 font-bold text-gray-900">: {isEditing ? <input name="employeeName" value={slip.employeeName} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.employeeName}</span>
              
              <span className="text-gray-400 font-semibold col-span-1">Father's Name</span>
              <span className="col-span-2 font-medium text-gray-700">: {isEditing ? <input name="fatherName" value={slip.fatherName} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.fatherName}</span>
              
              <span className="text-gray-400 font-semibold col-span-1">Employee Code</span>
              <span className="col-span-2 font-mono text-gray-700">: {isEditing ? <input name="employeeCode" value={slip.employeeCode} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.employeeCode}</span>
              
              <span className="text-gray-400 font-semibold col-span-1">Location</span>
              <span className="col-span-2 text-gray-700">: {isEditing ? <input name="location" value={slip.location} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.location}</span>
            </div>

            {/* General Work metadata */}
            <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-100 grid grid-cols-3 gap-y-1.5 h-fit">
              <span className="text-gray-400 font-semibold col-span-1">Employee ID</span>
              <span className="col-span-2 font-mono text-gray-700">: {isEditing ? <input name="employeeId" value={slip.employeeId} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.employeeId}</span>
              
              <span className="text-gray-400 font-semibold col-span-1">Date of Joining</span>
              <span className="col-span-2 text-gray-700">: {isEditing ? <input name="joiningDate" value={slip.joiningDate} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.joiningDate}</span>
              
              <span className="text-gray-400 font-semibold col-span-1">Department</span>
              <span className="col-span-2 text-gray-700">: {isEditing ? <input name="department" value={slip.department} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.department}</span>
              
              <span className="text-gray-400 font-semibold col-span-1">Designation</span>
              <span className="col-span-2 text-gray-700">: {isEditing ? <input name="designation" value={slip.designation} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.designation}</span>

              <span className="text-gray-400 font-semibold col-span-1">Pay Mode</span>
              <span className="col-span-2 text-gray-700">: {isEditing ? <input name="payMode" value={slip.payMode} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.payMode}</span>

              <span className="text-gray-400 font-semibold col-span-1">Working Days</span>
              <span className="col-span-2 text-gray-700">: {isEditing ? <input type="number" name="workingDays" value={slip.workingDays} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-20" /> : slip.workingDays}</span>

              <span className="text-gray-400 font-semibold col-span-1">Payment Date</span>
              <span className="col-span-2 text-gray-700">: {isEditing ? <input name="paymentDate" value={slip.paymentDate} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.paymentDate}</span>
            </div>
          </div>

          {/* Bank metadata table block */}
          <div className="bg-slate-50/50 p-4 rounded-xl border border-gray-100 grid grid-cols-4 gap-y-2 mb-6">
            <span className="text-gray-400 font-semibold">Bank Name</span>
            <span className="font-bold text-gray-700">: {isEditing ? <input name="bankName" value={slip.bankName} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.bankName}</span>

            <span className="text-gray-400 font-semibold pl-4">Bank A/C No.</span>
            <span className="font-mono text-gray-700">: {isEditing ? <input name="bankAcc" value={slip.bankAcc} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.bankAcc}</span>

            <span className="text-gray-400 font-semibold">IFSC Code</span>
            <span className="font-mono text-gray-700">: {isEditing ? <input name="ifscCode" value={slip.ifscCode} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.ifscCode}</span>

            <span className="text-gray-400 font-semibold pl-4">PAN No.</span>
            <span className="font-mono text-gray-700">: {isEditing ? <input name="panNo" value={slip.panNo} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.panNo}</span>

            <span className="text-gray-400 font-semibold">UAN No.</span>
            <span className="font-mono text-gray-700" colSpan={3}>: {isEditing ? <input name="uanNo" value={slip.uanNo} onChange={handleFieldChange} className="border px-1.5 py-0.5 rounded w-full" /> : slip.uanNo}</span>
          </div>

          {/* Earning & Deduction Side-by-side Table */}
          <div className="grid grid-cols-2 border border-gray-200 rounded-xl overflow-hidden mb-6">
            
            {/* Earnings Column */}
            <div className="border-r border-gray-200">
              <div className="bg-indigo-900 text-white font-bold p-2 px-4 flex justify-between uppercase">
                <span>Earnings Description</span>
                <span>Amount (₹)</span>
              </div>
              
              <div className="divide-y divide-gray-100">
                {[
                  { label: 'Basic Salary', name: 'basicSalary' },
                  { label: 'House Rent Allowance (HRA)', name: 'hra' },
                  { label: 'Conveyance Allowance', name: 'conveyance' },
                  { label: 'Special Allowance', name: 'specialAllowance' },
                  { label: 'Medical Allowance', name: 'medicalAllowance' },
                  { label: 'Leave Travel Allowance (LTA)', name: 'lta' },
                  { label: 'Other Allowance', name: 'otherAllowance' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 px-4 bg-white">
                    <span className="text-gray-600 font-semibold">{item.label}</span>
                    <span className="font-bold text-gray-800">
                      {isEditing ? (
                        <input type="number" name={item.name} value={slip[item.name]} onChange={handleFieldChange} className="border px-1 py-0.5 rounded w-20 text-right" />
                      ) : (
                        Number(slip[item.name]).toFixed(2)
                      )}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Deductions Column */}
            <div>
              <div className="bg-indigo-900 text-white font-bold p-2 px-4 flex justify-between uppercase">
                <span>Deductions Description</span>
                <span>Amount (₹)</span>
              </div>

              <div className="divide-y divide-gray-100">
                {[
                  { label: 'Provident Fund (PF)', name: 'pf' },
                  { label: 'Employee ESI', name: 'esi' },
                  { label: 'Professional Tax', name: 'profTax' },
                  { label: 'Income Tax (TDS)', name: 'tds' },
                  { label: 'Leave Deduction', name: 'leaveDeduction' },
                  { label: 'Other Deduction', name: 'otherDeduction' },
                ].map((item, idx) => (
                  <div key={idx} className="flex justify-between items-center p-2.5 px-4 bg-white">
                    <span className="text-gray-600 font-semibold">{item.label}</span>
                    <span className="font-bold text-gray-800">
                      {isEditing ? (
                        <input type="number" name={item.name} value={slip[item.name]} onChange={handleFieldChange} className="border px-1 py-0.5 rounded w-20 text-right" />
                      ) : (
                        Number(slip[item.name]).toFixed(2)
                      )}
                    </span>
                  </div>
                ))}
                {/* Empty rows to balance columns */}
                <div className="p-2.5 bg-white h-[35px]" />
              </div>
            </div>
          </div>

          {/* Totals Strip */}
          <div className="grid grid-cols-2 border border-gray-200 rounded-xl overflow-hidden mb-6 bg-slate-50 font-bold">
            <div className="border-r border-gray-200 p-3 px-4 flex justify-between uppercase text-indigo-900">
              <span>Total Earnings</span>
              <span>₹ {totalEarnings.toFixed(2)}</span>
            </div>
            <div className="p-3 px-4 flex justify-between uppercase text-indigo-900">
              <span>Total Deductions</span>
              <span>₹ {totalDeductions.toFixed(2)}</span>
            </div>
          </div>

          {/* Net pay segment */}
          <div className="border border-gray-200 rounded-xl overflow-hidden grid grid-cols-3 mb-6">
            
            {/* Highlighted Net Pay Card */}
            <div className="col-span-1 bg-blue-50/50 p-4 border-r border-gray-200 flex flex-col justify-center">
              <span className="text-indigo-900 font-bold uppercase tracking-wider">Net Pay</span>
              <span className="text-lg font-black text-indigo-950 mt-1">₹ {netPay.toLocaleString('en-IN')}.00</span>
              <span className="text-[9px] text-gray-400 font-semibold mt-0.5">({numberToWords(netPay)})</span>
            </div>

            {/* Calculations summaries */}
            <div className="col-span-2 p-4 space-y-2 font-semibold">
              <div className="flex justify-between text-gray-600">
                <span>Gross Earnings</span>
                <span className="text-gray-800">: ₹ {totalEarnings.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Total Deductions</span>
                <span className="text-gray-800">: ₹ {totalDeductions.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-indigo-900 pt-1 border-t border-dashed border-gray-200 font-bold">
                <span>Net Pay</span>
                <span>: ₹ {netPay.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer Signature segment */}
          <div className="flex justify-between items-end mt-12 pt-6">
            <div>
              <p className="font-bold text-gray-800">Amount in Words:</p>
              <p className="text-blue-800 font-black italic text-xs mt-0.5">Rupees {numberToWords(netPay)}</p>
            </div>

            <div className="text-center space-y-1">
              <div className="font-mono text-xs italic text-gray-500 font-bold border-b border-gray-300 pb-1">Aashu S.</div>
              <p className="font-bold text-[9px] uppercase tracking-wider text-gray-400">Authorized Signatory</p>
            </div>
          </div>

          {/* Bottom disclaimer */}
          <div className="text-center text-[9px] text-gray-400 mt-12 border-t border-gray-100 pt-4">
            <p>This is a system generated salary slip and does not require physical signature.</p>
            <p className="font-bold text-blue-700 mt-1">Thank you for your dedication and hard work!</p>
          </div>

          {/* Document Footer Bar */}
          <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-r from-blue-700 to-indigo-950 flex items-center justify-between px-8 text-white text-[9px]">
            <span>📞 +91 98765 43210</span>
            <span>✉️ info@hatbaliyatechnologies.com</span>
            <span>🌐 www.hatbaliyatechnologies.com</span>
          </div>
        </div>

      </div>
    </div>
  );
}
