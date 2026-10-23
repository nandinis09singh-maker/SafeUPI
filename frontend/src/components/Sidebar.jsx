import React from 'react';
import {
  LayoutDashboard,
  QrCode,
  MessageSquareText,
  Link2,
  History,
  Users,
  AlertTriangle,
  Settings,
  PhoneCall,
  ExternalLink,
  X
} from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function Sidebar({ currentView, setView, isOpen, onClose }) {
  const { t } = useLanguage();

  const navItems = [
    { id: 'dashboard', label: t('navDashboard'), icon: LayoutDashboard },
    { id: 'qr', label: t('navQrScanner'), icon: QrCode, highlight: true },
    { id: 'message', label: t('navMessageChecker'), icon: MessageSquareText },
    { id: 'link', label: t('navLinkChecker'), icon: Link2 },
    { id: 'history', label: t('navHistory'), icon: History },
    { id: 'contacts', label: t('navContacts'), icon: Users },
    { id: 'reports', label: t('navReports'), icon: AlertTriangle },
    { id: 'settings', label: t('navSettings'), icon: Settings },
  ];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            zIndex: 90,
            backdropFilter: 'blur(3px)',
          }}
          className="sidebar-overlay"
        />
      )}

      <aside
        style={{
          width: '260px',
          backgroundColor: 'var(--bg-sidebar)',
          borderRight: '1px solid var(--border-color)',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '1.5rem 1rem',
          flexShrink: 0,
          zIndex: 100,
          transition: 'background-color 0.2s ease',
        }}
        className={`sidebar-nav ${isOpen ? 'open' : ''}`}
      >
        <div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', padding: '0 0.5rem' }}>
            <span style={{ fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.08em', color: 'var(--sidebar-text-dim)', textTransform: 'uppercase' }}>
              Navigation
            </span>
            {isOpen && (
              <button onClick={onClose} style={{ color: 'var(--sidebar-text-dim)' }}>
                <X size={20} />
              </button>
            )}
          </div>

          <nav style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setView(item.id);
                    if (onClose) onClose();
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: 'var(--radius-md)',
                    fontWeight: 600,
                    fontSize: '0.92rem',
                    color: isActive ? '#FFFFFF' : 'var(--sidebar-text-dim)',
                    background: isActive ? 'rgba(37, 99, 235, 0.2)' : 'transparent',
                    borderLeft: isActive ? '3px solid #3B82F6' : '3px solid transparent',
                    textAlign: 'left',
                    transition: 'all 0.15s ease',
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = '#FFFFFF';
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) {
                      e.currentTarget.style.color = 'var(--sidebar-text-dim)';
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <Icon size={19} color={isActive ? '#60A5FA' : 'currentColor'} />
                  <span>{item.label}</span>
                  {item.highlight && (
                    <span style={{
                      marginLeft: 'auto',
                      background: 'rgba(59, 130, 246, 0.25)',
                      color: '#93C5FD',
                      fontSize: '0.65rem',
                      fontWeight: 800,
                      padding: '0.1rem 0.4rem',
                      borderRadius: '4px',
                    }}>
                      LIVE
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Cyber Emergency Box */}
        <div style={{
          background: 'rgba(220, 38, 38, 0.12)',
          border: '1px solid rgba(220, 38, 38, 0.3)',
          borderRadius: 'var(--radius-md)',
          padding: '1rem',
          marginTop: '1.5rem',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#FCA5A5', marginBottom: '0.4rem' }}>
            <PhoneCall size={16} />
            <span style={{ fontSize: '0.8rem', fontWeight: 700 }}>{t('helplineTitle')}</span>
          </div>
          <p style={{ fontSize: '0.74rem', color: '#CBD5E1', marginBottom: '0.75rem', lineHeight: 1.4 }}>
            Victim of financial fraud? Report within 2 hours to freeze stolen funds:
          </p>
          <a
            href="tel:1930"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              background: '#DC2626',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.85rem',
              padding: '0.5rem',
              borderRadius: '6px',
              textDecoration: 'none',
              boxShadow: '0 2px 8px rgba(220, 38, 38, 0.35)',
            }}
          >
            <PhoneCall size={14} />
            {t('helplineSub')}
          </a>
        </div>
      </aside>

      <style>{`
        @media (max-width: 768px) {
          .sidebar-nav {
            position: fixed;
            top: 0;
            left: -280px;
            bottom: 0;
            transition: left 0.3s ease;
          }
          .sidebar-nav.open {
            left: 0;
          }
        }
      `}</style>
    </>
  );
}
