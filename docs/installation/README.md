# 🛠️ Instalação e Configuração

Guia completo para instalação e configuração do sistema Whaticket em diferentes ambientes.

## 📋 Pré-requisitos

### Requisitos do Sistema

| Componente | Versão Mínima | Versão Recomendada | Observações |
|------------|---------------|-------------------|-------------|
| **Node.js** | 18.0.0 | 20.x LTS | Com npm/yarn |
| **PostgreSQL** | 12.0 | 15.x | Com extensões |
| **Redis** | 6.0 | 7.x | Para filas e cache |
| **Docker** | 20.10 | 24.x | Opcional mas recomendado |
| **Docker Compose** | 2.0 | 2.20+ | Para orquestração |

### Portas Utilizadas

| Serviço | Porta Padrão | Configurável | Descrição |
|---------|--------------|--------------|-----------|
| Backend API | 8080 | ✅ | API REST principal |
| Frontend | 3000 | ✅ | Interface React |
| PostgreSQL | 5432 | ✅ | Banco de dados |
| Redis | 6379 | ✅ | Cache e filas |
| Socket.IO | 8080 | ✅ | WebSocket (mesma porta da API) |

## 🐳 Instalação via Docker (Recomendado)

### 1. Clonar o Repositório

```bash
git clone https://github.com/canove/whaticket-community.git
cd whaticket-community
```

### 2. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar configurações
nano .env
```

### 3. Configurações Essenciais (.env)

```env
# === BANCO DE DADOS ===
DB_DIALECT=postgres
DB_HOST=postgres
DB_PORT=5432
DB_NAME=whaticket
DB_USER=whaticket
DB_PASS=strongpassword123

# === REDIS ===
IO_REDIS_SERVER=redis
IO_REDIS_PASSWORD=
IO_REDIS_PORT=6379
IO_REDIS_DB_SESSION=2

# === APLICAÇÃO ===
NODE_ENV=production
PORT=8080
PROXY_PORT=443
FRONTEND_URL=https://seudominio.com
BACKEND_URL=https://seudominio.com

# === JWT ===
JWT_SECRET=your-super-secret-jwt-key-min-32-chars
JWT_REFRESH_SECRET=your-refresh-secret-key-min-32-chars

# === ADMINISTRADOR ===
ADMIN_DOMAIN=seudominio.com
SUPER_PASSWORD=admin123

# === WHATSAPP ===
CHROME_ARGS=--no-sandbox --disable-setuid-sandbox
CHROME_BIN=/usr/bin/google-chrome-stable
```

### 4. Executar com Docker Compose

```bash
# Subir todos os serviços
docker-compose up -d

# Verificar logs
docker-compose logs -f

# Verificar status
docker-compose ps
```

### 5. Executar Migrações

```bash
# Aguardar serviços iniciarem (30-60 segundos)
sleep 60

# Executar migrações
docker-compose exec backend npm run db:migrate

# Executar seeds (opcional)
docker-compose exec backend npm run db:seed
```

## 💻 Instalação Manual (Desenvolvimento)

### 1. Preparar Ambiente

```bash
# Instalar Node.js (via nvm recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
source ~/.bashrc
nvm install 20
nvm use 20

# Verificar versões
node --version
npm --version
```

### 2. Configurar PostgreSQL

```sql
-- Conectar como superuser
psql -U postgres

-- Criar banco e usuário
CREATE DATABASE whaticket;
CREATE USER whaticket WITH ENCRYPTED PASSWORD 'strongpassword123';
GRANT ALL PRIVILEGES ON DATABASE whaticket TO whaticket;
ALTER USER whaticket CREATEDB;

-- Sair
\q
```

### 3. Configurar Redis

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# CentOS/RHEL
sudo yum install redis

# Iniciar serviço
sudo systemctl start redis
sudo systemctl enable redis

# Testar conexão
redis-cli ping
```

### 4. Instalar Backend

```bash
cd whaticket/backend

# Instalar dependências
npm install

# Copiar configurações
cp .env.example .env

# Editar variáveis (ajustar para ambiente local)
nano .env
```

#### Configuração Backend (.env)

```env
# Banco local
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whaticket
DB_USER=whaticket
DB_PASS=strongpassword123

# Redis local
IO_REDIS_SERVER=localhost
IO_REDIS_PORT=6379

# URLs locais
FRONTEND_URL=http://localhost:3000
BACKEND_URL=http://localhost:8080

# Desenvolvimento
NODE_ENV=development
PORT=8080
```

