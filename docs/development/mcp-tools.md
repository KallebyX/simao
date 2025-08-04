# 🔧 Melhores MCPs para Desenvolvimento e Debug

Guia completo dos MCPs (Model Context Protocol) mais úteis para desenvolvimento, debug e operação do sistema Whaticket.

## 🎯 MCPs Essenciais para Whaticket

### 1. 🐛 Debug e Desenvolvimento

#### **@modelcontextprotocol/server-filesystem**
```bash
npm install @modelcontextprotocol/server-filesystem
```

**Uso no Whaticket:**
- Análise de logs em tempo real
- Navegação na estrutura de arquivos
- Debug de sessões WhatsApp
- Análise de uploads e mídias

**Configuração:**
```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/opt/whaticket"],
      "env": {
        "ALLOWED_OPERATIONS": "read,write,list"
      }
    }
  }
}
```

#### **@modelcontextprotocol/server-git**
```bash
npm install @modelcontextprotocol/server-git
```

**Uso no Whaticket:**
- Análise de commits e mudanças
- Debug de problemas introduzidos
- Comparação entre versões
- Análise de branches de desenvolvimento

**Configuração:**
```json
{
  "mcpServers": {
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/opt/whaticket"]
    }
  }
}
```

### 2. 🗄️ Banco de Dados

#### **@modelcontextprotocol/server-postgres**
```bash
npm install @modelcontextprotocol/server-postgres
```

**Uso no Whaticket:**
- Debug de queries Sequelize
- Análise de performance de consultas
- Verificação de integridade de dados
- Troubleshooting de multi-tenancy

**Configuração:**
```json
{
  "mcpServers": {
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://whaticket:password@localhost:5432/whaticket"
      }
    }
  }
}
```

**Queries úteis para debug:**
```sql
-- Verificar tickets órfãos
SELECT t.id, t.status, c.name, w.name as whatsapp
FROM "Tickets" t 
LEFT JOIN "Contacts" c ON c.id = t."contactId"
LEFT JOIN "Whatsapps" w ON w.id = t."whatsappId"
WHERE t."companyId" = 1 AND t.status = 'open';

-- Performance de mensagens
SELECT 
  DATE_TRUNC('hour', "createdAt") as hour,
  COUNT(*) as message_count,
  AVG(EXTRACT(EPOCH FROM ("updatedAt" - "createdAt"))) as avg_processing_time
FROM "Messages"
WHERE "createdAt" >= NOW() - INTERVAL '24 hours'
GROUP BY hour
ORDER BY hour DESC;
```

### 3. 🌐 Web e APIs

#### **@modelcontextprotocol/server-fetch**
```bash
npm install @modelcontextprotocol/server-fetch
```

**Uso no Whaticket:**
- Debug de integrações externas (OpenAI, Dialogflow)
- Teste de webhooks
- Monitoramento de APIs de terceiros
- Verificação de endpoints do sistema

**Exemplos de uso:**
```javascript
// Testar API do OpenAI
const response = await fetch('https://api.openai.com/v1/chat/completions', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer sk-...',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    model: 'gpt-3.5-turbo',
    messages: [{ role: 'user', content: 'Test message' }]
  })
});

// Verificar health check do Whaticket
const health = await fetch('http://localhost:8080/health');
const status = await health.json();
```

#### **@modelcontextprotocol/server-puppeteer**
```bash
npm install @modelcontextprotocol/server-puppeteer
```

**Uso no Whaticket:**
- Debug do WhatsApp Web
- Captura de QR codes
- Análise de problemas de interface
- Testes end-to-end

### 4. 📊 Monitoramento e Logs

#### **@modelcontextprotocol/server-docker**
```bash
npm install @modelcontextprotocol/server-docker
```

**Uso no Whaticket:**
- Monitoramento de containers
- Debug de problemas de deployment
- Análise de uso de recursos
- Restart automatizado de serviços

**Comandos úteis:**
```bash
# Verificar status dos containers
docker ps --filter "name=whaticket"

# Logs em tempo real
docker logs -f whaticket_backend

# Estatísticas de uso
docker stats whaticket_backend whaticket_postgres whaticket_redis
```

### 5. 🔄 Automação e CI/CD

