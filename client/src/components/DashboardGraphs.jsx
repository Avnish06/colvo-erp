import React, { useState, useEffect, useCallback } from 'react';
import axios from '../axiosConfig';
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ComposedChart, Cell, PieChart, Pie
} from 'recharts';
import {
  TrendingUp, Users, CalendarCheck, Briefcase,
  DollarSign, ArrowUpRight, ArrowDownRight, Activity, Layers,
  BarChart3, PieChart as PieIcon
} from 'lucide-react';

const PERIODS = [
  { value: 'weekly', label: 'Weekly' },
  { value: 'monthly', label: 'Monthly' },
  { value: 'yearly', label: 'Yearly' }
];

/* ═══════ Custom Tooltip ═══════ */
const CustomTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: 'linear-gradient(145deg, #0f172a, #1e293b)',
      border: '1px solid rgba(99, 102, 241, 0.25)',
      borderRadius: 16,
      padding: '14px 20px',
      boxShadow: '0 25px 60px rgba(0,0,0,0.4)',
      minWidth: 140
    }}>
      <p style={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
        {label}
      </p>
      <p style={{ color: '#fff', fontSize: 22, fontWeight: 800, margin: 0, letterSpacing: '-0.02em' }}>
        {formatter ? formatter(payload[0].value) : payload[0].value}
      </p>
    </div>
  );
};

/* ═══════ Color System ═══════ */
const COLORS = {
  payroll: { main: '#6366f1', light: '#eef2ff', dark: '#4338ca', glow: 'rgba(99,102,241,0.35)' },
  employee: { main: '#10b981', light: '#ecfdf5', dark: '#047857', glow: 'rgba(16,185,129,0.35)' },
  leave: { main: '#f59e0b', light: '#fffbeb', dark: '#b45309', glow: 'rgba(245,158,11,0.35)' },
  task: { main: '#8b5cf6', light: '#f5f3ff', dark: '#6d28d9', glow: 'rgba(139,92,246,0.35)' }
};

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6'];

