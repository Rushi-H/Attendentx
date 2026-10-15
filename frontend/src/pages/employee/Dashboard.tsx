import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { attendanceService } from '../../services/attendanceService';
import { useAuth } from '../../context/AuthContext';
import {
  Wifi,
  ShieldCheck,
  ShieldAlert,
  Clock,
  Calendar,
  LogIn,
  LogOut,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  Info,
} from 'lucide-react';
import { Card, CardHeader } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge, AttendanceStatusBadge } from '../../components/ui/Badge';
import { Alert } from '../../components/ui/Alert';

export const EmployeeDashboard: React.FC = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [elapsedWorkingSeconds, setElapsedWorkingSeconds] = useState<number>(0);

  // Fetch Attendance Eligibility and Today's status
  const { data: eligibility, isLoading, refetch } = useQuery({
    queryKey: ['attendanceEligibility'],
    queryFn: () => attendanceService.getEligibility(),
    refetchInterval: 15000, // Poll every 15s to catch network changes
  });

  // Calculate live working duration if currently checked in
  useEffect(() => {
    let timer: any = null;
    if (eligibility?.today_record && !eligibility.today_record.check_out_at) {
      const checkInTime = new Date(eligibility.today_record.check_in_at).getTime();
      const updateTimer = () => {
        const now = new Date().getTime();
        const diffInSeconds = Math.max(0, Math.floor((now - checkInTime) / 1000));
        setElapsedWorkingSeconds(diffInSeconds);
      };
      updateTimer();
      timer = setInterval(updateTimer, 1000);
    } else {
      setElapsedWorkingSeconds(0);
    }
    return () => {
      if (timer) clearInterval(timer);
    };
  }, [eligibility?.today_record]);

  // Check-In Mutation
  const checkInMutation = useMutation({
    mutationFn: () => attendanceService.checkIn(),
    onSuccess: (data) => {
      setSuccessMessage(`Check-in recorded at ${new Date(data.check_in_at).toLocaleTimeString()}`);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['attendanceEligibility'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to check in.';
      setErrorMessage(msg);
      setSuccessMessage(null);
    },
  });

  // Check-Out Mutation
  const checkOutMutation = useMutation({
    mutationFn: () => attendanceService.checkOut(),
    onSuccess: (data) => {
      setSuccessMessage(`Check-out recorded at ${new Date(data.check_out_at!).toLocaleTimeString()}. Total work: ${data.working_minutes} mins`);
      setErrorMessage(null);
      queryClient.invalidateQueries({ queryKey: ['attendanceEligibility'] });
    },
    onError: (err: any) => {
      const msg = err.response?.data?.error?.message || err.message || 'Failed to check out.';
      setErrorMessage(msg);
      setSuccessMessage(null);
    },
  });

  const formatElapsed = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const net = eligibility?.network_verification;
  const isNetworkAllowed = net?.is_allowed;
  const todayRecord = eligibility?.today_record;
  const shift = eligibility?.assigned_shift;

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {user?.employee_profile?.first_name || 'Employee'}! 👋
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Today is{' '}
            <span className="font-semibold text-slate-700">
              {new Date().toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </span>
          </p>
        </div>

        {/* Network Status Badge */}
        <div className="flex items-center gap-2">
          {isNetworkAllowed ? (
            <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-200 text-emerald-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <Wifi className="w-4 h-4 text-emerald-600 animate-pulse" />
              <span>Office Network Connected</span>
              <span className="text-[10px] text-emerald-600 font-mono">({net?.observed_ip})</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 bg-rose-50 border border-rose-200 text-rose-800 px-3 py-1.5 rounded-xl text-xs font-semibold">
              <ShieldAlert className="w-4 h-4 text-rose-600" />
              <span>Outside Office Network</span>
              <span className="text-[10px] text-rose-600 font-mono">({net?.observed_ip})</span>
            </div>
          )}
        </div>
      </div>

      {/* Alerts */}
      {errorMessage && (
        <Alert variant="danger" title="Attendance Error">
          {errorMessage}
        </Alert>
      )}
      {successMessage && (
        <Alert variant="success" title="Success">
          {successMessage}
        </Alert>
      )}

      {/* Main Action Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Check-In / Check-Out Hero Card */}
        <Card className="lg:col-span-2 flex flex-col justify-between relative overflow-hidden bg-gradient-to-br from-white via-white to-slate-50">
          <div>
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
              <div>
                <span className="text-[11px] font-bold text-brand-600 uppercase tracking-wider">
                  Attendance Terminal
                </span>
                <h2 className="text-lg font-bold text-slate-900 mt-0.5">Today's Presence Status</h2>
              </div>
              <div>
                {todayRecord ? (
                  <AttendanceStatusBadge status={todayRecord.status} />
                ) : (
                  <Badge variant={isNetworkAllowed ? 'default' : 'neutral'} dot>
                    {isNetworkAllowed ? 'Ready to Check In' : 'Network Restricted'}
                  </Badge>
                )}
              </div>
            </div>

            {/* Attendance Status Display */}
            <div className="py-6 flex flex-col items-center justify-center text-center">
              {todayRecord?.check_out_at ? (
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                    <CheckCircle className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Day Completed!</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    You checked out at{' '}
                    <span className="font-semibold text-slate-800">
                      {new Date(todayRecord.check_out_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    . Total working duration: <span className="font-bold text-brand-600">{todayRecord.working_minutes} minutes</span>.
                  </p>
                </div>
              ) : todayRecord ? (
                <div className="space-y-3">
                  <div className="w-16 h-16 rounded-2xl bg-brand-50 text-brand-600 flex items-center justify-center mx-auto border border-brand-200">
                    <Clock className="w-8 h-8 animate-spin-slow" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-brand-600 uppercase tracking-widest">Active Shift Session</p>
                    <h3 className="text-3xl font-extrabold text-slate-900 font-mono tracking-tight mt-1">
                      {formatElapsed(elapsedWorkingSeconds)}
                    </h3>
                    <p className="text-xs text-slate-500 mt-1">
                      Checked in at{' '}
                      <span className="font-medium text-slate-700">
                        {new Date(todayRecord.check_in_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                    <LogIn className="w-8 h-8" />
                  </div>
                  <h3 className="text-lg font-bold text-slate-900">You haven't checked in yet</h3>
                  <p className="text-xs text-slate-500 max-w-sm">
                    {isNetworkAllowed
                      ? 'You are connected to the approved office network. Tap below to log your presence.'
                      : 'Please connect to the authorized office Wi-Fi network to mark check-in.'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-6 border-t border-slate-100">
            {eligibility?.can_check_in ? (
              <Button
                variant="primary"
                size="lg"
                className="w-full text-base font-semibold py-3.5 shadow-lg shadow-brand-500/25"
                isLoading={checkInMutation.isPending}
                onClick={() => checkInMutation.mutate()}
                leftIcon={<LogIn className="w-5 h-5" />}
              >
                Check In Now
              </Button>
            ) : eligibility?.can_check_out ? (
              <Button
                variant="danger"
                size="lg"
                className="w-full text-base font-semibold py-3.5 shadow-lg shadow-rose-500/25"
                isLoading={checkOutMutation.isPending}
                onClick={() => checkOutMutation.mutate()}
                leftIcon={<LogOut className="w-5 h-5" />}
              >
                Check Out
              </Button>
            ) : (
              <Button
                variant="outline"
                size="lg"
                className="w-full py-3.5 opacity-60 cursor-not-allowed"
                disabled
              >
                {todayRecord?.check_out_at
                  ? 'Attendance Completed for Today'
                  : 'Check-In Restricted (Outside Network)'}
              </Button>
            )}
          </div>
        </Card>

        {/* Right Info Column: Shift & Network Verification Details */}
        <div className="space-y-6">
          {/* Shift Schedule Card */}
          <Card>
            <CardHeader title="Assigned Shift" subtitle="Your official working schedule" />
            {shift ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Shift Name</span>
                  <span className="text-xs font-bold text-slate-900">{shift.name}</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Timings</span>
                  <span className="text-xs font-bold text-slate-900 font-mono">
                    {shift.start_time} — {shift.end_time}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Grace Period</span>
                  <span className="text-xs font-semibold text-amber-600">{shift.grace_minutes} mins</span>
                </div>
                <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 border border-slate-100">
                  <span className="text-xs text-slate-500 font-medium">Min Work Requirement</span>
                  <span className="text-xs font-semibold text-slate-700">{shift.minimum_work_minutes / 60} hours</span>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic">No specific shift assigned.</p>
            )}
          </Card>

          {/* Network Security Diagnostics Card */}
          <Card>
            <CardHeader title="Network Security" subtitle="Server-side perimeter check" />
            <div className="space-y-2.5 text-xs">
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Observed IP</span>
                <span className="font-mono font-semibold text-slate-800">{net?.observed_ip || 'Detecting...'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Verification Mode</span>
                <span className="font-semibold text-slate-800">{net?.verification_mode || 'STRICT'}</span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-slate-100">
                <span className="text-slate-500">Validation Status</span>
                <span className={`font-semibold ${isNetworkAllowed ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {net?.reason_code || 'N/A'}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5">
                <span className="text-slate-500">Assigned Office</span>
                <span className="font-semibold text-slate-800">{user?.employee_profile?.office_name || 'Headquarters'}</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
