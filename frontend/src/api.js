import axios from 'axios';

// Pobieramy URL z .env lub domyślnie z Rendera
const API_URL = import.meta.env.VITE_API_URL || 'https://flanki-46v1.onrender.com';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor: Przed każdym zapytaniem automatycznie dodaj token JWT z localStorage
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Interceptor: Jeśli backend zwróci 401 (Nieautoryzowany / token wygasł), wyloguj
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      // Opcjonalnie przekierowanie do logowania
    }
    return Promise.reject(error);
  }
);

export default api;