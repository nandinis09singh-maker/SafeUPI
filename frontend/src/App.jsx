import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import DashboardView from './views/DashboardView';
import QrScannerView from './views/QrScannerView';
import MessageCheckerView from './views/MessageCheckerView';
import LinkCheckerView from './views/LinkCheckerView';
import HistoryView from './views/HistoryView';
import TrustedContactsView from './views/TrustedContactsView';
import ScamReportsView from './views/ScamReportsView';
import SettingsView from './views/SettingsView';
import AuthModal from './views/AuthModal';
import { ShieldAlert, Info } from 'lucide-react';

function AppContent() {
  const { t } = useLanguage();
  const [currentView, setView] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [reportPrefillData, setReportPrefillData] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);

  const handleReportScamFromCard = (analysisResult) => {
    setReportPrefillData(analysisResult);
    setView('reports');
  };

  const handleSelectHistoryItem = (item) => {
    setSelectedHistoryItem(item);
    setView('history');
  };

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <Sidebar
        currentView={currentView}
        setView={setView}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />

      <div className="main-content">
        {/* Top Navbar */}
        <Navbar
          onOpenAuth={() => setIsAuthOpen(true)}
          onToggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)}
        />

        <main className="content-viewport">
          {/* Golden Rule Awareness Banner */}
          <div className="golden-rule-banner">
            <div className="golden-rule-text">
              <ShieldAlert size={20} color="#F87171" style={{ flexShrink: 0 }} />
              <span>{t('ruleBanner')}</span>
            </div>
            <div style={{ fontSize: '0.75rem', color: '#E9D5FF', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
              <Info size={14} />
              <span>{t('ruleSubtext')}</span>
            </div>
          </div>

          {/* Active View */}
          {currentView === 'dashboard' && (
            <DashboardView
              setView={setView}
              onSelectHistoryItem={handleSelectHistoryItem}
            />
          )}

          {currentView === 'qr' && (
            <QrScannerView
              onReportScam={handleReportScamFromCard}
            />
          )}

          {currentView === 'message' && (
            <MessageCheckerView
              onReportScam={handleReportScamFromCard}
            />
          )}

          {currentView === 'link' && (
            <LinkCheckerView
              onReportScam={handleReportScamFromCard}
            />
          )}

          {currentView === 'history' && (
            <HistoryView
              onReportScam={handleReportScamFromCard}
              selectedItemFromParent={selectedHistoryItem}
            />
          )}

          {currentView === 'contacts' && (
            <TrustedContactsView
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}

          {currentView === 'reports' && (
            <ScamReportsView
              initialReportData={reportPrefillData}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              onOpenAuth={() => setIsAuthOpen(true)}
            />
          )}
        </main>

        {/* Global Footer with Safety Disclaimer */}
        <footer style={{
          padding: '1.5rem 2rem',
          borderTop: '1px solid var(--border-color)',
          backgroundColor: 'var(--navy-950)',
          color: 'var(--text-dim)',
          fontSize: '0.78rem',
          textAlign: 'center',
          lineHeight: 1.6,
        }}>
          <p style={{ maxWidth: '850px', margin: '0 auto 0.5rem auto' }}>
            {t('disclaimer')}
          </p>
          <p>
            © {new Date().getFullYear()} SafeUPI Project — AI-Powered UPI Scam & Fraud Defense. Built with Spring Boot, MySQL, and React.
          </p>
        </footer>
      </div>

      {/* Authentication Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}
