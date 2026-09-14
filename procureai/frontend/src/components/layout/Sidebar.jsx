import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  FileSearch,
  AlertTriangle,
  Network,
  FileSpreadsheet,
  Shield,
  Activity,
  Database,
  ExternalLink
} from 'lucide-react';
import api from '../../services/api';
import './layout.css';

export default function Sidebar() {
  const [totalHighRisk, setTotalHighRisk] = useState('105');

  useEffect(() => {
    let isMounted = true;
    async function loadDatasetMetrics() {
      try {
        const overview = await api.getDashboardOverview();
        if (isMounted && overview) {
          const count =
            overview.total_high_risk ??
            overview.executive_metrics?.highRiskTenders?.value;
          if (count !== undefined && count !== null) {
            setTotalHighRisk(String(count));
          }
        }
      } catch (err) {
        console.warn('[Sidebar] Error fetching high-risk count, using fallback:', err);
      }
    }
    loadDatasetMetrics();
    return () => {
      isMounted = false;
    };
  }, []);

  const navItems = [
    {
      path: '/',
      label: 'Dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      path: '/tenders',
      label: 'Tender Explorer',
      icon: FileSearch,
      badge: null,
    },
    {
      path: '/risk-analysis',
      label: 'Risk Analysis',
      icon: AlertTriangle,
      badge: `${totalHighRisk} HIGH RISK`,
    },
    {
      path: '/supplier-network',
      label: 'Supplier Network',
      icon: Network,
      badge: null,
    },
    {
      path: '/reports',
      label: 'Investigation Reports',
      icon: FileSpreadsheet,
      badge: null,
    },
    {
      path: '/live-monitoring',
      label: 'Live Monitoring',
      icon: Activity,
      badge: 'LIVE',
    },
  ];

  return (
    <aside className="sidebar">
      {/* Brand Header */}
      <div className="sidebar-brand">
        <div className="brand-logo-row">
          <div className="brand-icon-box">
            <Shield size={22} strokeWidth={2.2} />
          </div>
          <div className="brand-text-col">
            <div className="brand-title">
              Procure<span>AI</span>
            </div>
            <div className="brand-tagline">Procurement Intelligence</div>
          </div>
        </div>

        {/* Live Audit Status Badge */}
        <div className="system-status-indicator">
          <div className="status-pulse-group">
            <span className="pulse-dot pulse-dot-green" />
            <span>AUDIT ENGINE ACTIVE</span>
          </div>
          <Activity size={12} />
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="sidebar-nav-section">
        <div className="nav-section-title">Investigation Modules</div>
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.path === '/'}
              className={({ isActive }) =>
                `nav-link-item ${isActive ? 'active' : ''}`
              }
            >
              <div className="nav-link-content">
                <Icon size={18} className="nav-icon" />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="nav-badge-pill">{item.badge}</span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Sidebar Footer */}
      <div className="sidebar-footer">
        {/* Active Ingested Dataset */}
        <div className="dataset-banner">
          <Database size={13} />
          <span>DATASET: FED-2026.Q3</span>
        </div>

        {/* Investigator Credentials Card */}
        <div className="investigator-card">
          <div className="investigator-avatar">SP</div>
          <div className="investigator-info">
            <div className="investigator-name">Insp. S. Patel</div>
            <div className="investigator-clearance">CLEARANCE: LVL 3</div>
          </div>
        </div>
      </div>
    </aside>
  );
}
