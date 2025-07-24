from datetime import datetime

# Usar a instância db do módulo user
from .user import db

class ConfiguracaoBot(db.Model):
    __tablename__ = 'configuracoes_bot'
    
    id = db.Column(db.Integer, primary_key=True)
    cliente_id = db.Column(db.Integer, db.ForeignKey('clientes.id'), nullable=False)
    
    # Mensagens automáticas
    mensagem_boas_vindas = db.Column(db.Text, default="Olá! Eu sou o Simão, seu assistente virtual especializado em agronegócio. Como posso ajudá-lo hoje?")
    mensagem_fora_horario = db.Column(db.Text, default="Obrigado por entrar em contato! No momento estou fora do horário de atendimento, mas em breve retornarei sua mensagem.")
    mensagem_erro = db.Column(db.Text, default="Desculpe, ocorreu um erro ao processar sua mensagem. Tente novamente em alguns instantes.")
    mensagem_despedida = db.Column(db.Text, default="Foi um prazer ajudá-lo! Estou sempre aqui quando precisar. Tenha um ótimo dia!")
    
    # Configurações do prompt da IA
    prompt_sistema = db.Column(db.Text, default="""Você é o Simão, um assistente virtual especializado em agronegócio e agricultura. 
Você é amigável, conhecedor e sempre disposto a ajudar produtores rurais, cooperativas e profissionais do agro.
Suas respostas devem ser práticas, baseadas em conhecimento técnico sólido e adaptadas à realidade brasileira.
Sempre que possível, forneça informações específicas sobre culturas, técnicas agrícolas, mercado e tecnologias rurais.
Mantenha um tom profissional mas acessível, usando linguagem clara e evitando jargões excessivos.""")
    
    prompt_contexto = db.Column(db.Text, default="Contexto: Você está atendendo via WhatsApp e deve ser conciso mas informativo.")
    
    # Configurações de comportamento
    resposta_automatica_ativa = db.Column(db.Boolean, default=True)
    tempo_resposta_max = db.Column(db.Integer, default=30)  # segundos
    max_tokens_resposta = db.Column(db.Integer, default=500)
    temperatura_ia = db.Column(db.Float, default=0.7)
    
    # Configurações de áudio
    transcricao_ativa = db.Column(db.Boolean, default=True)
    idioma_transcricao = db.Column(db.String(10), default='pt')
    
    # Configurações de horário
    atendimento_24h = db.Column(db.Boolean, default=False)
    fuso_horario = db.Column(db.String(50), default='America/Sao_Paulo')
    
    # Configurações de integração
    webhook_url = db.Column(db.String(500))
    webhook_ativo = db.Column(db.Boolean, default=True)
    
    # Configurações de logs e métricas
    salvar_conversas = db.Column(db.Boolean, default=True)
    salvar_audios = db.Column(db.Boolean, default=True)
    tempo_retencao_dados = db.Column(db.Integer, default=365)  # dias
    
    # Configurações de palavras-chave
    palavras_chave_agricultura = db.Column(db.Text, default="agricultura,agronegócio,plantio,colheita,sementes,fertilizantes,defensivos,irrigação,solo,clima")
    palavras_chave_pecuaria = db.Column(db.Text, default="pecuária,gado,bovinos,suínos,aves,nutrição animal,pastagem,reprodução,sanidade")
    palavras_chave_tecnologia = db.Column(db.Text, default="agricultura de precisão,drones,GPS,sensores,IoT,automação,software agrícola")
    
    # Configurações de notificações
    notificar_nova_conversa = db.Column(db.Boolean, default=True)
    notificar_lead_qualificado = db.Column(db.Boolean, default=True)
    email_notificacoes = db.Column(db.String(120))
    
    # Timestamps
    data_criacao = db.Column(db.DateTime, default=datetime.utcnow)
    data_atualizacao = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'cliente_id': self.cliente_id,
            'mensagem_boas_vindas': self.mensagem_boas_vindas,
            'mensagem_fora_horario': self.mensagem_fora_horario,
            'mensagem_erro': self.mensagem_erro,
            'mensagem_despedida': self.mensagem_despedida,
            'prompt_sistema': self.prompt_sistema,
            'prompt_contexto': self.prompt_contexto,
            'resposta_automatica_ativa': self.resposta_automatica_ativa,
            'tempo_resposta_max': self.tempo_resposta_max,
            'max_tokens_resposta': self.max_tokens_resposta,
            'temperatura_ia': self.temperatura_ia,
            'transcricao_ativa': self.transcricao_ativa,
            'idioma_transcricao': self.idioma_transcricao,
            'atendimento_24h': self.atendimento_24h,
            'fuso_horario': self.fuso_horario,
            'webhook_url': self.webhook_url,
            'webhook_ativo': self.webhook_ativo,
            'salvar_conversas': self.salvar_conversas,
            'salvar_audios': self.salvar_audios,
            'tempo_retencao_dados': self.tempo_retencao_dados,
            'palavras_chave_agricultura': self.palavras_chave_agricultura.split(',') if self.palavras_chave_agricultura else [],
            'palavras_chave_pecuaria': self.palavras_chave_pecuaria.split(',') if self.palavras_chave_pecuaria else [],
            'palavras_chave_tecnologia': self.palavras_chave_tecnologia.split(',') if self.palavras_chave_tecnologia else [],
            'notificar_nova_conversa': self.notificar_nova_conversa,
            'notificar_lead_qualificado': self.notificar_lead_qualificado,
            'email_notificacoes': self.email_notificacoes,
            'data_criacao': self.data_criacao.isoformat() if self.data_criacao else None,
            'data_atualizacao': self.data_atualizacao.isoformat() if self.data_atualizacao else None
        }
    
    def get_prompt_completo(self, contexto_conversa=""):
        """Retorna o prompt completo para a IA"""
        prompt = self.prompt_sistema
        
        if self.prompt_contexto:
            prompt += f"\n\n{self.prompt_contexto}"
        
        if contexto_conversa:
            prompt += f"\n\nContexto da conversa:\n{contexto_conversa}"
        
        return prompt
    
    def __repr__(self):
        return f'<ConfiguracaoBot Cliente:{self.cliente_id}>'

