import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  Activity,
  Database,
  RefreshCw,
  AlertTriangle,
  Info,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Search,
  ExternalLink,
  Layers,
  FileText,
  SlidersHorizontal,
  X,
  AlertCircle
} from 'lucide-react';

import PageHeader from '../components/common/PageHeader';
import api from '../services/api';
import './liveMonitoring.css';

export default function LiveMonitoringPage() {
  // Live Dashboard Metrics State
  const [dashboard, setDashboard] = useState({
    total_live_records: 0,
    total_live_assessments: 0,
    insufficient_data_count: 0,
    pending_count: 0,
    compatible_count: 0,
    processed_count: 0,
    high_risk_count: 0,
    database_backend: 'SQLite (procureai.db)',
  });

  // Live Tenders Table State
  const [tenders, setTenders] = useState([]);
  const [tendersTotal, setTendersTotal] = useState(0);
  const [tendersPage, setTendersPage] = useState(1);
  const [tendersLimit] = useState(10);
  const [tendersTotalPages, setTendersTotalPages] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedRegion, setSelectedRegion] = useState('All');

  // Live Assessments Table State
  const [assessments, setAssessments] = useState([]);
  const [assessmentsTotal, setAssessmentsTotal] = useState(0);
  const [assessmentsPage, setAssessmentsPage] = useState(1);
  const [assessmentsLimit] = useState(10);
  const [assessmentsTotalPages, setAssessmentsTotalPages] = useState(1);
  const [selectedStatus, setSelectedStatus] = useState('All');

  // UI Lifecycle & Selected Item States
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedTenderModal, setSelectedTenderModal] = useState(null);
  const [modalLoading, setModalLoading] = useState(false);

  // Active view toggle between Tenders & Risk Assessments
  const [activeView, setActiveView] = useState('tenders');

  // Track if initial load is done to avoid flash
  const isInitialMount = useRef(true);

  // Format currency in Indian Rupees cleanly
  const formatCurrency = (val) => {
    if (val === null || val === undefined || isNaN(val)) return '—';
    const num = Number(val);
    if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)} Cr`;
    if (num >= 100000) return `₹${(num / 100000).toFixed(2)} Lakh`;
    return `₹${num.toLocaleString('en-IN')}`;
  };

  // Fetch all live data from backend SQLite endpoints
  const fetchLiveData = useCallback(async (isManual = false) => {
    if (isManual) setIsRefreshing(true);
    setError(null);

    try {
      // 1. Fetch live dashboard metrics
      const dashData = await api.getLiveDashboard();
      if (dashData) setDashboard(dashData);

      // 2. Fetch live tenders with current pagination & filters
      const tendersData = await api.getLiveTenders({
        page: tendersPage,
        limit: tendersLimit,
        category: selectedCategory,
        region: selectedRegion,
      });

      if (tendersData) {
        setTenders(tendersData.items || []);
        setTendersTotal(tendersData.total || 0);
        setTendersTotalPages(tendersData.total_pages || 1);
      }

      // 3. Fetch live risk assessments
      const assessData = await api.getLiveAssessments({
        page: assessmentsPage,
        limit: assessmentsLimit,
        status: selectedStatus,
      });

      if (assessData) {
        setAssessments(assessData.items || []);
        setAssessmentsTotal(assessData.total || 0);
        setAssessmentsTotalPages(assessData.total_pages || 1);
      }

      setLastUpdated(new Date());
    } catch (err) {
      console.error('[LiveMonitoringPage] Error fetching live data:', err);
      setError('Unable to connect to live monitoring database. Please ensure the backend server is active.');
    } finally {
      setIsLoading(false);
      if (isManual) setIsRefreshing(false);
    }
  }, [tendersPage, tendersLimit, selectedCategory, selectedRegion, assessmentsPage, assessmentsLimit, selectedStatus]);

  // Initial load
  useEffect(() => {
    fetchLiveData();
  }, [fetchLiveData]);

  // Safe 30-Second Automatic Refresh with clean effect teardown
  useEffect(() => {
    const intervalId = setInterval(() => {
      fetchLiveData(false);
    }, 30000); // 30 seconds

    return () => clearInterval(intervalId);
  }, [fetchLiveData]);

  // Open detail modal for a live tender
  const handleOpenDetail = async (recordId) => {
    setModalLoading(true);
    try {
      const detail = await api.getLiveTender(recordId);
      setSelectedTenderModal(detail);
    } catch (err) {
      console.error('[LiveMonitoringPage] Error fetching tender detail:', err);
    } finally {
      setModalLoading(false);
    }
  };

  // Render status badge
  const renderStatusBadge = (status) => {
    switch (status) {
      case 'insufficient_data':
        return <span className="status-pill insufficient">Insufficient Data</span>;
      case 'compatible':
        return <span className="status-pill compatible">Compatible</span>;
      case 'pending':
        return <span className="status-pill pending">Pending Review</span>;
      case 'processed':
        return <span className="status-pill processed">Processed</span>;
      default:
        return <span className="status-pill pending">{status || 'Pending'}</span>;
    }
  };

  return (
    <div className="live-monitoring-page">
      {/* SECTION 1: Page Header & Real-time Controls */}
      <PageHeader
        eyebrow="PROCUREAI LIVE SURVEILLANCE SUBSYSTEM"
        title="Live Procurement Monitoring"
        subtitle="Real-time monitoring of procurement records and audit lifecycle in the live ingestion database."
        icon={Activity}
        badgeText="LIVE PIPELINE"
        badgeVariant="cyan"
        badgePulse={true}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <Clock size={13} />
                Updated: {lastUpdated.toLocaleTimeString()}
              </span>
            )}
            <button
              onClick={() => fetchLiveData(true)}
              className={`live-refresh-btn ${isRefreshing ? 'spinning' : ''}`}
              title="Manual Refresh"
              disabled={isRefreshing}
            >
              <RefreshCw size={14} />
              <span>{isRefreshing ? 'Refreshing...' : 'Refresh'}</span>
            </button>
          </div>
        }
      />

      {/* Pipeline Truthfulness Banner */}
      <div className="live-pipeline-banner">
        <div className="pipeline-banner-content">
          <Info size={20} className="pipeline-banner-icon" />
          <div>
            <div className="pipeline-banner-title">Live Ingestion Pipeline Architecture Active</div>
            <div className="pipeline-banner-text">
              Procurement records below are currently streamed through the local SQLite ingestion pipeline (<code>procureai.db</code>) using verified mock live source feeds. Real-time government API endpoints will be integrated in future phases.
            </div>
          </div>
        </div>
        <div className="pipeline-status-badge">
          <span className="pulse-dot pulse-dot-green" />
          <span>PIPELINE HEALTHY</span>
        </div>
      </div>

      {/* Error Banner with Retry Button */}
      {error && (
        <div style={{ padding: '1rem', background: '#FEF2F2', border: '1px solid #FECACA', borderRadius: '8px', color: '#991B1B', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', fontSize: '0.85rem' }}>
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
          <button onClick={() => fetchLiveData(true)} className="live-refresh-btn" style={{ borderColor: '#FECACA' }}>
            Retry
          </button>
        </div>
      )}

      {/* SECTION 2: Live Dashboard KPI Metric Cards */}
      <div className="live-kpi-grid">
        <div className="live-kpi-card">
          <div className="live-kpi-header">
            <span>Total Live Records</span>
            <Database size={15} />
          </div>
          <div className="live-kpi-value">{dashboard.total_live_records}</div>
          <div className="live-kpi-desc">Records in SQLite database</div>
        </div>

        <div className="live-kpi-card">
          <div className="live-kpi-header">
            <span>Live Assessments</span>
            <Layers size={15} />
          </div>
          <div className="live-kpi-value">{dashboard.total_live_assessments}</div>
          <div className="live-kpi-desc">Surveillance evaluations</div>
        </div>

        <div className="live-kpi-card">
          <div className="live-kpi-header">
            <span>Insufficient Data</span>
            <AlertTriangle size={15} color="var(--risk-med)" />
          </div>
          <div className="live-kpi-value warning">{dashboard.insufficient_data_count}</div>
          <div className="live-kpi-desc">Awaiting forensic signals</div>
        </div>

        <div className="live-kpi-card">
          <div className="live-kpi-header">
            <span>Pending Review</span>
            <Clock size={15} />
          </div>
          <div className="live-kpi-value">{dashboard.pending_count}</div>
          <div className="live-kpi-desc">Unprocessed notices</div>
        </div>

        <div className="live-kpi-card">
          <div className="live-kpi-header">
            <span>Compatible</span>
            <CheckCircle2 size={15} color="var(--accent-blue)" />
          </div>
          <div className="live-kpi-value">{dashboard.compatible_count}</div>
          <div className="live-kpi-desc">Ready for ML analysis</div>
        </div>

        <div className="live-kpi-card">
          <div className="live-kpi-header">
            <span>Actual High Risk</span>
            <ShieldCheck size={15} color="var(--risk-high)" />
          </div>
          <div className="live-kpi-value alert">{dashboard.high_risk_count}</div>
          <div className="live-kpi-desc">Persisted critical alerts</div>
        </div>
      </div>

      {/* View Switcher Controls (Tenders vs Risk Assessments) */}
      <div className="live-section-card">
        <div className="live-section-header">
          <div className="live-section-title-group">
            <div style={{ display: 'flex', gap: '0.5rem', background: '#F1F5F9', padding: '0.25rem', borderRadius: '6px' }}>
              <button
                onClick={() => setActiveView('tenders')}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: activeView === 'tenders' ? 600 : 500,
                  background: activeView === 'tenders' ? '#FFFFFF' : 'transparent',
                  color: activeView === 'tenders' ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: activeView === 'tenders' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                Live Tenders ({tendersTotal})
              </button>
              <button
                onClick={() => setActiveView('assessments')}
                style={{
                  padding: '0.35rem 0.85rem',
                  borderRadius: '4px',
                  border: 'none',
                  fontSize: '0.82rem',
                  fontWeight: activeView === 'assessments' ? 600 : 500,
                  background: activeView === 'assessments' ? '#FFFFFF' : 'transparent',
                  color: activeView === 'assessments' ? 'var(--text-primary)' : 'var(--text-muted)',
                  cursor: 'pointer',
                  boxShadow: activeView === 'assessments' ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
                }}
              >
                Risk Assessments ({assessmentsTotal})
              </button>
            </div>
          </div>

          {/* Filtering Controls */}
          <div className="live-controls-row">
            {activeView === 'tenders' ? (
              <>
                <select
                  value={selectedCategory}
                  onChange={(e) => {
                    setSelectedCategory(e.target.value);
                    setTendersPage(1);
                  }}
                  className="live-filter-select"
                >
                  <option value="All">All Categories</option>
                  <option value="IT Services">IT Services</option>
                  <option value="Construction">Construction</option>
                  <option value="Medical Supplies">Medical Supplies</option>
                  <option value="Transport">Transport</option>
                  <option value="Consulting">Consulting</option>
                </select>

                <select
                  value={selectedRegion}
                  onChange={(e) => {
                    setSelectedRegion(e.target.value);
                    setTendersPage(1);
                  }}
                  className="live-filter-select"
                >
                  <option value="All">All Regions</option>
                  <option value="Central">Central</option>
                  <option value="East">East</option>
                  <option value="South">South</option>
                  <option value="North">North</option>
                </select>
              </>
            ) : (
              <select
                value={selectedStatus}
                onChange={(e) => {
                  setSelectedStatus(e.target.value);
                  setAssessmentsPage(1);
                }}
                className="live-filter-select"
              >
                <option value="All">All Processing Statuses</option>
                <option value="insufficient_data">Insufficient Data</option>
                <option value="compatible">Compatible</option>
                <option value="pending">Pending</option>
                <option value="processed">Processed</option>
              </select>
            )}
          </div>
        </div>

        {/* SECTION 3: Live Procurement Records Table */}
        {activeView === 'tenders' && (
          <>
            {isLoading ? (
              <div className="live-state-container">
                <RefreshCw size={24} className="spinning" />
                <div className="live-state-title">Loading live procurement records...</div>
              </div>
            ) : tenders.length === 0 ? (
              <div className="live-state-container">
                <Database size={32} />
                <div className="live-state-title">No Live Procurement Records Available</div>
                <div style={{ fontSize: '0.82rem', maxWidth: '400px' }}>
                  No matching records found in the live SQLite database. Trigger the ingestion pipeline to ingest incoming live tender notices.
                </div>
              </div>
            ) : (
              <div className="live-table-container">
                <table className="live-data-table">
                  <thead>
                    <tr>
                      <th>Tender ID</th>
                      <th>Procurement Title</th>
                      <th>Category</th>
                      <th>Region</th>
                      <th>Vendor Name</th>
                      <th>Contract Value</th>
                      <th>Publication Date</th>
                      <th>Processing Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tenders.map((t) => (
                      <tr
                        key={t.id}
                        className="clickable-row"
                        onClick={() => handleOpenDetail(t.id)}
                        title="Click to view forensic detail"
                      >
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-blue)' }}>
                          {t.tender_id || `ID-${t.id}`}
                        </td>
                        <td style={{ maxWidth: '280px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>
                          {t.title}
                        </td>
                        <td>{t.category}</td>
                        <td>{t.region}</td>
                        <td style={{ color: 'var(--text-primary)' }}>{t.vendor_name || '—'}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                          {formatCurrency(t.contract_value)}
                        </td>
                        <td style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {t.publication_date ? String(t.publication_date).slice(0, 10) : '—'}
                        </td>
                        <td>
                          {renderStatusBadge(t.processing_status || t.assessment?.processing_status || t.status || 'insufficient_data')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {tendersTotalPages > 1 && (
              <div className="live-pagination-bar">
                <span>
                  Showing Page {tendersPage} of {tendersTotalPages} ({tendersTotal} total live records)
                </span>
                <div className="pagination-btn-group">
                  <button
                    onClick={() => setTendersPage((p) => Math.max(1, p - 1))}
                    disabled={tendersPage <= 1}
                    className="page-nav-btn"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setTendersPage((p) => Math.min(tendersTotalPages, p + 1))}
                    disabled={tendersPage >= tendersTotalPages}
                    className="page-nav-btn"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* SECTION 4: Live Risk Assessments Table */}
        {activeView === 'assessments' && (
          <>
            {isLoading ? (
              <div className="live-state-container">
                <RefreshCw size={24} className="spinning" />
                <div className="live-state-title">Loading live risk assessments...</div>
              </div>
            ) : assessments.length === 0 ? (
              <div className="live-state-container">
                <Layers size={32} />
                <div className="live-state-title">No Risk Assessments Found</div>
                <div style={{ fontSize: '0.82rem', maxWidth: '400px' }}>
                  No risk assessment evaluations have been completed for current filters.
                </div>
              </div>
            ) : (
              <div className="live-table-container">
                <table className="live-data-table">
                  <thead>
                    <tr>
                      <th>Assessment ID</th>
                      <th>Tender ID</th>
                      <th>Processing Status</th>
                      <th>Risk Level</th>
                      <th>Composite Risk Score</th>
                      <th>Rule Score</th>
                      <th>ML Anomaly Score</th>
                      <th>Audit Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((a) => (
                      <tr key={a.id}>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>ASSESS-#{a.id}</td>
                        <td style={{ fontFamily: 'var(--font-mono)', fontWeight: 600, color: 'var(--accent-blue)' }}>
                          {a.tender_id || `REC-${a.live_record_id}`}
                        </td>
                        <td>{renderStatusBadge(a.processing_status)}</td>
                        <td>
                          {a.risk_level ? (
                            <span className={`status-pill ${a.risk_level.toLowerCase()}`}>{a.risk_level}</span>
                          ) : (
                            <span className="risk-pill-unscored">Not Yet Scored</span>
                          )}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {a.composite_risk_score !== null && a.composite_risk_score !== undefined
                            ? `${a.composite_risk_score.toFixed(1)} / 100`
                            : 'Not Available'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {a.rule_score !== null && a.rule_score !== undefined
                            ? a.rule_score.toFixed(1)
                            : '—'}
                        </td>
                        <td style={{ fontFamily: 'var(--font-mono)' }}>
                          {a.ml_score !== null && a.ml_score !== undefined
                            ? a.ml_score.toFixed(1)
                            : '—'}
                        </td>
                        <td style={{ maxWidth: '280px', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          {a.compatibility_details ? 'Forensic signals insufficient for ML fitting' : 'Standard Evaluation'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Assessments Pagination */}
            {assessmentsTotalPages > 1 && (
              <div className="live-pagination-bar">
                <span>
                  Showing Page {assessmentsPage} of {assessmentsTotalPages} ({assessmentsTotal} total assessments)
                </span>
                <div className="pagination-btn-group">
                  <button
                    onClick={() => setAssessmentsPage((p) => Math.max(1, p - 1))}
                    disabled={assessmentsPage <= 1}
                    className="page-nav-btn"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setAssessmentsPage((p) => Math.min(assessmentsTotalPages, p + 1))}
                    disabled={assessmentsPage >= assessmentsTotalPages}
                    className="page-nav-btn"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* SECTION 7: Detail View Modal */}
      {selectedTenderModal && (
        <div className="live-modal-backdrop" onClick={() => setSelectedTenderModal(null)}>
          <div className="live-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="live-modal-header">
              <div>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontFamily: 'var(--font-mono)' }}>
                  LIVE PROCUREMENT NOTICE
                </span>
                <div className="live-modal-title">
                  {selectedTenderModal.title || `Tender #${selectedTenderModal.tender_id}`}
                </div>
              </div>
              <button
                onClick={() => setSelectedTenderModal(null)}
                className="live-modal-close"
                title="Close"
              >
                <X size={18} />
              </button>
            </div>

            <div className="live-modal-body">
              {/* Unscored Forensic Notice */}
              <div className="live-unscored-notice">
                <Info size={18} style={{ flexShrink: 0, marginTop: '0.1rem' }} />
                <div>
                  <strong>Forensic Signal Notice:</strong> This record has not yet been fully risk scored because sufficient forensic data is not currently available (pending market valuation appraisals and post-award contract completion metrics).
                </div>
              </div>

              {/* Detail Grid */}
              <div className="live-detail-grid">
                <div className="live-detail-item">
                  <span className="live-detail-label">Tender ID</span>
                  <span className="live-detail-val" style={{ fontFamily: 'var(--font-mono)' }}>
                    {selectedTenderModal.tender_id}
                  </span>
                </div>

                <div className="live-detail-item">
                  <span className="live-detail-label">External Reference</span>
                  <span className="live-detail-val" style={{ fontFamily: 'var(--font-mono)' }}>
                    {selectedTenderModal.external_id || '—'}
                  </span>
                </div>

                <div className="live-detail-item">
                  <span className="live-detail-label">Source Feed</span>
                  <span className="live-detail-val">{selectedTenderModal.source}</span>
                </div>

                <div className="live-detail-item">
                  <span className="live-detail-label">Vendor Name</span>
                  <span className="live-detail-val">{selectedTenderModal.vendor_name || '—'}</span>
                </div>

                <div className="live-detail-item">
                  <span className="live-detail-label">Category / Sector</span>
                  <span className="live-detail-val">{selectedTenderModal.category}</span>
                </div>

                <div className="live-detail-item">
                  <span className="live-detail-label">Region</span>
                  <span className="live-detail-val">{selectedTenderModal.region}</span>
                </div>

                <div className="live-detail-item">
                  <span className="live-detail-label">Contract Value</span>
                  <span className="live-detail-val" style={{ fontFamily: 'var(--font-mono)', fontWeight: 600 }}>
                    {formatCurrency(selectedTenderModal.contract_value)} {selectedTenderModal.currency}
                  </span>
                </div>

                <div className="live-detail-item">
                  <span className="live-detail-label">Publication Date</span>
                  <span className="live-detail-val">
                    {selectedTenderModal.publication_date ? String(selectedTenderModal.publication_date).slice(0, 10) : '—'}
                  </span>
                </div>

                <div className="live-detail-item">
                  <span className="live-detail-label">Closing Date</span>
                  <span className="live-detail-val">
                    {selectedTenderModal.closing_date ? String(selectedTenderModal.closing_date).slice(0, 10) : '—'}
                  </span>
                </div>

                <div className="live-detail-item">
                  <span className="live-detail-label">Processing Status</span>
                  <div>
                    {renderStatusBadge(selectedTenderModal.assessment?.processing_status || 'insufficient_data')}
                  </div>
                </div>
              </div>

              {/* Source URL */}
              {selectedTenderModal.source_url && (
                <div className="live-detail-item">
                  <span className="live-detail-label">Source URL</span>
                  <a
                    href={selectedTenderModal.source_url}
                    target="_blank"
                    rel="noreferrer"
                    style={{ fontSize: '0.82rem', color: 'var(--accent-blue)', wordBreak: 'break-all', display: 'flex', alignItems: 'center', gap: '0.3rem' }}
                  >
                    <span>{selectedTenderModal.source_url}</span>
                    <ExternalLink size={13} />
                  </a>
                </div>
              )}

              {/* Raw Payload Explorer */}
              {selectedTenderModal.raw_data && (
                <div className="live-detail-item">
                  <span className="live-detail-label">Raw Ingestion Payload</span>
                  <pre style={{ background: '#0F172A', color: '#E2E8F0', padding: '0.75rem', borderRadius: '6px', fontSize: '0.72rem', overflowX: 'auto', maxHeight: '140px' }}>
                    {typeof selectedTenderModal.raw_data === 'string'
                      ? selectedTenderModal.raw_data
                      : JSON.stringify(selectedTenderModal.raw_data, null, 2)}
                  </pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