#### **@modelcontextprotocol/server-github**
```bash
npm install @modelcontextprotocol/server-github
```

**Uso no Whaticket:**
- Análise de issues e PRs
- Debug de problemas reportados
- Monitoramento de releases
- Análise de dependências

#### **@modelcontextprotocol/server-slack**
```bash
npm install @modelcontextprotocol/server-slack
```

**Uso no Whaticket:**
- Alertas de produção
- Notificações de deploy
- Colaboração em debug
- Escalação de problemas críticos

## 🛠️ MCPs Específicos para WhatsApp

### **Custom WhatsApp MCP**

Criação de um MCP personalizado para debug do WhatsApp:

```typescript
// mcp-whatsapp-debug.ts
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { CallToolRequestSchema, ListToolsRequestSchema } from '@modelcontextprotocol/sdk/types.js';

class WhatsAppDebugServer {
  private server: Server;

  constructor() {
    this.server = new Server(
      {
        name: 'whatsapp-debug',
        version: '1.0.0',
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: 'check_whatsapp_sessions',
          description: 'Verificar status das sessões WhatsApp',
          inputSchema: {
            type: 'object',
            properties: {
              companyId: { type: 'number', description: 'ID da empresa' }
            }
          }
        },
        {
          name: 'analyze_message_flow',
          description: 'Analisar fluxo de mensagens de um ticket',
          inputSchema: {
            type: 'object',
            properties: {
              ticketId: { type: 'number', description: 'ID do ticket' }
            }
          }
        },
        {
          name: 'debug_connection_issues',
          description: 'Debug de problemas de conexão WhatsApp',
          inputSchema: {
            type: 'object',
            properties: {
              whatsappId: { type: 'number', description: 'ID da conexão WhatsApp' }
            }
          }
        }
      ]
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      const { name, arguments: args } = request.params;

      switch (name) {
        case 'check_whatsapp_sessions':
          return this.checkWhatsAppSessions(args.companyId);
        case 'analyze_message_flow':
          return this.analyzeMessageFlow(args.ticketId);
        case 'debug_connection_issues':
          return this.debugConnectionIssues(args.whatsappId);
        default:
          throw new Error(`Unknown tool: ${name}`);
      }
    });
  }

  private async checkWhatsAppSessions(companyId: number) {
    // Implementar verificação de sessões
    const sessions = await this.getWbotSessions(companyId);
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify(sessions, null, 2)
        }
      ]
    };
  }

  private async analyzeMessageFlow(ticketId: number) {
    // Implementar análise de fluxo de mensagens
    const messages = await this.getTicketMessages(ticketId);
    const analysis = this.analyzeMessages(messages);
    
    return {
      content: [
        {
          type: 'text',
          text: `Análise do ticket ${ticketId}:\n${JSON.stringify(analysis, null, 2)}`
        }
      ]
    };
  }

  private async debugConnectionIssues(whatsappId: number) {
    // Implementar debug de conexão
    const diagnostics = await this.runConnectionDiagnostics(whatsappId);
    
    return {
      content: [
        {
          type: 'text',
          text: `Diagnóstico da conexão ${whatsappId}:\n${JSON.stringify(diagnostics, null, 2)}`
        }
      ]
    };
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
  }
}

// Executar o servidor
const server = new WhatsAppDebugServer();
server.run().catch(console.error);
```

## 🎯 Configuração Completa para Desenvolvimento

### **MCP Configuration File**

```json
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "/opt/whaticket"],
      "env": {
        "ALLOWED_OPERATIONS": "read,write,list"
      }
    },
    "postgres": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-postgres"],
      "env": {
        "POSTGRES_CONNECTION_STRING": "postgresql://whaticket:password@localhost:5432/whaticket"
      }
    },
    "git": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-git", "--repository", "/opt/whaticket"]
    },
    "docker": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-docker"]
    },
    "fetch": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-fetch"]
    },
    "whatsapp-debug": {
      "command": "node",
      "args": ["./tools/mcp-whatsapp-debug.js"],
      "cwd": "/opt/whaticket"
    }
  }
}
```

## 🚀 Workflows de Debug com MCPs

### **Workflow 1: Debug de Problema de Mensagens**

