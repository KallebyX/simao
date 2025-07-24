"""
Serviço de Handoff para Transferência Humana - Simão IA Rural
Gerencia a transferência de conversas do bot para atendentes humanos
"""

import json
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Dict, Any, List, Tuple
from redis import Redis
from ..models.lead import Lead
from ..models.conversa import Conversa

# Configurar logging
logger = logging.getLogger(__name__)

class HandoffStatus(Enum):
    """Status da transferência"""
    PENDING = "pending"
    ASSIGNED = "assigned"
    ACTIVE = "active"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class HandoffReason(Enum):
    """Motivos para transferência"""
    CLIENT_REQUEST = "client_request"
    COMPLEX_INQUIRY = "complex_inquiry"
    TECHNICAL_ISSUE = "technical_issue"
    SALES_CLOSING = "sales_closing"
    COMPLAINT = "complaint"
    BOT_LIMITATION = "bot_limitation"
    HUMAN_NEEDED = "human_needed"

class HandoffPriority(Enum):
    """Prioridade da transferência"""
    LOW = 1
    MEDIUM = 2
    HIGH = 3
    URGENT = 4

class HandoffRequest:
    """Solicitação de transferência para humano"""
    
    def __init__(self, telefone: str, lead_id: Optional[int] = None):
        self.id = f"handoff_{telefone}_{int(datetime.utcnow().timestamp())}"
        self.telefone = telefone
        self.lead_id = lead_id
        self.status = HandoffStatus.PENDING
        self.reason = HandoffReason.CLIENT_REQUEST
        self.priority = HandoffPriority.MEDIUM
        self.created_at = datetime.utcnow()
        self.assigned_at = None
        self.completed_at = None
        self.agent_id = None
        self.agent_name = None
        self.client_name = None
        self.context_summary = ""
        self.conversation_history = []
        self.notes = ""
        self.metadata = {}
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'id': self.id,
            'telefone': self.telefone,
            'lead_id': self.lead_id,
            'status': self.status.value,
            'reason': self.reason.value,
            'priority': self.priority.value,
            'created_at': self.created_at.isoformat(),
            'assigned_at': self.assigned_at.isoformat() if self.assigned_at else None,
            'completed_at': self.completed_at.isoformat() if self.completed_at else None,
            'agent_id': self.agent_id,
            'agent_name': self.agent_name,
            'client_name': self.client_name,
            'context_summary': self.context_summary,
            'conversation_history': self.conversation_history,
            'notes': self.notes,
            'metadata': self.metadata
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'HandoffRequest':
        request = cls(data['telefone'], data.get('lead_id'))
        request.id = data['id']
        request.status = HandoffStatus(data['status'])
        request.reason = HandoffReason(data['reason'])
        request.priority = HandoffPriority(data['priority'])
        request.created_at = datetime.fromisoformat(data['created_at'])
        request.assigned_at = datetime.fromisoformat(data['assigned_at']) if data.get('assigned_at') else None
        request.completed_at = datetime.fromisoformat(data['completed_at']) if data.get('completed_at') else None
        request.agent_id = data.get('agent_id')
        request.agent_name = data.get('agent_name')
        request.client_name = data.get('client_name')
        request.context_summary = data.get('context_summary', '')
        request.conversation_history = data.get('conversation_history', [])
        request.notes = data.get('notes', '')
        request.metadata = data.get('metadata', {})
        return request

