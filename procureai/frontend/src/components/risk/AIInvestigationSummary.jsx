import React from 'react';
import { Sparkles, Brain, Cpu, ShieldAlert, CheckCircle2 } from 'lucide-react';
import './risk.css';

export default function AIInvestigationSummary({ summary, confidenceLevel }) {
  return (
    <div className="ai-summary-panel">
      <div>
        <div className="ai-summary-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={18} color="var(--accent-cyan)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              AI Investigation Summary
            </h4>
          </div>

          <div className="ai-summary-badge-group">
            <span className="ai-confidence-pill">
              Confidence: {confidenceLevel}
            </span>
          </div>
        </div>

        <p className="ai-summary-text" style={{ marginTop: '1.2rem' }}>
          "{summary}"
        </p>
      </div>

      <div className="ai-meta-specs">
        <div>
          <span style={{ color: 'var(--text-muted)' }}>DETECTION MODEL</span>
          <div style={{ color: 'var(--accent-cyan)', fontWeight: 600, marginTop: '2px' }}>
            ProcureGuard-v4.2
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>ANOMALY VECTOR</span>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
            Multi-Signal Collusion
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>BENCHMARK SET</span>
          <div style={{ color: 'var(--text-primary)', fontWeight: 600, marginTop: '2px' }}>
            14,200 Historical RFPs
          </div>
        </div>
        <div>
          <span style={{ color: 'var(--text-muted)' }}>AUDIT PRIORITY</span>
          <div style={{ color: '#FF4D4F', fontWeight: 600, marginTop: '2px' }}>
            Immediate Triage
          </div>
        </div>
      </div>
    </div>
  );
}
