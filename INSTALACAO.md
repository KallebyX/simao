# 🚀 Guia de Instalação - Simão IA Rural

Este guia fornece instruções passo a passo para instalar e configurar o sistema Simão IA Rural.

## 📋 Pré-requisitos

### Software Necessário
- **Node.js** 18.0+ ([Download](https://nodejs.org/))
- **Python** 3.11+ ([Download](https://python.org/))
- **PostgreSQL** 14+ ([Download](https://postgresql.org/))
- **Git** ([Download](https://git-scm.com/))
- **Docker** (opcional) ([Download](https://docker.com/))

### Contas de Serviços
- **OpenAI**: Para API de IA ([Criar conta](https://platform.openai.com/))
- **Stripe**: Para pagamentos ([Criar conta](https://stripe.com/))
- **Render**: Para deploy (opcional) ([Criar conta](https://render.com/))

## 🛠️ Instalação Passo a Passo

### 1. Preparação do Ambiente

#### 1.1 Clone o Repositório
```bash
git clone <url-do-repositorio>
cd simao-ia-rural
```

#### 1.2 Estrutura do Projeto
```
simao-ia-rural/
├── backend/simao_backend/     # API Flask
├── frontend/simao-frontend/   # Interface React
├── wppconnect/               # Servidor WhatsApp
├── docs/                     # Documentação
├── docker-compose.yml        # Orquestração
└── README.md                 # Documentação principal
```

### 2. Configuração do Banco de Dados

#### 2.1 Instalar PostgreSQL
```bash
# Ubuntu/Debian
sudo apt update
sudo apt install postgresql postgresql-contrib

# macOS (Homebrew)
brew install postgresql

# Windows
# Baixar e instalar do site oficial
```

#### 2.2 Criar Banco de Dados
```bash
# Conectar ao PostgreSQL
sudo -u postgres psql

# Criar usuário e banco
CREATE USER simao_user WITH PASSWORD 'sua_senha_aqui';
CREATE DATABASE simao_db OWNER simao_user;
GRANT ALL PRIVILEGES ON DATABASE simao_db TO simao_user;
\q
```

#### 2.3 Testar Conexão
```bash
psql -h localhost -U simao_user -d simao_db
# Digite a senha quando solicitado
```

### 3. Configuração do Backend

#### 3.1 Navegar para o Backend
```bash
cd backend/simao_backend
```

#### 3.2 Criar Ambiente Virtual
```bash
# Linux/macOS
python3 -m venv venv
source venv/bin/activate

# Windows
python -m venv venv
venv\Scripts\activate
```

#### 3.3 Instalar Dependências
```bash
pip install --upgrade pip
pip install -r requirements.txt
```

#### 3.4 Configurar Variáveis de Ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
# Flask
FLASK_ENV=development
SECRET_KEY=gere-uma-chave-secreta-forte-aqui

# Banco de Dados
DATABASE_URL=postgresql://simao_user:sua_senha_aqui@localhost/simao_db

# OpenAI (obtenha em https://platform.openai.com/api-keys)
OPENAI_API_KEY=sk-proj-...
OPENAI_API_BASE=https://api.openai.com/v1

# Stripe (obtenha em https://dashboard.stripe.com/apikeys)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT
JWT_SECRET_KEY=outra-chave-secreta-para-jwt

# URLs
FRONTEND_URL=http://localhost:5173
WPPCONNECT_URL=http://localhost:21465
```

#### 3.5 Inicializar Banco de Dados
```bash
python src/main.py
# O banco será criado automaticamente na primeira execução
```

#### 3.6 Testar Backend
```bash
# Em um terminal separado
curl http://localhost:5000/api/webhook/test
# Deve retornar: {"message": "Webhook funcionando!"}
```

### 4. Configuração do Frontend

#### 4.1 Navegar para o Frontend
```bash
cd ../../frontend/simao-frontend
```

#### 4.2 Instalar Dependências
```bash
# Usando pnpm (recomendado)
npm install -g pnpm
pnpm install

# Ou usando npm
npm install
```

#### 4.3 Configurar Variáveis de Ambiente
```bash
cp .env.example .env
```

Edite o arquivo `.env`:
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Simão IA Rural
```

#### 4.4 Testar Frontend
```bash
pnpm dev
# Acesse http://localhost:5173
```

### 5. Configuração do WPPConnect

#### 5.1 Navegar para WPPConnect
```bash
cd ../../wppconnect
```

#### 5.2 Opção A: Docker (Recomendado)
```bash
# Build da imagem
docker build -t wppconnect-simao .

# Executar container
docker run -d -p 21465:21465 --name wppconnect-simao wppconnect-simao
```

#### 5.3 Opção B: Node.js Direto
```bash
npm install
npm start
```

#### 5.4 Testar WPPConnect
```bash
curl http://localhost:21465/api/status
# Deve retornar status do servidor
```

### 6. Configuração Completa com Docker Compose

#### 6.1 Arquivo docker-compose.yml
O arquivo já está configurado na raiz do projeto.

#### 6.2 Executar Todos os Serviços
```bash
# Na raiz do projeto
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

## 🔧 Configurações Avançadas

### Configuração do Stripe

#### 1. Criar Produtos no Stripe
```bash
# Acesse https://dashboard.stripe.com/products
# Crie os produtos conforme os planos:
# - Trial (R$ 0,00)
# - Básico (R$ 97,00)
# - Profissional (R$ 197,00)
# - Empresarial (R$ 497,00)
```

#### 2. Configurar Webhooks
```bash
# URL do webhook: https://seu-backend.com/api/billing/webhook
# Eventos necessários:
# - checkout.session.completed
# - invoice.payment_succeeded
# - invoice.payment_failed
# - customer.subscription.updated
# - customer.subscription.deleted
```

### Configuração do OpenAI

#### 1. Obter API Key
```bash
# Acesse https://platform.openai.com/api-keys
# Crie uma nova chave API
# Adicione créditos à sua conta
```

#### 2. Configurar Limites
```bash
# Defina limites de uso para controlar custos
# Configure alertas de billing
```

### Configuração de Produção

#### 1. Variáveis de Ambiente de Produção
```env
# Backend (.env)
FLASK_ENV=production
DATABASE_URL=postgresql://user:pass@host:5432/db
OPENAI_API_KEY=sk-...
STRIPE_SECRET_KEY=sk_live_...
FRONTEND_URL=https://seu-dominio.com

# Frontend (.env)
VITE_API_URL=https://api.seu-dominio.com/api
```

#### 2. Build de Produção
```bash
# Frontend
cd frontend/simao-frontend
pnpm build

# Backend (já está pronto)
cd backend/simao_backend
# Usar gunicorn em produção
```

## 🚀 Deploy

### Deploy no Render

#### 1. Backend
1. Conecte seu repositório no Render
2. Crie um Web Service
3. Configure:
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `python src/main.py`
   - Environment: Python 3.11
4. Adicione variáveis de ambiente
5. Deploy automático

#### 2. Frontend
1. Crie um Static Site no Render
2. Configure:
   - Build Command: `pnpm install && pnpm build`
   - Publish Directory: `dist`
3. Deploy automático

#### 3. Banco de Dados
1. Crie um PostgreSQL no Render
2. Copie a DATABASE_URL
3. Configure no backend

### Deploy Alternativo (VPS)

#### 1. Preparar Servidor
```bash
# Instalar dependências
sudo apt update
sudo apt install python3 python3-pip nodejs npm postgresql nginx

# Configurar firewall
sudo ufw allow 80
sudo ufw allow 443
sudo ufw allow 22
```

#### 2. Configurar Nginx
```nginx
# /etc/nginx/sites-available/simao
server {
    listen 80;
    server_name seu-dominio.com;

    location /api {
        proxy_pass http://localhost:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location / {
        root /var/www/simao-frontend;
        try_files $uri $uri/ /index.html;
    }
}
```

#### 3. SSL com Let's Encrypt
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d seu-dominio.com
```

## 🔍 Troubleshooting

### Problemas Comuns

#### 1. Erro de Conexão com Banco
```bash
# Verificar se PostgreSQL está rodando
sudo systemctl status postgresql

# Verificar conexão
psql -h localhost -U simao_user -d simao_db
```

#### 2. Erro de Dependências Python
```bash
# Atualizar pip
pip install --upgrade pip

# Reinstalar dependências
pip install -r requirements.txt --force-reinstall
```

#### 3. Erro de Porta em Uso
```bash
# Verificar processos na porta
lsof -i :5000
lsof -i :5173

# Matar processo
kill -9 <PID>
```

#### 4. Erro de CORS
```bash
# Verificar configuração CORS no backend
# Arquivo: backend/src/main.py
# Deve permitir origem do frontend
```

### Logs e Debugging

#### 1. Logs do Backend
```bash
# Ver logs em tempo real
tail -f backend/simao_backend/logs/app.log
```

#### 2. Logs do Frontend
```bash
# Console do navegador (F12)
# Network tab para requisições
```

#### 3. Logs do Docker
```bash
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f wppconnect
```

## 📞 Suporte

### Documentação
- README.md - Visão geral
- INSTALACAO.md - Este guia
- Código comentado

### Contato
- Issues no GitHub
- Email: suporte@simaoiarural.com
- WhatsApp: (11) 99999-9999

---

**Instalação concluída com sucesso!** 🎉

Acesse http://localhost:5173 para começar a usar o Simão IA Rural.

