import React from 'react';
import {
  TrendingUp,
  Users,
  RotateCcw,
  Layers,
  ShieldAlert,
  AlertTriangle,
  Zap,
  CheckCircle2,
  Activity
} from 'lucide-react';
import Badge from '../common/Badge';
import './risk.css';

const ICON_MAP = {
  TrendingUp: TrendingUp,
  Users: Users,
  RotateCcw: RotateCcw,
  Layers: Layers,
  Zap: Zap,
  CheckCircle2: CheckCircle2,
  Activity: Activity,
};

export default function AnomalyFactorsGrid({ factors }) {
  const safeFactors = (factors || []).filter(
    (f) => f && f.title && !['nan', 'none'].includes(String(f.title).toLowerCase().trim())
  );

  return (
    <section className="why-flagged-section">
      <div className="section-heading-row">
        <h3 className="section-heading-title">
          <ShieldAlert size={22} color="var(--risk-high)" />
          <span>Why Was This Flagged?</span>
        </h3>
        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          {safeFactors.length} CORRELATED ANOMALY DETECTOR{safeFactors.length === 1 ? '' : 'S'} TRIGGERED
        </span>
      </div>

      <div className="anomaly-factors-grid">
        {safeFactors.map((factor) => {
          const Icon = ICON_MAP[factor.icon_name] || AlertTriangle;
          return (
            <div
              key={factor.id}
              className={`anomaly-factor-card factor-severity-${factor.severity}`}
            >
              <div className="factor-card-top">
                <div className="factor-icon-title-group">
                  <div className={`factor-icon-box icon-${factor.severity}`}>
                    <Icon size={20} />
                  </div>
                  <div>
                    <h4 className="factor-card-name">{factor.title}</h4>
                    <span className="factor-card-category">{factor.category}</span>
                  </div>
                </div>

                <Badge
                  variant={
                    factor.severity === 'Critical'
                      ? 'risk-high'
                      : factor.severity === 'High'
                      ? 'risk-high'
                      : 'risk-med'
                  }
                >
                  {factor.severity}
                </Badge>
              </div>

              <p className="factor-card-explanation">{factor.explanation}</p>

              <div className="factor-card-footer">
                <span className="factor-contribution-tag">
                  +{factor.contribution_percent} Risk Weight
                </span>
                <span className="factor-score-pill">
                  Anomaly Score: <strong style={{ color: 'var(--text-primary)' }}>{factor.factor_score}/100</strong>
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
