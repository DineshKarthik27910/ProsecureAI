import React from 'react';

/**
 * Enterprise status badge for ProcureAI
 * @param {'cyan' | 'risk-high' | 'risk-med' | 'risk-low' | 'neutral'} variant
 * @param {boolean} pulse - Whether to show glowing status dot
 * @param {React.ReactNode} icon - Optional Lucide icon
 */
export default function Badge({
  children,
  variant = 'neutral',
  pulse = false,
  icon: Icon,
  className = '',
}) {
  const getPulseColor = () => {
    switch (variant) {
      case 'risk-high':
        return 'pulse-dot-red';
      case 'cyan':
        return 'pulse-dot-cyan';
      case 'risk-low':
        return 'pulse-dot-green';
      default:
        return 'pulse-dot-cyan';
    }
  };

  return (
    <span className={`badge badge-${variant} ${className}`}>
      {pulse && <span className={`pulse-dot ${getPulseColor()}`} />}
      {Icon && <Icon size={13} style={{ flexShrink: 0 }} />}
      <span>{children}</span>
    </span>
  );
}
