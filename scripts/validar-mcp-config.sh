#!/bin/bash

# 🔍 SCRIPT DE VALIDAÇÃO MCP CONFIG
# Valida as configurações do MCP e conectividade PostgreSQL

echo "🚀 INICIANDO VALIDAÇÃO MCP CONFIG..."
echo "==============================================="

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Função para validar resultado
validar_resultado() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ SUCESSO:${NC} $2"
    else
        echo -e "${RED}❌ FALHA:${NC} $2"
        return 1
    fi
}

echo -e "${BLUE}📋 1. VERIFICANDO ARQUIVO MCP-CONFIG.JSON${NC}"
echo "-----------------------------------------------"

# Verificar se arquivo existe
if [ -f "mcp-config.json" ]; then
    echo -e "${GREEN}✅${NC} Arquivo mcp-config.json encontrado"
else
    echo -e "${RED}❌${NC} Arquivo mcp-config.json não encontrado"
    exit 1
fi

# Verificar sintaxe JSON
jq empty mcp-config.json 2>/dev/null
validar_resultado $? "Sintaxe JSON válida"

echo -e "\n${BLUE}🐳 2. VERIFICANDO DOCKER CONTAINERS${NC}"
echo "-----------------------------------------------"

# Verificar container PostgreSQL
POSTGRES_CONTAINER=$(docker ps | grep postgres | grep whaticket)
if [ ! -z "$POSTGRES_CONTAINER" ]; then
    echo -e "${GREEN}✅${NC} Container PostgreSQL rodando"
    echo "   Container: $(echo $POSTGRES_CONTAINER | awk '{print $1}')"
else
    echo -e "${RED}❌${NC} Container PostgreSQL não está rodando"
fi

echo -e "\n${BLUE}🔌 3. TESTANDO CONECTIVIDADE POSTGRESQL${NC}"
echo "-----------------------------------------------"

# Testar conectividade PostgreSQL
PGPASSWORD=whaticket123 psql -h localhost -U whaticket -d whaticket -c "SELECT 1;" >/dev/null 2>&1
validar_resultado $? "Conectividade PostgreSQL com credenciais corretas"

echo -e "\n${BLUE}📂 4. VERIFICANDO ESTRUTURA DE DIRETÓRIOS${NC}"
echo "-----------------------------------------------"

# Verificar caminho filesystem
FILESYSTEM_PATH="/Users/kalleby/Downloads/simao"
if [ -d "$FILESYSTEM_PATH" ]; then
    echo -e "${GREEN}✅${NC} Diretório filesystem encontrado: $FILESYSTEM_PATH"
else
    echo -e "${RED}❌${NC} Diretório filesystem não encontrado: $FILESYSTEM_PATH"
fi

echo -e "\n${BLUE}🏥 5. VERIFICANDO SERVIÇOS WHATICKET${NC}"
echo "-----------------------------------------------"

# Verificar backend
BACKEND_STATUS=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:8081)
if [ "$BACKEND_STATUS" = "403" ] || [ "$BACKEND_STATUS" = "200" ]; then
    echo -e "${GREEN}✅${NC} Backend Whaticket respondendo (HTTP $BACKEND_STATUS)"
else
    echo -e "${YELLOW}⚠️${NC} Backend Whaticket pode não estar rodando (HTTP $BACKEND_STATUS)"
fi

echo -e "\n${BLUE}🔍 6. ANALISANDO CONFIGURAÇÕES MCP${NC}"
echo "-----------------------------------------------"

# Extrair configurações importantes
POSTGRES_CONN=$(jq -r '.mcpServers.postgres.env.POSTGRES_CONNECTION_STRING' mcp-config.json)
FILESYSTEM_PATH_CONFIG=$(jq -r '.mcpServers.filesystem.args[1]' mcp-config.json)

echo "PostgreSQL Connection String: $POSTGRES_CONN"
echo "Filesystem Path: $FILESYSTEM_PATH_CONFIG"

# Verificar se senha está correta
if [[ $POSTGRES_CONN == *"whaticket123"* ]]; then
    echo -e "${GREEN}✅${NC} Senha PostgreSQL correta na configuração MCP"
else
    echo -e "${RED}❌${NC} Senha PostgreSQL incorreta na configuração MCP"
fi

echo -e "\n${BLUE}📊 RESUMO FINAL${NC}"
echo "==============================================="

# Contador de sucessos
TOTAL_CHECKS=6
SUCCESS_COUNT=0

# Revalidar principais itens
[ -f "mcp-config.json" ] && ((SUCCESS_COUNT++))
[ ! -z "$POSTGRES_CONTAINER" ] && ((SUCCESS_COUNT++))
PGPASSWORD=whaticket123 psql -h localhost -U whaticket -d whaticket -c "SELECT 1;" >/dev/null 2>&1 && ((SUCCESS_COUNT++))
[ -d "$FILESYSTEM_PATH" ] && ((SUCCESS_COUNT++))
[ "$BACKEND_STATUS" = "403" ] || [ "$BACKEND_STATUS" = "200" ] && ((SUCCESS_COUNT++))
[[ $POSTGRES_CONN == *"whaticket123"* ]] && ((SUCCESS_COUNT++))

echo -e "Status: ${SUCCESS_COUNT}/${TOTAL_CHECKS} verificações passaram"

if [ $SUCCESS_COUNT -eq $TOTAL_CHECKS ]; then
    echo -e "${GREEN}🎉 TODAS AS VERIFICAÇÕES PASSARAM!${NC}"
    echo -e "${GREEN}📋 MCP está configurado corretamente${NC}"
    exit 0
else
    echo -e "${YELLOW}⚠️  ALGUMAS VERIFICAÇÕES FALHARAM${NC}"
    echo -e "${YELLOW}📋 Revise as configurações indicadas acima${NC}"
    exit 1
fi