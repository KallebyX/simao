#!/bin/bash

echo "🔍 TESTANDO VARIÁVEIS DE AMBIENTE CRÍTICAS"
echo "=========================================="

cd whaticket/backend

# Testar carregamento das variáveis
echo "📋 Variáveis carregadas do .env:"
node -e "
require('dotenv').config();
console.log('PORT:', process.env.PORT || 'AUSENTE ❌');
console.log('REDIS_URI:', process.env.REDIS_URI || 'AUSENTE ❌');
console.log('REDIS_URI_ACK:', process.env.REDIS_URI_ACK || 'AUSENTE ❌');
console.log('CERTIFICADOS:', process.env.CERTIFICADOS || 'AUSENTE ❌');
console.log('DB_HOST:', process.env.DB_HOST || 'AUSENTE ❌');
console.log('DB_NAME:', process.env.DB_NAME || 'AUSENTE ❌');
"

echo ""
echo "🧪 TESTE: Tentando iniciar servidor..."
timeout 10s node -e "
require('dotenv').config();
console.log('Tentando usar porta:', process.env.PORT);
if (!process.env.PORT) {
  console.log('❌ ERRO: PORT não definida - servidor não pode iniciar');
  process.exit(1);
}
console.log('✅ PORT definida, continuando...');
" 2>&1 || echo "❌ TESTE FALHOU"