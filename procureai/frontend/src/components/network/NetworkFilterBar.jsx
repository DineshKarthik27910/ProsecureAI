import React from 'react';
import { Filter, ChevronDown, RotateCcw } from 'lucide-react';
import './network.css';

export default function NetworkFilterBar({
  selectedRisk,
  setSelectedRisk,
  selectedCategory,
  setSelectedCategory,
  selectedStrength,
  setSelectedStrength,
  selectedStatus,
  setSelectedStatus,
  onResetFilters,
  hasActiveFilters,
}) {
  return (
    <div className="network-filter-card">
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
        <Filter size={15} color="var(--accent-cyan)" />
        <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>Network Filters:</span>
      </div>

      {/* 1. Risk Level Filter */}
      <div className="network-filter-item">
        <select
          className="filter-select"
          value={selectedRisk}
          onChange={(e) => setSelectedRisk(e.target.value)}
        >
          <option value="">All Risk Levels</option>
          <option value="Critical">Critical Risk</option>
          <option value="High">High Risk</option>
          <option value="Moderate">Moderate Risk</option>
          <option value="Low">Low Risk</option>
        </select>
        <ChevronDown size={14} className="filter-select-arrow" />
      </div>

      {/* 2. Procurement Category Filter */}
      <div className="network-filter-item">
        <select
          className="filter-select"
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
        >
          <option value="">All Categories</option>
          <option value="Infrastructure">Infrastructure</option>
          <option value="Medical Equipment">Medical Equipment</option>
          <option value="IT Services">IT Services</option>
          <option value="Construction">Construction</option>
          <option value="Public Works">Public Works</option>
        </select>
        <ChevronDown size={14} className="filter-select-arrow" />
      </div>

      {/* 3. Connection Strength Filter */}
      <div className="network-filter-item">
        <select
          className="filter-select"
          value={selectedStrength}
          onChange={(e) => setSelectedStrength(e.target.value)}
        >
          <option value="">All Connection Strengths</option>
          <option value="High">High Strength (3+ Links)</option>
          <option value="Medium">Medium Strength (2 Links)</option>
          <option value="Low">Low Strength (1 Link)</option>
        </select>
        <ChevronDown size={14} className="filter-select-arrow" />
      </div>

      {/* 4. Investigation Status Filter */}
      <div className="network-filter-item">
        <select
          className="filter-select"
          value={selectedStatus}
          onChange={(e) => setSelectedStatus(e.target.value)}
        >
          <option value="">All Investigation Statuses</option>
          <option value="Requires Investigation">Requires Investigation</option>
          <option value="Under Review">Under Review</option>
          <option value="Normal">Normal</option>
        </select>
        <ChevronDown size={14} className="filter-select-arrow" />
      </div>

      {/* Reset Button */}
      {hasActiveFilters && (
        <button
          className="btn btn-secondary"
          onClick={onResetFilters}
          style={{ fontSize: '0.78rem', padding: '0.45rem 0.8rem', gap: '0.35rem' }}
          title="Reset network filters"
        >
          <RotateCcw size={12} />
          <span>Reset Filters</span>
        </button>
      )}
    </div>
  );
}
