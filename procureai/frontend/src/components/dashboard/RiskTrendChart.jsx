import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from 'recharts';
import { TrendingUp } from 'lucide-react';
import './dashboard.css';

// Custom Light Tooltip
function CustomTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="custom-recharts-tooltip">
        <div className="tooltip-title">{label} 2026 AUDIT LOG</div>
        {payload.map((item, idx) => (
          <div key={idx} className="tooltip-item">
            <div className="tooltip-item-name">
              <span
                className="tooltip-item-color"
                style={{ backgroundColor: item.color }}
              />
              <span>{item.name}:</span>
            </div>
            <span className="tooltip-item-value">{item.value}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
}

export default function RiskTrendChart({ data }) {
  return (
    <div className="dashboard-panel-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <TrendingUp size={18} color="var(--primary-navy)" />
          <div>
            <h3 className="panel-title">Procurement Risk Overview</h3>
            <p className="panel-subtitle">7-Month longitudinal analysis of detected risk signals vs. confirmed suspicious tenders</p>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#2563EB' }} />
            <span>Risk Signals</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, background: '#DC2626' }} />
            <span>Suspicious Tenders</span>
          </div>
        </div>
      </div>

      <div className="chart-container-box">
        <ResponsiveContainer width="100%" height={300} minWidth={0}>
          <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <defs>
              <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#2563EB" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#2563EB" stopOpacity={0.0} />
              </linearGradient>
              <linearGradient id="redGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#DC2626" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#DC2626" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" vertical={false} />
            
            <XAxis
              dataKey="month"
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            
            <YAxis
              stroke="#64748B"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />

            <Tooltip content={<CustomTooltip />} />

            <Area
              type="monotone"
              dataKey="riskSignals"
              name="Risk Signals"
              stroke="#2563EB"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#blueGradient)"
            />

            <Area
              type="monotone"
              dataKey="suspiciousTenders"
              name="Suspicious Tenders"
              stroke="#DC2626"
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#redGradient)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
