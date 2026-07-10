import React, { useState } from 'react';
import { DollarSign, Users, Briefcase, FileText, CheckCircle, ArrowRight, Activity, TrendingUp } from 'lucide-react';
import ExpenseTracker from './ExpenseTracker';
import CustomerManagement from './CustomerManagement';
import OnboardingOffboarding from './OnboardingOffboarding';
import ReportHistory from './ReportHistory';

export default function SystemWorkflowHub({ onNavigate }) {
  const [activeWorkflowNode, setActiveWorkflowNode] = useState('hub');

  if (activeWorkflowNode === 'expense') return <div className="space-y-4"><button onClick={() => setActiveWorkflowNode('hub')} className="text-xs font-bold text-blue-600 hover:underline">← Back to Hub</button><ExpenseTracker /></div>;
  if (activeWorkflowNode === 'crm') return <div className="space-y-4"><button onClick={() => setActiveWorkflowNode('hub')} className="text-xs font-bold text-blue-600 hover:underline">← Back to Hub</button><CustomerManagement onNavigate={onNavigate} /></div>;
  if (activeWorkflowNode === 'employee') return <div className="space-y-4"><button onClick={() => setActiveWorkflowNode('hub')} className="text-xs font-bold text-blue-600 hover:underline">← Back to Hub</button><OnboardingOffboarding /></div>;
  if (activeWorkflowNode === 'reports') return <div className="space-y-4"><button onClick={() => setActiveWorkflowNode('hub')} className="text-xs font-bold text-blue-600 hover:underline">← Back to Hub</button><ReportHistory /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
          <Activity size={24} className="text-indigo-600" /> Complete System Workflow
        </h2>
        <p className="text-sm text-gray-500">Interactive overview mapping operational flows across company dashboards</p>
      </div>

      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-sm">
        {/* Interactive workflow diagram */}
        <div className="relative flex flex-col md:flex-row items-center justify-center gap-6 py-12 max-w-5xl mx-auto">
          
          {/* Node 1: Expense */}
          <button
            onClick={() => setActiveWorkflowNode('expense')}
            className="flex flex-col items-center bg-green-50 border-2 border-green-200 rounded-2xl p-6 text-center hover:scale-[1.03] transition-all hover:shadow-lg w-52 shrink-0 group"
          >
            <div className="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center text-white text-lg font-bold mb-3 shadow-md">
              <DollarSign size={20} />
            </div>
            <p className="font-bold text-green-950 text-sm">Expense Tracker</p>
            <p className="text-xs text-green-700/80 mt-1">Logs & operational budgets</p>
          </button>

          <ArrowRight size={24} className="text-gray-300 rotate-90 md:rotate-0" />

          {/* Node 2: Client Module */}
          <button
            onClick={() => setActiveWorkflowNode('crm')}
            className="flex flex-col items-center bg-blue-50 border-2 border-blue-200 rounded-2xl p-6 text-center hover:scale-[1.03] transition-all hover:shadow-lg w-52 shrink-0 group"
          >
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center text-white text-lg font-bold mb-3 shadow-md">
              <Briefcase size={20} />
            </div>
            <p className="font-bold text-blue-950 text-sm">Client Module</p>
            <p className="text-xs text-blue-700/80 mt-1">Proposal & Client Approval</p>
          </button>

          <ArrowRight size={24} className="text-gray-300 rotate-90 md:rotate-0" />

          {/* Node 3: Employee Management */}
          <button
            onClick={() => setActiveWorkflowNode('employee')}
            className="flex flex-col items-center bg-amber-50 border-2 border-amber-200 rounded-2xl p-6 text-center hover:scale-[1.03] transition-all hover:shadow-lg w-52 shrink-0 group"
          >
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center text-white text-lg font-bold mb-3 shadow-md">
              <Users size={20} />
            </div>
            <p className="font-bold text-amber-950 text-sm">Employee Management</p>
            <p className="text-xs text-amber-700/80 mt-1">Onboarding & Exit Process</p>
          </button>

          <ArrowRight size={24} className="text-gray-300 rotate-90 md:rotate-0" />

          {/* Node 4: Reports */}
          <button
            onClick={() => setActiveWorkflowNode('reports')}
            className="flex flex-col items-center bg-purple-50 border-2 border-purple-200 rounded-2xl p-6 text-center hover:scale-[1.03] transition-all hover:shadow-lg w-52 shrink-0 group"
          >
            <div className="w-12 h-12 bg-purple-600 rounded-full flex items-center justify-center text-white text-lg font-bold mb-3 shadow-md">
              <FileText size={20} />
            </div>
            <p className="font-bold text-purple-950 text-sm">Reports</p>
            <p className="text-xs text-purple-700/80 mt-1">Audit logs & summary exports</p>
          </button>
        </div>

        {/* Central Company Dashboard anchor */}
        <div className="border-t border-gray-100 pt-8 mt-4 text-center">
          <div className="inline-flex items-center gap-3 bg-slate-900 border border-slate-800 text-white rounded-2xl px-8 py-4 shadow-xl">
            <span className="text-emerald-400">⚡</span>
            <div>
              <p className="font-bold text-sm">Central Workspace Hub</p>
              <p className="text-xs text-slate-400">All workflow nodes anchor into the primary Company Dashboard</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
