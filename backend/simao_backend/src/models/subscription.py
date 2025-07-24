from datetime import datetime, timedelta
from sqlalchemy import Column, Integer, String, DateTime, Boolean, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from enum import Enum
from src.models.user import db

class PlanoEnum(Enum):
    TRIAL = "trial"
    BASICO = "basico"
    PROFISSIONAL = "profissional"
    EMPRESARIAL = "empresarial"

class StatusAssinaturaEnum(Enum):
    ATIVA = "ativa"
    CANCELADA = "cancelada"
    SUSPENSA = "suspensa"
    VENCIDA = "vencida"
    TRIAL = "trial"

class Plano(db.Model):
    __tablename__ = 'planos'
    
    id = Column(Integer, primary_key=True)
    nome = Column(String(100), nullable=False)
    tipo = Column(SQLEnum(PlanoEnum), nullable=False)
    preco_mensal = Column(Numeric(10, 2), nullable=False)
    preco_anual = Column(Numeric(10, 2), nullable=True)
    descricao = Column(String(500))
    
    # Limites do plano
    limite_leads = Column(Integer, default=100)
    limite_mensagens_mes = Column(Integer, default=1000)
    limite_bots = Column(Integer, default=1)
    suporte_whatsapp = Column(Boolean, default=True)
    suporte_email = Column(Boolean, default=True)
    relatorios_avancados = Column(Boolean, default=False)
    api_acesso = Column(Boolean, default=False)
    integracao_crm = Column(Boolean, default=False)
    
    # Stripe
    stripe_price_id_mensal = Column(String(100))
    stripe_price_id_anual = Column(String(100))
    stripe_product_id = Column(String(100))
    
    ativo = Column(Boolean, default=True)
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    assinaturas = relationship("Assinatura", back_populates="plano")
    
    def to_dict(self):
        return {
            'id': self.id,
            'nome': self.nome,
            'tipo': self.tipo.value if self.tipo else None,
            'preco_mensal': float(self.preco_mensal) if self.preco_mensal else 0,
            'preco_anual': float(self.preco_anual) if self.preco_anual else 0,
            'descricao': self.descricao,
            'limite_leads': self.limite_leads,
            'limite_mensagens_mes': self.limite_mensagens_mes,
            'limite_bots': self.limite_bots,
            'suporte_whatsapp': self.suporte_whatsapp,
            'suporte_email': self.suporte_email,
            'relatorios_avancados': self.relatorios_avancados,
            'api_acesso': self.api_acesso,
            'integracao_crm': self.integracao_crm,
            'ativo': self.ativo,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
        }

