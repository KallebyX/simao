import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';

// Simple login page without authentication logic
function SimpleLogin() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#0284c7',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '3rem',
        borderRadius: '1rem',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
        width: '100%',
        maxWidth: '400px'
      }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <h1 style={{ 
            color: '#0284c7', 
            fontSize: '1.875rem',
            fontWeight: 'bold',
            marginBottom: '0.5rem'
          }}>
            Oryum BusinessAI
          </h1>
          <p style={{ color: '#6b7280' }}>Sistema de Atendimento</p>
        </div>

        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Email
          </label>
          <input
            type="email"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}
            placeholder="seu@email.com"
          />
        </div>

        <div style={{ marginBottom: '2rem' }}>
          <label style={{
            display: 'block',
            fontSize: '0.875rem',
            fontWeight: '500',
            color: '#374151',
            marginBottom: '0.5rem'
          }}>
            Senha
          </label>
          <input
            type="password"
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #d1d5db',
              borderRadius: '0.5rem',
              fontSize: '1rem'
            }}
            placeholder="••••••••"
          />
        </div>

        <button
          onClick={() => {
            console.log('Login button clicked - redirecting to dashboard');
            window.location.href = '/dashboard';
          }}
          style={{
            width: '100%',
            backgroundColor: '#0284c7',
            color: 'white',
            padding: '0.75rem',
            borderRadius: '0.5rem',
            border: 'none',
            fontSize: '1rem',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Entrar
        </button>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f0f9ff',
          borderRadius: '0.5rem',
          fontSize: '0.875rem'
        }}>
          <p style={{ margin: 0, color: '#0369a1' }}>
            ✅ Interface carregada com sucesso!
          </p>
          <p style={{ margin: '0.5rem 0 0 0', color: '#075985' }}>
            Roteamento funcionando normalmente.
          </p>
        </div>
      </div>
    </div>
  );
}

// Simple dashboard without authentication checks
function SimpleDashboard() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f9fafb',
      padding: '2rem'
    }}>
      <div style={{
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{
          backgroundColor: 'white',
          padding: '2rem',
          borderRadius: '1rem',
          boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
          marginBottom: '2rem'
        }}>
          <h1 style={{
            fontSize: '2rem',
            fontWeight: 'bold',
            color: '#0284c7',
            marginBottom: '1rem'
          }}>
            Dashboard - Oryum BusinessAI
          </h1>
          <p style={{ color: '#6b7280' }}>
            Sistema funcionando corretamente!
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '1.5rem'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>Tickets Abertos</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#0284c7' }}>24</p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>Contatos</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#16a34a' }}>156</p>
          </div>

          <div style={{
            backgroundColor: 'white',
            padding: '1.5rem',
            borderRadius: '0.5rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
          }}>
            <h3 style={{ color: '#374151', marginBottom: '0.5rem' }}>Mensagens Hoje</h3>
            <p style={{ fontSize: '2rem', fontWeight: 'bold', color: '#dc2626' }}>89</p>
          </div>
        </div>

        <div style={{
          marginTop: '2rem',
          textAlign: 'center'
        }}>
          <button
            onClick={() => {
              console.log('Logout clicked');
              window.location.href = '/login';
            }}
            style={{
              backgroundColor: '#6b7280',
              color: 'white',
              padding: '0.75rem 1.5rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer'
            }}
          >
            Voltar para Login
          </button>
        </div>
      </div>
    </div>
  );
}

// Main app with simple routing
function AppSimple() {
  console.log('AppSimple rendering...');

  return (
    <Router>
      <div style={{ minHeight: '100vh' }}>
        <Routes>
          <Route path="/login" element={<SimpleLogin />} />
          <Route path="/dashboard" element={<SimpleDashboard />} />
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </div>
    </Router>
  );
}

export default AppSimple;