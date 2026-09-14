import React, { useState, useEffect, useCallback } from 'react';
import {
  ShieldAlert,
  FileText,
  IndianRupee,
  Activity,
  Download,
  RefreshCw,
  Clock,
  Zap,
  CheckCircle2
} from 'lucide-react';

import StatCard from '../components/dashboard/StatCard';
import RiskTrendChart from '../components/dashboard/RiskTrendChart';
import RiskDistributionChart from '../components/dashboard/RiskDistributionChart';
import HighRiskTendersTable from '../components/dashboard/HighRiskTendersTable';
import AIInsightsPanel from '../components/dashboard/AIInsightsPanel';
import AnomalyTimeline from '../components/dashboard/AnomalyTimeline';

import {
  EXECUTIVE_METRICS,
  RISK_TREND_DATA,
  RISK_DISTRIBUTION_DATA,
  TOP_HIGH_RISK_TENDERS,
  AI_INSIGHTS,
  RECENT_ANOMALIES,
} from '../data/mockProcurementData';

import api from '../services/api';
import '../components/dashboard/dashboard.css';

export default function DashboardPage() {
  const [metrics, setMetrics] = useState(EXECUTIVE_METRICS);
  const [riskTrend, setRiskTrend] = useState(RISK_TREND_DATA);
  const [riskDistribution, setRiskDistribution] = useState(RISK_DISTRIBUTION_DATA);
  const [topTenders, setTopTenders] = useState(TOP_HIGH_RISK_TENDERS);
  const [insights, setInsights] = useState(AI_INSIGHTS);
  const [anomalies, setAnomalies] = useState(RECENT_ANOMALIES);

  const [isScanning, setIsScanning] = useState(false);
  const [scanMessage, setScanMessage] = useState('');
  const [isLiveBackend, setIsLiveBackend] = useState(false);
  const [lastUpdatedText, setLastUpdatedText] = useState('Just now');

  const loadDashboardData = useCallback(async (isManualScan = false) => {
    try {
      const data = await api.getDashboardOverview();
      if (data) {
        if (data.executive_metrics) setMetrics(data.executive_metrics);
        if (data.risk_trend) setRiskTrend(data.risk_trend);
        if (data.risk_distribution) setRiskDistribution(data.risk_distribution);
        if (data.top_high_risk_tenders) setTopTenders(data.top_high_risk_tenders);
        if (data.ai_insights) setInsights(data.ai_insights);
        if (data.recent_anomalies) setAnomalies(data.recent_anomalies);
        setIsLiveBackend(!data.isFallback);
      }
      setLastUpdatedText('Just now');
      return data;
    } catch (err) {
      console.warn('[Dashboard] Failed to fetch overview:', err);
      setIsLiveBackend(false);
      return null;
    }
  }, []);

  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  const handleRunScan = async () => {
    setIsScanning(true);
    setScanMessage('Surveillance scan in progress...');
    const result = await loadDashboardData(true);
    setTimeout(() => {
      setIsScanning(false);
      const anomaliesCount = result?.executive_metrics?.anomaliesDetected?.value || '156';
      setScanMessage(`AI scan completed: ${anomaliesCount} anomaly signals confirmed.`);
      setTimeout(() => setScanMessage(''), 4000);
    }, 900);
  };

  const handleExportAuditSummary = () => {
    try {
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      const csvLines = [
        'PROCUREAI EXECUTIVE AUDIT SUMMARY REPORT',
        `Generated: ${now}`,
        `Audit Engine Mode: ${isLiveBackend ? 'LIVE API GATEWAY' : 'OFFLINE FALLBACK'}`,
        '',
        '--- EXECUTIVE SURVEILLANCE METRICS ---',
        `Total Tenders Monitored: ${metrics.totalTenders?.value || '10000'}`,
        `High-Risk Tenders: ${metrics.highRiskTenders?.value || '105'}`,
        `Potential Value at Risk: ${metrics.valueAtRisk?.value || '₹3388.00 Cr'}`,
        `Anomalies Detected: ${metrics.anomaliesDetected?.value || '1527'}`,
        '',
        '--- RISK DISTRIBUTION BREAKDOWN ---',
        ...(riskDistribution || []).map((d) => `${d.name}: ${d.value} tenders (${d.percent})`),
        '',
        '--- TOP FLAGGED HIGH-RISK SOLICITATIONS ---',
        'Tender ID,Procurement Title,Category,Supplier Entity,Contract Value,Risk Score,Status',
        ...(topTenders || []).map((t) =>
          `"${t.id}","${(t.title || '').replace(/"/g, '""')}","${t.category}","${(t.supplier || '').replace(/"/g, '""')}","${t.value}",${t.riskScore},"${t.status}"`
        ),
      ];

      const blob = new Blob([csvLines.join('\n')], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ProcureAI_Audit_Summary_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setScanMessage('Audit summary dossier compiled and downloaded successfully.');
      setTimeout(() => setScanMessage(''), 4000);
    } catch (err) {
      console.error('Failed to export audit summary:', err);
      setScanMessage('Error exporting audit summary dossier.');
      setTimeout(() => setScanMessage(''), 4000);
    }
  };

  return (
    <div className="dashboard-page animate-fade-in">
      {/* 1. DASHBOARD HERO SECTION */}
      <section className="dashboard-hero-section">
        <div className="hero-text-block">
          <div className="hero-meta-row">
            <div className="live-status-pill">
              <span className={`pulse-dot ${isLiveBackend ? 'pulse-dot-cyan' : 'pulse-dot-cyan'}`} />
              <span>{isLiveBackend ? 'AUDIT ENGINE ACTIVE (LIVE API)' : 'AUDIT ENGINE ACTIVE'}</span>
            </div>

            <div className="hero-last-updated">
              <Clock size={13} />
              <span>Last updated: {lastUpdatedText}</span>
            </div>
          </div>

          <h1 className="hero-title">Procurement Intelligence Overview</h1>
          <p className="hero-subtitle">
            Continuous oversight and anomaly detection across public procurement contracts, prioritizing potential collusion, price inflation, and compliance risks for investigator review.
          </p>
        </div>

        <div className="hero-actions-row">
          <button
            className="btn btn-secondary"
            onClick={handleRunScan}
            disabled={isScanning}
          >
            <RefreshCw
              size={14}
              className={isScanning ? 'animate-spin' : ''}
            />
            <span>{isScanning ? 'Scanning...' : 'Run Risk Scan'}</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={handleExportAuditSummary}
            title="Download live audit summary CSV"
          >
            <Download size={14} />
            <span>Export Audit Summary</span>
          </button>
        </div>
      </section>

      {/* Temporary Scan Feedback Alert if triggered */}
      {scanMessage && (
        <div
          className="card animate-fade-in"
          style={{
            marginBottom: '1.5rem',
            padding: '0.85rem 1.25rem',
            borderLeft: '4px solid var(--accent-cyan)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.65rem',
            background: 'var(--bg-card-subtle)',
          }}
        >
          <CheckCircle2 size={18} color="var(--accent-cyan)" />
          <span style={{ fontSize: '0.85rem', color: 'var(--text-primary)', fontFamily: 'var(--font-mono)' }}>
            {scanMessage}
          </span>
        </div>
      )}

      {/* 2. KEY STATISTICS CARDS */}
      <section className="stat-cards-grid">
        <StatCard
          label={metrics.totalTenders.label}
          value={metrics.totalTenders.value}
          subtext={metrics.totalTenders.subtext}
          trend={metrics.totalTenders.trend}
          trendDirection={metrics.totalTenders.trendDirection}
          variant={metrics.totalTenders.variant}
          icon={FileText}
        />

        <StatCard
          label={metrics.highRiskTenders.label}
          value={metrics.highRiskTenders.value}
          subtext={metrics.highRiskTenders.subtext}
          trend={metrics.highRiskTenders.trend}
          trendDirection={metrics.highRiskTenders.trendDirection}
          variant={metrics.highRiskTenders.variant}
          icon={ShieldAlert}
        />

        <StatCard
          label={metrics.valueAtRisk.label}
          value={metrics.valueAtRisk.value}
          subtext={metrics.valueAtRisk.subtext}
          trend={metrics.valueAtRisk.trend}
          trendDirection={metrics.valueAtRisk.trendDirection}
          variant={metrics.valueAtRisk.variant}
          icon={IndianRupee}
        />

        <StatCard
          label={metrics.anomaliesDetected.label}
          value={metrics.anomaliesDetected.value}
          subtext={metrics.anomaliesDetected.subtext}
          trend={metrics.anomaliesDetected.trend}
          trendDirection={metrics.anomaliesDetected.trendDirection}
          variant={metrics.anomaliesDetected.variant}
          icon={Activity}
        />
      </section>

      {/* 3 & 4. RISK CHARTS ROW */}
      <section className="dashboard-grid-row">
        {/* 3. Procurement Risk Overview Trend Chart (8 cols) */}
        <RiskTrendChart data={riskTrend} />

        {/* 4. Risk Distribution Donut Chart (4 cols) */}
        <RiskDistributionChart data={riskDistribution} />
      </section>

      {/* 5, 6 & 7. FORENSIC INTELLIGENCE ROW */}
      <section className="dashboard-grid-row">
        {/* 5. Top High-Risk Tenders Table (8 cols) */}
        <HighRiskTendersTable tenders={topTenders} />

        {/* 6 & 7. AI Insights & Recent Anomalies Timeline (4 cols) */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {/* 6. AI Insights Panel */}
          <AIInsightsPanel insights={insights} />

          {/* 7. Recent Anomalies Timeline */}
          <AnomalyTimeline events={anomalies} />
        </div>
      </section>
    </div>
  );
}