```markdown
1. **Filesystem MCP**: Verificar logs de erro
   - `tail -f logs/error.log`
   - Identificar patterns de erro

2. **Postgres MCP**: Analisar dados
   - Verificar mensagens órfãs
   - Checar integridade de tickets

3. **WhatsApp Debug MCP**: Diagnóstico específico
   - Status das sessões
   - Análise de fluxo de mensagens

4. **Docker MCP**: Verificar recursos
   - Uso de CPU/memória
   - Status dos containers
```

### **Workflow 2: Debug de Performance**

```markdown
1. **Postgres MCP**: Queries lentas
   ```sql
   SELECT query, mean_exec_time, calls 
   FROM pg_stat_statements 
   ORDER BY mean_exec_time DESC 
   LIMIT 10;
   ```

2. **Docker MCP**: Recursos do sistema
   ```bash
   docker stats --no-stream
   ```

3. **Filesystem MCP**: Análise de logs
   - Patterns de performance
   - Gargalos identificados

4. **Fetch MCP**: Teste de endpoints
   - Tempo de resposta da API
   - Health checks
```

### **Workflow 3: Debug de Integração**

```markdown
1. **Fetch MCP**: Testar APIs externas
   - OpenAI responses
   - Webhook deliveries

2. **Git MCP**: Análise de mudanças
   - Commits recentes
   - Alterações em integrações

3. **Filesystem MCP**: Logs de integração
   - Erros de API
   - Rate limiting issues

4. **Postgres MCP**: Dados de integração
   - Status de webhooks
   - Logs de requisições
```

## 📊 Monitoramento Contínuo

### **Script de Monitoramento com MCPs**

```bash
#!/bin/bash
# monitor-with-mcps.sh

echo "=== WHATICKET MONITORING WITH MCPS ==="

# 1. Check system health via Docker MCP
echo "🐳 Container Status:"
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"

# 2. Check database via Postgres MCP
echo "📊 Database Metrics:"
echo "Active connections, recent errors, slow queries"

# 3. Check filesystem via Filesystem MCP
echo "📁 Log Analysis:"
echo "Recent errors, disk usage, file permissions"

# 4. Check WhatsApp sessions via Custom MCP
echo "📱 WhatsApp Status:"
echo "Connected sessions, recent messages, error rates"

echo "==============================="
```

## 🎯 MCPs por Caso de Uso

| Caso de Uso | MCPs Recomendados | Prioridade |
|-------------|-------------------|------------|
| **Debug de Mensagens** | WhatsApp Debug, Postgres, Filesystem | Alta |
| **Performance Issues** | Docker, Postgres, Filesystem | Alta |
| **Problemas de Deploy** | Docker, Git, GitHub | Média |
| **Integração com APIs** | Fetch, Filesystem (logs) | Média |
| **Monitoramento** | Docker, Postgres, Slack | Alta |
| **Desenvolvimento** | Git, Filesystem, Postgres | Alta |

## 📚 Recursos e Links

### **Documentação MCP**
- [MCP Specification](https://modelcontextprotocol.io/docs)
- [Available Servers](https://github.com/modelcontextprotocol/servers)
- [Custom Server Guide](https://modelcontextprotocol.io/docs/guides/building-a-server)

### **Tools para Whaticket**
- [Debug Scripts](../troubleshooting/debug-scripts.md)
- [Monitoring Setup](../production/monitoring.md)
- [API Testing](../api/testing.md)

---

## 🚀 Getting Started

### **Instalação Rápida**

```bash
# Instalar MCPs essenciais
npm install -g @modelcontextprotocol/server-filesystem
npm install -g @modelcontextprotocol/server-postgres
npm install -g @modelcontextprotocol/server-docker
npm install -g @modelcontextprotocol/server-git

# Configurar no Claude Desktop
# Editar ~/.config/Claude/claude_desktop_config.json
```

### **Teste de Configuração**

```bash
# Verificar se MCPs estão funcionando
npx @modelcontextprotocol/server-filesystem --version
npx @modelcontextprotocol/server-postgres --help
```

*Os MCPs listados transformarão significativamente sua capacidade de debug e desenvolvimento com o sistema Whaticket, fornecendo insights profundos e automação de tarefas repetitivas.*