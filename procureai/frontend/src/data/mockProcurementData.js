/**
 * ProcureAI - Mock Intelligence Dataset
 * Enterprise public procurement anomaly detection data
 */

export const EXECUTIVE_METRICS = {
  totalTenders: {
    value: '12,847',
    label: 'Total Tenders Monitored',
    subtext: 'Across active procurement cycles',
    trend: '+4.8%',
    trendDirection: 'up',
    variant: 'neutral',
  },
  highRiskTenders: {
    value: '105',
    label: 'High-Risk Tenders',
    subtext: '1.1% of solicitations',
    trend: '+12%',
    trendDirection: 'danger',
    variant: 'risk-high',
  },
  valueAtRisk: {
    value: '₹3388.00 Cr',
    label: 'Potential Value at Risk',
    subtext: 'Estimated exposure across 1527 tenders',
    trend: 'Forensic Review',
    trendDirection: 'warning',
    variant: 'risk-med',
  },
  anomaliesDetected: {
    value: '1527',
    label: 'Anomalies Detected',
    subtext: 'Flagged for audit review',
    trend: '100% precision',
    trendDirection: 'cyan',
    variant: 'cyan',
  },
};

export const RISK_TREND_DATA = [
  { month: 'Jun', riskSignals: 39, suspiciousTenders: 76 },
  { month: 'Jul', riskSignals: 39, suspiciousTenders: 70 },
  { month: 'Aug', riskSignals: 38, suspiciousTenders: 69 },
  { month: 'Sep', riskSignals: 39, suspiciousTenders: 79 },
  { month: 'Oct', riskSignals: 35, suspiciousTenders: 76 },
  { month: 'Nov', riskSignals: 28, suspiciousTenders: 73 },
  { month: 'Dec', riskSignals: 18, suspiciousTenders: 71 },
];

export const RISK_DISTRIBUTION_DATA = [
  { name: 'High Risk', value: 105, color: '#DC2626', percent: '1.1%' },
  { name: 'Medium Risk', value: 1422, color: '#D97706', percent: '14.2%' },
  { name: 'Low Risk', value: 8473, color: '#16A34A', percent: '84.7%' },
];

export const TOP_HIGH_RISK_TENDERS = [
  {
    id: 'TND-2026-9812',
    title: 'High-Speed Rail Phase 2 Civil Works',
    category: 'Infrastructure',
    supplier: 'Apex Infrastructure & Rail Corp',
    value: '₹8.45 Cr',
    riskScore: 96,
    riskLevel: 'High',
    status: 'Escalated to OIG',
    flags: ['Bid Rotation', 'Price Outlier +42%'],
    date: '2026-03-08',
  },
  {
    id: 'TND-2026-8401',
    title: 'Diagnostic Imaging & MRI Modernization',
    category: 'Medical Equipment',
    supplier: 'BioMed Supply Alliance Ltd',
    value: '₹4.12 Cr',
    riskScore: 92,
    riskLevel: 'High',
    status: 'Under Review',
    flags: ['Shared Director Tax ID', 'Sole Bidder'],
    date: '2026-03-09',
  },
  {
    id: 'TND-2026-7734',
    title: 'Unified Municipal Cloud Migration',
    category: 'IT Services',
    supplier: 'Vertex Cloud Systems Inc',
    value: '₹6.89 Cr',
    riskScore: 89,
    riskLevel: 'High',
    status: 'Pending Audit',
    flags: ['Threshold Evasion', 'Subcontracting Loop'],
    date: '2026-03-07',
  },
  {
    id: 'TND-2026-6190',
    title: 'Metropolitan Expressway Resurfacing',
    category: 'Construction',
    supplier: 'Horizon Paving & Asphalt Corp',
    value: '₹2.75 Cr',
    riskScore: 84,
    riskLevel: 'High',
    status: 'Under Review',
    flags: ['Co-located Address', 'Bid Compression'],
    date: '2026-03-10',
  },
  {
    id: 'TND-2026-5502',
    title: 'Water Treatment Plant Filtration Retrofit',
    category: 'Public Works',
    supplier: 'NovaTech Environmental Systems',
    value: '₹2.58 Cr',
    riskScore: 78,
    riskLevel: 'Medium',
    status: 'Flagged for Verification',
    flags: ['Dormant Entity Surge', 'Unusual Timing'],
    date: '2026-03-11',
  },
];

export const AI_INSIGHTS = [
  {
    id: 'ins-1',
    title: 'Unusual Price Variance in Infrastructure',
    description: 'Unusual price variance detected across 3 infrastructure tenders awarded in District 4. Winning bids are consistently 38–42% above benchmark historical cost curves.',
    category: 'Price Anomaly',
    severity: 'Critical',
    severityColor: 'risk-high',
    confidence: '98.2%',
    relatedTenders: ['TND-2026-9812', 'TND-2026-6190'],
  },
  {
    id: 'ins-2',
    title: 'Interlocking Bidder Relationship',
    description: 'Possible supplier relationship identified between two high-risk bidders. Apex Infrastructure and BioMed Supply share identical registered agent addresses and beneficial owners.',
    category: 'Collusion Risk',
    severity: 'High',
    severityColor: 'risk-high',
    confidence: '95.6%',
    relatedTenders: ['TND-2026-8401'],
  },
  {
    id: 'ins-3',
    title: 'Repeated Contract Award Clustering',
    description: 'Repeated contract awards detected within a short 14-day time period to a newly incorporated vendor with under 5 registered full-time personnel.',
    category: 'Shell Company Risk',
    severity: 'Medium',
    severityColor: 'risk-med',
    confidence: '91.4%',
    relatedTenders: ['TND-2026-5502'],
  },
];

export const RECENT_ANOMALIES = [
  {
    id: 'anom-1',
    time: '2 minutes ago',
    title: 'Unusual bid pattern detected',
    detail: 'Three bids submitted within 12 seconds with near-identical pricing distribution.',
    tenderId: 'TND-2026-9812',
    severity: 'High',
    type: 'Bid Rigging',
  },
  {
    id: 'anom-2',
    time: '18 minutes ago',
    title: 'Price inflation anomaly flagged',
    detail: 'Unit line-item price for MRI cooling components exceeds national average by 310%.',
    tenderId: 'TND-2026-8401',
    severity: 'High',
    type: 'Price Anomaly',
  },
  {
    id: 'anom-3',
    time: '42 minutes ago',
    title: 'Supplier relationship identified',
    detail: 'Director match across opposing bidders in municipal IT modernization RFP.',
    tenderId: 'TND-2026-7734',
    severity: 'Medium',
    type: 'Entity Resolution',
  },
  {
    id: 'anom-4',
    time: '1 hour ago',
    title: 'Contract splitting pattern detected',
    detail: 'Two individual awards of ₹48.5 Lakh issued within 48 hours to evade ₹50 Lakh open tender rule.',
    tenderId: 'TND-2026-5502',
    severity: 'Medium',
    type: 'Threshold Evasion',
  },
];
