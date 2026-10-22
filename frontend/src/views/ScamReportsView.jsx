import React, { useState, useEffect } from 'react';
import {
  AlertTriangle,
  Send,
  Flag,
  ShieldAlert,
  Clock,
  CheckCircle,
  RefreshCw,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import { useLanguage } from '../context/LanguageContext';

export default function ScamReportsView({ initialReportData }) {
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    reportType: initialReportData?.scanType === 'QR' ? 'UPI_ID' : initialReportData?.scanType === 'LINK' ? 'LINK' : 'UPI_ID',
    targetValue: initialReportData?.payeeVpa || initialReportData?.targetUrl || initialReportData?.rawInput || '',
    description: initialReportData ? `Detected with risk score ${initialReportData.riskScore}/100: ${initialReportData.explanation}` : '',
    reporterContact: '',
  });

  const [recentReports, setRecentReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [fetchingRecent, setFetchingRecent] = useState(true);
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    fetchRecentReports();
  }, []);

  const fetchRecentReports = async () => {
    setFetchingRecent(true);
    try {
      const data = await api.getRecentReports();
      if (Array.isArray(data)) setRecentReports(data);
    } catch (err) {
      console.warn('Error loading recent reports:', err);
    } finally {
      setFetchingRecent(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.targetValue.trim() || !formData.description.trim()) return;

    setLoading(true);
    setSuccessMsg(false);

    try {
      const saved = await api.submitReport(formData);
      setSuccessMsg(true);
      setFormData({
        reportType: 'UPI_ID',
        targetValue: '',
        description: '',
        reporterContact: '',
      });
      fetchRecentReports();
      setTimeout(() => setSuccessMsg(false), 5000);
    } catch (err) {
      alert('Failed to submit report: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
          Community Scam Reporting Registry
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Report fraudulent UPI handles, fake refund QR codes, phishing websites, and extortion messages. Reports instantly empower all users.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {/* Report Submission Form */}
        <div className="safe-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1rem' }}>
            <Flag size={20} color="#EF4444" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              File a Scam Incident Report
            </h3>
          </div>

          {successMsg && (
            <div style={{
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              borderRadius: 'var(--radius-md)',
              padding: '0.85rem 1rem',
              color: '#6EE7B7',
              fontSize: '0.88rem',
              marginBottom: '1rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
            }}>
              <CheckCircle size={18} />
              <span>Report filed successfully! Added to active detection blacklist.</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Incident Category:
              </label>
              <select
                className="form-select"
                value={formData.reportType}
                onChange={(e) => setFormData({ ...formData, reportType: e.target.value })}
              >
                <option value="UPI_ID">Fraudulent UPI ID / VPA Handle</option>
                <option value="LINK">Phishing Website / Fraud URL</option>
                <option value="MESSAGE">Extortion SMS / WhatsApp Message</option>
              </select>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                {formData.reportType === 'UPI_ID'
                  ? 'Suspicious UPI ID (e.g. scammer-care@paytm):'
                  : formData.reportType === 'LINK'
                  ? 'Phishing Link / Domain URL:'
                  : 'Message Snippet / Sender Phone:'}
              </label>
              <input
                type="text"
                className="form-input"
                placeholder={
                  formData.reportType === 'UPI_ID'
                    ? 'e.g. refund-care-officer@okaxis'
                    : formData.reportType === 'LINK'
                    ? 'https://sbi-fake-login.xyz'
                    : 'Dear user, send OTP or account blocked'
                }
                value={formData.targetValue}
                onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Detailed Description of Scam Attempt:
              </label>
              <textarea
                className="form-textarea"
                rows={4}
                placeholder="Describe how the scammer approached you (e.g. pretended to be electricity board, asked to scan QR to receive excess refund, asked for UPI PIN)..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: '1.5rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Your Contact (Optional, for cybercrime validation):
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="+91 9876543210 or email"
                value={formData.reporterContact}
                onChange={(e) => setFormData({ ...formData, reporterContact: e.target.value })}
              />
            </div>

            <button
              type="submit"
              className="btn-danger"
              disabled={loading || !formData.targetValue.trim() || !formData.description.trim()}
              style={{ width: '100%', padding: '0.85rem' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={18} className="animate-spin" />
                  <span>Logging Report to MySQL...</span>
                </>
              ) : (
                <>
                  <Send size={18} />
                  <span>Submit Scam Report to Database</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Live Community Reports Feed */}
        <div className="safe-card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
              <ShieldAlert size={20} color="#00E5FF" />
              <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
                Recent Community Alerts
              </h3>
            </div>
            <button
              onClick={fetchRecentReports}
              style={{ color: 'var(--text-dim)', padding: '0.3rem' }}
              title="Refresh Feed"
            >
              <RefreshCw size={16} />
            </button>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            Flagged handles actively blocked across all SafeUPI user scans:
          </p>

          {fetchingRecent ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <RefreshCw size={24} className="animate-spin" style={{ margin: '0 auto 0.5rem auto' }} />
              <p style={{ fontSize: '0.85rem' }}>Updating scam feed...</p>
            </div>
          ) : recentReports.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '2rem 1rem', color: 'var(--text-muted)' }}>
              <Clock size={32} style={{ margin: '0 auto 0.5rem auto', opacity: 0.5 }} />
              <p style={{ fontSize: '0.85rem' }}>No community reports yet. Be the first to report!</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxHeight: '520px', overflowY: 'auto', paddingRight: '0.25rem' }}>
              {recentReports.map((report) => (
                <div
                  key={report.id}
                  style={{
                    background: 'var(--bg-surface)',
                    border: '1px solid var(--border-color)',
                    padding: '0.85rem 1rem',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: '#EF4444',
                      background: 'rgba(239, 68, 68, 0.12)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                    }}>
                      {report.reportType}
                    </span>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)' }}>
                      {report.reportedAt ? new Date(report.reportedAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>

                  <p style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: '0.88rem', margin: '0.2rem 0', wordBreak: 'break-all' }}>
                    {report.targetValue}
                  </p>

                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.4 }}>
                    {report.description}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
