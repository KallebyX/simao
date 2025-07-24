from flask_sqlalchemy import SQLAlchemy

# Instância principal do SQLAlchemy
db = SQLAlchemy()

# Importar todos os modelos para garantir que sejam registrados
from .cliente import Cliente, PlanoEnum, StatusEnum
from .bot import Bot, StatusBotEnum
from .lead import Lead, StatusLeadEnum, OrigemEnum, AtividadeLead
from .conversa import Conversa, Mensagem, TipoMensagemEnum, DirecaoEnum, StatusMensagemEnum
from .configuracao import ConfiguracaoBot

# Manter o modelo User original para compatibilidade
class User(db.Model):
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)

    def __repr__(self):
        return f'<User {self.username}>'

    def to_dict(self):
        return {
            'id': self.id,
            'username': self.username,
            'email': self.email
        }
