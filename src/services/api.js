import axios from 'axios';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
//const API_BASE_URL = 'http://localhost:8000/api'
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Simple request/response logging without blocking duplicates
api.interceptors.request.use(request => {
  console.log('Making API request to:', `${request.method}:${request.url}`);
  return request;
});

api.interceptors.response.use(
  response => {
    console.log('API Response received:', response.status);
    return response;
  },
  error => {
    console.error('API Error:', error.message);
    return Promise.reject(error);
  }
);

export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id) => api.get(`/products/${id}`),
  updateStock: (id, quantity) => api.patch(`/products/${id}/stock`, { quantity })
};

export const billsAPI = {
  create: (billData) => api.post('/bills', billData),
  getAll: () => api.get('/bills'),
  getById: (id) => api.get(`/bills/${id}`)
};

// Updated inventoryAPI with proper FormData handling
export const inventoryAPI = {
  // Create product with file upload support
  add: (productData) => {
    // Handle FormData for file uploads
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // Longer timeout for file uploads
    };
    return api.post('/inventory', productData, config);
  },
  
  // Update product with file upload support
  update: (id, productData) => {
    // Handle FormData for file uploads
    const config = {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 30000, // Longer timeout for file uploads
    };
    return api.put(`/inventory/${id}`, productData, config);
  },
  
  // Delete product (no file upload needed)
  delete: (id) => api.delete(`/inventory/${id}`)
};

// Shop API for managing shop settings
export const shopAPI = {
  getSettings: () => api.get('/shopDetails/shop-settings'),
  updateSettings: (settingsData) => api.put('/shopDetails/shop-settings', settingsData)
};

export default api;
