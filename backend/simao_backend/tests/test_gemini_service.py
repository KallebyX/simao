"""
Testes para GeminiService - Simão IA Rural
Validação da integração com Google Gemini AI (economia 95%)
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
import json
from decimal import Decimal

from src.services.gemini_service import GeminiService

class TestGeminiService:
    """Testes para o serviço Gemini (95% economia vs OpenAI)"""
    
    def test_init_success(self):
        """Teste de inicialização bem-sucedida"""
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            with patch('google.generativeai.configure') as mock_configure:
                service = GeminiService()
                assert service.api_key == 'test-key'
                assert service.chat_model == "gemini-1.5-pro-latest"
                mock_configure.assert_called_once_with(api_key='test-key')
    
    def test_init_missing_api_key(self):
        """Teste de falha por API key ausente"""
        with patch.dict('os.environ', {}, clear=True):
            with pytest.raises(ValueError, match="API key do Gemini não encontrada"):
                GeminiService()
    
    @patch('google.generativeai.GenerativeModel')
    @patch('google.generativeai.configure')
    def test_generate_response_success(self, mock_configure, mock_model_class):
        """Teste de geração de resposta bem-sucedida"""
        # Setup
        mock_model = Mock()
        mock_response = Mock()
        mock_response.text = "Oi! Como posso ajudar com sua piscicultura?"
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model
        
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            service = GeminiService()
            
            # Test
            response = service.generate_response(
                message="Olá, preciso de ajuda com tilápia",
                conversation_history=[],
                context={'state': 'inicial'},
                cliente_info={'nome': 'João', 'genero_detectado': 'masculino'}
            )
            
            # Assertions
            assert response == "Oi! Como posso ajudar com sua piscicultura?"
            mock_model.generate_content.assert_called_once()
    
    @patch('google.generativeai.GenerativeModel')
    @patch('google.generativeai.configure')
    def test_generate_response_empty(self, mock_configure, mock_model_class):
        """Teste de resposta vazia - deve retornar fallback"""
        # Setup
        mock_model = Mock()
        mock_response = Mock()
        mock_response.text = None
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model
        
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            service = GeminiService()
            
            # Test
            response = service.generate_response("Teste")
            
            # Deve retornar uma das mensagens de fallback
            assert any(fallback in response for fallback in [
                "me perdoa aí", "probleminha técnico", "falha técnica", "problema na linha"
            ])
    
    @patch('google.generativeai.GenerativeModel')
    @patch('google.generativeai.configure')
    def test_transcribe_audio_success(self, mock_configure, mock_model_class):
        """Teste de transcrição de áudio bem-sucedida"""
        # Setup
        mock_model = Mock()
        mock_response = Mock()
        mock_response.text = "Quero comprar alevinos de tilápia"
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model
        
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            service = GeminiService()
            
            # Test
            audio_data = b"fake_audio_data"
            result = service.transcribe_audio(audio_data, "ogg")
            
            # Assertions
            assert result == "Quero comprar alevinos de tilápia"
            mock_model.generate_content.assert_called_once()
    
    @patch('google.generativeai.GenerativeModel')
    @patch('google.generativeai.configure')
    def test_analyze_sentiment_success(self, mock_configure, mock_model_class):
        """Teste de análise de sentimento bem-sucedida"""
        # Setup
        mock_model = Mock()
        mock_response = Mock()
        mock_response.text = '''```json
        {
            "sentimento": "positivo",
            "intencao": "interesse",
            "urgencia": "media",
            "topico_principal": "tilapia",
            "requer_humano": false,
            "confianca": 0.9
        }
        ```'''
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model
        
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            service = GeminiService()
            
            # Test
            result = service.analyze_sentiment("Estou interessado em comprar tilápia")
            
            # Assertions
            assert result['sentimento'] == 'positivo'
            assert result['intencao'] == 'interesse'
            assert result['topico_principal'] == 'tilapia'
            assert result['confianca'] == 0.9
    
    @patch('google.generativeai.GenerativeModel')
    @patch('google.generativeai.configure')
    def test_analyze_sentiment_invalid_json(self, mock_configure, mock_model_class):
        """Teste de análise com JSON inválido - deve retornar padrão"""
        # Setup
        mock_model = Mock()
        mock_response = Mock()
        mock_response.text = "resposta inválida sem json"
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model
        
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            service = GeminiService()
            
            # Test
            result = service.analyze_sentiment("teste")
            
            # Deve retornar análise padrão
            assert result['sentimento'] == 'neutro'
            assert result['intencao'] == 'outro'
            assert result['confianca'] == 0.5
    
    @patch('google.generativeai.GenerativeModel')
    @patch('google.generativeai.configure')
    def test_extract_lead_info_success(self, mock_configure, mock_model_class):
        """Teste de extração de informações de lead"""
        # Setup
        mock_model = Mock()
        mock_response = Mock()
        mock_response.text = '''```json
        {
            "nome": "Maria Silva",
            "telefone": "(11) 99999-9999",
            "cidade": "São Paulo",
            "estado": "SP",
            "experiencia_piscicultura": "iniciante",
            "especies_interesse": "tilápia, tambaqui",
            "qtd_viveiros": "2"
        }
        ```'''
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model
        
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            service = GeminiService()
            
            # Test
            message = "Oi, sou Maria Silva de São Paulo, tenho 2 viveiros e quero tilápia"
            result = service.extract_lead_info(message)
            
            # Assertions
            assert result['nome'] == 'Maria Silva'
            assert result['telefone'] == '(11) 99999-9999'
            assert result['cidade'] == 'São Paulo'
            assert result['experiencia_piscicultura'] == 'iniciante'
    
    @patch('google.generativeai.GenerativeModel')
    @patch('google.generativeai.configure')
    def test_generate_summary_success(self, mock_configure, mock_model_class):
        """Teste de geração de resumo de conversa"""
        # Setup
        mock_model = Mock()
        mock_response = Mock()
        mock_response.text = """• Cliente interessado em tilápia para iniciante
