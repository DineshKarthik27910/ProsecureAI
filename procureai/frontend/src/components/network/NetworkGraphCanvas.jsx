import React, { useState } from 'react';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw
} from 'lucide-react';
import './network.css';

export default function NetworkGraphCanvas({
  nodes,
  edges,
  selectedSupplierId,
  onSelectSupplier,
  filterMatchPredicate,
}) {
  const [zoomLevel, setZoomLevel] = useState(1);
  const [hoveredNode, setHoveredNode] = useState(null);

  // Zoom helpers
  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.15, 1.6));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.15, 0.7));
  const handleResetZoom = () => setZoomLevel(1);

  // Map nodes to coordinates lookup
  const nodeMap = {};
  nodes.forEach((n) => {
    nodeMap[n.id] = n;
  });

  const getNodeClass = (riskLevel, isSelected) => {
    let base = 'node-inner-circle ';
    switch (riskLevel) {
      case 'Critical':
        base += 'node-critical ';
        break;
      case 'High':
        base += 'node-high ';
        break;
      case 'Moderate':
        base += 'node-moderate ';
        break;
      default:
        base += 'node-low ';
        break;
    }
    if (isSelected) base += 'node-selected';
    return base;
  };

  return (
    <div className="graph-canvas-box">
      {/* Top Floating Info & Controls */}
      <div className="graph-top-bar">
        <div className="graph-top-left">
          <span className="pulse-dot pulse-dot-cyan" />
          <span style={{ fontSize: '0.75rem', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', fontWeight: 600 }}>
            RELATIONSHIP TOPOLOGY GRAPH
          </span>
          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
            ({nodes.length} Entities • {edges.length} Inter-Links)
          </span>
        </div>

        <div className="graph-controls-group">
          <button
            className="graph-control-btn"
            onClick={handleZoomIn}
            title="Zoom in network map"
          >
            <ZoomIn size={15} />
          </button>
          <button
            className="graph-control-btn"
            onClick={handleZoomOut}
            title="Zoom out network map"
          >
            <ZoomOut size={15} />
          </button>
          <button
            className="graph-control-btn"
            onClick={handleResetZoom}
            title="Reset network map zoom"
          >
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <svg
        className="network-svg-viewport"
        viewBox="0 0 900 580"
        style={{
          transform: `scale(${zoomLevel})`,
          transformOrigin: 'center center',
          transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        {/* Background Radar Rings */}
        <circle cx="450" cy="290" r="100" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="450" cy="290" r="200" fill="none" stroke="#E2E8F0" strokeWidth="1" strokeDasharray="3 3" />
        <circle cx="450" cy="290" r="320" fill="none" stroke="#E2E8F0" strokeWidth="1" />
        <line x1="450" y1="20" x2="450" y2="560" stroke="#E2E8F0" strokeWidth="0.75" strokeDasharray="4 4" />
        <line x1="50" y1="290" x2="850" y2="290" stroke="#E2E8F0" strokeWidth="0.75" strokeDasharray="4 4" />

        {/* Edges / Connections */}
        <g className="edges-layer">
          {edges.map((edge, idx) => {
            const source = nodeMap[edge.from];
            const target = nodeMap[edge.to];
            if (!source || !target) return null;

            const isHighlighted =
              selectedSupplierId === edge.from || selectedSupplierId === edge.to;
            const edgeClass = `network-edge-line edge-${edge.type}`;

            return (
              <g key={`edge-${idx}`}>
                <line
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  className={edgeClass}
                  style={{
                    opacity: isHighlighted ? 1 : 0.7,
                    strokeWidth: isHighlighted ? 2.5 : undefined,
                  }}
                />
                {/* Edge Midpoint Label for Suspicious Links */}
                {edge.type === 'suspicious' && (
                  <g
                    transform={`translate(${(source.x + target.x) / 2}, ${(source.y + target.y) / 2})`}
                  >
                    <rect
                      x="-42"
                      y="-9"
                      width="84"
                      height="18"
                      rx="4"
                      fill="#FFFFFF"
                      stroke="#FECACA"
                      strokeWidth="1"
                    />
                    <text
                      x="0"
                      y="3.5"
                      fontFamily="var(--font-mono)"
                      fontSize="8"
                      fill="#991B1B"
                      textAnchor="middle"
                      fontWeight="600"
                    >
                      COLLUSION LINK
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </g>

        {/* Supplier Nodes */}
        <g className="nodes-layer">
          {nodes.map((node) => {
            const isSelected = selectedSupplierId === node.id;
            const matchesFilter = filterMatchPredicate ? filterMatchPredicate(node) : true;
            const opacity = matchesFilter ? 1 : 0.25;

            return (
              <g
                key={node.id}
                className="node-circle-group"
                transform={`translate(${node.x}, ${node.y})`}
                onClick={() => onSelectSupplier(node)}
                onMouseEnter={() => setHoveredNode(node)}
                onMouseLeave={() => setHoveredNode(null)}
                style={{ opacity }}
              >
                {/* Main Node Circle */}
                <circle
                  className={getNodeClass(node.risk_level, isSelected)}
                  r={node.radius}
                />

                {/* Center Entity Score */}
                <text
                  x="0"
                  y="4"
                  fontFamily="var(--font-mono)"
                  fontSize="10"
                  fontWeight="700"
                  fill="#0F172A"
                  textAnchor="middle"
                  pointerEvents="none"
                >
                  {node.risk_score}
                </text>

                {/* Node Label Below */}
                <text
                  x="0"
                  y={node.radius + 14}
                  className="node-label-text"
                >
                  {node.name.length > 18 ? `${node.name.slice(0, 16)}…` : node.name}
                </text>

                <text
                  x="0"
                  y={node.radius + 26}
                  className="node-sub-text"
                >
                  {node.id} • {node.contracts_won} Wins
                </text>
              </g>
            );
          })}
        </g>
      </svg>

      {/* Bottom Graph Legend */}
      <div className="graph-bottom-legend">
        <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--text-muted)', fontSize: '0.7rem' }}>
          NODE RISK:
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#DC2626' }} />
          <span>Critical / High</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#D97706' }} />
          <span>Moderate</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#16A34A' }} />
          <span>Low</span>
        </div>
        <span style={{ color: 'var(--border-bright)' }}>|</span>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
          <span style={{ width: 14, height: 2, backgroundColor: '#DC2626' }} />
          <span style={{ color: '#991B1B' }}>Collusion Link</span>
        </div>
      </div>
    </div>
  );
}
