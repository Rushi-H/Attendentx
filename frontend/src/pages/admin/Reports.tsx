import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportService } from '../../services/reportService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Select } from '../../components/ui/Select';
import { Input } from '../../components/ui/Input';
import {
  FileSpreadsheet,
  FileText,
  Clock,
  Calendar,
  Download,
  AlertTriangle,
} from 'lucide-react';
import { MonthlyEmployeeStat } from '../../types/report';

export const ReportsPage: React.FC = () => {
  const now = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(now.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(now.getFullYear());

  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');

  // Fetch Monthly Matrix
  const { data: monthlyData, isLoading: isMonthlyLoading } = useQuery({
    queryKey: ['monthlyMatrixReport', selectedMonth, selectedYear],
    queryFn: () => reportService.getMonthlyMatrix(selectedMonth, selectedYear),
  });

  // Fetch Late Arrivals
  const { data: lateData = [], isLoading: isLateLoading } = useQuery({
    queryKey: ['lateArrivalsReport'],
    queryFn: () => reportService.getLateArrivals(30),
  });

  const employees: MonthlyEmployeeStat[] = monthlyData?.employees || [];

  const months = [
    { value: 1, label: 'January' },
    { value: 2, label: 'February' },
    { value: 3, label: 'March' },
    { value: 4, label: 'April' },
    { value: 5, label: 'May' },
    { value: 6, label: 'June' },
    { value: 7, label: 'July' },
    { value: 8, label: 'August' },
    { value: 9, label: 'September' },
    { value: 10, label: 'October' },
    { value: 11, label: 'November' },
    { value: 12, label: 'December' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Reports & Analytics</h1>
          <p className="text-xs text-slate-500 mt-1">Export attendance logs and analyze punctuality and monthly presence matrices</p>
        </div>
      </div>

      {/* Export Tool Card */}
      <Card>
        <CardHeader
          title="Export Attendance Records"
          subtitle="Download raw verified attendance logs for audits or payroll systems"
        />
        <div className="flex flex-col sm:flex-row items-end gap-3">
          <div className="flex-1 w-full">
            <Input
              label="Start Date (Optional)"
              type="date"
              value={exportStart}
              onChange={(e) => setExportStart(e.target.value)}
            />
          </div>
          <div className="flex-1 w-full">
            <Input
              label="End Date (Optional)"
              type="date"
              value={exportEnd}
              onChange={(e) => setExportEnd(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <a
              href={reportService.getExportUrl('csv', exportStart, exportEnd)}
              download="attendance_report.csv"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-500" />
              Download CSV
            </a>
            <a
              href={reportService.getExportUrl('excel', exportStart, exportEnd)}
              download="attendance_report.xlsx"
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
            >
              <FileSpreadsheet className="w-4 h-4 text-white" />
              Download Excel
            </a>
          </div>
        </div>
      </Card>

      {/* Monthly Attendance Matrix */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900">Monthly Attendance Matrix</h3>
            <p className="text-xs text-slate-500">Summary of present days, late arrivals, and half days</p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-32">
              <Select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                options={months}
              />
            </div>
            <div className="w-24">
              <Select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                options={[2025, 2026, 2027].map((y) => ({ value: y, label: y.toString() }))}
              />
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3.5 text-center font-bold text-emerald-700 uppercase tracking-wider">Present Days</th>
                <th className="px-6 py-3.5 text-center font-bold text-amber-700 uppercase tracking-wider">Late Arrivals</th>
                <th className="px-6 py-3.5 text-center font-bold text-orange-700 uppercase tracking-wider">Half Days</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isMonthlyLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">Loading matrix...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-10 text-center text-slate-400">No data found for this period.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.employee_id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3.5 font-semibold text-slate-900">
                      {emp.full_name}
                      <span className="block text-[10px] text-slate-400 font-mono">{emp.employee_code}</span>
                    </td>
                    <td className="px-6 py-3.5 text-slate-600">{emp.department}</td>
                    <td className="px-6 py-3.5 text-center font-bold text-emerald-600 font-mono">
                      {emp.present_days}
                    </td>
                    <td className="px-6 py-3.5 text-center font-bold text-amber-600 font-mono">
                      {emp.late_days}
                    </td>
                    <td className="px-6 py-3.5 text-center font-bold text-orange-600 font-mono">
                      {emp.half_days}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Late Arrivals Report Table */}
      <Card className="p-0 overflow-hidden">
        <div className="p-6 pb-4 border-b border-slate-100">
          <h3 className="text-base font-bold text-slate-900">Late Arrivals (Last 30 Days)</h3>
          <p className="text-xs text-slate-500">Employees clocking in after shift grace window</p>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Recorded Check In</th>
                <th className="px-6 py-3 text-left font-bold text-slate-500 uppercase tracking-wider">Correction Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {isLateLoading ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400">Loading late logs...</td>
                </tr>
              ) : lateData.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-6 py-8 text-center text-slate-400 italic">No late arrivals recorded.</td>
                </tr>
              ) : (
                lateData.map((item, idx) => (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-3 font-semibold text-slate-900">
                      {item.employee_name}
                      <span className="block text-[10px] text-slate-400 font-mono">{item.employee_code}</span>
                    </td>
                    <td className="px-6 py-3 text-slate-600">{item.department}</td>
                    <td className="px-6 py-3 font-medium text-slate-800">{item.date}</td>
                    <td className="px-6 py-3 font-mono text-amber-600 font-semibold">
                      {item.check_in_at ? new Date(item.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </td>
                    <td className="px-6 py-3 text-slate-500">
                      {item.is_manual_correction ? (
                        <span className="text-amber-600 font-medium">Manually Adjusted</span>
                      ) : (
                        <span>System Flagged</span>
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
  );
};
