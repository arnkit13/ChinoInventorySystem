import React, { useState, useEffect, useCallback } from 'react';
import Navbar from './components/Navbar';
import TinderaView from './components/TinderaView';
import AdminView from './components/AdminView';
import LoginModal from './components/LoginModal';
import { api } from './services/api';
import { CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [adminUser, setAdminUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('chino_admin_user');
      const token = localStorage.getItem('chino_admin_token');
      if (savedUser && token) {
        return JSON.parse(savedUser);
      }
    } catch (e) {
      console.warn('Could not restore admin session', e);
    }
    return null;
  });

  const [activeRole, setActiveRole] = useState(() => {
    try {
      const savedRole = localStorage.getItem('chino_active_role');
      const token = localStorage.getItem('chino_admin_token');
      if (savedRole === 'admin' && token) {
        return 'admin';
      }
    } catch (e) {
      // ignore
    }
    return 'tindera';
  });

  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  // Products & Inventory Data
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [stats, setStats] = useState(null);
  
  // Search state for Tindera
  const [searchTerm, setSearchTerm] = useState('');
  const [searchLoading, setSearchLoading] = useState(false);

  // Toast notification
  const [toast, setToast] = useState(null);

  const showToast = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  };

  // Initial data load
  const loadInitialData = useCallback(async () => {
    try {
      const [prods, cats] = await Promise.all([
        api.getAllProducts(),
        api.getCategories().catch(() => [])
      ]);
      setProducts(prods);
      setCategories(cats);

      // Load stats in background
      api.getStats().then(setStats).catch(() => {});
    } catch (err) {
      console.error('Failed to load initial data:', err);
    }
  }, []);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  // Tindera live search debounce
  useEffect(() => {
    if (activeRole !== 'tindera') return;

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await api.searchProducts(searchTerm);
        setProducts(results);
      } catch (err) {
        console.error('Search failed:', err);
      } finally {
        setSearchLoading(false);
      }
    }, 120);

    return () => clearTimeout(timer);
  }, [searchTerm, activeRole]);

  // Handle role selection - switch view, or prompt for login if not authenticated
  const handleSelectRole = (role) => {
    if (role === 'admin') {
      if (adminUser) {
        setActiveRole('admin');
        localStorage.setItem('chino_active_role', 'admin');
      } else {
        setIsLoginModalOpen(true);
      }
    } else {
      setActiveRole('tindera');
      localStorage.setItem('chino_active_role', 'tindera');
      api.searchProducts(searchTerm).then(setProducts).catch(console.error);
    }
  };

  // Handle Admin Login
  const handleLoginSuccess = async (username, password) => {
    const data = await api.login(username, password);
    setAdminUser(data);
    setActiveRole('admin');
    localStorage.setItem('chino_active_role', 'admin');
    showToast(`Welcome, ${data.fullName || data.username}`);
    loadInitialData();
  };

  // Handle Admin Logout
  const handleLogout = async () => {
    await api.logout();
    setAdminUser(null);
    setActiveRole('tindera');
    localStorage.setItem('chino_active_role', 'tindera');
    showToast('Logged out of Admin view');
    api.searchProducts('').then(setProducts).catch(console.error);
  };

  // Admin CRUD operations
  const handleCreateProduct = async (productData) => {
    const created = await api.createProduct(productData);
    setProducts(prev => [created, ...prev]);
    showToast(`Added product "${created.name}" (₱${Number(created.price).toFixed(2)})`);
    api.getStats().then(setStats).catch(console.error);
    api.getCategories().then(setCategories).catch(console.error);
    return created;
  };

  const handleUpdateProduct = async (id, productData) => {
    const updated = await api.updateProduct(id, productData);
    setProducts(prev => prev.map(p => (p.id === id ? updated : p)));
    showToast(`Updated "${updated.name}" — Price: ₱${Number(updated.price).toFixed(2)}`);
    api.getStats().then(setStats).catch(console.error);
    return updated;
  };

  const handleDeleteProduct = async (id) => {
    await api.deleteProduct(id);
    setProducts(prev => prev.filter(p => p.id !== id));
    showToast('Product deleted from inventory', 'info');
    api.getStats().then(setStats).catch(console.error);
  };

  // Bulk import products (e.g. from Excel)
  const handleBulkCreateProducts = async (productsList) => {
    const created = await api.bulkCreateProducts(productsList);
    await loadInitialData();
    showToast(`Successfully imported ${created.length} products!`);
    return created;
  };

  // Category creation
  const handleCreateCategory = async (name, description) => {
    const created = await api.createCategory(name, description);
    const updatedCategories = await api.getCategories();
    setCategories(updatedCategories);
    showToast(`Added category "${created.name}"`);
    return created;
  };

  // Category update / rename
  const handleUpdateCategory = async (oldName, newName, description) => {
    await api.updateCategory(oldName, newName, description);
    await loadInitialData();
    showToast(`Renamed category "${oldName}" to "${newName}"`);
  };

  // Category deletion
  const handleDeleteCategory = async (name, deleteProducts) => {
    await api.deleteCategory(name, deleteProducts);
    await loadInitialData();
    showToast(`Category "${name}" deleted.`);
  };

  // Assign existing products to category
  const handleAssignProductsToCategory = async (categoryName, productIds) => {
    await api.assignProductsToCategory(categoryName, productIds);
    await loadInitialData();
    showToast(`Added ${productIds.length} item(s) to "${categoryName}"`);
  };

  // Record sale from Tindera / Cashier checkout
  const handleRecordSale = async (saleData) => {
    await api.recordSale(saleData);
    showToast('Sale completed and recorded successfully!');
    // Refresh stats & products to reflect deducted stock and increased sales!
    api.getStats().then(setStats).catch(console.error);
    api.getAllProducts().then(setProducts).catch(console.error);
  };

  return (
    <div className={`app-container ${activeRole === 'admin' ? 'admin-mode' : ''}`}>
      {/* Navigation Header */}
      <Navbar
        activeRole={activeRole}
        onSelectRole={handleSelectRole}
        adminUser={adminUser}
        onLogout={handleLogout}
      />

      {/* Main View Display */}
      <main>
        {activeRole === 'tindera' ? (
          <TinderaView
            products={products}
            categories={categories}
            searchLoading={searchLoading}
            onSearchChange={setSearchTerm}
            searchTerm={searchTerm}
            onRecordSale={handleRecordSale}
          />
        ) : (
          <AdminView
            products={products}
            stats={stats}
            categories={categories}
            onRefresh={loadInitialData}
            onCreateProduct={handleCreateProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onBulkCreateProducts={handleBulkCreateProducts}
            onCreateCategory={handleCreateCategory}
            onUpdateCategory={handleUpdateCategory}
            onDeleteCategory={handleDeleteCategory}
            onAssignProductsToCategory={handleAssignProductsToCategory}
            adminUser={adminUser}
            onLogout={handleLogout}
            onSwitchToTindera={() => handleSelectRole('tindera')}
          />
        )}
      </main>

      {/* Admin Login Modal */}
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
        onLoginSuccess={handleLoginSuccess}
      />

      {/* Toast Notification */}
      {toast && (
        <div className="toast">
          {toast.type === 'error' ? (
            <AlertCircle size={18} color="#dc2626" />
          ) : (
            <CheckCircle2 size={18} color="#16a34a" />
          )}
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
