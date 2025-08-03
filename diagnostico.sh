#!/bin/bash

echo "🔍 DIAGNÓSTICO DO SISTEMA WHATICKET"
echo "=================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Verificar Node.js
echo -e "${BLUE}📦 Verificando Node.js...${NC}"
if command -v node >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Node.js versão: $(node --version)${NC}"
else
    echo -e "${RED}❌ Node.js não encontrado${NC}"
    exit 1
fi

# Verificar se PostgreSQL está rodando
echo -e "${BLUE}🗄️  Verificando PostgreSQL...${NC}"
if pgrep -x "postgres" > /dev/null; then
    echo -e "${GREEN}✅ PostgreSQL está rodando${NC}"
else
    echo -e "${RED}❌ PostgreSQL não está rodando${NC}"
    echo -e "${YELLOW}🔧 Tentando iniciar PostgreSQL...${NC}"
    brew services start postgresql@14 || brew services start postgresql
fi

# Verificar se Redis está rodando
echo -e "${BLUE}🔴 Verificando Redis...${NC}"
if pgrep -x "redis-server" > /dev/null; then
    echo -e "${GREEN}✅ Redis está rodando${NC}"
else
    echo -e "${RED}❌ Redis não está rodando${NC}"
    echo -e "${YELLOW}🔧 Tentando iniciar Redis...${NC}"
    brew services start redis
fi

# Verificar conexão com banco
echo -e "${BLUE}🔌 Testando conexão com banco...${NC}"
if psql -U kalleby -d mestres_cafe -c "SELECT 1;" >/dev/null 2>&1; then
    echo -e "${GREEN}✅ Conexão com banco OK${NC}"
else
    echo -e "${RED}❌ Não foi possível conectar ao banco${NC}"
    echo -e "${YELLOW}🔧 Tentando criar banco...${NC}"
    createdb -U kalleby mestres_cafe 2>/dev/null || echo "Banco já existe ou erro na criação"
fi

# Verificar portas
echo -e "${BLUE}🌐 Verificando portas...${NC}"
if lsof -i :3000 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Porta 3000 já está em uso${NC}"
    lsof -i :3000
else
    echo -e "${GREEN}✅ Porta 3000 disponível${NC}"
fi

if lsof -i :8081 >/dev/null 2>&1; then
    echo -e "${YELLOW}⚠️  Porta 8081 já está em uso${NC}"
    lsof -i :8081
else
    echo -e "${GREEN}✅ Porta 8081 disponível${NC}"
fi

# Verificar dependências do backend
echo -e "${BLUE}📦 Verificando dependências do backend...${NC}"
if [ -d "whaticket/backend/node_modules" ]; then
    echo -e "${GREEN}✅ node_modules do backend existe${NC}"
else
    echo -e "${RED}❌ node_modules do backend não encontrado${NC}"
fi

# Verificar dependências do frontend
echo -e "${BLUE}📦 Verificando dependências do frontend...${NC}"
if [ -d "whaticket/frontend/node_modules" ]; then
    echo -e "${GREEN}✅ node_modules do frontend existe${NC}"
else
    echo -e "${RED}❌ node_modules do frontend não encontrado${NC}"
fi

echo ""
echo -e "${BLUE}🚀 PRÓXIMOS PASSOS:${NC}"
echo "1. Se houver erros acima, corrija-os primeiro"
echo "2. Execute: ./iniciar-sistema.sh"
echo "3. Aguarde os serviços subirem (pode demorar 30-60s)"
echo "4. Acesse: http://localhost:3000"