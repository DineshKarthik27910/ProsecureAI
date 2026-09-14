import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Activity, Clock } from 'lucide-react';
import './dashboard.css';

export default function AnomalyTimeline({ events }) {
  const navigate = useNavigate();
  return (
    <div className="dashboard-panel-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <Activity size={18} color="var(--accent-blue)" />
          <div>
            <h3 className="panel-title">Recent Anomalies</h3>
            <p className="panel-subtitle">Real-time incoming risk signals</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          <Clock size={12} />
          <span>Live Feed</span>
        </div>
      </div>

      <div className="timeline-container">
        {events.map((evt) => (
          <div key={evt.id} className="timeline-item">
            <div
              className={`timeline-node ${
                evt.severity === 'High' ? 'node-high' : 'node-med'
              }`}
            />
            <div className="timeline-header">
              <span className="timeline-title">{evt.title}</span>
              <span className="timeline-time">{evt.time}</span>
            </div>
            <p className="timeline-desc">{evt.detail}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.2rem', alignItems: 'center' }}>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: '0.68rem',
                  color: 'var(--accent-cyan)',
                  background: 'var(--accent-cyan-subtle)',
                  padding: '0.1rem 0.4rem',
                  borderRadius: '3px',
                  cursor: 'pointer',
                }}
                onClick={() => navigate('/risk-analysis', { state: { selectedTenderId: evt.tenderId } })}
                title={`Examine forensic risk breakdown for ${evt.tenderId}`}
              >
                {evt.tenderId}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                {evt.type}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
