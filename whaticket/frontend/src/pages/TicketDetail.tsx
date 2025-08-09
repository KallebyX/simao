import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSocket } from '@/hooks/useSocket';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Badge from '@/components/ui/Badge';
import Avatar from '@/components/ui/Avatar';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import { Ticket, Message } from '@/types';
import {
  ArrowLeftIcon,
  PaperAirplaneIcon,
  PaperClipIcon,
  PhoneIcon,
  UserIcon,
  ClockIcon,
  ChatBubbleLeftRightIcon
} from '@heroicons/react/24/outline';

const TicketDetail = () => {
  const { ticketId } = useParams<{ ticketId: string }>();
  const navigate = useNavigate();
  const { joinTicketRoom, leaveTicketRoom, onMessageReceived, emit } = useSocket();
  
  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [messageText, setMessageText] = useState('');
  const [sending, setSending] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load ticket data
  useEffect(() => {
    const loadTicket = async () => {
      if (!ticketId) return;
      
      setLoading(true);
      
      // Simulate API call - replace with real API
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const mockTicket: Ticket = {
        id: parseInt(ticketId),
        status: 'open',
        lastMessage: 'Olá, preciso de ajuda com meu pedido',
        contactId: 1,
        userId: 1,
        whatsappId: 1,
        companyId: 1,
        queueId: 1,
        isGroup: false,
        unreadMessages: 0,
        createdAt: '2024-01-08T10:30:00Z',
        updatedAt: '2024-01-08T10:35:00Z',
        contact: {
          id: 1,
          name: 'João Silva',
          number: '5511999999999',
          isGroup: false,
          companyId: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        user: {
          id: 1,
          name: 'Maria Santos',
          email: 'maria@example.com',
          profile: 'user',
          companyId: 1,
          queues: [],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        queue: {
          id: 1,
          name: 'Suporte',
          color: '#3B82F6',
          companyId: 1,
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        }
      };

      const mockMessages: Message[] = [
        {
          id: '1',
          ticketId: parseInt(ticketId),
          contactId: 1,
          body: 'Olá, preciso de ajuda com meu pedido',
          fromMe: false,
          read: true,
          ack: 3,
          createdAt: '2024-01-08T10:30:00Z',
          updatedAt: '2024-01-08T10:30:00Z'
        },
        {
          id: '2',
          ticketId: parseInt(ticketId),
          contactId: 1,
          body: 'Olá! Como posso ajudá-lo?',
          fromMe: true,
          read: true,
          ack: 3,
          createdAt: '2024-01-08T10:31:00Z',
          updatedAt: '2024-01-08T10:31:00Z'
        },
        {
          id: '3',
          ticketId: parseInt(ticketId),
          contactId: 1,
          body: 'Fiz um pedido há 3 dias e ainda não recebi o código de rastreamento',
          fromMe: false,
          read: true,
          ack: 3,
          createdAt: '2024-01-08T10:32:00Z',
          updatedAt: '2024-01-08T10:32:00Z'
        },
        {
          id: '4',
          ticketId: parseInt(ticketId),
          contactId: 1,
          body: 'Entendo sua preocupação. Vou verificar o status do seu pedido. Pode me informar o número do pedido?',
          fromMe: true,
          read: true,
          ack: 3,
          createdAt: '2024-01-08T10:33:00Z',
          updatedAt: '2024-01-08T10:33:00Z'
        }
      ];
      
      setTicket(mockTicket);
      setMessages(mockMessages);
      setLoading(false);
    };

    loadTicket();
  }, [ticketId]);

  // Join ticket room for real-time updates
  useEffect(() => {
    if (ticketId) {
      joinTicketRoom(parseInt(ticketId));
      
      return () => {
        leaveTicketRoom(parseInt(ticketId));
      };
    }
  }, [ticketId, joinTicketRoom, leaveTicketRoom]);

  // Listen for new messages
  useEffect(() => {
    const handleNewMessage = (data: any) => {
      if (data.message && data.message.ticketId === parseInt(ticketId!)) {
        setMessages(prev => [...prev, data.message]);
      }
    };

    onMessageReceived(handleNewMessage);
  }, [ticketId, onMessageReceived]);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!messageText.trim() || sending) return;

    setSending(true);
    
    // Simulate sending message
    const newMessage: Message = {
      id: Date.now().toString(),
      ticketId: parseInt(ticketId!),
      contactId: ticket!.contactId,
      body: messageText,
      fromMe: true,
      read: false,
      ack: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Add message optimistically
    setMessages(prev => [...prev, newMessage]);
    setMessageText('');

    try {
      // Emit message via socket
      emit('sendMessage', {
        ticketId: parseInt(ticketId!),
        body: messageText
      });

      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Update message status
      setMessages(prev => 
        prev.map(msg => 
          msg.id === newMessage.id 
            ? { ...msg, ack: 3, read: true }
            : msg
        )
      );
    } catch (error) {
      // Remove message on error
      setMessages(prev => prev.filter(msg => msg.id !== newMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
  };

  const handleStatusChange = (status: string) => {
    if (ticket) {
      setTicket({ ...ticket, status: status as any });
      // Emit status change via socket
      emit('updateTicket', {
        ticketId: ticket.id,
        status
      });
    }
  };

  const formatMessageTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('pt-BR', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <Badge variant="success">Aberto</Badge>;
      case 'pending':
        return <Badge variant="warning">Pendente</Badge>;
      case 'closed':
        return <Badge variant="default">Fechado</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!ticket) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Ticket não encontrado</p>
        <Button
          className="mt-4"
          onClick={() => navigate('/tickets')}
          leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
        >
          Voltar aos Tickets
        </Button>
      </div>
    );
  }

  return (
    <div className="flex h-[calc(100vh-8rem)]">
      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/tickets')}
                leftIcon={<ArrowLeftIcon className="w-4 h-4" />}
              >
                Voltar
              </Button>
              
              <Avatar
                name={ticket.contact?.name}
                size="md"
                online={ticket.status === 'open'}
              />
              
              <div>
                <h2 className="text-lg font-semibold text-gray-900">
                  {ticket.contact?.name}
                </h2>
                <p className="text-sm text-gray-500">
                  {ticket.contact?.number}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              {getStatusBadge(ticket.status)}
              
              <Button
                variant="outline"
                size="sm"
                leftIcon={<PhoneIcon className="w-4 h-4" />}
              >
                Ligar
              </Button>
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.fromMe ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-3 rounded-lg shadow-sm ${
                  message.fromMe
                    ? 'bg-sky-600 text-white ml-12'
                    : 'bg-white text-gray-900 mr-12 border border-gray-200'
                }`}
              >
                <p className="text-sm">{message.body}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className={`text-xs ${
                    message.fromMe ? 'text-sky-100' : 'text-gray-500'
                  }`}>
                    {formatMessageTime(message.createdAt)}
                  </span>
                  
                  {message.fromMe && (
                    <div className="flex items-center space-x-1">
                      {message.ack === 0 && (
                        <ClockIcon className="w-3 h-3 text-sky-200" />
                      )}
                      {message.ack === 1 && (
                        <div className="w-3 h-3 rounded-full bg-sky-300" />
                      )}
                      {message.ack === 2 && (
                        <div className="flex space-x-0.5">
                          <div className="w-3 h-3 rounded-full bg-sky-300" />
                          <div className="w-3 h-3 rounded-full bg-sky-300" />
                        </div>
                      )}
                      {message.ack === 3 && (
                        <div className="flex space-x-0.5">
                          <div className="w-3 h-3 rounded-full bg-emerald-300" />
                          <div className="w-3 h-3 rounded-full bg-emerald-300" />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Message Input */}
        <div className="bg-white border-t border-gray-200 p-4">
          <form onSubmit={handleSendMessage} className="flex items-end space-x-3">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleFileUpload}
              leftIcon={<PaperClipIcon className="w-4 h-4" />}
            />
            
            <div className="flex-1">
              <Input
                placeholder="Digite sua mensagem..."
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage(e);
                  }
                }}
              />
            </div>
            
            <Button
              type="submit"
              disabled={!messageText.trim() || sending}
              loading={sending}
              leftIcon={<PaperAirplaneIcon className="w-4 h-4" />}
            >
              Enviar
            </Button>
          </form>
          
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            accept="image/*,video/*,audio/*,.pdf,.doc,.docx"
            onChange={(e) => {
              // Handle file upload
              const file = e.target.files?.[0];
              if (file) {
                console.log('File selected:', file.name);
                // Implement file upload logic
              }
            }}
          />
        </div>
      </div>

      {/* Sidebar */}
      <div className="w-80 bg-white border-l border-gray-200">
        <div className="p-6 space-y-6">
          {/* Contact Info */}
          <Card title="Informações do Contato">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Nome:</span>
                <span className="text-sm font-medium">{ticket.contact?.name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Telefone:</span>
                <span className="text-sm font-medium">{ticket.contact?.number}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Ticket ID:</span>
                <span className="text-sm font-medium">#{ticket.id}</span>
              </div>
            </div>
          </Card>

          {/* Ticket Details */}
          <Card title="Detalhes do Ticket">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Status:</span>
                <div className="flex items-center space-x-2">
                  {getStatusBadge(ticket.status)}
                </div>
              </div>
              
              {ticket.queue && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Fila:</span>
                  <div className="flex items-center space-x-1">
                    <div 
                      className="w-2 h-2 rounded-full"
                      style={{ backgroundColor: ticket.queue.color }}
                    />
                    <span className="text-sm font-medium">{ticket.queue.name}</span>
                  </div>
                </div>
              )}
              
              {ticket.user && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Atendente:</span>
                  <div className="flex items-center space-x-1">
                    <UserIcon className="w-3 h-3" />
                    <span className="text-sm font-medium">{ticket.user.name}</span>
                  </div>
                </div>
              )}
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Criado em:</span>
                <span className="text-sm font-medium">
                  {new Date(ticket.createdAt).toLocaleDateString('pt-BR')}
                </span>
              </div>
            </div>
          </Card>

          {/* Actions */}
          <Card title="Ações">
            <div className="space-y-3">
              <Button
                fullWidth
                variant={ticket.status === 'open' ? 'warning' : 'success'}
                size="sm"
                onClick={() => handleStatusChange(ticket.status === 'open' ? 'pending' : 'open')}
              >
                {ticket.status === 'open' ? 'Colocar em Espera' : 'Reabrir Ticket'}
              </Button>
              
              <Button
                fullWidth
                variant="secondary"
                size="sm"
                onClick={() => handleStatusChange('closed')}
                disabled={ticket.status === 'closed'}
              >
                Fechar Ticket
              </Button>
              
              <Button
                fullWidth
                variant="outline"
                size="sm"
                leftIcon={<ChatBubbleLeftRightIcon className="w-4 h-4" />}
              >
                Transferir
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default TicketDetail;