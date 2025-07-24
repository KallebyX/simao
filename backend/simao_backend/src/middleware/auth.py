from functools import wraps
from flask import request, jsonify, g
from flask_jwt_extended import verify_jwt_in_request, get_jwt_identity, get_jwt
import logging

from src.models.user import Cliente, StatusEnum

logger = logging.getLogger(__name__)

def require_auth(f):
    """
    Decorator para rotas que requerem autenticação
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        try:
            # Verificar JWT
            verify_jwt_in_request()
            
            # Obter ID do cliente do token
            cliente_id = get_jwt_identity()
            
            if not cliente_id:
                return jsonify({"error": "Token inválido"}), 401
            
            # Buscar cliente no banco
            cliente = Cliente.query.get(cliente_id)
            
            if not cliente:
                return jsonify({"error": "Cliente não encontrado"}), 404
            
            # Verificar se cliente está ativo
            if cliente.status == StatusEnum.INATIVO:
                return jsonify({"error": "Conta inativa"}), 403
            
            # Adicionar cliente ao contexto da requisição
            g.current_user = cliente
            g.cliente_id = cliente_id
            
            return f(*args, **kwargs)
            
        except Exception as e:
            logger.error(f"Erro na autenticação: {e}")
            return jsonify({"error": "Falha na autenticação"}), 401
    
    return decorated_function

def require_active_subscription(f):
    """
    Decorator para rotas que requerem assinatura ativa
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Primeiro verificar autenticação
        auth_result = require_auth(lambda: None)()
        if auth_result:
            return auth_result
        
        cliente = g.current_user
        
        # Verificar se tem assinatura ativa
        if cliente.status not in [StatusEnum.ATIVO, StatusEnum.TRIAL]:
            return jsonify({
                "error": "Assinatura necessária",
                "message": "Esta funcionalidade requer uma assinatura ativa",
                "status": cliente.status.value
            }), 402  # Payment Required
        
        return f(*args, **kwargs)
    
    return decorated_function

def require_admin(f):
    """
    Decorator para rotas que requerem privilégios de administrador
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # Primeiro verificar autenticação
        auth_result = require_auth(lambda: None)()
        if auth_result:
            return auth_result
        
        cliente = g.current_user
        
        # Verificar se é admin (pode ser implementado com campo is_admin)
        # Por enquanto, apenas verificar se é o primeiro cliente (ID 1)
        if cliente.id != 1:
            return jsonify({"error": "Acesso negado"}), 403
        
        return f(*args, **kwargs)
    
    return decorated_function

def tenant_isolation(model_class):
    """
    Decorator para garantir isolamento de dados por tenant
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Verificar se há cliente no contexto
            if not hasattr(g, 'cliente_id'):
                return jsonify({"error": "Contexto de cliente não encontrado"}), 500
            
            # Adicionar filtro de cliente_id automaticamente nas queries
            original_query = model_class.query
            
            def filtered_query():
                return original_query.filter_by(cliente_id=g.cliente_id)
            
            model_class.query = filtered_query()
            
            try:
                result = f(*args, **kwargs)
                return result
            finally:
                # Restaurar query original
                model_class.query = original_query
        
        return decorated_function
    return decorator

def validate_tenant_access(resource_id, model_class, id_field='id'):
    """
    Valida se o recurso pertence ao tenant atual
    """
    try:
        if not hasattr(g, 'cliente_id'):
            return False
        
        # Buscar recurso
        resource = model_class.query.filter(
            getattr(model_class, id_field) == resource_id,
            model_class.cliente_id == g.cliente_id
        ).first()
        
        return resource is not None
        
    except Exception as e:
        logger.error(f"Erro na validação de acesso: {e}")
        return False

def get_tenant_resource(resource_id, model_class, id_field='id'):
    """
    Obtém recurso garantindo isolamento por tenant
    """
    try:
        if not hasattr(g, 'cliente_id'):
            return None
        
        # Buscar recurso do tenant
        resource = model_class.query.filter(
            getattr(model_class, id_field) == resource_id,
            model_class.cliente_id == g.cliente_id
        ).first()
        
        return resource
        
    except Exception as e:
        logger.error(f"Erro ao obter recurso: {e}")
        return None

def check_rate_limit(max_requests=100, window_minutes=60):
    """
    Decorator para rate limiting por cliente
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not hasattr(g, 'cliente_id'):
                return f(*args, **kwargs)
            
            # Implementar rate limiting usando Redis ou cache em memória
            # Por enquanto, apenas log
            logger.info(f"Rate limit check for cliente {g.cliente_id}")
            
            return f(*args, **kwargs)
        
        return decorated_function
    return decorator

def log_user_activity(action):
    """
    Decorator para log de atividades do usuário
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            try:
                result = f(*args, **kwargs)
                
                # Log da atividade
                if hasattr(g, 'current_user'):
                    logger.info(f"User activity - Cliente: {g.current_user.email}, Action: {action}, IP: {request.remote_addr}")
                
                return result
                
            except Exception as e:
                # Log do erro
                if hasattr(g, 'current_user'):
                    logger.error(f"User activity error - Cliente: {g.current_user.email}, Action: {action}, Error: {e}")
                raise
        
        return decorated_function
    return decorator

