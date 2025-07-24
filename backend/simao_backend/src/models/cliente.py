from datetime import datetime
from enum import Enum
from flask_sqlalchemy import SQLAlchemy

# Usar a instância db do módulo user
from .user import db

class PlanoEnum(Enum):
    TRIAL = "trial"
    BASICO = "basico"
    PROFISSIONAL = "profissional"
    ENTERPRISE = "enterprise"

class StatusEnum(Enum):
    ATIVO = "ativo"
    INATIVO = "inativo"
    SUSPENSO = "suspenso"
    TRIAL = "trial"

class Cliente(db.Model):
    __tablename__ = 'clientes'
    
    id = db.Column(db.Integer, primary_key=True)
    nome = db.Column(db.String(100), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    senha_hash = db.Column(db.String(255), nullable=False)
    empresa = db.Column(db.String(100))
    telefone = db.Column(db.String(20))
    
    # Configurações do plano
    plano = db.Column(db.Enum(PlanoEnum), default=PlanoEnum.TRIAL)
    status = db.Column(db.Enum(StatusEnum), default=StatusEnum.TRIAL)
    max_bots = db.Column(db.Integer, default=1)
    max_leads = db.Column(db.Integer, default=100)
    
    # Configurações de pagamento
    stripe_customer_id = db.Column(db.String(100))
    stripe_subscription_id = db.Column(db.String(100))
    
    # Configurações personalizadas
    openai_api_key = db.Column(db.String(255))  # Criptografada
    logo_url = db.Column(db.String(255))
    cor_primaria = db.Column(db.String(7), default='#0e0385')  # Azul índigo
    cor_secundaria = db.Column(db.String(7), default='#e4c645')  # Amarelo ouro
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    data_ultimo_login = db.Column(db.DateTime)
    
    # Relacionamentos
    bots = db.relationship('Bot', backref='cliente', lazy=True, cascade='all, delete-orphan')
    leads = db.relationship('Lead', backref='cliente', lazy=True, cascade='all, delete-orphan')
    configuracoes = db.relationship('ConfiguracaoBot', backref='cliente', uselist=False, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'email': self.email,
            'empresa': self.empresa,
            'telefone': self.telefone,
            'plano': self.plano.value if self.plano else None,
            'status': self.status.value if self.status else None,
            'max_bots': self.max_bots,
            'max_leads': self.max_leads,
            'logo_url': self.logo_url,
            'cor_primaria': self.cor_primaria,
            'cor_secundaria': self.cor_secundaria,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_ultimo_login': self.data_ultimo_login.isoformat() if self.data_ultimo_login else None
        }
    
    def __repr__(self):
        return f'<Cliente {self.nome}>'

