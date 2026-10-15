import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/reportService';
import { Card, CardHeader } from '../../components/ui/Card';
import { AttendanceStatusBadge, Badge } from '../../components/ui/Badge';
import {
  Users,
  UserCheck,
  UserX,
  Clock,
  CalendarDays,
  AlertCircle,
  TrendingUp,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

export const AdminDashboard: React.FC = () => {
  const { data, isLoading } = useQuery({
    queryKey: ['adminDashboardSummary'],
    queryFn: () => reportService.getSummary(),
    refetchInterval: 30000,
  });

  const kpis = data?.kpis;
  const recent = data?.recent_check_ins || [];

  const chartData = [
    { name: 'Present', count: kpis?.present_today || 0, color: '#10b981' },
    { name: 'Late', count: kpis?.late_today || 0, color: '#f59e0b' },
    { name: 'Half Day', count: kpis?.half_day_today || 0, color: '#f97316' },
    { name: 'On Leave', count: kpis?.on_leave_today || 0, color: '#0ea5e9' },
    { name: 'Absent', count: kpis?.absent_today || 0, color: '#f43f5e' },
    { name: 'Pending', count: kpis?.pending_reviews || 0, color: '#8b5cf6' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Executive Dashboard</h1>
          <p className="text-xs text-slate-500 mt-1">Real-time attendance metrics & workforce presence overview</p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="default" className="text-xs py-1 px-3">
            {data?.date || new Date().toISOString().split('T')[0]}
          </Badge>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <Card className="p-4 bg-white border-l-4 border-l-brand-600">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Staff</span>
            <Users className="w-4 h-4 text-brand-600" />
          </div>
          <p className="text-2xl font-extrabold text-slate-900 mt-2">{kpis?.total_employees ?? '—'}</p>
          <span className="text-[10px] text-slate-400 font-medium">Active roster</span>
        </Card>

        <Card className="p-4 bg-white border-l-4 border-l-emerald-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Present</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <p className="text-2xl font-extrabold text-emerald-600 mt-2">{kpis?.present_today ?? '—'}</p>
          <span className="text-[10px] text-emerald-600 font-medium">{kpis?.attendance_rate ?? 0}% Rate</span>
        </Card>

        <Card className="p-4 bg-white border-l-4 border-l-amber-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Late Today</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <p className="text-2xl font-extrabold text-amber-600 mt-2">{kpis?.late_today ?? '—'}</p>
          <span className="text-[10px] text-amber-600 font-medium">Past grace limit</span>
        </Card>

        <Card className="p-4 bg-white border-l-4 border-l-sky-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">On Leave</span>
            <CalendarDays className="w-4 h-4 text-sky-500" />
          </div>
          <p className="text-2xl font-extrabold text-sky-600 mt-2">{kpis?.on_leave_today ?? '—'}</p>
          <span className="text-[10px] text-sky-600 font-medium">Approved leaves</span>
        </Card>

        <Card className="p-4 bg-white border-l-4 border-l-rose-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Absent</span>
            <UserX className="w-4 h-4 text-rose-500" />
          </div>
          <p className="text-2xl font-extrabold text-rose-600 mt-2">{kpis?.absent_today ?? '—'}</p>
          <span className="text-[10px] text-rose-500 font-medium">No check-in</span>
        </Card>

        <Card className="p-4 bg-white border-l-4 border-l-purple-500">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Pending</span>
            <AlertCircle className="w-4 h-4 text-purple-500" />
          </div>
          <p className="text-2xl font-extrabold text-purple-600 mt-2">{kpis?.pending_reviews ?? '—'}</p>
          <span className="text-[10px] text-purple-600 font-medium">Needs signoff</span>
        </Card>
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Attendance Distribution Chart */}
        <Card className="lg:col-span-1 flex flex-col justify-between">
          <CardHeader title="Today's Distribution" subtitle="Headcount by attendance status" />
          <div className="h-64 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="name" fontSize={11} stroke="#64748b" />
                <YAxis allowDecimals={false} fontSize={11} stroke="#64748b" />
                <Tooltip
                  cursor={{ fill: '#f1f5f9' }}
                  contentStyle={{ backgroundColor: '#ffffff', borderRadius: '8px', border: '1px solid #e2e8f0', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Recent Live Check-Ins Table */}
        <Card className="lg:col-span-2 p-0 overflow-hidden flex flex-col justify-between">
          <div className="p-6 pb-2">
            <CardHeader
              title="Recent Live Check-Ins"
              subtitle="Latest attendance logs verified by office gateway"
              action={
                <Link
                  to="/admin/attendance"
                  className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:text-brand-700"
                >
                  View All <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              }
            />
          </div>

          <div className="overflow-x-auto flex-1">
            <table className="min-w-full divide-y divide-slate-100 text-xs">
              <thead className="bg-slate-50/80">
                <tr>
                  <th className="px-6 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                  <th className="px-6 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Dept</th>
                  <th className="px-6 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Time</th>
                  <th className="px-6 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="px-6 py-2.5 text-left font-bold text-slate-500 uppercase tracking-wider">Gateway</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recent.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">
                      No check-ins recorded today yet.
                    </td>
                  </tr>
                ) : (
                  recent.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/60 transition-colors">
                      <td className="px-6 py-3 font-semibold text-slate-900">
                        {item.employee_name}
                        <span className="block text-[10px] text-slate-400 font-mono">{item.employee_code}</span>
                      </td>
                      <td className="px-6 py-3 text-slate-600">{item.department}</td>
                      <td className="px-6 py-3 font-mono text-slate-700">
                        {item.check_in_at
                          ? new Date(item.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </td>
                      <td className="px-6 py-3">
                        <AttendanceStatusBadge status={item.status} />
                      </td>
                      <td className="px-6 py-3">
                        {item.ip_verified ? (
                          <span className="inline-flex items-center gap-1 text-[11px] text-emerald-600 font-semibold">
                            <ShieldCheck className="w-3.5 h-3.5" /> Verified
                          </span>
                        ) : (
                          <span className="text-[11px] text-amber-600 font-medium">Unverified</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      </div>
    </div>
  );
};