### 5. Executar Migrações Backend

```bash
# Criar estrutura do banco
npm run db:migrate

# Popular dados iniciais (opcional)
npm run db:seed

# Iniciar em modo desenvolvimento
npm run dev
```

### 6. Instalar Frontend

```bash
# Em outro terminal
cd whaticket/frontend

# Instalar dependências
npm install

# Copiar configurações
cp .env.example .env

# Configurar API endpoint
echo "REACT_APP_BACKEND_URL=http://localhost:8080" > .env

# Iniciar em modo desenvolvimento
npm start
```

## ⚙️ Configurações Avançadas

### SSL/HTTPS (Produção)

```bash
# Gerar certificados Let's Encrypt
sudo apt install certbot
sudo certbot certonly --standalone -d seudominio.com

# Configurar nginx (exemplo)
sudo nano /etc/nginx/sites-available/whaticket
```

### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name seudominio.com;

    ssl_certificate /etc/letsencrypt/live/seudominio.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/seudominio.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:3000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # WebSocket
    location /socket.io/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### Configuração Multi-tenant

```env
# Habilitar multi-tenancy
MULTI_TENANT=true

# Configurar domínios
ADMIN_DOMAIN=admin.seudominio.com
FRONTEND_URL=https://{companyId}.seudominio.com
```

## 🔍 Verificação da Instalação

### 1. Healthcheck dos Serviços

```bash
# Verificar backend
curl http://localhost:8080/health

# Verificar PostgreSQL
psql -h localhost -U whaticket -d whaticket -c "SELECT version();"

# Verificar Redis
redis-cli ping

# Verificar frontend
curl http://localhost:3000
```

### 2. Logs de Inicialização

```bash
# Docker
docker-compose logs backend | grep -i "server started"
docker-compose logs frontend | grep -i "compiled successfully"

# Manual
# Backend logs aparecerão no terminal
# Frontend logs aparecerão no terminal
```

### 3. Acesso Inicial

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8080
- **Admin Login**: 
  - Email: `admin@seudominio.com`
  - Senha: `admin123` (alterar imediatamente)

## 🚨 Troubleshooting Comum

### Problema: Erro de Conexão com PostgreSQL

```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar conectividade
telnet localhost 5432

# Verificar logs do PostgreSQL
sudo tail -f /var/log/postgresql/postgresql-*.log
```

### Problema: Redis Connection Failed

```bash
# Verificar Redis
sudo systemctl status redis

# Testar conexão
redis-cli ping

# Verificar configuração
sudo nano /etc/redis/redis.conf
```

### Problema: Frontend não carrega

```bash
# Verificar se backend está respondendo
curl -I http://localhost:8080/health

# Verificar variáveis de ambiente
cat whaticket/frontend/.env

# Limpar cache
cd whaticket/frontend
rm -rf node_modules package-lock.json
npm install
```

### Problema: WhatsApp não conecta

```bash
# Verificar Chrome/Chromium
which google-chrome
which chromium-browser

# Instalar dependências faltantes
sudo apt-get install -y \
  gconf-service libasound2 libatk1.0-0 libcairo-gobject2 \
  libdrm2 libgdk-pixbuf2.0-0 libgtk-3-0 libnspr4 libx11-xcb1 \
  libxcb-dri3-0 libxcomposite1 libxcursor1 libxdamage1 libxfixes3 \
  libxi6 libxinerama1 libxrandr2 libxrender1 libxss1 libxtst6 \
  ca-certificates fonts-liberation libappindicator1 libnss3 \
  lsb-release xdg-utils wget
```

## 📚 Próximos Passos

Após a instalação bem-sucedida:

1. [**Configuração Inicial**](configuration.md) - Configurar sistema básico
2. [**Guia de Desenvolvimento**](../development/README.md) - Se for desenvolver
3. [**Deploy em Produção**](../production/README.md) - Para ambiente de produção
4. [**Integrações**](../integrations/README.md) - Configurar WhatsApp e outras APIs

---

## 📄 Suporte

- 🐛 **Problemas na Instalação**: [Troubleshooting Guide](../troubleshooting/installation.md)
- 💬 **Comunidade**: [Discord/Telegram]
- 📧 **Suporte Técnico**: suporte@whaticket.com