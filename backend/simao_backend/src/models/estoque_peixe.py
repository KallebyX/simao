from datetime import datetime
from enum import Enum
from decimal import Decimal

# Usar a instância db do módulo user
from .user import db

class TipoMovimentacaoEnum(Enum):
    ENTRADA = "entrada"
    SAIDA = "saida"
    TRANSFERENCIA = "transferencia"
    MORTALIDADE = "mortalidade"
    AJUSTE = "ajuste"

class StatusLoteEnum(Enum):
    ATIVO = "ativo"
    VENDIDO = "vendido"
    MORTO = "morto"
    TRANSFERIDO = "transferido"

class EspeciePeixe(db.Model):
    __tablename__ = 'especies_peixe'
    
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    
    # Informações da espécie
    nome_popular = db.Column(db.String(100), nullable=False)  # Tilápia, Tambaqui, Pirarucu, etc.
    nome_cientifico = db.Column(db.String(100))
    categoria = db.Column(db.String(50))  # alevino, juvenil, reprodutor, consumo
    
    # Características técnicas
    peso_medio_inicial = db.Column(db.Numeric(8, 3))  # gramas
    peso_medio_final = db.Column(db.Numeric(8, 3))  # gramas
    tempo_criacao = db.Column(db.Integer)  # dias
    densidade_recomendada = db.Column(db.Integer)  # peixes/m³
    temperatura_ideal_min = db.Column(db.Numeric(5, 2))  # °C
    temperatura_ideal_max = db.Column(db.Numeric(5, 2))  # °C
    
    # Preços
    preco_compra = db.Column(db.Numeric(10, 2))
    preco_venda = db.Column(db.Numeric(10, 2))
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    lotes = db.relationship('LotePeixe', backref='especie', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'nome_popular': self.nome_popular,
            'nome_cientifico': self.nome_cientifico,
            'categoria': self.categoria,
            'peso_medio_inicial': float(self.peso_medio_inicial) if self.peso_medio_inicial else None,
            'peso_medio_final': float(self.peso_medio_final) if self.peso_medio_final else None,
            'tempo_criacao': self.tempo_criacao,
            'densidade_recomendada': self.densidade_recomendada,
            'temperatura_ideal_min': float(self.temperatura_ideal_min) if self.temperatura_ideal_min else None,
            'temperatura_ideal_max': float(self.temperatura_ideal_max) if self.temperatura_ideal_max else None,
            'preco_compra': float(self.preco_compra) if self.preco_compra else None,
            'preco_venda': float(self.preco_venda) if self.preco_venda else None,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None
        }

class Viveiro(db.Model):
    __tablename__ = 'viveiros'
    
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    
    # Identificação
    nome = db.Column(db.String(50), nullable=False)  # Viveiro 01, Tanque A, etc.
    codigo = db.Column(db.String(20))
    
    # Características físicas
    area = db.Column(db.Numeric(10, 2))  # m²
    volume = db.Column(db.Numeric(12, 2))  # m³
    profundidade_media = db.Column(db.Numeric(5, 2))  # metros
    tipo_viveiro = db.Column(db.String(50))  # escavado, tanque-rede, raceways, etc.
    
    # Status
    ativo = db.Column(db.Boolean, default=True)
    em_uso = db.Column(db.Boolean, default=False)
    
    # Observações
    observacoes = db.Column(db.Text)
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    lotes = db.relationship('LotePeixe', backref='viveiro', lazy=True)
    medicoes_agua = db.relationship('QualidadeAgua', backref='viveiro', lazy=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'nome': self.nome,
            'codigo': self.codigo,
            'area': float(self.area) if self.area else None,
            'volume': float(self.volume) if self.volume else None,
            'profundidade_media': float(self.profundidade_media) if self.profundidade_media else None,
            'tipo_viveiro': self.tipo_viveiro,
            'ativo': self.ativo,
            'em_uso': self.em_uso,
            'observacoes': self.observacoes,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None
        }

