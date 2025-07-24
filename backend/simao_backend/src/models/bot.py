from datetime import datetime
from enum import Enum

# Usar a instância db do módulo user
from .user import db

class StatusBotEnum(Enum):
    ONLINE = "online"
    OFFLINE = "offline"
    CONECTANDO = "conectando"
    ERRO = "erro"
    DESCONECTADO = "desconectado"

class Bot(db.Model):
    __tablename__ = 'bots'
    
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    
    # Informações do bot
    nome = db.Column(db.String(100), nullable=False)
    descricao = db.Column(db.Text)
    numero_whatsapp = db.Column(db.String(20))
    sessao_wppconnect = db.Column(db.String(100), unique=True)
    
    # Status e configurações
    status = db.Column(db.Enum(StatusBotEnum), default=StatusBotEnum.OFFLINE)
    ativo = db.Column(db.Boolean, default=True)
    
    # Configurações operacionais
    horario_inicio = db.Column(db.Time)  # Horário de início do atendimento
    horario_fim = db.Column(db.Time)     # Horário de fim do atendimento
    dias_semana = db.Column(db.String(20), default='1,2,3,4,5,6,7')  # 1=Segunda, 7=Domingo
    
    # Métricas
    total_mensagens_enviadas = db.Column(db.Integer, default=0)
    total_mensagens_recebidas = db.Column(db.Integer, default=0)
    total_conversas = db.Column(db.Integer, default=0)
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    ultima_atividade = db.Column(db.DateTime)
    data_conexao = db.Column(db.DateTime)
    
    # Relacionamentos
    conversas = db.relationship('Conversa', backref='bot', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'nome': self.nome,
            'descricao': self.descricao,
            'numero_whatsapp': self.numero_whatsapp,
            'sessao_wppconnect': self.sessao_wppconnect,
            'status': self.status.value if self.status else None,
            'ativo': self.ativo,
            'horario_inicio': self.horario_inicio.strftime('%H:%M') if self.horario_inicio else None,
            'horario_fim': self.horario_fim.strftime('%H:%M') if self.horario_fim else None,
            'dias_semana': self.dias_semana,
            'total_mensagens_enviadas': self.total_mensagens_enviadas,
            'total_mensagens_recebidas': self.total_mensagens_recebidas,
            'total_conversas': self.total_conversas,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'ultima_atividade': self.ultima_atividade.isoformat() if self.ultima_atividade else None,
            'data_conexao': self.data_conexao.isoformat() if self.data_conexao else None
        }
    
    def esta_em_horario_atendimento(self):
        """Verifica se o bot está em horário de atendimento"""
        if not self.horario_inicio or not self.horario_fim:
            return True  # Se não há horário definido, atende sempre
        
        from datetime import datetime, time
        agora = datetime.now().time()
        dia_semana = str(datetime.now().weekday() + 1)  # 1=Segunda
        
        # Verifica se hoje é um dia de atendimento
        if dia_semana not in self.dias_semana.split(','):
            return False
        
        # Verifica se está no horário
        return self.horario_inicio <= agora <= self.horario_fim
    
    def __repr__(self):
        return f'<Bot {self.nome}>'

