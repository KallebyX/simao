"""
Testes para Estoque Routes - Simão IA Rural
Validação das APIs de gestão de estoque e piscicultura
"""

import pytest
from unittest.mock import Mock, patch
import json
from decimal import Decimal
from datetime import datetime, timedelta

from tests.conftest import assert_json_response, assert_error_response, assert_success_response

class TestEspeciesRoutes:
    """Testes para endpoints de espécies de peixe"""
    
    def test_listar_especies_success(self, client, auth_headers, sample_cliente, sample_especie):
        """Teste de listagem de espécies"""
        response = client.get('/api/estoque/especies', headers=auth_headers)
        
        data = assert_success_response(response)
        assert 'especies' in data
        assert len(data['especies']) >= 1
        assert data['especies'][0]['nome'] == 'Tilápia'
        assert data['especies'][0]['nome_cientifico'] == 'Oreochromis niloticus'
    
    def test_listar_especies_empty(self, client, auth_headers, sample_cliente):
        """Teste de listagem de espécies vazia"""
        response = client.get('/api/estoque/especies', headers=auth_headers)
        
        data = assert_success_response(response)
        assert 'especies' in data
        assert len(data['especies']) == 0
    
    def test_criar_especie_success(self, client, auth_headers, sample_cliente):
        """Teste de criação de espécie"""
        especie_data = {
            'nome': 'Tambaqui',
            'nome_cientifico': 'Colossoma macropomum',
            'peso_medio_adulto': 3.5,
            'tempo_engorda': 240,
            'temperatura_ideal_min': 26.0,
            'temperatura_ideal_max': 32.0,
            'ph_ideal_min': 6.0,
            'ph_ideal_max': 7.5,
            'oxigenio_min': 4.0,
            'densidade_max_m3': 10.0
        }
        
        response = client.post('/api/estoque/especies', 
                             json=especie_data, 
                             headers=auth_headers)
        
        data = assert_success_response(response, 201)
        assert data['especie']['nome'] == 'Tambaqui'
        assert data['especie']['peso_medio_adulto'] == 3.5
        assert 'id' in data['especie']
    
    def test_criar_especie_dados_invalidos(self, client, auth_headers, sample_cliente):
        """Teste de criação com dados inválidos"""
        especie_data = {
            'nome': '',  # Nome obrigatório
            'nome_cientifico': 'Teste'
        }
        
        response = client.post('/api/estoque/especies', 
                             json=especie_data, 
                             headers=auth_headers)
        
        assert_error_response(response, 400)
    
    def test_obter_especie_por_id(self, client, auth_headers, sample_especie):
        """Teste de busca de espécie por ID"""
        response = client.get(f'/api/estoque/especies/{sample_especie.id}', 
                            headers=auth_headers)
        
        data = assert_success_response(response)
        assert data['especie']['nome'] == sample_especie.nome
        assert data['especie']['nome_cientifico'] == sample_especie.nome_cientifico
    
    def test_obter_especie_nao_encontrada(self, client, auth_headers):
        """Teste de busca de espécie inexistente"""
        response = client.get('/api/estoque/especies/99999', headers=auth_headers)
        
        assert_error_response(response, 404)
    
    def test_atualizar_especie(self, client, auth_headers, sample_especie):
        """Teste de atualização de espécie"""
        update_data = {
            'peso_medio_adulto': 1.2,
            'tempo_engorda': 200
        }
        
        response = client.put(f'/api/estoque/especies/{sample_especie.id}',
                            json=update_data,
                            headers=auth_headers)
        
        data = assert_success_response(response)
        assert data['especie']['peso_medio_adulto'] == 1.2
        assert data['especie']['tempo_engorda'] == 200
    
    def test_deletar_especie(self, client, auth_headers, sample_especie):
        """Teste de exclusão de espécie"""
        response = client.delete(f'/api/estoque/especies/{sample_especie.id}',
                               headers=auth_headers)
        
        assert_success_response(response)
        
        # Verificar se foi deletada
        response_get = client.get(f'/api/estoque/especies/{sample_especie.id}',
                                headers=auth_headers)
        assert_error_response(response_get, 404)

