import React from 'react';
import {
  TrendingUp,
  Package,
  DollarSign,
  AlertTriangle,
  PieChart,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Edit2
} from 'lucide-react';

export default function AdminAnalyticsView({
  products,
  stats,
  categories,
  onOpenEditProduct
}) {
  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  // Low stock products
  const lowStockItems = products.filter(
    (p) => (p.stock ?? 0) <= 5
  );

  // Category counts and valuations
  const categoryBreakdown = categories.map((cat) => {
    const prods = products.filter(
      (p) => p.category?.toLowerCase() === cat.toLowerCase()
    );
    const count = prods.length;
    const value = prods.reduce(
      (acc, p) => acc + (p.price || 0) * (p.stock || 0),
      0
    );
    return { name: cat, count, value };
  }).sort((a, b) => b.value - a.value);

  const totalInvValue = stats?.totalInventoryValue || products.reduce(
    (acc, p) => acc + (p.price || 0) * (p.stock || 0),
    0
  );

  return (
    <div className="admin-subview">
      {/* Analytics Header */}
      <div className="admin-view-header">
        <div>
          <h2 className="admin-view-title">Inventory &amp; Financial Analytics</h2>
          <p className="admin-view-subtitle">
            Stock valuations, health metrics, and inventory distribution
          </p>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Retail Inventory Value</span>
            <span className="stat-value" style={{ color: '#047857' }}>
              ₱{formatCurrency(totalInvValue)}
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Package size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total SKUs in Catalog</span>
            <span className="stat-value" style={{ color: '#2563eb' }}>
              {products.length} Items
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <Layers size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Product Categories</span>
            <span className="stat-value" style={{ color: '#7c3aed' }}>
              {categories.length} Groups
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div
            className="stat-icon"
            style={{
              background: lowStockItems.length > 0 ? '#fef2f2' : '#f0fdf4',
              color: lowStockItems.length > 0 ? '#dc2626' : '#16a34a'
            }}
          >
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Low Stock Alerts</span>
            <span
              className="stat-value"
              style={{ color: lowStockItems.length > 0 ? '#dc2626' : '#16a34a' }}
            >
              {lowStockItems.length} Items
            </span>
          </div>
        </div>
      </div>

      {/* Distribution & Low Stock Alerts Grid */}
      <div className="analytics-panels-grid">
        {/* Category Breakdown Panel */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <PieChart size={18} color="#2563eb" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                Inventory Valuation by Category
              </h3>
            </div>
          </div>

          <div className="category-bars-list">
            {categoryBreakdown.map((cat) => {
              const pct = totalInvValue > 0 ? Math.round((cat.value / totalInvValue) * 100) : 0;
              return (
                <div key={cat.name} className="cat-bar-item">
                  <div className="cat-bar-header">
                    <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#1e293b' }}>
                      {cat.name} ({cat.count})
                    </span>
                    <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#047857' }}>
                      ₱{formatCurrency(cat.value)} ({pct}%)
                    </span>
                  </div>
                  <div className="progress-track">
                    <div
                      className="progress-fill"
                      style={{
                        width: `${Math.max(pct, 3)}%`,
                        background: 'linear-gradient(90deg, #2563eb 0%, #3b82f6 100%)'
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Low Stock Watchlist Panel */}
        <div className="analytics-card">
          <div className="analytics-card-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} color="#dc2626" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                Restock Watchlist (&le; 5 units)
              </h3>
            </div>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '0.2rem 0.55rem',
                borderRadius: '9999px',
                background: lowStockItems.length > 0 ? '#fef2f2' : '#f0fdf4',
                color: lowStockItems.length > 0 ? '#dc2626' : '#16a34a'
              }}
            >
              {lowStockItems.length} Need Attention
            </span>
          </div>

          {lowStockItems.length === 0 ? (
            <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b' }}>
              <Package size={36} color="#16a34a" style={{ margin: '0 auto 0.5rem' }} />
              <p style={{ fontWeight: 600, color: '#16a34a' }}>All Inventory Well-Stocked</p>
              <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                No items are currently below the safety threshold of 5 units.
              </p>
            </div>
          ) : (
            <div className="table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Category</th>
                    <th>Stock Left</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {lowStockItems.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>{p.name}</td>
                      <td>
                        <span className="category-tag">{p.category}</span>
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: p.stock === 0 ? '#dc2626' : '#d97706',
                            background: p.stock === 0 ? '#fef2f2' : '#fffbeb',
                            padding: '2px 8px',
                            borderRadius: '6px'
                          }}
                        >
                          {p.stock} {p.unit || 'pcs'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          className="btn-secondary"
                          style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                          onClick={() => onOpenEditProduct(p)}
                        >
                          <Edit2 size={12} />
                          <span>Restock</span>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
