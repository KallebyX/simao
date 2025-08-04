# 📡 API Reference

Documentação completa das APIs REST e WebSocket do sistema Whaticket, incluindo endpoints, parâmetros, exemplos e códigos de resposta.

## 🚀 Visão Geral

### Base URLs

| Ambiente | URL Base | Descrição |
|----------|----------|-----------|
| **Desenvolvimento** | `http://localhost:8080` | Ambiente local |
| **Produção** | `https://seudominio.com` | Ambiente de produção |
| **Staging** | `https://staging.seudominio.com` | Ambiente de testes |

### Autenticação

Todas as APIs protegidas requerem autenticação via JWT token no header:

```http
Authorization: Bearer {jwt_token}
```

### Rate Limiting

| Endpoint Type | Limite | Janela |
|---------------|--------|--------|
| **Geral** | 100 req | 15 min |
| **Auth** | 5 req | 15 min |
| **API** | 60 req | 1 min |

### Códigos de Status HTTP

| Código | Significado | Descrição |
|--------|-------------|-----------|
| **200** | OK | Sucesso |
| **201** | Created | Recurso criado |
| **400** | Bad Request | Dados inválidos |
| **401** | Unauthorized | Token inválido/ausente |
| **403** | Forbidden | Permissões insuficientes |
| **404** | Not Found | Recurso não encontrado |
| **429** | Too Many Requests | Rate limit excedido |
| **500** | Internal Server Error | Erro interno |

## 🔐 Autenticação

### POST /api/auth/login

Autenticar usuário e obter token JWT.

#### Request

```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "admin@empresa.com",
  "password": "senha123"
}
```

#### Response - Sucesso (200)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "name": "Admin",
    "email": "admin@empresa.com",
    "profile": "admin",
    "companyId": 1,
    "queues": [
      {
        "id": 1,
        "name": "Suporte",
        "color": "#3b82f6"
      }
    ]
  }
}
```

#### Response - Erro (401)

```json
{
  "error": "Invalid credentials"
}
```

### POST /api/auth/refresh

Renovar token JWT usando refresh token.

#### Request

```http
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

#### Response - Sucesso (200)

