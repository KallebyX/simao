"""
Sistema de Logs Estruturados - Simão IA Rural
Logging avançado com correlationId, métricas e monitoramento
"""

import os
import json
import time
import uuid
import logging
import traceback
from datetime import datetime
from typing import Dict, Any, Optional
from flask import request, g, current_app
from flask_jwt_extended import get_jwt_identity, verify_jwt_in_request
import structlog

# Configurar structlog
structlog.configure(
    processors=[
        structlog.stdlib.filter_by_level,
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.stdlib.PositionalArgumentsFormatter(),
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.StackInfoRenderer(),
        structlog.processors.format_exc_info,
        structlog.processors.UnicodeDecoder(),
        structlog.processors.JSONRenderer()
    ],
    context_class=dict,
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.stdlib.BoundLogger,
    cache_logger_on_first_use=True,
)

class RequestLogger:
    """Sistema de logging estruturado para requests"""
    
    def __init__(self):
        self.logger = structlog.get_logger("simao.request")
        self.performance_logger = structlog.get_logger("simao.performance")
        self.security_logger = structlog.get_logger("simao.security")
        self.ai_logger = structlog.get_logger("simao.ai")
    
    def init_app(self, app):
        """Inicializa middleware de logging com Flask"""
        
        @app.before_request
        def before_request():
            # Gerar correlation ID único para request
            g.correlation_id = str(uuid.uuid4())
            g.request_start_time = time.time()
            
            # Coletar informações do request
            g.request_info = self._extract_request_info()
            
            # Log de início do request
            self.logger.info(
                "Request iniciado",
                correlation_id=g.correlation_id,
                **g.request_info
            )
        
        @app.after_request
        def after_request(response):
            # Calcular tempo de processamento
            if hasattr(g, 'request_start_time'):
                processing_time = time.time() - g.request_start_time
                g.processing_time = processing_time
                
                # Log de fim do request
                self.logger.info(
                    "Request completado",
                    correlation_id=getattr(g, 'correlation_id', 'unknown'),
                    status_code=response.status_code,
                    processing_time=processing_time,
                    response_size=len(response.get_data()) if response.get_data() else 0
                )
                
                # Log de performance se request demorou muito
                if processing_time > 2.0:  # Mais de 2 segundos
                    self.performance_logger.warning(
                        "Request lento detectado",
                        correlation_id=g.correlation_id,
                        processing_time=processing_time,
                        endpoint=g.request_info.get('endpoint'),
                        method=g.request_info.get('method')
                    )
            
            # Adicionar correlation ID no header de resposta
            if hasattr(g, 'correlation_id'):
                response.headers['X-Correlation-ID'] = g.correlation_id
            
            return response
        
        @app.errorhandler(Exception)
        def handle_exception(error):
            # Log de erro estruturado
            self.logger.error(
                "Erro não tratado",
                correlation_id=getattr(g, 'correlation_id', 'unknown'),
                error_type=type(error).__name__,
                error_message=str(error),
                traceback=traceback.format_exc(),
                **getattr(g, 'request_info', {})
            )
            
            # Retornar resposta de erro genérica
            return {
                "error": "Erro interno do servidor",
                "correlation_id": getattr(g, 'correlation_id', 'unknown'),
                "timestamp": datetime.utcnow().isoformat()
            }, 500
    
    def _extract_request_info(self) -> Dict[str, Any]:
        """Extrai informações estruturadas do request"""
        info = {
            "method": request.method,
            "endpoint": request.endpoint,
            "path": request.path,
            "url": request.url,
            "remote_addr": self._get_client_ip(),
            "user_agent": request.headers.get('User-Agent', ''),
            "content_length": request.content_length or 0,
            "content_type": request.content_type or '',
            "timestamp": datetime.utcnow().isoformat()
        }
        
        # Adicionar user_id se autenticado
        try:
            verify_jwt_in_request(optional=True)
            user_id = get_jwt_identity()
            if user_id:
                info["user_id"] = user_id
                info["authenticated"] = True
            else:
                info["authenticated"] = False
        except:
            info["authenticated"] = False
        
        # Adicionar parâmetros de query (sem dados sensíveis)
        if request.args:
            safe_args = {}
            for key, value in request.args.items():
                # Filtrar dados sensíveis
                if key.lower() not in ['password', 'token', 'secret', 'api_key']:
                    safe_args[key] = value
            info["query_params"] = safe_args
        
        return info
    
    def _get_client_ip(self) -> str:
        """Obtém IP real do cliente considerando proxies"""
        # Verificar headers de proxy
        forwarded_ips = request.headers.get('X-Forwarded-For')
        if forwarded_ips:
            # Primeiro IP da lista (IP original do cliente)
            return forwarded_ips.split(',')[0].strip()
        
        real_ip = request.headers.get('X-Real-IP')
        if real_ip:
            return real_ip.strip()
        
        return request.remote_addr or 'unknown'
    
    def log_ai_interaction(
        self,
        provider: str,
        operation: str,
        input_tokens: int = None,
        output_tokens: int = None,
        cost_usd: float = None,
        processing_time: float = None,
        model: str = None,
        success: bool = True,
        error: str = None
    ):
        """Log específico para interações com IA"""
        self.ai_logger.info(
            "Interação com IA",
            correlation_id=getattr(g, 'correlation_id', 'unknown'),
            provider=provider,
            operation=operation,
            input_tokens=input_tokens,
            output_tokens=output_tokens,
            total_tokens=(input_tokens or 0) + (output_tokens or 0),
            cost_usd=cost_usd,
            processing_time=processing_time,
            model=model,
            success=success,
            error=error,
            user_id=getattr(g, 'request_info', {}).get('user_id'),
            timestamp=datetime.utcnow().isoformat()
        )
    
    def log_security_event(
        self,
        event_type: str,
        severity: str,
        description: str,
        details: Dict[str, Any] = None
    ):
        """Log de eventos de segurança"""
        self.security_logger.warning(
            f"Evento de segurança: {event_type}",
            correlation_id=getattr(g, 'correlation_id', 'unknown'),
            event_type=event_type,
            severity=severity,
            description=description,
            details=details or {},
            client_ip=self._get_client_ip(),
            user_id=getattr(g, 'request_info', {}).get('user_id'),
            timestamp=datetime.utcnow().isoformat()
        )
    
    def log_business_event(
        self,
        event_type: str,
        data: Dict[str, Any]
    ):
        """Log de eventos de negócio importantes"""
        business_logger = structlog.get_logger("simao.business")
        
        business_logger.info(
            f"Evento de negócio: {event_type}",
            correlation_id=getattr(g, 'correlation_id', 'unknown'),
            event_type=event_type,
            data=data,
            user_id=getattr(g, 'request_info', {}).get('user_id'),
            timestamp=datetime.utcnow().isoformat()
        )

