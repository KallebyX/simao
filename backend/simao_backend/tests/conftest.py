"""
Configuração global para testes - Simão IA Rural
Fixtures reutilizáveis e setup de ambiente de testes
"""

import os
import pytest
import tempfile
from unittest.mock import Mock, patch
from flask import Flask
from flask.testing import FlaskClient

# Ajustar path antes dos imports
import sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', '..'))

from src.models.user import db, User, Cliente
from src.models.lead import Lead, StatusLeadEnum, OrigemEnum
from src.models.estoque_peixe import EspeciePeixe, Viveiro, LotePeixe
from src.services.gemini_service import GeminiService
from src.services.notification_service import NotificationService

@pytest.fixture(scope='session')
def app():
    """Cria aplicação Flask para testes"""
    
    # Criar app temporária
    app = Flask(__name__)
    
    # Configuração de teste
    app.config.update({
        'TESTING': True,
        'SECRET_KEY': 'test-secret-key',
        'JWT_SECRET_KEY': 'test-jwt-secret',
        'SQLALCHEMY_DATABASE_URI': 'sqlite:///:memory:',
        'SQLALCHEMY_TRACK_MODIFICATIONS': False,
        'WTF_CSRF_ENABLED': False
    })
    
    # Registrar blueprints necessários
    from src.routes.auth import auth_bp
    from src.routes.leads_v2 import leads_bp
    from src.routes.estoque_routes import estoque_bp
    from src.routes.qualidade_agua_routes import qualidade_bp
    from src.routes.analytics_routes import analytics_bp
    from src.routes.notifications_routes import notifications_bp
    
    app.register_blueprint(auth_bp, url_prefix='/api/auth')
    app.register_blueprint(leads_bp, url_prefix='/api')
    app.register_blueprint(estoque_bp)
    app.register_blueprint(qualidade_bp) 
    app.register_blueprint(analytics_bp)
    app.register_blueprint(notifications_bp)
    
    # Inicializar banco
    db.init_app(app)
    
    with app.app_context():
        db.create_all()
        yield app
        db.drop_all()

@pytest.fixture
def client(app) -> FlaskClient:
    """Cliente de teste para requests HTTP"""
    return app.test_client()

@pytest.fixture
def db_session(app):
    """Sessão de banco de dados para testes"""
    with app.app_context():
        # Limpar dados antes de cada teste
        db.session.query(Lead).delete()
        db.session.query(LotePeixe).delete()
        db.session.query(EspeciePeixe).delete()
        db.session.query(Viveiro).delete()
        db.session.query(Cliente).delete()
        db.session.query(User).delete()
        db.session.commit()
        
        yield db.session
        
        # Limpar após o teste
        db.session.rollback()

@pytest.fixture
def sample_user(db_session):
    """Usuário de exemplo para testes"""
    user = User(
        nome='João Silva',
        email='joao@teste.com',
        password_hash='hashed_password'
    )
    db_session.add(user)
    db_session.commit()
    return user

@pytest.fixture
def sample_cliente(db_session, sample_user):
    """Cliente de exemplo para testes"""
    cliente = Cliente(
        user_id=sample_user.id,
        nome_empresa='Piscicultura Teste LTDA',
        telefone='(11) 99999-9999',
        cidade='São Paulo',
        estado='SP'
    )
    db_session.add(cliente)
    db_session.commit()
    return cliente

@pytest.fixture
def sample_lead(db_session, sample_cliente):
    """Lead de exemplo para testes"""
    lead = Lead(
        cliente_id=sample_cliente.id,
        nome='Maria Santos',
        telefone='(11) 88888-8888',
        email='maria@cliente.com',
        status=StatusLeadEnum.NOVO,
        origem=OrigemEnum.WHATSAPP,
        pontuacao=75,
        especies_interesse='tilapia, tambaqui',
        experiencia_piscicultura='iniciante'
    )
    db_session.add(lead)
    db_session.commit()
    return lead

@pytest.fixture
def sample_especie(db_session, sample_cliente):
    """Espécie de peixe de exemplo"""
    especie = EspeciePeixe(
        cliente_id=sample_cliente.id,
        nome='Tilápia',
        nome_cientifico='Oreochromis niloticus',
        peso_medio_adulto=0.8,
        tempo_engorda=180,
        temperatura_ideal_min=24.0,
        temperatura_ideal_max=30.0,
        ph_ideal_min=6.5,
        ph_ideal_max=8.5
    )
    db_session.add(especie)
    db_session.commit()
    return especie

