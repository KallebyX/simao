from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
import logging
import base64
import io

from src.services.wppconnect_service import wppconnect_service
from src.models.user import db, Bot, Cliente
from src.models.bot import StatusBotEnum

logger = logging.getLogger(__name__)

whatsapp_bp = Blueprint('whatsapp', __name__)

@whatsapp_bp.route('/whatsapp/status', methods=['GET'])
@jwt_required()
def get_whatsapp_status():
    """
    Obtém status da conexão WhatsApp
    """
    try:
        cliente_id = get_jwt_identity()
        
        # Buscar bot do cliente
        bot = Bot.query.filter_by(cliente_id=cliente_id, ativo=True).first()
        
        if not bot:
            return jsonify({
                "connected": False,
                "error": "Bot não configurado"
            }), 404
        
        # Obter status do WPPConnect
        connection_info = wppconnect_service.get_connection_info()
        
        # Atualizar status do bot no banco
        if connection_info.get('connected'):
            bot.status = StatusBotEnum.ONLINE
        else:
            bot.status = StatusBotEnum.OFFLINE
        
        db.session.commit()
        
        return jsonify({
            "bot_id": bot.id,
            "bot_name": bot.nome,
            "connection_info": connection_info
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter status WhatsApp: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@whatsapp_bp.route('/whatsapp/start-session', methods=['POST'])
@jwt_required()
def start_whatsapp_session():
    """
    Inicia sessão do WhatsApp
    """
    try:
        cliente_id = get_jwt_identity()
        
        # Buscar ou criar bot
        bot = Bot.query.filter_by(cliente_id=cliente_id, ativo=True).first()
        
        if not bot:
            # Criar bot padrão
            cliente = Cliente.query.get(cliente_id)
            bot = Bot(
                cliente_id=cliente_id,
                nome=f"Bot {cliente.nome}",
                sessao_wppconnect=wppconnect_service.session_name,
                status=StatusBotEnum.CONECTANDO
            )
            db.session.add(bot)
            db.session.commit()
        
        # Iniciar sessão no WPPConnect
        result = wppconnect_service.start_session()
        
        # Atualizar status do bot
        if result.get('status') == 'success':
            bot.status = StatusBotEnum.ONLINE
        else:
            bot.status = StatusBotEnum.ERRO
        
        db.session.commit()
        
        return jsonify({
            "message": "Sessão iniciada",
            "bot_id": bot.id,
            "result": result
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao iniciar sessão WhatsApp: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@whatsapp_bp.route('/whatsapp/qr-code', methods=['GET'])
@jwt_required()
def get_qr_code():
    """
    Obtém QR Code para autenticação
    """
    try:
        cliente_id = get_jwt_identity()
        
        # Verificar se cliente tem bot
        bot = Bot.query.filter_by(cliente_id=cliente_id, ativo=True).first()
        
        if not bot:
            return jsonify({"error": "Bot não configurado"}), 404
        
        # Obter QR Code do WPPConnect
        result = wppconnect_service.get_qr_code()
        
        if 'qrcode' in result:
            return jsonify({
                "qr_code": result['qrcode'],
                "status": result.get('status'),
                "message": "Escaneie o QR Code com seu WhatsApp"
            }), 200
        else:
            return jsonify({
                "error": "QR Code não disponível",
                "result": result
            }), 400
        
    except Exception as e:
        logger.error(f"Erro ao obter QR Code: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@whatsapp_bp.route('/whatsapp/logout', methods=['POST'])
@jwt_required()
def logout_whatsapp():
    """
    Faz logout da sessão WhatsApp
    """
    try:
        cliente_id = get_jwt_identity()
        
        # Buscar bot
        bot = Bot.query.filter_by(cliente_id=cliente_id, ativo=True).first()
        
        if not bot:
            return jsonify({"error": "Bot não encontrado"}), 404
        
        # Fazer logout no WPPConnect
        result = wppconnect_service.logout()
        
        # Atualizar status do bot
        bot.status = StatusBotEnum.DESCONECTADO
        db.session.commit()
        
        return jsonify({
            "message": "Logout realizado com sucesso",
            "result": result
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao fazer logout: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@whatsapp_bp.route('/whatsapp/send-test-message', methods=['POST'])
@jwt_required()
def send_test_message():
    """
    Envia mensagem de teste
    """
    try:
        cliente_id = get_jwt_identity()
        data = request.get_json()
        
        phone = data.get('phone')
        message = data.get('message', 'Mensagem de teste do Simão IA Rural! 🌱')
        
        if not phone:
            return jsonify({"error": "Número de telefone é obrigatório"}), 400
        
        # Verificar se cliente tem bot ativo
        bot = Bot.query.filter_by(cliente_id=cliente_id, ativo=True).first()
        
        if not bot:
            return jsonify({"error": "Bot não configurado"}), 404
        
        # Enviar mensagem
        result = wppconnect_service.send_text_message(phone, message)
        
        return jsonify({
            "message": "Mensagem de teste enviada",
            "phone": phone,
            "result": result
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao enviar mensagem de teste: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@whatsapp_bp.route('/whatsapp/chats', methods=['GET'])
@jwt_required()
def get_whatsapp_chats():
    """
    Obtém lista de conversas do WhatsApp
    """
    try:
        cliente_id = get_jwt_identity()
        
        # Verificar bot
        bot = Bot.query.filter_by(cliente_id=cliente_id, ativo=True).first()
        
        if not bot:
            return jsonify({"error": "Bot não configurado"}), 404
        
        # Obter conversas do WPPConnect
        result = wppconnect_service.get_all_chats()
        
        return jsonify({
            "chats": result.get('response', []),
            "total": len(result.get('response', []))
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter conversas: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@whatsapp_bp.route('/whatsapp/chat/<phone>/messages', methods=['GET'])
@jwt_required()
def get_chat_messages(phone):
    """
    Obtém mensagens de uma conversa específica
    """
    try:
        cliente_id = get_jwt_identity()
        
        # Verificar bot
        bot = Bot.query.filter_by(cliente_id=cliente_id, ativo=True).first()
        
        if not bot:
            return jsonify({"error": "Bot não configurado"}), 404
        
        # Parâmetros
        count = int(request.args.get('count', 50))
        
        # Obter mensagens do WPPConnect
        result = wppconnect_service.get_chat_messages(phone, count)
        
        return jsonify({
            "phone": phone,
            "messages": result.get('response', []),
            "total": len(result.get('response', []))
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter mensagens: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@whatsapp_bp.route('/whatsapp/webhook/configure', methods=['POST'])
@jwt_required()
def configure_webhook():
    """
    Configura webhook do WPPConnect
    """
    try:
        cliente_id = get_jwt_identity()
        data = request.get_json()
        
        webhook_url = data.get('webhook_url')
        
        if not webhook_url:
            return jsonify({"error": "URL do webhook é obrigatória"}), 400
        
        # Configurar webhook no WPPConnect
        result = wppconnect_service.set_webhook(webhook_url)
        
        return jsonify({
            "message": "Webhook configurado com sucesso",
            "webhook_url": webhook_url,
            "result": result
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao configurar webhook: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@whatsapp_bp.route('/whatsapp/connection/test', methods=['GET'])
@jwt_required()
def test_connection():
    """
    Testa conexão com WPPConnect
    """
    try:
        # Testar geração de token
        token_generated = wppconnect_service.generate_token()
        
        if not token_generated:
            return jsonify({
                "connected": False,
                "error": "Falha na autenticação"
            }), 500
        
        # Testar status da sessão
        try:
            status = wppconnect_service.get_session_status()
            connection_ok = True
        except:
            status = {"error": "Sessão não iniciada"}
            connection_ok = False
        
        return jsonify({
            "connected": connection_ok,
            "token_valid": token_generated,
            "session_status": status,
            "wppconnect_url": wppconnect_service.base_url
        }), 200
        
    except Exception as e:
        logger.error(f"Erro no teste de conexão: {e}")
        return jsonify({
            "connected": False,
            "error": str(e)
        }), 500

