import React, { useState, useEffect } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  QrCode,
  MessageSquareText,
  Link2,
  TrendingUp,
  Users,
  Flag,
  ArrowRight,
  Clock,
  Eye,
  CheckCircle,
  HelpCircle,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function DashboardView({ setView, onSelectHistoryItem }) {
  const { t } = useLanguage();
  const [stats, setStats] = useState({
    totalScans: 0,
    highRiskScans: 0,
    mediumRiskScans: 0,
    lowRiskScans: 0,
    totalScamReports: 0,
    trustedContactsCount: 0,
    scansByType: { QR: 0, MESSAGE: 0, LINK: 0 },
  });
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const [statsData, historyData] = await Promise.all([
          api.getStats(),
          api.getHistory(),
        ]);
        if (statsData) setStats(statsData);
        if (Array.isArray(historyData)) setRecentHistory(historyData.slice(0, 5));
      } catch (err) {
        console.warn('Dashboard fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
      {/* Welcome & Stats Row */}
      <div>
        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
          <div>
            <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>
              Security Command Center
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              Continuous real-time protection against UPI collect scams, phishing links, and social engineering.
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(5, 150, 105, 0.1)', border: '1px solid rgba(5, 150, 105, 0.25)', padding: '0.4rem 0.85rem', borderRadius: '9999px' }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#059669', boxShadow: '0 0 8px #059669' }} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700, color: '#059669' }}>SafeUPI AI Engine Online</span>
          </div>
        </div>

        {/* 4 Primary Stats Cards */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
          gap: '1.25rem',
        }}>
          {/* Card 1: Total Scans */}
          <div className="safe-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <TrendingUp size={24} color="var(--primary-bright)" />
            </div>
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total Scans</p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--text-main)' }}>{stats.totalScans || 0}</h2>
            </div>
          </div>

          {/* Card 2: High Risk Scams Blocked */}
          <div className="safe-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(220, 38, 38, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldAlert size={24} color="var(--risk-high)" />
            </div>
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>High Risk Detected</p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--risk-high)' }}>{stats.highRiskScans || 0}</h2>
            </div>
          </div>

          {/* Card 3: Medium Risk Cautions */}
          <div className="safe-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(217, 119, 6, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AlertTriangle size={24} color="var(--risk-med)" />
            </div>
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Suspicious Cautions</p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--risk-med)' }}>{stats.mediumRiskScans || 0}</h2>
            </div>
          </div>

          {/* Card 4: Safe Clearances */}
          <div className="safe-card" style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(5, 150, 105, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <ShieldCheck size={24} color="var(--risk-low)" />
            </div>
            <div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Verified Safe</p>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--risk-low)' }}>{stats.lowRiskScans || 0}</h2>
            </div>
          </div>
        </div>
      </div>

      {/* Main 3 Action Modalities */}
      <div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '1rem' }}>
          Scan & Analyze Instruments
        </h3>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.25rem',
        }}>
          {/* Action 1: QR Scanner */}
          <div
            className="safe-card"
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
            onClick={() => setView('qr')}
          >
            <div>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(37, 99, 235, 0.1)', border: '1px solid rgba(37, 99, 235, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <QrCode size={24} color="var(--primary-bright)" />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                {t('scanQrBtn')}
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Scan real QR codes via camera or image upload. Extracts Payee VPA, name, amount & detects deceptive "Scan to receive" traps.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--primary-bright)', fontWeight: 700, fontSize: '0.88rem' }}>
              <span>Launch Camera Scanner</span>
              <ArrowRight size={16} />
            </div>
          </div>

          {/* Action 2: Message Checker */}
          <div
            className="safe-card"
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
            onClick={() => setView('message')}
          >
            <div>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(2, 132, 199, 0.1)', border: '1px solid rgba(2, 132, 199, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <MessageSquareText size={24} color="var(--accent-cyan)" />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                {t('checkMsgBtn')}
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Paste suspicious SMS, WhatsApp notices, or fake electricity disconnection alerts. Identifies OTP theft, fake customer care & UPI PIN demands.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontWeight: 700, fontSize: '0.88rem' }}>
              <span>Analyze Message Text</span>
              <ArrowRight size={16} />
            </div>
          </div>

          {/* Action 3: Link Checker */}
          <div
            className="safe-card"
            style={{
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              position: 'relative',
            }}
            onClick={() => setView('link')}
          >
            <div>
              <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(147, 51, 234, 0.1)', border: '1px solid rgba(147, 51, 234, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.25rem' }}>
                <Link2 size={24} color="#9333EA" />
              </div>
              <h4 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                {t('checkLinkBtn')}
              </h4>
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '1.25rem' }}>
                Inspect URLs for spoofed banking hostnames (e.g. SBI/HDFC typosquatting), raw IP addresses, and direct APK download links safely without opening.
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#9333EA', fontWeight: 700, fontSize: '0.88rem' }}>
              <span>Inspect Web URL</span>
              <ArrowRight size={16} />
            </div>
          </div>
        </div>
      </div>

      {/* Recent History Preview */}
      <div className="safe-card">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              Recent Security Analyses
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              History of scans evaluated by SafeUPI rules engine
            </p>
          </div>
          <button
            onClick={() => setView('history')}
            className="btn-secondary"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <span>View Full History</span>
            <ArrowRight size={16} />
          </button>
        </div>

        {recentHistory.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)' }}>
            <Clock size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.5 }} />
            <p style={{ fontWeight: 600 }}>No scans recorded yet</p>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', maxWidth: '400px', margin: '0.25rem auto 1rem auto' }}>
              Perform your first QR scan or message check above to see risk analysis records here.
            </p>
            <button onClick={() => setView('qr')} className="btn-primary" style={{ fontSize: '0.85rem' }}>
              <QrCode size={16} />
              <span>Scan QR Code Now</span>
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '0.75rem 1rem' }}>Type</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Payload / Target</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Risk Level</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Score</th>
                  <th style={{ padding: '0.75rem 1rem' }}>Date</th>
                  <th style={{ padding: '0.75rem 1rem', textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentHistory.map((item) => (
                  <tr
                    key={item.id}
                    style={{ borderBottom: '1px solid var(--border-color)', fontSize: '0.88rem' }}
                    className="hover-row"
                  >
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                      <span style={{
                        background: 'var(--bg-surface)',
                        padding: '0.2rem 0.5rem',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        border: '1px solid var(--border-color)',
                      }}>
                        {item.scanType}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', maxWidth: '320px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.payeeVpa ? (
                        <div>
                          <span style={{ color: 'var(--text-main)', fontWeight: 600 }}>{item.payeeName || item.payeeVpa}</span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', display: 'block' }}>{item.payeeVpa}</span>
                        </div>
                      ) : (
                        <span style={{ color: 'var(--text-main)' }}>{item.rawInput}</span>
                      )}
                    </td>
                    <td style={{ padding: '0.85rem 1rem' }}>
                      <span className={`badge ${item.riskLevel === 'HIGH' ? 'badge-high' : item.riskLevel === 'MEDIUM' ? 'badge-med' : 'badge-low'}`}>
                        {item.riskLevel}
                      </span>
                    </td>
                    <td style={{ padding: '0.85rem 1rem', fontWeight: 700, color: item.riskLevel === 'HIGH' ? 'var(--risk-high)' : item.riskLevel === 'MEDIUM' ? 'var(--risk-med)' : 'var(--risk-low)' }}>
                      {item.riskScore}/100
                    </td>
                    <td style={{ padding: '0.85rem 1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                      {item.createdAt ? new Date(item.createdAt).toLocaleDateString() : 'Today'}
                    </td>
                    <td style={{ padding: '0.85rem 1rem', textAlign: 'right' }}>
                      <button
                        onClick={() => onSelectHistoryItem(item)}
                        style={{
                          color: 'var(--primary-bright)',
                          background: 'rgba(37, 99, 235, 0.08)',
                          padding: '0.35rem 0.65rem',
                          borderRadius: '6px',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.35rem',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                        }}
                      >
                        <Eye size={14} />
                        <span>Inspect</span>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Educational Cyber Awareness Banner */}
      <div style={{
        background: 'rgba(5, 150, 105, 0.06)',
        border: '1px solid rgba(5, 150, 105, 0.2)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.5rem',
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '1rem',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: 'rgba(5, 150, 105, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CheckCircle size={26} color="#059669" />
          </div>
          <div>
            <h4 style={{ fontSize: '1.05rem', fontWeight: 700, color: 'var(--text-main)' }}>
              The 4 Unbreakable UPI Safety Rules
            </h4>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              1. Never enter UPI PIN to receive money • 2. Never approve unknown collect requests • 3. Never install AnyDesk • 4. Check recipient name
            </p>
          </div>
        </div>
        <button onClick={() => setView('reports')} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
          <Flag size={16} />
          <span>Report a Fraudulent Handle</span>
        </button>
      </div>
    </div>
  );
}
