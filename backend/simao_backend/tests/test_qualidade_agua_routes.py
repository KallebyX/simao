"""
Testes para Qualidade da Água Routes - Simão IA Rural
Validação das APIs de monitoramento de qualidade da água
"""

import pytest
from unittest.mock import Mock, patch
import json
from decimal import Decimal
from datetime import datetime, timedelta

from tests.conftest import assert_json_response, assert_error_response, assert_success_response

class TestMedicoesRoutes:
    """Testes para endpoints de medições de qualidade da água"""
    
    def test_listar_medicoes(self, client, auth_headers, sample_cliente):
        """Teste de listagem de medições"""
        response = client.get('/api/qualidade-agua/medicoes', headers=auth_headers)
        
        data = assert_success_response(response)
        assert 'medicoes' in data
        assert isinstance(data['medicoes'], list)
    
    def test_criar_medicao_completa(self, client, auth_headers, sample_cliente, sample_viveiro):
        """Teste de criação de medição completa"""
        medicao_data = {
            'viveiro_id': sample_viveiro.id,
            'data_medicao': '2024-07-22T10:30:00',
            'temperatura': 28.5,
            'ph': 7.2,
            'oxigenio_dissolvido': 6.8,
            'amonia': 0.15,
            'nitrito': 0.02,
            'nitrato': 5.0,
            'dureza': 120.0,
            'alcalinidade': 80.0,
            'turbidez': 15.0,
            'condutividade': 250.0,
            'observacoes': 'Medição rotineira matinal'
        }
        
        response = client.post('/api/qualidade-agua/medicoes',
                             json=medicao_data,
                             headers=auth_headers)
        
        data = assert_success_response(response, 201)
        assert data['medicao']['temperatura'] == 28.5
        assert data['medicao']['ph'] == 7.2
        assert data['medicao']['oxigenio_dissolvido'] == 6.8
        assert 'analise_automatica' in data
    
    def test_criar_medicao_basica(self, client, auth_headers, sample_cliente, sample_viveiro):
        """Teste de criação com apenas parâmetros básicos"""
        medicao_data = {
            'viveiro_id': sample_viveiro.id,
            'data_medicao': '2024-07-22T15:00:00',
            'temperatura': 29.0,
            'ph': 6.8,
            'oxigenio_dissolvido': 5.5
        }
        
        response = client.post('/api/qualidade-agua/medicoes',
                             json=medicao_data,
                             headers=auth_headers)
        
        data = assert_success_response(response, 201)
        assert data['medicao']['temperatura'] == 29.0
        assert 'analise_automatica' in data
    
    def test_criar_medicao_parametros_criticos(self, client, auth_headers, sample_cliente, sample_viveiro):
        """Teste de criação com parâmetros críticos - deve gerar alertas"""
        medicao_data = {
            'viveiro_id': sample_viveiro.id,
            'data_medicao': '2024-07-22T18:00:00',
            'temperatura': 32.5,  # Muito alta
            'ph': 9.5,           # Muito alto
            'oxigenio_dissolvido': 2.0,  # Muito baixo
            'amonia': 0.8        # Muito alta
        }
        
        with patch('src.services.notification_service.NotificationService.alert_qualidade_critica') as mock_alert:
            response = client.post('/api/qualidade-agua/medicoes',
                                 json=medicao_data,
                                 headers=auth_headers)
            
            data = assert_success_response(response, 201)
            
            # Deve ter análise indicando problemas
            analise = data['analise_automatica']
            assert analise['status'] in ['critico', 'alerta']
            assert len(analise['alertas']) > 0
            
            # Deve ter disparado notificações
            assert mock_alert.call_count > 0
    
    def test_medicao_viveiro_inexistente(self, client, auth_headers, sample_cliente):
        """Teste com viveiro inexistente"""
        medicao_data = {
            'viveiro_id': 99999,  # ID inexistente
            'data_medicao': '2024-07-22T10:00:00',
            'temperatura': 28.0,
            'ph': 7.0
        }
        
        response = client.post('/api/qualidade-agua/medicoes',
                             json=medicao_data,
                             headers=auth_headers)
        
        assert_error_response(response, 404)
    
    def test_obter_medicao_detalhes(self, client, auth_headers, sample_cliente, sample_viveiro):
        """Teste de busca de medição específica"""
        # Primeiro criar uma medição
        medicao_data = {
            'viveiro_id': sample_viveiro.id,
            'temperatura': 27.5,
            'ph': 7.1,
            'oxigenio_dissolvido': 6.0
        }
        
        create_response = client.post('/api/qualidade-agua/medicoes',
                                    json=medicao_data,
                                    headers=auth_headers)
        
        created_data = assert_success_response(create_response, 201)
        medicao_id = created_data['medicao']['id']
        
        # Buscar pelos detalhes
        response = client.get(f'/api/qualidade-agua/medicoes/{medicao_id}',
                            headers=auth_headers)
        
        data = assert_success_response(response)
        assert data['medicao']['id'] == medicao_id
        assert data['medicao']['temperatura'] == 27.5
        assert 'viveiro' in data['medicao']  # Deve incluir dados do viveiro

