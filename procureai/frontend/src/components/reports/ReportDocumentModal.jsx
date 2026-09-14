import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  X,
  FileText,
  Download,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import './reports.css';

export default function ReportDocumentModal({
  report,
  onClose,
  onUpdateStatus,
  onDownloadReport,
}) {
  const navigate = useNavigate();

  if (!report) return null;

  const STATUS_OPTIONS = ['Open', 'Under Review', 'Completed', 'Escalated'];

  return (
    <div className="report-modal-backdrop" onClick={onClose}>
      <div
        className="report-modal-container animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="report-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <FileText size={18} color="var(--primary-blue)" />
            <div>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.82rem', color: 'var(--primary-blue)', fontWeight: 700 }}>
                {report.report_id}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginLeft: '0.5rem' }}>
                • Case Dossier (Date: {report.created_at})
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button
              className="btn btn-secondary"
              style={{ padding: '0.35rem 0.75rem', fontSize: '0.78rem', gap: '0.35rem' }}
              onClick={() => onDownloadReport(report)}
            >
              <Download size={13} />
              <span>Export PDF</span>
            </button>

            <button
              className="drawer-close-btn"
              onClick={onClose}
              aria-label="Close document"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Scrollable Formal Document Paper Body */}
        <div className="report-modal-body">
          <div className="dossier-document-paper">
            {/* 1. Formal Case Header Block */}
            <div className="dossier-header-block">
              <div>
                <div className="dossier-case-number">CASE REFERENCE: {report.report_id}</div>
                <h2 className="dossier-title">{report.procurement_title}</h2>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px', display: 'block' }}>
                  Audited by: {report.investigator_name || 'Senior Forensic Auditor'} • Integrity Oversight Division
                </span>
              </div>

              {/* Status Selector in Document */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 500 }}>
                  Investigation Status
                </span>
                <select
                  className="form-select"
                  style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem', minWidth: '140px' }}
                  value={report.investigation_status}
                  onChange={(e) => onUpdateStatus(report.report_id, e.target.value)}
                >
                  {STATUS_OPTIONS.map((st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. CASE INFORMATION SPECS */}
            <div className="dossier-grid-specs">
              <div className="dossier-spec-item">
                <span className="dossier-spec-label">Tender ID</span>
                <span className="dossier-spec-val" style={{ fontFamily: 'var(--font-mono)', color: 'var(--primary-blue)' }}>
                  {report.tender_id}
                </span>
              </div>
              <div className="dossier-spec-item">
                <span className="dossier-spec-label">Category</span>
                <span className="dossier-spec-val">{report.category}</span>
              </div>
              <div className="dossier-spec-item">
                <span className="dossier-spec-label">Supplier Entity</span>
                <span className="dossier-spec-val">{report.vendor_name}</span>
              </div>
              <div className="dossier-spec-item">
                <span className="dossier-spec-label">Contract Value</span>
                <span className="dossier-spec-val" style={{ fontFamily: 'var(--font-mono)' }}>
                  {report.contract_value}
                </span>
              </div>
            </div>

            {/* 3. RISK ASSESSMENT SPECS */}
            <div className="dossier-grid-specs" style={{ background: 'var(--risk-high-bg)', borderColor: 'var(--risk-high-border)' }}>
              <div className="dossier-spec-item">
                <span className="dossier-spec-label" style={{ color: 'var(--risk-high-text)' }}>Final Risk Score</span>
                <span className="dossier-spec-val" style={{ color: 'var(--risk-high)', fontSize: '1.1rem', fontFamily: 'var(--font-mono)' }}>
                  {report.final_risk_score}/100 ({report.risk_level})
                </span>
              </div>
              <div className="dossier-spec-item">
                <span className="dossier-spec-label">Rule-Based Score</span>
                <span className="dossier-spec-val" style={{ fontFamily: 'var(--font-mono)' }}>
                  {report.rule_score}/100
                </span>
              </div>
              <div className="dossier-spec-item">
                <span className="dossier-spec-label">ML Anomaly Score</span>
                <span className="dossier-spec-val" style={{ fontFamily: 'var(--font-mono)' }}>
                  {report.ml_anomaly_score}/100
                </span>
              </div>
              <div className="dossier-spec-item">
                <span className="dossier-spec-label">Classification</span>
                <span className="dossier-spec-val" style={{ color: 'var(--risk-high-text)' }}>
                  {report.risk_level.toUpperCase()} THREAT
                </span>
              </div>
            </div>

            {/* 4. EXECUTIVE SUMMARY */}
            <div className="dossier-section">
              <h4 className="dossier-section-title">1. Executive Summary</h4>
              <p className="dossier-paragraph">{report.executive_summary}</p>
            </div>

            {/* 5. DETECTED ANOMALIES */}
            <div className="dossier-section">
              <h4 className="dossier-section-title">2. Detected Anomalies & Risk Signals</h4>
              <ul className="dossier-anomalies-list">
                {report.triggered_rules.map((rule, idx) => (
                  <li key={idx} className="dossier-anomaly-bullet">
                    <AlertTriangle size={14} color="var(--risk-high)" style={{ flexShrink: 0, marginTop: '2px' }} />
                    <span>{rule}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* 6. AI & FORENSIC ANALYSIS SUMMARY */}
            <div className="dossier-section">
              <h4 className="dossier-section-title">3. Automated Anomaly Analysis Synthesis</h4>
              <p className="dossier-paragraph">"{report.ai_summary}"</p>
            </div>

            {/* 7. INVESTIGATION FINDINGS */}
            <div className="dossier-section">
              <h4 className="dossier-section-title">4. Investigation Findings & Evidence Chain</h4>
              <p className="dossier-paragraph">{report.investigation_findings}</p>
            </div>

            {/* 8. RECOMMENDED ACTIONS */}
            <div className="dossier-section">
              <h4 className="dossier-section-title">5. Recommended Actions</h4>
              <p className="dossier-paragraph" style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                {report.recommended_actions}
              </p>
            </div>

            {/* 9. INVESTIGATOR NOTES */}
            {report.investigation_notes && (
              <div className="dossier-section">
                <h4 className="dossier-section-title">6. Internal Investigator Notes</h4>
                <div
                  style={{
                    background: 'var(--bg-app)',
                    border: '1px solid var(--border-default)',
                    padding: '0.85rem',
                    borderRadius: '6px',
                    fontSize: '0.825rem',
                    color: 'var(--text-secondary)',
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {report.investigation_notes}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer with Cross-Module Navigation */}
        <div className="report-modal-footer">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Cross-Module Links:</span>
            
            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              onClick={() => {
                onClose();
                navigate('/tenders');
              }}
            >
              <span>View Tender</span>
              <ExternalLink size={12} />
            </button>

            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              onClick={() => {
                onClose();
                navigate('/risk-analysis', { state: { selectedTenderId: report.tender_id } });
              }}
            >
              <span>View Risk Analysis</span>
              <ExternalLink size={12} />
            </button>

            <button
              className="btn btn-secondary"
              style={{ fontSize: '0.75rem', padding: '0.35rem 0.65rem' }}
              onClick={() => {
                onClose();
                navigate('/supplier-network', { state: { supplier: report.vendor_name } });
              }}
            >
              <span>View Supplier Network</span>
              <ExternalLink size={12} />
            </button>
          </div>

          <button
            className="btn btn-primary"
            style={{ fontSize: '0.8rem', padding: '0.45rem 0.9rem' }}
            onClick={() => onDownloadReport(report)}
          >
            <Download size={13} />
            <span>Download Official Dossier</span>
          </button>
        </div>
      </div>
    </div>
  );
}
