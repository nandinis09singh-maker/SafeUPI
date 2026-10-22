import React, { useState } from 'react';
import { X, LogIn, UserPlus, Lock, Mail, User, ShieldCheck, Sparkles } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function AuthModal({ isOpen, onClose }) {
  const { login, register } = useAuth();
  const { t } = useLanguage();
  const [tab, setTab] = useState('login'); // 'login' or 'register'
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  // Form states
  const [usernameOrEmail, setUsernameOrEmail] = useState('');
  const [password, setPassword] = useState('');

  const [regFullName, setRegFullName] = useState('');
  const [regUsername, setRegUsername] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');

  if (!isOpen) return null;

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await login(usernameOrEmail, password);
      onClose();
    } catch (err) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    if (regPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setLoading(true);
    try {
      await register(regUsername, regEmail, regPassword, regFullName);
      onClose();
    } catch (err) {
      setError(err.message || 'Registration failed.');
    } finally {
      setLoading(false);
    }
  };

  const fillDemoCredentials = () => {
    setUsernameOrEmail('demo');
    setPassword('SafeUPI@123');
    setError(null);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0, 0, 0, 0.75)',
        backdropFilter: 'blur(8px)',
        zIndex: 150,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="safe-card"
        style={{
          maxWidth: '440px',
          width: '100%',
          position: 'relative',
          padding: '2rem',
        }}
      >
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            color: 'var(--text-dim)',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-main)')}
          onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
        >
          <X size={20} />
        </button>

        {/* Modal Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: '48px',
            height: '48px',
            borderRadius: '14px',
            background: 'linear-gradient(135deg, #1D6AE5 0%, #00E5FF 100%)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 0.75rem auto',
            boxShadow: '0 4px 15px rgba(29, 106, 229, 0.4)',
          }}>
            <ShieldCheck size={28} color="#FFF" />
          </div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--text-main)' }}>
            {tab === 'login' ? 'Sign In to SafeUPI' : 'Create Free Account'}
          </h2>
          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
            Access cloud scan history, trusted contacts & fraud protection
          </p>
        </div>

        {/* Tab Switcher */}
        <div style={{
          display: 'flex',
          background: 'var(--bg-surface)',
          borderRadius: 'var(--radius-md)',
          padding: '0.3rem',
          marginBottom: '1.5rem',
          border: '1px solid var(--border-color)',
        }}>
          <button
            onClick={() => { setTab('login'); setError(null); }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: tab === 'login' ? '#FFF' : 'var(--text-muted)',
              background: tab === 'login' ? 'var(--primary)' : 'transparent',
            }}
          >
            Sign In
          </button>
          <button
            onClick={() => { setTab('register'); setError(null); }}
            style={{
              flex: 1,
              padding: '0.55rem',
              borderRadius: 'var(--radius-sm)',
              fontWeight: 700,
              fontSize: '0.85rem',
              color: tab === 'register' ? '#FFF' : 'var(--text-muted)',
              background: tab === 'register' ? 'var(--primary)' : 'transparent',
            }}
          >
            Register
          </button>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.15)',
            border: '1px solid rgba(239, 68, 68, 0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '0.75rem 1rem',
            color: '#FCA5A5',
            fontSize: '0.82rem',
            marginBottom: '1.25rem',
          }}>
            {error}
          </div>
        )}

        {/* Login Form */}
        {tab === 'login' && (
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Username or Email:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="demo or demo@safeupi.com"
                value={usernameOrEmail}
                onChange={(e) => setUsernameOrEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                Password:
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem', marginBottom: '1rem' }}
            >
              <LogIn size={16} />
              <span>{loading ? 'Authenticating...' : 'Sign In'}</span>
            </button>

            {/* Quick Demo Pre-fill */}
            <button
              type="button"
              onClick={fillDemoCredentials}
              className="btn-secondary"
              style={{ width: '100%', padding: '0.65rem', fontSize: '0.82rem' }}
            >
              <Sparkles size={14} color="#00E5FF" />
              <span>Use Pre-loaded Demo Account (demo / SafeUPI@123)</span>
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === 'register' && (
          <form onSubmit={handleRegister}>
            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Full Name:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Vikram Sharma"
                value={regFullName}
                onChange={(e) => setRegFullName(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Username:
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. vikram99"
                value={regUsername}
                onChange={(e) => setRegUsername(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '0.85rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Email Address:
              </label>
              <input
                type="email"
                className="form-input"
                placeholder="e.g. vikram@example.com"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                required
              />
            </div>

            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.3rem' }}>
                Password (min 6 characters):
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="Create secure password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                required
              />
            </div>

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.75rem' }}
            >
              <UserPlus size={16} />
              <span>{loading ? 'Registering...' : 'Create Account'}</span>
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
