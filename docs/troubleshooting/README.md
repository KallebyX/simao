# 🔧 Troubleshooting e Debug

Guia completo para diagnóstico e resolução de problemas no sistema Whaticket, incluindo ferramentas de debug, logs e soluções para problemas comuns.

## 🚨 Problemas Críticos (Emergência)

### Sistema Não Responde

```bash
# 1. Verificar status dos serviços
docker-compose ps
# ou
systemctl status whaticket-*

# 2. Verificar logs imediatos
docker-compose logs --tail=50 backend frontend
# ou
journalctl -f -u whaticket-backend -u whaticket-frontend

# 3. Restart emergencial
docker-compose restart
# ou
systemctl restart whaticket-backend whaticket-frontend
```

### Banco de Dados Inacessível

```bash
# Verificar PostgreSQL
docker-compose exec postgres pg_isready -U whaticket -d whaticket

# Conectar diretamente ao banco
docker-compose exec postgres psql -U whaticket -d whaticket

# Verificar conexões ativas
SELECT count(*) FROM pg_stat_activity;

# Finalizar conexões órfãs
SELECT pg_terminate_backend(pid) 
FROM pg_stat_activity 
WHERE datname = 'whaticket' AND state = 'idle';
```

### WhatsApp Desconectado

```bash
# Verificar sessões ativas
docker-compose exec backend ls -la public/

# Limpar sessões corrompidas
docker-compose exec backend rm -rf public/*.json

# Restart serviço WhatsApp
docker-compose restart backend
```

## 🔍 Ferramentas de Debug

### 1. Logs Estruturados

#### Backend Logs

```bash
# Logs em tempo real
docker-compose logs -f backend

# Logs específicos por nível
docker-compose exec backend tail -f logs/error.log
docker-compose exec backend tail -f logs/application.log

# Filtrar logs por tipo
docker-compose logs backend | grep -i "error\|warn\|fail"

# Logs de um período específico
docker-compose logs --since="2024-01-01T00:00:00" backend
```

#### Frontend Logs

```bash
# Logs do container
docker-compose logs -f frontend

# Logs do navegador (F12 -> Console)
# Filtrar por tipo:
# - Errors: console.error()
# - Network: aba Network
# - WebSocket: filtrar por socket.io
```

#### Database Logs

```bash
# Logs PostgreSQL
docker-compose logs postgres

# Queries lentas
docker-compose exec postgres psql -U whaticket -d whaticket -c "
SELECT query, mean_exec_time, calls 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;"

# Conexões ativas
docker-compose exec postgres psql -U whaticket -d whaticket -c "
SELECT pid, usename, application_name, client_addr, state, query_start 
FROM pg_stat_activity 
WHERE datname = 'whaticket';"
```

### 2. Health Checks

#### Script de Verificação Completa

```bash
#!/bin/bash
# health-check.sh

echo "=== WHATICKET HEALTH CHECK ==="

# Backend API
echo "Backend API:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:8080/health
if [ $? -eq 0 ]; then
    echo " ✅ Backend respondendo"
else
    echo " ❌ Backend não responde"
fi

# Frontend
echo "Frontend:"
curl -s -o /dev/null -w "%{http_code}" http://localhost:3000
if [ $? -eq 0 ]; then
    echo " ✅ Frontend respondendo"
else
    echo " ❌ Frontend não responde"
fi

# PostgreSQL
echo "PostgreSQL:"
docker-compose exec -T postgres pg_isready -U whaticket
if [ $? -eq 0 ]; then
    echo " ✅ PostgreSQL conectado"
else
    echo " ❌ PostgreSQL desconectado"
fi

# Redis
echo "Redis:"
docker-compose exec -T redis redis-cli ping
if [ $? -eq 0 ]; then
    echo " ✅ Redis respondendo"
else
    echo " ❌ Redis não responde"
fi

# Espaço em disco
echo "Espaço em disco:"
df -h | grep -E "/$|/opt"

# Memória
echo "Uso de memória:"
free -h

echo "==============================="
```

### 3. Debug do Backend

#### Configuração de Debug

```env
# .env para debug
NODE_ENV=development
DEBUG=whaticket:*
LOG_LEVEL=debug
DB_LOGGING=true
```

#### Debug de Serviços Específicos

