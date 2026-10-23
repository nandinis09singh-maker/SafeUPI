import React, { useState, useEffect } from 'react';
import {
  History,
  Trash2,
  Eye,
  Filter,
  Search,
  RefreshCw,
  Clock,
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  X
} from 'lucide-react';
import { api } from '../services/api';
import RiskCard from '../components/RiskCard';
import { useLanguage } from '../context/LanguageContext';

export default function HistoryView({ onReportScam, selectedItemFromParent }) {
  const { t } = useLanguage();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState('ALL');
  const [filterRisk, setFilterRisk] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [inspectItem, setInspectItem] = useState(selectedItemFromParent || null);

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    if (selectedItemFromParent) {
      setInspectItem(selectedItemFromParent);
    }
  }, [selectedItemFromParent]);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const data = await api.getHistory();
      if (Array.isArray(data)) setHistory(data);
    } catch (err) {
      console.warn('Failed to load history:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this scan record?')) return;
    try {
      await api.deleteHistory(id);
      setHistory(history.filter((h) => h.id !== id));
      if (inspectItem?.id === id) setInspectItem(null);
    } catch (err) {
      alert('Delete error: ' + err.message);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm('Are you sure you want to clear your entire scan history? This action cannot be undone.')) return;
    try {
      await api.clearHistory();
      setHistory([]);
      setInspectItem(null);
    } catch (err) {
      alert('Clear error: ' + err.message);
    }
  };

  // Filtered items
  const filtered = history.filter((item) => {
    if (filterType !== 'ALL' && item.scanType !== filterType) return false;
    if (filterRisk !== 'ALL' && item.riskLevel !== filterRisk) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchVpa = item.payeeVpa && item.payeeVpa.toLowerCase().includes(q);
      const matchName = item.payeeName && item.payeeName.toLowerCase().includes(q);
      const matchInput = item.rawInput && item.rawInput.toLowerCase().includes(q);
      if (!matchVpa && !matchName && !matchInput) return false;
    }
    return true;
  });

  return (
    <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {t('historyTitle', 'Analysis History & Audit Log')}
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            {t('historySubtitle', 'Permanent record of all QR codes, text messages, and links evaluated in your account.')}
          </p>
        </div>

        {history.length > 0 && (
          <button
            onClick={handleClearAll}
            className="btn-danger"
            style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
          >
            <Trash2 size={16} />
            <span>{t('clearHistoryBtn', 'Clear All History')}</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="safe-card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search Box */}
          <div style={{ position: 'relative', flex: '1 1 260px' }}>
            <input
              type="text"
              className="form-input"
              style={{ paddingLeft: '2.5rem', paddingBottom: '0.6rem', paddingTop: '0.6rem' }}
              placeholder={t('searchPlaceholder', 'Search by VPA, payee, or keyword...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} color="var(--text-dim)" style={{ position: 'absolute', left: '0.9rem', top: '50%', transform: 'translateY(-50%)' }} />
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center' }}>
            {/* Filter by Type */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('tableType', 'Type')}:</span>
              <select
                className="form-select"
                style={{ padding: '0.5rem 0.8rem', width: 'auto', fontSize: '0.85rem' }}
                value={filterType}
                onChange={(e) => setFilterType(e.target.value)}
              >
                <option value="ALL">{t('filterAll', 'All Records')}</option>
                <option value="QR">{t('filterQr', 'QR Scans')}</option>
                <option value="MESSAGE">{t('filterMsg', 'Messages')}</option>
                <option value="LINK">{t('filterLink', 'Links')}</option>
              </select>
            </div>

            {/* Filter by Risk */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>{t('tableRiskLevel', 'Risk')}:</span>
              <select
                className="form-select"
                style={{ padding: '0.5rem 0.8rem', width: 'auto', fontSize: '0.85rem' }}
                value={filterRisk}
                onChange={(e) => setFilterRisk(e.target.value)}
              >
                <option value="ALL">{t('filterAll', 'All Risks')}</option>
                <option value="HIGH">{t('filterHigh', 'High Risk')}</option>
                <option value="MEDIUM">{t('statMediumRisk', 'Medium Risk')}</option>
                <option value="LOW">{t('statSafe', 'Low Risk')}</option>
              </select>
            </div>

            <button
              onClick={fetchHistory}
              className="btn-secondary"
              style={{ padding: '0.5rem 0.75rem' }}
              title="Refresh"
            >
              <RefreshCw size={15} />
            </button>
          </div>
        </div>
      </div>

      {/* History Items Table */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} color="var(--primary-bright)" className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          <p>{t('loadingRecords', 'Loading database records...')}</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="safe-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <History size={44} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            {t('noMatchingRecords', 'No matching scan records found')}
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', maxWidth: '400px', margin: '0 auto' }}>
            {history.length === 0
              ? t('noScansDesc', 'You have not performed any scans yet. Run a QR scan, message analysis, or link inspection to start building your security log.')
              : t('noMatchingDesc', 'Try clearing your search query or changing filter parameters.')}
          </p>
        </div>
      ) : (
        <div className="safe-card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '0.75rem', textTransform: 'uppercase' }}>
                  <th style={{ padding: '1rem' }}>{t('tableType', 'Type')}</th>
                  <th style={{ padding: '1rem' }}>{t('tableTarget', 'Instrument / Payload')}</th>
                  <th style={{ padding: '1rem' }}>{t('tableRiskLevel', 'Risk Level')}</th>
                  <th style={{ padding: '1rem' }}>{t('tableScore', 'Score')}</th>
                  <th style={{ padding: '1rem' }}>{t('tableDate', 'Analyzed On')}</th>
                  <th style={{ padding: '1rem', textAlign: 'right' }}>{t('tableAction', 'Actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((item) => {
                  const isHigh = item.riskLevel === 'HIGH';
                  const isMed = item.riskLevel === 'MEDIUM';
                  return (
                    <tr
                      key={item.id}
                      onClick={() => setInspectItem(item)}
                      style={{
                        borderBottom: '1px solid var(--border-color)',
                        fontSize: '0.88rem',
                        cursor: 'pointer',
                        transition: 'background 0.15s ease',
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-surface)')}
                      onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                    >
                      <td style={{ padding: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
                        <span style={{
                          background: 'var(--bg-surface)',
                          padding: '0.25rem 0.55rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          border: '1px solid var(--border-color)',
                        }}>
                          {item.scanType}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', maxWidth: '350px' }}>
                        {item.payeeVpa ? (
                          <div>
                            <span style={{ color: 'var(--text-main)', fontWeight: 700, display: 'block' }}>
                              {item.payeeName || item.payeeVpa}
                            </span>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', wordBreak: 'break-all' }}>
                              {item.payeeVpa}
                            </span>
                          </div>
                        ) : (
                          <div style={{
                            color: 'var(--text-main)',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}>
                            {item.rawInput}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className={`badge ${isHigh ? 'badge-high' : isMed ? 'badge-med' : 'badge-low'}`}>
                          {item.riskLevel}
                        </span>
                      </td>
                      <td style={{ padding: '1rem', fontWeight: 800, color: isHigh ? 'var(--risk-high)' : isMed ? 'var(--risk-med)' : 'var(--risk-low)' }}>
                        {item.riskScore}/100
                      </td>
                      <td style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                        {item.createdAt ? new Date(item.createdAt).toLocaleString() : 'Just now'}
                      </td>
                      <td style={{ padding: '1rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); setInspectItem(item); }}
                            className="btn-secondary"
                            style={{ padding: '0.35rem 0.65rem', fontSize: '0.78rem' }}
                          >
                            <Eye size={14} />
                            <span>{t('inspectBtn', 'Inspect')}</span>
                          </button>
                          <button
                            onClick={(e) => handleDelete(item.id, e)}
                            style={{
                              color: 'var(--text-dim)',
                              padding: '0.4rem',
                              borderRadius: '6px',
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--risk-high)')}
                            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                            title={t('deleteBtn', 'Delete')}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Inspect Item Modal */}
      {inspectItem && (
        <div
          onClick={() => setInspectItem(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 110,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: '850px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            <div style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', zIndex: 10 }}>
              <button
                onClick={() => setInspectItem(null)}
                style={{
                  background: 'var(--bg-card)',
                  color: 'var(--text-main)',
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                  border: '1px solid var(--border-color)',
                }}
              >
                <X size={18} />
              </button>
            </div>

            <RiskCard
              result={{
                ...inspectItem,
                indicators: typeof inspectItem.indicatorsJson === 'string'
                  ? JSON.parse(inspectItem.indicatorsJson || '[]')
                  : inspectItem.indicators || [],
                recommendations: typeof inspectItem.recommendationsJson === 'string'
                  ? JSON.parse(inspectItem.recommendationsJson || '[]')
                  : inspectItem.recommendations || [],
              }}
              onReportScam={onReportScam}
            />
          </div>
        </div>
      )}
    </div>
  );
}
