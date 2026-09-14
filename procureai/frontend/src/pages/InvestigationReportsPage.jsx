import React, { useState, useMemo, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import {
  FileSpreadsheet,
  Plus,
  Search,
  Download,
  Filter,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

import PageHeader from '../components/common/PageHeader';
import ReportSummaryCards from '../components/reports/ReportSummaryCards';
import ReportsTable from '../components/reports/ReportsTable';
import ReportDocumentModal from '../components/reports/ReportDocumentModal';
import CreateReportModal from '../components/reports/CreateReportModal';

import {
  REPORTS_SUMMARY,
  INITIAL_REPORTS,
} from '../data/mockReportsData';

import '../components/reports/reports.css';

export default function InvestigationReportsPage() {
  const location = useLocation();
  const [reports, setReports] = useState(INITIAL_REPORTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');

  // Modals state
  const [selectedReport, setSelectedReport] = useState(null);
  const [isCreateOpen, setIsCreateOpen] = useState(Boolean(location.state?.tenderId));
  const [prefilledTenderId, setPrefilledTenderId] = useState(location.state?.tenderId || null);

  useEffect(() => {
    if (location.state?.tenderId) {
      setPrefilledTenderId(location.state.tenderId);
      setIsCreateOpen(true);
    }
  }, [location.state]);

  // User feedback notice
  const [notification, setNotification] = useState('');

  // Status Filter options
  const STATUS_TABS = ['All', 'Open', 'Under Review', 'Completed', 'Escalated'];

  // Filtered reports computation
  const filteredReports = useMemo(() => {
    return reports.filter((rep) => {
      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = rep.report_id.toLowerCase().includes(q);
        const matchesTender = rep.tender_id.toLowerCase().includes(q);
        const matchesTitle = rep.procurement_title.toLowerCase().includes(q);
        const matchesVendor = rep.vendor_name.toLowerCase().includes(q);
        if (!matchesId && !matchesTender && !matchesTitle && !matchesVendor) {
          return false;
        }
      }

      // Status filter
      if (statusFilter !== 'All' && rep.investigation_status !== statusFilter) {
        return false;
      }

      return true;
    });
  }, [reports, searchQuery, statusFilter]);

  // Update status handler inside modal
  const handleUpdateStatus = (reportId, newStatus) => {
    setReports((prev) =>
      prev.map((r) => (r.report_id === reportId ? { ...r, investigation_status: newStatus } : r))
    );
    if (selectedReport && selectedReport.report_id === reportId) {
      setSelectedReport((prev) => ({ ...prev, investigation_status: newStatus }));
    }
    setNotification(`Status for ${reportId} updated to "${newStatus}".`);
    setTimeout(() => setNotification(''), 3500);
  };

  // Create report handler
  const handleCreateReport = (newReport) => {
    setReports((prev) => [newReport, ...prev]);
    setIsCreateOpen(false);
    setSelectedReport(newReport);
    setNotification(`Created new investigation case file: ${newReport.report_id}.`);
    setTimeout(() => setNotification(''), 4000);
  };

  // Download report dossier
  const handleDownloadReport = (report) => {
    const textContent = `
========================================================================
PROCUREAI OFFICIAL INVESTIGATION DOSSIER
========================================================================
REPORT ID:            ${report.report_id}
TENDER ID:            ${report.tender_id}
DATE RECORDED:        ${report.created_at}
INVESTIGATOR:         ${report.investigator_name}
STATUS:               ${report.investigation_status}

CASE SUBJECT:
Title:                ${report.procurement_title}
Contract Value:       ${report.contract_value}
Category:             ${report.category}
Supplier Entity:      ${report.vendor_name}

RISK ASSESSMENT:
Final Composite Score: ${report.final_risk_score} / 100 (${report.risk_level})
Rule-Based Score:     ${report.rule_score} / 100
ML Anomaly Score:     ${report.ml_anomaly_score} / 100

EXECUTIVE SUMMARY:
${report.executive_summary}

DETECTED ANOMALIES:
${report.triggered_rules.map((r, i) => `[${i + 1}] ${r}`).join('\n')}

INVESTIGATION FINDINGS:
${report.investigation_findings}

RECOMMENDED ACTIONS:
${report.recommended_actions}

INTERNAL NOTES:
${report.investigation_notes || 'None logged.'}
========================================================================
OFFICIAL USE // AUDIT DIVISION ONLY
========================================================================
    `.trim();

    const blob = new Blob([textContent], { type: 'text/plain;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${report.report_id}_ProcureAI_Dossier.txt`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setNotification(`Downloaded investigation dossier for ${report.report_id}.`);
    setTimeout(() => setNotification(''), 3500);
  };

  // Dynamic summary counters based on current state
  const currentSummary = {
    reportsGenerated: {
      value: reports.length,
      label: 'Reports Generated',
      subtext: 'Formal forensic audit files',
    },
    openInvestigations: {
      value: reports.filter((r) => r.investigation_status === 'Open').length + 6,
      label: 'Open Investigations',
      subtext: 'Active investigator queue',
    },
    criticalCases: {
      value: reports.filter((r) => r.risk_level === 'Critical').length,
      label: 'Critical Cases',
      subtext: 'Escalated to OIG / Antitrust',
    },
    resolvedCases: {
      value: reports.filter((r) => r.investigation_status === 'Completed').length + 14,
      label: 'Resolved Cases',
      subtext: 'Audits closed with findings',
    },
  };

  return (
    <div className="investigation-reports-page animate-fade-in">
      {/* 1. PAGE HEADER */}
      <PageHeader
        eyebrow="CASE MANAGEMENT & AUDIT DOSSIERS"
        title="Investigation Reports"
        subtitle="Review and document procurement cases flagged for investigation."
        icon={FileSpreadsheet}
        badgeText={`${reports.length} Case Files`}
        badgeVariant="neutral"
        actions={
          <button
            className="btn btn-primary"
            onClick={() => setIsCreateOpen(true)}
            title="Open new formal investigation report"
          >
            <Plus size={15} />
            <span>Create Report</span>
          </button>
        }
      />

      {/* Temporary Toast Notification */}
      {notification && (
        <div
          className="card animate-fade-in"
          style={{
            marginBottom: '1.5rem',
            padding: '0.75rem 1.25rem',
            borderLeft: '4px solid var(--primary-blue)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: 'var(--bg-card-subtle)',
          }}
        >
          <CheckCircle2 size={16} color="var(--primary-blue)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {notification}
          </span>
        </div>
      )}

      {/* 2. REPORT SUMMARY CARDS */}
      <ReportSummaryCards summary={currentSummary} />

      {/* 3. CONTROL & FILTER BAR */}
      <div className="reports-control-bar">
        <div className="reports-search-box">
          <Search size={15} color="var(--text-muted)" />
          <input
            type="text"
            className="reports-search-input"
            placeholder="Search report ID, tender, supplier, or title..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>

        <div className="status-filter-buttons">
          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginRight: '0.25rem' }}>
            Status:
          </span>
          {STATUS_TABS.map((tab) => (
            <button
              key={tab}
              className={`status-filter-btn ${statusFilter === tab ? 'active' : ''}`}
              onClick={() => setStatusFilter(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* 4. INVESTIGATION REPORTS TABLE */}
      <ReportsTable
        reports={filteredReports}
        onSelectReport={(report) => setSelectedReport(report)}
        onDownloadReport={handleDownloadReport}
      />

      {/* 5. STRUCTURED REPORT DOCUMENT PREVIEW MODAL */}
      {selectedReport && (
        <ReportDocumentModal
          report={selectedReport}
          onClose={() => setSelectedReport(null)}
          onUpdateStatus={handleUpdateStatus}
          onDownloadReport={handleDownloadReport}
        />
      )}

      {/* 6. CREATE REPORT MODAL */}
      {isCreateOpen && (
        <CreateReportModal
          onClose={() => setIsCreateOpen(false)}
          onCreateReport={handleCreateReport}
          initialTenderId={prefilledTenderId}
        />
      )}
    </div>
  );
}