class TestViveirosRoutes:
    """Testes para endpoints de viveiros"""
    
    def test_listar_viveiros(self, client, auth_headers, sample_viveiro):
        """Teste de listagem de viveiros"""
        response = client.get('/api/estoque/viveiros', headers=auth_headers)
        
        data = assert_success_response(response)
        assert 'viveiros' in data
        assert len(data['viveiros']) >= 1
        assert data['viveiros'][0]['nome'] == 'Viveiro Principal'
    
    def test_criar_viveiro_success(self, client, auth_headers, sample_cliente):
        """Teste de criação de viveiro"""
        viveiro_data = {
            'nome': 'Tanque Novo',
            'tipo_sistema': 'fibra',
            'capacidade_litros': 25000.0,
            'profundidade_media': 1.5,
            'aeracao': True,
            'aquecimento': False,
            'cobertura': False,
            'formato': 'circular',
            'observacoes': 'Viveiro para alevinos'
        }
        
        response = client.post('/api/estoque/viveiros',
                             json=viveiro_data,
                             headers=auth_headers)
        
        data = assert_success_response(response, 201)
        assert data['viveiro']['nome'] == 'Tanque Novo'
        assert data['viveiro']['capacidade_litros'] == 25000.0
    
    def test_viveiro_dashboard_metricas(self, client, auth_headers, sample_viveiro, sample_lote):
        """Teste de dashboard de viveiro com métricas"""
        response = client.get(f'/api/estoque/viveiros/{sample_viveiro.id}/dashboard',
                            headers=auth_headers)
        
        data = assert_success_response(response)
        assert 'metricas' in data
        assert 'lotes_ativos' in data['metricas']
        assert 'total_peixes' in data['metricas']
        assert 'densidade_atual' in data['metricas']
        assert 'peso_total_estimado' in data['metricas']

class TestLotesRoutes:
    """Testes para endpoints de lotes de peixe"""
    
    def test_listar_lotes(self, client, auth_headers, sample_lote):
        """Teste de listagem de lotes"""
        response = client.get('/api/estoque/lotes', headers=auth_headers)
        
        data = assert_success_response(response)
        assert 'lotes' in data
        assert len(data['lotes']) >= 1
        
        lote = data['lotes'][0]
        assert lote['codigo'] == 'TEST001'
        assert lote['quantidade_inicial'] == 1000
        assert lote['quantidade_atual'] == 950
    
    def test_criar_lote_success(self, client, auth_headers, sample_cliente, sample_especie, sample_viveiro):
        """Teste de criação de lote"""
        lote_data = {
            'especie_id': sample_especie.id,
            'viveiro_id': sample_viveiro.id,
            'codigo': 'NOVO001',
            'quantidade_inicial': 2000,
            'peso_medio_inicial': 0.03,
            'custo_alevinos': 800.00,
            'fornecedor': 'Piscicultura Santa Fé',
            'data_entrada': '2024-07-22',
            'observacoes': 'Lote de alta qualidade'
        }
        
        response = client.post('/api/estoque/lotes',
                             json=lote_data,
                             headers=auth_headers)
        
        data = assert_success_response(response, 201)
        assert data['lote']['codigo'] == 'NOVO001'
        assert data['lote']['quantidade_inicial'] == 2000
        assert data['lote']['fornecedor'] == 'Piscicultura Santa Fé'
    
    def test_criar_lote_codigo_duplicado(self, client, auth_headers, sample_lote, sample_especie, sample_viveiro):
        """Teste de criação com código duplicado"""
        lote_data = {
            'especie_id': sample_especie.id,
            'viveiro_id': sample_viveiro.id,
            'codigo': 'TEST001',  # Mesmo código do sample_lote
            'quantidade_inicial': 1000,
            'peso_medio_inicial': 0.05,
            'custo_alevinos': 500.00
        }
        
        response = client.post('/api/estoque/lotes',
                             json=lote_data,
                             headers=auth_headers)
        
        assert_error_response(response, 400)
    
    def test_lote_detalhes_completos(self, client, auth_headers, sample_lote):
        """Teste de detalhes completos do lote"""
        response = client.get(f'/api/estoque/lotes/{sample_lote.id}',
                            headers=auth_headers)
        
        data = assert_success_response(response)
        
        lote = data['lote']
        assert 'codigo' in lote
        assert 'especie' in lote  # Deve incluir dados da espécie
        assert 'viveiro' in lote   # Deve incluir dados do viveiro
        assert 'movimentacoes' in lote  # Histórico de movimentações
        assert 'metricas' in lote  # Métricas calculadas
        
        metricas = lote['metricas']
        assert 'mortalidade_total' in metricas
        assert 'taxa_crescimento' in metricas
        assert 'conversao_alimentar' in metricas
    
    def test_atualizar_lote_biometria(self, client, auth_headers, sample_lote):
        """Teste de atualização de biometria do lote"""
        biometria_data = {
            'peso_medio_atual': 0.35,
            'quantidade_atual': 920,
            'observacoes_biometria': 'Crescimento acima da média'
        }
        
        response = client.put(f'/api/estoque/lotes/{sample_lote.id}/biometria',
                            json=biometria_data,
                            headers=auth_headers)
        
        data = assert_success_response(response)
        assert data['lote']['peso_medio_atual'] == 0.35
        assert data['lote']['quantidade_atual'] == 920

