import React, { useState, useEffect, useRef } from 'react';
import { Search, X, ShoppingBag, Plus, Minus, Check } from 'lucide-react';

export default function TinderaView({ products, categories = [], searchLoading, onSearchChange, searchTerm, onRecordSale }) {
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

  // Close dropdown when clicking or touching outside search container
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(e.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(e.target)
      ) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, []);

  // Filter products by instant search
  const filteredProducts = products.filter(p => {
    if (!searchTerm || !searchTerm.trim()) return true;
    const term = searchTerm.trim().toLowerCase();
    return (
      (p.name && p.name.toLowerCase().includes(term)) ||
      (p.supplier && p.supplier.toLowerCase().includes(term)) ||
      (p.barcode && p.barcode.toLowerCase().includes(term))
    );
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
    if (e.key === 'Escape') {
      setShowDropdown(false);
      setSelectedIndex(-1);
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && selectedIndex >= 0 && selectedIndex < filteredProducts.length) {
        addToBasket(filteredProducts[selectedIndex]);
      }
      // Pressing enter closes the dropdown so the user can see and explore the results grid behind
      setShowDropdown(false);
      return;
    }

    if (!showDropdown || filteredProducts.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < Math.min(filteredProducts.length - 1, 9) ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : Math.min(filteredProducts.length - 1, 9)));
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

  const getItemEffectivePrice = (item) => {
    if (item.qty >= 10 && item.priceAbove10 != null && Number(item.priceAbove10) > 0) {
      return Number(item.priceAbove10);
    }
    return Number(item.price);
  };

  const totalAmount = basket.reduce((sum, item) => sum + (getItemEffectivePrice(item) * item.qty), 0);
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
          price: getItemEffectivePrice(b)
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

  return (
    <div className="tindera-view">
      {/* Tindera Header Section */}
      <div className="tindera-hero">
        <h2 className="tindera-title">Fast Product &amp; Price Finder</h2>
        <p className="tindera-subtitle">
          Search any product name to check prices in Philippine Peso (₱).
        </p>

        {/* Big Search Bar */}
        <div className="search-container">
          <div className="search-input-wrapper">
            <Search className="search-icon" size={26} />
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
                type="button"
                className="search-clear-btn"
                onClick={() => {
                  onSearchChange('');
                  setShowDropdown(false);
                  searchInputRef.current?.focus();
                }}
                title="Clear Search"
              >
                <X size={18} />
              </button>
            )}
          </div>

          {/* Autocomplete Dropdown */}
          {showDropdown && searchTerm.trim().length > 0 && (
            <div className="autocomplete-dropdown" ref={dropdownRef}>
              <div className="autocomplete-header">
                <span>Matching Products ({filteredProducts.length})</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span className="autocomplete-hint">Use ↑↓ or Enter</span>
                  <button
                    type="button"
                    className="autocomplete-close-btn"
                    onClick={() => setShowDropdown(false)}
                    title="Close dropdown to view products behind"
                  >
                    <X size={14} />
                    <span>Close</span>
                  </button>
                </div>
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
      </div>



      {/* Product Results Grid */}
      <div className="tindera-results-bar">
        <h3 style={{ fontSize: '1.35rem', color: '#0f172a', fontWeight: 800 }}>
          {searchTerm ? `Results for "${searchTerm}"` : `All Products (${filteredProducts.length})`}
        </h3>
        <span style={{ fontSize: '1rem', color: '#64748b', fontWeight: 600 }}>
          Sorted by search relevance &amp; name
        </span>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="panel-card" style={{ padding: '3.5rem 1.5rem', textAlign: 'center', color: '#64748b' }}>
          <Search size={44} style={{ margin: '0 auto 0.75rem', opacity: 0.3 }} />
          <h4 style={{ color: '#0f172a', fontSize: '1.3rem', marginBottom: '0.35rem' }}>No products found</h4>
          <p style={{ fontSize: '1rem' }}>Try searching with another product name keyword.</p>
        </div>
      ) : (
        <div className="products-scroll-container">
          <div className="products-grid">
            {filteredProducts.map(product => (
              <div key={product.id} className="product-card panel-card-hover">
                <div>
                  <div className="card-top">
                    {product.supplier ? (
                      <span className="product-supplier-badge">
                        🏢 {product.supplier}
                      </span>
                    ) : (
                      <span />
                    )}
                    <span className={`stock-pill ${product.stock <= 5 ? 'stock-low' : 'stock-available'}`}>
                      {product.stock <= 5 ? 'Low Stock' : 'In Stock'}: {product.stock} {product.unit || 'pc'}
                    </span>
                  </div>

                  <h4 className="card-title">
                    {renderHighlighted(product.name, searchTerm)}
                  </h4>

                  {product.description && (
                    <p className="card-description">
                      {product.description}
                    </p>
                  )}
                </div>

                <div className="card-bottom">
                  <div className="price-box">
                    <span className="price-label">Retail Price</span>
                    <div className="price-amount">
                      <span className="price-currency">₱</span>
                      <span>{Number(product.price).toFixed(2)}</span>
                      <span className="unit-label">/{product.unit || 'pc'}</span>
                    </div>

                    {((product.priceAbove10 != null && Number(product.priceAbove10) > 0) ||
                      (product.wholesalePrice != null && Number(product.wholesalePrice) > 0)) && (
                      <div className="tiers-container">
                        {product.priceAbove10 != null && Number(product.priceAbove10) > 0 && (
                          <div className="tier-price-pill tier-above10">
                            <span className="tier-label">10+ pcs:</span>
                            <span className="tier-value">₱{Number(product.priceAbove10).toFixed(2)}</span>
                          </div>
                        )}
                        {product.wholesalePrice != null && Number(product.wholesalePrice) > 0 && (
                          <div className="tier-price-pill tier-wholesale">
                            <span className="tier-label">Wholesale:</span>
                            <span className="tier-value">₱{Number(product.wholesalePrice).toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <button
                    className="add-tally-btn"
                    onClick={() => addToBasket(product)}
                    title="Add to temporary tally"
                  >
                    <Plus size={26} strokeWidth={2.8} />
                    <span>Tally</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
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
                basket.map(item => {
                  const unitPrice = getItemEffectivePrice(item);
                  const isTierApplied = item.qty >= 10 && item.priceAbove10 != null && Number(item.priceAbove10) > 0;
                  return (
                    <div key={item.id} className="counter-row">
                      <div style={{ flex: 1, paddingRight: '0.5rem' }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#0f172a' }}>{item.name}</div>
                        <div style={{ fontSize: '0.75rem', color: '#047857', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span>₱{unitPrice.toFixed(2)} each</span>
                          {isTierApplied && (
                            <span style={{ background: '#dbeafe', color: '#1d4ed8', padding: '1px 5px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 700 }}>
                              10+ tier
                            </span>
                          )}
                        </div>
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
                        ₱{(unitPrice * item.qty).toFixed(2)}
                      </div>
                    </div>
                  );
                })
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
