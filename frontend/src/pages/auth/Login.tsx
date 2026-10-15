import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Building2, Lock, Mail, AlertCircle, ArrowRight, ShieldCheck } from 'lucide-react';
import { Logo } from '../../components/ui/Logo';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Alert } from '../../components/ui/Alert';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const user = await login(email, password);
      if (user.role === 'SUPER_ADMIN' || user.role === 'HR_ADMIN') {
        navigate('/admin/dashboard', { replace: true });
      } else {
        navigate(from, { replace: true });
      }
    } catch (err: any) {
      let message = 'Unable to log in. Please check your credentials.';
      if (err.response?.data?.error?.message) {
        message = err.response.data.error.message;
      } else if (err.response?.data?.message) {
        message = err.response.data.message;
      } else if (err.message && err.message.toLowerCase().includes('network')) {
        message = 'Network / CORS Error: Unable to reach the server. Please verify your internet connection or backend CORS settings.';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickFill = (demoEmail: string, demoPass: string) => {
    setEmail(demoEmail);
    setPassword(demoPass);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Logo size="xl" showText={false} />
        </div>
        <h2 className="mt-4 text-center text-2xl font-extrabold text-slate-900 tracking-tight">
          Developer's Academy
        </h2>
        <p className="mt-1 text-center text-xs text-slate-500">
          Student & Staff Attendance Portal
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md px-4 sm:px-0">
        <div className="bg-white py-8 px-6 shadow-xl shadow-slate-200/50 rounded-2xl border border-slate-200/80 sm:px-10">
          {error && (
            <Alert variant="danger" className="mb-6">
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <Input
              label="Work Email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              leftIcon={<Mail className="w-4 h-4" />}
            />

            <Input
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              leftIcon={<Lock className="w-4 h-4" />}
            />

            <Button
              type="submit"
              variant="primary"
              className="w-full py-2.5 text-sm"
              isLoading={isLoading}
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Sign In
            </Button>
          </form>

          {/* Development Quick-Fill helper */}
          {/* <div className="mt-8 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1.5 text-slate-400 text-[11px] font-semibold uppercase tracking-wider mb-3">
              <ShieldCheck className="w-3.5 h-3.5 text-brand-600" />
              Quick Demo Accounts
            </div>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => handleQuickFill('admin@company.com', 'AdminPassword123!')}
                className="px-2 py-1.5 text-[11px] font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer text-center"
              >
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('hr@company.com', 'HrPassword123!')}
                className="px-2 py-1.5 text-[11px] font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer text-center"
              >
                HR Admin
              </button>
              <button
                type="button"
                onClick={() => handleQuickFill('employee@company.com', 'EmpPassword123!')}
                className="px-2 py-1.5 text-[11px] font-medium bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer text-center"
              >
                Employee
              </button>
            </div>
          </div> */}
        </div>
      </div>
    </div>
  );
};