```typescript
// Debug em serviços (exemplo)
import logger from "../utils/logger";

class ExampleService {
  public async execute(data: any) {
    logger.debug("ExampleService.execute called", { data });
    
    try {
      // Lógica do serviço
      const result = await this.processData(data);
      logger.debug("ExampleService.execute success", { result });
      return result;
    } catch (error) {
      logger.error("ExampleService.execute failed", { error, data });
      throw error;
    }
  }
}
```

#### Debug do WhatsApp

```javascript
// Habilitar debug do Baileys
process.env.DEBUG = 'baileys:*';

// Logs específicos do WhatsApp
logger.info("WhatsApp session status", {
  sessionId: whatsapp.id,
  status: whatsapp.status,
  qrCode: !!whatsapp.qrcode,
  isConnected: whatsapp.status === 'CONNECTED'
});
```

## 🐛 Problemas Comuns e Soluções

### Backend Issues

#### 1. Erro de Conexão com Banco

**Sintoma:**
```
Error: connect ECONNREFUSED 127.0.0.1:5432
```

**Diagnóstico:**
```bash
# Verificar se PostgreSQL está rodando
docker-compose ps postgres
systemctl status postgresql

# Verificar porta
netstat -tulpn | grep 5432

# Testar conexão
telnet localhost 5432
```

**Solução:**
```bash
# Restart PostgreSQL
docker-compose restart postgres

# Verificar variáveis de ambiente
docker-compose exec backend env | grep DB_

# Verificar network Docker
docker network ls
docker network inspect whaticket_default
```

#### 2. Erro de Migração

**Sintoma:**
```
Sequelize migration failed
```

**Diagnóstico:**
```bash
# Verificar status das migrações
docker-compose exec backend npm run db:migrate:status

# Ver última migração
docker-compose exec postgres psql -U whaticket -d whaticket -c "
SELECT * FROM SequelizeMeta ORDER BY name DESC LIMIT 5;"
```

**Solução:**
```bash
# Reverter última migração
docker-compose exec backend npm run db:migrate:undo

# Aplicar migrações específicas
docker-compose exec backend npx sequelize-cli db:migrate --to 20240101000000-migration-name.js

# Reset completo (CUIDADO!)
docker-compose exec backend npm run db:reset
```

#### 3. Sessões WhatsApp Corrompidas

**Sintoma:**
```
WhatsApp connection failed repeatedly
```

**Diagnóstico:**
```bash
# Verificar arquivos de sessão
docker-compose exec backend ls -la public/

# Verificar logs do WhatsApp
docker-compose logs backend | grep -i whatsapp
```

**Solução:**
```bash
# Limpar sessões específicas
docker-compose exec backend rm -rf public/session-{companyId}

# Limpar todas as sessões
docker-compose exec backend rm -rf public/*.json

# Restart backend
docker-compose restart backend
```

### Frontend Issues

#### 1. Página em Branco

**Sintoma:**
- Frontend carrega mas mostra página branca
- Console mostra erros JavaScript

**Diagnóstico:**
```bash
# Verificar build
docker-compose exec frontend ls -la /usr/share/nginx/html/

# Verificar configuração nginx
docker-compose exec frontend cat /etc/nginx/conf.d/default.conf
```

**Solução:**
```bash
# Rebuild frontend
docker-compose build --no-cache frontend

# Limpar cache do navegador
# Verificar variáveis de ambiente
docker-compose exec frontend env | grep REACT_APP_
```

#### 2. API não conecta

**Sintoma:**
```
Network Error: Request failed
```

**Diagnóstico:**
```javascript
// No console do navegador
fetch('http://localhost:8080/health')
  .then(response => console.log(response.status))
  .catch(error => console.error(error));
```

**Solução:**
```bash
# Verificar CORS
docker-compose logs backend | grep -i cors

# Verificar proxy reverso
docker-compose exec nginx nginx -t

# Verificar conectividade
docker-compose exec frontend ping backend
```

### Database Issues

#### 1. Performance Lenta

**Diagnóstico:**
```sql
-- Queries mais lentas
SELECT query, mean_exec_time, calls, total_exec_time
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Índices não utilizados
SELECT schemaname, tablename, attname, n_distinct, correlation 
FROM pg_stats 
WHERE tablename IN ('Tickets', 'Messages', 'Contacts');

-- Tamanho das tabelas
SELECT schemaname, tablename, 
       pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public' 
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;
```

