import React, { useState, useEffect } from 'react';
import { Menu, Clock, Building, Wifi, ShieldAlert } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

interface TopNavbarProps {
  onToggleSidebar: () => void;
}

export const TopNavbar: React.FC<TopNavbarProps> = ({ onToggleSidebar }) => {
  const { user } = useAuth();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: true,
        })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);
    return () => clearInterval(timer);
  }, []);

  const office = user?.employee_profile?.office;

  return (
    <header className="h-16 bg-white border-b border-slate-200/80 px-4 lg:px-8 flex items-center justify-between sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="p-2 -ml-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="hidden sm:flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg">
          <Building className="w-3.5 h-3.5 text-brand-600" />
          <span className="font-medium text-slate-900">{office?.name || 'Headquarters'}</span>
          <span className="text-slate-400">|</span>
          <span className="text-slate-500">{office?.timezone || 'Asia/Kolkata'}</span>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Live Clock */}
        <div className="flex items-center gap-2 bg-brand-50/70 border border-brand-100 px-3 py-1.5 rounded-lg">
          <Clock className="w-4 h-4 text-brand-600 animate-pulse" />
          <span className="font-mono text-xs font-semibold text-brand-900 tracking-tight">
            {currentTime || '00:00:00 AM'}
          </span>
        </div>

        {/* User status chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
          <div className="w-8 h-8 rounded-full bg-brand-600 text-white font-bold text-xs flex items-center justify-center">
            {user?.employee_profile?.first_name?.[0] || user?.email[0].toUpperCase()}
          </div>
          <div className="hidden md:block text-left">
            <p className="text-xs font-semibold text-slate-900 leading-none">
              {user?.employee_profile?.full_name || user?.email}
            </p>
            <p className="text-[10px] text-slate-500 mt-0.5">
              {user?.employee_profile?.designation || user?.role}
            </p>
          </div>
        </div>
      </div>
    </header>
  );
};