const DashboardGraphs = () => {
  const [period, setPeriod] = useState('monthly');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const fetchGraphData = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const res = await axios.get(
        `/api/dashboard/graph-data?period=${period}`
      );
      if (res.data.success) setData(res.data.data);
      else setError(true);
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => { fetchGraphData(); }, [fetchGraphData]);

  /* Skeleton Loader */
  if (loading) return <SkeletonLoader />;

  if (error || !data) return (
    <div className="mt-10 bg-white rounded-3xl border border-gray-100 shadow-sm p-16 text-center">
      <Activity size={48} className="mx-auto mb-4 text-gray-200" />
      <p className="text-gray-400 font-bold text-lg">Unable to load analytics</p>
      <button onClick={fetchGraphData} className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200">Retry</button>
    </div>
  );

  /* ── Stats ── */
  const sum = (a) => a.reduce((s, i) => s + i.value, 0);
  const payrollTotal = sum(data.payrollTrend);
  const empTotal = sum(data.employeeGrowth);
  const leaveTotal = sum(data.leaveRequests);
  const taskTotal = sum(data.taskActivity);

  const pieData = [
    { name: 'Payroll', value: payrollTotal || 1, fill: PIE_COLORS[0] },
    { name: 'Employees', value: empTotal || 1, fill: PIE_COLORS[1] },
    { name: 'Leaves', value: leaveTotal || 1, fill: PIE_COLORS[2] },
    { name: 'Tasks', value: taskTotal || 1, fill: PIE_COLORS[3] }
  ];

  const xAxisProps = { tick: { fontSize: 11, fill: '#94a3b8', fontWeight: 600 }, axisLine: false, tickLine: false };
  const yAxisProps = { ...xAxisProps, width: 50 };
  const gridProps = { strokeDasharray: '3 3', stroke: '#f1f5f9', vertical: false };

  return (
    <div className="mt-10">
      {/* ═══════════ HEADER ═══════════ */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Layers size={20} className="text-white" />
          </div>
          <div>
            <h3 className="text-xl font-extrabold text-gray-900">Analytics Overview</h3>
            <p className="text-xs text-gray-400 mt-0.5">Real-time insights · Dynamic data</p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 bg-gray-100 rounded-2xl p-1.5">
          {PERIODS.map(p => (
            <button key={p.value} onClick={() => setPeriod(p.value)}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 ${period === p.value
                  ? 'bg-white text-indigo-700 shadow-md'
                  : 'text-gray-500 hover:text-gray-700'
                }`}>{p.label}</button>
          ))}
        </div>
      </div>

      {/* ═══════════ KPI CARDS (Top Row) ═══════════ */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard icon={<DollarSign size={20} />} label="Total Payroll" value={`₹${(payrollTotal / 1000).toFixed(1)}k`} sub={`${data.payrollTrend.length} periods`} color={COLORS.payroll} />
        <KpiCard icon={<Users size={20} />} label="New Employees" value={empTotal} sub={`${data.employeeGrowth.length} periods`} color={COLORS.employee} />
        <KpiCard icon={<CalendarCheck size={20} />} label="Leave Requests" value={leaveTotal} sub={`${data.leaveRequests.length} periods`} color={COLORS.leave} />
        <KpiCard icon={<Briefcase size={20} />} label="Tasks Created" value={taskTotal} sub={`${data.taskActivity.length} periods`} color={COLORS.task} />
      </div>

      {/* ═══════════ MAIN CHART — PAYROLL TREND (Full Width Hero) ═══════════ */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8 mb-6 hover:shadow-lg transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: COLORS.payroll.light, color: COLORS.payroll.main }}>
              <TrendingUp size={20} />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-gray-900">Payroll Expenditure Trend</h4>
              <p className="text-[11px] text-gray-400">Salary disbursement across all periods</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-4">
            <div className="text-right">
              <p className="text-2xl font-black text-gray-900">₹{(payrollTotal / 1000).toFixed(1)}k</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Spent</p>
            </div>
          </div>
        </div>

        {data.payrollTrend.length === 0 ? <EmptyState /> : (
          <ResponsiveContainer width="100%" height={300}>
            <ComposedChart data={data.payrollTrend} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={COLORS.payroll.main} stopOpacity={0.25} />
                  <stop offset="100%" stopColor={COLORS.payroll.main} stopOpacity={0.01} />
                </linearGradient>
              </defs>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...xAxisProps} />
              <YAxis {...yAxisProps} tickFormatter={v => `₹${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip formatter={v => `₹${v.toLocaleString()}`} />} />
              <Area type="monotone" dataKey="value" fill="url(#heroGrad)" stroke="none" />
              <Line type="monotone" dataKey="value"
                stroke={COLORS.payroll.main} strokeWidth={3}
                dot={{ r: 6, fill: '#fff', stroke: COLORS.payroll.main, strokeWidth: 2.5 }}
                activeDot={{ r: 9, fill: COLORS.payroll.main, stroke: '#fff', strokeWidth: 3, style: { filter: `drop-shadow(0 0 8px ${COLORS.payroll.glow})` } }}
              />
            </ComposedChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ═══════════ SECOND ROW — 3 Charts ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">

        {/* Employee Growth — Bar */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-lg transition-all duration-300">
          <ChartHeader icon={<Users size={18} />} title="Employee Growth" sub="New hires per period" total={empTotal} color={COLORS.employee} />
          {data.employeeGrowth.length === 0 ? <EmptyState h={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.employeeGrowth} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="empGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.employee.main} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={COLORS.employee.main} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...xAxisProps} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} />
                <YAxis {...yAxisProps} allowDecimals={false} width={30} />
                <Tooltip content={<CustomTooltip formatter={v => `${v} employees`} />} />
                <Bar dataKey="value" fill="url(#empGrad)" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {data.employeeGrowth.map((_, i) => (
                    <Cell key={i} fillOpacity={0.6 + (i / Math.max(data.employeeGrowth.length, 1)) * 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Leave Requests — Area */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-lg transition-all duration-300">
          <ChartHeader icon={<CalendarCheck size={18} />} title="Leave Requests" sub="Request volume" total={leaveTotal} color={COLORS.leave} />
          {data.leaveRequests.length === 0 ? <EmptyState h={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <AreaChart data={data.leaveRequests} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="leaveGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.leave.main} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={COLORS.leave.main} stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...xAxisProps} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} />
                <YAxis {...yAxisProps} allowDecimals={false} width={30} />
                <Tooltip content={<CustomTooltip formatter={v => `${v} requests`} />} />
                <Area type="monotone" dataKey="value" fill="url(#leaveGrad)" stroke={COLORS.leave.main} strokeWidth={2.5}
                  dot={{ r: 4, fill: '#fff', stroke: COLORS.leave.main, strokeWidth: 2 }}
                  activeDot={{ r: 7, fill: COLORS.leave.main, stroke: '#fff', strokeWidth: 2.5, style: { filter: `drop-shadow(0 0 6px ${COLORS.leave.glow})` } }}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Task Activity — Bar */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-6 hover:shadow-lg transition-all duration-300">
          <ChartHeader icon={<Briefcase size={18} />} title="Task Activity" sub="Tasks by deadline" total={taskTotal} color={COLORS.task} />
          {data.taskActivity.length === 0 ? <EmptyState h={200} /> : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={data.taskActivity} margin={{ top: 5, right: 0, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="taskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={COLORS.task.main} stopOpacity={0.9} />
                    <stop offset="100%" stopColor={COLORS.task.main} stopOpacity={0.4} />
                  </linearGradient>
                </defs>
                <CartesianGrid {...gridProps} />
                <XAxis dataKey="label" {...xAxisProps} tick={{ fontSize: 9, fill: '#94a3b8', fontWeight: 600 }} />
                <YAxis {...yAxisProps} allowDecimals={false} width={30} />
                <Tooltip content={<CustomTooltip formatter={v => `${v} tasks`} />} />
                <Bar dataKey="value" fill="url(#taskGrad)" radius={[6, 6, 0, 0]} maxBarSize={32}>
                  {data.taskActivity.map((_, i) => (
                    <Cell key={i} fillOpacity={0.6 + (i / Math.max(data.taskActivity.length, 1)) * 0.4} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* ═══════════ THIRD ROW — Combined Overview + Distribution ═══════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Combined All-Data Line Chart */}
        <div className="lg:col-span-3 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gray-100 flex items-center justify-center text-gray-700">
              <BarChart3 size={20} />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-gray-900">Combined Trend</h4>
              <p className="text-[11px] text-gray-400">All metrics on a single timeline</p>
            </div>
          </div>

          <ResponsiveContainer width="100%" height={250}>
            <LineChart margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid {...gridProps} />
              <XAxis dataKey="label" {...xAxisProps} allowDuplicatedCategory={false} />
              <YAxis {...yAxisProps} />
              <Tooltip contentStyle={{
                background: 'linear-gradient(145deg, #0f172a, #1e293b)',
                border: '1px solid rgba(99,102,241,0.2)',
                borderRadius: 14, padding: '12px 16px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.35)',
                color: '#fff', fontSize: 12, fontWeight: 700
              }} labelStyle={{ color: '#94a3b8', fontSize: 10, fontWeight: 700, textTransform: 'uppercase', marginBottom: 6 }} />
              <Line data={data.employeeGrowth} dataKey="value" name="Employees" stroke={COLORS.employee.main} strokeWidth={2.5} dot={{ r: 3, fill: '#fff', stroke: COLORS.employee.main, strokeWidth: 2 }} />
              <Line data={data.leaveRequests} dataKey="value" name="Leaves" stroke={COLORS.leave.main} strokeWidth={2.5} dot={{ r: 3, fill: '#fff', stroke: COLORS.leave.main, strokeWidth: 2 }} />
              <Line data={data.taskActivity} dataKey="value" name="Tasks" stroke={COLORS.task.main} strokeWidth={2.5} dot={{ r: 3, fill: '#fff', stroke: COLORS.task.main, strokeWidth: 2 }} />
            </LineChart>
          </ResponsiveContainer>

          {/* Legend */}
          <div className="flex flex-wrap items-center justify-center gap-6 mt-4">
            <LegendItem color={COLORS.employee.main} label="Employees" />
            <LegendItem color={COLORS.leave.main} label="Leaves" />
            <LegendItem color={COLORS.task.main} label="Tasks" />
          </div>
        </div>

        {/* Distribution Pie */}
        <div className="lg:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm p-6 lg:p-8 hover:shadow-lg transition-all duration-300">
          <div className="flex flex-wrap items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
              <PieIcon size={20} />
            </div>
            <div>
              <h4 className="text-base font-extrabold text-gray-900">Distribution</h4>
              <p className="text-[11px] text-gray-400">Activity breakdown</p>
            </div>
          </div>

          <div className="flex items-center justify-center">
            <ResponsiveContainer width={200} height={200}>
              <PieChart>
                <Pie data={pieData} innerRadius={55} outerRadius={85} paddingAngle={4} dataKey="value" stroke="none">
                  {pieData.map((entry, i) => (
                    <Cell key={i} fill={entry.fill} style={{ filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))' }} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{
                  background: '#0f172a', border: 'none', borderRadius: 12, padding: '8px 14px',
                  color: '#fff', fontSize: 12, fontWeight: 700, boxShadow: '0 10px 30px rgba(0,0,0,0.3)'
                }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-4">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center gap-2.5 px-3 py-2 rounded-xl bg-gray-50">
                <div className="w-3 h-3 rounded-full flex-shrink-0" style={{ background: item.fill }} />
                <div className="min-w-0">
                  <p className="text-[10px] font-bold text-gray-400 uppercase truncate">{item.name}</p>
                  <p className="text-sm font-extrabold text-gray-800">{item.name === 'Payroll' ? `₹${(item.value / 1000).toFixed(1)}k` : item.value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══ Sub-components ═══ */

const KpiCard = ({ icon, label, value, sub, color }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md transition-all duration-200 group">
    <div className="flex flex-wrap items-center justify-between gap-4 mb-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: color.light, color: color.main }}>
        {icon}
      </div>
      <span className="text-[10px] font-bold text-gray-300 uppercase">{sub}</span>
    </div>
    <p className="text-2xl font-black text-gray-900 mb-0.5">{value}</p>
    <p className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{label}</p>
  </div>
);

const ChartHeader = ({ icon, title, sub, total, color }) => (
  <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
    <div className="flex flex-wrap items-center gap-2.5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: color.light, color: color.main }}>
        {icon}
      </div>
      <div>
        <h4 className="text-sm font-extrabold text-gray-800">{title}</h4>
        <p className="text-[10px] text-gray-400">{sub}</p>
      </div>
    </div>
    <div className="text-right">
      <p className="text-lg font-black text-gray-900">{total}</p>
      <p className="text-[9px] font-bold text-gray-400 uppercase">Total</p>
    </div>
  </div>
);

const LegendItem = ({ color, label }) => (
  <div className="flex flex-wrap items-center gap-2">
    <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
    <span className="text-xs font-bold text-gray-500">{label}</span>
  </div>
);

const EmptyState = ({ h = 240 }) => (
  <div className="flex flex-col items-center justify-center text-gray-300" style={{ height: h }}>
    <Activity size={32} className="mb-2 opacity-30" />
    <p className="text-xs font-bold">No data for this period</p>
  </div>
);

const SkeletonLoader = () => (
  <div className="mt-10 animate-pulse">
    <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
      <div className="flex flex-wrap items-center gap-3"><div className="w-11 h-11 bg-gray-200 rounded-2xl" /><div><div className="h-5 bg-gray-200 rounded w-40 mb-1.5" /><div className="h-3 bg-gray-100 rounded w-28" /></div></div>
      <div className="h-10 bg-gray-100 rounded-2xl w-48" />
    </div>
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {[1, 2, 3, 4].map(i => <div key={i} className="h-28 bg-white rounded-2xl border border-gray-100" />)}
    </div>
    <div className="h-80 bg-white rounded-3xl border border-gray-100 mb-6" />
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
      {[1, 2, 3].map(i => <div key={i} className="h-72 bg-white rounded-3xl border border-gray-100" />)}
    </div>
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      <div className="lg:col-span-3 h-80 bg-white rounded-3xl border border-gray-100" />
      <div className="lg:col-span-2 h-80 bg-white rounded-3xl border border-gray-100" />
    </div>
  </div>
);

export default DashboardGraphs;
