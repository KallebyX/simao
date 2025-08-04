# ❓ FAQ - Perguntas Frequentes

Respostas para as perguntas mais comuns sobre o sistema Whaticket, organizadas por categoria para facilitar a busca.

## 🎯 Navegação Rápida

| Categoria | Descrição | Link Direto |
|-----------|-----------|-------------|
| 🚀 **Geral** | Perguntas básicas sobre o sistema | [Ver seção](#-geral) |
| 🔐 **Login e Acesso** | Problemas de autenticação | [Ver seção](#-login-e-acesso) |
| 📱 **WhatsApp** | Conexão e funcionamento | [Ver seção](#-whatsapp) |
| 🤖 **Chatbots** | Automação e IA | [Ver seção](#-chatbots-e-automação) |
| 👥 **Usuários** | Gerenciamento de usuários | [Ver seção](#-usuários-e-permissões) |
| 🎫 **Tickets** | Atendimento e tickets | [Ver seção](#-tickets-e-atendimento) |
| 📊 **Relatórios** | Dashboards e métricas | [Ver seção](#-relatórios-e-dashboards) |
| 🔧 **Técnico** | Questões técnicas | [Ver seção](#-questões-técnicas) |
| 💰 **Planos** | Cobrança e limitações | [Ver seção](#-planos-e-cobrança) |

---

## 🚀 Geral

### O que é o Whaticket?

**R:** O Whaticket é uma plataforma completa de atendimento ao cliente via WhatsApp, com recursos de:
- ✅ Multi-tenancy (múltiplas empresas)
- ✅ Chatbots inteligentes com IA
- ✅ Dashboard com métricas em tempo real
- ✅ Integração com CRM e outras ferramentas
- ✅ Campanhas de marketing em massa
- ✅ Sistema de filas e roteamento inteligente

### Quais são os principais recursos?

**R:** Os recursos principais incluem:

**Atendimento:**
- Múltiplas conexões WhatsApp
- Sistema de filas inteligente
- Transferência de tickets
- Mensagens rápidas (templates)
- Histórico completo de conversas

**Automação:**
- Chatbots com FlowBuilder visual
- Respostas automáticas
- Horário de funcionamento
- Roteamento por palavras-chave
- Integração com OpenAI/Dialogflow

**Gestão:**
- Dashboard com métricas
- Relatórios detalhados
- Gerenciamento de usuários
- Tags e categorização
- Campanhas de marketing

### O sistema é gratuito?

**R:** Existem duas versões:
- **Community (Gratuita)**: Versão open-source com recursos básicos
- **Premium (Paga)**: Versão com recursos avançados, suporte e atualizações

**Limitações da versão Community:**
- Máximo de 2 conexões WhatsApp
- Recursos básicos de chatbot
- Suporte apenas via comunidade
- Sem atualizações automáticas

### Como posso testar o sistema?

**R:** Você pode:
1. **Demo Online**: Acesse nossa [demo interativa](https://demo.whaticket.com)
2. **Instalação Local**: Siga o [guia de instalação](../installation/README.md)
3. **Docker**: Use `docker-compose up` para teste rápido
4. **Trial Premium**: 30 dias grátis da versão premium

---

## 🔐 Login e Acesso

### Esqueci minha senha, como recuperar?

**R:** Para recuperar a senha:

1. **Na tela de login**, clique em "Esqueci minha senha"
2. **Digite seu email** cadastrado
3. **Verifique seu email** para receber o link de redefinição
4. **Clique no link** e defina uma nova senha

**Se não recebeu o email:**
- Verifique a pasta de spam/lixo eletrônico
- Confirme se o email está correto
- Entre em contato com o administrador do sistema

### Não consigo fazer login, o que fazer?

**R:** Possíveis soluções:

**Verificar credenciais:**
```
✅ Email correto (sem espaços)
✅ Senha correta (cuidado com maiúsculas/minúsculas)
✅ Caps Lock desligado
```

**Problemas técnicos:**
- Limpe o cache do navegador (Ctrl + Shift + Delete)
- Tente em modo anônimo/privado
- Teste em outro navegador
- Verifique sua conexão com a internet

**Se persistir:**
- Entre em contato com o administrador
- Verifique se sua conta não foi desativada

### Como alterar minha senha?

**R:** Para alterar a senha:

1. **Faça login** no sistema
2. **Clique no seu nome** no canto superior direito
3. **Selecione "Perfil"** ou "Configurações"
4. **Vá para "Alterar Senha"**
5. **Digite a senha atual** e a nova senha
6. **Confirme** a alteração

**Dicas para senha segura:**
- Mínimo 8 caracteres
- Combine letras, números e símbolos
- Não use informações pessoais
- Altere periodicamente

### O sistema tem autenticação em dois fatores (2FA)?

**R:** Sim, o sistema suporta 2FA:

**Para habilitar:**
1. Vá em **Perfil** → **Segurança**
2. Clique em **"Habilitar 2FA"**
3. Escaneie o **QR Code** com Google Authenticator ou similar
4. Digite o **código de verificação** para confirmar

**Apps recomendados:**
- Google Authenticator
- Microsoft Authenticator
- Authy

---

## 📱 WhatsApp

### Como conectar o WhatsApp ao sistema?

**R:** Para conectar o WhatsApp:

1. **No menu**, vá em **Conexões** → **WhatsApp**
2. **Clique em "Nova Conexão"**
3. **Digite um nome** para a conexão
4. **Escaneie o QR Code** que aparecerá na tela
5. **Aguarde** a confirmação de conexão

**⚠️ Importante:**
- Use um número dedicado para o negócio
- Não use o WhatsApp pessoal
- Mantenha o celular conectado à internet

### O WhatsApp desconecta constantemente, por quê?

**R:** Principais causas e soluções:

**Problemas de conectividade:**
- ✅ Verifique a conexão com a internet
- ✅ Reinicie o roteador/modem
- ✅ Teste com outro dispositivo

**Configurações do WhatsApp:**
- ✅ Desative o WhatsApp Web em outros locais
- ✅ Mantenha o app atualizado no celular
- ✅ Não use o número em outros sistemas

**Configurações do servidor:**
- ✅ Verifique os logs do sistema
- ✅ Reinicie a conexão no painel
- ✅ Entre em contato com o suporte técnico

### Posso usar múltiplos números de WhatsApp?

**R:** Sim! O sistema suporta múltiplas conexões:

**Planos:**
- **Community**: Até 2 conexões
- **Premium**: Conexões ilimitadas

**Como adicionar:**
1. Vá em **Conexões** → **WhatsApp**
2. Clique em **"Nova Conexão"**
3. Configure cada número separadamente
4. Associe a **filas específicas**

**Vantagens:**
- Diferentes setores (vendas, suporte)
- Separação por produto/serviço
- Horários específicos por conexão
- Melhor organização do atendimento

### As mensagens ficam salvas?

**R:** Sim, todas as mensagens são armazenadas:

**O que é salvo:**
- ✅ Textos das mensagens
- ✅ Mídias (imagens, vídeos, documentos)
- ✅ Data e hora de envio/recebimento
- ✅ Status de entrega (enviado, entregue, lido)
- ✅ Informações do contato

**Tempo de armazenamento:**
- **Padrão**: Sem limite de tempo
- **Configurável**: Pode ser definido pelo administrador
- **Compliance**: Respeita LGPD/GDPR

**Backup:**
- Dados são incluídos no backup automático
- Possível exportar para outros formatos
- Integração com sistemas de arquivo

---

## 🤖 Chatbots e Automação

### Como criar um chatbot simples?

**R:** Para criar seu primeiro chatbot:

1. **Vá em Chatbots** → **"Novo Chatbot"**
2. **Escolha o tipo**: Texto, Opções ou FlowBuilder
3. **Configure as mensagens**:
   ```
   Palavras-chave: oi, olá, menu
   Resposta: Olá! Como posso ajudá-lo?
   
   1️⃣ Vendas
   2️⃣ Suporte
   3️⃣ Financeiro
   ```
4. **Teste** o funcionamento
5. **Ative** o chatbot

**Dicas para chatbots eficazes:**
- Use linguagem simples e clara
- Ofereça opções numeradas
- Sempre tenha uma opção para atendimento humano
- Teste regularmente

### O que é o FlowBuilder?

**R:** O FlowBuilder é um editor visual para criar chatbots complexos:

**Recursos:**
- 🎨 **Interface drag-and-drop**
- 🔀 **Fluxos condicionais**
- 📊 **Integrações com APIs**
- 🤖 **Conexão com IA (OpenAI, Dialogflow)**
- 📋 **Coleta de dados do usuário**

**Casos de uso:**
- Qualificação de leads
- Pesquisas de satisfação
- Agendamento de consultas
- FAQ automatizado
- Suporte técnico básico

### Como integrar com OpenAI (ChatGPT)?

**R:** Para integrar com OpenAI:

1. **Obtenha uma chave da API** da OpenAI
2. **Configure no sistema**:
   - Vá em **Integrações** → **OpenAI**
   - Cole sua **API Key**
   - Defina o **modelo** (GPT-3.5 ou GPT-4)
3. **Configure o prompt**:
   ```
   Você é um assistente virtual da empresa XYZ.
   Responda de forma educada e profissional.
   Se não souber a resposta, encaminhe para um atendente.
   ```
4. **Teste** a integração
5. **Monitore** o uso e custos

**⚠️ Custos:**
- Cada mensagem consome tokens da OpenAI
- Monitore regularmente o uso
- Configure limites de segurança

### O chatbot pode coletar dados dos clientes?

**R:** Sim, o chatbot pode coletar diversos tipos de dados:

**Tipos de dados:**
- 📝 **Nome e contato**
- 📧 **Email**
- 📱 **Telefone adicional**
- 🏢 **Empresa/CNPJ**
- 📋 **Informações customizadas**

**Como configurar:**
1. No **FlowBuilder**, adicione etapas de **"Aguardar Resposta"**
2. Configure **validações** (email, telefone, etc.)
3. **Salve os dados** no perfil do contato
4. Use para **personalização** futura

**Compliance:**
- Sempre informe sobre coleta de dados
- Permita opt-out
- Respeite LGPD/GDPR

---

## 👥 Usuários e Permissões

### Quais são os tipos de usuário?

**R:** O sistema possui diferentes perfis:

| Perfil | Permissões | Casos de Uso |
|--------|-------------|--------------|
| **Super Admin** | Todas as permissões, múltiplas empresas | Provedor do sistema |
| **Admin** | Gerenciamento completo da empresa | Gestor/Proprietário |
| **Supervisor** | Visualizar relatórios, gerenciar usuários | Coordenador |
| **User** | Atendimento básico | Atendente |

**Permissões por perfil:**

**Admin:**
- ✅ Criar/editar usuários
- ✅ Configurar conexões WhatsApp
- ✅ Acessar todos os relatórios
- ✅ Gerenciar chatbots
- ✅ Configurações da empresa

**Supervisor:**
- ✅ Ver tickets de todos os usuários
- ✅ Relatórios da equipe
- ✅ Transferir tickets
- ❌ Criar usuários
- ❌ Configurar WhatsApp

**User:**
- ✅ Atender seus tickets
- ✅ Ver histórico de contatos
- ✅ Usar mensagens rápidas
- ❌ Ver tickets de outros
- ❌ Acessar configurações

### Como criar um novo usuário?

**R:** Para criar usuários (apenas Admin):

1. **Vá em Usuários** → **"Novo Usuário"**
2. **Preencha os dados**:
   - Nome completo
   - Email (será o login)
   - Senha inicial
   - Perfil (Admin/Supervisor/User)
3. **Associe às filas** de atendimento
4. **Salve** as configurações
5. **Envie** as credenciais para o usuário

**⚠️ Importantes:**
- O email deve ser único
- O usuário deve alterar a senha no primeiro login
- Defina as filas corretas para organização

### Como resetar a senha de um usuário?

**R:** Para resetar senha (apenas Admin):

**Método 1 - Pelo painel:**
1. **Vá em Usuários**
2. **Clique no usuário** desejado
3. **Selecione "Resetar Senha"**
4. **Defina uma senha temporária**
5. **Informe ao usuário** para alterar

**Método 2 - Email automático:**
1. **Na lista de usuários**
2. **Clique em "Enviar Reset"**
3. **Usuário recebe** email com link
4. **Link permite** definir nova senha

### Posso limitar o acesso por horário?

**R:** Sim, existem configurações de horário:

**Horário de funcionamento:**
- Configure em **Configurações** → **Horário**
- Defina dias da semana e horários
- Mensagem automática fora do horário

**Horário por usuário:**
- Na versão Premium
- Configure turnos específicos
- Roteamento automático por horário

**Feriados:**
- Configure datas especiais
- Mensagens personalizadas
- Redirecionamento automático

---

## 🎫 Tickets e Atendimento

### Como funciona o sistema de tickets?

**R:** Cada conversa gera um ticket com estados:

**Estados dos tickets:**
- 🟢 **Aberto**: Em atendimento ativo
- 🟡 **Pendente**: Aguardando cliente ou informações
- 🔴 **Fechado**: Atendimento finalizado

**Fluxo típico:**
1. **Cliente envia** mensagem
2. **Sistema cria** ticket automaticamente
3. **Distribui** para fila apropriada
4. **Atendente assume** o ticket
5. **Realiza** o atendimento
6. **Finaliza** quando resolvido

**Automações:**
- Fechamento automático por inatividade
- Reabertura se cliente responder
- Notificações para supervisores

### Como transferir um ticket?

**R:** Para transferir tickets:

**Transferir para outro atendente:**
1. **Abra o ticket**
2. **Clique em "Transferir"**
3. **Selecione o usuário** de destino
4. **Adicione observação** (opcional)
5. **Confirme** a transferência

**Transferir para outra fila:**
1. **No ticket**, clique em **"Fila"**
2. **Selecione a nova fila**
3. **Sistema redistribui** automaticamente

**Transferir com contexto:**
- Sempre adicione uma nota explicativa
- Informe o histórico relevante
- Cliente é notificado da mudança

### Como ver o histórico de um contato?

**R:** Para acessar o histórico:

1. **Clique no nome** do contato
2. **Painel lateral** abrirá com:
   - 📋 **Informações** pessoais
   - 🎫 **Tickets** anteriores
   - 💬 **Últimas conversas**
   - 🏷️ **Tags** aplicadas
   - 📊 **Estatísticas** de atendimento

**Informações disponíveis:**
- Primeira interação
- Total de tickets
- Tempo médio de atendimento
- Avaliações recebidas
- Observações dos atendentes

### Como configurar mensagens rápidas?

**R:** Para criar templates de mensagem:

1. **Vá em Mensagens Rápidas**
2. **Clique em "Nova Mensagem"**
3. **Configure**:
   - **Atalho**: /saudacao
   - **Mensagem**: Olá! Obrigado pelo contato...
   - **Mídia**: Opcional (imagem, documento)
4. **Salve** a configuração

**Uso:**
- Digite `/` no chat para ver opções
- Clique na mensagem desejada
- Será inserida automaticamente
- Edite se necessário antes de enviar

**Variáveis disponíveis:**
- `{{nome}}` - Nome do contato
- `{{atendente}}` - Nome do atendente
- `{{empresa}}` - Nome da empresa
- `{{data}}` - Data atual

---

## 📊 Relatórios e Dashboards

### Quais relatórios estão disponíveis?

**R:** O sistema oferece diversos relatórios:

**Dashboard Principal:**
- 📈 **Tickets** por período
- ⏱️ **Tempo médio** de atendimento
- 👥 **Performance** por atendente
- 📱 **Status** das conexões WhatsApp
- 🕐 **Gráficos** em tempo real

**Relatórios Detalhados:**
- **Atendimentos**: Por data, atendente, fila
- **Contatos**: Novos contatos, origem
- **Mensagens**: Volume por horário
- **Satisfação**: Avaliações dos clientes
- **Chatbot**: Performance da automação

**Exportação:**
- 📄 **PDF** para apresentações
- 📊 **Excel** para análise
- 📋 **CSV** para importação
- 🔗 **API** para integrações

### Como agendar relatórios automáticos?

**R:** Para relatórios automáticos:

1. **Acesse Relatórios** → **"Agendamentos"**
2. **Clique em "Novo Agendamento"**
3. **Configure**:
   - **Tipo** de relatório
   - **Periodicidade** (diário, semanal, mensal)
   - **Horário** de envio
   - **Destinatários** (emails)
4. **Ative** o agendamento

**Formatos disponíveis:**
- Email com resumo executivo
- Anexo em PDF detalhado
- Link para dashboard online
- Dados em CSV/Excel

### Como acompanhar performance da equipe?

**R:** Métricas disponíveis por atendente:

**Produtividade:**
- 🎫 **Tickets atendidos** por período
- ⏱️ **Tempo médio** de resposta
- 🔄 **Taxa de resolução** no primeiro contato
- 📊 **Distribuição** por fila/categoria

**Qualidade:**
- ⭐ **Avaliação média** dos clientes
- 💬 **Feedback** detalhado
- 🏆 **Ranking** entre atendentes
- 📈 **Evolução** ao longo do tempo

**Visualizações:**
- Gráficos individuais por atendente
- Comparativo entre equipe
- Metas vs. realizado
- Histórico de performance

### Posso integrar com Google Analytics?

**R:** Sim, integrações disponíveis:

**Google Analytics:**
1. **Configure** o código de rastreamento
2. **Eventos** são enviados automaticamente
3. **Analise** funis de conversão
4. **Acompanhe** origem dos leads

**Outras integrações:**
- **Google Data Studio**: Dashboards personalizados
- **Power BI**: Análises avançadas
- **Zapier**: Automações com outras ferramentas
- **Webhook**: Dados em tempo real para seus sistemas

---

## 🔧 Questões Técnicas

### Quais navegadores são suportados?

**R:** Navegadores compatíveis:

**✅ Totalmente suportados:**
- Google Chrome 90+
- Mozilla Firefox 88+
- Microsoft Edge 90+
- Safari 14+ (Mac)

**⚠️ Suporte limitado:**
- Internet Explorer (não recomendado)
- Navegadores móveis (funcionalidade reduzida)

**Recomendações:**
- Mantenha o navegador atualizado
- Habilite JavaScript
- Permita cookies do site
- Use resolução mínima de 1024x768

### O sistema funciona no celular?

**R:** Sim, com design responsivo:

**Funcionalidades móveis:**
- ✅ **Visualizar** tickets
- ✅ **Responder** mensagens
- ✅ **Transferir** atendimentos
- ✅ **Dashboard** básico
- ❌ **Configurações** avançadas (apenas desktop)

**Apps disponíveis:**
- **PWA**: Instale como app no celular
- **Android**: App nativo (em desenvolvimento)
- **iOS**: App nativo (planejado)

**Limitações móveis:**
- Tela pequena dificulta configurações
- Algumas funcionalidades admin não disponíveis
- Performance pode ser reduzida

### Como fazer backup dos dados?

**R:** Opções de backup:

**Automático:**
- Backup diário automático
- Armazenamento em nuvem
- Retenção configurável (7, 30, 90 dias)

**Manual:**
1. **Vá em Configurações** → **Backup**
2. **Clique em "Gerar Backup"**
3. **Aguarde** a criação
4. **Baixe** o arquivo gerado

**O que é incluído:**
- ✅ Todos os contatos
- ✅ Histórico de mensagens
- ✅ Configurações do sistema
- ✅ Usuários e permissões
- ❌ Sessões do WhatsApp (reconexão necessária)

### Como migrar para outro servidor?

**R:** Processo de migração:

**Preparação:**
1. **Faça backup** completo
2. **Configure** novo servidor
3. **Instale** a mesma versão
4. **Teste** conectividade

**Migração:**
1. **Pare** o sistema antigo
2. **Copie** os dados de backup
3. **Restaure** no novo servidor
4. **Reconecte** WhatsApps
5. **Teste** todas as funcionalidades

**⚠️ Importante:**
- Planeje migração fora do horário comercial
- Avise usuários sobre possível indisponibilidade
- Mantenha backup do servidor antigo por segurança

---

## 💰 Planos e Cobrança

### Quais são os planos disponíveis?

**R:** Planos do Whaticket:

| Recurso | Community | Basic | Professional | Enterprise |
|---------|-----------|-------|---------------|------------|
| **Conexões WhatsApp** | 2 | 5 | 10 | Ilimitado |
| **Usuários** | 5 | 15 | 50 | Ilimitado |
| **Chatbots** | Básico | Avançado | IA + FlowBuilder | Tudo + Custom |
| **Relatórios** | Básico | Avançado | Completo | Custom |
| **Suporte** | Comunidade | Email | Prioritário | Dedicado |
| **Preço** | Gratuito | R$ 99/mês | R$ 299/mês | Sob consulta |

**Recursos Premium:**
- Integrações avançadas (CRM, ERP)
- White-label (sua marca)
- API personalizada
- Treinamento dedicado
- SLA garantido

### Como funciona a cobrança?

**R:** Sistema de cobrança:

**Modalidades:**
- 💳 **Mensal**: Cobrança recorrente
- 💰 **Anual**: 20% de desconto
- 🏢 **Enterprise**: Contrato personalizado

**Formas de pagamento:**
- Cartão de crédito
- PIX (Brasil)
- Boleto bancário
- Transferência internacional

**Política:**
- **Teste gratuito**: 30 dias
- **Sem fidelidade**: Cancele quando quiser
- **Upgrade/Downgrade**: A qualquer momento
- **Reembolso**: 7 dias após contratação

### O que acontece se eu não pagar?

**R:** Política de inadimplência:

**Prazos:**
- **5 dias**: Aviso por email
- **10 dias**: Sistema em modo limitado
- **15 dias**: Suspensão do serviço
- **30 dias**: Dados podem ser removidos

**Modo limitado:**
- ⚠️ Não recebe novas mensagens
- ⚠️ Não pode enviar mensagens
- ✅ Pode acessar dados existentes
- ✅ Pode fazer backup dos dados

**Reativação:**
- Regularize o pagamento
- Serviço retorna automaticamente
- Dados são preservados
- Suporte para recuperação

### Posso mudar de plano?

**R:** Sim, a qualquer momento:

**Upgrade (plano superior):**
- ✅ **Imediato**: Recursos liberados na hora
- 💳 **Cobrança**: Proporcional até o fim do ciclo
- 📊 **Dados**: Mantidos integralmente

**Downgrade (plano inferior):**
- ⏰ **Próximo ciclo**: Mudança na renovação
- ⚠️ **Limitações**: Alguns recursos podem ser bloqueados
- 💾 **Dados**: Preservados (acesso pode ser limitado)

**Como alterar:**
1. **Acesse** sua conta
2. **Vá em "Planos"**
3. **Selecione** novo plano
4. **Confirme** a alteração

---

## 🆘 Suporte e Ajuda

### Como entrar em contato com o suporte?

**R:** Canais de suporte disponíveis:

**Por Plano:**

**Community (Gratuito):**
- 💬 **Discord**: [Comunidade](https://discord.gg/whaticket)
- 📱 **Telegram**: [Grupo de suporte](https://t.me/whaticket)
- 🐛 **GitHub**: [Issues](https://github.com/canove/whaticket-community/issues)

**Planos Pagos:**
- 📧 **Email**: suporte@whaticket.com
- 📞 **WhatsApp**: +55 11 9999-9999
- 🎫 **Portal**: [suporte.whaticket.com](https://suporte.whaticket.com)
- 📞 **Telefone**: Disponível para Enterprise

**Horários:**
- **Basic**: Segunda a Sexta, 9h às 18h
- **Professional**: Segunda a Sábado, 8h às 20h
- **Enterprise**: 24/7 com SLA garantido

### Quanto tempo demora o suporte?

**R:** Tempos de resposta por plano:

| Tipo | Community | Basic | Professional | Enterprise |
|------|-----------|-------|---------------|------------|
| **Bug Crítico** | N/A | 24h | 4h | 1h |
| **Problema Geral** | N/A | 48h | 12h | 4h |
| **Dúvida** | N/A | 72h | 24h | 8h |
| **Sugestão** | N/A | 7 dias | 3 dias | 1 dia |

**Definições:**
- **Crítico**: Sistema parado, sem envio/recebimento
- **Geral**: Funcionalidade específica com problema
- **Dúvida**: Como usar determinado recurso
- **Sugestão**: Melhoria ou nova funcionalidade

### Existe documentação técnica?

**R:** Sim, documentação completa:

**Para Usuários:**
- 📖 **Wiki**: Guias passo-a-passo
- 🎥 **Vídeos**: Canal no YouTube
- 📝 **Blog**: Dicas e tutoriais
- ❓ **FAQ**: Este documento

**Para Desenvolvedores:**
- 🔧 **API**: Documentação completa
- 🐳 **Docker**: Guias de deployment
- 🔀 **Integração**: SDKs e examples
- 🚀 **Deploy**: Guias para produção

**Para Administradores:**
- ⚙️ **Configuração**: Setup completo
- 🛡️ **Segurança**: Hardening guides
- 📊 **Monitoramento**: Métricas e logs
- 🔄 **Backup**: Procedimentos de segurança

### Como reportar um bug?

**R:** Para reportar problemas:

**Informações necessárias:**
1. **Versão** do sistema
2. **Navegador** e versão
3. **Passos** para reproduzir
4. **Resultado esperado** vs **obtido**
5. **Screenshots** ou vídeos
6. **Logs** de erro (se houver)

**Onde reportar:**
- **GitHub**: Para versão Community
- **Portal de Suporte**: Para versões pagas
- **Email**: Para problemas críticos

**Priorização:**
- ⚡ **P1**: Sistema parado
- 🔥 **P2**: Funcionalidade crítica
- ⚠️ **P3**: Problema específico
- 💡 **P4**: Melhoria/sugestão

---

## 🔍 Busca de Problemas

**Não encontrou sua dúvida?** Use nossa busca:

### Por Palavra-chave
- **Login**: Questões de acesso
- **WhatsApp**: Problemas de conexão
- **Chatbot**: Automação e IA
- **Relatório**: Dashboards e métricas
- **Backup**: Segurança de dados
- **Integração**: APIs e conectores

### Por Erro Comum
- "Não consigo logar"
- "WhatsApp não conecta"
- "Mensagens não chegam"
- "Sistema lento"
- "Erro 500"
- "Pagina em branco"

### Recursos Adicionais
- 📚 [Base de Conhecimento](https://kb.whaticket.com)
- 🎓 [Centro de Treinamento](https://training.whaticket.com)
- 👥 [Fórum da Comunidade](https://forum.whaticket.com)
- 📺 [Canal YouTube](https://youtube.com/whaticket)

---

**💡 Dica:** Use Ctrl+F (ou Cmd+F no Mac) para buscar palavras específicas nesta página!

*Este FAQ é atualizado regularmente. Última revisão: Janeiro 2025*