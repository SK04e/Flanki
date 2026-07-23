import axios from 'axios';
import { toast } from 'react-hot-toast';

// Wykrywamy czy jesteśmy u Ciebie na komputerze, czy na Renderze
const isDevelopment = import.meta.env.MODE === 'development';

const api = axios.create({
  // window.location.origin zwraca "https://flanki-46v1.onrender.com"
  // Dzięki temu Axios zignoruje folder /static/ z paska adresu i uderzy prosto w API
  baseURL: isDevelopment ? 'http://127.0.0.1:5000' : window.location.origin, 
  timeout: 10000,
});

// Automatyczne wstrzykiwanie tokenu JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Globalna obsługa błędów
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Brak połączenia / Timeout
    if (!error.response) {
      toast.error("Brak połączenia z serwerem. Sprawdź internet! 📡", { id: 'network-error' });
      return Promise.reject(error);
    }
    
    const status = error.response.status;
    
    if (status === 500) {
      toast.error("Błąd serwera. Naprawiamy to! 💥", { id: 'server-error' });
    } else if (status === 404 && !error.config.url.includes('/games/')) {
      toast.error("Nie znaleziono zasobu (404) 🔍", { id: 'not-found' });
    }
    
    return Promise.reject(error);
  }
);

export default api;