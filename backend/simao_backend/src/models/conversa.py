from datetime import datetime
from enum import Enum

# Usar a instância db do módulo user
from .user import db

class TipoMensagemEnum(Enum):
    TEXTO = "texto"
    AUDIO = "audio"
    IMAGEM = "imagem"
    VIDEO = "video"
    DOCUMENTO = "documento"
    LOCALIZACAO = "localizacao"
    CONTATO = "contato"
    STICKER = "sticker"

class DirecaoEnum(Enum):
    ENTRADA = "entrada"  # Mensagem recebida do cliente
    SAIDA = "saida"      # Mensagem enviada pelo bot/atendente

class StatusMensagemEnum(Enum):
    ENVIANDO = "enviando"
    ENVIADA = "enviada"
    ENTREGUE = "entregue"
    LIDA = "lida"
    ERRO = "erro"

class Conversa(db.Model):
    __tablename__ = 'conversas'
    
    id = db.Column(db.Integer, primary_key=True)
    bot_id = db.Column(db.Integer, db.ForeignKey('bots.id'), nullable=False)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=False)
    
    # Identificação da conversa
    telefone_contato = db.Column(db.String(20), nullable=False)
    nome_contato = db.Column(db.String(100))
    
    # Status da conversa
    ativa = db.Column(db.Boolean, default=True)
    arquivada = db.Column(db.Boolean, default=False)
    
    # Timestamps
    data_inicio = db.Column(db.DateTime, default=datetime.utcnow)
    data_ultima_mensagem = db.Column(db.DateTime, default=datetime.utcnow)
    data_arquivamento = db.Column(db.DateTime)
    
    # Relacionamentos
    mensagens = db.relationship('Mensagem', backref='conversa', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'bot_id': self.bot_id,
            'lead_id': self.lead_id,
            'telefone_contato': self.telefone_contato,
            'nome_contato': self.nome_contato,
            'ativa': self.ativa,
            'arquivada': self.arquivada,
            'data_inicio': self.data_inicio.isoformat() if self.data_inicio else None,
            'data_ultima_mensagem': self.data_ultima_mensagem.isoformat() if self.data_ultima_mensagem else None,
            'data_arquivamento': self.data_arquivamento.isoformat() if self.data_arquivamento else None,
            'total_mensagens': len(self.mensagens) if self.mensagens else 0
        }
    
    def __repr__(self):
        return f'<Conversa {self.telefone_contato}>'

class Mensagem(db.Model):
    __tablename__ = 'mensagens'
    
    id = db.Column(db.Integer, primary_key=True)
    conversa_id = db.Column(db.Integer, db.ForeignKey('conversas.id'), nullable=False)
    
    # Identificação da mensagem
    id_whatsapp = db.Column(db.String(100))  # ID da mensagem no WhatsApp
    id_wppconnect = db.Column(db.String(100))  # ID no WPPConnect
    
    # Conteúdo da mensagem
    tipo = db.Column(db.Enum(TipoMensagemEnum), nullable=False)
    direcao = db.Column(db.Enum(DirecaoEnum), nullable=False)
    conteudo = db.Column(db.Text)  # Texto da mensagem ou transcrição do áudio
    conteudo_original = db.Column(db.Text)  # Conteúdo original antes da transcrição
    
    # Arquivos de mídia
    url_arquivo = db.Column(db.String(500))  # URL do arquivo de mídia
    nome_arquivo = db.Column(db.String(255))
    tamanho_arquivo = db.Column(db.Integer)
    mime_type = db.Column(db.String(100))
    
    # Metadados
    remetente = db.Column(db.String(20))  # Número do remetente
    destinatario = db.Column(db.String(20))  # Número do destinatário
    
    # Status e processamento
    status = db.Column(db.Enum(StatusMensagemEnum), default=StatusMensagemEnum.ENVIADA)
    processada_ia = db.Column(db.Boolean, default=False)
    resposta_automatica = db.Column(db.Boolean, default=False)
    tempo_processamento = db.Column(db.Float)  # Tempo em segundos para processar
    
    # Contexto da IA
    contexto_usado = db.Column(db.Text)  # Contexto usado para gerar resposta
    prompt_usado = db.Column(db.Text)  # Prompt usado na IA
    modelo_usado = db.Column(db.String(50))  # Modelo da OpenAI usado
    tokens_usados = db.Column(db.Integer)  # Tokens consumidos
    
    # Timestamps
    data_envio = db.Column(db.DateTime, default=datetime.utcnow)
    data_entrega = db.Column(db.DateTime)
    data_leitura = db.Column(db.DateTime)
    data_processamento = db.Column(db.DateTime)
    
    def to_dict(self):
        return {
            'id': self.id,
            'conversa_id': self.conversa_id,
            'id_whatsapp': self.id_whatsapp,
            'id_wppconnect': self.id_wppconnect,
            'tipo': self.tipo.value if self.tipo else None,
            'direcao': self.direcao.value if self.direcao else None,
            'conteudo': self.conteudo,
            'conteudo_original': self.conteudo_original,
            'url_arquivo': self.url_arquivo,
            'nome_arquivo': self.nome_arquivo,
            'tamanho_arquivo': self.tamanho_arquivo,
            'mime_type': self.mime_type,
            'remetente': self.remetente,
            'destinatario': self.destinatario,
            'status': self.status.value if self.status else None,
            'processada_ia': self.processada_ia,
            'resposta_automatica': self.resposta_automatica,
            'tempo_processamento': self.tempo_processamento,
            'modelo_usado': self.modelo_usado,
            'tokens_usados': self.tokens_usados,
            'data_envio': self.data_envio.isoformat() if self.data_envio else None,
            'data_entrega': self.data_entrega.isoformat() if self.data_entrega else None,
            'data_leitura': self.data_leitura.isoformat() if self.data_leitura else None,
            'data_processamento': self.data_processamento.isoformat() if self.data_processamento else None
        }
    
    def __repr__(self):
        return f'<Mensagem {self.tipo.value} - {self.direcao.value}>'

