# 🚀 Instalação Local - Whaticket Multi-Instância

Este guia te ajudará a configurar o sistema Whaticket para rodar localmente no macOS, com todas as dependências atualizadas.

## ⚠️ Problemas Identificados e Status

### Dependências Atualizadas ✅
- **Backend**: Todas as dependências foram atualizadas para versões compatíveis com Node.js 18+
- **Frontend**: Migrado de Material-UI v4 para MUI v5, React 18, e outras atualizações
- **TypeScript**: Atualizado para v5.6.2
- **BullBoard**: Migrado para nova API `@bull-board`

### Problemas Encontrados ⚠️
1. **Node.js 16**: Você está usando Node.js v16.20.2, mas muitas dependências requerem Node.js 18+
2. **Erros TypeScript**: 272 erros devido à incompatibilidade entre Sequelize v5 e TypeScript v5
3. **Sequelize Legado**: O projeto usa Sequelize v5 (2019) que é incompatível com as novas versões

## 📋 Pré-requisitos

### 1. Instalar Node.js 18+ (RECOMENDADO)
```bash
# Via Homebrew
brew install node@18
brew link node@18 --force

# Ou via NVM (recomendado)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 2. Instalar PostgreSQL
```bash
brew install postgresql@14
brew services start postgresql@14
```

### 3. Instalar Redis
```bash
brew install redis
brew services start redis
```

## 🛠️ Instalação

### Opção 1: Script Automático (Mais Fácil)
```bash
# Torna o script executável e executa
chmod +x setup-local.sh
./setup-local.sh
```

### Opção 2: Instalação Manual

#### 1. Instalar Dependências do Backend
```bash
cd whaticket/backend
npm install --legacy-peer-deps
```

#### 2. Instalar Dependências do Frontend
```bash
cd ../frontend
npm install --legacy-peer-deps
```

#### 3. Configurar Banco de Dados
```bash
cd ../backend

# Criar banco (se não existir)
createdb -U kalleby mestres_cafe

# Executar migrações
npm run build
npm run db:migrate
npm run db:seed
```

## ⚙️ Configuração

### Arquivos de Ambiente

#### Backend (.env) ✅ Configurado
```env
DB_HOST=localhost
DB_USER=kalleby
DB_PASS=mestres123
DB_NAME=mestres_cafe
REDIS_URI=redis://localhost:6379
```

#### Frontend (.env) ✅ Configurado
```env
REACT_APP_BACKEND_URL=http://localhost:8081
GENERATE_SOURCEMAP=false
```

## 🚀 Executar o Sistema

### ⚡ MÉTODO RECOMENDADO (Scripts Automatizados)

#### 1. Diagnóstico (se houver problemas de conexão)
```bash
./diagnostico.sh
```

#### 2. Iniciar Sistema Completo
```bash
./iniciar-sistema.sh
```

#### 3. Parar Sistema
```bash
./parar-sistema.sh
```

### 🔧 MÉTODO MANUAL (se os scripts não funcionarem)

#### Terminal 1 - Backend
```bash
cd whaticket/backend

# Instalar dependências se necessário
npm install --legacy-peer-deps

# Configurar banco
npm run db:migrate
npm run db:seed

# IMPORTANTE: usar ts-node-dev para ignorar erros TypeScript
npx ts-node-dev --respawn --transpile-only --ignore-watch node_modules src/server.ts
```

#### Terminal 2 - Frontend
```bash
cd whaticket/frontend

# Instalar dependências se necessário
npm install --legacy-peer-deps

