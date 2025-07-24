from flask import Blueprint, request, jsonify, g
import logging

from src.models.user import db
from src.models.subscription import Plano, Assinatura, Fatura, PlanoEnum
from src.services.stripe_service import stripe_service
from src.middleware.auth import require_auth, require_active_subscription

logger = logging.getLogger(__name__)

billing_bp = Blueprint('billing', __name__)

@billing_bp.route('/planos', methods=['GET'])
def get_planos():
    """
    Lista todos os planos disponíveis
    """
    try:
        planos = Plano.query.filter_by(ativo=True).all()
        return jsonify({
            "planos": [plano.to_dict() for plano in planos]
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao listar planos: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@billing_bp.route('/assinatura', methods=['GET'])
@require_auth
def get_assinatura_atual():
    """
    Obtém a assinatura atual do cliente
    """
    try:
        cliente_id = g.cliente_id
        
        assinatura = Assinatura.query.filter_by(
            cliente_id=cliente_id
        ).order_by(Assinatura.data_criacao.desc()).first()
        
        if not assinatura:
            return jsonify({"assinatura": None}), 200
        
        return jsonify({
            "assinatura": assinatura.to_dict()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter assinatura: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@billing_bp.route('/checkout', methods=['POST'])
@require_auth
def criar_checkout():
    """
    Cria uma sessão de checkout do Stripe
    """
    try:
        cliente_id = g.cliente_id
        data = request.get_json()
        
        plano_id = data.get('plano_id')
        periodicidade = data.get('periodicidade', 'mensal')
        
        if not plano_id:
            return jsonify({"error": "Plano é obrigatório"}), 400
        
        # Verificar se o plano existe
        plano = Plano.query.get(plano_id)
        if not plano or not plano.ativo:
            return jsonify({"error": "Plano não encontrado"}), 404
        
        # Criar sessão de checkout
        session = stripe_service.criar_checkout_session(
            cliente_id=cliente_id,
            plano_id=plano_id,
            periodicidade=periodicidade
        )
        
        return jsonify({
            "checkout_url": session.url,
            "session_id": session.id
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao criar checkout: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@billing_bp.route('/portal', methods=['POST'])
@require_auth
def criar_portal():
    """
    Cria uma sessão do portal do cliente
    """
    try:
        cliente_id = g.cliente_id
        
        session = stripe_service.criar_portal_session(cliente_id)
        
        return jsonify({
            "portal_url": session.url
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao criar portal: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@billing_bp.route('/cancelar', methods=['POST'])
@require_auth
def cancelar_assinatura():
    """
    Cancela a assinatura atual
    """
    try:
        cliente_id = g.cliente_id
        
        assinatura = Assinatura.query.filter_by(
            cliente_id=cliente_id,
            status='ativa'
        ).first()
        
        if not assinatura:
            return jsonify({"error": "Nenhuma assinatura ativa encontrada"}), 404
        
        sucesso = stripe_service.cancelar_assinatura(assinatura.id)
        
        if sucesso:
            return jsonify({"message": "Assinatura cancelada com sucesso"}), 200
        else:
            return jsonify({"error": "Erro ao cancelar assinatura"}), 500
        
    except Exception as e:
        logger.error(f"Erro ao cancelar assinatura: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@billing_bp.route('/faturas', methods=['GET'])
@require_auth
def get_faturas():
    """
    Lista as faturas do cliente
    """
    try:
        cliente_id = g.cliente_id
        
        # Buscar assinaturas do cliente
        assinaturas = Assinatura.query.filter_by(cliente_id=cliente_id).all()
        assinatura_ids = [a.id for a in assinaturas]
        
        # Buscar faturas
        faturas = Fatura.query.filter(
            Fatura.assinatura_id.in_(assinatura_ids)
        ).order_by(Fatura.data_criacao.desc()).all()
        
        return jsonify({
            "faturas": [fatura.to_dict() for fatura in faturas]
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao listar faturas: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@billing_bp.route('/uso', methods=['GET'])
@require_auth
def get_uso_atual():
    """
    Obtém o uso atual do cliente
    """
    try:
        cliente_id = g.cliente_id
        
        assinatura = Assinatura.query.filter_by(
            cliente_id=cliente_id
        ).order_by(Assinatura.data_criacao.desc()).first()
        
        if not assinatura:
            return jsonify({
                "uso": {
                    "leads_utilizados": 0,
                    "mensagens_utilizadas": 0,
                    "limite_leads": 0,
                    "limite_mensagens": 0,
                    "percentual_leads": 0,
                    "percentual_mensagens": 0
                }
            }), 200
        
        # Calcular percentuais
        percentual_leads = (assinatura.leads_utilizados / assinatura.plano.limite_leads) * 100 if assinatura.plano.limite_leads > 0 else 0
        percentual_mensagens = (assinatura.mensagens_utilizadas / assinatura.plano.limite_mensagens_mes) * 100 if assinatura.plano.limite_mensagens_mes > 0 else 0
        
        return jsonify({
            "uso": {
                "leads_utilizados": assinatura.leads_utilizados,
                "mensagens_utilizadas": assinatura.mensagens_utilizadas,
                "limite_leads": assinatura.plano.limite_leads,
                "limite_mensagens": assinatura.plano.limite_mensagens_mes,
                "percentual_leads": round(percentual_leads, 1),
                "percentual_mensagens": round(percentual_mensagens, 1),
                "dias_restantes": assinatura.dias_restantes(),
                "status": assinatura.status.value
            }
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao obter uso: {e}")
        return jsonify({"error": "Erro interno do servidor"}), 500

@billing_bp.route('/webhook', methods=['POST'])
def stripe_webhook():
    """
    Endpoint para receber webhooks do Stripe
    """
    try:
        payload = request.get_data()
        sig_header = request.headers.get('Stripe-Signature')
        
        if not sig_header:
            return jsonify({"error": "Missing signature"}), 400
        
        sucesso = stripe_service.processar_webhook(payload, sig_header)
        
        if sucesso:
            return jsonify({"status": "success"}), 200
        else:
            return jsonify({"error": "Webhook processing failed"}), 400
        
    except Exception as e:
        logger.error(f"Erro no webhook: {e}")
        return jsonify({"error": "Webhook error"}), 400

@billing_bp.route('/trial', methods=['POST'])
@require_auth
def iniciar_trial():
    """
    Inicia um período de trial para o cliente
    """
    try:
        cliente_id = g.cliente_id
        
        # Verificar se já tem trial ativo
        trial_existente = Assinatura.query.filter_by(
            cliente_id=cliente_id,
            trial_ativo=True
        ).first()
        
        if trial_existente:
            return jsonify({"error": "Trial já ativo"}), 400
        
        # Buscar plano básico para trial
        plano_trial = Plano.query.filter_by(tipo=PlanoEnum.TRIAL).first()
        if not plano_trial:
            return jsonify({"error": "Plano de trial não configurado"}), 500
        
        # Criar assinatura de trial
        from datetime import datetime, timedelta
        
        trial = Assinatura(
            cliente_id=cliente_id,
            plano_id=plano_trial.id,
            status='trial',
            trial_ativo=True,
            trial_fim=datetime.utcnow() + timedelta(days=14),  # 14 dias de trial
            data_inicio=datetime.utcnow()
        )
        
        db.session.add(trial)
        
        # Atualizar status do cliente
        cliente = g.current_user
        cliente.status = 'trial'
        
        db.session.commit()
        
        return jsonify({
            "message": "Trial iniciado com sucesso",
            "trial_fim": trial.trial_fim.isoformat()
        }), 200
        
    except Exception as e:
        logger.error(f"Erro ao iniciar trial: {e}")
        db.session.rollback()
        return jsonify({"error": "Erro interno do servidor"}), 500

