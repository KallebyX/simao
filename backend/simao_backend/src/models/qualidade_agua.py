from datetime import datetime
from enum import Enum
from decimal import Decimal

# Usar a instância db do módulo user
from .user import db

class StatusMedicaoEnum(Enum):
    NORMAL = "normal"
    ATENCAO = "atencao"
    CRITICO = "critico"

class QualidadeAgua(db.Model):
    __tablename__ = 'qualidade_agua'
    
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    viveiro_id = db.Column(db.Integer, db.ForeignKey('viveiros.id'), nullable=False)
    
    # Data e hora da medição
    data_medicao = db.Column(db.DateTime, nullable=False)
    
    # Parâmetros físicos
    temperatura = db.Column(db.Numeric(5, 2))  # °C
    transparencia = db.Column(db.Numeric(5, 2))  # cm (disco de Secchi)
    cor_agua = db.Column(db.String(50))  # verde, marrom, transparente, etc.
    
    # Parâmetros químicos
    ph = db.Column(db.Numeric(4, 2))  # escala 0-14
    oxigenio_dissolvido = db.Column(db.Numeric(5, 2))  # mg/L
    amonia_total = db.Column(db.Numeric(6, 3))  # mg/L
    amonia_nao_ionizada = db.Column(db.Numeric(6, 3))  # mg/L
    nitrito = db.Column(db.Numeric(6, 3))  # mg/L
    nitrato = db.Column(db.Numeric(6, 3))  # mg/L
    dureza_total = db.Column(db.Numeric(6, 2))  # mg/L CaCO3
    alcalinidade = db.Column(db.Numeric(6, 2))  # mg/L CaCO3
    condutividade = db.Column(db.Numeric(8, 2))  # µS/cm
    salinidade = db.Column(db.Numeric(5, 2))  # ppt
    
    # Parâmetros biológicos
    fitoplancton = db.Column(db.String(50))  # abundante, moderado, escasso
    zooplancton = db.Column(db.String(50))  # abundante, moderado, escasso
    
    # Status geral e observações
    status_geral = db.Column(db.Enum(StatusMedicaoEnum), default=StatusMedicaoEnum.NORMAL)
    observacoes = db.Column(db.Text)
    acoes_corretivas = db.Column(db.Text)
    
    # Responsável pela medição
    responsavel = db.Column(db.String(100))
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def avaliar_parametros(self):
        """Avalia os parâmetros e define o status geral"""
        alertas = []
        
        # Avaliação da temperatura (ideal para a maioria das espécies tropicais)
        if self.temperatura:
            if self.temperatura < 22 or self.temperatura > 32:
                alertas.append("Temperatura fora da faixa ideal (22-32°C)")
        
        # Avaliação do pH (ideal entre 6.5 e 8.5)
        if self.ph:
            if self.ph < 6.0 or self.ph > 9.0:
                alertas.append("pH em nível crítico")
            elif self.ph < 6.5 or self.ph > 8.5:
                alertas.append("pH fora da faixa ideal (6.5-8.5)")
        
        # Avaliação do oxigênio dissolvido (mínimo 3.0 mg/L)
        if self.oxigenio_dissolvido:
            if self.oxigenio_dissolvido < 2.0:
                alertas.append("Oxigênio dissolvido em nível crítico (<2.0 mg/L)")
            elif self.oxigenio_dissolvido < 3.0:
                alertas.append("Oxigênio dissolvido baixo (<3.0 mg/L)")
        
        # Avaliação da amônia não ionizada (máximo 0.02 mg/L)
        if self.amonia_nao_ionizada:
            if self.amonia_nao_ionizada > 0.05:
                alertas.append("Amônia não ionizada em nível tóxico")
            elif self.amonia_nao_ionizada > 0.02:
                alertas.append("Amônia não ionizada elevada")
        
        # Avaliação do nitrito (máximo 0.5 mg/L)
        if self.nitrito:
            if self.nitrito > 1.0:
                alertas.append("Nitrito em nível crítico")
            elif self.nitrito > 0.5:
                alertas.append("Nitrito elevado")
        
        # Definir status geral
        if any("crítico" in alerta or "tóxico" in alerta for alerta in alertas):
            self.status_geral = StatusMedicaoEnum.CRITICO
        elif alertas:
            self.status_geral = StatusMedicaoEnum.ATENCAO
        else:
            self.status_geral = StatusMedicaoEnum.NORMAL
        
        return alertas
    
    def gerar_recomendacoes(self):
        """Gera recomendações baseadas nos parâmetros medidos"""
        recomendacoes = []
        
        # Recomendações para temperatura
        if self.temperatura and (self.temperatura < 22 or self.temperatura > 32):
            if self.temperatura < 22:
                recomendacoes.append("Considere reduzir a alimentação e aumentar a aeração em dias frios")
            else:
                recomendacoes.append("Aumente a aeração e considere sombreamento parcial do viveiro")
        
        # Recomendações para pH
        if self.ph:
            if self.ph < 6.5:
                recomendacoes.append("Aplicar calcário para elevar o pH")
            elif self.ph > 8.5:
                recomendacoes.append("Reduzir aeração e considerar aplicação de matéria orgânica")
        
        # Recomendações para oxigênio
        if self.oxigenio_dissolvido and self.oxigenio_dissolvido < 3.0:
            recomendacoes.append("Aumentar aeração urgentemente, reduzir alimentação")
        
        # Recomendações para amônia
        if self.amonia_nao_ionizada and self.amonia_nao_ionizada > 0.02:
            recomendacoes.append("Realizar troca parcial de água, reduzir alimentação, verificar filtros")
        
        # Recomendações para nitrito
        if self.nitrito and self.nitrito > 0.5:
            recomendacoes.append("Adicionar sal (1-3 ppt), realizar troca de água, reduzir densidade")
        
        return recomendacoes
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'viveiro_id': self.viveiro_id,
            'data_medicao': self.data_medicao.isoformat() if self.data_medicao else None,
            'temperatura': float(self.temperatura) if self.temperatura else None,
            'transparencia': float(self.transparencia) if self.transparencia else None,
            'cor_agua': self.cor_agua,
            'ph': float(self.ph) if self.ph else None,
            'oxigenio_dissolvido': float(self.oxigenio_dissolvido) if self.oxigenio_dissolvido else None,
            'amonia_total': float(self.amonia_total) if self.amonia_total else None,
            'amonia_nao_ionizada': float(self.amonia_nao_ionizada) if self.amonia_nao_ionizada else None,
            'nitrito': float(self.nitrito) if self.nitrito else None,
            'nitrato': float(self.nitrato) if self.nitrato else None,
            'dureza_total': float(self.dureza_total) if self.dureza_total else None,
            'alcalinidade': float(self.alcalinidade) if self.alcalinidade else None,
            'condutividade': float(self.condutividade) if self.condutividade else None,
            'salinidade': float(self.salinidade) if self.salinidade else None,
            'fitoplancton': self.fitoplancton,
            'zooplancton': self.zooplancton,
            'status_geral': self.status_geral.value if self.status_geral else None,
            'observacoes': self.observacoes,
            'acoes_corretivas': self.acoes_corretivas,
            'responsavel': self.responsavel,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None,
            'alertas': self.avaliar_parametros(),
            'recomendacoes': self.gerar_recomendacoes()
        }

