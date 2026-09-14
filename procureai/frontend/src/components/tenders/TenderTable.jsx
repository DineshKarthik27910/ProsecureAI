import React from 'react';
import {
  Building2,
  ChevronRight,
  ChevronLeft,
  AlertTriangle,
  FileSearch,
  ArrowUpDown,
  ExternalLink
} from 'lucide-react';
import { formatIndianCurrency } from '../../utils/formatters';
import './tenders.css';

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const pages = [1];
  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  if (start > 2) {
    pages.push('...prev');
  }
  for (let i = start; i <= end; i++) {
    pages.push(i);
  }
  if (end < totalPages - 1) {
    pages.push('...next');
  }
  pages.push(totalPages);
  return pages;
}

export default function TenderTable({
  tenders,
  selectedTender,
  onSelectTender,
  currentPage = 1,
  totalPages = 1,
  totalRecords = 0,
  pageSize = 25,
  onPageChange,
}) {
  const formatCurrency = formatIndianCurrency;

  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'Requires Investigation':
        return 'status-investigation';
      case 'Under Review':
        return 'status-review';
      default:
        return 'status-normal';
    }
  };

  const getRiskLevelBadgeClass = (level) => {
    switch (level) {
      case 'Critical':
        return 'badge-critical';
      case 'High':
        return 'badge-high';
      case 'Moderate':
        return 'badge-moderate';
      default:
        return 'badge-low';
    }
  };

  if (tenders.length === 0) {
    return (
      <div
        className="tender-table-card"
        style={{
          padding: '4rem 2rem',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '1rem',
        }}
      >
        <FileSearch size={40} color="var(--text-muted)" />
        <div>
          <h3 style={{ fontSize: '1.1rem', color: 'var(--text-primary)', marginBottom: '0.25rem' }}>
            No Procurement Tenders Found
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            No contracts match your active filter criteria. Try adjusting your search query, sector category, or risk severity filters.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="tender-table-card">
      <div className="table-responsive-wrapper">
        <table className="tender-table">
          <thead>
            <tr>
              <th>Tender ID</th>
              <th>Procurement Title</th>
              <th>Category</th>
              <th>Supplier</th>
              <th>Contract Value</th>
              <th>Risk Score</th>
              <th>Risk Level</th>
              <th>Investigation Status</th>
              <th style={{ textAlign: 'right' }}>Action</th>
            </tr>
          </thead>
          <tbody>
            {tenders.map((tender) => {
              const isSelected = selectedTender?.tender_id === tender.tender_id;
              return (
                <tr
                  key={tender.tender_id}
                  className={`tender-table-row ${isSelected ? 'selected-row' : ''}`}
                  onClick={() => onSelectTender(tender)}
                >
                  {/* Tender ID */}
                  <td>
                    <span className="tender-id-badge">{tender.tender_id}</span>
                  </td>

                  {/* Procurement Title & Department */}
                  <td>
                    <span className="tender-title-link" title={tender.procurement_title}>
                      {tender.procurement_title}
                    </span>
                    <span className="tender-dept-sub">
                      {tender.department}
                    </span>
                  </td>

                  {/* Category */}
                  <td>
                    <span className="badge badge-neutral" style={{ fontSize: '0.72rem' }}>
                      {tender.category}
                    </span>
                  </td>

                  {/* Supplier Entity */}
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                      <Building2 size={13} color="var(--text-muted)" style={{ flexShrink: 0 }} />
                      <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>
                        {tender.vendor_name}
                      </span>
                    </div>
                  </td>

                  {/* Contract Value */}
                  <td>
                    <span className="tender-value-text">
                      {formatCurrency(tender.award_value)}
                    </span>
                  </td>

                  {/* Risk Score */}
                  <td>
                    <div className="risk-score-display">
                      <span className={`score-number level-${tender.risk_level}`}>
                        {tender.final_risk_score}
                      </span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                        /100
                      </span>
                    </div>
                  </td>

                  {/* Risk Level Badge */}
                  <td>
                    <span className={`risk-level-badge ${getRiskLevelBadgeClass(tender.risk_level)}`}>
                      {tender.risk_level}
                    </span>
                  </td>

                  {/* Investigation Status */}
                  <td>
                    <span className={`status-badge ${getStatusBadgeClass(tender.investigation_status)}`}>
                      {tender.investigation_status}
                    </span>
                  </td>

                  {/* Action */}
                  <td style={{ textAlign: 'right' }}>
                    <button
                      className="btn btn-secondary"
                      style={{ padding: '0.35rem 0.75rem', fontSize: '0.75rem', gap: '0.3rem' }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectTender(tender);
                      }}
                      title={`Open forensic investigation panel for ${tender.tender_id}`}
                    >
                      <span>Investigate</span>
                      <ChevronRight size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination Bar */}
      {totalRecords > 0 && (
        <div className="tender-pagination-bar">
          <div className="pagination-info">
            Showing <strong>{(currentPage - 1) * pageSize + 1}</strong> to{' '}
            <strong>{Math.min(currentPage * pageSize, totalRecords)}</strong> of{' '}
            <strong>{totalRecords.toLocaleString()}</strong> tenders
          </div>

          {totalPages > 1 && (
            <div className="pagination-controls">
              <button
                className="btn btn-secondary pagination-btn"
                disabled={currentPage <= 1}
                onClick={() => onPageChange && onPageChange(currentPage - 1)}
                title="Previous Page"
              >
                <ChevronLeft size={14} />
                <span>Prev</span>
              </button>

              <div className="pagination-pages">
                {getPageNumbers(currentPage, totalPages).map((p, idx) => {
                  if (typeof p === 'string') {
                    return (
                      <span key={`ellipsis-${idx}`} className="pagination-ellipsis">
                        ...
                      </span>
                    );
                  }
                  return (
                    <button
                      key={p}
                      className={`pagination-page-btn ${p === currentPage ? 'active' : ''}`}
                      onClick={() => onPageChange && onPageChange(p)}
                      title={`Go to page ${p}`}
                    >
                      {p}
                    </button>
                  );
                })}
              </div>

              <button
                className="btn btn-secondary pagination-btn"
                disabled={currentPage >= totalPages}
                onClick={() => onPageChange && onPageChange(currentPage + 1)}
                title="Next Page"
              >
                <span>Next</span>
                <ChevronRight size={14} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
