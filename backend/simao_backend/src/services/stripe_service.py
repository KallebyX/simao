import stripe
import os
import logging
from datetime import datetime, timedelta
from flask import current_app

from src.models.user import db, Cliente
from src.models.subscription import Plano, Assinatura, Fatura, StatusAssinaturaEnum, PlanoEnum

logger = logging.getLogger(__name__)

class StripeService:
    def __init__(self):
        stripe.api_key = os.getenv('STRIPE_SECRET_KEY')
        self.webhook_secret = os.getenv('STRIPE_WEBHOOK_SECRET')
    
    def criar_customer(self, cliente):
        """Cria um customer no Stripe"""
        try:
            customer = stripe.Customer.create(
                email=cliente.email,
                name=cliente.nome,
                metadata={
                    'cliente_id': str(cliente.id),
                    'empresa': cliente.empresa or ''
                }
            )
            
            # Atualizar cliente com ID do Stripe
            cliente.stripe_customer_id = customer.id
            db.session.commit()
            
            logger.info(f"Customer criado no Stripe: {customer.id} para cliente {cliente.id}")
            return customer
            
        except Exception as e:
            logger.error(f"Erro ao criar customer no Stripe: {e}")
            raise
    
    def criar_checkout_session(self, cliente_id, plano_id, periodicidade='mensal'):
        """Cria uma sessão de checkout do Stripe"""
        try:
            cliente = Cliente.query.get(cliente_id)
            plano = Plano.query.get(plano_id)
            
            if not cliente or not plano:
                raise ValueError("Cliente ou plano não encontrado")
            
            # Criar customer se não existir
            if not cliente.stripe_customer_id:
                self.criar_customer(cliente)
            
            # Determinar price_id baseado na periodicidade
            if periodicidade == 'anual':
                price_id = plano.stripe_price_id_anual
            else:
                price_id = plano.stripe_price_id_mensal
            
            if not price_id:
                raise ValueError(f"Price ID não configurado para o plano {plano.nome}")
            
            # Criar sessão de checkout
            session = stripe.checkout.Session.create(
                customer=cliente.stripe_customer_id,
                payment_method_types=['card'],
                line_items=[{
                    'price': price_id,
                    'quantity': 1,
                }],
                mode='subscription',
                success_url=f"{os.getenv('FRONTEND_URL')}/dashboard?checkout=success",
                cancel_url=f"{os.getenv('FRONTEND_URL')}/dashboard?checkout=cancel",
                metadata={
                    'cliente_id': str(cliente_id),
                    'plano_id': str(plano_id),
                    'periodicidade': periodicidade
                }
            )
            
            logger.info(f"Checkout session criada: {session.id} para cliente {cliente_id}")
            return session
            
        except Exception as e:
            logger.error(f"Erro ao criar checkout session: {e}")
            raise
    
    def criar_portal_session(self, cliente_id):
        """Cria uma sessão do portal do cliente"""
        try:
            cliente = Cliente.query.get(cliente_id)
            
            if not cliente or not cliente.stripe_customer_id:
                raise ValueError("Cliente não encontrado ou sem customer ID")
            
            session = stripe.billing_portal.Session.create(
                customer=cliente.stripe_customer_id,
                return_url=f"{os.getenv('FRONTEND_URL')}/dashboard"
            )
            
            return session
            
        except Exception as e:
            logger.error(f"Erro ao criar portal session: {e}")
            raise
    
    def processar_webhook(self, payload, sig_header):
        """Processa webhooks do Stripe"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, self.webhook_secret
            )
            
            logger.info(f"Webhook recebido: {event['type']}")
            
            # Processar diferentes tipos de eventos
            if event['type'] == 'checkout.session.completed':
                self._processar_checkout_completed(event['data']['object'])
            
            elif event['type'] == 'invoice.payment_succeeded':
                self._processar_payment_succeeded(event['data']['object'])
            
            elif event['type'] == 'invoice.payment_failed':
                self._processar_payment_failed(event['data']['object'])
            
            elif event['type'] == 'customer.subscription.updated':
                self._processar_subscription_updated(event['data']['object'])
            
            elif event['type'] == 'customer.subscription.deleted':
                self._processar_subscription_deleted(event['data']['object'])
            
            return True
            
        except ValueError as e:
            logger.error(f"Erro na assinatura do webhook: {e}")
            return False
        except Exception as e:
            logger.error(f"Erro ao processar webhook: {e}")
            return False
    
    def _processar_checkout_completed(self, session):
        """Processa checkout completado"""
        try:
            cliente_id = int(session['metadata']['cliente_id'])
            plano_id = int(session['metadata']['plano_id'])
            periodicidade = session['metadata']['periodicidade']
            
            cliente = Cliente.query.get(cliente_id)
            plano = Plano.query.get(plano_id)
            
            # Obter subscription do Stripe
            subscription = stripe.Subscription.retrieve(session['subscription'])
            
            # Cancelar assinatura anterior se existir
            assinatura_anterior = Assinatura.query.filter_by(
                cliente_id=cliente_id,
                status=StatusAssinaturaEnum.ATIVA
            ).first()
            
            if assinatura_anterior:
                assinatura_anterior.status = StatusAssinaturaEnum.CANCELADA
                assinatura_anterior.data_cancelamento = datetime.utcnow()
            
            # Criar nova assinatura
            nova_assinatura = Assinatura(
                cliente_id=cliente_id,
                plano_id=plano_id,
                status=StatusAssinaturaEnum.ATIVA,
                stripe_subscription_id=subscription['id'],
                stripe_customer_id=subscription['customer'],
                periodicidade=periodicidade,
                data_inicio=datetime.utcnow(),
                data_fim=datetime.fromtimestamp(subscription['current_period_end']),
                proxima_cobranca=datetime.fromtimestamp(subscription['current_period_end']),
                valor_mensal=plano.preco_mensal if periodicidade == 'mensal' else None,
                valor_anual=plano.preco_anual if periodicidade == 'anual' else None
            )
            
            db.session.add(nova_assinatura)
            
            # Atualizar status do cliente
            cliente.status = StatusAssinaturaEnum.ATIVA
            
            db.session.commit()
            
            logger.info(f"Assinatura criada para cliente {cliente_id}, plano {plano_id}")
            
        except Exception as e:
            logger.error(f"Erro ao processar checkout completed: {e}")
            db.session.rollback()
    
    def _processar_payment_succeeded(self, invoice):
        """Processa pagamento bem-sucedido"""
        try:
            subscription_id = invoice['subscription']
            
            assinatura = Assinatura.query.filter_by(
                stripe_subscription_id=subscription_id
            ).first()
            
            if assinatura:
                # Atualizar próxima cobrança
                subscription = stripe.Subscription.retrieve(subscription_id)
                assinatura.proxima_cobranca = datetime.fromtimestamp(
                    subscription['current_period_end']
                )
                assinatura.data_fim = datetime.fromtimestamp(
                    subscription['current_period_end']
                )
                
                # Criar registro de fatura
                fatura = Fatura(
                    assinatura_id=assinatura.id,
                    numero_fatura=invoice['number'],
                    valor=invoice['amount_paid'] / 100,  # Stripe usa centavos
                    status='paga',
                    data_vencimento=datetime.fromtimestamp(invoice['due_date']) if invoice['due_date'] else datetime.utcnow(),
                    data_pagamento=datetime.utcnow(),
                    stripe_invoice_id=invoice['id'],
                    descricao=f"Pagamento da assinatura {assinatura.plano.nome}"
                )
                
                db.session.add(fatura)
                
                # Resetar contadores mensais
                assinatura.resetar_uso_mensal()
                
                db.session.commit()
                
                logger.info(f"Pagamento processado para assinatura {assinatura.id}")
            
        except Exception as e:
            logger.error(f"Erro ao processar payment succeeded: {e}")
            db.session.rollback()
    
    def _processar_payment_failed(self, invoice):
        """Processa falha no pagamento"""
        try:
            subscription_id = invoice['subscription']
            
            assinatura = Assinatura.query.filter_by(
                stripe_subscription_id=subscription_id
            ).first()
            
            if assinatura:
                # Marcar como suspensa após falha no pagamento
                assinatura.status = StatusAssinaturaEnum.SUSPENSA
                
                # Criar registro de fatura vencida
                fatura = Fatura(
                    assinatura_id=assinatura.id,
                    numero_fatura=invoice['number'],
                    valor=invoice['amount_due'] / 100,
                    status='vencida',
                    data_vencimento=datetime.fromtimestamp(invoice['due_date']) if invoice['due_date'] else datetime.utcnow(),
                    stripe_invoice_id=invoice['id'],
                    descricao=f"Pagamento falhou - {assinatura.plano.nome}"
                )
                
                db.session.add(fatura)
                db.session.commit()
                
                logger.warning(f"Pagamento falhou para assinatura {assinatura.id}")
            
        except Exception as e:
            logger.error(f"Erro ao processar payment failed: {e}")
            db.session.rollback()
    
    def _processar_subscription_updated(self, subscription):
        """Processa atualização de assinatura"""
        try:
            assinatura = Assinatura.query.filter_by(
                stripe_subscription_id=subscription['id']
            ).first()
            
            if assinatura:
                # Atualizar status baseado no status do Stripe
                stripe_status = subscription['status']
                
                if stripe_status == 'active':
                    assinatura.status = StatusAssinaturaEnum.ATIVA
                elif stripe_status == 'canceled':
                    assinatura.status = StatusAssinaturaEnum.CANCELADA
                    assinatura.data_cancelamento = datetime.utcnow()
                elif stripe_status in ['past_due', 'unpaid']:
                    assinatura.status = StatusAssinaturaEnum.SUSPENSA
                
                # Atualizar datas
                assinatura.data_fim = datetime.fromtimestamp(
                    subscription['current_period_end']
                )
                assinatura.proxima_cobranca = datetime.fromtimestamp(
                    subscription['current_period_end']
                )
                
                db.session.commit()
                
                logger.info(f"Assinatura {assinatura.id} atualizada: {stripe_status}")
            
        except Exception as e:
            logger.error(f"Erro ao processar subscription updated: {e}")
            db.session.rollback()
    
    def _processar_subscription_deleted(self, subscription):
        """Processa cancelamento de assinatura"""
        try:
            assinatura = Assinatura.query.filter_by(
                stripe_subscription_id=subscription['id']
            ).first()
            
            if assinatura:
                assinatura.status = StatusAssinaturaEnum.CANCELADA
                assinatura.data_cancelamento = datetime.utcnow()
                
                # Atualizar status do cliente
                assinatura.cliente.status = StatusAssinaturaEnum.CANCELADA
                
                db.session.commit()
                
                logger.info(f"Assinatura {assinatura.id} cancelada")
            
        except Exception as e:
            logger.error(f"Erro ao processar subscription deleted: {e}")
            db.session.rollback()
    
    def cancelar_assinatura(self, assinatura_id):
        """Cancela uma assinatura"""
        try:
            assinatura = Assinatura.query.get(assinatura_id)
            
            if not assinatura or not assinatura.stripe_subscription_id:
                raise ValueError("Assinatura não encontrada")
            
            # Cancelar no Stripe
            stripe.Subscription.delete(assinatura.stripe_subscription_id)
            
            # Atualizar localmente
            assinatura.status = StatusAssinaturaEnum.CANCELADA
            assinatura.data_cancelamento = datetime.utcnow()
            
            db.session.commit()
            
            logger.info(f"Assinatura {assinatura_id} cancelada")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao cancelar assinatura: {e}")
            return False

# Instância global do serviço
stripe_service = StripeService()

