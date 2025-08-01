# Whaticket - Configuração para Desenvolvimento Local

Este guia configura o sistema Whaticket para desenvolvimento local, removendo dependências de tokens privados e serviços externos.

## 🚀 Setup Rápido

```bash
# Setup completo (recomendado para primeira execução)
./dev-setup.sh full

# Ou execute o menu interativo
./dev-setup.sh
```

## 📋 Pré-requisitos

- **Docker** e **Docker Compose** (instalados automaticamente pelo script)
- **Node.js 16+** e **NPM** (instalados automaticamente via NVM)
- **Git**

## 🏗️ Arquitetura do Sistema

### Backend (Node.js + TypeScript)
- **Porta:** 8081
- **Framework:** Express.js
- **ORM:** Sequelize
- **WebSocket:** Socket.io
- **Queue:** Bull (Redis)

### Frontend (React)
- **Porta:** 3000
- **Framework:** React 16
- **UI:** Material-UI
- **Estado:** Context API + Zustand

### Infraestrutura
- **PostgreSQL:** 5432 (banco principal)
- **Redis:** 6379 (cache e filas)
- **MailHog:** 8025 (desenvolvimento de email)

## 🔧 Configurações Removidas/Adaptadas

### Tokens e Credenciais Privadas Removidas:
- ✅ **Stripe:** Tokens de produção removidos
- ✅ **MercadoPago:** Access tokens removidos
- ✅ **Asaas:** Tokens removidos
- ✅ **GerenciaNet:** Credenciais removidas
- ✅ **Facebook:** Apenas IDs públicos mantidos
- ✅ **HTTPS/SSL:** Desabilitado para desenvolvimento
- ✅ **Email:** Configurado para MailHog local

### Adaptações para Desenvolvimento Local:
- 🔄 **Banco de Dados:** PostgreSQL local via Docker
- 🔄 **Redis:** Instância local via Docker
- 🔄 **Email:** MailHog para captura de emails
- 🔄 **Logging:** Habilitado para debug
- 🔄 **Pool de Conexões:** Otimizado para desenvolvimento

## 📁 Estrutura de Configuração

```
/workspaces/simao/
├── docker-compose.yml          # Infraestrutura (PostgreSQL, Redis, MailHog)
├── dev-setup.sh               # Script de automação
├── whaticket/
│   ├── backend/
│   │   ├── .env               # Variáveis do backend
│   │   └── src/config/        # Configurações
│   └── frontend/
│       ├── .env               # Variáveis do frontend
│       └── src/config.js      # Configurações React
```

## 🎯 Comandos Disponíveis

### Script Principal
```bash
./dev-setup.sh full      # Setup completo
./dev-setup.sh infra     # Apenas infraestrutura
./dev-setup.sh app       # Apenas aplicação
./dev-setup.sh stop      # Parar todos os serviços
./dev-setup.sh logs      # Ver logs
./dev-setup.sh status    # Status dos serviços
```

### Comandos Manuais

#### Backend
```bash
cd whaticket/backend
npm install                    # Instalar dependências
npm run db:migrate            # Executar migrações
npm run db:seed               # Executar seeds
npm run dev:server            # Iniciar em modo desenvolvimento
```

#### Frontend
```bash
cd whaticket/frontend
npm install                    # Instalar dependências
npm start                     # Iniciar em modo desenvolvimento
```

#### Infraestrutura
```bash
docker-compose up -d          # Subir serviços
docker-compose down           # Parar serviços
docker-compose logs -f        # Ver logs
```

## 🌐 URLs de Acesso

- **Frontend:** http://localhost:3000
- **Backend API:** http://localhost:8081
- **MailHog (Email):** http://localhost:8025
- **PostgreSQL:** localhost:5432
- **Redis:** localhost:6379

## 🐛 Debugging

### Logs
```bash
# Logs da infraestrutura
docker-compose logs -f

# Logs do backend (quando rodando)
tail -f whaticket/backend/combined.log

# Status dos serviços
./dev-setup.sh status
```

### Banco de Dados
```bash
# Conectar ao PostgreSQL
docker exec -it whaticket_postgres psql -U whaticket -d whaticket

# Conectar ao Redis
docker exec -it whaticket_redis redis-cli
```

### Problemas Comuns

1. **Porta já em uso:**
   ```bash
   # Verificar processos usando as portas
   lsof -i :3000 :8081 :5432 :6379
   
   # Parar processos específicos
   ./dev-setup.sh stop
   ```

2. **Erro de migração:**
   ```bash
   cd whaticket/backend
   npm run db:migrate:undo:all
   npm run db:migrate
   ```

3. **Dependências desatualizadas:**
   ```bash
   # Limpar node_modules
   rm -rf whaticket/backend/node_modules
   rm -rf whaticket/frontend/node_modules
   
   # Reinstalar
   ./dev-setup.sh full
   ```

## 🔄 Workflow de Desenvolvimento

1. **Primeira execução:**
   ```bash
   ./dev-setup.sh full
   ```

2. **Desenvolvimento diário:**
   ```bash
   # Iniciar apenas infraestrutura se já configurada
   ./dev-setup.sh infra
   
   # Em terminais separados
   cd whaticket/backend && npm run dev:server
   cd whaticket/frontend && npm start
   ```

3. **Reset completo:**
   ```bash
   ./dev-setup.sh stop
   docker-compose down -v  # Remove volumes
   ./dev-setup.sh full
   ```

## 📦 Principais Dependências

### Backend
- Express.js, Socket.io, Sequelize
- TypeScript, Bull, Redis
- Bcrypt, JWT, Nodemailer
- Puppeteer, FFMPEG, OpenAI

### Frontend
- React 16, Material-UI 4/5
- Axios, Socket.io-client
- Chart.js, React Query
- Formik, Yup, Zustand

## 🤝 Contribuição

1. Configure o ambiente com `./dev-setup.sh full`
2. Faça suas alterações
3. Teste localmente
4. Commit e push

## 📝 Notas Importantes

- **Ambiente de Desenvolvimento:** Configurações otimizadas para desenvolvimento local
- **Sem Produção:** Não usar essas configurações em produção
- **Tokens Removidos:** Todos os tokens privados foram removidos ou zerados
- **HTTPS Desabilitado:** SSL/TLS desabilitado para simplicidade local
- **Logging Habilitado:** Logs detalhados para debugging
