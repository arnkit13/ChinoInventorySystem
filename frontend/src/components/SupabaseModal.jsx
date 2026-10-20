import React, { useState, useEffect } from 'react';
import { Database, CheckCircle2, AlertCircle, X, ExternalLink, Link2, RefreshCw } from 'lucide-react';

export default function SupabaseModal({ isOpen, onClose, config, onSaveConfig }) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [databaseUrl, setDatabaseUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null);

  useEffect(() => {
    if (config) {
      setSupabaseUrl(config.supabaseUrl || '');
      setSupabaseKey(config.supabaseKey || '');
      setDatabaseUrl(config.databaseUrl || '');
      if (config.message) {
        setStatusFeedback({
          success: config.isConnected,
          message: config.message
        });
      }
    }
  }, [config, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatusFeedback(null);

    try {
      const updated = await onSaveConfig({
        supabaseUrl,
        supabaseKey,
        databaseUrl
      });
      setStatusFeedback({
        success: updated.isConnected,
        message: updated.message || (updated.isConnected ? 'Supabase connected successfully!' : 'Config saved.')
      });
    } catch (err) {
      setStatusFeedback({
        success: false,
        message: err.message || 'Failed to save Supabase config'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{
              width: '38px',
              height: '38px',
              borderRadius: '8px',
              background: config?.isConnected ? 'rgba(16, 185, 129, 0.2)' : 'rgba(245, 158, 11, 0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: config?.isConnected ? '#10b981' : '#f59e0b'
            }}>
              <Database size={20} />
            </div>
            <div>
              <h3 style={{ fontSize: '1.25rem', color: '#fff' }}>Supabase Database Integration</h3>
              <p style={{ fontSize: '0.75rem', color: '#9ca3af' }}>Cloud database &amp; sync for your inventory</p>
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', color: '#9ca3af' }}>
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {/* Status Banner */}
            <div style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.75rem',
              padding: '0.85rem 1rem',
              borderRadius: '10px',
              background: config?.isConnected ? 'rgba(16, 185, 129, 0.12)' : 'rgba(245, 158, 11, 0.12)',
              border: `1px solid ${config?.isConnected ? '#10b981' : 'rgba(245, 158, 11, 0.3)'}`,
              marginBottom: '1.25rem'
            }}>
              {config?.isConnected ? (
                <CheckCircle2 size={20} color="#10b981" style={{ flexShrink: 0, marginTop: '2px' }} />
              ) : (
                <AlertCircle size={20} color="#f59e0b" style={{ flexShrink: 0, marginTop: '2px' }} />
              )}
              <div>
                <div style={{ fontSize: '0.88rem', fontWeight: 700, color: config?.isConnected ? '#10b981' : '#f59e0b' }}>
                  {config?.isConnected ? 'Supabase Status: Connected' : 'Ready for Supabase Credentials'}
                </div>
                <div style={{ fontSize: '0.78rem', color: '#cbd5e1', marginTop: '2px' }}>
                  {config?.isConnected 
                    ? 'Your Spring Boot backend is successfully verified with Supabase.'
                    : 'System is currently running on the high-speed local database. Whenever you have your Supabase URL & API key, paste them below to connect!'}
                </div>
              </div>
            </div>

            {statusFeedback && (
              <div style={{
                background: statusFeedback.success ? 'rgba(16, 185, 129, 0.15)' : 'rgba(244, 63, 94, 0.15)',
                border: `1px solid ${statusFeedback.success ? '#10b981' : '#f43f5e'}`,
                color: statusFeedback.success ? '#34d399' : '#fb7185',
                padding: '0.65rem 0.85rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
                marginBottom: '1.25rem'
              }}>
                {statusFeedback.message}
              </div>
            )}

            <div className="form-group">
              <label className="form-label">
                Supabase Project URL
              </label>
              <input
                type="url"
                className="form-input"
                placeholder="https://xyzcompany.supabase.co"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
              />
              <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginTop: '3px' }}>
                Found in Supabase Dashboard → Project Settings → API → Project URL
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">
                Supabase API Key (Anon / Service Role)
              </label>
              <input
                type="password"
                className="form-input"
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                value={supabaseKey}
                onChange={(e) => setSupabaseKey(e.target.value)}
              />
              <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginTop: '3px' }}>
                Found in Supabase Dashboard → Project Settings → API → Project API Keys
              </span>
            </div>

            <div className="form-group" style={{ marginBottom: '0.5rem' }}>
              <label className="form-label">
                PostgreSQL Direct Connection String (Optional)
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="postgresql://postgres:[password]@db.[ref].supabase.co:5432/postgres"
                value={databaseUrl}
                onChange={(e) => setDatabaseUrl(e.target.value)}
              />
              <span style={{ fontSize: '0.72rem', color: '#6b7280', display: 'block', marginTop: '3px' }}>
                Found in Supabase Dashboard → Project Settings → Database → Connection string (URI)
              </span>
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn-secondary"
              onClick={onClose}
              disabled={loading}
            >
              Close
            </button>
            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ minWidth: '150px', justifyContent: 'center' }}
            >
              {loading ? (
                <>
                  <RefreshCw size={14} className="spin" />
                  <span>Testing Connection...</span>
                </>
              ) : (
                <>
                  <Link2 size={16} />
                  <span>Save &amp; Test Connection</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
