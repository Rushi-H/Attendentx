import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { attendanceService } from '../../services/attendanceService';
import { Card, CardHeader } from '../../components/ui/Card';
import { AttendanceStatusBadge, Badge } from '../../components/ui/Badge';
import { Select } from '../../components/ui/Select';
import { AttendanceRecord } from '../../types/attendance';
import { Calendar, Clock, AlertCircle, ShieldCheck } from 'lucide-react';

export const AttendanceHistory: React.FC = () => {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState<number>(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState<number>(currentDate.getFullYear());

  const { data, isLoading } = useQuery({
    queryKey: ['myAttendanceHistory', selectedMonth, selectedYear],
    queryFn: () => attendanceService.getHistory({ month: selectedMonth, year: selectedYear }),
  });

  const records: AttendanceRecord[] = data?.data || data?.results || [];

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

  const years = [2024, 2025, 2026, 2027].map((y) => ({ value: y, label: y.toString() }));

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance History</h1>
          <p className="text-xs text-slate-500 mt-1">Review your historical presence logs and working hours</p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-3">
          <div className="w-36">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              options={months}
            />
          </div>
          <div className="w-28">
            <Select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              options={years}
            />
          </div>
        </div>
      </div>

      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Check In
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Check Out
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Work Duration
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3.5 text-left text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Verification
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-500">
                    Loading attendance records...
                  </td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-xs text-slate-500">
                    No attendance records found for this period.
                  </td>
                </tr>
              ) : (
                records.map((r) => {
                  const checkIn = new Date(r.check_in_at);
                  const checkOut = r.check_out_at ? new Date(r.check_out_at) : null;
                  const hours = Math.floor(r.working_minutes / 60);
                  const mins = r.working_minutes % 60;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-semibold text-slate-900">
                        {r.attendance_date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                        {checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-slate-600 font-mono">
                        {checkOut ? (
                          checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : (
                          <span className="text-slate-400 italic">In Progress</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs font-medium text-slate-700">
                        {r.working_minutes > 0 ? (
                          <span className="font-semibold text-slate-900">
                            {hours}h {mins}m
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <AttendanceStatusBadge status={r.attendance_status} />
                        {r.is_manual_correction && (
                          <span
                            title={`Adjusted: ${r.correction_reason}`}
                            className="ml-2 inline-flex items-center text-[10px] text-amber-600 font-medium cursor-help"
                          >
                            *Edited
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 text-[11px] text-slate-600">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {r.verification_result}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
