import React, { useState, useRef } from 'react';
import {
  Package,
  DollarSign,
  AlertTriangle,
  Layers,
  ArrowUpRight,
  ShieldAlert,
  Edit2,
  Search,
  X
} from 'lucide-react';

export default function AdminAnalyticsView({
  products,
  stats,
  categories,
  onOpenEditProduct,
  onUpdateProduct
}) {
  const [restockProduct, setRestockProduct] = useState(null);
  const [restockStock, setRestockStock] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [includeAllProducts, setIncludeAllProducts] = useState(false);
  const searchInputRef = useRef(null);

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const handleOpenRestock = (p) => {
    setRestockProduct(p);
    setRestockStock(p.stock !== undefined && p.stock !== null ? String(p.stock) : '0');
    setErrorMsg('');
  };

  const handleCloseRestock = () => {
    setRestockProduct(null);
    setRestockStock('');
    setErrorMsg('');
  };

  const adjustStock = (delta) => {
    const current = parseInt(restockStock, 10) || 0;
    const next = Math.max(0, current + delta);
    setRestockStock(String(next));
  };

  const handleSaveRestock = async (e) => {
    if (e) e.preventDefault();
    if (!restockProduct) return;

    const parsed = parseInt(restockStock, 10);
    if (isNaN(parsed) || parsed < 0) {
      setErrorMsg('Please enter a valid stock quantity (0 or higher)');
      return;
    }

    setIsSaving(true);
    setErrorMsg('');
    try {
      if (onUpdateProduct) {
        await onUpdateProduct(restockProduct.id, {
          ...restockProduct,
          stock: parsed
        });
      }
      handleCloseRestock();
    } catch (err) {
      setErrorMsg('Failed to update stock: ' + (err.message || 'Unknown error'));
    } finally {
      setIsSaving(false);
    }
  };

  const handleClearSearch = () => {
    setSearchTerm('');
    setIncludeAllProducts(false);
    searchInputRef.current?.focus();
  };

  // Low stock products sorted by lowest stock first
  const lowStockItems = products
    .filter((p) => (p.stock ?? 0) <= 5)
    .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0));

  const trimmedSearch = searchTerm.trim().toLowerCase();

  // Filtered items based on search and scope
  const displayedItems = trimmedSearch
    ? (includeAllProducts
        ? products
            .filter((p) =>
              p.name?.toLowerCase().includes(trimmedSearch) ||
              (p.supplier && p.supplier.toLowerCase().includes(trimmedSearch))
            )
            .sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
        : lowStockItems.filter((p) =>
            p.name?.toLowerCase().includes(trimmedSearch) ||
            (p.supplier && p.supplier.toLowerCase().includes(trimmedSearch))
          )
      )
    : (includeAllProducts
        ? [...products].sort((a, b) => (a.stock ?? 0) - (b.stock ?? 0))
        : lowStockItems
      );

  const otherMatchingCount = trimmedSearch && !includeAllProducts
    ? products.filter((p) =>
        (p.stock ?? 0) > 5 && (
          p.name?.toLowerCase().includes(trimmedSearch) ||
          (p.supplier && p.supplier.toLowerCase().includes(trimmedSearch))
        )
      ).length
    : 0;



  const totalInvValue = stats?.totalInventoryValue || products.reduce(
    (acc, p) => acc + (p.price || 0) * (p.stock || 0),
    0
  );

  const totalUnits = products.reduce((acc, p) => acc + (p.stock || 0), 0);

  return (
    <div className="admin-subview analytics-subview">
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
            <span className="stat-label">Total Units in Stock</span>
            <span className="stat-value" style={{ color: '#7c3aed' }}>
              {totalUnits.toLocaleString('en-US')} Units
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


        {/* Low Stock Watchlist Panel */}
        <div className="analytics-card">
          <div className="analytics-card-header" style={{ flexWrap: 'wrap', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <ShieldAlert size={18} color="#dc2626" />
              <h3 style={{ fontSize: '1rem', fontWeight: 700, color: '#0f172a' }}>
                Restock Watchlist
              </h3>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
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
                {trimmedSearch
                  ? `${displayedItems.length} found`
                  : `${lowStockItems.length} Need Attention`}
              </span>
            </div>
          </div>

          {/* Search Bar Container */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              searchInputRef.current?.blur();
            }}
            style={{
              width: '100%',
              flexShrink: 0
            }}
          >
            <div style={{ position: 'relative', width: '100%' }}>
              <Search
                size={15}
                style={{
                  position: 'absolute',
                  left: '10px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94a3b8',
                  pointerEvents: 'none'
                }}
              />
              <input
                ref={searchInputRef}
                type="text"
                className="search-mini"
                placeholder="Search item to restock..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{
                  width: '100%',
                  paddingLeft: '32px',
                  paddingRight: searchTerm ? '28px' : '10px',
                  height: '34px',
                  fontSize: '0.8125rem'
                }}
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  style={{
                    position: 'absolute',
                    right: '8px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'transparent',
                    border: 'none',
                    color: '#94a3b8',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    padding: '2px 4px',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                  title="Clear search"
                >
                  <X size={14} />
                </button>
              )}
            </div>
          </form>

          {/* Scope notice or toggle if other in-stock matches exist */}
          {includeAllProducts ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '4px 8px',
                background: '#eff6ff',
                borderRadius: '6px',
                fontSize: '0.75rem',
                color: '#1e40af',
                flexShrink: 0
              }}
            >
              <span>Showing all inventory items (including stock &gt; 5)</span>
              <button
                type="button"
                onClick={() => setIncludeAllProducts(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#2563eb',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '0.75rem',
                  textDecoration: 'underline',
                  padding: 0
                }}
              >
                Low stock only
              </button>
            </div>
          ) : (
            trimmedSearch && otherMatchingCount > 0 && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '2px 4px',
                  fontSize: '0.75rem',
                  color: '#64748b',
                  flexShrink: 0
                }}
              >
                <span>Showing {displayedItems.length} low-stock item{displayedItems.length !== 1 ? 's' : ''}</span>
                <button
                  type="button"
                  onClick={() => setIncludeAllProducts(true)}
                  style={{
                    background: 'transparent',
                    border: 'none',
                    color: '#2563eb',
                    fontWeight: 600,
                    cursor: 'pointer',
                    fontSize: '0.75rem',
                    textDecoration: 'underline',
                    padding: 0
                  }}
                >
                  + {otherMatchingCount} more in-stock items
                </button>
              </div>
            )
          )}

          {/* Table or Empty States */}
          {displayedItems.length === 0 ? (
            trimmedSearch ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Search size={32} color="#94a3b8" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: 600, color: '#0f172a' }}>
                  No items found matching "{searchTerm}"
                </p>
                {otherMatchingCount > 0 ? (
                  <div style={{ marginTop: '0.5rem' }}>
                    <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.5rem' }}>
                      Found {otherMatchingCount} matching item{otherMatchingCount > 1 ? 's' : ''} in inventory with normal stock (&gt; 5).
                    </p>
                    <button
                      type="button"
                      className="btn-secondary"
                      style={{ fontSize: '0.75rem', padding: '4px 12px' }}
                      onClick={() => setIncludeAllProducts(true)}
                    >
                      Show In-Stock Matches ({otherMatchingCount})
                    </button>
                  </div>
                ) : (
                  <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                    Try searching for a different item name or supplier.
                  </p>
                )}
                <button
                  type="button"
                  className="btn-secondary"
                  style={{ marginTop: '0.75rem', fontSize: '0.75rem', padding: '4px 12px' }}
                  onClick={handleClearSearch}
                >
                  Clear Search
                </button>
              </div>
            ) : (
              <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: '#64748b', flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Package size={36} color="#16a34a" style={{ margin: '0 auto 0.5rem' }} />
                <p style={{ fontWeight: 600, color: '#16a34a' }}>All Inventory Well-Stocked</p>
                <p style={{ fontSize: '0.8rem', marginTop: '4px' }}>
                  No items are currently below the safety threshold of 5 units.
                </p>
              </div>
            )
          ) : (
            <div className="table-responsive restock-table-responsive" style={{ border: 'none' }}>
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Item</th>
                    <th>Stock Left</th>
                    <th style={{ textAlign: 'right' }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {displayedItems.map((p) => (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 600, color: '#0f172a' }}>
                        <div>{p.name}</div>
                        {p.supplier && (
                          <div style={{ fontSize: '0.72rem', color: '#64748b', fontWeight: 400 }}>
                            🏢 {p.supplier}
                          </div>
                        )}
                      </td>
                      <td>
                        <span
                          style={{
                            fontWeight: 700,
                            color: p.stock === 0 ? '#dc2626' : (p.stock <= 5 ? '#d97706' : '#16a34a'),
                            background: p.stock === 0 ? '#fef2f2' : (p.stock <= 5 ? '#fffbeb' : '#f0fdf4'),
                            padding: '2px 8px',
                            borderRadius: '6px',
                            fontSize: '0.8rem'
                          }}
                        >
                          {p.stock} {p.unit || 'pcs'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <button
                          type="button"
                          className="btn-secondary"
                          style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: 600, color: '#2563eb', borderColor: '#bfdbfe', background: '#eff6ff' }}
                          onClick={() => handleOpenRestock(p)}
                          title={`Quick Restock ${p.name}`}
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

      {/* Stock-Only Restock Modal */}
      {restockProduct && (
        <div className="modal-overlay" onClick={handleCloseRestock}>
          <div
            className="modal-content"
            style={{ maxWidth: '440px' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ background: '#eff6ff', color: '#2563eb', padding: '6px', borderRadius: '8px', display: 'flex' }}>
                  <Package size={20} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#0f172a', fontWeight: 700 }}>
                    Restock Product
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '2px' }}>
                    Update current inventory stock level
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleCloseRestock}
                style={{ background: 'transparent', color: '#64748b', fontSize: '1.25rem', border: 'none', cursor: 'pointer' }}
                title="Close"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveRestock}>
              <div className="modal-body" style={{ padding: '1.25rem' }}>
                {errorMsg && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {errorMsg}
                  </div>
                )}

                {/* Product Summary Card */}
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', padding: '0.85rem 1rem', marginBottom: '1.25rem' }}>
                  <div style={{ fontWeight: 700, fontSize: '1rem', color: '#0f172a' }}>
                    {restockProduct.name}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px', flexWrap: 'wrap' }}>
                    {restockProduct.supplier && (
                      <span style={{ fontSize: '0.72rem', color: '#475569', background: '#ffffff', padding: '2px 8px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        🏢 {restockProduct.supplier}
                      </span>
                    )}
                    <span style={{
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: restockProduct.stock === 0 ? '#dc2626' : '#d97706',
                      background: restockProduct.stock === 0 ? '#fef2f2' : '#fffbeb',
                      padding: '2px 8px',
                      borderRadius: '4px'
                    }}>
                      Current Stock: {restockProduct.stock} {restockProduct.unit || 'pcs'}
                    </span>
                  </div>
                </div>

                {/* Stock Input Only */}
                <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                  <label className="form-label" style={{ fontWeight: 700, fontSize: '0.9rem', color: '#1e293b', marginBottom: '0.5rem', display: 'block' }}>
                    New Stock Quantity ({restockProduct.unit || 'pcs'}) *
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    required
                    autoFocus
                    className="form-input"
                    style={{ fontSize: '1.35rem', fontWeight: 800, padding: '0.65rem 0.9rem', textAlign: 'center', color: '#0f172a' }}
                    value={restockStock}
                    onChange={(e) => setRestockStock(e.target.value)}
                  />
                </div>

                {/* Quick Add Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap', marginTop: '0.65rem' }}>
                  <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: 600 }}>Quick Add:</span>
                  <button
                    type="button"
                    onClick={() => adjustStock(5)}
                    className="btn-secondary"
                    style={{ padding: '3px 9px', fontSize: '0.75rem', borderRadius: '6px' }}
                  >
                    +5
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustStock(10)}
                    className="btn-secondary"
                    style={{ padding: '3px 9px', fontSize: '0.75rem', borderRadius: '6px' }}
                  >
                    +10
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustStock(25)}
                    className="btn-secondary"
                    style={{ padding: '3px 9px', fontSize: '0.75rem', borderRadius: '6px' }}
                  >
                    +25
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustStock(50)}
                    className="btn-secondary"
                    style={{ padding: '3px 9px', fontSize: '0.75rem', borderRadius: '6px' }}
                  >
                    +50
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustStock(100)}
                    className="btn-secondary"
                    style={{ padding: '3px 9px', fontSize: '0.75rem', borderRadius: '6px' }}
                  >
                    +100
                  </button>
                </div>
              </div>

              <div className="modal-footer" style={{ padding: '0.9rem 1.25rem', display: 'flex', justifyContent: 'flex-end', gap: '8px', borderTop: '1px solid #f1f5f9' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={handleCloseRestock}
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSaving}
                  style={{ background: '#2563eb' }}
                >
                  {isSaving ? 'Updating...' : 'Update Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
