const API_BASE = '/api';

async function request(url, options = {}) {
  const response = await fetch(`${API_BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }
  return data;
}

export const api = {
  getProducts: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/products${query ? `?${query}` : ''}`);
  },
  getProduct: (id) => request(`/products/${id}`),
  createProduct: (product) => request('/products', { method: 'POST', body: JSON.stringify(product) }),
  updateProduct: (id, product) => request(`/products/${id}`, { method: 'PUT', body: JSON.stringify(product) }),
  deleteProduct: (id) => request(`/products/${id}`, { method: 'DELETE' }),
  seedProducts: () => request('/products/seed', { method: 'POST' }),

  getCart: (userId) => request(`/cart/${userId}`),
  addToCart: (userId, productId, quantity = 1) =>
    request(`/cart/${userId}/add`, { method: 'POST', body: JSON.stringify({ productId, quantity }) }),
  updateCartItem: (userId, productId, quantity) =>
    request(`/cart/${userId}/update`, { method: 'PUT', body: JSON.stringify({ productId, quantity }) }),
  removeFromCart: (userId, productId) =>
    request(`/cart/${userId}/remove/${productId}`, { method: 'DELETE' }),
  clearCart: (userId) => request(`/cart/${userId}/clear`, { method: 'DELETE' }),

  createOrder: (userId, shippingAddress) =>
    request('/orders', { method: 'POST', body: JSON.stringify({ userId, shippingAddress }) }),
  getUserOrders: (userId) => request(`/orders/${userId}`),
  getOrderById: (orderId) => request(`/orders/details/${orderId}`),

  createUser: (userData) => request('/users', { method: 'POST', body: JSON.stringify(userData) }),
  getUser: (id) => request(`/users/${id}`),
  updateUser: (id, userData) => request(`/users/${id}`, { method: 'PUT', body: JSON.stringify(userData) }),
};
