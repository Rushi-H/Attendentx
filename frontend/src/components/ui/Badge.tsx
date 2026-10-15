import React from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'purple' | 'neutral';
  size?: 'sm' | 'md';
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'default',
  size = 'md',
  className,
  dot = false,
}) => {
  const variants = {
    default: 'bg-brand-50 text-brand-700 border-brand-200',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-sky-50 text-sky-700 border-sky-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200',
  };

  const dotColors = {
    default: 'bg-brand-500',
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    purple: 'bg-purple-500',
    neutral: 'bg-slate-400',
  };

  const sizes = {
    sm: 'text-xs px-2 py-0.5 font-medium',
    md: 'text-xs px-2.5 py-1 font-semibold',
  };

  return (
    <span
      className={twMerge(
        clsx(
          'inline-flex items-center gap-1.5 rounded-full border tracking-wide uppercase',
          variants[variant],
          sizes[size],
          className
        )
      )}
    >
      {dot && <span className={clsx('w-1.5 h-1.5 rounded-full shrink-0', dotColors[variant])} />}
      {children}
    </span>
  );
};

export const AttendanceStatusBadge: React.FC<{ status: string; className?: string }> = ({ status, className }) => {
  switch (status) {
    case 'PRESENT':
      return <Badge variant="success" dot className={className}>Present</Badge>;
    case 'LATE':
      return <Badge variant="warning" dot className={className}>Late</Badge>;
    case 'HALF_DAY':
      return <Badge variant="warning" dot className={className}>Half Day</Badge>;
    case 'ABSENT':
      return <Badge variant="danger" dot className={className}>Absent</Badge>;
    case 'ON_LEAVE':
      return <Badge variant="info" dot className={className}>On Leave</Badge>;
    case 'PENDING_REVIEW':
      return <Badge variant="purple" dot className={className}>Pending Review</Badge>;
    case 'MANUALLY_ADJUSTED':
      return <Badge variant="neutral" dot className={className}>Adjusted</Badge>;
    case 'HOLIDAY':
      return <Badge variant="info" dot className={className}>Holiday</Badge>;
    case 'WEEKLY_OFF':
      return <Badge variant="neutral" dot className={className}>Weekly Off</Badge>;
    default:
      return <Badge variant="neutral" className={className}>{status}</Badge>;
  }
};
