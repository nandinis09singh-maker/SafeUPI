import React, { useState } from 'react';
import {
  MessageSquareText,
  ShieldAlert,
  RefreshCw,
  Sparkles,
  AlertOctagon,
  Copy,
  Info
} from 'lucide-react';
import { api } from '../services/api';
import RiskCard from '../components/RiskCard';
import { useLanguage } from '../context/LanguageContext';

export default function MessageCheckerView({ onReportScam }) {
  const { t } = useLanguage();
  const [messageText, setMessageText] = useState('');
  const [senderId, setSenderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const presets = [
    {
      title: 'UPI PIN Refund Fraud',
      badge: 'HIGH RISK',
      color: '#DC2626',
      sender: '+91 9876543210',
      text: 'Dear customer, Rs 4,999 cashback approved on PhonePe. Enter your 6-digit UPI PIN to receive money in your bank account immediately.',
    },
    {
      title: 'Electricity Disconnection Scam',
      badge: 'HIGH RISK',
      color: '#DC2626',
      sender: '9811223344',
      text: 'Dear consumer, your electricity power will be disconnected tonight at 9:30 PM because previous month bill was not updated. Please call our power officer Mr. Sharma at 9811223344 immediately.',
    },
    {
      title: 'AnyDesk / OTP Remote Takeover',
      badge: 'HIGH RISK',
      color: '#DC2626',
      sender: '+91 7654321098',
      text: 'SBI Security Alert: Your netbanking account has been suspended due to pending KYC. Install AnyDesk application from playstore or forward 6-digit OTP to unblock.',
    },
    {
      title: 'Legitimate Bank Transaction Alert',
      badge: 'SAFE',
      color: '#059669',
      sender: 'VM-HDFCBK',
      text: 'Rs. 350.00 debited from HDFC Bank A/C XX4921 on 22-OCT-26 via UPI ref 4109283749. Info: Reliance Fresh. If not done by you, SMS BLOCK to 5676712.',
    },
  ];

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!messageText.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await api.analyzeMessage(messageText.trim(), senderId.trim());
      setResult(res);
    } catch (err) {
      alert('Analysis error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (preset) => {
    setMessageText(preset.text);
    setSenderId(preset.sender);
    setResult(null);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
          SMS & WhatsApp Scam Checker
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Detect suspicious refund lures, UPI PIN extortion, fake electricity disconnection notices, and OTP theft.
        </p>
      </div>

      <div className="safe-card">
        <form onSubmit={handleAnalyze}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Message Text (Paste SMS or WhatsApp message):
            </label>
            <textarea
              className="form-textarea"
              rows={4}
              placeholder="Paste the suspicious text message here..."
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              required
            />
          </div>

          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Sender ID or Phone Number (Optional):
            </label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. +91 9876543210 or VM-HDFCBK"
              value={senderId}
              onChange={(e) => setSenderId(e.target.value)}
            />
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.3rem', display: 'block' }}>
              Official transactional SMS in India use 6-character bank headers like "AD-SBIINB", while scams originate from normal 10-digit mobile numbers.
            </span>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !messageText.trim()}
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Evaluating Behavioral Patterns...</span>
              </>
            ) : (
              <>
                <ShieldAlert size={18} />
                <span>Analyze Message Now</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Test Presets */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
            Preloaded Scam Test Cases (Click to Test)
          </span>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '0.6rem' }}>
            {presets.map((p, i) => (
              <div
                key={i}
                onClick={() => loadPreset(p)}
                style={{
                  background: 'var(--bg-surface)',
                  border: '1px solid var(--border-color)',
                  padding: '0.85rem 1rem',
                  borderRadius: 'var(--radius-md)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = p.color;
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--border-color)';
                  e.currentTarget.style.transform = 'none';
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.88rem', color: 'var(--text-main)' }}>{p.title}</span>
                  <span style={{
                    fontSize: '0.68rem',
                    fontWeight: 800,
                    color: p.color,
                    background: 'var(--bg-card)',
                    padding: '0.15rem 0.45rem',
                    borderRadius: '4px',
                    border: `1px solid ${p.color}40`,
                  }}>
                    {p.badge}
                  </span>
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                  {p.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} color="var(--primary-bright)" className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          <h4 style={{ color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 700 }}>
            Scanning Message Syntax...
          </h4>
          <p style={{ fontSize: '0.85rem' }}>
            Checking UPI PIN solicitations, urgent utility threats, and suspicious sender headers...
          </p>
        </div>
      )}

      {result && (
        <RiskCard
          result={result}
          onReportScam={onReportScam}
        />
      )}
    </div>
  );
}
