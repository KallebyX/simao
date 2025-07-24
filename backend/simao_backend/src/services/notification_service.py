"""
Sistema de Notificações e Alertas - Simão IA Rural
Gerencia alertas críticos, notificações em tempo real e comunicação proativa
"""

import os
import json
import logging
import smtplib
import requests
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from enum import Enum
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from flask import current_app
from redis import Redis

from ..models.user import db, Cliente, User
from ..models.qualidade_agua import AlertaQualidade, QualidadeAgua
from ..models.estoque_peixe import LotePeixe, MovimentacaoEstoque
from ..models.lead import Lead

logger = logging.getLogger(__name__)

class NotificationType(Enum):
    """Tipos de notificação"""
    QUALIDADE_AGUA_CRITICA = "qualidade_agua_critica"
    MORTALIDADE_ALTA = "mortalidade_alta"
    ESTOQUE_BAIXO = "estoque_baixo"
    LEAD_QUENTE = "lead_quente"
    SISTEMA_ERROR = "sistema_error"
    BACKUP_COMPLETO = "backup_completo"
    VENCIMENTO_PLANO = "vencimento_plano"
    META_ALCANCADA = "meta_alcancada"

class NotificationPriority(Enum):
    """Prioridades de notificação"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    CRITICAL = 4

class NotificationChannel(Enum):
    """Canais de notificação"""
    EMAIL = "email"
    WHATSAPP = "whatsapp" 
    IN_APP = "in_app"
    SMS = "sms"
    WEBHOOK = "webhook"

class Notification:
    """Classe para representar uma notificação"""
    
    def __init__(
        self,
        tipo: NotificationType,
        titulo: str,
        mensagem: str,
        cliente_id: int,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        data: Dict = None,
        channels: List[NotificationChannel] = None
    ):
        self.id = f"notif_{int(datetime.utcnow().timestamp())}_{cliente_id}"
        self.tipo = tipo
        self.titulo = titulo
        self.mensagem = mensagem
        self.cliente_id = cliente_id
        self.priority = priority
        self.data = data or {}
        self.channels = channels or [NotificationChannel.IN_APP]
        self.created_at = datetime.utcnow()
        self.sent = False
        self.attempts = 0
        self.last_attempt = None
        self.error = None
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'tipo': self.tipo.value,
            'titulo': self.titulo,
            'mensagem': self.mensagem,
            'cliente_id': self.cliente_id,
            'priority': self.priority.value,
            'data': self.data,
            'channels': [c.value for c in self.channels],
            'created_at': self.created_at.isoformat(),
            'sent': self.sent,
            'attempts': self.attempts,
            'last_attempt': self.last_attempt.isoformat() if self.last_attempt else None,
            'error': self.error
        }
    
    @classmethod
    def from_dict(cls, data: Dict) -> 'Notification':
        notif = cls.__new__(cls)
        notif.id = data['id']
        notif.tipo = NotificationType(data['tipo'])
        notif.titulo = data['titulo']
        notif.mensagem = data['mensagem']
        notif.cliente_id = data['cliente_id']
        notif.priority = NotificationPriority(data['priority'])
        notif.data = data.get('data', {})
        notif.channels = [NotificationChannel(c) for c in data.get('channels', [])]
        notif.created_at = datetime.fromisoformat(data['created_at'])
        notif.sent = data.get('sent', False)
        notif.attempts = data.get('attempts', 0)
        notif.last_attempt = datetime.fromisoformat(data['last_attempt']) if data.get('last_attempt') else None
        notif.error = data.get('error')
        return notif

class NotificationService:
    """Serviço principal de notificações"""
    
    def __init__(self, redis_client: Redis = None):
        self.redis = redis_client
        if not self.redis:
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/1')
            try:
                self.redis = Redis.from_url(redis_url, decode_responses=True)
                self.redis.ping()
            except:
                logger.warning("Redis não disponível - notificações serão apenas por email")
                self.redis = None
        
        # Configurações de email
        self.smtp_host = os.getenv('SMTP_HOST', 'smtp.gmail.com')
        self.smtp_port = int(os.getenv('SMTP_PORT', '587'))
        self.smtp_user = os.getenv('SMTP_USER')
        self.smtp_pass = os.getenv('SMTP_PASSWORD')
        
        # Configurações WhatsApp
        self.whatsapp_api_url = os.getenv('WPPCONNECT_URL', 'http://localhost:21465')
        self.whatsapp_session = os.getenv('WPPCONNECT_SESSION', 'simao_session')
        
        # TTL para notificações no Redis
        self.notification_ttl = 86400 * 7  # 7 dias
    
    def create_notification(
        self,
        tipo: NotificationType,
        titulo: str,
        mensagem: str,
        cliente_id: int,
        priority: NotificationPriority = NotificationPriority.MEDIUM,
        data: Dict = None,
        channels: List[NotificationChannel] = None
    ) -> Notification:
        """Cria nova notificação"""
        
        notification = Notification(
            tipo=tipo,
            titulo=titulo,
            mensagem=mensagem,
            cliente_id=cliente_id,
            priority=priority,
            data=data,
            channels=channels
        )
        
        # Salvar no Redis se disponível
        if self.redis:
            try:
                key = f"notification:{notification.id}"
                self.redis.setex(key, self.notification_ttl, json.dumps(notification.to_dict()))
                
                # Adicionar à fila por prioridade
                queue_key = f"notification_queue:{priority.name.lower()}"
                self.redis.lpush(queue_key, notification.id)
                
                logger.info(f"Notificação criada: {notification.id} - {titulo}")
                
            except Exception as e:
                logger.error(f"Erro ao salvar notificação: {e}")
        
        return notification
    
    def send_notification(self, notification: Notification) -> bool:
        """Envia notificação através dos canais configurados"""
        
        notification.attempts += 1
        notification.last_attempt = datetime.utcnow()
        success = True
        
        for channel in notification.channels:
            try:
                if channel == NotificationChannel.EMAIL:
                    success &= self._send_email(notification)
                elif channel == NotificationChannel.WHATSAPP:
                    success &= self._send_whatsapp(notification)
                elif channel == NotificationChannel.IN_APP:
                    success &= self._send_in_app(notification)
                elif channel == NotificationChannel.WEBHOOK:
                    success &= self._send_webhook(notification)
                
            except Exception as e:
                logger.error(f"Erro ao enviar notificação via {channel.value}: {e}")
                notification.error = str(e)
                success = False
        
        notification.sent = success
        
        # Atualizar no Redis
        if self.redis and success:
            try:
                key = f"notification:{notification.id}"
                self.redis.setex(key, self.notification_ttl, json.dumps(notification.to_dict()))
            except:
                pass
        
        return success
    
    def _send_email(self, notification: Notification) -> bool:
        """Envia notificação por email"""
        
        if not all([self.smtp_user, self.smtp_pass]):
            logger.warning("Configurações de email não encontradas")
            return False
        
        try:
            # Buscar cliente e usuário
            cliente = Cliente.query.get(notification.cliente_id)
            if not cliente or not cliente.user:
                return False
            
            user = cliente.user
            
            # Preparar email
            msg = MIMEMultipart()
            msg['From'] = self.smtp_user
            msg['To'] = user.email
            msg['Subject'] = f"[Simão IA Rural] {notification.titulo}"
            
            # Corpo do email
            html_body = self._generate_email_html(notification, cliente, user)
            msg.attach(MIMEText(html_body, 'html'))
            
            # Enviar
            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_pass)
                server.send_message(msg)
            
            logger.info(f"Email enviado para {user.email}: {notification.titulo}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao enviar email: {e}")
            return False
    
    def _send_whatsapp(self, notification: Notification) -> bool:
        """Envia notificação via WhatsApp"""
        
        try:
            # Buscar cliente
            cliente = Cliente.query.get(notification.cliente_id)
            if not cliente or not cliente.telefone:
                return False
            
            # Preparar mensagem
            mensagem = f"🔔 *{notification.titulo}*\n\n{notification.mensagem}"
            
            if notification.priority == NotificationPriority.CRITICAL:
                mensagem = f"🚨 *ALERTA CRÍTICO* 🚨\n\n" + mensagem
            
            # Enviar via WPPConnect
            url = f"{self.whatsapp_api_url}/api/{self.whatsapp_session}/send-message"
            data = {
                "phone": cliente.telefone,
                "message": mensagem
            }
            
            response = requests.post(url, json=data, timeout=10)
            response.raise_for_status()
            
            logger.info(f"WhatsApp enviado para {cliente.telefone}: {notification.titulo}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao enviar WhatsApp: {e}")
            return False
    
    def _send_in_app(self, notification: Notification) -> bool:
        """Salva notificação para exibição in-app"""
        
        if not self.redis:
            return True  # Sem Redis, consideramos como enviado
        
        try:
            # Salvar na lista de notificações do cliente
            key = f"notifications:client:{notification.cliente_id}"
            notification_data = notification.to_dict()
            
            # Adicionar à lista
            self.redis.lpush(key, json.dumps(notification_data))
            
            # Manter apenas últimas 50 notificações
            self.redis.ltrim(key, 0, 49)
            
            # Definir TTL
            self.redis.expire(key, self.notification_ttl)
            
            # Contar notificações não lidas
            unread_key = f"notifications:unread:{notification.cliente_id}"
            self.redis.incr(unread_key)
            self.redis.expire(unread_key, self.notification_ttl)
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao salvar notificação in-app: {e}")
            return False
    
    def _send_webhook(self, notification: Notification) -> bool:
        """Envia notificação via webhook personalizado"""
        
        try:
            # Buscar URL do webhook do cliente (se configurado)
            cliente = Cliente.query.get(notification.cliente_id)
            if not cliente:
                return False
            
            # TODO: Implementar campo webhook_url no modelo Cliente
            webhook_url = getattr(cliente, 'webhook_url', None)
            
            if not webhook_url:
                return True  # Sem webhook configurado, consideramos ok
            
            # Enviar POST com dados da notificação
            payload = {
                "timestamp": notification.created_at.isoformat(),
                "tipo": notification.tipo.value,
                "titulo": notification.titulo,
                "mensagem": notification.mensagem,
                "priority": notification.priority.value,
                "data": notification.data,
                "cliente_id": notification.cliente_id
            }
            
            response = requests.post(
                webhook_url,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=10
            )
            
            response.raise_for_status()
            
            logger.info(f"Webhook enviado para {webhook_url}: {notification.titulo}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao enviar webhook: {e}")
            return False
    
    def _generate_email_html(self, notification: Notification, cliente: Cliente, user: User) -> str:
        """Gera HTML personalizado para email"""
        
        priority_colors = {
            NotificationPriority.LOW: "#17a2b8",
            NotificationPriority.MEDIUM: "#ffc107", 
            NotificationPriority.HIGH: "#fd7e14",
            NotificationPriority.CRITICAL: "#dc3545"
        }
        
        priority_names = {
            NotificationPriority.LOW: "Baixa",
            NotificationPriority.MEDIUM: "Média",
            NotificationPriority.HIGH: "Alta", 
            NotificationPriority.CRITICAL: "Crítica"
        }
        
        color = priority_colors.get(notification.priority, "#6c757d")
        priority_name = priority_names.get(notification.priority, "Média")
        
        html = f"""
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>Simão IA Rural - Notificação</title>
        </head>
        <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
            <div style="max-width: 600px; margin: 0 auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
                
                <!-- Header -->
                <div style="text-align: center; margin-bottom: 30px; padding-bottom: 20px; border-bottom: 2px solid #e9ecef;">
                    <h1 style="color: #2c3e50; margin: 0;">🐟 Simão IA Rural</h1>
                    <p style="color: #6c757d; margin: 5px 0 0 0;">Sistema Inteligente de Piscicultura</p>
                </div>
                
                <!-- Notification Content -->
                <div style="margin-bottom: 30px;">
                    <div style="background: {color}; color: white; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
                        <h2 style="margin: 0; font-size: 18px;">🔔 {notification.titulo}</h2>
                        <small>Prioridade: {priority_name}</small>
                    </div>
                    
                    <div style="padding: 20px; background: #f8f9fa; border-radius: 5px; border-left: 4px solid {color};">
                        <p style="margin: 0; font-size: 16px; color: #495057;">
                            {notification.mensagem}
                        </p>
                    </div>
                </div>
                
                <!-- Additional Data -->
                {self._generate_email_data_section(notification)}
                
                <!-- Client Info -->
                <div style="margin-bottom: 30px; padding: 15px; background: #e9ecef; border-radius: 5px;">
                    <h3 style="margin: 0 0 10px 0; color: #495057;">Informações do Cliente</h3>
                    <p style="margin: 5px 0;"><strong>Empresa:</strong> {cliente.nome_empresa}</p>
                    <p style="margin: 5px 0;"><strong>Usuário:</strong> {user.nome}</p>
                    <p style="margin: 5px 0;"><strong>Data:</strong> {notification.created_at.strftime('%d/%m/%Y às %H:%M')}</p>
                </div>
                
                <!-- Footer -->
                <div style="text-align: center; padding-top: 20px; border-top: 1px solid #e9ecef; color: #6c757d; font-size: 14px;">
                    <p>Este é um email automático do sistema Simão IA Rural.</p>
                    <p>Acesse sua conta em: <a href="https://simao-ia-rural.com" style="color: {color};">https://simao-ia-rural.com</a></p>
                    <p style="margin-top: 20px;">
                        💰 Economizando 95% em custos de IA com Google Gemini<br>
                        🛡️ Protegido por rate limiting e logs estruturados
                    </p>
                </div>
            </div>
        </body>
        </html>
        """
        
        return html
    
    def _generate_email_data_section(self, notification: Notification) -> str:
        """Gera seção de dados adicionais no email"""
        
        if not notification.data:
            return ""
        
        html = """
        <div style="margin-bottom: 30px;">
            <h3 style="color: #495057; margin-bottom: 15px;">Detalhes Adicionais</h3>
            <div style="background: #ffffff; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px;">
        """
        
        for key, value in notification.data.items():
            key_formatted = key.replace('_', ' ').title()
            html += f'<p style="margin: 8px 0;"><strong>{key_formatted}:</strong> {value}</p>'
        
        html += """
            </div>
        </div>
        """
        
        return html
    
    def get_client_notifications(self, cliente_id: int, limit: int = 20, unread_only: bool = False) -> List[Dict]:
        """Recupera notificações do cliente"""
        
        if not self.redis:
            return []
        
        try:
            key = f"notifications:client:{cliente_id}"
            notifications = []
            
            # Buscar notificações
            raw_notifications = self.redis.lrange(key, 0, limit - 1)
            
            for raw_notif in raw_notifications:
                try:
                    notif_data = json.loads(raw_notif)
                    
                    # Filtrar apenas não lidas se solicitado
                    if unread_only and notif_data.get('read', False):
                        continue
                    
                    notifications.append(notif_data)
                    
                except json.JSONDecodeError:
                    continue
            
            return notifications
            
        except Exception as e:
            logger.error(f"Erro ao buscar notificações: {e}")
            return []
    
    def mark_as_read(self, cliente_id: int, notification_ids: List[str] = None) -> bool:
        """Marca notificações como lidas"""
        
        if not self.redis:
            return True
        
        try:
            if not notification_ids:
                # Marcar todas como lidas
                unread_key = f"notifications:unread:{cliente_id}"
                self.redis.delete(unread_key)
                return True
            
            # TODO: Implementar marcação individual
            # Por ora, apenas reduzir contador
            unread_key = f"notifications:unread:{cliente_id}"
            current = self.redis.get(unread_key)
            if current:
                new_count = max(0, int(current) - len(notification_ids))
                if new_count > 0:
                    self.redis.set(unread_key, new_count)
                else:
                    self.redis.delete(unread_key)
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao marcar como lidas: {e}")
            return False
    
    def get_unread_count(self, cliente_id: int) -> int:
        """Retorna número de notificações não lidas"""
        
        if not self.redis:
            return 0
        
        try:
            unread_key = f"notifications:unread:{cliente_id}"
            count = self.redis.get(unread_key)
            return int(count) if count else 0
            
        except Exception as e:
            logger.error(f"Erro ao contar não lidas: {e}")
            return 0

# Instância global
notification_service = NotificationService()

# Funções de conveniência para criar alertas específicos

def alert_qualidade_critica(cliente_id: int, viveiro: str, parametro: str, valor: float, ideal_min: float = None, ideal_max: float = None):
    """Alerta de qualidade da água crítica"""
    
    if ideal_min is not None and valor < ideal_min:
        problema = f"{parametro} muito baixo: {valor} (mínimo ideal: {ideal_min})"
    elif ideal_max is not None and valor > ideal_max:
        problema = f"{parametro} muito alto: {valor} (máximo ideal: {ideal_max})"
    else:
        problema = f"{parametro} fora do padrão: {valor}"
    
    notification = notification_service.create_notification(
        tipo=NotificationType.QUALIDADE_AGUA_CRITICA,
        titulo=f"⚠️ Qualidade da Água Crítica - {viveiro}",
        mensagem=f"Detectado problema crítico na qualidade da água do {viveiro}.\n\n{problema}\n\nRecomenda-se verificação imediata e ações corretivas.",
        cliente_id=cliente_id,
        priority=NotificationPriority.CRITICAL,
        data={
            "viveiro": viveiro,
            "parametro": parametro,
            "valor": valor,
            "ideal_min": ideal_min,
            "ideal_max": ideal_max
        },
        channels=[NotificationChannel.EMAIL, NotificationChannel.WHATSAPP, NotificationChannel.IN_APP]
    )
    
    # Enviar imediatamente
    notification_service.send_notification(notification)

def alert_mortalidade_alta(cliente_id: int, lote: str, taxa_mortalidade: float, quantidade_morta: int):
    """Alerta de mortalidade alta"""
    
    notification = notification_service.create_notification(
        tipo=NotificationType.MORTALIDADE_ALTA,
        titulo=f"📈 Alta Mortalidade Detectada - {lote}",
        mensagem=f"O lote {lote} apresenta taxa de mortalidade elevada.\n\nTaxa atual: {taxa_mortalidade:.1f}%\nQuantidade: {quantidade_morta} peixes\n\nInvestigue possíveis causas: qualidade da água, doenças, stress, alimentação.",
        cliente_id=cliente_id,
        priority=NotificationPriority.HIGH,
        data={
            "lote": lote,
            "taxa_mortalidade": taxa_mortalidade,
            "quantidade_morta": quantidade_morta
        },
        channels=[NotificationChannel.EMAIL, NotificationChannel.IN_APP]
    )
    
    notification_service.send_notification(notification)

def alert_lead_quente(cliente_id: int, lead_nome: str, telefone: str, score: int, interesse: str = None):
    """Alerta de lead com alta pontuação"""
    
    interesse_msg = f"\nInteresse: {interesse}" if interesse else ""
    
    notification = notification_service.create_notification(
        tipo=NotificationType.LEAD_QUENTE,
        titulo=f"🔥 Lead Quente Detectado - {lead_nome}",
        mensagem=f"Novo lead com alta pontuação identificado!\n\nNome: {lead_nome}\nTelefone: {telefone}\nScore: {score}/100{interesse_msg}\n\nRecomenda-se contato prioritário.",
        cliente_id=cliente_id,
        priority=NotificationPriority.HIGH,
        data={
            "lead_nome": lead_nome,
            "telefone": telefone,
            "score": score,
            "interesse": interesse
        },
        channels=[NotificationChannel.IN_APP, NotificationChannel.WHATSAPP]
    )
    
    notification_service.send_notification(notification)

def alert_meta_alcancada(cliente_id: int, meta_tipo: str, valor_meta: float, valor_atual: float):
    """Alerta de meta alcançada"""
    
    notification = notification_service.create_notification(
        tipo=NotificationType.META_ALCANCADA,
        titulo=f"🎯 Meta Alcançada - {meta_tipo}",
        mensagem=f"Parabéns! Você atingiu sua meta de {meta_tipo}.\n\nMeta: {valor_meta}\nAlcançado: {valor_atual}\n\nContinue assim! 💪",
        cliente_id=cliente_id,
        priority=NotificationPriority.MEDIUM,
        data={
            "meta_tipo": meta_tipo,
            "valor_meta": valor_meta,
            "valor_atual": valor_atual,
            "percentual": (valor_atual / valor_meta * 100) if valor_meta > 0 else 0
        },
        channels=[NotificationChannel.IN_APP, NotificationChannel.EMAIL]
    )
    
    notification_service.send_notification(notification)