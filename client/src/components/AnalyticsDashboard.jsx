import React from 'react';
import axios from '../axiosConfig';
import { TrendingUp, Users, DollarSign, BarChart3, PieChart, ArrowUpRight, ArrowDownRight } from 'lucide-react';

const AnalyticsDashboard = ({ type = 'expenditure' }) => {
  const [data, setData] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        const res = await axios.get('/api/dashboard/analytics/expenditure');
        if (res.data.success) {
          setData(res.data.data);
        }
      } catch (err) {
        console.error('Error fetching analytics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading) return <div className="p-8 text-center text-gray-500 font-bold">Loading Analytics...</div>;
  if (!data) return <div className="p-8 text-center text-red-500 font-bold">Error loading analytics data.</div>;

  const iconMap = {
    DollarSign: <DollarSign size={24} />,
    TrendingUp: <TrendingUp size={24} />,
    Users: <Users size={24} />
  };

  const colorMap = {
    blue: 'blue',
    green: 'green',
    indigo: 'indigo',
    purple: 'purple'
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {data.metrics.map((m, i) => (
          <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-xl bg-${m.color}-50 text-${m.color}-600 flex items-center justify-center`}>
                {iconMap[m.icon]}
              </div>
              <div className={`flex items-center gap-1 text-sm font-bold ${m.isUp ? 'text-green-600' : 'text-red-600'}`}>
                {m.trend} {m.isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
              </div>
            </div>
            <p className="text-sm font-bold text-gray-400 uppercase tracking-wider">{m.label}</p>
            <p className="text-3xl font-black text-gray-900 mt-1">{m.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
            <h3 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <BarChart3 size={20} className="text-blue-600" />
              {type === 'expenditure' ? 'Salary Expenditure Trend' : 'Departmental Performance'}
            </h3>
            <select className="bg-gray-50 border border-gray-200 rounded-lg px-3 py-1 text-xs font-bold outline-none">
              <option>Last 6 Months</option>
            </select>
          </div>

          <div className="h-64 flex flex-wrap items-end gap-3 px-2">
            {(type === 'expenditure' ? data.salaryTrend : data.performance).map((t, i) => {
              const currentVal = type === 'expenditure' ? t.total : t.val;
              const maxVal = Math.max(...(type === 'expenditure'
                ? data.salaryTrend.map(d => d.total)
                : data.performance.map(d => d.val)));

              const height = maxVal > 0 ? (currentVal / maxVal) * 90 : 2;
              const label = type === 'expenditure' ? `₹${(currentVal / 1000).toFixed(1)}k` : `${currentVal}%`;

              return (
                <div key={i} className={`flex-1 bg-gradient-to-t ${type === 'expenditure' ? 'from-blue-600 to-blue-400' : 'from-green-600 to-green-400'} rounded-t-lg group relative transition-all hover:scale-105`} style={{ height: `${height}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity font-bold whitespace-nowrap z-10">
                    {label}
                  </div>
                </div>
              );
            })}
          </div>
          <div className="flex justify-between mt-4 px-2 text-[10px] font-bold text-gray-400 uppercase tracking-tighter">
            {(type === 'expenditure' ? data.salaryTrend : data.performance).map((t, i) => (
              <span key={i} className="truncate max-w-[50px] text-center" title={type === 'expenditure' ? t.month : t.department}>
                {type === 'expenditure' ? t.month.slice(0, 3) : t.department}
              </span>
            ))}
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-xl font-bold text-gray-900 mb-8 flex items-center gap-2">
            <PieChart size={20} className="text-indigo-600" />
            Budget Distribution
          </h3>
          <div className="space-y-6">
            {data.distribution.length === 0 ? (
              <p className="text-center text-gray-400 py-12">No data available</p>
            ) : data.distribution.map((d, i) => (
              <div key={i} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="font-bold text-gray-700">{d.label}</span>
                  <span className="font-black text-gray-900">{d.val}%</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className={`h-full bg-blue-600 rounded-full`} style={{ width: `${d.val}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