class ParametroIdeal(db.Model):
    __tablename__ = 'parametros_ideais'
    
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    especie_id = db.Column(db.Integer, db.ForeignKey('especies_peixe.id'), nullable=False)
    
    # Faixas ideais para cada parâmetro
    temperatura_min = db.Column(db.Numeric(5, 2))
    temperatura_max = db.Column(db.Numeric(5, 2))
    ph_min = db.Column(db.Numeric(4, 2))
    ph_max = db.Column(db.Numeric(4, 2))
    oxigenio_min = db.Column(db.Numeric(5, 2))
    oxigenio_max = db.Column(db.Numeric(5, 2))
    amonia_max = db.Column(db.Numeric(6, 3))
    nitrito_max = db.Column(db.Numeric(6, 3))
    
    # Observações específicas
    observacoes = db.Column(db.Text)
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'especie_id': self.especie_id,
            'temperatura_min': float(self.temperatura_min) if self.temperatura_min else None,
            'temperatura_max': float(self.temperatura_max) if self.temperatura_max else None,
            'ph_min': float(self.ph_min) if self.ph_min else None,
            'ph_max': float(self.ph_max) if self.ph_max else None,
            'oxigenio_min': float(self.oxigenio_min) if self.oxigenio_min else None,
            'oxigenio_max': float(self.oxigenio_max) if self.oxigenio_max else None,
            'amonia_max': float(self.amonia_max) if self.amonia_max else None,
            'nitrito_max': float(self.nitrito_max) if self.nitrito_max else None,
            'observacoes': self.observacoes,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None
        }

class AlertaQualidade(db.Model):
    __tablename__ = 'alertas_qualidade'
    
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    medicao_id = db.Column(db.Integer, db.ForeignKey('qualidade_agua.id'), nullable=False)
    
    # Tipo e severidade do alerta
    tipo_alerta = db.Column(db.String(50))  # temperatura, ph, oxigenio, etc.
    severidade = db.Column(db.Enum(StatusMedicaoEnum))
    mensagem = db.Column(db.Text)
    
    # Status do alerta
    resolvido = db.Column(db.Boolean, default=False)
    data_resolucao = db.Column(db.DateTime)
    observacoes_resolucao = db.Column(db.Text)
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'medicao_id': self.medicao_id,
            'tipo_alerta': self.tipo_alerta,
            'severidade': self.severidade.value if self.severidade else None,
            'mensagem': self.mensagem,
            'resolvido': self.resolvido,
            'data_resolucao': self.data_resolucao.isoformat() if self.data_resolucao else None,
            'observacoes_resolucao': self.observacoes_resolucao,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None
        }