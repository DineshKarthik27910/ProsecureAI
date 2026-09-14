import React, { useState, useEffect, useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  ArrowLeft,
  Network,
  FileSpreadsheet,
  Download,
  Share2,
  ChevronDown,
  Search
} from 'lucide-react';

import PageHeader from '../components/common/PageHeader';
import Badge from '../components/common/Badge';

import RiskScoreHero from '../components/risk/RiskScoreHero';
import AnomalyFactorsGrid from '../components/risk/AnomalyFactorsGrid';
import RiskContributionChart from '../components/risk/RiskContributionChart';
import AIInvestigationSummary from '../components/risk/AIInvestigationSummary';
import TenderInfoPanel from '../components/risk/TenderInfoPanel';
import InvestigationTimeline from '../components/risk/InvestigationTimeline';

import {
  RISK_ANALYSIS_CASES,
  DEFAULT_TENDER_ID,
} from '../data/mockRiskAnalysisData';

import api from '../services/api';
import '../components/risk/risk.css';

// Helper to deduplicate cases by tender_id
function deduplicateCases(cases) {
  const seen = new Set();
  const unique = [];
  for (const c of cases) {
    if (!c || !c.id) continue;
    const normalizedId = String(c.id).trim();
    if (!seen.has(normalizedId)) {
      seen.add(normalizedId);
      unique.push({ ...c, id: normalizedId });
    }
  }
  return unique;
}

