# 🚀 Deploy em Produção

Guia completo para implantação e operação do Whaticket em ambiente de produção, incluindo configurações de segurança, monitoramento e alta disponibilidade.

## 📋 Pré-requisitos de Produção

### Infraestrutura Mínima

| Componente | Especificação Mínima | Recomendado | Observações |
|------------|---------------------|-------------|-------------|
| **CPU** | 2 vCPUs | 4 vCPUs | Para até 1000 usuários |
| **RAM** | 4 GB | 8 GB | PostgreSQL + Redis + Node.js |
| **Storage** | 50 GB SSD | 100 GB SSD | Logs, uploads, backups |
| **Bandwidth** | 100 Mbps | 1 Gbps | WhatsApp media transfer |
| **OS** | Ubuntu 20.04+ | Ubuntu 22.04 LTS | CentOS/RHEL também suportado |

### Escalabilidade por Usuários

| Usuários Simultâneos | CPU | RAM | Storage | Observações |
|---------------------|-----|-----|---------|-------------|
| **0-500** | 2 vCPUs | 4 GB | 50 GB | Configuração básica |
| **500-2000** | 4 vCPUs | 8 GB | 100 GB | Load balancer recomendado |
| **2000-5000** | 8 vCPUs | 16 GB | 200 GB | Cluster de banco |
| **5000+** | Arquitetura distribuída | 32+ GB | 500+ GB | Microserviços |

## 🛡️ Configuração de Segurança

### 1. SSL/TLS (Obrigatório)

```bash
# Instalar Certbot
sudo apt update
sudo apt install certbot python3-certbot-nginx

# Gerar certificado Let's Encrypt
sudo certbot --nginx -d seudominio.com -d www.seudominio.com

# Auto-renovação
sudo crontab -e
# Adicionar linha:
0 12 * * * /usr/bin/certbot renew --quiet
```

### 2. Firewall e Portas

```bash
# Configurar UFW
sudo ufw enable
sudo ufw default deny incoming
sudo ufw default allow outgoing

# Portas essenciais
sudo ufw allow ssh
sudo ufw allow 80/tcp   # HTTP (redirect para HTTPS)
sudo ufw allow 443/tcp  # HTTPS
sudo ufw allow from 10.0.0.0/8 to any port 5432  # PostgreSQL (apenas rede interna)
sudo ufw allow from 10.0.0.0/8 to any port 6379  # Redis (apenas rede interna)

# Verificar status
sudo ufw status verbose
```

### 3. Variáveis de Ambiente de Produção

```env
# === AMBIENTE ===
NODE_ENV=production
PORT=8080
PROXY_PORT=443

# === DOMÍNIOS ===
FRONTEND_URL=https://seudominio.com
BACKEND_URL=https://seudominio.com
ADMIN_DOMAIN=seudominio.com

# === BANCO DE DADOS ===
DB_DIALECT=postgres
DB_HOST=localhost
DB_PORT=5432
DB_NAME=whaticket_prod
DB_USER=whaticket_prod
DB_PASS=SuperSecurePassword123!@#
DB_LOGGING=false
DB_POOL_MAX=20
DB_POOL_MIN=5
DB_POOL_ACQUIRE=30000
DB_POOL_IDLE=10000

# === REDIS ===
IO_REDIS_SERVER=localhost
IO_REDIS_PASSWORD=RedisSecurePassword123!
IO_REDIS_PORT=6379
IO_REDIS_DB_SESSION=1

# === JWT (SEGURANÇA CRÍTICA) ===
JWT_SECRET=UltraSecureJWTSecret2024!MinLength32Characters!
JWT_REFRESH_SECRET=RefreshTokenSecret2024!MustBeDifferentFromJWT!
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# === ADMIN ===
SUPER_PASSWORD=AdminUltraSecurePassword2024!

# === WHATSAPP ===
CHROME_ARGS=--no-sandbox --disable-setuid-sandbox --disable-dev-shm-usage --disable-gpu
WEB_VERSION=2.2409.2

# === LOGS ===
LOG_LEVEL=warn
LOG_MAX_SIZE=10m
LOG_MAX_FILES=7

# === RATE LIMITING ===
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW=900000

# === UPLOADS ===
MAX_FILE_SIZE=20971520
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,video/mp4,application/pdf
```

