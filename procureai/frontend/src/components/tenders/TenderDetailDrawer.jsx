import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import {
  X,
  ShieldAlert,
  AlertTriangle,
  Building2,
  IndianRupee,
  Users,
  Calendar,
  Layers,
  ArrowRight,
  Download,
  FileCheck,
  Zap
} from 'lucide-react';
import { formatIndianCurrency } from '../../utils/formatters';
import './tenders.css';

export default function TenderDetailDrawer({ tender, onClose }) {
  const navigate = useNavigate();

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!tender) return null;

  const formatCurrency = formatIndianCurrency;

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
    // Navigate to Risk Analysis with state payload for continuity
    navigate('/risk-analysis', { state: { selectedTenderId: tender.tender_id } });
  };

  return createPortal(
    <div className="drawer-backdrop" onClick={onClose}>
      <aside
        className="investigation-drawer"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="drawer-title"
      >
        {/* Drawer Header */}
        <div className="drawer-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
              <span className="tender-id-badge">{tender.tender_id}</span>
              <span className={`risk-level-badge badge-${tender.risk_level.toLowerCase()}`}>
                {tender.risk_level} Risk
              </span>
            </div>
            <h2 id="drawer-title" style={{ fontSize: '1.15rem', color: 'var(--text-primary)', lineHeight: 1.3 }}>
              {tender.procurement_title}
            </h2>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '4px' }}>
              {tender.department}
            </div>
          </div>

          <button
            className="drawer-close-btn"
            onClick={onClose}
            aria-label="Close investigation panel"
          >
            <X size={18} />
          </button>
        </div>

        {/* Scrollable Content Body */}
        <div className="drawer-scroll-body">
          {/* 1. Forensic Scoring Triad */}
          <div className="score-triad-container">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                Risk Scoring Decomposition
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', fontFamily: 'var(--font-mono)' }}>
                SURVEILLANCE ENGINE v1.4
              </span>
            </div>

            <div className="score-triad-row">
              <div className="score-triad-col">
                <span className="drawer-meta-label">Rule-Based</span>
                <span className="score-triad-num" style={{ color: 'var(--accent-blue)' }}>
                  {tender.rule_score}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Heuristics</span>
              </div>

              <div className="score-triad-col">
                <span className="drawer-meta-label">ML Anomaly</span>
                <span className="score-triad-num" style={{ color: 'var(--accent-cyan)' }}>
                  {tender.ml_anomaly_score}
                </span>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-muted)' }}>Neural Pattern</span>
              </div>

              <div className="score-triad-col" style={{ background: 'rgba(239, 68, 68, 0.08)', borderColor: 'rgba(239, 68, 68, 0.3)' }}>
                <span className="drawer-meta-label" style={{ color: '#FCA5A5' }}>Final Score</span>
                <span className="score-triad-num" style={{ color: getRiskColor(tender.risk_level) }}>
                  {tender.final_risk_score}
                </span>
                <span style={{ fontSize: '0.68rem', color: '#FCA5A5' }}>Composite</span>
              </div>
            </div>
          </div>

          {/* 2. "Why was this flagged?" Section */}
          <div className="flagged-reasons-box">
            <div className="flagged-header">
              <ShieldAlert size={18} />
              <span>Why was this tender flagged?</span>
            </div>

            <ul className="flagged-reasons-list">
              {tender.triggered_rules.map((rule, idx) => (
                <li key={idx} className="flagged-reason-item">
                  <AlertTriangle size={15} />
                  <span>{rule}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* 3. Procurement & Commercial Metadata */}
          <div className="drawer-meta-grid">
            <div className="drawer-meta-card">
              <span className="drawer-meta-label">Awarded Supplier</span>
              <span className="drawer-meta-val" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Building2 size={15} color="var(--accent-cyan)" />
                <span>{tender.vendor_name}</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                ID: {tender.vendor_id}
              </span>
            </div>

            <div className="drawer-meta-card">
              <span className="drawer-meta-label">Procurement Category</span>
              <span className="drawer-meta-val" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Layers size={15} color="var(--accent-blue)" />
                <span>{tender.category}</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Industry Sector
              </span>
            </div>

            <div className="drawer-meta-card">
              <span className="drawer-meta-label">Tender vs. Award Value</span>
              <span className="drawer-meta-val" style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>
                {formatCurrency(tender.award_value)}
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Baseline: {formatCurrency(tender.tender_value)}
              </span>
            </div>

            <div className="drawer-meta-card">
              <span className="drawer-meta-label">Bidding Competition</span>
              <span className="drawer-meta-val" style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <Users size={15} color={tender.number_of_bidders <= 2 ? 'var(--risk-high)' : 'var(--risk-low)'} />
                <span>{tender.number_of_bidders} {tender.number_of_bidders === 1 ? 'Bidder (Sole)' : 'Bidders'}</span>
              </span>
              <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                Status: {tender.investigation_status}
              </span>
            </div>
          </div>

          {/* Timeline Meta */}
          <div
            className="drawer-meta-card"
            style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <Calendar size={14} color="var(--text-muted)" />
              <span>Solicitation: {tender.date_posted}</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              <FileCheck size={14} color="var(--accent-cyan)" />
              <span>Awarded: {tender.award_date}</span>
            </div>
          </div>
        </div>

        {/* Drawer Action Footer */}
        <div className="drawer-footer">
          <button
            className="drawer-btn-full-analysis"
            onClick={handleOpenRiskAnalysis}
            title="Navigate to Risk Analysis Engine for this tender"
          >
            <Zap size={16} />
            <span>Open Full Risk Analysis</span>
            <ArrowRight size={15} />
          </button>

          <button
            className="btn btn-secondary"
            style={{ padding: '0.7rem 0.9rem' }}
            title="Export full tender forensic dossier"
            onClick={() => alert(`Dossier for ${tender.tender_id} exported to PDF.`)}
          >
            <Download size={15} />
          </button>
        </div>
      </aside>
    </div>,
    document.body
  );
}