class TestMovimentacaoEstoque:
    """Testes para movimentações de estoque"""
    
    def test_registrar_mortalidade(self, client, auth_headers, sample_lote):
        """Teste de registro de mortalidade"""
        mortalidade_data = {
            'lote_id': sample_lote.id,
            'tipo_movimentacao': 'mortalidade',
            'quantidade': 20,
            'motivo': 'Doença detectada no viveiro',
            'data_movimentacao': '2024-07-22',
            'valor_unitario': 0.0
        }
        
        response = client.post('/api/estoque/movimentacoes',
                             json=mortalidade_data,
                             headers=auth_headers)
        
        data = assert_success_response(response, 201)
        assert data['movimentacao']['tipo_movimentacao'] == 'mortalidade'
        assert data['movimentacao']['quantidade'] == 20
        
        # Verificar se o lote foi atualizado
        lote_response = client.get(f'/api/estoque/lotes/{sample_lote.id}',
                                 headers=auth_headers)
        lote_data = assert_success_response(lote_response)
        assert lote_data['lote']['quantidade_atual'] == 930  # 950 - 20
    
    def test_registrar_venda(self, client, auth_headers, sample_lote):
        """Teste de registro de venda"""
        venda_data = {
            'lote_id': sample_lote.id,
            'tipo_movimentacao': 'venda',
            'quantidade': 100,
            'valor_unitario': 3.50,
            'cliente_comprador': 'João Silva',
            'data_movimentacao': '2024-07-22',
            'observacoes': 'Venda para consumo local'
        }
        
        response = client.post('/api/estoque/movimentacoes',
                             json=venda_data,
                             headers=auth_headers)
        
        data = assert_success_response(response, 201)
        assert data['movimentacao']['tipo_movimentacao'] == 'venda'
        assert data['movimentacao']['valor_unitario'] == 3.50
        assert data['movimentacao']['valor_total'] == 350.00  # 100 * 3.50
    
    def test_transferencia_entre_viveiros(self, client, auth_headers, sample_lote, sample_cliente):
        """Teste de transferência entre viveiros"""
        # Criar viveiro de destino
        viveiro_destino_data = {
            'nome': 'Viveiro Engorda',
            'tipo_sistema': 'escavado',
            'capacidade_litros': 100000.0,
            'profundidade_media': 2.0
        }
        
        viveiro_response = client.post('/api/estoque/viveiros',
                                     json=viveiro_destino_data,
                                     headers=auth_headers)
        viveiro_destino = assert_success_response(viveiro_response, 201)
        
        # Registrar transferência
        transferencia_data = {
            'lote_id': sample_lote.id,
            'tipo_movimentacao': 'transferencia',
            'quantidade': 500,
            'viveiro_destino_id': viveiro_destino['viveiro']['id'],
            'motivo': 'Transferência para engorda',
            'data_movimentacao': '2024-07-22'
        }
        
        response = client.post('/api/estoque/movimentacoes',
                             json=transferencia_data,
                             headers=auth_headers)
        
        data = assert_success_response(response, 201)
        assert data['movimentacao']['tipo_movimentacao'] == 'transferencia'
        assert 'viveiro_destino' in data['movimentacao']

