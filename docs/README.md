# 📚 Documentação Técnica Whaticket

Bem-vindo à documentação completa do sistema Whaticket - uma plataforma empresarial de atendimento multi-tenant via WhatsApp com recursos avançados de automação e IA.

## 🚀 Visão Geral

Whaticket é um sistema robusto de CRM conversacional que oferece:
- **Multi-tenancy**: Isolamento completo por empresa
- **Integração WhatsApp**: Conectividade completa via Baileys
- **IA Integrada**: OpenAI, Dialogflow, Typebot
- **Chatbots Visuais**: FlowBuilder para automação
- **Real-time**: Socket.IO para comunicação instantânea
- **Escalabilidade**: Arquitetura baseada em microserviços

## 📖 Estrutura da Documentação

### 🏗️ Arquitetura e Setup
- [**Arquitetura do Sistema**](architecture/README.md) - Visão completa da arquitetura
- [**Instalação e Configuração**](installation/README.md) - Setup completo do ambiente
- [**Configuração de Banco de Dados**](database/README.md) - PostgreSQL e migrações

### 💻 Desenvolvimento
- [**Guia de Desenvolvimento**](development/README.md) - Ambiente de desenvolvimento
- [**API Reference**](api/README.md) - Documentação completa das APIs
- [**Estrutura do Código**](codebase/README.md) - Organização e padrões

### 🚀 Produção
- [**Deploy em Produção**](production/README.md) - Procedimentos de deployment
- [**Monitoramento**](monitoring/README.md) - Logs, métricas e alertas
- [**Segurança**](security/README.md) - Configurações de segurança

### 🔧 Operação
- [**Troubleshooting**](troubleshooting/README.md) - Diagnóstico e resolução
- [**Manutenção**](maintenance/README.md) - Rotinas de manutenção
- [**Backup e Recovery**](backup/README.md) - Procedimentos de backup

### 🔌 Integrações
- [**WhatsApp**](integrations/whatsapp/README.md) - Configuração WhatsApp Business
- [**IA e Chatbots**](integrations/ai/README.md) - OpenAI, Dialogflow, Typebot
- [**Pagamentos**](integrations/payments/README.md) - MercadoPago, Stripe
- [**APIs Externas**](integrations/external/README.md) - Outras integrações

## 🎯 Guias Rápidos

| Perfil | Guia Recomendado |
|--------|------------------|
| **Desenvolvedor** | [Setup Dev](installation/development.md) → [API Docs](api/README.md) → [Debug Guide](troubleshooting/debugging.md) |
| **DevOps** | [Production Setup](production/deployment.md) → [Monitoring](monitoring/README.md) → [Security](security/README.md) |
| **Admin Sistema** | [User Management](administration/users.md) → [Company Management](administration/companies.md) → [System Config](administration/settings.md) |

## 📊 Estatísticas do Sistema

- **Backend**: Node.js + TypeScript (40+ serviços)
- **Frontend**: React 18 + Material-UI v5
- **Database**: PostgreSQL com 150+ migrações
- **Integrações**: 10+ APIs externas
- **Componentes**: 200+ componentes React
- **Testes**: Cobertura em desenvolvimento

## 🆘 Suporte Rápido

- 🐛 **Bug Reports**: [Troubleshooting Guide](troubleshooting/README.md)
- 📝 **Feature Requests**: [Development Guide](development/contributing.md)
- 🔒 **Questões de Segurança**: [Security Guide](security/README.md)
- 📈 **Performance Issues**: [Monitoring Guide](monitoring/performance.md)

---

## 📄 Versão da Documentação

**Versão**: 1.0.0  
**Última Atualização**: Janeiro 2025  
**Sistema Analisado**: Whaticket v2.2.2v-26  
**Compatibilidade**: Node.js 18+, PostgreSQL 12+, Redis 6+

---

*Esta documentação foi gerada através de análise automatizada do código-fonte e validada com a arquitetura real do sistema.*