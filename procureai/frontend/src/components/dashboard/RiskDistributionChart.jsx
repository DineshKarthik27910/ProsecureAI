import React from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from 'recharts';
import { ShieldCheck } from 'lucide-react';
import './dashboard.css';

function CustomPieTooltip({ active, payload }) {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="custom-recharts-tooltip">
        <div className="tooltip-title">{data.name.toUpperCase()} TIER</div>
        <div className="tooltip-item">
          <div className="tooltip-item-name">
            <span
              className="tooltip-item-color"
              style={{ backgroundColor: data.color }}
            />
            <span>Contract Volume:</span>
          </div>
          <span className="tooltip-item-value">{data.value} tenders</span>
        </div>
        <div className="tooltip-item">
          <span style={{ color: 'var(--text-muted)' }}>Distribution:</span>
          <span className="tooltip-item-value">{data.percent}</span>
        </div>
      </div>
    );
  }
  return null;
}

export default function RiskDistributionChart({ data }) {
  const totalTenders = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div className="dashboard-panel-card">
      <div className="panel-header-row">
        <div className="panel-title-group">
          <ShieldCheck size={18} color="var(--primary-navy)" />
          <div>
            <h3 className="panel-title">Risk Distribution</h3>
            <p className="panel-subtitle">Classification across severity tiers</p>
          </div>
        </div>
      </div>

      <div className="donut-chart-wrapper">
        <div style={{ width: '100%', height: '200px', position: 'relative' }}>
          <ResponsiveContainer width="100%" height={200} minWidth={0}>
            <PieChart>
              <Tooltip content={<CustomPieTooltip />} />
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={62}
                outerRadius={86}
                paddingAngle={3}
                dataKey="value"
                stroke="#FFFFFF"
                strokeWidth={2}
              >
                {data.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
            </PieChart>
          </ResponsiveContainer>

          {/* Centered Donut Label */}
          <div className="donut-center-metric">
            <div className="donut-center-value">{totalTenders}</div>
            <div className="donut-center-label">Categorized</div>
          </div>
        </div>

        {/* Breakdown Legend */}
        <div className="donut-legend-breakdown">
          {data.map((item) => (
            <div key={item.name} className="donut-legend-row">
              <div className="donut-legend-left">
                <span
                  className="donut-legend-dot"
                  style={{ backgroundColor: item.color }}
                />
                <span>{item.name}</span>
              </div>
              <div className="donut-legend-right">
                <span className="donut-legend-count">{item.value}</span>
                <span className="donut-legend-percent">{item.percent}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
