const API_BASE = '/api';

function getAuthHeaders() {
  const token = localStorage.getItem('chino_admin_token');
  const headers = { 'Content-Type': 'application/json' };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  return headers;
}

export const api = {
  // Tindera search endpoint
  async searchProducts(query = '') {
    const res = await fetch(`${API_BASE}/products/search?q=${encodeURIComponent(query)}`);
    if (!res.ok) throw new Error('Failed to search products');
    return res.json();
  },

  // Admin list products with optional filters
  async getAllProducts(search = '', category = '') {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (category && category !== 'ALL') params.append('category', category);
    
    const res = await fetch(`${API_BASE}/products?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  },

  // Get single product
  async getProduct(id) {
    const res = await fetch(`${API_BASE}/products/${id}`);
    if (!res.ok) throw new Error('Failed to fetch product');
    return res.json();
  },

  // Admin: Create product
  async createProduct(productData) {
    const res = await fetch(`${API_BASE}/products`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(productData),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.message || 'Failed to create product');
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
    if (!res.ok) throw new Error('Failed to fetch categories');
    return res.json();
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

  // Inventory stats
  async getStats() {
    const res = await fetch(`${API_BASE}/products/stats`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) throw new Error('Failed to fetch inventory stats');
    return res.json();
  },

  // Admin authentication
  async login(username, password) {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
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
