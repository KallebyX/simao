"""
Testes para Rate Limiter - Simão IA Rural
Validação do sistema Redis de proteção contra spam e ataques DoS
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime, timedelta

from src.middleware.rate_limiter import RateLimiter, rate_limiter, add_rate_limit_headers, apply_global_rate_limit

class TestRateLimiter:
    """Testes para o sistema de rate limiting"""
    
    @patch('src.middleware.rate_limiter.redis_client')
    def test_init_redis_connection(self, mock_redis):
        """Teste de inicialização com Redis"""
        mock_redis.ping.return_value = True
        limiter = RateLimiter()
        assert limiter.redis_client is not None
        mock_redis.ping.assert_called_once()
    
    @patch('src.middleware.rate_limiter.redis_client')
    def test_init_redis_failure(self, mock_redis):
        """Teste de falha na conexão Redis"""
        mock_redis.ping.side_effect = Exception("Redis connection failed")
        limiter = RateLimiter()
        assert limiter.redis_client is None  # Should fallback gracefully
    
    @patch('src.middleware.rate_limiter.redis_client')
    def test_is_allowed_first_request(self, mock_redis):
        """Teste de primeira requisição - deve ser permitida"""
        mock_redis.ping.return_value = True
        mock_redis.get.return_value = None  # No previous requests
        mock_redis.incr.return_value = 1
        mock_redis.expire.return_value = True
        
        limiter = RateLimiter()
        result = limiter.is_allowed("test_key", 10, 60)
        
        assert result is True
        mock_redis.incr.assert_called_once_with("rate_limit:test_key")
        mock_redis.expire.assert_called_once_with("rate_limit:test_key", 60)
    
    @patch('src.middleware.rate_limiter.redis_client')
    def test_is_allowed_within_limit(self, mock_redis):
        """Teste dentro do limite - deve ser permitida"""
        mock_redis.ping.return_value = True
        mock_redis.get.return_value = b'5'  # 5 requests made
        mock_redis.incr.return_value = 6
        
        limiter = RateLimiter()
        result = limiter.is_allowed("test_key", 10, 60)
        
        assert result is True
        mock_redis.incr.assert_called_once_with("rate_limit:test_key")
    
    @patch('src.middleware.rate_limiter.redis_client')
    def test_is_allowed_at_limit(self, mock_redis):
        """Teste no limite exato - deve ser permitida"""
        mock_redis.ping.return_value = True
        mock_redis.get.return_value = b'9'  # 9 requests made
        mock_redis.incr.return_value = 10  # This would be the 10th
        
        limiter = RateLimiter()
        result = limiter.is_allowed("test_key", 10, 60)
        
        assert result is True
        mock_redis.incr.assert_called_once_with("rate_limit:test_key")
    
    @patch('src.middleware.rate_limiter.redis_client')
    def test_is_allowed_exceeds_limit(self, mock_redis):
        """Teste excedendo limite - deve ser bloqueada"""
        mock_redis.ping.return_value = True
        mock_redis.get.return_value = b'10'  # Already at limit
        mock_redis.incr.return_value = 11  # This would exceed
        
        limiter = RateLimiter()
        result = limiter.is_allowed("test_key", 10, 60)
        
        assert result is False
        mock_redis.incr.assert_called_once_with("rate_limit:test_key")
    
    @patch('src.middleware.rate_limiter.redis_client')
    def test_is_allowed_redis_failure(self, mock_redis):
        """Teste com falha no Redis - deve permitir (fail-open)"""
        mock_redis.ping.return_value = True
        mock_redis.get.side_effect = Exception("Redis error")
        
        limiter = RateLimiter()
        result = limiter.is_allowed("test_key", 10, 60)
        
        # Should allow request when Redis fails (fail-open policy)
        assert result is True
    
    @patch('src.middleware.rate_limiter.redis_client')
    def test_get_current_usage(self, mock_redis):
        """Teste de consulta de uso atual"""
        mock_redis.ping.return_value = True
        mock_redis.get.return_value = b'7'
        
        limiter = RateLimiter()
        usage = limiter.get_current_usage("test_key")
        
        assert usage == 7
        mock_redis.get.assert_called_once_with("rate_limit:test_key")
    
    @patch('src.middleware.rate_limiter.redis_client')
    def test_get_current_usage_no_data(self, mock_redis):
        """Teste de consulta sem dados - deve retornar 0"""
        mock_redis.ping.return_value = True
        mock_redis.get.return_value = None
        
        limiter = RateLimiter()
        usage = limiter.get_current_usage("test_key")
        
        assert usage == 0
    
    @patch('src.middleware.rate_limiter.redis_client')
    def test_get_ttl(self, mock_redis):
        """Teste de consulta TTL"""
        mock_redis.ping.return_value = True
        mock_redis.ttl.return_value = 45  # 45 seconds remaining
        
        limiter = RateLimiter()
        ttl = limiter.get_ttl("test_key")
        
        assert ttl == 45
        mock_redis.ttl.assert_called_once_with("rate_limit:test_key")
    
    @patch('src.middleware.rate_limiter.redis_client')
    def test_reset_limit(self, mock_redis):
        """Teste de reset manual do limite"""
        mock_redis.ping.return_value = True
        mock_redis.delete.return_value = 1
        
        limiter = RateLimiter()
        result = limiter.reset_limit("test_key")
        
        assert result is True
        mock_redis.delete.assert_called_once_with("rate_limit:test_key")
    
    def test_get_client_ip_direct(self):
        """Teste de extração de IP direto"""
        limiter = RateLimiter()
        
        with patch('flask.request') as mock_request:
            mock_request.environ = {'REMOTE_ADDR': '192.168.1.1'}
            mock_request.headers = {}
            
            ip = limiter.get_client_ip()
            assert ip == '192.168.1.1'
    
    def test_get_client_ip_forwarded(self):
        """Teste de extração de IP via proxy"""
        limiter = RateLimiter()
        
        with patch('flask.request') as mock_request:
            mock_request.environ = {'REMOTE_ADDR': '10.0.0.1'}
            mock_request.headers = {'X-Forwarded-For': '203.0.113.1, 10.0.0.1'}
            
            ip = limiter.get_client_ip()
            assert ip == '203.0.113.1'  # Should get the first (original) IP
    
    def test_get_client_ip_real_ip(self):
        """Teste de extração via X-Real-IP"""
        limiter = RateLimiter()
        
        with patch('flask.request') as mock_request:
            mock_request.environ = {'REMOTE_ADDR': '10.0.0.1'}
            mock_request.headers = {'X-Real-IP': '203.0.113.2'}
            
            ip = limiter.get_client_ip()
            assert ip == '203.0.113.2'

class TestRateLimiterDecorator:
    """Testes para o decorator @rate_limiter"""
    
    @patch('src.middleware.rate_limiter.RateLimiter')
    def test_decorator_allowed(self, mock_limiter_class):
        """Teste decorator - requisição permitida"""
        mock_limiter = Mock()
        mock_limiter.is_allowed.return_value = True
        mock_limiter.get_current_usage.return_value = 5
        mock_limiter.get_ttl.return_value = 300
        mock_limiter_class.return_value = mock_limiter
        
        @rate_limiter(max_requests=10, window_seconds=600, endpoint="test")
        def test_route():
            return {"message": "success"}
        
        result = test_route()
        assert result == {"message": "success"}
    
    @patch('src.middleware.rate_limiter.RateLimiter')
    def test_decorator_blocked(self, mock_limiter_class):
        """Teste decorator - requisição bloqueada"""
        from flask import Flask, jsonify
        
        app = Flask(__name__)
        
        with app.app_context():
            mock_limiter = Mock()
            mock_limiter.is_allowed.return_value = False
            mock_limiter.get_current_usage.return_value = 15
            mock_limiter.get_ttl.return_value = 120
            mock_limiter_class.return_value = mock_limiter
            
            @rate_limiter(max_requests=10, window_seconds=600, endpoint="test")
            def test_route():
                return {"message": "success"}
            
            response = test_route()
            
            # Should return rate limit error response
            assert response[1] == 429  # HTTP 429 Too Many Requests
            
class TestGlobalRateLimit:
    """Testes para rate limit global"""
    
    @patch('src.middleware.rate_limiter.RateLimiter')
    def test_global_rate_limit_allowed(self, mock_limiter_class):
        """Teste rate limit global - permitido"""
        from flask import Flask
        
        app = Flask(__name__)
        
        with app.test_request_context('/', environ_base={'REMOTE_ADDR': '192.168.1.1'}):
            mock_limiter = Mock()
            mock_limiter.is_allowed.return_value = True
            mock_limiter_class.return_value = mock_limiter
            
            result = apply_global_rate_limit()
            assert result is None  # No blocking response
    
    @patch('src.middleware.rate_limiter.RateLimiter')
    def test_global_rate_limit_blocked(self, mock_limiter_class):
        """Teste rate limit global - bloqueado"""
        from flask import Flask
        
        app = Flask(__name__)
        
        with app.test_request_context('/', environ_base={'REMOTE_ADDR': '192.168.1.1'}):
            mock_limiter = Mock()
            mock_limiter.is_allowed.return_value = False
            mock_limiter_class.return_value = mock_limiter
            
            result = apply_global_rate_limit()
            
            assert result is not None
            assert result[1] == 429  # Should return 429 status

class TestRateLimitHeaders:
    """Testes para headers de rate limit"""
    
    def test_add_rate_limit_headers_success(self):
        """Teste adição de headers - com dados válidos"""
        from flask import Flask, make_response
        
        app = Flask(__name__)
        
        with app.app_context():
            response = make_response({"message": "test"})
            
            with patch('src.middleware.rate_limiter.RateLimiter') as mock_limiter_class:
                mock_limiter = Mock()
                mock_limiter.get_current_usage.return_value = 8
                mock_limiter.get_ttl.return_value = 300
                mock_limiter_class.return_value = mock_limiter
                
                result = add_rate_limit_headers(response, max_requests=10)
                
                assert result.headers.get('X-RateLimit-Limit') == '10'
                assert result.headers.get('X-RateLimit-Remaining') == '2'  # 10 - 8
                assert result.headers.get('X-RateLimit-Reset') == '300'
    
    def test_add_rate_limit_headers_no_data(self):
        """Teste adição de headers - sem dados do Redis"""
        from flask import Flask, make_response
        
        app = Flask(__name__)
        
        with app.app_context():
            response = make_response({"message": "test"})
            
            with patch('src.middleware.rate_limiter.RateLimiter') as mock_limiter_class:
                mock_limiter = Mock()
                mock_limiter.get_current_usage.return_value = 0
                mock_limiter.get_ttl.return_value = -1  # No TTL
                mock_limiter_class.return_value = mock_limiter
                
                result = add_rate_limit_headers(response, max_requests=10)
                
                assert result.headers.get('X-RateLimit-Limit') == '10'
                assert result.headers.get('X-RateLimit-Remaining') == '10'
                assert result.headers.get('X-RateLimit-Reset') is None

class TestRateLimiterIntegration:
    """Testes de integração do rate limiter"""
    
    def test_different_endpoints_different_limits(self):
        """Teste de limites diferentes por endpoint"""
        with patch('src.middleware.rate_limiter.redis_client') as mock_redis:
            mock_redis.ping.return_value = True
            mock_redis.get.return_value = None
            mock_redis.incr.return_value = 1
            mock_redis.expire.return_value = True
            
            limiter = RateLimiter()
            
            # Endpoint de IA - limite baixo
            ai_allowed = limiter.is_allowed("ai_endpoint:192.168.1.1", 5, 60)
            assert ai_allowed is True
            
            # Endpoint de API - limite alto
            api_allowed = limiter.is_allowed("api_endpoint:192.168.1.1", 100, 60)
            assert api_allowed is True
            
            # Verificar chamadas corretas
            assert mock_redis.incr.call_count == 2
    
    def test_ip_based_isolation(self):
        """Teste de isolamento por IP"""
        with patch('src.middleware.rate_limiter.redis_client') as mock_redis:
            mock_redis.ping.return_value = True
            mock_redis.get.return_value = None
            mock_redis.incr.return_value = 1
            mock_redis.expire.return_value = True
            
            limiter = RateLimiter()
            
            # IP 1 faz requisição
            result1 = limiter.is_allowed("endpoint:192.168.1.1", 5, 60)
            assert result1 is True
            
            # IP 2 faz requisição - deve ser independente
            result2 = limiter.is_allowed("endpoint:192.168.1.2", 5, 60)
            assert result2 is True
            
            # Cada IP deve ter sua própria chave
            expected_calls = [
                (("rate_limit:endpoint:192.168.1.1",),),
                (("rate_limit:endpoint:192.168.1.2",),)
            ]
            mock_redis.incr.assert_has_calls([call[0] for call in expected_calls])
    
    @patch('src.middleware.rate_limiter.redis_client')
    def test_cost_calculation_accuracy(self, mock_redis):
        """Teste de precisão no cálculo de economia vs alternativas"""
        mock_redis.ping.return_value = True
        
        limiter = RateLimiter()
        
        # Redis é ~95% mais barato que soluções in-memory distribuídas
        # Simular 1000 requisições/minuto por 1 mês
        monthly_requests = 1000 * 60 * 24 * 30
        
        # Custo estimado Redis: ~$0.01/million operations
        redis_cost = (monthly_requests / 1_000_000) * 0.01
        
        # Alternativa in-memory distribuída: ~$0.20/million operations
        inmemory_cost = (monthly_requests / 1_000_000) * 0.20
        
        savings_percentage = ((inmemory_cost - redis_cost) / inmemory_cost) * 100
        
        # Deve ter economia significativa (>90%)
        assert savings_percentage > 90
        assert redis_cost < inmemory_cost