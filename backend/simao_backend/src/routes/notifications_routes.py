"""
Rotas para Sistema de Notificações - Simão IA Rural
API para gerenciar notificações e alertas em tempo real
"""

from datetime import datetime
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from src.models.user import db, Cliente
from src.services.notification_service import (
    notification_service, NotificationType, NotificationPriority, NotificationChannel,
    alert_qualidade_critica, alert_mortalidade_alta, alert_lead_quente, alert_meta_alcancada
)
from src.middleware.rate_limiter import api_rate_limit

# Blueprint para notificações
notifications_bp = Blueprint('notifications', __name__, url_prefix='/api/notifications')

@notifications_bp.route('/', methods=['GET'])
@jwt_required()
@api_rate_limit('dashboard')
def listar_notificacoes():
    """Lista notificações do cliente"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # Parâmetros de filtro
        limit = min(int(request.args.get('limit', 20)), 100)  # Máximo 100
        unread_only = request.args.get('unread_only', 'false').lower() == 'true'
        
        # Buscar notificações
        notifications = notification_service.get_client_notifications(
            cliente_id=cliente.id,
            limit=limit,
            unread_only=unread_only
        )
        
        # Contar não lidas
        unread_count = notification_service.get_unread_count(cliente.id)
        
        return jsonify({
            "notifications": notifications,
            "unread_count": unread_count,
            "total": len(notifications),
            "limit": limit,
            "unread_only": unread_only
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao listar notificações: {str(e)}"}), 500

@notifications_bp.route('/unread-count', methods=['GET'])
@jwt_required()
@api_rate_limit('dashboard')
def contador_nao_lidas():
    """Retorna apenas o contador de notificações não lidas"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        unread_count = notification_service.get_unread_count(cliente.id)
        
        return jsonify({
            "unread_count": unread_count,
            "timestamp": datetime.utcnow().isoformat()
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao contar não lidas: {str(e)}"}), 500

@notifications_bp.route('/mark-read', methods=['POST'])
@jwt_required()
@api_rate_limit('default')
def marcar_como_lidas():
    """Marca notificações como lidas"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        data = request.get_json() or {}
        notification_ids = data.get('notification_ids', [])
        
        # Marcar como lidas
        success = notification_service.mark_as_read(
            cliente_id=cliente.id,
            notification_ids=notification_ids if notification_ids else None
        )
        
        if success:
            new_count = notification_service.get_unread_count(cliente.id)
            return jsonify({
                "message": "Notificações marcadas como lidas",
                "unread_count": new_count
            }), 200
        else:
            return jsonify({"error": "Erro ao marcar como lidas"}), 500
            
    except Exception as e:
        return jsonify({"error": f"Erro ao marcar como lidas: {str(e)}"}), 500

@notifications_bp.route('/create', methods=['POST'])
@jwt_required()
@api_rate_limit('default')
def criar_notificacao():
    """Cria notificação personalizada (para testes ou uso manual)"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        data = request.get_json()
        
        # Validar dados obrigatórios
        required_fields = ['tipo', 'titulo', 'mensagem']
        for field in required_fields:
            if not data.get(field):
                return jsonify({"error": f"Campo '{field}' é obrigatório"}), 400
        
        # Validar tipo
        try:
            notification_type = NotificationType(data['tipo'])
        except ValueError:
            return jsonify({"error": "Tipo de notificação inválido"}), 400
        
        # Validar prioridade
        priority = NotificationPriority.MEDIUM
        if data.get('priority'):
            try:
                priority = NotificationPriority(data['priority'])
            except ValueError:
                return jsonify({"error": "Prioridade inválida"}), 400
        
        # Validar canais
        channels = [NotificationChannel.IN_APP]
        if data.get('channels'):
            try:
                channels = [NotificationChannel(c) for c in data['channels']]
            except ValueError:
                return jsonify({"error": "Canal de notificação inválido"}), 400
        
        # Criar notificação
        notification = notification_service.create_notification(
            tipo=notification_type,
            titulo=data['titulo'],
            mensagem=data['mensagem'],
            cliente_id=cliente.id,
            priority=priority,
            data=data.get('data', {}),
            channels=channels
        )
        
        # Enviar imediatamente se solicitado
        if data.get('send_immediately', False):
            success = notification_service.send_notification(notification)
            return jsonify({
                "message": "Notificação criada e enviada",
                "notification_id": notification.id,
                "sent": success
            }), 201
        else:
            return jsonify({
                "message": "Notificação criada",
                "notification_id": notification.id
            }), 201
        
    except Exception as e:
        return jsonify({"error": f"Erro ao criar notificação: {str(e)}"}), 500

@notifications_bp.route('/test-alerts', methods=['POST'])
@jwt_required()
@api_rate_limit('default')
def testar_alertas():
    """Endpoint para testar diferentes tipos de alertas (desenvolvimento)"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        data = request.get_json()
        alert_type = data.get('type')
        
        if alert_type == 'qualidade_critica':
            alert_qualidade_critica(
                cliente_id=cliente.id,
                viveiro=data.get('viveiro', 'Viveiro Teste'),
                parametro=data.get('parametro', 'pH'),
                valor=data.get('valor', 9.5),
                ideal_min=data.get('ideal_min', 6.5),
                ideal_max=data.get('ideal_max', 8.5)
            )
            
        elif alert_type == 'mortalidade_alta':
            alert_mortalidade_alta(
                cliente_id=cliente.id,
                lote=data.get('lote', 'Lote Teste'),
                taxa_mortalidade=data.get('taxa_mortalidade', 15.0),
                quantidade_morta=data.get('quantidade_morta', 150)
            )
            
        elif alert_type == 'lead_quente':
            alert_lead_quente(
                cliente_id=cliente.id,
                lead_nome=data.get('nome', 'João Silva'),
                telefone=data.get('telefone', '(11) 99999-9999'),
                score=data.get('score', 95),
                interesse=data.get('interesse', 'Tilápia para engorda')
            )
            
        elif alert_type == 'meta_alcancada':
            alert_meta_alcancada(
                cliente_id=cliente.id,
                meta_tipo=data.get('meta_tipo', 'Vendas Mensais'),
                valor_meta=data.get('valor_meta', 1000),
                valor_atual=data.get('valor_atual', 1050)
            )
            
        else:
            return jsonify({"error": "Tipo de alerta inválido"}), 400
        
        return jsonify({
            "message": f"Alerta de teste '{alert_type}' enviado com sucesso"
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao enviar alerta de teste: {str(e)}"}), 500

@notifications_bp.route('/settings', methods=['GET'])
@jwt_required()
@api_rate_limit('default')
def configuracoes_notificacao():
    """Retorna configurações de notificação do cliente"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        # TODO: Implementar modelo de configurações de notificação
        # Por ora, retornar configurações padrão
        settings = {
            "email_enabled": True,
            "whatsapp_enabled": True,
            "in_app_enabled": True,
            "webhook_enabled": False,
            "webhook_url": None,
            "quiet_hours": {
                "enabled": False,
                "start": "22:00",
                "end": "08:00"
            },
            "notification_types": {
                "qualidade_agua_critica": {
                    "enabled": True,
                    "channels": ["email", "whatsapp", "in_app"],
                    "priority": "critical"
                },
                "mortalidade_alta": {
                    "enabled": True,
                    "channels": ["email", "in_app"],
                    "priority": "high"
                },
                "lead_quente": {
                    "enabled": True,
                    "channels": ["in_app", "whatsapp"],
                    "priority": "high"
                },
                "meta_alcancada": {
                    "enabled": True,
                    "channels": ["in_app", "email"],
                    "priority": "medium"
                }
            }
        }
        
        return jsonify(settings), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao buscar configurações: {str(e)}"}), 500

@notifications_bp.route('/settings', methods=['PUT'])
@jwt_required()
@api_rate_limit('default')
def atualizar_configuracoes():
    """Atualiza configurações de notificação"""
    try:
        user_id = get_jwt_identity()
        cliente = Cliente.query.filter_by(user_id=user_id).first()
        
        if not cliente:
            return jsonify({"error": "Cliente não encontrado"}), 404
        
        data = request.get_json()
        
        # TODO: Implementar salvamento real das configurações
        # Por ora, apenas validar e retornar sucesso
        
        return jsonify({
            "message": "Configurações atualizadas com sucesso",
            "settings": data
        }), 200
        
    except Exception as e:
        return jsonify({"error": f"Erro ao atualizar configurações: {str(e)}"}), 500

@notifications_bp.route('/health', methods=['GET'])
@api_rate_limit('default')
def health_check():
    """Health check do sistema de notificações"""
    try:
        # Verificar Redis
        redis_status = "healthy" if notification_service.redis else "unavailable"
        
        # Verificar configurações de email
        email_configured = bool(notification_service.smtp_user and notification_service.smtp_pass)
        
        # Verificar WhatsApp
        whatsapp_configured = bool(notification_service.whatsapp_api_url)
        
        health = {
            "status": "healthy",
            "timestamp": datetime.utcnow().isoformat(),
            "components": {
                "redis": {
                    "status": redis_status,
                    "description": "Cache e armazenamento de notificações"
                },
                "email": {
                    "status": "configured" if email_configured else "not_configured",
                    "description": "Envio de emails"
                },
                "whatsapp": {
                    "status": "configured" if whatsapp_configured else "not_configured",
                    "description": "Envio via WhatsApp"
                },
                "in_app": {
                    "status": "healthy",
                    "description": "Notificações in-app"
                }
            },
            "features": {
                "real_time_alerts": True,
                "email_notifications": email_configured,
                "whatsapp_notifications": whatsapp_configured,
                "webhook_support": True,
                "priority_handling": True
            }
        }
        
        return jsonify(health), 200
        
    except Exception as e:
        return jsonify({
            "status": "unhealthy",
            "error": str(e),
            "timestamp": datetime.utcnow().isoformat()
        }), 500