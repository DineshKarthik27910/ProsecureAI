import React from 'react';
import { History, Clock } from 'lucide-react';
import './risk.css';

export default function InvestigationTimeline({ timeline }) {
  return (
    <div className="timeline-panel">
      <div className="panel-header-row" style={{ marginBottom: '0.5rem' }}>
        <div className="panel-title-group">
          <History size={18} color="var(--accent-cyan)" />
          <div>
            <h4 className="panel-title">Forensic Audit Timeline</h4>
            <p className="panel-subtitle">Chronological progression of procurement milestones and detection flags</p>
          </div>
        </div>

        <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
          AUDIT CHAIN COMPLETE
        </span>
      </div>

      <div className="timeline-track-list">
        {timeline.map((step) => (
          <div key={step.id} className="timeline-track-item">
            <div className={`timeline-track-node node-${step.status}`} />

            <div className="timeline-item-title-row">
              <span className="timeline-item-title">{step.title}</span>
              <span className="timeline-item-timestamp">
                {step.date} • {step.time}
              </span>
            </div>

            <p className="timeline-item-desc">{step.detail}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
