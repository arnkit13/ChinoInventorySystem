import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ShoppingBag, Plus, Minus, Check } from 'lucide-react';

export default function TinderaView({ products, categories = [], searchLoading, onSearchChange, searchTerm, onRecordSale }) {
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showDropdown, setShowDropdown] = useState(false);
  const [basket, setBasket] = useState([]);
  const [isBasketOpen, setIsBasketOpen] = useState(false);
  const [cashReceived, setCashReceived] = useState('');
  const [isRecordingSale, setIsRecordingSale] = useState(false);
  const searchInputRef = useRef(null);
  const dropdownRef = useRef(null);

  // Focus search box on load and with keyboard shortcuts
  useEffect(() => {
    searchInputRef.current?.focus();

    const handleKeyDown = (e) => {
      if ((e.key === '/' && document.activeElement !== searchInputRef.current) ||
          ((e.ctrlKey || e.metaKey) && e.key === 'k')) {
        e.preventDefault();
        searchInputRef.current?.focus();
        searchInputRef.current?.select();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Filter products by category if selected
  const filteredProducts = products.filter(p => {
    if (selectedCategory === 'ALL') return true;
    return p.category?.toLowerCase() === selectedCategory.toLowerCase();
  });

  // Highlight matching letters in text
  const renderHighlighted = (text, query) => {
    if (!query || !query.trim()) return text;
    const parts = text.split(new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi'));
    return (
      <span>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i}>{part}</mark>
          ) : (
            part
          )
        )}
      </span>
    );
  };

  // Keyboard navigation for search autocomplete
  const handleKeyDown = (e) => {
    if (!showDropdown || filteredProducts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < Math.min(filteredProducts.length - 1, 9) ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : Math.min(filteredProducts.length - 1, 9)));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && selectedIndex < filteredProducts.length) {
        addToBasket(filteredProducts[selectedIndex]);
        setShowDropdown(false);
      } else if (filteredProducts.length > 0) {
        addToBasket(filteredProducts[0]);
        setShowDropdown(false);
      }
    } else if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
    }
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    onSearchChange(val);
    setShowDropdown(val.trim().length > 0);
    setSelectedIndex(-1);
  };

  // Basket management
  const addToBasket = (product) => {
    setBasket(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item =>
          item.id === product.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { ...product, qty: 1 }];
    });
    setIsBasketOpen(true);
  };

  const updateBasketQty = (id, delta) => {
    setBasket(prev =>
      prev
        .map(item => {
          if (item.id === id) {
            const newQty = item.qty + delta;
            return newQty > 0 ? { ...item, qty: newQty } : null;
          }
          return item;
        })
        .filter(Boolean)
    );
  };

  const clearBasket = () => {
    setBasket([]);
    setCashReceived('');
  };

  const totalAmount = basket.reduce((sum, item) => sum + (Number(item.price) * item.qty), 0);
  const cashNum = parseFloat(cashReceived) || 0;
  const changeAmount = cashNum >= totalAmount ? cashNum - totalAmount : 0;

  const handleCheckout = async () => {
    if (basket.length === 0 || !onRecordSale) return;
    setIsRecordingSale(true);
    try {
      await onRecordSale({
        items: basket.map(b => ({
          productId: b.id,
          productName: b.name,
          quantity: b.qty,
          price: b.price
        })),
        paymentReceived: cashNum > 0 ? cashNum : totalAmount,
        changeGiven: changeAmount
      });
      clearBasket();
      setIsBasketOpen(false);
    } catch (err) {
      alert('Failed to record sale: ' + err.message);
    } finally {
      setIsRecordingSale(false);
    }
  };

  // Build clean category chip list
  const categoryList = ['ALL', ...categories.filter(c => c && c !== 'ALL')];

  return (
    <div className="tindera-view">
      {/* Tindera Header Section */}
      <div className="tindera-hero">
        <h2 className="tindera-title">Fast Product &amp; Price Finder</h2>
        <p className="tindera-subtitle">
          Search any product name or category to check prices in Philippine Peso (₱).
        </p>

        {/* Big Search Bar */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={22} />
            <input
              ref={searchInputRef}
              type="text"
              className="main-search-input"
              placeholder="Search product name..."
              value={searchTerm}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              onFocus={() => searchTerm && setShowDropdown(true)}
            />
            {searchTerm && (
              <button
                className="search-clear-btn"
                onClick={() => {
                  onSearchChange('');
                  setShowDropdown(false);
                  searchInputRef.current?.focus();
                }}
                title="Clear Search"
              >
                <X size={15} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchTerm.trim().length > 0 && (
            <div className="autocomplete-dropdown" ref={dropdownRef}>
              <div className="autocomplete-header">
                <span>Matching Products ({filteredProducts.length})</span>
                <span>Use ↑↓ to navigate, Enter to select</span>
              </div>
              {filteredProducts.length === 0 ? (
                <div style={{ padding: '1.25rem', textAlign: 'center', color: '#64748b', fontSize: '0.875rem' }}>
                  No matching products found for "{searchTerm}".
                </div>
              ) : (
                filteredProducts.slice(0, 10).map((prod, idx) => (
                  <div
                    key={prod.id}
                    className={`autocomplete-item ${idx === selectedIndex ? 'selected' : ''}`}
                    onClick={() => {
                      addToBasket(prod);
                      setShowDropdown(false);
                    }}
                    onMouseEnter={() => setSelectedIndex(idx)}
                  >
                    <div className="autocomplete-item-left">
                      <div className="item-name">
                        {renderHighlighted(prod.name, searchTerm)}
                      </div>
                      <div className="item-meta">
                        <span className="category-badge">
                          {prod.category}
                        </span>
                        <span>Stock: {prod.stock} {prod.unit}</span>
                      </div>
                    </div>
                    <div className="autocomplete-item-right">
                      <div className="item-price-tag">
                        ₱{Number(prod.price).toFixed(2)}
                      </div>
                      <button
                        className="add-tally-btn"
                        onClick={(e) => {
                          e.stopPropagation();
                          addToBasket(prod);
                        }}
                        title="Add to Basket"
                      >
                        <Plus size={14} />
                        <span>Add</span>
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        {/* Category Filter Chips */}
        <div className="category-chips">
          {categoryList.map(cat => (
            <button
              key={cat}
              className={`chip-btn ${selectedCategory === cat ? 'active' : ''}`}
              onClick={() => setSelectedCategory(cat)}
            >
              {cat === 'ALL' ? 'All Products' : cat}
            </button>
          ))}
        </div>
      </div>

      {/* Product Results Grid */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h3 style={{ fontSize: '1.1rem', color: '#0f172a', fontWeight: 600 }}>
          {searchTerm ? `Results for "${searchTerm}"` : `All Products (${filteredProducts.length})`}
        </h3>
        <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
          Sorted by search relevance &amp; name
        </span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="panel-card" style={{ padding: '3rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
          <Search size={40} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
          <h4 style={{ color: '#0f172a', marginBottom: '0.35rem' }}>No products found</h4>
          <p style={{ fontSize: '0.875rem' }}>Try searching with another product name keyword.</p>
        </div>
      ) : (
        <div className="products-grid">
          {filteredProducts.map(product => (
            <div key={product.id} className="product-card panel-card-hover">
              <div>
                <div className="card-top">
                  <span className="category-badge">
                    {product.category}
                  </span>
                  <span className={`stock-pill ${product.stock <= 5 ? 'stock-low' : 'stock-available'}`}>
                    {product.stock <= 5 ? 'Low Stock' : 'In Stock'}: {product.stock} {product.unit}
                  </span>
                </div>

                <h4 className="card-title">
                  {renderHighlighted(product.name, searchTerm)}
                </h4>

                {product.description && (
                  <p style={{ fontSize: '0.8rem', color: '#64748b', marginBottom: '0.75rem', lineHeight: '1.4' }}>
                    {product.description}
                  </p>
                )}
              </div>

              <div className="card-bottom">
                <div className="price-box">
                  <span className="price-label">Price</span>
                  <div className="price-amount">
                    <span className="price-currency">₱</span>
                    <span>{Number(product.price).toFixed(2)}</span>
                    <span className="unit-label">/{product.unit || 'pc'}</span>
                  </div>
                </div>

                <button
                  className="add-tally-btn"
                  onClick={() => addToBasket(product)}
                  title="Add to temporary tally"
                >
                  <Plus size={14} />
                  <span>Tally</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Floating Counter / Suki Basket Drawer */}
      <div className="counter-drawer">
        <button
          className="counter-trigger-btn"
          onClick={() => setIsBasketOpen(!isBasketOpen)}
        >
          <ShoppingBag size={18} />
          <span>Tally ({basket.reduce((total, i) => total + i.qty, 0)})</span>
          <span style={{ background: 'rgba(255,255,255,0.15)', padding: '2px 8px', borderRadius: '12px' }}>
            ₱{totalAmount.toFixed(2)}
          </span>
        </button>

        {isBasketOpen && (
          <div className="counter-panel">
            <div className="counter-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: '#0f172a' }}>
                <ShoppingBag size={18} color="#2563eb" />
                <span>Price Calculator</span>
              </div>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {basket.length > 0 && (
                  <button
                    onClick={clearBasket}
                    style={{ background: 'transparent', color: '#dc2626', fontSize: '0.75rem', fontWeight: 600 }}
                  >
                    Clear All
                  </button>
                )}
                <button
                  onClick={() => setIsBasketOpen(false)}
                  style={{ background: 'transparent', color: '#64748b' }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            <div className="counter-list">
              {basket.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748b', fontSize: '0.85rem' }}>
                  Tally is empty. Click "+ Tally" on any product or press Enter to calculate.
                </div>
              ) : (
                basket.map(item => (
                  <div key={item.id} className="counter-row">
                    <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                      <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600 }}>₱{Number(item.price).toFixed(2)} each</div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <button
                        onClick={() => updateBasketQty(item.id, -1)}
                        style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' }}
                      >
                        <Minus size={12} />
                      </button>
                      <span style={{ fontSize: '0.85rem', fontWeight: 700, minWidth: '20px', textAlign: 'center' }}>
                        {item.qty}
                      </span>
                      <button
                        onClick={() => updateBasketQty(item.id, 1)}
                        style={{ width: '24px', height: '24px', borderRadius: '4px', background: '#f1f5f9', color: '#0f172a', border: '1px solid #e2e8f0' }}
                      >
                        <Plus size={12} />
                      </button>
                    </div>
                    <div style={{ width: '70px', textAlign: 'right', fontWeight: 700, fontSize: '0.9rem', color: '#047857' }}>
                      ₱{(Number(item.price) * item.qty).toFixed(2)}
                    </div>
                  </div>
                ))
              )}
            </div>

            {basket.length > 0 && (
              <div className="counter-total-box">
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                  <span style={{ color: '#64748b', fontSize: '0.875rem', fontWeight: 600 }}>Total:</span>
                  <span style={{ fontSize: '1.35rem', fontWeight: 800, color: '#047857' }}>
                    ₱{totalAmount.toFixed(2)}
                  </span>
                </div>

                <div style={{ marginBottom: '0.75rem' }}>
                  <label style={{ fontSize: '0.75rem', color: '#64748b', display: 'block', marginBottom: '0.25rem', fontWeight: 600 }}>
                    Cash Received:
                  </label>
                  <input
                    type="number"
                    className="form-input"
                    placeholder="Enter customer cash (e.g. 100)"
                    value={cashReceived}
                    onChange={(e) => setCashReceived(e.target.value)}
                    style={{ padding: '0.45rem 0.75rem', fontSize: '0.9rem' }}
                  />
                </div>

                {cashNum > 0 && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    padding: '0.5rem 0.75rem',
                    background: cashNum >= totalAmount ? '#ecfdf5' : '#fef2f2',
                    borderRadius: '8px',
                    border: `1px solid ${cashNum >= totalAmount ? '#a7f3d0' : '#fecaca'}`,
                    marginBottom: '0.75rem'
                  }}>
                    <span style={{ fontSize: '0.85rem', fontWeight: 600, color: cashNum >= totalAmount ? '#065f46' : '#991b1b' }}>
                      {cashNum >= totalAmount ? 'Change (Sukli):' : 'Short by:'}
                    </span>
                    <span style={{ fontSize: '1.05rem', fontWeight: 800, color: cashNum >= totalAmount ? '#047857' : '#dc2626' }}>
                      ₱{cashNum >= totalAmount ? changeAmount.toFixed(2) : (totalAmount - cashNum).toFixed(2)}
                    </span>
                  </div>
                )}

                <button
                  className="btn-primary"
                  onClick={handleCheckout}
                  disabled={isRecordingSale}
                  style={{ width: '100%', justifyContent: 'center', padding: '0.65rem' }}
                >
                  <Check size={16} />
                  <span>{isRecordingSale ? 'Recording Sale...' : 'Complete & Record Sale'}</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
