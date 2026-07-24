import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(localStorage.getItem('token') || null);
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  // Za każdym razem, gdy zmienia się token, zapisz go do pamięci (lub usuń przy wylogowaniu)
  useEffect(() => {
    if (token) localStorage.setItem('token', token);
    else localStorage.removeItem('token');
  }, [token]);

  // Za każdym razem, gdy zmieniają się dane usera, zapisz je do pamięci
  useEffect(() => {
    if (user) localStorage.setItem('user', JSON.stringify(user));
    else localStorage.removeItem('user');
  }, [user]);

  const updateUser = (updatedUserData) => {
    setUser(updatedUserData);
    localStorage.setItem('user', JSON.stringify(updatedUserData));
  };

const login = async (identifier, password) => {
  try {
    const response = await api.post('/auth/login', { 
      identifier, 
      password 
    });
    
    const jwtToken = response.data.access_token;
    if (jwtToken) {
      setToken(jwtToken);
      setUser(response.data.player);
      if (response.data.active_game_id) {
        localStorage.setItem('activeGameId', response.data.active_game_id);
      }
      return { success: true };
    }
  } catch (error) {
    return { 
      success: false, 
      error: error.response?.data?.error || error.response?.data?.message || 'Błąd logowania.' 
    };
  }
};

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('activeGameId');
  };

  return (
    <AuthContext.Provider value={{ token, user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);