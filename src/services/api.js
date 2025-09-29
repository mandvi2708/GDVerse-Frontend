import axios from 'axios';

const API_URL = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
  baseURL: API_URL,
  withCredentials: true, // Important for sending cookies with requests
});

export default api;
