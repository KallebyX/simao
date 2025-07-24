"""
Google Gemini AI Service - Simão IA Rural
Substituição completa do OpenAI com 95% de economia de custos
Especializado em piscicultura e português rural brasileiro
"""

import os
import json
import logging
import base64
import asyncio
from typing import List, Dict, Any, Optional, Union
from datetime import datetime
import google.generativeai as genai
from google.generativeai.types import HarmCategory, HarmBlockThreshold
import requests
from io import BytesIO

# Configurar logging
logger = logging.getLogger(__name__)

class GeminiService:
    """
    Serviço Google Gemini para IA conversacional
    95% mais barato que OpenAI para mesma qualidade
    """
    
    def __init__(self):
        # Configurar API key
        self.api_key = os.getenv('GOOGLE_GEMINI_API_KEY')
        if not self.api_key:
            logger.error("GOOGLE_GEMINI_API_KEY não configurada")
            raise ValueError("API key do Gemini não encontrada")
        
        # Configurar cliente Gemini
        genai.configure(api_key=self.api_key)
        
        # Modelos disponíveis
        self.chat_model = "gemini-1.5-pro-latest"
        self.audio_model = "gemini-1.5-flash"  # Mais barato para áudio
        
        # Configurações de segurança (menos restritivas para português rural)
        self.safety_settings = {
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_ONLY_HIGH,
        }
        
        # Configuração de geração
        self.generation_config = {
            "temperature": 0.8,  # Mais criativo para conversas naturais
            "top_p": 0.95,
            "top_k": 40,
            "max_output_tokens": 1000,
            "response_mime_type": "text/plain",
        }
        
        # System prompt especializado em piscicultura
        self.system_prompt = """Você é o Simão, um assistente especialista em piscicultura e vendas de alevinos para o mercado brasileiro rural. 

PERSONALIDADE:
- Caipira, caloroso e acolhedor
- Fala de forma natural como um brasileiro do interior
- Usa expressões rurais autênticas (mas compreensíveis)
- Sempre respeitoso, usando "Seu/Dona" + primeiro nome
- Paciente e didático com iniciantes
- Entusiasmado com piscicultura

CONHECIMENTO TÉCNICO:
- Especialista em todas as espécies de peixes brasileiras (tilápia, tambaqui, pirarucu, pacu, pintado)
- Conhece sistemas: tanques escavados, tanques-rede, raceways, intensivo, extensivo
- Domina qualidade da água: pH, oxigênio, amônia, nitrito, temperatura
- Entende sobre alimentação, reprodução, manejo, sanidade
- Conhece mercado, preços, custos de produção
- Sabe sobre licenciamento ambiental, regularização

COMUNICAÇÃO:
- Entende português rural com erros de digitação e áudio mal transcrito
- Corrige gentilmente sem constrangimento
- Adapta linguagem ao nível do cliente
- Faz perguntas para qualificar necessidades
- Oferece soluções práticas e viáveis
- Sempre positivo e encorajador

VENDAS:
- Foca na necessidade real do cliente
- Educa antes de vender
- Constrói relacionamento de confiança
- Oferece suporte pós-venda
- Tem senso de urgência mas sem pressão

Sempre responda de forma natural, calorosa e útil, como se fosse um amigo experiente do interior que quer ajudar."""

    def _get_model(self, model_name: str = None):
        """Retorna modelo configurado"""
        model_name = model_name or self.chat_model
        
        return genai.GenerativeModel(
            model_name=model_name,
            generation_config=self.generation_config,
            safety_settings=self.safety_settings,
            system_instruction=self.system_prompt
        )

    def generate_response(
        self, 
        message: str, 
        conversation_history: List[Dict] = None,
        context: Dict[str, Any] = None,
        cliente_info: Dict[str, Any] = None
    ) -> str:
        """
        Gera resposta usando Gemini Pro
        
        Args:
            message: Mensagem do usuário
            conversation_history: Histórico da conversa
            context: Contexto adicional (lead info, etc.)
            cliente_info: Informações do cliente para personalização
        
        Returns:
            Resposta personalizada do Simão
        """
        try:
            model = self._get_model()
            
            # Construir contexto completo
            full_prompt = self._build_context_prompt(message, conversation_history, context, cliente_info)
            
            logger.info(f"Gerando resposta Gemini para mensagem: {message[:100]}...")
            
            # Gerar resposta
            response = model.generate_content(full_prompt)
            
            if response.text:
                logger.info(f"Resposta Gemini gerada: {len(response.text)} caracteres")
                return response.text.strip()
            else:
                logger.warning("Resposta Gemini vazia")
                return self._get_fallback_response()
            
        except Exception as e:
            logger.error(f"Erro ao gerar resposta Gemini: {e}")
            return self._get_fallback_response()

    def _build_context_prompt(
        self, 
        message: str, 
        conversation_history: List[Dict] = None,
        context: Dict[str, Any] = None,
        cliente_info: Dict[str, Any] = None
    ) -> str:
        """Constrói prompt completo com contexto"""
        
        prompt_parts = []
        
        # Informações do cliente para personalização
        if cliente_info:
            cliente_context = []
            if cliente_info.get('nome'):
                cliente_context.append(f"Nome: {cliente_info['nome']}")
            if cliente_info.get('genero_detectado'):
                if cliente_info['genero_detectado'] == 'masculino':
                    cliente_context.append(f"Tratar como: Seu {cliente_info['nome'].split()[0] if cliente_info.get('nome') else 'amigo'}")
                elif cliente_info['genero_detectado'] == 'feminino':
                    cliente_context.append(f"Tratar como: Dona {cliente_info['nome'].split()[0] if cliente_info.get('nome') else 'amiga'}")
            
            if cliente_info.get('experiencia_piscicultura'):
                cliente_context.append(f"Experiência: {cliente_info['experiencia_piscicultura']}")
            if cliente_info.get('tipo_propriedade'):
                cliente_context.append(f"Propriedade: {cliente_info['tipo_propriedade']}")
            if cliente_info.get('especies_interesse'):
                cliente_context.append(f"Interesse: {cliente_info['especies_interesse']}")
            
            if cliente_context:
                prompt_parts.append(f"INFORMAÇÕES DO CLIENTE:\n{chr(10).join(cliente_context)}\n")
        
        # Contexto da conversa
        if context:
            context_info = []
            if context.get('state'):
                context_info.append(f"Estado da conversa: {context['state']}")
            if context.get('awaiting_info'):
                context_info.append(f"Aguardando: {context['awaiting_info']}")
            if context.get('interaction_count'):
                context_info.append(f"Interações: {context['interaction_count']}")
            
            if context_info:
                prompt_parts.append(f"CONTEXTO DA CONVERSA:\n{chr(10).join(context_info)}\n")
        
        # Histórico recente da conversa (últimas 10 mensagens)
        if conversation_history:
            history_text = []
            recent_history = conversation_history[-10:] if len(conversation_history) > 10 else conversation_history
            
            for entry in recent_history:
                if entry.get('role') == 'user':
                    history_text.append(f"Cliente: {entry.get('content', '')}")
                elif entry.get('role') == 'assistant':
                    history_text.append(f"Simão: {entry.get('content', '')}")
            
            if history_text:
                prompt_parts.append(f"CONVERSA RECENTE:\n{chr(10).join(history_text)}\n")
        
        # Mensagem atual
        prompt_parts.append(f"NOVA MENSAGEM DO CLIENTE:\n{message}\n")
        
        # Instruções finais
        prompt_parts.append("""
INSTRUÇÕES PARA RESPOSTA:
1. Responda como Simão, usando o tratamento adequado (Seu/Dona + nome)
2. Seja caloroso, natural e didático
3. Se não entender algo, peça esclarecimento gentilmente
4. Foque em ajudar com piscicultura e alevinos
5. Mantenha o tom conversacional do interior brasileiro
6. Seja conciso mas completo (máximo 200 palavras)
""")
        
        return "\n".join(prompt_parts)

    def transcribe_audio(self, audio_data: bytes, format: str = "ogg") -> str:
        """
        Transcreve áudio usando Gemini (muito mais barato que Whisper)
        
        Args:
            audio_data: Dados do áudio em bytes
            format: Formato do áudio (ogg, mp3, wav, m4a)
        
        Returns:
            Texto transcrito
        """
        try:
            model = self._get_model(self.audio_model)  # Modelo mais barato para áudio
            
            logger.info(f"Transcrevendo áudio Gemini: {len(audio_data)} bytes, formato: {format}")
            
            # Preparar áudio para Gemini
            audio_part = {
                "mime_type": f"audio/{format}",
                "data": audio_data
            }
            
            # Prompt específico para transcrição em português rural
            transcription_prompt = """
Transcreva este áudio em português brasileiro. 
IMPORTANTE:
- Inclua todas as palavras faladas, mesmo com sotaque rural
- Mantenha expressões regionais e gírias
- Se não conseguir entender alguma palavra, use [inaudível]
- Não corrija erros de português - transcreva exatamente como falado
- Seja fiel ao que foi dito, incluindo repetições e hesitações naturais
"""
            
            # Gerar transcrição
            response = model.generate_content([transcription_prompt, audio_part])
            
            if response.text:
                transcribed_text = response.text.strip()
                logger.info(f"Áudio transcrito com sucesso: {transcribed_text[:100]}...")
                return transcribed_text
            else:
                logger.warning("Transcrição Gemini retornou vazia")
                return ""
                
        except Exception as e:
            logger.error(f"Erro na transcrição Gemini: {e}")
            return ""

    def analyze_sentiment(self, message: str) -> Dict[str, Any]:
        """Analisa sentimento e intenção da mensagem"""
        try:
            model = self._get_model(self.audio_model)  # Modelo mais barato para análise
            
            analysis_prompt = f"""
Analise esta mensagem de um cliente de piscicultura:
"{message}"

Responda APENAS em formato JSON com estas informações:
{{
    "sentimento": "positivo|neutro|negativo",
    "intencao": "pergunta|interesse|reclamacao|pedido|saudacao|despedida|outro",
    "urgencia": "baixa|media|alta",
    "topico_principal": "string com o tópico principal",
    "requer_humano": true|false,
    "confianca": 0.0-1.0
}}
"""
            
            response = model.generate_content(analysis_prompt)
            
            if response.text:
                try:
                    # Extrair JSON da resposta
                    json_text = response.text.strip()
                    if json_text.startswith('```json'):
                        json_text = json_text[7:-3]
                    elif json_text.startswith('```'):
                        json_text = json_text[3:-3]
                    
                    analysis = json.loads(json_text)
                    return analysis
                except json.JSONDecodeError:
                    logger.warning("Erro ao parsear análise JSON do Gemini")
                    return self._get_default_sentiment()
            else:
                return self._get_default_sentiment()
                
        except Exception as e:
            logger.error(f"Erro na análise de sentimento: {e}")
            return self._get_default_sentiment()

    def generate_summary(self, conversation_history: List[Dict]) -> str:
        """Gera resumo da conversa para contexto"""
        try:
            model = self._get_model(self.audio_model)
            
            # Construir histórico como texto
            history_text = []
            for entry in conversation_history[-20:]:  # Últimas 20 mensagens
                role = "Cliente" if entry.get('role') == 'user' else "Simão"
                content = entry.get('content', '')
                history_text.append(f"{role}: {content}")
            
            summary_prompt = f"""
Crie um resumo conciso desta conversa sobre piscicultura:

{chr(10).join(history_text)}

Inclua:
- Principais pontos discutidos
- Necessidades identificadas do cliente
- Status atual da negociação
- Próximos passos sugeridos

Máximo 150 palavras, formato de bullet points.
"""
            
            response = model.generate_content(summary_prompt)
            
            if response.text:
                return response.text.strip()
            else:
                return "Resumo não disponível"
                
        except Exception as e:
            logger.error(f"Erro ao gerar resumo: {e}")
            return "Erro ao gerar resumo da conversa"

    def extract_lead_info(self, message: str) -> Dict[str, Any]:
        """Extrai informações de lead da mensagem"""
        try:
            model = self._get_model(self.audio_model)
            
            extraction_prompt = f"""
Extraia informações estruturadas desta mensagem de cliente:
"{message}"

Responda APENAS em formato JSON:
{{
    "nome": "nome completo se mencionado ou null",
    "telefone": "telefone se mencionado ou null", 
    "cidade": "cidade se mencionada ou null",
    "estado": "estado se mencionado ou null",
    "experiencia_piscicultura": "iniciante|intermediário|avançado ou null",
    "tipo_propriedade": "viveiros|tanques|açude|represa|outro ou null",
    "especies_interesse": "espécies mencionadas ou null",
    "area_lamina_agua": "área mencionada ou null",
    "qtd_viveiros": "quantidade ou null",
    "objetivo": "engorda|reprodução|iniciante|outro ou null"
}}

Se não conseguir identificar uma informação, use null.
"""
            
            response = model.generate_content(extraction_prompt)
            
            if response.text:
                try:
                    json_text = response.text.strip()
                    if json_text.startswith('```json'):
                        json_text = json_text[7:-3]
                    elif json_text.startswith('```'):
                        json_text = json_text[3:-3]
                    
                    extracted_info = json.loads(json_text)
                    return extracted_info
                except json.JSONDecodeError:
                    logger.warning("Erro ao parsear extração JSON")
                    return {}
            else:
                return {}
                
        except Exception as e:
            logger.error(f"Erro na extração de informações: {e}")
            return {}

    def _get_fallback_response(self) -> str:
        """Resposta de fallback quando Gemini falha"""
        fallbacks = [
            "Opa, me perdoa aí! Parece que deu uma travadinha aqui. Pode repetir sua pergunta?",
            "Eita, teve um probleminha técnico aqui. Mas pode falar de novo que te ajudo!",
            "Nossa, deu uma falha técnica aqui. Mas não se preocupa, me conta de novo o que precisa!",
            "Desculpa aí, amigo! Teve um problema na linha. Pode repetir sua pergunta?",
        ]
        
        import random
        return random.choice(fallbacks)

    def _get_default_sentiment(self) -> Dict[str, Any]:
        """Sentimento padrão quando análise falha"""
        return {
            "sentimento": "neutro",
            "intencao": "outro",
            "urgencia": "media",
            "topico_principal": "piscicultura",
            "requer_humano": False,
            "confianca": 0.5
        }

    def get_cost_estimate(self, input_chars: int, output_chars: int) -> Dict[str, float]:
        """
        Estima custo da operação Gemini
        Preços aproximados: $0.00125/1K characters input, $0.00375/1K characters output
        """
        input_cost = (input_chars / 1000) * 0.00125
        output_cost = (output_chars / 1000) * 0.00375
        total_cost = input_cost + output_cost
        
        return {
            "input_cost": input_cost,
            "output_cost": output_cost,
            "total_cost": total_cost,
            "currency": "USD"
        }

    def health_check(self) -> Dict[str, Any]:
        """Verifica saúde do serviço Gemini"""
        try:
            model = self._get_model(self.audio_model)
            test_response = model.generate_content("Responda apenas 'OK' para teste de conectividade.")
            
            if test_response.text and "OK" in test_response.text:
                return {
                    "status": "healthy",
                    "model": self.chat_model,
                    "timestamp": datetime.utcnow().isoformat(),
                    "response_time_ms": 0  # TODO: implementar timing
                }
            else:
                return {
                    "status": "degraded",
                    "error": "Resposta inesperada do modelo",
                    "timestamp": datetime.utcnow().isoformat()
                }
                
        except Exception as e:
            return {
                "status": "unhealthy", 
                "error": str(e),
                "timestamp": datetime.utcnow().isoformat()
            }