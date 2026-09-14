import React from 'react';
import { FileSpreadsheet, FolderClock, ShieldAlert, CheckCircle2 } from 'lucide-react';
import './reports.css';

export default function ReportSummaryCards({ summary }) {
  return (
    <div className="reports-summary-grid">
      {/* 1. Reports Generated */}
      <div className="report-summary-card">
        <div className="report-summary-header">
          <span className="report-summary-label">{summary.reportsGenerated.label}</span>
          <FileSpreadsheet size={17} color="#94A3B8" />
        </div>
        <div className="report-summary-value">{summary.reportsGenerated.value}</div>
        <div className="report-summary-subtext">{summary.reportsGenerated.subtext}</div>
      </div>

      {/* 2. Open Investigations */}
      <div className="report-summary-card">
        <div className="report-summary-header">
          <span className="report-summary-label">{summary.openInvestigations.label}</span>
          <FolderClock size={17} color="#38BDF8" />
        </div>
        <div className="report-summary-value" style={{ color: '#7DD3FC' }}>
          {summary.openInvestigations.value}
        </div>
        <div className="report-summary-subtext">{summary.openInvestigations.subtext}</div>
      </div>

      {/* 3. Critical Cases */}
      <div className="report-summary-card" style={{ borderColor: 'rgba(239, 68, 68, 0.3)' }}>
        <div className="report-summary-header">
          <span className="report-summary-label">{summary.criticalCases.label}</span>
          <ShieldAlert size={17} color="#EF4444" />
        </div>
        <div className="report-summary-value" style={{ color: '#FCA5A5' }}>
          {summary.criticalCases.value}
        </div>
        <div className="report-summary-subtext">{summary.criticalCases.subtext}</div>
      </div>

      {/* 4. Resolved Cases */}
      <div className="report-summary-card">
        <div className="report-summary-header">
          <span className="report-summary-label">{summary.resolvedCases.label}</span>
          <CheckCircle2 size={17} color="#10B981" />
        </div>
        <div className="report-summary-value" style={{ color: '#86EFAC' }}>
          {summary.resolvedCases.value}
        </div>
        <div className="report-summary-subtext">{summary.resolvedCases.subtext}</div>
      </div>
    </div>
  );
}