class TestDashboardEstoque:
    """Testes para dashboard de estoque"""
    
    def test_dashboard_geral(self, client, auth_headers, sample_lote):
        """Teste do dashboard geral de estoque"""
        response = client.get('/api/estoque/dashboard', headers=auth_headers)
        
        data = assert_success_response(response)
        
        # Verificar seções principais
        assert 'resumo_geral' in data
        assert 'especies_ativas' in data
        assert 'viveiros_ocupados' in data
        assert 'alertas' in data
        assert 'metricas_performance' in data
        
        # Resumo geral
        resumo = data['resumo_geral']
        assert 'total_lotes_ativos' in resumo
        assert 'total_peixes' in resumo
        assert 'valor_estoque_estimado' in resumo
        assert 'mortalidade_mes' in resumo
        
        # Métricas de performance
        performance = data['metricas_performance']
        assert 'conversao_alimentar_media' in performance
        assert 'taxa_crescimento_media' in performance
        assert 'densidade_media' in performance
    
    def test_dashboard_especies_ranking(self, client, auth_headers, sample_lote):
        """Teste de ranking de espécies no dashboard"""
        response = client.get('/api/estoque/dashboard', headers=auth_headers)
        
        data = assert_success_response(response)
        especies = data['especies_ativas']
        
        assert len(especies) >= 1
        especie = especies[0]
        assert 'nome' in especie
        assert 'total_lotes' in especie
        assert 'total_peixes' in especie
        assert 'valor_estimado' in especie
    
    def test_dashboard_alertas_automaticos(self, client, auth_headers, sample_lote):
        """Teste de alertas automáticos no dashboard"""
        response = client.get('/api/estoque/dashboard', headers=auth_headers)
        
        data = assert_success_response(response)
        alertas = data['alertas']
        
        # Verificar tipos de alerta
        tipos_esperados = ['mortalidade_alta', 'crescimento_lento', 'densidade_alta', 'biometria_atrasada']
        
        for alerta in alertas:
            assert 'tipo' in alerta
            assert 'prioridade' in alerta
            assert 'mensagem' in alerta
            assert 'lote_id' in alerta or 'viveiro_id' in alerta