class Assinatura(db.Model):
    __tablename__ = 'assinaturas'
    
    id = Column(Integer, primary_key=True)
    cliente_id = Column(Integer, ForeignKey('clientes.id'), nullable=False)
    plano_id = Column(Integer, ForeignKey('planos.id'), nullable=False)
    
    status = Column(SQLEnum(StatusAssinaturaEnum), nullable=False, default=StatusAssinaturaEnum.TRIAL)
    data_inicio = Column(DateTime, nullable=False, default=datetime.utcnow)
    data_fim = Column(DateTime, nullable=True)
    data_cancelamento = Column(DateTime, nullable=True)
    
    # Stripe
    stripe_subscription_id = Column(String(100), unique=True)
    stripe_customer_id = Column(String(100))
    stripe_payment_method_id = Column(String(100))
    
    # Billing
    valor_mensal = Column(Numeric(10, 2))
    valor_anual = Column(Numeric(10, 2))
    periodicidade = Column(String(20), default='mensal')  # mensal, anual
    proxima_cobranca = Column(DateTime)
    
    # Trial
    trial_ativo = Column(Boolean, default=False)
    trial_fim = Column(DateTime)
    
    # Uso
    leads_utilizados = Column(Integer, default=0)
    mensagens_utilizadas = Column(Integer, default=0)
    
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    cliente = relationship("Cliente", back_populates="assinaturas")
    plano = relationship("Plano", back_populates="assinaturas")
    faturas = relationship("Fatura", back_populates="assinatura")
    
    def is_ativa(self):
        """Verifica se a assinatura está ativa"""
        if self.status == StatusAssinaturaEnum.ATIVA:
            if self.data_fim and self.data_fim < datetime.utcnow():
                return False
            return True
        elif self.status == StatusAssinaturaEnum.TRIAL:
            if self.trial_fim and self.trial_fim > datetime.utcnow():
                return True
        return False
    
    def dias_restantes(self):
        """Retorna quantos dias restam na assinatura"""
        if self.status == StatusAssinaturaEnum.TRIAL and self.trial_fim:
            delta = self.trial_fim - datetime.utcnow()
            return max(0, delta.days)
        elif self.data_fim:
            delta = self.data_fim - datetime.utcnow()
            return max(0, delta.days)
        return 0
    
    def pode_usar_funcionalidade(self, funcionalidade):
        """Verifica se pode usar uma funcionalidade específica"""
        if not self.is_ativa():
            return False
        
        funcionalidades_plano = {
            'relatorios_avancados': self.plano.relatorios_avancados,
            'api_acesso': self.plano.api_acesso,
            'integracao_crm': self.plano.integracao_crm,
        }
        
        return funcionalidades_plano.get(funcionalidade, True)
    
    def verificar_limite_leads(self):
        """Verifica se ainda pode criar leads"""
        return self.leads_utilizados < self.plano.limite_leads
    
    def verificar_limite_mensagens(self):
        """Verifica se ainda pode enviar mensagens este mês"""
        return self.mensagens_utilizadas < self.plano.limite_mensagens_mes
    
    def incrementar_uso_leads(self):
        """Incrementa contador de leads utilizados"""
        self.leads_utilizados += 1
        db.session.commit()
    
    def incrementar_uso_mensagens(self):
        """Incrementa contador de mensagens utilizadas"""
        self.mensagens_utilizadas += 1
        db.session.commit()
    
    def resetar_uso_mensal(self):
        """Reseta contadores mensais (chamado no início de cada mês)"""
        self.mensagens_utilizadas = 0
        db.session.commit()
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'plano': self.plano.to_dict() if self.plano else None,
            'status': self.status.value if self.status else None,
            'data_inicio': self.data_inicio.isoformat() if self.data_inicio else None,
            'data_fim': self.data_fim.isoformat() if self.data_fim else None,
            'data_cancelamento': self.data_cancelamento.isoformat() if self.data_cancelamento else None,
            'valor_mensal': float(self.valor_mensal) if self.valor_mensal else 0,
            'valor_anual': float(self.valor_anual) if self.valor_anual else 0,
            'periodicidade': self.periodicidade,
            'proxima_cobranca': self.proxima_cobranca.isoformat() if self.proxima_cobranca else None,
            'trial_ativo': self.trial_ativo,
            'trial_fim': self.trial_fim.isoformat() if self.trial_fim else None,
            'leads_utilizados': self.leads_utilizados,
            'mensagens_utilizadas': self.mensagens_utilizadas,
            'dias_restantes': self.dias_restantes(),
            'is_ativa': self.is_ativa(),
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
        }

class Fatura(db.Model):
    __tablename__ = 'faturas'
    
    id = Column(Integer, primary_key=True)
    assinatura_id = Column(Integer, ForeignKey('assinaturas.id'), nullable=False)
    
    numero_fatura = Column(String(50), unique=True, nullable=False)
    valor = Column(Numeric(10, 2), nullable=False)
    status = Column(String(20), default='pendente')  # pendente, paga, vencida, cancelada
    
    data_vencimento = Column(DateTime, nullable=False)
    data_pagamento = Column(DateTime)
    
    # Stripe
    stripe_invoice_id = Column(String(100))
    stripe_payment_intent_id = Column(String(100))
    
    descricao = Column(String(500))
    
    data_criacao = Column(DateTime, default=datetime.utcnow)
    data_atualizacao = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    assinatura = relationship("Assinatura", back_populates="faturas")
    
    def to_dict(self):
        return {
            'id': self.id,
            'assinatura_id': self.assinatura_id,
            'numero_fatura': self.numero_fatura,
            'valor': float(self.valor) if self.valor else 0,
            'status': self.status,
            'data_vencimento': self.data_vencimento.isoformat() if self.data_vencimento else None,
            'data_pagamento': self.data_pagamento.isoformat() if self.data_pagamento else None,
            'descricao': self.descricao,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
        }

