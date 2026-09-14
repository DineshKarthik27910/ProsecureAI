import React from 'react';
import { Search, ChevronDown, RotateCcw, Filter, X } from 'lucide-react';
import { TENDER_CATEGORIES, RISK_LEVELS, INVESTIGATION_STATUSES } from '../../data/mockTendersData';
import './tenders.css';

export default function TenderFilters({
  searchQuery,
  setSearchQuery,
  selectedCategory,
  setSelectedCategory,
  selectedRiskLevel,
  setSelectedRiskLevel,
  selectedStatus,
  setSelectedStatus,
  onClearFilters,
  hasActiveFilters,
  totalResults,
}) {
  return (
    <div className="tender-filters-card">
      <div className="filters-row">
        {/* 1. Global Search Box */}
        <div className="filter-search-box">
          <Search size={16} color="var(--text-muted)" />
          <input
            type="text"
            className="filter-search-input"
            placeholder="Search tender ID, supplier, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* 2. Risk Level Dropdown */}
        <div className="filter-select-group">
          <select
            className="filter-select"
            value={selectedRiskLevel}
            onChange={(e) => setSelectedRiskLevel(e.target.value)}
          >
            <option value="">All Risk Levels</option>
            {RISK_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level} Risk
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="filter-select-arrow" />
        </div>

        {/* 3. Procurement Category Dropdown */}
        <div className="filter-select-group">
          <select
            className="filter-select"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="">All Categories</option>
            {TENDER_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="filter-select-arrow" />
        </div>

        {/* 4. Investigation Status Dropdown */}
        <div className="filter-select-group">
          <select
            className="filter-select"
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            {INVESTIGATION_STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="filter-select-arrow" />
        </div>

        {/* 5. Clear Filters Button */}
        {hasActiveFilters && (
          <button
            className="btn btn-secondary"
            onClick={onClearFilters}
            style={{ fontSize: '0.8rem', padding: '0.5rem 0.85rem', gap: '0.4rem' }}
            title="Reset all search filters"
          >
            <RotateCcw size={13} />
            <span>Clear Filters</span>
          </button>
        )}
      </div>

      {/* Active Filter Tags & Count Summary */}
      <div className="filter-summary-row">
        <div>
          <span>Showing </span>
          <strong style={{ color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {totalResults}
          </strong>
          <span> procurement contracts matching criteria</span>
        </div>

        {hasActiveFilters && (
          <div className="filter-tags-list">
            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Active Filters:</span>
            {searchQuery && (
              <span className="active-filter-tag">
                Query: "{searchQuery}"
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => setSearchQuery('')} />
              </span>
            )}
            {selectedRiskLevel && (
              <span className="active-filter-tag">
                Risk: {selectedRiskLevel}
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => setSelectedRiskLevel('')} />
              </span>
            )}
            {selectedCategory && (
              <span className="active-filter-tag">
                Category: {selectedCategory}
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => setSelectedCategory('')} />
              </span>
            )}
            {selectedStatus && (
              <span className="active-filter-tag">
                Status: {selectedStatus}
                <X size={11} style={{ cursor: 'pointer' }} onClick={() => setSelectedStatus('')} />
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
