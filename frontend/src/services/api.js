const rawBase = import.meta.env.VITE_API_URL || import.meta.env.VITE_API_BASE_URL || 'https://chinoinventorysystem-production.up.railway.app';
const API_BASE = rawBase
  ? (rawBase.endsWith('/api') ? rawBase : `${rawBase.replace(/\/+$/, '')}/api`)
  : '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('chino_admin_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

async function handleResponse(res, defaultError = 'Request failed') {
  const contentType = res.headers.get('content-type') || '';
  if (!contentType.includes('application/json')) {
    const text = await res.text().catch(() => '');
    if (text.includes('<!DOCTYPE') || text.includes('<html') || res.status === 405 || res.status === 404) {
      throw new Error('Frontend is not connected to the backend. Please configure VITE_API_URL in your Vercel project settings with your Railway backend domain.');
    }
    throw new Error(text || `${defaultError} (Status: ${res.status})`);
  }

  let data;
  try {
    data = await res.json();
  } catch (err) {
    throw new Error('Failed to parse backend response. Please check your backend connection.');
  }

  if (!res.ok) {
    throw new Error(data?.message || defaultError);
  }
  return data;
}

export const api = {
  // Tindera search endpoint
  async searchProducts(query = '') {
    const res = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(query)}`);
    return handleResponse(res, 'Failed to search products');
  },

  // Admin list products with optional filters
  async getAllProducts(search = '', category = '') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'ALL') params.append('category', category);
    
    const res = await fetch(`${API_BASE}/products?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to fetch products');
  },

  // Get single product
  async getProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`);
    return handleResponse(res, 'Failed to fetch product');
  },

  // Admin: Create product
  async createProduct(productData) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    return handleResponse(res, 'Failed to create product');
  },

  // Admin: Bulk import products (JSON)
  async bulkCreateProducts(products) {
    const res = await fetch(`${API_BASE}/products/bulk`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(products),
    });
    return handleResponse(res, 'Failed to import products');
  },

  // Admin: Direct Excel File Upload (.xlsx, .xls)
  async importExcelFile(file) {
    const formData = new FormData();
    formData.append('file', file);
    const token = localStorage.getItem('chino_admin_token');
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/products/import-excel`, {
      method: 'POST',
      headers,
      body: formData,
    });
    if (!res.ok) {
      const errText = await res.text().catch(() => 'Upload failed');
      throw new Error(errText || 'Failed to upload Excel file');
    }
    return res.json();
  },

  // Admin: Update product
  async updateProduct(id, productData) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update product');
    }
    return res.json();
  },

  // Admin: Delete product
  async deleteProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to delete product');
    return true;
  },

  // Unique categories
  async getCategories() {
    const res = await fetch(`${API_BASE}/categories`);
    return handleResponse(res, 'Failed to fetch categories');
  },

  // Add category
  async createCategory(name, description = '') {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify({ name, description }),
    });
    if (!res.ok) throw new Error('Failed to add category');
    return res.json();
  },

  // Update / Rename category
  async updateCategory(oldName, newName, description = '') {
    const res = await fetch(`${API_BASE}/categories`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify({ oldName, newName, description }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to update category');
    }
    return res.json();
  },

  // Delete category
  async deleteCategory(categoryName, deleteProducts = false) {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(categoryName)}?deleteProducts=${deleteProducts}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to delete category');
    }
    return res.json();
  },

  // Assign existing products to a category
  async assignProductsToCategory(categoryName, productIds) {
    const res = await fetch(`${API_BASE}/categories/${encodeURIComponent(categoryName)}/assign-products`, {
      method: 'PUT',
      headers: getAuthHeaders(),
      body: JSON.stringify(productIds),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to assign products to category');
    }
    return res.json();
  },

  // Record a completed sale
  async recordSale(saleData) {
    const res = await fetch(`${API_BASE}/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(saleData),
    });
    if (!res.ok) throw new Error('Failed to record sale');
    return res.json();
  },

  // Get recent sales history
  async getRecentSales() {
    const res = await fetch(`${API_BASE}/sales/recent`);
    if (!res.ok) throw new Error('Failed to fetch recent sales');
    return res.json();
  },

  // Inventory stats
  async getStats() {
    const res = await fetch(`${API_BASE}/products/stats`, {
      headers: getAuthHeaders(),
    });
    return handleResponse(res, 'Failed to fetch inventory stats');
  },

  // Admin authentication
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await handleResponse(res, 'Login failed');
    if (!data.success) {
      throw new Error(data.message || 'Login failed');
    }
    if (data.token) {
      localStorage.setItem('chino_admin_token', data.token);
      localStorage.setItem('chino_admin_user', JSON.stringify(data));
    }
    return data;
  },

  async logout() {
    const token = localStorage.getItem('chino_admin_token');
    try {
      await fetch(`${API_BASE}/auth/logout`, {
        method: 'POST',
        headers: getAuthHeaders(),
      });
    } catch (e) {
      // ignore network errors on logout
    }
    localStorage.removeItem('chino_admin_token');
    localStorage.removeItem('chino_admin_user');
  },

  getCurrentUser() {
    const userStr = localStorage.getItem('chino_admin_user');
    if (!userStr) return null;
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  // Supabase Configuration
  async getSupabaseConfig() {
    const res = await fetch(`${API_BASE}/config/supabase`);
    if (!res.ok) throw new Error('Failed to load Supabase configuration');
    return res.json();
  },

  async saveSupabaseConfig(config) {
    const res = await fetch(`${API_BASE}/config/supabase`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(config),
    });
    if (!res.ok) throw new Error('Failed to update Supabase configuration');
    return res.json();
  }
};
