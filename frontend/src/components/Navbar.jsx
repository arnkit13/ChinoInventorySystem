import React from 'react';
import { Package, ShieldCheck, LogOut, UserCheck, Search } from 'lucide-react';

export default function Navbar({
  activeRole,
  onSelectRole,
  adminUser,
  onLogout
}) {
  return (
    <header className="app-header">
      <div className="brand-section">
        <div className="brand-icon-box">
          <Package size={22} />
        </div>
        <div>
          <h1 className="brand-title">CHINO INVENTORY</h1>
          <div className="brand-subtitle">
            Inventory Management &amp; Price Checker
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
        {/* Role Toggle */}
        <div className="role-tabs">
          <button
            className={`role-tab-btn ${activeRole === 'tindera' ? 'active' : ''}`}
            onClick={() => onSelectRole('tindera')}
          >
            <Search size={15} />
            <span>Tindera View</span>
          </button>
          <button
            className={`role-tab-btn ${activeRole === 'admin' ? 'active' : ''}`}
            onClick={() => onSelectRole('admin')}
          >
            <ShieldCheck size={15} />
            <span>Admin View</span>
          </button>
        </div>

        {/* Admin Session Info */}
        {adminUser && activeRole === 'admin' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#334155', fontWeight: 600 }}>
              <UserCheck size={16} color="#2563eb" />
              <span>{adminUser.fullName || adminUser.username}</span>
            </div>
            <button
              onClick={onLogout}
              className="btn-secondary"
              style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
              title="Logout as Admin"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
