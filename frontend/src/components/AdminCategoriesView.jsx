import React, { useState } from 'react';
import {
  FolderPlus,
  Package,
  ArrowRight,
  Tag,
  Edit2,
  Trash2,
  Plus,
  AlertTriangle,
  X,
  Search,
  Check
} from 'lucide-react';

export default function AdminCategoriesView({
  categories,
  products = [],
  onOpenAddCategoryModal,
  onViewCategoryProducts,
  onUpdateCategory,
  onDeleteCategory,
  onAssignProductsToCategory
}) {
  const [searchTerm, setSearchTerm] = useState('');

  // Edit Category Modal state
  const [editingCategory, setEditingCategory] = useState(null);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editError, setEditError] = useState('');
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete Category Modal state
  const [categoryToDelete, setCategoryToDelete] = useState(null);
  const [deleteProductsOption, setDeleteProductsOption] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Assign Existing Items Modal state
  const [assigningCategory, setAssigningCategory] = useState(null);
  const [assignSearch, setAssignSearch] = useState('');
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [isAssigning, setIsAssigning] = useState(false);

  // Calculate product counts per category
  const categoryStats = categories.map((cat) => {
    const matchingProducts = products.filter(
      (p) => p.category?.toLowerCase() === cat.toLowerCase()
    );
    const totalStock = matchingProducts.reduce(
      (acc, p) => acc + (p.stock || 0),
      0
    );
    const totalValue = matchingProducts.reduce(
      (acc, p) => acc + (p.price || 0) * (p.stock || 0),
      0
    );
    return {
      name: cat,
      count: matchingProducts.length,
      totalStock,
      totalValue
    };
  });

  const filteredCategories = categoryStats.filter((c) =>
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (val) => {
    return Number(val || 0).toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  };

  const getCategoryColor = (index) => {
    const colors = [
      { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
      { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
      { bg: '#fef3c7', text: '#d97706', border: '#fde68a' },
      { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
      { bg: '#fff1f2', text: '#e11d48', border: '#fecdd3' },
      { bg: '#ecfeff', text: '#0891b2', border: '#a5f3fc' },
      { bg: '#f0fdf4', text: '#16a34a', border: '#bbf7d0' },
      { bg: '#f8fafc', text: '#475569', border: '#cbd5e1' }
    ];
    return colors[index % colors.length];
  };

  // Open Edit Modal
  const handleOpenEditModal = (cat) => {
    setEditingCategory(cat);
    setEditName(cat.name);
    setEditDescription('');
    setEditError('');
  };

  // Submit Edit Category
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editName.trim()) {
      setEditError('Category name cannot be empty.');
      return;
    }
    setIsSubmittingEdit(true);
    setEditError('');
    try {
      if (onUpdateCategory) {
        await onUpdateCategory(editingCategory.name, editName.trim(), editDescription.trim());
      }
      setEditingCategory(null);
    } catch (err) {
      setEditError(err.message || 'Failed to update category');
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  // Open Delete Modal
  const handleOpenDeleteModal = (cat) => {
    setCategoryToDelete(cat);
    setDeleteProductsOption(false);
  };

  // Submit Delete Category
  const handleDeleteSubmit = async () => {
    if (!categoryToDelete) return;
    setIsDeleting(true);
    try {
      if (onDeleteCategory) {
        await onDeleteCategory(categoryToDelete.name, deleteProductsOption);
      }
      setCategoryToDelete(null);
    } catch (err) {
      alert(err.message || 'Failed to delete category');
    } finally {
      setIsDeleting(false);
    }
  };

  // Open Assign Existing Items Modal
  const handleOpenAssignModal = (cat) => {
    setAssigningCategory(cat);
    setAssignSearch('');
    setSelectedProductIds([]);
  };

  // Toggle selection of a product to add to category
  const toggleProductSelection = (productId) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  // Submit Assign Existing Products
  const handleAssignSubmit = async () => {
    if (!assigningCategory || selectedProductIds.length === 0) return;
    setIsAssigning(true);
    try {
      if (onAssignProductsToCategory) {
        await onAssignProductsToCategory(assigningCategory.name, selectedProductIds);
      }
      setAssigningCategory(null);
      setSelectedProductIds([]);
    } catch (err) {
      alert(err.message || 'Failed to assign products to category');
    } finally {
      setIsAssigning(false);
    }
  };

  // Filter available products for assigning
  const assignableProducts = products.filter((p) => {
    const term = assignSearch.toLowerCase();
    const matchesSearch =
      !assignSearch ||
      p.name?.toLowerCase().includes(term) ||
      p.supplier?.toLowerCase().includes(term) ||
      p.category?.toLowerCase().includes(term);
    return matchesSearch;
  });

  return (
    <div className="admin-subview">
      {/* Categories Header */}
      <div className="admin-view-header">
        <div>
          <h2 className="admin-view-title">Product Categories</h2>
          <p className="admin-view-subtitle">
            Organize products, track stock density, and manage category groups
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={onOpenAddCategoryModal}
          title="Create a new product category"
        >
          <FolderPlus size={16} />
          <span>Add Category</span>
        </button>
      </div>

      {/* Filter and Overview */}
      <div className="admin-actions">
        <div className="admin-left-controls">
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              className="search-mini"
              placeholder="Filter categories..."
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
        </div>

        <div style={{ fontSize: '0.85rem', color: '#64748b' }}>
          Total <strong>{categories.length}</strong> categories configured
        </div>
      </div>

      {/* Categories Cards Grid */}
      <div className="categories-grid">
        {filteredCategories.length === 0 ? (
          <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#64748b', background: '#ffffff', borderRadius: '12px', border: '1px dashed #cbd5e1' }}>
            No categories found matching your search. Click "Add Category" above to create one.
          </div>
        ) : (
          filteredCategories.map((cat, idx) => {
            const colorTheme = getCategoryColor(idx);
            return (
              <div
                key={cat.name}
                className="category-card"
                onClick={() => onViewCategoryProducts(cat.name)}
                style={{ cursor: 'pointer' }}
              >
                <div className="category-card-header">
                  <div
                    className="category-badge-box"
                    style={{
                      background: colorTheme.bg,
                      color: colorTheme.text,
                      border: `1px solid ${colorTheme.border}`
                    }}
                  >
                    <Tag size={18} />
                  </div>

                  {/* Card Header Actions: Add Existing Item, Edit, Delete */}
                  <div className="category-card-actions" onClick={(e) => e.stopPropagation()}>
                    <button
                      className="cat-action-btn add"
                      onClick={() => handleOpenAssignModal(cat)}
                      title={`Add existing item to ${cat.name}`}
                    >
                      <Plus size={13} />
                      <span>Add Item</span>
                    </button>
                    <button
                      className="cat-action-btn edit"
                      onClick={() => handleOpenEditModal(cat)}
                      title={`Edit ${cat.name}`}
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="cat-action-btn delete"
                      onClick={() => handleOpenDeleteModal(cat)}
                      title={`Delete ${cat.name}`}
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                  <h3 className="category-title" style={{ margin: 0 }}>{cat.name}</h3>
                  <span className="category-item-count-badge">
                    {cat.count} item{cat.count === 1 ? '' : 's'}
                  </span>
                </div>

                <div className="category-metrics">
                  <div className="metric-row">
                    <span className="metric-label">Total Units:</span>
                    <span className="metric-val">{cat.totalStock.toLocaleString()} units</span>
                  </div>
                  <div className="metric-row">
                    <span className="metric-label">Stock Value:</span>
                    <span className="metric-val">₱{formatCurrency(cat.totalValue)}</span>
                  </div>
                </div>

                <div className="category-card-footer">
                  <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#2563eb', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    Browse Products <ArrowRight size={13} />
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Edit Category Modal (Clean, no Add Item box) */}
      {editingCategory && (
        <div className="modal-overlay" onClick={() => setEditingCategory(null)}>
          <div className="modal-content" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Edit2 size={16} />
                </div>
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>
                  Edit Category
                </h3>
              </div>
              <button
                onClick={() => setEditingCategory(null)}
                style={{ background: 'transparent', color: '#64748b', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleEditSubmit}>
              <div className="modal-body">
                {editError && (
                  <div style={{ background: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '0.6rem 0.8rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                    {editError}
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Category Name *</label>
                  <input
                    type="text"
                    required
                    autoFocus
                    className="form-input"
                    placeholder="e.g. Canned Goods & Preserves"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                  />
                  <span style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '4px', display: 'block' }}>
                    Renaming will automatically update all existing products currently assigned to "{editingCategory.name}".
                  </span>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label">Description (Optional)</label>
                  <textarea
                    rows="3"
                    className="form-input"
                    placeholder="Brief description of items in this category"
                    value={editDescription}
                    onChange={(e) => setEditDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setEditingCategory(null)}
                  disabled={isSubmittingEdit}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={isSubmittingEdit}
                >
                  {isSubmittingEdit ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Category Confirmation Modal */}
      {categoryToDelete && (
        <div className="modal-overlay" onClick={() => setCategoryToDelete(null)}>
          <div className="modal-content" style={{ maxWidth: '450px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#dc2626' }}>
                  <AlertTriangle size={18} />
                </div>
                <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>
                  Delete Category
                </h3>
              </div>
              <button
                onClick={() => setCategoryToDelete(null)}
                style={{ background: 'transparent', color: '#64748b', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body">
              <p style={{ color: '#334155', fontSize: '0.9rem', marginBottom: '1rem', lineHeight: '1.4' }}>
                Are you sure you want to delete the category <strong>"{categoryToDelete.name}"</strong>?
              </p>

              {categoryToDelete.count > 0 ? (
                <div style={{
                  background: '#fffbeb',
                  border: '1px solid #fef3c7',
                  borderRadius: '8px',
                  padding: '0.85rem',
                  marginBottom: '1rem'
                }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: '#92400e', marginBottom: '0.5rem' }}>
                    ⚠️ This category contains {categoryToDelete.count} product{categoryToDelete.count === 1 ? '' : 's'}.
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.82rem', color: '#451a03' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="deleteProductsOption"
                        checked={!deleteProductsOption}
                        onChange={() => setDeleteProductsOption(false)}
                      />
                      <span>Reassign products to <strong>"General"</strong> category (Recommended)</span>
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#b91c1c' }}>
                      <input
                        type="radio"
                        name="deleteProductsOption"
                        checked={deleteProductsOption}
                        onChange={() => setDeleteProductsOption(true)}
                      />
                      <span>Permanently delete all {categoryToDelete.count} product(s) in this category</span>
                    </label>
                  </div>
                </div>
              ) : (
                <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '0.75rem', fontSize: '0.82rem', color: '#64748b' }}>
                  This category currently has 0 products and will be removed permanently.
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setCategoryToDelete(null)}
                disabled={isDeleting}
              >
                Cancel
              </button>
              <button
                type="button"
                className="btn-danger"
                onClick={handleDeleteSubmit}
                disabled={isDeleting}
                style={{ background: '#dc2626', color: '#ffffff', border: 'none', padding: '0.5rem 1rem', borderRadius: '6px', fontWeight: 600, cursor: 'pointer' }}
              >
                {isDeleting ? 'Deleting...' : 'Delete Category'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Existing Items to Category Modal */}
      {assigningCategory && (
        <div className="modal-overlay" onClick={() => setAssigningCategory(null)}>
          <div className="modal-content" style={{ maxWidth: '580px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div style={{ width: '34px', height: '34px', borderRadius: '8px', background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#2563eb' }}>
                  <Package size={18} />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.15rem', color: '#0f172a' }}>
                    Add Items to "{assigningCategory.name}"
                  </h3>
                  <p style={{ fontSize: '0.75rem', color: '#64748b', margin: 0 }}>
                    Select existing products from your inventory to add to this category
                  </p>
                </div>
              </div>
              <button
                onClick={() => setAssigningCategory(null)}
                style={{ background: 'transparent', color: '#64748b', fontSize: '1.2rem' }}
              >
                ✕
              </button>
            </div>

            <div className="modal-body" style={{ maxHeight: '68vh', overflowY: 'auto' }}>
              {/* Search bar inside modal */}
              <div style={{ position: 'relative', marginBottom: '0.85rem' }}>
                <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }} />
                <input
                  type="text"
                  className="form-input"
                  style={{ paddingLeft: '32px' }}
                  placeholder="Search existing products by name, supplier, or category..."
                  value={assignSearch}
                  onChange={(e) => setAssignSearch(e.target.value)}
                />
                {assignSearch && (
                  <button
                    onClick={() => setAssignSearch('')}
                    style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', background: 'transparent', color: '#94a3b8' }}
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Items List */}
              {products.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem', background: '#f8fafc', borderRadius: '8px', border: '1px dashed #cbd5e1', color: '#64748b' }}>
                  <Package size={32} style={{ margin: '0 auto 0.5rem', color: '#94a3b8', display: 'block' }} />
                  <div style={{ fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    No products found in inventory
                  </div>
                  <div style={{ fontSize: '0.8rem' }}>
                    Add items first using <strong>+ Add New Item</strong> or <strong>Import Excel</strong> in the sidebar.
                  </div>
                </div>
              ) : assignableProducts.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2rem', color: '#64748b', fontSize: '0.85rem' }}>
                  No existing items match "{assignSearch}".
                </div>
              ) : (
                <div style={{ border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                  <div style={{ background: '#f8fafc', padding: '0.5rem 0.75rem', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', color: '#64748b' }}>
                    <span>Showing {assignableProducts.length} product{assignableProducts.length === 1 ? '' : 's'}</span>
                    <button
                      type="button"
                      style={{ background: 'transparent', border: 'none', color: '#2563eb', fontWeight: 600, cursor: 'pointer', fontSize: '0.75rem' }}
                      onClick={() => {
                        const selectable = assignableProducts
                          .filter(p => p.category?.toLowerCase() !== assigningCategory.name.toLowerCase())
                          .map(p => p.id);
                        if (selectedProductIds.length === selectable.length) {
                          setSelectedProductIds([]);
                        } else {
                          setSelectedProductIds(selectable);
                        }
                      }}
                    >
                      {selectedProductIds.length > 0 ? 'Deselect All' : 'Select All Available'}
                    </button>
                  </div>

                  <div style={{ maxHeight: '280px', overflowY: 'auto' }}>
                    {assignableProducts.map((p) => {
                      const isAlreadyInCategory = p.category?.toLowerCase() === assigningCategory.name.toLowerCase();
                      const isSelected = selectedProductIds.includes(p.id);

                      return (
                        <div
                          key={p.id}
                          onClick={() => {
                            if (!isAlreadyInCategory) {
                              toggleProductSelection(p.id);
                            }
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.65rem 0.85rem',
                            borderBottom: '1px solid #f1f5f9',
                            background: isAlreadyInCategory
                              ? '#f8fafc'
                              : isSelected
                              ? '#eff6ff'
                              : '#ffffff',
                            cursor: isAlreadyInCategory ? 'default' : 'pointer',
                            transition: 'background 0.15s ease'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <input
                              type="checkbox"
                              checked={isAlreadyInCategory || isSelected}
                              disabled={isAlreadyInCategory}
                              onChange={() => toggleProductSelection(p.id)}
                              onClick={(e) => e.stopPropagation()}
                              style={{ cursor: isAlreadyInCategory ? 'not-allowed' : 'pointer' }}
                            />
                            <div>
                              <div style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0f172a' }}>
                                {p.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.72rem', color: '#64748b', marginTop: '2px' }}>
                                {p.supplier && <span>🏢 {p.supplier}</span>}
                                <span>• Current: <strong>{p.category || 'General'}</strong></span>
                              </div>
                            </div>
                          </div>

                          <div style={{ textAlign: 'right' }}>
                            {isAlreadyInCategory ? (
                              <span style={{ fontSize: '0.72rem', background: '#dcfce7', color: '#15803d', padding: '2px 8px', borderRadius: '4px', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <Check size={12} /> In Category
                              </span>
                            ) : (
                              <span style={{ fontWeight: 700, fontSize: '0.85rem', color: '#047857' }}>
                                ₱{Number(p.price || 0).toFixed(2)}
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            <div className="modal-footer" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '0.82rem', color: '#64748b' }}>
                {selectedProductIds.length > 0 ? (
                  <strong style={{ color: '#2563eb' }}>{selectedProductIds.length} item(s) selected</strong>
                ) : (
                  'No items selected'
                )}
              </span>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setAssigningCategory(null)}
                  disabled={isAssigning}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  className="btn-primary"
                  onClick={handleAssignSubmit}
                  disabled={isAssigning || selectedProductIds.length === 0}
                  style={{ minWidth: '130px', justifyContent: 'center' }}
                >
                  {isAssigning
                    ? 'Adding...'
                    : `Add ${selectedProductIds.length > 0 ? `(${selectedProductIds.length})` : ''} to Category`}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
