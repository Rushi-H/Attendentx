import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNavbar } from './TopNavbar';

export const AppLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50 flex">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="flex-1 flex flex-col lg:pl-64 min-w-0">
        <TopNavbar onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />
        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          <Outlet />
        </main>
        <footer className="py-3 px-6 lg:px-8 border-t border-slate-200/60 flex justify-end items-center bg-white/50">
          <p className="text-xs text-slate-400 font-medium tracking-tight">
            Developed by <span className="font-semibold text-slate-600">REV</span>
          </p>
        </footer>
      </div>
    </div>
  );
};
