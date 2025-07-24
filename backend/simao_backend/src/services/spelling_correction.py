"""
Serviço de correção ortográfica especializado em português rural e termos de piscicultura
"""

import re
import logging
from typing import Dict, List, Optional, Tuple
from difflib import SequenceMatcher, get_close_matches
from .rural_dictionary import rural_dictionary

logger = logging.getLogger(__name__)

class SpellingCorrectionService:
    """
    Serviço inteligente de correção ortográfica que compreende:
    - Erros comuns de digitação em português rural
    - Variações regionais de pronuncia
    - Erros de transcrição de áudio
    - Termos técnicos de piscicultura
    """
    
    def __init__(self):
        # Dicionário base de palavras corretas em português
        self.dicionario_base = {
            # Palavras comuns
            'obrigado', 'muito', 'bom', 'dia', 'noite', 'tarde', 'como', 'está',
            'você', 'seu', 'dona', 'senhor', 'senhora', 'aqui', 'ali', 'onde',
            'quando', 'quanto', 'porque', 'para', 'com', 'sem', 'mais', 'menos',
            'melhor', 'pior', 'grande', 'pequeno', 'novo', 'velho', 'certo',
            'errado', 'sim', 'não', 'talvez', 'claro', 'problema', 'solução',
            'ajuda', 'dúvida', 'pergunta', 'resposta', 'informação', 'preço',
            'valor', 'comprar', 'vender', 'dinheiro', 'pagamento', 'dinheiro'
        }
        
        # Adicionar termos de piscicultura do dicionário rural
        for termo in rural_dictionary.termos_piscicultura.keys():
            self.dicionario_base.add(termo)
            
        # Adicionar variações dos termos
        for variacoes in rural_dictionary.termos_piscicultura.values():
            self.dicionario_base.update(variacoes)
        
        # Padrões comuns de erro em português rural
        self.padroes_erro = [
            # Troca de letras comuns
            (r'([ck])a([sz])a', r'\1a\2a'),  # casa/kasa
            (r'w', 'v'),                      # waca -> vaca
            (r'y', 'i'),                      # myor -> maior
            (r'ph', 'f'),                     # pharmacia -> farmacia
            
            # Supressão de letras
            (r'([aeiou])\1+', r'\1'),        # aaa -> a
            (r'([bcdfghjklmnpqrstvwxz])\1+', r'\1'), # nnn -> n
            
            # Acentuação
            (r'([aeiou])´', r'\1'),          # a´ -> a
            (r'([aeiou])`', r'\1'),          # a` -> a
            (r'([aeiou])\^', r'\1'),         # a^ -> a
            
            # Terminações comuns
            (r'u$', 'o'),                    # tanku -> tanko
            (r'i$', 'e'),                    # viveiri -> viveiro
            (r'ção$', 'são'),               # alimentação -> alimentação
        ]
        
        # Mapeamento de sons similares (erros de transcrição de áudio)
        self.sons_similares = {
            'ss': 's', 'ç': 's', 'c': 's', 'z': 's',
            'ch': 'x', 'sh': 'x',
            'nh': 'n', 'lh': 'l',
            'rr': 'r',
            'qu': 'k', 'gu': 'g',
            'j': 'g', 'ge': 'je', 'gi': 'ji',
        }
        
        # Correções específicas de áudio (Whisper pode transcrever errado)
        self.correcoes_audio = {
            'peixe': ['peixe', 'peace', 'peix', 'peach'],
            'água': ['água', 'agua', 'agra', 'águia'],
            'tilápia': ['tilápia', 'tilapia', 'tilaria', 'tilapa'],
            'tambaqui': ['tambaqui', 'tambaki', 'tambacu', 'tambaku'],
            'alevino': ['alevino', 'alevin', 'alevina', 'elevino'],
            'viveiro': ['viveiro', 'viveiru', 'vivero', 'bibeiro'],
            'ração': ['ração', 'racao', 'rasao', 'raxao'],
            'oxigênio': ['oxigênio', 'oxigenio', 'oxigeniu', 'oxigênio'],
            'pH': ['pH', 'pe agá', 'pê agá', 'peh', 'pe h'],
        }

    def corrigir_palavra(self, palavra: str, contexto: str = "") -> Tuple[str, float]:
        """
        Corrige uma palavra usando múltiplas estratégias
        Retorna: (palavra_corrigida, confiança)
        """
        palavra_original = palavra
        palavra_lower = palavra.lower().strip()
        
        # Se a palavra já está correta
        if palavra_lower in self.dicionario_base:
            return palavra, 1.0
        
        # Estratégia 1: Correções específicas de áudio
        for termo_correto, variacoes in self.correcoes_audio.items():
            for variacao in variacoes:
                if SequenceMatcher(None, palavra_lower, variacao.lower()).ratio() > 0.8:
                    return termo_correto, 0.9
        
        # Estratégia 2: Usar dicionário rural para sugerir correção
        sugestao_rural = rural_dictionary.sugerir_correcao(palavra_lower, True)
        if sugestao_rural:
            return sugestao_rural, 0.85
        
        # Estratégia 3: Aplicar padrões de erro comuns
        palavra_corrigida = self._aplicar_padroes_erro(palavra_lower)
        if palavra_corrigida != palavra_lower and palavra_corrigida in self.dicionario_base:
            return palavra_corrigida, 0.8
        
        # Estratégia 4: Busca por similaridade fonética
        correcao_fonetica = self._corrigir_fonetica(palavra_lower)
        if correcao_fonetica:
            return correcao_fonetica[0], correcao_fonetica[1]
        
        # Estratégia 5: Fuzzy matching com dicionário base
        matches = get_close_matches(palavra_lower, self.dicionario_base, n=1, cutoff=0.6)
        if matches:
            return matches[0], 0.7
        
        # Se não conseguiu corrigir, retorna a palavra original
        return palavra_original, 0.0

    def _aplicar_padroes_erro(self, palavra: str) -> str:
        """
        Aplica padrões de erro comuns para correção
        """
        palavra_corrigida = palavra
        
        for padrao, substituicao in self.padroes_erro:
            palavra_corrigida = re.sub(padrao, substituicao, palavra_corrigida)
        
        return palavra_corrigida

    def _corrigir_fonetica(self, palavra: str) -> Optional[Tuple[str, float]]:
        """
        Correção baseada em similaridade fonética
        """
        # Substituir sons similares
        palavra_fonetica = palavra
        for som_original, som_substituto in self.sons_similares.items():
            palavra_fonetica = palavra_fonetica.replace(som_original, som_substituto)
        
        # Procurar match no dicionário
        for termo_correto in self.dicionario_base:
            termo_fonetico = termo_correto
            for som_original, som_substituto in self.sons_similares.items():
                termo_fonetico = termo_fonetico.replace(som_original, som_substituto)
            
            if SequenceMatcher(None, palavra_fonetica, termo_fonetico).ratio() > 0.8:
                return termo_correto, 0.75
        
        return None

    def corrigir_mensagem(self, mensagem: str, preservar_original: bool = True) -> Dict[str, any]:
        """
        Corrige uma mensagem inteira, mantendo contexto e estrutura
        """
        resultado = {
            'mensagem_original': mensagem,
            'mensagem_corrigida': '',
            'correcoes': [],
            'confianca_geral': 0.0,
            'mudancas_significativas': False
        }
        
        # Tokenizar preservando pontuação e espaços
        tokens = re.findall(r'\b\w+\b|\W+', mensagem)
        tokens_corrigidos = []
        total_correcoes = 0
        soma_confianca = 0
        
        for token in tokens:
            if re.match(r'\b\w+\b', token):  # Se é uma palavra
                palavra_corrigida, confianca = self.corrigir_palavra(token, mensagem)
                
                if palavra_corrigida != token and confianca > 0.6:
                    resultado['correcoes'].append({
                        'original': token,
                        'corrigida': palavra_corrigida,
                        'confianca': confianca,
                        'posicao': len(''.join(tokens_corrigidos))
                    })
                    total_correcoes += 1
                    
                    # Decidir se usar correção ou preservar original
                    if preservar_original and confianca < 0.9:
                        tokens_corrigidos.append(token)  # Manter original se baixa confiança
                    else:
                        tokens_corrigidos.append(palavra_corrigida)
                else:
                    tokens_corrigidos.append(token)
                
                soma_confianca += confianca
            else:
                tokens_corrigidos.append(token)  # Manter pontuação e espaços
        
        resultado['mensagem_corrigida'] = ''.join(tokens_corrigidos)
        resultado['confianca_geral'] = soma_confianca / len([t for t in tokens if re.match(r'\b\w+\b', t)]) if tokens else 0
        resultado['mudancas_significativas'] = total_correcoes > 0
        
        return resultado

    def melhorar_transcricao_audio(self, transcricao: str, confianca_whisper: float = 0.0) -> Dict[str, any]:
        """
        Melhora transcrições de áudio do Whisper, especialmente para áudio rural
        """
        resultado = {
            'transcricao_original': transcricao,
            'transcricao_melhorada': '',
            'melhorias_aplicadas': [],
            'confianca_final': 0.0,
            'requer_confirmacao': False
        }
        
        # Se a confiança do Whisper é muito baixa, aplicar correções mais agressivas
        if confianca_whisper < 0.7:
            correcao = self.corrigir_mensagem(transcricao, preservar_original=False)
        else:
            correcao = self.corrigir_mensagem(transcricao, preservar_original=True)
        
        resultado['transcricao_melhorada'] = correcao['mensagem_corrigida']
        resultado['melhorias_aplicadas'] = correcao['correcoes']
        resultado['confianca_final'] = (confianca_whisper + correcao['confianca_geral']) / 2
        
        # Se muitas correções foram feitas ou confiança é baixa, sugerir confirmação
        if len(correcao['correcoes']) > 3 or resultado['confianca_final'] < 0.6:
            resultado['requer_confirmacao'] = True
        
        return resultado

    def gerar_pergunta_esclarecimento(self, palavra_problematica: str, contexto: str = "") -> str:
        """
        Gera uma pergunta natural para esclarecer uma palavra não compreendida
        """
        perguntas = [
            f"Desculpa, não entendi direito quando você falou '{palavra_problematica}'. Pode repetir de outro jeito?",
            f"Ô, essa palavra '{palavra_problematica}' eu não peguei bem. Como é mesmo?",
            f"Me ajuda aí, não consegui entender '{palavra_problematica}'. Pode falar de novo?",
            f"Rapaz, essa parte '{palavra_problematica}' não ficou clara pra mim. Explica melhor?",
            f"Ei, eu meio que me perdi na palavra '{palavra_problematica}'. Você pode repetir?"
        ]
        
        import random
        return random.choice(perguntas)

    def detectar_necessidade_correcao(self, mensagem: str) -> bool:
        """
        Detecta se uma mensagem precisa de correção significativa
        """
        # Contar palavras não reconhecidas
        palavras = re.findall(r'\b\w+\b', mensagem.lower())
        palavras_nao_reconhecidas = 0
        
        for palavra in palavras:
            if palavra not in self.dicionario_base:
                sugestao = rural_dictionary.sugerir_correcao(palavra)
                if not sugestao:
                    palavras_nao_reconhecidas += 1
        
        # Se mais de 30% das palavras não são reconhecidas, precisa correção
        if len(palavras) > 0:
            taxa_erro = palavras_nao_reconhecidas / len(palavras)
            return taxa_erro > 0.3
        
        return False

    def extrair_informacoes_mesmo_com_erros(self, mensagem: str) -> Dict[str, any]:
        """
        Extrai informações úteis mesmo de mensagens com muitos erros
        """
        # Primeiro, tentar corrigir a mensagem
        correcao = self.corrigir_mensagem(mensagem, preservar_original=False)
        mensagem_limpa = correcao['mensagem_corrigida']
        
        # Extrair informações da mensagem corrigida
        informacoes = {
            'termos_piscicultura': rural_dictionary.extrair_termos_tecnicos(mensagem_limpa),
            'intencoes': rural_dictionary.identificar_intencao_rural(mensagem_limpa),
            'urgencia': rural_dictionary.detectar_urgencia(mensagem_limpa),
            'confianca_extracao': correcao['confianca_geral']
        }
        
        # Se a confiança é muito baixa, marcar para confirmação
        if informacoes['confianca_extracao'] < 0.5:
            informacoes['requer_confirmacao'] = True
            informacoes['pergunta_esclarecimento'] = self.gerar_pergunta_esclarecimento(
                mensagem[:30] + "..." if len(mensagem) > 30 else mensagem
            )
        else:
            informacoes['requer_confirmacao'] = False
        
        return informacoes

# Instância global do serviço
spelling_service = SpellingCorrectionService()