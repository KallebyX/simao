from datetime import datetime
from enum import Enum
from decimal import Decimal

# Usar a instância db do módulo user
from .user import db

class StatusLeadEnum(Enum):
    NOVO = "novo"
    EM_ANDAMENTO = "em_andamento"
    QUALIFICADO = "qualificado"
    PROPOSTA_ENVIADA = "proposta_enviada"
    NEGOCIACAO = "negociacao"
    CONVERTIDO = "convertido"
    PERDIDO = "perdido"
    INATIVO = "inativo"

class OrigemEnum(Enum):
    WHATSAPP = "whatsapp"
    MANUAL = "manual"
    IMPORTACAO = "importacao"
    API = "api"

class Lead(db.Model):
    __tablename__ = 'leads'
    
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    
    # Informações básicas
    nome = db.Column(db.String(100))
    telefone = db.Column(db.String(20), nullable=False)
    email = db.Column(db.String(120))
    empresa = db.Column(db.String(100))
    cargo = db.Column(db.String(100))
    
    # Localização
    cidade = db.Column(db.String(100))
    estado = db.Column(db.String(2))
    cep = db.Column(db.String(10))
    
    # Status e classificação
    status = db.Column(db.Enum(StatusLeadEnum), default=StatusLeadEnum.NOVO)
    origem = db.Column(db.Enum(OrigemEnum), default=OrigemEnum.WHATSAPP)
    pontuacao = db.Column(db.Integer, default=0)  # Score do lead
    
    # Informações específicas da piscicultura
    tipo_propriedade = db.Column(db.String(50))  # piscicultura, viveiros, tanques-rede, açude, represa
    area_lamina_agua = db.Column(db.String(50))  # área em m² ou hectares de lâmina d'água
    especies_interesse = db.Column(db.Text)  # espécies de peixes de interesse
    tipo_sistema = db.Column(db.String(50))  # escavado, tanque-rede, raceways, intensivo, extensivo
    volume_agua = db.Column(db.String(50))  # volume total de água em m³
    qtd_viveiros = db.Column(db.Integer)  # quantidade de viveiros/tanques
    experiencia_piscicultura = db.Column(db.String(50))  # iniciante, intermediário, avançado
    interesse_principal = db.Column(db.Text)  # principal interesse/necessidade
    
    # Observações e notas
    observacoes = db.Column(db.Text)
    tags = db.Column(db.String(255))  # tags separadas por vírgula
    
    # Valor estimado e potencial
    valor_estimado = db.Column(db.Numeric(10, 2))
    probabilidade_fechamento = db.Column(db.Integer, default=0)  # 0-100%
    
    # Campos de personalização
    genero_detectado = db.Column(db.String(10))  # 'masculino', 'feminino', 'indefinido'
    tratamento_preferido = db.Column(db.String(50))  # 'Seu João', 'Dona Maria', etc.
    regiao_linguistica = db.Column(db.String(50))  # 'nordeste', 'sul', 'sudeste', etc.
    contexto_rural = db.Column(db.Text)  # informações sobre contexto rural do cliente
    preferencias_comunicacao = db.Column(db.Text)  # JSON com preferências de comunicação
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    data_ultimo_contato = db.Column(db.DateTime)
    data_proximo_followup = db.Column(db.DateTime)
    data_conversao = db.Column(db.DateTime)
    
    # Relacionamentos
    conversas = db.relationship('Conversa', backref='lead', lazy=True)
    atividades = db.relationship('AtividadeLead', backref='lead', lazy=True, cascade='all, delete-orphan')
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'nome': self.nome,
            'telefone': self.telefone,
            'email': self.email,
            'empresa': self.empresa,
            'cargo': self.cargo,
            'cidade': self.cidade,
            'estado': self.estado,
            'cep': self.cep,
            'status': self.status.value if self.status else None,
            'origem': self.origem.value if self.origem else None,
            'pontuacao': self.pontuacao,
            'tipo_propriedade': self.tipo_propriedade,
            'area_lamina_agua': self.area_lamina_agua,
            'especies_interesse': self.especies_interesse,
            'tipo_sistema': self.tipo_sistema,
            'volume_agua': self.volume_agua,
            'qtd_viveiros': self.qtd_viveiros,
            'experiencia_piscicultura': self.experiencia_piscicultura,
            'interesse_principal': self.interesse_principal,
            'observacoes': self.observacoes,
            'tags': self.tags.split(',') if self.tags else [],
            'valor_estimado': float(self.valor_estimado) if self.valor_estimado else None,
            'probabilidade_fechamento': self.probabilidade_fechamento,
            'genero_detectado': self.genero_detectado,
            'tratamento_preferido': self.tratamento_preferido,
            'regiao_linguistica': self.regiao_linguistica,
            'contexto_rural': self.contexto_rural,
            'preferencias_comunicacao': self.preferencias_comunicacao,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None,
            'data_ultimo_contato': self.data_ultimo_contato.isoformat() if self.data_ultimo_contato else None,
            'data_proximo_followup': self.data_proximo_followup.isoformat() if self.data_proximo_followup else None,
            'data_conversao': self.data_conversao.isoformat() if self.data_conversao else None
        }
    
    def adicionar_tag(self, nova_tag):
        """Adiciona uma nova tag ao lead"""
        if self.tags:
            tags_atuais = self.tags.split(',')
            if nova_tag not in tags_atuais:
                tags_atuais.append(nova_tag)
                self.tags = ','.join(tags_atuais)
        else:
            self.tags = nova_tag
    
    def remover_tag(self, tag_remover):
        """Remove uma tag do lead"""
        if self.tags:
            tags_atuais = self.tags.split(',')
            if tag_remover in tags_atuais:
                tags_atuais.remove(tag_remover)
                self.tags = ','.join(tags_atuais) if tags_atuais else None
    
    def calcular_pontuacao(self):
        """Calcula a pontuação do lead baseada em critérios de piscicultura"""
        pontos = 0
        
        # Pontos por informações básicas completas
        if self.nome: pontos += 10
        if self.email: pontos += 15
        if self.empresa: pontos += 10
        
        # Pontos por informações específicas da piscicultura
        if self.tipo_propriedade: pontos += 20
        if self.area_lamina_agua: pontos += 15
        if self.especies_interesse: pontos += 15
        if self.tipo_sistema: pontos += 10
        if self.volume_agua: pontos += 10
        if self.qtd_viveiros: pontos += 5
        if self.experiencia_piscicultura: pontos += 10
        if self.interesse_principal: pontos += 20
        
        # Bonus para leads mais qualificados
        if self.experiencia_piscicultura == 'avançado': pontos += 10
        if self.tipo_sistema in ['intensivo', 'tanque-rede']: pontos += 5
        
        self.pontuacao = pontos
        return pontos
    
    def __repr__(self):
        return f'<Lead {self.nome or self.telefone}>'

class AtividadeLead(db.Model):
    __tablename__ = 'atividades_lead'
    
    id = db.Column(db.Integer, primary_key=True)
    lead_id = db.Column(db.Integer, db.ForeignKey('leads.id'), nullable=False)
    
    tipo = db.Column(db.String(50), nullable=False)  # 'mensagem', 'ligacao', 'email', 'nota', etc.
    descricao = db.Column(db.Text, nullable=False)
    data_atividade = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'lead_id': self.lead_id,
            'tipo': self.tipo,
            'descricao': self.descricao,
            'data_atividade': self.data_atividade.isoformat() if self.data_atividade else None
        }

