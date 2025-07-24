import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Leads from './pages/Leads';
import Relatorios from './pages/Relatorios';
import Configuracoes from './pages/Configuracoes';
import './App.css';
import './styles/branding.css';

// Componente para proteger rotas que precisam de autenticação
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Componente para redirecionar usuários autenticados
const PublicRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }
  
  return !isAuthenticated ? children : <Navigate to="/dashboard" />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Rotas públicas */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          <Route path="/register" element={
            <PublicRoute>
              <Register />
            </PublicRoute>
          } />
          
          {/* Rotas protegidas */}
          <Route path="/" element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route index element={<Navigate to="/dashboard" />} />
            <Route path="dashboard" element={<Dashboard />} />
            {/* Placeholder para outras páginas */}
            <Route path="conversas" element={<div className="p-8 text-center">Página de Conversas em desenvolvimento</div>} />
            <Route path="leads" element={<Leads />} />
            <Route path="whatsapp" element={<div className="p-8 text-center">Página do WhatsApp em desenvolvimento</div>} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="perfil" element={<div className="p-8 text-center">Página de Perfil em desenvolvimento</div>} />
          </Route>
          
          {/* Rota 404 */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
