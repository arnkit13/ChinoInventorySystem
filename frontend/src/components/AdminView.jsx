import React, { useState } from 'react';
import { Plus, Edit2, Trash2, Search, Package, DollarSign, AlertTriangle, RefreshCw, FolderPlus, Calendar, TrendingUp, FileSpreadsheet } from 'lucide-react';
import ExcelImportModal from './ExcelImportModal';
import AdminSidebar from './AdminSidebar';
import AdminSalesView from './AdminSalesView';
import AdminCategoriesView from './AdminCategoriesView';
import AdminAnalyticsView from './AdminAnalyticsView';

export default function AdminView({
  products,
  stats,
  categories,
  onRefresh,
  onCreateProduct,
  onUpdateProduct,
  onDeleteProduct,
  onBulkCreateProducts,
  onCreateCategory,
  onUpdateCategory,
  onDeleteCategory,
  onAssignProductsToCategory,
  adminUser,
  onLogout,
  onSwitchToTindera
}) {
  const [activeTab, setActiveTab] = useState(() => {
    return localStorage.getItem('chino_admin_active_tab') || 'inventory';
  });

  const handleSelectTab = (tab) => {
    setActiveTab(tab);
    localStorage.setItem('chino_admin_active_tab', tab);
  };

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  
  // Modal states
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isExcelModalOpen, setIsExcelModalOpen] = useState(false);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [productToDelete, setProductToDelete] = useState(null);

  // Quick price edit state
  const [quickPriceEditId, setQuickPriceEditId] = useState(null);
  const [quickPriceValue, setQuickPriceValue] = useState('');

  // Form input state for product
  const [formData, setFormData] = useState({
    name: '',
    supplier: '',
    originalPrice: '',
    price: '',
    priceAbove10: '',
    wholesalePrice: '',
    category: 'Instant Food',
    stock: '',
    unit: 'pc',
    description: ''
  });
  const [formError, setFormError] = useState('');

  // Form input state for category
  const [categoryName, setCategoryName] = useState('');
  const [categoryDescription, setCategoryDescription] = useState('');
  const [categoryError, setCategoryError] = useState('');
  const [categoryLoading, setCategoryLoading] = useState(false);

  const filteredProducts = products.filter(p => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm || 
      p.name.toLowerCase().includes(term) ||
      (p.supplier && p.supplier.toLowerCase().includes(term));
    const matchesCat = selectedCategory === 'ALL' || p.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesCat;
  });

  const handleOpenAddModal = (initialCategory = null) => {
    setEditingProduct(null);
    setFormData({
      name: '',
      supplier: '',
      originalPrice: '',
      price: '',
      priceAbove10: '',
      wholesalePrice: '',
      category: initialCategory || (categories.length > 0 ? categories[0] : 'General'),
      stock: '50',
      unit: 'pc',
      description: ''
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (product) => {
    setEditingProduct(product);
    setFormData({
      name: product.name,
      supplier: product.supplier || '',
      originalPrice: product.originalPrice != null ? product.originalPrice.toString() : '',
      price: product.price != null ? product.price.toString() : '',
      priceAbove10: product.priceAbove10 != null ? product.priceAbove10.toString() : '',
      wholesalePrice: product.wholesalePrice != null ? product.wholesalePrice.toString() : '',
      category: product.category || 'General',
      stock: (product.stock ?? 0).toString(),
      unit: product.unit || 'pc',
      description: product.description || ''
    });
    setFormError('');
    setIsFormModalOpen(true);
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setFormError('Item name is required.');
      return;
    }
    const priceNum = parseFloat(formData.price);
    if (isNaN(priceNum) || priceNum < 0) {
      setFormError('Please enter a valid selling price (non-negative).');
      return;
    }

    const origPriceNum = formData.originalPrice ? parseFloat(formData.originalPrice) : null;
    if (formData.originalPrice && (isNaN(origPriceNum) || origPriceNum < 0)) {
      setFormError('Original price must be a valid non-negative number.');
      return;
    }

    const above10Num = formData.priceAbove10 ? parseFloat(formData.priceAbove10) : null;
    if (formData.priceAbove10 && (isNaN(above10Num) || above10Num < 0)) {
      setFormError('Above 10 items price must be a valid non-negative number.');
      return;
    }

    const wholesaleNum = formData.wholesalePrice ? parseFloat(formData.wholesalePrice) : null;
    if (formData.wholesalePrice && (isNaN(wholesaleNum) || wholesaleNum < 0)) {
      setFormError('Wholesale price must be a valid non-negative number.');
      return;
    }

    const payload = {
      name: formData.name.trim(),
      supplier: formData.supplier.trim() || null,
      originalPrice: origPriceNum,
      price: priceNum,
      priceAbove10: above10Num,
      wholesalePrice: wholesaleNum,
      category: formData.category.trim() || 'General',
      stock: parseInt(formData.stock, 10) || 0,
      unit: formData.unit.trim() || 'pc',
      description: formData.description.trim() || null
    };

    try {
      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, payload);
      } else {
        await onCreateProduct(payload);
      }
      setIsFormModalOpen(false);
    } catch (err) {
      setFormError(err.message || 'Operation failed');
    }
  };

  const handleCreateCategorySubmit = async (e) => {
    e.preventDefault();
    if (!categoryName.trim()) {
      setCategoryError('Category name is required.');
      return;
    }
    setCategoryLoading(true);
    setCategoryError('');
    try {
      await onCreateCategory(categoryName.trim(), categoryDescription.trim());
      setCategoryName('');
      setCategoryDescription('');
      setIsCategoryModalOpen(false);
    } catch (err) {
      setCategoryError(err.message || 'Failed to create category');
    } finally {
      setCategoryLoading(false);
    }
  };

  const handleQuickPriceSave = async (product) => {
    const newPrice = parseFloat(quickPriceValue);
    if (isNaN(newPrice) || newPrice < 0) {
      setQuickPriceEditId(null);
      return;
    }
    try {
      await onUpdateProduct(product.id, {
        ...product,
        price: newPrice
      });
      setQuickPriceEditId(null);
    } catch (err) {
      alert('Failed to update price: ' + err.message);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!productToDelete) return;
    try {
      await onDeleteProduct(productToDelete.id);
      setIsDeleteModalOpen(false);
      setProductToDelete(null);
    } catch (err) {
      alert('Failed to delete product: ' + err.message);
    }
  };

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="admin-layout">
      {/* Left Navigation Sidebar */}
      <AdminSidebar
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'excel') {
            setIsExcelModalOpen(true);
          } else {
            handleSelectTab(tab);
          }
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(prev => !prev)}
        stats={stats}
        productsCount={products.length}
        categoriesCount={categories.length}
        onOpenAddModal={handleOpenAddModal}
        onOpenExcelModal={() => setIsExcelModalOpen(true)}
        onRefresh={onRefresh}
        adminUser={adminUser}
        onLogout={onLogout}
        onSwitchToTindera={onSwitchToTindera}
      />

      {/* Main Admin Panels Container */}
      <div className="admin-main-panel">
        {activeTab === 'inventory' && (
          <div className="admin-inventory-content">
            {/* KPI Sales & Inventory Stats Grid */}
            <div className="stats-grid">
        {/* Today's Sales */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#ecfdf5', color: '#047857' }}>
            <DollarSign size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Today's Sales</span>
            <span className="stat-value" style={{ color: '#047857' }}>₱{formatCurrency(stats?.todaySales)}</span>
          </div>
        </div>

        {/* This Week's Sales */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#eff6ff', color: '#2563eb' }}>
            <Calendar size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">This Week's Sales</span>
            <span className="stat-value" style={{ color: '#2563eb' }}>₱{formatCurrency(stats?.weekSales)}</span>
          </div>
        </div>

        {/* This Month's Sales */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f5f3ff', color: '#7c3aed' }}>
            <TrendingUp size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">This Month's Sales</span>
            <span className="stat-value" style={{ color: '#7c3aed' }}>₱{formatCurrency(stats?.monthSales)}</span>
          </div>
        </div>

        {/* Total Inventory Value */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f8fafc', color: '#334155', border: '1px solid #e2e8f0' }}>
            <Package size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Inventory Value</span>
            <span className="stat-value">₱{formatCurrency(stats?.totalInventoryValue)}</span>
          </div>
        </div>

        {/* Total Products */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#f8fafc', color: '#475569', border: '1px solid #e2e8f0' }}>
            <Package size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Total Products</span>
            <span className="stat-value">{stats?.totalProducts ?? products.length}</span>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="stat-card">
          <div className="stat-icon" style={{ background: stats?.lowStockCount > 0 ? '#fef2f2' : '#f0fdf4', color: stats?.lowStockCount > 0 ? '#dc2626' : '#16a34a' }}>
            <AlertTriangle size={22} />
          </div>
          <div className="stat-content">
            <span className="stat-label">Low Stock Items</span>
            <span className="stat-value" style={{ color: stats?.lowStockCount > 0 ? '#dc2626' : '#16a34a' }}>
              {stats?.lowStockCount ?? 0}
            </span>
          </div>
        </div>
      </div>

      {/* Admin Action Bar */}
      <div className="admin-actions">
        <div className="admin-left-controls">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="search-mini"
              placeholder="Search product name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: '#94a3b8' }}
              >
                ✕
              </button>
            )}
          </div>

          <select
            className="select-filter"
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
          >
            <option value="ALL">All Categories ({categories.length})</option>
            {categories.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <button className="btn-secondary" onClick={onRefresh} title="Reload list">
            <RefreshCw size={14} />
            <span>Refresh</span>
          </button>
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Showing <strong>{filteredProducts.length}</strong> product{filteredProducts.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Products & Prices Data Table */}
      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th style={{ width: '50px' }}>ID</th>
              <th>Item Name &amp; Supplier</th>
              <th style={{ width: '130px', minWidth: '125px' }}>Category</th>
              <th style={{ width: '110px' }}>Orig. Cost (₱)</th>
              <th style={{ width: '130px' }}>Selling Price (₱)</th>
              <th style={{ width: '110px' }}>Above 10 (₱)</th>
              <th style={{ width: '110px' }}>Wholesale (₱)</th>
              <th>Stock</th>
              <th>Unit</th>
              <th style={{ textAlign: 'right', width: '90px' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  No products found. Click "+ Add New Item" or "Import Excel" to get started.
                </td>
              </tr>
            ) : (
              filteredProducts.map(product => (
                <tr key={product.id}>
                  <td style={{ color: '#94a3b8', fontSize: '0.8rem', fontFamily: 'monospace' }}>
                    #{product.id}
                  </td>
                  <td>
                    <div style={{ fontWeight: 600, color: '#0f172a' }}>{product.name}</div>
                    {product.supplier && (
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '3px', marginTop: '2px', fontSize: '0.72rem', color: '#475569', background: '#f1f5f9', padding: '1px 6px', borderRadius: '4px', border: '1px solid #e2e8f0' }}>
                        <span>🏢</span>
                        <span>{product.supplier}</span>
                      </div>
                    )}
                    {product.description && (
                      <div style={{ fontSize: '0.75rem', color: '#94a3b8', maxWidth: '300px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                        {product.description}
                      </div>
                    )}
                  </td>
                  <td>
                    <span className="category-badge">
                      {product.category}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: product.originalPrice ? '#475569' : '#94a3b8', fontSize: '0.875rem' }}>
                      {product.originalPrice != null ? `₱${Number(product.originalPrice).toFixed(2)}` : '—'}
                    </span>
                  </td>
                  <td>
                    {quickPriceEditId === product.id ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ color: '#047857', fontWeight: 700 }}>₱</span>
                        <input
                          type="number"
                          step="0.01"
                          autoFocus
                          value={quickPriceValue}
                          onChange={(e) => setQuickPriceValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleQuickPriceSave(product);
                            if (e.key === 'Escape') setQuickPriceEditId(null);
                          }}
                          className="form-input"
                          style={{ width: '80px', padding: '2px 6px', fontSize: '0.85rem' }}
                        />
                        <button
                          onClick={() => handleQuickPriceSave(product)}
                          style={{ background: '#2563eb', color: '#fff', borderRadius: '4px', padding: '3px 8px', fontSize: '0.75rem', fontWeight: 600 }}
                        >
                          Save
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => {
                          setQuickPriceEditId(product.id);
                          setQuickPriceValue(product.price.toString());
                        }}
                        style={{
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'baseline',
                          gap: '3px',
                          color: '#047857',
                          fontWeight: 700,
                          fontSize: '0.95rem',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          background: '#ecfdf5',
                          border: '1px solid #a7f3d0'
                        }}
                        title="Click to quick-edit selling price"
                      >
                        <span>₱{Number(product.price).toFixed(2)}</span>
                        <span style={{ fontSize: '0.7rem', color: '#059669' }}>✎</span>
                      </div>
                    )}
                  </td>
                  <td>
                    <span style={{ color: product.priceAbove10 ? '#2563eb' : '#94a3b8', fontWeight: product.priceAbove10 ? 600 : 400, fontSize: '0.875rem' }}>
                      {product.priceAbove10 != null ? `₱${Number(product.priceAbove10).toFixed(2)}` : '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{ color: product.wholesalePrice ? '#7c3aed' : '#94a3b8', fontWeight: product.wholesalePrice ? 600 : 400, fontSize: '0.875rem' }}>
                      {product.wholesalePrice != null ? `₱${Number(product.wholesalePrice).toFixed(2)}` : '—'}
                    </span>
                  </td>
                  <td>
                    <span style={{
                      fontWeight: 600,
                      color: product.stock <= 5 ? '#dc2626' : '#334155'
                    }}>
                      {product.stock}
                    </span>
                  </td>
                  <td style={{ color: '#64748b' }}>{product.unit || 'pc'}</td>
                  <td>
                    <div className="actions-cell" style={{ justifyContent: 'flex-end' }}>
                      <button
                        className="action-icon-btn"
                        onClick={() => handleOpenEditModal(product)}
                        title="Edit product details & prices"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        className="action-icon-btn danger"
                        onClick={() => {
                          setProductToDelete(product);
                          setIsDeleteModalOpen(true);
                        }}
                        title="Delete product"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
          </div>
        )}

        {activeTab === 'sales' && (
          <AdminSalesView stats={stats} onRefreshStats={onRefresh} />
        )}

        {activeTab === 'categories' && (
          <AdminCategoriesView
            categories={categories}
            products={products}
            onOpenAddCategoryModal={() => setIsCategoryModalOpen(true)}
            onViewCategoryProducts={(cat) => {
              setSelectedCategory(cat);
              handleSelectTab('inventory');
            }}
            onUpdateCategory={onUpdateCategory}
            onDeleteCategory={onDeleteCategory}
            onAssignProductsToCategory={onAssignProductsToCategory}
            onAddItemToCategory={(catName) => handleOpenAddModal(catName)}
          />
        )}

        {activeTab === 'analytics' && (
          <AdminAnalyticsView
            products={products}
            stats={stats}
            categories={categories}
            onOpenEditProduct={handleOpenEditModal}
          />
        )}
      </div>

      {/* Add / Edit Product Modal */}
      {isFormModalOpen && (
        <div className="modal-overlay" onClick={() => setIsFormModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '640px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>
                {editingProduct ? 'Edit Item & Pricing' : 'Add New Item'}
              </h3>
              <button
                onClick={() => setIsFormModalOpen(false)}
                style={{ background: 'transparent', color: '#64748b', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleFormSubmit}>
              <div className="modal-body" style={{ maxHeight: '78vh', overflowY: 'auto' }}>
                {formError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {formError}
                  </div>
                )}

                {/* Basic Item Info: Name & Supplier */}
                <div className="form-group">
                  <label className="form-label">Item Name *</label>
                  <input
                    type="text"
                    required
                    className="form-input"
                    placeholder="e.g. Lucky Me! Pancit Canton Kalamansi 80g"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Supplier / Distributor</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Monde Nissin Corp, Universal Robina, San Miguel"
                    value={formData.supplier}
                    onChange={(e) => setFormData({ ...formData, supplier: e.target.value })}
                  />
                </div>

                {/* Pricing Structure Box */}
                <div style={{
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  borderRadius: '10px',
                  padding: '1rem',
                  marginBottom: '1.1rem'
                }}>
                  <div style={{ fontWeight: 700, fontSize: '0.875rem', color: '#0f172a', marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#047857' }}>₱</span>
                    <span>Pricing &amp; Wholesale Tiers (PHP)</span>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Original Price (Cost / Capital)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="e.g. 13.50"
                        value={formData.originalPrice}
                        onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '0.75rem' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Selling Price (Retail) *</label>
                      <input
                        type="number"
                        step="0.01"
                        required
                        className="form-input"
                        placeholder="e.g. 16.00"
                        value={formData.price}
                        onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Above 10 items (Tier Price)</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="e.g. 15.00"
                        value={formData.priceAbove10}
                        onChange={(e) => setFormData({ ...formData, priceAbove10: e.target.value })}
                      />
                    </div>

                    <div className="form-group" style={{ marginBottom: '0' }}>
                      <label className="form-label" style={{ fontSize: '0.8rem' }}>Whole Sale Price</label>
                      <input
                        type="number"
                        step="0.01"
                        className="form-input"
                        placeholder="e.g. 14.00"
                        value={formData.wholesalePrice}
                        onChange={(e) => setFormData({ ...formData, wholesalePrice: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Dynamic Profit Margin Helper */}
                  {formData.originalPrice && formData.price && (
                    <div style={{
                      marginTop: '0.75rem',
                      padding: '0.5rem 0.75rem',
                      background: '#ecfdf5',
                      border: '1px solid #a7f3d0',
                      borderRadius: '6px',
                      fontSize: '0.78rem',
                      color: '#065f46',
                      display: 'flex',
                      flexWrap: 'wrap',
                      gap: '0.75rem'
                    }}>
                      <span>
                        <strong>Retail Profit:</strong> +₱{(parseFloat(formData.price) - parseFloat(formData.originalPrice)).toFixed(2)}
                        {parseFloat(formData.originalPrice) > 0 && ` (${(((parseFloat(formData.price) - parseFloat(formData.originalPrice)) / parseFloat(formData.originalPrice)) * 100).toFixed(1)}%)`}
                      </span>
                      {formData.priceAbove10 && (
                        <span>
                          <strong>10+ Profit:</strong> +₱{(parseFloat(formData.priceAbove10) - parseFloat(formData.originalPrice)).toFixed(2)}
                        </span>
                      )}
                      {formData.wholesalePrice && (
                        <span>
                          <strong>Wholesale Profit:</strong> +₱{(parseFloat(formData.wholesalePrice) - parseFloat(formData.originalPrice)).toFixed(2)}
                        </span>
                      )}
                    </div>
                  )}
                </div>

                {/* Category & Stock */}
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Category</label>
                    <input
                      type="text"
                      list="category-suggestions"
                      className="form-input"
                      placeholder="Select or type category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    />
                    <datalist id="category-suggestions">
                      {categories.map(c => (
                        <option key={c} value={c} />
                      ))}
                    </datalist>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Stock Quantity</label>
                    <input
                      type="number"
                      className="form-input"
                      placeholder="e.g. 100"
                      value={formData.stock}
                      onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Unit Type</label>
                    <select
                      className="form-input"
                      value={formData.unit}
                      onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    >
                      <option value="pc">Piece (pc)</option>
                      <option value="pack">Pack</option>
                      <option value="can">Can</option>
                      <option value="bottle">Bottle</option>
                      <option value="sachet">Sachet</option>
                      <option value="kg">Kilogram (kg)</option>
                      <option value="bag">Bag</option>
                      <option value="bar">Bar</option>
                      <option value="cup">Cup</option>
                      <option value="box">Box</option>
                      <option value="case">Case</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Description / Store Notes</label>
                  <textarea
                    rows="2"
                    className="form-input"
                    placeholder="Short product notes or flavor (optional)..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsFormModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingProduct ? 'Update Item & Pricing' : 'Save Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Category Modal */}
      {isCategoryModalOpen && (
        <div className="modal-overlay" onClick={() => setIsCategoryModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '420px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.2rem', color: '#0f172a' }}>Add New Category</h3>
              <button
                onClick={() => setIsCategoryModalOpen(false)}
                style={{ background: 'transparent', color: '#64748b' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleCreateCategorySubmit}>
              <div className="modal-body">
                {categoryError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {categoryError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    className="form-input"
                    placeholder="e.g. Frozen Goods, Bakery & Bread, Medicines"
                    value={categoryName}
                    onChange={(e) => setCategoryName(e.target.value)}
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Description (Optional)</label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Ice cream, frozen meats and patties"
                    value={categoryDescription}
                    onChange={(e) => setCategoryDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsCategoryModalOpen(false)}
                  disabled={categoryLoading}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={categoryLoading}
                >
                  {categoryLoading ? 'Saving...' : 'Add Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && productToDelete && (
        <div className="modal-overlay" onClick={() => setIsDeleteModalOpen(false)}>
          <div className="modal-content" style={{ maxWidth: '400px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 style={{ fontSize: '1.15rem', color: '#dc2626' }}>Delete Product</h3>
              <button
                onClick={() => setIsDeleteModalOpen(false)}
                style={{ background: 'transparent', color: '#64748b' }}
              >
                ✕
              </button>
            </div>
            <div className="modal-body">
              <p style={{ color: '#0f172a', marginBottom: '0.4rem', fontWeight: 600 }}>
                Are you sure you want to delete {productToDelete.name}?
              </p>
              <p style={{ fontSize: '0.825rem', color: '#64748b' }}>
                This action cannot be undone and will remove it from both Tindera search and inventory records.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn-secondary"
                onClick={() => setIsDeleteModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="btn-primary"
                style={{ background: '#dc2626' }}
                onClick={handleDeleteConfirm}
              >
                Yes, Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Excel File Import Modal */}
      <ExcelImportModal
        isOpen={isExcelModalOpen}
        onClose={() => setIsExcelModalOpen(false)}
        onImportSuccess={onBulkCreateProducts}
      />
    </div>
  );
}
