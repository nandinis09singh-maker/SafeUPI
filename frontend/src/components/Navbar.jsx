import React, { useState, useEffect } from 'react';
import { ShieldCheck, User, LogIn, LogOut, Globe, Menu, ShieldAlert, Sun, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function Navbar({ onOpenAuth, onToggleSidebar }) {
  const { user, isAuthenticated, logout } = useAuth();
  const { lang, setLang, t } = useLanguage();
  
  // Theme state: defaults to 'light' (clean Stripe/Razorpay style) or user saved choice
  const [theme, setTheme] = useState(() => localStorage.getItem('safeupi_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('safeupi_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  return (
    <header style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0.9rem 2rem',
      backgroundColor: 'var(--bg-navbar)',
      borderBottom: '1px solid var(--border-color)',
      position: 'sticky',
      top: 0,
      zIndex: 50,
      transition: 'background-color 0.2s ease, border-color 0.2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <button
          onClick={onToggleSidebar}
          style={{
            display: 'none',
            color: 'var(--text-main)',
            padding: '0.4rem',
            borderRadius: '6px',
            border: '1px solid var(--border-color)',
          }}
          className="mobile-menu-btn"
          aria-label="Toggle Navigation"
        >
          <Menu size={20} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #1D4ED8 0%, #2563EB 100%)',
            padding: '0.5rem',
            borderRadius: '10px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 2px 8px rgba(29, 78, 216, 0.25)',
          }}>
            <ShieldCheck size={24} color="#FFF" />
          </div>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ fontSize: '1.25rem', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>
                Safe<span style={{ color: '#2563EB' }}>UPI</span>
              </span>
              <span style={{
                background: 'rgba(37, 99, 235, 0.1)',
                color: '#2563EB',
                fontSize: '0.68rem',
                fontWeight: 800,
                padding: '0.15rem 0.5rem',
                borderRadius: '6px',
                border: '1px solid rgba(37, 99, 235, 0.25)',
              }}>
                {t('fintechSecurity')}
              </span>
            </div>
            <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', margin: 0 }}>
              {t('appSubtitle')}
            </p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
        {/* Theme Toggle (Light / Dark) */}
        <button
          onClick={toggleTheme}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.35rem',
            background: 'var(--bg-surface)',
            border: '1px solid var(--border-color)',
            borderRadius: '8px',
            padding: '0.4rem 0.75rem',
            color: 'var(--text-main)',
            fontSize: '0.82rem',
            fontWeight: 600,
          }}
          title={theme === 'light' ? 'Switch to Dark Mode' : 'Switch to Light Mode'}
        >
          {theme === 'light' ? (
            <>
              <Moon size={15} color="#475569" />
              <span style={{ color: 'var(--text-muted)' }}>{t('themeDark')}</span>
            </>
          ) : (
            <>
              <Sun size={15} color="#F59E0B" />
              <span style={{ color: '#F8FAFC' }}>{t('themeLight')}</span>
            </>
          )}
        </button>

        {/* Language Selector */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
          padding: '0.35rem 0.65rem'
        }}>
          <Globe size={15} color="var(--text-muted)" />
          <select
            value={lang}
            onChange={(e) => setLang(e.target.value)}
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-main)',
              fontSize: '0.85rem',
              fontWeight: 600,
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <option value="en">English</option>
            <option value="hi">हिंदी (Hindi)</option>
            <option value="mr">मराठी (Marathi)</option>
          </select>
        </div>

        {/* Cyber Helpline Badge */}
        <div style={{
          display: 'none',
          alignItems: 'center',
          gap: '0.4rem',
          fontSize: '0.78rem',
          color: '#DC2626',
          background: 'rgba(239, 68, 68, 0.08)',
          border: '1px solid rgba(239, 68, 68, 0.25)',
          padding: '0.35rem 0.75rem',
          borderRadius: '8px',
        }} className="helpline-badge">
          <ShieldAlert size={14} />
          <span>Helpline: <strong>1930</strong></span>
        </div>

        {/* User Auth */}
        {isAuthenticated ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              background: 'var(--bg-surface)',
              border: '1px solid var(--border-color)',
              padding: '0.35rem 0.75rem',
              borderRadius: '9999px',
            }}>
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '50%',
                background: 'var(--primary)',
                color: '#FFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '0.75rem',
                fontWeight: 700,
              }}>
                {user?.fullName?.charAt(0) || 'U'}
              </div>
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-main)' }}>
                {user?.fullName || user?.username}
              </span>
            </div>
            <button
              onClick={logout}
              title={t('logout')}
              style={{
                color: 'var(--text-muted)',
                padding: '0.45rem',
                borderRadius: '8px',
                display: 'flex',
                alignItems: 'center',
                border: '1px solid var(--border-color)',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#EF4444')}
              onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
            >
              <LogOut size={16} />
            </button>
          </div>
        ) : (
          <button
            onClick={onOpenAuth}
            className="btn-primary"
            style={{ padding: '0.5rem 1.1rem', fontSize: '0.85rem' }}
          >
            <LogIn size={16} />
            <span>{t('login')}</span>
          </button>
        )}
      </div>

      <style>{`
        @media (max-width: 768px) {
          .mobile-menu-btn { display: flex !important; }
        }
        @media (min-width: 900px) {
          .helpline-badge { display: flex !important; }
        }
      `}</style>
    </header>
  );
}
