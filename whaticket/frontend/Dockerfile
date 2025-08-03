FROM node:16-alpine

WORKDIR /app

# Instalar dependências necessárias
RUN apk add --no-cache python3 make g++

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências com flags para resolver conflitos
RUN npm install --legacy-peer-deps --force

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 3000