## 🐳 Deploy com Docker (Recomendado)

### 1. Docker Compose para Produção

```yaml
# docker-compose.prod.yml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: whaticket_postgres
    restart: unless-stopped
    environment:
      POSTGRES_DB: whaticket_prod
      POSTGRES_USER: whaticket_prod
      POSTGRES_PASSWORD: ${DB_PASS}
      POSTGRES_INITDB_ARGS: "--encoding=UTF-8 --lc-collate=pt_BR.UTF-8 --lc-ctype=pt_BR.UTF-8"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./backups:/backups
    ports:
      - "127.0.0.1:5432:5432"
    networks:
      - whaticket_network
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U whaticket_prod -d whaticket_prod"]
      interval: 30s
      timeout: 10s
      retries: 3

  redis:
    image: redis:7-alpine
    container_name: whaticket_redis
    restart: unless-stopped
    command: redis-server --requirepass ${IO_REDIS_PASSWORD} --maxmemory 512mb --maxmemory-policy allkeys-lru
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"
    networks:
      - whaticket_network
    healthcheck:
      test: ["CMD", "redis-cli", "--raw", "incr", "ping"]
      interval: 30s
      timeout: 10s
      retries: 3

  backend:
    build: 
      context: ./whaticket/backend
      dockerfile: Dockerfile.prod
    container_name: whaticket_backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DB_HOST=postgres
      - IO_REDIS_SERVER=redis
    volumes:
      - ./public:/app/public
      - ./logs:/app/logs
      - /etc/localtime:/etc/localtime:ro
    ports:
      - "127.0.0.1:8080:8080"
    networks:
      - whaticket_network
    depends_on:
      postgres:
        condition: service_healthy
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:8080/health"]
      interval: 30s
      timeout: 10s
      retries: 3

  frontend:
    build:
      context: ./whaticket/frontend
      dockerfile: Dockerfile.prod
    container_name: whaticket_frontend
    restart: unless-stopped
    ports:
      - "127.0.0.1:3000:80"
    networks:
      - whaticket_network
    depends_on:
      - backend

  nginx:
    image: nginx:alpine
    container_name: whaticket_nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
      - ./logs:/var/log/nginx
    networks:
      - whaticket_network
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
  redis_data:

networks:
  whaticket_network:
    driver: bridge
```

### 2. Dockerfile Backend

```dockerfile
# whaticket/backend/Dockerfile.prod
FROM node:20-alpine

WORKDIR /app

# Instalar dependências do sistema
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    curl

# Configurar Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copiar package.json e instalar dependências
COPY package*.json ./
RUN npm ci --only=production && npm cache clean --force

# Copiar código fonte
COPY . .

# Build aplicação
RUN npm run build

# Criar usuário não-root
RUN addgroup -g 1001 -S nodejs
RUN adduser -S whaticket -u 1001

# Ajustar permissões
RUN chown -R whaticket:nodejs /app
USER whaticket

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/health || exit 1

CMD ["npm", "start"]
```

### 3. Dockerfile Frontend

```dockerfile
# whaticket/frontend/Dockerfile.prod
FROM node:20-alpine as builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/build /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## 🌐 Configuração Nginx

### nginx.conf (Proxy Reverso)

```nginx
events {
    worker_connections 1024;
}

