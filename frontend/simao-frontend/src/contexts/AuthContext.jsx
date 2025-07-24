import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../lib/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setLoading(false);
        return;
      }

      api.setToken(token);
      const userData = await api.getProfile();
      setUser(userData);
      setIsAuthenticated(true);
    } catch (error) {
      console.error('Erro ao verificar autenticação:', error);
      // Token inválido, remover
      localStorage.removeItem('auth_token');
      api.setToken(null);
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, senha) => {
    try {
      const response = await api.login(email, senha);
      setUser(response.cliente);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const register = async (dados) => {
    try {
      const response = await api.register(dados);
      setUser(response.cliente);
      setIsAuthenticated(true);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const logout = () => {
    api.logout();
    setUser(null);
    setIsAuthenticated(false);
  };

  const updateUser = async (dados) => {
    try {
      const response = await api.updateProfile(dados);
      setUser(response.cliente);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateUser,
    checkAuthStatus,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

