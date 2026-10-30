import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Automatic JWT Authorization Request Interceptor
axiosClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('scholarmesh_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response Interceptor to gracefully handle session expiry
axiosClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      // If unauthorized on protected endpoint, clear stale token
      const isAuthRoute = error.config.url?.includes('/auth/login') || error.config.url?.includes('/auth/register');
      if (!isAuthRoute) {
        localStorage.removeItem('scholarmesh_token');
        localStorage.removeItem('scholarmesh_user');
      }
    }
    return Promise.reject(error);
  }
);

export default axiosClient;
