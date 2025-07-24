from flask import Blueprint, request, jsonify
import logging
from src.services.message_processor import message_processor

logger = logging.getLogger(__name__)

webhook_bp = Blueprint('webhook', __name__)

@webhook_bp.route('/webhook', methods=['POST'])
def receive_webhook():
    """
    Endpoint para receber webhooks do WPPConnect
    """
    try:
        # Obter dados do webhook
        webhook_data = request.get_json()
        
        if not webhook_data:
            logger.warning("Webhook recebido sem dados")
            return jsonify({"status": "error", "message": "Dados não fornecidos"}), 400
        
        # Log do webhook recebido (apenas para debug)
        logger.info(f"Webhook recebido: {webhook_data.get('event', 'unknown')}")
        
        # Processar apenas mensagens
        if webhook_data.get('event') == 'onMessage' or 'body' in webhook_data:
            result = message_processor.process_webhook_message(webhook_data)
            
            # Log do resultado
            if result['status'] == 'processed':
                logger.info(f"Mensagem processada com sucesso: Lead {result.get('lead_id')}")
            elif result['status'] == 'ignored':
                logger.debug(f"Mensagem ignorada: {result.get('reason')}")
            else:
                logger.warning(f"Erro no processamento: {result.get('reason')}")
            
            return jsonify(result), 200
        
        # Para outros tipos de evento, apenas confirmar recebimento
        return jsonify({"status": "received", "event": webhook_data.get('event')}), 200
        
    except Exception as e:
        logger.error(f"Erro no webhook: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500

@webhook_bp.route('/webhook/test', methods=['GET', 'POST'])
def test_webhook():
    """
    Endpoint para testar o webhook
    """
    if request.method == 'GET':
        return jsonify({
            "status": "ok",
            "message": "Webhook está funcionando",
            "method": "GET"
        })
    
    # POST - simular webhook
    test_data = request.get_json() or {}
    
    return jsonify({
        "status": "test_received",
        "data": test_data,
        "message": "Dados de teste recebidos com sucesso"
    })

@webhook_bp.route('/webhook/status', methods=['GET'])
def webhook_status():
    """
    Verifica status do sistema de webhook
    """
    try:
        from src.services.wppconnect_service import wppconnect_service
        from src.services.openai_service import openai_service
        
        # Verificar status dos serviços
        wpp_status = wppconnect_service.get_connection_info()
        ai_stats = openai_service.get_stats()
        
        return jsonify({
            "webhook_active": True,
            "wppconnect": wpp_status,
            "openai": ai_stats,
            "timestamp": "2024-01-01T00:00:00Z"  # Placeholder
        })
        
    except Exception as e:
        logger.error(f"Erro ao verificar status: {e}")
        return jsonify({
            "webhook_active": False,
            "error": str(e)
        }), 500

