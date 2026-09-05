import React from 'react';

interface StatusBadgeProps {
  status: 'safe' | 'caution' | 'low' | 'critical';
  percentage?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, percentage, size = 'md' }) => {
  const configs = {
    safe: {
      label: 'Safe',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300',
      dot: 'bg-emerald-500',
    },
    caution: {
      label: 'Caution',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-300',
      dot: 'bg-amber-500',
    },
    low: {
      label: 'Low',
      bg: 'bg-orange-50 dark:bg-orange-950/40 border-orange-200 dark:border-orange-800 text-orange-700 dark:text-orange-300',
      dot: 'bg-orange-500',
    },
    critical: {
      label: 'Critical',
      bg: 'bg-rose-50 dark:bg-rose-950/40 border-rose-200 dark:border-rose-800 text-rose-700 dark:text-rose-300',
      dot: 'bg-rose-500',
    },
  };

  const config = configs[status] || configs.safe;
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs font-semibold px-2.5 py-1 gap-1.5',
    lg: 'text-sm font-semibold px-3 py-1.5 gap-2',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full border ${config.bg} ${sizeClasses} transition-all`}
    >
      <span className={`w-2 h-2 rounded-full ${config.dot} animate-pulse`} />
      <span>
        {config.label}
        {percentage !== undefined ? ` • ${percentage}%` : ''}
      </span>
    </span>
  );
};