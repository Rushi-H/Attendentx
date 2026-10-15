import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeeService } from '../../services/employeeService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import { Input } from '../../components/ui/Input';
import { Select } from '../../components/ui/Select';
import { Modal } from '../../components/ui/Modal';
import { Alert } from '../../components/ui/Alert';
import { Plus, Clock, UserPlus, CheckCircle } from 'lucide-react';
import { Shift } from '../../types/shift';
import { EmployeeProfile } from '../../types/auth';

export const ShiftManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isAssignModalOpen, setIsAssignModalOpen] = useState(false);

  // Create Shift Form
  const [name, setName] = useState('');
  const [startTime, setStartTime] = useState('09:30');
  const [endTime, setEndTime] = useState('18:30');
  const [graceMinutes, setGraceMinutes] = useState(15);
  const [minWorkMinutes, setMinWorkMinutes] = useState(480);
  const [isOvernight, setIsOvernight] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);

  // Assign Shift Form
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [selectedShiftId, setSelectedShiftId] = useState('');
  const [effectiveDate, setEffectiveDate] = useState(new Date().toISOString().split('T')[0]);
  const [assignError, setAssignError] = useState<string | null>(null);

  // Queries
  const { data: shifts = [], isLoading } = useQuery({
    queryKey: ['shiftsListAdmin'],
    queryFn: () => employeeService.getShifts(),
  });

  const { data: employeesData } = useQuery({
    queryKey: ['employeesListForShift'],
    queryFn: () => employeeService.getEmployees(),
  });

  const employees: EmployeeProfile[] = employeesData?.data || employeesData?.results || [];

  // Create Mutation
  const createMutation = useMutation({
    mutationFn: () =>
      employeeService.createShift({
        name,
        start_time: `${startTime}:00`,
        end_time: `${endTime}:00`,
        grace_minutes: Number(graceMinutes),
        minimum_work_minutes: Number(minWorkMinutes),
        is_overnight: isOvernight,
      }),
    onSuccess: () => {
      setIsCreateModalOpen(false);
      setName('');
      setCreateError(null);
      queryClient.invalidateQueries({ queryKey: ['shiftsListAdmin'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create shift.';
      setCreateError(msg);
    },
  });

  // Assign Mutation
  const assignMutation = useMutation({
    mutationFn: () =>
      employeeService.assignShift(selectedEmployeeId, selectedShiftId, effectiveDate),
    onSuccess: () => {
      setIsAssignModalOpen(false);
      setAssignError(null);
      queryClient.invalidateQueries({ queryKey: ['shiftsListAdmin'] });
      queryClient.invalidateQueries({ queryKey: ['employeesListForShift'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to assign shift.';
      setAssignError(msg);
    },
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Shift Management</h1>
          <p className="text-xs text-slate-500 mt-1">Configure company working schedules, grace periods, and assign staff</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setIsAssignModalOpen(true)}
            leftIcon={<UserPlus className="w-4 h-4" />}
          >
            Assign to Employee
          </Button>
          <Button
            variant="primary"
            onClick={() => setIsCreateModalOpen(true)}
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Create New Shift
          </Button>
        </div>
      </div>

      {/* Shifts Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {isLoading ? (
          <p className="text-xs text-slate-400">Loading configured shifts...</p>
        ) : (
          shifts.map((s) => (
            <Card key={s.id} className="flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
                  <h3 className="text-base font-bold text-slate-900">{s.name}</h3>
                  <Badge variant={s.is_active ? 'success' : 'neutral'} dot>
                    {s.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Working Window</span>
                    <span className="font-mono font-bold text-slate-900">
                      {s.start_time} — {s.end_time}
                    </span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Grace Allowance</span>
                    <span className="font-semibold text-amber-600">{s.grace_minutes} minutes</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Min. Working Hours</span>
                    <span className="font-semibold text-slate-800">{s.minimum_work_minutes / 60} hrs</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">Overnight Shift</span>
                    <span className="font-semibold text-slate-800">{s.is_overnight ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Create Shift Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Working Shift"
        description="Define standard shift hours and late arrival grace allowance"
      >
        <form onSubmit={(e) => { e.preventDefault(); createMutation.mutate(); }} className="space-y-4">
          {createError && <Alert variant="danger">{createError}</Alert>}

          <Input
            label="Shift Title"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Afternoon Shift"
            required
          />

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Start Time"
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              required
            />
            <Input
              label="End Time"
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Grace Period (Minutes)"
              type="number"
              value={graceMinutes}
              onChange={(e) => setGraceMinutes(Number(e.target.value))}
              min={0}
              max={120}
              required
            />
            <Input
              label="Min Work Minutes"
              type="number"
              value={minWorkMinutes}
              onChange={(e) => setMinWorkMinutes(Number(e.target.value))}
              min={60}
              step={30}
              required
            />
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsCreateModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Create Shift
            </Button>
          </div>
        </form>
      </Modal>

      {/* Assign Shift Modal */}
      <Modal
        isOpen={isAssignModalOpen}
        onClose={() => setIsAssignModalOpen(false)}
        title="Assign Shift to Employee"
        description="Select staff member and designated work schedule"
      >
        <form onSubmit={(e) => { e.preventDefault(); assignMutation.mutate(); }} className="space-y-4">
          {assignError && <Alert variant="danger">{assignError}</Alert>}

          <Select
            label="Select Employee"
            value={selectedEmployeeId}
            onChange={(e) => setSelectedEmployeeId(e.target.value)}
            required
          >
            <option value="">Choose Employee...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.full_name} ({emp.employee_code})
              </option>
            ))}
          </Select>

          <Select
            label="Select Shift"
            value={selectedShiftId}
            onChange={(e) => setSelectedShiftId(e.target.value)}
            required
          >
            <option value="">Choose Shift...</option>
            {shifts.map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.start_time} - {s.end_time})
              </option>
            ))}
          </Select>

          <Input
            label="Effective From Date"
            type="date"
            value={effectiveDate}
            onChange={(e) => setEffectiveDate(e.target.value)}
            required
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsAssignModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={assignMutation.isPending}>
              Assign Schedule
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