http {
    upstream backend {
        server backend:8080;
        keepalive 32;
    }
    
    upstream frontend {
        server frontend:80;
        keepalive 32;
    }

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/xml+rss application/json;

    server {
        listen 80;
        server_name seudominio.com www.seudominio.com;
        return 301 https://$server_name$request_uri;
    }

    server {
        listen 443 ssl http2;
        server_name seudominio.com www.seudominio.com;

        # SSL Configuration
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
        ssl_prefer_server_ciphers off;
        ssl_session_cache shared:SSL:10m;

        # Security headers
        add_header X-Frame-Options DENY;
        add_header X-Content-Type-Options nosniff;
        add_header X-XSS-Protection "1; mode=block";
        add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

        # API routes
        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_connect_timeout 60s;
            proxy_send_timeout 60s;
            proxy_read_timeout 60s;
        }

        # Login rate limiting
        location /api/auth {
            limit_req zone=login burst=5 nodelay;
            proxy_pass http://backend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # WebSocket (Socket.IO)
        location /socket.io/ {
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection "upgrade";
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Static files
        location /public {
            proxy_pass http://backend;
            expires 1y;
            add_header Cache-Control "public, immutable";
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            
            # SPA fallback
            try_files $uri $uri/ /index.html;
        }

        # Health check
        location /health {
            proxy_pass http://backend;
            access_log off;
        }
    }
}
```

## 🔄 Deploy Automático com CI/CD

### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3

    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '20'
        cache: 'npm'

    - name: Run tests
      run: |
        cd whaticket/backend && npm ci && npm test
        cd ../frontend && npm ci && npm test

    - name: Build Docker images
      run: |
        docker build -t whaticket-backend:${{ github.sha }} ./whaticket/backend
        docker build -t whaticket-frontend:${{ github.sha }} ./whaticket/frontend

    - name: Deploy to server
      uses: appleboy/ssh-action@v0.1.5
      with:
        host: ${{ secrets.HOST }}
        username: ${{ secrets.USERNAME }}
        key: ${{ secrets.SSH_KEY }}
        script: |
          cd /opt/whaticket
          git pull origin main
          docker-compose -f docker-compose.prod.yml pull
          docker-compose -f docker-compose.prod.yml up -d --build
          docker system prune -f
```

## 📊 Monitoramento e Logs

### 1. Configuração de Logs

```javascript
// backend/src/config/logger.js
const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new DailyRotateFile({
      filename: 'logs/application-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info'
    }),
    new DailyRotateFile({
      filename: 'logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error'
    })
  ]
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.simple()
  }));
}

module.exports = logger;
```

### 2. Health Check Endpoint

```javascript
// backend/src/routes/health.js
const express = require('express');
const router = express.Router();

router.get('/health', async (req, res) => {
  const health = {
    uptime: process.uptime(),
    message: 'OK',
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    version: process.env.npm_package_version,
    memory: process.memoryUsage(),
    database: 'checking...',
    redis: 'checking...'
  };

  try {
    // Verificar PostgreSQL
    await sequelize.authenticate();
    health.database = 'connected';
  } catch (error) {
    health.database = 'disconnected';
    health.message = 'Database connection failed';
  }

  try {
    // Verificar Redis
    await redis.ping();
    health.redis = 'connected';
  } catch (error) {
    health.redis = 'disconnected';
    health.message = 'Redis connection failed';
  }

  const status = health.database === 'connected' && health.redis === 'connected' ? 200 : 503;
  res.status(status).json(health);
});

module.exports = router;
```

### 3. Prometheus Metrics (Opcional)

```javascript
// backend/src/middleware/metrics.js
const promClient = require('prom-client');

// Criar métricas
const httpRequestDuration = new promClient.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status']
});

const httpRequestsTotal = new promClient.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status']
});

// Middleware
const metricsMiddleware = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = (Date.now() - start) / 1000;
    const labels = {
      method: req.method,
      route: req.route?.path || req.path,
      status: res.statusCode
    };
    
    httpRequestDuration.observe(labels, duration);
    httpRequestsTotal.inc(labels);
  });
  
  next();
};

module.exports = { metricsMiddleware, register: promClient.register };
```

## 🔄 Backup e Recovery

### Script de Backup Automático

```bash
#!/bin/bash
# backup.sh

set -e

BACKUP_DIR="/opt/backups/whaticket"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DB_NAME="whaticket_prod"
DB_USER="whaticket_prod"

# Criar diretório de backup
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
echo "Starting database backup..."
docker exec whaticket_postgres pg_dump -U $DB_USER -d $DB_NAME | gzip > "$BACKUP_DIR/db_backup_$TIMESTAMP.sql.gz"

# Backup arquivos de mídia
echo "Starting media files backup..."
tar -czf "$BACKUP_DIR/media_backup_$TIMESTAMP.tar.gz" -C /opt/whaticket/public .

# Backup configurações
echo "Starting config backup..."
cp /opt/whaticket/.env "$BACKUP_DIR/env_backup_$TIMESTAMP"

# Limpar backups antigos (manter 7 dias)
find $BACKUP_DIR -name "*.gz" -mtime +7 -delete
find $BACKUP_DIR -name "env_backup_*" -mtime +7 -delete

echo "Backup completed: $TIMESTAMP"
```

### Crontab para Backup Automático

```bash
# Executar backup diário às 2:00 AM
0 2 * * * /opt/scripts/backup.sh >> /var/log/whaticket-backup.log 2>&1
```

## 🚨 Monitoramento com Alertas

### Script de Monitoramento

```bash
#!/bin/bash
# monitor.sh

WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

check_service() {
    local service=$1
    local url=$2
    
    if ! curl -s -f "$url" > /dev/null; then
        curl -X POST -H 'Content-type: application/json' \
            --data "{\"text\":\"🚨 ALERT: $service is DOWN!\"}" \
            $WEBHOOK_URL
    fi
}

# Verificar serviços
check_service "Whaticket Backend" "http://localhost:8080/health"
check_service "Whaticket Frontend" "http://localhost:3000"

# Verificar espaço em disco
DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"⚠️ WARNING: Disk usage is ${DISK_USAGE}%\"}" \
        $WEBHOOK_URL
fi
```

## 📈 Otimização de Performance

### 1. Configuração PostgreSQL

```sql
-- postgresql.conf optimizations
shared_buffers = 256MB
effective_cache_size = 1GB
maintenance_work_mem = 64MB
checkpoint_completion_target = 0.9
random_page_cost = 1.1
effective_io_concurrency = 200
max_connections = 100
```

### 2. Configuração Redis

```conf
# redis.conf optimizations
maxmemory 512mb
maxmemory-policy allkeys-lru
save 900 1
save 300 10
save 60 10000
```

### 3. PM2 para Cluster (Alternativa ao Docker)

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'whaticket-backend',
    script: 'dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    error_file: 'logs/err.log',
    out_file: 'logs/out.log',
    log_file: 'logs/combined.log',
    time: true,
    max_memory_restart: '1G',
    node_args: '--max-old-space-size=1024'
  }]
};
```

## 🔐 Configurações de Segurança Avançadas

### 1. Rate Limiting no Backend

```javascript
// backend/src/middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');
const RedisStore = require('rate-limit-redis');
const redis = require('../config/redis');

