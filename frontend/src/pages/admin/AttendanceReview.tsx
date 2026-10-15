import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../../services/attendanceService';
import { employeeService } from '../../services/employeeService';
import { reportService } from '../../services/reportService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { AttendanceStatusBadge, Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import {
  Download,
  Calendar,
  Filter,
  Edit3,
  ShieldCheck,
  FileSpreadsheet,
  FileText,
} from 'lucide-react';
import { AttendanceRecord } from '../../types/attendance';

export const AttendanceReview: React.FC = () => {
  const queryClient = useQueryClient();
  const todayStr = new Date().toISOString().split('T')[0];

  const [startDate, setStartDate] = useState(todayStr);
  const [endDate, setEndDate] = useState(todayStr);
  const [statusFilter, setStatusFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Correction Modal State
  const [editingRecord, setEditingRecord] = useState<AttendanceRecord | null>(null);
  const [correctionStatus, setCorrectionStatus] = useState('PRESENT');
  const [correctionCheckIn, setCorrectionCheckIn] = useState('');
  const [correctionCheckOut, setCorrectionCheckOut] = useState('');
  const [correctionReason, setCorrectionReason] = useState('');
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // Fetch Attendance Records
  const { data: attendanceData, isLoading } = useQuery({
    queryKey: ['adminAttendanceRecords', startDate, endDate, statusFilter, departmentFilter],
    queryFn: () =>
      attendanceService.getAdminAttendance({
        start_date: startDate || undefined,
        end_date: endDate || undefined,
        attendance_status: statusFilter || undefined,
        department: departmentFilter || undefined,
      }),
  });

  const records: AttendanceRecord[] = attendanceData?.data || attendanceData?.results || [];

  // Fetch Departments for filter
  const { data: departments = [] } = useQuery({
    queryKey: ['departmentsFilterList'],
    queryFn: () => employeeService.getDepartments(),
  });

  // Correction Mutation
  const correctMutation = useMutation({
    mutationFn: (payload: any) =>
      attendanceService.correctAttendance(editingRecord!.id, payload),
    onSuccess: () => {
      setEditingRecord(null);
      setCorrectionReason('');
      setCorrectionError(null);
      queryClient.invalidateQueries({ queryKey: ['adminAttendanceRecords'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to correct record.';
      setCorrectionError(msg);
    },
  });

  const handleOpenCorrection = (record: AttendanceRecord) => {
    setEditingRecord(record);
    setCorrectionStatus(record.attendance_status);
    setCorrectionCheckIn(record.check_in_at ? record.check_in_at.slice(0, 16) : '');
    setCorrectionCheckOut(record.check_out_at ? record.check_out_at.slice(0, 16) : '');
    setCorrectionReason('');
    setCorrectionError(null);
  };

  const handleCorrectionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!correctionReason.trim()) {
      setCorrectionError('A mandatory explanation reason is required for administrative audit logs.');
      return;
    }

    correctMutation.mutate({
      attendance_status: correctionStatus,
      check_in_at: correctionCheckIn ? new Date(correctionCheckIn).toISOString() : undefined,
      check_out_at: correctionCheckOut ? new Date(correctionCheckOut).toISOString() : null,
      correction_reason: correctionReason,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Attendance Records</h1>
          <p className="text-xs text-slate-500 mt-1">Review, filter, correct, and export verified office attendance data</p>
        </div>

        {/* Export Buttons */}
        <div className="flex items-center gap-2">
          <a
            href={reportService.getExportUrl('csv', startDate, endDate)}
            download="attendance_report.csv"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-slate-700 shadow-sm transition-colors"
          >
            <FileText className="w-4 h-4 text-slate-500" />
            CSV Export
          </a>
          <a
            href={reportService.getExportUrl('excel', startDate, endDate)}
            download="attendance_report.xlsx"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white shadow-sm transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-white" />
            Excel Export
          </a>
        </div>
      </div>

      {/* Filter Toolbar */}
      <Card className="p-4 grid grid-cols-1 sm:grid-cols-4 gap-3">
        <Input
          label="Start Date"
          type="date"
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <Input
          label="End Date"
          type="date"
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Select
          label="Filter Status"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="PRESENT">Present</option>
          <option value="LATE">Late</option>
          <option value="HALF_DAY">Half Day</option>
          <option value="PENDING_REVIEW">Pending Review</option>
          <option value="ABSENT">Absent</option>
        </Select>
        <Select
          label="Filter Department"
          value={departmentFilter}
          onChange={(e) => setDepartmentFilter(e.target.value)}
        >
          <option value="">All Departments</option>
          {departments.map((d) => (
            <option key={d.id} value={d.id}>{d.name}</option>
          ))}
        </Select>
      </Card>

      {/* Records Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Check In</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Check Out</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Hours</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Network</th>
                <th className="px-6 py-3.5 text-right font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">Loading attendance data...</td>
                </tr>
              ) : records.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-slate-400">No attendance records found matching filters.</td>
                </tr>
              ) : (
                records.map((r) => {
                  const checkIn = new Date(r.check_in_at);
                  const checkOut = r.check_out_at ? new Date(r.check_out_at) : null;
                  const hours = Math.floor(r.working_minutes / 60);
                  const mins = r.working_minutes % 60;

                  return (
                    <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="px-6 py-4 font-semibold text-slate-900">
                        {r.employee_name}
                        <span className="block text-[10px] text-slate-400 font-mono">
                          {r.employee_code} • {r.department_name}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">{r.attendance_date}</td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {checkIn.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="px-6 py-4 font-mono text-slate-600">
                        {checkOut ? (
                          checkOut.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        ) : (
                          <span className="text-slate-400 italic">In session</span>
                        )}
                      </td>
                      <td className="px-6 py-4 font-medium text-slate-800">
                        {r.working_minutes > 0 ? `${hours}h ${mins}m` : '—'}
                      </td>
                      <td className="px-6 py-4">
                        <AttendanceStatusBadge status={r.attendance_status} />
                        {r.is_manual_correction && (
                          <span
                            title={`Reason: ${r.correction_reason}`}
                            className="block text-[10px] text-amber-600 font-semibold cursor-help"
                          >
                            *Manual Edit
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center gap-1 text-[11px] font-mono text-slate-600">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                          {r.check_in_ip || '127.0.0.1'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenCorrection(r)}
                          leftIcon={<Edit3 className="w-3.5 h-3.5" />}
                        >
                          Correct
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Manual Correction Modal */}
      {editingRecord && (
        <Modal
          isOpen={!!editingRecord}
          onClose={() => setEditingRecord(null)}
          title={`Correct Attendance — ${editingRecord.employee_name}`}
          description="Adjust timestamps or presence status with mandatory audit log reason"
        >
          <form onSubmit={handleCorrectionSubmit} className="space-y-4">
            {correctionError && <Alert variant="danger">{correctionError}</Alert>}

            <Select
              label="Attendance Status"
              value={correctionStatus}
              onChange={(e) => setCorrectionStatus(e.target.value)}
              options={[
                { value: 'PRESENT', label: 'Present' },
                { value: 'LATE', label: 'Late' },
                { value: 'HALF_DAY', label: 'Half Day' },
                { value: 'ABSENT', label: 'Absent' },
                { value: 'ON_LEAVE', label: 'On Leave' },
                { value: 'PENDING_REVIEW', label: 'Pending Review' },
              ]}
            />

            <div className="grid grid-cols-2 gap-3">
              <Input
                label="Check In Timestamp"
                type="datetime-local"
                value={correctionCheckIn}
                onChange={(e) => setCorrectionCheckIn(e.target.value)}
                required
              />
              <Input
                label="Check Out Timestamp"
                type="datetime-local"
                value={correctionCheckOut}
                onChange={(e) => setCorrectionCheckOut(e.target.value)}
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Mandatory Correction Reason *
              </label>
              <textarea
                value={correctionReason}
                onChange={(e) => setCorrectionReason(e.target.value)}
                rows={3}
                required
                placeholder="Detail reason for manual adjustment (e.g., Airtel AirFiber router reboot, gateway sync issue)..."
                className="block w-full rounded-lg border border-slate-300 p-3 text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-brand-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
              <Button type="button" variant="ghost" onClick={() => setEditingRecord(null)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" isLoading={correctMutation.isPending}>
                Save Correction
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
};
