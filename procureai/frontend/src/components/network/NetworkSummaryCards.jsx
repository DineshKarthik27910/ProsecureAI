import React from 'react';
import { Building2, Network, AlertTriangle, ShieldAlert } from 'lucide-react';
import './network.css';

export default function NetworkSummaryCards({ summary }) {
  return (
    <div className="network-summary-grid">
      {/* 1. Total Suppliers */}
      <div className="network-summary-card variant-neutral">
        <div className="summary-card-header">
          <span className="summary-card-label">{summary.totalSuppliers.label}</span>
          <Building2 size={18} color="var(--accent-blue)" />
        </div>
        <div className="summary-card-value">{summary.totalSuppliers.value}</div>
        <div className="summary-card-subtext">{summary.totalSuppliers.subtext}</div>
      </div>

      {/* 2. Connected Suppliers */}
      <div className="network-summary-card variant-cyan">
        <div className="summary-card-header">
          <span className="summary-card-label">{summary.connectedSuppliers.label}</span>
          <Network size={18} color="var(--accent-cyan)" />
        </div>
        <div className="summary-card-value val-cyan">{summary.connectedSuppliers.value}</div>
        <div className="summary-card-subtext">{summary.connectedSuppliers.subtext}</div>
      </div>

      {/* 3. Suspicious Connections */}
      <div className="network-summary-card variant-risk-med">
        <div className="summary-card-header">
          <span className="summary-card-label">{summary.suspiciousConnections.label}</span>
          <AlertTriangle size={18} color="var(--risk-med)" />
        </div>
        <div className="summary-card-value val-risk-med">{summary.suspiciousConnections.value}</div>
        <div className="summary-card-subtext">{summary.suspiciousConnections.subtext}</div>
      </div>

      {/* 4. High-Risk Suppliers */}
      <div className="network-summary-card variant-risk-high">
        <div className="summary-card-header">
          <span className="summary-card-label">{summary.highRiskSuppliers.label}</span>
          <ShieldAlert size={18} color="var(--risk-high)" />
        </div>
        <div className="summary-card-value val-risk-high">{summary.highRiskSuppliers.value}</div>
        <div className="summary-card-subtext">{summary.highRiskSuppliers.subtext}</div>
      </div>
    </div>
  );
}
