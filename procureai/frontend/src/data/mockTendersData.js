/**
 * ProcureAI - Mock Tender Explorer Dataset
 * Structured for direct backend API compatibility
 */

export const MOCK_TENDERS = [
  {
    tender_id: 'PRC-2026-1042',
    procurement_title: 'National Highway Expansion Project — Sector 9 Corridor',
    department: 'Department of Transportation & Infrastructure',
    vendor_id: 'VND-88912',
    vendor_name: 'Apex Civil Infrastructure Ltd',
    category: 'Infrastructure',
    tender_value: 85000000,
    award_value: 84000000,
    number_of_bidders: 2,
    rule_score: 92,
    ml_anomaly_score: 96,
    final_risk_score: 95,
    risk_level: 'Critical',
    investigation_status: 'Requires Investigation',
    triggered_rules: [
      'Unusual price variance detected (+42% above benchmark)',
      'Low bidder competition (Only 2 bids submitted for major highway solicitation)',
      'Bid rotation detected between winning vendor and runner-up entity'
    ],
    date_posted: '2026-03-01',
    award_date: '2026-03-10'
  },
  {
    tender_id: 'PRC-2026-1047',
    procurement_title: 'Regional Hospital MRI & Medical Imaging Modernization',
    department: 'Ministry of Health & Social Care',
    vendor_id: 'VND-33401',
    vendor_name: 'BioMed Supply Alliance Ltd',
    category: 'Medical Equipment',
    tender_value: 62500000,
    award_value: 62000000,
    number_of_bidders: 1,
    rule_score: 88,
    ml_anomaly_score: 94,
    final_risk_score: 92,
    risk_level: 'Critical',
    investigation_status: 'Requires Investigation',
    triggered_rules: [
      'Single bidder contract award with zero alternative submissions',
      'Proprietary technical specifications customized for vendor SKU',
      'Registered officer shared with competing regional supplier'
    ],
    date_posted: '2026-02-28',
    award_date: '2026-03-08'
  },
  {
    tender_id: 'PRC-2026-1051',
    procurement_title: 'Government Enterprise Cloud & Unified Data Migration',
    department: 'Federal Information Technology Directorate',
    vendor_id: 'VND-77120',
    vendor_name: 'Vertex Cloud Systems Inc',
    category: 'IT Services',
    tender_value: 90000000,
    award_value: 89000000,
    number_of_bidders: 3,
    rule_score: 84,
    ml_anomaly_score: 89,
    final_risk_score: 87,
    risk_level: 'High',
    investigation_status: 'Under Review',
    triggered_rules: [
      'Threshold evasion: Contract split into two sub-₹10 Cr packages within 7 days',
      'Immediate 85% subcontracting allocation to an affiliated holding entity',
      'Contract value significantly above IT category average (+34%)'
    ],
    date_posted: '2026-03-02',
    award_date: '2026-03-09'
  },
  {
    tender_id: 'PRC-2026-1065',
    procurement_title: 'Metropolitan Wastewater Treatment Filtration Retrofit',
    department: 'Municipal Utilities & Water Board',
    vendor_id: 'VND-44910',
    vendor_name: 'NovaTech Environmental Systems',
    category: 'Public Works',
    tender_value: 37500000,
    award_value: 36800000,
    number_of_bidders: 2,
    rule_score: 80,
    ml_anomaly_score: 86,
    final_risk_score: 84,
    risk_level: 'High',
    investigation_status: 'Requires Investigation',
    triggered_rules: [
      'Repeated supplier contract wins: 5th consecutive award without open audit',
      'Winning bid exactly 0.5% below internal confidential government ceiling',
      'Dormant corporate entity surge (Incorporated < 6 months prior to tender)'
    ],
    date_posted: '2026-02-24',
    award_date: '2026-03-05'
  },
  {
    tender_id: 'PRC-2026-1078',
    procurement_title: 'Civic Center HVAC & Green Energy Rehabilitation',
    department: 'Public Buildings & Energy Authority',
    vendor_id: 'VND-66184',
    vendor_name: 'EcoThermal Engineering Corp',
    category: 'Construction',
    tender_value: 41000000,
    award_value: 39500000,
    number_of_bidders: 4,
    rule_score: 68,
    ml_anomaly_score: 74,
    final_risk_score: 72,
    risk_level: 'Moderate',
    investigation_status: 'Under Review',
    triggered_rules: [
      'Cluster bidding: All 4 submissions submitted from identical IP subnet',
      'Uniform spacing across losing bid pricing intervals (+5.0% step increments)'
    ],
    date_posted: '2026-02-18',
    award_date: '2026-03-02'
  },
  {
    tender_id: 'PRC-2026-1083',
    procurement_title: 'Regional High School Digital Learning Hardware Supply',
    department: 'State Board of Public Education',
    vendor_id: 'VND-22199',
    vendor_name: 'OmniEd Tech Solutions',
    category: 'IT Services',
    tender_value: 18500000,
    award_value: 17900000,
    number_of_bidders: 5,
    rule_score: 62,
    ml_anomaly_score: 66,
    final_risk_score: 65,
    risk_level: 'Moderate',
    investigation_status: 'Under Review',
    triggered_rules: [
      'Losing bidders disqualified on minor typographical formatting technicalities',
      'Slight hardware markup variance (+18% above commercial retail benchmark)'
    ],
    date_posted: '2026-02-12',
    award_date: '2026-02-28'
  },
  {
    tender_id: 'PRC-2026-1090',
    procurement_title: 'Urban Transit Bus Fleet Preventive Maintenance',
    department: 'Metropolitan Transit Authority',
    vendor_id: 'VND-99104',
    vendor_name: 'MetroFleet Fleet Logistics Inc',
    category: 'Public Works',
    tender_value: 52000000,
    award_value: 51200000,
    number_of_bidders: 3,
    rule_score: 58,
    ml_anomaly_score: 62,
    final_risk_score: 61,
    risk_level: 'Moderate',
    investigation_status: 'Normal',
    triggered_rules: [
      'Incumbent vendor multi-year contract renewal with modest inflation drift'
    ],
    date_posted: '2026-02-05',
    award_date: '2026-02-22'
  },
  {
    tender_id: 'PRC-2026-1102',
    procurement_title: 'Emergency Medical Service Protective Consumables',
    department: 'Health Services Emergency Reserve',
    vendor_id: 'VND-11050',
    vendor_name: 'SafeGuard Health Distribution',
    category: 'Medical Equipment',
    tender_value: 9500000,
    award_value: 9200000,
    number_of_bidders: 6,
    rule_score: 32,
    ml_anomaly_score: 28,
    final_risk_score: 30,
    risk_level: 'Low',
    investigation_status: 'Normal',
    triggered_rules: [
      'Normal competitive distribution across 6 verified vendors'
    ],
    date_posted: '2026-01-20',
    award_date: '2026-02-10'
  },
  {
    tender_id: 'PRC-2026-1115',
    procurement_title: 'Municipal Stormwater Drainage Basin Concrete Lining',
    department: 'Department of Public Works & Flood Prevention',
    vendor_id: 'VND-55821',
    vendor_name: 'Keystone Concrete & Marine Works',
    category: 'Construction',
    tender_value: 23500000,
    award_value: 22800000,
    number_of_bidders: 5,
    rule_score: 25,
    ml_anomaly_score: 22,
    final_risk_score: 24,
    risk_level: 'Low',
    investigation_status: 'Normal',
    triggered_rules: [
      'Competitive bidding pricing within 3% of historical public estimates'
    ],
    date_posted: '2026-01-15',
    award_date: '2026-02-04'
  },
  {
    tender_id: 'PRC-2026-1124',
    procurement_title: 'Substation Electrical Grid Transformer Overhaul',
    department: 'Federal Energy Transmission Agency',
    vendor_id: 'VND-77412',
    vendor_name: 'VoltAmp Industrial Power Systems',
    category: 'Infrastructure',
    tender_value: 78000000,
    award_value: 76500000,
    number_of_bidders: 7,
    rule_score: 18,
    ml_anomaly_score: 15,
    final_risk_score: 16,
    risk_level: 'Low',
    investigation_status: 'Normal',
    triggered_rules: [
      'Robust international competition with full audited manufacturer warranties'
    ],
    date_posted: '2026-01-08',
    award_date: '2026-01-29'
  }
];

export const TENDER_CATEGORIES = [
  'Transport',
  'Construction',
  'Medical Supplies',
  'Consulting',
  'IT Services'
];

export const RISK_LEVELS = [
  'High',
  'Moderate',
  'Low'
];

export const INVESTIGATION_STATUSES = [
  'Requires Investigation',
  'Low Priority'
];
