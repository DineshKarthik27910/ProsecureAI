import React, { useState } from 'react';
import { X, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import './reports.css';

const TENDER_OPTIONS = [
  {
    tender_id: 'PRC-2026-1042',
    title: 'National Highway Expansion Project',
    vendor: 'Apex Infrastructure Ltd.',
    category: 'Infrastructure',
    value: '₹8.4 Cr',
    final_risk_score: 92,
    risk_level: 'Critical',
  },
  {
    tender_id: 'PRC-2026-1047',
    title: 'Regional Hospital MRI & Medical Imaging Modernization',
    vendor: 'BioMed Supply Alliance Ltd',
    category: 'Medical Equipment',
    value: '₹6.2 Cr',
    final_risk_score: 92,
    risk_level: 'Critical',
  },
  {
    tender_id: 'PRC-2026-1051',
    title: 'Government Enterprise Cloud & Unified Data Migration',
    vendor: 'Vertex Cloud Systems Inc',
    category: 'IT Services',
    value: '₹8.9 Cr',
    final_risk_score: 87,
    risk_level: 'High',
  },
  {
    tender_id: 'PRC-2026-1065',
    title: 'Metropolitan Wastewater Treatment Filtration Retrofit',
    vendor: 'NovaTech Environmental Systems',
    category: 'Public Works',
    value: '₹3.7 Cr',
    final_risk_score: 84,
    risk_level: 'High',
  },
  {
    tender_id: 'PRC-2026-1078',
    title: 'Civic Center HVAC & Green Energy Rehabilitation',
    vendor: 'EcoThermal Engineering Corp',
    category: 'Construction',
    value: '₹4.1 Cr',
    final_risk_score: 72,
    risk_level: 'Moderate',
  },
];

export default function CreateReportModal({ onClose, onCreateReport, initialTenderId }) {
  const options = React.useMemo(() => {
    if (!initialTenderId) return TENDER_OPTIONS;
    const exists = TENDER_OPTIONS.find((t) => t.tender_id === initialTenderId);
    if (exists) return TENDER_OPTIONS;
    return [
      {
        tender_id: initialTenderId,
        title: `Procurement Contract Investigation (${initialTenderId})`,
        vendor: 'Flagged Vendor Entity',
        category: 'High-Risk Procurement',
        value: '₹8.5 Cr',
        final_risk_score: 92,
        risk_level: 'Critical',
      },
      ...TENDER_OPTIONS,
    ];
  }, [initialTenderId]);

  const [selectedTenderId, setSelectedTenderId] = useState(initialTenderId || TENDER_OPTIONS[0].tender_id);
  const [title, setTitle] = useState(() => {
    if (initialTenderId) {
      const found = TENDER_OPTIONS.find((t) => t.tender_id === initialTenderId);
      return found ? `Investigation Dossier: ${found.title}` : `Investigation Dossier: ${initialTenderId}`;
    }
    return '';
  });
  const [priority, setPriority] = useState('Critical');
  const [notes, setNotes] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const tender = options.find((t) => t.tender_id === selectedTenderId) || options[0];

    const newReport = {
      report_id: `REP-2026-00${Math.floor(10 + Math.random() * 90)}`,
      tender_id: tender.tender_id,
      procurement_title: title.trim() || tender.title,
      vendor_name: tender.vendor,
      category: tender.category,
      contract_value: tender.value,
      rule_score: 85,
      ml_anomaly_score: 90,
      final_risk_score: tender.final_risk_score,
      risk_level: priority,
      investigation_status: 'Open',
      investigator_name: 'Insp. S. Patel',
      created_at: new Date().toISOString().slice(0, 10),
      triggered_rules: [
        'Automated intake from procurement surveillance queue',
        'Suspicious price variance exceeding historical category bounds',
      ],
      ai_summary:
        'Initiated case file based on automated anomaly threshold violation.',
      executive_summary: `Preliminary investigation initiated for ${tender.tender_id} (${tender.title}) awarded to ${tender.vendor}.`,
      investigation_findings:
        'Initial evidence intake completed. Further audit of bidding logs and corporate filings pending.',
      recommended_actions:
        '1. Freeze award disbursement authorization.\n2. Request complete proposal file from awarding ministry.',
      investigation_notes: notes || 'Case registered by lead auditor.',
    };

    onCreateReport(newReport);
  };

  return (
    <div className="report-modal-backdrop" onClick={onClose}>
      <div
        className="create-modal-container animate-fade-in"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="report-modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <FileSpreadsheet size={18} color="var(--accent-blue)" />
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--text-primary)' }}>
              Create Investigation Report
            </h3>
          </div>

          <button className="drawer-close-btn" onClick={onClose} aria-label="Close modal">
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {/* Select Tender */}
          <div className="form-group">
            <label className="form-label">Select Flagged Tender</label>
            <select
              className="form-select"
              value={selectedTenderId}
              onChange={(e) => {
                setSelectedTenderId(e.target.value);
                const selected = options.find((t) => t.tender_id === e.target.value);
                if (selected && !title) setTitle(`Investigation Dossier: ${selected.title}`);
              }}
            >
              {options.map((t) => (
                <option key={t.tender_id} value={t.tender_id}>
                  {t.tender_id} — {t.title} ({t.vendor})
                </option>
              ))}
            </select>
          </div>

          {/* Investigation Title */}
          <div className="form-group">
            <label className="form-label">Investigation Report Title</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g., Forensic Review of Transportation Bid Rotation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          {/* Priority */}
          <div className="form-group">
            <label className="form-label">Initial Threat Priority</label>
            <select
              className="form-select"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
            >
              <option value="Critical">Critical Priority</option>
              <option value="High">High Priority</option>
              <option value="Moderate">Moderate Priority</option>
              <option value="Low">Low Priority</option>
            </select>
          </div>

          {/* Investigator Notes */}
          <div className="form-group">
            <label className="form-label">Initial Investigator Notes</label>
            <textarea
              className="form-textarea"
              placeholder="Document reason for opening formal inquiry, preliminary observations, or specific subpoenas..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          {/* Footer Actions */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <CheckCircle2 size={14} />
              <span>Generate Report</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
