"""
Dicionário de expressões rurais brasileiras e variações linguísticas
para melhor compreensão de clientes da piscicultura
"""

import re
from typing import Dict, List, Optional, Tuple
from difflib import SequenceMatcher

class RuralDictionary:
    """
    Serviço para normalizar e compreender expressões rurais brasileiras,
    erros de digitação comuns e variações linguísticas regionais
    """
    
    def __init__(self):
        # Expressões rurais brasileiras com seus equivalentes padronizados
        self.expressoes_rurais = {
            # Saudações e cumprimentos
            'e aí': ['e ai', 'eae', 'eai', 'e ae', 'iae'],
            'tudo bem': ['tudo bom', 'tudo certo', 'tudo joia', 'tudo jóia', 'tudo beleza'],
            'como vai': ['como que tá', 'como tá', 'como que vai', 'comu vai'],
            'oi': ['ôi', 'oie', 'oii', 'ooii'],
            'tchau': ['xau', 'chau', 'tchal', 'falou'],
            'obrigado': ['brigado', 'obrigad', 'vlw', 'valeu'],
            
            # Expressões de confirmação
            'sim': ['si', 'isso', 'é', 'eh', 'ahan', 'uhum', 'aham'],
            'não': ['nao', 'num', 'nao é', 'nada'],
            'certo': ['serto', 'certu', 'tá certo', 'ta certo'],
            'pode ser': ['pode se', 'podi ser', 'podi se'],
            
            # Variações de "você"
            'você': ['voce', 'vc', 'ocê', 'cê', 'tu', 'vosmicê'],
            'vocês': ['vcs', 'ocês', 'cês', 'vosmicês'],
            
            # Expressões de posse/tratamento
            'seu': ['seo', 'se', 'sô'],
            'dona': ['dna', 'd.'],
            'senhor': ['sr', 'sô', 'seo'],
            'senhora': ['sra', 'srª'],
            
            # Expressões temporais
            'agora': ['gora', 'agor', 'agr'],
            'hoje': ['hj', 'hoji'],
            'amanhã': ['amanha', 'manhã'],
            'ontem': ['onte', 'onti'],
            
            # Expressões de quantidade
            'muito': ['mt', 'mto', 'mutu', 'mu'],
            'pouco': ['poku', 'pokinho', 'poquinho'],
            'bastante': ['bastanti', 'bastonti'],
            
            # Expressões de lugar
            'aqui': ['aki', 'qui'],
            'ali': ['ái', 'ai'],
            'aí': ['ai', 'ae'],
            'lá': ['la', 'lar']
        }
        
        # Termos específicos de piscicultura com variações comuns
        self.termos_piscicultura = {
            # Peixes e alevinos
            'alevino': ['alevin', 'alevinhu', 'peixinho', 'filhote', 'filhotinho'],
            'alevinos': ['alevins', 'alevinhos', 'peixinhos', 'filhotes', 'filhotinhos'],
            'tilápia': ['tilapia', 'tilaria', 'tilapa', 'tirapía'],
            'tilápias': ['tilapias', 'tilarias', 'tilapas', 'tirapías'],
            'tambaqui': ['tambaki', 'tambaquis', 'tambaku', 'tambacu'],
            'pirarucu': ['pirauku', 'piraruku', 'pirarucu'],
            'pintado': ['pintadu', 'pintado'],
            'pacu': ['paku', 'pacu'],
            'bagre': ['bagri', 'bagre'],
            'dourado': ['dourao', 'dourado'],
            'traíra': ['traira', 'traíra'],
            'tucunaré': ['tucunare', 'tucumare', 'tucumañé'],
            
            # Estruturas aquícolas
            'viveiro': ['viveiru', 'viveru', 'tanque', 'açude', 'açudi'],
            'viveiros': ['viveirus', 'viverus', 'tanques', 'açudes', 'açudis'],
            'tanque': ['tanki', 'tanque'],
            'tanques': ['tankis', 'tanques'],
            'açude': ['asude', 'assude', 'açudi'],
            'lagoa': ['lagua', 'lágua'],
            'barragem': ['barrage', 'barragi'],
            'represa': ['repreza', 'represa'],
            'lago': ['lagu', 'lago'],
            
            # Manejo e alimentação
            'ração': ['racao', 'rasao', 'rasaum', 'comida', 'trato'],
            'alimentar': ['alimenta', 'da comida', 'dar trato'],
            'alimentação': ['alimentacao', 'comida', 'trato'],
            'biometria': ['biometria', 'pesage', 'pesagem', 'pesar peixe'],
            'despesca': ['despesca', 'colheita', 'pesca'],
            'povoamento': ['povoamentu', 'colocar peixe', 'soltar peixe'],
            
            # Qualidade da água
            'água': ['agua', 'águia', 'ágia'],
            'ph': ['pê agá', 'pe aga', 'acidez'],
            'oxigênio': ['oxigenio', 'oxigeniu', 'ar na água'],
            'amônia': ['amonia', 'amonia'],
            'nitrito': ['nitritu', 'nitrito'],
            'temperatura': ['temperatura', 'temperatur', 'calor da água'],
            
            # Equipamentos
            'aerador': ['areador', 'areadô', 'ventilador de água'],
            'filtro': ['filtru', 'filtro'],
            'bomba': ['bomba', 'bomba d\'água'],
            'compressor': ['compressô', 'comprenssor'],
            'rede': ['redi', 'rede', 'tarrafa'],
            
            # Doenças e problemas
            'doença': ['doensa', 'doensa', 'problema'],
            'mortalidade': ['mortalidadi', 'morte de peixe', 'peixe morto'],
            'fungos': ['fungu', 'fungo', 'limo'],
            'bactérias': ['bacteria', 'bacterias'],
            'parasitas': ['parasita', 'verme'],
            
            # Reprodução
            'reprodução': ['reproducao', 'criar', 'criaçao'],
            'desova': ['dizova', 'desova', 'botar ovo'],
            'larva': ['larva', 'larvinha'],
            'juvenil': ['juvenil', 'jovem'],
            'reprodutor': ['reprodutô', 'matriz', 'pai', 'mãe'],
            
            # Comercialização
            'venda': ['venda', 'vende'],
            'compra': ['compra', 'comprar'],
            'preço': ['preco', 'valor', 'quanto custa'],
            'lucro': ['lukro', 'ganho', 'rendimento'],
            'mercado': ['mercadu', 'feira', 'vender'],
            
            # Medidas e quantidades
            'metro': ['metru', 'm'],
            'hectare': ['hectari', 'alqueire', 'ha'],
            'litro': ['litru', 'l'],
            'quilo': ['kilo', 'kg'],
            'gramas': ['grama', 'g'],
            'centímetro': ['centimetru', 'cm'],
            'densidade': ['densidadi', 'quantidade por metro'],
        }
        
        # Erros ortográficos comuns em português rural
        self.correcoes_ortograficas = {
            # Troca de letras comuns
            'k': 'c',  # kasa -> casa
            'w': 'v',  # waca -> vaca
            'y': 'i',  # myor -> maior
            
            # Terminações comuns
            'u': 'o',  # tanku -> tanko
            'i': 'e',  # viveiru -> viveiro
            
            # Supressão de letras
            'nh': 'n',  # peixinho -> peixino
            'll': 'l', # aquella -> aquela
            'rr': 'r', # carro -> caro
            'ss': 's', # passo -> paso
        }
        
        # Expressões de emoção e reação
        self.expressoes_emocao = {
            'alegria': ['que bom!', 'opa!', 'show!', 'massa!', 'top!', 'bacana!'],
            'surpresa': ['nossa!', 'caramba!', 'eita!', 'ô loco!'],
            'preocupacao': ['eita', 'xi', 'rapaz', 'puxa'],
            'concordancia': ['exato!', 'isso aí!', 'pode crer!', 'é isso mesmo!'],
            'negacao': ['que nada!', 'não é não!', 'imagina!']
        }

    def normalizar_mensagem(self, mensagem: str) -> str:
        """
        Normaliza uma mensagem rural para melhor compreensão
        """
        mensagem_normalizada = mensagem.lower().strip()
        
        # Aplicar correções ortográficas comuns
        for erro, correcao in self.correcoes_ortograficas.items():
            mensagem_normalizada = mensagem_normalizada.replace(erro, correcao)
        
        # Substituir expressões rurais por equivalentes padronizados
        for padrao, variacoes in self.expressoes_rurais.items():
            for variacao in variacoes:
                mensagem_normalizada = mensagem_normalizada.replace(variacao, padrao)
        
        # Substituir termos técnicos de piscicultura
        for termo_padrao, variacoes in self.termos_piscicultura.items():
            for variacao in variacoes:
                mensagem_normalizada = mensagem_normalizada.replace(variacao, termo_padrao)
        
        return mensagem_normalizada

    def identificar_intencao_rural(self, mensagem: str) -> Dict[str, any]:
        """
        Identifica intenções específicas baseadas em linguajar rural
        """
        mensagem_lower = mensagem.lower()
        intencoes = {
            'interesse_compra': False,
            'duvida_tecnica': False,
            'problema_criacao': False,
            'saudacao': False,
            'despedida': False,
            'confirmacao': False,
            'emocao': None,
            'confianca': 'alta'  # alta, media, baixa
        }
        
        # Detectar interesse de compra
        palavras_compra = ['quero', 'preciso', 'interesse', 'comprar', 'quanto', 'preço', 'valor']
        if any(palavra in mensagem_lower for palavra in palavras_compra):
            intencoes['interesse_compra'] = True
        
        # Detectar dúvidas técnicas
        palavras_duvida = ['como', 'quando', 'onde', 'porque', 'dúvida', 'ajuda', 'explica']
        if any(palavra in mensagem_lower for palavra in palavras_duvida):
            intencoes['duvida_tecnica'] = True
        
        # Detectar problemas na criação
        palavras_problema = ['morreu', 'morrendo', 'doente', 'problema', 'ruim', 'não tá bem']
        if any(palavra in mensagem_lower for palavra in palavras_problema):
            intencoes['problema_criacao'] = True
        
        # Detectar saudações
        palavras_saudacao = ['oi', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'e aí']
        if any(palavra in mensagem_lower for palavra in palavras_saudacao):
            intencoes['saudacao'] = True
        
        # Detectar despedidas
        palavras_despedida = ['tchau', 'até logo', 'falou', 'obrigado', 'valeu']
        if any(palavra in mensagem_lower for palavra in palavras_despedida):
            intencoes['despedida'] = True
        
        # Detectar confirmações
        palavras_confirmacao = ['sim', 'isso', 'certo', 'pode ser', 'tá bom']
        if any(palavra in mensagem_lower for palavra in palavras_confirmacao):
            intencoes['confirmacao'] = True
        
        # Detectar emoções
        for emocao, expressoes in self.expressoes_emocao.items():
            if any(expr.replace('!', '') in mensagem_lower for expr in expressoes):
                intencoes['emocao'] = emocao
                break
        
        # Avaliar nível de confiança baseado na linguagem
        palavras_alta_confianca = ['pode crer', 'confio', 'beleza', 'fechado', 'combinado']
        palavras_baixa_confianca = ['não sei', 'talvez', 'será', 'dúvida', 'receio']
        
        if any(palavra in mensagem_lower for palavra in palavras_alta_confianca):
            intencoes['confianca'] = 'alta'
        elif any(palavra in mensagem_lower for palavra in palavras_baixa_confianca):
            intencoes['confianca'] = 'baixa'
        else:
            intencoes['confianca'] = 'media'
        
        return intencoes

    def extrair_termos_tecnicos(self, mensagem: str) -> List[str]:
        """
        Extrai termos técnicos de piscicultura mencionados na mensagem
        """
        mensagem_lower = mensagem.lower()
        termos_encontrados = []
        
        for termo_padrao, variacoes in self.termos_piscicultura.items():
            # Verificar termo padrão
            if termo_padrao in mensagem_lower:
                termos_encontrados.append(termo_padrao)
            # Verificar variações
            else:
                for variacao in variacoes:
                    if variacao in mensagem_lower:
                        termos_encontrados.append(termo_padrao)
                        break
        
        return list(set(termos_encontrados))  # Remove duplicatas

    def sugerir_correcao(self, palavra: str, contexto_piscicultura: bool = True) -> Optional[str]:
        """
        Sugere correção para uma palavra usando similaridade e contexto
        """
        palavra_lower = palavra.lower()
        
        # Dicionário base para comparação
        if contexto_piscicultura:
            dicionario = set(self.termos_piscicultura.keys())
            # Adicionar variações também
            for variacoes in self.termos_piscicultura.values():
                dicionario.update(variacoes)
        else:
            dicionario = set(self.expressoes_rurais.keys())
            for variacoes in self.expressoes_rurais.values():
                dicionario.update(variacoes)
        
        melhor_match = None
        melhor_score = 0
        
        for termo in dicionario:
            score = SequenceMatcher(None, palavra_lower, termo.lower()).ratio()
            if score > melhor_score and score > 0.6:  # Pelo menos 60% de similaridade
                melhor_score = score
                melhor_match = termo
        
        return melhor_match if melhor_match else None

    def adaptar_linguagem_resposta(self, resposta: str, nivel_rural: str = 'medio') -> str:
        """
        Adapta a linguagem da resposta para o nível rural do cliente
        - alto: Muito rural, muitas expressões do interior
        - medio: Equilibrado entre técnico e rural
        - baixo: Mais técnico, menos rural
        """
        if nivel_rural == 'alto':
            # Adicionar mais expressões rurais
            resposta = resposta.replace('muito bom', 'show de bola')
            resposta = resposta.replace('correto', 'certinho')
            resposta = resposta.replace('perfeito', 'massa')
            resposta = resposta.replace('exatamente', 'é isso aí')
            
        elif nivel_rural == 'baixo':
            # Manter linguagem mais técnica mas amigável
            resposta = resposta.replace('ô', 'olha')
            resposta = resposta.replace('né?', 'não é mesmo?')
            resposta = resposta.replace('tá', 'está')
        
        return resposta

    def detectar_urgencia(self, mensagem: str) -> str:
        """
        Detecta o nível de urgência da mensagem
        Retorna: 'alta', 'media', 'baixa'
        """
        mensagem_lower = mensagem.lower()
        
        # Palavras que indicam alta urgência
        alta_urgencia = [
            'urgente', 'rápido', 'agora', 'hoje', 'já', 'morrendo', 
            'doente', 'problema grave', 'ajuda', 'socorro'
        ]
        
        # Palavras que indicam urgência média
        media_urgencia = [
            'preciso', 'importante', 'quando', 'logo', 'breve', 'essa semana'
        ]
        
        if any(palavra in mensagem_lower for palavra in alta_urgencia):
            return 'alta'
        elif any(palavra in mensagem_lower for palavra in media_urgencia):
            return 'media'
        else:
            return 'baixa'

# Instância global do serviço
rural_dictionary = RuralDictionary()