import React from 'react';
import { FileText, Building2, Layers, IndianRupee, Users, ShieldAlert } from 'lucide-react';
import Badge from '../common/Badge';
import './risk.css';

export default function TenderInfoPanel({ tender }) {
  return (
    <div className="tender-info-card">
      <div className="panel-header-row" style={{ marginBottom: '0.5rem' }}>
        <div className="panel-title-group">
          <FileText size={18} color="var(--accent-blue)" />
          <div>
            <h4 className="panel-title">Tender Specifications</h4>
            <p className="panel-subtitle">Official contract solicitation parameters</p>
          </div>
        </div>
      </div>

      <div className="tender-info-list">
        <div className="tender-info-row">
          <span className="tender-info-label">Tender ID</span>
          <span className="tender-info-value mono" style={{ color: 'var(--accent-cyan)' }}>
            {tender.tender_id}
          </span>
        </div>

        <div className="tender-info-row">
          <span className="tender-info-label">Procurement Category</span>
          <span className="tender-info-value">
            {tender.category}
          </span>
        </div>

        <div className="tender-info-row">
          <span className="tender-info-label">Awarded Supplier</span>
          <span className="tender-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Building2 size={13} color="var(--text-muted)" />
            <span>{tender.vendor_name}</span>
          </span>
        </div>

        <div className="tender-info-row">
          <span className="tender-info-label">Contract Value</span>
          <span className="tender-info-value mono" style={{ color: 'var(--text-primary)' }}>
            {tender.contract_value}
          </span>
        </div>

        <div className="tender-info-row">
          <span className="tender-info-label">Number of Bidders</span>
          <span className="tender-info-value" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
            <Users size={13} color="var(--risk-high)" />
            <span style={{ color: '#FF7875' }}>{tender.number_of_bidders} Bidders (Sub-critical)</span>
          </span>
        </div>

        <div className="tender-info-row">
          <span className="tender-info-label">Investigation Status</span>
          <Badge variant="risk-high">
            {tender.investigation_status}
          </Badge>
        </div>
      </div>
    </div>
  );
}