# Iniciar (sem abrir navegador automaticamente)
BROWSER=none npm start
```

### 🆘 RESOLUÇÃO DE PROBLEMAS DE CONEXÃO

#### Se receber "ERR_CONNECTION_REFUSED":

1. **Verifique se os serviços estão rodando**:
```bash
./diagnostico.sh
```

2. **Mate processos antigos**:
```bash
./parar-sistema.sh
```

3. **Reinicie os serviços**:
```bash
./iniciar-sistema.sh
```

4. **Aguarde 30-60 segundos** para o sistema carregar completamente

5. **Verifique os logs se ainda não funcionar**:
```bash
tail -f whaticket/backend.log
tail -f whaticket/frontend.log
```

## 🌐 Acessar o Sistema

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8081
- **PostgreSQL**: postgresql://kalleby:mestres123@localhost:5432/mestres_cafe
- **Redis**: redis://localhost:6379

## 🐛 Problemas Conhecidos e Soluções

### 1. Erros de TypeScript (272 erros)
**Problema**: Incompatibilidade entre Sequelize v5 e TypeScript v5

**Soluções**:

#### Opção A: Ignorar erros TypeScript temporariamente
```bash
# No backend, editar tsconfig.json
{
  "compilerOptions": {
    "strict": false,
    "skipLibCheck": true,
    "noImplicitAny": false
  },
  "ts-node": {
    "transpileOnly": true
  }
}
```

#### Opção B: Executar sem build (JavaScript transpilado)
```bash
cd whaticket/backend
npm run dev  # Usa ts-node-dev que ignora erros de tipo
```

#### Opção C: Migrar para Sequelize v6 (Trabalho Intensivo)
- Requer refatoração de todos os modelos
- Mudança da sintaxe de associações
- Atualização de tipos TypeScript

### 2. Dependências Conflitantes
```bash
# Se houver conflitos, use:
npm install --legacy-peer-deps --force
```

### 3. Node.js 16 vs 18+
**Aviso**: Muitas dependências foram atualizadas para Node.js 18+. Recomendamos fortemente atualizar:

```bash
# Verificar versão atual
node --version

# Instalar Node 18 via NVM
nvm install 18
nvm use 18
nvm alias default 18
```

### 4. Erro de Migração do Banco
```bash
# Se der erro nas migrações, tente:
cd whaticket/backend
npx sequelize-cli db:drop
npx sequelize-cli db:create
npx sequelize-cli db:migrate
npx sequelize-cli db:seed:all
```

## 📦 Scripts Disponíveis

### Backend
```bash
npm run dev          # Desenvolvimento com hot reload
npm run build        # Build TypeScript
npm start            # Execução produção
npm run db:migrate   # Executar migrações
npm run db:seed      # Executar seeds
```

### Frontend
```bash
npm start            # Desenvolvimento
npm run build        # Build para produção
npm test             # Executar testes
```

## 🔧 Próximos Passos (Recomendados)

### Para Produção
1. **Atualizar Node.js para 18+**
2. **Migrar Sequelize v5 → v6** (grande refatoração)
3. **Resolver todos os erros TypeScript**
4. **Atualizar configurações de segurança**
5. **Implementar testes automatizados**

### Para Desenvolvimento Imediato
1. **Use `npm run dev`** no backend (ignora erros TypeScript)
2. **Configure SSL/HTTPS** se necessário
3. **Configure webhooks** para WhatsApp
4. **Configure integrações** (OpenAI, Stripe, etc.)

## 📞 Suporte

Se encontrar problemas:

1. **Verifique os logs**: `tail -f logs/app.log`
2. **PostgreSQL**: `brew services restart postgresql@14`
3. **Redis**: `brew services restart redis`
4. **Node.js**: Certifique-se de usar versão 18+

## 📊 Status de Migração

| Componente | Status | Observações |
|------------|--------|-------------|
| ✅ Dependências Backend | Atualizado | Node 18+ requerido |
| ✅ Dependências Frontend | Atualizado | MUI v5, React 18 |
| ✅ Configuração Local | Configurado | PostgreSQL + Redis local |
| ⚠️ Build TypeScript | Parcial | 272 erros de tipo |
| ✅ Ambiente Desenvolvimento | Funcional | Use `npm run dev` |
| ⚠️ Sequelize | Legado | v5 → v6 recomendado |

---

**🎉 O sistema deve funcionar em modo desenvolvimento mesmo com os erros TypeScript!**

Use `npm run dev` no backend e `npm start` no frontend para começar a desenvolver.