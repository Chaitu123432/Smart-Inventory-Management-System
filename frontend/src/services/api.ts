import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// API endpoints
export const authAPI = {
  login: (email: string, password: string) => api.post('/auth/login', { email, password }),
  register: (userData: any) => api.post('/auth/register', userData),
};

export const productsAPI = {
  getAll: () => api.get('/products'),
  getById: (id: string) => api.get(`/products/${id}`),
  create: (productData: any) => api.post('/products', productData),
  update: (id: string, productData: any) => api.put(`/products/${id}`, productData),
  delete: (id: string) => api.delete(`/products/${id}`),
};

export const forecastsAPI = {
  getAll: () => api.get('/forecasts'),
  getById: (id: string) => api.get(`/forecasts/${id}`),
  generate: (params: any) => api.post('/forecasts/generate', params),
  getForecastModels: () => api.get('/forecasts/models'),
};

export const aiAPI = {
  optimizeInventory: (data: any) => api.post('/ai/optimize-inventory', data),
  detectAnomalies: (data: any) => api.post('/ai/detect-anomalies', data),
};

export default api; 