# Instância global
request_logger = RequestLogger()

def log_ai_usage(provider: str, operation: str):
    """Decorator para log automático de uso de IA"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            start_time = time.time()
            success = True
            error = None
            result = None
            
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                success = False
                error = str(e)
                raise
            finally:
                processing_time = time.time() - start_time
                
                # Extrair métricas se disponíveis no resultado
                input_tokens = None
                output_tokens = None
                cost_usd = None
                model = None
                
                if isinstance(result, tuple) and len(result) == 2:
                    _, metadata = result
                    if isinstance(metadata, dict):
                        input_tokens = metadata.get('input_tokens')
                        output_tokens = metadata.get('output_tokens')
                        cost_usd = metadata.get('cost_usd')
                        model = metadata.get('model')
                
                request_logger.log_ai_interaction(
                    provider=provider,
                    operation=operation,
                    input_tokens=input_tokens,
                    output_tokens=output_tokens,
                    cost_usd=cost_usd,
                    processing_time=processing_time,
                    model=model,
                    success=success,
                    error=error
                )
        
        return wrapper
    return decorator

def log_security_event(event_type: str, severity: str = "medium"):
    """Decorator para log automático de eventos de segurança"""
    def decorator(func):
        def wrapper(*args, **kwargs):
            try:
                result = func(*args, **kwargs)
                return result
            except Exception as e:
                request_logger.log_security_event(
                    event_type=event_type,
                    severity="high",
                    description=f"Erro em {func.__name__}: {str(e)}",
                    details={
                        "function": func.__name__,
                        "args_count": len(args),
                        "kwargs_keys": list(kwargs.keys()) if kwargs else []
                    }
                )
                raise
        
        return wrapper
    return decorator

class BusinessMetrics:
    """Classe para métricas de negócio"""
    
    def __init__(self):
        self.logger = structlog.get_logger("simao.metrics")
    
    def track_lead_conversion(self, lead_id: int, from_status: str, to_status: str):
        """Rastreia conversão de leads"""
        request_logger.log_business_event(
            "lead_status_change",
            {
                "lead_id": lead_id,
                "from_status": from_status,
                "to_status": to_status,
                "is_conversion": to_status == "convertido"
            }
        )
    
    def track_whatsapp_message(self, phone: str, direction: str, message_type: str):
        """Rastreia mensagens WhatsApp"""
        request_logger.log_business_event(
            "whatsapp_message",
            {
                "phone": phone,
                "direction": direction,
                "message_type": message_type
            }
        )
    
    def track_subscription_event(self, user_id: int, event_type: str, plan: str = None):
        """Rastreia eventos de assinatura"""
        request_logger.log_business_event(
            "subscription_event",
            {
                "user_id": user_id,
                "event_type": event_type,
                "plan": plan
            }
        )
    
    def track_fish_stock_event(self, client_id: int, event_type: str, data: Dict):
        """Rastreia eventos de estoque de peixes"""
        request_logger.log_business_event(
            "fish_stock_event",
            {
                "client_id": client_id,
                "event_type": event_type,
                **data
            }
        )

# Instância global de métricas
business_metrics = BusinessMetrics()

def setup_logging(app):
    """Configura sistema de logging para produção"""
    
    # Configurar nível de log baseado no ambiente
    log_level = os.getenv('LOG_LEVEL', 'INFO').upper()
    
    # Configurar handler para arquivos
    if not app.debug:
        # Em produção, usar arquivo rotativo
        import logging.handlers
        
        log_dir = os.getenv('LOG_DIR', '/var/log/simao')
        os.makedirs(log_dir, exist_ok=True)
        
        # Handler para logs gerais
        file_handler = logging.handlers.RotatingFileHandler(
            os.path.join(log_dir, 'simao.log'),
            maxBytes=50 * 1024 * 1024,  # 50MB
            backupCount=5
        )
        file_handler.setLevel(getattr(logging, log_level))
        
        # Handler para logs de segurança
        security_handler = logging.handlers.RotatingFileHandler(
            os.path.join(log_dir, 'security.log'),
            maxBytes=10 * 1024 * 1024,  # 10MB
            backupCount=10
        )
        security_handler.setLevel(logging.WARNING)
        
        # Adicionar handlers
        app.logger.addHandler(file_handler)
        
        # Configurar logger de segurança
        security_logger = logging.getLogger("simao.security")
        security_logger.addHandler(security_handler)
        security_logger.setLevel(logging.WARNING)
    
    # Configurar nível root
    logging.getLogger().setLevel(getattr(logging, log_level))
    
    # Inicializar middleware
    request_logger.init_app(app)
    
    app.logger.info("Sistema de logging configurado", extra={
        "log_level": log_level,
        "environment": os.getenv('FLASK_ENV', 'development')
    })