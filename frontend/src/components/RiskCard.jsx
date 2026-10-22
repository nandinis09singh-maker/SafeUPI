import React, { useState } from 'react';
import {
  ShieldAlert,
  ShieldCheck,
  AlertTriangle,
  Volume2,
  Share2,
  Copy,
  Check,
  Flag,
  ArrowRight,
  Info,
  CheckCircle2,
  XCircle,
  HelpCircle
} from 'lucide-react';
import VoiceReader from './VoiceReader';
import { useLanguage } from '../context/LanguageContext';

export default function RiskCard({ result, onReportScam, onShareWithContact }) {
  const { t } = useLanguage();
  const [copied, setCopied] = useState(false);

  if (!result) return null;

  const isHigh = result.riskLevel === 'HIGH';
  const isMed = result.riskLevel === 'MEDIUM';
  const isLow = result.riskLevel === 'LOW';

  const theme = isHigh
    ? {
        border: 'var(--risk-high-border)',
        headerBg: 'var(--risk-high-bg)',
        badgeClass: 'badge-high',
        color: 'var(--risk-high)',
        title: 'HIGH RISK SCAM DETECTED',
        icon: ShieldAlert,
      }
    : isMed
    ? {
        border: 'var(--risk-med-border)',
        headerBg: 'var(--risk-med-bg)',
        badgeClass: 'badge-med',
        color: 'var(--risk-med)',
        title: 'CAUTION: SUSPICIOUS INDICATORS',
        icon: AlertTriangle,
      }
    : {
        border: 'var(--risk-low-border)',
        headerBg: 'var(--risk-low-bg)',
        badgeClass: 'badge-low',
        color: 'var(--risk-low)',
        title: 'LOW RISK: NO OBVIOUS THREATS',
        icon: ShieldCheck,
      };

  const Icon = theme.icon;

  const handleShare = () => {
    const text = `🚨 *SafeUPI Security Alert*\n\nRisk Level: *${result.riskLevel}* (Risk Score: ${result.riskScore}/100)\nType: ${result.scanType}\n\n*Explanation*: ${result.explanation}\n\n*Safety Advice*: Never enter your UPI PIN to receive money!\n\nVerified via SafeUPI Scam Detector.`;
    
    if (navigator.share) {
      navigator.share({
        title: 'SafeUPI Security Warning',
        text: text,
      }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  return (
    <div
      className="safe-card"
      style={{
        border: `2px solid ${theme.border}`,
        boxShadow: 'var(--card-shadow)',
        padding: 0,
        overflow: 'hidden',
        marginTop: '1.5rem',
      }}
    >
      {/* Header Banner */}
      <div
        style={{
          background: theme.headerBg,
          padding: '1.25rem 1.75rem',
          borderBottom: `1px solid ${theme.border}`,
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              border: `1px solid ${theme.border}`,
              boxShadow: '0 2px 6px rgba(0,0,0,0.06)',
            }}
          >
            <Icon size={26} color={theme.color} />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.2rem' }}>
              <span className={`badge ${theme.badgeClass}`}>
                {result.riskLevel} RISK
              </span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Scan Type: <strong>{result.scanType}</strong>
              </span>
            </div>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)' }}>
              {theme.title}
            </h3>
          </div>
        </div>

        {/* Score Gauge */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '1rem',
          background: 'var(--bg-card)',
          padding: '0.65rem 1.15rem',
          borderRadius: '10px',
          border: '1px solid var(--border-color)',
        }}>
          <div>
            <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              Rule Weight Score
            </div>
            <div style={{ fontSize: '1.5rem', fontWeight: 800, color: theme.color, lineHeight: 1 }}>
              {result.riskScore}<span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>/100</span>
            </div>
          </div>
          <div style={{ width: '80px', height: '8px', background: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${result.riskScore}%`,
                height: '100%',
                background: theme.color,
                borderRadius: '4px',
                transition: 'width 0.6s ease',
              }}
            />
          </div>
        </div>
      </div>

      <div style={{ padding: '1.5rem 1.75rem' }}>
        {/* UPI Metadata Chips (if QR) */}
        {(result.payeeVpa || result.payeeName || result.amount || result.targetUrl) && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '0.75rem',
            background: 'var(--bg-surface)',
            padding: '1rem 1.25rem',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--border-color)',
            marginBottom: '1.5rem',
          }}>
            {result.payeeVpa && (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Recipient UPI ID (VPA)</span>
                <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)', wordBreak: 'break-all' }}>{result.payeeVpa}</p>
              </div>
            )}
            {result.payeeName && (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Payee Name</span>
                <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--text-main)' }}>{result.payeeName}</p>
              </div>
            )}
            {result.amount && (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Requested Amount</span>
                <p style={{ fontSize: '0.92rem', fontWeight: 700, color: 'var(--primary)' }}>₹{result.amount}</p>
              </div>
            )}
            {result.targetUrl && (
              <div>
                <span style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Target URL</span>
                <p style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--primary-bright)', wordBreak: 'break-all' }}>{result.targetUrl}</p>
              </div>
            )}
          </div>
        )}

        {/* Explanation */}
        <div style={{ marginBottom: '1.5rem' }}>
          <h4 style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.4rem', fontWeight: 700 }}>
            Analysis Verdict
          </h4>
          <p style={{ fontSize: '0.98rem', color: 'var(--text-main)', lineHeight: 1.6 }}>
            {result.explanation}
          </p>
        </div>

        {/* Detected Indicators */}
        {result.indicators && result.indicators.length > 0 && (
          <div style={{ marginBottom: '1.5rem' }}>
            <h4 style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem', fontWeight: 700 }}>
              Detected Risk Indicators ({result.indicators.length})
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
              {result.indicators.map((ind, i) => (
                <div
                  key={i}
                  style={{
                    background: 'var(--bg-surface)',
                    borderLeft: `3px solid ${ind.severity === 'HIGH' ? 'var(--risk-high)' : ind.severity === 'MEDIUM' ? 'var(--risk-med)' : 'var(--primary)'}`,
                    borderTop: '1px solid var(--border-color)',
                    borderRight: '1px solid var(--border-color)',
                    borderBottom: '1px solid var(--border-color)',
                    borderRadius: '0 8px 8px 0',
                    padding: '0.85rem 1.1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.92rem', color: 'var(--text-main)' }}>
                      {ind.title}
                    </span>
                    <span style={{
                      fontSize: '0.7rem',
                      fontWeight: 800,
                      color: ind.severity === 'HIGH' ? 'var(--risk-high-text)' : 'var(--risk-med-text)',
                      background: ind.severity === 'HIGH' ? 'var(--risk-high-bg)' : 'var(--risk-med-bg)',
                      padding: '0.15rem 0.5rem',
                      borderRadius: '4px',
                      border: `1px solid ${ind.severity === 'HIGH' ? 'var(--risk-high-border)' : 'var(--risk-med-border)'}`,
                    }}>
                      +{ind.weight} PTS
                    </span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', margin: 0, lineHeight: 1.5 }}>
                    {ind.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recommended Actions */}
        {result.recommendations && result.recommendations.length > 0 && (
          <div style={{ marginBottom: '1.75rem' }}>
            <h4 style={{ fontSize: '0.82rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.65rem', fontWeight: 700 }}>
              Recommended Safety Actions
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              {result.recommendations.map((rec, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: '0.6rem' }}>
                  <CheckCircle2 size={16} color={isHigh ? 'var(--risk-high)' : 'var(--risk-low)'} style={{ flexShrink: 0, marginTop: '3px' }} />
                  <span style={{ fontSize: '0.9rem', color: 'var(--text-main)' }}>{rec}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions Bar: Voice Reader, Share, Report */}
        <div style={{
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid var(--border-color)',
        }}>
          {/* Audio TTS Reader */}
          <VoiceReader voiceWarnings={result.voiceWarning} />

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {/* Share Warning Button */}
            <button
              onClick={handleShare}
              className="btn-secondary"
              style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              title="Share warning with contacts"
            >
              {copied ? <Check size={16} color="var(--risk-low)" /> : <Share2 size={16} />}
              <span>{copied ? 'Copied to Clipboard!' : t('shareWarning')}</span>
            </button>

            {/* Report Scam Button */}
            {(isHigh || isMed) && onReportScam && (
              <button
                onClick={() => onReportScam(result)}
                className="btn-danger"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}
              >
                <Flag size={16} />
                <span>{t('reportScam')}</span>
              </button>
            )}
          </div>
        </div>

        {/* Rule-Engine Note & Educational Disclaimer */}
        <div style={{
          marginTop: '1.25rem',
          fontSize: '0.72rem',
          color: 'var(--text-dim)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
        }}>
          <Info size={13} style={{ flexShrink: 0 }} />
          <span>
            The risk score is a deterministic heuristic evaluation computed by the weighted rule engine. It does not represent a statistically calibrated probability of fraud.
          </span>
        </div>
      </div>
    </div>
  );
}
