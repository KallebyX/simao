import os
import requests
import logging
import time
from typing import Dict, Optional, List
import json

logger = logging.getLogger(__name__)

class WPPConnectService:
    def __init__(self):
        self.base_url = os.getenv('WPPCONNECT_URL', 'http://localhost:21465')
        self.secret_key = os.getenv('WPPCONNECT_SECRET_KEY', 'wppconnect_secret_simao_2024')
        self.session_name = os.getenv('WPPCONNECT_SESSION', 'simao_session')
        self.token = None
        self.token_expires = 0
        
        # Configurações de timeout
        self.timeout = 30
        self.retry_attempts = 3
        
    def _get_headers(self) -> Dict[str, str]:
        """Retorna headers para requisições"""
        headers = {
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        
        if self.token:
            headers['Authorization'] = f'Bearer {self.token}'
        
        return headers
    
    def _make_request(self, method: str, endpoint: str, data: Dict = None) -> Dict:
        """Faz requisição para a API do WPPConnect"""
        url = f"{self.base_url}{endpoint}"
        headers = self._get_headers()
        
        for attempt in range(self.retry_attempts):
            try:
                if method.upper() == 'GET':
                    response = requests.get(url, headers=headers, timeout=self.timeout)
                elif method.upper() == 'POST':
                    response = requests.post(url, headers=headers, json=data, timeout=self.timeout)
                elif method.upper() == 'PUT':
                    response = requests.put(url, headers=headers, json=data, timeout=self.timeout)
                elif method.upper() == 'DELETE':
                    response = requests.delete(url, headers=headers, timeout=self.timeout)
                else:
                    raise ValueError(f"Método HTTP não suportado: {method}")
                
                # Log da requisição
                logger.debug(f"{method} {url} - Status: {response.status_code}")
                
                if response.status_code == 401:
                    # Token expirado, tentar renovar
                    if self.generate_token():
                        continue  # Tentar novamente com novo token
                    else:
                        raise Exception("Falha na autenticação com WPPConnect")
                
                response.raise_for_status()
                return response.json()
                
            except requests.exceptions.RequestException as e:
                logger.warning(f"Tentativa {attempt + 1} falhou: {e}")
                if attempt == self.retry_attempts - 1:
                    raise
                time.sleep(1)  # Aguardar antes de tentar novamente
        
        raise Exception("Todas as tentativas de requisição falharam")
    
    def generate_token(self) -> bool:
        """Gera token de autenticação"""
        try:
            endpoint = f"/api/{self.session_name}/generate-token"
            data = {"secret": self.secret_key}
            
            # Fazer requisição sem token
            url = f"{self.base_url}{endpoint}"
            headers = {'Content-Type': 'application/json'}
            
            response = requests.post(url, headers=headers, json=data, timeout=self.timeout)
            response.raise_for_status()
            
            result = response.json()
            
            if result.get('status') == 'success' and 'token' in result:
                self.token = result['token']
                self.token_expires = time.time() + 3600  # Token válido por 1 hora
                logger.info("Token WPPConnect gerado com sucesso")
                return True
            else:
                logger.error(f"Erro ao gerar token: {result}")
                return False
                
        except Exception as e:
            logger.error(f"Erro ao gerar token WPPConnect: {e}")
            return False
    
    def ensure_token(self) -> bool:
        """Garante que temos um token válido"""
        if not self.token or time.time() >= self.token_expires:
            return self.generate_token()
        return True
    
    def start_session(self) -> Dict:
        """Inicia sessão do WhatsApp"""
        if not self.ensure_token():
            raise Exception("Falha na autenticação")
        
        endpoint = f"/api/{self.session_name}/start-session"
        return self._make_request('POST', endpoint)
    
    def get_session_status(self) -> Dict:
        """Verifica status da sessão"""
        if not self.ensure_token():
            raise Exception("Falha na autenticação")
        
        endpoint = f"/api/{self.session_name}/status-session"
        return self._make_request('GET', endpoint)
    
    def get_qr_code(self) -> Dict:
        """Obtém QR Code para autenticação"""
        if not self.ensure_token():
            raise Exception("Falha na autenticação")
        
        endpoint = f"/api/{self.session_name}/start-session"
        return self._make_request('POST', endpoint)
    
    def send_text_message(self, phone: str, message: str) -> Dict:
        """
        Envia mensagem de texto
        
        Args:
            phone: Número do telefone (formato: 5511999999999)
            message: Texto da mensagem
        
        Returns:
            Dict com resposta da API
        """
        if not self.ensure_token():
            raise Exception("Falha na autenticação")
        
        # Formatar número se necessário
        phone = self._format_phone(phone)
        
        endpoint = f"/api/{self.session_name}/send-message"
        data = {
            "phone": phone,
            "message": message
        }
        
        logger.info(f"Enviando mensagem para {phone}")
        return self._make_request('POST', endpoint, data)
    
    def send_audio_message(self, phone: str, audio_path: str) -> Dict:
        """
        Envia mensagem de áudio
        
        Args:
            phone: Número do telefone
            audio_path: Caminho para o arquivo de áudio
        
        Returns:
            Dict com resposta da API
        """
        if not self.ensure_token():
            raise Exception("Falha na autenticação")
        
        phone = self._format_phone(phone)
        
        endpoint = f"/api/{self.session_name}/send-voice"
        data = {
            "phone": phone,
            "path": audio_path
        }
        
        return self._make_request('POST', endpoint, data)
    
    def send_image_message(self, phone: str, image_path: str, caption: str = "") -> Dict:
        """
        Envia mensagem com imagem
        
        Args:
            phone: Número do telefone
            image_path: Caminho para a imagem
            caption: Legenda da imagem
        
        Returns:
            Dict com resposta da API
        """
        if not self.ensure_token():
            raise Exception("Falha na autenticação")
        
        phone = self._format_phone(phone)
        
        endpoint = f"/api/{self.session_name}/send-image"
        data = {
            "phone": phone,
            "path": image_path,
            "caption": caption
        }
        
        return self._make_request('POST', endpoint, data)
    
    def send_document_message(self, phone: str, document_path: str, filename: str = "") -> Dict:
        """
        Envia documento
        
        Args:
            phone: Número do telefone
            document_path: Caminho para o documento
            filename: Nome do arquivo
        
        Returns:
            Dict com resposta da API
        """
        if not self.ensure_token():
            raise Exception("Falha na autenticação")
        
        phone = self._format_phone(phone)
        
        endpoint = f"/api/{self.session_name}/send-file"
        data = {
            "phone": phone,
            "path": document_path,
            "filename": filename or os.path.basename(document_path)
        }
        
        return self._make_request('POST', endpoint, data)
    
    def get_all_chats(self) -> Dict:
        """Obtém todas as conversas"""
        if not self.ensure_token():
            raise Exception("Falha na autenticação")
        
        endpoint = f"/api/{self.session_name}/all-chats"
        return self._make_request('GET', endpoint)
    
    def get_chat_messages(self, phone: str, count: int = 50) -> Dict:
        """
        Obtém mensagens de uma conversa
        
        Args:
            phone: Número do telefone
            count: Quantidade de mensagens
        
        Returns:
            Dict com mensagens
        """
        if not self.ensure_token():
            raise Exception("Falha na autenticação")
        
        phone = self._format_phone(phone)
        
        endpoint = f"/api/{self.session_name}/get-messages/{phone}"
        data = {"count": count}
        
        return self._make_request('POST', endpoint, data)
    
    def set_webhook(self, webhook_url: str) -> Dict:
        """
        Configura webhook para receber mensagens
        
        Args:
            webhook_url: URL do webhook
        
        Returns:
            Dict com resposta da API
        """
        if not self.ensure_token():
            raise Exception("Falha na autenticação")
        
        endpoint = f"/api/{self.session_name}/webhook"
        data = {
            "webhook": webhook_url,
            "enabled": True
        }
        
        return self._make_request('POST', endpoint, data)
    
    def _format_phone(self, phone: str) -> str:
        """
        Formata número de telefone para o padrão do WhatsApp
        
        Args:
            phone: Número original
        
        Returns:
            Número formatado
        """
        # Remove caracteres não numéricos
        phone = ''.join(filter(str.isdigit, phone))
        
        # Se não tem código do país, adiciona 55 (Brasil)
        if len(phone) == 11 and phone.startswith('11'):
            phone = '55' + phone
        elif len(phone) == 10:
            phone = '5511' + phone
        elif len(phone) == 9:
            phone = '55119' + phone
        
        # Adiciona @c.us se não tiver
        if not phone.endswith('@c.us'):
            phone = phone + '@c.us'
        
        return phone
    
    def is_connected(self) -> bool:
        """Verifica se a sessão está conectada"""
        try:
            status = self.get_session_status()
            return status.get('status') == 'inChat' or status.get('connected', False)
        except:
            return False
    
    def get_connection_info(self) -> Dict:
        """Obtém informações da conexão"""
        try:
            status = self.get_session_status()
            return {
                "connected": self.is_connected(),
                "status": status.get('status', 'unknown'),
                "session": self.session_name,
                "phone": status.get('phone', 'N/A'),
                "battery": status.get('battery', 'N/A')
            }
        except Exception as e:
            return {
                "connected": False,
                "error": str(e),
                "session": self.session_name
            }
    
    def logout(self) -> Dict:
        """Faz logout da sessão"""
        if not self.ensure_token():
            raise Exception("Falha na autenticação")
        
        endpoint = f"/api/{self.session_name}/logout-session"
        return self._make_request('POST', endpoint)
    
    def close_session(self) -> Dict:
        """Fecha a sessão"""
        if not self.ensure_token():
            raise Exception("Falha na autenticação")
        
        endpoint = f"/api/{self.session_name}/close-session"
        return self._make_request('POST', endpoint)

# Instância global do serviço
wppconnect_service = WPPConnectService()

