import React from 'react';

function SimpleApp() {
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#f0f0f0',
      padding: '2rem',
      fontFamily: 'Arial, sans-serif'
    }}>
      <div style={{
        maxWidth: '800px',
        margin: '0 auto',
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
      }}>
        <h1 style={{
          color: '#0284c7',
          textAlign: 'center',
          marginBottom: '2rem'
        }}>
          🚀 Oryum BusinessAI
        </h1>
        
        <div style={{
          backgroundColor: '#e0f7fa',
          padding: '1rem',
          borderRadius: '4px',
          marginBottom: '2rem'
        }}>
          <h2 style={{margin: 0, color: '#006064'}}>✅ Sistema Funcionando!</h2>
          <p style={{margin: '0.5rem 0 0 0', color: '#00838f'}}>
            React está carregando corretamente sem dependências complexas.
          </p>
        </div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '1rem',
          marginTop: '2rem'
        }}>
          <div style={{
            border: '1px solid #e0e0e0',
            padding: '1rem',
            borderRadius: '4px'
          }}>
            <h3 style={{margin: '0 0 0.5rem 0', color: '#333'}}>📊 Dashboard</h3>
            <p style={{margin: 0, fontSize: '0.9rem', color: '#666'}}>
              Painel principal com estatísticas
            </p>
          </div>

          <div style={{
            border: '1px solid #e0e0e0',
            padding: '1rem',
            borderRadius: '4px'
          }}>
            <h3 style={{margin: '0 0 0.5rem 0', color: '#333'}}>💬 Tickets</h3>
            <p style={{margin: 0, fontSize: '0.9rem', color: '#666'}}>
              Sistema de atendimento
            </p>
          </div>

          <div style={{
            border: '1px solid #e0e0e0',
            padding: '1rem',
            borderRadius: '4px'
          }}>
            <h3 style={{margin: '0 0 0.5rem 0', color: '#333'}}>📱 WhatsApp</h3>
            <p style={{margin: 0, fontSize: '0.9rem', color: '#666'}}>
              Conexões WhatsApp
            </p>
          </div>
        </div>

        <div style={{
          marginTop: '2rem',
          padding: '1rem',
          backgroundColor: '#f5f5f5',
          borderRadius: '4px',
          textAlign: 'center'
        }}>
          <p style={{margin: 0, fontSize: '0.9rem', color: '#666'}}>
            Próximo passo: Testar imports dos hooks e stores
          </p>
        </div>
      </div>
    </div>
  );
}

export default SimpleApp;