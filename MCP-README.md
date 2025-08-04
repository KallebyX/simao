# MCP Tools - Whaticket

## 📋 Visão Geral

Este projeto foi configurado com ferramentas MCP (Model Context Protocol) para facilitar o desenvolvimento, debug e manutenção do sistema Whaticket.

## 🛠️ Ferramentas Instaladas

### ✅ Instaladas e Configuradas

- **@modelcontextprotocol/server-filesystem** - Acesso ao sistema de arquivos
- **@modelcontextprotocol/server-postgres** - Integração com PostgreSQL
- **puppeteer-mcp-server** - Automação de navegador para testes
- **@modelcontextprotocol/sdk** - SDK para desenvolvimento MCP

## 📁 Arquivos de Configuração

- [`mcp-config.json`](mcp-config.json) - Configuração principal dos servidores MCP
- [`scripts/mcp-start.sh`](scripts/mcp-start.sh) - Script para iniciar servidores MCP
- [`scripts/mcp-stop.sh`](scripts/mcp-stop.sh) - Script para parar servidores MCP
- [`scripts/mcp-test.sh`](scripts/mcp-test.sh) - Script para testar instalação

## 🚀 Uso Rápido

### Iniciar todos os servidores MCP
```bash
./scripts/mcp-start.sh
```

### Parar todos os servidores MCP
```bash
./scripts/mcp-stop.sh
```

### Verificar status
```bash
./scripts/mcp-stop.sh status
```

### Executar testes
```bash
./scripts/mcp-test.sh
```

## 📚 Documentação Detalhada

Para informações completas sobre configuração, uso avançado e troubleshooting, consulte:

- **[Guia MCP Tools](docs/development/mcp-tools.md)** - Documentação completa
- **[Guia de Desenvolvimento](docs/development/README.md)** - Processo de desenvolvimento
- **[Troubleshooting](docs/troubleshooting/README.md)** - Solução de problemas

## 🎯 Funcionalidades Principais

### 🗂️ Filesystem MCP
- Acesso aos arquivos do projeto
- Navegação inteligente na estrutura
- Operações de leitura/escrita assistidas

### 🐘 PostgreSQL MCP  
- Consultas SQL assistidas
- Análise de estrutura do banco
- Debug de queries e performance

### 🤖 Puppeteer MCP
- Testes automatizados do frontend
- Debug visual de interfaces
- Captura de screenshots e logs

## ⚡ Instalação Verificada

```
✅ TODOS OS TESTES PASSARAM!

✓ @modelcontextprotocol/server-filesystem instalado
✓ @modelcontextprotocol/server-postgres instalado  
✓ puppeteer-mcp-server instalado
✓ @modelcontextprotocol/sdk instalado
✓ Arquivos de configuração válidos
✓ Scripts executáveis funcionais
✓ Testes de integração aprovados
```

## 🔧 Configuração para Desenvolvimento

### Variáveis de Ambiente
```bash
# PostgreSQL (já configurado em mcp-config.json)
POSTGRES_CONNECTION_STRING="postgresql://whaticket:whaticket@localhost:5432/whaticket"

# Filesystem (configurado automaticamente)
PROJECT_ROOT="/workspaces/simao"
```

### Integração com Editor
As ferramentas MCP podem ser integradas com editores compatíveis para:
- Assistência inteligente de código
- Debug contextual
- Análise automática de problemas

## 📞 Suporte

Para dúvidas ou problemas:
1. Consulte a [documentação completa](docs/development/mcp-tools.md)
2. Execute `./scripts/mcp-test.sh` para diagnóstico
3. Verifique os logs em [troubleshooting](docs/troubleshooting/README.md)

---

**Projeto Whaticket** - Sistema Multi-tenant de Atendimento WhatsApp  
Desenvolvido com ❤️ para facilitar o atendimento ao cliente