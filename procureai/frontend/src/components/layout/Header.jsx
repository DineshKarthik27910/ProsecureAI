import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  Search,
  Bell,
  HelpCircle,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  CheckCheck
} from 'lucide-react';
import api from '../../services/api';
import ProtocolHelpModal from './ProtocolHelpModal';
import './layout.css';

const ROUTE_LABELS = {
  '/': 'Executive Overview',
  '/tenders': 'Tender Explorer',
  '/risk-analysis': 'Risk Analysis Engine',
  '/supplier-network': 'Supplier Network Graph',
  '/reports': 'Investigation Reports',
  '/live-monitoring': 'Live Procurement Monitoring',
};

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const currentTitle = ROUTE_LABELS[location.pathname] || 'Intelligence Console';
  const [searchQuery, setSearchQuery] = useState('');

  // Notification state
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const [notifications, setNotifications] = useState([
    {
      id: 'notif-1',
      title: 'Critical Risk: South Region Construction',
      detail: 'T00566: Suspicious bid pricing synchronization & historical win rate (80%).',
      time: '10m ago',
      severity: 'High',
      tenderId: 'T00566',
      unread: true,
    },
    {
      id: 'notif-2',
      title: 'Low Competition Warning',
      detail: 'T02267: North Region Construction had only 2 participating bidders.',
      time: '35m ago',
      severity: 'High',
      tenderId: 'T02267',
      unread: true,
    },
    {
      id: 'notif-3',
      title: 'Price Anomaly Alert',
      detail: 'T02524: Bid is 42% of estimated market value in Construction.',
      time: '1h ago',
      severity: 'High',
      tenderId: 'T02524',
      unread: true,
    },
    {
      id: 'notif-4',
      title: 'Vendor Win-Rate Anomaly',
      detail: 'T04388: Vendor V0001 won 174 of previous 216 participations.',
      time: '2h ago',
      severity: 'Moderate',
      tenderId: 'T04388',
      unread: true,
    },
  ]);

  // Protocol Help Modal state
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  const notificationRef = useRef(null);

  // Load live alerts from dashboard overview
  useEffect(() => {
    let isMounted = true;
    async function fetchNotifications() {
      try {
        const overview = await api.getDashboardOverview();
        if (isMounted && overview) {
          const list = [];
          if (overview.top_high_risk_tenders?.length > 0) {
            overview.top_high_risk_tenders.slice(0, 2).forEach((t, i) => {
              list.push({
                id: `high-risk-${t.id}`,
                title: `High Risk: ${t.category} (${t.id})`,
                detail: `${t.supplier}: [${t.flags?.join(', ') || 'Risk Outlier'}]`,
                time: i === 0 ? '10m ago' : '25m ago',
                severity: 'High',
                tenderId: t.id,
                unread: true,
              });
            });
          }
          if (overview.recent_anomalies?.length > 0) {
            overview.recent_anomalies.slice(0, 3).forEach((a) => {
              list.push({
                id: a.id,
                title: a.title,
                detail: `${a.tenderId}: ${a.detail}`,
                time: a.time,
                severity: a.severity,
                tenderId: a.tenderId,
                unread: true,
              });
            });
          }
          if (list.length > 0) {
            setNotifications(list);
          }
        }
      } catch (err) {
        console.warn('[Header] Error fetching live notifications, using fallback:', err);
      }
    }
    fetchNotifications();
    return () => {
      isMounted = false;
    };
  }, []);

  // Close notifications popover on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationRef.current && !notificationRef.current.contains(e.target)) {
        setIsNotificationsOpen(false);
      }
    };
    if (isNotificationsOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isNotificationsOpen]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      const q = searchQuery.trim();
      if (q) {
        navigate(`/tenders?search=${encodeURIComponent(q)}`);
      } else {
        navigate('/tenders');
      }
    }
  };

  const handleMarkAllRead = () => {
    setHasUnread(false);
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
  };

  const handleSelectNotification = (notif) => {
    setIsNotificationsOpen(false);
    if (notif.tenderId) {
      navigate('/risk-analysis', { state: { selectedTenderId: notif.tenderId } });
    }
  };

  return (
    <>
      <header className="app-header">
        {/* Left: Breadcrumbs & Search */}
        <div className="header-left-col">
          <div className="header-breadcrumbs">
            <span className="breadcrumb-root">ProcureAI</span>
            <span className="breadcrumb-separator">/</span>
            <span className="breadcrumb-current">{currentTitle}</span>
          </div>

          {/* Global Contract / Tender Quick Search */}
          <div className="header-search-bar">
            <Search size={15} color="var(--text-muted)" />
            <input
              type="text"
              className="header-search-input"
              placeholder="Search tender ID, vendor, director or flag..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
            />
            <span className="header-search-key">↵</span>
          </div>
        </div>

        {/* Right: Security Tag & Alert Actions */}
        <div className="header-right-col">
          {/* Compliance / Security Tag */}
          <div className="classification-badge">
            OFFICIAL USE // AUDIT SYSTEM
          </div>

          {/* Live Notification Bell */}
          <div className="header-notifications-container" ref={notificationRef}>
            <button
              className={`header-icon-btn ${isNotificationsOpen ? 'active' : ''}`}
              onClick={() => setIsNotificationsOpen((prev) => !prev)}
              title={`${notifications.length} Active System Alerts`}
              aria-label="View system surveillance notifications"
              aria-expanded={isNotificationsOpen}
            >
              <Bell size={16} />
              {hasUnread && <span className="notification-badge-dot" />}
            </button>

            {/* Notifications Popover Dropdown */}
            {isNotificationsOpen && (
              <div className="notifications-popover">
                <div className="notifications-popover-header">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <h4>Surveillance Alerts</h4>
                    <span
                      className="badge badge-risk-high"
                      style={{ fontSize: '0.68rem', padding: '0.1rem 0.4rem' }}
                    >
                      {notifications.length} Active
                    </span>
                  </div>
                  {hasUnread && (
                    <button
                      className="notifications-dismiss-btn"
                      onClick={handleMarkAllRead}
                      title="Mark all alerts as read"
                    >
                      <CheckCheck size={12} style={{ display: 'inline', marginRight: 3 }} />
                      Mark read
                    </button>
                  )}
                </div>

                <div className="notifications-list">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={`notification-popover-item ${n.unread ? 'unread' : ''}`}
                      onClick={() => handleSelectNotification(n)}
                      title={`Inspect dossier for ${n.tenderId || 'alert'}`}
                    >
                      <div className="notif-icon-col">
                        <AlertTriangle
                          size={14}
                          color={n.severity === 'Critical' || n.severity === 'High' ? 'var(--risk-high)' : 'var(--risk-med)'}
                        />
                      </div>
                      <div className="notif-body-col">
                        <div className="notif-title-row">
                          <span className="notif-title">{n.title}</span>
                          <span className="notif-time">{n.time}</span>
                        </div>
                        <div className="notif-detail">{n.detail}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="notifications-popover-footer">
                  <button
                    className="notifications-view-all-btn"
                    onClick={() => {
                      setIsNotificationsOpen(false);
                      navigate('/tenders?status=Requires+Investigation');
                    }}
                  >
                    <span>View all flagged solicitations</span>
                    <ArrowRight size={12} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Help & Documentation */}
          <button
            className={`header-icon-btn ${isHelpOpen ? 'active' : ''}`}
            onClick={() => setIsHelpOpen(true)}
            title="ProcureAI Protocol & Forensic Reference Guide"
            aria-label="Open ProcureAI protocol help modal"
          >
            <HelpCircle size={16} />
          </button>
        </div>
      </header>

      {/* Protocol Help Modal */}
      <ProtocolHelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
}

