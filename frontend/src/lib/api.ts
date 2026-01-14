import axios from 'axios';

const TOKEN_KEY = 'alphastar_token';

// Use environment variable for API URL, fallback to /api for local dev with proxy
const API_BASE_URL = "http://178.18.246.104:3003/api" ;

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem('alphastar_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);
