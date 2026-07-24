import axios from 'axios';
import { toast } from 'react-hot-toast';

// Wykrywamy czy jesteśmy dewelopersko na komputerze, czy na Renderze
const isDevelopment = import.meta.env.MODE === 'development';

const api = axios.create({
  baseURL: isDevelopment ? 'http://127.0.0.1:5000' : window.location.origin, 
  timeout: 10000,
});

// Automatyczne wstrzykiwanie tokenu JWT do każdego zapytania
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
    // 1. Brak połączenia
    if (!error.response) {
      toast.error("Brak połączenia z serwerem. Sprawdź internet! 📡", { id: 'network-error' });
      return Promise.reject(error);
    }
    
    const status = error.response.status;
    
    // 2. Błąd 401 - Nieważny/Stary token JWT
    if (status === 401) {
      // Jeśli błąd 401 nie dotyczy samego formularza logowania, czyścimy token i wylogowujemy
      if (!error.config.url.includes('/auth/login')) {
        toast.error("Sesja wygasła. Zaloguj się ponownie! 🔑", { id: 'auth-expired' });
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('activeGameId');
        
        setTimeout(() => {
          window.location.reload();
        }, 600);
      }
    } 
    // 3. Błąd 500 - Błąd Serwera
    else if (status === 500) {
      toast.error("Błąd serwera. Naprawiamy to! 💥", { id: 'server-error' });
    } 
    // 4. Błąd 404
    else if (status === 404 && !error.config.url.includes('/games/')) {
      toast.error("Nie znaleziono zasobu (404) 🔍", { id: 'not-found' });
    }
    
    return Promise.reject(error);
  }
);

export default api;