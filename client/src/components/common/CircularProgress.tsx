import React from 'react';

interface CircularProgressProps {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  status?: 'safe' | 'caution' | 'low' | 'critical';
}

export const CircularProgress: React.FC<CircularProgressProps> = ({
  percentage,
  size = 140,
  strokeWidth = 12,
  status = 'safe',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.min(100, Math.max(0, percentage));
  const strokeDashoffset = circumference - (clamped / 100) * circumference;

  const colorMap = {
    safe: '#10b981', // emerald-500
    caution: '#f59e0b', // amber-500
    low: '#f97316', // orange-500
    critical: '#ef4444', // rose-500
  };

  const strokeColor = colorMap[status] || '#10b981';

  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Background Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100 dark:text-slate-800"
          fill="transparent"
        />
        {/* Active Progress Circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          fill="transparent"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
      <div className="absolute flex flex-col items-center justify-center text-center">
        <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-800 dark:text-white">
          {percentage}%
        </span>
        <span className="text-[10px] sm:text-xs font-medium uppercase tracking-wider text-slate-600 dark:text-slate-400">
          Attendance
        </span>
      </div>
    </div>
  );
};