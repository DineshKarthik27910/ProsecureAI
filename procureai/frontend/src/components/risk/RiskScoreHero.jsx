import React from 'react';
import {
  Building2,
  Sparkles
} from 'lucide-react';
import Badge from '../common/Badge';
import './risk.css';

export default function RiskScoreHero({ tender }) {
  // Circular Gauge Calculations
  const radius = 80;
  const circumference = 2 * Math.PI * radius;
  const scorePercent = Math.min(Math.max(tender.final_risk_score, 0), 100);
  const strokeDashoffset = circumference - (scorePercent / 100) * circumference;

  const getGaugeColor = (score) => {
    if (score >= 75) return '#DC2626';
    if (score >= 45) return '#D97706';
    return '#16A34A';
  };

  const getBadgeVariant = (score) => {
    if (score >= 75) return 'risk-high';
    if (score >= 45) return 'risk-med';
    return 'neutral';
  };

  const isHigh = tender.final_risk_score >= 75;
  const isMed = tender.final_risk_score >= 45;

  return (
    <div className="risk-score-hero-card animate-fade-in">
      <div className="risk-hero-grid">
        {/* Left: Circular SVG Score Gauge */}
        <div className="gauge-wrapper">
          <svg className="gauge-svg" viewBox="0 0 200 200">
            <circle
              className="gauge-bg-circle"
              cx="100"
              cy="100"
              r={radius}
            />
            <circle
              className="gauge-progress-circle"
              cx="100"
              cy="100"
              r={radius}
              stroke={getGaugeColor(tender.final_risk_score)}
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
            />
          </svg>

          <div className="gauge-inner-content">
            <span className="gauge-score-value">{tender.final_risk_score}</span>
            <span className="gauge-max-value">/ 100</span>
            <span className="gauge-severity-label">{tender.risk_level}</span>
          </div>
        </div>

        {/* Right: Contract Metadata, Score Decomposition & AI Banner */}
        <div className="risk-hero-details">
          <div>
            <div className="risk-hero-title-row">
              <span className="tender-id-badge" style={{ fontSize: '0.85rem' }}>
                {tender.tender_id}
              </span>
              <Badge variant={getBadgeVariant(tender.final_risk_score)} pulse={false}>
                {tender.risk_badge}
              </Badge>
            </div>
            <h2 className="risk-hero-contract-name">{tender.procurement_title}</h2>
            <div className="risk-hero-vendor">
              <Building2 size={15} color="var(--text-muted)" />
              <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>{tender.vendor_name}</span>
              <span style={{ color: 'var(--border-bright)' }}>•</span>
              <span style={{ color: 'var(--primary-blue)', fontWeight: 500 }}>{tender.category}</span>
              <span style={{ color: 'var(--border-bright)' }}>•</span>
              <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
                {tender.contract_value}
              </span>
            </div>
          </div>

          {/* Scoring Decomposition Triad */}
          <div className="risk-triad-grid">
            <div className="risk-triad-item">
              <span className="risk-triad-label">Rule-Based Score</span>
              <span className="risk-triad-number" style={{ color: 'var(--text-primary)' }}>
                {tender.rule_score}
              </span>
              <span className="risk-triad-sub">Statutory Heuristics</span>
            </div>

            <div className="risk-triad-item">
              <span className="risk-triad-label">ML Anomaly Score</span>
              <span className="risk-triad-number" style={{ color: 'var(--text-primary)' }}>
                {tender.ml_anomaly_score}
              </span>
              <span className="risk-triad-sub">Pattern Anomaly Model</span>
            </div>

            <div
              className="risk-triad-item"
              style={{
                background: isHigh ? 'var(--risk-high-bg)' : isMed ? 'var(--risk-med-bg)' : 'var(--risk-low-bg)',
                borderColor: isHigh ? 'var(--risk-high-border)' : isMed ? 'var(--risk-med-border)' : 'var(--risk-low-border)'
              }}
            >
              <span
                className="risk-triad-label"
                style={{ color: isHigh ? 'var(--risk-high-text)' : isMed ? 'var(--risk-med-text)' : 'var(--risk-low-text)' }}
              >
                Final Risk Score
              </span>
              <span
                className="risk-triad-number"
                style={{ color: isHigh ? 'var(--risk-high)' : isMed ? 'var(--risk-med)' : 'var(--risk-low)' }}
              >
                {tender.final_risk_score}
              </span>
              <span
                className="risk-triad-sub"
                style={{ color: isHigh ? 'var(--risk-high-text)' : isMed ? 'var(--risk-med-text)' : 'var(--risk-low-text)' }}
              >
                Composite Audit Rating
              </span>
            </div>
          </div>

          {/* AI Alert Summary Banner */}
          <div className="risk-hero-ai-banner">
            <Sparkles size={16} color="var(--primary-blue)" style={{ flexShrink: 0 }} />
            <span>{tender.ai_summary}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
