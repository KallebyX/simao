import re
import logging
from typing import Dict, Optional, Tuple, List
from enum import Enum
import unidecode

logger = logging.getLogger(__name__)

class Gender(Enum):
    MASCULINO = "masculino"
    FEMININO = "feminino"
    NEUTRO = "neutro"

class RegionType(Enum):
    RURAL = "rural"
    URBANO = "urbano"
    MISTO = "misto"

class PersonalizationService:
    """
    Serviço de personalização para o Simão, focado em criar uma experiência
    calorosa e humanizada para clientes da piscicultura
    """
    
    def __init__(self):
        # Dicionário de nomes masculinos brasileiros (incluindo rurais)
        self.nomes_masculinos = {
            # Nomes comuns rurais
            'joao', 'jose', 'antonio', 'francisco', 'carlos', 'paulo', 'pedro', 'lucas', 'luiz', 'marcos',
            'rafael', 'daniel', 'marcelo', 'bruno', 'eduardo', 'felipe', 'rodrigo', 'manoel', 'manuel',
            'sebastiao', 'benedito', 'geraldo', 'osvaldo', 'waldemar', 'ademir', 'valdecir', 'valdir',
            'edson', 'nelson', 'wilson', 'edison', 'ailton', 'milton', 'gilson', 'jair', 'claudio',
            'sergio', 'mario', 'roberto', 'ricardo', 'renato', 'fernando', 'fabio', 'marcio', 'diego',
            # Nomes tipicamente rurais/interioranos
            'zeca', 'chico', 'beto', 'tiao', 'neco', 'dinho', 'zinho', 'tonho', 'chiquinho', 'pedrinho',
            'joaozinho', 'carlinhos', 'paulinho', 'luizinho', 'marquinho', 'juca', 'zezinho', 'nininho',
            'deco', 'duda', 'toni', 'tico', 'binho', 'digo', 'nando', 'bira', 'caco', 'guto'
        }
        
        # Dicionário de nomes femininos brasileiros (incluindo rurais)
        self.nomes_femininos = {
            # Nomes comuns rurais
            'maria', 'ana', 'francisca', 'antonia', 'adriana', 'juliana', 'patricia', 'marcela', 'fernanda',
            'amanda', 'aline', 'caroline', 'daniela', 'gabriela', 'isabella', 'jessica', 'larissa',
            'leticia', 'mariana', 'natalia', 'priscila', 'rafaela', 'sabrina', 'tatiana', 'vanessa',
            'aparecida', 'conceicao', 'fatima', 'helena', 'isabel', 'josefa', 'lucia', 'rosa', 'teresa',
            'benedita', 'madalena', 'sebastiana', 'gertrudes', 'mercedes', 'socorro', 'nazare', 'gloria',
            # Nomes tipicamente rurais/interioranos
            'mariquinha', 'aninha', 'chiquinha', 'mariazinha', 'rosinha', 'terezinha', 'lurdinha',
            'fatiminha', 'neninha', 'dinha', 'nena', 'nina', 'zezinha', 'tia', 'dona', 'sinhá',
            'nega', 'morena', 'pretinha', 'branquinha', 'loura', 'ruiva'
        }
        
        # Expressões rurais brasileiras por região
        self.expressoes_rurais = {
            'saudacao': [
                "E aí, como que tá?", "Ô, tudo certinho?", "Como é que vai a coisa?", 
                "Tudo na paz?", "Como tá a família?", "Tudo de boa?",
                "Ô de casa!", "Como que tá o movimento?", "Tudo bem por aí?",
                "Como vai essa força?", "Tudo jóia?", "E aí, beleza?"
            ],
            'despedida': [
                "Fica na paz!", "Até mais ver!", "Tchau e obrigado!",
                "Vai com Deus!", "Até logo mais!", "Abraço forte!",
                "Sucesso aí!", "Fica bem!", "Até a próxima!",
                "Deus abençoe!", "Muito obrigado mesmo!", "Valeu demais!"
            ],
            'concordancia': [
                "Isso mesmo!", "Exato!", "Pode crer!", "É assim mesmo!",
                "Tá certinho!", "Perfeito!", "É isso aí!", "Claro que sim!",
                "Sem dúvida!", "Com certeza!", "Aí sim!", "Opa, show!"
            ],
            'empolgacao': [
                "Ô loco!", "Muito bom!", "Que legal!", "Bacana demais!",
                "Show de bola!", "Massa!", "Que coisa boa!", "Perfeito!",
                "Sensacional!", "Top demais!", "Arrasou!", "Mandou bem!"
            ],
            'tranquilizacao': [
                "Fica tranquilo", "Relaxa aí", "Sem stress", "Fica de boa",
                "Não esquenta", "Deixa comigo", "Pode confiar", "Tá tudo certo",
                "Sem problemas", "Tá garantido", "Confia em mim", "Já era!"
            ]
        }
        
        # Termos técnicos de piscicultura com variações rurais
        self.termos_piscicultura = {
            'alevinos': ['alevino', 'alevin', 'peixinho', 'filhote', 'filhotinho'],
            'viveiro': ['viveiro', 'tanque', 'açude', 'lago', 'lagoa', 'barragem'],
            'tilapia': ['tilapia', 'tilapias', 'tilaria', 'tilápia', 'tilápias'],
            'tambaqui': ['tambaqui', 'tambaquis', 'tambaki', 'tambacu'],
            'racao': ['ração', 'racao', 'comida', 'trato', 'alimento'],
            'qualidade_agua': ['água', 'agua', 'ph', 'oxigenio', 'oxigênio', 'temperatura']
        }

    def detectar_genero_nome(self, nome: str) -> Gender:
        """
        Detecta o gênero baseado no nome fornecido
        """
        if not nome:
            return Gender.NEUTRO
            
        # Normalizar nome (remover acentos, converter para minúscula)
        nome_normalizado = unidecode.unidecode(nome.lower().strip())
        
        # Pegar primeiro nome
        primeiro_nome = nome_normalizado.split()[0] if nome_normalizado.split() else nome_normalizado
        
        # Verificar listas de nomes
        if primeiro_nome in self.nomes_masculinos:
            return Gender.MASCULINO
        elif primeiro_nome in self.nomes_femininos:
            return Gender.FEMININO
        
        # Heurísticas para nomes não catalogados
        if primeiro_nome.endswith(('a', 'inha', 'ita', 'ete', 'iana')):
            return Gender.FEMININO
        elif primeiro_nome.endswith(('o', 'inho', 'ito', 'son', 'ton')):
            return Gender.MASCULINO
            
        return Gender.NEUTRO

    def gerar_tratamento_personalizado(self, nome: str, genero: Optional[Gender] = None) -> str:
        """
        Gera o tratamento personalizado baseado no gênero
        Ex: "Seu João", "Dona Maria"
        """
        if not nome:
            return "amigo"
            
        if not genero:
            genero = self.detectar_genero_nome(nome)
        
        primeiro_nome = nome.split()[0] if nome.split() else nome
        primeiro_nome_capitalizado = primeiro_nome.capitalize()
        
        if genero == Gender.MASCULINO:
            return f"Seu {primeiro_nome_capitalizado}"
        elif genero == Gender.FEMININO:
            return f"Dona {primeiro_nome_capitalizado}"
        else:
            return primeiro_nome_capitalizado

    def detectar_regiao_linguagem(self, mensagem: str) -> RegionType:
        """
        Detecta se a linguagem usada é mais rural ou urbana
        """
        mensagem_lower = mensagem.lower()
        
        # Indicadores rurais
        indicadores_rurais = [
            'ocê', 'vosmicê', 'seo', 'seu', 'dona', 'sinhá', 'sinhô',
            'arrodiado', 'prantação', 'criaçao', 'gado', 'porco', 'galinha',
            'roça', 'sitio', 'fazenda', 'chácara', 'lote', 'hectare',
            'trator', 'enxada', 'arado', 'cerca', 'porteira', 'curral'
        ]
        
        # Indicadores urbanos
        indicadores_urbanos = [
            'você', 'senhor', 'senhora', 'apartamento', 'prédio',
            'empresa', 'escritório', 'corporativo', 'profissional'
        ]
        
        pontos_rurais = sum(1 for indicador in indicadores_rurais if indicador in mensagem_lower)
        pontos_urbanos = sum(1 for indicador in indicadores_urbanos if indicador in mensagem_lower)
        
        if pontos_rurais > pontos_urbanos:
            return RegionType.RURAL
        elif pontos_urbanos > pontos_rurais:
            return RegionType.URBANO
        else:
            return RegionType.MISTO

    def personalizar_resposta(self, resposta_base: str, nome: str, genero: Optional[Gender] = None, 
                             tipo_regiao: Optional[RegionType] = None) -> str:
        """
        Personaliza uma resposta com o tratamento adequado e expressões regionais
        """
        if not genero:
            genero = self.detectar_genero_nome(nome)
            
        tratamento = self.gerar_tratamento_personalizado(nome, genero)
        
        # Substituir placeholder {nome} na resposta
        resposta_personalizada = resposta_base.replace('{nome}', tratamento)
        resposta_personalizada = resposta_personalizada.replace('{tratamento}', tratamento)
        
        # Adicionar expressões rurais se necessário
        if tipo_regiao == RegionType.RURAL:
            # Adicionar um pouco de calor rural na linguagem
            if not any(expr in resposta_personalizada.lower() for expr in ['ô', 'aí', 'né']):
                if genero == Gender.MASCULINO:
                    resposta_personalizada = f"Ô {tratamento}, {resposta_personalizada.lower()}"
                else:
                    resposta_personalizada = f"{tratamento}, {resposta_personalizada.lower()}"
        
        return resposta_personalizada

    def extrair_informacoes_pessoais(self, mensagem: str) -> Dict[str, any]:
        """
        Extrai informações pessoais da mensagem (nome, telefone, localização)
        """
        informacoes = {}
        
        # Extrair possíveis nomes (palavras capitalizadas)
        nomes_pattern = r'\b[A-ZÁÀÃÂÉÊÍÔÕÚÇ][a-záàãâéêíîôõúûç]+\b'
        possveis_nomes = re.findall(nomes_pattern, mensagem)
        
        if possveis_nomes:
            # Filtrar nomes que não sejam stop words
            stop_words = {'Bom', 'Boa', 'Muito', 'Aqui', 'Esse', 'Essa', 'Como', 'Quando', 'Onde'}
            nomes_filtrados = [nome for nome in possveis_nomes if nome not in stop_words]
            if nomes_filtrados:
                informacoes['possivel_nome'] = nomes_filtrados[0]
                informacoes['genero'] = self.detectar_genero_nome(nomes_filtrados[0])
        
        # Extrair telefones
        telefone_pattern = r'\b(?:\+55\s?)?(?:\(?[1-9]{2}\)?\s?)?(?:9\s?)?[0-9]{4}-?[0-9]{4}\b'
        telefones = re.findall(telefone_pattern, mensagem)
        if telefones:
            informacoes['telefone'] = telefones[0]
        
        # Detectar região da linguagem
        informacoes['tipo_regiao'] = self.detectar_regiao_linguagem(mensagem)
        
        return informacoes

    def gerar_saudacao_personalizada(self, nome: str, genero: Optional[Gender] = None, 
                                   primeira_vez: bool = True) -> str:
        """
        Gera uma saudação calorosa e personalizada
        """
        if not genero:
            genero = self.detectar_genero_nome(nome)
            
        tratamento = self.gerar_tratamento_personalizado(nome, genero)
        
        if primeira_vez:
            saudacoes = [
                f"Olá {tratamento}! Seja muito bem-vindo! Eu sou o Simão, seu assistente para alevinos. Como posso ajudar hoje?",
                f"Ô {tratamento}, que bom ter você aqui! Sou o Simão e estou aqui pra te ajudar com os melhores alevinos. Em que posso ser útil?",
                f"E aí {tratamento}, tudo certinho? Aqui é o Simão, especialista em alevinos. Vamos conversar sobre seus peixes?",
                f"Olá {tratamento}! É um prazer conhecer! Eu sou o Simão e adoro ajudar quem trabalha com piscicultura. Como posso ajudar?"
            ]
        else:
            saudacoes = [
                f"Ô {tratamento}, que bom ter você de volta! Como posso ajudar hoje?",
                f"Olá novamente {tratamento}! Sempre um prazer conversar. Em que posso ser útil?",
                f"E aí {tratamento}, como vai? Espero que os peixes estejam crescendo bem! O que precisa hoje?",
                f"{tratamento}, fico feliz em vê-lo novamente! Como posso ajudar dessa vez?"
            ]
        
        import random
        return random.choice(saudacoes)

    def gerar_despedida_personalizada(self, nome: str, genero: Optional[Gender] = None, 
                                    vendeu: bool = False) -> str:
        """
        Gera uma despedida calorosa e personalizada
        """
        if not genero:
            genero = self.detectar_genero_nome(nome)
            
        tratamento = self.gerar_tratamento_personalizado(nome, genero)
        
        if vendeu:
            despedidas = [
                f"Muito obrigado {tratamento}! Foi um prazer te atender. Seus alevinos vão chegar certinho e com toda qualidade. Fica na paz!",
                f"{tratamento}, muito sucesso com sua criação! Qualquer dúvida, pode chamar que estarei sempre aqui. Abraço forte!",
                f"Ô {tratamento}, obrigado pela confiança! Tenho certeza que vai dar tudo certo. Até mais e muito sucesso!",
                f"Valeu demais {tratamento}! Seus alevinos estão garantidos. Deus abençoe sua piscicultura!"
            ]
        else:
            despedidas = [
                f"{tratamento}, foi um prazer conversar! Qualquer coisa pode chamar que estarei aqui. Fica bem!",
                f"Ô {tratamento}, espero ter ajudado! Quando quiser conversar sobre alevinos, é só chamar. Abraço!",
                f"Até logo {tratamento}! Estarei sempre aqui quando precisar. Vai com Deus!",
                f"{tratamento}, obrigado pela conversa! Até a próxima, fica na paz!"
            ]
        
        import random
        return random.choice(despedidas)

    def adicionar_warmth_resposta(self, resposta: str, nome: str, contexto: str = "") -> str:
        """
        Adiciona calor humano e empatia às respostas técnicas
        """
        tratamento = self.gerar_tratamento_personalizado(nome)
        
        # Expressões de calor para diferentes contextos
        warmth_phrases = {
            'duvida': [
                f"Fica tranquilo {tratamento}, é normal ter essas dúvidas!",
                f"{tratamento}, que bom que perguntou! É sempre melhor tirar as dúvidas, né?",
                f"Perfeito {tratamento}! Adoro quando o pessoal pergunta, assim evita problema depois."
            ],
            'problema': [
                f"Ô {tratamento}, entendo sua preocupação. Vamos resolver isso juntos!",
                f"{tratamento}, não se preocupe. Isso tem solução sim!",
                f"Relaxa {tratamento}, já passei por isso muitas vezes. Tem jeito!"
            ],
            'interesse': [
                f"Que bom {tratamento}! Fico feliz com seu interesse!",
                f"Opa {tratamento}, gostei de ver esse entusiasmo!",
                f"Show {tratamento}! Você tem bom olho para negócio!"
            ]
        }
        
        # Detectar contexto se não foi fornecido
        if not contexto:
            if any(palavra in resposta.lower() for palavra in ['dúvida', 'pergunta', 'como', 'quando']):
                contexto = 'duvida'
            elif any(palavra in resposta.lower() for palavra in ['problema', 'erro', 'dificuldade']):
                contexto = 'problema'
            elif any(palavra in resposta.lower() for palavra in ['interesse', 'quero', 'preciso']):
                contexto = 'interesse'
        
        if contexto in warmth_phrases:
            import random
            warmth = random.choice(warmth_phrases[contexto])
            resposta = f"{warmth} {resposta}"
        
        return resposta

# Instância global do serviço
personalization_service = PersonalizationService()