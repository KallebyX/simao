FROM node:18-alpine

WORKDIR /app

# Copiar package.json e package-lock.json
COPY package*.json ./

# Instalar dependências incluindo dev para desenvolvimento
RUN npm ci

# Copiar código fonte
COPY . .

# Expor porta
EXPOSE 8081

# Comando para iniciar em desenvolvimento
CMD ["npm", "run", "dev:server"]