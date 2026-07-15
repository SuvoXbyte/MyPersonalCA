import axios from 'axios';

const api = axios.create({ baseURL: '' });

// Request interceptor
api.interceptors.request.use(
  (config) => {
    config.headers['Content-Type'] = config.headers['Content-Type'] || 'application/json';
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.detail ||
      error.response?.data?.message ||
      error.message ||
      'An unexpected error occurred';
    const enhanced = new Error(message);
    enhanced.status = error.response?.status;
    enhanced.data = error.response?.data;
    return Promise.reject(enhanced);
  }
);

export default api;
