import os
import logging
import tempfile
import requests
from datetime import datetime
from typing import Dict, Optional, Tuple
from sqlalchemy.orm import sessionmaker
from sqlalchemy import create_engine

from src.models.user import db, Cliente, Bot, Lead, Conversa, Mensagem, ConfiguracaoBot
from src.models.lead import StatusLeadEnum, OrigemEnum
from src.models.conversa import TipoMensagemEnum, DirecaoEnum, StatusMensagemEnum
from src.models.bot import StatusBotEnum
from src.services.openai_service import openai_service
from src.services.gemini_service import GeminiService
from src.services.wppconnect_service import wppconnect_service
from src.services.personalization_service import personalization_service, Gender
from src.services.rural_dictionary import rural_dictionary
from src.services.spelling_correction import spelling_service

logger = logging.getLogger(__name__)

class MessageProcessor:
    def __init__(self):
        self.temp_dir = tempfile.gettempdir()
        # Inicializar Gemini Service (95% mais barato que OpenAI)
        try:
            self.gemini_service = GeminiService()
            self.ai_provider = "gemini"
            logger.info("Gemini Service inicializado com sucesso - economia de 95% nos custos!")
        except Exception as e:
            logger.warning(f"Falha ao inicializar Gemini, usando OpenAI como fallback: {e}")
            self.gemini_service = None
            self.ai_provider = "openai"
        
    def process_webhook_message(self, webhook_data: Dict) -> Dict:
        """
        Processa mensagem recebida via webhook do WPPConnect
        
        Args:
            webhook_data: Dados do webhook
        
        Returns:
            Dict com resultado do processamento
        """
        try:
            # Extrair informações da mensagem
            message_info = self._extract_message_info(webhook_data)
            
            if not message_info:
                return {"status": "ignored", "reason": "Mensagem inválida ou não suportada"}
            
            # Buscar ou criar lead
            lead = self._get_or_create_lead(message_info['phone'], message_info.get('sender_name'))
            
            if not lead:
                return {"status": "error", "reason": "Não foi possível identificar o cliente"}
            
            # Buscar bot ativo do cliente
            bot = self._get_active_bot(lead.cliente_id)
            
            if not bot:
                return {"status": "error", "reason": "Bot não encontrado ou inativo"}
            
            # Verificar se está em horário de atendimento
            if not bot.esta_em_horario_atendimento():
                return self._send_out_of_hours_message(lead, bot)
            
            # Buscar ou criar conversa
            conversa = self._get_or_create_conversation(bot.id, lead.id, message_info['phone'])
            
            # Salvar mensagem recebida
            mensagem_entrada = self._save_incoming_message(conversa.id, message_info)
            
            # Processar baseado no tipo de mensagem
            if message_info['type'] == 'text':
                response = self._process_text_message(lead, bot, message_info['content'])
            elif message_info['type'] == 'audio':
                response = self._process_audio_message(lead, bot, message_info)
            else:
                response = self._process_media_message(lead, bot, message_info)
            
            # Enviar resposta
            if response['content']:
                self._send_response(lead.telefone, response['content'], conversa.id, response.get('metadata', {}))
            
            # Atualizar métricas do bot
            self._update_bot_metrics(bot.id)
            
            # Atualizar lead se necessário
            self._update_lead_from_message(lead, message_info['content'])
            
            return {
                "status": "processed",
                "lead_id": lead.id,
                "conversation_id": conversa.id,
                "response_sent": bool(response['content'])
            }
            
        except Exception as e:
            logger.error(f"Erro ao processar mensagem do webhook: {e}")
            return {"status": "error", "reason": str(e)}
    
    def _extract_message_info(self, webhook_data: Dict) -> Optional[Dict]:
        """Extrai informações relevantes do webhook"""
        try:
            # Estrutura típica do webhook WPPConnect
            if 'body' in webhook_data:
                body = webhook_data['body']
                
                # Ignorar mensagens próprias
                if body.get('fromMe', False):
                    return None
                
                # Extrair informações básicas
                info = {
                    'id': body.get('id'),
                    'phone': body.get('from', '').replace('@c.us', ''),
                    'sender_name': body.get('notifyName') or body.get('pushname'),
                    'timestamp': body.get('timestamp') or datetime.utcnow().timestamp(),
                    'type': body.get('type', 'text').lower(),
                    'content': '',
                    'media_url': None,
                    'media_mimetype': None
                }
                
                # Extrair conteúdo baseado no tipo
                if info['type'] == 'chat' or info['type'] == 'text':
                    info['type'] = 'text'
                    info['content'] = body.get('body', '')
                elif info['type'] == 'ptt' or info['type'] == 'audio':
                    info['type'] = 'audio'
                    info['media_url'] = body.get('url') or body.get('mediaUrl')
                    info['media_mimetype'] = body.get('mimetype')
                elif info['type'] == 'image':
                    info['content'] = body.get('caption', '')
                    info['media_url'] = body.get('url') or body.get('mediaUrl')
                    info['media_mimetype'] = body.get('mimetype')
                elif info['type'] == 'document':
                    info['content'] = body.get('filename', '')
                    info['media_url'] = body.get('url') or body.get('mediaUrl')
                    info['media_mimetype'] = body.get('mimetype')
                
                return info
                
        except Exception as e:
            logger.error(f"Erro ao extrair informações da mensagem: {e}")
        
        return None
    
    def _get_or_create_lead(self, phone: str, name: str = None) -> Optional[Lead]:
        """Busca ou cria um lead baseado no telefone com personalização"""
        try:
            # Buscar lead existente
            lead = Lead.query.filter_by(telefone=phone).first()
            
            if lead:
                # Atualizar nome se fornecido e não existe
                if name and not lead.nome:
                    lead.nome = name
                    # Detectar gênero para personalização futura
                    genero = personalization_service.detectar_genero_nome(name)
                    # Salvar informação de gênero no lead (seria necessário adicionar campo)
                    db.session.commit()
                    
                    # Log personalizado
                    tratamento = personalization_service.gerar_tratamento_personalizado(name, genero)
                    logger.info(f"Lead encontrado: {tratamento} ({phone})")
                return lead
            
            # Buscar cliente padrão (primeiro cliente ativo)
            # Em produção, isso seria baseado no bot que recebeu a mensagem
            cliente = Cliente.query.filter_by(status=StatusEnum.ATIVO).first()
            
            if not cliente:
                logger.error("Nenhum cliente ativo encontrado")
                return None
            
            # Detectar gênero e personalizar lead
            genero = Gender.NEUTRO
            if name:
                genero = personalization_service.detectar_genero_nome(name)
            
            # Criar novo lead
            lead = Lead(
                cliente_id=cliente.id,
                telefone=phone,
                nome=name,
                status=StatusLeadEnum.NOVO,
                origem=OrigemEnum.WHATSAPP,
                data_ultimo_contato=datetime.utcnow()
            )
            
            db.session.add(lead)
            db.session.commit()
            
            # Log personalizado e caloroso
            if name:
                tratamento = personalization_service.gerar_tratamento_personalizado(name, genero)
                logger.info(f"🎉 Novo lead criado: {tratamento} ({phone}) - Vamos dar as boas-vindas!")
            else:
                logger.info(f"Novo lead criado: {phone}")
            
            return lead
            
        except Exception as e:
            logger.error(f"Erro ao buscar/criar lead: {e}")
            db.session.rollback()
            return None
    
    def _get_active_bot(self, cliente_id: int) -> Optional[Bot]:
        """Busca bot ativo do cliente"""
        return Bot.query.filter_by(
            cliente_id=cliente_id,
            ativo=True,
            status=StatusBotEnum.ONLINE
        ).first()
    
    def _get_or_create_conversation(self, bot_id: int, lead_id: int, phone: str) -> Conversa:
        """Busca ou cria conversa"""
        conversa = Conversa.query.filter_by(
            bot_id=bot_id,
            lead_id=lead_id,
            ativa=True
        ).first()
        
        if not conversa:
            conversa = Conversa(
                bot_id=bot_id,
                lead_id=lead_id,
                telefone_contato=phone,
                ativa=True
            )
            db.session.add(conversa)
            db.session.commit()
        
        return conversa
    
    def _save_incoming_message(self, conversa_id: int, message_info: Dict) -> Mensagem:
        """Salva mensagem recebida no banco"""
        mensagem = Mensagem(
            conversa_id=conversa_id,
            id_whatsapp=message_info['id'],
            tipo=TipoMensagemEnum(message_info['type']),
            direcao=DirecaoEnum.ENTRADA,
            conteudo=message_info['content'],
            remetente=message_info['phone'],
            url_arquivo=message_info.get('media_url'),
            mime_type=message_info.get('media_mimetype'),
            status=StatusMensagemEnum.ENTREGUE,
            data_envio=datetime.fromtimestamp(message_info['timestamp'])
        )
        
        db.session.add(mensagem)
        db.session.commit()
        
        return mensagem
    
    def _process_text_message(self, lead: Lead, bot: Bot, content: str) -> Dict:
        """Processa mensagem de texto com personalização total e warmth"""
        try:
            # Buscar configurações do bot
            config = ConfiguracaoBot.query.filter_by(cliente_id=lead.cliente_id).first()
            
            if not config or not config.resposta_automatica_ativa:
                return {"content": "", "metadata": {}}
            
            # 🧠 INTELIGÊNCIA RURAL: Processar e corrigir mensagem
            logger.info(f"📨 Mensagem recebida: '{content[:50]}...' de {lead.telefone}")
            
            # Verificar se precisa correção de erros
            if spelling_service.detectar_necessidade_correcao(content):
                logger.info("🔧 Aplicando correção inteligente de erros rurais...")
                correcao = spelling_service.corrigir_mensagem(content)
                content_limpo = correcao['mensagem_corrigida']
                
                # Log das correções aplicadas (para melhorar sistema)
                if correcao['correcoes']:
                    logger.info(f"✅ Correções: {[c['original'] + ' → ' + c['corrigida'] for c in correcao['correcoes'][:3]]}")
            else:
                content_limpo = content
            
            # 🌾 COMPREENSÃO RURAL: Analisar intenções e contexto
            intencoes = rural_dictionary.identificar_intencao_rural(content_limpo)
            termos_tecnicos = rural_dictionary.extrair_termos_tecnicos(content_limpo)
            urgencia = rural_dictionary.detectar_urgencia(content_limpo)
            
            # 👥 PERSONALIZAÇÃO: Detectar informações pessoais
            info_pessoais = personalization_service.extrair_informacoes_pessoais(content)
            
            # Atualizar nome do lead se detectado e não existe
            if info_pessoais.get('possivel_nome') and not lead.nome:
                lead.nome = info_pessoais['possivel_nome']
                db.session.commit()
                logger.info(f"👤 Nome detectado e salvo: {lead.nome}")
            
            # Detectar gênero para personalização
            genero = Gender.NEUTRO
            if lead.nome:
                genero = personalization_service.detectar_genero_nome(lead.nome)
            
            tratamento = personalization_service.gerar_tratamento_personalizado(lead.nome or "amigo", genero)
            
            # 🎯 CONTEXTO ENRIQUECIDO: Preparar contexto personalizado
            contexto_personalizado = {
                'nome_cliente': lead.nome,
                'tratamento': tratamento,
                'genero': genero.value if genero != Gender.NEUTRO else 'neutro',
                'primeira_interacao': not lead.data_ultimo_contato or 
                    (datetime.utcnow() - lead.data_ultimo_contato).days > 30,
                'intencoes': intencoes,
                'termos_tecnicos': termos_tecnicos,
                'urgencia': urgencia,
                'tipo_regiao': info_pessoais.get('tipo_regiao', 'misto').value if info_pessoais.get('tipo_regiao') else 'misto'
            }
            
            # 🤖 SISTEMA PROMPT PERSONALIZADO: Criar prompt específico para este cliente
            prompt_personalizado = self._criar_prompt_personalizado(contexto_personalizado, content_limpo)
            
            # 🧠 GERAR RESPOSTA COM IA ESPECIALIZADA
            logger.info(f"🤖 Gerando resposta para {tratamento} - Urgência: {urgencia}")
            
            # Usar Gemini (95% mais barato) ou OpenAI como fallback
            if self.ai_provider == "gemini" and self.gemini_service:
                try:
                    response_text = self.gemini_service.generate_response(
                        message=content_limpo,
                        conversation_history=self._get_conversation_history(lead),
                        context=contexto_personalizado,
                        cliente_info={
                            'nome': lead.nome,
                            'genero_detectado': lead.genero_detectado,
                            'experiencia_piscicultura': lead.experiencia_piscicultura,
                            'tipo_propriedade': lead.tipo_propriedade,
                            'especies_interesse': lead.especies_interesse
                        }
                    )
                    metadata = {"provider": "gemini", "cost_saved": 95}
                    logger.info("💰 Resposta gerada com Gemini - 95% economia!")
                except Exception as e:
                    logger.warning(f"Gemini falhou, usando OpenAI fallback: {e}")
                    response_text, metadata = openai_service.generate_response(
                        message=content_limpo,
                        telefone=lead.telefone,
                        system_prompt=prompt_personalizado
                    )
                    metadata["fallback"] = True
            else:
                response_text, metadata = openai_service.generate_response(
                    message=content_limpo,
                    telefone=lead.telefone,
                    system_prompt=prompt_personalizado
                )
            
            # 💝 ADICIONAR WARMTH E PERSONALIZAÇÃO FINAL
            if lead.nome:
                response_text = personalization_service.adicionar_warmth_resposta(
                    response_text, 
                    lead.nome,
                    contexto=self._determinar_contexto_resposta(intencoes)
                )
            
            # 🎉 PERSONALIZAR SAUDAÇÕES E DESPEDIDAS
            if intencoes.get('saudacao'):
                saudacao = personalization_service.gerar_saudacao_personalizada(
                    lead.nome or "amigo", 
                    genero,
                    primeira_vez=contexto_personalizado['primeira_interacao']
                )
                response_text = saudacao + "\n\n" + response_text
            
            elif intencoes.get('despedida'):
                despedida = personalization_service.gerar_despedida_personalizada(
                    lead.nome or "amigo", 
                    genero,
                    vendeu=intencoes.get('interesse_compra', False)
                )
                response_text = response_text + "\n\n" + despedida
            
            # 📊 METADATA ENRIQUECIDA
            metadata_enriquecida = {
                **metadata,
                'personalization': {
                    'nome_cliente': lead.nome,
                    'tratamento_usado': tratamento,
                    'genero_detectado': genero.value,
                    'primeira_interacao': contexto_personalizado['primeira_interacao'],
                    'intencoes_detectadas': intencoes,
                    'termos_tecnicos': termos_tecnicos,
                    'urgencia': urgencia,
                    'correcoes_aplicadas': spelling_service.detectar_necessidade_correcao(content)
                }
            }
            
            # 🎯 LOG DE SUCESSO
            logger.info(f"✅ Resposta gerada para {tratamento} | Tokens: {metadata.get('tokens_used', 0)} | Tempo: {metadata.get('processing_time', 0):.2f}s")
            
            return {
                "content": response_text,
                "metadata": metadata_enriquecida
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao processar mensagem de texto: {e}")
            
            # Resposta de erro personalizada e calorosa
            nome_tratamento = lead.nome or "amigo"
            if lead.nome:
                genero = personalization_service.detectar_genero_nome(lead.nome)
                nome_tratamento = personalization_service.gerar_tratamento_personalizado(lead.nome, genero)
            
            response_error = f"Ô {nome_tratamento}, deu uma travadinha aqui do meu lado! 😅 Pode repetir sua mensagem? Prometo que agora vai dar certo!"
            
            return {
                "content": response_error,
                "metadata": {"error": str(e), "personalized_error": True}
            }
    
    def _process_audio_message(self, lead: Lead, bot: Bot, message_info: Dict) -> Dict:
        """Processa mensagem de áudio com inteligência rural e personalização"""
        try:
            # Buscar configurações
            config = ConfiguracaoBot.query.filter_by(cliente_id=lead.cliente_id).first()
            
            # Preparar tratamento personalizado
            genero = Gender.NEUTRO
            if lead.nome:
                genero = personalization_service.detectar_genero_nome(lead.nome)
            tratamento = personalization_service.gerar_tratamento_personalizado(lead.nome or "amigo", genero)
            
            if not config or not config.transcricao_ativa:
                return {
                    "content": f"Ô {tratamento}, no momento não consigo escutar seus áudios! 😅 Mas pode mandar por texto que respondo rapidinho!",
                    "metadata": {"audio_disabled": True}
                }
            
            logger.info(f"🎤 Processando áudio de {tratamento}...")
            
            # Baixar arquivo de áudio
            audio_path = self._download_media_file(message_info['media_url'], 'audio')
            
            if not audio_path:
                return {
                    "content": f"Eita {tratamento}, não consegui baixar seu áudio! Tenta mandar de novo ou pode escrever mesmo que eu respondo joia! 😊",
                    "metadata": {"download_failed": True}
                }
            
            # 🎤 TRANSCREVER ÁUDIO com Gemini (muito mais barato que Whisper)
            if self.ai_provider == "gemini" and self.gemini_service:
                try:
                    # Ler arquivo de áudio
                    with open(audio_path, 'rb') as audio_file:
                        audio_data = audio_file.read()
                    
                    # Detectar formato do arquivo
                    audio_format = audio_path.split('.')[-1].lower()
                    if audio_format not in ['ogg', 'mp3', 'wav', 'm4a']:
                        audio_format = 'ogg'  # Default WhatsApp
                    
                    transcription = self.gemini_service.transcribe_audio(audio_data, audio_format)
                    transcription_metadata = {"provider": "gemini", "cost_saved": 85, "format": audio_format}
                    logger.info("💰 Transcrição com Gemini - 85% economia vs Whisper!")
                    
                except Exception as e:
                    logger.warning(f"Gemini transcrição falhou, usando Whisper fallback: {e}")
                    transcription, transcription_metadata = openai_service.transcribe_audio(
                        audio_path, 
                        config.idioma_transcricao or 'pt'
                    )
                    transcription_metadata["fallback"] = True
            else:
                transcription, transcription_metadata = openai_service.transcribe_audio(
                    audio_path, 
                    config.idioma_transcricao or 'pt'
                )
            
            logger.info(f"📝 Transcrição: '{transcription[:50]}...'")
            
            # 🔧 MELHORAR TRANSCRIÇÃO com correção rural
            confianca_whisper = transcription_metadata.get('confidence', 0.8)
            
            if transcription and len(transcription.strip()) > 0:
                # Aplicar correção específica para áudio rural
                transcricao_melhorada = spelling_service.melhorar_transcricao_audio(
                    transcription, 
                    confianca_whisper
                )
                
                # Se precisar confirmação, perguntar de forma calorosa
                if transcricao_melhorada.get('requer_confirmacao'):
                    confirmacao_msg = f"Ô {tratamento}, me ajuda aí! Entendi que você falou algo como: '{transcricao_melhorada['transcricao_melhorada']}'. Tá certo ou entendi errado? 😅"
                    
                    return {
                        "content": confirmacao_msg,
                        "metadata": {
                            **transcription_metadata,
                            "transcription": transcription,
                            "transcription_improved": transcricao_melhorada['transcricao_melhorada'],
                            "requires_confirmation": True
                        }
                    }
                
                transcription_final = transcricao_melhorada['transcricao_melhorada']
                logger.info(f"✅ Transcrição melhorada: '{transcription_final[:50]}...'")
                
            else:
                # Transcrição vazia ou falhou
                return {
                    "content": f"Ô {tratamento}, não consegui entender seu áudio muito bem! Pode repetir ou mandar por texto? Às vezes o áudio fica meio baixinho! 😊",
                    "metadata": {
                        **transcription_metadata,
                        "transcription_failed": True
                    }
                }
            
            # 🧠 PROCESSAR COMO MENSAGEM DE TEXTO (usando toda a inteligência rural)
            response_dict = self._process_text_message(lead, bot, transcription_final)
            
            # 🎤 ADICIONAR CONTEXTO DE ÁUDIO à resposta
            if response_dict['content']:
                # Dar feedback positivo sobre o áudio
                response_text = response_dict['content']
                
                # Adicionar uma saudação específica de áudio ocasionalmente
                import random
                if random.random() < 0.3:  # 30% das vezes
                    audio_feedbacks = [
                        f"Que bom ouvir sua voz {tratamento}! 😊",
                        f"Adorei seu áudio {tratamento}!",
                        f"Sua voz ficou clarinha {tratamento}!",
                        f"Que sotaque bacana {tratamento}! 😄"
                    ]
                    feedback = random.choice(audio_feedbacks)
                    response_text = f"{feedback} {response_text}"
            
            # 📊 COMBINAR METADADOS
            combined_metadata = {
                **transcription_metadata,
                **response_dict.get('metadata', {}),
                "transcription_original": transcription,
                "transcription_final": transcription_final,
                "audio_processing": True,
                "audio_confidence": confianca_whisper
            }
            
            # Limpar arquivo temporário
            try:
                os.remove(audio_path)
            except:
                pass
            
            logger.info(f"✅ Áudio processado com sucesso para {tratamento}")
            
            return {
                "content": response_text,
                "metadata": combined_metadata
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao processar áudio: {e}")
            
            # Erro personalizado e caloroso
            nome_tratamento = lead.nome or "amigo"
            if lead.nome:
                genero = personalization_service.detectar_genero_nome(lead.nome)
                nome_tratamento = personalization_service.gerar_tratamento_personalizado(lead.nome, genero)
            
            error_messages = [
                f"Eita {nome_tratamento}, deu um probleminha com seu áudio! Pode mandar por texto?",
                f"Ô {nome_tratamento}, travou aqui na hora de escutar! Manda por escrito que funciona melhor!",
                f"{nome_tratamento}, seu áudio não chegou direito! Escreve aí que respondo rapidinho! 😊"
            ]
            
            import random
            error_response = random.choice(error_messages)
            
            return {
                "content": error_response,
                "metadata": {"error": str(e), "audio_error": True, "personalized_error": True}
            }
    
    def _process_media_message(self, lead: Lead, bot: Bot, message_info: Dict) -> Dict:
        """Processa mensagens de mídia com personalização calorosa"""
        try:
            # Preparar tratamento personalizado
            genero = Gender.NEUTRO
            if lead.nome:
                genero = personalization_service.detectar_genero_nome(lead.nome)
            tratamento = personalization_service.gerar_tratamento_personalizado(lead.nome or "amigo", genero)
            
            # Respostas personalizadas e calorosas para cada tipo de mídia
            responses = {
                'image': [
                    f"Ô {tratamento}, que legal essa foto! 📸 Tem alguma coisa com piscicultura aí? Como posso ajudar?",
                    f"Show de foto {tratamento}! 😊 É sobre os peixes? Em que posso ser útil?",
                    f"Que bacana {tratamento}! Adorei a imagem! Tem a ver com seus alevinos?"
                ],
                'document': [
                    f"Recebi seu documento aqui {tratamento}! 📄 Deixa eu dar uma olhadinha. Em que posso ajudar?",
                    f"Opa {tratamento}, documento chegou certinho! É sobre piscicultura?",
                    f"Perfeito {tratamento}! Vi que mandou um documento. Como posso auxiliar?"
                ],
                'video': [
                    f"Eita {tratamento}, que vídeo massa! 🎥 É dos seus peixes? Conta aí como posso ajudar!",
                    f"Show {tratamento}! Adorei o vídeo! Tem a ver com aquicultura?",
                    f"Que bacana esse vídeo {tratamento}! 😄 Em que posso ser útil?"
                ],
                'sticker': [
                    f"Haha! Adorei o sticker {tratamento}! 😂 E aí, como posso ajudar com os alevinos hoje?",
                    f"Que divertido {tratamento}! 😊 Vamos falar de peixe?",
                    f"Kkkkk massa {tratamento}! 😄 Como posso ser útil?"
                ],
                'location': [
                    f"Ô {tratamento}, obrigado por compartilhar onde você tá! 📍 Fica perto de alguma piscicultura?",
                    f"Legal {tratamento}! Vi sua localização aqui. Tem viveiros de peixe aí na região?",
                    f"Bacana {tratamento}! Conheço essa região! Como posso ajudar?"
                ]
            }
            
            # Escolher resposta aleatória do tipo apropriado
            import random
            media_type = message_info['type']
            possible_responses = responses.get(media_type, [
                f"Obrigado pela mensagem {tratamento}! Como posso ajudar?",
                f"Legal {tratamento}! Em que posso ser útil?",
                f"Show {tratamento}! Como posso auxiliar?"
            ])
            
            response_text = random.choice(possible_responses)
            
            # Log personalizado
            logger.info(f"📷 Mídia ({media_type}) recebida de {tratamento}")
            
            return {
                "content": response_text,
                "metadata": {
                    "media_type": media_type,
                    "personalized": True,
                    "tratamento_usado": tratamento
                }
            }
            
        except Exception as e:
            logger.error(f"❌ Erro ao processar mídia: {e}")
            
            # Erro personalizado para mídia
            nome_tratamento = lead.nome or "amigo"
            if lead.nome:
                genero = personalization_service.detectar_genero_nome(lead.nome)
                nome_tratamento = personalization_service.gerar_tratamento_personalizado(lead.nome, genero)
            
            return {
                "content": f"Ô {nome_tratamento}, recebi sua mensagem mas deu uma travadinha aqui! Pode me contar o que precisa? 😊",
                "metadata": {"error": str(e), "media_error": True, "personalized_error": True}
            }
    
    def _download_media_file(self, media_url: str, media_type: str) -> Optional[str]:
        """Baixa arquivo de mídia"""
        try:
            if not media_url:
                return None
            
            response = requests.get(media_url, timeout=30)
            response.raise_for_status()
            
            # Determinar extensão
            extensions = {
                'audio': '.ogg',
                'image': '.jpg',
                'video': '.mp4',
                'document': '.pdf'
            }
            
            extension = extensions.get(media_type, '.tmp')
            
            # Salvar arquivo temporário
            temp_file = tempfile.NamedTemporaryFile(
                delete=False, 
                suffix=extension,
                dir=self.temp_dir
            )
            
            temp_file.write(response.content)
            temp_file.close()
            
            return temp_file.name
            
        except Exception as e:
            logger.error(f"Erro ao baixar arquivo de mídia: {e}")
            return None
    
    def _send_response(self, phone: str, content: str, conversa_id: int, metadata: Dict):
        """Envia resposta via WhatsApp"""
        try:
            # Enviar via WPPConnect
            result = wppconnect_service.send_text_message(phone, content)
            
            # Salvar mensagem enviada
            mensagem_saida = Mensagem(
                conversa_id=conversa_id,
                id_wppconnect=result.get('id'),
                tipo=TipoMensagemEnum.TEXTO,
                direcao=DirecaoEnum.SAIDA,
                conteudo=content,
                destinatario=phone,
                status=StatusMensagemEnum.ENVIADA,
                resposta_automatica=True,
                processada_ia=True,
                tempo_processamento=metadata.get('processing_time'),
                modelo_usado=metadata.get('model'),
                tokens_usados=metadata.get('tokens_used'),
                data_processamento=datetime.utcnow()
            )
            
            db.session.add(mensagem_saida)
            db.session.commit()
            
            logger.info(f"Resposta enviada para {phone}")
            
        except Exception as e:
            logger.error(f"Erro ao enviar resposta: {e}")
    
    def _send_out_of_hours_message(self, lead: Lead, bot: Bot) -> Dict:
        """Envia mensagem de fora de horário"""
        try:
            config = ConfiguracaoBot.query.filter_by(cliente_id=lead.cliente_id).first()
            
            if config and config.mensagem_fora_horario:
                wppconnect_service.send_text_message(lead.telefone, config.mensagem_fora_horario)
            
            return {
                "status": "out_of_hours",
                "message_sent": bool(config and config.mensagem_fora_horario)
            }
            
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem de fora de horário: {e}")
            return {"status": "error", "reason": str(e)}
    
    def _update_bot_metrics(self, bot_id: int):
        """Atualiza métricas do bot"""
        try:
            bot = Bot.query.get(bot_id)
            if bot:
                bot.total_mensagens_recebidas += 1
                bot.total_mensagens_enviadas += 1
                bot.ultima_atividade = datetime.utcnow()
                db.session.commit()
        except Exception as e:
            logger.error(f"Erro ao atualizar métricas do bot: {e}")
    
    def _update_lead_from_message(self, lead: Lead, content: str):
        """Atualiza informações do lead baseado na mensagem"""
        try:
            # Atualizar data do último contato
            lead.data_ultimo_contato = datetime.utcnow()
            
            # Analisar intenção da mensagem com Gemini (mais barato)
            if self.ai_provider == "gemini" and self.gemini_service:
                try:
                    intent_analysis = self.gemini_service.analyze_sentiment(content)
                    logger.info("💰 Análise de sentimento com Gemini - economia adicional!")
                except Exception as e:
                    logger.warning(f"Análise Gemini falhou, usando OpenAI: {e}")
                    intent_analysis = openai_service.analyze_message_intent(content)
            else:
                intent_analysis = openai_service.analyze_message_intent(content)
            
            # Adicionar tag baseada na intenção
            if intent_analysis['intent'] != 'geral':
                lead.adicionar_tag(intent_analysis['intent'])
            
            # Calcular nova pontuação
            lead.calcular_pontuacao()
            
            db.session.commit()
            
        except Exception as e:
            logger.error(f"Erro ao atualizar lead: {e}")
    
    def send_manual_message(self, lead_id: int, content: str, user_id: int = None) -> Dict:
        """
        Envia mensagem manual (não automática)
        
        Args:
            lead_id: ID do lead
            content: Conteúdo da mensagem
            user_id: ID do usuário que enviou (opcional)
        
        Returns:
            Dict com resultado
        """
        try:
            lead = Lead.query.get(lead_id)
            if not lead:
                return {"status": "error", "reason": "Lead não encontrado"}
            
            # Buscar bot ativo
            bot = self._get_active_bot(lead.cliente_id)
            if not bot:
                return {"status": "error", "reason": "Bot não encontrado"}
            
            # Buscar conversa
            conversa = self._get_or_create_conversation(bot.id, lead.id, lead.telefone)
            
            # Enviar mensagem
            result = wppconnect_service.send_text_message(lead.telefone, content)
            
            # Salvar no banco
            mensagem = Mensagem(
                conversa_id=conversa.id,
                id_wppconnect=result.get('id'),
                tipo=TipoMensagemEnum.TEXTO,
                direcao=DirecaoEnum.SAIDA,
                conteudo=content,
                destinatario=lead.telefone,
                status=StatusMensagemEnum.ENVIADA,
                resposta_automatica=False,
                processada_ia=False
            )
            
            db.session.add(mensagem)
            db.session.commit()
            
            return {"status": "sent", "message_id": mensagem.id}
            
        except Exception as e:
            logger.error(f"Erro ao enviar mensagem manual: {e}")
            return {"status": "error", "reason": str(e)}
    
    def _criar_prompt_personalizado(self, contexto: Dict, mensagem: str) -> str:
        """
        Cria um prompt personalizado baseado no contexto do cliente
        """
        # Prompt base já é caloroso, vamos enriquecer com contexto específico
        prompt_base = f"""Você é o Simão, um vendedor virtual caloroso especializado em alevinos.

🎯 CLIENTE ATUAL: {contexto['tratamento']}
📱 PRIMEIRA CONVERSA: {'Sim' if contexto['primeira_interacao'] else 'Não'}
🌍 REGIÃO: {contexto['tipo_regiao']}
⚡ URGÊNCIA: {contexto['urgencia']}

💡 CONTEXTO DA CONVERSA:
- Intenções detectadas: {', '.join([k for k, v in contexto['intencoes'].items() if v])}
- Termos técnicos mencionados: {', '.join(contexto['termos_tecnicos'])}

🗣️ INSTRUÇÕES ESPECÍFICAS:
- SEMPRE use o tratamento "{contexto['tratamento']}" (nunca mude isso!)
- Se é primeira conversa, seja EXTRA caloroso e acolhedor
- Se tem urgência alta, seja mais direto mas mantendo o carinho
- Responda os termos técnicos mencionados: {contexto['termos_tecnicos']}
- Linguagem: {'Mais rural e caipira' if contexto['tipo_regiao'] == 'rural' else 'Equilibrada'}

💝 LEMBRE-SE: Este cliente é único e especial. Trate com carinho genuíno!"""

        return prompt_base
    
    def _determinar_contexto_resposta(self, intencoes: Dict) -> str:
        """
        Determina o contexto da resposta baseado nas intenções
        """
        if intencoes.get('problema_criacao'):
            return 'problema'
        elif intencoes.get('duvida_tecnica'):
            return 'duvida'
        elif intencoes.get('interesse_compra'):
            return 'interesse'
        else:
            return 'geral'
    
    def _get_conversation_history(self, lead: Lead) -> List[Dict]:
        """
        Retorna histórico da conversa para contexto do Gemini
        """
        try:
            # Buscar últimas 20 mensagens da conversa
            conversa = Conversa.query.filter_by(lead_id=lead.id).first()
            if not conversa:
                return []
            
            mensagens = Mensagem.query.filter_by(
                conversa_id=conversa.id
            ).order_by(Mensagem.data_criacao.desc()).limit(20).all()
            
            history = []
            for msg in reversed(mensagens):  # Ordem cronológica
                role = "user" if msg.direcao == DirecaoEnum.RECEBIDA else "assistant"
                history.append({
                    "role": role,
                    "content": msg.conteudo,
                    "timestamp": msg.data_criacao.isoformat()
                })
            
            return history
            
        except Exception as e:
            logger.error(f"Erro ao buscar histórico da conversa: {e}")
            return []

# Instância global do processador
message_processor = MessageProcessor()

