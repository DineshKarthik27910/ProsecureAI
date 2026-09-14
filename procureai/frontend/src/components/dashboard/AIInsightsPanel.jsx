import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import Badge from '../common/Badge';
import './dashboard.css';

export default function AIInsightsPanel({ insights }) {
  const navigate = useNavigate();
  const getInsightIcon = (category) => {
    if (category.includes('Price')) return TrendingUp;
    if (category.includes('Collusion')) return Users;
    return Clock;
  };

  return (
    <div className="dashboard-panel-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <Sparkles size={18} color="var(--accent-cyan)" />
          <div>
            <h3 className="panel-title">AI Investigation Insights</h3>
            <p className="panel-subtitle">Synthesized pattern recognition from neural surveillance models</p>
          </div>
        </div>

        <Badge variant="cyan" pulse={true}>3 NEW</Badge>
      </div>

      <div className="ai-insights-list">
        {insights.map((item) => {
          const Icon = getInsightIcon(item.category);
          return (
            <div key={item.id} className={`insight-card severity-${item.severity}`}>
              <div className="insight-header-row">
                <span className="insight-category-tag">
                  <Icon size={13} color="var(--accent-cyan)" />
                  <span>{item.category}</span>
                </span>
                <Badge variant={item.severityColor}>{item.severity}</Badge>
              </div>

              <div className="insight-title">{item.title}</div>
              <p className="insight-body">{item.description}</p>

              <div className="insight-footer-meta">
                <span>Model Confidence: {item.confidence}</span>
                <span
                  style={{ color: 'var(--accent-cyan)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                  onClick={() => navigate('/risk-analysis', { state: { selectedTenderId: item.relatedTenders?.[0] } })}
                  title={`Examine case ${item.relatedTenders?.[0] || 'drilldown'}`}
                >
                  Forensic Drilldown <ArrowRight size={11} />
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
