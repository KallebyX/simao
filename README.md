# Simão - IA Piscicultura 🐟🤖

Sistema SaaS completo para automação de atendimento na piscicultura usando WhatsApp e Inteligência Artificial, especializado em vendas de alevinos.

## 🚀 Funcionalidades

### ✨ Core Features
- **Bot WhatsApp Inteligente**: Atendimento automatizado com IA especializada em piscicultura
- **CRM para Piscicultura**: Gestão de leads qualificados para venda de alevinos
- **ERP de Estoque**: Controle completo de lotes de peixes e alevinos
- **Qualidade da Água**: Monitoramento e alertas de parâmetros aquícolas
- **Dashboard Analytics**: Métricas específicas de piscicultura em tempo real
- **Multi-tenancy**: Sistema para múltiplos produtores de alevinos

### 🐟 Funcionalidades Específicas da Piscicultura
- Qualificação automática de leads para alevinos
- Respostas contextualizadas sobre espécies, manejo e qualidade da água
- Controle de estoque por lotes com rastreabilidade completa
- Monitoramento de mortalidade e taxa de conversão alimentar
- Alertas de qualidade da água (pH, oxigênio, amônia, nitrito)
- Gestão de ciclos de produção e previsão de colheitas
- Relatórios de rentabilidade por espécie e lote

## 🏗️ Arquitetura

### Backend (Python/Flask)
- **Framework**: Flask com SQLAlchemy
- **Banco de Dados**: PostgreSQL com modelos específicos para piscicultura
- **IA**: OpenAI GPT-4 especializada em aquicultura
- **WhatsApp**: WPPConnect Server para atendimento automatizado
- **Pagamentos**: Stripe para assinaturas e vendas de alevinos
- **Autenticação**: JWT

### Frontend (React)
- **Framework**: React 18 + Vite
- **UI**: Shadcn/UI + Tailwind CSS
- **Estado**: Context API
- **Gráficos**: Recharts
- **Drag & Drop**: @dnd-kit

### Infraestrutura
- **Deploy**: Render.com
- **Containerização**: Docker
- **Proxy Reverso**: Nginx (opcional)

## 🛠️ Instalação

### Pré-requisitos
- Node.js 18+
- Python 3.11+
- PostgreSQL
- Conta OpenAI
- Conta Stripe

### 1. Clone o Repositório
```bash
git clone <repository-url>
cd simao-ia-rural
```

### 2. Backend Setup
```bash
cd backend/simao_backend

# Criar ambiente virtual
python -m venv venv
source venv/bin/activate  # Linux/Mac
# ou
venv\Scripts\activate     # Windows

# Instalar dependências
pip install -r requirements.txt

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com suas credenciais
```

### 3. Frontend Setup
```bash
cd frontend/simao-frontend

# Instalar dependências
pnpm install
# ou
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Editar .env com a URL do backend
```

### 4. WPPConnect Setup
```bash
cd wppconnect

# Build da imagem Docker
docker build -t wppconnect-simao .

# Executar container
docker run -p 21465:21465 wppconnect-simao
```

## ⚙️ Configuração

### Variáveis de Ambiente - Backend (.env)
```env
# Flask
FLASK_ENV=development
SECRET_KEY=sua-chave-secreta-aqui

# Banco de Dados
DATABASE_URL=postgresql://user:password@localhost/simao_db

# OpenAI
OPENAI_API_KEY=sk-...
OPENAI_API_BASE=https://api.openai.com/v1

# Stripe
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# JWT
JWT_SECRET_KEY=sua-jwt-secret-key

# URLs
FRONTEND_URL=http://localhost:5173
WPPCONNECT_URL=http://localhost:21465
```

### Variáveis de Ambiente - Frontend (.env)
```env
VITE_API_URL=http://localhost:5000/api
VITE_APP_NAME=Simão IA Rural
```

## 🚀 Execução

### Desenvolvimento Local

1. **Banco de Dados**
```bash
# Criar banco PostgreSQL
createdb simao_db
```

2. **Backend**
```bash
cd backend/simao_backend
source venv/bin/activate
python src/main.py
```

3. **Frontend**
```bash
cd frontend/simao-frontend
pnpm dev
```

4. **WPPConnect**
```bash
docker run -p 21465:21465 wppconnect-simao
```

### Docker Compose (Recomendado)
```bash
# Executar todos os serviços
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar serviços
docker-compose down
```

