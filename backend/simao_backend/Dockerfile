# Dockerfile para Backend Flask - Simão IA Rural
FROM python:3.11-slim

# Definir diretório de trabalho
WORKDIR /app

# Instalar dependências do sistema
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    libpq-dev \
    && rm -rf /var/lib/apt/lists/*

# Copiar requirements
COPY requirements.txt .

# Instalar dependências Python
RUN pip install --no-cache-dir -r requirements.txt

# Copiar código da aplicação
COPY . .

# Criar diretório para uploads e logs
RUN mkdir -p uploads logs

# Expor porta
EXPOSE 5000

# Variáveis de ambiente
ENV FLASK_APP=src/main.py
ENV FLASK_ENV=production
ENV PYTHONPATH=/app

# Comando para iniciar a aplicação
CMD ["python", "src/main.py"]