**Solução:**
```sql
-- Criar índices faltantes
CREATE INDEX CONCURRENTLY idx_tickets_company_status 
ON "Tickets" ("companyId", "status");

CREATE INDEX CONCURRENTLY idx_messages_ticket_created 
ON "Messages" ("ticketId", "createdAt");

-- Vacuum e analyze
VACUUM ANALYZE;

-- Reindex se necessário
REINDEX DATABASE whaticket;
```

#### 2. Bloqueios (Locks)

**Diagnóstico:**
```sql
-- Verificar locks ativos
SELECT blocked_locks.pid AS blocked_pid,
       blocked_activity.usename AS blocked_user,
       blocking_locks.pid AS blocking_pid,
       blocking_activity.usename AS blocking_user,
       blocked_activity.query AS blocked_statement,
       blocking_activity.query AS current_statement_in_blocking_process
FROM pg_catalog.pg_locks blocked_locks
JOIN pg_catalog.pg_stat_activity blocked_activity 
  ON blocked_activity.pid = blocked_locks.pid
JOIN pg_catalog.pg_locks blocking_locks 
  ON blocking_locks.locktype = blocked_locks.locktype
  AND blocking_locks.DATABASE IS NOT DISTINCT FROM blocked_locks.DATABASE
  AND blocking_locks.relation IS NOT DISTINCT FROM blocked_locks.relation
  AND blocking_locks.page IS NOT DISTINCT FROM blocked_locks.page
  AND blocking_locks.tuple IS NOT DISTINCT FROM blocked_locks.tuple
  AND blocking_locks.virtualxid IS NOT DISTINCT FROM blocked_locks.virtualxid
  AND blocking_locks.transactionid IS NOT DISTINCT FROM blocked_locks.transactionid
  AND blocking_locks.classid IS NOT DISTINCT FROM blocked_locks.classid
  AND blocking_locks.objid IS NOT DISTINCT FROM blocked_locks.objid
  AND blocking_locks.objsubid IS NOT DISTINCT FROM blocked_locks.objsubid
  AND blocking_locks.pid != blocked_locks.pid
JOIN pg_catalog.pg_stat_activity blocking_activity 
  ON blocking_activity.pid = blocking_locks.pid
WHERE NOT blocked_locks.GRANTED;
```

**Solução:**
```sql
-- Finalizar processo que está bloqueando
SELECT pg_terminate_backend(blocking_pid);

-- Em último caso, restart
SELECT pg_cancel_backend(pid) FROM pg_stat_activity WHERE state = 'active';
```

### Redis Issues

#### 1. Redis Memory Issues

**Diagnóstico:**
```bash
# Verificar uso de memória
docker-compose exec redis redis-cli INFO memory

# Verificar configuração
docker-compose exec redis redis-cli CONFIG GET maxmemory*

# Keys mais utilizadas
docker-compose exec redis redis-cli --bigkeys
```

**Solução:**
```bash
# Limpar cache se necessário
docker-compose exec redis redis-cli FLUSHDB

# Ajustar configuração
docker-compose exec redis redis-cli CONFIG SET maxmemory 512mb
docker-compose exec redis redis-cli CONFIG SET maxmemory-policy allkeys-lru
```

## 📊 Monitoramento e Alertas

### Scripts de Monitoramento

#### Monitor de Performance

```bash
#!/bin/bash
# performance-monitor.sh

# CPU e Memória dos containers
docker stats --no-stream --format "table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}"

# Conexões no banco
docker-compose exec -T postgres psql -U whaticket -d whaticket -c "
SELECT count(*) as active_connections 
FROM pg_stat_activity 
WHERE datname = 'whaticket';"

# Tamanho do banco
docker-compose exec -T postgres psql -U whaticket -d whaticket -c "
SELECT pg_size_pretty(pg_database_size('whaticket'));"

# Filas Redis
docker-compose exec -T redis redis-cli INFO keyspace
```

#### Monitor de Erros

```bash
#!/bin/bash
# error-monitor.sh

LOGFILE="/tmp/whaticket-errors.log"
WEBHOOK_URL="https://hooks.slack.com/services/YOUR/WEBHOOK/URL"

# Verificar erros nos últimos 5 minutos
ERRORS=$(docker-compose logs --since="5m" backend | grep -i "error\|exception\|fail" | wc -l)

if [ $ERRORS -gt 10 ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"🚨 ALERT: $ERRORS erros detectados nos últimos 5 minutos\"}" \
        $WEBHOOK_URL
fi

# Log para histórico
echo "$(date): $ERRORS errors detected" >> $LOGFILE
```