class LotePeixe(db.Model):
    __tablename__ = 'lotes_peixe'
    
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    especie_id = db.Column(db.Integer, db.ForeignKey('especies_peixe.id'), nullable=False)
    viveiro_id = db.Column(db.Integer, db.ForeignKey('viveiros.id'), nullable=True)
    
    # Identificação do lote
    codigo_lote = db.Column(db.String(50), nullable=False)
    
    # Quantidades
    quantidade_inicial = db.Column(db.Integer, nullable=False)
    quantidade_atual = db.Column(db.Integer, nullable=False)
    quantidade_mortalidade = db.Column(db.Integer, default=0)
    quantidade_vendida = db.Column(db.Integer, default=0)
    
    # Pesos
    peso_medio_inicial = db.Column(db.Numeric(8, 3))  # gramas
    peso_medio_atual = db.Column(db.Numeric(8, 3))  # gramas
    peso_total_estimado = db.Column(db.Numeric(12, 3))  # kg
    
    # Datas importantes
    data_entrada = db.Column(db.DateTime, nullable=False)
    data_nascimento = db.Column(db.DateTime)
    data_previsao_venda = db.Column(db.DateTime)
    data_venda = db.Column(db.DateTime)
    
    # Status e origem
    status = db.Column(db.Enum(StatusLoteEnum), default=StatusLoteEnum.ATIVO)
    origem = db.Column(db.String(100))  # fornecedor, reprodução própria, etc.
    
    # Valores financeiros
    custo_aquisicao = db.Column(db.Numeric(10, 2))
    custo_alimentacao = db.Column(db.Numeric(10, 2), default=0)
    custo_medicamentos = db.Column(db.Numeric(10, 2), default=0)
    custo_total = db.Column(db.Numeric(10, 2), default=0)
    receita_venda = db.Column(db.Numeric(10, 2))
    
    # Observações
    observacoes = db.Column(db.Text)
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relacionamentos
    movimentacoes = db.relationship('MovimentacaoEstoque', backref='lote', lazy=True)
    registros_alimentacao = db.relationship('RegistroAlimentacao', backref='lote', lazy=True)
    
    def calcular_taxa_mortalidade(self):
        """Calcula a taxa de mortalidade do lote"""
        if self.quantidade_inicial > 0:
            return (self.quantidade_mortalidade / self.quantidade_inicial) * 100
        return 0
    
    def calcular_ganho_peso(self):
        """Calcula o ganho de peso médio"""
        if self.peso_medio_inicial and self.peso_medio_atual:
            return float(self.peso_medio_atual - self.peso_medio_inicial)
        return 0
    
    def calcular_taxa_conversao_alimentar(self):
        """Calcula a taxa de conversão alimentar (TCA)"""
        if self.custo_alimentacao and self.peso_total_estimado:
            # Simplificado - seria necessário mais dados para cálculo preciso
            return float(self.custo_alimentacao / self.peso_total_estimado)
        return 0
    
    def atualizar_custo_total(self):
        """Atualiza o custo total do lote"""
        custo_aquisicao = self.custo_aquisicao or Decimal('0')
        custo_alimentacao = self.custo_alimentacao or Decimal('0')
        custo_medicamentos = self.custo_medicamentos or Decimal('0')
        
        self.custo_total = custo_aquisicao + custo_alimentacao + custo_medicamentos
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'especie_id': self.especie_id,
            'viveiro_id': self.viveiro_id,
            'codigo_lote': self.codigo_lote,
            'quantidade_inicial': self.quantidade_inicial,
            'quantidade_atual': self.quantidade_atual,
            'quantidade_mortalidade': self.quantidade_mortalidade,
            'quantidade_vendida': self.quantidade_vendida,
            'peso_medio_inicial': float(self.peso_medio_inicial) if self.peso_medio_inicial else None,
            'peso_medio_atual': float(self.peso_medio_atual) if self.peso_medio_atual else None,
            'peso_total_estimado': float(self.peso_total_estimado) if self.peso_total_estimado else None,
            'data_entrada': self.data_entrada.isoformat() if self.data_entrada else None,
            'data_nascimento': self.data_nascimento.isoformat() if self.data_nascimento else None,
            'data_previsao_venda': self.data_previsao_venda.isoformat() if self.data_previsao_venda else None,
            'data_venda': self.data_venda.isoformat() if self.data_venda else None,
            'status': self.status.value if self.status else None,
            'origem': self.origem,
            'custo_aquisicao': float(self.custo_aquisicao) if self.custo_aquisicao else None,
            'custo_alimentacao': float(self.custo_alimentacao) if self.custo_alimentacao else None,
            'custo_medicamentos': float(self.custo_medicamentos) if self.custo_medicamentos else None,
            'custo_total': float(self.custo_total) if self.custo_total else None,
            'receita_venda': float(self.receita_venda) if self.receita_venda else None,
            'observacoes': self.observacoes,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None,
            'taxa_mortalidade': self.calcular_taxa_mortalidade(),
            'ganho_peso': self.calcular_ganho_peso(),
            'taxa_conversao_alimentar': self.calcular_taxa_conversao_alimentar()
        }