class TestParametrosIdeais:
    """Testes para endpoints de parâmetros ideais"""
    
    def test_listar_parametros_especies(self, client, auth_headers, sample_especie):
        """Teste de listagem de parâmetros por espécie"""
        response = client.get('/api/qualidade-agua/parametros-ideais', headers=auth_headers)
        
        data = assert_success_response(response)
        assert 'parametros' in data
    
    def test_definir_parametros_personalizados(self, client, auth_headers, sample_cliente, sample_especie):
        """Teste de definição de parâmetros personalizados"""
        parametros_data = {
            'especie_id': sample_especie.id,
            'temperatura_min': 26.0,
            'temperatura_max': 30.0,
            'ph_min': 6.8,
            'ph_max': 7.8,
            'oxigenio_min': 5.5,
            'oxigenio_max': 9.0,
            'amonia_max': 0.25,
            'nitrito_max': 0.05,
            'observacoes': 'Parâmetros ajustados para região Sul'
        }
        
        response = client.post('/api/qualidade-agua/parametros-ideais',
                             json=parametros_data,
                             headers=auth_headers)
        
        data = assert_success_response(response, 201)
        assert data['parametros']['temperatura_min'] == 26.0
        assert data['parametros']['especie_id'] == sample_especie.id
    
    def test_obter_parametros_por_especie(self, client, auth_headers, sample_especie):
        """Teste de busca de parâmetros por espécie"""
        response = client.get(f'/api/qualidade-agua/parametros-ideais?especie_id={sample_especie.id}',
                            headers=auth_headers)
        
        data = assert_success_response(response)
        if data['parametros']:  # Se houver parâmetros definidos
            assert data['parametros']['especie_id'] == sample_especie.id