### Alertas Customizados

#### Alerta de Disco Cheio

```bash
#!/bin/bash
# disk-alert.sh

DISK_USAGE=$(df / | awk 'NR==2 {print $5}' | sed 's/%//')
THRESHOLD=85

if [ $DISK_USAGE -gt $THRESHOLD ]; then
    curl -X POST -H 'Content-type: application/json' \
        --data "{\"text\":\"⚠️ WARNING: Disco em ${DISK_USAGE}% de uso\"}" \
        $WEBHOOK_URL
        
    # Limpar logs antigos
    find /opt/whaticket/logs -name "*.log" -mtime +7 -delete
    
    # Limpar imagens Docker antigas
    docker system prune -f --volumes
fi
```

## 🔧 Ferramentas de Debug Avançado

### 1. Debug do Node.js

```bash
# Iniciar backend em modo debug
docker-compose run --rm -p 9229:9229 backend node --inspect=0.0.0.0:9229 dist/server.js

# Conectar VSCode ao debugger
# .vscode/launch.json
{
  "type": "node",
  "request": "attach",
  "name": "Docker Debug",
  "remoteRoot": "/app",
  "localRoot": "${workspaceFolder}/backend",
  "port": 9229,
  "restart": true
}
```

### 2. Database Profiling

```sql
-- Habilitar log de queries lentas
ALTER SYSTEM SET log_min_duration_statement = 1000;
SELECT pg_reload_conf();

-- Verificar configuração
SHOW log_min_duration_statement;

-- Analisar queries com EXPLAIN
EXPLAIN (ANALYZE, BUFFERS) 
SELECT * FROM "Tickets" 
WHERE "companyId" = 1 AND "status" = 'open';
```

### 3. Memory Leak Detection

```javascript
// Adicionar ao backend para monitorar memória
setInterval(() => {
  const usage = process.memoryUsage();
  console.log({
    rss: Math.round(usage.rss / 1024 / 1024) + 'MB',
    heapTotal: Math.round(usage.heapTotal / 1024 / 1024) + 'MB',
    heapUsed: Math.round(usage.heapUsed / 1024 / 1024) + 'MB',
    external: Math.round(usage.external / 1024 / 1024) + 'MB',
    timestamp: new Date().toISOString()
  });
}, 30000);
```

## 📚 Recursos Adicionais

### Comandos Úteis

```bash
# Backup antes de debug crítico
docker-compose exec postgres pg_dump -U whaticket whaticket > backup-$(date +%Y%m%d).sql

# Executar SQL diretamente
docker-compose exec postgres psql -U whaticket -d whaticket -c "SELECT version();"

# Verificar variáveis de ambiente
docker-compose config

# Rebuild completo
docker-compose down
docker-compose build --no-cache
docker-compose up -d

# Logs com timestamp
docker-compose logs -t backend

# Seguir logs específicos
docker-compose logs -f backend | grep -i "whatsapp\|session"
```

### Links Úteis

- [**PostgreSQL Troubleshooting**](https://www.postgresql.org/docs/current/server-shutdown.html)
- [**Redis Debugging**](https://redis.io/docs/manual/debugging/)
- [**Docker Compose Logs**](https://docs.docker.com/compose/reference/logs/)
- [**Node.js Debugging**](https://nodejs.org/en/docs/guides/debugging-getting-started/)

---

## 🆘 Suporte de Emergência

### Contatos de Emergência

- 🚨 **Emergência Crítica**: [Sistema Down Procedure](emergency-response.md)
- 📞 **Suporte 24/7**: +55 11 9999-9999
- 💬 **Chat de Emergência**: [Discord/Telegram]
- 📧 **Email Crítico**: emergency@whaticket.com

### Checklist de Emergência

- [ ] Verificar status dos serviços principais
- [ ] Verificar logs de erro
- [ ] Verificar conectividade de rede
- [ ] Verificar espaço em disco
- [ ] Verificar uso de memória
- [ ] Contactar equipe de suporte se necessário
- [ ] Documentar o incidente
- [ ] Implementar correção temporária se possível
- [ ] Agendar correção definitiva

*Este guia está em constante evolução. Contribuições com novos problemas e soluções são sempre bem-vindas!*
