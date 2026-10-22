import React, { createContext, useContext, useState, useEffect } from 'react';

const translations = {
  en: {
    appTitle: 'SafeUPI',
    appSubtitle: 'AI-Powered UPI Scam Detector',
    navDashboard: 'Dashboard',
    navQrScanner: 'Scan QR',
    navMessageChecker: 'Check Message',
    navLinkChecker: 'Check Link',
    navHistory: 'Scan History',
    navContacts: 'Trusted Contacts',
    navReports: 'Scam Reports',
    navSettings: 'Settings',
    ruleBanner: 'SafeUPI Golden Rule: You NEVER need to enter your UPI PIN to receive money!',
    scanQrBtn: 'Scan QR Code',
    checkMsgBtn: 'Check Message',
    checkLinkBtn: 'Check Link',
    riskLow: 'SAFE / LOW RISK',
    riskMedium: 'CAUTION / MEDIUM RISK',
    riskHigh: 'CRITICAL / HIGH RISK SCAM',
    readAloud: 'Read Voice Warning',
    stopAudio: 'Stop Audio',
    shareWarning: 'Share Warning with Contact',
    reportScam: 'Report as Scam',
    login: 'Sign In',
    register: 'Sign Up',
    logout: 'Log Out',
    welcome: 'Welcome',
    disclaimer: 'SafeUPI is an independent educational fraud prevention tool. SafeUPI will NEVER ask for your UPI PIN, OTPs, or passwords, and never initiates payment transactions.',
  },
  hi: {
    appTitle: 'SafeUPI',
    appSubtitle: 'एआई-संचालित यूपीआई फ्रॉड डिटेक्टर',
    navDashboard: 'डैशबोर्ड',
    navQrScanner: 'क्यूआर स्कैन',
    navMessageChecker: 'मैसेज जांचें',
    navLinkChecker: 'लिंक जांचें',
    navHistory: 'स्कैन इतिहास',
    navContacts: 'विश्वसनीय संपर्क',
    navReports: 'फ्रॉड रिपोर्ट',
    navSettings: 'सेटिंग्स',
    ruleBanner: 'SafeUPI का स्वर्णिम नियम: पैसे पाने के लिए कभी भी यूपीआई पिन दर्ज न करें!',
    scanQrBtn: 'क्यूआर कोड स्कैन करें',
    checkMsgBtn: 'संदेश जांचें',
    checkLinkBtn: 'लिंक जांचें',
    riskLow: 'सुरक्षित / कम जोखिम',
    riskMedium: 'सावधान / मध्यम जोखिम',
    riskHigh: 'सावधान / उच्च जोखिम फ्रॉड',
    readAloud: 'चेतावनी सुनें (आवाज़)',
    stopAudio: 'आवाज़ रोकें',
    shareWarning: 'संपर्क को चेतावनी भेजें',
    reportScam: 'फ्रॉड की शिकायत करें',
    login: 'लॉग इन करें',
    register: 'साइन अप करें',
    logout: 'लॉग आउट',
    welcome: 'नमस्ते',
    disclaimer: 'SafeUPI एक शैक्षणिक फ्रॉड सुरक्षा टूल है। SafeUPI कभी भी आपका यूपीआई पिन, ओटीपी या पासवर्ड नहीं मांगता।',
  },
  mr: {
    appTitle: 'SafeUPI',
    appSubtitle: 'एआय-आधारित यूपीआय घोटाळा प्रतिबंधक',
    navDashboard: 'डॅशबोर्ड',
    navQrScanner: 'क्युआर स्कॅन',
    navMessageChecker: 'संदेश तपासा',
    navLinkChecker: 'लिंक तपासा',
    navHistory: 'इतिहास',
    navContacts: 'विश्वासू संपर्क',
    navReports: 'तक्रार नोंदवा',
    navSettings: 'सेटिंग्ज',
    ruleBanner: 'SafeUPI चा सुवर्ण नियम: पैसे मिळवण्यासाठी कधीही यूपीआय पिन टाकू नका!',
    scanQrBtn: 'क्युआर कोड स्कॅन करा',
    checkMsgBtn: 'संदेश तपासा',
    checkLinkBtn: 'लिंक तपासा',
    riskLow: 'सुरक्षित / कमी धोका',
    riskMedium: 'काळजी घ्या / मध्यम धोका',
    riskHigh: 'धोका / मोठी फसवणूक',
    readAloud: 'चेतावणी ऐका (आवाज)',
    stopAudio: 'आवाज थांबवा',
    shareWarning: 'संपर्काला चेतावणी पाठवा',
    reportScam: 'तक्रार करा',
    login: 'लॉग इन',
    register: 'साइन अप',
    logout: 'लॉग आउट',
    welcome: 'स्वागत आहे',
    disclaimer: 'SafeUPI हे शैक्षणिक फसवणूक प्रतिबंधक साधन आहे. SafeUPI कधीही आपला पिन किंवा ओटीपी मागत नाही.',
  },
};

const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => localStorage.getItem('safeupi_lang') || 'en');

  useEffect(() => {
    localStorage.setItem('safeupi_lang', lang);
  }, [lang]);

  const t = (key) => {
    return translations[lang]?.[key] || translations.en[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ lang, setLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  return useContext(LanguageContext);
}
