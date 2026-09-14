import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Building2,
  ChevronRight,
  ExternalLink,
  ShieldAlert,
  ArrowUpRight
} from 'lucide-react';
import Badge from '../common/Badge';
import './dashboard.css';

export default function HighRiskTendersTable({ tenders }) {
  const navigate = useNavigate();
  const getScoreBadgeClass = (score) => {
    if (score >= 80) return 'score-high';
    if (score >= 60) return 'score-med';
    return 'score-low';
  };

  const getStatusVariant = (status) => {
    if (status.includes('Escalated') || status.includes('High')) return 'risk-high';
    if (status.includes('Review') || status.includes('Audit')) return 'risk-med';
    return 'neutral';
  };

  return (
    <div className="dashboard-panel-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <ShieldAlert size={18} color="var(--risk-high)" />
          <div>
            <h3 className="panel-title">Top High-Risk Tenders</h3>
            <p className="panel-subtitle">Contracts flagged with severe statistical and behavioral bid anomalies</p>
          </div>
        </div>

        <button
          className="btn btn-ghost"
          style={{ fontSize: '0.78rem', gap: '0.35rem' }}
          onClick={() => navigate('/tenders')}
          title="View full tender explorer"
        >
          <span>View All Tenders</span>
          <ArrowUpRight size={14} />
        </button>
      </div>

      <div className="table-responsive-wrapper">
        <table className="intelligence-table">
          <thead>
            <tr>
              <th>Tender ID</th>
              <th>Category</th>
              <th>Supplier Entity</th>
              <th>Contract Value</th>
              <th>Risk Score</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Forensics</th>
            </tr>
          </thead>
          <tbody>
            {tenders.map((tender) => (
              <tr key={tender.id} className="table-row-interactive">
                <td>
                  <span className="tender-id-cell">{tender.id}</span>
                  <span className="tender-title-sub" title={tender.title}>
                    {tender.title}
                  </span>
                </td>
                <td>
                  <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                    {tender.category}
                  </span>
                </td>
                <td>
                  <div className="supplier-cell">
                    <Building2 size={14} color="var(--text-muted)" />
                    <span>{tender.supplier}</span>
                  </div>
                </td>
                <td>
                  <span className="contract-value-cell">{tender.value}</span>
                </td>
                <td>
                  <span className={`risk-score-pill ${getScoreBadgeClass(tender.riskScore)}`}>
                    <AlertTriangle size={11} />
                    {tender.riskScore}/100
                  </span>
                </td>
                <td>
                  <Badge variant={getStatusVariant(tender.status)}>
                    {tender.status}
                  </Badge>
                </td>
                <td style={{ textAlign: 'right' }}>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '0.3rem 0.6rem', fontSize: '0.75rem', color: 'var(--accent-cyan)' }}
                    title={`Inspect forensic dossier for ${tender.id}`}
                    onClick={() => navigate('/risk-analysis', { state: { selectedTenderId: tender.id } })}
                  >
                    <span>Inspect</span>
                    <ChevronRight size={14} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
