import React, { useState, useEffect } from 'react';
import axios from '../axiosConfig';
import {
  BarChart3, PieChart, TrendingUp, DollarSign,
  Target, Activity, ArrowUpRight, ArrowDownRight,
  Calculator, Zap, Briefcase, Info
} from 'lucide-react';



const SalesForecasting = () => {
  const [stats, setStats] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const res = await axios.get('/api/deals/stats/forecasting');
      if (res.data.success) setStats(res.data.data);
    } catch (err) {
      console.error('Error fetching stats');
    } finally {
      setLoading(false);
    }
  };

  const totalValue = stats.reduce((acc, curr) => acc + parseFloat(curr.total_value || 0), 0);
  const weightedValue = stats.reduce((acc, curr) => acc + parseFloat(curr.weighted_value || 0), 0);
  const totalDeals = stats.reduce((acc, curr) => acc + curr.count, 0);

  if (loading) return <div className="p-20 text-center text-emerald-600 font-bold bg-white rounded-[2.5rem] shadow-sm border border-gray-100 animate-pulse text-xl">Recalculating revenue projections...</div>;

  return (
    <div className="space-y-8">
      {/* Forecasting Header */}
      <div className="bg-white p-10 rounded-[2.5rem] shadow-sm border border-gray-100 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50/50 rounded-bl-full -z-0"></div>
        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-4 mb-8">
            <div className="p-4 bg-emerald-600 text-white rounded-3xl shadow-2xl shadow-emerald-200">
              <Calculator size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black text-gray-900 tracking-tight">Sales Forecasting</h2>
              <p className="text-gray-500 font-bold">Predictive analytics and pipeline health.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 bg-gray-900 text-white rounded-[2rem] shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-125 transition-transform">
                <DollarSign size={80} />
              </div>
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-400 mb-2">Total Pipeline Value</p>
              <h3 className="text-4xl font-black">₹{totalValue.toLocaleString()}</h3>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-400">
                <Activity size={14} className="text-emerald-500" /> Across {totalDeals} active deals
              </div>
            </div>

            <div className="p-8 bg-white border border-gray-100 rounded-[2rem] shadow-sm group hover:border-emerald-200 transition-all">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400 mb-2">Weighted Forecast</p>
              <h3 className="text-4xl font-black text-gray-900">₹{weightedValue.toLocaleString()}</h3>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-600">
                <Target size={14} /> Adjusted by probability
              </div>
            </div>

            <div className="p-8 bg-emerald-50 rounded-[2rem] group">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-600 mb-2">Projected Win Rate</p>
              <h3 className="text-4xl font-black text-gray-900">
                {totalValue > 0 ? ((weightedValue / totalValue) * 100).toFixed(1) : 0}%
              </h3>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-bold text-gray-500">
                <Zap size={14} className="text-emerald-500" /> Pipeline efficiency index
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Breakdown Charts (CSS Visualization) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <h3 className="font-black text-xl text-gray-900 flex items-center gap-2">
              <BarChart3 className="text-emerald-500" /> Value by Stage
            </h3>
            <Info size={18} className="text-gray-300" />
          </div>

          <div className="space-y-6">
            {stats.map(s => {
              const percentage = totalValue > 0 ? (s.total_value / totalValue) * 100 : 0;
              return (
                <div key={s.stage} className="space-y-2">
                  <div className="flex justify-between text-xs font-black uppercase tracking-widest text-gray-500">
                    <span>{s.stage}</span>
                    <span>₹{parseFloat(s.total_value).toLocaleString()}</span>
                  </div>
                  <div className="h-4 w-full bg-gray-50 rounded-full overflow-hidden border border-gray-50">
                    <div
                      className={`h-full transition-all duration-1000 ${s.stage === 'Won' ? 'bg-emerald-500' :
                          s.stage === 'Lead' ? 'bg-blue-400' :
                            s.stage === 'Lost' ? 'bg-red-400' :
                              'bg-indigo-400'
                        }`}
                      style={{ width: `${percentage}%` }}
                    ></div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <h3 className="font-black text-xl text-gray-900 flex items-center gap-2">
              <Activity className="text-emerald-500" /> Pipeline Health
            </h3>
            <Target size={18} className="text-emerald-600" />
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">High Intent Deals</p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">
                  {stats.find(s => s.stage === 'Negotiation')?.count || 0}
                </span>
                <span className="text-xs font-bold text-gray-400">Current</span>
              </div>
            </div>
            <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Recent Conversions</p>
              <div className="flex flex-wrap items-baseline gap-2">
                <span className="text-3xl font-black text-gray-900">
                  {stats.find(s => s.stage === 'Won')?.count || 0}
                </span>
                <span className="text-emerald-600 flex items-center text-[10px] font-black">
                  <ArrowUpRight size={12} /> SUCCESS
                </span>
              </div>
            </div>
            <div className="col-span-2 p-6 bg-indigo-50 border border-indigo-100 rounded-3xl">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">Average Win Probability</p>
                  <span className="text-2xl font-black text-indigo-900 tracking-tighter">
                    {(stats.reduce((acc, curr) => acc + (curr.count * (totalDeals > 0 ? (curr.count / totalDeals) : 0)), 0) * 10).toFixed(0)}%
                  </span>
                </div>
                <div className="w-16 h-16 rounded-2xl bg-white flex items-center justify-center text-indigo-600 shadow-sm border border-indigo-100">
                  <TrendingUp size={24} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesForecasting;
