import React, { useState, useEffect } from 'react';
import {
  Users,
  UserPlus,
  Trash2,
  Share2,
  Phone,
  Mail,
  ShieldAlert,
  Check,
  RefreshCw,
  Heart
} from 'lucide-react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';

export default function TrustedContactsView({ onOpenAuth }) {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [formData, setFormData] = useState({
    contactName: '',
    phoneNumber: '',
    relation: 'Family',
    email: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [sharedId, setSharedId] = useState(null);

  useEffect(() => {
    fetchContacts();
  }, [isAuthenticated]);

  const fetchContacts = async () => {
    setLoading(true);
    try {
      const data = await api.getContacts();
      if (Array.isArray(data)) setContacts(data);
    } catch (err) {
      console.warn('Error fetching contacts:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddContact = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      onOpenAuth();
      return;
    }
    setSubmitting(true);
    try {
      const newContact = await api.addContact(formData);
      setContacts([newContact, ...contacts]);
      setShowAddModal(false);
      setFormData({ contactName: '', phoneNumber: '', relation: 'Family', email: '' });
    } catch (err) {
      alert('Failed to add contact: ' + err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this trusted contact?')) return;
    try {
      await api.deleteContact(id);
      setContacts(contacts.filter((c) => c.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const handleEmergencyAlert = (contact) => {
    const alertMessage = `🚨 *URGENT SECURITY ALERT from SafeUPI*\n\nHi ${contact.contactName},\nI just encountered a dangerous UPI scam attempt. Please be on guard:\n- Never enter your UPI PIN to claim any refund, prize, or cashback.\n- Never install AnyDesk or screen-sharing tools.\n- Never approve unknown payment collect requests.\n\nStay safe!`;

    if (navigator.share) {
      navigator.share({
        title: 'SafeUPI Emergency Fraud Warning',
        text: alertMessage,
      }).catch(() => {});
    } else {
      const cleanPhone = contact.phoneNumber.replace(/[^0-9]/g, '');
      const whatsappUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(alertMessage)}`;
      window.open(whatsappUrl, '_blank');
      setSharedId(contact.id);
      setTimeout(() => setSharedId(null), 3000);
    }
  };

  return (
    <div style={{ maxWidth: '950px', margin: '0 auto' }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontSize: '1.85rem', fontWeight: 800, color: 'var(--text-main)' }}>
            Trusted Family & Emergency Contacts
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Protect your parents, elders, and loved ones by instantly broadcasting verified scam warnings to their phones.
          </p>
        </div>

        <button
          onClick={() => {
            if (!isAuthenticated) onOpenAuth();
            else setShowAddModal(true);
          }}
          className="btn-primary"
        >
          <UserPlus size={18} />
          <span>Add Trusted Contact</span>
        </button>
      </div>

      {!isAuthenticated && (
        <div style={{
          background: 'rgba(37, 99, 235, 0.08)',
          border: '1px solid rgba(37, 99, 235, 0.25)',
          borderRadius: 'var(--radius-md)',
          padding: '1.25rem',
          marginBottom: '1.5rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '1rem',
        }}>
          <div>
            <h4 style={{ color: 'var(--primary-bright)', fontWeight: 700, fontSize: '1rem', marginBottom: '0.2rem' }}>
              Sign In to Sync Trusted Contacts across Devices
            </h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              Create an account or sign in with MySQL backend to store persistent family emergency contacts.
            </p>
          </div>
          <button onClick={onOpenAuth} className="btn-primary" style={{ fontSize: '0.85rem', padding: '0.5rem 1rem' }}>
            Sign In Now
          </button>
        </div>
      )}

      {/* Contacts List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <RefreshCw size={36} color="var(--primary-bright)" className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
          <p>Retrieving trusted contacts...</p>
        </div>
      ) : contacts.length === 0 ? (
        <div className="safe-card" style={{ textAlign: 'center', padding: '3rem 1rem', color: 'var(--text-muted)' }}>
          <Users size={44} style={{ margin: '0 auto 1rem auto', opacity: 0.5 }} />
          <h3 style={{ color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: 700, marginBottom: '0.4rem' }}>
            No Trusted Contacts Configured
          </h3>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-dim)', maxWidth: '420px', margin: '0 auto 1.5rem auto' }}>
            Add your parents, spouse, or close relatives so you can alert them with 1-click whenever a high risk scam is detected.
          </p>
          <button
            onClick={() => {
              if (!isAuthenticated) onOpenAuth();
              else setShowAddModal(true);
            }}
            className="btn-primary"
            style={{ fontSize: '0.85rem' }}
          >
            <UserPlus size={16} />
            <span>Add First Contact</span>
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
          {contacts.map((contact) => (
            <div key={contact.id} className="safe-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <div style={{
                    width: '38px',
                    height: '38px',
                    borderRadius: '10px',
                    background: 'rgba(37, 99, 235, 0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--primary-bright)',
                    fontWeight: 800,
                  }}>
                    {contact.contactName.charAt(0)}
                  </div>
                  <span style={{
                    fontSize: '0.72rem',
                    fontWeight: 700,
                    color: 'var(--primary-bright)',
                    background: 'rgba(37, 99, 235, 0.08)',
                    padding: '0.2rem 0.6rem',
                    borderRadius: '9999px',
                    border: '1px solid rgba(37, 99, 235, 0.2)',
                  }}>
                    {contact.relation || 'Contact'}
                  </span>
                </div>

                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
                  {contact.contactName}
                </h3>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.3rem' }}>
                  <Phone size={14} color="var(--primary-bright)" />
                  <span>{contact.phoneNumber}</span>
                </div>

                {contact.email && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-dim)', fontSize: '0.82rem' }}>
                    <Mail size={14} />
                    <span>{contact.email}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginTop: '1.5rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
                <button
                  onClick={() => handleEmergencyAlert(contact)}
                  className="btn-danger"
                  style={{ flex: 1, padding: '0.45rem 0.75rem', fontSize: '0.8rem' }}
                  title="Send emergency fraud warning"
                >
                  {sharedId === contact.id ? <Check size={14} /> : <Share2 size={14} />}
                  <span>{sharedId === contact.id ? 'Sent Alert!' : 'Broadcast Alert'}</span>
                </button>

                <button
                  onClick={() => handleDelete(contact.id)}
                  style={{
                    color: 'var(--text-dim)',
                    padding: '0.45rem',
                    borderRadius: '6px',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--risk-high)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-dim)')}
                  title="Delete Contact"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Contact Modal */}
      {showAddModal && (
        <div
          onClick={() => setShowAddModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.6)',
            backdropFilter: 'blur(4px)',
            zIndex: 120,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1.5rem',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="safe-card"
            style={{ maxWidth: '460px', width: '100%' }}
          >
            <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-main)', marginBottom: '0.4rem' }}>
              Add Trusted Contact
            </h3>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
              Save a contact to broadcast fraud warnings with one click.
            </p>

            <form onSubmit={handleAddContact}>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Full Name:
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Ramesh Singh (Father)"
                  value={formData.contactName}
                  onChange={(e) => setFormData({ ...formData, contactName: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Mobile / WhatsApp Phone Number:
                </label>
                <input
                  type="tel"
                  className="form-input"
                  placeholder="e.g. +91 9876543210"
                  value={formData.phoneNumber}
                  onChange={(e) => setFormData({ ...formData, phoneNumber: e.target.value })}
                  required
                />
              </div>

              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Relationship:
                </label>
                <select
                  className="form-select"
                  value={formData.relation}
                  onChange={(e) => setFormData({ ...formData, relation: e.target.value })}
                >
                  <option value="Parent">Parent (Mother / Father)</option>
                  <option value="Spouse">Spouse / Partner</option>
                  <option value="Sibling">Sibling (Brother / Sister)</option>
                  <option value="Child">Child (Son / Daughter)</option>
                  <option value="Friend">Friend / Colleague</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '0.35rem' }}>
                  Email Address (Optional):
                </label>
                <input
                  type="email"
                  className="form-input"
                  placeholder="e.g. contact@example.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.75rem' }}>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                  style={{ padding: '0.65rem 1.25rem' }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={submitting}
                  style={{ padding: '0.65rem 1.5rem' }}
                >
                  {submitting ? 'Saving...' : 'Save Contact'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
