'use client';

import React from 'react';
import { TrendingUp, TrendingDown, Pause } from 'lucide-react';
import { cn } from '@/lib/utils/cn';

interface BadgeProps {
  variant: 'buy' | 'sell' | 'hold' | 'success' | 'danger' | 'warning' | 'info' | 'secondary';
  children: React.ReactNode;
  showIcon?: boolean;
  animated?: boolean;
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  variant,
  children,
  showIcon = true,
  animated = false,
  className
}) => {
  const baseStyles = 'inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-medium';
  
  const variantStyles = {
    buy: 'bg-brand-success/10 text-brand-success border border-brand-success/30',
    sell: 'bg-brand-danger/10 text-brand-danger border border-brand-danger/30',
    hold: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30',
    success: 'bg-brand-success/10 text-brand-success border border-brand-success/30',
    danger: 'bg-brand-danger/10 text-brand-danger border border-brand-danger/30',
    warning: 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/30',
    info: 'bg-blue-500/10 text-blue-400 border border-blue-500/30',
    secondary: 'bg-slate-700/50 text-slate-300 border border-slate-600/50'
  };

  const getIcon = () => {
    if (!showIcon) return null;
    
    switch (variant) {
      case 'buy':
      case 'success':
        return <TrendingUp size={14} className={animated ? 'animate-bounce-subtle' : ''} />;
      case 'sell':
      case 'danger':
        return <TrendingDown size={14} className={animated ? 'animate-bounce-subtle' : ''} />;
      case 'hold':
        return <Pause size={14} />;
      default:
        return null;
    }
  };

  return (
    <span className={cn(baseStyles, variantStyles[variant], animated && 'animate-pulse-slow', className)}>
      {getIcon()}
      {children}
    </span>
  );
};

