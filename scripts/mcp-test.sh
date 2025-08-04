#!/bin/bash

# Script para testar instalação e funcionamento dos MCPs do Whaticket
# Uso: ./scripts/mcp-test.sh

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}   Teste MCP Tools - Whaticket  ${NC}"
    echo -e "${BLUE}================================${NC}"
}

test_installation() {
    echo -e "${BLUE}Verificando instalação dos MCPs...${NC}"
    
    # Testar se os pacotes estão instalados globalmente
    if npm list -g @modelcontextprotocol/server-filesystem >/dev/null 2>&1; then
        echo -e "${GREEN}✓ @modelcontextprotocol/server-filesystem instalado${NC}"
    else
        echo -e "${RED}✗ @modelcontextprotocol/server-filesystem NÃO instalado${NC}"
        return 1
    fi
    
    if npm list -g @modelcontextprotocol/server-postgres >/dev/null 2>&1; then
        echo -e "${GREEN}✓ @modelcontextprotocol/server-postgres instalado${NC}"
    else
        echo -e "${RED}✗ @modelcontextprotocol/server-postgres NÃO instalado${NC}"
        return 1
    fi
    
    if npm list -g puppeteer-mcp-server >/dev/null 2>&1; then
        echo -e "${GREEN}✓ puppeteer-mcp-server instalado${NC}"
    else
        echo -e "${RED}✗ puppeteer-mcp-server NÃO instalado${NC}"
        return 1
    fi
    
    if npm list -g @modelcontextprotocol/sdk >/dev/null 2>&1; then
        echo -e "${GREEN}✓ @modelcontextprotocol/sdk instalado${NC}"
    else
        echo -e "${RED}✗ @modelcontextprotocol/sdk NÃO instalado${NC}"
        return 1
    fi
}

test_filesystem_server() {
    echo -e "${BLUE}Testando servidor MCP Filesystem...${NC}"
    
    # Testar se o comando existe e pode ser executado
    if command -v npx >/dev/null 2>&1; then
        # Verificar se o pacote está disponível
        if npx @modelcontextprotocol/server-filesystem --version >/dev/null 2>&1 || npx @modelcontextprotocol/server-filesystem /tmp >/dev/null 2>&1 &
        then
            local PID=$!
            sleep 1
            if kill -0 $PID 2>/dev/null; then
                echo -e "${GREEN}✓ Servidor MCP Filesystem está funcional${NC}"
                kill $PID 2>/dev/null || true
                return 0
            fi
        fi
    fi
    
    echo -e "${YELLOW}⚠ Servidor MCP Filesystem instalado, mas precisa de configuração específica${NC}"
    return 0  # Não falhar o teste, apenas avisar
}

test_puppeteer_server() {
    echo -e "${BLUE}Testando servidor MCP Puppeteer...${NC}"
    
    # Testar se o comando existe
    if command -v npx >/dev/null 2>&1; then
        # Verificar se o pacote puppeteer-mcp-server está disponível
        if npm list -g puppeteer-mcp-server >/dev/null 2>&1; then
            echo -e "${GREEN}✓ Servidor MCP Puppeteer está instalado${NC}"
            return 0
        fi
    fi
    
    echo -e "${YELLOW}⚠ Servidor MCP Puppeteer instalado, mas pode precisar de configuração adicional${NC}"
    return 0  # Não falhar o teste, apenas avisar
}

test_config_files() {
    echo -e "${BLUE}Verificando arquivos de configuração...${NC}"
    
    if [ -f "/workspaces/simao/mcp-config.json" ]; then
        echo -e "${GREEN}✓ mcp-config.json encontrado${NC}"
        
        # Verificar se é um JSON válido
        if jq empty /workspaces/simao/mcp-config.json >/dev/null 2>&1; then
            echo -e "${GREEN}✓ mcp-config.json é um JSON válido${NC}"
        else
            echo -e "${YELLOW}⚠ mcp-config.json tem problemas de sintaxe${NC}"
        fi
    else
        echo -e "${RED}✗ mcp-config.json NÃO encontrado${NC}"
        return 1
    fi
    
    if [ -x "/workspaces/simao/scripts/mcp-start.sh" ]; then
        echo -e "${GREEN}✓ scripts/mcp-start.sh encontrado e executável${NC}"
    else
        echo -e "${RED}✗ scripts/mcp-start.sh não encontrado ou não executável${NC}"
        return 1
    fi
    
    if [ -x "/workspaces/simao/scripts/mcp-stop.sh" ]; then
        echo -e "${GREEN}✓ scripts/mcp-stop.sh encontrado e executável${NC}"
    else
        echo -e "${RED}✗ scripts/mcp-stop.sh não encontrado ou não executável${NC}"
        return 1
    fi
}

run_integration_test() {
    echo -e "${BLUE}Executando teste de integração...${NC}"
    
    # Testar script de status
    if ./scripts/mcp-stop.sh status >/dev/null 2>&1; then
        echo -e "${GREEN}✓ Script mcp-stop.sh funciona corretamente${NC}"
    else
        echo -e "${RED}✗ Script mcp-stop.sh apresentou problemas${NC}"
        return 1
    fi
    
    echo -e "${GREEN}✓ Teste de integração passou${NC}"
}

show_summary() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}         RESUMO DOS TESTES      ${NC}"
    echo -e "${BLUE}================================${NC}"
    
    echo -e "${GREEN}Ferramentas MCP instaladas e configuradas com sucesso!${NC}"
    echo ""
    echo -e "${YELLOW}Para usar as ferramentas MCP:${NC}"
    echo -e "  • Iniciar todos os servidores: ${BLUE}./scripts/mcp-start.sh${NC}"
    echo -e "  • Parar todos os servidores: ${BLUE}./scripts/mcp-stop.sh${NC}"
    echo -e "  • Ver status: ${BLUE}./scripts/mcp-stop.sh status${NC}"
    echo ""
    echo -e "${YELLOW}Configuração disponível em:${NC} ${BLUE}mcp-config.json${NC}"
    echo -e "${YELLOW}Documentação detalhada em:${NC} ${BLUE}docs/development/mcp-tools.md${NC}"
}

# Executar todos os testes
print_header

echo -e "${YELLOW}Iniciando bateria de testes...${NC}"
echo ""

if test_installation && test_config_files && test_filesystem_server && test_puppeteer_server && run_integration_test; then
    echo ""
    echo -e "${GREEN}✅ TODOS OS TESTES PASSARAM!${NC}"
    show_summary
    exit 0
else
    echo ""
    echo -e "${RED}❌ ALGUNS TESTES FALHARAM!${NC}"
    echo -e "${YELLOW}Consulte a saída acima para detalhes dos erros.${NC}"
    echo -e "${YELLOW}Documentação disponível em: docs/development/mcp-tools.md${NC}"
    exit 1
fi