import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  ShieldCheck,
  X,
  Scale,
  AlertTriangle,
  Zap,
  RotateCcw,
  TrendingUp,
  Users,
  Layers,
  FileCheck2,
  Lock,
  Keyboard
} from 'lucide-react';
import './layout.css';

export default function ProtocolHelpModal({ isOpen, onClose }) {
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return createPortal(
    <div className="protocol-help-backdrop" onClick={onClose} role="dialog" aria-modal="true">
      <div className="protocol-help-modal" onClick={(e) => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="protocol-help-header">
          <div className="protocol-help-title-group">
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: 8,
                background: 'var(--primary-navy)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
                flexShrink: 0
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <h3>ProcureAI Protocol & Forensic Reference Guide</h3>
              <p>Statutory standards, scoring models, and operational audit thresholds</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="drawer-close-btn"
            aria-label="Close protocol reference modal"
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="protocol-help-body">
          {/* Section 1: Forensic Scoring Triad */}
          <div className="protocol-help-section">
            <div className="protocol-section-title">
              <Scale size={15} color="var(--primary-blue)" />
              <span>1. Forensic Risk Scoring Architecture</span>
            </div>
            <div className="protocol-section-content">
              Every procurement contract is evaluated across a dual-engine analytical framework:
              <ul style={{ marginTop: '0.5rem', paddingLeft: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <li>
                  <strong>Rule-Based Heuristic Engine (60% Weight):</strong> Deterministic detection of statutory procurement violations including price gouging, excessive win rates, and collusion rings.
                </li>
                <li>
                  <strong>Unsupervised Isolation Forest ML (40% Weight):</strong> 13-dimensional numerical outlier model identifying anomalous bidding behavior beyond predefined heuristics.
                </li>
                <li>
                  <strong>Composite Score:</strong> Normalized into a standardized rating from <code>0.0</code> to <code>100.0</code>.
                </li>
              </ul>
            </div>
          </div>

          {/* Section 2: Risk Severity Classifications */}
          <div className="protocol-help-section">
            <div className="protocol-section-title">
              <AlertTriangle size={15} color="var(--risk-high)" />
              <span>2. Risk Severity Tiers & Audit Directives</span>
            </div>
            <div className="protocol-tier-grid">
              <div className="protocol-tier-box" style={{ borderColor: 'var(--risk-high-border)', background: 'var(--risk-high-bg)' }}>
                <div className="protocol-tier-title" style={{ color: 'var(--risk-high-text)' }}>
                  HIGH RISK (≥ 40)
                </div>
                <div className="protocol-tier-desc">
                  Statutory violations detected. Mandatory human forensic review required prior to contract disbursement.
                </div>
              </div>

              <div className="protocol-tier-box" style={{ borderColor: 'var(--risk-med-border)', background: 'var(--risk-med-bg)' }}>
                <div className="protocol-tier-title" style={{ color: 'var(--risk-med-text)' }}>
                  MODERATE (20 – 39)
                </div>
                <div className="protocol-tier-desc">
                  Behavioral anomalies identified. Contract flagged for secondary sampling and supervisory clearance.
                </div>
              </div>

              <div className="protocol-tier-box" style={{ borderColor: 'var(--risk-low-border)', background: 'var(--risk-low-bg)' }}>
                <div className="protocol-tier-title" style={{ color: 'var(--risk-low-text)' }}>
                  LOW RISK (&lt; 20)
                </div>
                <div className="protocol-tier-desc">
                  Conforms to regular procurement benchmarks, competitive bidding distributions, and historical trends.
                </div>
              </div>
            </div>
          </div>

          {/* Section 3: Statutory Anomaly Rules */}
          <div className="protocol-help-section">
            <div className="protocol-section-title">
              <Zap size={15} color="var(--accent-cyan)" />
              <span>3. Primary Forensic Anomaly Rules</span>
            </div>
            <div className="protocol-section-content" style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
              <div>
                <strong>• High Vendor Historical Win Rate:</strong> Vendor win rate exceeds 65% in competitive open tenders (benchmark: 20–25%).
              </div>
              <div>
                <strong>• Abnormal Price vs Market Benchmark:</strong> Award price deviates significantly (&gt;30% above or below) category baseline estimates.
              </div>
              <div>
                <strong>• Suspicious Bid Pricing Synchronization:</strong> Two or more co-bidders exhibit synchronized bid pricing (Pearson r ≥ 0.90) across shared tenders.
              </div>
              <div>
                <strong>• Suspiciously Low Bidder Competition:</strong> Open high-value solicitations attracting only 1 or 2 participating entities.
              </div>
              <div>
                <strong>• Excessive Post-Award Value Expansion:</strong> Change orders increasing post-award contract value by more than 20%.
              </div>
            </div>
          </div>

          {/* Section 4: Keyboard Shortcuts & System Classification */}
          <div className="protocol-help-section">
            <div className="protocol-section-title">
              <Keyboard size={15} color="var(--primary-navy)" />
              <span>4. Shortcuts & System Governance</span>
            </div>
            <div className="protocol-section-content" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div>
                <strong>Enter (in Header search):</strong> Navigates to filtered Tender Explorer.
              </div>
              <div>
                <strong>Esc Key:</strong> Closes any active slide-over drawer or dialog.
              </div>
              <div style={{ gridColumn: 'span 2', paddingTop: '0.4rem', borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Lock size={13} color="var(--text-muted)" />
                <span>Classification: <strong>OFFICIAL USE // AUDIT SYSTEM (LEVEL 3 CLEARANCE)</strong></span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="protocol-help-footer">
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
            PROCUREAI SYSTEM SPECIFICATION v1.4.0
          </span>
          <button className="btn btn-primary" onClick={onClose} style={{ padding: '0.45rem 1rem', fontSize: '0.8rem' }}>
            Close Guide
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