```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### POST /api/auth/logout

Invalidar token atual.

#### Request

```http
POST /api/auth/logout
Authorization: Bearer {token}
```

#### Response - Sucesso (200)

```json
{
  "message": "Logged out successfully"
}
```

## 👥 Usuários

### GET /api/users

Listar usuários da empresa.

#### Query Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `pageNumber` | number | Página (padrão: 1) |
| `searchParam` | string | Busca por nome/email |
| `profile` | string | Filtrar por perfil |

#### Request

```http
GET /api/users?pageNumber=1&searchParam=admin&profile=admin
Authorization: Bearer {token}
```

#### Response - Sucesso (200)

```json
{
  "users": [
    {
      "id": 1,
      "name": "Admin User",
      "email": "admin@empresa.com",
      "profile": "admin",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "queues": [
        {
          "id": 1,
          "name": "Suporte",
          "color": "#3b82f6"
        }
      ]
    }
  ],
  "count": 1,
  "hasMore": false
}
```

### POST /api/users

Criar novo usuário.

#### Request

```http
POST /api/users
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Novo Usuario",
  "email": "usuario@empresa.com",
  "password": "senha123",
  "profile": "user",
  "queueIds": [1, 2]
}
```

#### Response - Sucesso (201)

```json
{
  "id": 2,
  "name": "Novo Usuario",
  "email": "usuario@empresa.com",
  "profile": "user",
  "companyId": 1,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

### PUT /api/users/:userId

Atualizar usuário existente.

#### Request

```http
PUT /api/users/2
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Usuario Atualizado",
  "email": "usuario.novo@empresa.com",
  "profile": "admin",
  "queueIds": [1, 2, 3]
}
```

#### Response - Sucesso (200)

```json
{
  "id": 2,
  "name": "Usuario Atualizado",
  "email": "usuario.novo@empresa.com",
  "profile": "admin",
  "companyId": 1,
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

### DELETE /api/users/:userId

Excluir usuário.

#### Request

```http
DELETE /api/users/2
Authorization: Bearer {token}
```

#### Response - Sucesso (200)

```json
{
  "message": "User deleted successfully"
}
```

## 🎫 Tickets

### GET /api/tickets

Listar tickets da empresa.

#### Query Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `pageNumber` | number | Página (padrão: 1) |
| `status` | string | open, pending, closed |
| `searchParam` | string | Busca por contato/mensagem |
| `contactId` | number | Filtrar por contato |
| `userId` | number | Filtrar por usuário |
| `queueId` | number | Filtrar por fila |
| `showAll` | boolean | Mostrar todos os tickets |
| `date` | string | Filtrar por data (YYYY-MM-DD) |
| `startDate` | string | Data inicial |
| `endDate` | string | Data final |
| `tags` | string | IDs das tags separados por vírgula |

#### Request

```http
GET /api/tickets?status=open&queueId=1&pageNumber=1
Authorization: Bearer {token}
```

#### Response - Sucesso (200)

```json
{
  "tickets": [
    {
      "id": 1,
      "uuid": "550e8400-e29b-41d4-a716-446655440000",
      "status": "open",
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:30:00.000Z",
      "lastMessage": "Preciso de ajuda com meu pedido",
      "contact": {
        "id": 1,
        "name": "João Silva",
        "number": "5511999999999",
        "profilePicUrl": "https://example.com/pic.jpg"
      },
      "user": {
        "id": 1,
        "name": "Atendente"
      },
      "queue": {
        "id": 1,
        "name": "Suporte",
        "color": "#3b82f6"
      },
      "whatsapp": {
        "id": 1,
        "name": "WhatsApp Principal",
        "status": "CONNECTED"
      },
      "tags": [
        {
          "id": 1,
          "name": "Urgente",
          "color": "#ef4444"
        }
      ]
    }
  ],
  "count": 1,
  "hasMore": false
}
```

### GET /api/tickets/:ticketId

Obter detalhes de um ticket específico.

#### Request

```http
GET /api/tickets/1
Authorization: Bearer {token}
```

#### Response - Sucesso (200)

```json
{
  "id": 1,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "open",
  "createdAt": "2024-01-01T10:00:00.000Z",
  "updatedAt": "2024-01-01T10:30:00.000Z",
  "contact": {
    "id": 1,
    "name": "João Silva",
    "number": "5511999999999",
    "email": "joao@email.com",
    "profilePicUrl": "https://example.com/pic.jpg",
    "extraInfo": [
      {
        "name": "CPF",
        "value": "123.456.789-00"
      }
    ]
  },
  "user": {
    "id": 1,
    "name": "Atendente",
    "email": "atendente@empresa.com"
  },
  "queue": {
    "id": 1,
    "name": "Suporte",
    "color": "#3b82f6"
  },
  "whatsapp": {
    "id": 1,
    "name": "WhatsApp Principal",
    "status": "CONNECTED"
  },
  "tags": [
    {
      "id": 1,
      "name": "Urgente",
      "color": "#ef4444"
    }
  ],
  "chatbot": {
    "id": 1,
    "name": "Bot de Suporte"
  }
}
```

### POST /api/tickets

Criar novo ticket.

#### Request

```http
POST /api/tickets
Authorization: Bearer {token}
Content-Type: application/json

{
  "contactId": 1,
  "queueId": 1,
  "userId": 1,
  "status": "open"
}
```

#### Response - Sucesso (201)

```json
{
  "id": 2,
  "uuid": "550e8400-e29b-41d4-a716-446655440001",
  "status": "open",
  "contactId": 1,
  "queueId": 1,
  "userId": 1,
  "companyId": 1,
  "createdAt": "2024-01-01T11:00:00.000Z",
  "updatedAt": "2024-01-01T11:00:00.000Z"
}
```

### PUT /api/tickets/:ticketId

Atualizar ticket.

#### Request

```http
PUT /api/tickets/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "status": "closed",
  "queueId": 2,
  "userId": 2
}
```

#### Response - Sucesso (200)

```json
{
  "id": 1,
  "uuid": "550e8400-e29b-41d4-a716-446655440000",
  "status": "closed",
  "queueId": 2,
  "userId": 2,
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

## 💬 Mensagens

### GET /api/messages/:ticketId

Listar mensagens de um ticket.

#### Query Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `pageNumber` | number | Página (padrão: 1) |

#### Request

```http
GET /api/messages/1?pageNumber=1
Authorization: Bearer {token}
```

#### Response - Sucesso (200)

```json
{
  "messages": [
    {
      "id": 1,
      "body": "Olá, preciso de ajuda",
      "ack": 2,
      "read": true,
      "mediaType": "text",
      "mediaUrl": null,
      "timestamp": 1704096000,
      "fromMe": false,
      "quotedMsg": null,
      "createdAt": "2024-01-01T10:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z",
      "ticketId": 1,
      "contactId": 1,
      "userId": null,
      "contact": {
        "id": 1,
        "name": "João Silva",
        "number": "5511999999999"
      }
    },
    {
      "id": 2,
      "body": "Olá! Como posso ajudá-lo?",
      "ack": 2,
      "read": true,
      "mediaType": "text",
      "mediaUrl": null,
      "timestamp": 1704096060,
      "fromMe": true,
      "quotedMsg": null,
      "createdAt": "2024-01-01T10:01:00.000Z",
      "updatedAt": "2024-01-01T10:01:00.000Z",
      "ticketId": 1,
      "contactId": 1,
      "userId": 1,
      "user": {
        "id": 1,
        "name": "Atendente"
      }
    }
  ],
  "count": 2,
  "hasMore": false
}
```

### POST /api/messages/:ticketId

Enviar mensagem em um ticket.

#### Request - Mensagem de Texto

```http
POST /api/messages/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "body": "Mensagem de resposta",
  "quotedMsg": {
    "id": 1,
    "body": "Mensagem original citada"
  }
}
```

#### Request - Mensagem com Mídia

```http
POST /api/messages/1
Authorization: Bearer {token}
Content-Type: multipart/form-data

{
  "body": "Aqui está o documento solicitado",
  "medias": [file]
}
```

#### Response - Sucesso (201)

```json
{
  "id": 3,
  "body": "Mensagem de resposta",
  "ack": 0,
  "read": false,
  "mediaType": "text",
  "mediaUrl": null,
  "timestamp": 1704096120,
  "fromMe": true,
  "quotedMsg": {
    "id": 1,
    "body": "Mensagem original citada"
  },
  "ticketId": 1,
  "contactId": 1,
  "userId": 1,
  "createdAt": "2024-01-01T10:02:00.000Z",
  "updatedAt": "2024-01-01T10:02:00.000Z"
}
```

## 👤 Contatos

### GET /api/contacts

Listar contatos da empresa.

#### Query Parameters

| Parâmetro | Tipo | Descrição |
|-----------|------|-----------|
| `pageNumber` | number | Página (padrão: 1) |
| `searchParam` | string | Busca por nome/número |

#### Request

```http
GET /api/contacts?searchParam=João&pageNumber=1
Authorization: Bearer {token}
```

#### Response - Sucesso (200)

```json
{
  "contacts": [
    {
      "id": 1,
      "name": "João Silva",
      "number": "5511999999999",
      "email": "joao@email.com",
      "profilePicUrl": "https://example.com/pic.jpg",
      "isGroup": false,
      "createdAt": "2024-01-01T09:00:00.000Z",
      "updatedAt": "2024-01-01T09:00:00.000Z",
      "extraInfo": [
        {
          "name": "CPF",
          "value": "123.456.789-00"
        },
        {
          "name": "Endereço",
          "value": "Rua das Flores, 123"
        }
      ],
      "tags": [
        {
          "id": 1,
          "name": "VIP",
          "color": "#fbbf24"
        }
      ]
    }
  ],
  "count": 1,
  "hasMore": false
}
```

### POST /api/contacts

Criar novo contato.

#### Request

```http
POST /api/contacts
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "Maria Santos",
  "number": "5511888888888",
  "email": "maria@email.com",
  "extraInfo": [
    {
      "name": "CPF",
      "value": "987.654.321-00"
    }
  ]
}
```

#### Response - Sucesso (201)

```json
{
  "id": 2,
  "name": "Maria Santos",
  "number": "5511888888888",
  "email": "maria@email.com",
  "profilePicUrl": null,
  "isGroup": false,
  "companyId": 1,
  "createdAt": "2024-01-01T11:00:00.000Z",
  "updatedAt": "2024-01-01T11:00:00.000Z",
  "extraInfo": [
    {
      "name": "CPF",
      "value": "987.654.321-00"
    }
  ]
}
```

### PUT /api/contacts/:contactId

Atualizar contato.

#### Request

```http
PUT /api/contacts/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "João Silva Santos",
  "email": "joao.santos@email.com",
  "extraInfo": [
    {
      "name": "CPF",
      "value": "123.456.789-00"
    },
    {
      "name": "Telefone Secundário",
      "value": "5511777777777"
    }
  ]
}
```

#### Response - Sucesso (200)

```json
{
  "id": 1,
  "name": "João Silva Santos",
  "number": "5511999999999",
  "email": "joao.santos@email.com",
  "profilePicUrl": "https://example.com/pic.jpg",
  "isGroup": false,
  "updatedAt": "2024-01-01T12:00:00.000Z",
  "extraInfo": [
    {
      "name": "CPF",
      "value": "123.456.789-00"
    },
    {
      "name": "Telefone Secundário",
      "value": "5511777777777"
    }
  ]
}
```

## 📞 WhatsApp Connections

### GET /api/whatsapps

Listar conexões WhatsApp da empresa.

#### Request

```http
GET /api/whatsapps
Authorization: Bearer {token}
```

#### Response - Sucesso (200)

```json
{
  "whatsapps": [
    {
      "id": 1,
      "name": "WhatsApp Principal",
      "status": "CONNECTED",
      "qrcode": null,
      "retries": 0,
      "isDefault": true,
      "createdAt": "2024-01-01T08:00:00.000Z",
      "updatedAt": "2024-01-01T10:00:00.000Z",
      "queues": [
        {
          "id": 1,
          "name": "Suporte",
          "color": "#3b82f6"
        }
      ]
    },
    {
      "id": 2,
      "name": "WhatsApp Vendas",
      "status": "DISCONNECTED",
      "qrcode": "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...",
      "retries": 2,
      "isDefault": false,
      "createdAt": "2024-01-01T08:30:00.000Z",
      "updatedAt": "2024-01-01T10:30:00.000Z",
      "queues": [
        {
          "id": 2,
          "name": "Vendas",
          "color": "#10b981"
        }
      ]
    }
  ]
}
```

### POST /api/whatsapps

Criar nova conexão WhatsApp.

#### Request

```http
POST /api/whatsapps
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "WhatsApp Marketing",
  "queueIds": [3],
  "isDefault": false
}
```

#### Response - Sucesso (201)

```json
{
  "id": 3,
  "name": "WhatsApp Marketing",
  "status": "OPENING",
  "qrcode": null,
  "retries": 0,
  "isDefault": false,
  "companyId": 1,
  "createdAt": "2024-01-01T11:00:00.000Z",
  "updatedAt": "2024-01-01T11:00:00.000Z"
}
```

### PUT /api/whatsapps/:whatsappId

Atualizar conexão WhatsApp.

#### Request

```http
PUT /api/whatsapps/1
Authorization: Bearer {token}
Content-Type: application/json

{
  "name": "WhatsApp Principal Atualizado",
  "queueIds": [1, 2],
  "isDefault": true
}
```

#### Response - Sucesso (200)

```json
{
  "id": 1,
  "name": "WhatsApp Principal Atualizado",
  "status": "CONNECTED",
  "qrcode": null,
  "retries": 0,
  "isDefault": true,
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

### DELETE /api/whatsapps/:whatsappId

Remover conexão WhatsApp.

#### Request

```http
DELETE /api/whatsapps/3
Authorization: Bearer {token}
```

#### Response - Sucesso (200)

```json
{
  "message": "WhatsApp connection deleted successfully"
}
```

## 🏢 Empresas (Super Admin)

### GET /api/companies

Listar todas as empresas (apenas super admin).

#### Request

```http
GET /api/companies
Authorization: Bearer {super_admin_token}
```

#### Response - Sucesso (200)

```json
{
  "companies": [
    {
      "id": 1,
      "name": "Empresa Demo",
      "status": true,
      "planId": 1,
      "dueDate": "2024-12-31T23:59:59.000Z",
      "recurrence": "MONTHLY",
      "createdAt": "2024-01-01T00:00:00.000Z",
      "updatedAt": "2024-01-01T00:00:00.000Z",
      "plan": {
        "id": 1,
        "name": "Plano Básico",
        "users": 5,
        "connections": 2,
        "queues": 3,
        "value": 99.90
      }
    }
  ]
}
```

### POST /api/companies

Criar nova empresa (apenas super admin).

#### Request

```http
POST /api/companies
Authorization: Bearer {super_admin_token}
Content-Type: application/json

{
  "name": "Nova Empresa",
  "email": "contato@novaempresa.com",
  "phone": "11999999999",
  "planId": 1,
  "dueDate": "2024-12-31",
  "recurrence": "MONTHLY"
}
```

#### Response - Sucesso (201)

```json
{
  "id": 2,
  "name": "Nova Empresa",
  "email": "contato@novaempresa.com",
  "phone": "11999999999",
  "status": true,
  "planId": 1,
  "dueDate": "2024-12-31T23:59:59.000Z",
  "recurrence": "MONTHLY",
  "createdAt": "2024-01-01T11:00:00.000Z",
  "updatedAt": "2024-01-01T11:00:00.000Z"
}
```

## 🔄 WebSocket Events

O sistema utiliza Socket.IO para comunicação em tempo real. Conecte-se em:

```javascript
const socket = io('http://localhost:8080', {
  auth: {
    token: 'jwt_token_here'
  }
});
```

### Eventos de Ticket

#### ticket

Atualização de ticket.

```javascript
socket.on('ticket', (data) => {
  console.log('Ticket atualizado:', data);
  // data: { action: 'update', ticket: { id, status, ... } }
});
```

#### ticket:update

Ticket específico atualizado.

```javascript
socket.on('ticket:update', (data) => {
  console.log('Ticket específico:', data);
  // data: { ticketId: 1, ticket: { ... } }
});
```

### Eventos de Mensagem

#### appMessage

Nova mensagem recebida.

```javascript
socket.on('appMessage', (data) => {
  console.log('Nova mensagem:', data);
  // data: { action: 'create', message: { id, body, ... } }
});
```

#### message:ack

Confirmação de entrega de mensagem.

```javascript
socket.on('message:ack', (data) => {
  console.log('ACK da mensagem:', data);
  // data: { messageId: 1, ack: 2 }
});
```

### Eventos de Contato

#### contact

Atualização de contato.

```javascript
socket.on('contact', (data) => {
  console.log('Contato atualizado:', data);
  // data: { action: 'update', contact: { id, name, ... } }
});
```

### Eventos de WhatsApp

#### whatsappSession

Status da sessão WhatsApp.

```javascript
socket.on('whatsappSession', (data) => {
  console.log('Status WhatsApp:', data);
  // data: { action: 'update', session: { id, status, qrcode } }
});
```

## 📝 Exemplos de Uso

### Cliente JavaScript

```javascript
class WhatiticketAPI {
  constructor(baseURL, token) {
    this.baseURL = baseURL;
    this.token = token;
  }

  async request(method, endpoint, data = null) {
    const config = {
      method,
      headers: {
        'Authorization': `Bearer ${this.token}`,
        'Content-Type': 'application/json'
      }
    };

    if (data && method !== 'GET') {
      config.body = JSON.stringify(data);
    }

    const response = await fetch(`${this.baseURL}${endpoint}`, config);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  // Métodos de conveniência
  async getTickets(filters = {}) {
    const params = new URLSearchParams(filters);
    return this.request('GET', `/api/tickets?${params}`);
  }

  async sendMessage(ticketId, body, quotedMsg = null) {
    return this.request('POST', `/api/messages/${ticketId}`, {
      body,
      quotedMsg
    });
  }

  async createContact(contactData) {
    return this.request('POST', '/api/contacts', contactData);
  }
}

// Uso
const api = new WhatiticketAPI('http://localhost:8080', 'seu_token_jwt');

// Buscar tickets abertos
const openTickets = await api.getTickets({ status: 'open' });

// Enviar mensagem
await api.sendMessage(1, 'Olá! Como posso ajudá-lo?');

// Criar contato
const newContact = await api.createContact({
  name: 'João Silva',
  number: '5511999999999',
  email: 'joao@email.com'
});
```

### Cliente Python

```python
import requests
import json

class WhatiticketAPI:
    def __init__(self, base_url, token):
        self.base_url = base_url
        self.headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }

    def request(self, method, endpoint, data=None):
        url = f'{self.base_url}{endpoint}'
        
        if method == 'GET':
            response = requests.get(url, headers=self.headers, params=data)
        elif method == 'POST':
            response = requests.post(url, headers=self.headers, json=data)
        elif method == 'PUT':
            response = requests.put(url, headers=self.headers, json=data)
        elif method == 'DELETE':
            response = requests.delete(url, headers=self.headers)
        
        response.raise_for_status()
        return response.json()

    def get_tickets(self, **filters):
        return self.request('GET', '/api/tickets', filters)

    def send_message(self, ticket_id, body, quoted_msg=None):
        data = {'body': body}
        if quoted_msg:
            data['quotedMsg'] = quoted_msg
        return self.request('POST', f'/api/messages/{ticket_id}', data)

    def create_contact(self, contact_data):
        return self.request('POST', '/api/contacts', contact_data)

# Uso
api = WhatiticketAPI('http://localhost:8080', 'seu_token_jwt')

# Buscar tickets abertos
open_tickets = api.get_tickets(status='open')

# Enviar mensagem
api.send_message(1, 'Olá! Como posso ajudá-lo?')

# Criar contato
new_contact = api.create_contact({
    'name': 'João Silva',
    'number': '5511999999999',
    'email': 'joao@email.com'
})
```

## 🔍 Códigos de Erro Detalhados

### Erros de Autenticação (401)

| Código | Mensagem | Solução |
|--------|----------|---------|
| `AUTH_TOKEN_MISSING` | Token de autenticação não fornecido | Incluir header Authorization |
| `AUTH_TOKEN_INVALID` | Token inválido ou expirado | Renovar token via /auth/refresh |
| `AUTH_TOKEN_EXPIRED` | Token expirado | Fazer novo login ou refresh |

### Erros de Validação (400)

| Código | Mensagem | Solução |
|--------|----------|---------|
| `VALIDATION_ERROR` | Dados de entrada inválidos | Verificar campos obrigatórios |
| `INVALID_EMAIL` | Email inválido | Fornecer email válido |
| `INVALID_PHONE` | Número de telefone inválido | Fornecer número no formato correto |
| `DUPLICATE_EMAIL` | Email já cadastrado | Usar email único |

### Erros de Permissão (403)

| Código | Mensagem | Solução |
|--------|----------|---------|
| `INSUFFICIENT_PERMISSIONS` | Permissões insuficientes | Verificar perfil do usuário |
| `COMPANY_LIMIT_EXCEEDED` | Limite da empresa excedido | Upgrade do plano |
| `FEATURE_NOT_AVAILABLE` | Funcionalidade não disponível | Verificar plano da empresa |

### Erros de Recurso (404)

| Código | Mensagem | Solução |
|--------|----------|---------|
| `TICKET_NOT_FOUND` | Ticket não encontrado | Verificar ID do ticket |
| `CONTACT_NOT_FOUND` | Contato não encontrado | Verificar ID do contato |
| `USER_NOT_FOUND` | Usuário não encontrado | Verificar ID do usuário |
| `WHATSAPP_NOT_FOUND` | WhatsApp não encontrado | Verificar ID da conexão |

## 📚 Links Úteis

- [**Postman Collection**](postman-collection.json) - Coleção completa de endpoints
- [**OpenAPI Spec**](openapi.yaml) - Especificação OpenAPI 3.0
- [**WebSocket Examples**](websocket-examples.md) - Exemplos de uso do Socket.IO
- [**Rate Limiting Guide**](rate-limiting.md) - Guia sobre limites de requisições

---

*Esta documentação é gerada automaticamente e mantida atualizada com a versão mais recente da API.*