## 🌐 Deploy

### Render.com (Recomendado)

1. **Backend**
   - Conectar repositório no Render
   - Configurar como Web Service
   - Definir variáveis de ambiente
   - Deploy automático

2. **Frontend**
   - Build: `pnpm build`
   - Deploy pasta `dist/`
   - Configurar redirects para SPA

3. **Banco de Dados**
   - Criar PostgreSQL no Render
   - Copiar DATABASE_URL para backend

## 📊 Planos de Assinatura

### Trial (14 dias grátis)
- 50 leads
- 500 mensagens/mês
- 1 bot WhatsApp
- Suporte básico

### Básico (R$ 97/mês)
- 200 leads
- 2.000 mensagens/mês
- 1 bot WhatsApp
- Suporte email

### Profissional (R$ 197/mês)
- 1.000 leads
- 10.000 mensagens/mês
- 3 bots WhatsApp
- Relatórios avançados
- Suporte prioritário

### Empresarial (R$ 497/mês)
- Leads ilimitados
- 50.000 mensagens/mês
- 10 bots WhatsApp
- API completa
- Integração CRM
- Suporte dedicado

## 🔧 Personalização

### Branding White-Label
- Logo: Substitua arquivos em `frontend/src/assets/`
- Cores: Edite `frontend/src/styles/branding.css`
- Textos: Modifique componentes React

### Prompts da IA
- Edite `backend/src/services/openai_service.py`
- Customize respostas por setor/região
- Adicione conhecimento específico

## 📱 API Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/register` - Registro
- `GET /api/auth/profile` - Perfil do usuário

### Leads
- `GET /api/leads` - Listar leads
- `POST /api/leads` - Criar lead
- `PUT /api/leads/:id` - Atualizar lead
- `DELETE /api/leads/:id` - Deletar lead

### WhatsApp
- `GET /api/whatsapp/status` - Status da conexão
- `POST /api/whatsapp/connect` - Conectar WhatsApp
- `POST /api/whatsapp/send` - Enviar mensagem

### Billing
- `GET /api/billing/planos` - Listar planos
- `POST /api/billing/checkout` - Criar checkout
- `GET /api/billing/assinatura` - Assinatura atual

## 🧪 Testes

### Backend
```bash
cd backend/simao_backend
python -m pytest tests/
```

### Frontend
```bash
cd frontend/simao-frontend
pnpm test
```

## 📈 Monitoramento

### Métricas Importantes
- Taxa de conversão de leads
- Tempo médio de resposta
- Satisfação do cliente
- Volume de mensagens
- Receita recorrente (MRR)

### Logs
- Backend: Logs estruturados em JSON
- Frontend: Console + Sentry (opcional)
- WhatsApp: Logs do WPPConnect

## 🔒 Segurança

### Implementado
- Autenticação JWT
- Validação de entrada
- Rate limiting
- CORS configurado
- Variáveis de ambiente
- Sanitização de dados

### Recomendações
- HTTPS obrigatório em produção
- Backup regular do banco
- Monitoramento de segurança
- Atualizações regulares

## 🤝 Suporte

### Documentação
- Código bem documentado
- Comentários em português
- Exemplos de uso

### Comunidade
- Issues no GitHub
- Documentação online
- Vídeos tutoriais

## 📄 Licença

Este projeto está sob licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🎯 Roadmap

### Próximas Funcionalidades
- [ ] Integração com Facebook Messenger
- [ ] Chatbot por voz
- [ ] Análise de sentimento
- [ ] Integração com ERPs rurais
- [ ] App mobile nativo
- [ ] Automação de marketing
- [ ] Relatórios personalizados
- [ ] Multi-idioma

### Melhorias Técnicas
- [ ] Testes automatizados
- [ ] CI/CD pipeline
- [ ] Monitoramento APM
- [ ] Cache Redis
- [ ] Queue system
- [ ] Microserviços

## 👥 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature
3. Commit suas mudanças
4. Push para a branch
5. Abra um Pull Request

## 📞 Contato

- **Website**: https://fcfcrhqu.manus.space
- **Email**: contato@simaoiarural.com
- **WhatsApp**: (11) 99999-9999

---

**Desenvolvido com ❤️ para o agronegócio brasileiro** 🇧🇷

*Transformando a comunicação rural com inteligência artificial*