@pytest.fixture
def sample_viveiro(db_session, sample_cliente):
    """Viveiro de exemplo"""
    viveiro = Viveiro(
        cliente_id=sample_cliente.id,
        nome='Viveiro Principal',
        tipo_sistema='escavado',
        capacidade_litros=50000.0,
        profundidade_media=1.8,
        aeracao=True
    )
    db_session.add(viveiro)
    db_session.commit()
    return viveiro

@pytest.fixture
def sample_lote(db_session, sample_cliente, sample_especie, sample_viveiro):
    """Lote de peixes de exemplo"""
    lote = LotePeixe(
        cliente_id=sample_cliente.id,
        especie_id=sample_especie.id,
        viveiro_id=sample_viveiro.id,
        codigo='TEST001',
        quantidade_inicial=1000,
        quantidade_atual=950,
        peso_medio_inicial=0.05,
        peso_medio_atual=0.25,
        custo_alevinos=500.00
    )
    db_session.add(lote)
    db_session.commit()
    return lote

@pytest.fixture
def auth_headers(client, sample_user):
    """Headers de autenticação para requests"""
    # Mock do JWT token
    with patch('flask_jwt_extended.create_access_token') as mock_token:
        mock_token.return_value = 'mock-jwt-token'
        
        response = client.post('/api/auth/login', json={
            'email': sample_user.email,
            'password': 'test_password'
        })
        
        if response.status_code == 200:
            token = response.get_json().get('access_token', 'mock-token')
            return {'Authorization': f'Bearer {token}'}
        else:
            # Fallback para testes
            return {'Authorization': 'Bearer mock-token'}

@pytest.fixture
def mock_gemini_service():
    """Mock do serviço Gemini para testes"""
    with patch.object(GeminiService, '__init__', return_value=None):
        mock_service = Mock(spec=GeminiService)
        
        # Mock responses padrão
        mock_service.generate_response.return_value = "Resposta de teste do Gemini"
        mock_service.transcribe_audio.return_value = "transcrição de teste"
        mock_service.analyze_sentiment.return_value = {
            "sentimento": "positivo",
            "intencao": "interesse",
            "urgencia": "media",
            "topico_principal": "tilapia",
            "requer_humano": False,
            "confianca": 0.9
        }
        mock_service.health_check.return_value = {
            "status": "healthy",
            "model": "gemini-1.5-pro-latest",
            "timestamp": "2024-07-22T10:00:00"
        }
        
        yield mock_service

@pytest.fixture
def mock_notification_service():
    """Mock do serviço de notificações"""
    with patch.object(NotificationService, '__init__', return_value=None):
        mock_service = Mock(spec=NotificationService)
        
        # Mock responses padrão
        mock_service.create_notification.return_value = Mock(id='test-notification-id')
        mock_service.send_notification.return_value = True
        mock_service.get_client_notifications.return_value = []
        mock_service.get_unread_count.return_value = 0
        mock_service.mark_as_read.return_value = True
        
        yield mock_service

@pytest.fixture
def mock_redis():
    """Mock do Redis para testes"""
    with patch('redis.from_url') as mock_redis:
        mock_client = Mock()
        mock_client.ping.return_value = True
        mock_client.get.return_value = None
        mock_client.set.return_value = True
        mock_client.setex.return_value = True
        mock_client.incr.return_value = 1
        mock_client.keys.return_value = []
        mock_redis.return_value = mock_client
        yield mock_client

@pytest.fixture
def mock_whatsapp_api():
    """Mock da API do WhatsApp"""
    with patch('requests.post') as mock_post:
        mock_response = Mock()
        mock_response.status_code = 200
        mock_response.json.return_value = {'success': True}
        mock_post.return_value = mock_response
        yield mock_post

# Helpers para testes

def assert_json_response(response, expected_status=200):
    """Valida resposta JSON básica"""
    assert response.status_code == expected_status
    assert response.content_type == 'application/json'
    return response.get_json()

def assert_error_response(response, expected_status=400):
    """Valida resposta de erro"""
    json_data = assert_json_response(response, expected_status)
    assert 'error' in json_data
    return json_data

def assert_success_response(response, expected_status=200):
    """Valida resposta de sucesso"""
    json_data = assert_json_response(response, expected_status)
    assert 'error' not in json_data or not json_data['error']
    return json_data

def create_test_headers(token='test-token'):
    """Cria headers de teste com autenticação"""
    return {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }