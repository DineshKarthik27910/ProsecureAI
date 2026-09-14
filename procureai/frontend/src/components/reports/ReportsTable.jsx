import React from 'react';
import { FileText, Download, ChevronRight, Eye } from 'lucide-react';
import './reports.css';

export default function ReportsTable({
  reports,
  onSelectReport,
  onDownloadReport,
}) {
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Escalated':
        return 'status-pill-escalated';
      case 'Under Review':
        return 'status-pill-under-review';
      case 'Completed':
        return 'status-pill-completed';
      default:
        return 'status-pill-open';
    }
  };

  const getRiskBadgeClass = (level) => {
    switch (level) {
      case 'Critical':
        return 'badge-risk-high';
      case 'High':
        return 'badge-risk-high';
      case 'Moderate':
        return 'badge-risk-med';
      default:
        return 'badge-risk-low';
    }
  };

  if (reports.length === 0) {
    return (
      <div className="reports-table-card" style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>
        <FileText size={36} color="var(--text-muted)" style={{ margin: '0 auto 0.75rem', display: 'block' }} />
        <h4 style={{ fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>No Investigation Reports Found</h4>
        <p style={{ fontSize: '0.825rem' }}>Try adjusting your search criteria or create a new investigation report.</p>
      </div>
    );
  }

  return (
    <div className="reports-table-card">
      <div style={{ overflowX: 'auto' }}>
        <table className="reports-table">
          <thead>
            <tr>
              <th>Report ID</th>
              <th>Tender ID</th>
              <th>Procurement Title</th>
              <th>Supplier</th>
              <th>Risk Level</th>
              <th>Investigator Status</th>
              <th>Date Created</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((report) => (
              <tr
                key={report.report_id}
                className="reports-table-row"
                onClick={() => onSelectReport(report)}
              >
                {/* Report ID */}
                <td>
                  <span className="report-id-text">{report.report_id}</span>
                </td>

                {/* Tender ID */}
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                    {report.tender_id}
                  </span>
                </td>

                {/* Title */}
                <td>
                  <span
                    style={{
                      fontWeight: 500,
                      color: 'var(--text-primary)',
                      display: 'block',
                      maxWidth: '280px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                    title={report.procurement_title}
                  >
                    {report.procurement_title}
                  </span>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    {report.category} • {report.contract_value}
                  </span>
                </td>

                {/* Supplier */}
                <td>
                  <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                    {report.vendor_name}
                  </span>
                </td>

                {/* Risk Level */}
                <td>
                  <span className={`badge ${getRiskBadgeClass(report.risk_level)}`} style={{ fontSize: '0.7rem' }}>
                    {report.risk_level} ({report.final_risk_score})
                  </span>
                </td>

                {/* Investigator Status */}
                <td>
                  <span className={`investigator-status-pill ${getStatusBadgeClass(report.investigation_status)}`}>
                    {report.investigation_status}
                  </span>
                </td>

                {/* Date Created */}
                <td>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    {report.created_at}
                  </span>
                </td>

                {/* Action Buttons */}
                <td style={{ textAlign: 'right' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.4rem' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.75rem', gap: '0.3rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectReport(report);
                      }}
                      title="Open full formal investigation report"
                    >
                      <Eye size={12} />
                      <span>View</span>
                    </button>

                    <button
                      className="btn btn-ghost"
                      style={{ padding: '0.35rem 0.5rem', color: 'var(--text-muted)' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onDownloadReport(report);
                      }}
                      title="Download PDF dossier"
                    >
                      <Download size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