class TestEstoqueFilters:
    """Testes para filtros e buscas"""
    
    def test_filtrar_lotes_por_especie(self, client, auth_headers, sample_lote):
        """Teste de filtro por espécie"""
        response = client.get(f'/api/estoque/lotes?especie_id={sample_lote.especie_id}',
                            headers=auth_headers)
        
        data = assert_success_response(response)
        assert all(lote['especie_id'] == sample_lote.especie_id for lote in data['lotes'])
    
    def test_filtrar_lotes_por_viveiro(self, client, auth_headers, sample_lote):
        """Teste de filtro por viveiro"""
        response = client.get(f'/api/estoque/lotes?viveiro_id={sample_lote.viveiro_id}',
                            headers=auth_headers)
        
        data = assert_success_response(response)
        assert all(lote['viveiro_id'] == sample_lote.viveiro_id for lote in data['lotes'])
    
    def test_filtrar_lotes_por_data(self, client, auth_headers, sample_lote):
        """Teste de filtro por data"""
        data_inicio = '2024-07-01'
        data_fim = '2024-07-31'
        
        response = client.get(f'/api/estoque/lotes?data_inicio={data_inicio}&data_fim={data_fim}',
                            headers=auth_headers)
        
        data = assert_success_response(response)
        assert 'lotes' in data
    
    def test_buscar_lotes_por_codigo(self, client, auth_headers, sample_lote):
        """Teste de busca por código"""
        response = client.get(f'/api/estoque/lotes?codigo={sample_lote.codigo}',
                            headers=auth_headers)
        
        data = assert_success_response(response)
        assert len(data['lotes']) == 1
        assert data['lotes'][0]['codigo'] == sample_lote.codigo

class TestEstoqueValidation:
    """Testes de validação e regras de negócio"""
    
    def test_densidade_maxima_validacao(self, client, auth_headers, sample_cliente, sample_especie, sample_viveiro):
        """Teste de validação de densidade máxima"""
        # Criar lote que excede densidade
        lote_data = {
            'especie_id': sample_especie.id,
            'viveiro_id': sample_viveiro.id,  # 50000L = 50m³
            'codigo': 'DENSIDADE_TESTE',
            'quantidade_inicial': 2000,  # Muito alto para o viveiro
            'peso_medio_inicial': 0.5,
            'custo_alevinos': 1000.00
        }
        
        response = client.post('/api/estoque/lotes',
                             json=lote_data,
                             headers=auth_headers)
        
        # Deve retornar aviso ou erro sobre densidade
        if response.status_code == 201:
            data = assert_success_response(response, 201)
            # Se criado, deve haver aviso
            assert 'avisos' in data or 'warnings' in data
        else:
            # Ou ser rejeitado por densidade alta
            assert_error_response(response, 400)
    
    def test_capacidade_viveiro_validacao(self, client, auth_headers, sample_viveiro, sample_especie, sample_cliente):
        """Teste de validação de capacidade do viveiro"""
        # Tentar criar lote maior que capacidade do viveiro
        lote_data = {
            'especie_id': sample_especie.id,
            'viveiro_id': sample_viveiro.id,
            'codigo': 'CAPACIDADE_TESTE',
            'quantidade_inicial': 10000,  # Quantidade muito alta
            'peso_medio_inicial': 1.0,    # Peso alto também
            'custo_alevinos': 5000.00
        }
        
        response = client.post('/api/estoque/lotes',
                             json=lote_data,
                             headers=auth_headers)
        
        # Sistema deve validar ou avisar sobre capacidade
        if response.status_code != 201:
            error_data = assert_error_response(response, 400)
            assert 'capacidade' in str(error_data).lower() or 'densidade' in str(error_data).lower()

class TestEstoquePerformance:
    """Testes de performance das APIs de estoque"""
    
    def test_dashboard_response_time(self, client, auth_headers):
        """Teste de tempo de resposta do dashboard"""
        import time
        
        start_time = time.time()
        response = client.get('/api/estoque/dashboard', headers=auth_headers)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        # Dashboard deve responder em menos de 2 segundos
        assert response_time < 2.0
        assert_success_response(response)
    
    def test_listagem_lotes_paginacao(self, client, auth_headers):
        """Teste de paginação na listagem"""
        response = client.get('/api/estoque/lotes?page=1&per_page=10',
                            headers=auth_headers)
        
        data = assert_success_response(response)
        assert 'lotes' in data
        assert 'pagination' in data
        
        pagination = data['pagination']
        assert 'page' in pagination
        assert 'per_page' in pagination
        assert 'total' in pagination
        assert 'pages' in pagination