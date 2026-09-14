/**
 * ProcureAI - Centralized Frontend API Service Layer
 *
 * Connects the React frontend to the FastAPI Intelligence Gateway (/api).
 * Automatically provides seamless offline fallback to mock datasets
 * if the backend server is unreachable or offline.
 */

import {
  EXECUTIVE_METRICS,
  RISK_TREND_DATA,
  RISK_DISTRIBUTION_DATA,
  TOP_HIGH_RISK_TENDERS,
  AI_INSIGHTS,
  RECENT_ANOMALIES,
} from '../data/mockProcurementData.js';

import { MOCK_TENDERS } from '../data/mockTendersData.js';

import {
  RISK_ANALYSIS_CASES,
  DEFAULT_TENDER_ID,
} from '../data/mockRiskAnalysisData.js';

import {
  NETWORK_SUMMARY,
  SUPPLIER_NODES,
  NETWORK_EDGES,
  SUSPICIOUS_CONNECTIONS,
  NETWORK_AI_INSIGHT,
} from '../data/mockSupplierNetworkData.js';

function getBaseUrl() {
  const envBase =
    typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_BASE_URL
      ? import.meta.env.VITE_API_BASE_URL
      : typeof process !== 'undefined'
      ? process.env.VITE_API_BASE_URL
      : '';

  return envBase ? `${envBase.replace(/\/$/, '')}/api` : '/api';
}

/**
 * Fetch wrapper with timeout support via AbortController.
 */
async function fetchWithTimeout(url, options = {}, timeoutMs = 10000) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(url, {
      ...options,
      signal: controller.signal,
      headers: {
        Accept: 'application/json',
        ...(options.headers || {}),
      },
    });
    clearTimeout(id);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    return await res.json();
  } catch (err) {
    clearTimeout(id);
    throw err;
  }
}

/**
 * Executes an API request, trying the Vite proxy path first, and then
 * direct backend localhost URL if in a non-proxy development context.
 */
async function apiRequest(endpoint, options = {}) {
  const baseUrl = getBaseUrl();
  try {
    return await fetchWithTimeout(`${baseUrl}${endpoint}`, options);
  } catch (err1) {
    // If relative proxy path failed, try direct 127.0.0.1:8000 or localhost:8000
    if (baseUrl.startsWith('/')) {
      try {
        return await fetchWithTimeout(`http://127.0.0.1:8000/api${endpoint}`, options);
      } catch (err2) {
        try {
          return await fetchWithTimeout(`http://localhost:8000/api${endpoint}`, options);
        } catch (err3) {
          throw err1;
        }
      }
    }
    throw err1;
  }
}

