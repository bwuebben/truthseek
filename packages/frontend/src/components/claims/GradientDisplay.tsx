'use client';

import { useMemo } from 'react';
import clsx from 'clsx';

interface GradientDisplayProps {
  value: number;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'bar' | 'circle';
  showLabel?: boolean;
  showPercentage?: boolean;
  className?: string;
}

export function GradientDisplay({
  value,
  size = 'md',
  variant = 'bar',
  showLabel = false,
  showPercentage = true,
  className,
}: GradientDisplayProps) {
  // If circle variant requested, use GradientCircle
  if (variant === 'circle') {
    const circleSize = size === 'sm' ? 32 : size === 'md' ? 48 : 64;
    return <GradientCircle value={value} size={circleSize} className={className} />;
  }

  // Clamp value between 0 and 1
  const normalizedValue = Math.max(0, Math.min(1, value));

  // Calculate color based on gradient
  const color = useMemo(() => {
    if (normalizedValue < 0.3) {
      // False - coral/red
      return '#ff4d4d';
    } else if (normalizedValue > 0.7) {
      // True - emerald/green
      return '#10b981';
    } else {
      // Uncertain - amber/yellow
      return '#f59e0b';
    }
  }, [normalizedValue]);

  // Generate gradient for the bar
  const gradientStyle = useMemo(() => {
    const percentage = normalizedValue * 100;
    return {
      background: `linear-gradient(to right, ${color} ${percentage}%, #1a2332 ${percentage}%)`,
    };
  }, [normalizedValue, color]);

  const sizeClasses = {
    sm: 'h-1.5 text-xs',
    md: 'h-2 text-sm',
    lg: 'h-3 text-base',
  };

  const label = useMemo(() => {
    if (normalizedValue < 0.3) return 'Likely False';
    if (normalizedValue > 0.7) return 'Likely True';
    return 'Uncertain';
  }, [normalizedValue]);

  return (
    <div className={clsx('flex flex-col', className)}>
      {showLabel && (
        <div className="flex justify-between items-center mb-1">
          <span
            className={clsx('font-medium', sizeClasses[size])}
            style={{ color }}
          >
            {label}
          </span>
          {showPercentage && (
            <span className={clsx('text-text-muted', sizeClasses[size])}>
              {(normalizedValue * 100).toFixed(0)}%
            </span>
          )}
        </div>
      )}

      <div
        className={clsx(
          'w-full rounded-full overflow-hidden bg-dark-700',
          sizeClasses[size].split(' ')[0]
        )}
      >
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${normalizedValue * 100}%`,
            backgroundColor: color,
          }}
        />
      </div>

      {!showLabel && showPercentage && (
        <div className="flex justify-center mt-1">
          <span
            className={clsx('font-medium', sizeClasses[size])}
            style={{ color }}
          >
            {(normalizedValue * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}

interface GradientBadgeProps {
  value: number;
  className?: string;
}

export function GradientBadge({ value, className }: GradientBadgeProps) {
  const normalizedValue = Math.max(0, Math.min(1, value));

  const { color, bgColor, label } = useMemo(() => {
    if (normalizedValue < 0.3) {
      return {
        color: 'text-accent-coral',
        bgColor: 'bg-accent-coral/10 border border-accent-coral/30',
        label: 'False',
      };
    } else if (normalizedValue > 0.7) {
      return {
        color: 'text-emerald-400',
        bgColor: 'bg-emerald-500/10 border border-emerald-500/30',
        label: 'True',
      };
    } else {
      return {
        color: 'text-amber-400',
        bgColor: 'bg-amber-500/10 border border-amber-500/30',
        label: 'Uncertain',
      };
    }
  }, [normalizedValue]);

  return (
    <span
      className={clsx(
        'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium',
        color,
        bgColor,
        className
      )}
    >
      {label} ({(normalizedValue * 100).toFixed(0)}%)
    </span>
  );
}

interface GradientCircleProps {
  value: number;
  size?: number;
  strokeWidth?: number;
  showValue?: boolean;
  className?: string;
}

export function GradientCircle({
  value,
  size = 64,
  strokeWidth = 4,
  showValue = true,
  className,
}: GradientCircleProps) {
  const normalizedValue = Math.max(0, Math.min(1, value));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const strokeDashoffset = circumference - normalizedValue * circumference;

  const color = useMemo(() => {
    if (normalizedValue < 0.3) return '#ff4d4d';
    if (normalizedValue > 0.7) return '#10b981';
    return '#f59e0b';
  }, [normalizedValue]);

  const glowClass = useMemo(() => {
    if (normalizedValue < 0.3) return 'shadow-glow-red';
    if (normalizedValue > 0.7) return 'shadow-glow-green';
    return 'shadow-glow-yellow';
  }, [normalizedValue]);

  return (
    <div className={clsx('relative inline-flex gradient-transition', glowClass, className)}>
      <svg width={size} height={size} className="-rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="#1a2332"
          strokeWidth={strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          className="transition-all duration-500"
        />
      </svg>
      {showValue && (
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-semibold transition-colors duration-500" style={{ color }}>
            {(normalizedValue * 100).toFixed(0)}%
          </span>
        </div>
      )}
    </div>
  );
}
