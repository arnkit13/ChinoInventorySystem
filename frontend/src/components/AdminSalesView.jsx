import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Calendar,
  TrendingUp,
  Receipt,
  Search,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Clock,
  CreditCard,
  ShoppingBag,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { api } from '../services/api';

export default function AdminSalesView({ stats, onRefreshStats }) {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeFilter, setTimeFilter] = useState('ALL'); // 'ALL', 'TODAY', 'WEEK'
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedSaleId, setExpandedSaleId] = useState(null);

  const fetchSales = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api.getRecentSales();
      setSales(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load recent sales:', err);
      setError('Unable to load recent sales from server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, []);

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const formatDate = (isoString) => {
    if (!isoString) return 'N/A';
    try {
      const d = new Date(isoString);
      return d.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    } catch {
      return isoString;
    }
  };

  const isToday = (isoString) => {
    if (!isoString) return false;
    const d = new Date(isoString);
    const today = new Date();
    return (
      d.getDate() === today.getDate() &&
      d.getMonth() === today.getMonth() &&
      d.getFullYear() === today.getFullYear()
    );
  };

  const isThisWeek = (isoString) => {
    if (!isoString) return false;
    const d = new Date(isoString);
    const now = new Date();
    const diffTime = Math.abs(now - d);
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };

  const filteredSales = sales.filter((sale) => {
    // Time filter
    if (timeFilter === 'TODAY' && !isToday(sale.createdAt)) return false;
    if (timeFilter === 'WEEK' && !isThisWeek(sale.createdAt)) return false;

    // Search term
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    const idMatch = `rcpt-${sale.id}`.includes(term) || `${sale.id}`.includes(term);
    const itemMatch = sale.items?.some((i) =>
      i.productName?.toLowerCase().includes(term)
    );
    return idMatch || itemMatch;
  });

  const toggleExpand = (id) => {
    setExpandedSaleId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="admin-subview">
      {/* Sales Overview Banner */}
      <div className="admin-view-header">
        <div>
          <h2 className="admin-view-title">Sales &amp; Transactions</h2>
          <p className="admin-view-subtitle">
            Live sales revenue, transaction records, and order breakdown
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => {
            fetchSales();
            onRefreshStats?.();
          }}
          title="Reload sales data"
        >
          <RefreshCw size={15} />
          <span>Refresh Sales</span>
        </button>
      </div>

      {/* KPI Sales Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Today's Sales</span>
            <span className="stat-value" style={{ color: '#047857' }}>
              ₱{formatCurrency(stats?.todaySales)}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Calendar size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">This Week</span>
            <span className="stat-value" style={{ color: '#2563eb' }}>
              ₱{formatCurrency(stats?.weekSales)}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">This Month</span>
            <span className="stat-value" style={{ color: '#7c3aed' }}>
              ₱{formatCurrency(stats?.monthSales)}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fffbeb', color: '#b45309' }}>
            <Receipt size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Transactions</span>
            <span className="stat-value" style={{ color: '#b45309' }}>
              {sales.length}
            </span>
          </div>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div className="admin-actions">
        <div className="admin-left-controls">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="search-mini"
              placeholder="Search receipt # or product item..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  color: '#94a3b8'
                }}
              >
                ✕
              </button>
            )}
          </div>

          <div className="sales-time-filters">
            <button
              className={`filter-pill-btn ${timeFilter === 'ALL' ? 'active' : ''}`}
              onClick={() => setTimeFilter('ALL')}
            >
              All Records ({sales.length})
            </button>
            <button
              className={`filter-pill-btn ${timeFilter === 'TODAY' ? 'active' : ''}`}
              onClick={() => setTimeFilter('TODAY')}
            >
              Today
            </button>
            <button
              className={`filter-pill-btn ${timeFilter === 'WEEK' ? 'active' : ''}`}
              onClick={() => setTimeFilter('WEEK')}
            >
              This Week
            </button>
          </div>
        </div>

        <div style={{ fontSize: '0.825rem', color: '#64748b' }}>
          Showing <strong>{filteredSales.length}</strong> transaction{filteredSales.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Transactions List */}
      {loading ? (
        <div className="sales-loading-box">
          <RefreshCw size={24} className="spin-icon" color="#2563eb" />
          <span>Loading sales transactions...</span>
        </div>
      ) : error ? (
        <div className="sales-error-box">
          <AlertCircle size={20} color="#dc2626" />
          <span>{error}</span>
        </div>
      ) : filteredSales.length === 0 ? (
        <div className="empty-state-box">
          <ShoppingBag size={48} color="#94a3b8" />
          <h4 style={{ marginTop: '0.75rem', fontWeight: 700 }}>No sales found</h4>
          <p style={{ color: '#64748b', fontSize: '0.875rem' }}>
            {searchTerm
              ? `No transactions matched "${searchTerm}"`
              : 'Sales recorded from Tindera View will appear here.'}
          </p>
        </div>
      ) : (
        <div className="sales-table-card">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '60px' }}>Receipt</th>
                <th>Date &amp; Time</th>
                <th>Items Purchased</th>
                <th>Payment / Change</th>
                <th>Total Amount</th>
                <th style={{ textAlign: 'center', width: '90px' }}>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => {
                const isExpanded = expandedSaleId === sale.id;
                const totalItemsCount = sale.items?.reduce((acc, i) => acc + (i.quantity || 1), 0) || 0;
                return (
                  <React.Fragment key={sale.id}>
                    <tr
                      className={`sale-row ${isExpanded ? 'row-expanded' : ''}`}
                      onClick={() => toggleExpand(sale.id)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <span className="receipt-tag">#{sale.id}</span>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#334155' }}>
                          <Clock size={13} color="#64748b" />
                          <span style={{ fontSize: '0.85rem', fontWeight: 600 }}>{formatDate(sale.createdAt)}</span>
                        </div>
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                          <ShoppingBag size={14} color="#2563eb" />
                          <span style={{ fontWeight: 600, color: '#0f172a' }}>
                            {sale.items && sale.items.length > 0
                              ? `${totalItemsCount} item${totalItemsCount === 1 ? '' : 's'} (${sale.items.length} sku)`
                              : 'Walk-in Sale'}
                          </span>
                        </div>
                        {sale.items && sale.items.length > 0 && (
                          <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                            {sale.items.map((i) => i.productName).slice(0, 2).join(', ')}
                            {sale.items.length > 2 ? ` +${sale.items.length - 2} more` : ''}
                          </div>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: '0.8rem', color: '#475569' }}>
                          <span>Recv: ₱{formatCurrency(sale.paymentReceived || sale.totalAmount)}</span>
                          {sale.changeGiven > 0 && (
                            <span style={{ color: '#047857', marginLeft: '6px' }}>
                              (Chg: ₱{formatCurrency(sale.changeGiven)})
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="sale-total-badge">₱{formatCurrency(sale.totalAmount)}</span>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          className="action-icon-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(sale.id);
                          }}
                          title={isExpanded ? 'Hide items' : 'View receipt items'}
                        >
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </button>
                      </td>
                    </tr>

                    {/* Expanded Items Drawer */}
                    {isExpanded && (
                      <tr className="sale-drawer-row">
                        <td colSpan={6} style={{ padding: '0', background: '#f8fafc' }}>
                          <div className="sale-drawer-content">
                            <div className="drawer-header">
                              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#1e293b' }}>
                                Receipt #{sale.id} Breakdown
                              </span>
                              <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                                Recorded on {formatDate(sale.createdAt)}
                              </span>
                            </div>

                            {sale.items && sale.items.length > 0 ? (
                              <div className="drawer-items-table">
                                <div className="drawer-items-header">
                                  <span>Product Item</span>
                                  <span style={{ textAlign: 'center' }}>Qty</span>
                                  <span style={{ textAlign: 'right' }}>Unit Price</span>
                                  <span style={{ textAlign: 'right' }}>Subtotal</span>
                                </div>
                                {sale.items.map((item, idx) => (
                                  <div key={item.id || idx} className="drawer-item-row">
                                    <span style={{ fontWeight: 600, color: '#0f172a' }}>
                                      {item.productName || 'Unspecified Item'}
                                    </span>
                                    <span style={{ textAlign: 'center', color: '#475569' }}>
                                      ×{item.quantity || 1}
                                    </span>
                                    <span style={{ textAlign: 'right', color: '#64748b' }}>
                                      ₱{formatCurrency(item.price)}
                                    </span>
                                    <span style={{ textAlign: 'right', fontWeight: 700, color: '#047857' }}>
                                      ₱{formatCurrency(item.subtotal || (item.price * (item.quantity || 1)))}
                                    </span>
                                  </div>
                                ))}

                                <div className="drawer-item-summary">
                                  <div className="summary-line">
                                    <span>Payment Tendered:</span>
                                    <span>₱{formatCurrency(sale.paymentReceived || sale.totalAmount)}</span>
                                  </div>
                                  <div className="summary-line">
                                    <span>Change Given:</span>
                                    <span style={{ color: '#047857' }}>₱{formatCurrency(sale.changeGiven)}</span>
                                  </div>
                                  <div className="summary-line total-line">
                                    <span>Grand Total:</span>
                                    <span style={{ color: '#047857' }}>₱{formatCurrency(sale.totalAmount)}</span>
                                  </div>
                                </div>
                              </div>
                            ) : (
                              <div style={{ padding: '1rem', color: '#64748b', fontSize: '0.85rem' }}>
                                Standard walk-in transaction total: ₱{formatCurrency(sale.totalAmount)}
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
