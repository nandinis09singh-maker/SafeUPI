import React from 'react';
import {
  Settings,
  Globe,
  User,
  Trash2,
  LogOut,
  ShieldCheck,
  Database,
  Lock,
  ExternalLink,
  Info
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { api } from '../services/api';

export default function SettingsView({ onOpenAuth }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();

  const handleClearHistory = async () => {
    if (!window.confirm('Are you sure you want to delete all your scan history? This action is irreversible.')) return;
    try {
      await api.clearHistory();
      alert('Your scan history has been cleared successfully.');
    } catch (err) {
      alert('Error clearing history: ' + err.message);
    }
  };

  return (
    <div style={{ maxWidth: '850px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.5rem', textAlign: 'center' }}>
        <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
          {t('settingsTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {t('settingsSubtitle')}
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Profile Card */}
        <div className="safe-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <User size={20} color="#3B82F6" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('userProfile')}
            </h3>
          </div>

          {isAuthenticated ? (
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '16px',
                  background: 'linear-gradient(135deg, #1D6AE5 0%, #00E5FF 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '1.5rem',
                  fontWeight: 800,
                  color: '#FFF',
                }}>
                  {user.fullName ? user.fullName.charAt(0) : 'U'}
                </div>
                <div>
                  <h4 style={{ fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-main)' }}>
                    {user.fullName || user.username}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                    {user.email} • Username: <strong>@{user.username}</strong>
                  </p>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                    Session Secured via BCrypt & JWT Authentication
                  </span>
                </div>
              </div>

              <button
                onClick={logout}
                className="btn-danger"
                style={{ fontSize: '0.85rem', padding: '0.5rem 1.25rem' }}
              >
                <LogOut size={16} />
                <span>{t('logout')}</span>
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem', fontSize: '0.9rem' }}>
                You are currently using SafeUPI in guest mode. Sign in to synchronize your history and trusted contacts to the MySQL database.
              </p>
              <button onClick={onOpenAuth} className="btn-primary" style={{ padding: '0.6rem 1.5rem' }}>
                <User size={16} />
                <span>Sign In or Register</span>
              </button>
            </div>
          )}
        </div>

        {/* Language Preference */}
        <div className="safe-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Globe size={20} color="#00E5FF" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('langAndVoice')}
            </h3>
          </div>

          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {t('selectLang')}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
            {[
              { id: 'en', name: 'English', desc: 'Default international language' },
              { id: 'hi', name: 'हिंदी (Hindi)', desc: 'राष्ट्रीय भाषा समर्थन' },
              { id: 'mr', name: 'मराठी (Marathi)', desc: 'स्थानिक भाषा समर्थन' },
            ].map((item) => (
              <div
                key={item.id}
                onClick={() => setLang(item.id)}
                style={{
                  background: 'var(--bg-surface)',
                  border: `2px solid ${lang === item.id ? '#00E5FF' : 'var(--border-color)'}`,
                  borderRadius: 'var(--radius-md)',
                  padding: '1rem',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--text-main)' }}>{item.name}</span>
                  {lang === item.id && (
                    <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#00E5FF' }} />
                  )}
                </div>
                <p style={{ fontSize: '0.78rem', color: 'var(--text-dim)', margin: 0 }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="safe-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '1.25rem' }}>
            <Database size={20} color="#A855F7" />
            <h3 style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text-main)' }}>
              {t('purgeHistory')}
            </h3>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
            <div>
              <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                {t('purgeHistory')}
              </h4>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                {t('purgeDesc')}
              </p>
            </div>
            <button
              onClick={handleClearHistory}
              className="btn-danger"
              style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}
            >
              <Trash2 size={15} />
              <span>{t('clearHistoryBtn')}</span>
            </button>
          </div>
        </div>

        {/* Legal & Safety Principles */}
        <div className="safe-card" style={{ background: 'var(--bg-surface)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.75rem' }}>
            <Lock size={18} color="#10B981" />
            <h3 style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--text-main)' }}>
              SafeUPI Trust & Ethical Commitment
            </h3>
          </div>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '0.75rem' }}>
            SafeUPI is strictly an advisory fraud defense platform. SafeUPI:
          </p>
          <ul style={{ fontSize: '0.82rem', color: 'var(--text-dim)', paddingLeft: '1.25rem', lineHeight: 1.6 }}>
            <li>NEVER asks for or stores UPI PINs, net-banking passwords, or CVVs.</li>
            <li>NEVER initiates payment requests or accesses your bank balance.</li>
            <li>NEVER claims to monitor or control background third-party UPI applications.</li>
            <li>Computes transparent rule weights and deterministic indicators for citizen awareness.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
