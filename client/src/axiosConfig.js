import axios from 'axios';

const api = axios.create({
  baseURL: ''
});

// Add a request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    const company = localStorage.getItem('selected_company') || 'Hatbaliya';
    
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    config.headers['x-company-name'] = company;
    
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);
// Add a response interceptor to handle 401 Unauthorized globally
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response && error.response.status === 401) {
      // Only redirect if we actually had a valid session that just died
      if (localStorage.getItem('token')) {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login?session_expired=true';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
