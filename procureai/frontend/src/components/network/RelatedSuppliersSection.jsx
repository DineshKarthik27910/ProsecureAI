import React from 'react';
import { Network, Building2, ChevronRight, AlertTriangle } from 'lucide-react';
import Badge from '../common/Badge';
import './network.css';

export default function RelatedSuppliersSection({
  relatedSuppliers,
  onSelectRelatedSupplier,
}) {
  if (!relatedSuppliers || relatedSuppliers.length === 0) {
    return (
      <div className="card" style={{ padding: '1rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
        No direct entity connections found for this contractor.
      </div>
    );
  }

  return (
    <div className="card" style={{ padding: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
          <Network size={16} color="var(--accent-cyan)" />
          <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Related Suppliers ({relatedSuppliers.length})
          </h4>
        </div>
        <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Click to focus</span>
      </div>

      <div className="related-suppliers-container">
        {relatedSuppliers.map((rel) => (
          <div
            key={rel.id}
            className="related-supplier-item"
            onClick={() => onSelectRelatedSupplier(rel.id)}
            title={`Select ${rel.name} on network canvas`}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Building2 size={13} color="var(--text-muted)" />
                <span style={{ fontSize: '0.825rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                  {rel.name}
                </span>
              </div>
              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                {rel.relationship_type} • {rel.shared_events} Shared Tenders
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  color: rel.risk_score >= 80 ? '#FF6B6B' : 'var(--risk-med-text)',
                }}
              >
                {rel.risk_score}/100
              </span>
              <ChevronRight size={14} color="var(--text-muted)" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