export default function RiskAnalysisPage() {
  const location = useLocation();
  const navigate = useNavigate();

  // If routed from Tender Explorer with an explicit selected tender
  const navTenderId = location.state?.selectedTenderId
    ? String(location.state.selectedTenderId).trim()
    : null;

  const [activeTenderId, setActiveTenderId] = useState(
    () => navTenderId || DEFAULT_TENDER_ID
  );

  const [activeTender, setActiveTender] = useState(
    () => RISK_ANALYSIS_CASES[activeTenderId] || RISK_ANALYSIS_CASES[DEFAULT_TENDER_ID]
  );
  const [isLoading, setIsLoading] = useState(false);
  const [isLiveBackend, setIsLiveBackend] = useState(false);

  // Available case list for the dropdown switcher (starts with fallback cases)
  const [availableCases, setAvailableCases] = useState(() => {
    const list = Object.keys(RISK_ANALYSIS_CASES).map((id) => ({
      id,
      label: `${id} — ${RISK_ANALYSIS_CASES[id].vendor_name || 'Flagged Contract'}`,
    }));
    if (navTenderId && !list.some((item) => item.id === navTenderId)) {
      list.unshift({
        id: navTenderId,
        label: `${navTenderId} — (Selected Case)`,
      });
    }
    return deduplicateCases(list);
  });

  // If location state changes (e.g. user clicked from drawer)
  useEffect(() => {
    if (location.state?.selectedTenderId) {
      const targetId = String(location.state.selectedTenderId).trim();
      setActiveTenderId(targetId);
      setAvailableCases((prev) => {
        if (prev.some((c) => c.id === targetId)) return prev;
        return deduplicateCases([
          { id: targetId, label: `${targetId} — (Selected Case)` },
          ...prev,
        ]);
      });
    }
  }, [location.state]);

  // Load all live high-risk cases on mount to populate the switcher dropdown
  useEffect(() => {
    let isMounted = true;
    async function loadHighRiskCases() {
      try {
        const res = await api.getHighRiskTenders();
        if (isMounted && res?.items && res.items.length > 0) {
          const liveList = res.items.map((t) => {
            const tid = String(t.tender_id || t.id).trim();
            const vname = t.vendor_name || t.supplier || 'Flagged Contract';
            const scoreStr = t.final_risk_score != null ? `[Score: ${t.final_risk_score}]` : '';
            return {
              id: tid,
              label: `${tid} — ${vname} ${scoreStr}`.trim(),
              vendor_name: vname,
            };
          });

          const navId = location.state?.selectedTenderId
            ? String(location.state.selectedTenderId).trim()
            : null;

          if (navId) {
            setActiveTenderId(navId);
            if (!liveList.some((item) => item.id === navId)) {
              liveList.unshift({
                id: navId,
                label: `${navId} — (Selected Case)`,
              });
            }
          } else {
            // Default to the top high-risk tender in the live dataset (e.g. T00566)
            const topId = liveList[0].id;
            setActiveTenderId((prev) => {
              if (
                !prev ||
                prev.startsWith('PRC-') ||
                !liveList.some((item) => item.id === prev)
              ) {
                return topId;
              }
              return prev;
            });
          }

          setAvailableCases(deduplicateCases(liveList));
        }
      } catch (err) {
        console.warn('[RiskAnalysis] Error loading live high-risk cases:', err);
      }
    }
    loadHighRiskCases();
    return () => {
      isMounted = false;
    };
  }, []);

  // Load live forensic case breakdown from GET /api/risk-analysis/{tender_id}
  useEffect(() => {
    let isMounted = true;
    async function loadRiskCase() {
      setIsLoading(true);
      try {
        const data = await api.getRiskAnalysis(activeTenderId);
        if (isMounted && data) {
          setActiveTender(data);
          setIsLiveBackend(!data.isFallback);

          // Update label with real vendor name or add if missing, avoiding duplication
          setAvailableCases((prev) => {
            const existsIndex = prev.findIndex((c) => c.id === data.tender_id);
            if (existsIndex >= 0) {
              if (
                data.vendor_name &&
                prev[existsIndex].label.includes('(Selected Case)')
              ) {
                const updated = [...prev];
                updated[existsIndex] = {
                  id: data.tender_id,
                  label: `${data.tender_id} — ${data.vendor_name}`,
                };
                return updated;
              }
              return prev;
            }
            return deduplicateCases([
              {
                id: data.tender_id,
                label: `${data.tender_id} — ${data.vendor_name || 'Flagged Contract'}`,
              },
              ...prev,
            ]);
          });
        }
      } catch (err) {
        console.warn('[RiskAnalysis] Error fetching case, using fallback:', err);
        if (isMounted) {
          setActiveTender(
            RISK_ANALYSIS_CASES[activeTenderId] || RISK_ANALYSIS_CASES[DEFAULT_TENDER_ID]
          );
          setIsLiveBackend(false);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadRiskCase();
    return () => {
      isMounted = false;
    };
  }, [activeTenderId]);

  // Quick search filter for cases in the dropdown
  const [caseFilterQuery, setCaseFilterQuery] = useState('');

  const displayedCases = useMemo(() => {
    if (!caseFilterQuery.trim()) return availableCases;
    const q = caseFilterQuery.toLowerCase().trim();
    return availableCases.filter(
      (c) => c.id.toLowerCase().includes(q) || c.label.toLowerCase().includes(q)
    );
  }, [availableCases, caseFilterQuery]);

  // Derived investigation case counts for the dropdown switcher
  const totalCasesCount = availableCases.length;
  const currentCaseIndex = Math.max(
    0,
    availableCases.findIndex((c) => c.id === activeTenderId)
  );
  const selectorLabel = `CASE (${totalCasesCount > 0 ? currentCaseIndex + 1 : 0} of ${totalCasesCount} HIGH-RISK CASES):`;

  return (
    <div className="risk-analysis-page animate-fade-in">
      {/* 1. PAGE HEADER */}
      <PageHeader
        eyebrow="AUDIT & ANOMALY INVESTIGATION"
        title="Risk Analysis"
        subtitle="Forensic investigation and anomaly breakdown for flagged procurement contracts."
        icon={ShieldAlert}
        badgeText={activeTender.risk_badge || `${activeTender.risk_level?.toUpperCase()} RISK`}
        badgeVariant="risk-high"
        badgePulse={false}
        actions={
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
            {/* Tender Switcher Selector */}
            <div className="risk-tender-selector-box">
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 600,
                  color: 'var(--text-muted)',
                  whiteSpace: 'nowrap',
                }}
              >
                {selectorLabel}
              </span>

              {/* Quick Case Filter Input */}
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <Search size={12} color="var(--text-muted)" style={{ position: 'absolute', left: '6px', pointerEvents: 'none' }} />
                <input
                  type="text"
                  placeholder="Filter cases..."
                  value={caseFilterQuery}
                  onChange={(e) => setCaseFilterQuery(e.target.value)}
                  style={{
                    padding: '0.2rem 0.4rem 0.2rem 1.4rem',
                    fontSize: '0.75rem',
                    borderRadius: '4px',
                    border: '1px solid var(--border-default)',
                    background: 'var(--bg-app)',
                    color: 'var(--text-primary)',
                    width: '110px',
                    outline: 'none',
                  }}
                  title="Filter high-risk cases by ID or vendor"
                />
              </div>

              <select
                className="risk-tender-select"
                value={activeTenderId}
                onChange={(e) => setActiveTenderId(e.target.value)}
                style={{ maxWidth: '300px' }}
              >
                {displayedCases.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.label}
                  </option>
                ))}
              </select>
              <ChevronDown size={14} color="var(--text-muted)" />
            </div>

            <button
              className="btn btn-secondary"
              onClick={() => navigate('/tenders')}
              title="Return to Tender Explorer list"
            >
              <ArrowLeft size={14} />
              <span>Tender Explorer</span>
            </button>
          </div>
        }
      />

      {/* 2. MAIN RISK SCORE HERO SECTION */}
      <RiskScoreHero tender={activeTender} />

      {/* 3. WHY WAS THIS FLAGGED? */}
      <AnomalyFactorsGrid factors={activeTender.anomaly_factors} />

      {/* 4 & 5. RISK BREAKDOWN CHART + AI SUMMARY */}
      <div className="risk-middle-grid">
        <RiskContributionChart data={activeTender.risk_breakdown_chart} />
        <AIInvestigationSummary
          summary={activeTender.ai_investigation_summary}
          confidenceLevel={activeTender.confidence_level}
        />
      </div>

      {/* 6 & 7. TENDER INFO PANEL + INVESTIGATION TIMELINE */}
      <div className="risk-bottom-grid">
        <TenderInfoPanel tender={activeTender} />
        <InvestigationTimeline timeline={activeTender.investigation_timeline} />
      </div>

      {/* 8. ACTION BUTTONS BAR */}
      <div className="risk-action-bar">
        <div>
          <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)' }}>
            Investigation Actions for {activeTender.tender_id}
          </span>
          <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '2px' }}>
            Cross-reference entity links or compile exportable evidentiary dossier
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
            className="btn btn-secondary"
            onClick={() => navigate('/supplier-network', { state: { supplier: activeTender.vendor_name } })}
          >
            <Network size={14} color="var(--accent-cyan)" />
            <span>View Supplier Network</span>
          </button>

          <button
            className="btn btn-primary"
            onClick={() => navigate('/reports', { state: { tenderId: activeTender.tender_id } })}
          >
            <FileSpreadsheet size={14} />
            <span>Generate Investigation Report</span>
          </button>
        </div>
      </div>
    </div>
  );
}
