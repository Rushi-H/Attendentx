import React from 'react';
import clsx from 'clsx';

export interface LogoProps {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  className?: string;
  textVariant?: 'light' | 'dark';
  subtitle?: string;
}

export const Logo: React.FC<LogoProps> = ({
  size = 'md',
  showText = false,
  className,
  textVariant = 'light',
  subtitle = 'Attendance System',
}) => {
  const badgeSizes = {
    xs: 'w-7 h-7 rounded-lg',
    sm: 'w-8 h-8 rounded-lg',
    md: 'w-10 h-10 rounded-xl',
    lg: 'w-12 h-12 rounded-2xl',
    xl: 'w-14 h-14 rounded-2xl',
  };

  const iconSizes = {
    xs: 'w-4 h-4',
    sm: 'w-4.5 h-4.5',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-7 h-7',
  };

  const titleSizes = {
    xs: 'text-xs',
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
    xl: 'text-lg',
  };

  return (
    <div className={clsx('flex items-center gap-3', className)}>
      {/* Icon Badge featuring only the </> code symbol */}
      <div
        className={clsx(
          'flex items-center justify-center font-mono font-bold text-white',
          'bg-gradient-to-tr from-brand-600 via-indigo-600 to-blue-500 shadow-md shadow-brand-600/30 select-none flex-shrink-0',
          badgeSizes[size]
        )}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className={iconSizes[size]}
        >
          {/* Left bracket < */}
          <path
            d="M7.5 7L3 12L7.5 17"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* Slash / */}
          <path
            d="M14 4.5L10 19.5"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Right bracket > */}
          <path
            d="M16.5 7L21 12L16.5 17"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </div>

      {/* Brand Text */}
      {showText && (
        <div className="leading-tight">
          <h1
            className={clsx(
              'font-bold tracking-tight',
              titleSizes[size],
              textVariant === 'light' ? 'text-white' : 'text-slate-900'
            )}
          >
            Developer's Academy
          </h1>
          {subtitle && (
            <p
              className={clsx(
                'text-[10px] font-medium uppercase tracking-wider',
                textVariant === 'light' ? 'text-slate-400' : 'text-slate-500'
              )}
            >
              {subtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
};
