import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  AlertTriangle,
  ShieldAlert,
  ArrowRight,
  IndianRupee,
  FileCheck,
  Users,
  Layers,
  Sparkles
} from 'lucide-react';
import Badge from '../common/Badge';
import './network.css';

export default function SupplierDetailsPanel({ supplier }) {
  const navigate = useNavigate();

  if (!supplier) return null;

  const getRiskColor = (level) => {
    switch (level) {
      case 'Critical':
        return '#EF4444';
      case 'High':
        return '#F87171';
      case 'Moderate':
        return '#F59E0B';
      default:
        return '#10B981';
    }
  };

  const handleOpenRiskAnalysis = () => {
    navigate('/risk-analysis', { state: { supplierName: supplier.name } });
  };

  return (
    <div className="supplier-details-card animate-fade-in">
      {/* Header */}
      <div className="supplier-details-header">
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <span className="supplier-id-tag">{supplier.id}</span>
            <Badge
              variant={
                supplier.risk_level === 'Critical'
                  ? 'risk-high'
                  : supplier.risk_level === 'High'
                  ? 'risk-high'
                  : 'risk-med'
              }
              pulse={supplier.risk_level === 'Critical'}
            >
              {supplier.risk_level} RISK
            </Badge>
          </div>
          <h3 className="supplier-name-title">{supplier.name}</h3>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
            Category: {supplier.category}
          </span>
        </div>

        {/* Risk Score Pill */}
        <div style={{ textAlign: 'right' }}>
          <div
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '1.75rem',
              fontWeight: 800,
              color: getRiskColor(supplier.risk_level),
              lineHeight: 1,
            }}
          >
            {supplier.risk_score}
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.68rem', color: 'var(--text-muted)' }}>
            / 100 RISK
          </span>
        </div>
      </div>

      {/* Mini 4-stat quad */}
      <div className="supplier-stat-quad">
        <div className="supplier-stat-cell">
          <span className="stat-cell-label">Contracts Won</span>
          <span className="stat-cell-val" style={{ color: 'var(--text-primary)' }}>
            {supplier.contracts_won} Awards
          </span>
        </div>

        <div className="supplier-stat-cell">
          <span className="stat-cell-label">Total Value</span>
          <span className="stat-cell-val" style={{ color: 'var(--accent-cyan)' }}>
            {supplier.total_contract_value}
          </span>
        </div>

        <div className="supplier-stat-cell">
          <span className="stat-cell-label">Related Suppliers</span>
          <span className="stat-cell-val" style={{ color: 'var(--text-primary)' }}>
            {supplier.related_suppliers_count} Linked
          </span>
        </div>

        <div className="supplier-stat-cell">
          <span className="stat-cell-label">Status</span>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#fca5a5' }}>
            {supplier.investigation_status}
          </span>
        </div>
      </div>

      {/* Suspicious Network Signals */}
      <div className="signals-checklist-box">
        <div className="signals-checklist-title">
          <ShieldAlert size={16} />
          <span>Suspicious Network Signals</span>
        </div>

        <ul className="signals-list">
          {supplier.network_signals.map((sig, idx) => (
            <li key={idx} className="signal-item">
              <AlertTriangle size={13} />
              <span>{sig}</span>
            </li>
          ))}
        </ul>
      </div>

      {/* CTA Button */}
      <button
        className="btn btn-primary"
        onClick={handleOpenRiskAnalysis}
        style={{ width: '100%', gap: '0.5rem', padding: '0.65rem' }}
      >
        <span>View Risk Analysis</span>
        <ArrowRight size={15} />
      </button>
    </div>
  );
}
