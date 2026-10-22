import React, { useState, useEffect } from 'react';
import { Volume2, VolumeX, Globe } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

export default function VoiceReader({ voiceWarnings, defaultLang = 'en' }) {
  const { lang: currentGlobalLang, t } = useLanguage();
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [selectedVoiceLang, setSelectedVoiceLang] = useState(defaultLang || currentGlobalLang || 'en');
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    if (!('speechSynthesis' in window)) {
      setSupported(false);
    }
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const speak = () => {
    if (!('speechSynthesis' in window)) return;

    window.speechSynthesis.cancel();

    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }

    const textToSpeak =
      selectedVoiceLang === 'hi'
        ? voiceWarnings?.hindi
        : selectedVoiceLang === 'mr'
        ? voiceWarnings?.marathi
        : voiceWarnings?.english || voiceWarnings?.hindi;

    if (!textToSpeak) return;

    const utterance = new SpeechSynthesisUtterance(textToSpeak);

    // Try finding localized voice
    const voices = window.speechSynthesis.getVoices();
    const langCode = selectedVoiceLang === 'hi' ? 'hi-IN' : selectedVoiceLang === 'mr' ? 'mr-IN' : 'en-IN';
    const matchedVoice = voices.find((v) => v.lang.toLowerCase().includes(langCode.toLowerCase())) ||
      voices.find((v) => v.lang.toLowerCase().startsWith(selectedVoiceLang));

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }
    utterance.lang = langCode;
    utterance.rate = 0.95; // Slightly slower for clarity
    utterance.pitch = 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  if (!supported || !voiceWarnings) return null;

  return (
    <div style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '0.75rem',
      background: 'rgba(255, 255, 255, 0.06)',
      border: '1px solid rgba(255, 255, 255, 0.12)',
      borderRadius: 'var(--radius-md)',
      padding: '0.45rem 0.85rem',
    }}>
      <button
        onClick={speak}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          color: isSpeaking ? '#00E5FF' : '#FFF',
          fontWeight: 600,
          fontSize: '0.85rem',
        }}
        title="Listen to warning"
      >
        {isSpeaking ? (
          <>
            <div className="sound-waves">
              <div className="sound-bar" />
              <div className="sound-bar" />
              <div className="sound-bar" />
              <div className="sound-bar" />
            </div>
            <span>{t('stopAudio')}</span>
          </>
        ) : (
          <>
            <Volume2 size={18} color="#00E5FF" />
            <span>{t('readAloud')}</span>
          </>
        )}
      </button>

      <div style={{ width: '1px', height: '18px', background: 'rgba(255, 255, 255, 0.15)' }} />

      {/* Voice Language Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
        <button
          onClick={() => { setSelectedVoiceLang('en'); if (isSpeaking) window.speechSynthesis.cancel(); }}
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.2rem 0.45rem',
            borderRadius: '4px',
            color: selectedVoiceLang === 'en' ? '#FFF' : 'var(--text-dim)',
            background: selectedVoiceLang === 'en' ? 'var(--primary)' : 'transparent',
          }}
        >
          EN
        </button>
        <button
          onClick={() => { setSelectedVoiceLang('hi'); if (isSpeaking) window.speechSynthesis.cancel(); }}
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.2rem 0.45rem',
            borderRadius: '4px',
            color: selectedVoiceLang === 'hi' ? '#FFF' : 'var(--text-dim)',
            background: selectedVoiceLang === 'hi' ? 'var(--primary)' : 'transparent',
          }}
        >
          हिन्दी
        </button>
        <button
          onClick={() => { setSelectedVoiceLang('mr'); if (isSpeaking) window.speechSynthesis.cancel(); }}
          style={{
            fontSize: '0.72rem',
            fontWeight: 700,
            padding: '0.2rem 0.45rem',
            borderRadius: '4px',
            color: selectedVoiceLang === 'mr' ? '#FFF' : 'var(--text-dim)',
            background: selectedVoiceLang === 'mr' ? 'var(--primary)' : 'transparent',
          }}
        >
          मराठी
        </button>
      </div>
    </div>
  );
}
