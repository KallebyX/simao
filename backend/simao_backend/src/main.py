import os
import sys
from dotenv import load_dotenv

# DON'T CHANGE THIS !!!
sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

# Carregar variáveis de ambiente
load_dotenv()

from flask import Flask, send_from_directory, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from src.models.user import db
from src.routes.user import user_bp

# 🛡️ IMPORTAR MIDDLEWARES DE SEGURANÇA (FASE 1 - CRÍTICA)
from src.middleware.rate_limiter import (
    rate_limiter, add_rate_limit_headers, apply_global_rate_limit
)
from src.middleware.logging_middleware import setup_logging, request_logger

app = Flask(__name__, static_folder=os.path.join(os.path.dirname(__file__), 'static'))

# Configurações do Flask
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_secret_key_simao_2024')
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'jwt_secret_key_simao_2024')

# Configurações do banco de dados
database_url = os.getenv('DATABASE_URL', f"sqlite:///{os.path.join(os.path.dirname(__file__), 'database', 'app.db')}")
app.config['SQLALCHEMY_DATABASE_URI'] = database_url
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

# Configurações CORS
cors_origins = os.getenv('CORS_ORIGINS', 'http://localhost:3000,http://localhost:5173').split(',')
CORS(app, origins=cors_origins)

# Configurar JWT
jwt = JWTManager(app)

# 🛡️ CONFIGURAR SEGURANÇA E MONITORAMENTO (FASE 1 - CRÍTICA)
# Rate limiting global
@app.before_request
def before_request_security():
    # Aplicar rate limit global por IP
    global_limit_response = apply_global_rate_limit()
    if global_limit_response:
        return global_limit_response

# Headers de segurança
@app.after_request
def after_request_security(response):
    # Headers de segurança
    response.headers['X-Content-Type-Options'] = 'nosniff'
    response.headers['X-Frame-Options'] = 'DENY'
    response.headers['X-XSS-Protection'] = '1; mode=block'
    response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Rate limit headers
    response = add_rate_limit_headers(response)
    
    return response

# Configurar sistema de logging estruturado
setup_logging(app)

# Registrar blueprints
app.register_blueprint(user_bp, url_prefix='/api')

# Importar e registrar novos blueprints
from src.routes.webhook import webhook_bp
from src.routes.auth import auth_bp
from src.routes.leads_v2 import leads_bp
from src.routes.whatsapp import whatsapp_bp
from src.routes.billing import billing_bp

# 🐟 NOVOS ENDPOINTS PISCICULTURA - ECONOMIA 95% COM GEMINI
from src.routes.estoque_routes import estoque_bp
from src.routes.qualidade_agua_routes import qualidade_bp
from src.routes.analytics_routes import analytics_bp
from src.routes.notifications_routes import notifications_bp

app.register_blueprint(webhook_bp, url_prefix='/api')
app.register_blueprint(auth_bp, url_prefix='/api/auth')
app.register_blueprint(leads_bp, url_prefix='/api')
app.register_blueprint(whatsapp_bp, url_prefix='/api')
app.register_blueprint(billing_bp, url_prefix='/api/billing')

# Registrar novos blueprints de piscicultura
app.register_blueprint(estoque_bp)  # /api/estoque/*
app.register_blueprint(qualidade_bp)  # /api/qualidade-agua/*
app.register_blueprint(analytics_bp)  # /api/analytics/*
app.register_blueprint(notifications_bp)  # /api/notifications/*

# Inicializar banco de dados
db.init_app(app)
with app.app_context():
    db.create_all()

@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    static_folder_path = app.static_folder
    if static_folder_path is None:
            return "Static folder not configured", 404

    if path != "" and os.path.exists(os.path.join(static_folder_path, path)):
        return send_from_directory(static_folder_path, path)
    else:
        index_path = os.path.join(static_folder_path, 'index.html')
        if os.path.exists(index_path):
            return send_from_directory(static_folder_path, 'index.html')
        else:
            return "index.html not found", 404


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000, debug=True)
