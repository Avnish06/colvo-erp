import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import { Target, AlertTriangle, CheckCircle, Percent } from 'lucide-react';
import { toast } from 'react-toastify';

export default function TaxAndBudget() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [income, setIncome] = useState(0);
  const [expenses, setExpenses] = useState(0);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [budgetRes, transRes] = await Promise.all([
        axios.get('/api/finance/budgets'),
        axios.get('/api/finance/transactions')
      ]);

      if (budgetRes.data.success) setBudgets(budgetRes.data.budgets);
      
      if (transRes.data.success) {
        const tx = transRes.data.transactions;
        const totalInc = tx.filter(t => t.type === 'income').reduce((sum, t) => sum + parseFloat(t.amount_base), 0);
        const totalExp = tx.filter(t => t.type === 'expense').reduce((sum, t) => sum + parseFloat(t.amount_base), 0);
        setIncome(totalInc);
        setExpenses(totalExp);
      }
    } catch (err) {
      toast.error('Error fetching budget data');
    } finally {
      setLoading(false);
    }
  };

  const profit = income - expenses;
  // Simple tax calculation (e.g. 25% corporate tax on profit)
  const estimatedTax = profit > 0 ? profit * 0.25 : 0;

  if (loading) return <div className="p-8 text-center text-gray-500">Loading Budgets...</div>;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Budget vs Actual */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-100 text-indigo-600 rounded-lg">
              <Target size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Budget vs Actual</h2>
              <p className="text-sm text-gray-500">Current Month Expenditures</p>
            </div>
          </div>

          <div className="space-y-6">
            {budgets.map((b, idx) => {
              const spent = parseFloat(b.spent);
              const limit = parseFloat(b.monthly_limit);
              const percentage = Math.min((spent / limit) * 100, 100);
              const isOver = spent > limit;
              const isWarning = percentage > 80 && !isOver;

              return (
                <div key={idx} className="space-y-2">
                  <div className="flex justify-between items-center text-sm">
                    <span className="font-bold text-gray-700">{b.category}</span>
                    <span className="text-gray-500 font-medium">₹{spent.toLocaleString()} / ₹{limit.toLocaleString()}</span>
                  </div>
                  <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full rounded-full transition-all duration-500 ${isOver ? 'bg-red-500' : isWarning ? 'bg-yellow-400' : 'bg-green-500'}`}
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                  {isOver && <p className="text-xs text-red-500 flex items-center gap-1 mt-1"><AlertTriangle size={12} /> Budget Exceeded</p>}
                  {isWarning && <p className="text-xs text-yellow-600 flex items-center gap-1 mt-1"><AlertTriangle size={12} /> Approaching Limit</p>}
                </div>
              );
            })}
          </div>
        </div>

        {/* Tax Liability */}
        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm space-y-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-red-100 text-red-600 rounded-lg">
              <Percent size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Tax Management</h2>
              <p className="text-sm text-gray-500">Estimated Corporate Tax Liability</p>
            </div>
          </div>

          <div className="p-5 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Gross Income (YTD)</span>
              <span className="font-bold text-gray-700">₹{income.toLocaleString('en-IN')}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Deductible Expenses</span>
              <span className="font-bold text-gray-700">-₹{expenses.toLocaleString('en-IN')}</span>
            </div>
            <div className="h-px w-full bg-gray-200 my-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm font-bold text-gray-700">Net Taxable Profit</span>
              <span className="font-bold text-gray-900">₹{profit.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <div className="p-6 bg-red-600 rounded-xl text-white shadow-md text-center">
            <p className="text-sm text-red-100 font-medium uppercase tracking-wider mb-1">Estimated Tax (25%)</p>
            <h3 className="text-3xl font-black">₹{estimatedTax.toLocaleString('en-IN')}</h3>
            <p className="text-xs text-red-200 mt-2 flex items-center justify-center gap-1">
              <CheckCircle size={14} /> Based on standard corporate rate
            </p>
          </div>
        </div>
        
      </div>
    </div>
  );
}
