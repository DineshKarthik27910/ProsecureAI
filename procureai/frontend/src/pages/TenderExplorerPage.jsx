import React, { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  FileSearch,
  Download,
  Database,
  SlidersHorizontal,
  FileCheck,
  CheckCircle2
} from 'lucide-react';

import PageHeader from '../components/common/PageHeader';
import TenderFilters from '../components/tenders/TenderFilters';
import TenderTable from '../components/tenders/TenderTable';
import TenderDetailDrawer from '../components/tenders/TenderDetailDrawer';

import { MOCK_TENDERS } from '../data/mockTendersData';
import api from '../services/api';
import '../components/tenders/tenders.css';

export default function TenderExplorerPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const urlSearch = searchParams.get('search') || '';
  const urlCategory = searchParams.get('category') || '';
  const urlRisk = searchParams.get('risk_level') || '';
  const urlStatus = searchParams.get('status') || '';
  const urlPage = parseInt(searchParams.get('page') || '1', 10) || 1;

  // Tender Data States
  const [tenders, setTenders] = useState(MOCK_TENDERS);
  const [totalRecords, setTotalRecords] = useState(MOCK_TENDERS.length);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveBackend, setIsLiveBackend] = useState(false);

  // Pagination States
  const [currentPage, setCurrentPage] = useState(urlPage);
  const [pageSize] = useState(25);
  const [totalPages, setTotalPages] = useState(1);

  // Filter States
  const [searchQuery, setSearchQuery] = useState(urlSearch);
  const [debouncedSearch, setDebouncedSearch] = useState(urlSearch);
  const [selectedCategory, setSelectedCategory] = useState(urlCategory);
  const [selectedRiskLevel, setSelectedRiskLevel] = useState(urlRisk);
  const [selectedStatus, setSelectedStatus] = useState(urlStatus);

  // Selected Tender for Investigation Detail Drawer
  const [selectedTender, setSelectedTender] = useState(null);

  // Export Feedback Notification
  const [exportNotice, setExportNotice] = useState('');

  // Debounce search input to avoid flood of requests while typing
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Keep search state in sync when URL changes externally (e.g. from Header search)
  useEffect(() => {
    if (urlSearch !== searchQuery) {
      setSearchQuery(urlSearch);
      setCurrentPage(1);
    }
  }, [urlSearch]);

  // Helper to keep URL searchParams synchronized
  const updateUrlParams = useCallback(
    (newSearch, newCategory, newRisk, newStatus, newPage) => {
      const params = {};
      if (newSearch) params.search = newSearch;
      if (newCategory && newCategory !== 'All') params.category = newCategory;
      if (newRisk && newRisk !== 'All') params.risk_level = newRisk;
      if (newStatus && newStatus !== 'All') params.status = newStatus;
      if (newPage > 1) params.page = String(newPage);
      setSearchParams(params, { replace: true });
    },
    [setSearchParams]
  );

  // Fetch paginated tenders from FastAPI endpoint
  useEffect(() => {
    let isMounted = true;
    async function fetchTenders() {
      setIsLoading(true);
      try {
        const res = await api.getTenders({
          page: currentPage,
          limit: pageSize,
          search: debouncedSearch,
          category: selectedCategory,
          risk_level: selectedRiskLevel,
          status: selectedStatus,
        });
        if (isMounted && res) {
          const items = res.items || res.data || [];
          setTenders(items);
          setTotalRecords(res.total ?? items.length);
          setTotalPages(
            res.pages ||
              Math.max(1, Math.ceil((res.total || items.length) / pageSize))
          );
          setIsLiveBackend(!res.isFallback);
        }
      } catch (err) {
        console.warn('[TenderExplorer] Fetch error, using fallback:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    fetchTenders();
    return () => {
      isMounted = false;
    };
  }, [
    currentPage,
    pageSize,
    debouncedSearch,
    selectedCategory,
    selectedRiskLevel,
    selectedStatus,
  ]);

  // Handle selecting a tender and enriching from GET /api/tenders/{tender_id}
  const handleSelectTender = useCallback(async (tender) => {
    setSelectedTender(tender);
    try {
      const detailed = await api.getTenderById(tender.tender_id);
      if (detailed) {
        setSelectedTender((prev) =>
          prev?.tender_id === tender.tender_id ? { ...prev, ...detailed } : prev
        );
      }
    } catch (err) {
      console.warn('[TenderExplorer] Failed to fetch tender detail:', err);
    }
  }, []);

  // Filter Handlers with automatic page reset and URL synchronization
  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
    updateUrlParams(val, selectedCategory, selectedRiskLevel, selectedStatus, 1);
  };

  const handleCategoryChange = (val) => {
    setSelectedCategory(val);
    setCurrentPage(1);
    updateUrlParams(searchQuery, val, selectedRiskLevel, selectedStatus, 1);
  };

  const handleRiskChange = (val) => {
    setSelectedRiskLevel(val);
    setCurrentPage(1);
    updateUrlParams(searchQuery, selectedCategory, val, selectedStatus, 1);
  };

  const handleStatusChange = (val) => {
    setSelectedStatus(val);
    setCurrentPage(1);
    updateUrlParams(searchQuery, selectedCategory, selectedRiskLevel, val, 1);
  };

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage);
    updateUrlParams(
      searchQuery,
      selectedCategory,
      selectedRiskLevel,
      selectedStatus,
      newPage
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Check if any filters are active
  const hasActiveFilters = Boolean(
    searchQuery || selectedCategory || selectedRiskLevel || selectedStatus
  );

  // Clear all filters handler
  const handleClearFilters = () => {
    setSearchQuery('');
    setSelectedCategory('');
    setSelectedRiskLevel('');
    setSelectedStatus('');
    setCurrentPage(1);
    setSearchParams({}, { replace: true });
  };

  // Export Data Handler
  const handleExportData = () => {
    // Generate CSV download from currently visible tenders
    const headers = 'Tender ID,Procurement Title,Category,Supplier,Award Value,Risk Score,Risk Level,Status\n';
    const rows = tenders
      .map(
        (t) =>
          `"${t.tender_id}","${t.procurement_title}","${t.category}","${t.vendor_name}",${t.award_value},${t.final_risk_score},"${t.risk_level}","${t.investigation_status}"`
      )
      .join('\n');
    
    const blob = new Blob([headers + rows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `procureai_tenders_export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(`Exported ${tenders.length} records to CSV successfully.`);
    setTimeout(() => setExportNotice(''), 4000);
  };

  return (
    <div className="tender-explorer-page animate-fade-in">
      {/* 1. PAGE HEADER */}
      <PageHeader
        eyebrow="PROCUREMENT AUDIT & OVERSIGHT"
        title="Tender Explorer"
        subtitle="Monitor, filter, and investigate procurement activity using anomaly-informed risk signals."
        icon={FileSearch}
        badgeText={`${totalRecords.toLocaleString()} Tenders Ingested`}
        badgeVariant={isLiveBackend ? 'cyan' : 'neutral'}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: '0.75rem',
                color: 'var(--text-muted)',
                background: 'var(--bg-card-subtle)',
                padding: '0.45rem 0.75rem',
                borderRadius: '6px',
                border: '1px solid var(--border-default)',
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
              }}
            >
              <Database size={13} color="var(--primary-blue)" />
              <span>{isLiveBackend ? 'FED-PROCURE 2026 (LIVE)' : 'FED-PROCURE 2026'}</span>
            </div>

            <button
              className="btn btn-primary"
              onClick={handleExportData}
              title="Export currently visible tenders dataset to CSV"
            >
              <Download size={14} />
              <span>Export Data</span>
            </button>
          </div>
        }
      />

      {/* Export Success Notification Banner */}
      {exportNotice && (
        <div
          className="card animate-fade-in"
          style={{
            marginBottom: '1.5rem',
            padding: '0.75rem 1.25rem',
            borderLeft: '4px solid var(--risk-low)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: 'var(--bg-card-subtle)',
          }}
        >
          <CheckCircle2 size={18} color="var(--risk-low)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {exportNotice}
          </span>
        </div>
      )}

      {/* 2. SEARCH AND FILTER SECTION */}
      <TenderFilters
        searchQuery={searchQuery}
        setSearchQuery={handleSearchChange}
        selectedCategory={selectedCategory}
        setSelectedCategory={handleCategoryChange}
        selectedRiskLevel={selectedRiskLevel}
        setSelectedRiskLevel={handleRiskChange}
        selectedStatus={selectedStatus}
        setSelectedStatus={handleStatusChange}
        onClearFilters={handleClearFilters}
        hasActiveFilters={hasActiveFilters}
        totalResults={totalRecords}
      />

      {/* 3. TENDER DATA TABLE */}
      <TenderTable
        tenders={tenders}
        selectedTender={selectedTender}
        onSelectTender={handleSelectTender}
        currentPage={currentPage}
        totalPages={totalPages}
        totalRecords={totalRecords}
        pageSize={pageSize}
        onPageChange={handlePageChange}
      />

      {/* 4. SLIDE-OUT INVESTIGATION DRAWER */}
      {selectedTender && (
        <TenderDetailDrawer
          tender={selectedTender}
          onClose={() => setSelectedTender(null)}
        />
      )}
    </div>
  );
}
