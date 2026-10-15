import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { authService } from '../../services/authService';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';
import { UserCheck, Shield, KeyRound, Building, Mail, Phone, Calendar } from 'lucide-react';

export const EmployeeProfilePage: React.FC = () => {
  const { user } = useAuth();
  const profile = user?.employee_profile;

  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(null);

    if (newPassword !== confirmPassword) {
      setPasswordError('New passwords do not match.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long.');
      return;
    }

    setIsUpdatingPassword(true);
    try {
      await authService.changePassword(oldPassword, newPassword);
      setPasswordSuccess('Password updated successfully!');
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      const msg = err.response?.data?.error?.message || 'Failed to update password. Please check your old password.';
      setPasswordError(msg);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">My Profile</h1>
        <p className="text-xs text-slate-500 mt-1">View your profile details and security credentials</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* User Card */}
        <Card className="md:col-span-1 text-center flex flex-col items-center justify-center p-8 bg-gradient-to-b from-white to-slate-50">
          <div className="w-20 h-20 rounded-full bg-brand-600 text-white font-bold text-2xl flex items-center justify-center shadow-lg shadow-brand-500/25 mb-4">
            {profile?.first_name?.[0] || user?.email[0].toUpperCase()}
          </div>
          <h2 className="text-lg font-bold text-slate-900">{profile?.full_name || user?.email}</h2>
          <p className="text-xs font-semibold text-brand-600 mt-0.5">{profile?.designation || 'Staff Member'}</p>
          <span className="mt-3 px-2.5 py-1 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 tracking-wider uppercase border border-slate-200">
            {profile?.employee_code || 'ID: ' + user?.id.slice(0, 8)}
          </span>
        </Card>

        {/* Profile Info Card */}
        <Card className="md:col-span-2">
          <CardHeader title="Employee Details" subtitle="Official employment information" />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-medium block mb-1">Email Address</span>
              <span className="text-slate-900 font-semibold">{user?.email}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-medium block mb-1">Phone Number</span>
              <span className="text-slate-900 font-semibold">{profile?.phone || 'Not provided'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-medium block mb-1">Department</span>
              <span className="text-slate-900 font-semibold">{profile?.department?.name || 'General'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-medium block mb-1">Assigned Office</span>
              <span className="text-slate-900 font-semibold">{profile?.office?.name || 'Headquarters'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-medium block mb-1">Joining Date</span>
              <span className="text-slate-900 font-semibold">{profile?.joining_date || 'N/A'}</span>
            </div>
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-100">
              <span className="text-slate-400 font-medium block mb-1">Employment Status</span>
              <span className="text-emerald-600 font-bold">{profile?.employment_status || 'ACTIVE'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Security: Change Password Card */}
      <Card>
        <CardHeader title="Security Credentials" subtitle="Update your system password" />
        {passwordError && <Alert variant="danger" className="mb-4">{passwordError}</Alert>}
        {passwordSuccess && <Alert variant="success" className="mb-4">{passwordSuccess}</Alert>}

        <form onSubmit={handlePasswordSubmit} className="space-y-4 max-w-lg">
          <Input
            label="Current Password"
            type="password"
            value={oldPassword}
            onChange={(e) => setOldPassword(e.target.value)}
            required
          />
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="New Password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
            />
            <Input
              label="Confirm New Password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
            />
          </div>
          <Button
            type="submit"
            variant="primary"
            isLoading={isUpdatingPassword}
            leftIcon={<KeyRound className="w-4 h-4" />}
          >
            Update Password
          </Button>
        </form>
      </Card>
    </div>
  );
};
