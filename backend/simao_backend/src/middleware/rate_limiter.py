"""
Rate Limiter Middleware - Simão IA Rural
Sistema de limitação de taxa com Redis para proteção contra spam e ataques
"""

import os
import time
import json
import logging
from functools import wraps
from typing import Dict, Tuple, Optional
from flask import request, jsonify, g
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
import redis

logger = logging.getLogger(__name__)

class RateLimiter:
    """
    Sistema de Rate Limiting baseado em Redis
    Protege APIs contra spam, ataques DoS e uso excessivo
    """
    
    def __init__(self, redis_url: str = None):
        self.redis_url = redis_url or os.getenv('REDIS_URL', 'redis://localhost:6379/0')
        
        try:
            self.redis = redis.from_url(self.redis_url, decode_responses=True)
            # Testar conexão
            self.redis.ping()
            logger.info("Rate Limiter Redis conectado com sucesso")
        except Exception as e:
            logger.error(f"Erro ao conectar Redis: {e}")
            self.redis = None
    
    def _get_client_id(self) -> str:
        """Identifica cliente para rate limiting"""
        client_id = None
        
        try:
            # Tentar pegar user_id do JWT
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            if user_id:
                client_id = f"user_{user_id}"
        except:
            pass
        
        # Se não tem user_id, usar IP
        if not client_id:
            ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
            # Limpar IP (pegar primeiro se tiver múltiplos)
            if ',' in ip:
                ip = ip.split(',')[0].strip()
            client_id = f"ip_{ip}"
        
        return client_id
    
    def _get_key(self, client_id: str, endpoint: str, window: str) -> str:
        """Gera chave Redis para o limite"""
        return f"rate_limit:{client_id}:{endpoint}:{window}"
    
    def _get_window(self, window_seconds: int) -> str:
        """Calcula janela de tempo atual"""
        return str(int(time.time()) // window_seconds)
    
    def is_allowed(
        self, 
        endpoint: str, 
        max_requests: int, 
        window_seconds: int,
        client_id: Optional[str] = None
    ) -> Tuple[bool, Dict]:
        """
        Verifica se requisição está dentro do limite
        
        Args:
            endpoint: Nome do endpoint
            max_requests: Máximo de requests na janela
            window_seconds: Tamanho da janela em segundos
            client_id: ID do cliente (opcional)
        
        Returns:
            Tuple (permitido, info)
        """
        
        if not self.redis:
            logger.warning("Redis não disponível - rate limiting desabilitado")
            return True, {"redis_unavailable": True}
        
        client_id = client_id or self._get_client_id()
        window = self._get_window(window_seconds)
        key = self._get_key(client_id, endpoint, window)
        
        try:
            # Incrementar contador
            pipeline = self.redis.pipeline()
            pipeline.incr(key)
            pipeline.expire(key, window_seconds * 2)  # TTL duplo para segurança
            results = pipeline.execute()
            
            current_requests = results[0]
            
            # Preparar informações de resposta
            info = {
                "client_id": client_id,
                "endpoint": endpoint,
                "current_requests": current_requests,
                "max_requests": max_requests,
                "window_seconds": window_seconds,
                "reset_time": (int(window) + 1) * window_seconds,
                "remaining": max(0, max_requests - current_requests)
            }
            
            # Verificar se excedeu limite
            if current_requests > max_requests:
                info["exceeded"] = True
                logger.warning(f"Rate limit excedido: {client_id} em {endpoint} ({current_requests}/{max_requests})")
                return False, info
            
            info["exceeded"] = False
            return True, info
            
        except Exception as e:
            logger.error(f"Erro no rate limiting: {e}")
            # Em caso de erro, permitir requisição
            return True, {"error": str(e)}
    
    def get_limits_info(self, client_id: Optional[str] = None) -> Dict:
        """Retorna informações sobre limites atuais do cliente"""
        
        if not self.redis:
            return {"error": "Redis não disponível"}
        
        client_id = client_id or self._get_client_id()
        
        try:
            # Buscar todas as chaves do cliente
            pattern = f"rate_limit:{client_id}:*"
            keys = self.redis.keys(pattern)
            
            limits_info = {}
            for key in keys:
                try:
                    parts = key.split(':')
                    if len(parts) >= 4:
                        endpoint = parts[2]
                        current_count = self.redis.get(key)
                        ttl = self.redis.ttl(key)
                        
                        limits_info[endpoint] = {
                            "current_requests": int(current_count) if current_count else 0,
                            "ttl_seconds": ttl
                        }
                except Exception as e:
                    logger.error(f"Erro ao processar chave {key}: {e}")
            
            return {
                "client_id": client_id,
                "limits": limits_info,
                "timestamp": int(time.time())
            }
            
        except Exception as e:
            logger.error(f"Erro ao buscar informações de limite: {e}")
            return {"error": str(e)}

# Instância global
rate_limiter = RateLimiter()

def rate_limit(max_requests: int, window_seconds: int = 60, endpoint: str = None):
    """
    Decorator para aplicar rate limiting
    
    Args:
        max_requests: Máximo de requests na janela
        window_seconds: Tamanho da janela em segundos (default: 60s)
        endpoint: Nome do endpoint (default: função atual)
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            endpoint_name = endpoint or f"{request.endpoint or f.__name__}"
            
            allowed, info = rate_limiter.is_allowed(
                endpoint_name, 
                max_requests, 
                window_seconds
            )
            
            if not allowed:
                response = {
                    "error": "Rate limit excedido",
                    "message": f"Muitas requisições. Máximo {max_requests} por {window_seconds}s",
                    "rate_limit": {
                        "current": info["current_requests"],
                        "max": info["max_requests"],
                        "reset_at": info["reset_time"],
                        "remaining": info["remaining"]
                    }
                }
                
                return jsonify(response), 429  # Too Many Requests
            
            # Adicionar headers de rate limit na resposta
            g.rate_limit_info = info
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def add_rate_limit_headers(response):
    """Adiciona headers de rate limit à resposta"""
    if hasattr(g, 'rate_limit_info'):
        info = g.rate_limit_info
        response.headers['X-RateLimit-Limit'] = str(info.get('max_requests', 0))
        response.headers['X-RateLimit-Remaining'] = str(info.get('remaining', 0))
        response.headers['X-RateLimit-Reset'] = str(info.get('reset_time', 0))
    
    return response

# Configurações específicas para diferentes tipos de endpoint
RATE_LIMITS = {
    # Endpoints críticos - mais restritivos
    "webhook": {"max_requests": 100, "window_seconds": 60},
    "auth_login": {"max_requests": 5, "window_seconds": 300},  # 5 por 5 min
    "auth_register": {"max_requests": 3, "window_seconds": 600},  # 3 por 10 min
    
    # Endpoints de IA - proteger contra uso excessivo
    "chat_message": {"max_requests": 30, "window_seconds": 60},
    "audio_transcription": {"max_requests": 20, "window_seconds": 60},
    
    # Endpoints de dados - moderadamente restritivos
    "leads_create": {"max_requests": 20, "window_seconds": 60},
    "estoque_create": {"max_requests": 15, "window_seconds": 60},
    "qualidade_create": {"max_requests": 15, "window_seconds": 60},
    
    # Endpoints de consulta - mais permissivos
    "leads_list": {"max_requests": 60, "window_seconds": 60},
    "estoque_list": {"max_requests": 60, "window_seconds": 60},
    "dashboard": {"max_requests": 30, "window_seconds": 60},
    
    # Default para endpoints não especificados
    "default": {"max_requests": 40, "window_seconds": 60}
}

def get_rate_limit_for_endpoint(endpoint_name: str) -> Dict:
    """Retorna configuração de rate limit para endpoint específico"""
    return RATE_LIMITS.get(endpoint_name, RATE_LIMITS["default"])

# Middlewares específicos para cada tipo
def webhook_rate_limit():
    """Rate limit para webhooks"""
    config = RATE_LIMITS["webhook"]
    return rate_limit(config["max_requests"], config["window_seconds"], "webhook")

def auth_rate_limit(action: str = "login"):
    """Rate limit para autenticação"""
    config = RATE_LIMITS.get(f"auth_{action}", RATE_LIMITS["default"])
    return rate_limit(config["max_requests"], config["window_seconds"], f"auth_{action}")

def ai_rate_limit(ai_type: str = "chat"):
    """Rate limit para endpoints de IA"""
    endpoint_key = f"{ai_type}_message"
    config = RATE_LIMITS.get(endpoint_key, RATE_LIMITS["default"])
    return rate_limit(config["max_requests"], config["window_seconds"], endpoint_key)

def api_rate_limit(endpoint_type: str = "default"):
    """Rate limit genérico para APIs"""
    config = RATE_LIMITS.get(endpoint_type, RATE_LIMITS["default"])
    return rate_limit(config["max_requests"], config["window_seconds"], endpoint_type)

# Rate limiter por IP para proteção global
class GlobalRateLimiter:
    """Rate limiter global por IP para proteção básica"""
    
    def __init__(self):
        self.max_requests_per_ip = 200  # requests por minuto por IP
        self.window_seconds = 60
    
    def check_global_limit(self) -> Tuple[bool, Dict]:
        """Verifica limite global por IP"""
        client_ip = request.environ.get('HTTP_X_FORWARDED_FOR', request.remote_addr)
        if ',' in client_ip:
            client_ip = client_ip.split(',')[0].strip()
        
        return rate_limiter.is_allowed(
            "global_ip_limit",
            self.max_requests_per_ip,
            self.window_seconds,
            f"global_ip_{client_ip}"
        )

global_rate_limiter = GlobalRateLimiter()

def apply_global_rate_limit():
    """Middleware para aplicar rate limit global"""
    allowed, info = global_rate_limiter.check_global_limit()
    
    if not allowed:
        response = {
            "error": "Rate limit global excedido",
            "message": "Muitas requisições deste IP. Tente novamente em alguns minutos.",
            "rate_limit": {
                "type": "global",
                "reset_at": info.get("reset_time", 0)
            }
        }
        return jsonify(response), 429
    
    return None  # Continuar processamento

# Health check para rate limiter
def rate_limiter_health_check() -> Dict:
    """Verifica saúde do sistema de rate limiting"""
    try:
        if not rate_limiter.redis:
            return {
                "status": "unhealthy",
                "error": "Redis não conectado",
                "timestamp": int(time.time())
            }
        
        # Testar operação básica
        test_key = f"health_check_{int(time.time())}"
        rate_limiter.redis.setex(test_key, 5, "test")
        value = rate_limiter.redis.get(test_key)
        rate_limiter.redis.delete(test_key)
        
        if value != "test":
            return {
                "status": "unhealthy",
                "error": "Redis não está funcionando corretamente",
                "timestamp": int(time.time())
            }
        
        return {
            "status": "healthy",
            "redis_connected": True,
            "timestamp": int(time.time())
        }
        
    except Exception as e:
        return {
            "status": "unhealthy",
            "error": str(e),
            "timestamp": int(time.time())
        }