const createLimiter = (windowMs, max, message) => {
  return rateLimit({
    store: new RedisStore({
      client: redis,
      prefix: 'rl:'
    }),
    windowMs,
    max,
    message: { error: message },
    standardHeaders: true,
    legacyHeaders: false
  });
};

module.exports = {
  generalLimiter: createLimiter(15 * 60 * 1000, 100, 'Too many requests'),
  authLimiter: createLimiter(15 * 60 * 1000, 5, 'Too many login attempts'),
  apiLimiter: createLimiter(1 * 60 * 1000, 60, 'API rate limit exceeded')
};
```

### 2. Helmet para Headers de Segurança

```javascript
// backend/src/middleware/security.js
const helmet = require('helmet');

const securityMiddleware = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      scriptSrc: ["'self'"],
      connectSrc: ["'self'", "wss:", "https:"]
    }
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  }
});

module.exports = securityMiddleware;
```

## 📚 Próximos Passos

Após o deploy em produção:

1. [**Monitoramento**](../monitoring/README.md) - Configurar observabilidade completa
2. [**Backup**](../backup/README.md) - Implementar estratégia de backup
3. [**Troubleshooting**](../troubleshooting/README.md) - Guia de resolução de problemas
4. [**Scaling**](scaling.md) - Estratégias de escalabilidade

---

## 🆘 Suporte de Produção

- 🚨 **Emergências**: [Emergency Response Guide](../troubleshooting/emergency.md)
- 📊 **Performance Issues**: [Performance Troubleshooting](../troubleshooting/performance.md)
- 🔒 **Security Incidents**: [Security Response Plan](../security/incident-response.md)
- 💾 **Data Recovery**: [Disaster Recovery Plan](../backup/disaster-recovery.md)