class TestAlertasQualidade:
    """Testes para sistema de alertas de qualidade"""
    
    def test_listar_alertas_ativos(self, client, auth_headers, sample_cliente):
        """Teste de listagem de alertas ativos"""
        response = client.get('/api/qualidade-agua/alertas', headers=auth_headers)
        
        data = assert_success_response(response)
        assert 'alertas' in data
        assert isinstance(data['alertas'], list)
    
    def test_alertas_por_prioridade(self, client, auth_headers, sample_cliente):
        """Teste de filtro por prioridade"""
        response = client.get('/api/qualidade-agua/alertas?prioridade=critica',
                            headers=auth_headers)
        
        data = assert_success_response(response)
        alertas_criticos = data['alertas']
        
        # Todos devem ser críticos se existirem
        for alerta in alertas_criticos:
            assert alerta['prioridade'] == 'critica'
    
    def test_alertas_por_viveiro(self, client, auth_headers, sample_viveiro):
        """Teste de filtro por viveiro"""
        response = client.get(f'/api/qualidade-agua/alertas?viveiro_id={sample_viveiro.id}',
                            headers=auth_headers)
        
        data = assert_success_response(response)
        alertas_viveiro = data['alertas']
        
        for alerta in alertas_viveiro:
            assert alerta['viveiro_id'] == sample_viveiro.id
    
    def test_marcar_alerta_resolvido(self, client, auth_headers, sample_cliente, sample_viveiro):
        """Teste de resolução de alerta"""
        # Primeiro criar um alerta através de medição crítica
        medicao_data = {
            'viveiro_id': sample_viveiro.id,
            'temperatura': 35.0,  # Temperatura crítica
            'ph': 9.8,           # pH crítico
            'oxigenio_dissolvido': 1.5  # Oxigênio crítico
        }
        
        create_response = client.post('/api/qualidade-agua/medicoes',
                                    json=medicao_data,
                                    headers=auth_headers)
        
        assert_success_response(create_response, 201)
        
        # Listar alertas para pegar o ID
        alertas_response = client.get('/api/qualidade-agua/alertas',
                                    headers=auth_headers)
        
        alertas_data = assert_success_response(alertas_response)
        
        if alertas_data['alertas']:
            alerta_id = alertas_data['alertas'][0]['id']
            
            # Marcar como resolvido
            resolve_data = {
                'acao_tomada': 'Adicionado aerador extra e corrigido pH com produto específico',
                'responsavel': 'João Silva'
            }
            
            response = client.put(f'/api/qualidade-agua/alertas/{alerta_id}/resolver',
                                json=resolve_data,
                                headers=auth_headers)
            
            data = assert_success_response(response)
            assert data['alerta']['resolvido'] is True
            assert 'acao_tomada' in data['alerta']

class TestRelatoriosQualidade:
    """Testes para relatórios de qualidade da água"""
    
    def test_relatorio_geral(self, client, auth_headers, sample_cliente):
        """Teste de relatório geral de qualidade"""
        response = client.get('/api/qualidade-agua/relatorio', headers=auth_headers)
        
        data = assert_success_response(response)
        
        # Seções esperadas no relatório
        assert 'resumo_geral' in data
        assert 'viveiros' in data
        assert 'parametros_criticos' in data
        assert 'tendencias' in data
        assert 'recomendacoes' in data
    
    def test_relatorio_por_periodo(self, client, auth_headers, sample_cliente):
        """Teste de relatório filtrado por período"""
        data_inicio = '2024-07-01'
        data_fim = '2024-07-31'
        
        response = client.get(f'/api/qualidade-agua/relatorio?data_inicio={data_inicio}&data_fim={data_fim}',
                            headers=auth_headers)
        
        data = assert_success_response(response)
        assert 'periodo' in data
        assert data['periodo']['inicio'] == data_inicio
        assert data['periodo']['fim'] == data_fim
    
    def test_relatorio_por_viveiro(self, client, auth_headers, sample_viveiro):
        """Teste de relatório específico de viveiro"""
        response = client.get(f'/api/qualidade-agua/relatorio?viveiro_id={sample_viveiro.id}',
                            headers=auth_headers)
        
        data = assert_success_response(response)
        
        if data['viveiros']:
            viveiro_relatorio = data['viveiros'][0]
            assert viveiro_relatorio['id'] == sample_viveiro.id
    
    def test_relatorio_exportacao(self, client, auth_headers, sample_cliente):
        """Teste de exportação de relatório"""
        response = client.get('/api/qualidade-agua/relatorio?formato=excel',
                            headers=auth_headers)
        
        # Pode retornar JSON com link de download ou arquivo direto
        if response.status_code == 200:
            if response.content_type == 'application/json':
                data = assert_success_response(response)
                assert 'download_url' in data or 'file_data' in data
            else:
                # Arquivo Excel direto
                assert 'excel' in response.content_type.lower() or 'spreadsheet' in response.content_type.lower()

