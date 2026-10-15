import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  CalendarCheck,
  CalendarDays,
  UserCheck,
  Users,
  Building2,
  Clock,
  ShieldCheck,
  FileSpreadsheet,
  History,
  ShieldAlert,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { clsx } from 'clsx';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, role, logout } = useAuth();
  const isAdminOrHR = role === 'SUPER_ADMIN' || role === 'HR_ADMIN';
  const isSuperAdmin = role === 'SUPER_ADMIN';

  const employeeNav = [
    { name: 'My Attendance', path: '/dashboard', icon: LayoutDashboard },
    { name: 'Attendance History', path: '/history', icon: CalendarCheck },
    { name: 'Leave Requests', path: '/leaves', icon: CalendarDays },
    { name: 'My Profile', path: '/profile', icon: UserCheck },
  ];

  const adminNav = [
    { name: 'Admin Overview', path: '/admin/dashboard', icon: LayoutDashboard },
    { name: 'Employees', path: '/admin/employees', icon: Users },
    { name: 'Attendance Records', path: '/admin/attendance', icon: CalendarCheck },
    { name: 'Leave Approvals', path: '/admin/leaves', icon: CalendarDays },
    { name: 'Shifts & Hours', path: '/admin/shifts', icon: Clock },
    { name: 'Reports & Export', path: '/admin/reports', icon: FileSpreadsheet },
  ];

  const securityNav = [
    { name: 'Network Security', path: '/admin/network', icon: ShieldCheck },
    { name: 'Audit Trails', path: '/admin/audit', icon: History },
  ];

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={clsx(
          'fixed top-0 bottom-0 left-0 z-50 w-64 bg-slate-900 text-slate-300 flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand header */}
        <div className="h-16 flex items-center px-6 border-b border-slate-800 gap-3">
          <div className="w-9 h-9 rounded-xl bg-brand-600 flex items-center justify-center text-white shadow-lg shadow-brand-600/30">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-bold text-white tracking-tight">OfficePulse</h1>
            <p className="text-[10px] text-slate-400 font-medium uppercase tracking-wider">Attendance System</p>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex-1 overflow-y-auto px-4 py-6 space-y-6">
          {/* Employee Section */}
          <div>
            <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              Self Service
            </p>
            <nav className="space-y-1">
              {employeeNav.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.path}
                    to={item.path}
                    onClick={onClose}
                    className={({ isActive }) =>
                      clsx(
                        'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                        isActive
                          ? 'bg-brand-600 text-white shadow-sm'
                          : 'text-slate-400 hover:text-white hover:bg-slate-800'
                      )
                    }
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    {item.name}
                  </NavLink>
                );
              })}
            </nav>
          </div>

          {/* Admin Management Section */}
          {isAdminOrHR && (
            <div>
              <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Administration
              </p>
              <nav className="space-y-1">
                {adminNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}

          {/* Super Admin Security Section */}
          {isSuperAdmin && (
            <div>
              <p className="px-3 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
                Security & Audit
              </p>
              <nav className="space-y-1">
                {securityNav.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      onClick={onClose}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                          isActive
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'text-slate-400 hover:text-white hover:bg-slate-800'
                        )
                      }
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      {item.name}
                    </NavLink>
                  );
                })}
              </nav>
            </div>
          )}
        </div>

        {/* Footer with user info & logout */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/40">
          <div className="flex items-center justify-between">
            <div className="min-w-0 pr-2">
              <p className="text-xs font-medium text-white truncate">
                {user?.employee_profile?.full_name || user?.email}
              </p>
              <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold bg-slate-800 text-brand-400">
                {role}
              </span>
            </div>
            <button
              onClick={() => logout()}
              title="Log Out"
              className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
