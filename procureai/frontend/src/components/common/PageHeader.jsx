import React from 'react';
import Badge from './Badge';

export default function PageHeader({
  eyebrow = 'PROCUREAI INTELLIGENCE SUITE',
  title,
  subtitle,
  icon: Icon,
  badgeText,
  badgeVariant = 'cyan',
  badgePulse = false,
  actions,
}) {
  return (
    <div className="page-header-container animate-fade-in">
      <div className="page-header-content">
        {eyebrow && <span className="eyebrow-label">{eyebrow}</span>}
        <h1 className="page-title">
          {Icon && <Icon size={24} color="var(--primary-navy)" />}
          <span>{title}</span>
          {badgeText && (
            <Badge variant={badgeVariant} pulse={badgePulse}>
              {badgeText}
            </Badge>
          )}
        </h1>
        {subtitle && <p className="page-subtitle">{subtitle}</p>}
      </div>

      {actions && <div className="page-header-actions" style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>{actions}</div>}
    </div>
  );
}
