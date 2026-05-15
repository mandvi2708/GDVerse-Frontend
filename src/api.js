import axios from 'axios';

// Dynamically determine the backend URL
// 1. Check for VITE_BACKEND_URL environment variable
// 2. Fallback to production Render URL if on Vercel
// 3. Fallback to localhost if developing locally
export const getBaseURL = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }
  
  if (window.location.hostname.includes('vercel.app')) {
    // ⚠️ IMPORTANT: Ensure this matches your actual Render Backend URL!
    return 'https://gdverse-backend.onrender.com'; 
  }
  
  return 'http://localhost:8080';
};

const api = axios.create({
  baseURL: getBaseURL(),
  withCredentials: false,
});

// Automatically attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
