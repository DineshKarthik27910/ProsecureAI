import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import AppShell from './components/layout/AppShell';

// Forensic Module Pages
import DashboardPage from './pages/DashboardPage';
import TenderExplorerPage from './pages/TenderExplorerPage';
import RiskAnalysisPage from './pages/RiskAnalysisPage';
import SupplierNetworkPage from './pages/SupplierNetworkPage';
import InvestigationReportsPage from './pages/InvestigationReportsPage';
import LiveMonitoringPage from './pages/LiveMonitoringPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          {/* Default Route: Intelligence Dashboard */}
          <Route path="/" element={<DashboardPage />} />
          
          {/* Module 2: Tender Search & Contract Solicitations */}
          <Route path="/tenders" element={<TenderExplorerPage />} />
          
          {/* Module 3: ML Anomaly & Bid-Rigging Detection */}
          <Route path="/risk-analysis" element={<RiskAnalysisPage />} />
          
          {/* Module 4: Entity Resolution & Cartel Link Analysis */}
          <Route path="/supplier-network" element={<SupplierNetworkPage />} />
          
          {/* Module 5: Audit Dossiers & Enforcement Reports */}
          <Route path="/reports" element={<InvestigationReportsPage />} />

          {/* Module 6: Live Procurement Monitoring (RT-7) */}
          <Route path="/live-monitoring" element={<LiveMonitoringPage />} />

          {/* Catch-all fallback redirects to Dashboard */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
