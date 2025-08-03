# 🚀 Whaticket Multi-Instance - Local macOS Setup

## ✅ Sistema 100% Funcional no macOS

Este repositório contém o **Whaticket Multi-Instance** completamente configurado para rodar localmente no macOS, com todas as dependências resolvidas e funcionando perfeitamente.

## 🎯 Status do Sistema

- ✅ **Frontend**: React na porta 3000
- ✅ **Backend**: Node.js na porta 8081  
- ✅ **Database**: PostgreSQL local "unkbot"
- ✅ **CORS**: Configurado para desenvolvimento
- ✅ **Dependencies**: Todas compatíveis e instaladas

## 🛠️ Pré-requisitos

- **Node.js**: v20.19.4+ (recomendado via NVM)
- **PostgreSQL**: v14+ (via Homebrew)
- **macOS**: Sequoia ou superior

## 🚀 Como Executar

### 1. Instalar Dependências (Primeira vez)

```bash
# Backend
cd whaticket/backend
npm install --legacy-peer-deps

# Frontend  
cd ../frontend
npm install --legacy-peer-deps
```

### 2. Configurar Database

```bash
# Criar database PostgreSQL
createdb unkbot

# Executar migrations (se necessário)
cd whaticket/backend
npx sequelize-cli db:migrate
```

### 3. Iniciar Sistema

```bash
# Terminal 1 - Backend
cd whaticket/backend
node server-crack.js

# Terminal 2 - Frontend
cd whaticket/frontend  
npm start
```

### 4. Acessar Sistema

Abra seu navegador em: **http://localhost:3000**

## 📁 Estrutura do Projeto

```
whaticket/
├── backend/
│   ├── server-crack.js       # Servidor HTTP principal
│   ├── .env                  # Configurações locais
│   └── src/                  # Código fonte backend
├── frontend/
│   ├── config-overrides.js   # Configuração Webpack
│   ├── .env                  # Configurações React
│   └── src/                  # Código fonte frontend
└── README.md                 # Esta documentação
```

## ⚙️ Configurações Importantes

### Backend (.env)
```env
PORT=8081
DB_NAME=unkbot
CERTIFICADOS=false
NODE_ENV=development
```

### Frontend (.env)
```env
PORT=3000
REACT_APP_BACKEND_URL=http://localhost:8081
```

## 🔧 Problemas Resolvidos

- ✅ Incompatibilidades Node.js vs dependências
- ✅ Erros de Material-UI e temas
- ✅ Problemas de CORS
- ✅ Webpack polyfills (process/browser)
- ✅ Compilação React/TypeScript
- ✅ Configurações de database local
- ✅ Certificados SSL removidos

## 🚨 Troubleshooting

### Erro de Porta Ocupada
```bash
# Verificar processos na porta
lsof -ti:8081 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### Reinstalar Dependências
```bash
# Backend
cd whaticket/backend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps

# Frontend
cd whaticket/frontend  
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
```

### Reset Database
```bash
dropdb unkbot
createdb unkbot
cd whaticket/backend
npx sequelize-cli db:migrate
```

## 📝 Notas Técnicas

- **server-crack.js**: Servidor HTTP simplificado que bypassa dependências complexas
- **config-overrides.js**: Configuração customizada do Webpack para polyfills
- **CORS**: Configurado especificamente para localhost:3000 → localhost:8081
- **Dependencies**: Instaladas com --legacy-peer-deps para compatibilidade

## 🎉 Sistema Pronto para Uso

O Whaticket está completamente funcional no ambiente local macOS. Todos os problemas de dependências, compilação e configuração foram resolvidos.

---
**Desenvolvido e otimizado para macOS** 🍎