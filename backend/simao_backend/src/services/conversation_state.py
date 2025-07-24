"""
Sistema de Estados de Conversa para Simão IA Rural
Gerencia o fluxo de conversas e estados dos leads na piscicultura
"""

import json
import logging
from datetime import datetime, timedelta
from enum import Enum
from typing import Optional, Dict, Any, List
from redis import Redis
from ..models.lead import Lead, StatusLeadEnum

# Configurar logging
logger = logging.getLogger(__name__)

class ConversationState(Enum):
    """Estados possíveis da conversa"""
    INICIAL = "inicial"
    SAUDACAO = "saudacao"
    QUALIFICACAO_BASICA = "qualificacao_basica"
    DETALHES_PISCICULTURA = "detalhes_piscicultura"
    ESPECIES_INTERESSE = "especies_interesse"
    ORCAMENTO = "orcamento"
    NEGOCIACAO = "negociacao"
    FECHAMENTO = "fechamento"
    POS_VENDA = "pos_venda"
    AGUARDANDO_RESPOSTA = "aguardando_resposta"
    TRANSFER_HUMANO = "transfer_humano"
    INATIVO = "inativo"
    FINALIZADO = "finalizado"

class ConversationContext:
    """Contexto da conversa com informações coletadas"""
    
    def __init__(self, telefone: str, lead_id: Optional[int] = None):
        self.telefone = telefone
        self.lead_id = lead_id
        self.state = ConversationState.INICIAL
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()
        self.data = {}
        self.interaction_count = 0
        self.last_message_time = datetime.utcnow()
        self.awaiting_info = None
        self.transfer_requested = False
        self.is_human_agent = False
    
    def to_dict(self) -> Dict[str, Any]:
        return {
            'telefone': self.telefone,
            'lead_id': self.lead_id,
            'state': self.state.value,
            'created_at': self.created_at.isoformat(),
            'updated_at': self.updated_at.isoformat(),
            'data': self.data,
            'interaction_count': self.interaction_count,
            'last_message_time': self.last_message_time.isoformat(),
            'awaiting_info': self.awaiting_info,
            'transfer_requested': self.transfer_requested,
            'is_human_agent': self.is_human_agent
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'ConversationContext':
        context = cls(data['telefone'], data.get('lead_id'))
        context.state = ConversationState(data['state'])
        context.created_at = datetime.fromisoformat(data['created_at'])
        context.updated_at = datetime.fromisoformat(data['updated_at'])
        context.data = data.get('data', {})
        context.interaction_count = data.get('interaction_count', 0)
        context.last_message_time = datetime.fromisoformat(data['last_message_time'])
        context.awaiting_info = data.get('awaiting_info')
        context.transfer_requested = data.get('transfer_requested', False)
        context.is_human_agent = data.get('is_human_agent', False)
        return context

class ConversationStateManager:
    """Gerenciador de estados de conversa"""
    
    def __init__(self, redis_client: Redis = None):
        self.redis = redis_client
        self.ttl = 86400 * 7  # 7 dias em segundos
        
        # Fluxo de estados para qualificação de leads
        self.state_flow = {
            ConversationState.INICIAL: [ConversationState.SAUDACAO],
            ConversationState.SAUDACAO: [ConversationState.QUALIFICACAO_BASICA],
            ConversationState.QUALIFICACAO_BASICA: [
                ConversationState.DETALHES_PISCICULTURA,
                ConversationState.TRANSFER_HUMANO
            ],
            ConversationState.DETALHES_PISCICULTURA: [
                ConversationState.ESPECIES_INTERESSE,
                ConversationState.ORCAMENTO
            ],
            ConversationState.ESPECIES_INTERESSE: [ConversationState.ORCAMENTO],
            ConversationState.ORCAMENTO: [
                ConversationState.NEGOCIACAO,
                ConversationState.FECHAMENTO
            ],
            ConversationState.NEGOCIACAO: [
                ConversationState.FECHAMENTO,
                ConversationState.TRANSFER_HUMANO
            ],
            ConversationState.FECHAMENTO: [ConversationState.POS_VENDA],
            ConversationState.POS_VENDA: [ConversationState.FINALIZADO],
            ConversationState.TRANSFER_HUMANO: [ConversationState.FINALIZADO],
            ConversationState.AGUARDANDO_RESPOSTA: [],  # Pode voltar a qualquer estado
            ConversationState.INATIVO: [ConversationState.SAUDACAO],
            ConversationState.FINALIZADO: []
        }
        
        # Perguntas por estado
        self.state_questions = {
            ConversationState.QUALIFICACAO_BASICA: [
                "Qual seu nome completo?",
                "Qual sua cidade e estado?",
                "Já trabalha com piscicultura ou está começando?"
            ],
            ConversationState.DETALHES_PISCICULTURA: [
                "Que tipo de propriedade você tem? (viveiros, tanques, açude, etc.)",
                "Qual a área total de lâmina d'água em metros quadrados?",
                "Quantos viveiros ou tanques você tem?"
            ],
            ConversationState.ESPECIES_INTERESSE: [
                "Que espécies de peixe te interessam? (tilápia, tambaqui, pirarucu, etc.)",
                "Qual o objetivo principal: engorda, reprodução ou criação?"
            ]
        }
    
    def get_key(self, telefone: str) -> str:
        """Gera chave Redis para o contexto da conversa"""
        return f"conversation:{telefone}"
    
    def get_context(self, telefone: str) -> Optional[ConversationContext]:
        """Recupera contexto da conversa"""
        if not self.redis:
            return None
        
        try:
            key = self.get_key(telefone)
            data = self.redis.get(key)
            
            if data:
                return ConversationContext.from_dict(json.loads(data))
            
            return None
            
        except Exception as e:
            logger.error(f"Erro ao recuperar contexto da conversa: {e}")
            return None
    
    def save_context(self, context: ConversationContext) -> bool:
        """Salva contexto da conversa"""
        if not self.redis:
            return False
        
        try:
            context.updated_at = datetime.utcnow()
            key = self.get_key(context.telefone)
            data = json.dumps(context.to_dict())
            
            self.redis.setex(key, self.ttl, data)
            return True
            
        except Exception as e:
            logger.error(f"Erro ao salvar contexto da conversa: {e}")
            return False
    
    def create_context(self, telefone: str, lead_id: Optional[int] = None) -> ConversationContext:
        """Cria novo contexto de conversa"""
        context = ConversationContext(telefone, lead_id)
        self.save_context(context)
        return context
    
    def transition_state(self, context: ConversationContext, new_state: ConversationState) -> bool:
        """Transiciona para novo estado se válido"""
        current_state = context.state
        
        # Verificar se transição é válida
        if new_state in self.state_flow.get(current_state, []):
            context.state = new_state
            context.updated_at = datetime.utcnow()
            self.save_context(context)
            
            logger.info(f"Transição de estado: {current_state.value} -> {new_state.value} para {context.telefone}")
            return True
        
        logger.warning(f"Transição inválida: {current_state.value} -> {new_state.value} para {context.telefone}")
        return False
    
    def update_interaction(self, context: ConversationContext):
        """Atualiza contadores de interação"""
        context.interaction_count += 1
        context.last_message_time = datetime.utcnow()
        self.save_context(context)
    
    def set_awaiting_info(self, context: ConversationContext, info_type: str):
        """Define que está aguardando informação específica"""
        context.awaiting_info = info_type
        context.state = ConversationState.AGUARDANDO_RESPOSTA
        self.save_context(context)
    
    def clear_awaiting_info(self, context: ConversationContext):
        """Limpa estado de aguardando informação"""
        context.awaiting_info = None
        self.save_context(context)
    
    def request_human_transfer(self, context: ConversationContext):
        """Solicita transferência para atendente humano"""
        context.transfer_requested = True
        context.state = ConversationState.TRANSFER_HUMANO
        self.save_context(context)
    
    def set_human_agent(self, context: ConversationContext, is_human: bool):
        """Define se está sendo atendido por humano"""
        context.is_human_agent = is_human
        self.save_context(context)
    
    def is_conversation_expired(self, context: ConversationContext, hours: int = 24) -> bool:
        """Verifica se conversa está expirada"""
        expiry_time = datetime.utcnow() - timedelta(hours=hours)
        return context.last_message_time < expiry_time
    
    def get_next_questions(self, context: ConversationContext) -> List[str]:
        """Retorna próximas perguntas baseadas no estado"""
        return self.state_questions.get(context.state, [])
    
    def should_qualify_lead(self, context: ConversationContext) -> bool:
        """Verifica se deve qualificar o lead baseado na conversa"""
        return (
            context.state in [
                ConversationState.DETALHES_PISCICULTURA,
                ConversationState.ESPECIES_INTERESSE,
                ConversationState.ORCAMENTO
            ] and 
            context.interaction_count >= 3
        )
    
    def get_conversation_summary(self, context: ConversationContext) -> str:
        """Gera resumo da conversa para contexto"""
        summary_parts = []
        
        summary_parts.append(f"Estado atual: {context.state.value}")
        summary_parts.append(f"Interações: {context.interaction_count}")
        
        if context.data:
            if 'nome' in context.data:
                summary_parts.append(f"Nome: {context.data['nome']}")
            if 'experiencia' in context.data:
                summary_parts.append(f"Experiência: {context.data['experiencia']}")
            if 'interesse' in context.data:
                summary_parts.append(f"Interesse: {context.data['interesse']}")
        
        if context.awaiting_info:
            summary_parts.append(f"Aguardando: {context.awaiting_info}")
        
        return " | ".join(summary_parts)
    
    def cleanup_expired_conversations(self, hours: int = 48):
        """Remove conversas expiradas"""
        if not self.redis:
            return
        
        try:
            # Buscar todas as chaves de conversação
            pattern = "conversation:*"
            keys = self.redis.keys(pattern)
            
            expired_count = 0
            for key in keys:
                try:
                    data = self.redis.get(key)
                    if data:
                        context_data = json.loads(data)
                        last_message = datetime.fromisoformat(context_data['last_message_time'])
                        
                        if datetime.utcnow() - last_message > timedelta(hours=hours):
                            self.redis.delete(key)
                            expired_count += 1
                            
                except Exception as e:
                    logger.error(f"Erro ao processar chave {key}: {e}")
            
            if expired_count > 0:
                logger.info(f"Removidas {expired_count} conversas expiradas")
                
        except Exception as e:
            logger.error(f"Erro na limpeza de conversas expiradas: {e}")