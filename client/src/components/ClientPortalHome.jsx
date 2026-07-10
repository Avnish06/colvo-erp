import React from 'react';
import { LayoutDashboard, FileText, FileSignature, CreditCard } from 'lucide-react';

const ClientPortalHome = () => {
  return (
    <div className="p-6">
      <div className="mb-8">
        <h2 className="text-3xl font-black text-slate-800">Welcome to your Portal!</h2>
        <p className="text-slate-500 mt-2">Manage your projects, view proposals, and sign contracts.</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="p-3 bg-indigo-100 text-indigo-600 rounded-xl w-max mb-4">
            <FileText size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">My Proposals</h3>
          <p className="text-slate-500 text-sm mt-1 mb-4">View and approve your project proposals.</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="p-3 bg-emerald-100 text-emerald-600 rounded-xl w-max mb-4">
            <FileSignature size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">My Contracts</h3>
          <p className="text-slate-500 text-sm mt-1 mb-4">Review and e-sign your active contracts.</p>
        </div>
        
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow">
          <div className="p-3 bg-blue-100 text-blue-600 rounded-xl w-max mb-4">
            <CreditCard size={24} />
          </div>
          <h3 className="text-lg font-bold text-slate-800">My Invoices</h3>
          <p className="text-slate-500 text-sm mt-1 mb-4">View billing history and pay invoices.</p>
        </div>
      </div>
    </div>
  );
};

export default ClientPortalHome;
