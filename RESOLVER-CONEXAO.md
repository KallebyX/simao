# 🆘 RESOLVER PROBLEMA DE CONEXÃO

## ❌ Problema: "ERR_CONNECTION_REFUSED" em localhost

Se você está vendo esse erro, significa que os serviços não estão rodando corretamente.

## ⚡ SOLUÇÃO RÁPIDA (1 minuto)

### 1. Execute o diagnóstico
```bash
./diagnostico.sh
```

### 2. Pare todos os processos
```bash
./parar-sistema.sh
```

### 3. Inicie o sistema completo
```bash
./iniciar-sistema.sh
```

### 4. **AGUARDE 30-60 SEGUNDOS** ⏰
O sistema demora para carregar completamente. Não tente acessar imediatamente!

### 5. Acesse: http://localhost:3000

---

## 🔍 SE AINDA NÃO FUNCIONAR

### Verificar logs
```bash
# Em terminais separados:
tail -f whaticket/backend.log
tail -f whaticket/frontend.log
```

### Verificar portas manualmente
```bash
# Ver o que está rodando nas portas
lsof -i :3000
lsof -i :8081

# Se houver conflito, mate os processos
lsof -ti :3000 | xargs kill -9
lsof -ti :8081 | xargs kill -9
```

### Reiniciar serviços do sistema
```bash
# PostgreSQL
brew services restart postgresql@14

# Redis  
brew services restart redis
```

---

## 🐛 PROBLEMAS ESPECÍFICOS

### Backend não inicia (erro TypeScript)
**Solução**: Use o comando correto que ignora erros:
```bash
cd whaticket/backend
npx ts-node-dev --respawn --transpile-only --ignore-watch node_modules src/server.ts
```

### Frontend não carrega
**Solução**: Limpe cache e reinstale:
```bash
cd whaticket/frontend
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
BROWSER=none npm start
```

### Banco de dados não conecta
**Solução**: Recrie o banco:
```bash
dropdb -U kalleby mestres_cafe
createdb -U kalleby mestres_cafe
cd whaticket/backend
npm run db:migrate
npm run db:seed
```

---

## ✅ CHECKLIST DE VERIFICAÇÃO

- [ ] PostgreSQL está rodando: `brew services list | grep postgresql`
- [ ] Redis está rodando: `brew services list | grep redis`
- [ ] Porta 8081 livre: `lsof -i :8081` (não deve retornar nada)
- [ ] Porta 3000 livre: `lsof -i :3000` (não deve retornar nada)
- [ ] Node.js versão 16+: `node --version`
- [ ] Dependências instaladas: `ls whaticket/backend/node_modules`

---

## 🚨 ÚLTIMA OPÇÃO (Reset Completo)

Se nada funcionar, execute:

```bash
# Parar tudo
./parar-sistema.sh

# Limpar completamente
rm -rf whaticket/backend/node_modules
rm -rf whaticket/frontend/node_modules
rm -f whaticket/backend.log whaticket/frontend.log

# Recriar banco
dropdb -U kalleby mestres_cafe 2>/dev/null || true
createdb -U kalleby mestres_cafe

# Reinstalar tudo
./setup-local.sh

# Iniciar novamente
./iniciar-sistema.sh
```

---

## 📞 AINDA COM PROBLEMAS?

1. **Copie e cole** a saída dos comandos:
   - `./diagnostico.sh`
   - `tail -20 whaticket/backend.log`
   - `tail -20 whaticket/frontend.log`

2. **Verifique** se você tem Node.js 18+ (recomendado):
   ```bash
   nvm install 18
   nvm use 18
   ```

3. **Tempo**: O sistema pode demorar até 2 minutos para carregar completamente na primeira vez.