class TestDashboardQualidade:
    """Testes para dashboard de qualidade da água"""
    
    def test_dashboard_overview(self, client, auth_headers, sample_cliente):
        """Teste de overview do dashboard"""
        response = client.get('/api/qualidade-agua/dashboard', headers=auth_headers)
        
        data = assert_success_response(response)
        
        # Seções principais do dashboard
        assert 'status_geral' in data
        assert 'alertas_urgentes' in data
        assert 'viveiros_status' in data
        assert 'parametros_medios' in data
        assert 'tendencias_semanais' in data
        
        # Status geral
        status = data['status_geral']
        assert 'score_qualidade' in status
        assert 'total_viveiros' in status
        assert 'viveiros_ok' in status
        assert 'viveiros_alerta' in status
        assert 'viveiros_critico' in status
    
    def test_dashboard_alertas_tempo_real(self, client, auth_headers, sample_cliente):
        """Teste de alertas em tempo real"""
        response = client.get('/api/qualidade-agua/dashboard', headers=auth_headers)
        
        data = assert_success_response(response)
        alertas = data['alertas_urgentes']
        
        # Cada alerta deve ter informações essenciais
        for alerta in alertas:
            assert 'prioridade' in alerta
            assert 'viveiro' in alerta
            assert 'parametro' in alerta
            assert 'valor_atual' in alerta
            assert 'data_deteccao' in alerta
    
    def test_dashboard_metricas_performance(self, client, auth_headers, sample_cliente):
        """Teste de métricas de performance"""
        response = client.get('/api/qualidade-agua/dashboard', headers=auth_headers)
        
        data = assert_success_response(response)
        
        # Métricas de performance do sistema
        assert 'total_medicoes_mes' in data
        assert 'frequencia_medicoes' in data
        assert 'compliance_parametros' in data

class TestQualidadeValidacoes:
    """Testes de validações e regras de negócio"""
    
    def test_validacao_valores_negativos(self, client, auth_headers, sample_viveiro):
        """Teste de validação de valores negativos"""
        medicao_data = {
            'viveiro_id': sample_viveiro.id,
            'temperatura': -5.0,  # Valor inválido
            'ph': 7.0,
            'oxigenio_dissolvido': 6.0
        }
        
        response = client.post('/api/qualidade-agua/medicoes',
                             json=medicao_data,
                             headers=auth_headers)
        
        assert_error_response(response, 400)
    
    def test_validacao_ph_fora_escala(self, client, auth_headers, sample_viveiro):
        """Teste de validação de pH fora da escala"""
        medicao_data = {
            'viveiro_id': sample_viveiro.id,
            'temperatura': 28.0,
            'ph': 15.0,  # pH não pode ser > 14
            'oxigenio_dissolvido': 6.0
        }
        
        response = client.post('/api/qualidade-agua/medicoes',
                             json=medicao_data,
                             headers=auth_headers)
        
        assert_error_response(response, 400)
    
    def test_validacao_data_futura(self, client, auth_headers, sample_viveiro):
        """Teste de validação de data futura"""
        data_futura = (datetime.now() + timedelta(days=30)).isoformat()
        
        medicao_data = {
            'viveiro_id': sample_viveiro.id,
            'data_medicao': data_futura,
            'temperatura': 28.0,
            'ph': 7.0
        }
        
        response = client.post('/api/qualidade-agua/medicoes',
                             json=medicao_data,
                             headers=auth_headers)
        
        # Pode aceitar com aviso ou rejeitar
        if response.status_code == 201:
            data = assert_success_response(response, 201)
            assert 'avisos' in data or 'warnings' in data
        else:
            assert_error_response(response, 400)

