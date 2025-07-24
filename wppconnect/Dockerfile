# Dockerfile para WPPConnect Server customizado
FROM node:18-alpine

# Instalar dependências do sistema
RUN apk add --no-cache \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    git

# Definir variáveis de ambiente para Chromium
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Criar diretório de trabalho
WORKDIR /app

# Clonar WPPConnect Server
RUN git clone https://github.com/wppconnect-team/wppconnect-server.git .

# Instalar dependências
RUN npm install

# Copiar arquivo de configuração customizado
COPY config.js src/config.js

# Criar diretório para tokens/sessões
RUN mkdir -p tokens

# Expor porta
EXPOSE 21465

# Comando para iniciar o servidor
CMD ["npm", "start"]

