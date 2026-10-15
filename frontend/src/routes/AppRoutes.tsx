import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { Login } from '../pages/auth/Login';
import { AppLayout } from '../components/layout/AppLayout';
import { ProtectedRoute } from '../components/layout/ProtectedRoute';
import { EmployeeDashboard } from '../pages/employee/Dashboard';
import { AttendanceHistory } from '../pages/employee/AttendanceHistory';
import { EmployeeLeaves } from '../pages/employee/Leaves';
import { EmployeeProfilePage } from '../pages/employee/Profile';

import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { EmployeeManagement } from '../pages/admin/EmployeeManagement';
import { AttendanceReview } from '../pages/admin/AttendanceReview';
import { LeaveManagement } from '../pages/admin/LeaveManagement';
import { ShiftManagement } from '../pages/admin/ShiftManagement';
import { NetworkSettings } from '../pages/admin/NetworkSettings';
import { ReportsPage } from '../pages/admin/Reports';
import { AuditLogsPage } from '../pages/admin/AuditLogs';
import { useAuth } from '../context/AuthContext';

export const AppRoutes: React.FC = () => {
  const { isAuthenticated, role } = useAuth();

  return (
    <Routes>
      {/* Public Route */}
      <Route
        path="/login"
        element={
          isAuthenticated ? (
            <Navigate to={role === 'SUPER_ADMIN' || role === 'HR_ADMIN' ? '/admin/dashboard' : '/dashboard'} replace />
          ) : (
            <Login />
          )
        }
      />

      {/* Protected Routes wrapped in AppLayout */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/dashboard" replace />} />

        {/* Employee Self-Service */}
        <Route path="dashboard" element={<EmployeeDashboard />} />
        <Route path="history" element={<AttendanceHistory />} />
        <Route path="leaves" element={<EmployeeLeaves />} />
        <Route path="profile" element={<EmployeeProfilePage />} />

        {/* Admin & HR Routes */}
        <Route
          path="admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/employees"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
              <EmployeeManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/attendance"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
              <AttendanceReview />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/leaves"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
              <LeaveManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/shifts"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
              <ShiftManagement />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/reports"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'HR_ADMIN']}>
              <ReportsPage />
            </ProtectedRoute>
          }
        />

        {/* Super Admin Security Routes */}
        <Route
          path="admin/network"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <NetworkSettings />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin/audit"
          element={
            <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
              <AuditLogsPage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
};
