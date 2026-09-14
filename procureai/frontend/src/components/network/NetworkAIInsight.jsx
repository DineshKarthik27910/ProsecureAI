import React from 'react';
import { Brain, Sparkles, ShieldAlert, Cpu } from 'lucide-react';
import './network.css';

export default function NetworkAIInsight({ insight }) {
  return (
    <div className="ai-network-panel">
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Brain size={18} color="var(--accent-cyan)" />
            <h4 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              {insight.title}
            </h4>
          </div>

          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: '0.72rem',
              fontWeight: 700,
              padding: '0.2rem 0.6rem',
              borderRadius: '9999px',
              background: 'rgba(0, 229, 255, 0.12)',
              color: 'var(--accent-cyan)',
              border: '1px solid var(--border-accent)',
            }}
          >
            AI Confidence: {insight.confidence}
          </span>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
          "{insight.summary}"
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '0.65rem',
          background: 'rgba(7, 11, 20, 0.6)',
          borderRadius: '8px',
          padding: '0.75rem',
          border: '1px solid var(--border-subtle)',
          fontFamily: 'var(--font-mono)',
          fontSize: '0.72rem',
        }}
      >
        <div>
          <span style={{ color: 'var(--text-muted)' }}>PRIMARY CLUSTER</span>
          <div style={{ color: 'var(--accent-cyan)', fontWeight: 600, marginTop: '2px' }}>
            {insight.clusterDetected}
          </div>
        </div>

        <div>
          <span style={{ color: 'var(--text-muted)' }}>ESTIMATED CAPITAL</span>
          <div style={{ color: '#FF7875', fontWeight: 600, marginTop: '2px' }}>
            {insight.exposureEstimate} At Risk
          </div>
        </div>
      </div>
    </div>
  );
}