class MovimentacaoEstoque(db.Model):
    __tablename__ = 'movimentacoes_estoque'
    
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    lote_id = db.Column(db.Integer, db.ForeignKey('lotes_peixe.id'), nullable=False)
    
    # Tipo da movimentação
    tipo = db.Column(db.Enum(TipoMovimentacaoEnum), nullable=False)
    
    # Quantidades
    quantidade = db.Column(db.Integer, nullable=False)
    peso_medio = db.Column(db.Numeric(8, 3))  # gramas
    peso_total = db.Column(db.Numeric(12, 3))  # kg
    
    # Detalhes da movimentação
    motivo = db.Column(db.String(100))
    observacoes = db.Column(db.Text)
    
    # Valores
    valor_unitario = db.Column(db.Numeric(10, 2))
    valor_total = db.Column(db.Numeric(10, 2))
    
    # Timestamps
    data_movimentacao = db.Column(db.DateTime, nullable=False)
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'lote_id': self.lote_id,
            'tipo': self.tipo.value if self.tipo else None,
            'quantidade': self.quantidade,
            'peso_medio': float(self.peso_medio) if self.peso_medio else None,
            'peso_total': float(self.peso_total) if self.peso_total else None,
            'motivo': self.motivo,
            'observacoes': self.observacoes,
            'valor_unitario': float(self.valor_unitario) if self.valor_unitario else None,
            'valor_total': float(self.valor_total) if self.valor_total else None,
            'data_movimentacao': self.data_movimentacao.isoformat() if self.data_movimentacao else None,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None
        }

class RegistroAlimentacao(db.Model):
    __tablename__ = 'registros_alimentacao'
    
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    lote_id = db.Column(db.Integer, db.ForeignKey('lotes_peixe.id'), nullable=False)
    
    # Dados da alimentação
    data_alimentacao = db.Column(db.DateTime, nullable=False)
    tipo_racao = db.Column(db.String(100))
    quantidade_kg = db.Column(db.Numeric(8, 3))  # kg
    numero_refeicoes = db.Column(db.Integer, default=1)
    
    # Observações
    observacoes = db.Column(db.Text)
    
    # Custo
    custo = db.Column(db.Numeric(10, 2))
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'lote_id': self.lote_id,
            'data_alimentacao': self.data_alimentacao.isoformat() if self.data_alimentacao else None,
            'tipo_racao': self.tipo_racao,
            'quantidade_kg': float(self.quantidade_kg) if self.quantidade_kg else None,
            'numero_refeicoes': self.numero_refeicoes,
            'observacoes': self.observacoes,
            'custo': float(self.custo) if self.custo else None,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None
        }