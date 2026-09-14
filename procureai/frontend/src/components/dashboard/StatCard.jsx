import React from 'react';
import { TrendingUp, AlertTriangle, Activity, IndianRupee, FileText } from 'lucide-react';
import './dashboard.css';

export default function StatCard({
  label,
  value,
  subtext,
  trend,
  trendDirection = 'neutral',
  variant = 'neutral',
  icon: Icon = FileText,
}) {
  const getIconColor = () => {
    switch (variant) {
      case 'risk-high':
        return 'var(--risk-high)';
      case 'risk-med':
        return 'var(--risk-med)';
      case 'cyan':
        return 'var(--accent-cyan)';
      default:
        return 'var(--accent-blue)';
    }
  };

  const getValueColorClass = () => {
    switch (variant) {
      case 'risk-high':
        return 'color-risk-high';
      case 'risk-med':
        return 'color-risk-med';
      case 'cyan':
        return 'color-cyan';
      default:
        return '';
    }
  };

  return (
    <div className={`stat-card variant-${variant}`}>
      <div className="stat-card-header">
        <span className="stat-card-label">{label}</span>
        <div className="stat-card-icon-box">
          <Icon size={18} color={getIconColor()} />
        </div>
      </div>

      <div className={`stat-card-value ${getValueColorClass()}`}>
        {value}
      </div>

      <div className="stat-card-footer">
        <span>{subtext}</span>
        {trend && (
          <span className={`stat-trend-tag trend-${trendDirection}`}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}
