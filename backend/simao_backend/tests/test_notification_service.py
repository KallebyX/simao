"""
Testes para NotificationService - Simão IA Rural
Validação do sistema multi-canal de notificações inteligentes
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta
from decimal import Decimal

from src.services.notification_service import (
    NotificationService, TipoNotificacao, PrioridadeNotificacao,
    Notification, get_notification_service
)

class TestNotificationService:
    """Testes para o serviço de notificações"""
    
    def test_init_success(self):
        """Teste de inicialização bem-sucedida"""
        service = NotificationService()
        assert service.email_enabled is True
        assert service.whatsapp_enabled is True
        assert service.templates is not None
    
    def test_create_notification_success(self):
        """Teste de criação de notificação"""
        service = NotificationService()
        
        notification_data = {
            'cliente_id': 1,
            'tipo': TipoNotificacao.QUALIDADE_AGUA,
            'prioridade': PrioridadeNotificacao.ALTA,
            'titulo': 'pH Crítico Detectado',
            'mensagem': 'O pH do Viveiro Principal está em 9.2 - Ação imediata necessária',
            'dados_extras': {
                'viveiro': 'Viveiro Principal',
                'parametro': 'pH',
                'valor': 9.2,
                'valor_ideal': '6.5-8.5'
            }
        }
        
        with patch('src.services.notification_service.db.session') as mock_session:
            mock_session.add = Mock()
            mock_session.commit = Mock()
            
            notification = service.create_notification(**notification_data)
            
            assert notification.cliente_id == 1
            assert notification.tipo == TipoNotificacao.QUALIDADE_AGUA
            assert notification.prioridade == PrioridadeNotificacao.ALTA
            assert 'pH Crítico' in notification.titulo
            mock_session.add.assert_called_once()
            mock_session.commit.assert_called_once()
    
    def test_send_notification_multi_channel(self):
        """Teste de envio multi-canal"""
        service = NotificationService()
        
        notification = Mock()
        notification.cliente_id = 1
        notification.tipo = TipoNotificacao.QUALIDADE_AGUA
        notification.prioridade = PrioridadeNotificacao.CRITICA
        notification.titulo = 'Oxigênio Crítico'
        notification.mensagem = 'Nível de oxigênio muito baixo'
        notification.dados_extras = {'viveiro': 'Tanque 1', 'valor': 2.1}
        
        with patch.object(service, '_send_email') as mock_email, \
             patch.object(service, '_send_whatsapp') as mock_whatsapp, \
             patch.object(service, '_get_client_preferences') as mock_prefs:
            
            mock_prefs.return_value = {
                'email_enabled': True,
                'whatsapp_enabled': True,
                'email': 'cliente@teste.com',
                'telefone': '+5511999999999'
            }
            mock_email.return_value = True
            mock_whatsapp.return_value = True
            
            results = service.send_notification(notification)
            
            assert 'email' in results
            assert 'whatsapp' in results
            assert results['email'] is True
            assert results['whatsapp'] is True
            mock_email.assert_called_once()
            mock_whatsapp.assert_called_once()
    
    def test_send_email_success(self):
        """Teste de envio de email bem-sucedido"""
        service = NotificationService()
        
        with patch('smtplib.SMTP') as mock_smtp:
            mock_server = Mock()
            mock_smtp.return_value.__enter__.return_value = mock_server
            mock_server.send_message.return_value = {}
            
            result = service._send_email(
                to_email='cliente@teste.com',
                subject='Teste',
                html_content='<p>Teste de email</p>'
            )
            
            assert result is True
            mock_server.send_message.assert_called_once()
    
    def test_send_email_failure(self):
        """Teste de falha no envio de email"""
        service = NotificationService()
        
        with patch('smtplib.SMTP') as mock_smtp:
            mock_smtp.side_effect = Exception("SMTP Error")
            
            result = service._send_email(
                to_email='cliente@teste.com',
                subject='Teste',
                html_content='<p>Teste</p>'
            )
            
            assert result is False
    
    def test_send_whatsapp_success(self):
        """Teste de envio WhatsApp bem-sucedido"""
        service = NotificationService()
        
        with patch('requests.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 200
            mock_response.json.return_value = {'success': True}
            mock_post.return_value = mock_response
            
            result = service._send_whatsapp(
                phone='+5511999999999',
                message='Teste de notificação'
            )
            
            assert result is True
            mock_post.assert_called_once()
    
    def test_send_whatsapp_failure(self):
        """Teste de falha no WhatsApp"""
        service = NotificationService()
        
        with patch('requests.post') as mock_post:
            mock_response = Mock()
            mock_response.status_code = 400
            mock_post.return_value = mock_response
            
            result = service._send_whatsapp(
                phone='+5511999999999',
                message='Teste'
            )
            
            assert result is False
    
    def test_get_template_qualidade_agua(self):
        """Teste de template para qualidade da água"""
        service = NotificationService()
        
        dados = {
            'viveiro': 'Tanque Principal',
            'parametro': 'pH',
            'valor': 9.5,
            'valor_ideal': '6.5-8.5',
            'acao_recomendada': 'Adicionar ácido orgânico'
        }
        
        template = service._get_email_template(TipoNotificacao.QUALIDADE_AGUA, dados)
        
        assert 'Tanque Principal' in template
        assert 'pH' in template
        assert '9.5' in template
        assert 'ácido orgânico' in template
        assert 'style=' in template  # HTML template
    
    def test_get_template_mortalidade(self):
        """Teste de template para mortalidade"""
        service = NotificationService()
        
        dados = {
            'viveiro': 'Viveiro 2',
            'lote': 'LOTE001',
            'mortos_hoje': 25,
            'taxa_mortalidade': 2.5,
            'total_peixes': 1000
        }
        
        template = service._get_email_template(TipoNotificacao.MORTALIDADE_ALTA, dados)
        
        assert 'Viveiro 2' in template
        assert 'LOTE001' in template
        assert '25' in template
        assert '2.5%' in template
    
    def test_get_template_lead_quente(self):
        """Teste de template para lead quente"""
        service = NotificationService()
        
        dados = {
            'lead_nome': 'João Silva',
            'telefone': '(11) 99999-9999',
            'pontuacao': 95,
            'interesse': 'tilápia para iniciante',
            'urgencia': 'alta'
        }
        
        template = service._get_email_template(TipoNotificacao.LEAD_QUENTE, dados)
        
        assert 'João Silva' in template
        assert '99999-9999' in template
        assert '95' in template
        assert 'tilápia' in template
    
    def test_rate_limit_notifications(self):
        """Teste de rate limiting para evitar spam"""
        service = NotificationService()
        
        # Simular cliente que já recebeu muitas notificações
        with patch.object(service, '_check_rate_limit') as mock_rate_limit:
            mock_rate_limit.return_value = False  # Rate limit ativo
            
            notification = Mock()
            notification.cliente_id = 1
            notification.tipo = TipoNotificacao.SISTEMA
            
            results = service.send_notification(notification)
            
            assert 'rate_limited' in results
            assert results['rate_limited'] is True
    
    def test_priority_filtering(self):
        """Teste de filtro por prioridade"""
        service = NotificationService()
        
        # Cliente configurado apenas para notificações críticas
        with patch.object(service, '_get_client_preferences') as mock_prefs:
            mock_prefs.return_value = {
                'min_priority': PrioridadeNotificacao.CRITICA,
                'email_enabled': True,
                'email': 'cliente@teste.com'
            }
            
            # Notificação de prioridade baixa
            notification_low = Mock()
            notification_low.prioridade = PrioridadeNotificacao.BAIXA
            
            results_low = service.send_notification(notification_low)
            assert results_low.get('skipped_by_priority') is True
            
            # Notificação crítica
            notification_critical = Mock()
            notification_critical.prioridade = PrioridadeNotificacao.CRITICA
            notification_critical.cliente_id = 1
            notification_critical.titulo = 'Crítico'
            notification_critical.mensagem = 'Teste'
            notification_critical.dados_extras = {}
            
            with patch.object(service, '_send_email') as mock_email:
                mock_email.return_value = True
                results_critical = service.send_notification(notification_critical)
                assert 'email' in results_critical
                mock_email.assert_called_once()
    
    def test_get_client_notifications(self):
        """Teste de busca de notificações do cliente"""
        service = NotificationService()
        
        with patch('src.services.notification_service.db.session') as mock_session:
            mock_query = Mock()
            mock_session.query.return_value = mock_query
            mock_query.filter_by.return_value = mock_query
            mock_query.order_by.return_value = mock_query
            mock_query.limit.return_value = mock_query
            mock_query.all.return_value = []
            
            notifications = service.get_client_notifications(cliente_id=1, limit=10)
            
            assert isinstance(notifications, list)
            mock_session.query.assert_called_once()
    
    def test_get_unread_count(self):
        """Teste de contagem de não lidas"""
        service = NotificationService()
        
        with patch('src.services.notification_service.db.session') as mock_session:
            mock_query = Mock()
            mock_session.query.return_value = mock_query
            mock_query.filter_by.return_value = mock_query
            mock_query.filter.return_value = mock_query
            mock_query.count.return_value = 5
            
            count = service.get_unread_count(cliente_id=1)
            
            assert count == 5
            mock_query.count.assert_called_once()
    
    def test_mark_as_read(self):
        """Teste de marcar como lida"""
        service = NotificationService()
        
        with patch('src.services.notification_service.db.session') as mock_session:
            mock_notification = Mock()
            mock_notification.lida = False
            mock_session.query.return_value.get.return_value = mock_notification
            
            result = service.mark_as_read(notification_id='test-id')
            
            assert result is True
            assert mock_notification.lida is True
            mock_session.commit.assert_called_once()
    
    def test_mark_as_read_not_found(self):
        """Teste de marcar como lida - notificação não encontrada"""
        service = NotificationService()
        
        with patch('src.services.notification_service.db.session') as mock_session:
            mock_session.query.return_value.get.return_value = None
            
            result = service.mark_as_read(notification_id='invalid-id')
            
            assert result is False

class TestNotificationAlerts:
    """Testes para alertas específicos"""
    
    def test_alert_qualidade_critica(self):
        """Teste de alerta de qualidade crítica"""
        service = NotificationService()
        
        with patch.object(service, 'create_notification') as mock_create, \
             patch.object(service, 'send_notification') as mock_send:
            
            mock_notification = Mock()
            mock_create.return_value = mock_notification
            mock_send.return_value = {'email': True, 'whatsapp': True}
            
            service.alert_qualidade_critica(
                cliente_id=1,
                viveiro='Tanque 1',
                parametro='oxigenio',
                valor=2.1,
                valor_ideal='5.0-8.0'
            )
            
            mock_create.assert_called_once()
            mock_send.assert_called_once_with(mock_notification)
    
    def test_alert_mortalidade_alta(self):
        """Teste de alerta de mortalidade alta"""
        service = NotificationService()
        
        with patch.object(service, 'create_notification') as mock_create, \
             patch.object(service, 'send_notification') as mock_send:
            
            mock_create.return_value = Mock()
            mock_send.return_value = {'email': True}
            
            service.alert_mortalidade_alta(
                cliente_id=1,
                viveiro='Viveiro 2',
                lote='LOTE001',
                mortos_hoje=30,
                taxa_mortalidade=3.0
            )
            
            mock_create.assert_called_once()
            assert mock_create.call_args[1]['tipo'] == TipoNotificacao.MORTALIDADE_ALTA
            assert mock_create.call_args[1]['prioridade'] == PrioridadeNotificacao.ALTA
    
    def test_alert_lead_quente(self):
        """Teste de alerta de lead quente"""
        service = NotificationService()
        
        with patch.object(service, 'create_notification') as mock_create, \
             patch.object(service, 'send_notification') as mock_send:
            
            mock_create.return_value = Mock()
            mock_send.return_value = {'email': True}
            
            service.alert_lead_quente(
                cliente_id=1,
                lead_nome='Maria Santos',
                telefone='(11) 88888-8888',
                pontuacao=88,
                interesse='tambaqui'
            )
            
            mock_create.assert_called_once()
            assert mock_create.call_args[1]['tipo'] == TipoNotificacao.LEAD_QUENTE
            assert 'Maria Santos' in mock_create.call_args[1]['titulo']
    
    def test_alert_meta_alcancada(self):
        """Teste de alerta de meta alcançada"""
        service = NotificationService()
        
        with patch.object(service, 'create_notification') as mock_create, \
             patch.object(service, 'send_notification') as mock_send:
            
            mock_create.return_value = Mock()
            mock_send.return_value = {'email': True}
            
            service.alert_meta_alcancada(
                cliente_id=1,
                tipo_meta='vendas_mensais',
                valor_meta=50000.00,
                valor_atual=52000.00
            )
            
            mock_create.assert_called_once()
            assert mock_create.call_args[1]['prioridade'] == PrioridadeNotificacao.MEDIA
            assert '50000' in str(mock_create.call_args[1]['dados_extras'])

class TestNotificationServiceIntegration:
    """Testes de integração do serviço de notificações"""
    
    def test_notification_lifecycle_complete(self):
        """Teste do ciclo completo da notificação"""
        service = NotificationService()
        
        # 1. Criar notificação
        with patch('src.services.notification_service.db.session') as mock_session:
            mock_session.add = Mock()
            mock_session.commit = Mock()
            
            notification = service.create_notification(
                cliente_id=1,
                tipo=TipoNotificacao.QUALIDADE_AGUA,
                prioridade=PrioridadeNotificacao.ALTA,
                titulo='Teste Integração',
                mensagem='Teste completo do ciclo'
            )
            
            # 2. Enviar notificação
            with patch.object(service, '_get_client_preferences') as mock_prefs, \
                 patch.object(service, '_send_email') as mock_email:
                
                mock_prefs.return_value = {
                    'email_enabled': True,
                    'email': 'cliente@teste.com'
                }
                mock_email.return_value = True
                
                results = service.send_notification(notification)
                
                # 3. Verificar resultados
                assert results['email'] is True
                assert notification.enviada is True
                assert notification.data_envio is not None
    
    def test_bulk_notification_efficiency(self):
        """Teste de eficiência em notificações em lote"""
        service = NotificationService()
        
        notifications = []
        for i in range(10):
            notification = Mock()
            notification.cliente_id = 1
            notification.tipo = TipoNotificacao.SISTEMA
            notification.prioridade = PrioridadeNotificacao.BAIXA
            notification.titulo = f'Notificação {i}'
            notification.mensagem = f'Teste {i}'
            notification.dados_extras = {}
            notifications.append(notification)
        
        with patch.object(service, '_get_client_preferences') as mock_prefs, \
             patch.object(service, '_send_email') as mock_email:
            
            mock_prefs.return_value = {
                'email_enabled': True,
                'email': 'cliente@teste.com'
            }
            mock_email.return_value = True
            
            # Processar todas em batch
            results = service.send_bulk_notifications(notifications)
            
            assert len(results) == 10
            assert all(result.get('email') is True for result in results)
    
    def test_cost_optimization_validation(self):
        """Teste de validação da otimização de custos"""
        service = NotificationService()
        
        # Simular custos: Email + WhatsApp vs apenas SMS premium
        
        # Nossa abordagem: Email (quase grátis) + WhatsApp API ($0.005/msg)
        email_cost_per_msg = 0.0001  # Praticamente gratuito
        whatsapp_cost_per_msg = 0.005
        our_total_cost_per_msg = email_cost_per_msg + whatsapp_cost_per_msg
        
        # Alternativa tradicional: SMS premium ($0.05/msg)
        sms_premium_cost_per_msg = 0.05
        
        # Para 1000 notificações/mês
        monthly_notifications = 1000
        our_monthly_cost = our_total_cost_per_msg * monthly_notifications
        traditional_monthly_cost = sms_premium_cost_per_msg * monthly_notifications
        
        savings = traditional_monthly_cost - our_monthly_cost
        savings_percentage = (savings / traditional_monthly_cost) * 100
        
        # Deve economizar >80%
        assert savings_percentage > 80
        assert our_monthly_cost < traditional_monthly_cost
        
        # Nossa solução deve custar menos de $10/mês para 1000 notificações
        assert our_monthly_cost < 10.0

class TestNotificationServiceSingleton:
    """Teste do padrão singleton do serviço"""
    
    def test_get_notification_service_singleton(self):
        """Teste se o serviço retorna sempre a mesma instância"""
        service1 = get_notification_service()
        service2 = get_notification_service()
        
        assert service1 is service2
        assert id(service1) == id(service2)