export const api = {
  /**
   * GET /api/health
   * Checks backend server liveness.
   */
  async getHealth() {
    try {
      const data = await apiRequest('/health');
      return { ...data, isFallback: false };
    } catch (err) {
      console.warn('[ProcureAI API] Health check failed, backend appears offline:', err.message);
      return { status: 'offline', error: err.message, isFallback: true };
    }
  },

  /**
   * GET /api/dashboard/overview
   * Returns executive metrics, risk trends, distribution, top high-risk tenders,
   * AI insights, and live anomaly streams.
   */
  async getDashboardOverview() {
    try {
      const data = await apiRequest('/dashboard/overview');
      return {
        ...data,
        isFallback: false,
      };
    } catch (err) {
      console.warn('[ProcureAI API] /api/dashboard/overview unreachable. Using fallback dataset:', err.message);
      return {
        executive_metrics: EXECUTIVE_METRICS,
        risk_trend: RISK_TREND_DATA,
        risk_distribution: RISK_DISTRIBUTION_DATA,
        top_high_risk_tenders: TOP_HIGH_RISK_TENDERS,
        ai_insights: AI_INSIGHTS,
        recent_anomalies: RECENT_ANOMALIES,
        isFallback: true,
      };
    }
  },

  /**
   * GET /api/tenders
   * Returns paginated list of procurement solicitations with forensic scores.
   */
  async getTenders(params = {}) {
    try {
      const searchParams = new URLSearchParams();
      if (params.search) searchParams.set('search', params.search);
      if (params.category && params.category !== 'All') searchParams.set('category', params.category);
      if (params.risk_level && params.risk_level !== 'All') searchParams.set('risk_level', params.risk_level);
      if (params.status && params.status !== 'All') searchParams.set('status', params.status);
      if (params.page) searchParams.set('page', String(params.page));
      searchParams.set('limit', String(params.limit || 100));

      const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
      const data = await apiRequest(`/tenders${queryStr}`);
      return {
        ...data,
        isFallback: false,
      };
    } catch (err) {
      console.warn('[ProcureAI API] /api/tenders unreachable. Using fallback dataset:', err.message);
      let filtered = [...MOCK_TENDERS];
      if (params.search) {
        const q = params.search.toLowerCase();
        filtered = filtered.filter(
          (t) =>
            t.tender_id?.toLowerCase().includes(q) ||
            t.procurement_title?.toLowerCase().includes(q) ||
            t.vendor_name?.toLowerCase().includes(q) ||
            t.department?.toLowerCase().includes(q)
        );
      }
      if (params.category && params.category !== 'All') {
        filtered = filtered.filter(
          (t) => t.category?.toLowerCase() === params.category.toLowerCase()
        );
      }
      if (params.risk_level && params.risk_level !== 'All') {
        filtered = filtered.filter((t) => {
          const rl = (t.risk_level || '').toUpperCase();
          if (params.risk_level === 'High') return rl === 'HIGH' || rl === 'CRITICAL';
          if (params.risk_level === 'Medium') return rl === 'MEDIUM';
          if (params.risk_level === 'Low') return rl === 'LOW';
          return rl === params.risk_level.toUpperCase();
        });
      }
      if (params.status && params.status !== 'All') {
        filtered = filtered.filter((t) => {
          const st = (t.investigation_status || '').toUpperCase();
          if (params.status === 'Under Review') return st.includes('INVESTIGATION') || st.includes('REVIEW');
          if (params.status === 'Approved') return st.includes('LOW') || st.includes('NORMAL') || st.includes('APPROVED');
          if (params.status === 'Flagged') return st.includes('FLAGGED') || st.includes('CRITICAL');
          return st.includes(params.status.toUpperCase());
        });
      }
      const page = Number(params.page) || 1;
      const limit = Number(params.limit) || 100;
      const total = filtered.length;
      const pages = Math.max(1, Math.ceil(total / limit));
      const pagedItems = filtered.slice((page - 1) * limit, page * limit);

      return {
        items: pagedItems,
        data: pagedItems,
        total,
        page,
        limit,
        pages,
        isFallback: true,
      };
    }
  },

  /**
   * GET /api/tenders/{tender_id}
   * Returns complete detail for a single tender solicitation.
   */
  async getTenderById(tenderId) {
    if (!tenderId) return null;
    try {
      const data = await apiRequest(`/tenders/${encodeURIComponent(tenderId)}`);
      return {
        ...data,
        isFallback: false,
      };
    } catch (err) {
      console.warn(`[ProcureAI API] /api/tenders/${tenderId} unreachable. Using fallback:`, err.message);
      const found =
        MOCK_TENDERS.find((t) => t.tender_id.toLowerCase() === String(tenderId).toLowerCase()) ||
        MOCK_TENDERS[0];
      return {
        ...found,
        isFallback: true,
      };
    }
  },

  /**
   * GET /api/risk-analysis/{tender_id}
   * Returns explainable forensic decomposition, factors, timeline, and scores.
   */
  async getRiskAnalysis(tenderId) {
    const lookupId = tenderId || DEFAULT_TENDER_ID;
    try {
      const data = await apiRequest(`/risk-analysis/${encodeURIComponent(lookupId)}`);
      return {
        ...data,
        isFallback: false,
      };
    } catch (err) {
      console.warn(`[ProcureAI API] /api/risk-analysis/${lookupId} unreachable. Using fallback case:`, err.message);
      const fallbackCase =
        RISK_ANALYSIS_CASES[lookupId] ||
        Object.values(RISK_ANALYSIS_CASES).find((c) =>
          c.tender_id.toLowerCase().includes(String(lookupId).toLowerCase())
        ) ||
        RISK_ANALYSIS_CASES[DEFAULT_TENDER_ID];
      return {
        ...fallbackCase,
        isFallback: true,
      };
    }
  },

  /**
   * GET /api/tenders/high-risk
   * Returns all high-risk tender cases across the complete dataset.
   */
  async getHighRiskTenders() {
    try {
      const data = await apiRequest('/tenders/high-risk');
      return {
        items: data.items || data.data || [],
        total: data.total || (data.items ? data.items.length : 0),
        isFallback: false,
      };
    } catch (err) {
      console.warn('[ProcureAI API] /api/tenders/high-risk unreachable, using fallback:', err.message);
      const fallbackList = Object.keys(RISK_ANALYSIS_CASES).map((id) => ({
        tender_id: id,
        id,
        procurement_title: RISK_ANALYSIS_CASES[id].procurement_title,
        vendor_name: RISK_ANALYSIS_CASES[id].vendor_name,
        category: RISK_ANALYSIS_CASES[id].category,
        final_risk_score: RISK_ANALYSIS_CASES[id].final_risk_score,
        risk_level: RISK_ANALYSIS_CASES[id].risk_level,
        investigation_status: RISK_ANALYSIS_CASES[id].investigation_status,
      }));
      return {
        items: fallbackList,
        total: fallbackList.length,
        isFallback: true,
      };
    }
  },

  /**
   * GET /api/supplier-network
   * Returns graph topology nodes, edges, suspicious cartel links, and summary.
   */
  async getSupplierNetwork() {
    try {
      const data = await apiRequest('/supplier-network');
      return {
        ...data,
        isFallback: false,
      };
    } catch (err) {
      console.warn('[ProcureAI API] /api/supplier-network unreachable, using fallback dataset:', err.message);
      return {
        summary: NETWORK_SUMMARY,
        nodes: SUPPLIER_NODES,
        edges: NETWORK_EDGES,
        suspicious_connections: SUSPICIOUS_CONNECTIONS,
        ai_insight: NETWORK_AI_INSIGHT,
        isFallback: true,
      };
    }
  },

  // =========================================================================
  // Live Procurement Database Endpoints (RT-6 / RT-7)
  // Backed by SQLite (procureai.db) - Never falls back to historical CSV mocks
  // =========================================================================

  /**
   * GET /api/live/dashboard
   * Returns SQLite live surveillance metrics.
   */
  async getLiveDashboard() {
    return await apiRequest('/live/dashboard');
  },

  /**
   * GET /api/live/tenders
   * Returns paginated live procurement records from SQLite.
   */
  async getLiveTenders(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.category && params.category !== 'All') searchParams.set('category', params.category);
    if (params.region && params.region !== 'All') searchParams.set('region', params.region);
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return await apiRequest(`/live/tenders${queryStr}`);
  },

  /**
   * GET /api/live/tenders/{record_id}
   * Returns a single live tender record and linked assessment.
   */
  async getLiveTender(recordId) {
    if (!recordId) return null;
    return await apiRequest(`/live/tenders/${encodeURIComponent(recordId)}`);
  },

  /**
   * GET /api/live/assessments
   * Returns live risk assessments from SQLite.
   */
  async getLiveAssessments(params = {}) {
    const searchParams = new URLSearchParams();
    if (params.page) searchParams.set('page', String(params.page));
    if (params.limit) searchParams.set('limit', String(params.limit));
    if (params.status && params.status !== 'All') searchParams.set('status', params.status);
    const queryStr = searchParams.toString() ? `?${searchParams.toString()}` : '';
    return await apiRequest(`/live/assessments${queryStr}`);
  },
};

export default api;
