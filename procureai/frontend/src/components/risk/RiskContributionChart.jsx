import React from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
  CartesianGrid
} from 'recharts';
import { BarChart3 } from 'lucide-react';
import './risk.css';

function CustomContributionTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-recharts-tooltip">
        <div className="tooltip-title">{data.factor.toUpperCase()}</div>
        <div className="tooltip-item">
          <span style={{ color: 'var(--text-secondary)' }}>Risk Weight:</span>
          <span className="tooltip-item-value" style={{ color: data.color }}>
            {data.percentage}%
          </span>
        </div>
        <div className="tooltip-item">
          <span style={{ color: 'var(--text-muted)' }}>Raw Factor Score:</span>
          <span className="tooltip-item-value">{data.score}/100</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function RiskContributionChart({ data }) {
  return (
    <div className="risk-chart-box">
      <div className="panel-header-row" style={{ marginBottom: '1rem' }}>
        <div className="panel-title-group">
          <BarChart3 size={18} color="var(--primary-navy)" />
          <div>
            <h4 className="panel-title">Risk Factor Breakdown</h4>
            <p className="panel-subtitle">Weighted contribution of forensic vectors to composite risk rating</p>
          </div>
        </div>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
          TOTAL: 100%
        </span>
      </div>

      <div style={{ width: '100%', height: '260px' }}>
        <ResponsiveContainer width="100%" height={260} minWidth={0}>
          <BarChart
            layout="vertical"
            data={data}
            margin={{ top: 5, right: 35, left: 10, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" horizontal={false} />
            <XAxis
              type="number"
              domain={[0, 100]}
              unit="%"
              stroke="#64748B"
              fontSize={11}
              tickLine={false}
              axisLine={{ stroke: '#E2E8F0' }}
            />
            <YAxis
              type="category"
              dataKey="factor"
              stroke="#475569"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              width={155}
            />
            <Tooltip content={<CustomContributionTooltip />} />
            <Bar dataKey="percentage" radius={[0, 4, 4, 0]} barSize={16}>
              {data.map((entry, index) => (
                <Cell key={`bar-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mini Legend List */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-subtle)' }}>
        {data.map((item) => (
          <div key={item.factor} style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.75rem' }}>
            <span style={{ width: 8, height: 8, borderRadius: 2, backgroundColor: item.color }} />
            <span style={{ color: 'var(--text-secondary)' }}>{item.factor}:</span>
            <strong style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-primary)' }}>{item.percentage}%</strong>
          </div>
        ))}
      </div>
    </div>
  );
}
