#!/usr/bin/env python3
"""
Script de Seed Data - Simão IA Rural
Popula banco de dados com dados iniciais para demonstração
Inclui espécies de peixes, viveiros exemplo e configurações padrão
"""

import os
import sys
import logging
from datetime import datetime, timedelta
from decimal import Decimal

# Ajustar path para importações
sys.path.insert(0, os.path.dirname(__file__))

from src.models.user import db, Cliente, User
from src.models.estoque_peixe import EspeciePeixe, Viveiro, LotePeixe, TipoMovimentacao, MovimentacaoEstoque
from src.models.qualidade_agua import ParametroIdeal
from flask import Flask

# Configurar logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class DataSeeder:
    """Classe para popular banco com dados iniciais"""
    
    def __init__(self, app):
        self.app = app
    
    def seed_especies_padrao(self, cliente_id: int):
        """Cria espécies padrão da piscicultura brasileira"""
        
        logger.info("📋 Criando espécies padrão...")
        
        especies_padrao = [
            {
                'nome': 'Tilápia',
                'nome_cientifico': 'Oreochromis niloticus',
                'peso_medio_adulto': Decimal('0.8'),
                'tempo_engorda': 180,
                'temperatura_ideal_min': Decimal('24.0'),
                'temperatura_ideal_max': Decimal('30.0'),
                'ph_ideal_min': Decimal('6.5'),
                'ph_ideal_max': Decimal('8.5'),
                'observacoes': 'Espécie mais cultivada no Brasil, resistente e de rápido crescimento'
            },
            {
                'nome': 'Tambaqui',
                'nome_cientifico': 'Colossoma macropomum',
                'peso_medio_adulto': Decimal('3.0'),
                'tempo_engorda': 365,
                'temperatura_ideal_min': Decimal('26.0'),
                'temperatura_ideal_max': Decimal('32.0'),
                'ph_ideal_min': Decimal('6.0'),
                'ph_ideal_max': Decimal('8.0'),
                'observacoes': 'Peixe nativo da Amazônia, excelente para clima tropical'
            },
            {
                'nome': 'Pirarucu',
                'nome_cientifico': 'Arapaima gigas',
                'peso_medio_adulto': Decimal('50.0'),
                'tempo_engorda': 730,
                'temperatura_ideal_min': Decimal('24.0'),
                'temperatura_ideal_max': Decimal('30.0'),
                'ph_ideal_min': Decimal('6.0'),
                'ph_ideal_max': Decimal('7.5'),
                'observacoes': 'Gigante da Amazônia, alto valor comercial, manejo mais complexo'
            },
            {
                'nome': 'Pacu',
                'nome_cientifico': 'Piaractus mesopotamicus',
                'peso_medio_adulto': Decimal('2.5'),
                'tempo_engorda': 300,
                'temperatura_ideal_min': Decimal('22.0'),
                'temperatura_ideal_max': Decimal('28.0'),
                'ph_ideal_min': Decimal('6.5'),
                'ph_ideal_max': Decimal('8.0'),
                'observacoes': 'Excelente para policultivo, omnívoro, crescimento rápido'
            },
            {
                'nome': 'Pintado',
                'nome_cientifico': 'Pseudoplatystoma corruscans',
                'peso_medio_adulto': Decimal('15.0'),
                'tempo_engorda': 540,
                'temperatura_ideal_min': Decimal('24.0'),
                'temperatura_ideal_max': Decimal('30.0'),
                'ph_ideal_min': Decimal('6.5'),
                'ph_ideal_max': Decimal('7.5'),
                'observacoes': 'Peixe carnívoro, alto valor comercial, exige alimentação específica'
            },
            {
                'nome': 'Dourado',
                'nome_cientifico': 'Salminus brasiliensis',
                'peso_medio_adulto': Decimal('8.0'),
                'tempo_engorda': 480,
                'temperatura_ideal_min': Decimal('22.0'),
                'temperatura_ideal_max': Decimal('28.0'),
                'ph_ideal_min': Decimal('6.5'),
                'ph_ideal_max': Decimal('7.5'),
                'observacoes': 'Peixe esportivo e de consumo, exige água corrente'
            }
        ]
        
        especies_criadas = []
        for dados in especies_padrao:
            # Verificar se já existe
            existente = EspeciePeixe.query.filter_by(
                cliente_id=cliente_id,
                nome=dados['nome']
            ).first()
            
            if not existente:
                especie = EspeciePeixe(
                    cliente_id=cliente_id,
                    **dados
                )
                db.session.add(especie)
                especies_criadas.append(especie)
                logger.info(f"  🐟 Criada espécie: {dados['nome']}")
            else:
                especies_criadas.append(existente)
                logger.info(f"  ✅ Espécie já existe: {dados['nome']}")
        
        db.session.commit()
        logger.info(f"✅ {len(especies_criadas)} espécies configuradas")
        return especies_criadas
    
    def seed_parametros_ideais(self, cliente_id: int, especies: list):
        """Cria parâmetros ideais para cada espécie"""
        
        logger.info("📊 Criando parâmetros ideais de qualidade da água...")
        
        parametros_por_especie = {
            'Tilápia': {
                'ph_min': Decimal('6.5'), 'ph_max': Decimal('8.5'),
                'oxigenio_min': Decimal('4.0'),
                'temperatura_min': Decimal('24.0'), 'temperatura_max': Decimal('30.0'),
                'amonia_max': Decimal('0.5'), 'nitrito_max': Decimal('0.5'),
                'nitrato_max': Decimal('50.0'),
                'alcalinidade_min': Decimal('50.0'), 'alcalinidade_max': Decimal('200.0'),
                'dureza_min': Decimal('50.0'), 'dureza_max': Decimal('300.0'),
                'observacoes': 'Tilápia é resistente a variações, mas mantém melhor performance nos parâmetros ideais'
            },
            'Tambaqui': {
                'ph_min': Decimal('6.0'), 'ph_max': Decimal('8.0'),
                'oxigenio_min': Decimal('3.5'),
                'temperatura_min': Decimal('26.0'), 'temperatura_max': Decimal('32.0'),
                'amonia_max': Decimal('0.3'), 'nitrito_max': Decimal('0.3'),
                'nitrato_max': Decimal('40.0'),
                'alcalinidade_min': Decimal('40.0'), 'alcalinidade_max': Decimal('150.0'),
                'dureza_min': Decimal('30.0'), 'dureza_max': Decimal('200.0'),
                'observacoes': 'Tambaqui prefere águas mais quentes e ligeiramente ácidas'
            },
            'Pirarucu': {
                'ph_min': Decimal('6.0'), 'ph_max': Decimal('7.5'),
                'oxigenio_min': Decimal('2.0'),  # Respira ar atmosférico
                'temperatura_min': Decimal('24.0'), 'temperatura_max': Decimal('30.0'),
                'amonia_max': Decimal('0.2'), 'nitrito_max': Decimal('0.2'),
                'nitrato_max': Decimal('30.0'),
                'alcalinidade_min': Decimal('30.0'), 'alcalinidade_max': Decimal('120.0'),
                'dureza_min': Decimal('20.0'), 'dureza_max': Decimal('150.0'),
                'observacoes': 'Pirarucu respira ar atmosférico, menos dependente do oxigênio dissolvido'
            },
            'Pacu': {
                'ph_min': Decimal('6.5'), 'ph_max': Decimal('8.0'),
                'oxigenio_min': Decimal('4.5'),
                'temperatura_min': Decimal('22.0'), 'temperatura_max': Decimal('28.0'),
                'amonia_max': Decimal('0.4'), 'nitrito_max': Decimal('0.4'),
                'nitrato_max': Decimal('45.0'),
                'alcalinidade_min': Decimal('45.0'), 'alcalinidade_max': Decimal('180.0'),
                'dureza_min': Decimal('40.0'), 'dureza_max': Decimal('250.0'),
                'observacoes': 'Pacu tolera variações mas prefere águas bem oxigenadas'
            }
        }
        
        parametros_criados = 0
        for especie in especies:
            if especie.nome in parametros_por_especie:
                # Verificar se já existe
                existente = ParametroIdeal.query.filter_by(
                    cliente_id=cliente_id,
                    especie_id=especie.id
                ).first()
                
                if not existente:
                    parametro = ParametroIdeal(
                        cliente_id=cliente_id,
                        especie_id=especie.id,
                        **parametros_por_especie[especie.nome]
                    )
                    db.session.add(parametro)
                    parametros_criados += 1
                    logger.info(f"  📊 Criados parâmetros para: {especie.nome}")
        
        db.session.commit()
        logger.info(f"✅ {parametros_criados} parâmetros ideais configurados")
    
    def seed_viveiros_exemplo(self, cliente_id: int):
        """Cria viveiros de exemplo"""
        
        logger.info("🏊 Criando viveiros de exemplo...")
        
        viveiros_exemplo = [
            {
                'nome': 'Viveiro Principal 01',
                'tipo_sistema': 'escavado',
                'capacidade_litros': Decimal('50000.0'),  # 50m³
                'profundidade_media': Decimal('1.8'),
                'formato': 'retangular',
                'revestimento': 'terra',
                'aeracao': True,
                'filtragem': False,
                'observacoes': 'Viveiro principal para tilápia, com sistema de aeração'
            },
            {
                'nome': 'Viveiro Berçário',
                'tipo_sistema': 'escavado',
                'capacidade_litros': Decimal('10000.0'),  # 10m³
                'profundidade_media': Decimal('1.2'),
                'formato': 'circular',
                'revestimento': 'lona',
                'aeracao': True,
                'filtragem': True,
                'observacoes': 'Berçário para alevinos, com filtragem e aeração intensiva'
            },
            {
                'nome': 'Tanque Tambaqui',
                'tipo_sistema': 'escavado',
                'capacidade_litros': Decimal('80000.0'),  # 80m³
                'profundidade_media': Decimal('2.5'),
                'formato': 'retangular',
                'revestimento': 'terra',
                'aeracao': False,
                'filtragem': False,
                'observacoes': 'Tanque grande para engorda de tambaqui'
            },
            {
                'nome': 'Raceway 01',
                'tipo_sistema': 'raceways',
                'capacidade_litros': Decimal('15000.0'),  # 15m³
                'profundidade_media': Decimal('1.0'),
                'formato': 'retangular',
                'revestimento': 'concreto',
                'aeracao': True,
                'filtragem': True,
                'observacoes': 'Sistema raceway para alta densidade'
            }
        ]
        
        viveiros_criados = []
        for dados in viveiros_exemplo:
            # Verificar se já existe
            existente = Viveiro.query.filter_by(
                cliente_id=cliente_id,
                nome=dados['nome']
            ).first()
            
            if not existente:
                viveiro = Viveiro(
                    cliente_id=cliente_id,
                    **dados
                )
                db.session.add(viveiro)
                viveiros_criados.append(viveiro)
                logger.info(f"  🏊 Criado viveiro: {dados['nome']}")
            else:
                viveiros_criados.append(existente)
                logger.info(f"  ✅ Viveiro já existe: {dados['nome']}")
        
        db.session.commit()
        logger.info(f"✅ {len(viveiros_criados)} viveiros configurados")
        return viveiros_criados
    
    def seed_lotes_exemplo(self, cliente_id: int, especies: list, viveiros: list):
        """Cria lotes de exemplo"""
        
        logger.info("🐠 Criando lotes de exemplo...")
        
        # Encontrar espécies específicas
        tilapia = next((e for e in especies if e.nome == 'Tilápia'), None)
        tambaqui = next((e for e in especies if e.nome == 'Tambaqui'), None)
        
        # Encontrar viveiros específicos
        viveiro_principal = next((v for v in viveiros if 'Principal' in v.nome), None)
        viveiro_tambaqui = next((v for v in viveiros if 'Tambaqui' in v.nome), None)
        
        lotes_exemplo = []
        
        if tilapia and viveiro_principal:
            lotes_exemplo.append({
                'especie': tilapia,
                'viveiro': viveiro_principal,
                'codigo': 'TILAP001',
                'quantidade_inicial': 2000,
                'quantidade_atual': 1950,  # Mortalidade baixa
                'peso_medio_inicial': Decimal('0.05'),  # 50g
                'peso_medio_atual': Decimal('0.35'),    # 350g após crescimento
                'data_povoamento': datetime.utcnow() - timedelta(days=90),
                'custo_alevinos': Decimal('600.00'),
                'observacoes': 'Lote de tilápia em fase de engorda, boa performance'
            })
        
        if tambaqui and viveiro_tambaqui:
            lotes_exemplo.append({
                'especie': tambaqui,
                'viveiro': viveiro_tambaqui,
                'codigo': 'TAMB001',
                'quantidade_inicial': 500,
                'quantidade_atual': 485,
                'peso_medio_inicial': Decimal('0.15'),  # 150g
                'peso_medio_atual': Decimal('0.85'),    # 850g
                'data_povoamento': datetime.utcnow() - timedelta(days=150),
                'custo_alevinos': Decimal('750.00'),
                'observacoes': 'Lote de tambaqui com excelente desenvolvimento'
            })
        
        lotes_criados = []
        for dados in lotes_exemplo:
            # Verificar se já existe
            existente = LotePeixe.query.filter_by(
                cliente_id=cliente_id,
                codigo=dados['codigo']
            ).first()
            
            if not existente:
                lote_data = {k: v for k, v in dados.items() if k not in ['especie', 'viveiro']}
                lote = LotePeixe(
                    cliente_id=cliente_id,
                    especie_id=dados['especie'].id,
                    viveiro_id=dados['viveiro'].id,
                    **lote_data
                )
                db.session.add(lote)
                db.session.flush()  # Para obter ID
                
                # Criar movimentação inicial
                movimentacao = MovimentacaoEstoque(
                    cliente_id=cliente_id,
                    lote_id=lote.id,
                    tipo=TipoMovimentacao.ENTRADA,
                    quantidade=lote.quantidade_inicial,
                    peso_medio=lote.peso_medio_inicial,
                    descricao=f"Povoamento inicial - {dados['codigo']}",
                    data_movimentacao=lote.data_povoamento
                )
                db.session.add(movimentacao)
                
                lotes_criados.append(lote)
                logger.info(f"  🐠 Criado lote: {dados['codigo']} ({dados['especie'].nome})")
        
        db.session.commit()
        logger.info(f"✅ {len(lotes_criados)} lotes configurados")
        return lotes_criados
    
    def seed_all_data(self, cliente_id: int = None):
        """Popula todos os dados de exemplo"""
        
        logger.info("🌱 INICIANDO SEED DE DADOS DE EXEMPLO")
        logger.info("=" * 50)
        
        with self.app.app_context():
            if not cliente_id:
                # Buscar primeiro cliente
                cliente = Cliente.query.first()
                if not cliente:
                    logger.error("❌ Nenhum cliente encontrado. Crie um cliente primeiro.")
                    return False
                cliente_id = cliente.id
                logger.info(f"📋 Usando cliente: {cliente.nome_empresa} (ID: {cliente_id})")
            
            try:
                # Criar dados em ordem
                especies = self.seed_especies_padrao(cliente_id)
                self.seed_parametros_ideais(cliente_id, especies)
                viveiros = self.seed_viveiros_exemplo(cliente_id)
                lotes = self.seed_lotes_exemplo(cliente_id, especies, viveiros)
                
                logger.info("=" * 50)
                logger.info("✅ SEED DE DADOS CONCLUÍDO COM SUCESSO!")
                logger.info(f"📊 Resumo:")
                logger.info(f"  🐟 Espécies: {len(especies)}")
                logger.info(f"  🏊 Viveiros: {len(viveiros)}")
                logger.info(f"  🐠 Lotes: {len(lotes)}")
                logger.info("=" * 50)
                
                return True
                
            except Exception as e:
                logger.error(f"❌ Erro durante seed: {e}")
                db.session.rollback()
                raise

def main():
    """Função principal"""
    
    # Configurar Flask app temporária
    app = Flask(__name__)
    
    # Configurar banco de dados
    database_url = os.getenv('DATABASE_URL', 'postgresql://simao_user:simao_password@localhost:5432/simao_db')
    app.config['SQLALCHEMY_DATABASE_URI'] = database_url
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    
    # Inicializar DB
    db.init_app(app)
    
    try:
        seeder = DataSeeder(app)
        
        # Executar seed
        success = seeder.seed_all_data()
        
        if success:
            logger.info("🎉 Seed executado com sucesso!")
        else:
            logger.error("❌ Falha na execução do seed")
            sys.exit(1)
            
    except Exception as e:
        logger.error(f"❌ Erro fatal: {e}")
        sys.exit(1)

if __name__ == "__main__":
    print("""
🐟 SIMÃO IA RURAL - SEED DE DADOS
==================================
📋 Criando dados de exemplo para piscicultura:
  • Espécies brasileiras (Tilápia, Tambaqui, etc.)
  • Viveiros de demonstração  
  • Lotes com histórico
  • Parâmetros ideais de água
==================================
""")
    
    main()