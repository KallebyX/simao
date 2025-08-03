#!/bin/bash

echo "🚀 Configurando Whaticket para ambiente local macOS..."

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para verificar se um comando existe
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Verificar se o Node.js está instalado
echo -e "${BLUE}Verificando dependências...${NC}"
if ! command_exists node; then
    echo -e "${RED}❌ Node.js não encontrado. Instalando via Homebrew...${NC}"
    if ! command_exists brew; then
        echo -e "${RED}❌ Homebrew não encontrado. Instale primeiro: https://brew.sh${NC}"
        exit 1
    fi
    brew install node
fi

# Verificar se o PostgreSQL está instalado
if ! command_exists psql; then
    echo -e "${YELLOW}⚠️  PostgreSQL não encontrado. Instalando via Homebrew...${NC}"
    brew install postgresql@14
    brew services start postgresql@14
fi

# Verificar se o Redis está instalado
if ! command_exists redis-server; then
    echo -e "${YELLOW}⚠️  Redis não encontrado. Instalando via Homebrew...${NC}"
    brew install redis
    brew services start redis
fi

# Verificar versões
echo -e "${GREEN}✅ Node.js versão: $(node --version)${NC}"
echo -e "${GREEN}✅ npm versão: $(npm --version)${NC}"

# Instalar dependências do backend
echo -e "${BLUE}📦 Instalando dependências do backend...${NC}"
cd whaticket/backend
npm install --legacy-peer-deps

# Instalar dependências do frontend
echo -e "${BLUE}📦 Instalando dependências do frontend...${NC}"
cd ../frontend
npm install --legacy-peer-deps

# Voltar para o diretório raiz
cd ../..

# Configurar banco de dados
echo -e "${BLUE}🗄️  Configurando banco de dados...${NC}"
cd whaticket/backend

# Criar banco de dados se não existir
psql -U kalleby -d postgres -c "CREATE DATABASE mestres_cafe;" 2>/dev/null || echo "Banco já existe ou erro na criação"

# Executar migrações
echo -e "${BLUE}🔄 Executando migrações...${NC}"
npm run build
npm run db:migrate

# Executar seeds
echo -e "${BLUE}🌱 Executando seeds...${NC}"
npm run db:seed

cd ../..

# Criar arquivo de ambiente do frontend se não existir
if [ ! -f "whaticket/frontend/.env" ]; then
    echo -e "${BLUE}📝 Criando arquivo .env do frontend...${NC}"
    cat > whaticket/frontend/.env << EOL
REACT_APP_BACKEND_URL=http://localhost:8081
GENERATE_SOURCEMAP=false
EOL
fi

echo -e "${GREEN}✅ Setup concluído!${NC}"
echo -e "${YELLOW}📋 Para iniciar o sistema:${NC}"
echo -e "${BLUE}Backend:${NC} cd whaticket/backend && npm run dev"
echo -e "${BLUE}Frontend:${NC} cd whaticket/frontend && npm start"
echo ""
echo -e "${YELLOW}🌐 URLs de acesso:${NC}"
echo -e "${BLUE}Frontend:${NC} http://localhost:3000"
echo -e "${BLUE}Backend:${NC} http://localhost:8081"
echo -e "${BLUE}PostgreSQL:${NC} postgresql://kalleby:mestres123@localhost:5432/mestres_cafe"
echo -e "${BLUE}Redis:${NC} redis://localhost:6379"