• Quer começar com 2 viveiros
• Orçamento de R$ 5.000
• Próximo passo: enviar proposta comercial"""
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model
        
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            service = GeminiService()
            
            # Test
            conversation_history = [
                {'role': 'user', 'content': 'Quero comprar tilápia'},
                {'role': 'assistant', 'content': 'Que quantidade precisa?'},
                {'role': 'user', 'content': 'Para 2 viveiros, orçamento 5 mil'}
            ]
            result = service.generate_summary(conversation_history)
            
            # Assertions
            assert "tilápia" in result
            assert "2 viveiros" in result
            assert "5.000" in result or "5 mil" in result
    
    @patch('google.generativeai.GenerativeModel')
    @patch('google.generativeai.configure')
    def test_cost_estimate(self, mock_configure, mock_model_class):
        """Teste de estimativa de custos"""
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            service = GeminiService()
            
            # Test
            estimate = service.get_cost_estimate(1000, 500)  # 1000 chars input, 500 output
            
            # Assertions
            assert estimate['input_cost'] == 0.00125  # 1000/1000 * 0.00125
            assert estimate['output_cost'] == 0.001875  # 500/1000 * 0.00375
            assert estimate['total_cost'] == 0.003125
            assert estimate['currency'] == 'USD'
    
    @patch('google.generativeai.GenerativeModel')
    @patch('google.generativeai.configure')
    def test_health_check_success(self, mock_configure, mock_model_class):
        """Teste de health check bem-sucedido"""
        # Setup
        mock_model = Mock()
        mock_response = Mock()
        mock_response.text = "OK"
        mock_model.generate_content.return_value = mock_response
        mock_model_class.return_value = mock_model
        
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            service = GeminiService()
            
            # Test
            health = service.health_check()
            
            # Assertions
            assert health['status'] == 'healthy'
            assert health['model'] == 'gemini-1.5-pro-latest'
            assert 'timestamp' in health
    
    @patch('google.generativeai.GenerativeModel')
    @patch('google.generativeai.configure')
    def test_health_check_failure(self, mock_configure, mock_model_class):
        """Teste de health check com falha"""
        # Setup
        mock_model = Mock()
        mock_model.generate_content.side_effect = Exception("API Error")
        mock_model_class.return_value = mock_model
        
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            service = GeminiService()
            
            # Test
            health = service.health_check()
            
            # Assertions
            assert health['status'] == 'unhealthy'
            assert 'error' in health
            assert 'API Error' in health['error']
    
    def test_build_context_prompt_complete(self):
        """Teste de construção de prompt com contexto completo"""
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            with patch('google.generativeai.configure'):
                service = GeminiService()
                
                # Test data
                message = "Quero comprar tilápia"
                conversation_history = [
                    {'role': 'user', 'content': 'Oi'},
                    {'role': 'assistant', 'content': 'Olá! Como posso ajudar?'}
                ]
                context = {
                    'state': 'qualificacao_basica',
                    'interaction_count': 3,
                    'awaiting_info': 'nome'
                }
                cliente_info = {
                    'nome': 'João Silva',
                    'genero_detectado': 'masculino',
                    'experiencia_piscicultura': 'iniciante'
                }
                
                # Test
                prompt = service._build_context_prompt(
                    message, conversation_history, context, cliente_info
                )
                
                # Assertions
                assert 'João Silva' in prompt
                assert 'Seu João' in prompt
                assert 'qualificacao_basica' in prompt
                assert 'iniciante' in prompt
                assert 'Quero comprar tilápia' in prompt
    
    def test_build_context_prompt_minimal(self):
        """Teste de construção de prompt com dados mínimos"""
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            with patch('google.generativeai.configure'):
                service = GeminiService()
                
                # Test apenas com mensagem
                prompt = service._build_context_prompt("Olá")
                
                # Assertions
                assert 'Olá' in prompt
                assert 'NOVA MENSAGEM DO CLIENTE' in prompt
                assert 'INSTRUÇÕES PARA RESPOSTA' in prompt

class TestGeminiServiceIntegration:
    """Testes de integração do Gemini Service"""
    
    def test_portuguese_specialization(self):
        """Verifica se prompts estão otimizados para português rural"""
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            with patch('google.generativeai.configure'):
                service = GeminiService()
                
                # System prompt deve conter especialização brasileira
                assert 'brasileiro rural' in service.system_prompt
                assert 'caipira' in service.system_prompt
                assert 'Seu/Dona' in service.system_prompt
                assert 'piscicultura' in service.system_prompt
    
    def test_cost_savings_calculation(self):
        """Verifica cálculo de economia vs OpenAI"""
        with patch.dict('os.environ', {'GOOGLE_GEMINI_API_KEY': 'test-key'}):
            with patch('google.generativeai.configure'):
                service = GeminiService()
                
                # Simular custos para 1000 mensagens
                gemini_cost = service.get_cost_estimate(1000, 500)['total_cost'] * 1000
                openai_equivalent = 0.002 * 1000  # $0.002 por mensagem OpenAI
                
                savings_percentage = ((openai_equivalent - gemini_cost) / openai_equivalent) * 100
                
                # Deve ter economia próxima a 95%
                assert savings_percentage > 90
                assert savings_percentage < 100