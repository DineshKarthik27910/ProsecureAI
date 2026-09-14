import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Network,
  Share2,
  RotateCcw,
  ArrowLeft,
  ShieldAlert,
  Download,
  Activity,
  CheckCircle2
} from 'lucide-react';

import PageHeader from '../components/common/PageHeader';
import Badge from '../components/common/Badge';

import NetworkSummaryCards from '../components/network/NetworkSummaryCards';
import NetworkFilterBar from '../components/network/NetworkFilterBar';
import NetworkGraphCanvas from '../components/network/NetworkGraphCanvas';
import SupplierDetailsPanel from '../components/network/SupplierDetailsPanel';
import RelatedSuppliersSection from '../components/network/RelatedSuppliersSection';
import SuspiciousConnectionsPanel from '../components/network/SuspiciousConnectionsPanel';
import NetworkAIInsight from '../components/network/NetworkAIInsight';

import api from '../services/api';
import {
  NETWORK_SUMMARY,
  SUPPLIER_NODES,
  NETWORK_EDGES,
  SUSPICIOUS_CONNECTIONS,
  NETWORK_AI_INSIGHT,
  DEFAULT_SELECTED_SUPPLIER_ID,
} from '../data/mockSupplierNetworkData';

import '../components/network/network.css';

export default function SupplierNetworkPage() {
  const location = useLocation();
  const navigate = useNavigate();

  const [networkData, setNetworkData] = useState({
    summary: NETWORK_SUMMARY,
    nodes: SUPPLIER_NODES,
    edges: NETWORK_EDGES,
    suspicious_connections: SUSPICIOUS_CONNECTIONS,
    ai_insight: NETWORK_AI_INSIGHT,
  });

  const [selectedSupplierId, setSelectedSupplierId] = useState(DEFAULT_SELECTED_SUPPLIER_ID);

  useEffect(() => {
    let isMounted = true;
    async function loadNetwork() {
      const data = await api.getSupplierNetwork();
      if (isMounted && data && data.nodes && data.nodes.length > 0) {
        setNetworkData(data);
      }
    }
    loadNetwork();
    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const target = location.state?.supplier || location.state?.supplierName || location.state?.vendor_name;
    if (target && networkData.nodes.length > 0) {
      const q = target.toLowerCase().trim();
      const match = networkData.nodes.find(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          q.includes(s.name.toLowerCase()) ||
          s.id.toLowerCase() === q
      );
      if (match) {
        setSelectedSupplierId(match.id);
      }
    }
  }, [location.state, networkData.nodes]);

  // Filter States
  const [selectedRisk, setSelectedRisk] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedStrength, setSelectedStrength] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');

  // Export Feedback Notice
  const [notice, setNotice] = useState('');

  const hasActiveFilters = Boolean(
    selectedRisk || selectedCategory || selectedStrength || selectedStatus
  );

  const handleResetFilters = () => {
    setSelectedRisk('');
    setSelectedCategory('');
    setSelectedStrength('');
    setSelectedStatus('');
  };

  // Predicate to dim nodes not matching active filters
  const filterMatchPredicate = (node) => {
    if (selectedRisk && node.risk_level !== selectedRisk) return false;
    if (selectedCategory && node.category !== selectedCategory) return false;
    if (selectedStatus && node.investigation_status !== selectedStatus) return false;
    return true;
  };

  const selectedSupplier =
    networkData.nodes.find((s) => s.id === selectedSupplierId) ||
    networkData.nodes[0] ||
    SUPPLIER_NODES[0];

  const handleResetView = () => {
    setSelectedSupplierId(networkData.nodes[0]?.id || DEFAULT_SELECTED_SUPPLIER_ID);
    handleResetFilters();
    setNotice('Network visualization reset to initial surveillance state.');
    setTimeout(() => setNotice(''), 3000);
  };

  const handleExportNetwork = () => {
    setNotice('Supplier relationship network topology exported as high-res JSON/PDF.');
    setTimeout(() => setNotice(''), 3000);
  };

  return (
    <div className="supplier-network-page animate-fade-in">
      {/* 1. PAGE HEADER */}
      <PageHeader
        eyebrow="LINK ANALYSIS & RELATIONSHIP MAPPING"
        title="Supplier Network"
        subtitle="Explore supplier relationships and identify potentially suspicious procurement patterns."
        icon={Network}
        badgeText="Network Analysis Active"
        badgeVariant="neutral"
        badgePulse={false}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <button
              className="btn btn-secondary"
              onClick={handleResetView}
              title="Reset graph zoom, selection, and filters"
            >
              <RotateCcw size={14} />
              <span>Reset View</span>
            </button>

            <button
              className="btn btn-primary"
              onClick={handleExportNetwork}
              title="Export network graph topology"
            >
              <Share2 size={14} />
              <span>Export Network</span>
            </button>
          </div>
        }
      />

      {/* Temporary Toast Notice */}
      {notice && (
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
            {notice}
          </span>
        </div>
      )}

      {/* 2. NETWORK SUMMARY CARDS */}
      <NetworkSummaryCards summary={networkData.summary || NETWORK_SUMMARY} />

      {/* 8. FILTERS BAR */}
      <NetworkFilterBar
        selectedRisk={selectedRisk}
        setSelectedRisk={setSelectedRisk}
        selectedCategory={selectedCategory}
        setSelectedCategory={setSelectedCategory}
        selectedStrength={selectedStrength}
        setSelectedStrength={setSelectedStrength}
        selectedStatus={selectedStatus}
        setSelectedStatus={setSelectedStatus}
        onResetFilters={handleResetFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {/* 3, 4 & 5. MAIN STAGE: GRAPH CANVAS + DETAILS PANEL + RELATED SUPPLIERS */}
      <div className="network-main-stage">
        {/* Left (8 cols): Main Interactive Network Graph Canvas */}
        <NetworkGraphCanvas
          nodes={networkData.nodes || SUPPLIER_NODES}
          edges={networkData.edges || NETWORK_EDGES}
          selectedSupplierId={selectedSupplierId}
          onSelectSupplier={(node) => setSelectedSupplierId(node.id)}
          filterMatchPredicate={filterMatchPredicate}
        />

        {/* Right (4 cols): Selected Supplier Details Panel & Related Entities */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <SupplierDetailsPanel supplier={selectedSupplier} />

          <RelatedSuppliersSection
            relatedSuppliers={selectedSupplier.related_suppliers}
            onSelectRelatedSupplier={(id) => setSelectedSupplierId(id)}
          />
        </div>
      </div>

      {/* 6 & 7. SECONDARY ROW: SUSPICIOUS CONNECTIONS + AI INSIGHT */}
      <div className="network-secondary-row">
        {/* Left (7 cols): Suspicious Connections Detected */}
        <SuspiciousConnectionsPanel connections={networkData.suspicious_connections || SUSPICIOUS_CONNECTIONS} />

        {/* Right (5 cols): Network AI Intelligence Insight */}
        <NetworkAIInsight insight={networkData.ai_insight || NETWORK_AI_INSIGHT} />
      </div>

      {/* 10. ACTION BUTTONS & NAVIGATION */}
      <div className="risk-action-bar">
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Selected Supplier: {selectedSupplier.name} ({selectedSupplier.id})
          </span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Cross-reference with statutory procurement risk models or explore active solicitations
          </p>
        </div>

        <div className="risk-action-buttons-group">
          <button
            className="btn btn-secondary"
            onClick={() => navigate('/tenders')}
          >
            <ArrowLeft size={14} />
            <span>Back to Tender Explorer</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => navigate('/risk-analysis', { state: { supplierName: selectedSupplier.name } })}
          >
            <ShieldAlert size={14} />
            <span>View Risk Analysis</span>
          </button>
        </div>
      </div>
    </div>
  );
}
