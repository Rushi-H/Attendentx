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
import { Plus, Search, UserCheck, UserX, Shield, Edit2 } from 'lucide-react';
import { EmployeeProfile, Department } from '../../types/auth';
import { Shift } from '../../types/shift';

export const EmployeeManagement: React.FC = () => {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('Welcome123!');
  const [role, setRole] = useState('EMPLOYEE');
  const [employeeCode, setEmployeeCode] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [designation, setDesignation] = useState('');
  const [shiftId, setShiftId] = useState('');

  // Fetch Employees
  const { data: empData, isLoading } = useQuery({
    queryKey: ['adminEmployees', searchTerm, departmentFilter],
    queryFn: () =>
      employeeService.getEmployees({
        search: searchTerm || undefined,
        department: departmentFilter || undefined,
      }),
  });

  const employees: EmployeeProfile[] = empData?.data || empData?.results || [];

  // Fetch Departments
  const { data: departments = [] } = useQuery({
    queryKey: ['departmentsList'],
    queryFn: () => employeeService.getDepartments(),
  });

  // Fetch Shifts
  const { data: shifts = [] } = useQuery({
    queryKey: ['shiftsList'],
    queryFn: () => employeeService.getShifts(),
  });

  // Create Employee Mutation
  const createMutation = useMutation({
    mutationFn: () =>
      employeeService.createEmployee({
        email,
        password,
        role,
        employee_code: employeeCode,
        first_name: firstName,
        last_name: lastName,
        phone,
        department: departmentId || null,
        designation,
        shift_id: shiftId || null,
      }),
    onSuccess: () => {
      setIsModalOpen(false);
      resetForm();
      queryClient.invalidateQueries({ queryKey: ['adminEmployees'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to create employee.';
      setFormError(msg);
    },
  });

  const resetForm = () => {
    setEmail('');
    setPassword('Welcome123!');
    setEmployeeCode('');
    setFirstName('');
    setLastName('');
    setPhone('');
    setDepartmentId('');
    setDesignation('');
    setShiftId('');
    setFormError(null);
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    createMutation.mutate();
  };

  const toggleStatus = async (employee: EmployeeProfile) => {
    const newStatus = employee.employment_status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    await employeeService.updateEmployee(employee.id, { employment_status: newStatus });
    queryClient.invalidateQueries({ queryKey: ['adminEmployees'] });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-xs text-slate-500 mt-1">Manage employee records, roles, departments, and shift assignments</p>
        </div>
        <Button
          variant="primary"
          onClick={() => {
            resetForm();
            setIsModalOpen(true);
          }}
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Add New Employee
        </Button>
      </div>

      {/* Filter and Search Bar */}
      <Card className="p-4 flex flex-col sm:flex-row items-center gap-4">
        <div className="relative flex-1 w-full">
          <Input
            placeholder="Search by name, employee code, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-slate-400" />}
          />
        </div>
        <div className="w-full sm:w-64">
          <Select
            value={departmentFilter}
            onChange={(e) => setDepartmentFilter(e.target.value)}
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </Select>
        </div>
      </Card>

      {/* Employee Table */}
      <Card className="p-0 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-xs">
            <thead className="bg-slate-50/80">
              <tr>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Assigned Shift</th>
                <th className="px-6 py-3.5 text-left font-bold text-slate-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-right font-bold text-slate-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-100">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">Loading employees...</td>
                </tr>
              ) : employees.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-slate-400">No employees match your search criteria.</td>
                </tr>
              ) : (
                employees.map((emp) => (
                  <tr key={emp.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900">
                      {emp.full_name}
                      <span className="block text-[10px] text-slate-400 font-mono">
                        {emp.employee_code} • {emp.email}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-700">
                      {emp.department_name || 'Unassigned'}
                      <span className="block text-[10px] text-slate-400">{emp.designation || 'Staff'}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-700">
                        {emp.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {emp.assigned_shift ? (
                        <div>
                          <span>{emp.assigned_shift.name}</span>
                          <span className="block text-[10px] text-slate-400 font-mono">
                            {emp.assigned_shift.start_time} - {emp.assigned_shift.end_time}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-400 italic">None</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <Badge variant={emp.employment_status === 'ACTIVE' ? 'success' : 'danger'} dot>
                        {emp.employment_status}
                      </Badge>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Button
                        size="sm"
                        variant={emp.employment_status === 'ACTIVE' ? 'ghost' : 'outline'}
                        className="text-xs"
                        onClick={() => toggleStatus(emp)}
                      >
                        {emp.employment_status === 'ACTIVE' ? 'Deactivate' : 'Reactivate'}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Add Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Employee"
        description="Create employee profile, credentials, and initial shift assignment"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          {formError && <Alert variant="danger">{formError}</Alert>}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="First Name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
            />
            <Input
              label="Last Name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex@company.com"
              required
            />
            <Input
              label="Initial Password"
              type="text"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Input
              label="Employee Code"
              value={employeeCode}
              onChange={(e) => setEmployeeCode(e.target.value)}
              placeholder="EMP-1002"
              required
            />
            <Input
              label="Phone Number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91..."
            />
            <Select
              label="User Role"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              options={[
                { value: 'EMPLOYEE', label: 'Employee' },
                { value: 'HR_ADMIN', label: 'HR / Admin' },
                { value: 'SUPER_ADMIN', label: 'Super Admin' },
              ]}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Select
              label="Department"
              value={departmentId}
              onChange={(e) => setDepartmentId(e.target.value)}
            >
              <option value="">Select Department</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>

            <Input
              label="Designation"
              value={designation}
              onChange={(e) => setDesignation(e.target.value)}
              placeholder="e.g. Frontend Engineer"
            />

            <Select
              label="Assign Shift"
              value={shiftId}
              onChange={(e) => setShiftId(e.target.value)}
            >
              <option value="">Select Shift</option>
              {shifts.map((s) => (
                <option key={s.id} value={s.id}>{s.name} ({s.start_time})</option>
              ))}
            </Select>
          </div>

          <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
            <Button type="button" variant="ghost" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" isLoading={createMutation.isPending}>
              Register Employee
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
