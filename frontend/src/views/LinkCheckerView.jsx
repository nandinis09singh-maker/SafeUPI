import React, { useState } from 'react';
import {
  Link2,
  ShieldAlert,
  RefreshCw,
  Globe,
  AlertTriangle,
  Lock,
  ExternalLink
} from 'lucide-react';
import { api } from '../services/api';
import RiskCard from '../components/RiskCard';
import { useLanguage } from '../context/LanguageContext';

export default function LinkCheckerView({ onReportScam }) {
  const { t } = useLanguage();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  const presets = [
    {
      title: 'Fake SBI Netbanking Phishing',
      badge: 'HIGH RISK',
      color: '#DC2626',
      url: 'https://sbi-kyc-pan-update.top/login.html',
    },
    {
      title: 'Fake Paytm Cashback Portal',
      badge: 'HIGH RISK',
      color: '#DC2626',
      url: 'https://paytm-refund-reward.xyz/claim.php',
    },
    {
      title: 'Raw IP with Direct APK Link',
      badge: 'HIGH RISK',
      color: '#DC2626',
      url: 'http://192.168.1.105:8080/SBI_Yono_Update.apk',
    },
    {
      title: 'Official SBI Net Banking',
      badge: 'SAFE',
      color: '#059669',
      url: 'https://www.onlinesbi.sbi',
    },
  ];

  const handleAnalyze = async (e) => {
    if (e) e.preventDefault();
    if (!url.trim()) return;

    setLoading(true);
    setResult(null);

    try {
      const res = await api.analyzeLink(url.trim());
      setResult(res);
    } catch (err) {
      alert('Analysis error: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const loadPreset = (p) => {
    setUrl(p.url);
    setResult(null);
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
          Malicious Link & Phishing Inspector
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Evaluate suspicious URLs safely without opening them. Unmasks brand spoofing, malicious APK downloads, and cheap phishing domains.
        </p>
      </div>

      <div className="safe-card">
        <form onSubmit={handleAnalyze}>
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.4rem' }}>
              Website URL to inspect:
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="e.g. https://sbi-kyc-pan-update.top"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                required
              />
              <Globe size={18} color="var(--text-dim)" style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)' }} />
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '0.35rem', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Lock size={12} />
              Safe Inspection: SafeUPI parses domain structure and blocklist records locally without executing scripts or opening links.
            </span>
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading || !url.trim()}
            style={{ width: '100%', padding: '0.85rem' }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                <span>Deconstructing Domain Structure...</span>
              </>
            ) : (
              <>
                <ShieldAlert size={18} />
                <span>Inspect URL Safely</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Test Presets */}
        <div style={{ marginTop: '1.75rem', paddingTop: '1.5rem', borderTop: '1px solid var(--border-color)' }}>
          <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: '0.75rem' }}>
            Known Test Cases (Click to Test)
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
                <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {p.url}
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
            Analyzing Link Parameters...
          </h4>
          <p style={{ fontSize: '0.85rem' }}>
            Checking domain spoofing, TLD reputation, direct APK links & institutional matches...
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