class HandoffService:
    """Serviço de transferência para atendente humano"""
    
    def __init__(self, redis_client: Redis = None):
        self.redis = redis_client
        self.ttl = 86400 * 30  # 30 dias para histórico
        
        # Frases que indicam necessidade de transferência
        self.transfer_triggers = [
            "quero falar com um humano",
            "preciso falar com alguém",
            "não estou sendo atendido",
            "quero falar com atendente",
            "vocês têm telefone",
            "posso ligar",
            "não entendo",
            "está confuso",
            "não está funcionando",
            "tenho uma reclamação",
            "preciso negociar",
            "quero fazer pedido",
            "urgente",
            "problema grave"
        ]
        
        # Padrões de complexidade que requerem humano
        self.complexity_patterns = [
            "contrato",
            "jurídico",
            "pagamento",
            "faturamento",
            "nota fiscal",
            "boleto",
            "cobrança",
            "cancelamento",
            "reembolso",
            "garantia",
            "problema técnico",
            "não funciona",
            "defeito"
        ]
    
    def get_queue_key(self, priority: HandoffPriority) -> str:
        """Gera chave da fila de transferências por prioridade"""
        return f"handoff_queue:{priority.name.lower()}"
    
    def get_request_key(self, request_id: str) -> str:
        """Gera chave da solicitação individual"""
        return f"handoff_request:{request_id}"
    
    def get_active_key(self, telefone: str) -> str:
        """Gera chave para transferência ativa"""
        return f"handoff_active:{telefone}"
    
    def should_transfer(self, message: str, context: Dict[str, Any] = None) -> Tuple[bool, HandoffReason, HandoffPriority]:
        """Analisa se mensagem indica necessidade de transferência"""
        message_lower = message.lower()
        
        # Verificar triggers diretos
        for trigger in self.transfer_triggers:
            if trigger in message_lower:
                if "urgente" in message_lower or "problema grave" in message_lower:
                    return True, HandoffReason.CLIENT_REQUEST, HandoffPriority.URGENT
                return True, HandoffReason.CLIENT_REQUEST, HandoffPriority.HIGH
        
        # Verificar padrões de complexidade
        for pattern in self.complexity_patterns:
            if pattern in message_lower:
                return True, HandoffReason.COMPLEX_INQUIRY, HandoffPriority.MEDIUM
        
        # Verificar contexto se fornecido
        if context:
            interaction_count = context.get('interaction_count', 0)
            if interaction_count > 10 and not context.get('progress_made', False):
                return True, HandoffReason.BOT_LIMITATION, HandoffPriority.MEDIUM
        
        return False, HandoffReason.CLIENT_REQUEST, HandoffPriority.LOW
    
    def create_handoff_request(
        self,
        telefone: str,
        reason: HandoffReason = HandoffReason.CLIENT_REQUEST,
        priority: HandoffPriority = HandoffPriority.MEDIUM,
        lead_id: Optional[int] = None,
        context_summary: str = "",
        conversation_history: List[Dict] = None,
        client_name: str = ""
    ) -> HandoffRequest:
        """Cria nova solicitação de transferência"""
        
        request = HandoffRequest(telefone, lead_id)
        request.reason = reason
        request.priority = priority
        request.context_summary = context_summary
        request.conversation_history = conversation_history or []
        request.client_name = client_name
        
        if not self.redis:
            logger.warning("Redis não configurado - handoff request criado mas não salvo")
            return request
        
        try:
            # Salvar solicitação
            request_key = self.get_request_key(request.id)
            self.redis.setex(request_key, self.ttl, json.dumps(request.to_dict()))
            
            # Adicionar à fila por prioridade
            queue_key = self.get_queue_key(priority)
            self.redis.lpush(queue_key, request.id)
            
            # Marcar como transferência ativa
            active_key = self.get_active_key(telefone)
            self.redis.setex(active_key, 3600, request.id)  # 1 hora
            
            logger.info(f"Solicitação de handoff criada: {request.id} para {telefone}")
            return request
            
        except Exception as e:
            logger.error(f"Erro ao criar solicitação de handoff: {e}")
            return request
    
    def assign_to_agent(self, request_id: str, agent_id: str, agent_name: str) -> bool:
        """Atribui solicitação a um agente"""
        
        if not self.redis:
            return False
        
        try:
            request_key = self.get_request_key(request_id)
            data = self.redis.get(request_key)
            
            if not data:
                logger.error(f"Solicitação não encontrada: {request_id}")
                return False
            
            request = HandoffRequest.from_dict(json.loads(data))
            
            if request.status != HandoffStatus.PENDING:
                logger.warning(f"Solicitação {request_id} não está pendente")
                return False
            
            # Atualizar status
            request.status = HandoffStatus.ASSIGNED
            request.agent_id = agent_id
            request.agent_name = agent_name
            request.assigned_at = datetime.utcnow()
            
            # Salvar atualização
            self.redis.setex(request_key, self.ttl, json.dumps(request.to_dict()))
            
            # Remover da fila
            queue_key = self.get_queue_key(request.priority)
            self.redis.lrem(queue_key, 1, request_id)
            
            logger.info(f"Handoff {request_id} atribuído ao agente {agent_name}")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao atribuir handoff: {e}")
            return False
    
    def start_human_conversation(self, request_id: str) -> bool:
        """Inicia conversa com humano"""
        
        if not self.redis:
            return False
        
        try:
            request_key = self.get_request_key(request_id)
            data = self.redis.get(request_key)
            
            if not data:
                return False
            
            request = HandoffRequest.from_dict(json.loads(data))
            request.status = HandoffStatus.ACTIVE
            
            self.redis.setex(request_key, self.ttl, json.dumps(request.to_dict()))
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao iniciar conversa humana: {e}")
            return False
    
    def complete_handoff(self, request_id: str, notes: str = "") -> bool:
        """Completa a transferência"""
        
        if not self.redis:
            return False
        
        try:
            request_key = self.get_request_key(request_id)
            data = self.redis.get(request_key)
            
            if not data:
                return False
            
            request = HandoffRequest.from_dict(json.loads(data))
            request.status = HandoffStatus.COMPLETED
            request.completed_at = datetime.utcnow()
            request.notes = notes
            
            self.redis.setex(request_key, self.ttl, json.dumps(request.to_dict()))
            
            # Remover da lista ativa
            active_key = self.get_active_key(request.telefone)
            self.redis.delete(active_key)
            
            logger.info(f"Handoff {request_id} completado")
            return True
            
        except Exception as e:
            logger.error(f"Erro ao completar handoff: {e}")
            return False
    
    def get_pending_requests(self, priority: HandoffPriority = None) -> List[HandoffRequest]:
        """Retorna solicitações pendentes"""
        
        if not self.redis:
            return []
        
        try:
            requests = []
            
            if priority:
                priorities = [priority]
            else:
                priorities = [HandoffPriority.URGENT, HandoffPriority.HIGH, HandoffPriority.MEDIUM, HandoffPriority.LOW]
            
            for p in priorities:
                queue_key = self.get_queue_key(p)
                request_ids = self.redis.lrange(queue_key, 0, -1)
                
                for request_id in request_ids:
                    request_key = self.get_request_key(request_id.decode())
                    data = self.redis.get(request_key)
                    
                    if data:
                        requests.append(HandoffRequest.from_dict(json.loads(data)))
            
            return requests
            
        except Exception as e:
            logger.error(f"Erro ao buscar solicitações pendentes: {e}")
            return []
    
    def is_active_handoff(self, telefone: str) -> Optional[str]:
        """Verifica se existe transferência ativa para o telefone"""
        
        if not self.redis:
            return None
        
        try:
            active_key = self.get_active_key(telefone)
            request_id = self.redis.get(active_key)
            
            return request_id.decode() if request_id else None
            
        except Exception as e:
            logger.error(f"Erro ao verificar handoff ativo: {e}")
            return None
    
    def get_handoff_request(self, request_id: str) -> Optional[HandoffRequest]:
        """Retorna solicitação específica"""
        
        if not self.redis:
            return None
        
        try:
            request_key = self.get_request_key(request_id)
            data = self.redis.get(request_key)
            
            if data:
                return HandoffRequest.from_dict(json.loads(data))
            
            return None
            
        except Exception as e:
            logger.error(f"Erro ao buscar solicitação: {e}")
            return None
    
    def cancel_handoff(self, request_id: str) -> bool:
        """Cancela solicitação de transferência"""
        
        if not self.redis:
            return False
        
        try:
            request_key = self.get_request_key(request_id)
            data = self.redis.get(request_key)
            
            if not data:
                return False
            
            request = HandoffRequest.from_dict(json.loads(data))
            request.status = HandoffStatus.CANCELLED
            
            self.redis.setex(request_key, self.ttl, json.dumps(request.to_dict()))
            
            # Remover da fila e lista ativa
            queue_key = self.get_queue_key(request.priority)
            self.redis.lrem(queue_key, 1, request_id)
            
            active_key = self.get_active_key(request.telefone)
            self.redis.delete(active_key)
            
            return True
            
        except Exception as e:
            logger.error(f"Erro ao cancelar handoff: {e}")
            return False
    
    def generate_handoff_message(self, client_name: str = "", wait_time_minutes: int = 5) -> str:
        """Gera mensagem de transferência personalizada"""
        
        messages = [
            f"Perfeito, {client_name}! Vou te conectar com um dos nossos especialistas em piscicultura.",
            f"Opa {client_name}, já entendi que você precisa de um atendimento mais detalhado!",
            f"Certo, {client_name}! Vou chamar alguém da nossa equipe que vai poder te ajudar melhor.",
            f"Tranquilo, {client_name}! Nossa equipe especializada vai cuidar de você agora.",
        ]
        
        import random
        base_message = random.choice(messages)
        
        additional_info = [
            f"Em poucos minutinhos alguém vai entrar em contato contigo pelo WhatsApp.",
            f"Aguarda só uns {wait_time_minutes} minutinhos que já tem gente da nossa equipe vindo falar contigo.",
            f"Fica tranquilo que em breve você vai ser atendido por um especialista em alevinos.",
            f"Nossa equipe já foi avisada e vai entrar em contato em instantes!",
        ]
        
        closing = [
            "Muito obrigado pela paciência! 🙏",
            "Valeu pela confiança! 😊",
            "Obrigado por escolher a gente! 🐟",
            "Agradeço a preferência! 👍",
        ]
        
        full_message = f"{base_message} {random.choice(additional_info)} {random.choice(closing)}"
        
        return full_message
    
    def get_handoff_statistics(self) -> Dict[str, Any]:
        """Retorna estatísticas de transferências"""
        
        if not self.redis:
            return {}
        
        try:
            stats = {
                'pending_count': 0,
                'assigned_count': 0,
                'active_count': 0,
                'completed_today': 0,
                'by_priority': {p.name: 0 for p in HandoffPriority},
                'by_reason': {r.name: 0 for r in HandoffReason},
                'average_wait_time': 0,
                'active_agents': []
            }
            
            # Buscar todas as solicitações
            pattern = "handoff_request:*"
            keys = self.redis.keys(pattern)
            
            total_wait_time = 0
            wait_count = 0
            today = datetime.utcnow().date()
            
            for key in keys:
                try:
                    data = self.redis.get(key)
                    if data:
                        request = HandoffRequest.from_dict(json.loads(data))
                        
                        # Contar por status
                        if request.status == HandoffStatus.PENDING:
                            stats['pending_count'] += 1
                        elif request.status == HandoffStatus.ASSIGNED:
                            stats['assigned_count'] += 1
                        elif request.status == HandoffStatus.ACTIVE:
                            stats['active_count'] += 1
                            if request.agent_name and request.agent_name not in stats['active_agents']:
                                stats['active_agents'].append(request.agent_name)
                        elif request.status == HandoffStatus.COMPLETED and request.completed_at and request.completed_at.date() == today:
                            stats['completed_today'] += 1
                        
                        # Contar por prioridade
                        stats['by_priority'][request.priority.name] += 1
                        
                        # Contar por motivo
                        stats['by_reason'][request.reason.name] += 1
                        
                        # Calcular tempo de espera
                        if request.assigned_at:
                            wait_time = (request.assigned_at - request.created_at).total_seconds() / 60
                            total_wait_time += wait_time
                            wait_count += 1
                            
                except Exception as e:
                    logger.error(f"Erro ao processar estatística de {key}: {e}")
            
            if wait_count > 0:
                stats['average_wait_time'] = round(total_wait_time / wait_count, 2)
            
            return stats
            
        except Exception as e:
            logger.error(f"Erro ao gerar estatísticas de handoff: {e}")
            return {}
    
    def cleanup_expired_requests(self, days: int = 30):
        """Remove solicitações expiradas"""
        
        if not self.redis:
            return
        
        try:
            pattern = "handoff_request:*"
            keys = self.redis.keys(pattern)
            
            expired_count = 0
            cutoff_date = datetime.utcnow() - timedelta(days=days)
            
            for key in keys:
                try:
                    data = self.redis.get(key)
                    if data:
                        request_data = json.loads(data)
                        created_at = datetime.fromisoformat(request_data['created_at'])
                        
                        if created_at < cutoff_date:
                            self.redis.delete(key)
                            expired_count += 1
                            
                except Exception as e:
                    logger.error(f"Erro ao processar chave {key}: {e}")
            
            if expired_count > 0:
                logger.info(f"Removidas {expired_count} solicitações de handoff expiradas")
                
        except Exception as e:
            logger.error(f"Erro na limpeza de handoffs expirados: {e}")