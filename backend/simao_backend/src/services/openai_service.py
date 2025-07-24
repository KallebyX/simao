import os
import time
import logging
from typing import List, Dict, Optional, Tuple
import openai
from openai import OpenAI
import redis
import json

logger = logging.getLogger(__name__)

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=os.getenv('OPENAI_API_KEY'))
        self.redis_client = None
        
        # Tentar conectar ao Redis se disponível
        try:
            redis_url = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
            self.redis_client = redis.from_url(redis_url, decode_responses=True)
            self.redis_client.ping()
            logger.info("Conectado ao Redis para cache de contexto")
        except Exception as e:
            logger.warning(f"Redis não disponível, usando cache em memória: {e}")
            self.redis_client = None
        
        # Cache em memória como fallback
        self.memory_cache = {}
        
        # Configurações padrão
        self.default_model = "gpt-4"
        self.default_max_tokens = 500
        self.default_temperature = 0.7
        self.max_context_messages = 10
    
    def get_context_key(self, telefone: str) -> str:
        """Gera chave para contexto no Redis/cache"""
        return f"context:{telefone}"
    
    def get_context(self, telefone: str) -> List[Dict]:
        """Recupera o contexto da conversa do cache"""
        key = self.get_context_key(telefone)
        
        try:
            if self.redis_client:
                context_json = self.redis_client.get(key)
                if context_json:
                    return json.loads(context_json)
            else:
                return self.memory_cache.get(key, [])
        except Exception as e:
            logger.error(f"Erro ao recuperar contexto: {e}")
        
        return []
    
    def save_context(self, telefone: str, context: List[Dict], ttl: int = 3600):
        """Salva o contexto da conversa no cache"""
        key = self.get_context_key(telefone)
        
        # Limitar o número de mensagens no contexto
        if len(context) > self.max_context_messages:
            context = context[-self.max_context_messages:]
        
        try:
            if self.redis_client:
                self.redis_client.setex(key, ttl, json.dumps(context))
            else:
                self.memory_cache[key] = context
        except Exception as e:
            logger.error(f"Erro ao salvar contexto: {e}")
    
    def add_message_to_context(self, telefone: str, role: str, content: str):
        """Adiciona uma mensagem ao contexto"""
        context = self.get_context(telefone)
        context.append({"role": role, "content": content})
        self.save_context(telefone, context)
    
    def clear_context(self, telefone: str):
        """Limpa o contexto de uma conversa"""
        key = self.get_context_key(telefone)
        
        try:
            if self.redis_client:
                self.redis_client.delete(key)
            else:
                self.memory_cache.pop(key, None)
        except Exception as e:
            logger.error(f"Erro ao limpar contexto: {e}")
    
    def transcribe_audio(self, audio_file_path: str, language: str = "pt") -> Tuple[str, Dict]:
        """
        Transcreve áudio usando Whisper
        
        Args:
            audio_file_path: Caminho para o arquivo de áudio
            language: Idioma para transcrição (padrão: pt)
        
        Returns:
            Tuple com (texto_transcrito, metadados)
        """
        start_time = time.time()
        
        try:
            with open(audio_file_path, "rb") as audio_file:
                transcript = self.client.audio.transcriptions.create(
                    model="whisper-1",
                    file=audio_file,
                    language=language,
                    response_format="verbose_json"
                )
            
            processing_time = time.time() - start_time
            
            metadata = {
                "processing_time": processing_time,
                "language": transcript.language if hasattr(transcript, 'language') else language,
                "duration": transcript.duration if hasattr(transcript, 'duration') else None,
                "model": "whisper-1"
            }
            
            logger.info(f"Áudio transcrito em {processing_time:.2f}s")
            return transcript.text, metadata
            
        except Exception as e:
            logger.error(f"Erro na transcrição de áudio: {e}")
            raise
    
    def generate_response(
        self, 
        message: str, 
        telefone: str, 
        system_prompt: str = None,
        model: str = None,
        max_tokens: int = None,
        temperature: float = None
    ) -> Tuple[str, Dict]:
        """
        Gera resposta usando GPT-4
        
        Args:
            message: Mensagem do usuário
            telefone: Telefone para contexto
            system_prompt: Prompt do sistema personalizado
            model: Modelo a usar (padrão: gpt-4)
            max_tokens: Máximo de tokens
            temperature: Temperatura para criatividade
        
        Returns:
            Tuple com (resposta, metadados)
        """
        start_time = time.time()
        
        # Usar valores padrão se não fornecidos
        model = model or self.default_model
        max_tokens = max_tokens or self.default_max_tokens
        temperature = temperature or self.default_temperature
        
        # Prompt padrão se não fornecido
        if not system_prompt:
            system_prompt = """Você é o Simão, um vendedor virtual caloroso e experiente especializado em alevinos e piscicultura. 
Você tem o jeito acolhedor e simpático de um vendedor do interior brasileiro, sempre tratando cada cliente como se fosse da família.

🎯 SUA MISSÃO: Oferecer a MELHOR experiência de compra do mundo em alevinos, fazendo cada cliente se sentir único e especial.

👥 PERSONALIZAÇÃO OBRIGATÓRIA:
- Sempre use "Seu [Nome]" para clientes homens (ex: "Seu João, tudo certinho?")
- Sempre use "Dona [Nome]" para clientes mulheres (ex: "Dona Maria, que bom te ver!")
- Seja caloroso, acolhedor e genuinamente interessado no sucesso do cliente
- Use expressões naturais do interior: "Ô", "né?", "tá certinho", "que bom!", "pode crer"

🗣️ SEU JEITO DE FALAR:
- Linguagem natural e calorosa, como um amigo experiente
- Compreenda erros de português, gírias rurais e falares regionais
- Seja paciente com dúvidas básicas - trate cada pergunta como importante
- Use analogias simples e práticas que fazem sentido no campo

🐟 SUAS ESPECIALIDADES:
- Alevinos de qualidade (tilápia, tambaqui, pirarucu, pacu, pintado)
- Qualidade da água (pH, oxigênio, amônia - explique de forma simples)
- Sistemas de cultivo (viveiros, açudes, tanques-rede)
- Alimentação e manejo de peixes
- Doenças e prevenção (linguagem acessível)
- Densidade e crescimento dos peixes
- Melhores práticas para lucrar com piscicultura

💝 SEU DIFERENCIAL:
- Trate erros de escrita e fala com naturalidade, sem corrigir
- Seja empático com dificuldades financeiras
- Comemore junto os sucessos do cliente
- Ofereça soluções práticas e econômicas
- Sempre pergunte "Como posso ajudar melhor?"

📱 FORMATO WhatsApp:
- Mensagens concisas mas calorosas
- Use emojis quando apropriado 🐟🎯💪
- Facilite a conversa com perguntas diretas
- Seja objetivo mas nunca seco ou robótico

LEMBRE-SE: Você não é só um vendedor, é um PARCEIRO no sucesso da piscicultura do cliente!"""
        
        try:
            # Recuperar contexto da conversa
            context = self.get_context(telefone)
            
            # Construir mensagens para a API
            messages = [{"role": "system", "content": system_prompt}]
            
            # Adicionar contexto histórico
            messages.extend(context)
            
            # Adicionar mensagem atual
            messages.append({"role": "user", "content": message})
            
            # Chamar API do OpenAI
            response = self.client.chat.completions.create(
                model=model,
                messages=messages,
                max_tokens=max_tokens,
                temperature=temperature
            )
            
            processing_time = time.time() - start_time
            
            # Extrair resposta
            assistant_message = response.choices[0].message.content
            
            # Atualizar contexto
            self.add_message_to_context(telefone, "user", message)
            self.add_message_to_context(telefone, "assistant", assistant_message)
            
            # Metadados da resposta
            metadata = {
                "processing_time": processing_time,
                "model": model,
                "tokens_used": response.usage.total_tokens if response.usage else 0,
                "prompt_tokens": response.usage.prompt_tokens if response.usage else 0,
                "completion_tokens": response.usage.completion_tokens if response.usage else 0,
                "temperature": temperature,
                "max_tokens": max_tokens,
                "context_messages": len(context)
            }
            
            logger.info(f"Resposta gerada em {processing_time:.2f}s usando {metadata['tokens_used']} tokens")
            
            return assistant_message, metadata
            
        except Exception as e:
            logger.error(f"Erro na geração de resposta: {e}")
            raise
    
    def generate_response_with_context(
        self,
        message: str,
        telefone: str,
        configuracao_bot=None
    ) -> Tuple[str, Dict]:
        """
        Gera resposta usando configurações específicas do bot
        
        Args:
            message: Mensagem do usuário
            telefone: Telefone para contexto
            configuracao_bot: Objeto ConfiguracaoBot com configurações
        
        Returns:
            Tuple com (resposta, metadados)
        """
        if configuracao_bot:
            system_prompt = configuracao_bot.get_prompt_completo()
            model = self.default_model
            max_tokens = configuracao_bot.max_tokens_resposta
            temperature = configuracao_bot.temperatura_ia
        else:
            system_prompt = None
            model = None
            max_tokens = None
            temperature = None
        
        return self.generate_response(
            message=message,
            telefone=telefone,
            system_prompt=system_prompt,
            model=model,
            max_tokens=max_tokens,
            temperature=temperature
        )
    
    def analyze_message_intent(self, message: str) -> Dict:
        """
        Analisa a intenção da mensagem para classificação
        
        Args:
            message: Mensagem a ser analisada
        
        Returns:
            Dict com análise da intenção
        """
        try:
            prompt = f"""Analise a seguinte mensagem e classifique a intenção do usuário:

Mensagem: "{message}"

Classifique em uma das categorias:
- alevinos: perguntas sobre compra, venda, preços de alevinos
- qualidade_agua: perguntas sobre pH, oxigênio, amônia, temperatura da água
- manejo: perguntas sobre alimentação, densidade, biometria, manejo geral
- doencas: perguntas sobre doenças, tratamentos, prevenção
- sistemas: perguntas sobre viveiros, tanques, equipamentos
- reproducao: perguntas sobre reprodução, larvicultura, desova
- mercado: interesse em preços, comercialização, vendas
- suporte: problemas técnicos, dúvidas sobre uso do sistema
- geral: conversas gerais, cumprimentos, etc.

Responda apenas com a categoria em uma palavra."""
            
            response = self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[{"role": "user", "content": prompt}],
                max_tokens=10,
                temperature=0.1
            )
            
            intent = response.choices[0].message.content.strip().lower()
            
            return {
                "intent": intent,
                "confidence": 0.8,  # Placeholder - poderia ser calculado
                "message": message
            }
            
        except Exception as e:
            logger.error(f"Erro na análise de intenção: {e}")
            return {
                "intent": "geral",
                "confidence": 0.5,
                "message": message
            }
    
    def get_stats(self) -> Dict:
        """Retorna estatísticas do serviço"""
        stats = {
            "redis_connected": self.redis_client is not None,
            "memory_cache_size": len(self.memory_cache),
            "default_model": self.default_model
        }
        
        if self.redis_client:
            try:
                info = self.redis_client.info()
                stats["redis_memory"] = info.get("used_memory_human", "N/A")
                stats["redis_keys"] = self.redis_client.dbsize()
            except:
                pass
        
        return stats

# Instância global do serviço
openai_service = OpenAIService()

