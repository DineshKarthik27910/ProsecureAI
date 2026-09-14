import React from 'react';
import { ShieldAlert, ArrowLeftRight, AlertTriangle, Layers } from 'lucide-react';
import Badge from '../common/Badge';
import './network.css';

export default function SuspiciousConnectionsPanel({ connections }) {
  return (
    <div className="card" style={{ padding: '1.5rem' }}>
      <div className="panel-header-row">
        <div className="panel-title-group">
          <ShieldAlert size={18} color="var(--risk-high)" />
          <div>
            <h4 className="panel-title">Suspicious Connections Detected</h4>
            <p className="panel-subtitle">Neural entity resolution matches across competing bidders</p>
          </div>
        </div>

        <Badge variant="risk-high" pulse={true}>
          {connections.length} Cartel Rings Flagged
        </Badge>
      </div>

      <div className="connections-list">
        {connections.map((conn) => (
          <div
            key={conn.id}
            className={`connection-card severity-${conn.severity}`}
          >
            <div className="connection-parties-row">
              <div className="connection-entities">
                <span style={{ color: 'var(--text-primary)' }}>{conn.supplierA}</span>
                <ArrowLeftRight size={14} color="var(--accent-cyan)" />
                <span style={{ color: 'var(--text-primary)' }}>{conn.supplierB}</span>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                  {conn.flagType}
                </span>
                <Badge variant={conn.severityColor}>{conn.severity}</Badge>
              </div>
            </div>

            <p className="connection-reason-text">
              <strong style={{ color: 'var(--accent-cyan)' }}>Pattern Flag: </strong>
              "{conn.reason}" — {conn.detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