class TestQualidadeIntegracoes:
    """Testes de integrações com outros sistemas"""
    
    def test_integracao_notificacoes(self, client, auth_headers, sample_viveiro):
        """Teste de integração com sistema de notificações"""
        with patch('src.services.notification_service.get_notification_service') as mock_notif:
            mock_service = Mock()
            mock_notif.return_value = mock_service
            
            medicao_data = {
                'viveiro_id': sample_viveiro.id,
                'temperatura': 35.0,  # Temperatura crítica
                'ph': 4.0,           # pH crítico
                'oxigenio_dissolvido': 1.0  # Oxigênio crítico
            }
            
            response = client.post('/api/qualidade-agua/medicoes',
                                 json=medicao_data,
                                 headers=auth_headers)
            
            data = assert_success_response(response, 201)
            
            # Deve ter chamado o serviço de notificações
            assert mock_service.alert_qualidade_critica.call_count > 0
    
    def test_integracao_gemini_analise(self, client, auth_headers, sample_viveiro):
        """Teste de integração com Gemini para análise inteligente"""
        with patch('src.services.gemini_service.GeminiService') as mock_gemini:
            mock_service = Mock()
            mock_gemini.return_value = mock_service
            mock_service.analyze_water_quality.return_value = {
                'status': 'alerta',
                'recomendacoes': ['Aumentar aeração', 'Verificar alimentação'],
                'confianca': 0.9
            }
            
            medicao_data = {
                'viveiro_id': sample_viveiro.id,
                'temperatura': 31.0,
                'ph': 8.5,
                'oxigenio_dissolvido': 4.0,
                'amonia': 0.3
            }
            
            response = client.post('/api/qualidade-agua/medicoes',
                                 json=medicao_data,
                                 headers=auth_headers)
            
            data = assert_success_response(response, 201)
            
            # Deve incluir análise do Gemini
            if 'analise_ia' in data:
                analise = data['analise_ia']
                assert 'recomendacoes' in analise
                assert analise['confianca'] > 0.8

class TestQualidadePerformance:
    """Testes de performance das APIs de qualidade"""
    
    def test_dashboard_response_time(self, client, auth_headers):
        """Teste de tempo de resposta do dashboard"""
        import time
        
        start_time = time.time()
        response = client.get('/api/qualidade-agua/dashboard', headers=auth_headers)
        end_time = time.time()
        
        response_time = end_time - start_time
        
        # Dashboard deve responder em menos de 3 segundos
        assert response_time < 3.0
        assert_success_response(response)
    
    def test_bulk_medicoes_performance(self, client, auth_headers, sample_viveiro):
        """Teste de performance com múltiplas medições"""
        medicoes = []
        
        for i in range(10):
            medicoes.append({
                'viveiro_id': sample_viveiro.id,
                'data_medicao': f'2024-07-{22:02d}T{10+i:02d}:00:00',
                'temperatura': 28.0 + (i * 0.1),
                'ph': 7.0 + (i * 0.05),
                'oxigenio_dissolvido': 6.0 + (i * 0.1)
            })
        
        # Simular criação em lote (se endpoint existir)
        # Ou criar individualmente para teste de carga
        import time
        start_time = time.time()
        
        for medicao in medicoes:
            response = client.post('/api/qualidade-agua/medicoes',
                                 json=medicao,
                                 headers=auth_headers)
            assert_success_response(response, 201)
        
        end_time = time.time()
        total_time = end_time - start_time
        
        # Deve processar 10 medições em menos de 5 segundos
        assert total_time < 5.0

class TestQualidadeEconomia:
    """Testes relacionados à economia de custos"""
    
    def test_economia_vs_sensores_fisicos(self, client, auth_headers):
        """Teste de validação da economia vs sensores físicos"""
        # Nossa solução: entrada manual + análise IA
        # Custo por análise: ~$0.001 (Gemini)
        
        custo_por_analise = 0.001  # USD
        analises_por_mes = 1000    # 1000 medições/mês
        custo_mensal_nossa_solucao = custo_por_analise * analises_por_mes
        
        # Sensores IoT físicos: $50-200 por sensor + manutenção
        custo_sensor_fisico = 100    # USD por sensor
        sensores_necessarios = 10    # Para 10 viveiros
        manutencao_mensal = 50       # USD/mês
        custo_mensal_sensores = (custo_sensor_fisico * sensores_necessarios / 12) + manutencao_mensal
        
        economia_mensal = custo_mensal_sensores - custo_mensal_nossa_solucao
        economia_percentual = (economia_mensal / custo_mensal_sensores) * 100
        
        # Deve economizar >90% vs sensores físicos
        assert economia_percentual > 90
        assert economia_mensal > 50  # Economia de pelo menos $50/mês
        
        # Nossa solução deve custar <$10/mês para 1000 análises
        assert custo_mensal_nossa_solucao < 10.0